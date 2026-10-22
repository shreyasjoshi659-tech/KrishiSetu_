require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { col } = require('./lib/db');
const { sign, auth, users, isActiveUser } = require('./lib/auth');
const mailer = require('./lib/mailer');
const { router: poolRouter, handleInbound } = require('./routes/pools');
const { router: labourRouter } = require('./routes/labour');
const { router: equipmentRouter, UPLOADS } = require('./routes/equipment');
const { router: farmHubRouter } = require('./routes/farm-hub');

const PORT = process.env.PORT || 3000;
const usersCol = col('users');
const publicUser = ({ passwordHash, ...rest }) => rest;
const normPhone = (p) => String(p || '').replace(/[\s-]/g, '');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait and try again.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, apiLimiter);

app.post('/api/register', authLimiter, asyncRoute(async (req, res) => {
  const { name, phone, password, state, district, village, nearestMandi, landSize, farmCategory, irrigation, crops, equipment } = req.body || {};
  const ph = normPhone(phone);
  const fullName = typeof name === 'string' ? name.trim() : '';
  if (fullName.length < 2 || fullName.length > 100) return res.status(400).json({ error: 'Please enter a name between 2 and 100 characters.' });
  if (!/^\+?\d{10,13}$/.test(ph)) return res.status(400).json({ error: 'Enter a valid mobile number (10 digits).' });
  if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Use a password between 10 characters and 72 bytes.' });
  }
  const stateName = typeof state === 'string' ? state.trim() : '';
  if (!stateName || stateName.length > 60) return res.status(400).json({ error: 'Please select a valid state.' });
  const parsedLandSize = landSize === undefined || landSize === null || landSize === '' ? null : Number(landSize);
  if (parsedLandSize !== null && (!Number.isFinite(parsedLandSize) || parsedLandSize < 0 || parsedLandSize > 1_000_000)) {
    return res.status(400).json({ error: 'Enter a valid land size.' });
  }
  if (users.rows.some((u) => u.phone === ph)) return res.status(409).json({ error: 'This mobile number is already registered. Please log in.' });

  const user = {
    id: crypto.randomUUID(),
    name: fullName,
    phone: ph,
    passwordHash: await bcrypt.hash(password, 12),
    state: stateName,
    district: String(district || '').trim().slice(0, 100),
    village: String(village || '').trim().slice(0, 100),
    nearestMandi: String(nearestMandi || '').trim().slice(0, 100),
    landSize: parsedLandSize,
    farmCategory: String(farmCategory || '').trim().slice(0, 60),
    irrigation: String(irrigation || '').trim().slice(0, 60),
    crops: Array.isArray(crops) ? crops.filter((value) => typeof value === 'string').slice(0, 15).map((value) => value.trim().slice(0, 60)) : [],
    equipment: Array.isArray(equipment) ? equipment.filter((value) => typeof value === 'string').slice(0, 10).map((value) => value.trim().slice(0, 60)) : [],
    createdAt: new Date().toISOString(),
  };
  usersCol.rows.push(user);
  usersCol.save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
}));

app.post('/api/login', authLimiter, asyncRoute(async (req, res) => {
  const { phone, password } = req.body || {};
  const user = users.rows.find((u) => u.phone === normPhone(phone) && isActiveUser(u));
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect mobile number or password.' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
}));

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.use('/api', poolRouter);
app.use('/api', labourRouter);
app.use('/api', equipmentRouter);
app.use('/api', farmHubRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', setHeaders: (r) => r.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/vertical-farming.html', (_req, res) => res.redirect(302, '/app#/vertical-farming'));
const appPage = (_req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html'));
const loginPage = (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'));
app.get('/login', loginPage);
app.get('/register', loginPage);
app.get('/app', appPage);
app.get('/join/:code', appPage);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number(error.status || error.statusCode);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 413 ? 'Request body is too large.' : 'Invalid request.' });
  }
  console.error('[http] Request failed', { method: req.method, path: req.path, status: 500 });
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

if (!process.env.VERCEL) {
  mailer.startInbox(handleInbound);
  app.listen(PORT, () => {
    const s = mailer.status();
    console.log(`KrishiSetu running at http://localhost:${PORT}`);
    console.log(s.mode === 'live' ? `[mail] LIVE email via ${s.from}` : '[mail] TEST mode – SMTP not configured (see .env.example). Emails are NOT delivered to real inboxes.');
  });
}

module.exports = app;
