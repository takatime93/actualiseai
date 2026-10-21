// The front desk: a scripted demo of a video AI assistant that floats at the bottom right.
// Nothing is sent anywhere; replies come from the script below.
(function () {
  var box = document.querySelector('[data-gub]'); if (!box) return;
  var root = document.documentElement, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var launch = box.querySelector('.gub-launch'), panel = box.querySelector('.gub-panel'), min = box.querySelector('.gub-min');
  var start = box.querySelector('.gub-start'), chat = box.querySelector('.gub-chat'), call = box.querySelector('.gub-call'), back = box.querySelector('.gub-back');
  var log = box.querySelector('.gub-log'), chips = box.querySelector('.gub-chips'), form = box.querySelector('.gub-form'), input = form.querySelector('input');
  var cap = box.querySelector('.gub-cap'), clock = box.querySelector('.gub-clock');
  var home = box.dataset.home || '', started = false, busy = false, mode = 'start', tick = null;

  // open during business hours in Sydney, Monday to Friday, 9 to 5
  var closed = (function () {
    try {
      var p = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
      var d = p.find(function (x) { return x.type === 'weekday'; }).value, h = Number(p.find(function (x) { return x.type === 'hour'; }).value);
      return /Sat|Sun/.test(d) || h < 9 || h >= 17;
    } catch (e) { return false; }
  })();
  if (closed) {
    box.classList.add('closed');
    box.querySelector('.gub-status span').textContent = 'We’re closed';
    box.querySelector('.gub-sub').textContent = 'Our team is away, but our AI front desk can help right now, or take a message.';
  }

  var SCRIPT = {
    hello: { say: ['Hi, I’m the Actualise AI front desk.', 'I can tell you about our training and strategy work, or help you find a starting point.'], next: ['diff', 'tech', 'check', 'human'] },
    diff: { q: 'Training or strategy: what’s the difference?', say: ['AI training gets you and your team using AI well: team training, leadership workshops and teaching bots.', 'AI strategy is guidance for integrating AI into your business through your leaders. That’s where our consulting sits.'], next: ['tech', 'check', 'human'] },
    tech: { q: 'Is this for non-technical teams?', say: ['Yes. We work with business leaders and their teams, not engineers. Most teams start with training.'], next: ['diff', 'check', 'human'] },
    check: { q: 'Where should we start?', say: ['The readiness check takes about three minutes and shows your result straight away.'], link: ['Open the readiness check', '#check'], next: ['diff', 'human'] },
    human: { q: 'Leave a message for the team', say: ['Happy to pass you on. Leave your name and email and the team will follow up.'], intake: true, next: [] },
    other: { say: ['In the live version I’d answer that from Actualise’s own knowledge. In this demo, try one of these.'], next: ['diff', 'tech', 'check', 'human'] }
  };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function bubble(who, text) { var li = el('li', 'gub-msg ' + who); li.appendChild(el('p', '', text)); log.appendChild(li); scrollLog(); }
  function speak(on, text) { box.classList.toggle('speaking', on); cap.textContent = on ? text : ''; }

  // each line is typed in the chat and spoken over the video as a caption
  function say(lines, done) {
    busy = true; chips.replaceChildren();
    var i = 0;
    (function next() {
      if (i >= lines.length) { busy = false; speak(false); if (done) done(); return; }
      var t = el('li', 'gub-msg bot typing'); t.setAttribute('aria-label', 'Typing');
      for (var d = 0; d < 3; d++) t.appendChild(el('span'));
      log.appendChild(t); scrollLog();
      var line = lines[i++];
      setTimeout(function () {
        t.remove(); bubble('bot', line); speak(true, line);
        setTimeout(next, calm ? 200 : Math.min(2600, 900 + line.length * 18));
      }, calm ? 150 : 700 + Math.min(900, line.length * 8));
    })();
  }
  function offer(keys) {
    chips.replaceChildren();
    keys.forEach(function (k) {
      var b = el('button', 'gub-chip', SCRIPT[k].q); b.type = 'button';
      b.addEventListener('click', function () { if (!busy) step(k, true); });
      chips.appendChild(b);
    });
  }
  function step(k, asked) {
    var s = SCRIPT[k];
    if (asked && s.q) bubble('me', s.q);
    say(s.say, function () {
      if (s.link) {
        var li = el('li', 'gub-msg bot act'), a = el('a', 'gub-link', s.link[0] + ' →'); a.href = home + s.link[1];
        a.addEventListener('click', function () { if (innerWidth < 700) close(); });
        li.appendChild(a); log.appendChild(li); scrollLog();
      }
      if (s.intake) intake();
      offer(s.next);
    });
  }
  function field(label, name, type, ac) { var l = el('label', '', label), i = el('input'); i.name = name; i.type = type; i.autocomplete = ac; i.required = true; l.appendChild(i); return l; }
  function intake() {
    var li = el('li', 'gub-msg bot intake'), f = el('form', 'gub-intake'), b = el('button', 'btn', 'Send to the team');
    b.type = 'submit';
    f.append(el('p', 'lab', 'Before we start'), field('Name', 'name', 'text', 'name'), field('Email', 'email', 'email', 'email'), b);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); b.disabled = true;
      say(['Thanks! On the live site this would go to the Actualise team, who follow up by email. This demo sends nothing.'], function () { offer(['diff', 'check']); });
    });
    li.appendChild(f); log.appendChild(li); scrollLog();
  }

  function setMode(m) {
    mode = m; clearInterval(tick);
    box.classList.toggle('in-chat', m === 'chat'); box.classList.toggle('in-call', m === 'call');
    start.hidden = m !== 'start'; chat.hidden = m !== 'chat'; call.hidden = m !== 'call'; back.hidden = m === 'start';
    if (m === 'chat') { if (!started) { started = true; step('hello'); } setTimeout(function () { input.focus({ preventScroll: true }); }, 60); }
    else if (!busy) speak(false);
    if (m === 'call') {
      var t0 = Date.now(); clock.textContent = '0:00';
      tick = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); clock.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 1000);
      speak(true, 'Hi, you’re through to the Actualise AI front desk. How can I help today?');
    }
  }
  box.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.go); }); });
  back.addEventListener('click', function () { setMode('start'); });
  box.querySelector('.gub-end').addEventListener('click', function () { setMode('start'); });

  // the presenter plays only where it can be seen; with reduced motion it rests on its first frame
  var vLaunch = launch.querySelector('video'), vPanel = panel.querySelector('video');
  function play(v, on) { if (!v) return; if (on && !calm) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }
  if (calm) play(vLaunch, false);
  function open() {
    panel.hidden = false; min.hidden = false; box.classList.add('open'); launch.setAttribute('aria-expanded', 'true');
    play(vLaunch, false); play(vPanel, true);
    setTimeout(function () { (mode === 'chat' ? input : box.querySelector('.gub-pick')).focus({ preventScroll: true }); }, 60);
  }
  function close() {
    panel.hidden = true; min.hidden = true; box.classList.remove('open'); launch.setAttribute('aria-expanded', 'false');
    play(vPanel, false); play(vLaunch, true);
    if (mode === 'call') setMode('start'); speak(false); launch.focus({ preventScroll: true });
  }
  launch.addEventListener('click', open);
  min.addEventListener('click', close);
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); var v = input.value.trim(); if (!v || busy) return;
    input.value = ''; bubble('me', v);
    var low = v.toLowerCase();
    step(/strateg|consult|differ|train/.test(low) ? 'diff' : /technical|engineer|code/.test(low) ? 'tech' : /start|check|ready|where/.test(low) ? 'check' : /person|human|call|talk|contact|email|message/.test(low) ? 'human' : 'other');
  });

  // on phones the card waits until you scroll past the hero, so it never sits on the hero buttons
  var hero = document.querySelector('.hero-x.city');
  if (hero) {
    var away = function () { box.classList.toggle('away', innerWidth < 900 && scrollY < hero.offsetHeight * 0.6 && panel.hidden); };
    addEventListener('scroll', away, { passive: true }); addEventListener('resize', away); away();
  }
  // during the opening sequence the card stays out of the way
  if (root.classList.contains('intro-on')) {
    box.style.visibility = 'hidden';
    var show = function () { box.style.visibility = ''; };
    setTimeout(show, 6200); addEventListener('aai-skip', function () { setTimeout(show, 500); });
  }
})();
