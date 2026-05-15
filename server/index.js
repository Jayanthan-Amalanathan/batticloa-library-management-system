// Structured JSON logger — writes to stdout, compatible with Vercel log drain
const log = {
  _write(level, msg, meta = {}) {
    const entry = { ts: new Date().toISOString(), level, msg, ...meta };
    (level === 'error' ? process.stderr : process.stdout).write(JSON.stringify(entry) + '\n');
  },
  info:  (msg, meta) => log._write('info',  msg, meta),
  warn:  (msg, meta) => log._write('warn',  msg, meta),
  error: (msg, meta) => log._write('error', msg, meta),
  debug: (msg, meta) => process.env.LOG_LEVEL === 'debug' && log._write('debug', msg, meta),
};

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { XMLParser } = require('fast-xml-parser');
const { prepare, transaction, initSchema } = require('./db');
const {
  hashPassword, verifyPassword, signToken,
  authenticate, authorize, optionalAuth, logAudit,
  isTokenRevoked, revokeToken
} = require('./auth');
const {
  runSync, scheduleMonthlySyncCron, getLastSync, getSyncHistory, getDlpStats
} = require('./dlpSync');
const crypto = require('crypto');

const _kohaRaw = process.env.KOHA_OPAC_URL || 'https://www.opac.lib.esn.ac.lk';
const KOHA_BASE = (() => {
  try { const u = new URL(_kohaRaw); return `${u.protocol}//${u.host}`; } catch { return 'https://www.opac.lib.esn.ac.lk'; }
})();
const KOHA_SEARCH = `${KOHA_BASE}/cgi-bin/koha/opac-search.pl`;
const KOHA_UNAPI  = `${KOHA_BASE}/cgi-bin/koha/unapi`;
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const KOHA_ALLOWED_HOST = (() => {
  try { return new URL(process.env.KOHA_OPAC_URL || 'https://www.opac.lib.esn.ac.lk').hostname; } catch { return 'www.opac.lib.esn.ac.lk'; }
})();

async function kohaFetch(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== KOHA_ALLOWED_HOST) throw new Error(`Blocked request to non-allowlisted host: ${parsed.hostname}`);
  } catch (e) {
    throw new Error(`Invalid Koha URL: ${e.message}`);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

const MARC_TTL    = 60 * 60 * 1000;
const SEARCH_TTL  = 5  * 60 * 1000;
const marcCache   = new Map();
const searchCache = new Map();
const inFlight    = new Map();

function cacheGet(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) { map.delete(key); return null; }
  return entry.data;
}

function cacheSet(map, key, data, ttl) {
  map.set(key, { data, exp: Date.now() + ttl });
}

async function kohaFetchCached(url, cacheMap, key, ttl) {
  const hit = cacheGet(cacheMap, key);
  if (hit !== null) return hit;
  if (inFlight.has(url)) return inFlight.get(url);
  const promise = kohaFetch(url).then(text => {
    cacheSet(cacheMap, key, text, ttl);
    inFlight.delete(url);
    return text;
  }).catch(err => {
    inFlight.delete(url);
    throw err;
  });
  inFlight.set(url, promise);
  return promise;
}

function marcXmlToBook(xml, biblionumber) {
  let parsed;
  try { parsed = xmlParser.parse(xml); } catch { return null; }
  const record = parsed?.record;
  if (!record) return null;
  const fields = [].concat(record.datafield || []);
  const str = v => (v === undefined || v === null) ? '' : String(v);
  const get = (tag, sub) => {
    const f = fields.find(f => f['@_tag'] === tag);
    if (!f) return '';
    const subs = [].concat(f.subfield || []);
    const s = subs.find(s => s['@_code'] === sub);
    return str(typeof s === 'object' ? s['#text'] : s);
  };
  const getAll = (tag, sub) => {
    return fields.filter(f => f['@_tag'] === tag).map(f => {
      const subs = [].concat(f.subfield || []);
      const s = subs.find(s => s['@_code'] === sub);
      return str(typeof s === 'object' ? s['#text'] : s);
    }).filter(Boolean);
  };
  const title  = [get('245','a'), get('245','b')].filter(Boolean).join(' ').replace(/[/,]+$/, '').trim();
  const author = get('100','a') || get('700','a') || get('110','a') || '';
  const isbn   = get('020','a') || '';
  const publisher  = get('260','b') || get('264','b') || '';
  const pub_year   = parseInt(get('260','c') || get('264','c')) || null;
  const call_num   = get('082','a') || get('050','a') || '';
  const subjects   = getAll('650','a').join(', ');
  const language   = get('041','a') || 'en';
  return {
    source: 'koha', biblionumber,
    title: title || `Record ${biblionumber}`,
    author: author.replace(/,$/, '').trim(),
    isbn: isbn.trim(),
    publisher: publisher.replace(/[,;]+$/, '').trim(),
    publication_year: pub_year,
    call_number: call_num.trim(),
    category: subjects || 'General',
    language: language === 'tam' ? 'Tamil' : language === 'sin' ? 'Sinhala' : 'English',
    collection_type: 'koha',
    branch: 'Eastern University',
    opac_url: `${KOHA_BASE}/cgi-bin/koha/opac-detail.pl?biblionumber=${biblionumber}`,
    cover_image: `/images/book-default.svg`,
    available_copies: 1,
    description: subjects,
  };
}

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const kohaOrigin = (() => {
  try { const u = new URL(process.env.KOHA_OPAC_URL || 'https://www.opac.lib.esn.ac.lk'); return `${u.protocol}//${u.host}`; } catch { return 'https://www.opac.lib.esn.ac.lk'; }
})();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", kohaOrigin],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["https://www.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || `http://localhost:${PORT}`).split(',').map(s => s.trim());
if (IS_PROD && ALLOWED_ORIGINS.every(o => o.startsWith('http://localhost'))) {
  console.warn('WARNING: ALLOWED_ORIGINS is not configured for production. Set it to your Vercel domain or all API calls will be blocked by CORS.');
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many messages sent. Please try again later.' } });
const eventRegLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many event registrations. Please try again later.' } });
const reservationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many reservation requests. Please try again later.' } });
const kohaLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many catalog requests. Please try again later.' } });

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// ---------- AUTH ----------
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { full_name, email, phone, password, member_category, address, date_of_birth, nic } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  try {
    const existing = await prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const membershipId = 'BPL' + crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const result = await prepare(`
      INSERT INTO users (full_name, email, phone, password_hash, role, member_category,
                         membership_id, membership_status, membership_expiry, address, date_of_birth, nic)
      VALUES (?, ?, ?, ?, 'public', ?, ?, 'pending', ?, ?, ?, ?)
    `).run(full_name, email, phone || null, hashPassword(password), member_category || 'Public Members',
           membershipId, expiry.toISOString().split('T')[0], address || null, date_of_birth || null, nic || null);
    await logAudit(result.lastInsertRowid, 'register', 'user', result.lastInsertRowid, email, req.ip);
    res.json({ success: true, message: 'Registration submitted. Awaiting librarian approval.', membership_id: membershipId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await prepare(
      'SELECT id, full_name, email, phone, role, member_category, membership_id, membership_status, membership_expiry, password_hash FROM users WHERE email = ?'
    ).get(email);
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role === 'public' && user.membership_status === 'pending') return res.status(403).json({ error: 'Your membership is pending approval. Please contact the library.' });
    if (user.role === 'public' && user.membership_status === 'suspended') return res.status(403).json({ error: 'Your membership has been suspended. Please contact the library.' });
    const token = signToken(user);
    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'strict', secure: IS_PROD, maxAge: 7 * 24 * 3600 * 1000 });
    await logAudit(user.id, 'login', 'user', user.id, email, req.ip);
    res.json({ success: true, user: { id: user.id, name: user.full_name, email: user.email, role: user.role, membership_id: user.membership_id, membership_status: user.membership_status } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.auth_token || (req.headers.authorization || '').replace('Bearer ', '');
  if (token) await revokeToken(token);
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prepare(
      'SELECT id, full_name, email, phone, role, member_category, membership_id, membership_status, membership_expiry FROM users WHERE id = ?'
    ).get(req.user.id);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/auth/password', authenticate, authLimiter, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
  if (typeof new_password !== 'string' || new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const user = await prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user || !verifyPassword(current_password, user.password_hash)) return res.status(401).json({ error: 'Current password is incorrect' });
    await prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(new_password), req.user.id);
    await logAudit(req.user.id, 'change_password', 'user', req.user.id, null, req.ip);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ---------- BOOKS / CATALOG ----------
function safeInt(val, def, min, max) {
  const n = parseInt(val, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function isSafeImageUrl(url) {
  if (!url) return true;
  const lower = String(url).trim().toLowerCase();
  return !lower.startsWith('javascript:') && !lower.startsWith('data:text') && !lower.startsWith('vbscript:');
}

app.get('/api/books', async (req, res) => {
  try {
    const { q, category, collection, branch, available } = req.query;
    const limit  = safeInt(req.query.limit,  50, 1, 200);
    const offset = safeInt(req.query.offset,  0, 0, 1e9);
    let where = ' WHERE (is_deleted IS NULL OR is_deleted = 0)';
    const params = [];
    if (q) {
      where += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (collection) { where += ' AND collection_type = ?'; params.push(collection); }
    if (branch) { where += ' AND branch = ?'; params.push(branch); }
    if (available === 'true') where += ' AND available_copies > 0';
    const countRow = await prepare(`SELECT COUNT(*) AS c FROM books${where}`).get(...params);
    const total = countRow.c;
    const books = await prepare(`SELECT * FROM books${where} ORDER BY added_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    res.json({ books, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/new-arrivals', async (req, res) => {
  try {
    // Prefer curated books with real cover images over DLP-synced placeholders
    const books = await prepare(
      `SELECT * FROM books
       WHERE cover_image IS NOT NULL AND cover_image != '/images/book-default.svg'
       ORDER BY added_at DESC LIMIT 8`
    ).all();
    // Fall back to most-recent if not enough curated books
    if (books.length < 8) {
      const ids = books.map(b => b.id);
      const placeholders = ids.length ? ids.map(() => '?').join(',') : '0';
      const extra = await prepare(
        `SELECT * FROM books WHERE id NOT IN (${placeholders}) ORDER BY added_at DESC LIMIT ?`
      ).all(...ids, 8 - books.length);
      books.push(...extra);
    }
    res.json({ books });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
});

// ---------- PUBLIC CATALOG SEARCH (DLP + Local, optimized for 80k rows) ----------
// Probes once at startup whether FTS5 is available and caches the result.
let _ftsAvailable = null;
async function ftsAvailable() {
  if (_ftsAvailable !== null) return _ftsAvailable;
  try {
    await prepare("SELECT rowid FROM dlp_books_fts LIMIT 1").get();
    _ftsAvailable = true;
  } catch {
    _ftsAvailable = false;
  }
  return _ftsAvailable;
}

// Escape a user query so it is safe to pass into an FTS5 MATCH expression.
// We convert it to a prefix phrase: each token becomes token* so partial words match.
function buildFtsQuery(q) {
  return q.trim()
    .replace(/["'*^(){}[\]\\]/g, ' ') // strip FTS special chars
    .split(/\s+/)
    .filter(Boolean)
    .map(t => `"${t}"*`)
    .join(' ');
}

app.get('/api/catalog/search', async (req, res) => {
  try {
    const q          = (req.query.q || '').trim();
    const source     = req.query.source || 'all';   // 'all' | 'local' | 'dlp'
    const category   = (req.query.category || '').trim();
    const branch     = (req.query.branch   || '').trim();
    const language   = (req.query.language || '').trim();
    const available  = req.query.available === 'true';
    const collection = (req.query.collection || '').trim();
    const limit      = safeInt(req.query.limit,  30, 1, 100);
    const offset     = safeInt(req.query.offset,  0, 0, 1e9);
    const useFts     = await ftsAvailable();

    const results = [];

    // ---- Helper: build a filter clause shared by both tables ----
    function buildFilters(prefix, params, tableName) {
      const conditions = [];
      if (category)   { conditions.push(`${prefix}category = ?`);         params.push(category); }
      if (branch)     { conditions.push(`${prefix}branch = ?`);           params.push(branch); }
      if (language)   { conditions.push(`${prefix}language = ?`);         params.push(language); }
      if (available)  { conditions.push(`${prefix}available_copies > 0`); }
      if (collection) { conditions.push(`${prefix}collection_type = ?`);  params.push(collection); }
      return conditions.length ? ' AND ' + conditions.join(' AND ') : '';
    }

    // ---- Search LOCAL books table ----
    if (source === 'all' || source === 'local') {
      const params = [];
      let sql;
      if (q) {
        if (useFts) {
          const ftsQ = buildFtsQuery(q);
          sql = `SELECT b.*, 'local' AS source_type, bfts.rank AS _rank
                 FROM books_fts bfts
                 JOIN books b ON b.id = bfts.rowid
                 WHERE books_fts MATCH ?`;
          params.push(ftsQ);
        } else {
          sql = `SELECT *, 'local' AS source_type, 0 AS _rank FROM books WHERE 1=1
                 AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)`;
          const like = `%${q}%`;
          params.push(like, like, like, like);
        }
      } else {
        sql = `SELECT *, 'local' AS source_type, 0 AS _rank FROM books WHERE 1=1`;
      }
      sql += buildFilters('b.', params, 'books');
      // For non-FTS branch the table alias differs, patch it
      if (!q || !useFts) sql = sql.replace(/b\./g, '');

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS c FROM').replace(/ORDER BY.*$/, '');
      try {
        const countRow = await prepare(countSql).get(...params);
        const localTotal = countRow?.c ?? 0;
        const rows = await prepare(sql + ` ORDER BY ${useFts && q ? '_rank' : 'added_at DESC'} LIMIT ? OFFSET ?`).all(...params, limit, offset);
        results.push({ source: 'local', total: localTotal, books: rows });
      } catch (e) {
        results.push({ source: 'local', total: 0, books: [], error: e.message });
      }
    }

    // ---- Search DLP books table (the big 80k table) ----
    if (source === 'all' || source === 'dlp') {
      const params = [];
      let sql;
      if (q) {
        if (useFts) {
          const ftsQ = buildFtsQuery(q);
          sql = `SELECT d.*, 'dlp' AS source_type, dfts.rank AS _rank
                 FROM dlp_books_fts dfts
                 JOIN dlp_books d ON d.id = dfts.rowid
                 WHERE dlp_books_fts MATCH ?`;
          params.push(ftsQ);
          sql += buildFilters('d.', params, 'dlp_books');
        } else {
          sql = `SELECT *, 'dlp' AS source_type, 0 AS _rank FROM dlp_books WHERE 1=1
                 AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`;
          const like = `%${q}%`;
          params.push(like, like, like);
          sql += buildFilters('', params, 'dlp_books');
        }
      } else {
        sql = `SELECT *, 'dlp' AS source_type, 0 AS _rank FROM dlp_books WHERE 1=1`;
        sql += buildFilters('', params, 'dlp_books');
      }

      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) AS c FROM').replace(/ORDER BY.*$/, '');
      try {
        const countRow = await prepare(countSql).get(...params);
        const dlpTotal = countRow?.c ?? 0;
        const orderBy  = useFts && q ? '_rank' : 'title ASC';
        const rows = await prepare(sql + ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, limit, offset);
        results.push({ source: 'dlp', total: dlpTotal, books: rows });
      } catch (e) {
        results.push({ source: 'dlp', total: 0, books: [], error: e.message });
      }
    }

    res.json({ results, fts: useFts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Catalog search failed' });
  }
});

function toCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = v => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\r\n');
}

app.get('/api/books/export', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const rows = await prepare(
      'SELECT id, isbn, title, author, publisher, publication_year, category, collection_type, language, call_number, total_copies, available_copies, branch, added_at FROM books ORDER BY title'
    ).all();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="books.csv"');
    res.send(toCsv(rows));
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await prepare('SELECT * FROM books WHERE id = ? AND (is_deleted IS NULL OR is_deleted = 0)').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ book });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

app.post('/api/books', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  const { isbn, title, author, publisher, publication_year, category, collection_type,
          language, call_number, description, cover_image, total_copies, branch } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });
  if (!isSafeImageUrl(cover_image)) return res.status(400).json({ error: 'Invalid cover_image URL' });
  try {
    const copies = parseInt(total_copies) || 1;
    const result = await prepare(`
      INSERT INTO books (isbn, title, author, publisher, publication_year, category, collection_type,
                         language, call_number, description, cover_image, total_copies, available_copies, branch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(isbn, title, author, publisher, publication_year, category || 'General',
           collection_type || 'lending', language || 'English', call_number, description,
           cover_image, copies, copies, branch || 'Main');
    await logAudit(req.user.id, 'create', 'book', result.lastInsertRowid, title, req.ip);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

app.put('/api/books/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (req.body.cover_image !== undefined && !isSafeImageUrl(req.body.cover_image)) return res.status(400).json({ error: 'Invalid cover_image URL' });
    const fields = ['isbn','title','author','publisher','publication_year','category','collection_type','language','call_number','description','cover_image','total_copies','branch'];
    const updates = [];
    const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    if (req.body.total_copies !== undefined) {
      const newTotal = parseInt(req.body.total_copies);
      const loanedOut = book.total_copies - book.available_copies;
      const newAvailable = Math.max(0, newTotal - loanedOut);
      updates.push('available_copies = ?');
      params.push(newAvailable);
    }
    params.push(req.params.id);
    await prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    await logAudit(req.user.id, 'update', 'book', req.params.id, null, req.ip);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const activeLoans = await prepare("SELECT COUNT(*) AS c FROM loans WHERE book_id = ? AND status = 'active'").get(req.params.id);
    if (activeLoans.c > 0) return res.status(400).json({ error: 'Cannot delete book with active loans' });
    await prepare("UPDATE books SET is_deleted = 1 WHERE id = ?").run(req.params.id);
    await logAudit(req.user.id, 'delete', 'book', req.params.id, book.title, req.ip);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// ---------- LOANS / CIRCULATION ----------
app.post('/api/loans', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  const { user_id, book_id } = req.body;
  const days = safeInt(req.body.days ?? 14, 14, 1, 365);
  if (!user_id || !book_id) return res.status(400).json({ error: 'user_id and book_id are required' });
  try {
    const member = await prepare('SELECT id, membership_status, membership_expiry FROM users WHERE id = ?').get(user_id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.membership_status !== 'active') return res.status(400).json({ error: 'Member does not have an active membership' });
    if (member.membership_expiry && new Date(member.membership_expiry) < new Date()) return res.status(400).json({ error: 'Member membership has expired. Please renew before borrowing.' });
    const book = await prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.collection_type === 'reference') return res.status(400).json({ error: 'Reference books cannot be loaned' });
    const existingLoan = await prepare("SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = 'active'").get(user_id, book_id);
    if (existingLoan) return res.status(400).json({ error: 'Member already has this book on loan' });
    const dueDate = new Date(Date.now() + days * 86400000).toISOString();
    let result;
    try {
      result = await transaction(async () => {
        const info = await prepare(
          'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0'
        ).run(book_id);
        if (info.changes === 0) throw Object.assign(new Error('No copies available'), { status: 400 });
        const ins = await prepare('INSERT INTO loans (user_id, book_id, due_date) VALUES (?, ?, ?)').run(user_id, book_id, dueDate);
        await prepare("UPDATE reservations SET status = 'fulfilled' WHERE user_id = ? AND book_id = ? AND status = 'pending'").run(user_id, book_id);
        return ins;
      })();
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message });
    }
    await logAudit(req.user.id, 'issue', 'loan', result.lastInsertRowid, `book ${book_id} to user ${user_id}`, req.ip);
    res.json({ success: true, id: result.lastInsertRowid, due_date: dueDate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

function getFineRate(book) {
  const type = (book.collection_type || '').toLowerCase();
  const cat  = (book.category || '').toLowerCase();
  if (type === 'children' || cat.includes('children') || cat.includes('junior') || cat.includes('young adult')) return 5;
  if (type === 'periodicals' || type === 'periodical' || cat.includes('periodical') || cat.includes('journal') || cat.includes('magazine')) return 15;
  if (type === 'av' || type === 'media' || cat.includes('audio') || cat.includes('video') || cat.includes(' av ')) return 20;
  return 10; // default
}

app.post('/api/loans/:id/return', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const loan = await prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status === 'returned') return res.status(400).json({ error: 'Already returned' });
    const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(loan.due_date).getTime()) / 86400000));
    const loanedBook = await prepare('SELECT collection_type, category FROM books WHERE id = ?').get(loan.book_id);
    const fine = overdueDays * getFineRate(loanedBook || {});
    await transaction(async () => {
      await prepare('UPDATE loans SET returned_at = CURRENT_TIMESTAMP, status = ?, fine_amount = ? WHERE id = ?').run('returned', fine, req.params.id);
      await prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(loan.book_id);
    })();
    await logAudit(req.user.id, 'return', 'loan', req.params.id, `fine: ${fine}`, req.ip);
    res.json({ success: true, fine });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to process return' });
  }
});

app.get('/api/loans', authenticate, async (req, res) => {
  try {
    const { status, user_id } = req.query;
    const conditions = [];
    const params = [];
    if (req.user.role === 'public') {
      conditions.push('l.user_id = ?');
      params.push(req.user.id);
    } else if (user_id) {
      conditions.push('l.user_id = ?');
      params.push(user_id);
    }
    if (status) { conditions.push('l.status = ?'); params.push(status); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const loanLimit  = safeInt(req.query.limit,  100, 1, 500);
    const loanOffset = safeInt(req.query.offset,   0, 0, 1e9);
    const countSql = `SELECT COUNT(*) AS c FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id ${where}`;
    const countRow = await prepare(countSql).get(...params);
    const sql = `SELECT l.*, b.title, b.author, u.full_name AS member_name, u.membership_id
                 FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id
                 ${where} ORDER BY l.borrowed_at DESC LIMIT ? OFFSET ?`;
    res.json({ loans: await prepare(sql).all(...params, loanLimit, loanOffset), total: countRow.c, limit: loanLimit, offset: loanOffset });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

app.get('/api/loans/export', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const rows = await prepare(
      `SELECT l.id, u.full_name AS member_name, u.membership_id, b.title, b.author,
              l.borrowed_at, l.due_date, l.returned_at, l.status, l.fine_amount
       FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id
       ORDER BY l.borrowed_at DESC`
    ).all();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="loans.csv"');
    res.send(toCsv(rows));
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/loans/:id', authenticate, async (req, res) => {
  try {
    const loan = await prepare(`
      SELECT l.*, b.title, b.author, u.full_name AS member_name, u.membership_id
      FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (req.user.role === 'public' && loan.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json({ loan });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch loan' });
  }
});

// ---------- RESERVATIONS ----------
app.post('/api/reservations', reservationLimiter, authenticate, async (req, res) => {
  const { book_id } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id is required' });
  try {
    const book = await prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.available_copies > 0) return res.status(400).json({ error: 'This book is currently available. Please borrow it directly instead of reserving.' });
    const reservingMember = await prepare('SELECT membership_status, membership_expiry FROM users WHERE id = ?').get(req.user.id);
    if (!reservingMember || reservingMember.membership_status !== 'active') return res.status(400).json({ error: 'You must have an active membership to place a reservation' });
    if (reservingMember.membership_expiry && new Date(reservingMember.membership_expiry) < new Date()) return res.status(400).json({ error: 'Your membership has expired. Please renew before placing a reservation.' });
    const existing = await prepare("SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'pending'").get(req.user.id, book_id);
    if (existing) return res.status(409).json({ error: 'You already have a pending reservation for this book' });
    const activeLoad = await prepare("SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = 'active'").get(req.user.id, book_id);
    if (activeLoad) return res.status(400).json({ error: 'You already have this book on loan' });
    const result = await prepare('INSERT INTO reservations (user_id, book_id) VALUES (?, ?)').run(req.user.id, book_id);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

app.get('/api/reservations', authenticate, async (req, res) => {
  try {
    let sql = `SELECT r.*, b.title, b.author, u.full_name AS member_name
               FROM reservations r JOIN books b ON r.book_id = b.id JOIN users u ON r.user_id = u.id`;
    const params = [];
    if (req.user.role === 'public') { sql += ' WHERE r.user_id = ?'; params.push(req.user.id); }
    sql += ' ORDER BY r.reserved_at DESC';
    res.json({ reservations: await prepare(sql).all(...params) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.delete('/api/reservations/:id', authenticate, async (req, res) => {
  try {
    const reservation = await prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (req.user.role === 'public' && reservation.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    await prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

app.post('/api/reservations/:id/fulfill', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const reservation = await prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (reservation.status !== 'pending') return res.status(400).json({ error: 'Reservation is not pending' });
    await prepare("UPDATE reservations SET status = 'fulfilled' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fulfill reservation' });
  }
});

// ---------- EVENTS ----------
app.get('/api/events', async (req, res) => {
  try {
    const { upcoming } = req.query;
    let sql = 'SELECT * FROM events';
    if (upcoming === 'true') sql += " WHERE event_date >= datetime('now')";
    sql += ' ORDER BY event_date ASC';
    res.json({ events: await prepare(sql).all() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/export', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const rows = await prepare(
      'SELECT id, title, description, event_date, location, category, capacity, registration_open, created_at FROM events ORDER BY event_date DESC'
    ).all();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
    res.send(toCsv(rows));
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const row = await prepare('SELECT COUNT(*) AS c FROM event_registrations WHERE event_id = ?').get(req.params.id);
    res.json({ event, registered: row.c });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.post('/api/events', authenticate, authorize('admin', 'librarian', 'event_coordinator'), async (req, res) => {
  const { title, description, event_date, location, category, capacity, image } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'Title and date required' });
  try {
    const result = await prepare(`
      INSERT INTO events (title, description, event_date, location, category, capacity, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, event_date, location, category || 'general', capacity || 50, image);
    await logAudit(req.user.id, 'create', 'event', result.lastInsertRowid, title, req.ip);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/events/:id', authenticate, authorize('admin', 'librarian', 'event_coordinator'), async (req, res) => {
  try {
    const event = await prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const fields = ['title','description','event_date','location','category','capacity','image','registration_open'];
    const updates = [];
    const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    await logAudit(req.user.id, 'update', 'event', req.params.id, null, req.ip);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', authenticate, authorize('admin', 'librarian', 'event_coordinator'), async (req, res) => {
  try {
    const event = await prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await prepare('DELETE FROM event_registrations WHERE event_id = ?').run(req.params.id);
    await prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    await logAudit(req.user.id, 'delete', 'event', req.params.id, event.title, req.ip);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.post('/api/events/:id/register', eventRegLimiter, optionalAuth, async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user?.id || null;
  if (!userId && (!name || !email)) return res.status(400).json({ error: 'Name and email are required for registration' });
  try {
    const event = await prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!event.registration_open) return res.status(400).json({ error: 'Registration closed' });
    const countRow = await prepare('SELECT COUNT(*) AS c FROM event_registrations WHERE event_id = ?').get(req.params.id);
    if (countRow.c >= event.capacity) return res.status(400).json({ error: 'Event is full' });
    if (userId) {
      const dup = await prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(req.params.id, userId);
      if (dup) return res.status(409).json({ error: 'You are already registered for this event' });
    } else if (email) {
      const dup = await prepare('SELECT id FROM event_registrations WHERE event_id = ? AND email = ?').get(req.params.id, email);
      if (dup) return res.status(409).json({ error: 'This email is already registered for this event' });
    }
    await prepare('INSERT INTO event_registrations (event_id, user_id, name, email, phone) VALUES (?, ?, ?, ?, ?)').run(req.params.id, userId, name || req.user?.name || null, email || req.user?.email || null, phone || null);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// ---------- ANNOUNCEMENTS ----------
app.get('/api/announcements', async (req, res) => {
  try {
    const sql = `SELECT * FROM announcements
                 WHERE publish_at <= datetime('now')
                 AND (expires_at IS NULL OR expires_at >= datetime('now'))
                 ORDER BY featured DESC, emergency DESC, publish_at DESC`;
    res.json({ announcements: await prepare(sql).all() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/announcements', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  const { title, body, category, featured, emergency, publish_at, expires_at } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Announcement title is required' });
  if (!body || typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'Announcement body is required' });
  if (title.length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer' });
  if (body.length > 5000) return res.status(400).json({ error: 'Body must be 5000 characters or fewer' });
  try {
    const result = await prepare(`
      INSERT INTO announcements (title, body, category, featured, emergency, publish_at, expires_at)
      VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
    `).run(title, body, category || 'general', featured ? 1 : 0, emergency ? 1 : 0, publish_at || null, expires_at || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

app.put('/api/announcements/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const ann = await prepare('SELECT id FROM announcements WHERE id = ?').get(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });
    const fields = ['title','body','category','featured','emergency','publish_at','expires_at'];
    const updates = [];
    const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await prepare(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

app.delete('/api/announcements/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const ann = await prepare('SELECT id FROM announcements WHERE id = ?').get(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });
    await prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

app.get('/api/announcements/export', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const rows = await prepare(
      'SELECT id, title, category, featured, emergency, publish_at, expires_at, created_at FROM announcements ORDER BY created_at DESC'
    ).all();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="announcements.csv"');
    res.send(toCsv(rows));
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// ---------- CONTACT / ASK LIBRARIAN ----------
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message, department } = req.body;
  const phone = req.body.phone != null ? String(req.body.phone) : null;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message required' });
  if (typeof message === 'string' && message.length > 2000) return res.status(400).json({ error: 'Message must be 2000 characters or fewer' });
  try {
    await prepare(`INSERT INTO contact_messages (name, email, phone, subject, message, department) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(name, email, phone, subject, message, department);
    res.json({ success: true, message: 'Thank you. We will respond within 24 hours.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/contact', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM contact_messages';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json({ messages: await prepare(sql).all(...params) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.put('/api/contact/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const msg = await prepare('SELECT id FROM contact_messages WHERE id = ?').get(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const { status } = req.body;
    if (!status || !['new','read','resolved'].includes(status)) return res.status(400).json({ error: 'status must be one of: new, read, resolved' });
    await prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

app.post('/api/ask-librarian', contactLimiter, optionalAuth, async (req, res) => {
  const { name, email, request_type, topic, details } = req.body;
  if (!name || !email || !details) return res.status(400).json({ error: 'Required fields missing' });
  if (typeof details === 'string' && details.length > 2000) return res.status(400).json({ error: 'Details must be 2000 characters or fewer' });
  try {
    await prepare(`INSERT INTO librarian_requests (user_id, name, email, request_type, topic, details) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(req.user?.id || null, name, email, request_type || null, topic || null, details);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

app.get('/api/ask-librarian', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM librarian_requests';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json({ requests: await prepare(sql).all(...params) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.put('/api/ask-librarian/:id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const row = await prepare('SELECT id FROM librarian_requests WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Request not found' });
    const { status } = req.body;
    if (!status || !['open','in_progress','resolved'].includes(status)) return res.status(400).json({ error: 'status must be one of: open, in_progress, resolved' });
    await prepare('UPDATE librarian_requests SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// ---------- USERS / MEMBERSHIP ----------
app.get('/api/users', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const { status, role, q } = req.query;
    let sql = 'SELECT id, full_name, email, phone, role, member_category, membership_id, membership_status, membership_expiry, address, date_of_birth, nic, created_at FROM users WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND membership_status = ?'; params.push(status); }
    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (q) {
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR membership_id LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY created_at DESC';
    res.json({ users: await prepare(sql).all(...params) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/export', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const rows = await prepare(
      `SELECT id, full_name, email, phone, role, member_category, membership_id,
              membership_status, membership_expiry, created_at FROM users ORDER BY created_at DESC`
    ).all();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
    res.send(toCsv(rows));
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'public' && req.user.id !== parseInt(req.params.id)) return res.status(403).json({ error: 'Access denied' });
    const user = await prepare(
      'SELECT id, full_name, email, phone, role, member_category, membership_id, membership_status, membership_expiry, address, date_of_birth, nic, created_at FROM users WHERE id = ?'
    ).get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const isAdmin = ['admin', 'librarian'].includes(req.user.role);
    if (!isAdmin && req.user.id !== targetId) return res.status(403).json({ error: 'Access denied' });
    const user = await prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const memberFields = ['full_name','phone','address'];
    const adminFields = [...memberFields, 'member_category','membership_status','membership_expiry','date_of_birth','nic'];
    const allowed = isAdmin ? adminFields : memberFields;
    const updates = [];
    const params = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'No updatable fields provided' });
    params.push(targetId);
    await prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    await logAudit(req.user.id, 'update_user', 'user', targetId, null, req.ip);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/users/:id/approve', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const user = await prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prepare("UPDATE users SET membership_status = 'active' WHERE id = ?").run(req.params.id);
    await logAudit(req.user.id, 'approve_membership', 'user', req.params.id, null, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.post('/api/users/:id/suspend', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const user = await prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prepare("UPDATE users SET membership_status = 'suspended' WHERE id = ?").run(req.params.id);
    await logAudit(req.user.id, 'suspend_membership', 'user', req.params.id, null, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

app.post('/api/users/:id/role', authenticate, authorize('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['public', 'librarian', 'admin', 'event_coordinator'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const user = await prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    await logAudit(req.user.id, 'change_role', 'user', req.params.id, role, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to change role' });
  }
});

// ---------- DASHBOARD STATS ----------
app.get('/api/stats', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const [
      total_books, total_copies, available_copies,
      total_members, active_members, pending_members, suspended_members,
      active_loans, overdue_loans, total_fines,
      pending_reservations, upcoming_events, new_messages,
      open_librarian_requests, popular_books
    ] = await Promise.all([
      prepare('SELECT COUNT(*) AS c FROM books').get(),
      prepare('SELECT COALESCE(SUM(total_copies),0) AS c FROM books').get(),
      prepare('SELECT COALESCE(SUM(available_copies),0) AS c FROM books').get(),
      prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'public'").get(),
      prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'public' AND membership_status = 'active'").get(),
      prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'public' AND membership_status = 'pending'").get(),
      prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'public' AND membership_status = 'suspended'").get(),
      prepare("SELECT COUNT(*) AS c FROM loans WHERE status = 'active'").get(),
      prepare("SELECT COUNT(*) AS c FROM loans WHERE status = 'active' AND due_date < datetime('now')").get(),
      prepare("SELECT COALESCE(SUM(fine_amount),0) AS c FROM loans WHERE fine_amount > 0").get(),
      prepare("SELECT COUNT(*) AS c FROM reservations WHERE status = 'pending'").get(),
      prepare("SELECT COUNT(*) AS c FROM events WHERE event_date >= datetime('now')").get(),
      prepare("SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'").get(),
      prepare("SELECT COUNT(*) AS c FROM librarian_requests WHERE status = 'open'").get(),
      prepare(`SELECT b.title, b.author, COUNT(l.id) AS loan_count
               FROM books b LEFT JOIN loans l ON b.id = l.book_id
               GROUP BY b.id ORDER BY loan_count DESC LIMIT 5`).all(),
    ]);
    res.json({
      total_books: total_books.c, total_copies: total_copies.c, available_copies: available_copies.c,
      total_members: total_members.c, active_members: active_members.c,
      pending_members: pending_members.c, suspended_members: suspended_members.c,
      active_loans: active_loans.c, overdue_loans: overdue_loans.c,
      total_fines: total_fines.c,
      pending_reservations: pending_reservations.c, upcoming_events: upcoming_events.c,
      new_messages: new_messages.c, open_librarian_requests: open_librarian_requests.c,
      popular_books,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ---------- KOHA OPAC PROXY ----------
app.get('/api/koha/search', kohaLimiter, async (req, res) => {
  const { q = '', idx = 'kw', page = 1, count = 20 } = req.query;
  if (!q.trim()) return res.json({ books: [], total: 0, source: 'koha' });
  const searchKey = `${q}|${idx}|${page}|${count}`;
  const cached = cacheGet(searchCache, searchKey);
  if (cached) return res.json({ ...cached, cached: true });
  try {
    const feedUrl = `${KOHA_SEARCH}?q=${encodeURIComponent(q)}&idx=${encodeURIComponent(idx)}&format=atom&count=${count}&pw=${page}`;
    const feedXml = await kohaFetchCached(feedUrl, searchCache, `feed|${searchKey}`, SEARCH_TTL);
    const feed = xmlParser.parse(feedXml);
    const feedRoot = feed?.feed;
    if (!feedRoot) return res.json({ books: [], total: 0, source: 'koha' });
    const total = parseInt(feedRoot['opensearch:totalResults']) || 0;
    const entries = [].concat(feedRoot.entry || []);
    const items = entries.map(e => {
      const idStr = e.id || e.link?.['@_href'] || '';
      const m = String(idStr).match(/biblionumber=(\d+)/);
      return m ? { biblionumber: m[1], title: e.title } : null;
    }).filter(Boolean);
    const books = (await Promise.allSettled(
      items.slice(0, 20).map(async ({ biblionumber, title }) => {
        try {
          const unapiUrl = `${KOHA_UNAPI}?id=koha:biblionumber:${biblionumber}&format=marcxml`;
          const marcXml = await kohaFetchCached(unapiUrl, marcCache, biblionumber, MARC_TTL);
          const book = marcXmlToBook(marcXml, biblionumber);
          if (book) return book;
          return { source: 'koha', biblionumber, title: String(title || '').replace(/\s+,\s*$/, '').trim() || `Record ${biblionumber}`, author: '', isbn: '', publisher: '', publication_year: null, call_number: '', category: 'General', language: 'English', collection_type: 'koha', branch: 'Eastern University', opac_url: `${KOHA_BASE}/cgi-bin/koha/opac-detail.pl?biblionumber=${biblionumber}`, cover_image: '/images/book-default.svg', available_copies: 1, description: '' };
        } catch { return null; }
      })
    )).map(r => r.value).filter(Boolean);
    const result = { books, total, source: 'koha', page: parseInt(page), count: parseInt(count) };
    cacheSet(searchCache, searchKey, result, SEARCH_TTL);
    res.json(result);
  } catch (e) {
    log.error('Koha proxy error', { err: e.message });
    res.status(502).json({ error: 'Unable to reach Koha OPAC. Please try again later.' });
  }
});

app.get('/api/koha/cache-stats', authenticate, authorize('admin', 'librarian'), (req, res) => {
  res.json({ marc_entries: marcCache.size, search_entries: searchCache.size, in_flight: inFlight.size });
});

app.delete('/api/koha/cache', authenticate, authorize('admin', 'librarian'), (req, res) => {
  marcCache.clear();
  searchCache.clear();
  res.json({ success: true, message: 'Koha cache cleared' });
});

// ---------- SMART CHAT AGENT ----------

const CHAT_KB = [
  { patterns: ['hour','open','close','time','when','schedule'], answer: 'The library is open Monday to Sunday, 8:00 AM – 5:00 PM.\n\nMain Branch: Braiyan Drive, Batticaloa, Eastern Province, Sri Lanka.\n\nPhone: 065-2222484\nMobile: 077-6718944\nEmail: batticaloalibrary@gmail.com' },
  { patterns: ['membership','member','join','register','fee','cost','price','card'], answer: 'Membership is available to everyone:\n\n• Adults (18–64): LKR 500/year\n• Students: FREE (student ID required)\n• Senior Citizens (65+): FREE\n• Persons with Disabilities: FREE\n• Life Membership: LKR 5,000 (one-time)\n\nYou can register online at batticaloalibrary.lk/register or visit the library in person with a valid photo ID.' },
  { patterns: ['renew','renewal','extend','extension'], answer: 'To renew borrowed items, please:\n• Call us: 065-2222484\n• Visit the library counter in person\n\nItems can be renewed up to 2 times, provided no one else has reserved them. Overdue items must have fines settled before renewal.' },
  { patterns: ['reserve','reservation','hold','request','waiting'], answer: 'You can place holds on items currently on loan through your member dashboard or by visiting the library. Up to 3 active holds are allowed per member.\n\nWhen your item is ready, we\'ll notify you by email. Reserved items are held for 5 business days.' },
  { patterns: ['fine','penalty','overdue','pay','payment'], answer: 'Overdue fines are:\n• Regular books: LKR 10/day\n• Children\'s books: LKR 5/day\n• Periodicals: LKR 15/day\n• AV materials: LKR 20/day\n\nFines can be paid at the library counter or through your member dashboard. Memberships with fines over LKR 500 may be suspended.' },
  { patterns: ['wifi','wi-fi','internet','computer','digital','online','ebook','e-book','database'], answer: 'Digital services available to all members:\n\n• Free Wi-Fi throughout the library\n• Public computer terminals (60-min sessions)\n• E-book and e-journal access\n• Online research databases\n• Document scanning & printing (B&W: LKR 5/page, Colour: LKR 15/page)\n• Digital archive of Eastern Province heritage materials' },
  { patterns: ['koha','opac','catalogue'], answer: 'Our catalog is powered by the Koha Integrated Library System, shared with Eastern University Library and partner libraries.\n\nYou can search the catalog at:\n• Our website: /catalog (local collection)\n• Koha OPAC: opac.lib.esn.ac.lk (all partner libraries)\n\nSearch by title, author, ISBN, subject, or call number.' },
  { patterns: ['event','program','programme','workshop','storytime'], answer: 'We offer many community programs including:\n\n• Children\'s Storytime (Saturdays 10:00 AM)\n• Digital Literacy Workshops\n• Author Meet & Greet events\n• Tamil Heritage Reading Circle (monthly)\n• Research Skills Training\n• Maker Space workshops (3D printing, electronics)\n\nView all upcoming events at /events.' },
  { patterns: ['maker','makerspace','3d','3d print','robot','electronic','stem'], answer: 'Our Maker Space is open to all members and features:\n\n• 3D printers\n• Electronics kits and prototyping tools\n• Design workstations\n• Coding resources\n\nBookings required for 3D printing. Visit /services or call us to reserve a session.' },
  { patterns: ['research','reference','academic','thesis','journal','scholar'], answer: 'Our research support services include:\n\n• Reference librarian consultations (by appointment)\n• Access to academic databases\n• Inter-library loan requests\n• Citation and bibliography assistance\n• Quiet study rooms (bookable for 2-hour sessions)\n\nEmail reference@batticaloalibrary.lk.' },
  { patterns: ['lost card','lost membership','replace card','lost id'], answer: 'If you\'ve lost your library membership card:\n\n1. Visit the library in person with photo ID\n2. A replacement card will be issued for LKR 100\n3. Your borrowing record and history will be preserved' },
  { patterns: ['contact','phone','email','address','location','reach','staff','librarian'], answer: 'Contact Batticaloa Public Library:\n\nBraiyan Drive, Batticaloa, Sri Lanka\nOffice: 065-2222484\nMobile: 077-6718944\nWhatsApp: 071-2222484\nEmail: batticaloalibrary@gmail.com\n\nVisit /contact to send us a message.' },
  { patterns: ['policy','policies','rules','regulation','terms','condition','privacy'], answer: 'Our library policies cover:\n\n• Lending & Borrowing Policy\n• Membership Policy\n• Privacy Policy\n• Computer & Internet Use Policy\n• Code of Conduct\n• Accessibility Statement (WCAG 2.1)\n\nRead our full policies at /policies.' },
  { patterns: ['accessible','accessibility','disability','disabled','wheelchair','blind','deaf'], answer: 'Batticaloa Library is committed to accessibility:\n\n• Ground-floor ramp access\n• Accessible restrooms\n• Large-print books available on request\n• Screen-reader compatible computer terminals\n• Our website meets WCAG 2.1 Level AA\n• Free membership for persons with disabilities\n\nContact us at access@batticaloalibrary.lk.' },
  { patterns: ['thank','thanks','great','perfect','helpful','awesome'], answer: 'You\'re very welcome! Is there anything else I can help you with?\n\nYou can also visit us in person, call 065-2222484, or email batticaloalibrary@gmail.com.' },
  { patterns: ['complaint','feedback','suggestion','improve','problem','issue','report'], answer: 'We value your feedback! You can:\n\n• Fill in our feedback form at /contact\n• Email us at feedback@batticaloalibrary.lk\n• Speak to the Head Librarian at the service desk\n\nFormal complaints can be made in writing to the Library Director.' },
];

// Genre/category keyword mapping for intent detection
const GENRE_KEYWORDS = {
  mystery:     ['mystery','detective','crime','whodunit','thriller','suspense','noir'],
  fiction:     ['fiction','novel','story','stories','literature','literary'],
  history:     ['history','historical','ancient','war','biography','memoir','autobiography'],
  science:     ['science','physics','chemistry','biology','astronomy','mathematics','math'],
  fantasy:     ['fantasy','magic','wizard','dragon','myth','mythology','folklore'],
  romance:     ['romance','love','relationship'],
  children:    ['children','kids','picture book','young adult','ya','junior','school'],
  poetry:      ['poetry','poem','poems','verse','tamil poetry','sinhala poetry'],
  selfhelp:    ['self-help','self help','motivation','productivity','mindset','wellbeing','wellness'],
  religion:    ['religion','religious','islam','buddhism','hinduism','christianity','spirituality'],
  politics:    ['politics','political','government','economics','economy'],
  geography:   ['geography','travel','nature','environment','ecology'],
  technology:  ['technology','computing','programming','ai','artificial intelligence','coding'],
};

const LANG_KEYWORDS = {
  Tamil:   ['tamil','தமிழ்'],
  Sinhala: ['sinhala','sinhalese','sinhalen','සිංහල'],
  English: ['english'],
};

async function searchBooks(query, { category, language, availableOnly = false, limit = 5, excludeIds = [] } = {}) {
  const cap = Math.min(limit, 10);
  const like = `%${query}%`;

  // Split into meaningful terms for multi-word queries
  const terms = query.trim().split(/\s+/).filter(t => t.length > 2);

  function buildTermConditions(cols, params) {
    if (terms.length <= 1) {
      const flat = cols.map(c => `${c} LIKE ?`).join(' OR ');
      params.push(...cols.map(() => like));
      return `(${flat})`;
    }
    // Each word must appear in at least one column (AND of ORs)
    const perTerm = terms.map(t => {
      const tl = `%${t}%`;
      params.push(...cols.map(() => tl));
      return `(${cols.map(c => `${c} LIKE ?`).join(' OR ')})`;
    });
    return perTerm.join(' AND ');
  }

  // Build local books query
  const localParams = [];
  const localTermCond = buildTermConditions(['b.title', 'b.author', 'b.category', 'b.description'], localParams);
  let localWhere = `WHERE (${localTermCond})`;
  if (category) { localWhere += ' AND b.category LIKE ?'; localParams.push(`%${category}%`); }
  if (language) { localWhere += ' AND b.language = ?'; localParams.push(language); }
  if (availableOnly) { localWhere += ' AND b.available_copies > 0'; }
  if (excludeIds.length) { localWhere += ` AND b.id NOT IN (${excludeIds.map(() => '?').join(',')})`; localParams.push(...excludeIds); }

  // Score: exact title match ranks higher than partial match
  const localBooks = await prepare(
    `SELECT b.id, b.title, b.author, b.category, b.language, b.available_copies, b.cover_image, b.branch, 'local' AS source,
       (CASE WHEN LOWER(b.title) = LOWER(?) THEN 3 WHEN LOWER(b.title) LIKE ? THEN 2 ELSE 1 END) AS relevance
     FROM books b ${localWhere}
     ORDER BY relevance DESC, b.available_copies DESC
     LIMIT ?`
  ).all([query, like, ...localParams, cap]);

  const remaining = cap - localBooks.length;
  let dlpBooks = [];
  if (remaining > 0) {
    const dlpParams = [];
    const dlpTermCond = buildTermConditions(['d.title', 'd.author', 'd.category', 'd.description'], dlpParams);
    let dlpWhere = `WHERE (${dlpTermCond})`;
    if (category) { dlpWhere += ' AND d.category LIKE ?'; dlpParams.push(`%${category}%`); }
    if (language) { dlpWhere += ' AND d.language LIKE ?'; dlpParams.push(`%${language}%`); }
    if (availableOnly) { dlpWhere += ' AND d.available_copies > 0'; }

    dlpBooks = await prepare(
      `SELECT d.id, d.title, d.author, d.category, d.language, d.available_copies, NULL AS cover_image, d.branch, 'dlp' AS source,
         (CASE WHEN LOWER(d.title) = LOWER(?) THEN 3 WHEN LOWER(d.title) LIKE ? THEN 2 ELSE 1 END) AS relevance
       FROM dlp_books d ${dlpWhere}
       ORDER BY relevance DESC, d.available_copies DESC, d.checkouts_count DESC NULLS LAST
       LIMIT ?`
    ).all([query, like, ...dlpParams, remaining]);
  }

  return [...localBooks, ...dlpBooks];
}

async function getUserHistory(userId, limit = 10) {
  return prepare(
    `SELECT b.title, b.author, b.category FROM loans l
     JOIN books b ON l.book_id = b.id
     WHERE l.user_id = ? ORDER BY l.borrowed_at DESC LIMIT ?`
  ).all([userId, limit]);
}

async function getReaderProfile(sessionId) {
  return prepare('SELECT * FROM reader_profiles WHERE session_id = ?').get(sessionId);
}

async function saveReaderProfile(sessionId, { preferred_genres, preferred_authors, preferred_languages }) {
  const existing = await getReaderProfile(sessionId);
  if (existing) {
    await prepare(
      `UPDATE reader_profiles SET preferred_genres = ?, preferred_authors = ?, preferred_languages = ?,
       updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`
    ).run([
      preferred_genres ? JSON.stringify(preferred_genres) : existing.preferred_genres,
      preferred_authors ? JSON.stringify(preferred_authors) : existing.preferred_authors,
      preferred_languages ? JSON.stringify(preferred_languages) : existing.preferred_languages,
      sessionId,
    ]);
  } else {
    await prepare(
      `INSERT INTO reader_profiles (session_id, preferred_genres, preferred_authors, preferred_languages)
       VALUES (?, ?, ?, ?)`
    ).run([
      sessionId,
      preferred_genres ? JSON.stringify(preferred_genres) : null,
      preferred_authors ? JSON.stringify(preferred_authors) : null,
      preferred_languages ? JSON.stringify(preferred_languages) : null,
    ]);
  }
}

function classifyIntent(lower) {
  // Greeting
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy)\b/.test(lower)) return 'GREETING';

  // User history / personalised
  if (/\b(what have i read|my history|books i borrowed|past loans|what should i read next|based on my history|recommend for me)\b/.test(lower)) return 'USER_HISTORY';

  // Direct book title search — "do you have X", "find X", "search for X", "looking for X"
  if (/\b(do you have|do you carry|is there|find|search for|looking for|get me|show me|i need)\b.{2,60}(book|novel|title|copy)/i.test(lower)) return 'TITLE_SEARCH';
  if (/\b(do you have|is .{2,50} available|find .{2,50} by)\b/.test(lower)) return 'TITLE_SEARCH';

  // Similar book
  if (/\b(similar to|like the book|like harry|enjoyed|loved|read .{3,40} and|books like|more like|fans of|if you liked)\b/.test(lower)) return 'SIMILAR';

  // Author search
  if (/\b(books by|by the author|written by|author named|author called|works of|titles by|anything by)\b/.test(lower)) return 'AUTHOR_SEARCH';

  // Availability check
  if (/\b(available now|in stock|can i borrow|copies available|is .{3,40} available|currently available)\b/.test(lower)) return 'AVAILABILITY';

  // Explicit recommend / suggest / find
  if (/\b(recommend|suggest|suggestion|find me a book|looking for a book|good book|any books|books about|books on|i want to read|what to read|what should i read|give me a book|popular books|best books|top books|new books|latest books)\b/.test(lower)) return 'RECOMMEND';

  // Genre keywords — only if they appear standalone (not inside FAQ patterns)
  for (const [, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return 'GENRE_SEARCH';
  }

  // How many / collection size
  if (/\b(how many book|total book|collection size|number of book)\b/.test(lower)) return 'COLLECTION_SIZE';

  return 'FAQ';
}

function extractGenre(lower) {
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return genre;
  }
  return null;
}

function extractLanguage(lower) {
  for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return lang;
  }
  return null;
}

function extractSimilarTitle(lower) {
  const match = lower.match(/(?:similar to|like the book|books like|enjoyed|loved|read|fans of|if you liked|more like)\s+["""']?([^"""'\n,?!]{3,60}?)(?:["""',?!]|\s+and\b|$)/i);
  return match ? match[1].trim() : null;
}

function extractTitleQuery(lower) {
  // Extract a book title/query from patterns like "do you have X", "find X by author"
  const m = lower.match(/(?:do you have|do you carry|is there a|find|search for|looking for|get me|show me|i need)\s+(?:a |an |the )?["""']?([^"""'\n,?!]{3,80}?)(?:["""']|(?:\s+by\s+)|(?:\s+available)|$)/i);
  return m ? m[1].trim() : null;
}

function extractAuthorName(lower) {
  const match = lower.match(/(?:books by|by the author|written by|author named|author called|works of|titles by|anything by)\s+([a-z .'-]{3,60})/i);
  return match ? match[1].trim() : null;
}

function extractBookContext(lower) {
  // Try to understand what kind of book the user wants from free text
  // Returns { genre, mood, audience, setting }
  const mood = [];
  if (/\b(happy|fun|funny|comic|humour|humor|lightheart)\b/.test(lower)) mood.push('light');
  if (/\b(dark|grim|serious|intense|heavy)\b/.test(lower)) mood.push('dark');
  if (/\b(inspir|motivat|uplifting|positive)\b/.test(lower)) mood.push('inspirational');

  const audience = /\b(child|kid|junior|young adult|ya|teen)\b/.test(lower) ? 'children'
    : /\b(adult|mature|grown)\b/.test(lower) ? 'adult' : null;

  const setting = /\b(sri lanka|srilanka|batticaloa|eastern|local|jaffna|colombo)\b/.test(lower) ? 'local'
    : /\b(india|indian)\b/.test(lower) ? 'indian'
    : /\b(world war|ww2|wwii)\b/.test(lower) ? 'wwii' : null;

  return { mood, audience, setting };
}

function faqReply(lower) {
  const words = lower.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of CHAT_KB) {
    let score = 0;
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern)) score += 2;
      else if (words.some(w => w.startsWith(pattern.slice(0, 4)) && pattern.length > 3)) score += 1;
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }
  return bestMatch && bestScore > 0 ? bestMatch.answer : null;
}

async function smartChatReply(message, sessionId, userId) {
  const lower = message.toLowerCase().replace(/[?!.,;:]+/g, ' ').trim();
  const intent = classifyIntent(lower);
  const lang = extractLanguage(lower);
  const ctx = extractBookContext(lower);

  if (intent === 'GREETING') {
    return {
      reply: 'Hello! I\'m the Batticaloa Library Assistant. I can help you with:\n\n• Book recommendations by genre, mood, or author\n• Finding books similar to ones you\'ve enjoyed\n• Searching our catalog (local + 80,000+ Koha DLP titles)\n• Library hours, membership & borrowing rules\n• Events and digital services\n\nWhat would you like today?',
      books: null,
    };
  }

  if (intent === 'COLLECTION_SIZE') {
    try {
      const row = await prepare('SELECT COUNT(*) AS c FROM books').get();
      const dlp = await prepare('SELECT COUNT(*) AS c FROM dlp_books').get();
      return {
        reply: `Our local catalog holds ${Number(row.c).toLocaleString()} curated titles. The integrated Koha DLP collection adds ${Number(dlp.c).toLocaleString()} more titles from partner libraries.\n\nSearch the full catalog at /catalog.`,
        books: null,
      };
    } catch { /* fall through */ }
  }

  if (intent === 'USER_HISTORY') {
    if (!userId) {
      return { reply: 'To get personalised recommendations based on your reading history, please log in to your member account. Or just tell me a genre you enjoy and I\'ll find something for you!', books: null };
    }
    const history = await getUserHistory(userId);
    if (history.length === 0) {
      return { reply: 'You don\'t have any borrowing history yet. Let me suggest some popular reads — just tell me a genre you enjoy!', books: null };
    }
    const categoryCounts = {};
    const authorCounts = {};
    for (const { category, author } of history) {
      if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      if (author) authorCounts[author] = (authorCounts[author] || 0) + 1;
    }
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const recent = history.slice(0, 3).map(b => `"${b.title}"`).join(', ');
    // Exclude already-read titles from recommendations
    const readTitles = history.map(b => b.title);
    const books = topCategory ? await searchBooks(topCategory, { category: topCategory, limit: 6 }) : [];
    const filtered = books.filter(b => !readTitles.includes(b.title)).slice(0, 5);
    const hint = topAuthor ? ` You seem to enjoy ${topAuthor}'s work.` : '';
    return {
      reply: `Based on your recent reads (${recent}),${hint} here are some ${topCategory || 'recommended'} titles you haven't read yet:`,
      books: filtered.length ? filtered : (books.length ? books.slice(0, 5) : null),
    };
  }

  if (intent === 'TITLE_SEARCH') {
    const titleQ = extractTitleQuery(lower) || lower.replace(/\b(do you have|find|search for|looking for|get me|show me|i need|a |an |the )\b/g, '').trim();
    if (titleQ && titleQ.length > 2) {
      const books = await searchBooks(titleQ, { language: lang || undefined, limit: 6 });
      if (books.length) {
        return {
          reply: `Here's what I found for "${titleQ}" in our collection:`,
          books,
        };
      }
      // Try partial — split into words and search by first significant word
      const words = titleQ.split(/\s+/).filter(w => w.length > 3);
      if (words.length) {
        const fallback = await searchBooks(words[0], { limit: 5 });
        if (fallback.length) {
          return {
            reply: `I couldn't find an exact match for "${titleQ}", but here are related titles you might like:`,
            books: fallback,
          };
        }
      }
      return {
        reply: `I couldn't find "${titleQ}" in our catalog right now. Try searching directly at /catalog — it covers 80,000+ titles including the Koha DLP collection.`,
        books: null,
      };
    }
  }

  if (intent === 'SIMILAR') {
    const title = extractSimilarTitle(lower);
    if (title) {
      // Look up the referenced book in both catalogs to get its category/author
      const ref = await prepare(
        `SELECT title, author, category FROM books WHERE LOWER(title) LIKE LOWER(?) LIMIT 1`
      ).get(`%${title}%`) || await prepare(
        `SELECT title, author, category FROM dlp_books WHERE LOWER(title) LIKE LOWER(?) LIMIT 1`
      ).get(`%${title}%`);

      const category = ref?.category;
      const refAuthor = ref?.author;

      // Strategy 1: same category, exclude the referenced book itself
      let books = await searchBooks(category || title, {
        category: category || undefined,
        language: lang || undefined,
        limit: 7,
      });
      // Filter out the exact title they mentioned
      books = books.filter(b => b.title.toLowerCase() !== title.toLowerCase()).slice(0, 5);

      if (books.length) {
        const desc = category ? ` in the ${category} genre` : '';
        return {
          reply: `Here are books similar to "${ref?.title || title}"${desc}:`,
          books,
        };
      }

      // Strategy 2: same author if found
      if (refAuthor) {
        const authorBooks = await searchBooks(refAuthor, { limit: 5 });
        if (authorBooks.length) {
          return {
            reply: `I found other books by ${refAuthor} you might enjoy:`,
            books: authorBooks,
          };
        }
      }
    }
    // Fall back to genre/keyword search
    const genre = extractGenre(lower);
    const books = await searchBooks(genre || lower.slice(0, 40), { language: lang || undefined, limit: 5 });
    return {
      reply: books.length
        ? 'Here are some books you might enjoy based on your taste:'
        : 'I couldn\'t find an exact match, but try browsing our catalog at /catalog for more options.',
      books: books.length ? books : null,
    };
  }

  if (intent === 'AUTHOR_SEARCH') {
    const author = extractAuthorName(lower);
    if (author) {
      // Search by author name specifically — prioritise author field match
      const books = await searchBooks(author, { limit: 6 });
      // Sort to put exact author matches first
      const sorted = books.sort((a, b) => {
        const aMatch = (a.author || '').toLowerCase().includes(author.toLowerCase()) ? 0 : 1;
        const bMatch = (b.author || '').toLowerCase().includes(author.toLowerCase()) ? 0 : 1;
        return aMatch - bMatch;
      });
      return {
        reply: sorted.length
          ? `Here are books by "${author}" in our collection:`
          : `We don't currently have titles by "${author}" in our local catalog, but try /catalog for the full Koha DLP search.`,
        books: sorted.length ? sorted : null,
      };
    }
  }

  if (intent === 'AVAILABILITY') {
    const titleQuery = lower
      .replace(/\b(available now|currently available|in stock|can i borrow|copies available|is|available|the|a|an)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (titleQuery.length > 2) {
      const books = await searchBooks(titleQuery, { availableOnly: true, limit: 6 });
      if (books.length) {
        return { reply: `These titles matching "${titleQuery}" are currently available to borrow:`, books };
      }
      // Show all copies (even on loan) so user knows the book exists
      const allCopies = await searchBooks(titleQuery, { availableOnly: false, limit: 4 });
      if (allCopies.length) {
        return {
          reply: `All copies of titles matching "${titleQuery}" are currently on loan. You can place a hold via your member dashboard or visit /catalog.`,
          books: allCopies,
        };
      }
    }
    return {
      reply: 'No matching titles found right now. Try searching directly at /catalog for all available books.',
      books: null,
    };
  }

  if (intent === 'RECOMMEND' || intent === 'GENRE_SEARCH') {
    const genre = extractGenre(lower);
    const detectedLang = lang;

    // Save preference to reader_profiles
    if (genre || detectedLang) {
      try {
        const profile = await getReaderProfile(sessionId);
        const existingGenres = profile?.preferred_genres ? JSON.parse(profile.preferred_genres) : [];
        const existingLangs = profile?.preferred_languages ? JSON.parse(profile.preferred_languages) : [];
        if (genre && !existingGenres.includes(genre)) existingGenres.push(genre);
        if (detectedLang && !existingLangs.includes(detectedLang)) existingLangs.push(detectedLang);
        await saveReaderProfile(sessionId, {
          preferred_genres: existingGenres.length ? existingGenres : null,
          preferred_languages: existingLangs.length ? existingLangs : null,
          preferred_authors: null,
        });
      } catch { /* non-critical */ }
    }

    // Build a rich search query from genre keywords + context
    const genreKeywords = genre ? GENRE_KEYWORDS[genre] : null;
    let books = [];

    if (ctx.setting === 'local') {
      // User wants local/Sri Lankan books — search with location context
      const locationBooks = await searchBooks('sri lanka', { language: detectedLang || undefined, limit: 4 });
      books = locationBooks;
    }

    if (!books.length) {
      // Primary: search by genre category
      books = await searchBooks(genreKeywords ? genreKeywords[0] : lower.slice(0, 50), {
        category: genre || undefined,
        language: detectedLang || undefined,
        limit: 6,
      });
    }

    // If still no results, broaden: search just by genre name
    if (!books.length && genre) {
      books = await searchBooks(genre, { language: detectedLang || undefined, limit: 5 });
    }

    // Try audience filter for children
    if (!books.length && ctx.audience === 'children') {
      books = await searchBooks('children', { category: 'children', limit: 5 });
    }

    if (books.length) {
      const genreLabel = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : null;
      const langLabel = detectedLang && detectedLang !== 'English' ? ` in ${detectedLang}` : '';
      const ctxLabel = ctx.setting === 'local' ? ' about Sri Lanka' : '';
      const label = genreLabel ? `${genreLabel}${langLabel}${ctxLabel}` : `${detectedLang || 'recommended'}${ctxLabel}`;
      return { reply: `Here are some ${label} books from our collection:`, books: books.slice(0, 5) };
    }

    return {
      reply: `I couldn't find exact matches for that right now. Our catalog at /catalog has ${80000}+ titles — search with filters for genre, language, and availability.`,
      books: null,
    };
  }

  // FAQ fallback
  {
    const faq = faqReply(lower);
    if (faq) return { reply: faq, books: null };

    if (lower.includes('borrow') || lower.includes('loan') || lower.includes('lend') || lower.includes('checkout')) {
      return {
        reply: 'You can borrow up to:\n• Adults: 5 items at a time\n• Students: 8 items\n• Senior Citizens: 8 items\n\nLoan periods:\n• Regular books: 14 days (renew up to 2 times)\n• Periodicals: 7 days\n• Reference books: In-library use only\n\nOverdue fine: LKR 10 per day for regular books.',
        books: null,
      };
    }

    if (lower.includes('catalog') || lower.includes('search') || lower.includes('find book') || lower.includes('isbn')) {
      return {
        reply: 'You can search our full catalog at /catalog — it covers our local collection and the Koha DLP library (80,000+ titles). Filter by language, category, and availability.',
        books: null,
      };
    }

    // Last resort: try a free-text book search — the user may just be naming a book
    if (lower.length > 5 && lower.length < 80) {
      try {
        const fuzzyBooks = await searchBooks(lower.slice(0, 60), { limit: 4 });
        if (fuzzyBooks.length) {
          return {
            reply: `I found some books that might match what you're looking for:`,
            books: fuzzyBooks,
          };
        }
      } catch { /* non-critical */ }
    }

    return {
      reply: 'I\'m not sure about that specific question, but I\'m great at book recommendations! Just tell me a genre or an author you like. For other help:\n\n• Visit us: Braiyan Drive, Batticaloa\n• Call: 065-2222484\n• Email: batticaloalibrary@gmail.com',
      books: null,
    };
  }
}

const CHAT_RATE_LIMIT = rateLimit({ windowMs: 5 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many messages. Please slow down.' } });

app.post('/api/chat', CHAT_RATE_LIMIT, optionalAuth, async (req, res) => {
  const { message, session_id } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  const msg = message.trim().slice(0, 1000);
  const sid = (session_id || 'anon').slice(0, 64);
  const userId = req.user?.id || null;
  const ip = req.ip;
  try {
    const existing = await prepare('SELECT id FROM chat_sessions WHERE session_id = ?').get(sid);
    if (!existing) await prepare('INSERT INTO chat_sessions (session_id, user_id, visitor_ip) VALUES (?, ?, ?)').run(sid, userId, ip);
    await prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'user', msg);
    const { reply, books } = await smartChatReply(msg, sid, userId);
    await prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'assistant', reply);
    res.json({ reply, session_id: sid, books: books || null });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

app.get('/api/chat/sessions', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const limit = safeInt(req.query.limit, 50, 1, 200);
    const offset = safeInt(req.query.offset, 0, 0, 1e9);
    const sessions = await prepare(`
      SELECT cs.session_id, cs.user_id, cs.visitor_ip, cs.created_at,
             u.full_name AS member_name, u.membership_id,
             COUNT(cm.id) AS message_count,
             MAX(cm.created_at) AS last_message_at
      FROM chat_sessions cs
      LEFT JOIN users u ON cs.user_id = u.id
      LEFT JOIN chat_messages cm ON cs.session_id = cm.session_id
      GROUP BY cs.session_id
      ORDER BY last_message_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    const total = await prepare('SELECT COUNT(*) AS c FROM chat_sessions').get();
    res.json({ sessions, total: total.c });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/api/chat/sessions/:session_id', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const messages = await prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.session_id);
    const session = await prepare('SELECT cs.*, u.full_name AS member_name FROM chat_sessions cs LEFT JOIN users u ON cs.user_id = u.id WHERE cs.session_id = ?').get(req.params.session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session, messages });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.delete('/api/chat/sessions/:session_id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prepare('DELETE FROM chat_messages WHERE session_id = ?').run(req.params.session_id);
    await prepare('DELETE FROM chat_sessions WHERE session_id = ?').run(req.params.session_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.get('/api/env', authenticate, (req, res) => {
  res.json({ production: IS_PROD });
});

app.get('/api/opac-search-url', (req, res) => {
  const { q, idx = 'kw' } = req.query;
  const url = `${KOHA_SEARCH}?q=${encodeURIComponent(q || '')}&idx=${encodeURIComponent(idx)}`;
  res.json({ url });
});

// ---------- DLP SYNC ----------
// Keep an in-memory log of the current running sync so the admin panel can
// stream progress messages via polling.
let dlpSyncProgress = [];
let dlpSyncBusy     = false;

app.get('/api/dlp-sync/stats', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const stats = await getDlpStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch DLP stats' });
  }
});

app.get('/api/dlp-sync/history', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const history = await getSyncHistory(20);
    res.json({ history });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch sync history' });
  }
});

app.get('/api/dlp-sync/progress', authenticate, authorize('admin', 'librarian'), (req, res) => {
  res.json({ running: dlpSyncBusy, messages: dlpSyncProgress });
});

app.post('/api/dlp-sync/trigger', authenticate, authorize('admin'), async (req, res) => {
  if (dlpSyncBusy) {
    return res.status(409).json({ error: 'A sync is already in progress.' });
  }
  dlpSyncProgress = ['Manual sync triggered by admin…'];
  dlpSyncBusy     = true;

  await logAudit(req.user.id, 'dlp_sync_trigger', 'dlp_sync', null, 'manual', req.ip);

  // Run async in background; client polls /api/dlp-sync/progress
  runSync({
    triggeredBy: 'manual',
    onProgress: msg => {
      dlpSyncProgress.push(msg);
      if (dlpSyncProgress.length > 200) dlpSyncProgress.shift();
    },
  }).then(result => {
    dlpSyncBusy = false;
    dlpSyncProgress.push(
      result.error
        ? `Sync failed: ${result.error}`
        : `Sync complete — Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}, Total: ${result.total}`
    );
  }).catch(err => {
    dlpSyncBusy = false;
    dlpSyncProgress.push(`Sync error: ${err.message}`);
  });

  res.json({ started: true, message: 'DLP sync started. Poll /api/dlp-sync/progress for updates.' });
});

app.get('/api/dlp-sync/books', authenticate, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50'),  200);
    const offset = Math.max(parseInt(req.query.offset || '0'),   0);
    const q      = (req.query.q || '').trim();
    const branch = (req.query.branch || '').trim();

    let sql  = 'SELECT * FROM dlp_books WHERE 1=1';
    const args = [];
    if (q) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (branch) {
      sql += ' AND branch = ?';
      args.push(branch);
    }
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS c');
    const total = await prepare(countSql).get(...args);

    sql += ' ORDER BY title ASC LIMIT ? OFFSET ?';
    args.push(limit, offset);
    const books = await prepare(sql).all(...args);

    res.json({ books, total: total?.c || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch DLP books' });
  }
});

// ---------- HTML routing ----------
const jwt = require('jsonwebtoken');
app.get('/admin', async (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token) return res.redirect('/login?next=/admin');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    if (!['admin', 'librarian', 'event_coordinator'].includes(decoded.role)) return res.redirect('/login?next=/admin');
    if (await isTokenRevoked(token)) return res.redirect('/login?next=/admin');
  } catch {
    return res.redirect('/login?next=/admin');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'register.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'catalog.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'events.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'about.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'services.html')));
app.get('/collections', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'collections.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'contact.html')));
app.get('/help', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'help.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html')));
app.get('/policies', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'policies.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Bootstrap schema then start / export
async function bootstrap() {
  await initSchema();
  scheduleMonthlySyncCron(); // fires on the 1st of each month at 02:xx
  if (require.main === module) {
    app.listen(PORT, () => {
      log.info('Server started', { port: PORT, env: IS_PROD ? 'production' : 'development' });
    });
  }
}

if (require.main === module) {
  bootstrap().catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
}

module.exports = { app, bootstrap };
