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

  function getNavItems() {
    const lang = window.I18N ? I18N.getLang() : 'en';
    const isKn = lang === 'kn';
    return [
      ['🏠', isKn ? 'ಮುಖಪುಟ' : 'Home', '#/home'],
      ['🤝', isKn ? 'ಬೆಳೆ ಪೂಲ್' : 'Farmer Pools', '#/pools'],
      ['🧑‍🌾', isKn ? 'ಕಾರ್ಮಿಕ ಸಂಪರ್ಕ' : 'Labour Connect', '#/labour'],
      ['🚜', isKn ? 'ಕೃಷಿ ಉಪಕರಣ' : 'Farm Gear', '#/gear']
    ];
  }

  function renderNav() {
    const items = getNavItems();
    const navHtml = items.map(([i, l, h]) => `<a href="${h}" data-h="${h}"><span class="ico">${i}</span>${l}</a>`).join('');
    const moreText = window.I18N && I18N.getLang() === 'kn' ? 'ಇನ್ನಷ್ಟು ಶೀಘ್ರದಲ್ಲಿ' : 'More soon';
    $('nav').innerHTML = navHtml + `<a class="disabled"><span class="ico">✨</span>${moreText}</a>`;
    $('bnav').innerHTML = navHtml;
    const cur = location.hash || '#/home';
    document.querySelectorAll('.nav a, .bottom-nav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.h === cur);
    });
  }
  renderNav();

  function updateLanguagePickers() {
    if (!window.I18N) return;
    const topEl = $('app-top-lang');
    if (topEl) {
      topEl.innerHTML = I18N.selectorHtml('top-lang-sel');
    }
    const sideEl = $('side-lang');
    if (sideEl) {
      sideEl.innerHTML = I18N.selectorHtml('side-lang-sel');
    }
    I18N.attachPicker(document);
    I18N.applyPage(document);
  }
  updateLanguagePickers();

  window.addEventListener('langchange', () => {
    renderNav();
    updateLanguagePickers();
    if (window.I18N) I18N.applyPage(document);
    route();
  });

  $('user-pill')?.addEventListener('click', () => { location.hash = '#/profile'; });

  const view = $('view');
  let cleanup = null;

  const ALL_CROPS = ['Wheat', 'Soybean', 'Gram', 'Rice / Paddy', 'Cotton', 'Maize', 'Mustard', 'Sugarcane', 'Garlic', 'Onion', 'Vegetables', 'Pulses'];
  const ALL_EQUIP = ['Tractor', 'Rotavator', 'Trolley', 'Seed drill', 'Sprayer', 'Drone', 'Power tiller', 'Harvester', 'Water pump'];
  const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
  const SCALES = ['Marginal (< 2.5 acres)', 'Small (2.5 – 5 acres)', 'Medium (5 – 10 acres)', 'Large (> 10 acres)'];
  const IRRIGATIONS = ['Borewell / Tube well', 'Canal irrigation', 'Rainfed (Monsoon dependant)', 'Drip / Sprinkler system', 'Pond / River / Well'];

  async function home() {
    let mine = [];
    try { mine = (await api('/pools?scope=mine')).pools; } catch {}
    const qty = mine.reduce((a, p) => a + p.totalQuantity, 0);

    const lang = window.I18N ? I18N.getLang() : 'en';
    const isKn = lang === 'kn';

    const greeting = isKn ? `ನಮಸ್ಕಾರ, ${esc(user.name)} 🙏` : `Namaste, ${esc(user.name)} 🙏`;
    const subtitle = isKn ? 'ನಿಮ್ಮ ಕೃಷಿ, ಇನ್ನಷ್ಟು ಸುಲಭ ಮತ್ತು ಲಾಭದಾಯಕ.' : 'Your farm, simplified.';
    const editHint = isKn ? '(ವಿವರ ಬದಲಿಸಲು ಹೆಸರು ಕ್ಲಿಕ್ ಮಾಡಿ)' : '(Click your name to change registration details)';

    const statMyPools = isKn ? 'ನನ್ನ ಪೂಲ್‌ಗಳು' : 'My pools';
    const statQty = isKn ? 'ಒಟ್ಟು ಕ್ವಿಂಟಾಲ್‌ಗಳು' : 'Quintals pooled';
    const statOffers = isKn ? 'ಕಳುಹಿಸಿದ ಕೊಡುಗೆಗಳು' : 'Offers out';

    const tilePools = isKn ? 'ಬೆಳೆ ಪೂಲ್' : 'Farmer Pools';
    const tilePoolsP = isKn
      ? 'ಒಂದೇ ಬೆಳೆ ಬೆಳೆಯುವ ರೈತರೊಂದಿಗೆ ಒಟ್ಟುಗೂಡಿ, ಒಂದು ಬೆಲೆ ಒಪ್ಪಿ ನೇರವಾಗಿ ಗಿರಣಿಗಳಿಗೆ ಮಾರಾಟ ಮಾಡಿ — ದಲ್ಲಾಳಿಗಳಿಲ್ಲದೆ.'
      : 'Team up with farmers growing the same crop, agree on one price and sell straight to processors & wholesalers — no middleman.';

    const tileLabour = isKn ? 'ಕಾರ್ಮಿಕ ಸಂಪರ್ಕ' : 'Labour Connect';
    const tileLabourP = isKn
      ? 'ಕೆಲಸಕ್ಕೆ ಆಳುಗಳು ಬೇಕೇ? ಬಿತ್ತನೆ, ಕಳೆ ಕೀಳುವಿಕೆ, ಸಿಂಪರಣೆಗೆ ಸಮೀಪದ ನುರಿತ ಕಾರ್ಮಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
      : 'Short of hands? Hire skilled workers nearby for ploughing, weeding, spraying & more — or list your own services and set your pay.';

    const tileGear = isKn ? 'ಕೃಷಿ ಉಪಕರಣ' : 'Farm Gear';
    const tileGearP = isKn
      ? 'ಟ್ರಾಕ್ಟರ್, ರೋಟಾವೇಟರ್, ಸಿಂಪಡಕ ಯಂತ್ರಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ ಅಥವಾ ನಿಮ್ಮ ಸಲಕರಣೆಗಳನ್ನು ಬಾಡಿಗೆಗೆ ನೀಡಿ ಸಂಪಾದಿಸಿ.'
      : 'Rent or buy tractors, power tillers, sprayers, ploughs & tools from farmers nearby — or earn by renting out your idle equipment.';

    const tileOpen = isKn ? 'ತೆರೆಯಿರಿ →' : 'Open →';

    const profileTitle = isKn ? '🧑‍🌾 ಅಧಿಕೃತ ರೈತ ನೋಂದಣಿ ವಿವರಗಳು' : '🧑‍🌾 Verified Registration Details';
    const profileSub = isKn ? 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲು ಹೆಸರು ಅಥವಾ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.' : 'Click your name or the button to update your registered information.';
    const btnChange = isKn ? '✏️ ನೋಂದಣಿ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ' : '✏️ Change Registration Details';

    const profileFields = isKn ? [
      ['ಪೂರ್ಣ ಹೆಸರು', user.name],
      ['ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', user.phone],
      ['ರಾಜ್ಯ', user.state],
      ['ಜಿಲ್ಲೆ / ತಾಲೂಕು', user.district || '—'],
      ['ಗ್ರಾಮ / ಪಂಚಾಯತ್', user.village || '—'],
      ['ಸಮೀಪದ ಎಪಿಎಂಸಿ ಮಂಡಿ', user.nearestMandi || '—'],
      ['ಕೃಷಿ ಭೂಮಿ', user.landSize ? user.landSize + ' ಎಕರೆ' : '—'],
      ['ರೈತರ ವರ್ಗ', user.farmCategory || '—'],
      ['ಪ್ರಮುಖ ನೀರಾವರಿ', user.irrigation || '—'],
      ['ಬೆಳೆಯುವ ಬೆಳೆಗಳು', (user.crops || []).join(', ') || '—'],
      ['ಕೃಷಿ ಯಂತ್ರೋಪಕರಣಗಳು', (user.equipment || []).join(', ') || '—']
    ] : [
      ['Full Name', user.name],
      ['Mobile Number', user.phone],
      ['State', user.state],
      ['District / Tehsil', user.district || '—'],
      ['Village / Panchayat', user.village || '—'],
      ['Nearest APMC Mandi', user.nearestMandi || '—'],
      ['Land Holding', user.landSize ? user.landSize + ' acres' : '—'],
      ['Farmer Category', user.farmCategory || '—'],
      ['Primary Irrigation', user.irrigation || '—'],
      ['Crops Cultivated', (user.crops || []).join(', ') || '—'],
      ['Machinery & Tools', (user.equipment || []).join(', ') || '—']
    ];

    view.innerHTML = `
      <header class="topbar">
        <div>
          <h1>${isKn ? 'ನಮಸ್ಕಾರ, ' : 'Namaste, '}<button type="button" id="top-user-name" title="Click your name to change registration details" style="all:unset; cursor:pointer; color:var(--gold); font-weight:800; text-decoration:underline;">${esc(user.name)}</button> 🙏</h1>
          <p>${subtitle} <span style="font-size:0.82rem; color:var(--gold); cursor:pointer;" onclick="location.hash='#/profile'">${editHint}</span></p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div id="top-lang">${window.I18N ? I18N.selectorHtml('top-lang-sel') : ''}</div>
        </div>
      </header>
      <section class="stats">
        <div class="stat"><b>${mine.length}</b><span>${statMyPools}</span></div>
        <div class="stat"><b>${qty}</b><span>${statQty}</span></div>
        <div class="stat"><b>${mine.filter((p) => ['quote_sent', 'responded'].includes(p.status)).length}</b><span>${statOffers}</span></div>
      </section>
      <section class="tiles">
        <a class="tile hot" href="#/pools"><div class="ico">🤝</div><h3>${tilePools}</h3>
          <p>${tilePoolsP}</p><span class="soon live">${tileOpen}</span></a>
        <a class="tile hot" href="#/labour"><div class="ico">🧑‍🌾</div><h3>${tileLabour}</h3>
          <p>${tileLabourP}</p><span class="soon live">${tileOpen}</span></a>
        <a class="tile hot" href="#/gear"><div class="ico">🚜</div><h3>${tileGear}</h3>
          <p>${tileGearP}</p><span class="soon live">${tileOpen}</span></a>
      </section>
      <section class="profile" aria-label="Your registered details">
        <div class="profile-edit-banner">
          <div>
            <h2 style="font-size:1.15rem; margin:0; display:flex; align-items:center; gap:8px;">${profileTitle}</h2>
            <small style="color:var(--muted);">${profileSub}</small>
          </div>
          <button type="button" class="btn sm" onclick="location.hash='#/profile'" style="background:linear-gradient(135deg, var(--gold), var(--gold-d)); color:#07130c; font-weight:700;">${btnChange}</button>
        </div>
        ${profileFields
          .filter(([_, v]) => v && v !== '—')
          .map(([k, v]) => `<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}
      </section>`;

    view.querySelector('#top-user-name')?.addEventListener('click', () => { location.hash = '#/profile'; });
    if (window.I18N) I18N.attachPicker(view);
  }

  async function editProfile(root) {
    const userCrops = new Set(user.crops || []);
    const userEquip = new Set(user.equipment || []);

    root.innerHTML = `
      <header class="topbar">
        <div>
          <h1>Change Registration Details 📝</h1>
          <p>Update your registered name, location, land holding, crops, and machinery.</p>
        </div>
        <a class="btn ghost" href="#/home">← Back to Dashboard</a>
      </header>
      <form class="formcard" id="ep-form" novalidate style="max-width:760px;">
        <fieldset class="pricebox">
          <legend>👤 Personal &amp; Contact Details</legend>
          <div class="row">
            <div class="field">
              <label>Full Name</label>
              <input id="ep-name" value="${esc(user.name)}" maxlength="60" required placeholder="Your full name" />
            </div>
            <div class="field">
              <label>Mobile Number (Verified Login ID)</label>
              <input value="${esc(user.phone)}" disabled style="opacity:0.75; cursor:not-allowed;" />
            </div>
          </div>
        </fieldset>

        <fieldset class="pricebox">
          <legend>📍 Location &amp; Mandi</legend>
          <div class="row">
            <div class="field">
              <label>State</label>
              <select id="ep-state">
                ${STATES.map((s) => `<option ${s === user.state ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>District</label>
              <input id="ep-dist" value="${esc(user.district || '')}" placeholder="e.g. Sehore" maxlength="60" />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Village / Town</label>
              <input id="ep-vill" value="${esc(user.village || '')}" placeholder="e.g. Bilkisganj" maxlength="60" />
            </div>
            <div class="field">
              <label>Nearest Mandi</label>
              <input id="ep-mandi" value="${esc(user.nearestMandi || '')}" placeholder="e.g. Sehore Krishi Upaj Mandi" maxlength="80" />
            </div>
          </div>
        </fieldset>

        <fieldset class="pricebox">
          <legend>🌱 Farm Profile</legend>
          <div class="row">
            <div class="field">
              <label>Land Size (Acres)</label>
              <input id="ep-land" type="number" step="0.1" min="0" max="10000" value="${user.landSize != null ? user.landSize : ''}" placeholder="e.g. 4.5" />
            </div>
            <div class="field">
              <label>Farm Scale / Category</label>
              <select id="ep-scale">
                <option value="">Select scale</option>
                ${SCALES.map((sc) => `<option ${sc === user.farmCategory ? 'selected' : ''}>${sc}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label>Primary Irrigation Source</label>
            <select id="ep-irrig">
              <option value="">Select irrigation source</option>
              ${IRRIGATIONS.map((ir) => `<option ${ir === user.irrigation ? 'selected' : ''}>${ir}</option>`).join('')}
            </select>
          </div>
        </fieldset>

        <fieldset class="pricebox">
          <legend>🌾 Crops You Grow (Click to toggle)</legend>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;" id="crop-chips">
            ${ALL_CROPS.map((c) => `<button type="button" class="btn sm ${userCrops.has(c) ? '' : 'ghost'}" data-crop="${esc(c)}" style="cursor:pointer;">${userCrops.has(c) ? '✓' : '＋'} ${esc(c)}</button>`).join('')}
          </div>
        </fieldset>

        <fieldset class="pricebox">
          <legend>🚜 Equipment Owned (Click to toggle)</legend>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;" id="equip-chips">
            ${ALL_EQUIP.map((eq) => `<button type="button" class="btn sm ${userEquip.has(eq) ? '' : 'ghost'}" data-equip="${esc(eq)}" style="cursor:pointer;">${userEquip.has(eq) ? '✓' : '＋'} ${esc(eq)}</button>`).join('')}
          </div>
        </fieldset>

        <fieldset class="pricebox">
          <legend>🔒 Security (Optional)</legend>
          <div class="field">
            <label>New Password (leave empty to keep current password)</label>
            <input id="ep-pass" type="password" minlength="6" placeholder="At least 6 characters" />
          </div>
        </fieldset>

        <div class="error" id="ep-err" role="alert"></div>
        <div class="pa" style="margin-top:16px; display:flex; gap:12px;">
          <button class="btn" type="submit" id="ep-submit" style="font-weight:700;">💾 Save Account Details</button>
          <a class="btn ghost" href="#/home">Cancel</a>
        </div>
      </form>
    `;

    const cropChips = root.querySelectorAll('#crop-chips button');
    cropChips.forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.crop;
        if (userCrops.has(c)) {
          userCrops.delete(c);
          btn.classList.add('ghost');
          btn.textContent = '＋ ' + c;
        } else {
          userCrops.add(c);
          btn.classList.remove('ghost');
          btn.textContent = '✓ ' + c;
        }
      });
    });

    const equipChips = root.querySelectorAll('#equip-chips button');
    equipChips.forEach((btn) => {
      btn.addEventListener('click', () => {
        const eq = btn.dataset.equip;
        if (userEquip.has(eq)) {
          userEquip.delete(eq);
          btn.classList.add('ghost');
          btn.textContent = '＋ ' + eq;
        } else {
          userEquip.add(eq);
          btn.classList.remove('ghost');
          btn.textContent = '✓ ' + eq;
        }
      });
    });

    const form = root.querySelector('#ep-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = root.querySelector('#ep-err');
      errBox.textContent = '';
      const submitBtn = root.querySelector('#ep-submit');
      submitBtn.disabled = true;

      const body = {
        name: root.querySelector('#ep-name').value.trim(),
        state: root.querySelector('#ep-state').value,
        district: root.querySelector('#ep-dist').value.trim(),
        village: root.querySelector('#ep-vill').value.trim(),
        nearestMandi: root.querySelector('#ep-mandi').value.trim(),
        landSize: root.querySelector('#ep-land').value ? Number(root.querySelector('#ep-land').value) : null,
        farmCategory: root.querySelector('#ep-scale').value,
        irrigation: root.querySelector('#ep-irrig').value,
        crops: Array.from(userCrops),
        equipment: Array.from(userEquip),
        newPassword: root.querySelector('#ep-pass').value || undefined
      };

      try {
        const res = await api('/me', { method: 'PUT', body });
        user = res.user;
        window.KS.user = user;
        localStorage.setItem('ks_user', JSON.stringify(user));

        $('uname').textContent = user.name;
        $('avatar').textContent = user.name.split(' ')[0][0].toUpperCase();

        toast('Registration details updated successfully! ✅', 'ok');
        location.hash = '#/home';
      } catch (err) {
        errBox.textContent = err.message || 'Failed to update registration details.';
        submitBtn.disabled = false;
      }
    });
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
    else if (h === '/profile') cleanup = await editProfile(view);
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
  window.addEventListener('hashchange', () => { if (location.pathname.startsWith('/join/')) history.replaceState(null, '', '/app' + location.hash); route(); });
  route();
})();
