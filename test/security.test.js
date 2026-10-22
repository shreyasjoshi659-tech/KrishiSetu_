const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const events = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectDir = path.resolve(__dirname, '..');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krishisetu-test-'));
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = dataDir;
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.VERCEL = '1';
delete process.env.ALLOW_SEEDED_ACCOUNTS;

const app = require('../server');
const { isActiveUser, sign } = require('../lib/auth');
let server;
let baseUrl;
let userA;
let userB;
let phoneCounter = 0;

async function api(route, { token, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}/api${route}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  return { response, data };
}

async function register(name) {
  phoneCounter += 1;
  const phone = `+1999${String(phoneCounter).padStart(8, '0')}`;
  const { response, data } = await api('/register', {
    method: 'POST',
    body: {
      name,
      phone,
      password: crypto.randomBytes(18).toString('base64url'),
      state: 'Karnataka',
      district: 'Test district',
    },
  });
  assert.equal(response.status, 201);
  assert.equal(Object.hasOwn(data.user, 'passwordHash'), false);
  return data;
}

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await events.once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  userA = await register('Test farmer one');
  userB = await register('Test farmer two');
});

test.after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('security headers are enabled and the Express fingerprint is disabled', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.has('x-powered-by'), false);
  assert.ok(response.headers.has('content-security-policy'));
  assert.ok(response.headers.has('x-content-type-options'));
  const privateApi = await fetch(`${baseUrl}/api/me`);
  assert.equal(privateApi.status, 401);
  assert.equal(privateApi.headers.get('cache-control'), 'no-store');
});

test('seed accounts are inactive by default and production requires an explicit JWT secret', async () => {
  const seedUsers = JSON.parse(fs.readFileSync(path.join(projectDir, 'data', 'users.json'), 'utf8'));
  assert.ok(seedUsers.length > 0);
  assert.equal(isActiveUser(seedUsers[0]), false);
  assert.throws(() => sign(seedUsers[0]));

  const { response } = await api('/login', {
    method: 'POST',
    body: { phone: seedUsers[0].phone, password: 'not-a-seed-password' },
  });
  assert.equal(response.status, 401);

  const productionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krishisetu-production-secret-'));
  const env = { ...process.env, NODE_ENV: 'production', DATA_DIR: productionDir, VERCEL: '1' };
  delete env.JWT_SECRET;
  const result = spawnSync(process.execPath, ['-e', "require('./lib/auth')"], {
    cwd: projectDir,
    env,
    encoding: 'utf8',
    timeout: 10_000,
  });
  fs.rmSync(productionDir, { recursive: true, force: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be configured in production/);
});

test('registration enforces the longer password minimum and rate limits repeated login attempts', async () => {
  const rejected = await api('/register', {
    method: 'POST',
    body: { name: 'Short password', phone: '+199900000099', password: 'short', state: 'Karnataka' },
  });
  assert.equal(rejected.response.status, 400);

  const forwardedIp = '203.0.113.77';
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { response } = await api('/login', {
      method: 'POST',
      body: { phone: '+199900000098', password: 'not-a-valid-password' },
      headers: { 'X-Forwarded-For': forwardedIp },
    });
    statuses.push(response.status);
  }
  assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
});

test('private pools hide details and SSE requires a single-use, pool-scoped ticket', async () => {
  const harvestDate = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const created = await api('/pools', {
    token: userA.token,
    method: 'POST',
    body: {
      name: 'Private integration test pool',
      crop: 'Spinach',
      quantity: 10,
      harvestDate,
      state: 'Karnataka',
      visibility: 'private',
    },
  });
  assert.equal(created.response.status, 201);
  const poolId = created.data.id;

  const privateDetail = await api(`/pools/${poolId}`, { token: userB.token });
  assert.equal(privateDetail.response.status, 404);
  const invitePreview = await api(`/invite/${created.data.code}`);
  assert.equal(invitePreview.response.status, 200);

  const legacyStream = await fetch(`${baseUrl}/api/pools/${poolId}/stream?token=${encodeURIComponent(userA.token)}`);
  assert.equal(legacyStream.status, 403);

  const deniedTicket = await api(`/pools/${poolId}/stream-ticket`, { token: userB.token, method: 'POST' });
  assert.equal(deniedTicket.response.status, 403);
  const ticketResult = await api(`/pools/${poolId}/stream-ticket`, { token: userA.token, method: 'POST' });
  assert.equal(ticketResult.response.status, 200);
  assert.equal(ticketResult.data.expiresInSeconds, 30);

  const stream = await fetch(`${baseUrl}/api/pools/${poolId}/stream?ticket=${encodeURIComponent(ticketResult.data.ticket)}`);
  assert.equal(stream.status, 200);
  assert.match(stream.headers.get('content-type'), /text\/event-stream/);
  await stream.body.cancel();
  const replay = await fetch(`${baseUrl}/api/pools/${poolId}/stream?ticket=${encodeURIComponent(ticketResult.data.ticket)}`);
  assert.equal(replay.status, 403);
});

test('vertical farm requests and orders stay scoped to the signed-in user', async () => {
  const subscription = await api('/vertical-farming/subscriptions', {
    token: userA.token,
    method: 'POST',
    body: { farmId: 'greenleaf-urban' },
  });
  assert.equal(subscription.response.status, 201);
  assert.equal(subscription.data.subscription.farmId, 'greenleaf-urban');

  const duplicate = await api('/vertical-farming/subscriptions', {
    token: userA.token,
    method: 'POST',
    body: { farmId: 'greenleaf-urban' },
  });
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.data.subscription.id, subscription.data.subscription.id);

  const invalidCombination = await api('/vertical-farming/subscriptions', {
    token: userA.token,
    method: 'POST',
    body: { farmId: 'unknown-farm', planId: 'farm-box' },
  });
  assert.equal(invalidCombination.response.status, 400);

  const order = await api('/vertical-farming/orders', {
    token: userA.token,
    method: 'POST',
    body: { productId: 'lettuce', quantity: 2 },
  });
  assert.equal(order.response.status, 201);

  const ownRequests = await api('/vertical-farming/subscriptions', { token: userA.token });
  const otherRequests = await api('/vertical-farming/subscriptions', { token: userB.token });
  const ownOrders = await api('/vertical-farming/orders', { token: userA.token });
  const otherOrders = await api('/vertical-farming/orders', { token: userB.token });
  assert.equal(ownRequests.data.subscriptions.length, 1);
  assert.equal(otherRequests.data.subscriptions.length, 0);
  assert.equal(ownOrders.data.orders.length, 1);
  assert.equal(otherOrders.data.orders.length, 0);
});

test('farm task actions require the right role and assigned user', async () => {
  const farmerProfile = await api('/farm-hub/partners', {
    token: userA.token,
    method: 'POST',
    body: { role: 'farm-operator', location: 'Test farm', skills: ['Crop care'] },
  });
  const deliveryProfile = await api('/farm-hub/partners', {
    token: userB.token,
    method: 'POST',
    body: { role: 'delivery-partner', location: 'Test area', skills: ['Harvest delivery'] },
  });
  assert.equal(farmerProfile.response.status, 201);
  assert.equal(deliveryProfile.response.status, 201);

  const task = await api('/farm-hub/tasks', {
    token: userA.token,
    method: 'POST',
    body: {
      title: 'Pack a sample harvest',
      description: 'Prepare a small demo order for collection.',
      requiredRole: 'delivery-partner',
      location: 'Test farm',
    },
  });
  assert.equal(task.response.status, 201);
  const claim = await api(`/farm-hub/tasks/${task.data.task.id}/claim`, {
    token: userB.token,
    method: 'POST',
    body: {},
  });
  assert.equal(claim.response.status, 200);

  const wrongOwnerUpdate = await api(`/farm-hub/tasks/${task.data.task.id}/status`, {
    token: userA.token,
    method: 'PATCH',
    body: { status: 'in-progress' },
  });
  assert.equal(wrongOwnerUpdate.response.status, 404);
});

test('equipment uploads cannot be attached to another user’s listing', async () => {
  const image = Buffer.from([0xff, 0xd8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const uploadResponse = await fetch(`${baseUrl}/api/equipment/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}`, 'Content-Type': 'image/jpeg' },
    body: image,
  });
  assert.equal(uploadResponse.status, 201);
  const upload = await uploadResponse.json();

  const listing = {
    title: 'Sample tractor listing',
    type: 'rent',
    category: 'Tractors',
    rentRate: 1200,
    rentUnit: 'day',
    contactPhone: '+199900000001',
    photos: [upload.url],
    state: 'Karnataka',
  };
  const stolenPhoto = await api('/equipment', { token: userB.token, method: 'POST', body: listing });
  assert.equal(stolenPhoto.response.status, 400);

  const ownListing = await api('/equipment', { token: userA.token, method: 'POST', body: listing });
  assert.equal(ownListing.response.status, 201);
  const wrongOwnerEdit = await api(`/equipment/${ownListing.data.item.id}`, {
    token: userB.token,
    method: 'PUT',
    body: listing,
  });
  assert.equal(wrongOwnerEdit.response.status, 404);
});

test('persisted JSON is not overwritten by repository seed files', () => {
  const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krishisetu-persisted-data-'));
  const sentinel = [{ id: 'keep-existing-record' }];
  fs.writeFileSync(path.join(isolatedDir, 'pools.json'), JSON.stringify(sentinel));
  const result = spawnSync(process.execPath, ['-e', "require('./lib/db')"], {
    cwd: projectDir,
    env: { ...process.env, DATA_DIR: isolatedDir, NODE_ENV: 'test' },
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(isolatedDir, 'pools.json'), 'utf8')), sentinel);
  assert.ok(fs.existsSync(path.join(isolatedDir, 'farm_partners.json')));
  fs.rmSync(isolatedDir, { recursive: true, force: true });
});

test('local JWT secrets are generated with restricted file permissions', () => {
  const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krishisetu-local-secret-'));
  const env = { ...process.env, DATA_DIR: isolatedDir, NODE_ENV: 'test', VERCEL: '1' };
  delete env.JWT_SECRET;
  const result = spawnSync(process.execPath, ['-e', "require('./lib/auth')"], {
    cwd: projectDir,
    env,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.statSync(path.join(isolatedDir, '.secret')).mode & 0o777, 0o600);
  fs.rmSync(isolatedDir, { recursive: true, force: true });
});

test('integrated vertical farming page retains the original sample features', () => {
  const source = fs.readFileSync(path.join(projectDir, 'public', 'js', 'vertical-farming.js'), 'utf8');
  for (const feature of [
    'GreenLeaf Urban Farm',
    'BerryStack Farm',
    'HerbNest Farm',
    'Farm Subscription',
    'Farm team',
    'Crop progress',
    'Equipment checks',
    'Order sample produce',
    'Farm Partner Hub',
    'Smart Farm Investment Advisor',
  ]) {
    assert.ok(source.includes(feature), `Expected integrated page to include ${feature}`);
  }
});
