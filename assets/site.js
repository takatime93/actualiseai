
(function () {
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function dark() { return root.dataset.theme !== 'light'; }
  var mode = document.getElementById('mode');
  function paintMode() {
    var d = dark();
    mode.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
    mode.querySelector('.nm').textContent = d ? 'Light' : 'Dark';
  }
  mode.addEventListener('click', function () { root.dataset.theme = dark() ? 'light' : 'dark'; store('aai-theme', root.dataset.theme); paintMode(); });
  paintMode();
  var cbs = document.querySelectorAll('.concepts button');
  function paintConcept() { cbs.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.concept === root.dataset.concept)); }); }
  cbs.forEach(function (b) { b.addEventListener('click', function () { root.dataset.concept = b.dataset.concept; store('aai-concept', b.dataset.concept); paintConcept(); }); });
  paintConcept();

  var top = document.querySelector('.top');
  function hdr() { root.style.setProperty('--hdr', top.offsetHeight + 'px'); }
  hdr(); addEventListener('resize', hdr);


  var prog = document.createElement('span'); prog.className = 'progress'; top.appendChild(prog);
  function progress() { var h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; }
  addEventListener('scroll', progress, { passive: true }); progress();
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (calm || e.metaKey || e.ctrlKey || e.shiftKey || a.getAttribute('aria-current') === 'page') return;
      e.preventDefault();
      var v = document.createElement('div'); v.className = 'veil leave'; document.body.appendChild(v);
      try { sessionStorage.setItem('aai-t', '1'); } catch (x) {}
      setTimeout(function () { location.href = a.href; }, 480);
    });
  });
  addEventListener('pageshow', function (e) { if (e.persisted) document.querySelectorAll('.veil.leave').forEach(function (v) { v.remove(); }); });

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
  if (rp) rp.addEventListener('click', function () { var s = document.querySelector('#symbol .sym-big'); s.replaceWith(s.cloneNode(true)); });

  document.querySelectorAll('form[data-concept-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.querySelector('.form-note') || document.querySelector('[data-note-for="' + f.id + '"]'); if (n) n.textContent = 'This is a design concept, so the form isn’t connected yet. Nothing was sent.';
    });
  });
})();
