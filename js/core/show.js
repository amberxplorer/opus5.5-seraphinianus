/* Codicillus Seraphinianus — the director. Holds the spreads, the page turns, the actors that
   climb off the paper, the camera path and the cues for the score; renders any moment T. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, Paper = C.Paper, B = C.Book;
  const PW = B.PW, PH = B.PH, BD = B.BOARD;

  class Show {
    constructor() {
      this.duration = 90;
      this.spreads = [];
      this.turns = [];
      this.actors = [];
      this.camKeys = [];
      this.captions = [];
      this.cues = [];
      this.cover = null; // {front, inside, cloth}
      this.surfaces = new Map();
      this.wpx = 0;
      this.shadow = U.canvas(64, 64);
      this.sctx = this.shadow.getContext('2d');
      this.desk = null;
      this.grain = null;
      this.closeFront = null;
    }

    // ---------------------------------------------------------- authoring
    spread(num) {
      const i = this.spreads.length;
      const s = { i, L: new B.Page(i + 'L', 'L', { paperSeed: (i * 2) % 3 }), R: new B.Page(i + 'R', 'R', { paperSeed: (i * 2 + 1) % 3 }), num: num || [i * 2, i * 2 + 1] };
      this.spreads.push(s);
      return s;
    }
    turn(t0, t1, from, to, o) {
      o = o || {};
      this.turns.push({ t0, t1, from, to, kind: o.kind || 'page', bend: o.bend === undefined ? 1.7 : o.bend });
      this.turns.sort((a, b) => a.t0 - b.t0);
    }
    actor(a) {
      if (a.layer === undefined) a.layer = 1;
      this.actors.push(a);
      return a;
    }
    cam(t, f, o) {
      o = o || {};
      this.camKeys.push({ t, f, n: o.n || null, r: o.r || 0, ease: o.ease || U.easeInOutSine });
      this.camKeys.sort((a, b) => a.t - b.t);
    }
    caption(t0, t1, title, text) { this.captions.push({ t0, t1, title, text }); }
    cue(t, type, data) { this.cues.push(Object.assign({ t, type }, data || {})); }

    // ---------------------------------------------------------- state
    state(T) {
      let st = { mode: 'closed', spread: -1 };
      for (const tr of this.turns) {
        if (T < tr.t0) break;
        if (T < tr.t1) return { mode: 'turn', turn: tr, p: (T - tr.t0) / (tr.t1 - tr.t0) };
        st = tr.kind === 'close' ? { mode: 'closedEnd', spread: tr.from } : { mode: 'open', spread: tr.to };
      }
      return st;
    }
    pagesFor(st) {
      const out = [];
      if (st.mode === 'open') out.push(this.spreads[st.spread].L, this.spreads[st.spread].R);
      else if (st.mode === 'turn') {
        const tr = st.turn;
        if (tr.kind === 'page') out.push(this.spreads[tr.from].L, this.spreads[tr.from].R, this.spreads[tr.to].L, this.spreads[tr.to].R);
        else if (tr.kind === 'cover') out.push(this.spreads[tr.to].L, this.spreads[tr.to].R);
        else if (tr.kind === 'close') out.push(this.spreads[tr.from].L, this.spreads[tr.from].R);
      }
      return out;
    }
    surf(page) { return this.surfaces.get(page); }

    updateSurfaces(T, wpx) {
      if (wpx !== this.wpx) {
        for (const s of this.surfaces.values()) s.release();
        this.surfaces.clear();
        B.clearCaches();
        this.wpx = wpx;
        Ink.texScale = wpx / PW;
        this.closeFront = null;
      }
      const vis = this.pagesFor(this.state(T));
      const pre = [];
      for (const tr of this.turns) {
        if (tr.t0 > T && tr.t0 - T < 4) {
          if (tr.kind !== 'close') pre.push(this.spreads[tr.to].L, this.spreads[tr.to].R);
          break;
        }
      }
      const keep = new Set(vis.concat(pre));
      for (const [page, s] of this.surfaces) {
        if (!keep.has(page)) { s.release(); this.surfaces.delete(page); }
      }
      for (const page of vis) {
        let s = this.surfaces.get(page);
        if (!s) { s = new B.Surface(page, wpx); this.surfaces.set(page, s); }
        s.bake(T);
      }
      for (const page of pre) {
        if (vis.indexOf(page) >= 0) continue;
        let s = this.surfaces.get(page);
        if (!s) { s = new B.Surface(page, wpx); this.surfaces.set(page, s); }
        s.bake(T, 5);
      }
      // prepare watercolour textures a few seconds before they are needed
      const start = performance.now();
      for (const page of vis.concat(pre)) {
        for (const m of page.marks) {
          if (!m.prepare || m.tex || m.t0 > T + 3.5 || m.t1 < T) continue;
          m.prepare(wpx / PW);
          if (performance.now() - start > 4) return;
        }
      }
    }

    // pen activity for the nib sound
    activity(T) {
      const st = this.state(T);
      if (st.mode !== 'open') return 0;
      const sp = this.spreads[st.spread];
      let a = sp.L.activity(T) + sp.R.activity(T);
      for (const act of this.actors) if (act.activity && T >= act.t0 && T < act.t1) a += act.activity(T);
      return a;
    }

    // ---------------------------------------------------------- camera
    camera(T, W, H) {
      const keys = this.camKeys;
      if (!keys.length) return { cx: 0, cy: PH / 2, zoom: Math.min(W / 2300, H / 1600), rot: 0 };
      let a = keys[0], b = keys[0];
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].t <= T) { a = keys[i]; b = keys[Math.min(i + 1, keys.length - 1)]; }
      }
      if (T < keys[0].t) { a = b = keys[0]; }
      const narrow = W / H < 0.95;
      const fa = narrow && a.n ? a.n : a.f, fb = narrow && b.n ? b.n : b.f;
      const u = a === b ? 0 : b.ease(U.sat((T - a.t) / (b.t - a.t)));
      const x = U.lerp(fa[0], fb[0], u), y = U.lerp(fa[1], fb[1], u);
      const w = U.lerp(fa[2], fb[2], u), h = U.lerp(fa[3], fb[3], u);
      const zoom = Math.min(W / w, H / h);
      const reduce = C.reducedMotion ? 0.2 : 1;
      return {
        cx: x + w / 2 + U.noise(T * 0.13, 11.3) * 5 * reduce,
        cy: y + h / 2 + U.noise(T * 0.11, 27.1) * 5 * reduce,
        zoom,
        rot: (U.lerp(a.r, b.r, u) + U.noise(T * 0.08, 5.5) * 0.004) * reduce,
      };
    }

    // ---------------------------------------------------------- rendering
    ensureAssets() {
      if (!this.desk) this.desk = Paper.desk(520, 400);
      if (!this.grain) {
        const n = 200, c = U.canvas(n, n), g = c.getContext('2d');
        const img = g.createImageData(n, n);
        const r = new U.Rand('film');
        for (let i = 0; i < n * n; i++) {
          const v = r.next() * 255;
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
          img.data[i * 4 + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        this.grain = c;
      }
    }

    drawDesk(ctx, view) {
      view.apply(ctx);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.desk, -5200, -3800, 10400, 8000);
    }

    softShadowRect(ctx, x, y, w, h, a, spread) {
      // a soft rectangular contact shadow made of stacked translucent rects
      for (let i = 0; i < 7; i++) {
        const e = spread * (i / 6);
        ctx.fillStyle = `rgba(0,0,0,${(a / 7).toFixed(3)})`;
        ctx.fillRect(x - e + spread * 0.35, y - e + spread * 0.25, w + e * 2, h + e * 2);
      }
    }

    drawBoards(ctx, left, right) {
      const cloth = this.cover && this.cover.cloth;
      const draw = (x, y, w, h) => {
        if (cloth) ctx.drawImage(cloth, 0, 0, cloth.width, cloth.height, x, y, w, h);
        else { ctx.fillStyle = '#1e3431'; ctx.fillRect(x, y, w, h); }
      };
      if (left) draw(-PW - BD, -BD, PW + BD, PH + BD * 2);
      if (right) draw(0, -BD, PW + BD, PH + BD * 2);
    }

    drawBlockEdges(ctx, side, count) {
      // the stack of pages beneath the top page, peeking out at the fore-edge and tail
      for (let j = count; j >= 1; j--) {
        const off = j * 1.7;
        const x = side < 0 ? -PW - off : 0;
        ctx.fillStyle = j % 2 ? '#d9cbb0' : '#e8dcc3';
        ctx.fillRect(x, off * 0.55, PW + off, PH + off * 0.3);
      }
    }

    drawPageAt(ctx, page, x) {
      const s = this.surfaces.get(page);
      if (s) ctx.drawImage(s.canvas, x, 0, PW, PH);
      else { ctx.fillStyle = '#ece0c6'; ctx.fillRect(x, 0, PW, PH); }
    }

    drawShading(ctx, left, right) {
      // gutter: the pages dip toward the spine
      if (left) {
        let g = ctx.createLinearGradient(-110, 0, 0, 0);
        g.addColorStop(0, 'rgba(60,40,20,0)');
        g.addColorStop(0.55, 'rgba(60,40,20,0.08)');
        g.addColorStop(1, 'rgba(40,25,12,0.42)');
        ctx.fillStyle = g;
        ctx.fillRect(-110, 0, 110, PH);
        g = ctx.createLinearGradient(-PW, 0, -PW + 50, 0);
        g.addColorStop(0, 'rgba(60,40,20,0.14)');
        g.addColorStop(1, 'rgba(60,40,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-PW, 0, 50, PH);
      }
      if (right) {
        let g = ctx.createLinearGradient(0, 0, 110, 0);
        g.addColorStop(0, 'rgba(40,25,12,0.4)');
        g.addColorStop(0.45, 'rgba(60,40,20,0.07)');
        g.addColorStop(1, 'rgba(60,40,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 110, PH);
        g = ctx.createLinearGradient(PW - 50, 0, PW, 0);
        g.addColorStop(0, 'rgba(60,40,20,0)');
        g.addColorStop(1, 'rgba(60,40,20,0.12)');
        ctx.fillStyle = g;
        ctx.fillRect(PW - 50, 0, 50, PH);
      }
    }

    blockCounts(spreadIdx) {
      const f = U.sat(spreadIdx / Math.max(1, this.spreads.length - 1));
      return [2 + Math.round(f * 5), 2 + Math.round((1 - f) * 5)];
    }

    drawClosed(ctx, view, T) {
      if (!this.cover) return;
      this.softShadowRect(ctx, 0, -BD, PW + BD, PH + BD * 2, 0.5, 60);
      // back board and the page block peeking out
      ctx.fillStyle = '#16100c';
      ctx.fillRect(3, -BD + 5, PW + BD, PH + BD * 2);
      ctx.fillStyle = '#d8c9ad';
      ctx.fillRect(PW - 4, -BD + 8, BD + 2, PH + BD * 2 - 16);
      ctx.drawImage(this.cover.front, 0, -BD, PW + BD, PH + BD * 2);
    }

    render(ctx, view, T) {
      this.ensureAssets();
      const st = this.state(T);
      const W = view.W * view.dpr, H = view.H * view.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0d0907';
      ctx.fillRect(0, 0, W, H);
      this.drawDesk(ctx, view);
      view.apply(ctx);

      // shadow layer (low resolution → naturally soft)
      const SS = 0.16;
      const sw = Math.max(16, Math.ceil(W * SS)), sh = Math.max(16, Math.ceil(H * SS));
      if (this.shadow.width !== sw || this.shadow.height !== sh) { this.shadow.width = sw; this.shadow.height = sh; }
      const sctx = this.sctx;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, sw, sh);
      view.apply(sctx, SS);
      sctx.globalAlpha = 1;

      let sheet = null;
      if (st.mode === 'closed' || st.mode === 'closedEnd') {
        this.drawClosed(ctx, view, T);
        for (const a of this.onPage(T)) { ctx.save(); a.draw(ctx, T, view, this); ctx.restore(); }
      } else {
        const counts = this.blockCounts(st.mode === 'open' ? st.spread : st.turn.from);
        let leftOn = true, rightOn = true;
        if (st.mode === 'turn' && st.turn.kind === 'cover') leftOn = false;
        if (st.mode === 'turn' && st.turn.kind === 'close') leftOn = false;
        // open book shadow + boards + page block
        this.softShadowRect(ctx, leftOn ? -PW - BD : 0, -BD, (leftOn ? PW + BD : 0) + PW + BD, PH + BD * 2, 0.55, 70);
        this.drawBoards(ctx, leftOn, rightOn);
        if (leftOn) this.drawBlockEdges(ctx, -1, counts[0]);
        this.drawBlockEdges(ctx, 1, counts[1]);
        if (st.mode === 'open') {
          const sp = this.spreads[st.spread];
          this.drawPageAt(ctx, sp.L, -PW);
          this.drawPageAt(ctx, sp.R, 0);
          const sl = this.surfaces.get(sp.L), sr = this.surfaces.get(sp.R);
          ctx.save();
          ctx.translate(-PW, 0);
          if (sl) sl.drawLive(ctx, T);
          ctx.restore();
          if (sr) sr.drawLive(ctx, T);
          for (const a of this.onPage(T)) { ctx.save(); a.draw(ctx, T, view, this); ctx.restore(); }
          this.drawShading(ctx, true, true);
        } else {
          const tr = st.turn;
          if (tr.kind === 'page') {
            const from = this.spreads[tr.from], to = this.spreads[tr.to];
            this.drawPageAt(ctx, from.L, -PW);
            this.drawPageAt(ctx, to.R, 0);
            this.drawShading(ctx, true, true);
            const fr = this.surfaces.get(from.R), bl = this.surfaces.get(to.L);
            sheet = { side: 1, w: PW, y0: 0, h: PH, front: fr && fr.canvas, frontSpine: 'L', back: bl && bl.canvas, backSpine: 'R', p: st.p, bend: tr.bend };
          } else if (tr.kind === 'cover') {
            const to = this.spreads[tr.to];
            this.drawPageAt(ctx, to.R, 0);
            this.drawShading(ctx, false, true);
            sheet = { side: 1, w: PW + BD, y0: -BD, h: PH + BD * 2, front: this.cover.front, frontSpine: 'L', back: this.cover.inside, backSpine: 'R', p: st.p, bend: tr.bend };
          } else if (tr.kind === 'close') {
            const from = this.spreads[tr.from];
            this.drawPageAt(ctx, from.R, 0);
            this.drawShading(ctx, false, true);
            if (!this.closeFront) this.closeFront = this.composeCloseFront(from.L);
            sheet = { side: -1, w: PW + BD, y0: -BD, h: PH + BD * 2, front: this.closeFront, frontSpine: 'R', back: this.cover.front, backSpine: 'L', p: st.p, bend: tr.bend };
          }
        }
      }

      // actor shadows join the sheet's shadow
      let shadows = false;
      for (const a of this.actors) {
        if (a.shadow && T >= a.t0 && T < a.t1) { sctx.save(); a.shadow(sctx, T, view, this); sctx.restore(); shadows = true; }
      }
      if (sheet) {
        // sheet shadow first, into the shadow layer
        B.drawSheet(null, view, sheet, sctx);
        shadows = true;
      }
      if (shadows) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(this.shadow, 0, 0, sw, sh, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      view.apply(ctx);
      if (sheet) B.drawSheet(ctx, view, sheet, null);

      // lifted actors
      const lifted = this.actors.filter((a) => a.layer >= 1 && !a.post && T >= a.t0 && T < a.t1).sort((a, b) => a.layer - b.layer);
      for (const a of lifted) { view.apply(ctx); ctx.save(); a.draw(ctx, T, view, this); ctx.restore(); }

      this.drawLight(ctx, view, T);
      // things that float between the lamp and the viewer
      for (const a of this.actors) {
        if (a.post && T >= a.t0 && T < a.t1) { view.apply(ctx); ctx.save(); a.draw(ctx, T, view, this); ctx.restore(); }
      }
    }

    onPage(T) {
      return this.actors.filter((a) => a.layer < 1 && T >= a.t0 && T < a.t1).sort((a, b) => a.layer - b.layer);
    }

    composeCloseFront(pageL) {
      const s = this.surfaces.get(pageL);
      const sc = s ? s.scale : this.wpx / PW;
      const c = U.canvas((PW + BD) * sc, (PH + BD * 2) * sc);
      const g = c.getContext('2d');
      const cloth = this.cover && this.cover.cloth;
      if (cloth) g.drawImage(cloth, 0, 0, c.width, c.height);
      if (s) g.drawImage(s.canvas, 0, BD * sc, PW * sc, PH * sc);
      return c;
    }

    drawLight(ctx, view, T) {
      const W = view.W * view.dpr, H = view.H * view.dpr;
      // lamp falloff and vignette, painted into a small light map and laid over the frame once
      const LS = 0.25;
      const lw = Math.max(8, Math.ceil(W * LS)), lh = Math.max(8, Math.ceil(H * LS));
      if (!this.lightMap) { this.lightMap = U.canvas(lw, lh); this.lctx = this.lightMap.getContext('2d'); }
      if (this.lightMap.width !== lw || this.lightMap.height !== lh) { this.lightMap.width = lw; this.lightMap.height = lh; }
      const g2 = this.lctx;
      const lamp = view.toScreen(-1500, -900);
      const lx = lamp[0] * view.dpr * LS, ly = lamp[1] * view.dpr * LS;
      // falloff measured in book units, so zooming in does not darken the page
      const R = 4300 * view.pxPerUnit * LS;
      const flick = 1 + U.noise(T * 2.1, 3.3) * 0.012;
      g2.globalCompositeOperation = 'source-over';
      let g = g2.createRadialGradient(lx, ly, R * 0.05, lx, ly, R * flick);
      g.addColorStop(0, 'rgba(255,240,208,1)');
      g.addColorStop(0.42, 'rgba(250,228,192,1)');
      g.addColorStop(0.7, 'rgba(206,172,136,1)');
      g.addColorStop(0.9, 'rgba(110,82,64,1)');
      g.addColorStop(1, 'rgba(46,34,28,1)');
      g2.fillStyle = g;
      g2.fillRect(0, 0, lw, lh);
      g2.globalCompositeOperation = 'multiply';
      g = g2.createRadialGradient(lw / 2, lh / 2, Math.min(lw, lh) * 0.42, lw / 2, lh / 2, Math.hypot(lw, lh) * 0.64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(120,105,95,1)');
      g2.fillStyle = g;
      g2.fillRect(0, 0, lw, lh);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.lightMap, 0, 0, lw, lh, 0, 0, W, H);
      if (this.fadeOut) {
        const f = U.smoothstep(this.fadeOut[0], this.fadeOut[1], T);
        if (f > 0) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(8,5,3,${(0.62 * f).toFixed(3)})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
      // film grain
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.07;
      const r = new U.Rand(Math.floor(T * 24));
      ctx.fillStyle = ctx.createPattern(this.grain, 'repeat');
      ctx.save();
      ctx.translate(-r.range(0, 200), -r.range(0, 200));
      ctx.scale(view.dpr, view.dpr);
      ctx.fillRect(0, 0, W / view.dpr + 400, H / view.dpr + 400);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  C.Show = Show;
})((window.Codex = window.Codex || {}));
