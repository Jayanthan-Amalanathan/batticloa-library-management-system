document.getElementById('contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('contact-btn');
  btn.disabled = true;
  btn.textContent = i18n.t('common.loading');

  const fd   = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    const res = await api.post('/api/contact', data);
    showAlert('#form-msg', res.message || 'Message sent — thank you! We will respond within 24 hours.', 'success');
    e.target.reset();
  } catch (err) {
    showAlert('#form-msg', err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = i18n.t('contact.form.submit');
  }
});
