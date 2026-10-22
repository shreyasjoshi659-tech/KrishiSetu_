/* KrishiSetu – Labour Connect: "LinkedIn for farm labour" (find workers / offer your work) */
window.Labour = (() => {
  const K = () => window.KS;
  const esc = (s) => K().esc(s);
  const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
  const SKILLS = [['Ploughing','🚜'],['Sowing','🌱'],['Weeding','🌿'],['Fertilizer spreading','🧪'],['Pesticide spraying','💨'],['Irrigation / sprinkling','💧'],['Harvesting','🌾'],['Plucking (fruit / tea / cotton)','🍃'],['Transplanting','🪴'],['Tractor driving','🚜'],['Threshing','🌾'],['Loading & unloading','📦'],['Pruning','✂️'],['Livestock care','🐄'],['Orchard work','🍎'],['Drone spraying','🛸']];
  const ico = (s) => (SKILLS.find(([k]) => k === s) || [0, '🛠️'])[1];
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const per = (t) => (t === 'hour' ? '/ hour' : '/ day');
  const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 60 ? Math.max(m, 1) + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
  const initial = (n) => esc((n || '?')[0].toUpperCase());
  const today = () => new Date().toISOString().slice(0, 10);

  function modal(html) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="modal" role="dialog">${html}</div>`;
    const close = () => o.remove();
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) close(); });
    document.body.appendChild(o);
    return { el: o.firstChild, close };
  }

  function workerCard(w) {
    const nb = w.nearScore >= 2 ? '<span class="badge st-resp">📍 In your district</span>' : w.nearScore === 1 ? '<span class="badge st-neg">📍 In your state</span>' : '';
    return `<article class="wcard wlist-item">
      <div class="wlist-left"><div class="avatar wav">${initial(w.name)}</div></div>
      <div class="wlist-main">
        <div class="wlist-header">
          <h3>${esc(w.name)}</h3>
          ${nb}
          <span class="wlist-exp">${w.experience ? '⭐ ' + w.experience + ' yr exp' : '🌱 New to work'}</span>
          <span class="wlist-loc">📍 ${esc([w.village, w.district, w.state].filter(Boolean).join(', '))}${w.travelKm ? ' · 🚲 ≤' + w.travelKm + ' km radius' : ''}</span>
        </div>
        ${w.headline ? `<p class="wc-head">${esc(w.headline)}</p>` : ''}
        <p class="wc-desc">${esc(w.description)}</p>
        <div class="chips">${w.skills.slice(0, 6).map((s) => `<span class="skill">${ico(s)} ${esc(s)}</span>`).join('')}${w.skills.length > 6 ? `<span class="skill more">+${w.skills.length - 6}</span>` : ''}</div>
      </div>
      <div class="wlist-action">
        <div class="wc-rate"><b>${money(w.rate)}</b><small>${per(w.rateType)}</small></div>
        <button class="btn sm" data-hire="${w.id}">Hire / Contact</button>
      </div>
    </article>`;
  }

  function hireModal(w) {
    const m = modal(`
      <h2>Contact ${esc(w.name)}</h2>
      <p class="muted">Rate: <b>${money(w.rate)}</b> ${per(w.rateType)}. Their phone number is shared once they accept.</p>
      <form id="hf" class="hform" novalidate>
        <div class="field"><label>Work needed</label><select id="h-job">${w.skills.map((s) => `<option>${esc(s)}</option>`).join('')}</select></div>
        <div class="row"><div class="field"><label>Start date</label><input id="h-date" type="date" min="${today()}" /></div>
          <div class="field"><label>Duration</label><input id="h-dur" maxlength="40" placeholder="e.g. 3 days" /></div></div>
        <div class="row"><div class="field"><label>Work location</label><input id="h-loc" maxlength="100" placeholder="Village / field" value="${esc(K().user.village || '')}" /></div>
          <div class="field"><label>Your offer (₹ ${per(w.rateType)})</label><input id="h-offer" type="number" min="1" placeholder="${w.rate}" /></div></div>
        <div class="field"><label>Message</label><textarea id="h-msg" rows="3" maxlength="600" placeholder="Describe the work, hours, whether food/transport is provided…"></textarea></div>
        <div class="error" id="h-err" role="alert"></div>
        <div class="pa"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Send request</button></div>
      </form>`);
    const $ = (s) => m.el.querySelector(s);
    $('#hf').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await K().api(`/labour/workers/${w.id}/requests`, { method: 'POST', body: { job: $('#h-job').value, startDate: $('#h-date').value, duration: $('#h-dur').value, location: $('#h-loc').value, offer: $('#h-offer').value, message: $('#h-msg').value } });
        K().toast('Request sent ✅'); m.close();
      } catch (err) { $('#h-err').textContent = err.message; }
    });
  }

  // ================= FIND WORKERS =================
  async function find(root) {
    root.innerHTML = `
      <section class="mkt-hero">
        <div class="mh-text"><span class="mh-eye">🧑‍🌾 Labour Marketplace</span><h1>Find farm workers near you</h1>
          <p>Browse available labour in your area with pay shown upfront — or list your own services.</p></div>
        <div class="mh-chips" id="qc">
          <button type="button" data-s="" class="on">All work</button>
          ${SKILLS.slice(0, 9).map(([s, i]) => `<button type="button" data-s="${s}">${i} ${s.split(' (')[0]}</button>`).join('')}
          <button type="button" id="btn-other" class="btn-other">🔍 Other</button>
        </div>
        <form class="mh-search" id="sf" role="search" hidden style="margin-top:6px;">
          <span>🔍</span>
          <input id="f-q" placeholder="What other work do you need? e.g. harvesting, tractor driving, spraying…" autocomplete="off" />
          <button class="btn" type="submit">Search</button>
          <button type="button" class="btn ghost sm" id="close-search" title="Close search" style="padding:4px 10px; font-size:0.82rem;">✕</button>
        </form>
      </section>
      <div class="mkt-bar">${tabs('find')}<button class="btn ghost sm" id="my-req">📬 My requests</button></div>
      <section class="filters lf">
        <select id="f-skill" hidden><option value=""></option>${SKILLS.map(([s]) => `<option>${s}</option>`).join('')}</select>
        <select id="f-state"><option value="">All states</option>${STATES.map((s) => `<option ${s === K().user.state ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <input id="f-dist" placeholder="District / area" />
        <select id="f-type"><option value="">Hourly or daily</option><option value="hour">Hourly</option><option value="day">Daily</option></select>
        <input id="f-max" type="number" min="1" placeholder="Max ₹ pay" />
        <select id="f-sort"><option value="near">Nearest first</option><option value="cheap">Lowest price</option><option value="exp">Most experienced</option><option value="new">Newest</option></select>
      </section>
      <div class="muted" id="count"></div>
      <section class="wgrid wlist" id="grid"><div class="muted">Loading…</div></section>`;
    const $ = (s) => root.querySelector(s);
    let workers = [], timer;
    async function load() {
      const p = new URLSearchParams({ q: $('#f-q').value, skill: $('#f-skill').value, state: $('#f-state').value, district: $('#f-dist').value, rateType: $('#f-type').value, maxRate: $('#f-max').value, sort: $('#f-sort').value });
      try {
        workers = (await K().api('/labour/workers?' + p)).workers;
        $('#count').textContent = workers.length + (workers.length === 1 ? ' worker found' : ' workers found');
        $('#grid').innerHTML = workers.length ? workers.map(workerCard).join('') :
          `<div class="empty"><div>🔍</div><h3>No workers match yet</h3><p>Try widening the filters — or be the first to list your own services.</p><a class="btn" href="#/labour/profile">Offer my work</a></div>`;
      } catch (e) { $('#grid').innerHTML = `<div class="muted">${esc(e.message)}</div>`; }
    }
    root.querySelectorAll('.lf select').forEach((s) => s.addEventListener('change', load));
    root.querySelectorAll('.lf input').forEach((s) => s.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); }));
    $('#f-q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
    $('#sf').addEventListener('submit', (e) => { e.preventDefault(); load(); });

    const sf = $('#sf');
    const btnOther = $('#btn-other');
    btnOther.addEventListener('click', () => {
      const isHidden = sf.hidden;
      sf.hidden = !isHidden;
      if (!sf.hidden) {
        root.querySelectorAll('#qc button').forEach((x) => x.classList.remove('on'));
        btnOther.classList.add('on');
        $('#f-skill').value = '';
        $('#f-q').focus();
      } else {
        btnOther.classList.remove('on');
        root.querySelector('#qc button[data-s=""]').classList.add('on');
        $('#f-q').value = '';
        load();
      }
    });

    $('#close-search')?.addEventListener('click', () => {
      sf.hidden = true;
      btnOther.classList.remove('on');
      root.querySelector('#qc button[data-s=""]').classList.add('on');
      $('#f-q').value = '';
      load();
    });

    $('#qc').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b === btnOther) return;
      root.querySelectorAll('#qc button').forEach((x) => x.classList.toggle('on', x === b));
      sf.hidden = true;
      $('#f-q').value = '';
      $('#f-skill').value = b.dataset.s || '';
      load();
    });

    $('#my-req').addEventListener('click', () => requestsModal('in'));
    $('#grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-hire]'); if (!b) return;
      hireModal(workers.find((w) => w.id === b.dataset.hire));
    });
    load();
  }

  function tabs(on) {
    const t = [['find', '🛒 Marketplace', '#/labour'], ['profile', '🛠️ Offer my work', '#/labour/profile']];
    return `<div class="seg ltabs">${t.map(([k, l, h]) => `<button type="button" class="${k === on ? 'on' : ''}" onclick="location.hash='${h}'">${l}</button>`).join('')}</div>`;
  }

  // ================= MY WORKER PROFILE =================
  async function profile(root) {
    root.innerHTML = '<div class="muted">Loading…</div>';
    const u = K().user;
    const existing = (await K().api('/labour/me')).profile;
    const p = existing || { skills: [], rateType: 'day', rate: '', state: u.state, district: '', headline: '', description: '', conditions: '', experience: '', travelKm: '', available: true };
    const sel = new Set(p.skills);
    root.innerHTML = `
      <header class="topbar"><div><h1>My Worker Profile 🛠️</h1><p>Tell farmers what you can do, what you charge and your conditions.</p></div></header>
      ${tabs('profile')}
      <form class="formcard" id="pf" novalidate>
        ${existing ? `<div class="avail"><div><b>${p.available ? '🟢 You are visible to farmers' : '⚪ Hidden from search'}</b><small>Switch off when you are busy or out of work.</small></div><button type="button" class="btn sm ghost" id="tog">${p.available ? 'Pause listing' : 'Go live'}</button></div>` : '<div class="note">Sign up as a farm worker — your profile will be shown to farmers in your area. No fees.</div>'}
        <div class="field"><label>What work can you do? (pick all that apply)</label>
          <div class="skillpick" id="sk">${SKILLS.map(([s, i]) => `<button type="button" data-s="${esc(s)}" class="${sel.has(s) ? 'on' : ''}">${i} ${s}</button>`).join('')}</div>
          <div class="row" style="margin-top:8px"><input id="sk-x" maxlength="40" placeholder="Other skill (type & press Add)" /><button type="button" class="btn sm ghost" id="sk-add">Add</button></div></div>
        <div class="field"><label>Headline</label><input id="p-head" maxlength="80" placeholder="e.g. Experienced tractor driver & ploughing, 8 years" value="${esc(p.headline)}" /></div>
        <div class="field"><label>About you / description</label><textarea id="p-desc" rows="4" maxlength="800" placeholder="Your experience, tools or machines you own, the crops you have worked on…">${esc(p.description)}</textarea></div>
        <div class="field"><label>Your conditions</label><textarea id="p-cond" rows="3" maxlength="600" placeholder="e.g. Lunch to be provided, minimum 4 hours, no work on Sundays, payment at end of day…">${esc(p.conditions)}</textarea></div>
        <div class="row"><div class="field"><label>Pay type</label>
            <div class="seg" id="rt"><button type="button" data-r="hour" class="${p.rateType === 'hour' ? 'on' : ''}">Per hour</button><button type="button" data-r="day" class="${p.rateType === 'day' ? 'on' : ''}">Per day</button></div></div>
          <div class="field"><label>Amount (₹)</label><input id="p-rate" type="number" min="1" step="any" value="${esc(p.rate)}" placeholder="e.g. 450" /></div></div>
        <div class="row"><div class="field"><label>State</label><select id="p-state">${STATES.map((s) => `<option ${s === p.state ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>District</label><input id="p-dist" maxlength="60" value="${esc(p.district)}" placeholder="e.g. Sehore" /></div></div>
        <div class="row"><div class="field"><label>Experience (years)</label><input id="p-exp" type="number" min="0" max="60" value="${esc(p.experience)}" /></div>
          <div class="field"><label>Willing to travel (km)</label><input id="p-km" type="number" min="0" max="500" value="${esc(p.travelKm)}" /></div></div>
        <div class="error" id="p-err" role="alert"></div>
        <div class="pa"><button class="btn" type="submit">${existing ? 'Save changes' : 'Create profile & go live'}</button>${existing ? '<button type="button" class="btn ghost selno" id="del">Delete profile</button>' : ''}</div>
      </form>`;
    const $ = (s) => root.querySelector(s);
    let rateType = p.rateType, available = p.available;
    const addSkill = (s) => {
      s = s.trim(); if (!s) return;
      if (!$('#sk').querySelector(`[data-s="${CSS.escape(s)}"]`)) { const b = document.createElement('button'); b.type = 'button'; b.dataset.s = s; b.textContent = '🛠️ ' + s; $('#sk').appendChild(b); }
      sel.add(s); $('#sk').querySelector(`[data-s="${CSS.escape(s)}"]`).classList.add('on');
    };
    p.skills.filter((s) => !SKILLS.some(([k]) => k === s)).forEach(addSkill);
    $('#sk').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const s = b.dataset.s; sel.has(s) ? sel.delete(s) : sel.add(s); b.classList.toggle('on', sel.has(s)); });
    $('#sk-add').addEventListener('click', () => { addSkill($('#sk-x').value); $('#sk-x').value = ''; });
    $('#rt').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; rateType = b.dataset.r; root.querySelectorAll('#rt button').forEach((x) => x.classList.toggle('on', x === b)); });
    $('#tog')?.addEventListener('click', async () => { await K().api('/labour/me/availability', { method: 'POST', body: { available: !available } }); K().toast(available ? 'Listing paused' : 'You are live 🟢'); profile(root); });
    $('#del')?.addEventListener('click', async () => { if (!confirm('Delete your worker profile?')) return; await K().api('/labour/me', { method: 'DELETE' }); K().toast('Profile deleted'); profile(root); });
    $('#pf').addEventListener('submit', async (e) => {
      e.preventDefault(); $('#p-err').textContent = '';
      try {
        await K().api('/labour/me', { method: 'PUT', body: { skills: [...sel], headline: $('#p-head').value, description: $('#p-desc').value, conditions: $('#p-cond').value, rateType, rate: $('#p-rate').value, state: $('#p-state').value, district: $('#p-dist').value, experience: $('#p-exp').value, travelKm: $('#p-km').value, available } });
        K().toast('Profile saved ✅'); profile(root);
      } catch (err) { $('#p-err').textContent = err.message; }
    });
  }

  // ================= REQUESTS =================
  const RST = { pending: ['Pending', 'st-neg'], accepted: ['Accepted', 'st-open'], declined: ['Declined', 'st-closed'] };
  function requestsModal(startBox = 'in') {
    const m = modal(`<div class="rq-head"><h2>📬 My requests</h2><button type="button" class="btn sm ghost" data-close>Close</button></div>
      <div class="seg" id="rq-seg"><button type="button" data-b="in" class="${startBox === 'in' ? 'on' : ''}">Received (farmers hiring me)</button><button type="button" data-b="out" class="${startBox === 'out' ? 'on' : ''}">Sent (workers I contacted)</button></div>
      <div id="rq-body"></div>`);
    m.el.classList.add('wide');
    const body = m.el.querySelector('#rq-body');
    m.el.querySelector('#rq-seg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      m.el.querySelectorAll('#rq-seg button').forEach((x) => x.classList.toggle('on', x === b));
      inbox(body, b.dataset.b);
    });
    inbox(body, startBox);
  }

  async function inbox(root, box) {
    root.innerHTML = '<section class="reqs" id="rq"><div class="muted">Loading…</div></section>';
    const $ = (s) => root.querySelector(s);
    async function load() {
      const { requests } = await K().api('/labour/requests?box=' + box);
      $('#rq').innerHTML = requests.length ? requests.map((r) => `
        <article class="req"><div class="req-h"><div class="avatar sm">${initial(r.otherName)}</div>
          <div class="mi"><b>${esc(r.otherName)}</b><small>${esc([r.otherVillage, r.otherState].filter(Boolean).join(', '))} · ${ago(r.createdAt)}</small></div>
          <span class="badge ${RST[r.status][1]}">${RST[r.status][0]}</span></div>
          <div class="chips"><span class="skill">${ico(r.job)} ${esc(r.job)}</span>${r.startDate ? `<span class="skill">📅 ${esc(r.startDate)}</span>` : ''}${r.duration ? `<span class="skill">⏱️ ${esc(r.duration)}</span>` : ''}${r.location ? `<span class="skill">📍 ${esc(r.location)}</span>` : ''}${r.offer ? `<span class="skill gold">Offer ${money(r.offer)}</span>` : ''}</div>
          <p>${esc(r.message)}</p>
          ${r.status === 'accepted' && r.otherPhone ? `<div class="pa"><a class="btn sm" href="tel:${esc(r.otherPhone)}">📞 Call ${esc(r.otherPhone)}</a><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/${esc(r.otherPhone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1'))}">WhatsApp</a></div>` : ''}
          ${box === 'in' && r.status === 'pending' ? `<div class="pa"><button class="btn sm sel" data-a="accept" data-id="${r.id}">Accept & share my number</button><button class="btn sm ghost selno" data-a="decline" data-id="${r.id}">Decline</button></div>` : ''}
        </article>`).join('') : `<div class="empty"><div>${box === 'in' ? '📭' : '🧑‍🌾'}</div><h3>Nothing here yet</h3><p>${box === 'in' ? 'Create your worker profile so farmers can find you.' : 'Find a worker and send your first request.'}</p><a class="btn" data-close href="${box === 'in' ? '#/labour/profile' : '#/labour'}">${box === 'in' ? 'Offer my work' : 'Find workers'}</a></div>`;
    }
    $('#rq').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      try { await K().api(`/labour/requests/${b.dataset.id}/respond`, { method: 'POST', body: { action: b.dataset.a } }); K().toast(b.dataset.a === 'accept' ? 'Accepted — farmer can now call you' : 'Declined'); load(); }
      catch (err) { K().toast(err.message, 'err'); }
    });
    await load();
  }

  return { find, profile, inbox: (root) => find(root), requestsModal };
})();
