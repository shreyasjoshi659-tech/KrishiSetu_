/* KrishiSetu – Crop Pools Module
   Collective harvest pooling, price suggestion & voting, group chat, and mill buyer outreach */
window.Pools = (() => {
  const K = () => window.KS;
  const esc = (s) => K().esc(s);

  const STATES = [
    'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh',
    'Gujarat', 'Rajasthan', 'Karnataka', 'Andhra Pradesh', 'Telangana',
    'Bihar', 'Chhattisgarh', 'Odisha', 'Tamil Nadu', 'West Bengal',
    'Assam', 'Himachal Pradesh', 'Jharkhand', 'Kerala', 'Uttarakhand', 'Other'
  ];

  const CROPS = [
    'गेहूं (Wheat)', 'धान / चावल (Paddy/Rice)', 'कपास (Cotton)', 'सोयाबीन (Soybean)',
    'चना / दालें (Gram/Pulses)', 'मक्का (Maize)', 'गन्ना (Sugarcane)', 'सरसों (Mustard)',
    'प्याज (Onion)', 'आलू (Potato)', 'बाजरा / ज्वार (Millets)', 'मूंगफली (Groundnut)', 'सब्जियां (Vegetables)'
  ];

  const STATUS = {
    open: ['सदस्य जुड़ रहे हैं · Open to Join', 'st-open'],
    negotiating: ['मूल्य पर मतदान जारी · Voting on Price', 'st-neg'],
    price_agreed: ['सर्वसम्मति से भाव तय · Price Agreed', 'st-agreed'],
    quote_sent: ['मिलों को प्रस्ताव भेजा · Offer Sent', 'st-sent'],
    responded: ['खरीदार का उत्तर प्राप्त · Buyer Responded', 'st-resp'],
    closed: ['समूह समाप्त · Closed', 'st-closed']
  };

  const badge = (s) => `<span class="badge ${(STATUS[s] || ['सक्रिय', 'st-open'])[1]}">${(STATUS[s] || ['सक्रिय', 'st-open'])[0]}</span>`;
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
      <div class="pc-top">
        <span class="pc-emoji" aria-hidden="true">🌾</span>
        <div>
          <h3>${esc(p.name)}</h3>
          <small>${esc(p.crop)}${p.variety ? ' · ' + esc(p.variety) : ''}</small>
        </div>
      </div>
      <div class="pc-stats">
        <div><b>${p.totalQuantity}</b><small>क्विंटल (qtl)</small></div>
        <div><b>${p.memberCount}</b><small>किसान (farmers)</small></div>
        <div><b>${fmtDate(p.harvestDate).replace(/ \d{4}$/, '')}</b><small>कटाई (harvest)</small></div>
      </div>
      <div class="pc-foot">
        <span>📍 ${esc([p.district, p.state].filter(Boolean).join(', '))}</span>
        ${badge(p.status)}
      </div>
    </a>`;
  }

  // ================= LIST =================
  async function list(root) {
    let tab = 'discover';
    root.innerHTML = `
      <div class="demo-banner">
        <span>⚠️</span>
        <div>
          <strong>डेमो समूह सूची (Sample Demo Pools):</strong>
          <span>नीचे दिए गए समूह किसान उत्पादक समूहों के सामूहिक मूल्य व विपणन परीक्षण हेतु प्रदर्शित हैं।</span>
        </div>
      </div>

      <header class="topbar">
        <div>
          <h1>फसल समूह (Farmer Crop Pools) 🌾</h1>
          <p>उपज जोड़ें · सर्वसम्मति से न्यूनतम भाव तय करें · सीधे मिलों को बेचें</p>
        </div>
        <a class="btn" href="#/pools/new" id="new-pool">+ नया समूह बनाएं · Create Pool</a>
      </header>

      <div class="joinbar">
        <input id="join-code" placeholder="आमंत्रण लिंक या 6-अक्षर का पूल कोड यहाँ दर्ज करें (e.g. 4B7LG6)" autocomplete="off" />
        <button class="btn ghost" id="join-go">समूह से जुड़ें · Join</button>
      </div>

      <div class="seg" id="seg">
        <button data-t="discover" class="on">खुले समूह खोजें · Discover</button>
        <button data-t="mine">मेरे समूह · My Pools</button>
      </div>

      <div class="filters" id="filters">
        <select id="f-crop">
          <option value="">सभी फसलें (All crops)</option>
          ${CROPS.map((c) => `<option value="${c.split(' ')[0]}">${c}</option>`).join('')}
        </select>
        <select id="f-state">
          <option value="">सभी राज्य (All states)</option>
          ${STATES.map((s) => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>

      <section class="pgrid" id="grid"><div class="muted">लोड हो रहा है… Loading pools</div></section>
    `;
    const $ = (s) => root.querySelector(s);

    async function load() {
      const q = tab === 'mine'
        ? '?scope=mine'
        : `?scope=discover&crop=${encodeURIComponent($('#f-crop').value)}&state=${encodeURIComponent($('#f-state').value)}`;
      try {
        const { pools } = await K().api('/pools' + q);
        $('#grid').innerHTML = pools.length
          ? pools.map(poolCard).join('')
          : `<div class="empty">
               <div>🌾</div>
               <h3>${tab === 'mine' ? 'आप अभी किसी फसल समूह में नहीं हैं' : 'कोई खुला समूह नहीं मिला'}</h3>
               <p>${tab === 'mine' ? 'अपनी फसल के लिए एक नया समूह बनाएं या किसी अन्य किसान का आमंत्रण कोड डालें।' : 'अन्य फ़िल्टर आज़माएं या अपने गाँव के लिए नया समूह बनाएं।'}</p>
               <a class="btn sm" href="#/pools/new">+ नया समूह बनाएं</a>
             </div>`;
      } catch (e) {
        $('#grid').innerHTML = `<div class="muted">${esc(e.message)}</div>`;
      }
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
      if (!m) return K().toast('मान्य 6-अक्षरों का कोड दर्ज करें', 'err');
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
      <header class="topbar">
        <div>
          <h1>नया फसल समूह बनाएं 🌾</h1>
          <p>फसल की सामूहिक बिक्री हेतु किसानों का सहकारी पूल</p>
        </div>
        <a class="btn ghost sm" href="#/pools">← वापस · Back</a>
      </header>

      <form class="formcard" id="cf" novalidate>
        <div class="row">
          <div class="field">
            <label>फसल चुनें · Crop Name</label>
            <input id="c-crop" list="crop-list" placeholder="उदा. गेहूं / Wheat" required />
            <datalist id="crop-list">
              ${CROPS.map((c) => `<option value="${c.split(' ')[0]}">${c}</option>`).join('')}
            </datalist>
          </div>
          <div class="field">
            <label>किस्म · Variety (Optional)</label>
            <input id="c-var" placeholder="उदा. शरबती (Sharbati) / लोकवन" />
          </div>
        </div>

        <div class="field">
          <label>समूह का नाम · Pool Name</label>
          <input id="c-name" placeholder="उदा. सीहोर शरबती गेहूं उत्पादक समूह" maxlength="80" required />
        </div>

        <div class="row">
          <div class="field">
            <label>आपकी फसल मात्रा (क्विंटल में) · Your Quantity (qtl)</label>
            <input id="c-qty" type="number" min="1" step="any" placeholder="उदा. 40" required />
          </div>
          <div class="field">
            <label>अपेक्षित कटाई/तैयार तिथि · Expected Harvest</label>
            <input id="c-date" type="date" min="${today}" required />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label>राज्य · State</label>
            <select id="c-state">
              ${STATES.map((s) => `<option value="${s}" ${s === u.state ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>जिला / मंडी · District / Tehsil</label>
            <input id="c-dist" placeholder="उदा. सीहोर (Sehore)" value="${esc(u.village || '')}" />
          </div>
        </div>

        <div class="field">
          <label>खरीदारों के लिए गुणवत्ता व विवरण · Quality & Terms (Optional)</label>
          <textarea id="c-desc" rows="2" maxlength="500" placeholder="नमी 12% से कम, ग्रेड A, खेत से लोडिंग, न्यूनतम 50 क्विंटल लॉट…"></textarea>
        </div>

        <div class="field">
          <label>समूह की दृश्यता · Visibility</label>
          <div class="seg" id="vis">
            <button type="button" data-v="public" class="on">🌐 सार्वजनिक (Public) – डिस्कवर में दिखेगा</button>
            <button type="button" data-v="private">🔒 निजी (Private) – केवल आमंत्रण लिंक द्वारा</button>
          </div>
        </div>

        <div class="error" id="c-err" role="alert"></div>
        <button class="btn" type="submit">समूह बनाएं एवं आमंत्रण कोड पाएं · Create Pool</button>
      </form>
    `;

    const $ = (s) => root.querySelector(s);
    let vis = 'public';
    $('#vis').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      vis = b.dataset.v;
      root.querySelectorAll('#vis button').forEach((x) => x.classList.toggle('on', x === b));
    });

    $('#c-crop').addEventListener('blur', () => {
      if (!$('#c-name').value && $('#c-crop').value) {
        $('#c-name').value = `${$('#c-dist').value || u.state} ${$('#c-crop').value} समूह`;
      }
    });

    $('#cf').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#cf button[type=submit]');
      btn.disabled = true;
      $('#c-err').textContent = '';
      try {
        const p = await K().api('/pools', {
          method: 'POST',
          body: {
            crop: $('#c-crop').value,
            variety: $('#c-var').value,
            name: $('#c-name').value,
            quantity: $('#c-qty').value,
            harvestDate: $('#c-date').value,
            state: $('#c-state').value,
            district: $('#c-dist').value,
            description: $('#c-desc').value,
            visibility: vis
          }
        });
        K().toast('फसल समूह सफलतापूर्वक बना 🎉');
        K().go('#/pool/' + p.id);
        setTimeout(() => inviteModal(p), 400);
      } catch (err) {
        $('#c-err').textContent = err.message;
        btn.disabled = false;
      }
    });
  }

  // ================= JOIN VIA INVITE =================
  async function join(root, code) {
    root.innerHTML = '<div class="muted">आमंत्रण खोला जा रहा है… Opening invite</div>';
    let pool;
    try {
      pool = (await K().api('/invite/' + code)).pool;
    } catch (e) {
      root.innerHTML = `<div class="empty"><div>⚠️</div><h3>${esc(e.message)}</h3><a class="btn sm" href="/app#/pools">समूहों पर जाएं</a></div>`;
      return;
    }
    const chk = await K().api('/pools/' + pool.id);
    if (chk.isMember) return location.replace('/app#/pool/' + pool.id);
    root.innerHTML = joinCard(pool, true);
    root.querySelector('#jf')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button'); btn.disabled = true;
      try {
        await K().api(`/pools/${pool.id}/join`, { method: 'POST', body: { quantity: root.querySelector('#j-qty').value, code } });
        K().toast('आप समूह में जुड़ गए हैं 🎉');
        location.replace('/app#/pool/' + pool.id);
      } catch (err) {
        root.querySelector('#j-err').textContent = err.message;
        btn.disabled = false;
      }
    });
  }

  function joinCard(p, invited) {
    const open = ['open', 'negotiating'].includes(p.status);
    return `<div class="joincard">
      <div class="badge ${STATUS[p.status] ? STATUS[p.status][1] : 'st-open'}" style="align-self:flex-start;">
        ${STATUS[p.status] ? STATUS[p.status][0] : 'Open'}
      </div>
      <p class="muted" style="font-size:0.85rem;">${invited ? `समूह समन्वयक <b>${esc(p.creatorName)}</b> ने आपको आमंत्रित किया है` : 'किसान उत्पादक समूह'}</p>
      <h2 style="font-size:1.45rem;">${esc(p.name)}</h2>
      <div class="pc-stats">
        <div><b>${p.totalQuantity}</b><small>क्विंटल (qtl)</small></div>
        <div><b>${p.memberCount}</b><small>किसान (farmers)</small></div>
        <div><b>${fmtDate(p.harvestDate)}</b><small>कटाई (harvest)</small></div>
      </div>
      <p style="font-size:0.9rem;">🌾 ${esc(p.crop)}${p.variety ? ' · ' + esc(p.variety) : ''} · 📍 ${esc([p.district, p.state].filter(Boolean).join(', '))}</p>
      ${p.description ? `<p class="muted" style="font-size:0.85rem;">${esc(p.description)}</p>` : ''}
      ${open ? `
        <form id="jf" style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
          <div class="field">
            <label>आप कितनी मात्रा (क्विंटल) जोड़ेंगे? · Your Quantity (qtl)</label>
            <input id="j-qty" type="number" min="1" step="any" placeholder="उदा. 25" required />
          </div>
          <div class="error" id="j-err"></div>
          <button class="btn">समूह में शामिल हों · Join Pool</button>
        </form>
      ` : '<p class="muted" style="padding:8px; background:var(--bg-surface); border-radius:6px;">यह समूह अब नए किसानों के लिए बंद है।</p>'}
      <a class="link" href="/app#/pools">← वापस जाएं · Back to pools</a>
    </div>`;
  }

  function inviteModal(p) {
    const link = inviteLink(p.code);
    const text = `राम-राम, मैंने कृषि सेतु पर "${p.name}" फसल समूह बनाया है। आइए हमारी ${p.crop} एक साथ अच्छे तय भाव पर बेचें: ${link}`;
    const m = modal(`
      <h3>किसानों को आमंत्रित करें 🔗</h3>
      <p class="muted" style="font-size:0.88rem;">अपने गाँव के किसानों को यह लिंक भेजें। केवल पंजीकृत किसान ही जुड़ सकते हैं:</p>
      <div class="copybox">
        <input readonly value="${esc(link)}" id="inv-link" />
        <button class="btn sm" id="inv-copy">कॉपी करें</button>
      </div>
      <p style="font-size:0.88rem; color:var(--text-muted); margin:4px 0;">समूह कोड / Pool Code: <b class="code">${esc(p.code)}</b></p>
      <div class="share">
        <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">WhatsApp पर भेजें</a>
        <a class="btn ghost sm" href="sms:?body=${encodeURIComponent(text)}">SMS</a>
      </div>
      <button class="btn ghost sm full" data-close>पूर्ण · Close</button>
    `);
    m.el.querySelector('#inv-copy').onclick = async () => {
      try { await navigator.clipboard.writeText(link); }
      catch { m.el.querySelector('#inv-link').select(); document.execCommand('copy'); }
      K().toast('लिंक कॉपी हो गया ✓');
    };
  }

  // ================= DETAIL (Cooperative Chat & Buyer Outreach) =================
  async function detail(root, id) {
    let pool;
    try {
      const r = await K().api('/pools/' + id);
      if (!r.isMember) {
        root.innerHTML = joinCard(r.pool, false);
        wireJoin(root, r.pool);
        return;
      }
      pool = r;
    } catch (e) {
      root.innerHTML = `<div class="empty"><div>⚠️</div><h3>${esc(e.message)}</h3><a class="btn sm" href="#/pools">वापस</a></div>`;
      return;
    }

    const me = K().user.id;
    const isCoord = () => pool.creatorId === me;
    const mail = await K().api('/mail/status').catch(() => ({ mode: 'test', inbound: false }));

    root.innerHTML = `
      <div class="demo-banner">
        <span>⚠️</span>
        <div>
          <strong>डेमो समूह विवरण (Cooperative Simulator):</strong>
          <span>समूह में दिए गए मूल्य प्रस्ताव, वोटिंग और खरीदार संदेश परीक्षण वातावरण में चलते हैं।</span>
        </div>
      </div>

      <div id="pdw">
        <div class="pd-head" id="pd-head"></div>
        <div class="seg pd-tabs" id="pd-tabs">
          <button data-t="chat" class="on">💬 चर्चा व भाव तय करना (Chat & Price)</button>
          <button data-t="side">👥 सदस्य व खरीदार (Members & Buyers)</button>
        </div>
        <div class="pd-layout" data-tab="chat">
          <section class="pd-chat pane">
            <div class="pricebar" id="pricebar"></div>
            <div class="msgs" id="msgs"></div>
            <div class="composer">
              <div class="proposebar" id="proposebar" hidden>
                <span>₹</span>
                <input id="pp-price" type="number" min="1" step="any" placeholder="प्रस्तावित दर / क्विंटल (e.g. 2450)" />
                <button class="btn sm" id="pp-send">प्रस्ताव भेजें</button>
              </div>
              <form id="msg-form">
                <button type="button" class="iconbtn" id="pp-toggle" title="न्यूनतम मूल्य का प्रस्ताव रखें">💰</button>
                <input id="msg-in" placeholder="समूह के किसानों को संदेश लिखें…" autocomplete="off" maxlength="1000" />
                <button class="btn sm" aria-label="Send">भेजें ➤</button>
              </form>
            </div>
          </section>

          <aside class="pd-side pane">
            <div id="members"></div>
            <div id="buyers"></div>
          </aside>
        </div>
      </div>
    `;

    const $ = (s) => root.querySelector(s);
    const wrap = $('#pdw');
    const layout = $('.pd-layout');

    function renderHead() {
      $('#pd-head').innerHTML = `
        <a class="back" href="#/pools">← सभी फसल समूह · All Pools</a>
        <div class="hd-main">
          <span class="pc-emoji big" aria-hidden="true">🌾</span>
          <div>
            <h1>${esc(pool.name)}</h1>
            <p>🌾 ${esc(pool.crop)}${pool.variety ? ' · ' + esc(pool.variety) : ''} · 📍 ${esc([pool.district, pool.state].filter(Boolean).join(', '))} · 🗓 कटाई: ${fmtDate(pool.harvestDate)}</p>
          </div>
        </div>
        <div class="hd-meta">
          ${badge(pool.status)}
          <span class="chipx">कुल: <b>${pool.totalQuantity}</b> क्विंटल</span>
          <span class="chipx">सदस्य: <b>${pool.members.length}</b> किसान</span>
          <button class="btn sm ghost" id="btn-invite">🔗 किसान जोड़ें · Invite</button>
        </div>
      `;
    }

    function renderPrice() {
      const prop = pool.messages.find((m) => m.id === pool.activeProposalId);
      $('#pricebar').innerHTML = pool.agreedPrice
        ? `<div class="pb-ok">
             ✅ <b>सर्वसम्मति से स्वीकृत न्यूनतम भाव: ${money(pool.agreedPrice)} /क्विंटल</b>
             <small style="color:var(--text-muted); display:inline-block; margin-left:8px;">
               (समूह की कुल उपज: ${money(pool.agreedPrice * pool.totalQuantity)})
             </small>
           </div>`
        : prop
        ? `<div class="pb-wait">
             ⏳ <b>मूल्य मतदान जारी: ${money(prop.price)} /क्विंटल</b> —
             ${Object.values(prop.votes).filter((v) => v === true).length}/${pool.members.length} किसानों ने सहमति दी
           </div>`
        : `<div class="pb-none">
             💡 <b>कोई मूल्य तय नहीं है।</b> नीचे 💰 बटन दबाकर न्यूनतम विक्रय भाव प्रस्तावित करें — सभी सदस्यों की सहमति आवश्यक है।
           </div>`;
    }

    function msgHtml(m) {
      if (m.type === 'system') {
        return `<div class="m-sys">${esc(m.text)}</div>`;
      }
      if (m.type === 'buyer_response') {
        return `<div class="m-buyer">
          <div class="mb-h">📩 खरीदार प्रतिक्रिया / Buyer Counter-Offer</div>
          <div class="mb-b">${esc(m.text.replace(/^📩 /, ''))}</div>
          <small>${fmtTime(m.at)}</small>
        </div>`;
      }
      const mine = m.userId === me;
      if (m.type === 'proposal') {
        const yes = pool.members.filter((x) => m.votes[x.userId] === true);
        const no = pool.members.filter((x) => m.votes[x.userId] === false);
        const myVote = m.votes[me];
        return `<div class="m-prop ${m.status}">
          <div class="mp-h">⚖️ ${esc(m.name)} द्वारा प्रस्तावित न्यूनतम दर:</div>
          <div class="mp-price">${money(m.price)}<small> /क्विंटल</small></div>
          <div class="mp-bar"><i style="width:${(yes.length / pool.members.length) * 100}%"></i></div>
          <div class="mp-v">
            ${yes.length}/${pool.members.length} किसानों की सहमति
            ${no.length ? ` · अस्वीकृत: ${no.map((x) => esc(x.name.split(' ')[0])).join(', ')}` : ''}
          </div>
          ${m.status === 'active' ? `
            <div class="mp-act">
              <button class="btn sm ${myVote === true ? 'sel' : ''}" data-vote="${m.id}" data-a="1">
                ${myVote === true ? '✓ स्वीकृत' : '👍 मैं सहमत हूँ'}
              </button>
              <button class="btn sm ghost ${myVote === false ? 'selno' : ''}" data-vote="${m.id}" data-a="0">
                👎 अस्वीकार
              </button>
            </div>
          ` : `
            <div class="mp-state">${m.status === 'accepted' ? '✅ सभी किसानों द्वारा स्वीकृत' : 'पुराना प्रस्ताव'}</div>
          `}
          <small>${fmtTime(m.at)}</small>
        </div>`;
      }
      return `<div class="m ${mine ? 'me' : ''}">
        ${mine ? '' : `<b class="m-name">${esc(m.name)}</b>`}
        <div>${esc(m.text).replace(/\n/g, '<br>')}</div>
        <small>${fmtTime(m.at)}</small>
      </div>`;
    }

    function renderMsgs() {
      const box = $('#msgs');
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      box.innerHTML = pool.messages.map(msgHtml).join('');
      if (near || !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = 1; }
    }

    function renderMembers() {
      $('#members').innerHTML = `
        <div class="panel-card">
          <h3>समूह के किसान सदस्य · Farmers (${pool.members.length})</h3>
          ${pool.members.map((m) => `
            <div class="mrow">
              <div class="avatar sm">${esc((m.name || '?')[0])}</div>
              <div class="mi">
                <b>${esc(m.name)}${m.isCreator ? ' <span class="crown">समन्वयक (Coordinator)</span>' : ''}</b>
                <small>${esc([m.village, m.state].filter(Boolean).join(', '))} · <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a></small>
              </div>
              <div class="mq">${m.quantity}<small>क्विंटल</small></div>
            </div>
          `).join('')}
          <div class="mtotal">
            <span>कुल सामूहिक उपज:</span>
            <b>${pool.totalQuantity} क्विंटल</b>
          </div>
          <div class="pa" style="margin-top:6px;">
            ${!isCoord() && ['open', 'negotiating'].includes(pool.status) ? '<button class="btn ghost sm selno" id="btn-leave">समूह छोड़ें</button>' : ''}
            ${isCoord() && pool.status !== 'closed' ? '<button class="btn ghost sm" id="btn-close">समूह बंद करें</button>' : ''}
          </div>
        </div>
      `;
    }

    function renderBuyers() {
      const thread = [...pool.emails].reverse().map((e) => `
        <div class="mail ${e.direction}">
          <div class="mail-h">
            <b>${e.direction === 'out' ? '📤 भेजा गया:' : '📩 प्राप्त उत्तर:'} ${esc(e.name)}</b>
            <small>${fmtDate(e.at)} ${fmtTime(e.at)}</small>
          </div>
          ${e.email ? `<small class="muted">${esc(e.email)}</small>` : ''}
          <div class="mail-b">${e.direction === 'out' ? esc(e.subject) : esc(e.body).replace(/\n/g, '<br>')}</div>
          ${e.previewUrl ? `<a class="link" target="_blank" rel="noopener" href="${esc(e.previewUrl)}">टेस्ट ईमेल देखें ↗ (Simulation Inbox)</a>` : ''}
        </div>
      `).join('');

      let form;
      if (pool.status === 'closed') {
        form = '<p class="muted">समूह बंद हो चुका है।</p>';
      } else if (!isCoord()) {
        form = `<p class="muted" style="font-size:0.86rem;">समूह समन्वयक (${esc(pool.members.find(m => m.isCreator)?.name || 'Coordinator')}) मिलों और खरीदारों से संवाद करते हैं और प्राप्त प्रतिक्रिया यहाँ साझा करते हैं।</p>`;
      } else if (!pool.agreedPrice) {
        form = `<p class="locked">🔒 <b>पहले चैट में न्यूनतम भाव तय करें।</b> जब सभी सदस्य एक भाव पर सहमत हो जाएंगे, तब आप आटा/दाल मिलों को समूह का ऑफ़र भेज सकेंगे।</p>`;
      } else {
        form = `
          <form id="of">
            <div class="row">
              <div class="field">
                <label>कंपनी / प्रसंस्करण मिल का नाम · Company</label>
                <input id="o-name" required placeholder="उदा. शर्मा एग्रो फूड्स / Sharma Agro Mills" />
              </div>
              <div class="field">
                <label>खरीदार का ईमेल · Procurement Email</label>
                <input id="o-email" type="email" required placeholder="procurement@agromill.com" />
              </div>
            </div>
            <div class="field">
              <label>समन्वयक का विशेष संदेश · Note (Optional)</label>
              <textarea id="o-note" rows="2" maxlength="1000" placeholder="खेत से लोडिंग, मानक 12% नमी, तत्काल उठाव की शर्त…"></textarea>
            </div>
            <div class="error" id="o-err"></div>
            <button class="btn full">ऑफ़र की समीक्षा करें और भेजें · Review & Send</button>
          </form>
          <details class="manual">
            <summary>खरीदार ने फोन या व्हाट्सएप पर बात की? यहाँ दर्ज करें (Log Response)</summary>
            <form id="rf">
              <input id="r-name" placeholder="खरीदार / मिल प्रतिनिधि का नाम" required />
              <textarea id="r-body" rows="2" placeholder="उन्होंने क्या भाव या शर्तें दीं?" required></textarea>
              <button class="btn ghost sm">समूह में साझा करें</button>
            </form>
          </details>
        `;
      }

      const notice = mail.mode === 'test'
        ? '<div class="note warn">⚠️ <b>सिमुलेशन मोड (Test Mode):</b> ईमेल पूर्वावलोकन इनबॉक्स में जाएंगे, वास्तविक व्यावसायिक इनबॉक्स में नहीं।</div>'
        : '';

      $('#buyers').innerHTML = `
        <div class="panel-card">
          <h3>📬 मिल व थोक खरीदार संपर्क <small class="muted">(${pool.emails.filter((e) => e.direction === 'out').length} संपर्क किए)</small></h3>
          ${isCoord() ? notice : ''}
          ${form}
          <div class="thread" style="margin-top:10px;">${thread || '<p class="muted" style="font-size:0.84rem;">अभी तक किसी खरीदार को कोटेशन नहीं भेजा गया।</p>'}</div>
        </div>
      `;
    }

    const renderAll = () => { renderHead(); renderPrice(); renderMsgs(); renderMembers(); renderBuyers(); };
    renderAll();

    // SSE Realtime synchronization
    const es = new EventSource(`/api/pools/${id}/stream?token=${K().token}`);
    es.addEventListener('pool', (e) => {
      const keep = { name: $('#o-name')?.value, email: $('#o-email')?.value, note: $('#o-note')?.value };
      pool = JSON.parse(e.data);
      renderHead(); renderPrice(); renderMsgs(); renderMembers();
      if (!document.activeElement?.closest('#buyers')) {
        renderBuyers();
        if (keep.name) { $('#o-name').value = keep.name; $('#o-email').value = keep.email; $('#o-note').value = keep.note; }
      }
    });

    const act = async (fn, okMsg) => {
      try {
        await fn();
        if (okMsg) K().toast(okMsg);
      } catch (e) {
        K().toast(e.message, 'err');
      }
    };
    const call = (path, body) => K().api(`/pools/${id}${path}`, { method: 'POST', body });

    wrap.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#pd-tabs button')) {
        const b = t.closest('#pd-tabs button');
        layout.dataset.tab = b.dataset.t;
        root.querySelectorAll('#pd-tabs button').forEach((x) => x.classList.toggle('on', x === b));
      }
      if (t.closest('#btn-invite')) inviteModal(pool);
      if (t.closest('#pp-toggle')) {
        const b = $('#proposebar');
        b.hidden = !b.hidden;
        if (!b.hidden) $('#pp-price').focus();
      }
      if (t.closest('#pp-send')) act(async () => {
        await call('/proposals', { price: $('#pp-price').value });
        $('#pp-price').value = '';
        $('#proposebar').hidden = true;
      }, 'मूल्य प्रस्ताव भेजा गया');
      const v = t.closest('[data-vote]');
      if (v) act(() => call(`/proposals/${v.dataset.vote}/vote`, { accept: v.dataset.a === '1' }), 'आपका मत दर्ज हुआ');
      if (t.closest('#btn-leave') && confirm('क्या आप इस फसल समूह को छोड़ना चाहते हैं?')) {
        act(async () => { await call('/leave'); K().go('#/pools'); }, 'आप समूह से बाहर हो गए हैं');
      }
      if (t.closest('#btn-close') && confirm('क्या आप इस समूह को हमेशा के लिए बंद करना चाहते हैं?')) {
        act(() => call('/close'), 'समूह बंद किया गया');
      }
      if (t.closest('#btn-check')) act(async () => {
        const r = await call('/check-replies');
        K().toast(r.newReplies ? `${r.newReplies} नए उत्तर प्राप्त हुए` : 'कोई नया संदेश नहीं');
      });
    });

    $('#msg-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#msg-in');
      const text = i.value.trim();
      if (!text) return;
      i.value = '';
      act(() => call('/messages', { text }));
    });
    $('#pp-price').addEventListener('keydown', (e) => e.key === 'Enter' && $('#pp-send').click());

    wrap.addEventListener('submit', (e) => {
      if (e.target.id === 'of') {
        e.preventDefault();
        const body = { buyerName: $('#o-name').value, buyerEmail: $('#o-email').value, note: $('#o-note').value };
        K().api(`/pools/${id}/outreach/preview`, { method: 'POST', body }).then((p) => {
          const m = modal(`
            <h3>ईमेल ऑफ़र समीक्षा (Quotation Preview)</h3>
            <p class="muted" style="font-size:0.86rem;">यह आधिकारिक कोटेशन आपके समूह की ओर से खरीदार को भेजा जाएगा:</p>
            <div style="background:var(--bg-surface); padding:12px; border-radius:8px; border:1px solid var(--border); font-size:0.85rem; display:flex; flex-direction:column; gap:6px;">
              <div><b>To:</b> ${esc(p.to)}</div>
              <div><b>Subject:</b> ${esc(p.subject)}</div>
              <pre style="white-space:pre-wrap; max-height:220px; overflow-y:auto; color:var(--text-muted); padding-top:6px; border-top:1px solid var(--border);">${esc(p.text)}</pre>
            </div>
            <div class="share" style="margin-top:6px;">
              <button class="btn" id="go-send">खरीदार को भेजें · Send Email</button>
              <button class="btn ghost sm" data-close>संशोधन करें · Edit</button>
            </div>
          `);
          m.el.querySelector('#go-send').onclick = async (ev) => {
            ev.target.disabled = true;
            ev.target.textContent = 'भेज रहे हैं… Sending';
            try {
              await call('/outreach', body);
              m.close();
              K().toast('ऑफ़र ईमेल भेज दिया गया 📧');
            } catch (err) {
              K().toast(err.message, 'err');
              ev.target.disabled = false;
              ev.target.textContent = 'खरीदार को भेजें';
            }
          };
        }).catch((err) => { $('#o-err').textContent = err.message; });
      }
      if (e.target.id === 'rf') {
        e.preventDefault();
        act(() => call('/responses', { buyerName: $('#r-name').value, body: $('#r-body').value }), 'खरीदार का संदेश समूह में साझा किया गया');
      }
    });

    return () => es.close();
  }

  function wireJoin(root, p) {
    root.querySelector('#jf')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await K().api(`/pools/${p.id}/join`, { method: 'POST', body: { quantity: root.querySelector('#j-qty').value } });
        K().toast('आप समूह में जुड़ गए हैं 🎉');
        location.reload();
      } catch (err) {
        root.querySelector('#j-err').textContent = err.message;
      }
    });
  }

  return { list, create, join, detail };
})();
