(() => {
  const STATES = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'
  ];

  const CROPS_DATA = [
    { id: 'Wheat', en: 'Wheat', kn: 'ಗೋಧಿ (Wheat)' },
    { id: 'Rice / Paddy', en: 'Rice / Paddy', kn: 'ಭತ್ತ / ಅಕ್ಕಿ (Paddy)' },
    { id: 'Soybean', en: 'Soybean', kn: 'ಸೋಯಾಬೀನ್ (Soybean)' },
    { id: 'Cotton', en: 'Cotton', kn: 'ಹತ್ತಿ (Cotton)' },
    { id: 'Maize', en: 'Maize', kn: 'ಮೆಕ್ಕೆಜೋಳ (Maize)' },
    { id: 'Gram / Chana', en: 'Gram / Chana', kn: 'ಕಡಲೆ / ಬೇಳೆಕಾಳು (Chana)' },
    { id: 'Sugarcane', en: 'Sugarcane', kn: 'ಕಬ್ಬು (Sugarcane)' },
    { id: 'Mustard', en: 'Mustard', kn: 'ಸಾಸಿವೆ (Mustard)' },
    { id: 'Pulses', en: 'Pulses', kn: 'ದಾಲ್ / ಬೇಳೆಕಾಳು (Pulses)' },
    { id: 'Vegetables', en: 'Vegetables', kn: 'ತರಕಾರಿಗಳು (Vegetables)' },
    { id: 'Fruits', en: 'Fruits', kn: 'ಹಣ್ಣುಗಳು (Fruits)' },
    { id: 'Groundnut', en: 'Groundnut', kn: 'ಕಡಲೆಕಾಯಿ (Groundnut)' },
    { id: 'Millets', en: 'Millets', kn: 'ಸಿರಿಧಾನ್ಯ / ರಾಗಿ / ಜೋಳ (Millets)' },
    { id: 'Spices', en: 'Spices', kn: 'ಸಂಬಾರ ಪದಾರ್ಥಗಳು (Spices)' }
  ];

  const EQUIPMENT_DATA = [
    { id: 'Tractor', en: 'Tractor', kn: 'ಟ್ರಾಕ್ಟರ್ (Tractor)' },
    { id: 'Trolley / Trailer', en: 'Trolley / Trailer', kn: 'ಟ್ರಾಲಿ / ಟ್ರೇಲರ್ (Trailer)' },
    { id: 'Harvester', en: 'Harvester', kn: 'ಕೊಯ್ಲು ಯಂತ್ರ (Harvester)' },
    { id: 'Rotavator', en: 'Rotavator', kn: 'ರೋಟಾವೇಟರ್ (Rotavator)' },
    { id: 'Power Tiller', en: 'Power Tiller', kn: 'ಪವರ್ ಟಿಲ್ಲರ್ (Power Tiller)' },
    { id: 'Sprayer Pump', en: 'Sprayer Pump', kn: 'ಸಿಂಪಡಕ ಪಂಪ್ (Sprayer)' },
    { id: 'Thresher', en: 'Thresher', kn: 'ಒಕ್ಕಣೆ ಯಂತ್ರ (Thresher)' },
    { id: 'None / Renting', en: 'None / Renting', kn: 'ಯಾವುದೂ ಇಲ್ಲ / ಬಾಡಿಗೆ (Renting)' }
  ];

  // Already logged in? skip welcome page.
  const nextUrl = () => {
    const n = localStorage.getItem('ks_next');
    localStorage.removeItem('ks_next');
    return n && n.startsWith('/join/') ? n : '/app';
  };
  if (localStorage.getItem('ks_token')) location.replace(nextUrl());

  const $ = (id) => document.getElementById(id);

  function renderCheckboxes() {
    const lang = window.I18N ? I18N.getLang() : 'en';

    // Crops
    const cropsEl = $('crops');
    if (cropsEl) {
      const checkedCrops = new Set([...cropsEl.querySelectorAll('input:checked')].map((c) => c.value));
      cropsEl.innerHTML = CROPS_DATA.map((c) => {
        const isChecked = checkedCrops.has(c.id);
        const label = lang === 'kn' ? (c.kn || c.en) : c.en;
        return `<label class="crop"><input type="checkbox" value="${c.id}" ${isChecked ? 'checked' : ''}><span>${label}</span></label>`;
      }).join('');
    }

    // Equipment
    const eqEl = $('equipment');
    if (eqEl) {
      const checkedEq = new Set([...eqEl.querySelectorAll('input:checked')].map((e) => e.value));
      eqEl.innerHTML = EQUIPMENT_DATA.map((eq) => {
        const isChecked = checkedEq.has(eq.id);
        const label = lang === 'kn' ? (eq.kn || eq.en) : eq.en;
        return `<label class="crop"><input type="checkbox" value="${eq.id}" ${isChecked ? 'checked' : ''}><span>${label}</span></label>`;
      }).join('');
    }
  }

  // Populate States
  const stateEl = $('r-state');
  if (stateEl) {
    stateEl.insertAdjacentHTML('beforeend', STATES.map((s) => `<option value="${s}">${s}</option>`).join(''));
  }
  renderCheckboxes();

  // Attach language dropdowns
  if (window.I18N) {
    if ($('hero-lang')) $('hero-lang').innerHTML = I18N.selectorHtml('hero-lang-sel');
    if ($('card-lang')) $('card-lang').innerHTML = I18N.selectorHtml('card-lang-sel');
    I18N.attachPicker(document);
    I18N.applyPage(document);
  }

  function updatePwToggles() {
    document.querySelectorAll('[data-toggle]').forEach((b) => {
      const i = $(b.dataset.toggle);
      if (!i) return;
      const isVisible = i.type === 'text';
      const showText = window.I18N ? I18N.t('show_pw') : 'Show';
      const hideText = window.I18N ? I18N.t('hide_pw') : 'Hide';
      b.textContent = isVisible ? hideText : showText;
    });
  }

  window.addEventListener('langchange', () => {
    renderCheckboxes();
    updatePwToggles();
    if (window.I18N) I18N.applyPage(document);
  });

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
    updatePwToggles();
  }));

  if (location.pathname === '/register' || location.hash === '#register') {
    show('register');
  }

  async function submit(url, body, btn, errEl) {
    errEl.textContent = '';
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = window.I18N ? (I18N.getLang() === 'kn' ? 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ…' : 'Please wait…') : 'Please wait…';
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      localStorage.setItem('ks_token', data.token);
      localStorage.setItem('ks_user', JSON.stringify(data.user));
      btn.textContent = window.I18N ? (I18N.getLang() === 'kn' ? 'ಸ್ವಾಗತ! ✓' : 'Welcome! ✓') : 'Welcome! ✓';
      location.href = nextUrl();
    } catch (e) {
      errEl.textContent = e.message === 'Failed to fetch' ? 'Cannot reach server. Check your connection.' : e.message;
      btn.disabled = false;
      btn.textContent = label;
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
