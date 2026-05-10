// Password visibility toggles
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

// Password strength visual feedback — threshold matches server minimum of 8
document.getElementById('password').addEventListener('input', e => {
  const pw = e.target.value;
  e.target.style.borderColor = pw.length === 0 ? '' : pw.length < 8 ? 'var(--warning)' : 'var(--success)';
});

document.getElementById('reg-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd   = new FormData(e.target);
  const data = Object.fromEntries(fd);
  const btn  = document.getElementById('reg-btn');

  if (data.password !== data.password2) {
    showAlert('#msg', 'Passwords do not match. Please re-enter.', 'danger');
    document.getElementById('password2').focus();
    return;
  }
  if (data.password.length < 8) {
    showAlert('#msg', 'Password must be at least 8 characters.', 'danger');
    return;
  }

  delete data.password2;
  btn.disabled = true;
  btn.textContent = 'Submitting application…';

  try {
    const res = await api.post('/api/auth/register', data);
    showAlert('#msg', `${res.message} Your membership ID is <strong>${res.membership_id}</strong>. Please contact the library or check back to confirm approval.`, 'success');
    e.target.reset();
    e.target.style.display = 'none';
  } catch (err) {
    showAlert('#msg', err.message, 'danger');
    btn.disabled = false;
    btn.textContent = 'Submit Application';
  }
});
