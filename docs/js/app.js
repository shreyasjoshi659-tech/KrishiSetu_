(async () => {
  const token = localStorage.getItem('ks_token');
  const isStatic = location.hostname.endsWith('github.io') || location.pathname.endsWith('app.html') || location.protocol === 'file:';
  const homeUrl = isStatic ? 'index.html' : '/';
  const logout = () => {
    localStorage.removeItem('ks_token');
    localStorage.removeItem('ks_user');
    location.replace(homeUrl);
  };
  if (!token) {
    if (location.pathname.startsWith('/join/')) localStorage.setItem('ks_next', location.pathname);
    return location.replace(homeUrl);
  }

  let user;
  try {
    const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) return logout();
    user = (await res.json()).user;
  } catch {
    user = JSON.parse(localStorage.getItem('ks_user') || 'null');
    if (!user) return logout();
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
  async function api(path, { method = 'GET', body } = {}) {
    const r = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) { logout(); throw new Error('Session expired'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Request failed');
    return d;
  }

  function toast(msg, kind = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  window.KS = { user, token, api, esc, toast, go: (h) => { location.hash = h; } };

  const $ = (id) => document.getElementById(id);
  const first = user.name.split(' ')[0];
  $('uname').textContent = user.name;
  if ($('uplace')) $('uplace').textContent = [user.village, user.state].filter(Boolean).join(', ') || user.state;
  $('avatar').textContent = first[0].toUpperCase();
  $('logout').addEventListener('click', logout);

  // Attach language selector in top-right and sidebar
  function updateLanguagePickers() {
    if (!window.I18N) return;
    if ($('app-top-lang')) $('app-top-lang').innerHTML = I18N.selectorHtml('top-lang-sel');
    if ($('side-lang')) $('side-lang').innerHTML = I18N.selectorHtml('side-lang-sel');
    I18N.attachPicker(document);
    I18N.applyPage(document);
  }
  updateLanguagePickers();

  // Navigation Items (Clear, purposeful agricultural labels)
  function getNavItems() {
    return [
      { id: 'home', icon: '📊', main: window.I18N ? I18N.t('nav_home_main') : 'Dashboard', sub: window.I18N ? I18N.t('nav_home_sub') : 'Farmer Summary', h: '#/home' },
      { id: 'pools', icon: '🌾', main: window.I18N ? I18N.t('nav_pools_main') : 'Crop Pools', sub: window.I18N ? I18N.t('nav_pools_sub') : 'Collective Sale', h: '#/pools' },
      { id: 'labour', icon: '🧑‍🌾', main: window.I18N ? I18N.t('nav_labour_main') : 'Farm Labour', sub: window.I18N ? I18N.t('nav_labour_sub') : 'Local Hands', h: '#/labour' },
      { id: 'gear', icon: '🚜', main: window.I18N ? I18N.t('nav_gear_main') : 'Farm Gear', sub: window.I18N ? I18N.t('nav_gear_sub') : 'Rent & Buy', h: '#/gear' }
    ];
  }

  function renderNav() {
    const items = getNavItems();
    const navHtml = items.map((item) => `
      <a href="${item.h}" data-h="${item.h}">
        <span class="ico">${item.icon}</span>
        <span class="bi-text"><span class="bi-main">${item.main}</span><span class="bi-sub">${item.sub}</span></span>
      </a>
    `).join('');
    $('nav').innerHTML = navHtml;
    $('bnav').innerHTML = navHtml;
  }
  renderNav();

  window.addEventListener('langchange', () => {
    renderNav();
    updateLanguagePickers();
    if (window.I18N) I18N.applyPage(document);
    route();
  });

  const view = $('view');
  let cleanup = null;

  // Days until harvest calculation
  function harvestReadiness(dateStr) {
    if (!dateStr) return { text: 'तारीख दर्ज नहीं', days: null };
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `कटाई पूर्ण (${Math.abs(diff)} दिन पहले)`, status: 'ready', days: diff };
    if (diff === 0) return { text: `आज कटाई के लिए तैयार (Harvest Ready Today)`, status: 'ready', days: 0 };
    if (diff <= 7) return { text: `${diff} दिन में कटाई (Ready in ${diff} days)`, status: 'near', days: diff };
    return { text: `${diff} दिन शेष (Ready in ${diff} days · ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`, status: 'waiting', days: diff };
  }

  const STATUS_LABELS = {
    open: ['सदस्य जुड़ रहे हैं', 'Open to Join', 'st-open'],
    negotiating: ['मूल्य पर मतदान जारी', 'Voting on Price', 'st-neg'],
    price_agreed: ['सर्वसम्मति से भाव तय', 'Price Agreed', 'st-agreed'],
    quote_sent: ['खरीदारों को ऑफ़र भेजा गया', 'Offer Sent to Mills', 'st-sent'],
    responded: ['खरीदार का संदेश प्राप्त', 'Buyer Responded', 'st-resp'],
    closed: ['समूह समाप्त', 'Closed', 'st-closed']
  };

  async function home() {
    let mine = [];
    try { mine = (await api('/pools?scope=mine')).pools; } catch {}
    const qty = mine.reduce((a, p) => a + p.totalQuantity, 0);

    // Primary active pool
    const activePool = mine.find((p) => p.status !== 'closed') || mine[0];
    let poolHtml = '';

    if (activePool) {
      const hr = harvestReadiness(activePool.harvestDate);
      const st = STATUS_LABELS[activePool.status] || ['सक्रिय', 'Active', 'st-open'];

      // Next Action logic
      let nextActionTitle = 'समूह विवरण देखें';
      let nextActionSub = 'View pool details, chat & pricing';
      let nextActionBtn = 'समूह खोलें · Open Pool →';

      if (activePool.status === 'open' || activePool.status === 'negotiating') {
        nextActionTitle = 'न्यूनतम विक्रय मूल्य का प्रस्ताव दें या वोट करें';
        nextActionSub = 'Propose or vote on collective minimum price in pool chat';
        nextActionBtn = 'भाव तय करें · Vote Price →';
      } else if (activePool.status === 'price_agreed') {
        nextActionTitle = 'दाम तय हो चुका है — मिलों व खरीदारों को कोटेशन भेजें';
        nextActionSub = 'All farmers agreed. Send direct quotation to flour mills & processors';
        nextActionBtn = 'ऑफ़र भेजें · Send Offer →';
      } else if (activePool.status === 'quote_sent' || activePool.status === 'responded') {
        nextActionTitle = 'खरीदार संदेश व प्रतिक्रिया जांचें';
        nextActionSub = 'Track email quotes, mill replies and procurement counter-offers';
        nextActionBtn = 'प्रतिक्रिया देखें · View Replies →';
      }

      poolHtml = `
        <div class="active-pool-focus">
          <div class="ap-badge-row">
            <span class="badge ${st[2]}">${st[0]} (${st[1]})</span>
            <span style="font-size:0.82rem; color:var(--text-muted);">पूल कोड / Pool Code: <b style="color:var(--gold);">${esc(activePool.code)}</b></span>
          </div>

          <div class="ap-title-row">
            <div class="ap-title">
              <h2>${esc(activePool.name)}</h2>
              <p>🌾 फसल: <b>${esc(activePool.crop)}</b>${activePool.variety ? ' (' + esc(activePool.variety) + ')' : ''} · 📍 ${esc([activePool.district, activePool.state].filter(Boolean).join(', '))}</p>
            </div>
            <a class="btn ghost sm" href="#/pool/${activePool.id}">पूल विवरण · Details</a>
          </div>

          <div class="ap-metrics">
            <div class="ap-metric highlight">
              <span>सामूहिक तय भाव / Group Price</span>
              <b>${activePool.agreedPrice ? '₹' + Number(activePool.agreedPrice).toLocaleString('en-IN') + ' /क्विंटल' : 'मतदान जारी (In Voting)'}</b>
            </div>
            <div class="ap-metric green">
              <span>कटाई की स्थिति / Harvest Readiness</span>
              <b>${hr.text}</b>
            </div>
            <div class="ap-metric">
              <span>कुल मात्रा / Pooled Quantity</span>
              <b>${activePool.totalQuantity} क्विंटल (Quintals)</b>
            </div>
            <div class="ap-metric">
              <span>किसान सदस्य / Farmer Members</span>
              <b>${activePool.memberCount} किसान (Farmers)</b>
            </div>
          </div>

          <div class="ap-action-box">
            <div class="ap-action-text">
              <b>अगला आवश्यक कदम / Recommended Next Action:</b>
              <span>${nextActionTitle} (${nextActionSub})</span>
            </div>
            <a class="btn gold" href="#/pool/${activePool.id}">${nextActionBtn}</a>
          </div>
        </div>
      `;
    } else {
      poolHtml = `
        <div class="active-pool-focus" style="border-style:dashed;">
          <div class="ap-title">
            <h2>आपका कोई सक्रिय फसल समूह नहीं है</h2>
            <p>You have not created or joined a crop pool yet.</p>
          </div>
          <p style="color:var(--text-muted); font-size:0.92rem;">
            अपनी तैयार या आने वाली फसल (गेहूं, धान, सोयाबीन, कपास आदि) के लिए अपने क्षेत्र के किसानों के साथ एक समूह बनाएं या किसी मौजूदा समूह में शामिल हों।
          </p>
          <div class="pa" style="margin-top:6px;">
            <a class="btn" href="#/pools/new">+ नया फसल समूह बनाएं · Create Pool</a>
            <a class="btn ghost" href="#/pools">खुले समूह देखें · Discover Pools</a>
          </div>
        </div>
      `;
    }

    // Static realistic Indian Mandi benchmarks
    const mandiBenchmarks = [
      { crop: 'गेहूं (Wheat)', variety: 'Sharbati/Lokwan', msp: '₹2,275', range: '₹2,380 – ₹2,550' },
      { crop: 'धान (Paddy)', variety: 'Basmati 1121', msp: '₹2,300', range: '₹3,200 – ₹3,650' },
      { crop: 'सोयाबीन (Soybean)', variety: 'Yellow Standard', msp: '₹4,892', range: '₹4,650 – ₹4,980' },
      { crop: 'चना (Gram/Chana)', variety: 'Desi Bold', msp: '₹5,440', range: '₹5,750 – ₹6,100' }
    ];

    view.innerHTML = `
      <div class="demo-banner">
        <span>⚠️</span>
        <div>
          <strong>डेमो वातावरण · Demonstration Prototype:</strong>
          <span>सभी प्रदर्शित आंकड़े, खरीदार ईमेल और संदेश परीक्षण मोड में हैं। वास्तविक ईमेल डिलीवरी के लिए SMTP क्रेडेंशियल आवश्यक हैं।</span>
        </div>
      </div>

      <header class="topbar">
        <div>
          <h1>${window.I18N ? I18N.t('greeting_fmt', { name: esc(first) }) : 'Welcome, ' + esc(first) + ' 🙏'}</h1>
          <p data-i18n="brand_sub">${window.I18N ? I18N.t('brand_sub') : 'KrishiSetu · Farmer Collective Portal'}</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <div id="top-lang">${window.I18N ? I18N.selectorHtml('topbar-lang-sel') : ''}</div>
          <a class="btn sm" href="#/pools/new">${window.I18N ? I18N.t('btn_new_pool') : '+ New Pool'}</a>
        </div>
      </header>

      <!-- PRIMARY FOCUS: ACTIVE CROP POOL -->
      <section aria-label="Active Crop Pool">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--text);">🌾 आपका प्रमुख फसल समूह · Primary Harvest Pool</h3>
          <a class="link" href="#/pools">सभी समूह (${mine.length}) →</a>
        </div>
        ${poolHtml}
      </section>

      <!-- MANDI BENCHMARK FOR PRICING CONTEXT -->
      <section class="mandi-card" aria-label="Mandi Benchmark Reference">
        <div class="mandi-head">
          <h3>⚖️ सरकारी न्यूनतम समर्थन मूल्य (MSP) एवं मंडी संदर्भ भाव</h3>
          <span style="font-size:0.78rem; color:var(--text-muted);">समूह मूल्य तय करने हेतु संदर्भ (APMC Mandi Benchmarks)</span>
        </div>
        <div class="mandi-grid">
          ${mandiBenchmarks.map((b) => `
            <div class="mandi-item">
              <b>${b.crop}</b>
              <small style="color:var(--text-dim); display:block; font-size:0.75rem;">${b.variety}</small>
              <div class="m-msp">Govt MSP: <b>${b.msp}</b>/qtl</div>
              <div class="m-range">मंडी रेंज: <b>${b.range}</b></div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- COOPERATIVE MODULES -->
      <section class="tiles" aria-label="Services">
        <a class="tile" href="#/pools">
          <div class="ico">🌾</div>
          <h3>फसल समूह (Crop Pools)</h3>
          <p>पड़ोसी किसानों के साथ उपज जोड़ें, सामूहिक न्यूनतम भाव तय करें और सीधे मिलों व थोक खरीदारों को बेचें।</p>
          <span class="soon live">उपलब्ध · Active (${mine.length} pools)</span>
        </a>
        <a class="tile" href="#/labour">
          <div class="ico">🧑‍🌾</div>
          <h3>खेत श्रमिक सेवा (Farm Labour)</h3>
          <p>बुवाई, निराई, खाद छिड़काव व कटाई के लिए आसपास के कुशल श्रमिकों को बुलाएं या अपनी सेवाएं जोड़ें।</p>
          <span class="soon live">खुला है · Marketplace</span>
        </a>
        <a class="tile" href="#/gear">
          <div class="ico">🚜</div>
          <h3>कृषि यंत्र व उपकरण (Farm Gear)</h3>
          <p>ट्रैक्टर, रोटावेटर, रीपर, स्प्रेयर और औजार प्रति घंटा/दिन किराए पर लें या बेचें।</p>
          <span class="soon live">खुला है · Exchange</span>
        </a>
      </section>

      <!-- FARMER PROFILE SUMMARY -->
      <section class="panel-card" aria-label="Farmer Profile">
        <h3 style="font-size:0.95rem;">📋 आपका किसान प्रोफ़ाइल विवरण · Farmer Profile Record</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; font-size:0.88rem;">
          <div><small class="muted" style="display:block;">नाम / Name</small><b>${esc(user.name)}</b></div>
          <div><small class="muted" style="display:block;">मोबाइल / Mobile</small><b>${esc(user.phone)}</b></div>
          <div><small class="muted" style="display:block;">गाँव व राज्य / Location</small><b>${esc([user.village, user.state].filter(Boolean).join(', '))}</b></div>
          <div><small class="muted" style="display:block;">कृषि भूमि / Land Holding</small><b>${user.landSize ? user.landSize + ' एकड़ (Acres)' : 'दर्ज नहीं'}</b></div>
          <div><small class="muted" style="display:block;">पसंदीदा फसलें / Crops</small><b>${(user.crops || []).join(', ') || 'दर्ज नहीं'}</b></div>
        </div>
      </section>
    `;
    if (window.I18N) {
      I18N.attachPicker(view);
      I18N.applyPage(view);
    }
  }

  async function route() {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    const joinMatch = location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
    const h = location.hash.slice(1) || '/home';
    document.querySelectorAll('[data-h]').forEach((a) => {
      a.classList.toggle('active', h.startsWith(a.dataset.h.slice(1)) || (a.dataset.h === '#/pools' && (joinMatch || h.startsWith('/pool'))));
    });
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
    else location.hash = '#/home';
  }

  window.addEventListener('hashchange', () => {
    if (location.pathname.startsWith('/join/')) history.replaceState(null, '', '/app' + location.hash);
    route();
  });
  route();
})();
