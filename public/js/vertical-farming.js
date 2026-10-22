window.VerticalFarming = (() => {
  const K = () => window.KS;
  const esc = (value) => K().esc(value);
  const money = (value) => '₹' + Math.round(Number(value) || 0).toLocaleString('en-IN');
  const roles = {
    'farm-operator': { label: 'Farm Operator', icon: '🌱' },
    'delivery-partner': { label: 'Delivery Partner', icon: '📦' },
  };
  const plans = [
    { id: 'greens-weekly', name: 'Weekly greens box', price: 799, quantity: '2 kg per week', produce: 'Lettuce and spinach', frequency: 'One delivery each week' },
    { id: 'farm-box', name: 'Family farm box', price: 1199, quantity: '3 kg per week', produce: 'Leafy greens and seasonal produce', frequency: 'One delivery each week' },
    { id: 'herb-box', name: 'Fresh herb box', price: 599, quantity: '4 herb packs per month', produce: 'Basil, mint, and coriander', frequency: 'One delivery each week' },
  ];
  const products = [
    { id: 'lettuce', label: 'Lettuce bundle', price: 120 },
    { id: 'spinach', label: 'Spinach bundle', price: 80 },
    { id: 'herbs', label: 'Fresh herb pack', price: 90 },
    { id: 'mixed-greens', label: 'Mixed greens box', price: 180 },
  ];
  const farms = [
    { id: 'greenleaf-urban', name: 'GreenLeaf Urban Farm', icon: '🥬', crops: 'Leafy greens · Bengaluru', detail: 'Weekly lettuce and spinach grown in a controlled environment.', price: 799 },
    { id: 'berrystack', name: 'BerryStack Farm', icon: '🍓', crops: 'Strawberries · Bengaluru', detail: 'Follow an example growing cycle and estimated harvest window.', price: 999 },
    { id: 'herbnest', name: 'HerbNest Farm', icon: '🌿', crops: 'Fresh herbs · Bengaluru', detail: 'Basil, mint, and coriander for everyday cooking.', price: 599 },
  ];

  function field(id, label, value, hint = '') {
    return `<div class="vf-field"><label for="${id}">${label}</label><input id="${id}" type="number" min="0" step="any" value="${value}" inputmode="decimal" aria-describedby="${hint ? id + '-hint' : ''}">${hint ? `<small class="vf-muted" id="${id}-hint">${hint}</small>` : ''}</div>`;
  }

  function scenario(title, prefix, initial, fields) {
    return `<fieldset class="vf-scenario"><legend>${title}</legend><div class="vf-form-grid">${fields.map(([key, label, hint]) => field(prefix + key, label, initial[key], hint)).join('')}</div></fieldset>`;
  }

  function render(root) {
    let active = true;
    const controller = new AbortController();
    const signal = controller.signal;
    const initial = {
      land: 300000, equipment: 150000, labour: 140000, water: 18000, inputs: 35000, maintenance: 20000,
      yield: 1250, cycles: 3, price: 80,
      installation: 180000, verticalEquipment: 220000, electricity: 14000, verticalWater: 1000,
      nutrients: 3500, verticalLabour: 15000, verticalMaintenance: 2500,
      verticalYield: 350, verticalCycles: 12, verticalPrice: 110,
    };

    root.innerHTML = `
      <header class="topbar"><div><h1>Vertical Farming 🌱</h1><p>Plan a growing operation, find partners, and compare the numbers with your own assumptions.</p></div></header>
      <section class="vf-hero">
        <span class="vf-kicker">🌿 KrishiSetu farm workspace</span>
        <h1>Grow locally. Plan with your own numbers.</h1>
        <p>Explore sample crop progress, connect farm operators with delivery partners, and compare traditional and vertical farming costs. Listings and plans are examples for this demo, not verified availability or business terms.</p>
      </section>
      <nav class="vf-jump" aria-label="Vertical farming sections">
        <button type="button" data-scroll-to="vf-farms">Explore Farms</button><button type="button" data-scroll-to="vf-subscription-history">Farm Subscription</button><button type="button" data-scroll-to="vf-plans">Produce plans</button><button type="button" data-scroll-to="vf-orders">Produce order</button><button type="button" data-scroll-to="vf-partners">Partner hub</button><button type="button" data-scroll-to="vf-investment">Investment comparison</button><button type="button" data-scroll-to="vf-crops">Crop progress</button><button type="button" data-scroll-to="vf-team">Farm team</button>
      </nav>

      <section class="vf-section" id="vf-farms">
        <div class="vf-section-head"><div><h2>Explore farms · Vertical farms</h2><p>These three listings, locations, crops, and prices are sample content from the original Vertical Farming page.</p></div><span class="vf-badge demo">SAMPLE FARMS</span></div>
        <div class="vf-note">A farm subscription request is only a saved demo interest. There is no verified farm availability, billing, or delivery connection.</div>
        <div class="vf-grid">
          ${farms.map((farm) => `<article class="vf-card vf-plan"><div class="vf-crop-icon" aria-hidden="true">${farm.icon}</div><span class="vf-badge demo">DEMO FARM</span><h3>${esc(farm.name)}</h3><p>${esc(farm.crops)}</p><p>${esc(farm.detail)}</p><div class="vf-plan-price">${money(farm.price)} <small>/ month · example</small></div><button class="btn" type="button" data-request-farm="${esc(farm.id)}">Request farm subscription</button></article>`).join('')}
        </div>
        <article class="vf-card" id="vf-subscription-history"><h3>Your farm subscription requests</h3><div class="vf-list" id="vf-farm-subscription-list" aria-live="polite"><p class="vf-muted">Loading your requests…</p></div></article>
      </section>

      <section class="vf-section" id="vf-plans">
        <div class="vf-section-head"><div><h2>Customer produce plans</h2><p>Example prices, quantities, produce, and delivery frequency are demo data only.</p></div><span class="vf-badge demo">DEMO PLANS</span></div>
        <div class="vf-note">These are sample offers, not confirmed KrishiSetu subscriptions. Requesting a plan below only saves a demo request to your account; it does not activate a subscription or collect payment.</div>
        <div class="vf-grid" id="vf-plan-grid"></div>
        <article class="vf-card"><h3>Your plan requests</h3><div class="vf-list" id="vf-subscription-list" aria-live="polite"><p class="vf-muted">Loading your requests…</p></div></article>
      </section>

      <section class="vf-section" id="vf-orders">
        <div class="vf-section-head"><div><h2>Order sample produce</h2><p>Submit a demo request; this does not charge you or arrange a real delivery.</p></div><span class="vf-badge demo">SAMPLE CATALOG</span></div>
        <div class="vf-grid">
          <form class="vf-form-card" id="vf-order-form">
            <h3>Sample produce order</h3><div class="vf-form-grid" style="margin-top:12px">
              <div class="vf-field"><label for="vf-product">Produce</label><select id="vf-product">${products.map((product) => `<option value="${esc(product.id)}">${esc(product.label)} — ${money(product.price)} (demo)</option>`).join('')}</select></div>
              <div class="vf-field"><label for="vf-quantity">Quantity</label><input id="vf-quantity" type="number" min="1" max="20" step="1" value="1" required></div>
            </div>
            <p class="vf-muted" id="vf-order-total" style="margin-top:10px"></p>
            <div class="vf-form-actions"><button class="btn" type="submit">Save demo order</button><span class="vf-feedback" id="vf-order-feedback" role="status"></span></div>
            <p class="vf-muted">Demo catalog and prices only. No payment, stock check, or delivery is connected.</p>
          </form>
          <article class="vf-card"><h3>Your demo order requests</h3><div class="vf-list" id="vf-order-list" aria-live="polite"><p class="vf-muted">Loading your orders…</p></div></article>
        </div>
      </section>

      <section class="vf-section" id="vf-partners">
        <div class="vf-section-head"><div><h2>Farm Partner Hub</h2><p>Separate roles for growing and delivering fresh produce.</p></div><span class="vf-badge">Onboarding · work · status</span></div>
        <div class="vf-grid">
          <article class="vf-card"><div class="vf-role-icon">🌱</div><h3>Farm Operators</h3><p>Manage crop cycles, watering, nutrients, equipment checks, and harvest progress. Operators can also post work for their farm.</p></article>
          <article class="vf-card"><div class="vf-role-icon">📦</div><h3>Delivery Partners</h3><p>Accept local harvest collection and customer hand-off work, then update each assignment from assigned to completed.</p></article>
        </div>
        <div class="vf-grid">
          <form class="vf-form-card" id="vf-partner-form">
            <h3>Join the partner directory</h3>
            <p class="vf-muted">Your profile uses your signed-in name. Your phone number and account details are not shown in the directory.</p>
            <div class="vf-form-grid" style="margin-top:12px">
              <div class="vf-field"><label for="vf-role">Partner role</label><select id="vf-role" required><option value="">Choose a role</option><option value="farm-operator">Farm Operator</option><option value="delivery-partner">Delivery Partner</option></select></div>
              <div class="vf-field"><label for="vf-location">Farm or delivery area</label><input id="vf-location" maxlength="100" required value="${esc([K().user.village, K().user.district, K().user.state].filter(Boolean).join(', '))}" placeholder="Village, district, or service area"></div>
              <div class="vf-field full"><label for="vf-skills">Relevant skills or services</label><input id="vf-skills" maxlength="240" required placeholder="For example: crop monitoring, harvesting"></div>
            </div>
            <div class="vf-form-actions"><button class="btn" type="submit">Register as partner</button><span class="vf-feedback" id="vf-partner-feedback" role="status"></span></div>
          </form>
          <article class="vf-card"><h3>Partner directory</h3><p class="vf-muted">Sample profiles are marked; registered members appear here without private contact details.</p><div class="vf-list" id="vf-partner-list" aria-live="polite"><p class="vf-muted">Loading partners…</p></div></article>
        </div>
        <div class="vf-section-head"><div><h3>Available work and assignments</h3><p>Accept work that matches your registered role, then update its status.</p></div></div>
        <form class="vf-form-card" id="vf-task-form" hidden>
          <h3>Post farm work</h3><p class="vf-muted">Only registered Farm Operators can add work. New tasks are visible to signed-in partners.</p>
          <div class="vf-form-grid" style="margin-top:12px">
            <div class="vf-field"><label for="vf-task-title">Task title</label><input id="vf-task-title" maxlength="80" required placeholder="e.g. Prepare a harvest box"></div>
            <div class="vf-field"><label for="vf-task-role">Who should do it?</label><select id="vf-task-role" required><option value="farm-operator">Farm Operator</option><option value="delivery-partner">Delivery Partner</option></select></div>
            <div class="vf-field"><label for="vf-task-location">Work location</label><input id="vf-task-location" maxlength="100" required placeholder="Village or service area"></div>
            <div class="vf-field"><label for="vf-task-date">Due date (optional)</label><input id="vf-task-date" type="date"></div>
            <div class="vf-field full"><label for="vf-task-description">What needs to be done?</label><textarea id="vf-task-description" maxlength="500" required placeholder="Include the key steps and hand-off details."></textarea></div>
          </div>
          <div class="vf-form-actions"><button class="btn" type="submit">Post work</button><span class="vf-feedback" id="vf-task-feedback" role="status"></span></div>
        </form>
        <div class="vf-grid" id="vf-task-grid" aria-live="polite"><p class="vf-muted">Loading work…</p></div>
      </section>

      <section class="vf-section" id="vf-investment">
        <div class="vf-section-head"><div><h2>Smart Farm Investment Advisor</h2><p>Compare an example traditional setup with vertical-farm equipment and operating costs.</p></div><span class="vf-badge">Edit every assumption</span></div>
        <div class="vf-note">The prefilled figures are illustrative examples, not local quotes or yield advice. Estimates use annual harvest and selling-price inputs you enter; they exclude financing, taxes, land resale value, spoilage, downtime, and price changes. This tool does not guarantee returns or recommend either option.</div>
        <div class="vf-calc-grid">
          ${scenario('Traditional farming', 't-', initial, [
            ['land', 'Land purchase or preparation · one time'], ['equipment', 'Initial farm equipment · one time'],
            ['labour', 'Labour · per year'], ['water', 'Water and irrigation · per year'],
            ['inputs', 'Seeds, nutrients, and crop inputs · per year'], ['maintenance', 'Maintenance · per year'],
            ['yield', 'Harvest per growing cycle · kg'], ['cycles', 'Growing cycles · per year'], ['price', 'Expected selling price · per kg'],
          ])}
          ${scenario('Vertical farming', 'v-', initial, [
            ['installation', 'Site installation · one time'], ['verticalEquipment', 'Growing equipment · one time'],
            ['electricity', 'Electricity · per month'], ['verticalWater', 'Water · per month'],
            ['nutrients', 'Nutrients · per month'], ['verticalLabour', 'Labour · per month'],
            ['verticalMaintenance', 'Maintenance · per month'], ['verticalYield', 'Harvest per growing cycle · kg'],
            ['verticalCycles', 'Growing cycles · per year'], ['verticalPrice', 'Expected selling price · per kg'],
          ])}
        </div>
        <div class="vf-section-head"><div><h3>Estimated annual comparison</h3><p>Calculated locally from the editable assumptions above.</p></div></div>
        <div class="vf-results" id="vf-calc-results" aria-live="polite"></div>
        <p class="vf-muted">Operating break-even price covers estimated yearly operating expenses only. Setup payback divides one-time setup costs by annual operating surplus; it is not a forecast and may be unreachable if the entered surplus is zero or negative.</p>
      </section>

      <section class="vf-section" id="vf-crops">
        <div class="vf-section-head"><div><h2>Crop progress</h2><p>Illustrative crop stages only; these are not live sensor readings.</p></div><span class="vf-badge demo">SAMPLE DATA</span></div>
        <div class="vf-grid">
          <article class="vf-card"><div class="vf-crop-icon">🥬</div><h3>Lettuce</h3><p>Demo stage · Leaf development · 18 of 30 days</p><div class="vf-progress" role="progressbar" aria-label="Lettuce sample progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><span style="width:60%"></span></div><p class="vf-muted">Example harvest estimate: 12 days remaining.</p></article>
          <article class="vf-card"><div class="vf-crop-icon">🌿</div><h3>Spinach</h3><p>Demo stage · Growing · 14 of 25 days</p><div class="vf-progress" role="progressbar" aria-label="Spinach sample progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="56"><span style="width:56%"></span></div><p class="vf-muted">Example harvest estimate: 11 days remaining.</p></article>
          <article class="vf-card"><div class="vf-crop-icon">🌱</div><h3>Basil</h3><p>Demo stage · Early growth · 10 of 28 days</p><div class="vf-progress" role="progressbar" aria-label="Basil sample progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="36"><span style="width:36%"></span></div><p class="vf-muted">Example harvest estimate: 18 days remaining.</p></article>
        </div>
        <div class="vf-section-head"><div><h3>Equipment checks</h3><p>Sample items, not connected equipment telemetry.</p></div></div>
        <div class="vf-grid">
          <article class="vf-card vf-equipment"><div class="vf-equipment-row"><span>💧 Hydroponic system</span><span class="vf-badge demo">Demo status</span></div><small>Water and nutrient delivery for soil-free crops.</small></article>
          <article class="vf-card vf-equipment"><div class="vf-equipment-row"><span>💡 Grow lights</span><span class="vf-badge demo">Demo status</span></div><small>Supplemental light for indoor growing.</small></article>
          <article class="vf-card vf-equipment"><div class="vf-equipment-row"><span>🌡️ Climate monitor</span><span class="vf-badge demo">Demo status</span></div><small>Temperature and humidity monitoring example.</small></article>
        </div>
      </section>`;

    root.insertAdjacentHTML('beforeend', `
      <section class="vf-section" id="vf-team">
        <div class="vf-section-head"><div><h2>Farm team</h2><p>Example roles from the original page; these are not real or verified staff profiles.</p></div><span class="vf-badge demo">SAMPLE ROLES</span></div>
        <div class="vf-grid">
          <article class="vf-card"><div class="vf-role-icon">👩‍🌾</div><h3>Farm manager</h3><p>Coordinates planting schedules, crop health, and harvest planning.</p></article>
          <article class="vf-card"><div class="vf-role-icon">🌱</div><h3>Crop specialist</h3><p>Tracks growth stages and recommends crop-care routines.</p></article>
          <article class="vf-card"><div class="vf-role-icon">📦</div><h3>Harvest coordinator</h3><p>Organizes packing and preparation of customer orders.</p></article>
        </div>
      </section>`);

    root.querySelector('#vf-plan-grid').innerHTML = plans.map((plan) => `
      <article class="vf-card vf-plan">
        <span class="vf-badge demo">DEMO PLAN</span><h3>${esc(plan.name)}</h3>
        <div class="vf-plan-price">${money(plan.price)} <small>/ month · example</small></div>
        <ul><li>${esc(plan.quantity)}</li><li>${esc(plan.produce)}</li><li>${esc(plan.frequency)}</li></ul>
        <button class="btn" type="button" data-request-plan="${esc(plan.id)}">Save demo request</button>
      </article>`).join('');

    function inputValue(id) {
      return Math.max(0, Number(root.querySelector('#' + id)?.value) || 0);
    }

    function scenarioResults(title, capex, revenue, expenses, annualYield) {
      const operating = revenue - expenses;
      const payback = capex === 0 ? 'No setup cost entered' : operating > 0 ? `${(capex / operating).toFixed(1)} years` : 'Not reached at these inputs';
      const breakEven = annualYield > 0 ? money(expenses / annualYield) + ' / kg' : 'Add a harvest estimate';
      return `<article class="vf-result"><h3>${title}</h3>
        <div class="vf-result-line"><span>One-time setup cost</span><strong>${money(capex)}</strong></div>
        <div class="vf-result-line"><span>Estimated annual revenue</span><strong>${money(revenue)}</strong></div>
        <div class="vf-result-line"><span>Estimated annual operating expenses</span><strong>${money(expenses)}</strong></div>
        <div class="vf-result-line"><span>Annual operating surplus</span><strong>${money(operating)}</strong></div>
        <div class="vf-result-line"><span>First-year amount after setup</span><strong>${money(operating - capex)}</strong></div>
        <div class="vf-result-line"><span>Operating break-even selling price</span><strong>${breakEven}</strong></div>
        <div class="vf-result-line"><span>Estimated setup payback</span><strong>${payback}</strong></div>
      </article>`;
    }

    function calculate() {
      const traditionalYield = inputValue('t-yield') * inputValue('t-cycles');
      const traditionalRevenue = traditionalYield * inputValue('t-price');
      const traditionalCosts = inputValue('t-labour') + inputValue('t-water') + inputValue('t-inputs') + inputValue('t-maintenance');
      const traditionalSetup = inputValue('t-land') + inputValue('t-equipment');
      const verticalYield = inputValue('v-verticalYield') * inputValue('v-verticalCycles');
      const verticalRevenue = verticalYield * inputValue('v-verticalPrice');
      const verticalCosts = 12 * (inputValue('v-electricity') + inputValue('v-verticalWater') + inputValue('v-nutrients') + inputValue('v-verticalLabour') + inputValue('v-verticalMaintenance'));
      const verticalSetup = inputValue('v-installation') + inputValue('v-verticalEquipment');
      root.querySelector('#vf-calc-results').innerHTML =
        scenarioResults('Traditional farming', traditionalSetup, traditionalRevenue, traditionalCosts, traditionalYield) +
        scenarioResults('Vertical farming', verticalSetup, verticalRevenue, verticalCosts, verticalYield);
    }

    async function refreshData() {
      const results = await Promise.allSettled([
        K().api('/farm-hub'),
        K().api('/vertical-farming/subscriptions'),
        K().api('/vertical-farming/orders'),
      ]);
      if (!active) return;
      const hub = results[0].status === 'fulfilled' ? results[0].value : { partners: [], tasks: [], myRoles: [] };
      const mySubscriptions = results[1].status === 'fulfilled' ? results[1].value.subscriptions : [];
      const myOrders = results[2].status === 'fulfilled' ? results[2].value.orders : [];

      root.querySelector('#vf-partner-list').innerHTML = hub.partners.length
        ? hub.partners.map((partner) => `<div class="vf-list-item"><div><strong>${esc(partner.name)}</strong><p>${esc(roles[partner.role]?.label || 'Farm partner')} · ${esc(partner.location)}<br>${partner.skills.map(esc).join(' · ')}</p></div>${partner.isDemo ? '<span class="vf-badge demo">Sample</span>' : '<span class="vf-badge">Registered</span>'}</div>`).join('')
        : '<div class="vf-empty">No partner profiles yet. Register above to be the first listing in this workspace.</div>';

      const myRoles = Array.isArray(hub.myRoles) ? hub.myRoles : [];
      const taskForm = root.querySelector('#vf-task-form');
      taskForm.hidden = !myRoles.includes('farm-operator');
      const taskGrid = root.querySelector('#vf-task-grid');
      taskGrid.innerHTML = hub.tasks.length
        ? hub.tasks.map((task) => {
          const role = roles[task.requiredRole] || { label: 'Partner', icon: '🛠️' };
          let action = '';
          if (task.status === 'available' && myRoles.includes(task.requiredRole)) {
            action = `<button type="button" class="btn sm" data-claim-task="${esc(task.id)}">Accept work</button>`;
          } else if (task.assignedToMe && task.status === 'assigned') {
            action = `<button type="button" class="btn sm" data-task-status="in-progress" data-task-id="${esc(task.id)}">Start task</button>`;
          } else if (task.assignedToMe && task.status === 'in-progress') {
            action = `<button type="button" class="btn sm" data-task-status="done" data-task-id="${esc(task.id)}">Mark complete</button>`;
          } else if (task.status === 'available') {
            action = '<span class="vf-muted">Register for this role to accept work</span>';
          } else if (task.assignedToMe) {
            action = '<span class="vf-status">Your assignment</span>';
          }
          const status = task.status === 'in-progress' ? 'In progress' : task.status === 'done' ? 'Completed' : task.status === 'assigned' ? 'Assigned' : 'Available';
          return `<article class="vf-card vf-task"><div class="vf-task-meta"><span class="vf-badge">${role.icon} ${role.label}</span>${task.isDemo ? '<span class="vf-badge demo">Sample task</span>' : ''}<span class="vf-status">${status}</span></div>
            <h3>${esc(task.title)}</h3><p>${esc(task.description)}</p><p class="vf-muted">📍 ${esc(task.location)} · ${task.dueDate ? 'Due ' + esc(task.dueDate) : 'Flexible timing'}${task.mine ? ' · Posted by you' : ''}</p>
            <div class="vf-form-actions">${action}</div></article>`;
        }).join('')
        : '<div class="vf-empty">No work is listed right now. Farm Operators can post tasks after joining the partner directory.</div>';
      if (results[0].status === 'rejected') taskGrid.insertAdjacentHTML('afterbegin', '<div class="vf-empty">Work listings could not be loaded. Try refreshing this page.</div>');

      const list = root.querySelector('#vf-subscription-list');
      const planSubscriptions = mySubscriptions.filter((item) => !item.farmId);
      list.innerHTML = planSubscriptions.length
        ? planSubscriptions.map((item) => {
          const plan = plans.find((p) => p.id === item.planId);
          const farm = farms.find((p) => p.id === item.farmId);
          const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable';
          const label = farm?.name || plan?.name || 'Sample plan';
          const detail = farm ? `${money(farm.price)} / month · demo request only` : `${plan?.quantity || ''} · ${plan?.frequency || ''}`;
          return `<div class="vf-list-item"><div><strong>${esc(label)}</strong><p>${esc(detail)}<br>Status: demo request received · ${esc(date)}</p></div><span class="vf-badge demo">${item.isDemo ? 'Demo' : 'Pending'}</span></div>`;
        }).join('')
        : '<p class="vf-muted">No produce plan requests yet. Saving a demo plan request does not start billing.</p>';
      if (results[1].status === 'rejected') list.innerHTML = '<p class="vf-muted">Your request history could not be loaded. Try refreshing this page.</p>';

      const farmList = root.querySelector('#vf-farm-subscription-list');
      const farmSubscriptions = mySubscriptions.filter((item) => item.farmId);
      farmList.innerHTML = farmSubscriptions.length
        ? farmSubscriptions.map((item) => {
          const farm = farms.find((p) => p.id === item.farmId);
          const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable';
          return `<div class="vf-list-item"><div><strong>${esc(farm?.name || 'Sample farm')}</strong><p>${farm ? money(farm.price) + ' / month · demo request only' : 'Demo farm request'}<br>Status: no payment or delivery · ${esc(date)}</p></div><span class="vf-badge demo">Demo</span></div>`;
        }).join('')
        : '<p class="vf-muted">No farm subscription requests yet. A request does not start billing.</p>';
      if (results[1].status === 'rejected') farmList.innerHTML = '<p class="vf-muted">Your farm request history could not be loaded. Try refreshing this page.</p>';

      const orderList = root.querySelector('#vf-order-list');
      orderList.innerHTML = myOrders.length
        ? myOrders.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable';
          return `<div class="vf-list-item"><div><strong>${esc(product?.label || 'Sample produce')} · ${item.quantity} item(s)</strong><p>Demo request · sample total ${money(item.demoTotalInr)} · ${esc(date)}</p></div><span class="vf-badge demo">Demo</span></div>`;
        }).join('')
        : '<p class="vf-muted">No demo orders yet. Sample prices are not verified store prices.</p>';
      if (results[2].status === 'rejected') orderList.innerHTML = '<p class="vf-muted">Your order history could not be loaded. Try refreshing this page.</p>';
    }

    function updateOrderTotal() {
      const product = products.find((item) => item.id === root.querySelector('#vf-product').value);
      const quantity = Math.max(0, Number(root.querySelector('#vf-quantity').value) || 0);
      root.querySelector('#vf-order-total').textContent = `Sample total: ${money((product?.price || 0) * quantity)} · demo price only`;
    }

    root.addEventListener('input', (event) => {
      if (event.target.closest('#vf-investment')) calculate();
      if (event.target.id === 'vf-quantity') updateOrderTotal();
    }, { signal });
    root.addEventListener('change', (event) => {
      if (event.target.id === 'vf-product') updateOrderTotal();
    }, { signal });

    root.addEventListener('click', async (event) => {
      const scrollButton = event.target.closest('[data-scroll-to]');
      const planButton = event.target.closest('[data-request-plan]');
      const farmButton = event.target.closest('[data-request-farm]');
      const claimButton = event.target.closest('[data-claim-task]');
      const statusButton = event.target.closest('[data-task-status]');
      if (scrollButton) {
        root.querySelector('#' + scrollButton.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (!planButton && !farmButton && !claimButton && !statusButton) return;
      const button = planButton || farmButton || claimButton || statusButton;
      button.disabled = true;
      try {
        if (planButton || farmButton) {
          const request = planButton ? { planId: planButton.dataset.requestPlan } : { farmId: farmButton.dataset.requestFarm };
          await K().api('/vertical-farming/subscriptions', { method: 'POST', body: request });
          K().toast('Demo subscription request saved. No payment was taken.');
        } else if (claimButton) {
          await K().api(`/farm-hub/tasks/${encodeURIComponent(claimButton.dataset.claimTask)}/claim`, { method: 'POST' });
          K().toast('Work accepted. Your assignment is saved.');
        } else {
          await K().api(`/farm-hub/tasks/${encodeURIComponent(statusButton.dataset.taskId)}/status`, { method: 'PATCH', body: { status: statusButton.dataset.taskStatus } });
          K().toast(statusButton.dataset.taskStatus === 'done' ? 'Task marked complete.' : 'Task moved to in progress.');
        }
        await refreshData();
      } catch (error) {
        K().toast(error.message, 'err');
        button.disabled = false;
      }
    }, { signal });

    root.addEventListener('submit', async (event) => {
      const form = event.target;
      if (form.id !== 'vf-partner-form' && form.id !== 'vf-task-form' && form.id !== 'vf-order-form') return;
      event.preventDefault();
      const isPartner = form.id === 'vf-partner-form';
      const isOrder = form.id === 'vf-order-form';
      if (isOrder) {
        const feedback = root.querySelector('#vf-order-feedback');
        const submit = form.querySelector('button[type="submit"]');
        feedback.textContent = '';
        submit.disabled = true;
        try {
          await K().api('/vertical-farming/orders', {
            method: 'POST',
            body: { productId: root.querySelector('#vf-product').value, quantity: root.querySelector('#vf-quantity').value },
          });
          K().toast('Demo order request saved. No payment was taken.');
          await refreshData();
        } catch (error) {
          feedback.textContent = error.message;
        } finally {
          submit.disabled = false;
        }
        return;
      }
      const feedback = root.querySelector(isPartner ? '#vf-partner-feedback' : '#vf-task-feedback');
      const submit = form.querySelector('button[type="submit"]');
      feedback.textContent = '';
      submit.disabled = true;
      try {
        if (isPartner) {
          await K().api('/farm-hub/partners', {
            method: 'POST',
            body: {
              role: root.querySelector('#vf-role').value,
              location: root.querySelector('#vf-location').value,
              skills: root.querySelector('#vf-skills').value.split(',').map((skill) => skill.trim()).filter(Boolean),
            },
          });
          form.reset();
          K().toast('Partner profile saved.');
        } else {
          await K().api('/farm-hub/tasks', {
            method: 'POST',
            body: {
              title: root.querySelector('#vf-task-title').value,
              requiredRole: root.querySelector('#vf-task-role').value,
              location: root.querySelector('#vf-task-location').value,
              dueDate: root.querySelector('#vf-task-date').value,
              description: root.querySelector('#vf-task-description').value,
            },
          });
          form.reset();
          K().toast('Work listing saved.');
        }
        await refreshData();
      } catch (error) {
        feedback.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    }, { signal });

    calculate();
    updateOrderTotal();
    refreshData();
    return () => { active = false; controller.abort(); };
  }

  return { render };
})();
