/* Codicillus Seraphinianus — shared utilities: randomness, noise, easing, geometry, colour. */
(function (C) {
  'use strict';
  const U = (C.U = {});

  // ------------------------------------------------------------------ random
  U.hash = function (str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  U.mulberry32 = function (a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  class Rand {
    constructor(seed) {
      this.f = U.mulberry32(typeof seed === 'number' ? seed >>> 0 : U.hash(seed));
    }
    next() { return this.f(); }
    range(a, b) { return a + (b - a) * this.f(); }
    int(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
    chance(p) { return this.f() < p; }
    sign() { return this.f() < 0.5 ? -1 : 1; }
    gauss() {
      let u = 0;
      while (u === 0) u = this.f();
      const v = this.f();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    weighted(weights) {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) sum += weights[i];
      let r = this.f() * sum;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
      }
      return weights.length - 1;
    }
    fork(tag) { return new Rand((Math.floor(this.f() * 4294967296) ^ U.hash(String(tag))) >>> 0); }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.f() * (i + 1));
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
  }
  U.Rand = Rand;

  // ------------------------------------------------------------------ noise
  // Seeded 2D simplex noise (after Stefan Gustavson), returns roughly [-1, 1].
  U.makeNoise2D = function (seed) {
    const r = new Rand(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    r.shuffle(p);
    const perm = new Uint8Array(512);
    const pm12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }
    const gx = [1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0];
    const gy = [1, 1, -1, -1, 0, 0, 0, 0, 1, -1, 1, -1];
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    return function (xin, yin) {
      let n0 = 0, n1 = 0, n2 = 0;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t);
      const y0 = yin - (j - t);
      let i1, j1;
      if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) { const g = pm12[ii + perm[jj]]; t0 *= t0; n0 = t0 * t0 * (gx[g] * x0 + gy[g] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) { const g = pm12[ii + i1 + perm[jj + j1]]; t1 *= t1; n1 = t1 * t1 * (gx[g] * x1 + gy[g] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) { const g = pm12[ii + 1 + perm[jj + 1]]; t2 *= t2; n2 = t2 * t2 * (gx[g] * x2 + gy[g] * y2); }
      return 70 * (n0 + n1 + n2);
    };
  };

  U.fbm = function (noise, x, y, oct, lac, gain) {
    oct = oct || 4; lac = lac || 2; gain = gain || 0.5;
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * noise(x * f, y * f);
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  };

  // A global noise field used for hand-drawn wobble and ambient motion.
  U.noise = U.makeNoise2D('codicillus');

  // ------------------------------------------------------------------ math
  U.clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  U.sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, x) => (x - a) / (b - a);
  U.map = (x, a, b, c, d) => c + ((x - a) / (b - a)) * (d - c);
  U.smoothstep = (e0, e1, x) => {
    const t = U.sat((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  U.win = (T, t0, t1) => U.sat((T - t0) / (t1 - t0));
  U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  U.easeIn = (t) => t * t * t;
  U.easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  U.easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
  U.easeInQuad = (t) => t * t;
  U.easeOutBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  U.bump = (t) => Math.sin(Math.PI * U.sat(t)); // 0 → 1 → 0
  U.TAU = Math.PI * 2;
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.angLerp = (a, b, t) => {
    let d = ((b - a + Math.PI) % U.TAU) - Math.PI;
    if (d < -Math.PI) d += U.TAU;
    return a + d * t;
  };

  // ------------------------------------------------------------------ geometry
  // Centripetal Catmull–Rom through points; `step` is the target spacing.
  U.catmull = function (pts, step, closed, alpha) {
    step = step || 1;
    alpha = alpha === undefined ? 0.5 : alpha;
    const n = pts.length;
    if (n < 2) return pts.map((p) => [p[0], p[1]]);
    const out = [];
    const P = (i) => {
      if (closed) return pts[(i + n) % n];
      if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
      if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
      return pts[i];
    };
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const d01 = Math.max(1e-4, Math.pow(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), alpha));
      const d12 = Math.max(1e-4, Math.pow(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), alpha));
      const d23 = Math.max(1e-4, Math.pow(Math.hypot(p3[0] - p2[0], p3[1] - p2[1]), alpha));
      const t0 = 0, t1 = d01, t2 = t1 + d12, t3 = t2 + d23;
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const m = Math.max(2, Math.ceil((segLen * 1.25) / step));
      for (let k = 0; k < m; k++) {
        const t = t1 + ((t2 - t1) * k) / m;
        const a1x = ((t1 - t) / (t1 - t0)) * p0[0] + ((t - t0) / (t1 - t0)) * p1[0];
        const a1y = ((t1 - t) / (t1 - t0)) * p0[1] + ((t - t0) / (t1 - t0)) * p1[1];
        const a2x = ((t2 - t) / (t2 - t1)) * p1[0] + ((t - t1) / (t2 - t1)) * p2[0];
        const a2y = ((t2 - t) / (t2 - t1)) * p1[1] + ((t - t1) / (t2 - t1)) * p2[1];
        const a3x = ((t3 - t) / (t3 - t2)) * p2[0] + ((t - t2) / (t3 - t2)) * p3[0];
        const a3y = ((t3 - t) / (t3 - t2)) * p2[1] + ((t - t2) / (t3 - t2)) * p3[1];
        const b1x = ((t2 - t) / (t2 - t0)) * a1x + ((t - t0) / (t2 - t0)) * a2x;
        const b1y = ((t2 - t) / (t2 - t0)) * a1y + ((t - t0) / (t2 - t0)) * a2y;
        const b2x = ((t3 - t) / (t3 - t1)) * a2x + ((t - t1) / (t3 - t1)) * a3x;
        const b2y = ((t3 - t) / (t3 - t1)) * a2y + ((t - t1) / (t3 - t1)) * a3y;
        out.push([
          ((t2 - t) / (t2 - t1)) * b1x + ((t - t1) / (t2 - t1)) * b2x,
          ((t2 - t) / (t2 - t1)) * b1y + ((t - t1) / (t2 - t1)) * b2y,
        ]);
      }
    }
    if (closed) out.push([out[0][0], out[0][1]]);
    else out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  };

  // Straight polyline with evenly spaced points (corners stay sharp).
  U.densify = function (pts, step) {
    step = step || 2;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    return out;
  };

  U.pathLen = function (pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  };

  U.resample = function (pts, step) {
    if (pts.length < 2) return pts.slice();
    const out = [[pts[0][0], pts[0][1]]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1];
      const bx = pts[i][0], by = pts[i][1];
      const d = Math.hypot(bx - ax, by - ay);
      let s = step - carry;
      while (s <= d) {
        const t = s / d;
        out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
        s += step;
      }
      carry = d - (s - step);
    }
    const last = pts[pts.length - 1];
    const pl = out[out.length - 1];
    if (Math.hypot(last[0] - pl[0], last[1] - pl[1]) > step * 0.2) out.push([last[0], last[1]]);
    return out;
  };

  // Point at fraction u along a polyline (with its tangent angle).
  U.pointAt = function (pts, u) {
    const L = U.pathLen(pts);
    let target = U.sat(u) * L;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (target <= d || i === pts.length - 1) {
        const t = d > 0 ? U.sat(target / d) : 0;
        return {
          x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
          a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]),
        };
      }
      target -= d;
    }
    return { x: pts[0][0], y: pts[0][1], a: 0 };
  };

  U.bbox = function (pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[0] > x1) x1 = p[0];
      if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  };

  U.pointInPoly = function (x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  // Keep the part of a convex-or-not polygon where (P - (px,py)) · (nx,ny) >= 0 (Sutherland–Hodgman).
  U.clipHalfPlane = function (poly, px, py, nx, ny) {
    const out = [];
    const side = (p) => (p[0] - px) * nx + (p[1] - py) * ny;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) {
        const t = sa / (sa - sb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };

  // Parallel hatch segments filling a polygon. Returns [[x0,y0,x1,y1], ...].
  U.hatch = function (poly, angle, spacing, rand, opt) {
    opt = opt || {};
    const ca = Math.cos(-angle), sa = Math.sin(-angle);
    const rp = poly.map((p) => [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca]);
    const bb = U.bbox(rp);
    const segs = [];
    const jitter = opt.jitter === undefined ? 0.25 : opt.jitter;
    const inset = opt.inset || 0;
    let row = 0;
    for (let y = bb.y0 + spacing * (0.5 + (rand ? rand.range(-0.3, 0.3) : 0)); y < bb.y1; y += spacing) {
      const xs = [];
      for (let i = 0, j = rp.length - 1; i < rp.length; j = i++) {
        const a = rp[j], b = rp[i];
        if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        let xa = xs[k] + inset, xb = xs[k + 1] - inset;
        if (xb - xa < spacing * 0.6) continue;
        if (rand) {
          xa += rand.range(-jitter, jitter) * spacing * 1.5;
          xb += rand.range(-jitter, jitter) * spacing * 1.5;
          if (opt.gaps && rand.chance(opt.gaps)) continue;
        }
        const yy = y + (rand ? rand.range(-jitter, jitter) * spacing * 0.3 : 0);
        const yb = yy + (rand ? rand.range(-0.4, 0.4) * spacing * (opt.slope || 0.4) : 0);
        // rotate back
        const c2 = Math.cos(angle), s2 = Math.sin(angle);
        const X0 = xa * c2 - yy * s2, Y0 = xa * s2 + yy * c2;
        const X1 = xb * c2 - yb * s2, Y1 = xb * s2 + yb * c2;
        segs.push(row % 2 && opt.boustro ? [X1, Y1, X0, Y0] : [X0, Y0, X1, Y1]);
      }
      row++;
    }
    return segs;
  };

  U.circle = function (cx, cy, r, n, a0, ry) {
    n = n || 48;
    a0 = a0 || 0;
    ry = ry === undefined ? r : ry;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * U.TAU;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
    }
    return out;
  };

  U.arc = function (cx, cy, r, a0, a1, n, ry) {
    n = n || 24;
    ry = ry === undefined ? r : ry;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
    }
    return out;
  };

  U.xform = function (pts, x, y, s, rot, sy) {
    const c = Math.cos(rot || 0), sn = Math.sin(rot || 0);
    sy = sy === undefined ? s : sy;
    return pts.map((p) => {
      const px = p[0] * s, py = p[1] * sy;
      return [x + px * c - py * sn, y + px * sn + py * c];
    });
  };

  // Low-frequency hand tremor applied perpendicular-ish to a path.
  U.wobble = function (pts, amp, freq, seed) {
    const off = (seed || 0) * 17.13;
    let s = 0;
    return pts.map((p, i) => {
      if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      return [p[0] + amp * U.noise(s * freq, off), p[1] + amp * U.noise(off + 3.7, s * freq)];
    });
  };

  // Outward/inward noisy deformation of a closed polygon (used for washes).
  U.deform = function (poly, amp, freq, seed) {
    const c = U.bbox(poly);
    return poly.map((p) => {
      const dx = p[0] - c.cx, dy = p[1] - c.cy;
      const d = Math.hypot(dx, dy) || 1;
      const n = U.fbm(U.noise, p[0] * freq + seed * 3.1, p[1] * freq - seed * 1.7, 3);
      return [p[0] + (dx / d) * n * amp, p[1] + (dy / d) * n * amp];
    });
  };

  // Mirror/offset helpers
  U.offsetPts = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);
  U.reversePts = (pts) => pts.slice().reverse();

  // Quadratic/cubic bezier sampling
  U.bez3 = function (p0, p1, p2, p3, n) {
    n = n || 24;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, it = 1 - t;
      out.push([
        it * it * it * p0[0] + 3 * it * it * t * p1[0] + 3 * it * t * t * p2[0] + t * t * t * p3[0],
        it * it * it * p0[1] + 3 * it * it * t * p1[1] + 3 * it * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  };

  // ------------------------------------------------------------------ colour
  U.hex = function (h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const v = parseInt(h, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  U.rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a === undefined ? 1 : a})`;
  U.mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // ------------------------------------------------------------------ canvas
  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  };
  U.poly = function (ctx, pts, close) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (close !== false) ctx.closePath();
  };
})((window.Codex = window.Codex || {}));
