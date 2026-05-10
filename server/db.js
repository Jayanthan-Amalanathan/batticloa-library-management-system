const { createClient } = require('@libsql/client');
const path = require('path');

// In production use TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars (Turso cloud).
// In development fall back to a local SQLite file via the file: protocol.
let client;
let isRemote = false;

if (process.env.TURSO_DATABASE_URL) {
  isRemote = true;
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
  // Turso remote connections reject PRAGMA statements — skip them silently.
  // WAL and foreign_keys are handled at the Turso server level automatically.
  if (isRemote) return;
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
      dlp_source_key TEXT,
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
    `CREATE TABLE IF NOT EXISTS dlp_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      status TEXT DEFAULT 'running',
      source TEXT DEFAULT 'dlp_koha',
      books_added INTEGER DEFAULT 0,
      books_updated INTEGER DEFAULT 0,
      books_skipped INTEGER DEFAULT 0,
      total_fetched INTEGER DEFAULT 0,
      error_message TEXT,
      triggered_by TEXT DEFAULT 'cron'
    )`,
    `CREATE TABLE IF NOT EXISTS dlp_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      koha_biblio_id INTEGER UNIQUE NOT NULL,
      koha_item_id INTEGER,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      publication_year INTEGER,
      category TEXT,
      collection_type TEXT DEFAULT 'lending',
      language TEXT DEFAULT 'en',
      call_number TEXT,
      description TEXT,
      branch TEXT,
      location TEXT,
      collection_code TEXT,
      item_type TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      not_for_loan INTEGER DEFAULT 0,
      last_checkout_date TEXT,
      checkouts_count INTEGER DEFAULT 0,
      last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_books_biblio ON dlp_books(koha_biblio_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_books_isbn ON dlp_books(isbn)`,
  ];

  for (const stmt of tables) {
    await client.execute(stmt);
  }

  // Idempotent column migrations — run before any indexes that depend on them
  const migrations = [
    `ALTER TABLE books ADD COLUMN dlp_source_key TEXT`,
  ];
  for (const stmt of migrations) {
    try { await client.execute(stmt); } catch { /* column already exists — ignore */ }
  }

  // Indexes that depend on migrated columns — run after migrations
  const postMigrationIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_books_dlp_source ON books(dlp_source_key)`,
    // B-tree indexes to speed up LIKE searches on local books
    `CREATE INDEX IF NOT EXISTS idx_books_title    ON books(title)`,
    `CREATE INDEX IF NOT EXISTS idx_books_author   ON books(author)`,
    `CREATE INDEX IF NOT EXISTS idx_books_category ON books(category)`,
    `CREATE INDEX IF NOT EXISTS idx_books_branch   ON books(branch)`,
    // B-tree indexes for dlp_books — covers the 80k-row search path
    `CREATE INDEX IF NOT EXISTS idx_dlp_title      ON dlp_books(title)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_author     ON dlp_books(author)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_category   ON dlp_books(category)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_branch     ON dlp_books(branch)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_language   ON dlp_books(language)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_available  ON dlp_books(available_copies)`,
  ];
  for (const stmt of postMigrationIndexes) {
    await client.execute(stmt);
  }

  // FTS5 virtual tables for fast full-text search — gracefully skipped if the
  // libsql build or Turso remote doesn't expose the fts5 extension.
  const ftsStatements = [
    `CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
      title, author, isbn, description, category,
      content='books', content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    )`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS dlp_books_fts USING fts5(
      title, author, isbn, description, category,
      content='dlp_books', content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    )`,
    // Keep books_fts in sync
    `CREATE TRIGGER IF NOT EXISTS books_fts_insert AFTER INSERT ON books BEGIN
       INSERT INTO books_fts(rowid, title, author, isbn, description, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.description, new.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS books_fts_delete AFTER DELETE ON books BEGIN
       INSERT INTO books_fts(books_fts, rowid, title, author, isbn, description, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.description, old.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS books_fts_update AFTER UPDATE ON books BEGIN
       INSERT INTO books_fts(books_fts, rowid, title, author, isbn, description, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.description, old.category);
       INSERT INTO books_fts(rowid, title, author, isbn, description, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.description, new.category);
     END`,
    // Keep dlp_books_fts in sync
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_insert AFTER INSERT ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, description, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.description, new.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_delete AFTER DELETE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, description, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.description, old.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_update AFTER UPDATE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, description, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.description, old.category);
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, description, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.description, new.category);
     END`,
  ];
  for (const stmt of ftsStatements) {
    try { await client.execute(stmt); } catch { /* FTS5 not available — fall back to LIKE search */ }
  }

  // Repair any sync log rows left in 'running' state from a previous crashed process
  await client.execute(
    `UPDATE dlp_sync_log SET status = 'failed', error_message = 'Process terminated unexpectedly',
     completed_at = datetime('now') WHERE status = 'running'`
  );
}

module.exports = { prepare, exec, transaction, pragma, initSchema };
