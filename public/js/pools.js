/* KrishiSetu – Farmer Pools module (list, create, join via invite, detail with chat + buyer outreach) */
window.Pools = (() => {
  const K = () => window.KS;
  const esc = (s) => K().esc(s);
  const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
  const CROPS = ['Rice','Wheat','Cotton','Sugarcane','Maize','Soybean','Pulses','Vegetables','Fruits','Millets','Groundnut','Spices','Onion','Potato','Tomato'];
  const STATUS = { open: ['Open to join', 'st-open'], negotiating: ['Negotiating price', 'st-neg'], price_agreed: ['Price agreed', 'st-agreed'], quote_sent: ['Offer sent', 'st-sent'], responded: ['Buyer responded', 'st-resp'], closed: ['Closed', 'st-closed'] };
  const EMOJI = [['rice', '🌾'], ['wheat', '🌾'], ['millet', '🌾'], ['cotton', '☁️'], ['sugar', '🎋'], ['maize', '🌽'], ['soy', '🫘'], ['pulse', '🫘'], ['veg', '🥬'], ['fruit', '🍎'], ['groundnut', '🥜'], ['spice', '🌶️'], ['onion', '🧅'], ['potato', '🥔'], ['tomato', '🍅']];
  const emoji = (c) => (EMOJI.find(([k]) => c.toLowerCase().includes(k)) || [0, '🌱'])[1];
  const badge = (s) => `<span class="badge ${STATUS[s][1]}">${STATUS[s][0]}</span>`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const inviteLink = (code) => `${location.origin}/join/${code}`;

  function modal(html) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
    const close = () => o.remove();
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) close(); });
    document.body.appendChild(o);
    return { el: o.firstChild, close };
  }

  function poolCard(p) {
    return `<a class="pcard" href="#/pool/${p.id}">
      <div class="pc-top"><span class="pc-emoji">${emoji(p.crop)}</span><div><h3>${esc(p.name)}</h3><small>${esc(p.crop)}${p.variety ? ' · ' + esc(p.variety) : ''}</small></div></div>
      <div class="pc-stats"><div><b>${p.totalQuantity}</b><small>quintals</small></div><div><b>${p.memberCount}</b><small>farmers</small></div><div><b>${fmtDate(p.harvestDate).replace(/ \d{4}$/, '')}</b><small>harvest</small></div></div>
      <div class="pc-foot"><span>📍 ${esc([p.district, p.state].filter(Boolean).join(', '))}</span>${badge(p.status)}</div></a>`;
  }

  // ================= LIST =================
  async function list(root) {
    let tab = 'discover';
    root.innerHTML = `
      <header class="topbar"><div><h1>Farmer Pools 🤝</h1><p>Pool your harvest. One price. Better buyers.</p></div>
        <a class="btn" href="#/pools/new" id="new-pool">+ Create pool</a></header>
      <div class="joinbar"><input id="join-code" placeholder="Have an invite link or code? Paste it here" /><button class="btn ghost" id="join-go">Join</button></div>
      <div class="seg" id="seg"><button data-t="discover" class="on">Discover</button><button data-t="mine">My pools</button></div>
      <div class="filters" id="filters">
        <select id="f-crop"><option value="">All crops</option>${CROPS.map((c) => `<option>${c}</option>`).join('')}</select>
        <select id="f-state"><option value="">All states</option>${STATES.map((s) => `<option>${s}</option>`).join('')}</select></div>
      <section class="pgrid" id="grid"><div class="muted">Loading…</div></section>`;
    const $ = (s) => root.querySelector(s);

    async function load() {
      const q = tab === 'mine' ? '?scope=mine' : `?scope=discover&crop=${encodeURIComponent($('#f-crop').value)}&state=${encodeURIComponent($('#f-state').value)}`;
      try {
        const { pools } = await K().api('/pools' + q);
        $('#grid').innerHTML = pools.length ? pools.map(poolCard).join('') :
          `<div class="empty"><div>${tab === 'mine' ? '🌱' : '🔍'}</div><h3>${tab === 'mine' ? 'You are not in any pool yet' : 'No open pools match'}</h3>
           <p>${tab === 'mine' ? 'Create a pool for your crop, or open an invite link from another farmer.' : 'Try other filters, or create your own pool.'}</p></div>`;
      } catch (e) { $('#grid').innerHTML = `<div class="muted">${esc(e.message)}</div>`; }
    }
    $('#seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      tab = b.dataset.t;
      root.querySelectorAll('#seg button').forEach((x) => x.classList.toggle('on', x === b));
      $('#filters').hidden = tab !== 'discover';
      load();
    });
    root.querySelectorAll('#filters select').forEach((s) => s.addEventListener('change', load));
    const go = () => {
      const m = $('#join-code').value.trim().match(/([A-Za-z0-9]{6})\/?$/);
      if (!m) return K().toast('Paste a valid invite link or 6-character code', 'err');
      location.href = '/join/' + m[1].toUpperCase();
    };
    $('#join-go').addEventListener('click', go);
    $('#join-code').addEventListener('keydown', (e) => e.key === 'Enter' && go());
    load();
  }

  // ================= CREATE =================
  function create(root) {
    const u = K().user;
    const today = new Date().toISOString().slice(0, 10);
    root.innerHTML = `
      <header class="topbar"><div><h1>Create a pool 🌾</h1><p>For a crop that is ready (or nearly ready) to harvest.</p></div><a class="btn ghost" href="#/pools">← Back</a></header>
      <form class="formcard" id="cf" novalidate>
        <div class="row"><div class="field"><label>Crop</label><input id="c-crop" list="crop-list" placeholder="e.g. Wheat" required /><datalist id="crop-list">${CROPS.map((c) => `<option>${c}</option>`).join('')}</datalist></div>
          <div class="field"><label>Variety (optional)</label><input id="c-var" placeholder="e.g. Sharbati" /></div></div>
        <div class="field"><label>Pool name</label><input id="c-name" placeholder="e.g. Sehore Sharbati Wheat Pool" maxlength="60" required /></div>
        <div class="row"><div class="field"><label>Your quantity (quintals)</label><input id="c-qty" type="number" min="1" step="any" required /></div>
          <div class="field"><label>Expected harvest date</label><input id="c-date" type="date" min="${today}" required /></div></div>
        <div class="row"><div class="field"><label>State</label><select id="c-state">${STATES.map((s) => `<option ${s === u.state ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>District</label><input id="c-dist" placeholder="e.g. Sehore" /></div></div>
        <div class="field"><label>Notes for buyers (optional)</label><input id="c-desc" maxlength="500" placeholder="Grade, moisture, organic, storage…" /></div>
        <div class="field"><label>Who can find this pool?</label>
          <div class="seg small" id="vis"><button type="button" data-v="public" class="on">🌍 Public — listed in Discover</button><button type="button" data-v="private">🔒 Private — invite only</button></div></div>
        <div class="error" id="c-err" role="alert"></div>
        <button class="btn" type="submit">Create pool &amp; get invite link</button>
      </form>`;
    const $ = (s) => root.querySelector(s);
    let vis = 'public';
    $('#vis').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; vis = b.dataset.v; root.querySelectorAll('#vis button').forEach((x) => x.classList.toggle('on', x === b)); });
    $('#c-crop').addEventListener('blur', () => { if (!$('#c-name').value && $('#c-crop').value) $('#c-name').value = `${$('#c-dist').value || u.state} ${$('#c-crop').value} Pool`; });
    $('#cf').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#cf button[type=submit]'); btn.disabled = true; $('#c-err').textContent = '';
      try {
        const p = await K().api('/pools', { method: 'POST', body: { crop: $('#c-crop').value, variety: $('#c-var').value, name: $('#c-name').value, quantity: $('#c-qty').value, harvestDate: $('#c-date').value, state: $('#c-state').value, district: $('#c-dist').value, description: $('#c-desc').value, visibility: vis } });
        K().toast('Pool created 🎉');
        K().go('#/pool/' + p.id);
        setTimeout(() => inviteModal(p), 400);
      } catch (err) { $('#c-err').textContent = err.message; btn.disabled = false; }
    });
  }

  // ================= JOIN (invite link) =================
  async function join(root, code) {
    root.innerHTML = '<div class="muted">Opening invite…</div>';
    let pool;
    try { pool = (await K().api('/invite/' + code)).pool; }
    catch (e) { root.innerHTML = `<div class="empty"><div>⚠️</div><h3>${esc(e.message)}</h3><a class="btn" href="/app#/pools">Go to pools</a></div>`; return; }
    // We need to know if I'm already a member – /pools/:id tells us
    const chk = await K().api('/pools/' + pool.id);
    if (chk.isMember) return location.replace('/app#/pool/' + pool.id);
    root.innerHTML = joinCard(pool, true);
    root.querySelector('#jf')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button'); btn.disabled = true;
      try {
        await K().api(`/pools/${pool.id}/join`, { method: 'POST', body: { quantity: root.querySelector('#j-qty').value, code } });
        K().toast('You joined the pool 🎉');
        location.replace('/app#/pool/' + pool.id);
      } catch (err) { root.querySelector('#j-err').textContent = err.message; btn.disabled = false; }
    });
  }

  function joinCard(p, invited) {
    const open = ['open', 'negotiating'].includes(p.status);
    return `<div class="joincard"><div class="jc-emoji">${emoji(p.crop)}</div>
      <p class="muted">${invited ? `${esc(p.creatorName)} invited you to join` : 'Farmer pool'}</p><h1>${esc(p.name)}</h1>
      <div class="pc-stats big"><div><b>${p.totalQuantity}</b><small>quintals so far</small></div><div><b>${p.memberCount}</b><small>farmers</small></div><div><b>${fmtDate(p.harvestDate)}</b><small>harvest</small></div></div>
      <p>${esc(p.crop)}${p.variety ? ' · ' + esc(p.variety) : ''} · 📍 ${esc([p.district, p.state].filter(Boolean).join(', '))}</p>
      ${p.description ? `<p class="muted">${esc(p.description)}</p>` : ''}${badge(p.status)}
      ${open ? `<form id="jf"><div class="field"><label>How many quintals will you contribute?</label><input id="j-qty" type="number" min="1" step="any" required /></div>
        <div class="error" id="j-err"></div><button class="btn">Join this pool</button></form>` : '<p class="muted">This pool is no longer accepting new farmers.</p>'}
      <a class="link" href="/app#/pools">← Back to my pools</a></div>`;
  }

  function inviteModal(p) {
    const link = inviteLink(p.code);
    const text = `Join my farmer pool "${p.name}" on KrishiSetu – let's sell our ${p.crop} together at one good price: ${link}`;
    const m = modal(`<h2>Invite farmers 🔗</h2><p class="muted">Only real, registered farmers can join. Share this link:</p>
      <div class="copybox"><input readonly value="${esc(link)}" id="inv-link" /><button class="btn" id="inv-copy">Copy</button></div>
      <p class="muted">Pool code: <b class="code">${esc(p.code)}</b></p>
      <div class="share"><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">Share on WhatsApp</a>
      <a class="btn ghost" href="sms:?body=${encodeURIComponent(text)}">SMS</a>
      ${navigator.share ? '<button class="btn ghost" id="inv-share">More…</button>' : ''}</div>
      <button class="btn ghost full" data-close>Done</button>`);
    m.el.querySelector('#inv-copy').onclick = async () => { try { await navigator.clipboard.writeText(link); } catch { m.el.querySelector('#inv-link').select(); document.execCommand('copy'); } K().toast('Link copied'); };
    m.el.querySelector('#inv-share')?.addEventListener('click', () => navigator.share({ title: 'KrishiSetu pool', text, url: link }).catch(() => {}));
  }

  // ================= DETAIL =================
  async function detail(root, id) {
    let pool;
    try {
      const r = await K().api('/pools/' + id);
      if (!r.isMember) { root.innerHTML = joinCard(r.pool, false); wireJoin(root, r.pool); return; }
      pool = r;
    } catch (e) { root.innerHTML = `<div class="empty"><div>⚠️</div><h3>${esc(e.message)}</h3><a class="btn" href="#/pools">Back</a></div>`; return; }

    const me = K().user.id;
    const isCoord = () => pool.creatorId === me;
    const mail = await K().api('/mail/status').catch(() => ({ mode: 'test', inbound: false }));
    let tab = 'chat';

    root.innerHTML = `<div id="pdw">
      <div class="pd-head" id="pd-head"></div>
      <div class="seg pd-tabs" id="pd-tabs"><button data-t="chat" class="on">💬 Chat &amp; price</button><button data-t="side">👥 Pool &amp; buyers</button></div>
      <div class="pd-layout" data-tab="chat">
        <section class="pd-chat pane"><div class="pricebar" id="pricebar"></div><div class="msgs" id="msgs"></div>
          <div class="composer"><div class="proposebar" id="proposebar" hidden><span>₹</span><input id="pp-price" type="number" min="1" step="any" placeholder="Price per quintal" /><button class="btn sm" id="pp-send">Propose</button></div>
            <form id="msg-form"><button type="button" class="iconbtn" id="pp-toggle" title="Propose a price">💰</button><input id="msg-in" placeholder="Message the pool…" autocomplete="off" maxlength="1000" /><button class="btn sm" aria-label="Send">➤</button></form></div></section>
        <aside class="pd-side pane"><div id="members"></div><div id="buyers"></div></aside>
      </div></div>`;
    const $ = (s) => root.querySelector(s);
    const wrap = $('#pdw');
    const layout = $('.pd-layout');

    function renderHead() {
      $('#pd-head').innerHTML = `<a class="back" href="#/pools">← Pools</a>
        <div class="hd-main"><span class="pc-emoji big">${emoji(pool.crop)}</span><div><h1>${esc(pool.name)}</h1>
        <p>${esc(pool.crop)}${pool.variety ? ' · ' + esc(pool.variety) : ''} · 📍 ${esc([pool.district, pool.state].filter(Boolean).join(', '))} · 🗓 ${fmtDate(pool.harvestDate)}</p></div></div>
        <div class="hd-meta">${badge(pool.status)}<span class="chipx"><b>${pool.totalQuantity}</b> quintals</span><span class="chipx"><b>${pool.members.length}</b> farmers</span>
        <button class="btn sm" id="btn-invite">🔗 Invite farmers</button></div>`;
    }

    function renderPrice() {
      const prop = pool.messages.find((m) => m.id === pool.activeProposalId);
      $('#pricebar').innerHTML = pool.agreedPrice
        ? `<div class="pb-ok">✅ Agreed price <b>${money(pool.agreedPrice)}</b> / quintal <small>≈ ${money(pool.agreedPrice * pool.totalQuantity)} for the pool</small></div>`
        : prop ? `<div class="pb-wait">⏳ Voting on <b>${money(prop.price)}</b> / quintal — ${Object.values(prop.votes).filter((v) => v === true).length}/${pool.members.length} agreed</div>`
        : `<div class="pb-none">💰 No price yet. Tap 💰 below to propose a price per quintal — everyone must agree.</div>`;
    }

    function msgHtml(m) {
      if (m.type === 'system') return `<div class="m-sys">${esc(m.text)}</div>`;
      if (m.type === 'buyer_response') return `<div class="m-buyer"><div class="mb-h">📩 Buyer response</div><div class="mb-b">${esc(m.text.replace(/^📩 /, ''))}</div><small>${fmtTime(m.at)}</small></div>`;
      const mine = m.userId === me;
      if (m.type === 'proposal') {
        const yes = pool.members.filter((x) => m.votes[x.userId] === true), no = pool.members.filter((x) => m.votes[x.userId] === false);
        const myVote = m.votes[me];
        return `<div class="m-prop ${m.status}"><div class="mp-h">💰 ${esc(m.name)} proposed</div><div class="mp-price">${money(m.price)}<small> / quintal</small></div>
          <div class="mp-bar"><i style="width:${(yes.length / pool.members.length) * 100}%"></i></div>
          <div class="mp-v">${yes.length}/${pool.members.length} agreed${no.length ? ` · ✗ ${no.map((x) => esc(x.name.split(' ')[0])).join(', ')}` : ''}</div>
          ${m.status === 'active' ? `<div class="mp-act"><button class="btn sm ${myVote === true ? 'sel' : ''}" data-vote="${m.id}" data-a="1">${myVote === true ? '✓ You agreed' : '👍 Agree'}</button><button class="btn sm ghost ${myVote === false ? 'selno' : ''}" data-vote="${m.id}" data-a="0">👎 No</button></div>`
            : `<div class="mp-state">${m.status === 'accepted' ? '✅ Accepted by all' : 'Replaced by a newer proposal'}</div>`}<small>${fmtTime(m.at)}</small></div>`;
      }
      return `<div class="m ${mine ? 'me' : ''}">${mine ? '' : `<b class="m-name">${esc(m.name)}</b>`}<div>${esc(m.text).replace(/\n/g, '<br>')}</div><small>${fmtTime(m.at)}</small></div>`;
    }

    function renderMsgs() {
      const box = $('#msgs');
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      box.innerHTML = pool.messages.map(msgHtml).join('');
      if (near || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = 1; }
    }

    function renderMembers() {
      $('#members').innerHTML = `<div class="panel-card"><h3>Farmers in this pool</h3>
        ${pool.members.map((m) => `<div class="mrow"><div class="avatar sm">${esc(m.name[0])}</div><div class="mi"><b>${esc(m.name)}${m.isCreator ? ' <span class="crown">Coordinator</span>' : ''}</b>
          <small>${esc([m.village, m.state].filter(Boolean).join(', '))} · <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a></small></div><div class="mq">${m.quantity}<small>qtl</small></div></div>`).join('')}
        <div class="mtotal"><span>Total</span><b>${pool.totalQuantity} quintals</b></div>
        <div class="pa">${!isCoord() && ['open', 'negotiating'].includes(pool.status) ? '<button class="btn ghost sm" id="btn-leave">Leave pool</button>' : ''}${isCoord() && pool.status !== 'closed' ? '<button class="btn ghost sm" id="btn-close">Close pool</button>' : ''}</div></div>`;
    }

    function renderBuyers() {
      const thread = [...pool.emails].reverse().map((e) => `<div class="mail ${e.direction}"><div class="mail-h"><b>${e.direction === 'out' ? (e.channel === 'whatsapp' ? '💬 WhatsApp Offer to' : '📤 Direct Offer to') : '📩 From'} ${esc(e.name)}</b><small>${fmtDate(e.at)} ${fmtTime(e.at)}</small></div>
        ${e.email ? `<small class="muted">${esc(e.email)}</small>` : ''}
        <div class="mail-b">${e.direction === 'out' ? esc(e.subject) : esc(e.body).replace(/\n/g, '<br>')}</div>
        ${e.previewUrl ? `<a class="link" target="_blank" rel="noopener" href="${esc(e.previewUrl)}">View email preview ↗</a>` : ''}</div>`).join('');
      let form;
      if (pool.status === 'closed') form = '<p class="muted">Pool closed.</p>';
      else if (!isCoord()) form = `<p class="muted">The coordinator handles buyer outreach and shares replies here.</p>`;
      else if (!pool.agreedPrice) form = `<p class="locked">🔒 Agree on a single price in the chat first. Then you can dispatch formal offers to processing companies and wholesalers.</p>`;
      else form = `<form id="of">
          <div class="row">
            <div class="field"><label>Company / wholesaler name</label><input id="o-name" required placeholder="e.g. Sharma Agro Mills / ITC" /></div>
            <div class="field"><label>Buyer email (for ready-made email)</label><input id="o-email" type="email" placeholder="procurement@company.com" /></div>
          </div>
          <div class="row">
            <div class="field"><label>Buyer WhatsApp / Mobile (optional)</label><input id="o-phone" type="tel" placeholder="e.g. 98765 12340" /></div>
            <div class="field"><label>Message from coordinator (optional)</label><input id="o-note" maxlength="1000" placeholder="Delivery terms, quality grade, payment timeline…" /></div>
          </div>
          <div class="error" id="o-err"></div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="btn" id="btn-mail-dispatch" style="flex:1.2; min-width:210px; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #ea4335, #c5221f); border-color:#ea4335; color:#fff; font-weight:700;">
              <span>✉️</span> 1-Tap Ready Email (Gmail / Mail App)
            </button>
            <button type="button" class="btn wa" id="btn-wa-dispatch" style="flex:1; min-width:180px; display:inline-flex; align-items:center; justify-content:center; gap:8px;">
              <span>💬</span> Send via WhatsApp
            </button>
          </div>
        </form>
        <details class="manual" style="margin-top:14px;"><summary>Buyer replied by phone/WhatsApp? Log it</summary>
        <form id="rf"><input id="r-name" placeholder="Buyer name" required /><textarea id="r-body" rows="2" placeholder="What did they say?" required></textarea><button class="btn ghost sm">Share with pool</button></form></details>`;
      const notice = `<div class="note" style="border-color: rgba(95,211,141,0.35); background: rgba(95,211,141,0.08); display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <span style="font-size:1.2rem;">⚡</span>
        <div><b>1-Tap Real-World Outreach</b>: Generates complete, official harvest quotations with unanimous price &amp; member details. Opens directly in your <b>Gmail Web</b>, <b>Default Mail App</b>, or <b>WhatsApp</b> ready to send with 1 click.</div>
      </div>`;
      $('#buyers').innerHTML = `<div class="panel-card"><h3>📬 Buyers <small class="muted">${pool.emails.filter((e) => e.direction === 'out').length} contacted</small></h3>${isCoord() ? notice : ''}${form}
        <div class="thread">${thread || ''}</div></div>`;
    }

    const renderAll = () => { renderHead(); renderPrice(); renderMsgs(); renderMembers(); renderBuyers(); };
    renderAll();

    // realtime
    const es = new EventSource(`/api/pools/${id}/stream?token=${K().token}`);
    es.addEventListener('pool', (e) => {
      const keep = { name: $('#o-name')?.value, phone: $('#o-phone')?.value, email: $('#o-email')?.value, note: $('#o-note')?.value };
      pool = JSON.parse(e.data); renderHead(); renderPrice(); renderMsgs(); renderMembers();
      if (!document.activeElement?.closest('#buyers')) { renderBuyers(); if (keep.name) { $('#o-name').value = keep.name; if ($('#o-phone')) $('#o-phone').value = keep.phone; $('#o-email').value = keep.email; $('#o-note').value = keep.note; } }
    });

    const act = async (fn, okMsg) => { try { await fn(); if (okMsg) K().toast(okMsg); } catch (e) { K().toast(e.message, 'err'); } };
    const call = (path, body) => K().api(`/pools/${id}${path}`, { method: 'POST', body });

    async function dispatchOffer(channel) {
      const errBox = $('#o-err');
      if (errBox) errBox.textContent = '';
      const buyerName = ($('#o-name')?.value || '').trim();
      const buyerPhone = ($('#o-phone')?.value || '').trim();
      const buyerEmail = ($('#o-email')?.value || '').trim();
      const note = ($('#o-note')?.value || '').trim();

      if (!buyerName) {
        if (errBox) errBox.textContent = 'Please enter the company or wholesaler name.';
        $('#o-name')?.focus();
        return;
      }
      if (channel === 'email' && !buyerEmail) {
        if (errBox) errBox.textContent = 'Please enter the buyer email address to open the readymade email.';
        $('#o-email')?.focus();
        return;
      }

      const body = { buyerName, buyerEmail, buyerPhone, note, channel };

      try {
        const preview = await K().api(`/pools/${id}/outreach/preview`, { method: 'POST', body });
        
        if (channel === 'whatsapp') {
          const waMsg = `🌾 *KRISHISETU - HARVEST POOL QUOTATION* 🌾\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏢 *To:* ${buyerName}\n` +
            `🏷️ *Pool:* ${pool.name}\n` +
            `🌾 *Crop:* ${pool.crop}${pool.variety ? ' (' + pool.variety + ')' : ''}\n` +
            `⚖️ *Total Pooled Quantity:* ${preview.totalQty} Quintals\n` +
            `💰 *Agreed Collective Price:* ₹${Number(preview.agreedPrice).toLocaleString('en-IN')}/quintal\n` +
            `📍 *Location:* ${[pool.district, pool.state].filter(Boolean).join(', ')}\n` +
            `🧑‍🌾 *Farmer Collective:* ${pool.members ? pool.members.length : 'Member'} verified farmers\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            (note ? `💬 *Coordinator Note:* ${note}\n` : '') +
            `📞 *Coordinator:* ${K().user.name} (${K().user.phone})\n` +
            `🔗 *Pool Reference:* KS-${pool.code}\n\n` +
            `_Official harvest quotation via KrishiSetu Platform_`;

          const cleanPhone = buyerPhone.replace(/[\s\-\+]/g, '');
          const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(waMsg)}` : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
          
          window.open(waUrl, '_blank');
          await call('/outreach', body);
          K().toast('WhatsApp quotation dispatched! 💬');
        } else {
          // Readymade Email URLs
          const mailtoUrl = `mailto:${encodeURIComponent(buyerEmail)}?subject=${encodeURIComponent(preview.subject)}&body=${encodeURIComponent(preview.text)}`;
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(buyerEmail)}&su=${encodeURIComponent(preview.subject)}&body=${encodeURIComponent(preview.text)}`;
          const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(buyerEmail)}&subject=${encodeURIComponent(preview.subject)}&body=${encodeURIComponent(preview.text)}`;

          // 1-Tap: Directly launch host's Gmail Web in new tab with the ready draft
          window.open(gmailUrl, '_blank');

          // Log the dispatch on the backend
          await call('/outreach', body);
          K().toast('Readymade email launched & logged! ✉️');

          // Display Readymade Email Dispatch Sheet with 1-tap launchers
          const m = modal(`
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <span style="font-size:1.8rem;">✉️</span>
              <div>
                <h2 style="margin:0; font-size:1.3rem;">Readymade Email Created for ${esc(buyerName)}</h2>
                <small style="color:var(--muted);">Full official harvest quotation pre-filled and ready to send.</small>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.35); border:1px solid var(--border); border-radius:14px; padding:14px; margin-bottom:16px;">
              <div style="font-size:0.88rem; margin-bottom:6px;"><span style="color:var(--muted);">To:</span> <b>${esc(buyerEmail)}</b></div>
              <div style="font-size:0.88rem; margin-bottom:10px;"><span style="color:var(--muted);">Subject:</span> <b>${esc(preview.subject)}</b></div>
              <div style="max-height:180px; overflow-y:auto; background:rgba(0,0,0,0.25); border-radius:8px; padding:10px; font-family:monospace; font-size:0.82rem; white-space:pre-wrap; color:#cfdccf; line-height:1.4;">${esc(preview.text)}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <a class="btn" href="${gmailUrl}" target="_blank" rel="noopener" style="background:linear-gradient(135deg, #ea4335, #c5221f); border-color:#ea4335; color:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <span>🔴</span> Re-open Gmail Web
                </a>
                <a class="btn" href="${mailtoUrl}" style="background:linear-gradient(135deg, var(--green), var(--green-d)); text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <span>📬</span> Open in Mail App
                </a>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <a class="btn ghost sm" href="${outlookUrl}" target="_blank" rel="noopener" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <span>🔵</span> Open in Outlook Web
                </a>
                <button type="button" class="btn ghost sm" id="btn-copy-draft" style="display:flex; align-items:center; justify-content:center; gap:8px;">
                  <span>📋</span> Copy Entire Draft
                </button>
              </div>
              <button type="button" class="btn ghost sm" data-close style="margin-top:6px;">Done</button>
            </div>
          `);

          m.el.querySelector('#btn-copy-draft')?.addEventListener('click', () => {
            navigator.clipboard.writeText(`To: ${buyerEmail}\nSubject: ${preview.subject}\n\n${preview.text}`).then(() => {
              K().toast('Email draft copied to clipboard! 📋');
            });
          });
        }
      } catch (err) {
        if (errBox) errBox.textContent = err.message || 'Failed to dispatch offer.';
      }
    }

    wrap.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#pd-tabs button')) { const b = t.closest('#pd-tabs button'); layout.dataset.tab = b.dataset.t; root.querySelectorAll('#pd-tabs button').forEach((x) => x.classList.toggle('on', x === b)); }
      if (t.closest('#btn-invite')) inviteModal(pool);
      if (t.closest('#pp-toggle')) { const b = $('#proposebar'); b.hidden = !b.hidden; if (!b.hidden) $('#pp-price').focus(); }
      if (t.closest('#pp-send')) act(async () => { await call('/proposals', { price: $('#pp-price').value }); $('#pp-price').value = ''; $('#proposebar').hidden = true; });
      const v = t.closest('[data-vote]');
      if (v) act(() => call(`/proposals/${v.dataset.vote}/vote`, { accept: v.dataset.a === '1' }));
      if (t.closest('#btn-leave') && confirm('Leave this pool?')) act(async () => { await call('/leave'); K().go('#/pools'); }, 'You left the pool');
      if (t.closest('#btn-close') && confirm('Close this pool for everyone?')) act(() => call('/close'));
      if (t.closest('#btn-check')) act(async () => { const r = await call('/check-replies'); K().toast(r.newReplies ? `${r.newReplies} new repl${r.newReplies > 1 ? 'ies' : 'y'}` : 'No new replies yet'); });
      if (t.closest('#btn-wa-dispatch')) dispatchOffer('whatsapp');
      if (t.closest('#btn-mail-dispatch')) dispatchOffer('email');
    });
    $('#msg-form').addEventListener('submit', (e) => {
      e.preventDefault(); const i = $('#msg-in'); const text = i.value.trim(); if (!text) return;
      i.value = ''; act(() => call('/messages', { text }));
    });
    $('#pp-price').addEventListener('keydown', (e) => e.key === 'Enter' && $('#pp-send').click());

    wrap.addEventListener('submit', (e) => {
      if (e.target.id === 'of') {
        e.preventDefault();
        dispatchOffer($('#o-email')?.value ? 'email' : 'whatsapp');
      }
      if (e.target.id === 'rf') {
        e.preventDefault();
        act(() => call('/responses', { buyerName: $('#r-name').value, body: $('#r-body').value }), 'Shared with the pool');
      }
    });

    return () => es.close();
  }

  function wireJoin(root, p) {
    root.querySelector('#jf')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await K().api(`/pools/${p.id}/join`, { method: 'POST', body: { quantity: root.querySelector('#j-qty').value } }); K().toast('You joined the pool 🎉'); location.reload(); }
      catch (err) { root.querySelector('#j-err').textContent = err.message; }
    });
  }

  return { list, create, join, detail };
})();
