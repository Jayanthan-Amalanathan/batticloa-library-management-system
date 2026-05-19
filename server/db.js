const path = require('path');

// Production: use Turso (@libsql/client) via TURSO_DATABASE_URL env var.
// Development: use better-sqlite3 (synchronous, no concurrency issues).
// The exported API is always async so callers don't need to know which driver is active.

const IS_REMOTE = !!process.env.TURSO_DATABASE_URL;

// ---------------------------------------------------------------------------
// Local driver — better-sqlite3 (synchronous)
// ---------------------------------------------------------------------------
let _localDb = null;
function localDb() {
  if (_localDb) return _localDb;
  const Database = require('better-sqlite3');
  const fs = require('fs');
  let dataDir = process.env.BPL_DATA_DIR || path.join(__dirname, '..', 'data');
  try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); }
  catch { dataDir = '/tmp'; }
  _localDb = new Database(path.join(dataDir, 'library.db'));
  _localDb.pragma('journal_mode = WAL');
  _localDb.pragma('foreign_keys = ON');
  return _localDb;
}

// ---------------------------------------------------------------------------
// Remote driver — @libsql/client (async, Turso)
// ---------------------------------------------------------------------------
let _remoteClient = null;
function remoteClient() {
  if (_remoteClient) return _remoteClient;
  const { createClient } = require('@libsql/client');
  _remoteClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return _remoteClient;
}

// ---------------------------------------------------------------------------
// Unified async API
// ---------------------------------------------------------------------------

function prepare(sql) {
  if (IS_REMOTE) {
    const client = remoteClient();
    return {
      async get(...args)  { const rs = await client.execute({ sql, args: args.flat() }); return rs.rows[0] ?? null; },
      async all(...args)  { const rs = await client.execute({ sql, args: args.flat() }); return rs.rows; },
      async run(...args)  { const rs = await client.execute({ sql, args: args.flat() }); return { lastInsertRowid: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected }; },
    };
  }
  // Local: better-sqlite3 — wrap sync calls in resolved promises
  const db = localDb();
  const stmt = db.prepare(sql);
  return {
    async get(...args)  { return stmt.get(...args.flat()) ?? null; },
    async all(...args)  { return stmt.all(...args.flat()); },
    async run(...args)  { const info = stmt.run(...args.flat()); return { lastInsertRowid: Number(info.lastInsertRowid), changes: info.changes }; },
  };
}

async function exec(sql) {
  if (IS_REMOTE) {
    const client = remoteClient();
    for (const s of sql.split(';').map(s => s.trim()).filter(Boolean)) {
      await client.execute(s);
    }
  } else {
    localDb().exec(sql);
  }
}

// batch() — atomic multi-statement write, safe under concurrent async workloads.
// For local: wraps all statements in a single better-sqlite3 transaction (truly atomic, synchronous).
// For remote: uses client.batch() (single Turso round-trip).
async function batch(statements) {
  const stmts = statements.map(s => typeof s === 'string' ? { sql: s, args: [] } : s);
  if (IS_REMOTE) {
    return remoteClient().batch(stmts, 'write');
  }
  const db = localDb();
  const run = db.transaction(() => {
    for (const { sql, args } of stmts) {
      db.prepare(sql).run(...(args || []));
    }
  });
  run();
}

// transaction() — wraps an async callback in BEGIN/COMMIT/ROLLBACK.
// Both drivers use explicit BEGIN/COMMIT so the async fn() is properly awaited
// before committing, giving true atomicity for async DB operations.
function transaction(fn) {
  return async function () {
    if (IS_REMOTE) {
      const client = remoteClient();
      await client.execute('BEGIN');
      try {
        const result = await fn();
        await client.execute('COMMIT');
        return result;
      } catch (err) {
        await client.execute('ROLLBACK');
        throw err;
      }
    } else {
      // better-sqlite3: use explicit BEGIN/COMMIT via prepared statements so
      // the async fn() is fully awaited before committing — avoids the
      // .transaction() wrapper which commits synchronously before promises settle.
      const db = localDb();
      db.prepare('BEGIN').run();
      try {
        const result = await fn();
        db.prepare('COMMIT').run();
        return result;
      } catch (err) {
        db.prepare('ROLLBACK').run();
        throw err;
      }
    }
  };
}

async function pragma(stmt) {
  // Remote Turso connections reject PRAGMA — skip silently.
  if (IS_REMOTE) return;
  localDb().pragma(stmt);
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
    `CREATE TABLE IF NOT EXISTS reader_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      preferred_genres TEXT,
      preferred_authors TEXT,
      preferred_languages TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_reader_profiles_session ON reader_profiles(session_id)`,
    `CREATE TABLE IF NOT EXISTS dlp_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at  DATETIME,
      status        TEXT NOT NULL DEFAULT 'running',
      triggered_by  TEXT DEFAULT 'cron',
      books_added   INTEGER DEFAULT 0,
      books_updated INTEGER DEFAULT 0,
      books_skipped INTEGER DEFAULT 0,
      total_fetched INTEGER DEFAULT 0,
      error_message TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS dlp_books (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      koha_biblio_id   INTEGER NOT NULL UNIQUE,
      koha_item_id     INTEGER,
      isbn             TEXT,
      title            TEXT NOT NULL,
      author           TEXT,
      publisher        TEXT,
      publication_year INTEGER,
      category         TEXT,
      collection_type  TEXT DEFAULT 'lending',
      language         TEXT DEFAULT 'en',
      call_number      TEXT,
      branch           TEXT,
      location         TEXT,
      collection_code  TEXT,
      item_type        TEXT,
      total_copies     INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      not_for_loan     INTEGER DEFAULT 0,
      last_checkout_date TEXT,
      checkouts_count  INTEGER DEFAULT 0,
      last_synced_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_books_biblio ON dlp_books(koha_biblio_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_books_title  ON dlp_books(title)`,
    `CREATE INDEX IF NOT EXISTS idx_dlp_books_author ON dlp_books(author)`,
  ];

  for (const stmt of tables) {
    await exec(stmt);
  }

  // Idempotent column migrations
  const migrations = [
    `ALTER TABLE books ADD COLUMN is_deleted INTEGER DEFAULT 0`,
    `ALTER TABLE books ADD COLUMN dlp_source_key TEXT`,
    `ALTER TABLE books ADD COLUMN collection_type TEXT DEFAULT 'lending'`,
    `ALTER TABLE books ADD COLUMN call_number TEXT`,
    `ALTER TABLE dlp_sync_log ADD COLUMN progress_messages TEXT DEFAULT '[]'`,
    `ALTER TABLE users ADD COLUMN password_changed_at DATETIME`,
  ];
  for (const stmt of migrations) {
    try { await exec(stmt); } catch { /* column already exists */ }
  }

  const postMigrationIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_books_title      ON books(title)`,
    `CREATE INDEX IF NOT EXISTS idx_books_author     ON books(author)`,
    `CREATE INDEX IF NOT EXISTS idx_books_category   ON books(category)`,
    `CREATE INDEX IF NOT EXISTS idx_books_branch     ON books(branch)`,
    `CREATE INDEX IF NOT EXISTS idx_books_dlp_source ON books(dlp_source_key)`,
  ];
  for (const stmt of postMigrationIndexes) {
    await exec(stmt);
  }

  // Clean up stale 'running' rows left by crashes, then enforce the unique constraint
  try { await exec(`UPDATE dlp_sync_log SET status = 'failed', error_message = 'interrupted' WHERE status = 'running'`); } catch { /* table may not exist yet */ }
  try { await exec(`DROP INDEX IF EXISTS uq_dlp_one_running`); } catch { /* ignore */ }
  try { await exec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_dlp_one_running ON dlp_sync_log(status) WHERE status = 'running'`); } catch { /* ignore */ }

  // FTS5 — gracefully skipped if unavailable
  const ftsStatements = [
    `CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
      title, author, isbn, description, category,
      content='books', content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    )`,
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
    // dlp_books FTS (no description column)
    `CREATE VIRTUAL TABLE IF NOT EXISTS dlp_books_fts USING fts5(
      title, author, isbn, category,
      content='dlp_books', content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    )`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_insert AFTER INSERT ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_delete AFTER DELETE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_update AFTER UPDATE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.category);
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.category);
     END`,
  ];
  for (const stmt of ftsStatements) {
    try { await exec(stmt); } catch { /* FTS5 not available */ }
  }

  // Repair: replace any old dlp_books_fts triggers that referenced 'description'
  const dlpFtsRepair = [
    `DROP TRIGGER IF EXISTS dlp_books_fts_insert`,
    `DROP TRIGGER IF EXISTS dlp_books_fts_delete`,
    `DROP TRIGGER IF EXISTS dlp_books_fts_update`,
    `DROP TABLE IF EXISTS dlp_books_fts`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS dlp_books_fts USING fts5(
      title, author, isbn, category,
      content='dlp_books', content_rowid='id',
      tokenize='unicode61 remove_diacritics 1'
    )`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_insert AFTER INSERT ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_delete AFTER DELETE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.category);
     END`,
    `CREATE TRIGGER IF NOT EXISTS dlp_books_fts_update AFTER UPDATE ON dlp_books BEGIN
       INSERT INTO dlp_books_fts(dlp_books_fts, rowid, title, author, isbn, category)
       VALUES ('delete', old.id, old.title, old.author, old.isbn, old.category);
       INSERT INTO dlp_books_fts(rowid, title, author, isbn, category)
       VALUES (new.id, new.title, new.author, new.isbn, new.category);
     END`,
    `INSERT INTO dlp_books_fts(dlp_books_fts) VALUES ('rebuild')`,
  ];
  for (const stmt of dlpFtsRepair) {
    try { await exec(stmt); } catch { /* gracefully skip */ }
  }
}

module.exports = { prepare, exec, transaction, batch, pragma, initSchema };
