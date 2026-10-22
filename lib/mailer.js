const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const env = process.env;
const LIVE = !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const IMAP_HOST = env.IMAP_HOST || (/gmail/i.test(env.SMTP_HOST || '') ? 'imap.gmail.com' : '');
const INBOUND = LIVE && !!IMAP_HOST;

let tp;
async function transport() {
  if (tp) return tp;
  if (LIVE) {
    const port = Number(env.SMTP_PORT) || 587;
    const from = env.FROM_EMAIL || env.SMTP_USER;
    tp = {
      from,
      t: nodemailer.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }),
    };
  } else {
    // No SMTP configured: use a throw-away Ethereal inbox so the flow can be previewed. NOT delivered to real inboxes.
    const acc = await nodemailer.createTestAccount();
    tp = {
      from: acc.user,
      t: nodemailer.createTransport({ host: acc.smtp.host, port: acc.smtp.port, secure: acc.smtp.secure, auth: { user: acc.user, pass: acc.pass } }),
    };
  }
  return tp;
}

// user+ks-CODE@domain  (Gmail/Outlook plus-addressing) – replies carry the pool code
function replyAddress(from, code) {
  if (!LIVE || env.MAIL_PLUS_ADDRESSING === 'false') return from;
  const [l, d] = from.split('@');
  return `${l}+ks-${code.toLowerCase()}@${d}`;
}

async function send({ to, subject, text, html, fromName, code }) {
  const { t, from } = await transport();
  const info = await t.sendMail({
    from: { name: String(fromName).replace(/["<>\r\n]/g, ''), address: from },
    to,
    replyTo: replyAddress(from, code),
    subject,
    text,
    html,
  });
  return { messageId: info.messageId, previewUrl: LIVE ? null : nodemailer.getTestMessageUrl(info) || null };
}

const status = () => ({ mode: LIVE ? 'live' : 'test', inbound: INBOUND, from: LIVE ? (env.FROM_EMAIL || env.SMTP_USER) : null });

// ---------- inbound replies (IMAP polling) ----------
let handler = null;
let polling = false;

async function pollNow() {
  if (!INBOUND || !handler || polling) return 0;
  polling = true;
  let handled = 0;
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: Number(env.IMAP_PORT) || 993,
    secure: true,
    auth: { user: env.IMAP_USER || env.SMTP_USER, pass: env.IMAP_PASS || env.SMTP_PASS },
    logger: false,
  });
  client.on('error', () => {});
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const found = [];
      for await (const msg of client.fetch({ seen: false }, { source: true, uid: true })) found.push({ uid: msg.uid, source: msg.source });
      for (const m of found) {
        const p = await simpleParser(m.source);
        const ok = await handler({
          messageId: p.messageId,
          inReplyTo: p.inReplyTo,
          subject: p.subject || '',
          text: p.text || '',
          from: p.from && p.from.value && p.from.value[0] ? p.from.value[0] : { address: '', name: '' },
          to: (p.to ? [].concat(p.to) : []).flatMap((x) => x.value.map((v) => v.address)),
        });
        if (ok) {
          handled++;
          await client.messageFlagsAdd(m.uid, ['\\Seen'], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e) {
    console.error('[mail] inbox poll failed:', e.message);
  } finally {
    polling = false;
  }
  return handled;
}

function startInbox(onMail) {
  handler = onMail;
  if (!INBOUND) return console.log('[mail] inbound reply polling disabled (set SMTP_* and IMAP_HOST).');
  console.log('[mail] polling inbox for buyer replies every 60s');
  setTimeout(pollNow, 3000);
  setInterval(pollNow, 60_000);
}

module.exports = { send, status, startInbox, pollNow };
