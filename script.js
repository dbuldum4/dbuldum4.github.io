(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var track = document.getElementById('track');
  var flood = document.getElementById('flood');
  var name = document.getElementById('name');
  var cue = document.getElementById('cue');
  var record = document.getElementById('record');
  var vh = 0, H = 0, y0 = 0, y1 = 0, s1 = 1, D = 1, A = 1, B = 1;
  var cur = 0, target = 0, running = false, lastW = 0;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function measure() {
    lastW = window.innerWidth;
    vh = window.innerHeight;
    root.style.setProperty('--vh', vh + 'px');
    var f = parseFloat(getComputedStyle(name).fontSize) || 120;
    H = name.offsetHeight;
    s1 = Math.min(1, Math.max(0.55, 72 / f));
    y0 = vh * 0.45 - H / 2;
    y1 = Math.max(20, vh * 0.05);
    // Three steps, in scroll order:
    // A: the white floods the screen (the name inverts in place)
    // B: the name shrinks and rises to the top
    // C: the content scrolls up beneath it
    var h0 = y1 + H * s1 + Math.max(40, vh * 0.07);
    A = vh * 1.1;
    B = vh * 1.0;
    D = A + B + (vh - h0);
    track.style.height = (vh + D) + 'px';
    record.style.marginTop = (-(vh - h0)) + 'px';
    readTarget();
    cur = target;
    render(cur);
  }

  function readTarget() {
    target = Math.min(D, Math.max(0, window.scrollY - track.offsetTop));
  }

  function render(s) {
    var pf = Math.min(1, s / A);
    var pn = Math.min(1, Math.max(0, (s - A) / B));
    var ef = ease(pf), en = ease(pn);
    flood.style.transform = 'translate3d(0,0,0) scaleY(' + (0.1 + 0.9 * ef).toFixed(5) + ')';
    name.style.transform = 'translate3d(0,' + (y0 + (y1 - y0) * en).toFixed(2) + 'px,0) scale(' + (1 + (s1 - 1) * en).toFixed(5) + ')';
    cue.style.opacity = Math.max(0, 1 - pf * 3).toFixed(3);
  }

  // Ease the animation toward the scroll position each frame, so uneven scroll events read as one smooth motion.
  function tick() {
    var d = target - cur;
    if (reduce || Math.abs(d) < 0.5) { cur = target; running = false; render(cur); return; }
    cur += d * 0.09;
    render(cur);
    requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', function () {
    readTarget();
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });
  // Only re-measure when the width changes; mobile toolbars change the height mid-scroll and caused jumps.
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastW) measure();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('on'); });
  }
})();
