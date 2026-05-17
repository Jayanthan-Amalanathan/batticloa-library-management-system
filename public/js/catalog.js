const COVER_PALETTE=[["#1a3a5c","#e8f0f7"],["#2d5a27","#eaf3e8"],["#5a1f33","#f5eaed"],["#4a2e0d","#f5ede0"],["#2a1a6b","#ece8f5"],["#0d3a3a","#e0f0f0"],["#5c3a1a","#f5ede0"],["#1a3a1a","#e8f2e8"]];

function bookCoverHtml(title, author, branch) {
  let n = 0;
  for (let i = 0; i < (title || '').length; i++) n = (31 * n + title.charCodeAt(i)) & 65535;
  const [bg, fg] = COVER_PALETTE[n % COVER_PALETTE.length];
  // darken the spine color slightly for realism
  const spineBg = bg.replace(/^#/, '');
  const r = Math.max(0, parseInt(spineBg.slice(0,2),16) - 20).toString(16).padStart(2,'0');
  const g = Math.max(0, parseInt(spineBg.slice(2,4),16) - 20).toString(16).padStart(2,'0');
  const b = Math.max(0, parseInt(spineBg.slice(4,6),16) - 20).toString(16).padStart(2,'0');
  const spineColor = `#${r}${g}${b}`;
  return `<div class="book-3d-wrap">
    <div class="book-3d">
      <div class="book-spine" style="background:${spineColor};color:${fg};"></div>
      <div class="book-front" style="background:${bg};color:${fg};">
        <span class="bcp-branch">${escapeHtml(branch || 'Main Library')}</span>
        <span class="bcp-title">${escapeHtml(title || '')}</span>
        <span class="bcp-author">${escapeHtml(author || '')}</span>
      </div>
      <div class="book-pages"></div>
    </div>
  </div>`;
}

let localOffset = 0;
let lastLocalQuery = {};

function buildLocalQuery() {
  return {
    q:          document.getElementById('q').value.trim(),
    category:   document.getElementById('category').value,
    collection: document.getElementById('collection').value,
    language:   document.getElementById('language-filter').value,
    branch:     document.getElementById('branch').value,
    available:  document.getElementById('available-only').checked ? 'true' : '',
  };
}

async function searchLocal(fresh = true) {
  if (fresh) { localOffset = 0; lastLocalQuery = buildLocalQuery(); }
  const btn = document.getElementById('search-btn');
  btn.disabled = true;
  btn.textContent = 'Searching…';
  try {
    const params = new URLSearchParams({ ...lastLocalQuery, limit: 24, offset: localOffset });
    for (const key of [...params.keys()]) { if (!params.get(key)) params.delete(key); }

    const resp = await fetch(`/api/books?${params}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();

    const resultsEl = document.getElementById('results');
    if (!data.books?.length && fresh) {
      resultsEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">📚</div>
          <h3>No books found</h3>
          <p>Try different keywords or broaden your search.</p>
        </div>`;
      document.getElementById('result-count').textContent = '0 results';
      document.getElementById('load-more-wrap').classList.add('hidden');
      return;
    }

    const html = (data.books || []).map(renderCard).join('');
    if (fresh) { resultsEl.innerHTML = html; } else { resultsEl.insertAdjacentHTML('beforeend', html); }

    const shown = Math.min(localOffset + data.books.length, data.total);
    document.getElementById('result-count').textContent =
      `Showing ${shown.toLocaleString()} of ${(data.total || 0).toLocaleString()} titles`;
    document.getElementById('load-more-wrap').classList.toggle('hidden',
      localOffset + data.books.length >= data.total);
    localOffset += data.books.length;
    attachButtons(resultsEl);
  } catch (e) {
    document.getElementById('results').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠️</div>
        <h3>Error loading catalog</h3>
        <p>${escapeHtml(e.message)}</p>
      </div>`;
    document.getElementById('result-count').textContent = 'Error — could not load books';
  } finally {
    btn.disabled = false;
    btn.textContent = i18n.t('catalog.search');
  }
}

function renderCard(book) {
  const desc = (book.description || '').slice(0, 110);
  const descHtml = desc ? `<p class="card-desc">${escapeHtml(desc)}${book.description.length > 110 ? '…' : ''}</p>` : '';
  const reserveBtn = book.available_copies > 0
    ? `<button class="btn btn-sm btn-accent" data-reserve="${book.id}" aria-label="Reserve ${escapeHtml(book.title)}">Reserve</button>`
    : '';
  return `
    <div class="card" role="listitem">
      <div class="card-img">${bookCoverHtml(book.title, book.author, book.branch)}</div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(book.title)}</h3>
        <p class="card-meta">${escapeHtml(book.author)}${book.publication_year ? ' · ' + book.publication_year : ''}</p>
        ${descHtml}
        <div class="card-foot">
          <span class="badge ${book.available_copies > 0 ? 'success' : 'danger'}">
            ${book.available_copies > 0 ? book.available_copies + ' available' : 'On Loan'}
          </span>
          <span class="badge">${escapeHtml(book.collection_type || '')}</span>
        </div>
        <div class="card-foot" style="margin-top:0.5rem;">
          <small class="card-meta">${escapeHtml(book.branch || 'Main')}${book.call_number ? ' · ' + escapeHtml(book.call_number) : ''}</small>
          ${reserveBtn}
        </div>
      </div>
    </div>`;
}

function attachButtons(container) {
  container.querySelectorAll('[data-reserve]').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.reserve;
      const orig = e.currentTarget.textContent;
      e.currentTarget.disabled = true;
      e.currentTarget.textContent = 'Reserving…';
      try {
        await api.post('/api/reservations', { book_id: parseInt(id) });
        e.currentTarget.textContent = 'Reserved ✓';
        e.currentTarget.classList.replace('btn-accent', 'btn-ghost');
      } catch (err) {
        if (err.message.includes('Authentication')) {
          location.href = '/login?next=/catalog';
        } else {
          e.currentTarget.textContent = orig;
          e.currentTarget.disabled = false;
          alert(err.message);
        }
      }
    });
  });
}

document.getElementById('search-btn').addEventListener('click', () => searchLocal(true));
document.getElementById('load-more').addEventListener('click', () => searchLocal(false));
document.getElementById('q').addEventListener('keydown', e => { if (e.key === 'Enter') searchLocal(true); });

const urlParams = new URLSearchParams(location.search);
if (urlParams.get('q'))          document.getElementById('q').value = urlParams.get('q');
if (urlParams.get('collection')) document.getElementById('collection').value = urlParams.get('collection');

function onReady(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
onReady(() => searchLocal(true));
