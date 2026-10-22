(() => {
  const STATES = [
    'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh',
    'Gujarat', 'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'Telangana',
    'Bihar', 'Chhattisgarh', 'Odisha', 'Tamil Nadu', 'West Bengal',
    'Assam', 'Himachal Pradesh', 'Jharkhand', 'Kerala', 'Uttarakhand', 'Other'
  ];

  const CROPS_DATA = [
    { id: 'Wheat', en: 'Wheat', hi: 'गेहूं (Wheat)', mr: 'गहू (Wheat)', pa: 'ਕਣਕ (Wheat)', kn: 'ಗೋಧಿ (Wheat)', te: 'గోధుమ (Wheat)', gu: 'ઘઉં (Wheat)' },
    { id: 'Rice', en: 'Paddy / Rice', hi: 'धान / चावल (Paddy)', mr: 'भात / तांदूळ (Paddy)', pa: 'ਝੋਨਾ (Paddy)', kn: 'ಭತ್ತ / ಅಕ್ಕಿ (Paddy)', te: 'వరి / బియ్యం (Paddy)', gu: 'ડાંગર / ચોખા (Paddy)' },
    { id: 'Cotton', en: 'Cotton', hi: 'कपास (Cotton)', mr: 'कापूस (Cotton)', pa: 'ਕਪਾਹ (Cotton)', kn: 'ಹತ್ತಿ (Cotton)', te: 'పత్తి (Cotton)', gu: 'કપાસ (Cotton)' },
    { id: 'Soybean', en: 'Soybean', hi: 'सोयाबीन (Soybean)', mr: 'सोयाबीन (Soybean)', pa: 'ਸੋਇਆਬੀਨ (Soybean)', kn: 'ಸೋಯಾಬೀನ್ (Soybean)', te: 'సోయాబీన్ (Soybean)', gu: 'સોયાબીન (Soybean)' },
    { id: 'Pulses', en: 'Gram / Pulses', hi: 'चना / दालें (Gram/Pulses)', mr: 'हरभरा / डाळी (Pulses)', pa: 'ਛੋਲੇ / ਦਾਲਾਂ (Pulses)', kn: 'ಕಡಲೆ / ಬೇಳೆಕಾಳು (Pulses)', te: 'శనగలు / పప్పులు (Pulses)', gu: 'ચણા / કઠોળ (Pulses)' },
    { id: 'Maize', en: 'Maize', hi: 'मक्का (Maize)', mr: 'मका (Maize)', pa: 'ਮੱਕੀ (Maize)', kn: 'ಮೆಕ್ಕೆಜೋಳ (Maize)', te: 'మొక్కజొన్న (Maize)', gu: 'મકાઈ (Maize)' },
    { id: 'Sugarcane', en: 'Sugarcane', hi: 'गन्ना (Sugarcane)', mr: 'ऊस (Sugarcane)', pa: 'ਗੰਨਾ (Sugarcane)', kn: 'ಕಬ್ಬು (Sugarcane)', te: 'చెరకు (Sugarcane)', gu: 'શેરડી (Sugarcane)' },
    { id: 'Mustard', en: 'Mustard', hi: 'सरसों (Mustard)', mr: 'मोहरी (Mustard)', pa: 'ਸਰ੍ਹੋਂ (Mustard)', kn: 'ಸಾಸಿವೆ (Mustard)', te: 'ఆవాలు (Mustard)', gu: 'રાયડો / સરસવ (Mustard)' },
    { id: 'Onion', en: 'Onion', hi: 'प्याज (Onion)', mr: 'कांदा (Onion)', pa: 'ਪਿਆਜ਼ (Onion)', kn: 'ಈರುಳ್ಳಿ (Onion)', te: 'ఉల్లిపాయ (Onion)', gu: 'ડુંગળી (Onion)' },
    { id: 'Potato', en: 'Potato', hi: 'आलू (Potato)', mr: 'बटाटा (Potato)', pa: 'ਆਲੂ (Potato)', kn: 'ಆಲೂಗಡ್ಡೆ (Potato)', te: 'బంగాళాదుంప (Potato)', gu: 'બટાકા (Potato)' },
    { id: 'Millets', en: 'Millets', hi: 'बाजरा / ज्वार (Millets)', mr: 'बाजरी / ज्वारी (Millets)', pa: 'ਬਾਜਰਾ / ਜਵਾਰ (Millets)', kn: 'ಸಿರಿಧಾನ್ಯ / ಜೋಳ (Millets)', te: 'చిరుధాన్యాలు (Millets)', gu: 'બાજરી / જુવાર (Millets)' },
    { id: 'Groundnut', en: 'Groundnut', hi: 'मूंगफली (Groundnut)', mr: 'भुईमूग (Groundnut)', pa: 'ਮੂੰਗਫਲੀ (Groundnut)', kn: 'ಕಡಲೆಕಾಯಿ (Groundnut)', te: 'వేరుశనగ (Groundnut)', gu: 'મગફળી (Groundnut)' }
  ];

  // Already logged in? Skip welcome page
  const isStatic = location.hostname.endsWith('github.io') || location.pathname.endsWith('index.html') || location.protocol === 'file:';
  const nextUrl = () => {
    const n = localStorage.getItem('ks_next');
    localStorage.removeItem('ks_next');
    if (n && n.startsWith('/join/')) return isStatic ? 'app.html' + n.replace('/join', '#/join') : n;
    return isStatic ? 'app.html' : '/app';
  };
  if (localStorage.getItem('ks_token')) location.replace(nextUrl());

  const $ = (id) => document.getElementById(id);

  function renderCrops() {
    const lang = window.I18N ? I18N.getLang() : 'en';
    const checked = new Set([...document.querySelectorAll('#crops input:checked')].map((c) => c.value));
    $('crops').innerHTML = CROPS_DATA.map((c) => {
      const isChecked = checked.has(c.id);
      const label = c[lang] || c.en || c.hi;
      return `
        <label class="crop">
          <input type="checkbox" value="${c.id}" ${isChecked ? 'checked' : ''}>
          <span>${label}</span>
        </label>
      `;
    }).join('');
  }

  // Populate States
  $('r-state').insertAdjacentHTML('beforeend', STATES.map((s) => `<option value="${s}">${s}</option>`).join(''));
  renderCrops();

  if (window.I18N) {
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
    renderCrops();
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
    if (!i) return;
    const isPw = i.type === 'password';
    i.type = isPw ? 'text' : 'password';
    const showText = window.I18N ? I18N.t('show_pw') : 'Show';
    const hideText = window.I18N ? I18N.t('hide_pw') : 'Hide';
    b.textContent = isPw ? hideText : showText;
  }));

  async function submit(url, body, btn, errEl) {
    errEl.textContent = '';
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>${window.I18N ? I18N.t('btn_wait') : 'Please wait…'}</span>`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verification failed. Please try again.');
      localStorage.setItem('ks_token', data.token);
      localStorage.setItem('ks_user', JSON.stringify(data.user));
      btn.innerHTML = `<span>${window.I18N ? I18N.t('btn_welcome_check') : 'Welcome ✓'}</span>`;
      location.href = nextUrl();
    } catch (e) {
      errEl.textContent = e.message === 'Failed to fetch' ? 'Cannot reach server. Check connection.' : e.message;
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submit('/api/login', {
      phone: $('l-phone').value,
      password: $('l-pass').value
    }, $('login-btn'), $('login-error'));
  });

  const EQUIPMENT = ['Tractor', 'Trolley / Trailer', 'Harvester', 'Rotavator', 'Power Tiller', 'Sprayer Pump', 'Thresher', 'None / Renting'];
  const eqEl = $('equipment');
  if (eqEl) {
    eqEl.innerHTML = EQUIPMENT.map((eq) => `<label class="crop"><input type="checkbox" value="${eq}"><span>${eq}</span></label>`).join('');
  }

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
      equipment: [...document.querySelectorAll('#equipment input:checked')].map((c) => c.value)
    }, $('register-btn'), $('register-error'));
  });
})();
