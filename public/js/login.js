// DEF-018: hide demo credentials block in production environments
fetch('/api/env').then(r => r.json()).then(({ production }) => {
  if (production) {
    const el = document.getElementById('demo-creds');
    if (el) el.remove();
  }
}).catch(() => {});

// Password visibility toggle
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const loginBtn = document.getElementById('login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  const fd = new FormData(e.target);
  try {
    const res = await api.post('/api/auth/login', { email: fd.get('email'), password: fd.get('password') });
    const name = res.user.full_name || res.user.name || 'Member';
    showAlert('#msg', `Welcome back, ${name}! Redirecting…`, 'success');
    setTimeout(() => {
      const next = new URLSearchParams(location.search).get('next');
      // ISSUE-24: require path to start with '/' and not '//' to block protocol-relative redirects
      if (next && next.startsWith('/') && !next.startsWith('//')) location.href = next;
      else if (['admin','librarian','event_coordinator'].includes(res.user.role)) location.href = '/admin';
      else location.href = '/dashboard';
    }, 900);
  } catch (err) {
    showAlert('#msg', err.message, 'danger');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});
