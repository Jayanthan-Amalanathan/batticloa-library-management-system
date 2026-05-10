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

// Hero search — opens Koha OPAC
document.getElementById('opac-search').addEventListener('submit', e => {
  e.preventDefault();
  const q   = document.getElementById('search-q').value.trim();
  const idx = document.getElementById('search-idx').value;
  if (!q) { document.getElementById('search-q').focus(); return; }
  window.open(buildKohaUrl(q, idx), '_blank', 'noopener');
});

async function loadHome() {
  // Stats with animated counter
  try {
    const [booksRes, eventsRes] = await Promise.all([
      fetch('/api/books?limit=1').then(r => r.json()),
      fetch('/api/events').then(r => r.json())
    ]);
    animateCount('s-books', booksRes.total || 0);
    animateCount('s-events', eventsRes.events.length);
  } catch (e) {}

  // Announcements
  try {
    const { announcements } = await fetch('/api/announcements').then(r => r.json());
    const cont = document.getElementById('announcements');
    if (!announcements?.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3>No announcements</h3><p>Check back soon for updates.</p></div>';
      return;
    }
    const annIcons = {
      general: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      event: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      service: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      holiday: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    };
    cont.innerHTML = announcements.slice(0, 3).map(a => `
      <article class="announcement-card${a.emergency ? ' emergency' : a.featured ? ' featured' : ''}">
        <div class="flex" style="gap:0.75rem;align-items:flex-start;">
          <div class="ann-category-icon" style="${a.emergency ? 'background:linear-gradient(135deg,var(--danger),#e05247);' : a.featured ? 'background:linear-gradient(135deg,var(--accent),var(--accent-light));' : ''}">
            ${annIcons[a.category] || annIcons.general}
          </div>
          <div style="flex:1;">
            <div class="flex flex-wrap gap-sm" style="margin-bottom:0.4rem;">
              ${a.emergency ? '<span class="badge danger">Important</span>' : ''}
              ${a.featured  ? '<span class="badge gold">Featured</span>' : ''}
              <span class="badge">${escapeHtml(a.category)}</span>
            </div>
            <h3 class="card-title">${escapeHtml(a.title)}</h3>
          </div>
        </div>
        <p class="card-desc" style="margin:0.4rem 0 0.5rem;">${escapeHtml((a.body || '').slice(0, 150))}${(a.body||'').length > 150 ? '…' : ''}</p>
        <p class="card-meta">${formatDate(a.publish_at)}</p>
      </article>
    `).join('');
  } catch (e) {}

  // New arrivals
  try {
    const { books } = await fetch('/api/books/new-arrivals').then(r => r.json());
    document.getElementById('new-arrivals').innerHTML = (books || []).map(b => `
      <a class="card" href="/catalog?q=${encodeURIComponent(b.title)}">
        <div class="card-img">${bookCoverHtml(b.title, b.author, b.branch)}</div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(b.title)}</h3>
          <p class="card-meta">${escapeHtml(b.author)}</p>
          <div class="card-foot">
            <span class="badge ${b.available_copies > 0 ? 'success' : 'danger'}">${b.available_copies > 0 ? i18n.t('common.available') : i18n.t('common.onloan')}</span>
            <span class="badge">${escapeHtml(b.category || '')}</span>
          </div>
        </div>
      </a>
    `).join('');
  } catch (e) {}

  // Events
  try {
    const { events } = await fetch('/api/events?upcoming=true').then(r => r.json());
    const cont = document.getElementById('upcoming-events');
    if (!events?.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><h3>' + i18n.t('common.noevents') + '</h3><p>' + i18n.t('common.checkback') + '</p></div>';
      return;
    }
    cont.innerHTML = events.slice(0, 3).map(ev => `
      <article class="card">
        <div class="card-img" style="aspect-ratio:16/9;"><img src="${escapeHtml(ev.image || '/images/event-default.svg')}" alt="${escapeHtml(ev.title)}" loading="lazy" /></div>
        <div class="card-body">
          <p class="card-meta">${formatDateTime(ev.event_date)} · ${escapeHtml(ev.location || '')}</p>
          <h3 class="card-title">${escapeHtml(ev.title)}</h3>
          <p class="card-desc">${escapeHtml((ev.description || '').slice(0, 120))}…</p>
          <div class="card-foot">
            <span class="badge gold">${escapeHtml(ev.category)}</span>
            <a href="/events#event-${ev.id}" class="btn btn-sm btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
              Register
            </a>
          </div>
        </div>
      </article>
    `).join('');
  } catch (e) {}
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;
  const tick = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current < target) requestAnimationFrame(tick);
  };
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { tick(); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(el);
}

loadHome();

// ===== AI Chat Widget =====
(function() {
  const fab = document.getElementById('chat-fab');
  const win = document.getElementById('chat-window');
  const closeBtn = document.getElementById('chat-close-btn');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const msgs = document.getElementById('chat-messages');
  const suggestions = document.getElementById('chat-suggestions');
  let sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);

  function toggleChat() {
    win.classList.toggle('open');
    if (win.classList.contains('open')) {
      if (!msgs.children.length) addBotMsg("Hello! I'm the Batticaloa Library Assistant. I can help you with:\n\n• Library hours & location\n• Membership & borrowing\n• Our book catalog & Koha system\n• Programs & events\n• Digital resources\n\nHow can I help you today?");
      setTimeout(() => input.focus(), 250);
    }
  }

  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', () => win.classList.remove('open'));

  document.querySelectorAll('.chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      sendMessage();
    });
  });

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = `
      <div class="chat-msg-avatar">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div>
        <div class="chat-msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
        <span class="chat-msg-time">${timeStr()}</span>
      </div>
    `;
    msgs.appendChild(div);
    scrollBottom();
  }

  function addUserMsg(text) {
    const initials = 'You';
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `
      <div class="chat-msg-avatar">${escapeHtml(initials.slice(0,2))}</div>
      <div>
        <div class="chat-msg-bubble">${escapeHtml(text)}</div>
        <span class="chat-msg-time">${timeStr()}</span>
      </div>
    `;
    msgs.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="chat-msg-avatar">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="chat-typing"><span></span><span></span><span></span></div>
    `;
    msgs.appendChild(div);
    scrollBottom();
  }

  function hideTyping() {
    const t = document.getElementById('typing-indicator');
    if (t) t.remove();
  }

  async function sendMessage() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    suggestions.style.display = 'none';
    addUserMsg(q);
    showTyping();
    sendBtn.disabled = true;
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, session_id: sessionId })
      });
      const data = await r.json();
      hideTyping();
      addBotMsg(data.reply || 'Sorry, I could not process your request. Please try again.');
    } catch (e) {
      hideTyping();
      addBotMsg('Sorry, I am currently unavailable. Please call us at +94 65 222 3456 or visit the library.');
    }
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
})();
