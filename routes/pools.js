const express = require('express');
const crypto = require('crypto');
const { col } = require('../lib/db');
const { auth, userFromToken, users } = require('../lib/auth');
const mailer = require('../lib/mailer');

const router = express.Router();
const pools = col('pools');

// ---------- helpers ----------
const clean = (s, max = 200) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMulti = (s, max = 2000) => String(s ?? '').replace(/\r/g, '').trim().slice(0, max);
const uid = () => crypto.randomUUID();
const userById = (id) => users.rows.find((u) => u.id === id);
const totalQty = (p) => p.members.reduce((a, m) => a + m.quantity, 0);
const isMember = (p, id) => p.members.some((m) => m.userId === id);
const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const money = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do c = Array.from(crypto.randomBytes(6), (b) => A[b % A.length]).join('');
  while (pools.rows.some((p) => p.code === c));
  return c;
}

function sys(pool, text, type = 'system', extra = {}) {
  pool.messages.push({ id: uid(), type, text, at: new Date().toISOString(), ...extra });
}

function summary(p, viewerId) {
  const creator = userById(p.creatorId) || {};
  return {
    id: p.id, code: p.code, name: p.name, crop: p.crop, variety: p.variety, harvestDate: p.harvestDate,
    state: p.state, district: p.district, description: p.description, visibility: p.visibility, status: p.status,
    totalQuantity: totalQty(p), memberCount: p.members.length, creatorName: creator.name,
    isMember: isMember(p, viewerId), createdAt: p.createdAt,
  };
}

function detail(p) {
  return {
    ...summary(p, null),
    isMember: true,
    creatorId: p.creatorId,
    agreedPrice: p.agreedPrice,
    activeProposalId: p.activeProposalId,
    members: p.members.map((m) => {
      const u = userById(m.userId) || {};
      return { userId: m.userId, name: u.name, state: u.state, village: u.village, phone: u.phone, quantity: m.quantity, joinedAt: m.joinedAt, isCreator: m.userId === p.creatorId };
    }),
    messages: p.messages.map((m) => ({ ...m, name: m.userId ? (userById(m.userId) || {}).name : undefined })),
    emails: p.emails.map(({ messageId, ...e }) => e),
  };
}

// ---------- realtime (SSE) ----------
const streams = new Map(); // poolId -> Set<res>
function broadcast(pool) {
  const set = streams.get(pool.id);
  if (!set) return;
  const payload = `event: pool\ndata: ${JSON.stringify(detail(pool))}\n\n`;
  set.forEach((res) => res.write(payload));
}
setInterval(() => streams.forEach((set) => set.forEach((res) => res.write(': ping\n\n'))), 25_000).unref();

const persist = (pool) => { pools.save(); if (pool) broadcast(pool); };

// ---------- price agreement ----------
function checkProposal(pool) {
  const prop = pool.messages.find((m) => m.id === pool.activeProposalId && m.type === 'proposal' && m.status === 'active');
  if (!prop || !pool.members.length) return;
  if (pool.members.every((m) => prop.votes[m.userId] === true)) {
    prop.status = 'accepted';
    pool.agreedPrice = prop.price;
    pool.activeProposalId = null;
    if (['open', 'negotiating'].includes(pool.status)) pool.status = 'price_agreed';
    sys(pool, `✅ All ${pool.members.length} farmer(s) agreed on ₹${money(prop.price)} per quintal. The coordinator can now send the pool's offer to buyers.`);
  }
}

// ---------- public: invite preview ----------
router.get('/invite/:code', (req, res) => {
  const pool = pools.rows.find((p) => p.code === String(req.params.code).toUpperCase());
  if (!pool) return res.status(404).json({ error: 'This invite link is invalid or the pool no longer exists.' });
  res.json({ pool: summary(pool, null) });
});

// ---------- SSE stream (token via query since EventSource has no headers) ----------
router.get('/pools/:id/stream', (req, res) => {
  const user = userFromToken(String(req.query.token || ''));
  const pool = pools.rows.find((p) => p.id === req.params.id);
  if (!user || !pool || !isMember(pool, user.id)) return res.status(403).end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write(': connected\n\n');
  if (!streams.has(pool.id)) streams.set(pool.id, new Set());
  streams.get(pool.id).add(res);
  req.on('close', () => streams.get(pool.id)?.delete(res));
});

router.use(auth);

router.get('/mail/status', (_req, res) => res.json(mailer.status()));

// ---------- pools CRUD ----------
router.get('/pools', (req, res) => {
  const { scope = 'mine', crop = '', state = '' } = req.query;
  let list = pools.rows;
  if (scope === 'mine') list = list.filter((p) => isMember(p, req.user.id));
  else {
    list = list.filter((p) => p.visibility === 'public' && ['open', 'negotiating'].includes(p.status) && !isMember(p, req.user.id));
    if (crop) list = list.filter((p) => p.crop.toLowerCase().includes(String(crop).toLowerCase()));
    if (state) list = list.filter((p) => p.state === state);
  }
  res.json({ pools: list.map((p) => summary(p, req.user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

router.post('/pools', (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 60), crop = clean(b.crop, 40), state = clean(b.state, 40);
  const qty = Number(b.quantity);
  const hd = new Date(b.harvestDate);
  if (name.length < 3) return res.status(400).json({ error: 'Give your pool a name (min 3 letters).' });
  if (!crop) return res.status(400).json({ error: 'Which crop is this pool for?' });
  if (!(qty > 0 && qty <= 100000)) return res.status(400).json({ error: 'Enter your expected quantity in quintals.' });
  if (isNaN(hd) || hd < Date.now() - 7 * 864e5 || hd > Date.now() + 400 * 864e5) return res.status(400).json({ error: 'Enter a valid expected harvest date.' });
  if (!state) return res.status(400).json({ error: 'Select the state where the crop is grown.' });

  const pool = {
    id: uid(), code: genCode(), name, crop, variety: clean(b.variety, 40), harvestDate: hd.toISOString().slice(0, 10),
    state, district: clean(b.district, 60), description: cleanMulti(b.description, 500),
    visibility: b.visibility === 'private' ? 'private' : 'public', status: 'open',
    creatorId: req.user.id, members: [{ userId: req.user.id, quantity: qty, joinedAt: new Date().toISOString() }],
    messages: [], emails: [], agreedPrice: null, activeProposalId: null, createdAt: new Date().toISOString(),
  };
  sys(pool, `🌱 ${req.user.name} created the pool. Invite fellow farmers using the invite link, then agree on a price here.`);
  pools.rows.push(pool);
  persist();
  res.status(201).json(detail(pool));
});

router.get('/pools/:id', (req, res) => {
  const pool = pools.rows.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found.' });
  if (!isMember(pool, req.user.id)) return res.json({ isMember: false, pool: summary(pool, req.user.id) });
  res.json(detail(pool));
});

function getPool(req, res, { member = true, creator = false } = {}) {
  const pool = pools.rows.find((p) => p.id === req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found.' }), null;
  if (member && !isMember(pool, req.user.id)) return res.status(403).json({ error: 'Only pool members can do this.' }), null;
  if (creator && pool.creatorId !== req.user.id) return res.status(403).json({ error: 'Only the pool coordinator can do this.' }), null;
  return pool;
}

router.post('/pools/:id/join', (req, res) => {
  const pool = getPool(req, res, { member: false });
  if (!pool) return;
  if (isMember(pool, req.user.id)) return res.status(409).json({ error: 'You are already in this pool.' });
  if (!['open', 'negotiating'].includes(pool.status)) return res.status(400).json({ error: 'This pool is no longer accepting new farmers.' });
  if (pool.visibility === 'private' && String(req.body.code || '').toUpperCase() !== pool.code) return res.status(403).json({ error: 'This pool is invite-only. Use the invite link.' });
  if (pool.members.length >= 200) return res.status(400).json({ error: 'This pool is full.' });
  const qty = Number(req.body.quantity);
  if (!(qty > 0 && qty <= 100000)) return res.status(400).json({ error: 'Enter your expected quantity in quintals.' });
  pool.members.push({ userId: req.user.id, quantity: qty, joinedAt: new Date().toISOString() });
  sys(pool, `👋 ${req.user.name} joined with ${qty} quintals. Pool total: ${totalQty(pool)} quintals.`);
  persist(pool);
  res.json(detail(pool));
});

router.post('/pools/:id/leave', (req, res) => {
  const pool = getPool(req, res);
  if (!pool) return;
  if (pool.creatorId === req.user.id) return res.status(400).json({ error: 'The coordinator cannot leave. Close the pool instead.' });
  if (!['open', 'negotiating'].includes(pool.status)) return res.status(400).json({ error: 'You cannot leave after the price is agreed.' });
  pool.members = pool.members.filter((m) => m.userId !== req.user.id);
  sys(pool, `🚪 ${req.user.name} left the pool.`);
  checkProposal(pool);
  persist(pool);
  res.json({ ok: true });
});

router.post('/pools/:id/close', (req, res) => {
  const pool = getPool(req, res, { creator: true });
  if (!pool) return;
  pool.status = 'closed';
  sys(pool, '🔒 The coordinator closed this pool.');
  persist(pool);
  res.json(detail(pool));
});

// ---------- chat + price proposals ----------
function writable(pool, res) {
  if (pool.status === 'closed') return res.status(400).json({ error: 'This pool is closed.' }), false;
  return true;
}

router.post('/pools/:id/messages', (req, res) => {
  const pool = getPool(req, res);
  if (!pool || !writable(pool, res)) return;
  const text = cleanMulti(req.body.text, 1000);
  if (!text) return res.status(400).json({ error: 'Type a message.' });
  pool.messages.push({ id: uid(), type: 'text', userId: req.user.id, text, at: new Date().toISOString() });
  persist(pool);
  res.status(201).json({ ok: true });
});

router.post('/pools/:id/proposals', (req, res) => {
  const pool = getPool(req, res);
  if (!pool || !writable(pool, res)) return;
  const price = Math.round(Number(req.body.price) * 100) / 100;
  if (!(price > 0 && price <= 1000000)) return res.status(400).json({ error: 'Enter a valid price per quintal (₹).' });
  pool.messages.forEach((m) => { if (m.type === 'proposal' && m.status === 'active') m.status = 'superseded'; });
  const id = uid();
  pool.messages.push({ id, type: 'proposal', userId: req.user.id, price, votes: { [req.user.id]: true }, status: 'active', at: new Date().toISOString() });
  pool.activeProposalId = id;
  if (['open', 'price_agreed'].includes(pool.status)) pool.status = 'negotiating';
  if (pool.status === 'negotiating') pool.agreedPrice = null;
  checkProposal(pool);
  persist(pool);
  res.status(201).json({ ok: true });
});

router.post('/pools/:id/proposals/:mid/vote', (req, res) => {
  const pool = getPool(req, res);
  if (!pool || !writable(pool, res)) return;
  const prop = pool.messages.find((m) => m.id === req.params.mid && m.type === 'proposal');
  if (!prop || prop.status !== 'active') return res.status(400).json({ error: 'This proposal is no longer active.' });
  prop.votes[req.user.id] = req.body.accept === true;
  checkProposal(pool);
  persist(pool);
  res.json({ ok: true });
});

// ---------- buyer outreach (real email) ----------
function buildEmail(pool, coordinator, buyer, note, replyHint) {
  const total = totalQty(pool);
  const where = [pool.district, pool.state].filter(Boolean).join(', ');
  const subject = `[KS-${pool.code}] ${total} quintals of ${pool.crop} available at ₹${money(pool.agreedPrice)}/quintal – KrishiSetu Farmer Pool`;
  const rows = pool.members.map((m) => {
    const u = userById(m.userId) || {};
    return { name: u.name, place: [u.village, u.state].filter(Boolean).join(', '), qty: m.quantity };
  });
  const text = [
    `Dear ${buyer.name} team,`,
    '',
    `I am writing on behalf of "${pool.name}", a pool of ${pool.members.length} verified farmer(s) registered on KrishiSetu, who have agreed on a single collective price for their harvest.`,
    '',
    'OFFER SUMMARY',
    `  Crop:               ${pool.crop}${pool.variety ? ' (' + pool.variety + ')' : ''}`,
    `  Total quantity:     ${total} quintals`,
    `  Agreed price:       Rs. ${money(pool.agreedPrice)} per quintal (all farmers unanimously agreed)`,
    `  Expected harvest:   ${pool.harvestDate}`,
    `  Growing region:     ${where}`,
    pool.description ? `  Notes:              ${pool.description}` : null,
    '',
    'PARTICIPATING FARMERS',
    ...rows.map((r) => `  - ${r.name}${r.place ? ' (' + r.place + ')' : ''}: ${r.qty} quintals`),
    note ? `\nMESSAGE FROM THE POOL COORDINATOR\n${note}` : null,
    '',
    `Please reply to this email with your offer, any counter-price, quality requirements, payment terms and pickup details. ${replyHint}`,
    `Your reply will be delivered to every farmer in the pool.`,
    '',
    `Pool coordinator: ${coordinator.name}, ${coordinator.phone}`,
    `Pool reference: KS-${pool.code}`,
    '',
    'Regards,',
    `${pool.name} · via KrishiSetu`,
  ].filter((l) => l !== null).join('\n');

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:620px;margin:auto;color:#1b2a21">
  <div style="background:linear-gradient(135deg,#1f7a46,#e0a63a);padding:22px;border-radius:14px 14px 0 0;color:#fff">
    <div style="font-size:22px;font-weight:700">Krishi<span style="color:#ffe9a6">Setu</span></div>
    <div style="opacity:.9">Farmer Pool Offer · ${esc(pool.name)}</div></div>
  <div style="border:1px solid #e3ebe5;border-top:0;padding:22px;border-radius:0 0 14px 14px">
    <p>Dear ${esc(buyer.name)} team,</p>
    <p>A pool of <b>${pool.members.length} farmer(s)</b> registered on KrishiSetu has agreed on a single collective price and would like to sell to you.</p>
    <table style="width:100%;border-collapse:collapse;margin:14px 0">
      ${[['Crop', pool.crop + (pool.variety ? ' (' + pool.variety + ')' : '')], ['Total quantity', total + ' quintals'], ['Agreed price', '₹' + money(pool.agreedPrice) + ' / quintal'], ['Expected harvest', pool.harvestDate], ['Region', where]]
        .map(([k, v]) => `<tr><td style="padding:8px;background:#f3f8f4;border:1px solid #e3ebe5;width:38%"><b>${k}</b></td><td style="padding:8px;border:1px solid #e3ebe5">${esc(v)}</td></tr>`).join('')}
    </table>
    <p><b>Participating farmers</b></p>
    <ul>${rows.map((r) => `<li>${esc(r.name)}${r.place ? ' (' + esc(r.place) + ')' : ''} — ${r.qty} quintals</li>`).join('')}</ul>
    ${pool.description ? `<p><b>Notes:</b> ${esc(pool.description)}</p>` : ''}
    ${note ? `<p><b>Message from the coordinator:</b><br>${esc(note).replace(/\n/g, '<br>')}</p>` : ''}
    <p style="background:#fff8e6;border:1px solid #f1dca0;padding:12px;border-radius:10px"><b>Just reply to this email</b> with your offer, counter-price, quality needs, payment terms and pickup details. Your reply reaches every farmer in the pool.</p>
    <p style="color:#6b7d72;font-size:13px">Coordinator: ${esc(coordinator.name)}, ${esc(coordinator.phone)}<br>Reference: KS-${pool.code}</p>
  </div></div>`;
  return { subject, text, html };
}

function outreachInput(req, res, pool) {
  const name = clean(req.body.buyerName, 80);
  const email = clean(req.body.buyerEmail, 120).toLowerCase();
  const phone = clean(req.body.buyerPhone, 30);
  const channel = clean(req.body.channel, 20) || 'email';
  if (!name) return res.status(400).json({ error: 'Enter the company / wholesaler name.' }), null;
  if (channel !== 'whatsapp' && email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid buyer email address.' }), null;
  }
  if (!pool.agreedPrice) return res.status(400).json({ error: 'The pool must agree on a price first.' }), null;
  if (pool.status === 'closed') return res.status(400).json({ error: 'This pool is closed.' }), null;
  return { name, email, phone, channel, note: cleanMulti(req.body.note, 1000) };
}

const hint = () => (mailer.status().from ? `Send replies to ${mailer.status().from} (or simply hit Reply).` : 'Simply hit Reply.');

router.post('/pools/:id/outreach/preview', (req, res) => {
  const pool = getPool(req, res, { creator: true });
  if (!pool) return;
  const b = outreachInput(req, res, pool);
  if (!b) return;
  const { subject, text } = buildEmail(pool, req.user, b, b.note, hint());
  res.json({ to: b.email, phone: b.phone, channel: b.channel, subject, text, poolName: pool.name, poolCrop: pool.crop, totalQty: totalQty(pool), agreedPrice: pool.agreedPrice, code: pool.code });
});

router.post('/pools/:id/outreach', async (req, res) => {
  const pool = getPool(req, res, { creator: true });
  if (!pool) return;
  const b = outreachInput(req, res, pool);
  if (!b) return;
  const sentToday = pool.emails.filter((e) => e.direction === 'out' && Date.now() - new Date(e.at) < 864e5).length;
  if (sentToday >= 20) return res.status(429).json({ error: 'Daily outreach limit reached for this pool.' });
  const mail = buildEmail(pool, req.user, b, b.note, hint());
  let previewUrl = null;
  if (b.email && mailer.status().mode === 'live') {
    try {
      const r = await mailer.send({ to: b.email, ...mail, fromName: `${pool.name} (via KrishiSetu)`, code: pool.code });
      previewUrl = r.previewUrl;
    } catch (e) {
      console.log('[mail] SMTP relay notice:', e.message);
    }
  }

  const channelLabel = b.channel === 'whatsapp' ? 'WhatsApp' : 'Direct Email';
  pool.emails.push({
    id: uid(),
    direction: 'out',
    channel: b.channel,
    name: b.name,
    email: b.email || b.phone || '',
    subject: mail.subject,
    body: mail.text,
    at: new Date().toISOString(),
    previewUrl
  });
  if (['price_agreed', 'quote_sent'].includes(pool.status)) pool.status = 'quote_sent';
  sys(pool, `📢 Official harvest offer of ₹${money(pool.agreedPrice)}/quintal for ${totalQty(pool)} quintals was dispatched to ${b.name} via ${channelLabel}.`);
  persist(pool);
  res.status(201).json(detail(pool));
});

// coordinator logs a response received outside email (phone/WhatsApp)
router.post('/pools/:id/responses', (req, res) => {
  const pool = getPool(req, res, { creator: true });
  if (!pool || !writable(pool, res)) return;
  const name = clean(req.body.buyerName, 80), body = cleanMulti(req.body.body, 3000);
  if (!name || !body) return res.status(400).json({ error: 'Enter the buyer name and what they said.' });
  recordResponse(pool, { name, email: '', subject: 'Response logged by coordinator', body });
  persist(pool);
  res.status(201).json(detail(pool));
});

router.post('/pools/:id/check-replies', async (req, res) => {
  const pool = getPool(req, res, { creator: true });
  if (!pool) return;
  const n = await mailer.pollNow();
  res.json({ checked: mailer.status().inbound, newReplies: n });
});

function recordResponse(pool, { name, email, subject, body, messageId }) {
  pool.emails.push({ id: uid(), direction: 'in', name, email, subject, body, at: new Date().toISOString(), messageId });
  if (['quote_sent', 'price_agreed', 'responded'].includes(pool.status)) pool.status = 'responded';
  const snippet = body.length > 600 ? body.slice(0, 600) + '…' : body;
  sys(pool, `📩 Response from ${name}:\n${snippet}`, 'buyer_response');
}

// ---------- inbound mail from buyers ----------
function stripQuoted(t) {
  const lines = String(t).replace(/\r/g, '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const two = l + ' ' + (lines[i + 1] || '');
    if (/^>/.test(l) || /^On .{5,}wrote:?\s*$/i.test(two.trim()) || /^-+\s*Original Message/i.test(l) || /^_{5,}/.test(l)) break;
    out.push(l);
  }
  const s = out.join('\n').trim();
  return (s || String(t).trim()).slice(0, 4000);
}

async function handleInbound(mail) {
  const m = /KS-([A-Z2-9]{6})/i.exec([mail.subject, ...(mail.to || [])].join(' '));
  if (!m) return false;
  const pool = pools.rows.find((p) => p.code === m[1].toUpperCase());
  if (!pool) return false;
  const from = String(mail.from.address || '').toLowerCase();
  if (!from) return false;
  if (pool.emails.some((e) => e.messageId && e.messageId === mail.messageId)) return true; // already stored / our own copy
  const domain = from.split('@')[1];
  const known = pool.emails.some((e) => e.direction === 'out' && (e.email.split('@')[1] === domain || (mail.inReplyTo && e.messageId === mail.inReplyTo)));
  if (!known) return false;
  const buyer = pool.emails.find((e) => e.direction === 'out' && e.email.split('@')[1] === domain);
  recordResponse(pool, { name: mail.from.name || (buyer && buyer.name) || from, email: from, subject: mail.subject, body: stripQuoted(mail.text), messageId: mail.messageId });
  persist(pool);
  return true;
}

module.exports = { router, handleInbound };
