// Homepage interaction. Everything here is enhancement: with it off, the page is complete.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  if (reduce) { root.classList.add('no-motion'); return; }
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mouse = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, t: 0 };
  addEventListener('pointermove', function (e) {
    mouse.vx = e.clientX - mouse.x; mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now();
  }, { passive: true });

  // ---- hero: the cursor ploughs a highlight through the field; rows drift at different depths
  var wrap = document.querySelector('.hf-wrap'), hi = document.querySelector('.hf.hi');
  var rows = [].slice.call(document.querySelectorAll('#hfg .rowg'));
  var depth = [-34, 22, -14], rowX = [0, 0, 0];
  var trail = [], heroOn = true, glow = 0;
  var startDelay = (root.classList.contains('intro-on') ? 1.9 : 0) + 3.2;
  var born = performance.now();
  if (wrap && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(wrap);
  function hero(now) {
    if (!wrap || !heroOn) return;
    var r = wrap.getBoundingClientRect(), w = r.width, h = r.height;
    var idle = !fine || now - mouse.t > 2600;
    var tt = now / 1000;
    var tx = idle ? w * (0.5 + 0.38 * Math.sin(tt * 0.31)) : mouse.x - r.left;
    var ty = idle ? h * (0.5 + 0.32 * Math.sin(tt * 0.53 + 1)) : mouse.y - r.top;
    var head = trail[0] || { x: tx, y: ty };
    var p = { x: lerp(head.x, tx, 0.16), y: lerp(head.y, ty, 0.16) };
    trail.unshift(p); if (trail.length > 7) trail.pop();
    glow = (now - born) / 1000 > startDelay ? Math.min(1, glow + 0.02) : 0;
    var R = clamp(w * 0.11, 90, 190) * glow;
    var m = trail.map(function (q, k) {
      return 'radial-gradient(circle ' + (R * (1 - k * 0.11)).toFixed(1) + 'px at ' + q.x.toFixed(1) + 'px ' + q.y.toFixed(1) + 'px, #000 0%, rgba(0,0,0,' + (0.85 - k * 0.11).toFixed(2) + ') 38%, transparent 74%)';
    }).join(',');
    hi.style.webkitMaskImage = m; hi.style.maskImage = m;
    var nx = (p.x / w) - 0.5;
    rows.forEach(function (g, i) { rowX[i] = lerp(rowX[i], nx * depth[i] * glow, 0.08); g.style.transform = 'translateX(' + rowX[i].toFixed(2) + 'px)'; });
  }

  // ---- marquee: speed and direction follow your scrolling
  var mq = document.querySelector('.mq-track'), mqSet = mq && mq.querySelector('.mq-set');
  var mqX = 0, dir = -1, lastY = scrollY, boost = 0;
  addEventListener('scroll', function () {
    var dy = scrollY - lastY; lastY = scrollY;
    if (dy) dir = dy > 0 ? -1 : 1;
    boost = clamp(boost + Math.abs(dy) * 0.06, 0, 14);
  }, { passive: true });
  function marquee() {
    if (!mq) return;
    var sw = mqSet.offsetWidth; boost *= 0.92;
    mqX += dir * (0.6 + boost);
    if (mqX <= -sw) mqX += sw; if (mqX > 0) mqX -= sw;
    mq.style.transform = 'translate3d(' + mqX.toFixed(1) + 'px,0,0)';
  }

  // ---- cursor ring with labels
  var cur = document.querySelector('.cursor'), ring = cur && cur.querySelector('.cur-ring'), lab = cur && cur.querySelector('.cur-lab');
  var cx = mouse.x, cy = mouse.y;
  if (cur && fine) {
    root.classList.add('has-cursor');
    document.addEventListener('pointerover', function (e) {
      var big = e.target.closest('[data-cursor]'), link = e.target.closest('a, button, input, label, summary');
      cur.classList.toggle('big', !!big && !link); cur.classList.toggle('link', !!link);
      if (big) lab.textContent = big.dataset.cursor;
    });
    document.addEventListener('pointerleave', function () { cur.style.opacity = 0; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = 1; });
  }
  function cursor() {
    if (!cur || !fine) return;
    cx = lerp(cx, mouse.x, 0.2); cy = lerp(cy, mouse.y, 0.2);
    ring.style.transform = lab.style.transform = '';
    cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
  }

  // ---- floating photo on the service index
  var fl = document.querySelector('.float-img'), fis = fl ? fl.querySelectorAll('.fi') : [];
  var fx = mouse.x, fy = mouse.y, rot = 0, flOn = false;
  if (fl && fine) document.querySelectorAll('.idx li').forEach(function (li) {
    li.addEventListener('pointerenter', function () {
      flOn = true; fl.classList.add('on');
      fis.forEach(function (f, k) { f.classList.toggle('on', String(k) === li.dataset.fi); });
    });
    li.addEventListener('pointerleave', function () { flOn = false; fl.classList.remove('on'); });
  });
  function floater() {
    if (!fl || !flOn) return;
    fx = lerp(fx, mouse.x, 0.12); fy = lerp(fy, mouse.y, 0.12);
    rot = lerp(rot, clamp(mouse.vx * 0.6, -12, 12), 0.1); mouse.vx *= 0.85;
    fl.style.transform = 'translate3d(' + (fx + 40).toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0) translate(-0%,-50%) rotate(' + rot.toFixed(2) + 'deg)';
  }

  function frame(now) { hero(now); marquee(); cursor(); floater(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  // ---- magnetic buttons
  if (fine) document.querySelectorAll('.mag').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  // ---- bento tilt and glare
  if (fine) document.querySelectorAll('[data-tilt]').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
      c.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  // ---- leaders light up as they pass the middle of the screen; the call counts up
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('lit'); }); }, { rootMargin: '-42% 0px -42% 0px' });
    document.querySelectorAll('.leaders li').forEach(function (li) { lio.observe(li); });
    var cnt = document.querySelector('.count');
    if (cnt) new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var to = Number(cnt.dataset.to), t0 = performance.now();
      (function tick(now) { var k = Math.min(1, (now - t0) / 1300); cnt.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
    }, { threshold: 0.6 }).observe(cnt);
  }

  // ---- videos: drag to scroll, with a little momentum
  var vs = document.querySelector('.videos');
  if (vs && fine) {
    var down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = 0;
    vs.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = lx = e.clientX; sl = vs.scrollLeft; v = 0; vs.classList.add('dragging'); });
    addEventListener('pointermove', function (e) { if (!down) return; v = e.clientX - lx; lx = e.clientX; moved += Math.abs(v); vs.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', function () {
      if (!down) return; down = false; vs.classList.remove('dragging');
      (function glide() { v *= 0.93; vs.scrollLeft -= v; if (Math.abs(v) > 0.5) requestAnimationFrame(glide); })();
    });
    vs.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  // ---- footer spotlight across the wordmark
  var fw = document.querySelector('.foot-wm-wrap'), fh = document.querySelector('.foot-hi');
  if (fw && fh && fine) {
    fw.addEventListener('pointermove', function (e) { var r = fw.getBoundingClientRect(); fh.style.setProperty('--fx', (e.clientX - r.left) + 'px'); fh.style.setProperty('--fy', (e.clientY - r.top) + 'px'); });
    fw.addEventListener('pointerleave', function () { fh.style.setProperty('--fx', '-999px'); });
  }

  // ---- scroll-driven scenes (GSAP ScrollTrigger, if it loaded)
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.intro-img .photo', { clipPath: 'inset(10% 16% 10% 16%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.intro-img', start: 'top 95%', end: 'center 55%', scrub: true } });
    gsap.fromTo('.intro-img img', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.intro-img', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.timor-img img', { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.timor', start: 'top bottom', end: 'bottom top', scrub: true } });
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': function () {
        var st = document.querySelector('.stories'), track = document.querySelector('.st-track');
        if (!st || !track) return;
        st.classList.add('pin-on');
        var dist = function () { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); };
        gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: {
          trigger: st, start: function () { return 'top ' + (document.querySelector('.top').offsetHeight); }, end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return function () { st.classList.remove('pin-on'); };
      }
    });
    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
