const fs = require('fs');
const path = require('path');

const defaultDir = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data');
const DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : defaultDir;
fs.mkdirSync(DIR, { recursive: true });

// Copy seed files only when a collection is first created. Never replace a
// persisted collection with a newer copy from the repository on restart/deploy.
const seedDir = path.join(__dirname, '..', 'data');
if (DIR !== seedDir && fs.existsSync(seedDir)) {
  try {
    for (const f of fs.readdirSync(seedDir)) {
      const src = path.join(seedDir, f);
      const dst = path.join(DIR, f);
      if (f.endsWith('.json') && fs.statSync(src).isFile() && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
        fs.chmodSync(dst, 0o600);
      }
    }
  } catch (error) {
    console.error('[data] Seed initialization failed', { code: error.code || 'SEED_COPY_FAILED' });
  }
}

const cache = {};

/** Tiny JSON-file collection store. `rows` is a live array; call save() after mutating. */
function col(name) {
  const file = path.join(DIR, name + '.json');
  if (!cache[name]) {
    if (fs.existsSync(file)) {
      fs.chmodSync(file, 0o600);
      cache[name] = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    } else {
      cache[name] = [];
    }
  }
  return {
    rows: cache[name],
    save() {
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(cache[name], null, 2), { mode: 0o600 });
      fs.chmodSync(tmp, 0o600);
      fs.renameSync(tmp, file);
    },
  };
}

module.exports = { col, DIR };
