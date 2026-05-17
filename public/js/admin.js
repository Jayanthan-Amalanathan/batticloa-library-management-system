let currentTab="dashboard",allBooks=[],currentUserRole=null;async function checkAdminAccess(){const e=await auth.load();return e?["admin","librarian","event_coordinator"].includes(e.role)?(currentUserRole=e.role,document.getElementById("user-info").innerHTML=`<strong style="color:#fff;">${escapeHtml(e.full_name)}</strong><br/><small>${escapeHtml(e.role)}</small>`,document.getElementById("logout-btn").addEventListener("click",e=>{e.preventDefault(),auth.logout()}),e):location.href="/dashboard":location.href="/login?next=/admin"}function switchTab(e){document.querySelectorAll(".tab-pane").forEach(e=>e.classList.add("hidden")),document.querySelectorAll(".nav-link").forEach(e=>e.classList.remove("active"));const t=document.getElementById(`tab-${e}`);t&&t.classList.remove("hidden"),document.querySelectorAll(`[data-tab="${e}"]`).forEach(e=>e.classList.add("active")),document.getElementById("page-title").textContent={dashboard:"Dashboard",books:"Catalog Management",events:"Events",announcements:"Announcements",messages:"Messages","chat-logs":"AI Chat Logs",reports:"Reports"}[e]||e,currentTab=e,loaders[e]?.()}async function loadDashboard(){try{const e=await api.get("/api/stats");document.getElementById("kpi-grid").innerHTML=`\n      <div class="kpi"><div class="kpi-label">Total Books (Titles)</div><div class="kpi-value">${e.total_books}</div></div>\n      <div class="kpi success"><div class="kpi-label">Active Members</div><div class="kpi-value">${e.active_members}</div></div>\n      <div class="kpi danger"><div class="kpi-label">Pending Approval</div><div class="kpi-value">${e.pending_members}</div></div>\n      <div class="kpi accent"><div class="kpi-label">Active Loans</div><div class="kpi-value">${e.active_loans}</div></div>\n      <div class="kpi danger"><div class="kpi-label">Overdue Loans</div><div class="kpi-value">${e.overdue_loans}</div></div>\n      <div class="kpi"><div class="kpi-label">Total Events</div><div class="kpi-value">${e.total_events}</div></div>\n      <div class="kpi accent"><div class="kpi-label">New Messages</div><div class="kpi-value">${e.new_messages}</div></div>\n      <div class="kpi"><div class="kpi-label">Total Copies</div><div class="kpi-value">${e.total_copies}</div></div>\n    `,document.getElementById("popular-books").innerHTML=e.popular_books.map(e=>`\n      <div class="flex" style="justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);">\n        <span>${escapeHtml(e.title)}</span>\n        <span class="badge">${e.loan_count} loans</span>\n      </div>`).join("")||'<p class="card-meta">No data yet.</p>'}catch(e){document.getElementById("kpi-grid").innerHTML=`<p class="card-meta" style="color:var(--danger);">Failed to load dashboard stats. ${escapeHtml(e.message)}</p>`}const e=document.getElementById("system-status-panel");if(!e)return;function t(e,t,a){return`<p style="margin-bottom:0.5rem;">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="color:${t?"var(--success)":"var(--danger)"};vertical-align:-1px;margin-right:4px;">${t?'<polyline points="20 6 9 17 4 12"/>':'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}</svg>\n      ${e}: <span class="badge ${t?"success":"danger"}">${escapeHtml(a)}</span>\n    </p>`}const a=!0;e.innerHTML=t("Database",a,"Healthy")+t("AI Chat",!0,"Active")+'<p style="margin-bottom:0;font-size:0.8rem;color:var(--text-muted);">Email notifications are not yet configured.</p>'}document.querySelectorAll(".nav-link").forEach(e=>e.addEventListener("click",t=>{t.preventDefault(),switchTab(e.dataset.tab)})),document.querySelectorAll("[data-tab-link]").forEach(e=>e.addEventListener("click",t=>{t.preventDefault(),switchTab(e.dataset.tabLink)}));let editingBookId=null;function bookForm(e={}){return`\n  <form id="book-form" class="section-card mb-3">\n    <h4>${e.id?"Edit Book":"Add New Book"}</h4>\n    <div class="form-row">\n      <div class="form-group"><label>Title *</label><input name="title" required value="${escapeHtml(e.title||"")}" /></div>\n      <div class="form-group"><label>Author *</label><input name="author" required value="${escapeHtml(e.author||"")}" /></div>\n    </div>\n    <div class="form-row">\n      <div class="form-group"><label>ISBN</label><input name="isbn" value="${escapeHtml(e.isbn||"")}" /></div>\n      <div class="form-group"><label>Publisher</label><input name="publisher" value="${escapeHtml(e.publisher||"")}" /></div>\n    </div>\n    <div class="form-row">\n      <div class="form-group"><label>Year</label><input name="publication_year" type="number" value="${e.publication_year||""}" /></div>\n      <div class="form-group">\n        <label>Category</label>\n        <select name="category">\n          ${["General","Fiction","Non-Fiction","History","Science","Biography","Self-Help","Computer Science","Memoir","Science Fiction"].map(t=>`<option${e.category===t?" selected":""}>${t}</option>`).join("")}\n        </select>\n      </div>\n    </div>\n    <div class="form-row">\n      <div class="form-group">\n        <label>Collection Type</label>\n        <select name="collection_type">\n          <option value="lending"${"lending"===e.collection_type?" selected":""}>Lending</option>\n          <option value="reference"${"reference"===e.collection_type?" selected":""}>Reference</option>\n          <option value="special"${"special"===e.collection_type?" selected":""}>Special Collection</option>\n          <option value="periodicals"${"periodicals"===e.collection_type?" selected":""}>Periodicals</option>\n        </select>\n      </div>\n      <div class="form-group">\n        <label>Language</label>\n        <select name="language">\n          <option${"English"===e.language?" selected":""}>English</option>\n          <option${"Tamil"===e.language?" selected":""}>Tamil</option>\n          <option${"Sinhala"===e.language?" selected":""}>Sinhala</option>\n        </select>\n      </div>\n    </div>\n    <div class="form-row">\n      <div class="form-group"><label>Call Number</label><input name="call_number" value="${escapeHtml(e.call_number||"")}" /></div>\n      <div class="form-group"><label>Total Copies</label><input name="total_copies" type="number" value="${e.total_copies||1}" /></div>\n    </div>\n    <div class="form-row">\n      <div class="form-group">\n        <label>Branch</label>\n        <select name="branch">\n          <option${"Main"===e.branch?" selected":""}>Main</option>\n          <option${"Children's Branch"===e.branch?" selected":""}>Children's Branch</option>\n        </select>\n      </div>\n      <div class="form-group"><label>Cover Image URL</label><input name="cover_image" value="${escapeHtml(e.cover_image||"")}" /></div>\n    </div>\n    <div class="form-group"><label>Description</label><textarea name="description">${escapeHtml(e.description||"")}</textarea></div>\n    <div class="flex">\n      <button class="btn btn-primary" type="submit">${e.id?"Update":"Add"} Book</button>\n      <button class="btn btn-ghost" type="button" id="cancel-book">Cancel</button>\n    </div>\n    <div id="book-form-msg" class="mt-2"></div>\n  </form>`}async function loadBooks(e=""){try{const{books:t}=await api.get(`/api/books?q=${encodeURIComponent(e)}&limit=200`);allBooks=t,renderBooksTable(t)}catch(e){document.querySelector("#books-table tbody").innerHTML=`<tr><td colspan="7" class="text-center" style="color:var(--danger);">Failed to load books: ${escapeHtml(e.message)}</td></tr>`}}function renderBooksTable(e){document.querySelector("#books-table tbody").innerHTML=e.map(e=>`\n    <tr>\n      <td><strong>${escapeHtml(e.title)}</strong></td>\n      <td>${escapeHtml(e.author)}</td>\n      <td>${escapeHtml(e.isbn||"—")}</td>\n      <td>${escapeHtml(e.category||"—")}</td>\n      <td><span class="badge ${e.available_copies>0?"success":"danger"}">${e.available_copies}/${e.total_copies}</span></td>\n      <td>${escapeHtml(e.branch||"Main")}</td>\n      <td>\n        <button class="btn btn-sm btn-ghost" data-edit="${e.id}">Edit</button>\n        <button class="btn btn-sm btn-danger" data-del="${e.id}">Del</button>\n      </td>\n    </tr>`).join("")||'<tr><td colspan="7" class="text-center card-meta">No books found.</td></tr>',document.querySelectorAll("[data-edit]").forEach(e=>e.addEventListener("click",()=>{const t=allBooks.find(t=>t.id==e.dataset.edit);editingBookId=t.id,document.getElementById("book-form-container").innerHTML=bookForm(t),bindBookForm(),document.getElementById("book-form-container").scrollIntoView({behavior:"smooth"})})),document.querySelectorAll("[data-del]").forEach(e=>e.addEventListener("click",async()=>{confirm("Delete this book?")&&(await api.del(`/api/books/${e.dataset.del}`),loadBooks(document.getElementById("book-search").value))}))}function bindBookForm(){document.getElementById("cancel-book").addEventListener("click",()=>{document.getElementById("book-form-container").innerHTML="",editingBookId=null}),document.getElementById("book-form").addEventListener("submit",async e=>{e.preventDefault();const t=new FormData(e.target),a=Object.fromEntries(t);try{editingBookId?await api.put(`/api/books/${editingBookId}`,a):await api.post("/api/books",a),showAlert("#book-form-msg",editingBookId?"Book updated.":"Book added.","success"),editingBookId=null,setTimeout(()=>{document.getElementById("book-form-container").innerHTML="",loadBooks()},800)}catch(e){showAlert("#book-form-msg",e.message,"danger")}})}async function loadEvents(){let e;try{({events:e}=await api.get("/api/events"))}catch(e){return void(document.querySelector("#events-table tbody").innerHTML=`<tr><td colspan="5" class="text-center" style="color:var(--danger);">Failed to load events: ${escapeHtml(e.message)}</td></tr>`)}document.querySelector("#events-table tbody").innerHTML=e.map(e=>`\n    <tr>\n      <td>${escapeHtml(e.title)}</td>\n      <td>${formatDateTime(e.event_date)}</td>\n      <td>${escapeHtml(e.category)}</td>\n      <td>${e.capacity}</td>\n      <td><button class="btn btn-sm btn-danger" data-del-ev="${e.id}">Delete</button></td>\n    </tr>`).join("")||'<tr><td colspan="5" class="text-center card-meta">No events.</td></tr>',document.querySelectorAll("[data-del-ev]").forEach(e=>e.addEventListener("click",async()=>{confirm("Delete this event?")&&(await api.del(`/api/events/${e.dataset.delEv}`),loadEvents())}))}async function loadAnnouncements(){let e;try{({announcements:e}=await api.get("/api/announcements"))}catch(e){return void(document.querySelector("#ann-table tbody").innerHTML=`<tr><td colspan="5" class="text-center" style="color:var(--danger);">Failed to load announcements: ${escapeHtml(e.message)}</td></tr>`)}document.querySelector("#ann-table tbody").innerHTML=e.map(e=>`\n    <tr>\n      <td>${escapeHtml(e.title)}</td>\n      <td>${escapeHtml(e.category)}</td>\n      <td>\n        ${e.featured?'<span class="badge gold">Featured</span>':""}\n        ${e.emergency?'<span class="badge danger">Urgent</span>':""}\n      </td>\n      <td>${formatDate(e.publish_at)}</td>\n      <td><button class="btn btn-sm btn-danger" data-del-ann="${e.id}">Delete</button></td>\n    </tr>`).join("")||'<tr><td colspan="5" class="text-center card-meta">No announcements.</td></tr>',document.querySelectorAll("[data-del-ann]").forEach(e=>e.addEventListener("click",async()=>{confirm("Delete this announcement?")&&(await api.del(`/api/announcements/${e.dataset.delAnn}`),loadAnnouncements())}))}async function loadMessages(){let e;try{({messages:e}=await api.get("/api/contact"))}catch(e){return void(document.querySelector("#msg-table tbody").innerHTML=`<tr><td colspan="6" class="text-center" style="color:var(--danger);">Failed to load messages: ${escapeHtml(e.message)}</td></tr>`)}document.querySelector("#msg-table tbody").innerHTML=e.map(e=>`\n    <tr>\n      <td>${formatDate(e.created_at)}</td>\n      <td>${escapeHtml(e.name)}</td>\n      <td>${escapeHtml(e.email)}</td>\n      <td>${escapeHtml(e.department||"—")}</td>\n      <td>${escapeHtml(e.subject||"—")}</td>\n      <td title="${escapeHtml(e.message)}">${escapeHtml(e.message.slice(0,80))}…</td>\n    </tr>`).join("")||'<tr><td colspan="6" class="text-center card-meta">No messages.</td></tr>'}async function loadChatLogs(){try{const{sessions:e,total:t}=await api.get("/api/chat/sessions?limit=50"),a=document.getElementById("chat-total-badge");a&&(a.textContent=`${t} conversations`);const n=document.getElementById("chat-sessions-list");if(!e.length)return void(n.innerHTML='<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1.5rem 0;">No chat conversations yet.</p>');n.innerHTML=e.map(e=>`\n      <div class="chat-log-item" data-session="${escapeHtml(e.session_id)}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem 1rem;cursor:pointer;transition:all var(--transition);">\n        <div class="flex-between">\n          <span style="font-weight:600;font-size:0.88rem;color:var(--text);">${e.member_name?escapeHtml(e.member_name):"Anonymous Visitor"}</span>\n          <span class="badge">${e.message_count} msg${1!==e.message_count?"s":""}</span>\n        </div>\n        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.3rem;">\n          ${formatDate(e.last_message_at||e.created_at)}\n          ${e.visitor_ip?` · ${escapeHtml(e.visitor_ip)}`:""}\n        </div>\n      </div>\n    `).join(""),n.querySelectorAll(".chat-log-item").forEach(e=>{e.addEventListener("mouseenter",()=>e.style.borderColor="var(--primary-light)"),e.addEventListener("mouseleave",()=>e.style.borderColor="var(--border)"),e.addEventListener("click",()=>loadChatTranscript(e.dataset.session,e))})}catch(e){document.getElementById("chat-sessions-list").innerHTML='<p style="color:var(--danger);font-size:0.9rem;">Failed to load chat sessions.</p>'}}async function loadChatTranscript(e,t){document.querySelectorAll(".chat-log-item").forEach(e=>e.style.background="var(--bg-card)"),t&&(t.style.background="rgba(14,77,92,0.07)");const a=document.getElementById("chat-transcript");a.innerHTML='<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding-top:2rem;">Loading transcript…</p>';try{const{session:t,messages:n}=await api.get(`/api/chat/sessions/${encodeURIComponent(e)}`);a.innerHTML=`\n      <div style="margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border);">\n        <strong style="font-size:0.85rem;">Session: </strong><code style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(e.slice(0,20))}…</code>\n        ${t.member_name?`<span class="badge success" style="margin-left:0.5rem;">${escapeHtml(t.member_name)}</span>`:""}\n        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.25rem;">Started: ${formatDateTime(t.created_at)}</div>\n      </div>\n      ${n.map(e=>`\n        <div style="margin-bottom:0.75rem;display:flex;gap:0.5rem;align-items:flex-start;${"user"===e.role?"flex-direction:row-reverse;":""}">\n          <div style="width:26px;height:26px;border-radius:50%;background:${"user"===e.role?"var(--accent)":"var(--primary)"};color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700;">${"user"===e.role?"U":"AI"}</div>\n          <div style="max-width:85%;">\n            <div style="background:${"user"===e.role?"var(--primary)":"var(--bg-subtle)"};color:${"user"===e.role?"#fff":"var(--text)"};padding:0.55rem 0.85rem;border-radius:var(--radius-sm);font-size:0.83rem;line-height:1.55;border:1px solid ${"user"===e.role?"var(--primary)":"var(--border)"};">\n              ${escapeHtml(e.content).replace(/\n/g,"<br>")}\n            </div>\n            <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.2rem;${"user"===e.role?"text-align:right;":""}">${formatDateTime(e.created_at)}</div>\n          </div>\n        </div>\n      `).join("")||'<p style="color:var(--text-muted);font-size:0.88rem;">No messages found.</p>'}\n    `}catch(e){a.innerHTML='<p style="color:var(--danger);font-size:0.9rem;">Failed to load transcript.</p>'}}async function loadReports(){let e;try{e=await api.get("/api/stats")}catch(e){return void(document.getElementById("report-kpis").innerHTML=`<p class="card-meta" style="color:var(--danger);">Failed to load report data: ${escapeHtml(e.message)}</p>`)}document.getElementById("report-kpis").innerHTML=`\n    <div class="kpi"><div class="kpi-label">Total Books</div><div class="kpi-value">${e.total_books}</div></div>\n    <div class="kpi success"><div class="kpi-label">Total Members</div><div class="kpi-value">${e.total_members}</div></div>\n    <div class="kpi accent"><div class="kpi-label">Active Loans</div><div class="kpi-value">${e.active_loans}</div></div>\n    <div class="kpi danger"><div class="kpi-label">Overdue</div><div class="kpi-value">${e.overdue_loans}</div></div>\n    <div class="kpi"><div class="kpi-label">Available Copies</div><div class="kpi-value">${e.available_copies}</div></div>\n    <div class="kpi"><div class="kpi-label">Total Events</div><div class="kpi-value">${e.total_events}</div></div>\n  `,document.getElementById("report-popular").innerHTML=`\n    <table class="data-table">\n      <thead><tr><th>Title</th><th>Author</th><th>Total Loans</th></tr></thead>\n      <tbody>${e.popular_books.map(e=>`<tr><td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.author)}</td><td>${e.loan_count}</td></tr>`).join("")||'<tr><td colspan="3" class="text-center">No data</td></tr>'}</tbody>\n    </table>`}function exportData(e){const t=document.createElement("a");t.href=`/api/${e}/export`,t.download=`${e}.csv`,document.body.appendChild(t),t.click(),t.remove()}document.getElementById("add-book-btn").addEventListener("click",()=>{editingBookId=null,document.getElementById("book-form-container").innerHTML=bookForm(),bindBookForm(),document.getElementById("book-form-container").scrollIntoView({behavior:"smooth"})}),document.getElementById("book-search").addEventListener("input",e=>loadBooks(e.target.value)),document.getElementById("event-form").addEventListener("submit",async e=>{e.preventDefault();const t=new FormData(e.target),a=Object.fromEntries(t);try{await api.post("/api/events",a),showAlert("#event-msg","Event created successfully.","success"),e.target.reset(),loadEvents()}catch(e){showAlert("#event-msg",e.message,"danger")}}),document.getElementById("ann-form").addEventListener("submit",async e=>{e.preventDefault();const t=new FormData(e.target),a=Object.fromEntries(t);a.featured=!!t.get("featured"),a.emergency=!!t.get("emergency");try{await api.post("/api/announcements",a),showAlert("#ann-msg","Announcement published.","success"),e.target.reset(),loadAnnouncements()}catch(e){showAlert("#ann-msg",e.message,"danger")}}),document.getElementById("refresh-chats-btn")?.addEventListener("click",loadChatLogs);const loaders={dashboard:loadDashboard,books:()=>loadBooks(),events:loadEvents,announcements:loadAnnouncements,messages:loadMessages,"chat-logs":loadChatLogs,reports:loadReports,"dlp-sync":loadDlpSync};(async()=>{const e=await checkAdminAccess();if(!e)return;if(e.role==="admin"){document.querySelectorAll(".admin-only").forEach(el=>el.style.display="");}else{document.querySelectorAll(".admin-only").forEach(el=>el.style.display="none");}loadDashboard();})(),document.addEventListener("DOMContentLoaded",()=>{document.getElementById("btn-print")?.addEventListener("click",()=>window.print()),document.querySelectorAll("[data-export]").forEach(e=>{e.addEventListener("click",()=>exportData(e.dataset.export))})});

// ── DLP SYNC (admin only) ─────────────────────────────────────────────────────

let _dlpPollInterval = null;
let _dlpBooksOffset  = 0;
const _DLP_PAGE      = 30;

async function loadDlpSync() {
  // Add tab title
  document.getElementById('page-title').textContent = 'DLP Catalog Sync';
  await Promise.all([_loadDlpStats(), _loadDlpHistory()]);
  _loadDlpBooks(0);

  // Wire up trigger button (only once)
  const triggerBtn = document.getElementById('dlp-trigger-btn');
  if (triggerBtn && !triggerBtn._bound) {
    triggerBtn._bound = true;
    triggerBtn.addEventListener('click', _onDlpTrigger);
  }

  // Wire up search (only once)
  const searchInput = document.getElementById('dlp-book-search');
  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    let _debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(_debounce);
      _debounce = setTimeout(() => _loadDlpBooks(0), 400);
    });
  }
}

async function _loadDlpStats() {
  try {
    const d = await api.get('/api/dlp-sync/stats');
    document.getElementById('dlp-kpi-grid').innerHTML = `
      <div class="kpi accent"><div class="kpi-label">DLP Books in DB</div><div class="kpi-value">${Number(d.total_dlp_books).toLocaleString()}</div></div>
      <div class="kpi ${d.sync_running ? 'danger' : 'success'}"><div class="kpi-label">Sync Status</div><div class="kpi-value">${d.sync_running ? 'Running…' : 'Idle'}</div></div>
      <div class="kpi"><div class="kpi-label">Last Sync</div><div class="kpi-value" style="font-size:0.9rem;">${d.last_sync ? new Date(d.last_sync.started_at).toLocaleDateString() : 'Never'}</div></div>
      <div class="kpi ${d.last_sync?.status === 'success' ? 'success' : d.last_sync?.status === 'failed' ? 'danger' : ''}"><div class="kpi-label">Last Result</div><div class="kpi-value">${d.last_sync?.status || '—'}</div></div>
    `;
    const branchDiv = document.getElementById('dlp-branch-breakdown');
    if (d.by_branch && d.by_branch.length) {
      branchDiv.innerHTML = d.by_branch.map(b =>
        `<div class="flex" style="justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
          <span>${escapeHtml(b.branch || 'Unknown')}</span>
          <span class="badge">${Number(b.count).toLocaleString()}</span>
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

async function _loadDlpHistory() {
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
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.error_message ? escapeHtml(r.error_message) : ''}">${r.error_message ? escapeHtml(r.error_message) : '—'}</td>
      </tr>`).join('');
  } catch (e) {
    document.querySelector('#dlp-history-table tbody').innerHTML =
      `<tr><td colspan="9" style="color:var(--danger);">Failed: ${escapeHtml(e.message)}</td></tr>`;
  }
}

async function _loadDlpBooks(offset) {
  _dlpBooksOffset = offset;
  const q      = (document.getElementById('dlp-book-search')?.value || '').trim();
  const tbody  = document.querySelector('#dlp-books-table tbody');
  const paging = document.getElementById('dlp-books-pagination');
  if (!tbody) return;
  try {
    const params = new URLSearchParams({ limit: _DLP_PAGE, offset, q });
    const { books, total } = await api.get('/api/dlp-sync/books?' + params.toString());
    if (!books.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No books found.</td></tr>';
      if (paging) paging.textContent = '';
      return;
    }
    tbody.innerHTML = books.map(b => `
      <tr>
        <td>${escapeHtml(b.title)}</td>
        <td>${escapeHtml(b.author || '—')}</td>
        <td>${escapeHtml(b.branch || '—')}</td>
        <td>${b.available_copies > 0
          ? `<span class="badge success">${b.available_copies}</span>`
          : '<span class="badge danger">0</span>'}</td>
      </tr>`).join('');
    if (paging) {
      paging.innerHTML =
        `${(offset + 1).toLocaleString()}–${Math.min(offset + _DLP_PAGE, total).toLocaleString()} of ${Number(total).toLocaleString()} &nbsp;` +
        (offset > 0 ? `<button class="btn btn-sm btn-ghost" id="dlp-prev-btn">← Prev</button> ` : '') +
        (offset + _DLP_PAGE < total ? `<button class="btn btn-sm btn-ghost" id="dlp-next-btn">Next →</button>` : '');
      document.getElementById('dlp-prev-btn')?.addEventListener('click', () => _loadDlpBooks(offset - _DLP_PAGE));
      document.getElementById('dlp-next-btn')?.addEventListener('click', () => _loadDlpBooks(offset + _DLP_PAGE));
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger);">Error: ${escapeHtml(e.message)}</td></tr>`;
  }
}

function _startDlpProgressPolling() {
  const box   = document.getElementById('dlp-progress-box');
  const badge = document.getElementById('dlp-sync-badge');
  const btn   = document.getElementById('dlp-trigger-btn');
  if (!box) return;
  box.style.display = 'block';
  box.textContent = '';

  if (_dlpPollInterval) clearInterval(_dlpPollInterval);
  _dlpPollInterval = setInterval(async () => {
    try {
      const { running, messages } = await api.get('/api/dlp-sync/progress');
      box.innerHTML = messages.map(m => escapeHtml(m)).join('<br>');
      box.scrollTop = box.scrollHeight;
      if (!running) {
        clearInterval(_dlpPollInterval);
        _dlpPollInterval = null;
        if (badge) { badge.textContent = 'Done'; badge.className = 'badge success'; }
        if (btn)   { btn.disabled = false; btn.textContent = 'Run Sync Now'; }
        _loadDlpStats();
        _loadDlpHistory();
      }
    } catch { /* ignore poll errors */ }
  }, 2500);
}

async function _onDlpTrigger() {
  if (!confirm('This will pull ~80,000 items from the DLP Koha API. It may take several minutes. Continue?')) return;
  const btn   = document.getElementById('dlp-trigger-btn');
  const badge = document.getElementById('dlp-sync-badge');
  if (btn)   { btn.disabled = true; btn.textContent = 'Syncing…'; }
  if (badge) { badge.textContent = 'Running'; badge.className = 'badge accent'; }
  try {
    await api.post('/api/dlp-sync/trigger', {});
    _startDlpProgressPolling();
  } catch (e) {
    if (btn)   { btn.disabled = false; btn.textContent = 'Run Sync Now'; }
    if (badge) { badge.textContent = 'Error'; badge.className = 'badge danger'; }
    alert('Failed to start sync: ' + e.message);
  }
}