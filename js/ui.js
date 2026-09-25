/* Codicillus Seraphinianus — the interface around the book: landing, captions, transport,
   the end card and the notes about the Codex. */
(function (C) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const UI = (C.UI = {});
  const SECTIONS = [
    [0, 'Overture', 'The cover, a six-winged seraph and a title page.'],
    [9.2, 'I · Flora', 'An eye-flower walks off the page; a sapling grows into a chair.'],
    [19.2, 'II · Fauna', 'A fish swims out of its own description, and the words follow.'],
    [29.2, 'IV–V · Physics & Machines', 'A pendulum draws in red ink; a clockwork scribe writes on.'],
    [39.2, 'VI · Humankind', 'Two lovers, a blanket, and then an alligator.'],
    [49.2, 'VIII · Writing', 'An alphabet sung one note at a time; a caterpillar writes a spiral.'],
    [59.2, 'IX–X · Food, Garments & Games', 'A goose game plays itself; spaghetti made of handwriting.'],
    [69.2, 'XI · Architecture', 'A lagoon city rises, and dusk falls on it.'],
    [79.9, 'Coda', 'The words fly off the page and the book closes.'],
  ];
  UI.SECTIONS = SECTIONS;

  let show = null;
  let started = false;
  let lastCap = null;
  let idleTimer = null;
  let resumeAfterAbout = false;
  let muted = false;
  let lastFocus = null;
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  function setIdle(on) {
    const c = $('controls');
    if (!c) return;
    c.classList.toggle('idle', !!on);
  }
  function poke() {
    setIdle(false);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (C.clock && C.clock.playing) setIdle(true); }, 2600);
  }

  function openAbout() {
    lastFocus = document.activeElement;
    resumeAfterAbout = !!(C.clock && C.clock.playing);
    if (resumeAfterAbout) C.App.pause();
    $('about').hidden = false;
    $('about-close').focus();
  }
  function closeAbout() {
    $('about').hidden = true;
    if (resumeAfterAbout) C.App.play();
    resumeAfterAbout = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  async function begin() {
    if (started) return;
    started = true;
    const btn = $('begin');
    btn.disabled = true;
    btn.textContent = 'Opening…';
    await C.App.begin();
    C.landing = false;
    $('landing').classList.add('leaving');
    setTimeout(() => { $('landing').hidden = true; }, 1300);
    $('controls').hidden = false;
    $('progress').hidden = false;
    poke();
  }

  function seekFromEvent(e) {
    const r = $('progress').getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    C.App.seek(f * show.duration);
  }

  UI.init = function (s) {
    show = s;
    C.landing = true;
    $('begin').addEventListener('click', begin);
    for (const id of ['about-open', 'btn-about', 'about-end']) $(id).addEventListener('click', openAbout);
    $('about-close').addEventListener('click', closeAbout);
    $('about').addEventListener('click', (e) => { if (e.target === $('about')) closeAbout(); });
    $('btn-play').addEventListener('click', () => { C.App.toggle(); poke(); });
    $('btn-restart').addEventListener('click', () => { C.App.restart(); poke(); });
    $('again').addEventListener('click', () => { C.App.restart(); poke(); });
    $('btn-mute').addEventListener('click', () => {
      muted = !muted;
      if (C.Audio) C.Audio.setMuted(muted);
      $('btn-mute').classList.toggle('muted', muted);
      $('btn-mute').setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute sound');
      poke();
    });
    // the progress line doubles as a way to wander through the book
    const pr = $('progress');
    let dragging = false;
    pr.addEventListener('pointerdown', (e) => { dragging = true; pr.setPointerCapture(e.pointerId); seekFromEvent(e); poke(); });
    pr.addEventListener('pointermove', (e) => { if (dragging) seekFromEvent(e); });
    pr.addEventListener('pointerup', () => { dragging = false; });
    pr.addEventListener('keydown', (e) => {
      const T = C.App.time();
      if (e.key === 'ArrowRight') { C.App.seek(Math.min(show.duration, T + 5)); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { C.App.seek(Math.max(0, T - 5)); e.preventDefault(); }
      if (e.key === 'Home') { C.App.seek(0); e.preventDefault(); }
      if (e.key === 'End') { C.App.seek(show.duration - 0.5); e.preventDefault(); }
    });
    const ticks = pr.querySelector('.ticks');
    for (const [t, name] of SECTIONS.slice(1)) {
      const i = document.createElement('i');
      i.style.left = `${(t / show.duration) * 100}%`;
      i.title = name;
      ticks.appendChild(i);
    }
    // chapter list in the notes: each line jumps to its chapter
    const list = $('chapter-list');
    for (const [t, name, desc] of SECTIONS) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="t">${fmt(Math.max(0, Math.round(t)))}</span><span><span class="n"></span><span class="d"></span></span>`;
      b.querySelector('.n').textContent = name;
      b.querySelector('.d').textContent = desc;
      b.addEventListener('click', async () => {
        $('about').hidden = true;
        resumeAfterAbout = false;
        if (!started) await begin();
        C.App.seek(t);
        C.App.play(t);
      });
      li.appendChild(b);
      list.appendChild(li);
    }
    document.addEventListener('keydown', (e) => {
      if (!$('about').hidden) {
        if (e.key === 'Escape') closeAbout();
        return;
      }
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.id === 'progress') && (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow'))) return;
      if (!started) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); }
        return;
      }
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); C.App.toggle(); poke(); }
      else if (e.key === 'm') $('btn-mute').click();
      else if (e.key === 'r') { C.App.restart(); poke(); }
      else if (e.key === 'ArrowRight') C.App.seek(Math.min(show.duration, C.App.time() + 5));
      else if (e.key === 'ArrowLeft') C.App.seek(Math.max(0, C.App.time() - 5));
    });
    window.addEventListener('pointermove', poke, { passive: true });
    window.addEventListener('touchstart', poke, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && C.clock && C.clock.playing) C.App.pause();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => C.App.refresh && C.App.refresh());
  };

  UI.update = function (T, playing) {
    if (!show) return;
    // captions
    let cap = null;
    if (started) for (const c of show.captions) if (T >= c.t0 && T < c.t1) cap = c;
    const el = $('caption');
    if (cap !== lastCap) {
      if (cap) {
        el.querySelector('.cap-title').textContent = cap.title;
        el.querySelector('.cap-text').textContent = cap.text;
        el.classList.add('on');
      } else el.classList.remove('on');
      lastCap = cap;
    }
    // transport
    const f = Math.min(1, T / show.duration);
    const pr = $('progress');
    pr.querySelector('.fill').style.width = `${(f * 100).toFixed(2)}%`;
    pr.setAttribute('aria-valuenow', String(Math.round(T)));
    pr.setAttribute('aria-valuetext', `${Math.round(T)} seconds`);
    $('clock').textContent = fmt(T);
    const pb = $('btn-play');
    pb.classList.toggle('paused', !playing);
    pb.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    // end card
    const end = $('endcard');
    const showEnd = started && T >= 88.2;
    if (showEnd && end.hidden) { end.hidden = false; requestAnimationFrame(() => end.classList.add('on')); }
    else if (!showEnd && !end.hidden) { end.classList.remove('on'); end.hidden = true; }
  };

  UI.ended = function () { setIdle(false); };
})((window.Codex = window.Codex || {}));
