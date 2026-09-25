/* Codicillus Seraphinianus — ink, pencil and watercolour marks.
   Everything is drawn in page units (a page is 1000 × 1414). A Mark knows how to draw
   itself at any progress u ∈ [0, 1]; the book bakes finished marks into page surfaces. */
(function (C) {
  'use strict';
  const U = C.U;
  const Ink = (C.Ink = {});

  const hex = U.hex;
  Ink.PAL = {
    ink: hex('#24170e'),
    inkWarm: hex('#3a2517'),
    sepia: hex('#6d4a2c'),
    faded: hex('#8a7058'),
    red: hex('#a2352a'),
    vermilion: hex('#c4472f'),
    blue: hex('#2c4a7c'),
    // pigments (used with multiply, so they read as washes on paper)
    leaf: hex('#86ad6c'),
    sage: hex('#b3c795'),
    moss: hex('#5f8450'),
    rose: hex('#e7a5a2'),
    carmine: hex('#c8475a'),
    blush: hex('#f2c7b4'),
    sky: hex('#9fc6de'),
    ultramarine: hex('#4563aa'),
    teal: hex('#5ea3a0'),
    ochre: hex('#dfb45a'),
    saffron: hex('#eec76a'),
    orange: hex('#e98b4e'),
    umber: hex('#9d6b43'),
    violet: hex('#9b83c2'),
    lilac: hex('#cbb8e2'),
    slate: hex('#93a0ae'),
    flesh: hex('#efbe9f'),
    gold: hex('#c9a052'),
  };

  // ---------------------------------------------------------------- shared canvases
  let scratchA = null;
  Ink.scratch = function (w, h) {
    if (!scratchA) scratchA = U.canvas(64, 64);
    if (scratchA.width < w || scratchA.height < h) {
      scratchA.width = Math.max(scratchA.width, Math.ceil(w));
      scratchA.height = Math.max(scratchA.height, Math.ceil(h));
    }
    return scratchA;
  };

  let grainCanvas = null;
  Ink.grainCanvas = function () {
    if (grainCanvas) return grainCanvas;
    const n = 160;
    grainCanvas = U.canvas(n, n);
    const g = grainCanvas.getContext('2d');
    const img = g.createImageData(n, n);
    const r = new U.Rand('grain');
    for (let i = 0; i < n * n; i++) {
      const v = r.next();
      const a = v > 0.62 ? (v - 0.62) * 2.2 : 0;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 0;
      img.data[i * 4 + 3] = Math.min(255, a * 255);
    }
    g.putImageData(img, 0, 0);
    return grainCanvas;
  };

  // Soft (blurred) polygon fill via the shadow trick, which works in every browser.
  Ink.blurFill = function (g, poly, blurPx, style, scale) {
    const OFF = 20000;
    g.save();
    g.shadowColor = style;
    g.shadowBlur = blurPx;
    g.shadowOffsetX = OFF;
    g.shadowOffsetY = 0;
    g.fillStyle = '#000';
    g.beginPath();
    for (let i = 0; i < poly.length; i++) {
      const x = poly[i][0] - OFF / scale, y = poly[i][1];
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    g.restore();
  };

  // ---------------------------------------------------------------- strokes
  class Stroke {
    // pts: dense polyline [[x,y],...]; o: {w, tIn, tOut, press, nib, color, alpha, blend, seed, q}
    constructor(pts, o) {
      o = o || {};
      const n = pts.length;
      this.n = n;
      const x = (this.x = new Float32Array(n));
      const y = (this.y = new Float32Array(n));
      const s = (this.s = new Float32Array(n));
      const w = (this.w = new Float32Array(n));
      let L = 0;
      for (let i = 0; i < n; i++) {
        x[i] = pts[i][0];
        y[i] = pts[i][1];
        if (i > 0) L += Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
        s[i] = L;
      }
      this.L = L;
      const base = o.w === undefined ? 1.3 : o.w;
      const tIn = Math.min(o.tIn === undefined ? 5 : o.tIn, L * 0.3);
      const tOut = Math.min(o.tOut === undefined ? 8 : o.tOut, L * 0.4);
      const press = o.press === undefined ? 0.18 : o.press;
      const nib = o.nib || 0;
      const seed = (o.seed || 0) * 13.7;
      const minW = o.minW === undefined ? 0.3 : o.minW;
      for (let i = 0; i < n; i++) {
        let f = 1;
        if (tIn > 0) f *= 0.3 + 0.7 * U.smoothstep(0, tIn, s[i]);
        if (tOut > 0) f *= 0.2 + 0.8 * U.smoothstep(0, tOut, L - s[i]);
        if (press) f *= 1 + press * U.noise(s[i] * 0.045 + seed, seed * 0.3);
        if (nib) {
          const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
          const dx = x[b] - x[a], dy = y[b] - y[a];
          const d = Math.hypot(dx, dy) || 1;
          f *= 1 + nib * Math.max(0, dy / d) - nib * 0.25;
        }
        w[i] = Math.max(minW, base * f);
      }
      this.color = o.color || Ink.PAL.ink;
      this.alpha = o.alpha === undefined ? 1 : o.alpha;
      this.css = U.rgba(this.color, this.alpha);
      this.blend = o.blend || null;
      this.q = o.q || 0.22;
    }

    // Draw from fraction a to b of the stroke's length.
    draw(ctx, a, b) {
      if (b === undefined) { b = a === undefined ? 1 : a; a = 0; }
      if (b <= a || this.n < 2) return;
      const L = this.L, sa = a * L, sb = b * L;
      const x = this.x, y = this.y, s = this.s, w = this.w, q = this.q;
      if (this.blend) ctx.globalCompositeOperation = this.blend;
      ctx.strokeStyle = this.css;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let runW = -1, open = false;
      for (let i = 0; i < this.n - 1; i++) {
        const s0 = s[i], s1 = s[i + 1];
        if (s1 < sa) continue;
        if (s0 > sb) break;
        const d = s1 - s0 || 1e-6;
        let x0 = x[i], y0 = y[i], x1 = x[i + 1], y1 = y[i + 1];
        if (s0 < sa) { const t = (sa - s0) / d; x0 += (x1 - x0) * t; y0 += (y1 - y0) * t; }
        if (s1 > sb) { const t = (sb - s0) / d; x1 = x[i] + (x[i + 1] - x[i]) * t; y1 = y[i] + (y[i + 1] - y[i]) * t; }
        const qw = Math.round((w[i] + w[i + 1]) * 0.5 / q) * q || q;
        if (qw !== runW) {
          if (open) ctx.stroke();
          ctx.beginPath();
          ctx.lineWidth = qw;
          ctx.moveTo(x0, y0);
          runW = qw;
          open = true;
        }
        ctx.lineTo(x1, y1);
      }
      if (open) ctx.stroke();
      if (this.blend) ctx.globalCompositeOperation = 'source-over';
    }

    // Where the pen is at fraction u.
    tip(u) {
      const target = U.sat(u) * this.L;
      const s = this.s;
      let lo = 0, hi = this.n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (s[mid] < target) lo = mid;
        else hi = mid;
      }
      const d = s[hi] - s[lo] || 1;
      const t = U.sat((target - s[lo]) / d);
      return {
        x: this.x[lo] + (this.x[hi] - this.x[lo]) * t,
        y: this.y[lo] + (this.y[hi] - this.y[lo]) * t,
        a: Math.atan2(this.y[hi] - this.y[lo], this.x[hi] - this.x[lo]),
      };
    }
  }
  Ink.Stroke = Stroke;

  // Build a stroke from control points: smoothing + hand wobble.
  Ink.path = function (ctrl, o) {
    o = o || {};
    let pts = o.raw ? ctrl : U.catmull(ctrl, o.step || 1.4, o.closed);
    if (o.wob !== 0) pts = U.wobble(pts, o.wob === undefined ? 0.55 : o.wob, o.wf || 0.03, o.seed || 0);
    return new Stroke(pts, o);
  };
  // Ruled polyline: sharp corners, slight tremor.
  Ink.rule = function (pts, o) {
    o = o || {};
    const d = U.densify(pts, o.step || 2);
    return new Stroke(o.wob === 0 ? d : U.wobble(d, o.wob === undefined ? 0.35 : o.wob, o.wf || 0.02, o.seed || 0), Object.assign({ tIn: 0, tOut: 0, press: 0.05 }, o));
  };
  Ink.line = function (x0, y0, x1, y1, o) {
    o = o || {};
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    return new Stroke(o.wob === 0 ? pts : U.wobble(pts, o.wob === undefined ? 0.4 : o.wob, 0.03, o.seed || 0), o);
  };

  // ---------------------------------------------------------------- marks
  class Mark {
    constructor(t0, t1) {
      this.t0 = t0;
      this.t1 = Math.max(t1 === undefined ? t0 : t1, t0);
    }
    draw() {}
    // page-space bounding box, or null when it may touch the whole page
    bounds() { return null; }
  }
  const FULL = null;
  void FULL;
  Ink.Mark = Mark;

  const identity = (u) => u;

  // One or many strokes. mode 'seq' draws them one after another at a constant pen speed,
  // 'par' draws them all at once, 'stagger' starts them evenly spaced with overlap.
  class StrokeMark extends Mark {
    constructor(strokes, t0, t1, o) {
      super(t0, t1);
      o = o || {};
      this.strokes = Array.isArray(strokes) ? strokes : [strokes];
      this.mode = o.mode || 'seq';
      this.ease = o.ease || identity;
      this.blend = o.blend || null;
      const n = this.strokes.length;
      this.win = new Float32Array(n * 2);
      if (this.mode === 'par') {
        for (let i = 0; i < n; i++) { this.win[i * 2] = 0; this.win[i * 2 + 1] = 1; }
      } else if (this.mode === 'stagger') {
        const d = Math.min(1, o.overlap || 4 / Math.max(1, n));
        for (let i = 0; i < n; i++) {
          const a = n > 1 ? (i / (n - 1)) * (1 - d) : 0;
          this.win[i * 2] = a;
          this.win[i * 2 + 1] = a + d;
        }
      } else {
        const gap = o.gap === undefined ? 0.15 : o.gap; // relative pen-lift time
        let total = 0;
        const avg = this.strokes.reduce((a, s) => a + s.L, 0) / Math.max(1, n);
        for (const s of this.strokes) total += s.L + gap * avg;
        let acc = 0;
        for (let i = 0; i < n; i++) {
          const L = this.strokes[i].L;
          this.win[i * 2] = acc / total;
          acc += L;
          this.win[i * 2 + 1] = acc / total;
          acc += gap * avg;
        }
      }
    }
    draw(ctx, u) {
      u = this.ease(U.sat(u));
      if (this.blend) ctx.globalCompositeOperation = this.blend;
      for (let i = 0; i < this.strokes.length; i++) {
        const a = this.win[i * 2], b = this.win[i * 2 + 1];
        if (u <= a) continue;
        const lu = u >= b ? 1 : (u - a) / (b - a);
        this.strokes[i].draw(ctx, 0, lu);
      }
      if (this.blend) ctx.globalCompositeOperation = 'source-over';
    }
    // Incremental baking: strokes that have finished are drawn once into the page and never
    // again; only the few still under the pen are redrawn each frame.
    bakeTo(ctx, u) {
      u = u >= 1 ? 1 : this.ease(U.sat(u));
      const n = this.strokes.length;
      if (this._baked === undefined) this._baked = 0;
      if (this._baked >= n) return;
      if (this.blend) ctx.globalCompositeOperation = this.blend;
      while (this._baked < n && (u >= 1 || this.win[this._baked * 2 + 1] <= u)) {
        this.strokes[this._baked].draw(ctx, 0, 1);
        this._baked++;
      }
      if (this.blend) ctx.globalCompositeOperation = 'source-over';
    }
    drawLive(ctx, u) {
      u = this.ease(U.sat(u));
      const n = this.strokes.length;
      if (this.blend) ctx.globalCompositeOperation = this.blend;
      for (let i = this._baked || 0; i < n; i++) {
        const a = this.win[i * 2], b = this.win[i * 2 + 1];
        if (u <= a) { if (this.mode !== 'par') break; continue; }
        const lu = u >= b ? 1 : (u - a) / (b - a);
        this.strokes[i].draw(ctx, 0, lu);
      }
      if (this.blend) ctx.globalCompositeOperation = 'source-over';
    }
    bounds() {
      if (this._bb) return this._bb;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const s of this.strokes) {
        for (let i = 0; i < s.n; i++) {
          const x = s.x[i], y = s.y[i];
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        let wmax = 0;
        for (let i = 0; i < s.n; i++) if (s.w[i] > wmax) wmax = s.w[i];
        x0 -= wmax; y0 -= wmax; x1 += wmax; y1 += wmax;
      }
      this._bb = { x0, y0, x1, y1 };
      return this._bb;
    }
    // pen tip positions currently moving (for sound + sparkle)
    activity(u) {
      u = this.ease(U.sat(u));
      if (u <= 0 || u >= 1) return 0;
      for (let i = 0; i < this.strokes.length; i++) {
        const a = this.win[i * 2], b = this.win[i * 2 + 1];
        if (u > a && u < b) return 1;
      }
      return 0.2;
    }
  }
  Ink.StrokeMark = StrokeMark;

  // Watercolour wash: layered noisy fills, darker rim, granulation, blooms from an origin.
  class WashMark extends Mark {
    constructor(poly, color, t0, t1, o) {
      super(t0, t1);
      o = o || {};
      this.poly = poly;
      this.color = typeof color === 'string' ? U.hex(color) : color;
      this.alpha = o.alpha === undefined ? 0.55 : o.alpha;
      this.seed = o.seed === undefined ? Math.random() * 100 : o.seed;
      this.amp = o.amp === undefined ? 4 : o.amp;
      this.layers = o.layers || 4;
      this.edge = o.edge === undefined ? 0.5 : o.edge;
      this.grain = o.grain === undefined ? 0.35 : o.grain;
      this.soft = o.soft === undefined ? 0.45 : o.soft;
      const bb = U.bbox(poly);
      this.origin = o.origin || [bb.cx, bb.cy];
      let maxD = 0;
      for (const p of poly) maxD = Math.max(maxD, Math.hypot(p[0] - this.origin[0], p[1] - this.origin[1]));
      this.maxD = maxD + this.amp * 3;
      this.tex = null;
      this.texScale = 0;
    }
    bounds() {
      const bb = U.bbox(this.poly), p = this.amp * 3 + 6;
      return { x0: bb.x0 - p, y0: bb.y0 - p, x1: bb.x1 + p, y1: bb.y1 + p };
    }
    prepare(scale) {
      if (this.tex && Math.abs(this.texScale - scale) < 1e-3) return;
      const pad = this.amp * 3 + 6;
      const bb = U.bbox(this.poly);
      const x0 = bb.x0 - pad, y0 = bb.y0 - pad, w = bb.w + pad * 2, h = bb.h + pad * 2;
      const cw = Math.max(2, Math.ceil(w * scale)), ch = Math.max(2, Math.ceil(h * scale));
      const c = U.canvas(cw, ch);
      const g = c.getContext('2d');
      g.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
      const col = this.color;
      for (let i = 0; i < this.layers; i++) {
        const poly = U.deform(this.poly, this.amp * (0.5 + i * 0.3), 0.018 + i * 0.006, this.seed + i * 7.7);
        g.fillStyle = U.rgba(col, (this.alpha / this.layers) * 1.35);
        U.poly(g, poly);
        g.fill();
      }
      // pale centre — pigment migrates to the rim as the water dries
      if (this.soft > 0) {
        g.globalCompositeOperation = 'destination-out';
        const shrink = this.poly.map((p) => [bb.cx + (p[0] - bb.cx) * 0.72, bb.cy + (p[1] - bb.cy) * 0.72]);
        Ink.blurFill(g, shrink, Math.max(4, Math.min(bb.w, bb.h) * 0.22 * scale), `rgba(0,0,0,${this.soft})`, scale);
        g.globalCompositeOperation = 'source-over';
      }
      if (this.edge > 0) {
        const edge = U.deform(this.poly, this.amp * 0.8, 0.022, this.seed + 99);
        g.strokeStyle = U.rgba(U.mixc(col, [60, 40, 40], 0.3), this.alpha * this.edge * 0.55);
        g.lineWidth = 1.1;
        U.poly(g, edge);
        g.stroke();
      }
      if (this.grain > 0) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'destination-out';
        g.globalAlpha = this.grain;
        const pat = g.createPattern(Ink.grainCanvas(), 'repeat');
        g.fillStyle = pat;
        g.fillRect(0, 0, cw, ch);
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
      this.tex = c;
      this.texScale = scale;
      this.bx = x0; this.by = y0; this.bw = w; this.bh = h;
    }
    draw(ctx, u, env) {
      this.prepare(env && env.texScale ? env.texScale : Ink.texScale || 1.2);
      u = U.sat(u);
      if (u <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      if (u >= 1) {
        ctx.drawImage(this.tex, this.bx, this.by, this.bw, this.bh);
        ctx.restore();
        return;
      }
      // the wash spreads from where the brush touched down: a clipped disc with a soft rim
      const e = U.easeOut(u);
      const R = Math.max(1, this.maxD * e * 1.06);
      const ox = this.origin[0], oy = this.origin[1];
      const a = 0.4 + 0.6 * U.smoothstep(0, 0.55, u);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(ox, oy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.tex, this.bx, this.by, this.bw, this.bh);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = a * 0.45;
      ctx.beginPath();
      ctx.arc(ox, oy, R * 1.14 + 3, 0, Math.PI * 2);
      ctx.arc(ox, oy, R, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.drawImage(this.tex, this.bx, this.by, this.bw, this.bh);
      ctx.restore();
    }
  }
  Ink.WashMark = WashMark;

  // A pre-rendered image laid onto the page (marbled paper, stamped gilding...).
  class ImageMark extends Mark {
    constructor(img, x, y, w, h, t0, t1, o) {
      super(t0, t1);
      o = o || {};
      this.img = img; this.x = x; this.y = y; this.w = w; this.h = h;
      this.blend = o.blend || null;
      this.alpha = o.alpha === undefined ? 1 : o.alpha;
    }
    bounds() { return { x0: this.x, y0: this.y, x1: this.x + this.w, y1: this.y + this.h }; }
    draw(ctx, u) {
      const img = typeof this.img === 'function' ? this.img() : this.img;
      if (!img) return;
      ctx.save();
      if (this.blend) ctx.globalCompositeOperation = this.blend;
      ctx.globalAlpha = this.alpha * U.sat(u);
      ctx.drawImage(img, this.x, this.y, this.w, this.h);
      ctx.restore();
    }
  }
  Ink.ImageMark = ImageMark;

  // Arbitrary drawing function: fn(ctx, u, env).
  class FnMark extends Mark {
    constructor(fn, t0, t1) {
      super(t0, t1);
      this.fn = fn;
    }
    draw(ctx, u, env) { this.fn(ctx, U.sat(u), env); }
  }
  Ink.FnMark = FnMark;

  // Removes a word (or any mark) from the page: the rectangle is repainted with bare paper and
  // every earlier mark that touches it, except those that have been erased.
  class EraseMark extends Mark {
    constructor(x, y, w, h, t, target) {
      super(t, t);
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.target = target || null;
      this.erase = true;
    }
    draw(ctx, u, env) {
      if (u < 1 || !env || !env.paper) return;
      const p = env.paper, sc = p.width / 1000;
      const x0 = Math.max(0, this.x), y0 = Math.max(0, this.y);
      const x1 = Math.min(1000, this.x + this.w), y1 = Math.min(1414, this.y + this.h);
      if (x1 <= x0 || y1 <= y0) return;
      const surf = env.surface;
      if (surf && this.target) surf.erased.add(this.target);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(p, x0 * sc, y0 * sc, (x1 - x0) * sc, (y1 - y0) * sc, x0, y0, x1 - x0, y1 - y0);
      if (surf) {
        for (const m of surf.baked) {
          if (m.erase || surf.erased.has(m)) continue;
          const b = m.bounds();
          if (b && (b.x1 < x0 || b.x0 > x1 || b.y1 < y0 || b.y0 > y1)) continue;
          ctx.save();
          m.draw(ctx, 1, env);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  Ink.EraseMark = EraseMark;

  // ---------------------------------------------------------------- builders
  Ink.stroke = function (ctrl, t0, t1, o) {
    return new StrokeMark(Ink.path(ctrl, o), t0, t1, o);
  };

  // Parallel hatching inside a polygon.
  Ink.hatch = function (poly, t0, t1, o) {
    o = o || {};
    const rand = o.rand || new U.Rand(o.seed || 'hatch');
    const angle = o.angle === undefined ? -0.8 : o.angle;
    const sp = o.spacing || 4;
    const segs = U.hatch(poly, angle, sp, rand, { jitter: o.jitter, gaps: o.gaps, inset: o.inset, boustro: true });
    if (o.cross) {
      const s2 = U.hatch(poly, angle + (o.crossAngle || 1.2), sp * (o.crossSpacing || 1.2), rand, { jitter: o.jitter, gaps: o.gaps, inset: o.inset });
      for (const s of s2) segs.push(s);
    }
    const strokes = segs.map((s, i) => {
      const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
      const bow = (o.bow || 0.6) * rand.range(-1, 1);
      const nx = -(s[3] - s[1]), ny = s[2] - s[0];
      const nl = Math.hypot(nx, ny) || 1;
      const pts = U.catmull([[s[0], s[1]], [mx + (nx / nl) * bow, my + (ny / nl) * bow], [s[2], s[3]]], 1.5);
      return new Stroke(pts, {
        w: (o.w || 0.8) * rand.range(0.8, 1.15),
        tIn: 2, tOut: 3, press: 0.1,
        color: o.color || Ink.PAL.ink,
        alpha: o.alpha === undefined ? 0.9 : o.alpha,
        blend: o.blend,
        seed: i,
      });
    });
    return new StrokeMark(strokes, t0, t1, { mode: o.mode || 'seq', gap: o.gap === undefined ? 0.05 : o.gap });
  };

  // Coloured pencil: short, soft, multiplied strokes in two passes.
  Ink.pencil = function (poly, color, t0, t1, o) {
    o = o || {};
    const rand = o.rand || new U.Rand(o.seed || 'pencil');
    const col = typeof color === 'string' ? U.hex(color) : color;
    const angle = o.angle === undefined ? -1.05 : o.angle;
    const sp = o.spacing || 2.7;
    const seg = o.seg || 38;
    const strokes = [];
    const passes = o.passes || 2;
    for (let pass = 0; pass < passes; pass++) {
      const segs = U.hatch(poly, angle + pass * (o.passAngle || 0.35), sp * (1 + pass * 0.3), rand, { jitter: 0.35, inset: o.inset || 0.8, boustro: true, slope: 0.15 });
      for (const s of segs) {
        const L = Math.hypot(s[2] - s[0], s[3] - s[1]);
        const k = Math.max(1, Math.round(L / (seg * rand.range(0.7, 1.3))));
        for (let j = 0; j < k; j++) {
          const a = Math.max(0, j / k - 0.04), b = Math.min(1, (j + 1) / k + 0.04);
          const x0 = s[0] + (s[2] - s[0]) * a, y0 = s[1] + (s[3] - s[1]) * a;
          const x1 = s[0] + (s[2] - s[0]) * b, y1 = s[1] + (s[3] - s[1]) * b;
          const pts = U.catmull([[x0, y0], [(x0 + x1) / 2 + rand.range(-0.5, 0.5), (y0 + y1) / 2 + rand.range(-0.5, 0.5)], [x1, y1]], 2);
          strokes.push(new Stroke(pts, {
            w: (o.w || 1.8) * rand.range(0.75, 1.2),
            tIn: 2.5, tOut: 2.5, press: 0.35,
            color: col,
            alpha: (o.alpha === undefined ? 0.34 : o.alpha) * rand.range(0.7, 1.1) * (pass ? 0.8 : 1),
            seed: strokes.length,
          }));
        }
      }
    }
    return new StrokeMark(strokes, t0, t1, { mode: 'stagger', overlap: o.overlap || 0.05, blend: 'multiply' });
  };

  // Stippled dots.
  Ink.dots = function (points, r, t0, t1, o) {
    o = o || {};
    const col = U.rgba(o.color || Ink.PAL.ink, o.alpha === undefined ? 0.9 : o.alpha);
    return new FnMark((ctx, u) => {
      const n = Math.floor(points.length * u + 1e-6);
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = points[i];
        const rr = p[2] || r;
        ctx.moveTo(p[0] + rr, p[1]);
        ctx.arc(p[0], p[1], rr, 0, U.TAU);
      }
      ctx.fill();
    }, t0, t1);
  };

  Ink.wash = function (poly, color, t0, t1, o) { return new WashMark(poly, color, t0, t1, o); };

  // Draw a closed outline as an ink stroke (with overlap at the join, like a real pen).
  Ink.outline = function (poly, t0, t1, o) {
    o = o || {};
    const pts = poly.slice();
    const k = Math.max(1, Math.floor(poly.length * (o.overlap === undefined ? 0.04 : o.overlap)));
    for (let i = 0; i < k; i++) pts.push(poly[i]);
    return Ink.stroke(pts, t0, t1, o);
  };
})((window.Codex = window.Codex || {}));
