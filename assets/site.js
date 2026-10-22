
(function () {
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var modes = document.querySelectorAll('[data-mode]');
  function paintMode() { var m = root.dataset.theme || 'dark'; modes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); }); }
  modes.forEach(function (b) { b.addEventListener('click', function () { root.dataset.theme = b.dataset.mode; store('aai-theme', b.dataset.mode); paintMode(); }); });
  paintMode();
  var disp = document.querySelector('.display'), dbtn = document.getElementById('display-btn');
  if (disp && dbtn) {
    dbtn.addEventListener('click', function (e) { e.stopPropagation(); var o = disp.classList.toggle('open'); dbtn.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', function (e) { if (!disp.contains(e.target)) { disp.classList.remove('open'); dbtn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { disp.classList.remove('open'); dbtn.setAttribute('aria-expanded', 'false'); } });
  }
  document.querySelectorAll('.sub').forEach(function (sb) {
    var btn = sb.querySelector('.sub-btn');
    btn.addEventListener('click', function (e) { e.stopPropagation(); var o = sb.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', function (e) { if (!sb.contains(e.target)) { sb.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { sb.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  });
  var cbs = document.querySelectorAll('.concepts button');
  function paintConcept() { cbs.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.concept === root.dataset.concept)); }); }
  cbs.forEach(function (b) { b.addEventListener('click', function () {
    var was = root.dataset.concept; root.dataset.concept = b.dataset.concept; store('aai-concept', b.dataset.concept); paintConcept();
    if (window.aaiFonts) aaiFonts(b.dataset.concept);
  }); });
  paintConcept();

  var veil = document.querySelector('.veil.intro');
  if (veil && root.classList.contains('intro-on')) {
    var skip = function () { if (veil.classList.contains('skip')) return; veil.classList.add('skip'); root.style.setProperty('--start', '.3s'); dispatchEvent(new Event('aai-skip')); };
    veil.addEventListener('click', skip); addEventListener('keydown', function (e) { if (e.key === 'Escape') skip(); });
    veil.addEventListener('animationend', function (e) { if (e.target === veil) veil.style.display = 'none'; });
  }
  // once an entrance animation ends, hold its final state without the animation, so every browser repaints it
  function settle(el) {
    el.style.animation = 'none';
    if (el.classList.contains('furrow') || el.classList.contains('crossrun')) el.style.strokeDashoffset = '0';
    if (el.classList.contains('hair')) el.style.opacity = '1';
    // some browsers keep showing an SVG's first frame after its animation ends; a layer nudge forces the repaint
    // once every part of the drawing has finished, swap in a fresh copy in its final state: guaranteed to paint
    var svg = el.ownerSVGElement;
    if (svg && svg.isConnected && !svg.getAnimations({ subtree: true }).some(function (x) { return x.playState !== 'finished'; })) {
      setTimeout(function () { if (svg.isConnected) svg.replaceWith(svg.cloneNode(true)); }, 60);
    }
  }
  document.addEventListener('animationend', function (e) {
    var el = e.target;
    if (el.closest && (el.closest('.mega') || el.closest('.once'))) settle(el);
  });
  var top = document.querySelector('.top');
  function hdr() { root.style.setProperty('--hdr', top.offsetHeight + 'px'); }
  hdr(); addEventListener('resize', hdr);


  var prog = document.createElement('span'); prog.className = 'progress'; top.appendChild(prog);
  function brand() { top.classList.toggle('scrolled', scrollY > 120); }
  addEventListener('scroll', brand, { passive: true }); brand();
  function progress() { var h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; }
  addEventListener('scroll', progress, { passive: true }); progress();
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (calm || root.dataset.concept === 'cobalt' || e.metaKey || e.ctrlKey || e.shiftKey || a.getAttribute('aria-current') === 'page') return;
      e.preventDefault();
      var v = document.createElement('div'); v.className = 'veil leave'; document.body.appendChild(v);
      try { sessionStorage.setItem('aai-t', '1'); } catch (x) {}
      setTimeout(function () { location.href = a.href; }, 480);
    });
  });
  addEventListener('pageshow', function (e) { if (e.persisted) document.querySelectorAll('.veil.leave').forEach(function (v) { v.remove(); }); });

  if (document.querySelector('.index')) {
    var bar = top.querySelector('.bar'), lastY = scrollY;
    var setBar = function () { root.style.setProperty('--bar', bar.offsetHeight + 'px'); };
    setBar(); addEventListener('resize', setBar);
    addEventListener('scroll', function () {
      var y = scrollY, dy = y - lastY; lastY = y;
      if (y < 160) top.classList.remove('compact');
      else if (dy > 4) { top.classList.add('compact'); if (disp) { disp.classList.remove('open'); if (dbtn) dbtn.setAttribute('aria-expanded', 'false'); } }
      else if (dy < -8) top.classList.remove('compact');
    }, { passive: true });
  }
  var links = document.querySelectorAll('.index a');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.hash.slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[e.target.id]; if (!a) return;
        a.setAttribute('aria-current', 'true');
        var ol = a.closest('ol'); var x = a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2;
        ol.scrollTo({ left: x, behavior: 'smooth' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var hex = b.dataset.hex;
      function done(t) { b.textContent = t; setTimeout(function () { b.textContent = hex; }, 1400); }
      function select() { var r = document.createRange(); r.selectNodeContents(b); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Press Copy'); }
      try { navigator.clipboard.writeText(hex).then(function () { done('Copied'); }, select); } catch (e) { select(); }
    });
  });

  var qs = document.querySelectorAll('.quote');
  if (qs.length > 1) {
    var i = 0, ctl = document.querySelector('.q-ctl'), cnt = document.querySelector('.q-count'), bars = document.querySelectorAll('.q-bar span');
    function show(n) {
      i = (n + qs.length) % qs.length;
      qs.forEach(function (q, k) { q.hidden = k !== i; });
      bars.forEach(function (b, k) { b.classList.toggle('on', k <= i); });
      cnt.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(qs.length).padStart(2, '0');
    }
    ctl.hidden = false;
    ctl.querySelectorAll('.q-btn').forEach(function (b) { b.addEventListener('click', function () { show(i + Number(b.dataset.step)); }); });
    show(0);
  }
  var rp = document.getElementById('replay');
  if (rp) rp.addEventListener('click', function () {
    var sec = document.getElementById('symbol'), s = sec.querySelector('.sym-big'), c = s.cloneNode(true);
    c.querySelectorAll('path').forEach(function (p) { p.style.animation = ''; p.style.strokeDashoffset = ''; p.style.opacity = ''; });
    sec.classList.add('playing'); s.replaceWith(c);
  });

  // Punk sets the last word of each section heading on an acid block; the span is inert in other themes
  document.querySelectorAll('main .sec h2:not(.mega), main .stories h2').forEach(function (h) {
    var t = h.lastChild; if (!t || t.nodeType !== 3) return;
    var m = t.textContent.match(/^(.*\s)(\S+)\s*$/); if (!m) return;
    var sp = document.createElement('span'); sp.className = 'hl'; sp.textContent = m[2];
    t.textContent = m[1]; h.appendChild(sp);
  });

  // Arrival motion for Punk: a short rise, once per element. Off with reduced motion; Brutalism has none.
  (function () {
    if (calm || !('IntersectionObserver' in window)) return;
    var SEL = '.sec h2, .svc-card, .bot, .steps li, .g, .quiz, .st-panel, .faq details, .leaders li', io = null, mode = '';
    function on(m) {
      if (io && mode === m) return; off(); mode = m;
      root.classList.add('pk-ready');
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; io.unobserve(e.target);
          if (!e.target.classList.contains('sl')) e.target.classList.add('pk-in');
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll(SEL + ', .sl').forEach(function (el) { io.observe(el); });
    }
    function off() {
      if (!io) return; io.disconnect(); io = null; mode = ''; root.classList.remove('pk-ready');
      document.querySelectorAll('.pk-in').forEach(function (el) { el.classList.remove('pk-in'); });
      document.querySelectorAll('[data-dec]').forEach(function (el) { delete el.dataset.dec; });
    }
    function sync() { if (root.dataset.concept === 'punk') on('punk'); else off(); }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-concept'] }); sync();
  })();

  // drawn wordmarks: play when they come into view; Replay plays the nearest one again
  document.querySelectorAll('[data-wl-anim]').forEach(function (a) {
    if (a.dataset.wlBound) return; a.dataset.wlBound = '1';
    function play() { a.classList.remove('play', 'done'); void a.offsetWidth; a.classList.add('play'); }
    a._play = play;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); play(); } }, { threshold: 0.3 }).observe(a); else play();
  });
  document.querySelectorAll('[data-wl-replay]').forEach(function (b) {
    var a = b.closest('section') && b.closest('section').querySelector('[data-wl-anim]');
    if (a && a._play) b.addEventListener('click', a._play);
  });

  // identity pages: sections arrive as you scroll (not in Brutalism, which keeps still)
  if (!calm && document.querySelector('.cover') && 'IntersectionObserver' in window) {
    var rvs = document.querySelectorAll('.sec .head, .sec .note, .swatch, .ground, .post, .slide, .card, .steps li, .icon, .wl-letter, .tryon, .lang .panel, .pattern, .preview-shot');
    root.classList.add('rv-on');
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el, i) {
      el.classList.add('rv');
      var sib = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0; el.style.setProperty('--rd', Math.min(sib, 6) * 70 + 'ms');
      rio.observe(el);
    });
  }

  // try it on: switch the ground behind the logos, and show the clear space
  document.querySelectorAll('[data-tryon]').forEach(function (t) {
    var stage = t.querySelector('[data-stage]'), chips = t.querySelectorAll('[data-bg]'), cs = t.querySelector('[data-cs]');
    function cap() { t.querySelectorAll('.cs-box').forEach(function (b) { var el = b.firstElementChild; b.style.setProperty('--cap', Math.round(el.getBoundingClientRect().height * (el.classList.contains('sym') ? 0.25 : 0.9)) + 'px'); }); }
    chips.forEach(function (c) { c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      var photo = c.dataset.bg === 'photo';
      stage.classList.toggle('photo', photo);
      stage.style.backgroundColor = photo ? '#2b3440' : c.dataset.bg; stage.style.backgroundImage = photo ? 'url(' + t.dataset.photo + ')' : 'none';
      stage.style.color = c.dataset.fg; stage.style.setProperty('--fg', c.dataset.fg);
    }); });
    cs.addEventListener('click', function () { cap(); var on = !t.classList.contains('show-cs'); t.classList.toggle('show-cs', on); cs.setAttribute('aria-pressed', String(on)); cs.textContent = on ? 'Hide clear space' : 'Show clear space'; });
    addEventListener('resize', cap);
  });


  // shareables: tabs, a name to try, the colourways, the carousel; pieces draw when they come into view
  document.querySelectorAll('[data-sh]').forEach(function (sh) {
    root.classList.add('sh-js');
    var tabs = sh.querySelectorAll('[data-tab]'), panels = sh.querySelectorAll('[data-panel]');
    var seen = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { seen.unobserve(e.target); e.target.classList.add('on', 'playing'); } });
    }, { threshold: 0.3 }) : null;
    sh.querySelectorAll('.pc').forEach(function (p) { if (seen) seen.observe(p); else p.classList.add('on', 'playing'); });
    tabs.forEach(function (t) { t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
    }); });
    sh.querySelector('.sh-tabs').addEventListener('keydown', function (e) {
      var i = [].indexOf.call(tabs, document.activeElement); if (i < 0) return;
      var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
      if (j >= 0) { e.preventDefault(); tabs[j].focus(); tabs[j].click(); }
    });
    sh.querySelectorAll('[data-in]').forEach(function (inp) { inp.addEventListener('input', function () {
      var v = inp.value.trim() || inp.defaultValue;
      sh.querySelectorAll('[data-b="' + inp.dataset.in + '"]').forEach(function (el) { el.textContent = v; });
    }); });
    var cws = sh.querySelectorAll('[data-cw]');
    cws.forEach(function (b) { b.addEventListener('click', function () {
      sh.dataset.cw = b.dataset.cw; cws.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    }); });
    var car = sh.querySelector('[data-car]');
    if (car) {
      var tr = car.querySelector('.car-track'), at = car.querySelector('[data-car-at]'), n = tr.children.length;
      function idx() { return Math.round(tr.scrollLeft / tr.clientWidth); }
      function go(d) { tr.scrollTo({ left: Math.max(0, Math.min(n - 1, idx() + d)) * tr.clientWidth, behavior: calm ? 'auto' : 'smooth' }); }
      car.querySelector('[data-car-prev]').addEventListener('click', function () { go(-1); });
      car.querySelector('[data-car-next]').addEventListener('click', function () { go(1); });
      tr.addEventListener('scroll', function () { at.textContent = (idx() + 1) + ' / ' + n; }, { passive: true });
    }
  });
  document.querySelectorAll('form[data-concept-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.querySelector('.form-note') || document.querySelector('[data-note-for="' + f.id + '"]'); if (n) n.textContent = 'This is a design concept, so the form isn’t connected yet. Nothing was sent.';
    });
  });
})();
