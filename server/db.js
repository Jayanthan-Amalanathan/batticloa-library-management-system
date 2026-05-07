const { createClient } = require('@libsql/client');
const path = require('path');

// In production use TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars (Turso cloud).
// In development fall back to a local SQLite file via the file: protocol.
let client;

if (process.env.TURSO_DATABASE_URL) {
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
} else {
  const fs = require('fs');
  let dataDir = path.join(__dirname, '..', 'data');
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  } catch {
    dataDir = '/tmp';
  }
  client = createClient({ url: `file:${path.join(dataDir, 'library.db')}` });
}

// ---------------------------------------------------------------------------
// Thin compatibility shim – mirrors the better-sqlite3 prepare().get/all/run()
// surface but returns Promises instead of synchronous results.
// ---------------------------------------------------------------------------

function prepare(sql) {
  return {
    async get(...args) {
      const rs = await client.execute({ sql, args: args.flat() });
      return rs.rows[0] ?? null;
    },
    async all(...args) {
      const rs = await client.execute({ sql, args: args.flat() });
      return rs.rows;
    },
    async run(...args) {
      const rs = await client.execute({ sql, args: args.flat() });
      return { lastInsertRowid: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected };
    },
  };
}

async function exec(sql) {
  // exec() may contain multiple statements separated by semicolons
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt);
  }
}

// transaction() wraps a callback in a BEGIN/COMMIT block.
// The callback receives no arguments; it must use the module-level prepare()
// helpers and is itself async.
function transaction(fn) {
  return async function () {
    await client.execute('BEGIN');
    try {
      const result = await fn();
      await client.execute('COMMIT');
      return result;
    } catch (err) {
      await client.execute('ROLLBACK');
      throw err;
    }
  };
}

async function pragma(stmt) {
  await client.execute(`PRAGMA ${stmt}`);
}

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------
async function initSchema() {
  await pragma('journal_mode = WAL');
  await pragma('foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'public',
      member_category TEXT,
      membership_id TEXT UNIQUE,
      membership_status TEXT DEFAULT 'pending',
      membership_expiry DATE,
      address TEXT,
      date_of_birth DATE,
      nic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publisher TEXT,
      publication_year INTEGER,
      category TEXT,
      collection_type TEXT DEFAULT 'lending',
      language TEXT DEFAULT 'English',
      call_number TEXT,
      description TEXT,
      cover_image TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      branch TEXT DEFAULT 'Main',
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NOT NULL,
      returned_at DATETIME,
      status TEXT DEFAULT 'active',
      fine_amount REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATETIME NOT NULL,
      location TEXT,
      category TEXT,
      capacity INTEGER DEFAULT 50,
      image TEXT,
      registration_open INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER,
      name TEXT,
      email TEXT,
      phone TEXT,
      attended INTEGER DEFAULT 0,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )`,
    `CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      featured INTEGER DEFAULT 0,
      emergency INTEGER DEFAULT 0,
      publish_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      department TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS librarian_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      request_type TEXT,
      topic TEXT,
      details TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      visitor_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS revoked_tokens (
      token TEXT PRIMARY KEY,
      expires_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_sessions_session ON chat_sessions(session_id)`,
  ];

  for (const stmt of tables) {
    await client.execute(stmt);
  }
}

module.exports = { prepare, exec, transaction, pragma, initSchema };
