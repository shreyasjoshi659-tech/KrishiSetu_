const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const { col, DIR } = require('../lib/db');
const { auth, users } = require('../lib/auth');

const router = express.Router();
const items = col('equipment');
const uploads = col('equipment_uploads');
const UPLOADS = path.join(DIR, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Try again later.' },
});

const CATEGORIES = ['Tractors', 'Power tillers', 'Harvesters', 'Rotavators & cultivators', 'Ploughs & harrows', 'Seed drills & planters', 'Sprayers', 'Water pumps & irrigation', 'Threshers & reapers', 'Trailers & carts', 'Power tools', 'Hand tools', 'Drones', 'Other'];
const RENT_UNITS = ['hour', 'day', 'week', 'month', 'acre', 'trip'];
const TYPES = ['rent', 'sale', 'both'];
const clean = (s, n) => String(s || '').trim().slice(0, n);

function sniff(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

// raw image upload (client downsizes before sending)
router.post('/equipment/photo', auth, uploadLimiter, express.raw({ type: 'image/*', limit: '3mb' }), (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'No image received.' });
  const ext = sniff(buf);
  if (!ext) return res.status(400).json({ error: 'Only JPG, PNG or WEBP photos are allowed.' });
  const name = crypto.randomUUID() + '.' + ext;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  uploads.rows.push({ fileName: name, userId: req.user.id, createdAt: new Date().toISOString() });
  uploads.save();
  res.status(201).json({ url: '/uploads/' + name });
});

function view(it, viewerId) {
  const u = users.rows.find((x) => x.id === it.userId) || {};
  return { ...it, sellerName: u.name || 'Seller', sellerVillage: u.village || '', mine: it.userId === viewerId };
}

function build(b, base) {
  const type = TYPES.includes(b.type) ? b.type : null;
  if (!type) return { error: 'Choose For rent, For sale or Both.' };
  const title = clean(b.title, 80);
  if (title.length < 3) return { error: 'Give the equipment a title (e.g. "Mahindra 575 DI Tractor").' };
  const category = CATEGORIES.includes(b.category) ? b.category : 'Other';
  const rentRate = Number(b.rentRate), salePrice = Number(b.salePrice);
  if (type !== 'sale') {
    if (!Number.isFinite(rentRate) || !(rentRate > 0 && rentRate <= 100_000_000)) return { error: 'Enter a valid rent amount.' };
    if (!RENT_UNITS.includes(b.rentUnit)) return { error: 'Choose how rent is charged (per hour, day…).' };
  }
  if (type !== 'rent' && (!Number.isFinite(salePrice) || !(salePrice > 0 && salePrice <= 100_000_000))) {
    return { error: 'Enter a valid selling price.' };
  }
  const phone = String(b.contactPhone || '').replace(/[\s-]/g, '');
  if (!/^\+?\d{10,13}$/.test(phone)) return { error: 'Enter a valid contact phone number.' };
  const existingPhotos = Array.isArray(base.existingPhotos) ? base.existingPhotos : [];
  const photos = (Array.isArray(b.photos) ? b.photos : []).filter((p) => {
    if (typeof p !== 'string' || !/^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(p)) return false;
    const fileName = path.basename(p);
    const owner = uploads.rows.find((entry) => entry.fileName === fileName);
    return owner ? owner.userId === base.userId : existingPhotos.includes(p);
  }).slice(0, 5);
  if (!photos.length) return { error: 'Add at least one photo of the equipment.' };
  return {
    value: {
      ...base, existingPhotos: undefined, title, category, type, brand: clean(b.brand, 40), year: Number.isInteger(Number(b.year)) && Number(b.year) > 1950 && Number(b.year) <= new Date().getFullYear() + 1 ? Number(b.year) : null,
      condition: ['new', 'good', 'fair', 'old'].includes(b.condition) ? b.condition : 'good', description: clean(b.description, 1000),
      rentRate: type === 'sale' ? null : rentRate, rentUnit: type === 'sale' ? null : b.rentUnit,
      deposit: Number.isFinite(Number(b.deposit)) && Number(b.deposit) > 0 && Number(b.deposit) <= 100_000_000 && type !== 'sale' ? Number(b.deposit) : null, operatorIncluded: !!b.operatorIncluded, fuelIncluded: !!b.fuelIncluded,
      salePrice: type === 'rent' ? null : salePrice, negotiable: !!b.negotiable,
      state: clean(b.state, 40), district: clean(b.district, 60), village: clean(b.village, 60),
      contactPhone: phone, whatsapp: !!b.whatsapp, photos,
    },
  };
}

router.get('/equipment/meta', auth, (_req, res) => res.json({ categories: CATEGORIES, rentUnits: RENT_UNITS }));

router.get('/equipment', auth, (req, res) => {
  const { q, category, type, state, district, maxPrice, sort } = req.query;
  let list = items.rows.filter((i) => i.status === 'available');
  if (category) list = list.filter((i) => i.category === category);
  if (type === 'rent') list = list.filter((i) => i.type !== 'sale');
  if (type === 'sale') list = list.filter((i) => i.type !== 'rent');
  if (state) list = list.filter((i) => i.state === state);
  if (district) list = list.filter((i) => (i.district || '').toLowerCase().includes(String(district).toLowerCase()));
  if (maxPrice && Number(maxPrice) > 0) {
    const m = Number(maxPrice);
    list = list.filter((i) => (type === 'sale' ? i.salePrice : type === 'rent' ? i.rentRate : Math.min(i.rentRate ?? Infinity, i.salePrice ?? Infinity)) <= m);
  }
  if (q) {
    const t = String(q).toLowerCase();
    list = list.filter((i) => [i.title, i.brand, i.category, i.description, i.district, i.state].join(' ').toLowerCase().includes(t));
  }
  const near = (i) => (district && (i.district || '').toLowerCase() === String(district).toLowerCase() ? 2 : 0) + (i.state === req.user.state ? 1 : 0);
  const price = (i) => i.salePrice ?? i.rentRate ?? 0;
  const by = { new: (a, b) => b.createdAt.localeCompare(a.createdAt), near: (a, b) => near(b) - near(a) || b.createdAt.localeCompare(a.createdAt), cheap: (a, b) => price(a) - price(b), dear: (a, b) => price(b) - price(a) };
  list.sort(by[sort] || by.new);
  res.json({ items: list.slice(0, 120).map((i) => ({ ...view(i, req.user.id), nearScore: near(i) })) });
});

router.get('/equipment/mine', auth, (req, res) => {
  res.json({ items: items.rows.filter((i) => i.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((i) => view(i, req.user.id)) });
});

router.get('/equipment/:id', auth, (req, res) => {
  const it = items.rows.find((i) => i.id === req.params.id);
  if (!it) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ item: view(it, req.user.id) });
});

router.post('/equipment', auth, (req, res) => {
  if (items.rows.filter((i) => i.userId === req.user.id).length >= 50) return res.status(400).json({ error: 'Listing limit reached.' });
  const r = build(req.body || {}, { id: crypto.randomUUID(), userId: req.user.id, status: 'available', createdAt: new Date().toISOString() });
  if (r.error) return res.status(400).json({ error: r.error });
  items.rows.push(r.value);
  items.save();
  res.status(201).json({ item: view(r.value, req.user.id) });
});

router.put('/equipment/:id', auth, (req, res) => {
  const i = items.rows.findIndex((x) => x.id === req.params.id && x.userId === req.user.id);
  if (i < 0) return res.status(404).json({ error: 'Listing not found.' });
  const r = build(req.body || {}, {
    id: items.rows[i].id,
    userId: req.user.id,
    status: items.rows[i].status,
    createdAt: items.rows[i].createdAt,
    existingPhotos: items.rows[i].photos,
  });
  if (r.error) return res.status(400).json({ error: r.error });
  items.rows[i] = r.value;
  items.save();
  res.json({ item: view(r.value, req.user.id) });
});

router.post('/equipment/:id/status', auth, (req, res) => {
  const it = items.rows.find((x) => x.id === req.params.id && x.userId === req.user.id);
  if (!it) return res.status(404).json({ error: 'Listing not found.' });
  const s = (req.body || {}).status;
  if (!['available', 'unavailable', 'sold'].includes(s)) return res.status(400).json({ error: 'Invalid status.' });
  it.status = s;
  items.save();
  res.json({ item: view(it, req.user.id) });
});

router.delete('/equipment/:id', auth, (req, res) => {
  const i = items.rows.findIndex((x) => x.id === req.params.id && x.userId === req.user.id);
  if (i < 0) return res.status(404).json({ error: 'Listing not found.' });
  items.rows.splice(i, 1);
  items.save();
  res.json({ ok: true });
});

module.exports = { router, UPLOADS };
