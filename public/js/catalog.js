// ============================================================
// BOOK COVER PLACEHOLDER
// ============================================================
const COVER_PALETTE = [
  ['#1a3a5c','#e8f0f7'],
  ['#2d5a27','#eaf3e8'],
  ['#5a1f33','#f5eaed'],
  ['#4a2e0d','#f5ede0'],
  ['#2a1a6b','#ece8f5'],
  ['#0d3a3a','#e0f0f0'],
  ['#5c3a1a','#f5ede0'],
  ['#1a3a1a','#e8f2e8'],
];

function bookCoverHtml(title, author, branch) {
  let h = 0;
  for (let i = 0; i < (title || '').length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  const [bg, fg] = COVER_PALETTE[h % COVER_PALETTE.length];
  const loc = escapeHtml(branch || 'Main Library');
  const t   = escapeHtml(title  || '');
  const a   = escapeHtml(author || '');
  return `<div class="book-cover-placeholder" style="background:${bg};color:${fg};">
    <span class="bcp-branch">${loc}</span>
    <span class="bcp-title">${t}</span>
    <span class="bcp-author">${a}</span>
  </div>`;
}

// ============================================================
// STATE
// ============================================================
let localOffset = 0;
const LOCAL_PAGE = 24;
let lastLocalQuery = {};

let dlpOffset = 0;
const DLP_PAGE = 30;
let dlpTotal   = 0;
let dlpCurrentPage = 1;
let lastDlpQuery = {};

let kohaPage  = 1;
const KOHA_COUNT = 20;
let kohaTotal = 0;
let kohaLastQ  = '';
let kohaLastIdx = 'kw';

// ============================================================
// TAB SWITCHING
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    document.getElementById('pane-' + btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'dlp' && !Object.keys(lastDlpQuery).length) {
      searchDlp(true);
    }
    if (btn.dataset.tab === 'koha' && !kohaLastQ && document.getElementById('q').value.trim()) {
      searchKoha(true);
    }
  });
});

// ============================================================
// SHARED QUERY BUILDERS
// ============================================================
function buildLocalQuery() {
  return {
    q:          document.getElementById('q').value.trim(),
    category:   document.getElementById('category').value,
    collection: document.getElementById('collection').value,
    branch:     document.getElementById('branch').value,
    available:  document.getElementById('available-only').checked ? 'true' : '',
  };
}

function buildDlpQuery() {
  return {
    q:          document.getElementById('q').value.trim(),
    category:   document.getElementById('category').value,
    collection: document.getElementById('collection').value,
    branch:     document.getElementById('branch').value,
    language:   document.getElementById('language-filter').value,
    available:  document.getElementById('available-only').checked ? 'true' : '',
    source:     'dlp',
  };
}

// ============================================================
// LOCAL CATALOG SEARCH
// ============================================================
async function searchLocal(reset = true) {
  if (reset) { localOffset = 0; lastLocalQuery = buildLocalQuery(); }

  const btn = document.getElementById('search-btn');
  btn.disabled = true; btn.textContent = 'Searching…';

  try {
    const params = new URLSearchParams({ ...lastLocalQuery, limit: LOCAL_PAGE, offset: localOffset });
    Object.keys(lastLocalQuery).forEach(k => { if (!lastLocalQuery[k]) params.delete(k); });

    const res = await fetch(`/api/books?${params}`).then(r => r.json());
    const cont = document.getElementById('results');

    if (!res.books?.length && reset) {
      cont.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">📚</div>
          <h3>No books found in local catalog</h3>
          <p>Try different keywords or switch to the <strong>DLP Library</strong> tab to search the full collection.</p>
        </div>`;
      document.getElementById('result-count').textContent = '0 results';
      document.getElementById('load-more-wrap').classList.add('hidden');
      return;
    }

    const html = (res.books || []).map(b => renderLocalCard(b)).join('');
    if (reset) cont.innerHTML = html;
    else cont.insertAdjacentHTML('beforeend', html);

    const shown = Math.min(localOffset + res.books.length, res.total);
    document.getElementById('result-count').textContent = `Showing ${shown.toLocaleString()} of ${(res.total || 0).toLocaleString()} titles`;
    document.getElementById('load-more-wrap').classList.toggle('hidden', localOffset + res.books.length >= res.total);
    localOffset += res.books.length;

    attachLocalButtons(cont);
  } catch (e) {
    document.getElementById('results').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><h3>Error loading catalog</h3><p>${escapeHtml(e.message)}</p></div>`;
    document.getElementById('result-count').textContent = 'Error — could not load books';
  } finally {
    btn.disabled = false; btn.textContent = i18n.t('catalog.search');
  }
}

function renderLocalCard(b) {
  return `
    <div class="card" role="listitem">
      <div class="card-img">${bookCoverHtml(b.title, b.author, b.branch)}</div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(b.title)}</h3>
        <p class="card-meta">${escapeHtml(b.author)}${b.publication_year ? ' · ' + b.publication_year : ''}</p>
        <p class="card-desc">${escapeHtml((b.description || '').slice(0, 110))}${(b.description||'').length > 110 ? '…' : ''}</p>
        <div class="card-foot">
          <span class="badge ${b.available_copies > 0 ? 'success' : 'danger'}">
            ${b.available_copies > 0 ? b.available_copies + ' available' : 'On Loan'}
          </span>
          <span class="badge">${escapeHtml(b.collection_type || '')}</span>
        </div>
        <div class="card-foot" style="margin-top:0.5rem;">
          <small class="card-meta">${escapeHtml(b.branch || 'Main')}${b.call_number ? ' · ' + escapeHtml(b.call_number) : ''}</small>
          ${b.available_copies > 0
            ? `<button class="btn btn-sm btn-accent" data-reserve="${b.id}" aria-label="Reserve ${escapeHtml(b.title)}">Reserve</button>`
            : `<button class="btn btn-sm btn-ghost" data-koha-title="${encodeURIComponent(b.title)}" aria-label="Search on OPAC">OPAC ↗</button>`
          }
        </div>
      </div>
    </div>`;
}

function attachLocalButtons(cont) {
  cont.querySelectorAll('[data-reserve]').forEach(btn => btn.addEventListener('click', async e => {
    const id = e.currentTarget.dataset.reserve;
    const origText = e.currentTarget.textContent;
    e.currentTarget.disabled = true; e.currentTarget.textContent = 'Reserving…';
    try {
      await api.post('/api/reservations', { book_id: parseInt(id) });
      e.currentTarget.textContent = 'Reserved ✓';
      e.currentTarget.classList.replace('btn-accent', 'btn-ghost');
    } catch (err) {
      if (err.message.includes('Authentication')) location.href = '/login?next=/catalog';
      else { e.currentTarget.textContent = origText; e.currentTarget.disabled = false; alert(err.message); }
    }
  }));
  cont.querySelectorAll('[data-koha-title]').forEach(btn => btn.addEventListener('click', e => {
    const title = decodeURIComponent(e.currentTarget.dataset.kohaTitle);
    window.open(buildKohaUrl(title, 'ti'), '_blank', 'noopener');
  }));
}

// ============================================================
// DLP LIBRARY SEARCH  (fast, public, hits /api/catalog/search)
// ============================================================
async function searchDlp(reset = true) {
  if (reset) {
    dlpOffset = 0;
    dlpCurrentPage = 1;
    lastDlpQuery = buildDlpQuery();
  }

  const cont     = document.getElementById('dlp-results');
  const countEl  = document.getElementById('dlp-result-count');
  const pageEl   = document.getElementById('dlp-page-info');
  const prevBtn  = document.getElementById('dlp-prev');
  const nextBtn  = document.getElementById('dlp-next');

  countEl.textContent = 'Searching DLP library…';
  cont.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-muted);">Loading…</p></div>';
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  try {
    const params = new URLSearchParams({
      ...lastDlpQuery,
      limit:  DLP_PAGE,
      offset: dlpOffset,
    });
    // Remove empty params
    for (const [k, v] of [...params]) { if (!v) params.delete(k); }
    // Always keep source=dlp
    params.set('source', 'dlp');

    const res = await fetch(`/api/catalog/search?${params}`).then(r => r.json());
    if (res.error) throw new Error(res.error);

    const dlpResult = (res.results || []).find(r => r.source === 'dlp') || { total: 0, books: [] };
    dlpTotal = dlpResult.total;
    const books = dlpResult.books || [];

    // Show FTS indicator
    const ftsEl = document.getElementById('dlp-fts-indicator');
    if (ftsEl) ftsEl.textContent = res.fts ? '⚡ Full-text search active' : '🔎 Standard search';

    if (!books.length) {
      cont.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">📚</div>
          <h3>No results in DLP Library</h3>
          <p>Try different keywords, or check spelling. The DLP catalog is updated monthly.</p>
        </div>`;
      countEl.textContent = '0 results';
      document.getElementById('dlp-count-badge').textContent = '';
      return;
    }

    cont.innerHTML = books.map(b => renderDlpCard(b)).join('');

    const start = dlpOffset + 1;
    const end   = Math.min(dlpOffset + books.length, dlpTotal);
    countEl.textContent = `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${dlpTotal.toLocaleString()} titles`;
    document.getElementById('dlp-count-badge').textContent = `(${dlpTotal.toLocaleString()})`;
    pageEl.textContent = `Page ${dlpCurrentPage}`;
    prevBtn.disabled = dlpCurrentPage <= 1;
    nextBtn.disabled = end >= dlpTotal;

  } catch (e) {
    cont.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><h3>Error searching DLP Library</h3><p>${escapeHtml(e.message)}</p></div>`;
    countEl.textContent = 'Search error';
  }
}

function renderDlpCard(b) {
  const year = b.publication_year ? ` · ${b.publication_year}` : '';
  const desc = b.description ? `<p class="card-desc">${escapeHtml(b.description.slice(0,110))}${b.description.length>110?'…':''}</p>` : '';
  const avail = (b.available_copies ?? 1) > 0 && !b.not_for_loan;
  return `
    <div class="card" role="listitem">
      <div class="card-img">${bookCoverHtml(b.title, b.author, b.branch)}</div>
      <div class="card-body">
        <p class="card-source"><span class="dlp-badge">DLP Library</span></p>
        <h3 class="card-title">${escapeHtml(b.title)}</h3>
        <p class="card-meta">${escapeHtml(b.author || 'Unknown')}${year}</p>
        ${desc}
        <div class="card-foot">
          <span class="badge ${avail ? 'success' : 'danger'}">${avail ? 'Available' : 'Not for loan'}</span>
          ${b.language ? `<span class="badge">${escapeHtml(b.language)}</span>` : ''}
        </div>
        <div class="card-foot" style="margin-top:0.5rem;">
          <small class="card-meta">${escapeHtml(b.branch || 'Main')}${b.call_number ? ' · ' + escapeHtml(b.call_number) : ''}</small>
        </div>
      </div>
    </div>`;
}

document.getElementById('dlp-prev').addEventListener('click', () => {
  dlpOffset = Math.max(0, dlpOffset - DLP_PAGE);
  dlpCurrentPage--;
  searchDlp(false);
});
document.getElementById('dlp-next').addEventListener('click', () => {
  dlpOffset += DLP_PAGE;
  dlpCurrentPage++;
  searchDlp(false);
});

// ============================================================
// KOHA SEARCH
// ============================================================
async function searchKoha(reset = true) {
  const q   = document.getElementById('q').value.trim();
  const idx = document.getElementById('search-idx').value;
  if (!q) {
    document.getElementById('koha-count').textContent = 'Enter a search term to browse the Koha catalog.';
    document.getElementById('koha-results').innerHTML = '';
    return;
  }

  if (reset) { kohaPage = 1; kohaLastQ = q; kohaLastIdx = idx; }

  const countEl = document.getElementById('koha-count');
  const cont    = document.getElementById('koha-results');
  countEl.textContent = 'Loading from Koha OPAC…';
  cont.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-muted);">Fetching live records from Eastern University Library…</p></div>';
  document.getElementById('koha-prev').disabled = true;
  document.getElementById('koha-next').disabled = true;

  document.getElementById('opac-fulllink').href = buildKohaUrl(q, idx);

  try {
    const params = new URLSearchParams({ q, idx, page: kohaPage, count: KOHA_COUNT });
    const res = await fetch(`/api/koha/search?${params}`).then(r => r.json());

    if (res.error) throw new Error(res.error);
    kohaTotal = res.total || 0;

    if (!res.books?.length) {
      cont.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No results in Koha OPAC</h3>
          <p>Try different keywords or search on the <a href="${buildKohaUrl(q,idx)}" target="_blank" rel="noopener">full OPAC ↗</a></p>
        </div>`;
      countEl.textContent = '0 results from Koha OPAC';
      return;
    }

    cont.innerHTML = res.books.map(b => renderKohaCard(b)).join('');

    const start = (kohaPage - 1) * KOHA_COUNT + 1;
    const end   = Math.min(kohaPage * KOHA_COUNT, kohaTotal);
    countEl.textContent = `Showing ${start}–${end} of ${kohaTotal.toLocaleString()} results from Koha OPAC`;
    document.getElementById('koha-page-info').textContent = `Page ${kohaPage}`;
    document.getElementById('koha-prev').disabled = kohaPage <= 1;
    document.getElementById('koha-next').disabled = end >= kohaTotal;

  } catch (e) {
    cont.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><h3>Could not reach Koha OPAC</h3><p>${escapeHtml(e.message)}</p><p style="margin-top:0.8rem;"><a href="${buildKohaUrl(q,idx)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">Open OPAC directly ↗</a></p></div>`;
    countEl.textContent = 'Koha OPAC unreachable';
  }
}

function renderKohaCard(b) {
  const year  = b.publication_year ? ` · ${b.publication_year}` : '';
  const isbn  = b.isbn ? `<small class="card-meta">ISBN: ${escapeHtml(b.isbn)}</small>` : '';
  const call  = b.call_number ? `<small class="card-meta"> · ${escapeHtml(b.call_number)}</small>` : '';
  const desc  = b.description ? `<p class="card-desc">${escapeHtml(b.description.slice(0,120))}${b.description.length>120?'…':''}</p>` : '';

  return `
    <div class="card" role="listitem">
      <div class="card-img">${bookCoverHtml(b.title, b.author, b.branch || 'Eastern University')}</div>
      <div class="card-body">
        <p class="card-source"><span class="koha-badge">🔗 Eastern University</span></p>
        <h3 class="card-title">${escapeHtml(b.title)}</h3>
        <p class="card-meta">${escapeHtml(b.author || 'Unknown')}${year}</p>
        ${desc}
        <div class="card-foot">${isbn}${call}</div>
        <div class="card-foot" style="margin-top:0.5rem;">
          <span class="badge">${escapeHtml(b.language || 'English')}</span>
          <a href="${escapeHtml(b.opac_url)}" target="_blank" rel="noopener" class="btn btn-sm btn-accent">
            View Record ↗
          </a>
        </div>
      </div>
    </div>`;
}

// ============================================================
// PAGINATION — KOHA
// ============================================================
document.getElementById('koha-prev').addEventListener('click', () => { kohaPage--; searchKoha(false); });
document.getElementById('koha-next').addEventListener('click', () => { kohaPage++; searchKoha(false); });

// ============================================================
// TRIGGER SEARCH (all active tabs)
// ============================================================
function runSearch() {
  searchLocal(true);
  // If on DLP tab, refresh DLP too
  if (document.getElementById('tab-dlp').classList.contains('active'))  searchDlp(true);
  // If on Koha tab, refresh Koha too
  if (document.getElementById('tab-koha').classList.contains('active')) searchKoha(true);
}

document.getElementById('search-btn').addEventListener('click', runSearch);
document.getElementById('load-more').addEventListener('click', () => searchLocal(false));
document.getElementById('q').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

// ============================================================
// KOHA STATUS DOT
// ============================================================
(async () => {
  const dot = document.getElementById('koha-status-dot');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    await fetch('https://www.opac.lib.esn.ac.lk/cgi-bin/koha/opac-search.pl', { method:'HEAD', mode:'no-cors', signal:ctrl.signal });
    clearTimeout(t);
    dot.style.background = 'var(--success, #2e7d32)';
    dot.title = 'Koha OPAC Online';
  } catch {
    dot.style.background = 'var(--warning, #f59e0b)';
    dot.title = 'Status Unknown';
  }
})();

// ============================================================
// PRE-FILL FROM URL & INITIAL LOAD
// ============================================================
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('q'))          document.getElementById('q').value          = urlParams.get('q');
if (urlParams.get('collection')) document.getElementById('collection').value = urlParams.get('collection');

// Defer initial search until after DOMContentLoaded so i18n.apply() runs first and cannot
// overwrite the result-count text that searchLocal/searchDlp will set.
function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}
onReady(() => {
  if (urlParams.get('tab') === 'dlp') {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-dlp').classList.add('active');
    document.getElementById('tab-dlp').setAttribute('aria-selected','true');
    document.getElementById('pane-dlp').classList.add('active');
    searchDlp(true);
  } else {
    searchLocal(true);
  }
});
