/* KrishiSetu
   Bilingual Translation & Language Engine: English (Primary) & Kannada (Secondary) */

window.I18N = (() => {
  const LANGS = [
    { code: 'en', label: 'English', sub: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' }
  ];

  const DICT = {
    // Brand & Top bar
    brand_sub: {
      en: 'KrishiSetu · Farmer Collective Portal',
      kn: 'ಕೃಷಿ ಸೇತು (KrishiSetu) · ರೈತ ಮಿತ್ರ ಒಕ್ಕೂಟ'
    },
    demo_badge_title: {
      en: 'Demo Prototype · Sample Data',
      kn: 'ಡೆಮೊ ಮಾದರಿ · ಮಾದರಿ ಡೇಟಾ'
    },
    demo_badge_desc: {
      en: 'Active prototype for Indian Farmer Collectives. Buyer emails and replies run in simulation test mode.',
      kn: 'ಭಾರತೀಯ ರೈತ ಉತ್ಪಾದಕ ಒಕ್ಕೂಟಗಳಿಗಾಗಿ ಮಾದರಿ. ಖರೀದಿದಾರರ ಇಮೇಲ್ ಹಾಗೂ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಪರೀಕ್ಷಾ ಕ್ರಮದಲ್ಲಿವೆ.'
    },

    // Welcome Hero
    hero_title: {
      en: 'Fair price for your harvest, <em>together as a collective</em>',
      kn: 'ಬೆಳೆಗೆ ನ್ಯಾಯಯುತ ಬೆಲೆ, <em>ರೈತರ ಒಕ್ಕೂಟದ ವೇದಿಕೆ</em>'
    },
    hero_desc: {
      en: 'Instead of selling alone at mandi distress prices, pool harvest with neighbouring farmers. Agree on one minimum price and send verified direct quotes to mills and wholesale buyers — with zero middlemen commissions.',
      kn: 'ಒಬ್ಬರೇ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕಡಿಮೆ ಬೆಲೆಗೆ ಮಾರಾಟ ಮಾಡುವ ಬದಲು, ನೆರೆಯ ರೈತರೊಂದಿಗೆ ಬೆಳೆ ಒಟ್ಟುಗೂಡಿಸಿ. ಕನಿಷ್ಠ ಬೆಲೆ ನಿಗದಿಪಡಿಸಿ ನೇರವಾಗಿ ಗಿರಣಿಗಳಿಗೆ ಮಾರಾಟ ಮಾಡಿ — ದಲ್ಲಾಳಿಗಳ ಕಮಿಷನ್ ಇಲ್ಲದೆ.'
    },
    chip_crops: { en: '🌾 Crop guidance', kn: '🌾 ಬೆಳೆ ಮಾರ್ಗದರ್ಶನ' },
    chip_weather: { en: '⛅ Weather', kn: '⛅ ಹವಾಮಾನ' },
    chip_prices: { en: '💰 Market prices', kn: '💰 ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು' },
    chip_community: { en: '🤝 Community', kn: '🤝 ಸಮುದಾಯ' },

    // Features
    feat_1_title: { en: 'Crop Pooling (ಫसल एकत्रीकरण)', kn: 'ಬೆಳೆ ಒಟ್ಟುಗೂಡಿಸುವಿಕೆ (Crop Pooling)' },
    feat_1_desc: {
      en: 'Combine harvest of the same crop to build wholesale volume (50–500 quintals) attractive to large commercial processors.',
      kn: 'ದೊಡ್ಡ ಖರೀದಿದಾರರಿಗಾಗಿ 50–500 ಕ್ವಿಂಟಾಲ್ ಸಗಟು ಪ್ರಮಾಣವನ್ನು ನಿರ್ಮಿಸಲು ಅದೇ ಬೆಳೆಯನ್ನು ಒಟ್ಟುಗೂಡಿಸಿ.'
    },
    feat_2_title: { en: 'Unanimous Price Agreement (मूल्य सहमति)', kn: 'ಬೆಲೆ ಒಪ್ಪಂದ ಮತದಾನ (Price Agreement)' },
    feat_2_desc: {
      en: 'Vote in private group chat on minimum acceptable rate based on APMC mandi prices and Govt MSP. Every farmer must agree.',
      kn: 'ಸರ್ಕಾರಿ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ ಹಾಗೂ ಮಂಡಿ ದರಗಳ ಆಧಾರದಲ್ಲಿ ಗುಂಪಿನಲ್ಲಿ ಚರ್ಚಿಸಿ ಕನಿಷ್ಠ ದರ ನಿಗದಿಪಡಿಸಿ. ಎಲ್ಲ ರೈತರ ಒಪ್ಪಿಗೆ ಮುಖ್ಯ.'
    },
    feat_3_title: { en: 'Direct Mill Buyer Outreach (सीधी बिक्री)', kn: 'ಗಿರಣಿಗಳು ಮತ್ತು ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರ ಸಂಪರ್ಕ' },
    feat_3_desc: {
      en: 'Send collective quotation directly to verified flour mills, dal processors, and food companies with pickup and quality details.',
      kn: 'ಹಿಟ್ಟಿನ ಗಿರಣಿಗಳು, ದಾಲ್ ಪ್ರೊಸೆಸರ್‌ಗಳು ಮತ್ತು ಆಹಾರ ಸಂಸ್ಥೆಗಳಿಗೆ ದಲ್ಲಾಳಿಗಳಿಲ್ಲದೆ ನೇರವಾಗಿ ಕೊಟೇಶನ್ ಕಳುಹಿಸಿ.'
    },

    // Greetings & Tabs
    login_greeting: { en: 'Welcome, Farmer 🙏', kn: 'ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ 🙏' },
    login_sub: { en: 'Sign in with your registered mobile number', kn: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ' },
    register_greeting: { en: 'Farmer Registration 🚜', kn: 'ರೈತರ ನೋಂದಣಿ 🚜' },
    register_sub: { en: 'Join your local farmer collective and access cooperative services', kn: 'ಬೆಳೆ ಒಕ್ಕೂಟ ಮತ್ತು ಸಹಕಾರಿ ಸೇವೆಗಳಿಗೆ ಸೇರಲು ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' },
    tab_login: { en: 'Sign In', kn: 'ಲಾಗಿನ್' },
    tab_register: { en: 'New Register', kn: 'ಹೊಸ ನೋಂದಣಿ' },
    btn_signin: { en: 'Sign In to Account →', kn: 'ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ →' },
    btn_signup: { en: 'Create Farmer Account →', kn: 'ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ →' },
    btn_login: { en: 'Log in', kn: 'ಲಾಗಿನ್ ಮಾಡಿ' },
    btn_register: { en: 'Create farmer account', kn: 'ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ' },
    switch_to_reg: { en: 'New to KrishiSetu? Create an account', kn: 'ಹೊಸಬರೇ? ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ' },
    switch_to_login: { en: 'Already registered? Sign in here', kn: 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ? ಲಾಗಿನ್ ಮಾಡಿ' },
    already_reg: { en: 'Already registered?', kn: 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?' },

    // Form Section Titles
    sec_farmer_id: { en: 'Farmer Identification', kn: 'ರೈತರ ಗುರುತು ಮತ್ತು ವಿವರ' },
    sec_location: { en: 'Location & APMC Mandi', kn: 'ಸ್ಥಳ ಮತ್ತು ಎಪಿಎಂಸಿ ಮಂಡಿ' },
    sec_land: { en: 'Land & Cultivation Profile', kn: 'ಭೂಮಿ ಮತ್ತು ಬೆಳೆ ವಿವರಗಳು' },
    sec_crops: { en: 'Major Crops Cultivated', kn: 'ಬೆಳೆಯುವ ಪ್ರಮುಖ ಬೆಳೆಗಳು' },
    sec_machinery: { en: 'Farm Machinery & Equipment', kn: 'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣಗಳು' },

    // Labels & Placeholders
    lbl_phone: { en: 'Mobile Number (10 Digits)', kn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕಿ)' },
    ph_phone: { en: '9876543210', kn: '9876543210' },
    lbl_pass: { en: 'Password', kn: 'ಪಾಸ್‌ವರ್ಡ್' },
    ph_pass: { en: 'Min 6 characters', kn: 'ಕನಿಷ್ಠ 6 ಅಕ್ಷರ' },
    ph_pass_reg: { en: 'Min 6 chars', kn: 'ಕನಿಷ್ಠ 6 ಅಕ್ಷರ' },
    lbl_name: { en: 'Full Name', kn: 'ಪೂರ್ಣ ಹೆಸರು' },
    ph_name: { en: 'e.g. Ramesh Patil', kn: 'ಉದಾ. ರಮೇಶ್ ಪಾಟೀಲ್' },
    lbl_state: { en: 'State', kn: 'ರಾಜ್ಯ' },
    sel_state: { en: 'Select State', kn: 'ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ' },
    lbl_district: { en: 'District / Tehsil', kn: 'ಜಿಲ್ಲೆ / ತಾಲೂಕು' },
    ph_district: { en: 'e.g. Belagavi / Dharwad', kn: 'ಉದಾ. ಬೆಳಗಾವಿ / ಧಾರವಾಡ' },
    lbl_village: { en: 'Village / Mandi / Tehsil', kn: 'ಗ್ರಾಮ / ಮಂಡಿ / ತಾಲೂಕು' },
    ph_village: { en: 'e.g. Bailhongal', kn: 'ಉದಾ. ಬೈಲಹೊಂಗಲ' },
    lbl_mandi: { en: 'Nearest APMC Mandi', kn: 'ಸಮೀಪದ ಎಪಿಎಂಸಿ ಮಂಡಿ' },
    ph_mandi: { en: 'e.g. APMC Yard', kn: 'ಉದಾ. ಎಪಿಎಂಸಿ ಯಾರ್ಡ್' },
    lbl_land: { en: 'Farm Land in Acres (Optional)', kn: 'ಕೃಷಿ ಭೂಮಿ - ಎಕರೆ (ಐಚ್ಛಿಕ)' },
    ph_land: { en: 'e.g. 4.5', kn: 'ಉದಾ. 4.5' },
    lbl_category: { en: 'Farmer category', kn: 'ರೈತರ ವರ್ಗ' },
    sel_category: { en: 'Select category', kn: 'ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ' },
    cat_marginal: { en: 'Marginal (< 2.5 acres)', kn: 'ಅತಿ ಸಣ್ಣ (< 2.5 ಎಕರೆ)' },
    cat_small: { en: 'Small (2.5 – 5 acres)', kn: 'ಸಣ್ಣ (2.5 – 5 ಎಕರೆ)' },
    cat_medium: { en: 'Medium (5 – 10 acres)', kn: 'ಮಧ್ಯಮ (5 – 10 ಎಕರೆ)' },
    cat_large: { en: 'Large (> 10 acres)', kn: 'ದೊಡ್ಡ (> 10 ಎಕರೆ)' },
    lbl_irrigation: { en: 'Primary irrigation source', kn: 'ಪ್ರಮುಖ ನೀರಾವರಿ ಮೂಲ' },
    sel_irrigation: { en: 'Select irrigation source', kn: 'ನೀರಾವರಿ ಮೂಲ ಆಯ್ಕೆಮಾಡಿ' },
    irrig_borewell: { en: 'Borewell / Tube well', kn: 'ಕೊಳವೆಬಾವಿ (Borewell)' },
    irrig_canal: { en: 'Canal irrigation', kn: 'ಕಾಲುವೆ ನೀರಾವರಿ (Canal)' },
    irrig_rainfed: { en: 'Rainfed (Monsoon dependant)', kn: 'ಮಳೆಯಾಶ್ರಿತ (Rainfed)' },
    irrig_drip: { en: 'Drip / Sprinkler system', kn: 'ಹನಿ / ತುಂತುರು ನೀರಾವರಿ (Drip/Sprinkler)' },
    irrig_pond: { en: 'Pond / River / Well', kn: 'ಕೆರೆ / ನದಿ / ತೆರೆದ ಬಾವಿ (Pond/Well)' },
    show_pw: { en: 'Show', kn: 'ತೋರಿಸಿ' },
    hide_pw: { en: 'Hide', kn: 'ಮರೆಮಾಡಿ' },
    choose_lang: { en: 'Language', kn: 'ಭಾಷೆ' },
    footer_text: {
      en: '© KrishiSetu · Designed for Indian Agricultural Collectives',
      kn: '© KrishiSetu · ಭಾರತೀಯ ಕೃಷಿ ಒಕ್ಕೂಟಗಳಿಗಾಗಿ ರೂಪಿಸಲಾಗಿದೆ'
    },
    hero_foot: { en: '© KrishiSetu · Made for Indian farmers', kn: '© KrishiSetu · ಭಾರತೀಯ ರೈತರಿಗಾಗಿ ರೂಪಿಸಲಾಗಿದೆ' },

    // Main App Navigation & Headers
    nav_home: { en: 'Home', kn: 'ಮುಖಪುಟ' },
    nav_pools: { en: 'Farmer Pools', kn: 'ಬೆಳೆ ಪೂಲ್' },
    nav_labour: { en: 'Labour Connect', kn: 'ಕಾರ್ಮಿಕ ಸಂಪರ್ಕ' },
    nav_gear: { en: 'Farm Gear', kn: 'ಕೃಷಿ ಉಪಕರಣ' },
    nav_home_main: { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
    nav_home_sub: { en: 'Farmer Summary', kn: 'ರೈತರ ಸಾರಾಂಶ' },
    nav_pools_main: { en: 'Crop Pools', kn: 'ಬೆಳೆ ಪೂಲ್' },
    nav_pools_sub: { en: 'Collective Sale', kn: 'ಸಾಮೂಹಿಕ ಮಾರಾಟ' },
    nav_labour_main: { en: 'Farm Labour', kn: 'ಕೃಷಿ ಕಾರ್ಮಿಕರು' },
    nav_labour_sub: { en: 'Local Hands', kn: 'ಕಾರ್ಮಿಕ ಸೇವೆ' },
    nav_gear_main: { en: 'Farm Gear', kn: 'ಕೃಷಿ ಉಪಕರಣ' },
    nav_gear_sub: { en: 'Rent & Buy', kn: 'ಬಾಡಿಗೆ ಮತ್ತು ಖರೀದಿ' },
    btn_logout: { en: 'Log out', kn: 'ಲಾಗ್ ಔಟ್' },
    edit_details: { en: 'Click name to edit details', kn: 'ವಿವರ ಬದಲಿಸಲು ಹೆಸರು ಕ್ಲಿಕ್ ಮಾಡಿ' },

    // Dashboard Home Content
    greeting_fmt: { en: 'Namaste, {name} 🙏', kn: 'ನಮಸ್ಕಾರ, {name} 🙏' },
    farm_simplified: { en: 'Your farm, simplified.', kn: 'ನಿಮ್ಮ ಕೃಷಿ, ಇನ್ನಷ್ಟು ಸುಲಭ ಮತ್ತು ಲಾಭದಾಯಕ.' },
    stat_my_pools: { en: 'My pools', kn: 'ನನ್ನ ಪೂಲ್‌ಗಳು' },
    stat_qty_pooled: { en: 'Quintals pooled', kn: 'ಒಟ್ಟು ಕ್ವಿಂಟಾಲ್‌ಗಳು' },
    stat_offers_out: { en: 'Offers out', kn: 'ಕಳುಹಿಸಿದ ಕೊಡುಗೆಗಳು' },
    tile_pools_desc: {
      en: 'Team up with farmers growing the same crop, agree on one price and sell straight to processors & wholesalers — no middleman.',
      kn: 'ಒಂದೇ ಬೆಳೆ ಬೆಳೆಯುವ ರೈತರೊಂದಿಗೆ ಒಟ್ಟುಗೂಡಿ, ಒಂದು ಬೆಲೆ ಒಪ್ಪಿ ನೇರವಾಗಿ ಗಿರಣಿಗಳಿಗೆ ಮಾರಾಟ ಮಾಡಿ — ದಲ್ಲಾಳಿಗಳಿಲ್ಲ.'
    },
    tile_labour_desc: {
      en: 'Short of hands? Hire skilled workers nearby for ploughing, weeding, spraying & more — or list your own services and set your pay.',
      kn: 'ಕೆಲಸಕ್ಕೆ ಆಳುಗಳು ಬೇಕೇ? ಬಿತ್ತನೆ, ಕಳೆ ಕೀಳುವಿಕೆ, ಸಿಂಪರಣೆಗೆ ಸಮೀಪದ ನುರಿತ ಕಾರ್ಮಿಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
    },
    tile_gear_desc: {
      en: 'Rent or buy tractors, power tillers, sprayers, ploughs & tools from farmers nearby — or earn by renting out your idle equipment.',
      kn: 'ಟ್ರಾಕ್ಟರ್, ರೋಟಾವೇಟರ್, ಸಿಂಪಡಕ ಯಂತ್ರಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ ಅಥವಾ ನಿಮ್ಮ ಸಲಕರಣೆಗಳನ್ನು ಬಾಡಿಗೆಗೆ ನೀಡಿ ಸಂಪಾದಿಸಿ.'
    },
    tile_open: { en: 'Open →', kn: 'ತೆರೆಯಿರಿ →' },
    profile_title: { en: '🧑‍🌾 Verified Registration Details', kn: '🧑‍🌾 ಅಧಿಕೃತ ರೈತ ನೋಂದಣಿ ವಿವರಗಳು' },
    profile_sub: { en: 'Click your name or the button to update your registered information.', kn: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲು ಹೆಸರು ಅಥವಾ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.' },
    btn_change_details: { en: '✏️ Change Registration Details', kn: '✏️ ನೋಂದಣಿ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ' },
    btn_new_pool: { en: '+ New Pool', kn: '+ ಹೊಸ ಪೂಲ್' }
  };

  let current = localStorage.getItem('ks_lang') || localStorage.getItem('hc_lang') || 'en';
  if (current !== 'en' && current !== 'kn') current = 'en';

  function getLang() { return current; }

  function t(key, params) {
    const entry = DICT[key];
    if (!entry) return key;
    let text = entry[current] || entry.en || key;
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
      }
    }
    return text;
  }

  function setLang(code) {
    if (!LANGS.some((l) => l.code === code)) code = 'en';
    current = code;
    localStorage.setItem('ks_lang', code);
    localStorage.setItem('hc_lang', code);
    if (document.documentElement) document.documentElement.lang = code;
    applyPage(document);
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  }

  function applyPage(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (val) {
        if (val.includes('<') && val.includes('>')) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    root.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.dataset.i18nPh;
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    root.querySelectorAll('.lang-picker-select, #lang-picker, #top-lang-select').forEach((sel) => {
      sel.value = current;
    });
  }

  function selectorHtml(extraClass = '') {
    return `
      <div class="lang-selector ${extraClass}" aria-label="Select language / ಭಾಷೆ ಆಯ್ಕೆ">
        <span class="lang-icon" aria-hidden="true">🌐</span>
        <select class="lang-picker-select" aria-label="Preferred Language">
          ${LANGS.map((l) => `<option value="${l.code}" ${l.code === current ? 'selected' : ''}>${l.label} (${l.sub})</option>`).join('')}
        </select>
      </div>
    `;
  }

  function attachPicker(root = document) {
    root.querySelectorAll('.lang-picker-select, #lang-picker, #top-lang-select').forEach((picker) => {
      picker.value = current;
      picker.onchange = (e) => setLang(e.target.value);
    });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.documentElement) document.documentElement.lang = current;
      applyPage(document);
      attachPicker(document);
    });
  }

  return { LANGS, getLang, setLang, t, applyPage, selectorHtml, attachPicker, attachPickers: attachPicker };
})();
