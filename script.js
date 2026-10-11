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
  var split = document.getElementById('split');
  var aside = split.querySelector('.aside');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vh = 0, H = 0, y0 = 0, y1 = 0, s1 = 1, A = 1, B = 1, C = 1, D = 1;
  var lastW = 0, docked = false, trackH = 0, splitH = 0;

  // One spring for the whole page. x is the sprung scroll position: it chases the real scroll
  // position, and both the opening animation and the page layout are drawn at x.
  // Stiffness 140, damping ratio 0.85: settles in about half a second with a barely visible overshoot.
  var STIFFNESS = 140, DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.85;
  var x = 0, velocity = 0, rafId = 0, lastTime = 0;

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

    // Three beats, each 0.6 of a screen of scrolling:
    // A: the white floods the screen (the name inverts in place)
    // B: the name shrinks into the top-left
    // C: the black panel slides in, and the panel text and the right-hand column fade in together.
    //    C starts halfway through B, so content is already arriving as the name lands.
    A = vh * 0.6;
    B = vh * 0.6;
    C = vh * 0.6;
    D = A + B * 0.5 + C;
    trackH = vh + D;
    track.style.height = trackH + 'px';
    splitH = split.offsetHeight;
    x = window.scrollY;
    velocity = 0;
    apply();
  }

  // Where a sticky element sits in the viewport, given its container's top (in the viewport) and height.
  function stickyTop(top, height) { return Math.min(Math.max(0, top), top + height - vh); }

  function shift(el, px) {
    el.style.transform = Math.abs(px) < 0.05 ? '' : 'translate3d(0,' + px.toFixed(2) + 'px,0)';
  }

  // Draw the page as if it were scrolled to x instead of the real scroll position.
  function apply() {
    var raw = window.scrollY;
    var T = track.offsetTop;
    // The pinned opening screen: put it where it would be pinned at x.
    shift(track, stickyTop(T - x, trackH) - stickyTop(T - raw, trackH));
    // The rest of the page simply trails by the spring's lag.
    var lag = raw - x;
    shift(split, lag);
    // The sticky side panel inside it: undo the lag while it is pinned, so it stays put.
    if (wideQuery.matches) {
      var st = split.offsetTop;
      shift(aside, stickyTop(st - x, splitH) - stickyTop(st - raw, splitH) - lag);
    } else {
      shift(aside, 0);
    }
    render(Math.min(D, Math.max(0, x - T)));
  }

  function step(now) {
    var dt = Math.min(0.034, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    var target = window.scrollY;
    if (reduce) {
      x = target; velocity = 0;
    } else {
      var accel = STIFFNESS * (target - x) - DAMPING * velocity;
      velocity += accel * dt;
      x += velocity * dt;
    }
    var settled = Math.abs(target - x) < 0.25 && Math.abs(velocity) < 4;
    if (settled) { x = target; velocity = 0; }
    apply();
    rafId = settled ? 0 : requestAnimationFrame(step);
  }

  function kick() {
    if (rafId) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function setDocked(on) {
    if (on === docked) return;
    docked = on;
    root.classList.toggle('docked', on);
  }

  function render(s) {
    var pf = clamp01(s / A);
    var pn = clamp01((s - A) / B);
    var pc = clamp01((s - A - B * 0.5) / C);
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

  window.addEventListener('scroll', kick, { passive: true });
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
