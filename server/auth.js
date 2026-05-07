const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// DEF-009: in-memory token blocklist for revoked JWTs.
// Entries are auto-pruned when the token would have expired anyway.
const revokedTokens = new Map(); // token → expiry timestamp (ms)

function revokeToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      revokedTokens.set(token, decoded.exp * 1000);
    }
  } catch { /* ignore malformed tokens */ }
}

function isTokenRevoked(token) {
  if (!revokedTokens.has(token)) return false;
  const exp = revokedTokens.get(token);
  if (Date.now() > exp) { revokedTokens.delete(token); return false; }
  return true;
}

// Prune expired revocations every hour
setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of revokedTokens) {
    if (now > exp) revokedTokens.delete(t);
  }
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
