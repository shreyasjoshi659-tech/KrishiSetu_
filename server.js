require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const { col } = require('./lib/db');
const { sign, auth, users } = require('./lib/auth');
const mailer = require('./lib/mailer');
const { router: poolRouter, handleInbound } = require('./routes/pools');
const { router: labourRouter } = require('./routes/labour');
const { router: equipmentRouter, UPLOADS } = require('./routes/equipment');

const PORT = process.env.PORT || 3000;
const usersCol = col('users');
const publicUser = ({ passwordHash, ...rest }) => rest;
const normPhone = (p) => String(p || '').replace(/[\s-]/g, '');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

// naive in-memory rate limit for auth endpoints
const hits = new Map();
function rateLimit(req, res, next) {
  const key = req.ip + req.path;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 15) return res.status(429).json({ error: 'Too many attempts. Please wait a minute.' });
  arr.push(now);
  hits.set(key, arr);
  next();
}

app.post('/api/register', rateLimit, async (req, res) => {
  const { name, phone, password, state, district, village, nearestMandi, landSize, farmCategory, irrigation, crops, equipment } = req.body || {};
  const ph = normPhone(phone);
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!/^\+?\d{10,13}$/.test(ph)) return res.status(400).json({ error: 'Enter a valid mobile number (10 digits).' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!state) return res.status(400).json({ error: 'Please select your state.' });
  if (users.rows.some((u) => u.phone === ph)) return res.status(409).json({ error: 'This mobile number is already registered. Please log in.' });

  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    phone: ph,
    passwordHash: await bcrypt.hash(String(password), 10),
    state,
    district: String(district || '').trim(),
    village: String(village || '').trim(),
    nearestMandi: String(nearestMandi || '').trim(),
    landSize: landSize ? Number(landSize) || null : null,
    farmCategory: String(farmCategory || '').trim(),
    irrigation: String(irrigation || '').trim(),
    crops: Array.isArray(crops) ? crops.slice(0, 15) : [],
    equipment: Array.isArray(equipment) ? equipment.slice(0, 10) : [],
    createdAt: new Date().toISOString(),
  };
  usersCol.rows.push(user);
  usersCol.save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/login', rateLimit, async (req, res) => {
  const { phone, password } = req.body || {};
  const user = users.rows.find((u) => u.phone === normPhone(phone));
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect mobile number or password.' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.put('/api/me', auth, async (req, res) => {
  const { name, state, district, village, nearestMandi, landSize, farmCategory, irrigation, crops, equipment, newPassword } = req.body || {};
  const user = usersCol.rows.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (name && String(name).trim().length >= 2) user.name = String(name).trim();
  if (state) user.state = String(state).trim();
  if (district !== undefined) user.district = String(district || '').trim();
  if (village !== undefined) user.village = String(village || '').trim();
  if (nearestMandi !== undefined) user.nearestMandi = String(nearestMandi || '').trim();
  if (landSize !== undefined) user.landSize = landSize !== null && landSize !== '' ? Number(landSize) || null : null;
  if (farmCategory !== undefined) user.farmCategory = String(farmCategory || '').trim();
  if (irrigation !== undefined) user.irrigation = String(irrigation || '').trim();
  if (Array.isArray(crops)) user.crops = crops.map((c) => String(c).trim()).filter(Boolean).slice(0, 15);
  if (Array.isArray(equipment)) user.equipment = equipment.map((e) => String(e).trim()).filter(Boolean).slice(0, 10);
  if (newPassword && String(newPassword).length >= 6) {
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  }
  user.updatedAt = new Date().toISOString();
  usersCol.save();
  res.json({ user: publicUser(user) });
});

app.use('/api', poolRouter);
app.use('/api', labourRouter);
app.use('/api', equipmentRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', setHeaders: (r) => r.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use(express.static(path.join(__dirname, 'public')));
const appPage = (_req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html'));
const loginPage = (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'));
app.get('/login', loginPage);
app.get('/register', loginPage);
app.get('/app', appPage);
app.get('/join/:code', appPage);

if (!process.env.VERCEL) {
  mailer.startInbox(handleInbound);
  app.listen(PORT, () => {
    const s = mailer.status();
    console.log(`KrishiSetu running at http://localhost:${PORT}`);
    console.log(s.mode === 'live' ? `[mail] LIVE email via ${s.from}` : '[mail] TEST mode – SMTP not configured (see .env.example). Emails are NOT delivered to real inboxes.');
  });
}

module.exports = app;
