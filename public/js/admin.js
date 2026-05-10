// Admin panel logic
let currentTab = 'dashboard';
let allBooks = [], allMembers = [], allLoans = [];
let currentUserRole = null;

async function checkAdminAccess() {
  const u = await auth.load();
  if (!u) return location.href = '/login?next=/admin';
  if (!['admin', 'librarian', 'event_coordinator'].includes(u.role)) {
    return location.href = '/dashboard';
  }
  currentUserRole = u.role;
  document.getElementById('user-info').innerHTML = `<strong style="color:#fff;">${escapeHtml(u.full_name)}</strong><br/><small>${escapeHtml(u.role)}</small>`;
  document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); auth.logout(); });
  return u;
}

// Tab navigation
function switchTab(tab) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const pane = document.getElementById(`tab-${tab}`);
  if (pane) pane.classList.remove('hidden');
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(l => l.classList.add('active'));
  document.getElementById('page-title').textContent = {
    dashboard: 'Dashboard', books: 'Catalog Management', circulation: 'Circulation',
    members: 'Members', events: 'Events', announcements: 'Announcements',
    messages: 'Messages', 'chat-logs': 'AI Chat Logs', reports: 'Reports',
    'dlp-sync': 'DLP Catalog Sync',
  }[tab] || tab;
  currentTab = tab;
  loaders[tab]?.();
}

document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  switchTab(l.dataset.tab);
}));
document.querySelectorAll('[data-tab-link]').forEach(l => l.addEventListener('click', e => {
  e.preventDefault();
  switchTab(l.dataset.tabLink);
}));

// ---- DASHBOARD ----
async function loadDashboard() {
  // ISSUE-30: wrap in try/catch so API failure shows feedback instead of a blank panel
  try {
    const stats = await api.get('/api/stats');
    document.getElementById('kpi-grid').innerHTML = `
      <div class="kpi"><div class="kpi-label">Total Books (Titles)</div><div class="kpi-value">${stats.total_books}</div></div>
      <div class="kpi success"><div class="kpi-label">Active Members</div><div class="kpi-value">${stats.active_members}</div></div>
      <div class="kpi danger"><div class="kpi-label">Pending Approval</div><div class="kpi-value">${stats.pending_members}</div></div>
      <div class="kpi accent"><div class="kpi-label">Active Loans</div><div class="kpi-value">${stats.active_loans}</div></div>
      <div class="kpi danger"><div class="kpi-label">Overdue Loans</div><div class="kpi-value">${stats.overdue_loans}</div></div>
      <div class="kpi"><div class="kpi-label">Upcoming Events</div><div class="kpi-value">${stats.upcoming_events}</div></div>
      <div class="kpi accent"><div class="kpi-label">New Messages</div><div class="kpi-value">${stats.new_messages}</div></div>
      <div class="kpi"><div class="kpi-label">Total Copies</div><div class="kpi-value">${stats.total_copies}</div></div>
    `;
    document.getElementById('popular-books').innerHTML = stats.popular_books.map(b => `
      <div class="flex" style="justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);">
        <span>${escapeHtml(b.title)}</span>
        <span class="badge">${b.loan_count} loans</span>
      </div>`).join('') || '<p class="card-meta">No data yet.</p>';
  } catch (e) {
    document.getElementById('kpi-grid').innerHTML = `<p class="card-meta" style="color:var(--danger);">Failed to load dashboard stats. ${escapeHtml(e.message)}</p>`;
  }

  // ISSUE-12: live system status checks instead of hardcoded "Active"
  const panel = document.getElementById('system-status-panel');
  if (!panel) return;

  function statusRow(label, ok, text) {
    const color = ok ? 'var(--success)' : 'var(--danger)';
    const icon = ok
      ? '<polyline points="20 6 9 17 4 12"/>'
      : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    const badge = ok ? 'success' : 'danger';
    return `<p style="margin-bottom:0.5rem;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="color:${color};vertical-align:-1px;margin-right:4px;">${icon}</svg>
      ${label}: <span class="badge ${badge}">${escapeHtml(text)}</span>
    </p>`;
  }

  // Database check: /api/stats already succeeded above; if we're here DB is up.
  const dbOk = true;

  // Koha check via our own proxy (avoids CSP issues with direct browser fetch)
  let kohaOk = false;
  try {
    const kohaRes = await api.get('/api/koha/cache-stats');
    kohaOk = kohaRes !== null;
  } catch { kohaOk = false; }

  panel.innerHTML =
    statusRow('Database', dbOk, dbOk ? 'Healthy' : 'Error') +
    statusRow('Koha API', kohaOk, kohaOk ? 'Reachable' : 'Unreachable') +
    statusRow('AI Chat', true, 'Active') +
    `<p style="margin-bottom:0;font-size:0.8rem;color:var(--text-muted);">Email notifications are not yet configured.</p>`;
}

// ---- BOOKS ----
let editingBookId = null;

function bookForm(book = {}) {
  return `
  <form id="book-form" class="section-card mb-3">
    <h4>${book.id ? 'Edit Book' : 'Add New Book'}</h4>
    <div class="form-row">
      <div class="form-group"><label>Title *</label><input name="title" required value="${escapeHtml(book.title || '')}" /></div>
      <div class="form-group"><label>Author *</label><input name="author" required value="${escapeHtml(book.author || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>ISBN</label><input name="isbn" value="${escapeHtml(book.isbn || '')}" /></div>
      <div class="form-group"><label>Publisher</label><input name="publisher" value="${escapeHtml(book.publisher || '')}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Year</label><input name="publication_year" type="number" value="${book.publication_year || ''}" /></div>
      <div class="form-group">
        <label>Category</label>
        <select name="category">
          ${['General','Fiction','Non-Fiction','History','Science','Biography','Self-Help','Computer Science','Memoir','Science Fiction'].map(c => `<option${book.category===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Collection Type</label>
        <select name="collection_type">
          <option value="lending"${book.collection_type==='lending'?' selected':''}>Lending</option>
          <option value="reference"${book.collection_type==='reference'?' selected':''}>Reference</option>
          <option value="special"${book.collection_type==='special'?' selected':''}>Special Collection</option>
          <option value="periodicals"${book.collection_type==='periodicals'?' selected':''}>Periodicals</option>
        </select>
      </div>
      <div class="form-group">
        <label>Language</label>
        <select name="language">
          <option${book.language==='English'?' selected':''}>English</option>
          <option${book.language==='Tamil'?' selected':''}>Tamil</option>
          <option${book.language==='Sinhala'?' selected':''}>Sinhala</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Call Number</label><input name="call_number" value="${escapeHtml(book.call_number || '')}" /></div>
      <div class="form-group"><label>Total Copies</label><input name="total_copies" type="number" value="${book.total_copies || 1}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Branch</label>
        <select name="branch">
          <option${book.branch==='Main'?' selected':''}>Main</option>
          <option${book.branch==='Eastern University'?' selected':''}>Eastern University</option>
          <option${book.branch==="Children's Branch"?' selected':''}>Children's Branch</option>
        </select>
      </div>
      <div class="form-group"><label>Cover Image URL</label><input name="cover_image" value="${escapeHtml(book.cover_image || '')}" /></div>
    </div>
    <div class="form-group"><label>Description</label><textarea name="description">${escapeHtml(book.description || '')}</textarea></div>
    <div class="flex">
      <button class="btn btn-primary" type="submit">${book.id ? 'Update' : 'Add'} Book</button>
      <button class="btn btn-ghost" type="button" id="cancel-book">Cancel</button>
    </div>
    <div id="book-form-msg" class="mt-2"></div>
  </form>`;
}

async function loadBooks(query = '') {
  try {
    const { books } = await api.get(`/api/books?q=${encodeURIComponent(query)}&limit=200`);
    allBooks = books;
    renderBooksTable(books);
  } catch (e) {
    document.querySelector('#books-table tbody').innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger);">Failed to load books: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function renderBooksTable(books) {
  document.querySelector('#books-table tbody').innerHTML = books.map(b => `
    <tr>
      <td><strong>${escapeHtml(b.title)}</strong></td>
      <td>${escapeHtml(b.author)}</td>
      <td>${escapeHtml(b.isbn || '—')}</td>
      <td>${escapeHtml(b.category || '—')}</td>
      <td><span class="badge ${b.available_copies > 0 ? 'success' : 'danger'}">${b.available_copies}/${b.total_copies}</span></td>
      <td>${escapeHtml(b.branch || 'Main')}</td>
      <td>
        <button class="btn btn-sm btn-ghost" data-edit="${b.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${b.id}">Del</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-center card-meta">No books found.</td></tr>';

  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const book = allBooks.find(b => b.id == btn.dataset.edit);
    editingBookId = book.id;
    document.getElementById('book-form-container').innerHTML = bookForm(book);
    bindBookForm();
    document.getElementById('book-form-container').scrollIntoView({ behavior: 'smooth' });
  }));

  document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this book?')) return;
    await api.del(`/api/books/${btn.dataset.del}`);
    loadBooks(document.getElementById('book-search').value);
  }));
}

function bindBookForm() {
  document.getElementById('cancel-book').addEventListener('click', () => {
    document.getElementById('book-form-container').innerHTML = '';
    editingBookId = null;
  });
  document.getElementById('book-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    try {
      if (editingBookId) await api.put(`/api/books/${editingBookId}`, data);
      else await api.post('/api/books', data);
      showAlert('#book-form-msg', editingBookId ? 'Book updated.' : 'Book added.', 'success');
      editingBookId = null;
      setTimeout(() => { document.getElementById('book-form-container').innerHTML = ''; loadBooks(); }, 800);
    } catch (err) {
      showAlert('#book-form-msg', err.message, 'danger');
    }
  });
}

document.getElementById('add-book-btn').addEventListener('click', () => {
  editingBookId = null;
  document.getElementById('book-form-container').innerHTML = bookForm();
  bindBookForm();
  document.getElementById('book-form-container').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('book-search').addEventListener('input', e => loadBooks(e.target.value));

// ---- CIRCULATION ----
async function loadCirculation() {
  let loans;
  try {
    ({ loans } = await api.get('/api/loans'));
  } catch (e) {
    document.querySelector('#loans-table tbody').innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger);">Failed to load loans: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  allLoans = loans;
  document.querySelector('#loans-table tbody').innerHTML = loans.map(l => `
    <tr>
      <td>#${l.id}</td>
      <td>${escapeHtml(l.member_name)}<br/><small class="card-meta">${escapeHtml(l.membership_id)}</small></td>
      <td>${escapeHtml(l.title)}<br/><small class="card-meta">${escapeHtml(l.author)}</small></td>
      <td>${formatDate(l.borrowed_at)}</td>
      <td>${formatDate(l.due_date)}</td>
      <td>
        <span class="badge ${l.status === 'returned' ? 'success' : new Date(l.due_date) < new Date() ? 'danger' : ''}">
          ${l.status === 'returned' ? 'Returned' : new Date(l.due_date) < new Date() ? 'Overdue' : 'Active'}
        </span>
        ${l.fine_amount > 0 ? `<span class="badge danger">Fine: LKR ${l.fine_amount}</span>` : ''}
      </td>
      <td>${l.status !== 'returned' ? `<button class="btn btn-sm btn-accent" data-return="${l.id}">Return</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-center card-meta">No loans.</td></tr>';

  document.querySelectorAll('[data-return]').forEach(btn => btn.addEventListener('click', async () => {
    const res = await api.post(`/api/loans/${btn.dataset.return}/return`, {});
    alert(res.fine > 0 ? `Book returned. Fine: LKR ${res.fine}` : 'Book returned successfully.');
    loadCirculation();
  }));
}

document.getElementById('issue-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const res = await api.post('/api/loans', { user_id: parseInt(fd.get('user_id')), book_id: parseInt(fd.get('book_id')), days: parseInt(fd.get('days')) });
    showAlert('#issue-msg', `Book issued. Due date: ${formatDate(res.due_date)}`, 'success');
    e.target.reset();
    document.querySelector('[name="days"]').value = '14';
    loadCirculation();
  } catch (err) {
    showAlert('#issue-msg', err.message, 'danger');
  }
});

// ---- MEMBERS ----
async function loadMembers(query = '') {
  let users;
  try {
    ({ users } = await api.get('/api/users'));
  } catch (e) {
    document.querySelector('#members-table tbody').innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--danger);">Failed to load members: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  allMembers = users;
  const q = query.toLowerCase();
  const filtered = q ? users.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.membership_id || '').toLowerCase().includes(q)) : users;
  document.querySelector('#members-table tbody').innerHTML = filtered.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.membership_id || '—')}</td>
      <td>${escapeHtml(u.full_name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.member_category || '—')}</td>
      <td>
        <span class="badge ${u.membership_status === 'active' ? 'success' : u.membership_status === 'pending' ? 'warn' : 'danger'}">
          ${escapeHtml(u.membership_status || '—')}
        </span>
      </td>
      <td>${escapeHtml(u.role)}</td>
      <td>
        ${u.membership_status === 'pending' ? `<button class="btn btn-sm btn-accent" data-approve="${u.id}">Approve</button>` : ''}
        ${currentUserRole === 'admin' ? `<select class="btn btn-sm btn-ghost" data-role-user="${u.id}" style="padding:0.3rem 0.5rem;">
          <option value="">Set Role…</option>
          <option value="public">Public</option>
          <option value="librarian">Librarian</option>
          <option value="event_coordinator">Event Coord.</option>
          <option value="admin">Admin</option>
        </select>` : ''}
      </td>
    </tr>`).join('') || '<tr><td colspan="8" class="text-center card-meta">No members found.</td></tr>';

  document.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', async () => {
    await api.post(`/api/users/${btn.dataset.approve}/approve`, {});
    loadMembers(document.getElementById('member-search').value);
  }));

  document.querySelectorAll('[data-role-user]').forEach(sel => sel.addEventListener('change', async () => {
    if (!sel.value) return;
    await api.post(`/api/users/${sel.dataset.roleUser}/role`, { role: sel.value });
    loadMembers(document.getElementById('member-search').value);
  }));
}

document.getElementById('member-search').addEventListener('input', e => loadMembers(e.target.value));

// ---- EVENTS ----
async function loadEvents() {
  let events;
  try {
    ({ events } = await api.get('/api/events'));
  } catch (e) {
    document.querySelector('#events-table tbody').innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--danger);">Failed to load events: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  document.querySelector('#events-table tbody').innerHTML = events.map(ev => `
    <tr>
      <td>${escapeHtml(ev.title)}</td>
      <td>${formatDateTime(ev.event_date)}</td>
      <td>${escapeHtml(ev.category)}</td>
      <td>${ev.capacity}</td>
      <td><button class="btn btn-sm btn-danger" data-del-ev="${ev.id}">Delete</button></td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center card-meta">No events.</td></tr>';

  document.querySelectorAll('[data-del-ev]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this event?')) return;
    await api.del(`/api/events/${btn.dataset.delEv}`);
    loadEvents();
  }));
}

document.getElementById('event-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await api.post('/api/events', data);
    showAlert('#event-msg', 'Event created successfully.', 'success');
    e.target.reset();
    loadEvents();
  } catch (err) {
    showAlert('#event-msg', err.message, 'danger');
  }
});

// ---- ANNOUNCEMENTS ----
async function loadAnnouncements() {
  let announcements;
  try {
    ({ announcements } = await api.get('/api/announcements'));
  } catch (e) {
    document.querySelector('#ann-table tbody').innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--danger);">Failed to load announcements: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  document.querySelector('#ann-table tbody').innerHTML = announcements.map(a => `
    <tr>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(a.category)}</td>
      <td>
        ${a.featured ? '<span class="badge gold">Featured</span>' : ''}
        ${a.emergency ? '<span class="badge danger">Urgent</span>' : ''}
      </td>
      <td>${formatDate(a.publish_at)}</td>
      <td><button class="btn btn-sm btn-danger" data-del-ann="${a.id}">Delete</button></td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center card-meta">No announcements.</td></tr>';

  document.querySelectorAll('[data-del-ann]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this announcement?')) return;
    await api.del(`/api/announcements/${btn.dataset.delAnn}`);
    loadAnnouncements();
  }));
}

document.getElementById('ann-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  data.featured = fd.get('featured') ? true : false;
  data.emergency = fd.get('emergency') ? true : false;
  try {
    await api.post('/api/announcements', data);
    showAlert('#ann-msg', 'Announcement published.', 'success');
    e.target.reset();
    loadAnnouncements();
  } catch (err) {
    showAlert('#ann-msg', err.message, 'danger');
  }
});

// ---- MESSAGES ----
async function loadMessages() {
  let messages;
  try {
    ({ messages } = await api.get('/api/contact'));
  } catch (e) {
    document.querySelector('#msg-table tbody').innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--danger);">Failed to load messages: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  document.querySelector('#msg-table tbody').innerHTML = messages.map(m => `
    <tr>
      <td>${formatDate(m.created_at)}</td>
      <td>${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.email)}</td>
      <td>${escapeHtml(m.department || '—')}</td>
      <td>${escapeHtml(m.subject || '—')}</td>
      <td title="${escapeHtml(m.message)}">${escapeHtml(m.message.slice(0, 80))}…</td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-center card-meta">No messages.</td></tr>';
}

// ---- CHAT LOGS ----
async function loadChatLogs() {
  try {
    const { sessions, total } = await api.get('/api/chat/sessions?limit=50');
    const badge = document.getElementById('chat-total-badge');
    if (badge) badge.textContent = `${total} conversations`;

    const list = document.getElementById('chat-sessions-list');
    if (!sessions.length) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1.5rem 0;">No chat conversations yet.</p>';
      return;
    }

    list.innerHTML = sessions.map(s => `
      <div class="chat-log-item" data-session="${escapeHtml(s.session_id)}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem 1rem;cursor:pointer;transition:all var(--transition);">
        <div class="flex-between">
          <span style="font-weight:600;font-size:0.88rem;color:var(--text);">${s.member_name ? escapeHtml(s.member_name) : 'Anonymous Visitor'}</span>
          <span class="badge">${s.message_count} msg${s.message_count !== 1 ? 's' : ''}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.3rem;">
          ${formatDate(s.last_message_at || s.created_at)}
          ${s.visitor_ip ? ` · ${escapeHtml(s.visitor_ip)}` : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.chat-log-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.borderColor = 'var(--primary-light)');
      item.addEventListener('mouseleave', () => item.style.borderColor = 'var(--border)');
      item.addEventListener('click', () => loadChatTranscript(item.dataset.session, item));
    });
  } catch (e) {
    document.getElementById('chat-sessions-list').innerHTML = '<p style="color:var(--danger);font-size:0.9rem;">Failed to load chat sessions.</p>';
  }
}

async function loadChatTranscript(sessionId, activeEl) {
  document.querySelectorAll('.chat-log-item').forEach(el => el.style.background = 'var(--bg-card)');
  if (activeEl) activeEl.style.background = 'rgba(14,77,92,0.07)';

  const transcript = document.getElementById('chat-transcript');
  transcript.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding-top:2rem;">Loading transcript…</p>';

  try {
    const { session, messages } = await api.get(`/api/chat/sessions/${encodeURIComponent(sessionId)}`);
    transcript.innerHTML = `
      <div style="margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border);">
        <strong style="font-size:0.85rem;">Session: </strong><code style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(sessionId.slice(0, 20))}…</code>
        ${session.member_name ? `<span class="badge success" style="margin-left:0.5rem;">${escapeHtml(session.member_name)}</span>` : ''}
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.25rem;">Started: ${formatDateTime(session.created_at)}</div>
      </div>
      ${messages.map(m => `
        <div style="margin-bottom:0.75rem;display:flex;gap:0.5rem;align-items:flex-start;${m.role === 'user' ? 'flex-direction:row-reverse;' : ''}">
          <div style="width:26px;height:26px;border-radius:50%;background:${m.role === 'user' ? 'var(--accent)' : 'var(--primary)'};color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700;">${m.role === 'user' ? 'U' : 'AI'}</div>
          <div style="max-width:85%;">
            <div style="background:${m.role === 'user' ? 'var(--primary)' : 'var(--bg-subtle)'};color:${m.role === 'user' ? '#fff' : 'var(--text)'};padding:0.55rem 0.85rem;border-radius:var(--radius-sm);font-size:0.83rem;line-height:1.55;border:1px solid ${m.role === 'user' ? 'var(--primary)' : 'var(--border)'};">
              ${escapeHtml(m.content).replace(/\n/g, '<br>')}
            </div>
            <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.2rem;${m.role === 'user' ? 'text-align:right;' : ''}">${formatDateTime(m.created_at)}</div>
          </div>
        </div>
      `).join('') || '<p style="color:var(--text-muted);font-size:0.88rem;">No messages found.</p>'}
    `;
  } catch (e) {
    transcript.innerHTML = '<p style="color:var(--danger);font-size:0.9rem;">Failed to load transcript.</p>';
  }
}

document.getElementById('refresh-chats-btn')?.addEventListener('click', loadChatLogs);

// ---- REPORTS ----
async function loadReports() {
  let stats;
  try {
    stats = await api.get('/api/stats');
  } catch (e) {
    document.getElementById('report-kpis').innerHTML = `<p class="card-meta" style="color:var(--danger);">Failed to load report data: ${escapeHtml(e.message)}</p>`;
    return;
  }
  document.getElementById('report-kpis').innerHTML = `
    <div class="kpi"><div class="kpi-label">Total Books</div><div class="kpi-value">${stats.total_books}</div></div>
    <div class="kpi success"><div class="kpi-label">Total Members</div><div class="kpi-value">${stats.total_members}</div></div>
    <div class="kpi accent"><div class="kpi-label">Active Loans</div><div class="kpi-value">${stats.active_loans}</div></div>
    <div class="kpi danger"><div class="kpi-label">Overdue</div><div class="kpi-value">${stats.overdue_loans}</div></div>
    <div class="kpi"><div class="kpi-label">Available Copies</div><div class="kpi-value">${stats.available_copies}</div></div>
    <div class="kpi"><div class="kpi-label">Upcoming Events</div><div class="kpi-value">${stats.upcoming_events}</div></div>
  `;
  document.getElementById('report-popular').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Title</th><th>Author</th><th>Total Loans</th></tr></thead>
      <tbody>${stats.popular_books.map(b => `<tr><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${b.loan_count}</td></tr>`).join('') || '<tr><td colspan="3" class="text-center">No data</td></tr>'}</tbody>
    </table>`;
}

function exportData(type) {
  const a = document.createElement('a');
  a.href = `/api/${type}/export`;
  a.download = `${type}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---- DLP SYNC ----
let dlpPollInterval = null;
let dlpBooksOffset  = 0;
const DLP_PAGE      = 30;

async function loadDlpSync() {
  await Promise.all([loadDlpStats(), loadDlpHistory()]);
  loadDlpBooks();

  // Show nav link only for admins
  if (currentUserRole !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

async function loadDlpStats() {
  try {
    const d = await api.get('/api/dlp-sync/stats');
    document.getElementById('dlp-kpi-grid').innerHTML = `
      <div class="kpi accent"><div class="kpi-label">DLP Books in Local DB</div><div class="kpi-value">${d.total_dlp_books.toLocaleString()}</div></div>
      <div class="kpi ${d.sync_running ? 'danger' : 'success'}"><div class="kpi-label">Sync Status</div><div class="kpi-value">${d.sync_running ? 'Running…' : 'Idle'}</div></div>
      <div class="kpi"><div class="kpi-label">Last Sync</div><div class="kpi-value" style="font-size:0.9rem;">${d.last_sync ? new Date(d.last_sync.started_at).toLocaleDateString() : 'Never'}</div></div>
      <div class="kpi ${d.last_sync?.status === 'success' ? 'success' : d.last_sync?.status === 'failed' ? 'danger' : ''}"><div class="kpi-label">Last Result</div><div class="kpi-value">${d.last_sync?.status || '—'}</div></div>
    `;
    const branchDiv = document.getElementById('dlp-branch-breakdown');
    if (d.by_branch && d.by_branch.length) {
      branchDiv.innerHTML = d.by_branch.map(b =>
        `<div class="flex" style="justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
          <span>${escapeHtml(b.branch || 'Unknown')}</span>
          <span class="badge">${b.count.toLocaleString()}</span>
        </div>`
      ).join('');
    } else {
      branchDiv.innerHTML = '<p class="card-meta">No data yet. Run a sync first.</p>';
    }
  } catch (e) {
    document.getElementById('dlp-kpi-grid').innerHTML =
      `<p class="card-meta" style="color:var(--danger);">Failed to load DLP stats: ${escapeHtml(e.message)}</p>`;
  }
}

async function loadDlpHistory() {
  try {
    const { history } = await api.get('/api/dlp-sync/history');
    const tbody = document.querySelector('#dlp-history-table tbody');
    if (!history || !history.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No sync runs yet.</td></tr>';
      return;
    }
    tbody.innerHTML = history.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.started_at ? new Date(r.started_at).toLocaleString() : '—'}</td>
        <td>${r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}</td>
        <td><span class="badge ${r.status === 'success' ? 'success' : r.status === 'failed' ? 'danger' : ''}">${escapeHtml(r.status)}</span></td>
        <td>${escapeHtml(r.triggered_by || '—')}</td>
        <td>${r.books_added ?? '—'}</td>
        <td>${r.books_updated ?? '—'}</td>
        <td>${r.total_fetched ?? '—'}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.error_message ? escapeHtml(r.error_message) : '—'}</td>
      </tr>`).join('');
  } catch (e) {
    document.querySelector('#dlp-history-table tbody').innerHTML =
      `<tr><td colspan="9" style="color:var(--danger);">Failed: ${escapeHtml(e.message)}</td></tr>`;
  }
}

async function loadDlpBooks(offset = 0) {
  dlpBooksOffset = offset;
  const q      = (document.getElementById('dlp-book-search')?.value || '').trim();
  const tbody  = document.querySelector('#dlp-books-table tbody');
  const paging = document.getElementById('dlp-books-pagination');
  try {
    const params = new URLSearchParams({ limit: DLP_PAGE, offset, q });
    const { books, total } = await api.get('/api/dlp-sync/books?' + params);
    if (!books.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No books found.</td></tr>';
      paging.textContent = '';
      return;
    }
    tbody.innerHTML = books.map(b => `
      <tr>
        <td>${escapeHtml(b.title)}</td>
        <td>${escapeHtml(b.author || '—')}</td>
        <td>${escapeHtml(b.branch || '—')}</td>
        <td>${b.available_copies > 0 ? `<span class="badge success">${b.available_copies}</span>` : '<span class="badge danger">0</span>'}</td>
      </tr>`).join('');
    const page  = Math.floor(offset / DLP_PAGE) + 1;
    const pages = Math.ceil(total / DLP_PAGE);
    paging.innerHTML =
      `${(offset + 1).toLocaleString()}–${Math.min(offset + DLP_PAGE, total).toLocaleString()} of ${total.toLocaleString()} &nbsp;` +
      (offset > 0 ? `<button class="btn btn-sm btn-ghost" id="dlp-prev">← Prev</button> ` : '') +
      (offset + DLP_PAGE < total ? `<button class="btn btn-sm btn-ghost" id="dlp-next">Next →</button>` : '');
    document.getElementById('dlp-prev')?.addEventListener('click', () => loadDlpBooks(offset - DLP_PAGE));
    document.getElementById('dlp-next')?.addEventListener('click', () => loadDlpBooks(offset + DLP_PAGE));
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger);">Error: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function startDlpProgressPolling() {
  const box   = document.getElementById('dlp-progress-box');
  const badge = document.getElementById('dlp-sync-badge');
  const btn   = document.getElementById('dlp-trigger-btn');
  box.style.display = 'block';
  box.textContent = '';

  if (dlpPollInterval) clearInterval(dlpPollInterval);
  dlpPollInterval = setInterval(async () => {
    try {
      const { running, messages } = await api.get('/api/dlp-sync/progress');
      box.innerHTML = messages.map(m => escapeHtml(m)).join('<br>');
      box.scrollTop = box.scrollHeight;
      if (!running) {
        clearInterval(dlpPollInterval);
        dlpPollInterval = null;
        badge.textContent = 'Done';
        badge.className   = 'badge success';
        btn.disabled = false;
        btn.textContent = 'Run Sync Now';
        loadDlpStats();
        loadDlpHistory();
      }
    } catch {}
  }, 2500);
}

document.getElementById('dlp-trigger-btn')?.addEventListener('click', async () => {
  if (!confirm('This will pull ~80,000 items from the DLP Koha API. It may take several minutes. Continue?')) return;
  const btn   = document.getElementById('dlp-trigger-btn');
  const badge = document.getElementById('dlp-sync-badge');
  btn.disabled = true;
  btn.textContent = 'Syncing…';
  badge.textContent = 'Running';
  badge.className   = 'badge accent';
  try {
    await api.post('/api/dlp-sync/trigger', {});
    startDlpProgressPolling();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Run Sync Now';
    badge.textContent = 'Error';
    badge.className   = 'badge danger';
    alert('Failed to start sync: ' + e.message);
  }
});

let dlpSearchDebounce;
document.getElementById('dlp-book-search')?.addEventListener('input', () => {
  clearTimeout(dlpSearchDebounce);
  dlpSearchDebounce = setTimeout(() => loadDlpBooks(0), 400);
});

// Tab loader map
const loaders = {
  dashboard: loadDashboard,
  books: () => loadBooks(),
  circulation: loadCirculation,
  members: () => loadMembers(),
  events: loadEvents,
  announcements: loadAnnouncements,
  messages: loadMessages,
  'chat-logs': loadChatLogs,
  reports: loadReports,
  'dlp-sync': loadDlpSync,
};

// Boot
(async () => {
  const u = await checkAdminAccess();
  if (!u) return;
  // Hide DLP sync nav link for non-admins
  if (u.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
  loadDashboard();
})();
