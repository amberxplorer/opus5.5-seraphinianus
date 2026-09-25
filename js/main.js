/* Codicillus Seraphinianus — boot, clock, render loop. The clock follows the audio hardware
   while sound plays, so every stroke lands on its note. */
(function (C) {
  'use strict';
  const U = C.U;
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d', { alpha: false });
  const view = new C.Book.View();
  const params = new URLSearchParams(location.search);
  const TEST = params.has('test');
  C.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let show = null;
  let W = 1, H = 1, dpr = 1;
  // the screen's own density (for the page textures) and the density we actually draw at,
  // which steps down if frames keep arriving late
  const baseDpr = () => Math.min(2, window.devicePixelRatio || 1);
  let maxDpr = baseDpr();
  const PIXEL_BUDGET = 4.2e6; // backing pixels; beyond this the pages have no more detail to show

  // ------------------------------------------------------------ clock
  const clock = {
    playing: false,
    base: 0,
    since: 0,
    audio: false,
    src() { return this.audio && C.Audio && C.Audio.ready() ? C.Audio.time() : performance.now() / 1000; },
    now() {
      if (!this.playing) return this.base;
      return this.base + Math.max(0, this.src() - this.since);
    },
    startAt(T, at) { this.base = T; this.since = at; this.audio = true; this.playing = true; },
    start(T) { this.base = T; this.audio = false; this.since = performance.now() / 1000; this.playing = true; },
    pause() { this.base = this.now(); this.playing = false; },
  };
  C.clock = clock;

  // ------------------------------------------------------------ sizing
  function resize() {
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr, Math.sqrt(PIXEL_BUDGET / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }
  // Page texture width. It follows the window, not the adaptive density, and ignores small
  // changes, because a new size means repainting every page.
  let wpx = 0;
  function pageRes() {
    const narrow = W / H < 0.95;
    const z = narrow ? Math.min(W / 1100, H / 1600) : Math.min(W / 2320, H / 1680);
    const px = Math.round(U.clamp(1000 * z * baseDpr() * 1.4, 560, 1700) / 8) * 8;
    if (!wpx || Math.abs(px - wpx) / wpx > 0.2) wpx = px;
    return wpx;
  }

  // ------------------------------------------------------------ render
  // On the landing the closed book sits beside the title; once opened, the camera glides
  // into the first shot of the piece.
  function landingCamera() {
    const wide = W / H >= 1.15;
    const B = C.Book, bw = B.PW + B.BOARD, bh = B.PH + B.BOARD * 2;
    if (wide) {
      const zoom = Math.min((0.8 * H) / bh, (0.4 * W) / bw);
      return { cx: bw / 2 - (0.69 * W - W / 2) / zoom, cy: bh / 2 - B.BOARD, zoom, rot: 0 };
    }
    const zoom = Math.min((0.44 * H) / bh, (0.74 * W) / bw);
    return { cx: bw / 2, cy: bh / 2 - B.BOARD - (0.545 * H - H / 2) / zoom, zoom, rot: 0 };
  }
  let firstRun = true;
  function renderAt(T) {
    let cam = show.camera(T, W, H);
    let lb = 0;
    if (C.landing) lb = 1;
    else if (firstRun && !TEST) {
      lb = 1 - U.smoothstep(0, 2.2, T);
      if (T > 2.2) firstRun = false;
    }
    if (lb > 0) {
      const lc = landingCamera();
      const e = U.easeInOutSine(lb);
      cam = { cx: U.lerp(cam.cx, lc.cx, e), cy: U.lerp(cam.cy, lc.cy, e), zoom: Math.exp(U.lerp(Math.log(cam.zoom), Math.log(lc.zoom), e)), rot: U.lerp(cam.rot, 0, e) };
    }
    view.set(cam.cx, cam.cy, cam.zoom, cam.rot, W, H, dpr);
    show.updateSurfaces(T, pageRes());
    show.render(ctx, view, T);
  }

  function build() {
    show = new C.Show();
    for (const sc of C.Scenes) {
      try {
        sc.build(show, C.TL);
      } catch (e) {
        console.error('scene ' + sc.id + ' failed', e);
      }
    }
    C.show = show;
  }

  // ------------------------------------------------------------ loop
  let frames = 0, slow = 0, lastWall = performance.now();
  function loop() {
    const T = Math.min(clock.now(), show.duration);
    if (C.landing) C.landingPhase = (performance.now() / 1000) % 5.5;
    renderAt(T);
    if (C.UI) C.UI.update(T, clock.playing);
    if (C.Audio && clock.playing) C.Audio.update(T, show);
    if (clock.playing && T >= show.duration) {
      clock.pause();
      clock.base = show.duration;
      if (C.UI) C.UI.ended();
    }
    // adaptive resolution: if frames keep arriving late, draw the screen a notch coarser
    const now = performance.now();
    const dt = now - lastWall;
    lastWall = now;
    if (clock.playing && !document.hidden && dt < 250) {
      frames++;
      if (dt > 24) slow++;
      if (frames >= 60) {
        if (slow > 24 && dpr > 0.8) { maxDpr = Math.max(0.8, dpr - 0.25); resize(); }
        frames = 0;
        slow = 0;
      }
    }
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ public api
  C.App = {
    async begin() {
      try {
        await Promise.race([C.Audio.init(show), new Promise((_, rej) => setTimeout(() => rej(new Error('audio timeout')), 4000))]);
      } catch (e) {
        console.warn('Sound is unavailable; the book will open silently.', e);
      }
      C.App.play(0);
    },
    play(fromT) {
      let T = fromT === undefined ? clock.base : fromT;
      if (T >= show.duration - 0.05) T = 0;
      if (C.Audio && C.Audio.ready()) clock.startAt(T, C.Audio.start(T));
      else clock.start(T);
    },
    pause() {
      clock.pause();
      if (C.Audio) C.Audio.pause();
    },
    toggle() {
      if (clock.playing) C.App.pause();
      else C.App.play();
    },
    seek(T) {
      T = U.clamp(T, 0, show.duration);
      const was = clock.playing;
      if (was) C.App.play(T);
      else { clock.base = T; }
    },
    restart() { C.App.play(0); },
    time() { return clock.now(); },
    refresh() { if (!clock.playing) renderAt(clock.now()); },
  };

  window.__codex = {
    frame(T) { renderAt(T); return true; },
    get show() { return show; },
  };

  function boot() {
    resize();
    window.addEventListener('resize', () => { resize(); C.App.refresh(); });
    build();
    const t0 = parseFloat(params.get('t') || '0');
    clock.base = t0;
    if (TEST) {
      renderAt(t0);
      document.documentElement.classList.add('test');
      const ui = document.getElementById('ui');
      if (ui) ui.hidden = true;
      document.title = 'done';
      return;
    }
    if (C.UI) C.UI.init(show);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})((window.Codex = window.Codex || {}));
