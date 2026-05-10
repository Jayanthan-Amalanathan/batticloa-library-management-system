'use strict';

const { prepare } = require('./db');

const DLP_BASE          = process.env.DLP_API_URL      || 'https://batticaloa.dlp.gov.lk/api/v1';
const DLP_CLIENT_ID     = process.env.DLP_CLIENT_ID    || '429e1a44-5eff-4b48-ad06-306a310e731c';
const DLP_CLIENT_SECRET = process.env.DLP_CLIENT_SECRET || '0b889fef-d0d4-4a7d-99f4-83381a7cfd9f';

const PAGE_SIZE      = 100;
const FETCH_TIMEOUT  = 30_000;
const PAGE_DELAY_MS  = 400;   // pause between pages to avoid rate-limiting
const MAX_RETRIES    = 5;

const sleep = ms => new Promise(res => setTimeout(res, ms));

// ── Token cache ──────────────────────────────────────────────────────────────
let _token    = null;
let _tokenExp = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExp - 60_000) return _token;
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     DLP_CLIENT_ID,
    client_secret: DLP_CLIENT_SECRET,
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${DLP_BASE}/oauth/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`DLP auth failed: HTTP ${res.status} — ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data.access_token) throw new Error('DLP auth: no access_token in response');
    _token    = data.access_token;
    _tokenExp = Date.now() + (data.expires_in || 3600) * 1000;
    return _token;
  } finally {
    clearTimeout(t);
  }
}

async function dlpGet(path, params = {}) {
  const token = await getToken();
  const url   = new URL(`${DLP_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal:  ctrl.signal,
      });
      clearTimeout(t);

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '0', 10);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 32_000);
        if (attempt < MAX_RETRIES) {
          console.warn(`[DLP Sync] 429 on ${path}, retry ${attempt + 1}/${MAX_RETRIES} after ${waitMs}ms`);
          await sleep(waitMs);
          continue;
        }
        const txt = await res.text().catch(() => '');
        throw new Error(`DLP API ${path} → HTTP 429: ${txt.slice(0, 200)}`);
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`DLP API ${path} → HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }

      const totalCount = parseInt(res.headers.get('x-total-count') || '0', 10);
      const data = await res.json();
      return { data, totalCount };
    } catch (err) {
      clearTimeout(t);
      if (err.name === 'AbortError' || err.message.includes('HTTP')) throw err;
      // Network error — retry with backoff
      if (attempt < MAX_RETRIES) {
        const waitMs = Math.min(1000 * 2 ** attempt, 32_000);
        console.warn(`[DLP Sync] Network error on ${path}, retry ${attempt + 1}/${MAX_RETRIES} after ${waitMs}ms:`, err.message);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function str(v)  { return (v === null || v === undefined) ? null : String(v).trim() || null; }
function num(v)  { const n = parseInt(v, 10); return isNaN(n) ? null : n; }

function mapCollectionType(location, itemType) {
  const loc = (location || '').toUpperCase();
  const typ = (itemType  || '').toUpperCase();
  if (loc === 'REF' || loc === 'REFERENCE') return 'reference';
  if (loc === 'SPC' || loc === 'SPECIAL')   return 'special';
  if (typ === 'REF')                        return 'reference';
  return 'lending';
}

function mapCategory(collectionCode, itemType) {
  const map = {
    FIC: 'Fiction', NFIC: 'Non-Fiction', SCI: 'Science', TECH: 'Technology',
    HIST: 'History', BIO: 'Biography', REF: 'Reference', CHI: 'Children',
    PER: 'Periodicals', DVD: 'AV Materials', CD: 'AV Materials',
  };
  const cc  = (collectionCode || '').toUpperCase();
  const typ = (itemType       || '').toUpperCase();
  return map[cc] || map[typ] || 'General';
}

// ── Paginated item fetch ──────────────────────────────────────────────────────

async function* fetchAllItems(logProgress) {
  let page  = 1;
  let total = null;
  let fetched = 0;

  while (true) {
    const { data: items, totalCount } = await dlpGet('/items', {
      _per_page: PAGE_SIZE,
      _page:     page,
    });

    if (total === null) total = totalCount || 0;
    if (!Array.isArray(items) || items.length === 0) break;

    fetched += items.length;
    logProgress(`Fetching items ${fetched} of ${total} (page ${page})…`);
    yield items;

    if (fetched >= total) break;
    page++;
    await sleep(PAGE_DELAY_MS);
  }
}

async function fetchBiblio(biblioId) {
  try {
    const { data } = await dlpGet(`/biblios/${biblioId}`);
    return data;
  } catch {
    return null;
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

let _running = false;

async function runSync({ triggeredBy = 'cron', onProgress = () => {} } = {}) {
  if (_running) {
    throw new Error('A sync is already in progress. Please wait for it to finish.');
  }
  _running = true;

  const logRow = await prepare(
    `INSERT INTO dlp_sync_log (status, triggered_by) VALUES ('running', ?)`
  ).run(triggeredBy);
  const syncId = Number(logRow.lastInsertRowid);

  let added   = 0;
  let updated = 0;
  let skipped = 0;
  let total   = 0;

  async function finalize(status, errorMsg = null) {
    await prepare(`
      UPDATE dlp_sync_log SET
        completed_at  = datetime('now'),
        status        = ?,
        books_added   = ?,
        books_updated = ?,
        books_skipped = ?,
        total_fetched = ?,
        error_message = ?
      WHERE id = ?
    `).run(status, added, updated, skipped, total, errorMsg, syncId);
    _running = false;
  }

  try {
    onProgress('Authenticating with DLP Koha API…');
    await getToken();

    // Cache biblios to avoid redundant fetches for multi-copy titles
    const biblioCache = new Map();

    for await (const items of fetchAllItems(msg => onProgress(msg))) {
      for (const item of items) {
        total++;
        const biblioId = item.biblio_id;
        if (!biblioId) { skipped++; continue; }

        let biblio = biblioCache.get(biblioId);
        if (!biblio) {
          biblio = await fetchBiblio(biblioId);
          biblioCache.set(biblioId, biblio || {});
        }

        const title  = str(biblio?.title) || str(item.external_id) || `Item ${item.item_id}`;
        const author = str(biblio?.author);
        const isbn   = str(biblio?.isbn);

        const publisher  = str(biblio?.publisher);
        const pubYear    = num(biblio?.publication_year) || num(str(biblio?.copyright_date)?.slice(0, 4));
        const lang       = str(biblio?.language) || 'en';
        const callNumber = str(item.callnumber);
        const branch     = str(item.home_library_id);
        const location   = str(item.location);
        const collCode   = str(item.collection_code);
        const itemType   = str(item.item_type);
        const notForLoan = item.not_for_loan_status !== 0 ? 1 : 0;
        const available  = (notForLoan === 0 && !item.checked_out_date) ? 1 : 0;

        const collectionType = mapCollectionType(location, itemType);
        const category       = mapCategory(collCode, itemType);

        const existing = await prepare(
          'SELECT id, total_copies, available_copies FROM dlp_books WHERE koha_biblio_id = ?'
        ).get(biblioId);

        if (existing) {
          await prepare(`
            UPDATE dlp_books SET
              isbn             = COALESCE(?, isbn),
              title            = ?,
              author           = COALESCE(?, author),
              publisher        = COALESCE(?, publisher),
              publication_year = COALESCE(?, publication_year),
              category         = ?,
              collection_type  = ?,
              language         = COALESCE(?, language),
              call_number      = COALESCE(?, call_number),
              branch           = COALESCE(?, branch),
              location         = COALESCE(?, location),
              collection_code  = COALESCE(?, collection_code),
              item_type        = COALESCE(?, item_type),
              total_copies     = total_copies + 1,
              available_copies = available_copies + ?,
              not_for_loan     = ?,
              last_checkout_date = COALESCE(?, last_checkout_date),
              checkouts_count  = checkouts_count + ?,
              last_synced_at   = datetime('now')
            WHERE koha_biblio_id = ?
          `).run(
            isbn, title, author, publisher, pubYear,
            category, collectionType, lang, callNumber,
            branch, location, collCode, itemType,
            available, notForLoan,
            str(item.last_checkout_date), item.checkouts_count || 0,
            biblioId
          );
          updated++;
        } else {
          await prepare(`
            INSERT INTO dlp_books (
              koha_biblio_id, koha_item_id, isbn, title, author,
              publisher, publication_year, category, collection_type,
              language, call_number, branch, location, collection_code,
              item_type, total_copies, available_copies, not_for_loan,
              last_checkout_date, checkouts_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
          `).run(
            biblioId, item.item_id, isbn, title, author,
            publisher, pubYear, category, collectionType,
            lang, callNumber, branch, location, collCode,
            itemType, available, notForLoan,
            str(item.last_checkout_date), item.checkouts_count || 0
          );
          added++;
        }

        await mirrorToBooks(biblioId, isbn, title, author, publisher, pubYear,
          category, collectionType, lang, callNumber, branch, available);
      }

      // Prevent unbounded memory growth when processing many unique biblios
      if (biblioCache.size > 500) biblioCache.clear();
    }

    onProgress(`Sync complete. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}, Total: ${total}`);
    await finalize('success');
    return { syncId, added, updated, skipped, total, error: null };

  } catch (err) {
    console.error('[DLP Sync] Error:', err.message);
    onProgress(`Sync failed: ${err.message}`);
    await finalize('failed', err.message).catch(() => {});
    return { syncId, added, updated, skipped, total, error: err.message };
  }
}

// ── Mirror to main books table ────────────────────────────────────────────────
// Uses the dlp_source_key column (added by initSchema) for fast O(1) lookups
// instead of the slow LIKE '%[dlp:X]%' description scan.
async function mirrorToBooks(biblioId, isbn, title, author, publisher, pubYear,
  category, collectionType, language, callNumber, branch, available) {
  try {
    const sourceKey = `dlp:${biblioId}`;

    let existing = null;
    // Try source key first (indexed, fast)
    existing = await prepare('SELECT id FROM books WHERE dlp_source_key = ?').get(sourceKey);
    // Fall back to ISBN match for books that existed before the dlp_source_key column
    if (!existing && isbn) {
      existing = await prepare('SELECT id FROM books WHERE isbn = ?').get(isbn);
    }

    if (existing) {
      await prepare(`
        UPDATE books SET
          dlp_source_key   = ?,
          title            = ?,
          author           = COALESCE(NULLIF(?, ''), author),
          publisher        = COALESCE(NULLIF(?, ''), publisher),
          publication_year = COALESCE(?, publication_year),
          category         = COALESCE(NULLIF(?, ''), category),
          collection_type  = ?,
          language         = COALESCE(NULLIF(?, ''), language),
          call_number      = COALESCE(NULLIF(?, ''), call_number),
          branch           = COALESCE(NULLIF(?, ''), branch),
          available_copies = available_copies + ?
        WHERE id = ?
      `).run(sourceKey, title, author, publisher, pubYear, category, collectionType,
             language, callNumber, branch, available, existing.id);
    } else {
      await prepare(`
        INSERT INTO books (
          dlp_source_key, isbn, title, author, publisher, publication_year,
          category, collection_type, language, call_number,
          branch, total_copies, available_copies, description, cover_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, '/images/book-default.svg')
      `).run(
        sourceKey, isbn, title, author || 'Unknown', publisher, pubYear,
        category, collectionType, language || 'en', callNumber,
        branch || 'BPL', available,
        `Synced from Batticaloa DLP Koha catalog.`
      );
    }
  } catch {
    // Non-fatal: main books table mirror failure should not abort the sync
  }
}

// ── Monthly cron scheduler ────────────────────────────────────────────────────

function scheduleMonthlySyncCron() {
  let lastSyncMonth = null;

  async function maybeSync() {
    const now = new Date();
    if (now.getDate() !== 1 || now.getHours() !== 2) return;
    const month = `${now.getFullYear()}-${now.getMonth()}`;
    if (lastSyncMonth === month) return;
    lastSyncMonth = month;
    console.log('[DLP Sync] Monthly cron triggered for', now.toISOString());
    runSync({ triggeredBy: 'cron', onProgress: msg => console.log('[DLP Sync]', msg) })
      .then(r => console.log('[DLP Sync] Monthly sync result:', r))
      .catch(e => console.error('[DLP Sync] Monthly sync error:', e));
  }

  setInterval(maybeSync, 30 * 60 * 1000);
  maybeSync();
}

// ── Status helpers ────────────────────────────────────────────────────────────

async function getLastSync() {
  return await prepare(`
    SELECT * FROM dlp_sync_log ORDER BY started_at DESC LIMIT 1
  `).get();
}

async function getSyncHistory(limit = 10) {
  return await prepare(`
    SELECT * FROM dlp_sync_log ORDER BY started_at DESC LIMIT ?
  `).all(limit);
}

async function getDlpStats() {
  const [total, byBranch, lastSync] = await Promise.all([
    prepare('SELECT COUNT(*) AS c FROM dlp_books').get(),
    prepare(`
      SELECT branch, COUNT(*) AS count
      FROM dlp_books GROUP BY branch ORDER BY count DESC LIMIT 10
    `).all(),
    getLastSync(),
  ]);
  return {
    total_dlp_books: total?.c || 0,
    by_branch:       byBranch,
    last_sync:       lastSync || null,
    sync_running:    _running,
  };
}

module.exports = { runSync, scheduleMonthlySyncCron, getLastSync, getSyncHistory, getDlpStats };
