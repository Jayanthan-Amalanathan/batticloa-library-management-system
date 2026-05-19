/* Tab switcher for building photos */
(function () {
  var tabs = [
    { btn: document.getElementById('tab-front'), panel: document.getElementById('panel-front') },
    { btn: document.getElementById('tab-rear'),  panel: document.getElementById('panel-rear')  }
  ];
  if (!tabs[0].btn) return;
  tabs.forEach(function (t) {
    t.btn.addEventListener('click', function () {
      tabs.forEach(function (x) {
        x.btn.classList.remove('active');
        x.btn.setAttribute('aria-selected', 'false');
        x.panel.classList.remove('active');
      });
      t.btn.classList.add('active');
      t.btn.setAttribute('aria-selected', 'true');
      t.panel.classList.add('active');
    });
  });
}());

/* Our Story modal */
document.addEventListener('DOMContentLoaded', function () {
  var modal = document.getElementById('story-modal');
  var openBtn = document.getElementById('story-read-more-btn');
  var closeBtn = document.getElementById('story-modal-close');

  function openModal() { modal.style.display = 'flex'; }
  function closeModal() { modal.style.display = 'none'; }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') closeModal();
  });
});

/* Branch map switcher */
document.addEventListener('DOMContentLoaded', function () {
  var list = document.getElementById('branch-list');
  var panel = document.getElementById('branch-map-panel');
  var label = document.getElementById('branch-map-label');
  var dirLink = document.getElementById('branch-map-dir');
  if (!list || !panel) return;

  function loadMap(lat, lng) {
    var old = document.getElementById('branch-map-iframe');
    var iframe = document.createElement('iframe');
    iframe.id = 'branch-map-iframe';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.cssText = 'border:0;display:block;';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.title = 'Branch library location map';
    iframe.src = 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d' + parseFloat(lng) + '!3d' + parseFloat(lat) + '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2slk!4v1';
    panel.replaceChild(iframe, old);
  }

  list.addEventListener('click', function (e) {
    var item = e.target.closest('.branch-list-item');
    if (!item) return;
    list.querySelectorAll('.branch-list-item').forEach(function (i) { i.classList.remove('active'); });
    item.classList.add('active');
    loadMap(item.dataset.lat, item.dataset.lng);
    label.textContent = '📍 ' + item.dataset.area;
    dirLink.href = item.dataset.dir;
  });
});
