async function load() {
  const u = await auth.load();
  if (!u) return (location.href = '/login?next=/dashboard');
  if (['admin','librarian','event_coordinator'].includes(u.role)) return (location.href = '/admin');

  const firstName = (u.full_name || u.name || 'Member').split(' ')[0];
  document.getElementById('welcome').textContent = `Welcome back, ${firstName}!`;
  document.title = `${firstName}'s Dashboard — Batticaloa Public Library`;

  const statusColors = { active: 'success', pending: 'warn', inactive: 'danger' };
  const status = (u.membership_status || 'unknown').toLowerCase();
  document.getElementById('k-status').innerHTML = `<span class="badge ${statusColors[status] || ''}" style="font-size:0.9rem;">${status.toUpperCase()}</span>`;
  document.getElementById('k-id').textContent = u.membership_id || '—';

  // Profile grid
  const fields = [
    { label: 'Full Name',         value: u.full_name },
    { label: 'Email',             value: u.email },
    { label: 'Phone',             value: u.phone || '—' },
    { label: 'Category',          value: u.member_category || '—' },
    { label: 'Membership Expires',value: u.membership_expiry ? formatDate(u.membership_expiry) : '—' },
  ];
  document.getElementById('profile').innerHTML = fields.map(f => `
    <div style="padding:0.75rem;background:var(--bg-subtle);border-radius:var(--radius-sm);">
      <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.2rem;">${f.label}</div>
      <div style="font-size:0.95rem;color:var(--text);">${escapeHtml(f.value)}</div>
    </div>
  `).join('');

  // Load loans and reservations
  try {
    const [loansR, resR] = await Promise.all([
      fetch('/api/loans', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/reservations', { credentials: 'include' }).then(r => r.json()),
    ]);

    const active = (loansR.loans || []).filter(l => l.status === 'active');
    document.getElementById('k-loans').textContent = active.length;

    document.querySelector('#loans-table tbody').innerHTML = active.length
      ? active.map(l => {
          const overdue = new Date(l.due_date) < new Date();
          return `
            <tr>
              <td>
                <strong>${escapeHtml(l.title)}</strong><br/>
                <small class="card-meta">${escapeHtml(l.author)}</small>
              </td>
              <td>${formatDate(l.borrowed_at)}</td>
              <td style="color:${overdue ? 'var(--danger)' : 'inherit'}">${formatDate(l.due_date)}</td>
              <td><span class="badge ${overdue ? 'danger' : 'success'}">${overdue ? 'Overdue' : 'On time'}</span></td>
            </tr>`;
        }).join('')
      : '<tr><td colspan="4" class="text-center card-meta" style="padding:2rem;">No active loans. <a href="/catalog">Browse the catalog →</a></td></tr>';

    const reservations = resR.reservations || [];
    document.getElementById('k-res').textContent = reservations.length;

    document.querySelector('#res-table tbody').innerHTML = reservations.length
      ? reservations.map(r => `
          <tr>
            <td>
              <strong>${escapeHtml(r.title)}</strong><br/>
              <small class="card-meta">${escapeHtml(r.author)}</small>
            </td>
            <td>${formatDate(r.reserved_at)}</td>
            <td><span class="badge ${r.status === 'pending' ? 'warn' : 'success'}">${escapeHtml(r.status)}</span></td>
          </tr>`).join('')
      : '<tr><td colspan="3" class="text-center card-meta" style="padding:2rem;">No reservations. <a href="/catalog">Find a book →</a></td></tr>';

  } catch (e) {
    document.getElementById('k-loans').textContent = '—';
    document.getElementById('k-res').textContent = '—';
  }
}
load();
