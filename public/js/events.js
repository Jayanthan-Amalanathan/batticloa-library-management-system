let allEvents = [];
let currentFilter = 'all';

async function loadEvents() {
  const countEl = document.getElementById('event-count');
  countEl.textContent = i18n.t('common.loading');
  try {
    const { events } = await fetch('/api/events').then(r => r.json());
    allEvents = events || [];
    render();
  } catch (e) {
    document.getElementById('events-list').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠</div>
        <h3>Could not load events</h3>
        <p>Please try refreshing the page.</p>
      </div>`;
    countEl.textContent = '';
  }
}

function render() {
  const now = new Date();
  let list = allEvents;
  if (currentFilter === 'upcoming') {
    list = list.filter(e => new Date(e.event_date) >= now);
  } else if (currentFilter !== 'all') {
    list = list.filter(e => (e.category || '').toLowerCase() === currentFilter);
  }

  const countEl = document.getElementById('event-count');
  countEl.textContent = list.length ? `${list.length} event${list.length !== 1 ? 's' : ''} found` : '';

  const cont = document.getElementById('events-list');
  if (!list.length) {
    cont.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">📅</div>
        <h3>No events match this filter</h3>
        <p>Try selecting a different category or <button class="btn btn-sm btn-ghost" onclick="resetFilter()" style="display:inline-flex;">view all events</button></p>
      </div>`;
    return;
  }

  cont.innerHTML = list.map(ev => {
    const isPast = new Date(ev.event_date) < now;
    return `
      <article class="card" id="event-${ev.id}" role="listitem">
        <div class="card-img" style="aspect-ratio:16/9;position:relative;">
          <img src="${escapeHtml(ev.image || '/images/event-default.svg')}" alt="${escapeHtml(ev.title)}" loading="lazy" />
          ${isPast ? '<div style="position:absolute;inset:0;background:rgba(6,47,58,0.45);display:flex;align-items:center;justify-content:center;"><span class="badge" style="font-size:0.8rem;background:rgba(0,0,0,0.6);color:#fff;">Past Event</span></div>' : ''}
        </div>
        <div class="card-body">
          <div class="flex flex-wrap gap-sm" style="margin-bottom:0.5rem;">
            <span class="badge gold">${escapeHtml(ev.category)}</span>
            ${isPast ? '' : '<span class="badge success">Upcoming</span>'}
          </div>
          <p class="card-meta">${formatDateTime(ev.event_date)}</p>
          <h3 class="card-title">${escapeHtml(ev.title)}</h3>
          <p class="card-desc">${escapeHtml(ev.description || '')}</p>
          <div class="card-foot">
            <small class="card-meta">📍 ${escapeHtml(ev.location || 'Main Branch')}</small>
            <small class="card-meta">👥 Capacity: ${ev.capacity}</small>
          </div>
          <div class="card-foot" style="margin-top:0.75rem;">
            ${isPast
              ? '<span class="badge" style="color:var(--text-muted);">Registration closed</span>'
              : `<button class="btn btn-sm btn-accent w-full" data-register="${ev.id}" data-title="${escapeHtml(ev.title)}">Register for this event →</button>`
            }
          </div>
        </div>
      </article>
    `;
  }).join('');

  cont.querySelectorAll('[data-register]').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.register, btn.dataset.title))
  );
}

function resetFilter() {
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="all"]')?.classList.add('active');
  currentFilter = 'all';
  render();
}

document.querySelectorAll('[data-filter]').forEach(b =>
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    currentFilter = b.dataset.filter;
    render();
  })
);

// Modal
function openModal(id, title) {
  document.getElementById('reg-event-id').value = id;
  document.getElementById('modal-title').textContent = 'Register: ' + title;
  document.getElementById('modal-msg').innerHTML = '';
  document.getElementById('reg-form').reset();
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  document.getElementById('reg-name').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('reg-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd     = new FormData(e.target);
  const id     = document.getElementById('reg-event-id').value;
  const submit = document.getElementById('reg-submit');

  submit.disabled = true;
  submit.textContent = 'Submitting…';

  try {
    await api.post(`/api/events/${id}/register`, {
      name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone')
    });
    showAlert('#modal-msg', 'Registration successful! A confirmation has been sent to your email.', 'success');
    document.getElementById('reg-form').classList.add('hidden');
    setTimeout(() => { closeModal(); document.getElementById('reg-form').classList.remove('hidden'); }, 2500);
  } catch (err) {
    showAlert('#modal-msg', err.message, 'danger');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Confirm Registration';
  }
});

loadEvents();
