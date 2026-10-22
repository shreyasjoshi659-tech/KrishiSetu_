(() => {
  const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];
  const CROPS = ['Wheat','Rice / Paddy','Soybean','Cotton','Maize','Gram / Chana','Sugarcane','Mustard','Pulses','Vegetables','Fruits','Groundnut','Millets','Spices'];
  const EQUIPMENT = ['Tractor','Trolley / Trailer','Harvester','Rotavator','Power Tiller','Sprayer Pump','Thresher','None / Renting'];

  // Already logged in? skip welcome page.
  const nextUrl = () => { const n = localStorage.getItem('ks_next'); localStorage.removeItem('ks_next'); return n && n.startsWith('/join/') ? n : '/app'; };
  if (localStorage.getItem('ks_token')) location.replace(nextUrl());

  const $ = (id) => document.getElementById(id);
  $('r-state').insertAdjacentHTML('beforeend', STATES.map((s) => `<option>${s}</option>`).join(''));
  $('crops').innerHTML = CROPS.map((c) => `<label class="crop"><input type="checkbox" value="${c}"><span>${c}</span></label>`).join('');
  const eqEl = $('equipment');
  if (eqEl) {
    eqEl.innerHTML = EQUIPMENT.map((eq) => `<label class="crop"><input type="checkbox" value="${eq}"><span>${eq}</span></label>`).join('');
  }

  const tabs = $('tabs');
  function show(which) {
    tabs.dataset.active = which;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === which));
    $('login-form').classList.toggle('show', which === 'login');
    $('register-form').classList.toggle('show', which === 'register');
  }
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', () => show(a.dataset.go)));
  document.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    const i = $(b.dataset.toggle);
    i.type = i.type === 'password' ? 'text' : 'password';
    b.textContent = i.type === 'password' ? 'Show' : 'Hide';
  }));

  if (location.pathname === '/register' || location.hash === '#register') {
    show('register');
  }

  async function submit(url, body, btn, errEl) {
    errEl.textContent = '';
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Please wait…';
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      localStorage.setItem('ks_token', data.token);
      localStorage.setItem('ks_user', JSON.stringify(data.user));
      btn.textContent = 'Welcome! ✓';
      location.href = nextUrl();
    } catch (e) {
      errEl.textContent = e.message === 'Failed to fetch' ? 'Cannot reach server. Check your connection.' : e.message;
      btn.disabled = false; btn.textContent = label;
    }
  }

  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submit('/api/login', { phone: $('l-phone').value, password: $('l-pass').value }, $('login-btn'), $('login-error'));
  });

  $('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submit('/api/register', {
      name: $('r-name').value,
      phone: $('r-phone').value,
      password: $('r-pass').value,
      state: $('r-state').value,
      district: $('r-district').value,
      village: $('r-village').value,
      nearestMandi: $('r-mandi').value,
      landSize: $('r-land').value,
      farmCategory: $('r-category').value,
      irrigation: $('r-irrigation').value,
      crops: [...document.querySelectorAll('#crops input:checked')].map((c) => c.value),
      equipment: [...document.querySelectorAll('#equipment input:checked')].map((c) => c.value),
    }, $('register-btn'), $('register-error'));
  });
})();
