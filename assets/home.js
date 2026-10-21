// Homepage interaction. Everything here is enhancement: with it off, the page is complete.
// The readiness check works with or without motion, so it sits outside the motion block below.
(function () {
  var f = document.querySelector('[data-quiz]'); if (!f) return;
  var qs = [].slice.call(f.querySelectorAll('.q')), res = f.querySelector('.q-result'), back = f.querySelector('[data-back]');
  var bar = f.querySelector('.q-bar'), hint = f.querySelector('.q-hint'), at = 0, ans = [];
  var STAGES = [
    { max: 4, stage: 'Getting started', text: 'AI isn’t part of the work yet, and that’s a good place to start from: no habits to undo. The fastest gains come from getting the whole team using it well on the tasks they already do.', link: 'AI training: team training and teaching bots', href: '#services' },
    { max: 8, stage: 'Building momentum', text: 'Some of your team are already using AI, but unevenly. Training brings everyone to the same level, and a leadership workshop agrees what AI is for in your business.', link: 'AI training, with a leadership workshop', href: '#services' },
    { max: 12, stage: 'Ready to scale', text: 'Your people use AI and your leaders agree on its purpose. The next step is strategy: where AI fits across the business, in what order, and what to build.', link: 'AI strategy, including consulting', href: '#services' }];
  function show(i) {
    at = i; qs.forEach(function (q, k) { q.hidden = k !== i; });
    res.hidden = i < qs.length; f.classList.toggle('done', i >= qs.length);
    back.disabled = i === 0; bar.style.setProperty('--p', (Math.min(i, qs.length) / qs.length * 100) + '%');
    hint.textContent = i < qs.length ? 'Pick an answer to continue' : '';
  }
  function result() {
    var score = ans.slice(0, 4).reduce(function (a, b) { return a + b; }, 0), goal = ans[4];
    var s = STAGES.filter(function (x) { return score <= x.max; })[0];
    // a team that wants a strategy or a custom tool, and isn't starting from zero, is pointed at strategy
    if (score > 4 && goal >= 2 && s !== STAGES[2]) s = { stage: s.stage, text: s.text + ' You said a strategy or a custom tool matters most, so that’s where we’d start.', link: STAGES[2].link, href: '#services' };
    res.querySelector('.r-stage').textContent = s.stage;
    res.querySelector('.r-text').textContent = s.text;
    var a = res.querySelector('.r-link'); a.textContent = s.link + ' →'; a.href = s.href;
    show(qs.length); res.focus({ preventScroll: true });
  }
  f.addEventListener('change', function (e) {
    var q = e.target.closest('.q'); if (!q) return;
    ans[Number(q.dataset.q)] = Number(e.target.value);
    setTimeout(function () { if (at + 1 < qs.length) { show(at + 1); var n = qs[at].querySelector('input'); if (n) n.focus({ preventScroll: true }); } else result(); }, 260);
  });
  back.addEventListener('click', function () { if (at > 0) show(at - 1); });
  function restart() { ans = []; f.reset(); show(0); }
  f.querySelector('[data-restart]').addEventListener('click', restart);
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = f.querySelector('.r-gate .form-note');
    n.textContent = 'This is a design concept, so nothing was sent. On the live site this emails your result.';
  });
  show(0);
})();

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
  var startDelay = (root.classList.contains('intro-on') ? 1.9 : 0) + 2.6;
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
  var mqs = [].slice.call(document.querySelectorAll('.mq-track')).map(function (t, k) { return { t: t, set: t.querySelector('.mq-set'), x: 0, k: k % 2 ? -1 : 1 }; });
  var mq = mqs.length, dir = -1, lastY = scrollY, boost = 0;
  addEventListener('scroll', function () {
    var dy = scrollY - lastY; lastY = scrollY;
    if (dy) dir = dy > 0 ? -1 : 1;
    boost = clamp(boost + Math.abs(dy) * 0.06, 0, 14);
  }, { passive: true });
  function marquee() {
    if (!mq) return;
    boost *= 0.92;
    var c = root.dataset.concept, lean = c === 'cobalt' || c === 'punk' ? clamp(boost * dir * 1.1, -12, 12) : 0;
    mqs.forEach(function (m) {
      var sw = m.set.offsetWidth; if (!sw || !m.t.offsetParent) return;
      m.x += dir * m.k * (0.6 + boost);
      if (m.x <= -sw) m.x += sw; if (m.x > 0) m.x -= sw;
      m.t.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0) skewX(' + (lean * m.k).toFixed(2) + 'deg)';
    });
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

  // ---- Pop Punk hero HUD: the time in Sydney
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var tick = function () { try { var t = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); clocks.forEach(function (c) { c.textContent = t; }); } catch (e) {} };
    tick(); setInterval(tick, 20000);
  }

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

  // ---- photos bloom into colour when they come into view, and fade back when they leave
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.intersectionRatio >= 0.35) e.target.classList.add('in-view');
        else if (!e.isIntersecting) e.target.classList.remove('in-view');
      });
    }, { threshold: [0, 0.35] });
    document.querySelectorAll('.photo').forEach(function (p) { if (!p.closest('.float-img')) pio.observe(p); });
  }

  // ---- leaders light up as they pass the middle of the screen
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('lit'); }); }, { rootMargin: '-42% 0px -42% 0px' });
    document.querySelectorAll('.leaders li').forEach(function (li) { lio.observe(li); });
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
    gsap.fromTo('.intro-img .photo, .intro-img .render', { clipPath: 'inset(10% 16% 10% 16%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.intro-img', start: 'top 95%', end: 'center 55%', scrub: true } });
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
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) { st.style.setProperty('--stp', self.progress.toFixed(4)); } } });
        return function () { st.classList.remove('pin-on'); };
      }
    });
    addEventListener('load', function () { ScrollTrigger.refresh(); });
    // lazy photos and late fonts change the page height after load; re-measure so the pin starts where the stories really are
    if ('ResizeObserver' in window) {
      var rh = document.body.offsetHeight, rt;
      new ResizeObserver(function () {
        var h = document.body.offsetHeight; if (Math.abs(h - rh) < 2) return; rh = h;
        clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
      }).observe(document.querySelector('main'));
    }
  }
})();
