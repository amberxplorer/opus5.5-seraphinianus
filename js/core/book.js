/* Codicillus Seraphinianus — the book on the desk.
   Spread space: the left page spans x ∈ [-1000, 0], the right page x ∈ [0, 1000], y ∈ [0, 1414];
   the spine is x = 0. Page turns are rendered as perspective-projected vertical strips of a
   curling sheet, lit by a lamp at the upper left. */
(function (C) {
  'use strict';
  const U = C.U, Paper = C.Paper;
  const B = (C.Book = {});
  const PW = 1000, PH = 1414;
  B.PW = PW;
  B.PH = PH;
  B.BOARD = 14; // cover overhang

  // ------------------------------------------------------------ pages
  class Page {
    constructor(id, side, o) {
      o = o || {};
      this.id = id;
      this.side = side; // 'L' | 'R'
      this.marks = [];
      this.base = o.base || null; // (wpx) => canvas
      this.paperSeed = o.paperSeed === undefined ? (side === 'L' ? 0 : 1) : o.paperSeed;
      this.sorted = false;
    }
    add() {
      for (const m of arguments) {
        if (!m) continue;
        if (Array.isArray(m)) for (const x of m) this.add(x);
        else this.marks.push(m);
      }
      this.sorted = false;
      return this;
    }
    sort() {
      if (!this.sorted) {
        this.marks.sort((a, b) => a.t1 - b.t1);
        this.sorted = true;
      }
    }
    // pen activity at time T (0…n), used to drive the scratching of the nib
    activity(T) {
      let a = 0;
      for (const m of this.marks) {
        if (m.t0 <= T && m.t1 > T && m.activity) a += m.activity((T - m.t0) / (m.t1 - m.t0));
      }
      return a;
    }
  }
  B.Page = Page;

  // ------------------------------------------------------------ canvas pool and paper cache
  const pool = [];
  B.take = function (w, h) {
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].width === w && pool[i].height === h) return pool.splice(i, 1)[0];
    }
    return U.canvas(w, h);
  };
  B.give = function (c) {
    if (pool.length < 4) pool.push(c);
  };
  const paperCache = new Map();
  B.paperFor = function (seed, wpx) {
    const key = seed + ':' + wpx;
    if (!paperCache.has(key)) paperCache.set(key, Paper.page(wpx, seed));
    return paperCache.get(key);
  };
  B.clearCaches = function () {
    paperCache.clear();
    pool.length = 0;
  };

  // A page's pixels: paper plus every finished mark.
  class Surface {
    constructor(page, wpx) {
      this.page = page;
      this.wpx = wpx;
      this.hpx = Math.round(wpx * 1.414);
      this.canvas = B.take(this.wpx, this.hpx);
      this.ctx = this.canvas.getContext('2d');
      this.scale = wpx / PW;
      this.base = page.base ? page.base(wpx) : B.paperFor(page.paperSeed, wpx);
      this.env = { texScale: this.scale, paper: this.base, surface: this };
      this.reset();
    }
    reset() {
      this.baked = [];
      this.erased = new Set();
      for (const m of this.page.marks) if (m._baked !== undefined) m._baked = 0;
      const g = this.ctx;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.drawImage(this.base, 0, 0, this.wpx, this.hpx);
      this.idx = 0;
      this.T = -Infinity;
    }
    // Bake marks finished by T. With a budget (ms) it may stop early and resume next frame.
    bake(T, budget) {
      if (T < this.T) this.reset();
      this.page.sort();
      const marks = this.page.marks;
      const g = this.ctx;
      const start = budget ? performance.now() : 0;
      while (this.idx < marks.length && marks[this.idx].t1 <= T) {
        const m = marks[this.idx];
        g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        g.save();
        if (m.bakeTo) m.bakeTo(g, 1);
        else m.draw(g, 1, this.env);
        g.restore();
        if (!m.erase) this.baked.push(m);
        this.idx++;
        if (budget && performance.now() - start > budget) {
          this.T = m.t1;
          return false;
        }
      }
      // marks still being drawn: bake whatever strokes they have finished
      for (let i = this.idx; i < marks.length; i++) {
        const m = marks[i];
        if (!m.bakeTo || m.t0 > T || m.t1 <= T) continue;
        g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        g.save();
        m.bakeTo(g, (T - m.t0) / (m.t1 - m.t0));
        g.restore();
      }
      this.T = T;
      return true;
    }
    drawLive(ctx, T) {
      const marks = this.page.marks;
      for (let i = this.idx; i < marks.length; i++) {
        const m = marks[i];
        if (m.t0 <= T && m.t1 > T) {
          ctx.save();
          if (m.drawLive) m.drawLive(ctx, (T - m.t0) / (m.t1 - m.t0));
          else m.draw(ctx, (T - m.t0) / (m.t1 - m.t0), this.env);
          ctx.restore();
        }
      }
    }
    release() {
      B.give(this.canvas);
      this.canvas = null;
    }
  }
  B.Surface = Surface;

  // A drawing with its own transparent canvas: it is inked like a page (marks bake as they finish)
  // but can later be lifted, moved and bent as a paper cut-out.
  class InkSprite {
    constructor(bbox, marks, o) {
      o = o || {};
      this.bb = bbox; // {x0, y0, x1, y1} in page units
      this.page = new Page('sprite', 'R');
      this.page.add(marks);
      this.outline = o.outline || null; // polygon for the paper cut-out
      this.canvas = null;
      this.scale = 0;
      this.T = -Infinity;
      this.idx = 0;
      this.cut = null;
    }
    ensure(scale) {
      if (this.canvas && this.scale === scale) return;
      const w = Math.ceil((this.bb.x1 - this.bb.x0) * scale), h = Math.ceil((this.bb.y1 - this.bb.y0) * scale);
      this.canvas = U.canvas(w, h);
      this.ctx = this.canvas.getContext('2d');
      this.scale = scale;
      this.env = { texScale: scale };
      this.T = -Infinity;
      this.idx = 0;
      this.cut = null;
    }
    bake(T, scale) {
      this.ensure(scale);
      if (T < this.T) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.idx = 0;
        this.cut = null;
        for (const m of this.page.marks) if (m._baked !== undefined) m._baked = 0;
      }
      this.page.sort();
      const marks = this.page.marks;
      const g = this.ctx;
      while (this.idx < marks.length && marks[this.idx].t1 <= T) {
        g.setTransform(scale, 0, 0, scale, -this.bb.x0 * scale, -this.bb.y0 * scale);
        g.save();
        const m = marks[this.idx];
        if (m.bakeTo) m.bakeTo(g, 1);
        else m.draw(g, 1, this.env);
        g.restore();
        this.idx++;
      }
      for (let i = this.idx; i < marks.length; i++) {
        const m = marks[i];
        if (!m.bakeTo || m.t0 > T || m.t1 <= T) continue;
        g.setTransform(scale, 0, 0, scale, -this.bb.x0 * scale, -this.bb.y0 * scale);
        g.save();
        m.bakeTo(g, (T - m.t0) / (m.t1 - m.t0));
        g.restore();
      }
      this.T = T;
    }
    // draw at its page position (ctx in page units), including marks still being inked
    drawOnPage(ctx, T) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(this.canvas, this.bb.x0, this.bb.y0, this.bb.x1 - this.bb.x0, this.bb.y1 - this.bb.y0);
      ctx.restore();
      const marks = this.page.marks;
      for (let i = this.idx; i < marks.length; i++) {
        const m = marks[i];
        if (m.t0 <= T && m.t1 > T) {
          ctx.save();
          if (m.drawLive) m.drawLive(ctx, (T - m.t0) / (m.t1 - m.t0));
          else m.draw(ctx, (T - m.t0) / (m.t1 - m.t0), this.env);
          ctx.restore();
        }
      }
    }
    // paper cut-out: paper inside the outline with the ink multiplied on top
    cutout(paper) {
      if (this.cut) return this.cut;
      const c = U.canvas(this.canvas.width, this.canvas.height);
      const g = c.getContext('2d');
      const s = this.scale;
      const bw = this.bb.x1 - this.bb.x0, bh = this.bb.y1 - this.bb.y0;
      if (this.outline) {
        g.setTransform(s, 0, 0, s, -this.bb.x0 * s, -this.bb.y0 * s);
        U.poly(g, this.outline);
        g.save();
        g.clip();
        if (paper) {
          const k = paper.width / PW;
          g.drawImage(paper, 40 * k, 60 * k, bw * k, bh * k, this.bb.x0, this.bb.y0, bw, bh);
        } else {
          g.fillStyle = '#ece0c6';
          g.fillRect(this.bb.x0, this.bb.y0, bw, bh);
        }
        g.restore();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.drawImage(this.canvas, 0, 0);
      g.globalCompositeOperation = 'source-over';
      this.cut = c;
      return c;
    }
  }
  B.InkSprite = InkSprite;

  // ------------------------------------------------------------ view (camera for one frame)
  class View {
    constructor() {
      this.cx = 0; this.cy = PH / 2; this.zoom = 1; this.rot = 0;
      this.W = 1; this.H = 1; this.dpr = 1;
      this.d = 5600; // camera height above the desk, for perspective
    }
    set(cx, cy, zoom, rot, W, H, dpr) {
      this.cx = cx; this.cy = cy; this.zoom = zoom; this.rot = rot || 0;
      this.W = W; this.H = H; this.dpr = dpr;
      const S = zoom * dpr;
      const c = Math.cos(this.rot), s = Math.sin(this.rot);
      this.m = [S * c, S * s, -S * s, S * c, 0, 0];
      this.m[4] = (W * dpr) / 2 - (this.m[0] * cx + this.m[2] * cy);
      this.m[5] = (H * dpr) / 2 - (this.m[1] * cx + this.m[3] * cy);
      this.pxPerUnit = S;
    }
    apply(ctx, scale) {
      const m = this.m;
      if (scale) ctx.setTransform(m[0] * scale, m[1] * scale, m[2] * scale, m[3] * scale, m[4] * scale, m[5] * scale);
      else ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    }
    k(z) { return this.d / Math.max(200, this.d - z); }
    // perspective: where a point lifted to height z appears in spread space
    proj(x, y, z) {
      const k = this.k(z);
      return [this.cx + (x - this.cx) * k, this.cy + (y - this.cy) * k, k];
    }
    // enter a local frame for an object at (x, y) lifted to z: draw around the origin afterwards
    lift(ctx, x, y, z) {
      const p = this.proj(x, y, z);
      ctx.translate(p[0], p[1]);
      ctx.scale(p[2], p[2]);
      return p;
    }
    toScreen(x, y) {
      const m = this.m;
      return [(m[0] * x + m[2] * y + m[4]) / this.dpr, (m[1] * x + m[3] * y + m[5]) / this.dpr];
    }
    // spread-space rectangle currently visible (axis-aligned bound, ignoring roll)
    visible() {
      const hw = (this.W / 2) / this.zoom, hh = (this.H / 2) / this.zoom;
      const r = Math.abs(this.rot) * Math.max(hw, hh);
      return { x0: this.cx - hw - r, x1: this.cx + hw + r, y0: this.cy - hh - r, y1: this.cy + hh + r };
    }
  }
  B.View = View;

  // Light comes from a lamp up and to the left; shadows fall down and to the right.
  B.LIGHT = { sx: 0.34, sy: 0.22 };

  // ------------------------------------------------------------ sheet geometry for a turn
  // Returns cross-section samples of a curling sheet: x outward from the spine, z up.
  B.sheetProfile = function (p, w, bend, N) {
    N = N || 64;
    const e = U.sat(p);
    const theta = Math.PI * (0.5 * U.easeInOut(e) + 0.5 * U.easeInOutSine(e));
    const beta = bend * Math.sin(Math.PI * e);
    const xs = new Float32Array(N + 1), zs = new Float32Array(N + 1), ph = new Float32Array(N + 1);
    let x = 0, z = 0;
    ph[0] = U.clamp(theta, 0, Math.PI);
    for (let i = 1; i <= N; i++) {
      const sm = (i - 0.5) / N;
      // a near-uniform curl: the outer edge leads, the page arcs over like a wave
      const phi = U.clamp(theta + beta * Math.pow(sm, 0.8), 0, Math.PI);
      const ds = w / N;
      x += Math.cos(phi) * ds;
      z += Math.sin(phi) * ds;
      xs[i] = x; zs[i] = z; ph[i] = phi;
    }
    return { xs, zs, ph, N, w };
  };

  // Draw a turning sheet as strips. sheet: {side, w, y0, h, front, back, frontSpine, backSpine, p, bend}
  // front/back are canvases (or null for blank paper); *Spine says which image edge is at the spine.
  B.drawSheet = function (ctx, view, sheet, shadowCtx) {
    const prof = B.sheetProfile(sheet.p, sheet.w, sheet.bend, sheet.N || 72);
    const { xs, zs, ph, N } = prof;
    const side = sheet.side;
    const y0 = sheet.y0, h = sheet.h;
    const Lx = -0.42, Lz = 0.9;
    const base = Lz;
    // shadow on whatever lies beneath
    if (shadowCtx) {
      for (let i = 0; i < N; i++) {
        const z = (zs[i] + zs[i + 1]) / 2;
        if (z < 1) continue;
        const a = 0.55 * Math.exp(-z / 700) * U.smoothstep(0, 40, z);
        const xa = side * xs[i] + z * B.LIGHT.sx, xb = side * xs[i + 1] + z * B.LIGHT.sx;
        shadowCtx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
        shadowCtx.fillRect(Math.min(xa, xb) - 1, y0 + z * B.LIGHT.sy, Math.abs(xb - xa) + 2, h);
      }
    }
    if (!ctx) return prof;
    for (let i = 0; i < N; i++) {
      const za = zs[i], zb = zs[i + 1];
      const ka = view.k(za), kb = view.k(zb);
      const Xa = view.cx + (side * xs[i] - view.cx) * ka;
      const Xb = view.cx + (side * xs[i + 1] - view.cx) * kb;
      const dx = Xb - Xa;
      if (Math.abs(dx) < 0.05) continue;
      const frontVisible = dx * side > 0;
      const km = (ka + kb) / 2;
      const top = view.cy + (y0 - view.cy) * km;
      const hh = h * km;
      const img = frontVisible ? sheet.front : sheet.back;
      const spine = frontVisible ? sheet.frontSpine : sheet.backSpine; // 'L' spine at image left, 'R' at right
      const s0 = (i / N) * sheet.w, s1 = ((i + 1) / N) * sheet.w;
      const dl = Math.min(Xa, Xb), dw = Math.abs(dx);
      if (img) {
        const sc = img.width / sheet.w;
        let sx0, sx1;
        if (spine === 'L') { sx0 = s0; sx1 = s1; } else { sx0 = sheet.w - s1; sx1 = sheet.w - s0; }
        ctx.drawImage(img, sx0 * sc, 0, Math.max(0.5, (sx1 - sx0) * sc), img.height, dl - 0.35, top, dw + 0.7, hh);
      } else {
        ctx.fillStyle = '#ece0c6';
        ctx.fillRect(dl - 0.35, top, dw + 0.7, hh);
      }
      // lighting
      const phi = (ph[i] + ph[i + 1]) / 2;
      let nx = side * -Math.sin(phi), nz = Math.cos(phi);
      if (!frontVisible) { nx = -nx; nz = -nz; }
      const lum = (nx * Lx + nz * Lz) / base;
      if (lum < 1) ctx.fillStyle = `rgba(20,12,6,${U.clamp((1 - lum) * 0.55, 0, 0.75).toFixed(3)})`;
      else ctx.fillStyle = `rgba(255,246,225,${U.clamp((lum - 1) * 0.6, 0, 0.3).toFixed(3)})`;
      ctx.fillRect(dl - 0.35, top, dw + 0.7, hh);
    }
    return prof;
  };
})((window.Codex = window.Codex || {}));
