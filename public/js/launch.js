document.addEventListener('DOMContentLoaded', function() {

  /* Particle canvas */
  var c = document.getElementById('launch-particles');
  if (!c) return;
  var x = c.getContext('2d');
  var P = [];
  function sz(){ c.width = innerWidth; c.height = innerHeight; }
  sz();
  window.addEventListener('resize', sz);
  for (var i = 0; i < 60; i++) {
    P.push({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.8 + 0.1, gold: Math.random() > 0.55
    });
  }
  (function draw(){
    x.clearRect(0, 0, c.width, c.height);
    P.forEach(function(p){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = c.width;  if (p.x > c.width)  p.x = 0;
      if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      x.fillStyle = p.gold ? 'rgba(212,160,23,' + p.a + ')' : 'rgba(255,255,255,' + (p.a * 0.45) + ')';
      x.fill();
    });
    requestAnimationFrame(draw);
  })();

  /* Wire button click */
  var btn = document.getElementById('lo-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      btn.removeEventListener('click', arguments.callee);
      btn.disabled = true;

      var btnWrap = document.getElementById('lo-btn-wrap');
      var load    = document.getElementById('lo-loading');
      var status  = document.getElementById('lo-status');
      var sub     = document.getElementById('lo-sub');
      var bar     = document.getElementById('lo-bar');

      btnWrap.style.transition = 'opacity 0.25s';
      btnWrap.style.opacity = '0';
      setTimeout(function(){
        btnWrap.style.display = 'none';
        load.style.display = 'flex';
      }, 260);

      var steps = [
        { at: 300,  w: '20%',  s: 'Initialising systems…', d: 'Setting up library services'        },
        { at: 1150, w: '45%',  s: 'Loading catalog…',      d: 'Connecting to the collection'       },
        { at: 2000, w: '72%',  s: 'Preparing interface…',  d: 'Building the experience'            },
        { at: 2850, w: '95%',  s: 'Almost there…',         d: 'Final checks in progress'           },
        { at: 3700, w: '100%', s: 'Website Launched!',     d: 'Inaugurated by Hon. President of Sri Lanka' },
      ];

      steps.forEach(function(st){
        setTimeout(function(){
          bar.style.width = st.w;
          status.style.opacity = '0';
          setTimeout(function(){
            status.textContent = st.s;
            sub.textContent    = st.d;
            status.style.opacity = '1';
          }, 100);
        }, st.at);
      });

      setTimeout(function(){
        var o = document.getElementById('launch-overlay');
        if (!o) return;
        o.style.transition = 'opacity 0.85s ease';
        o.style.opacity = '0';
        setTimeout(function(){ o.style.display = 'none'; o.remove(); }, 870);
      }, 4150);
    });
  }

  /* Async font loading without inline event handlers */
  var fontLinks = document.querySelectorAll('link[data-async-font]');
  fontLinks.forEach(function(link) {
    link.media = 'all';
  });
});
