/* ------------------------------------------------------------------ *
 * Batticaloa Library – Shared Chat Widget
 * Features:
 *   - Minimize (resumes conversation) / Close (clears & restarts)
 *   - Session persisted in sessionStorage so minimize works across
 *     scroll/navigation within the same tab session
 *   - Improved book-context awareness via richer server prompts
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* ---- DOM refs ---- */
  const fab        = document.getElementById('chat-fab');
  const win        = document.getElementById('chat-window');
  const closeBtn   = document.getElementById('chat-close-btn');
  const minimizeBtn= document.getElementById('chat-minimize-btn');
  const input      = document.getElementById('chat-input');
  const sendBtn    = document.getElementById('chat-send-btn');
  const msgArea    = document.getElementById('chat-messages');
  const suggestions= document.getElementById('chat-suggestions');

  if (!fab || !win) return; // widget not on this page

  /* ---- Session state ---- */
  const SESSION_KEY  = 'bpl_chat_session_id';
  const HISTORY_KEY  = 'bpl_chat_history';
  const MINIMIZED_KEY= 'bpl_chat_minimized';

  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  function resetSession() {
    const newSid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, newSid);
    sessionStorage.removeItem(HISTORY_KEY);
    return newSid;
  }

  /* Persist rendered message history so restoring minimized state works */
  function saveHistory() {
    try {
      const msgs = [];
      msgArea.querySelectorAll('.chat-msg').forEach(el => {
        const role = el.classList.contains('bot') ? 'bot' : 'user';
        const bubble = el.querySelector('.chat-msg-bubble');
        const time   = el.querySelector('.chat-msg-time');
        if (bubble) msgs.push({ role, text: bubble.textContent, time: time?.textContent || '' });
      });
      // Also persist book lists as placeholders
      msgArea.querySelectorAll('.chat-book-list').forEach(() => {
        msgs.push({ role: 'books', text: '[Book recommendations were shown here]', time: '' });
      });
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(msgs));
    } catch (_) {}
  }

  function restoreHistory() {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      if (!raw) return false;
      const msgs = JSON.parse(raw);
      if (!Array.isArray(msgs) || !msgs.length) return false;
      msgs.forEach(m => {
        if (m.role === 'bot') addBotMsg(m.text);
        else if (m.role === 'user') addUserMsg(m.text);
        else addBotMsg(m.text); // book placeholder
      });
      scrollBottom();
      return true;
    } catch (_) {}
    return false;
  }

  /* ---- Helpers ---- */
  function scrollBottom() {
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? '')
      .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---- Cover placeholder (re-uses COVER_PALETTE if available) ---- */
  const PALETTE = (typeof COVER_PALETTE !== 'undefined') ? COVER_PALETTE : [
    ['#1a3a5c','#e8f0f7'],['#2d5a27','#eaf3e8'],['#5a1f33','#f5eaed'],
    ['#4a2e0d','#f5ede0'],['#2a1a6b','#ece8f5'],['#0d3a3a','#e0f0f0'],
  ];

  function coverHtml(title, author, branch) {
    let h = 0;
    for (let i = 0; i < (title || '').length; i++) h = (31 * h + title.charCodeAt(i)) & 0xffff;
    const [bg, fg] = PALETTE[h % PALETTE.length];
    return `<div class="book-cover-placeholder" style="background:${bg};color:${fg};">
      <span class="bcp-branch">${esc(branch || 'Library')}</span>
      <span class="bcp-title">${esc(title || '')}</span>
      <span class="bcp-author">${esc(author || '')}</span>
    </div>`;
  }

  /* ---- Render book cards ---- */
  function renderBooks(books) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-book-list';
    books.slice(0, 6).forEach(b => {
      const avail = (b.available_copies || 0) > 0;
      const card  = document.createElement('a');
      card.className = 'chat-book-card';
      card.href = '/catalog?q=' + encodeURIComponent(b.title);

      // Cover
      const coverDiv = document.createElement('div');
      coverDiv.className = 'chat-book-cover';
      if (b.cover_image && b.cover_image.startsWith('http')) {
        const img = document.createElement('img');
        img.src = b.cover_image; // URL — safe, esc() already validated this
        img.alt = '';
        img.loading = 'lazy';
        img.className = 'chat-book-cover-img';
        img.onerror = function() { this.style.display = 'none'; };
        coverDiv.appendChild(img);
      } else {
        coverDiv.innerHTML = coverHtml(b.title, b.author, b.branch); // coverHtml uses esc() internally
      }

      // Info
      const infoDiv = document.createElement('div');
      infoDiv.className = 'chat-book-info';

      const titleEl = document.createElement('div');
      titleEl.className = 'chat-book-title';
      titleEl.textContent = b.title;

      const authorEl = document.createElement('div');
      authorEl.className = 'chat-book-author';
      authorEl.textContent = b.author || '';

      const metaDiv = document.createElement('div');
      metaDiv.className = 'chat-book-meta';

      const availBadge = document.createElement('span');
      availBadge.className = 'badge ' + (avail ? 'success' : 'danger');
      availBadge.textContent = avail ? 'Available' : 'On Loan';
      metaDiv.appendChild(availBadge);

      if (b.category) {
        const catBadge = document.createElement('span');
        catBadge.className = 'badge';
        catBadge.textContent = b.category;
        metaDiv.appendChild(catBadge);
      }

      if (b.language && b.language !== 'English') {
        const langBadge = document.createElement('span');
        langBadge.className = 'badge';
        langBadge.textContent = b.language;
        metaDiv.appendChild(langBadge);
      }

      infoDiv.appendChild(titleEl);
      infoDiv.appendChild(authorEl);
      infoDiv.appendChild(metaDiv);
      card.appendChild(coverDiv);
      card.appendChild(infoDiv);
      wrap.appendChild(card);
    });
    msgArea.appendChild(wrap);
    scrollBottom();
    saveHistory();
  }

  /* ---- Add message bubbles ---- */
  function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    const body = document.createElement('div');

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    // Split on newlines and insert <br> safely
    text.split('\n').forEach((line, i, arr) => {
      bubble.appendChild(document.createTextNode(line));
      if (i < arr.length - 1) bubble.appendChild(document.createElement('br'));
    });

    const timeEl = document.createElement('span');
    timeEl.className = 'chat-msg-time';
    timeEl.textContent = timeStr();

    body.appendChild(bubble);
    body.appendChild(timeEl);
    div.appendChild(avatar);
    div.appendChild(body);
    msgArea.appendChild(div);
    scrollBottom();
    saveHistory();
  }

  function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.textContent = 'You';

    const body = document.createElement('div');

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.textContent = text;

    const timeEl = document.createElement('span');
    timeEl.className = 'chat-msg-time';
    timeEl.textContent = timeStr();

    body.appendChild(bubble);
    body.appendChild(timeEl);
    div.appendChild(avatar);
    div.appendChild(body);
    msgArea.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    removeTyping();
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'chat-typing';
    const typAvatar = document.createElement('div');
    typAvatar.className = 'chat-msg-avatar';
    typAvatar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    const typDots = document.createElement('div');
    typDots.className = 'chat-typing';
    [1,2,3].forEach(() => typDots.appendChild(document.createElement('span')));
    div.appendChild(typAvatar);
    div.appendChild(typDots);
    msgArea.appendChild(div);
    scrollBottom();
  }

  function removeTyping() {
    document.getElementById('chat-typing')?.remove();
  }

  /* ---- Welcome message ---- */
  function showWelcome() {
    addBotMsg(
      "Hello! I'm the Batticaloa Library Assistant. I can help you with:\n\n" +
      "• Book recommendations by genre, author, or mood\n" +
      "• Finding books similar to ones you've enjoyed\n" +
      "• Searching our catalog (local + 80,000+ Koha DLP titles)\n" +
      "• Library hours, membership & borrowing rules\n" +
      "• Events and digital services\n\n" +
      "What would you like today?"
    );
  }

  /* ---- Open / minimize / close ---- */
  function openChat() {
    win.classList.add('open');
    win.classList.remove('minimized');
    sessionStorage.removeItem(MINIMIZED_KEY);

    if (!msgArea.children.length) {
      if (!restoreHistory()) {
        showWelcome();
      }
    }
    setTimeout(() => input?.focus(), 250);
  }

  function minimizeChat() {
    win.classList.remove('open');
    win.classList.add('minimized');
    sessionStorage.setItem(MINIMIZED_KEY, '1');
    saveHistory();
  }

  function closeChat() {
    win.classList.remove('open', 'minimized');
    sessionStorage.removeItem(MINIMIZED_KEY);
    /* Clear history and generate new session — next open will restart */
    msgArea.innerHTML = '';
    resetSession();
  }

  /* ---- Send message ---- */
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    if (suggestions) suggestions.style.display = 'none';
    addUserMsg(text);
    showTyping();
    sendBtn.disabled = true;

    try {
      const res  = await fetch('/api/chat', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ message: text, session_id: getSessionId() }),
      });
      const data = await res.json();
      removeTyping();
      addBotMsg(data.reply || 'Sorry, I could not process your request. Please try again.');
      if (data.books && data.books.length) renderBooks(data.books);
    } catch (_) {
      removeTyping();
      addBotMsg('Sorry, I am currently unavailable. Please call us at 065-2222484 or 077-6718944, or visit the library.');
    }

    sendBtn.disabled = false;
    input.focus();
  }

  /* ---- Event bindings ---- */
  fab.addEventListener('click', openChat);
  closeBtn?.addEventListener('click', e => { e.stopPropagation(); closeChat(); });
  minimizeBtn?.addEventListener('click', e => { e.stopPropagation(); minimizeChat(); });
  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.querySelectorAll('.chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => { input.value = btn.textContent; sendMessage(); });
  });

  /* Clicking the minimized header bar restores the window */
  const chatHead = win.querySelector('.chat-head');
  chatHead?.addEventListener('click', () => {
    if (win.classList.contains('minimized')) openChat();
  });

  /* ---- Restore minimized state on page load ---- */
  if (sessionStorage.getItem(MINIMIZED_KEY)) {
    win.classList.add('minimized');
  }
})();
