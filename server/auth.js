const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

// ISSUE-04: refuse to start with the public fallback secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
if (JWT_SECRET === 'dev_secret' && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET env var is not set. Refusing to start in production with the default secret.');
  process.exit(1);
}
if (JWT_SECRET === 'dev_secret') {
  console.warn('WARNING: JWT_SECRET is not set — using insecure fallback. Set JWT_SECRET in your environment.');
}

// DEF-009 / ISSUE-02: DB-backed token revocation so it survives serverless cold starts.
// Falls back gracefully if the table doesn't exist yet (shouldn't happen after db.js runs).
function revokeToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      db.prepare(
        'INSERT OR IGNORE INTO revoked_tokens (token, expires_at) VALUES (?, ?)'
      ).run(token, new Date(decoded.exp * 1000).toISOString());
    }
  } catch { /* ignore malformed tokens */ }
}

function isTokenRevoked(token) {
  try {
    const row = db.prepare('SELECT expires_at FROM revoked_tokens WHERE token = ?').get(token);
    if (!row) return false;
    if (new Date(row.expires_at) <= new Date()) {
      db.prepare('DELETE FROM revoked_tokens WHERE token = ?').run(token);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Prune expired revocations every hour to keep the table small
setInterval(() => {
  try {
    db.prepare("DELETE FROM revoked_tokens WHERE expires_at <= datetime('now')").run();
  } catch { /* best-effort */ }
}, 60 * 60 * 1000);

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticate(req, res, next) {
  const token = req.cookies?.auth_token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  // DEF-009: reject tokens that were revoked at logout
  if (isTokenRevoked(token)) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

function optionalAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (token && !isTokenRevoked(token)) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (e) {}
  }
  next();
}

function logAudit(userId, action, entity, entityId, details, ip) {
  try {
    db.prepare(
      'INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId || null, action, entity || null, entityId || null, details || null, ip || null);
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = { hashPassword, verifyPassword, signToken, authenticate, authorize, optionalAuth, logAudit, revokeToken, isTokenRevoked };
