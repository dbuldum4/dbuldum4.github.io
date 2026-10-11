(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var track = document.getElementById('track');
  var flood = document.getElementById('flood');
  var panel = document.getElementById('panel');
  var panelContent = document.getElementById('panelContent');
  var name = document.getElementById('name');
  var cue = document.getElementById('cue');
  var wideQuery = window.matchMedia('(min-width: 860px)');
  var work = document.getElementById('work');
  var vh = 0, H = 0, y0 = 0, y1 = 0, s1 = 1, A = 1, B = 1, C = 1, D = 1;
  var lastW = 0, docked = false, queued = false;

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function measure() {
    var vw = window.innerWidth;
    lastW = vw;
    vh = window.innerHeight;
    root.style.setProperty('--vh', vh + 'px');

    // The side panel's width; on narrow screens it spans the whole width.
    var asideW = wideQuery.matches ? Math.round(Math.min(520, Math.max(380, vw * 0.34))) : vw;
    root.style.setProperty('--aside-w', asideW + 'px');

    var f = parseFloat(getComputedStyle(name).fontSize) || 120;
    var gutter = name.offsetLeft;
    H = name.offsetHeight;
    // Shrink the name until it fits inside the panel.
    s1 = Math.min(0.8, (asideW - gutter * 2) / name.offsetWidth);
    y0 = vh * 0.45 - H / 2;
    y1 = Math.max(24, Math.round(vh * 0.05));
    root.style.setProperty('--y1', y1 + 'px');
    root.style.setProperty('--nf', (f * s1).toFixed(2) + 'px');

    // Three equal beats, one after another, each 0.6 of a screen of scrolling:
    // A: the white floods the screen (the name inverts in place)
    // B: the name shrinks into the top-left
    // C: the black panel slides in, and the panel text and the right-hand column fade in together
    A = vh * 0.6;
    B = vh * 0.6;
    C = vh * 0.6;
    D = A + B + C;
    track.style.height = (vh + D) + 'px';
    render(progress());
  }

  // Scroll distance into the hero, capped at its end.
  function progress() {
    return Math.min(D, Math.max(0, window.scrollY - track.offsetTop));
  }

  function setDocked(on) {
    if (on === docked) return;
    docked = on;
    root.classList.toggle('docked', on);
  }

  function render(s) {
    var pf = clamp01(s / A);
    var pn = clamp01((s - A) / B);
    var pc = clamp01((s - A - B) / C);
    var en = ease(pn);
    flood.style.transform = 'translate3d(0,0,0) scaleY(' + (0.1 + 0.9 * ease(pf)).toFixed(5) + ')';
    name.style.transform = 'translate3d(0,' + (y0 + (y1 - y0) * en).toFixed(2) + 'px,0) scale(' + (1 + (s1 - 1) * en).toFixed(5) + ')';
    var ep = ease(pc);
    panel.style.transform = 'translate3d(0,0,0) scaleX(' + ep.toFixed(5) + ')';
    // The panel's text is revealed by the panel's edge and fades up while it slides,
    // so it is fully in place by the time the panel stops.
    var po = clamp01((pc - 0.3) / 0.6);
    panelContent.style.clipPath = 'inset(0 ' + ((1 - ep) * 100).toFixed(3) + '% 0 0)';
    panelContent.style.opacity = po.toFixed(3);
    panelContent.style.transform = 'translate3d(0,' + ((1 - po) * 16).toFixed(2) + 'px,0)';
    // The right-hand column scrolls up underneath during the hero but stays hidden until the
    // panel is moving, then fades in on the same beat as the panel text.
    work.style.opacity = po.toFixed(3);
    cue.style.opacity = Math.max(0, 1 - pf * 3).toFixed(3);
    setDocked(s >= D - 0.5);
  }

  // Everything is tied directly to the scroll position (one update per frame), so the hero and
  // the page beneath it always move together.
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; render(progress()); });
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
    }, { rootMargin: '0px 0px -2% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('on'); });
  }
})();
