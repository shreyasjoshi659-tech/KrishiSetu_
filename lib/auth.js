const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { col, DIR } = require('./db');

const SECRET_FILE = path.join(DIR, '.secret');
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  try {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const secretStats = fs.lstatSync(SECRET_FILE);
  if (!secretStats.isFile()) throw new Error('Local JWT secret must be a regular file.');
  fs.chmodSync(SECRET_FILE, 0o600);
  JWT_SECRET = fs.readFileSync(SECRET_FILE, 'utf8');
}
if (Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must contain at least 32 bytes.');
}

const users = col('users');
const seedUsersPath = path.join(__dirname, '..', 'data', 'users.json');
let seedUserIds = new Set();
try {
  const seedUsers = JSON.parse(fs.readFileSync(seedUsersPath, 'utf8'));
  if (Array.isArray(seedUsers)) seedUserIds = new Set(seedUsers.map((user) => user && user.id).filter(Boolean));
} catch {
  // A missing or invalid optional seed file must not prevent normal sign-in.
}

const allowSeededAccounts =
  process.env.NODE_ENV !== 'production' && process.env.ALLOW_SEEDED_ACCOUNTS === 'true';

function isActiveUser(user) {
  return !!user && (allowSeededAccounts || !seedUserIds.has(user.id));
}

const sign = (user) => {
  if (!isActiveUser(user)) throw new Error('This account is not available for sign-in.');
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
};

function userFromToken(token) {
  try {
    const { id } = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = users.rows.find((u) => u.id === id) || null;
    return isActiveUser(user) ? user : null;
  } catch {
    return null;
  }
}

function auth(req, res, next) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(String(req.get('authorization') || ''));
  const user = match ? userFromToken(match[1]) : null;
  if (!user) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  req.user = user;
  next();
}

module.exports = { sign, auth, userFromToken, users, isActiveUser };
