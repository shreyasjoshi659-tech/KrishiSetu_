(async () => {
  const token = localStorage.getItem('ks_token');
  const logout = () => { localStorage.removeItem('ks_token'); localStorage.removeItem('ks_user'); location.replace('/'); };
  if (!token) {
    if (location.pathname.startsWith('/join/')) localStorage.setItem('ks_next', location.pathname);
    return location.replace('/');
  }

  let user;
  try {
    const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return logout();
    user = (await res.json()).user;
  } catch { user = JSON.parse(localStorage.getItem('ks_user') || 'null'); if (!user) return logout(); }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function api(path, { method = 'GET', body } = {}) {
    const r = await fetch('/api' + path, {
      method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) { logout(); throw new Error('Session expired'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Request failed');
    return d;
  }
  function toast(msg, kind = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700);
  }
  window.KS = { user, token, api, esc, toast, go: (h) => { location.hash = h; } };

  const $ = (id) => document.getElementById(id);
  const first = user.name.split(' ')[0];
  $('uname').textContent = user.name;
  $('avatar').textContent = first[0].toUpperCase();
  $('logout').addEventListener('click', logout);

  const items = [['🏠', 'Home', '#/home'], ['🤝', 'Farmer Pools', '#/pools'], ['🧑‍🌾', 'Labour Connect', '#/labour'], ['🚜', 'Farm Gear', '#/gear'], ['🌱', 'Vertical Farming', '#/vertical-farming']];
  const navHtml = items.map(([i, l, h]) => `<a href="${h}" data-h="${h}"><span class="ico">${i}</span>${l}</a>`).join('');
  $('nav').innerHTML = navHtml + `<a class="disabled"><span class="ico">✨</span>More soon</a>`;
  $('bnav').innerHTML = navHtml;

  const view = $('view');
  let cleanup = null;

  async function home() {
    let mine = [];
    try { mine = (await api('/pools?scope=mine')).pools; } catch {}
    const qty = mine.reduce((a, p) => a + p.totalQuantity, 0);
    view.innerHTML = `
      <header class="topbar"><div><h1>Namaste, ${esc(first)} 🙏</h1><p>Your farm, simplified.</p></div></header>
      <section class="stats">
        <div class="stat"><b>${mine.length}</b><span>My pools</span></div>
        <div class="stat"><b>${qty}</b><span>Quintals pooled</span></div>
        <div class="stat"><b>${mine.filter((p) => ['quote_sent', 'responded'].includes(p.status)).length}</b><span>Offers out</span></div>
      </section>
      <section class="tiles">
        <a class="tile hot" href="#/pools"><div class="ico">🤝</div><h3>Farmer Pools</h3>
          <p>Team up with farmers growing the same crop, agree on one price and sell straight to processors &amp; wholesalers — no middleman.</p><span class="soon live">Open →</span></a>
        <a class="tile hot" href="#/labour"><div class="ico">🧑‍🌾</div><h3>Labour Connect</h3>
          <p>Short of hands? Hire skilled workers nearby for ploughing, weeding, spraying &amp; more — or list your own services and set your pay.</p><span class="soon live">Open →</span></a>
        <a class="tile hot" href="#/gear"><div class="ico">🚜</div><h3>Farm Gear</h3>
          <p>Rent or buy tractors, power tillers, sprayers, ploughs &amp; tools from farmers nearby — or earn by renting out your idle equipment.</p><span class="soon live">Open →</span></a>
        <a class="tile hot" href="#/vertical-farming"><div class="ico">🌱</div><h3>Vertical Farming</h3>
          <p>Track demo crop progress, connect with farm and delivery partners, compare operating assumptions, and explore sample produce plans.</p><span class="soon live">Open →</span></a>
      </section>
      <section class="profile" aria-label="Your profile">
        ${[
          ['Mobile', user.phone],
          ['State', user.state],
          ['District', user.district || '—'],
          ['Village', user.village || '—'],
          ['Nearest Mandi', user.nearestMandi || '—'],
          ['Land Size', user.landSize ? user.landSize + ' acres' : '—'],
          ['Scale', user.farmCategory || '—'],
          ['Irrigation', user.irrigation || '—'],
          ['Crops', (user.crops || []).join(', ') || '—'],
          ['Equipment', (user.equipment || []).join(', ') || '—']
        ]
          .filter(([_, v]) => v && v !== '—')
          .map(([k, v]) => `<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}
      </section>`;
  }

  async function route() {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    const joinMatch = location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
    const h = location.hash.slice(1) || '/home';
    document.querySelectorAll('[data-h]').forEach((a) => a.classList.toggle('active', h.startsWith(a.dataset.h.slice(1)) || (a.dataset.h === '#/pools' && (joinMatch || h.startsWith('/pool')))));
    document.querySelectorAll('[data-h="#/labour"]').forEach((a) => a.classList.toggle('active', h.startsWith('/labour')));
    window.scrollTo(0, 0);
    if (joinMatch && !location.hash) cleanup = await Pools.join(view, joinMatch[1]);
    else if (h === '/home') await home();
    else if (h === '/pools') cleanup = await Pools.list(view);
    else if (h === '/pools/new') cleanup = await Pools.create(view);
    else if (h.startsWith('/pool/')) cleanup = await Pools.detail(view, h.split('/')[2]);
    else if (h === '/labour') cleanup = await Labour.find(view);
    else if (h === '/labour/profile') cleanup = await Labour.profile(view);
    else if (h === '/labour/inbox' || h === '/labour/sent') location.hash = '#/labour';
    else if (h === '/gear') cleanup = await Gear.market(view);
    else if (h === '/gear/mine') cleanup = await Gear.mine(view);
    else if (h === '/gear/new') cleanup = await Gear.form(view);
    else if (h.startsWith('/gear/edit/')) cleanup = await Gear.form(view, h.split('/')[3]);
    else if (h === '/vertical-farming') cleanup = await VerticalFarming.render(view);
    else location.hash = '#/home';
  }
  window.addEventListener('hashchange', () => { if (location.pathname.startsWith('/join/')) history.replaceState(null, '', '/app' + location.hash); route(); });
  route();
})();
