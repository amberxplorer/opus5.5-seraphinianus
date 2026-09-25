/* Codicillus Seraphinianus — illustration geometry and the authoring kit used by every scene.
   Geometry helpers return point arrays in page units; the kit turns them into timed marks. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic;
  const D = (C.Draw = {});
  const TAU = Math.PI * 2;

  // A local frame: P(u, v) = origin + u·dir + v·normal
  D.frame = function (x, y, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return (u, v) => [x + c * u - s * v, y + s * u + c * v];
  };

  // ------------------------------------------------------------ feathers, wings, eyes
  D.feather = function (x, y, a, len, w, rand) {
    const P = D.frame(x, y, a);
    const j = () => (rand ? rand.range(-0.04, 0.04) * w : 0);
    const outline = [P(0, 0), P(len * 0.2, w * 0.75 + j()), P(len * 0.55, w + j()), P(len * 0.86, w * 0.62 + j()), P(len, 0), P(len * 0.88, -w * 0.5 + j()), P(len * 0.58, -w * 0.92 + j()), P(len * 0.22, -w * 0.7 + j()), P(0, 0)];
    const quill = [P(-len * 0.06, 0), P(len * 0.45, w * 0.06), P(len * 0.96, 0)];
    const barbs = [];
    for (let i = 1; i < 7; i++) {
      const u = len * (0.14 + i * 0.12);
      const side = i % 2 ? 1 : -1;
      const ww = w * (0.85 - Math.abs(0.5 - u / len) * 0.8);
      barbs.push([P(u, side * 0.05 * w), P(u + len * 0.1, side * ww * 0.85)]);
    }
    return { outline, quill, barbs };
  };

  // Almond eye with iris, pupil and lashes. look = [-1..1, -1..1] shifts the iris.
  D.eye = function (cx, cy, w, h, o) {
    o = o || {};
    const a = o.angle || 0;
    const P = D.frame(cx, cy, a);
    const open = o.open === undefined ? 1 : o.open;
    const upper = [], lower = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = (t - 0.5) * w;
      const b = Math.sin(t * Math.PI);
      upper.push(P(u, -h * 0.5 * b * open));
      lower.push(P(u, h * 0.42 * b));
    }
    const look = o.look || [0, 0];
    const ir = h * 0.36 * (o.iris || 1);
    const ix = look[0] * w * 0.14, iy = look[1] * h * 0.08;
    const iris = U.circle(0, 0, ir, 28).map((p) => P(p[0] + ix, p[1] + iy));
    const pupil = U.circle(0, 0, ir * 0.42, 16).map((p) => P(p[0] + ix, p[1] + iy));
    const lashes = [];
    const nl = o.lashes === undefined ? 7 : o.lashes;
    for (let i = 0; i < nl; i++) {
      const t = 0.2 + (i / (nl - 1)) * 0.6;
      const p = upper[Math.round(t * n)];
      const nx = (t - 0.5) * 1.2, ny = -1;
      const L = h * 0.32 * (1 - Math.abs(t - 0.5));
      const q = D.frame(0, 0, a)(nx * L, ny * L);
      lashes.push([p, [p[0] + q[0], p[1] + q[1]]]);
    }
    const almond = upper.concat(lower.slice().reverse());
    return { upper, lower, iris, pupil, lashes, almond, center: P(ix, iy), ir };
  };

  // A bird-like wing: feathers fan from an arm (quadratic curve root → elbow → tip).
  D.wing = function (root, elbow, tip, trail, n, flen, rand, fan) {
    fan = fan || [1.5, 0.18];
    const arm = (t) => {
      const it = 1 - t;
      return [it * it * root[0] + 2 * it * t * elbow[0] + t * t * tip[0], it * it * root[1] + 2 * it * t * elbow[1] + t * t * tip[1]];
    };
    const tan = (t) => {
      const it = 1 - t;
      const dx = 2 * it * (elbow[0] - root[0]) + 2 * t * (tip[0] - elbow[0]);
      const dy = 2 * it * (elbow[1] - root[1]) + 2 * t * (tip[1] - elbow[1]);
      return Math.atan2(dy, dx);
    };
    const feathers = [];
    for (let k = 0; k < n; k++) {
      const t = 0.12 + 0.88 * (k / (n - 1));
      const b = arm(t);
      const a = tan(t) + trail * U.lerp(fan[0], fan[1], Math.pow(t, 1.3));
      const len = flen * U.lerp(0.42, 1.0, Math.pow(t, 0.7));
      feathers.push(D.feather(b[0], b[1], a, len, len * 0.2, rand));
    }
    const edge = [];
    for (let i = 0; i <= 20; i++) edge.push(arm(i / 20));
    // scalloped coverts along the leading edge
    const cov = [];
    for (let i = 0; i <= 36; i++) {
      const t = 0.05 + (i / 36) * 0.8;
      const p = arm(t), a = tan(t) + trail * Math.PI / 2;
      const sc = Math.abs(Math.sin(i * Math.PI / 3)) * flen * 0.09 + flen * 0.03;
      cov.push([p[0] + Math.cos(a) * sc, p[1] + Math.sin(a) * sc]);
    }
    return { feathers, edge, covert: cov };
  };

  // Seraph: six wings — two raised, two spread, two lowered — around a watching eye.
  D.seraph = function (cx, cy, R, rand) {
    rand = rand || new U.Rand('seraph');
    const P = (x, y) => [cx + x * R, cy + y * R];
    const spec = [
      // lowered pair
      [P(0.06, 0.12), P(0.42, 0.42), P(0.14, 0.86), -1, 7, 0.42],
      [P(-0.06, 0.12), P(-0.42, 0.42), P(-0.14, 0.86), 1, 7, 0.42],
      // spread pair
      [P(0.16, 0.0), P(0.6, -0.34), P(0.98, -0.22), 1, 9, 0.66, [1.75, 0.55]],
      [P(-0.16, 0.0), P(-0.6, -0.34), P(-0.98, -0.22), -1, 9, 0.66, [1.75, 0.55]],
      // raised pair
      [P(0.07, -0.13), P(0.46, -0.52), P(0.12, -0.98), 1, 8, 0.5],
      [P(-0.07, -0.13), P(-0.46, -0.52), P(-0.12, -0.98), -1, 8, 0.5],
    ];
    const wings = spec.map((w) => {
      const wing = D.wing(w[0], w[1], w[2], w[3], w[4], w[5] * R, rand, w[6]);
      wing.feathers.reverse();
      return wing;
    });
    const eye = D.eye(cx, cy, R * 0.5, R * 0.28, { lashes: 11 });
    const halo = U.circle(cx, cy, R * 1.12, 90);
    return { wings, eye, halo };
  };

  // ------------------------------------------------------------ plants
  D.leaf = function (x, y, a, len, w, o) {
    o = o || {};
    const P = D.frame(x, y, a);
    const tip = o.tip === undefined ? 1 : o.tip;
    const bend = o.bend || 0;
    const B = (u) => bend * Math.sin(u * Math.PI) * len;
    const out = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const half = w * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9) * (1 - 0.3 * u * tip);
      out.push(P(u * len, half + B(u)));
    }
    for (let i = n - 1; i >= 1; i--) {
      const u = i / n;
      const half = w * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9) * (1 - 0.3 * u * tip);
      out.push(P(u * len, -half + B(u)));
    }
    out.push(P(0, 0));
    const mid = [];
    for (let i = 0; i <= 8; i++) mid.push(P((i / 8) * len * 0.96, B(i / 8)));
    const veins = [];
    for (let i = 1; i < 6; i++) {
      const u = i / 6.5;
      const s = i % 2 ? 1 : -1;
      const half = w * Math.sin(Math.PI * Math.pow(u, 0.8)) * 0.8;
      veins.push([P(u * len, B(u)), P((u + 0.12) * len, s * half + B(u + 0.12))]);
      veins.push([P(u * len + len * 0.04, B(u)), P((u + 0.16) * len, -s * half * 0.9 + B(u + 0.16))]);
    }
    return { outline: out, mid, veins };
  };

  // Stem from (x, y) growing along angle with curl; returns dense points.
  D.stem = function (x, y, a, len, curl, rand, o) {
    o = o || {};
    const pts = [[x, y]];
    let ang = a, px = x, py = y;
    const n = Math.max(8, Math.round(len / 6));
    const wig = o.wig === undefined ? 0.04 : o.wig;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      ang += (curl / n) * (o.curlEnd ? t * 2 : 1) + (rand ? rand.range(-wig, wig) : 0);
      px += Math.cos(ang) * (len / n);
      py += Math.sin(ang) * (len / n);
      pts.push([px, py]);
    }
    return pts;
  };

  // A ribbon (band) of varying width along a path → closed polygon.
  D.ribbon = function (path, wfn) {
    const L = [], R = [];
    const n = path.length;
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      const w = wfn(i / (n - 1)) / 2;
      L.push([path[i][0] + nx * w, path[i][1] + ny * w]);
      R.push([path[i][0] - nx * w, path[i][1] - ny * w]);
    }
    return L.concat(R.reverse());
  };

  // ------------------------------------------------------------ machines
  D.gear = function (cx, cy, r, teeth, o) {
    o = o || {};
    const rot = o.rot || 0;
    const depth = o.depth || r * 0.14;
    const pts = [];
    for (let i = 0; i < teeth; i++) {
      const a0 = rot + (i / teeth) * TAU;
      const da = TAU / teeth;
      pts.push([cx + Math.cos(a0) * (r - depth), cy + Math.sin(a0) * (r - depth)]);
      pts.push([cx + Math.cos(a0 + da * 0.18) * r, cy + Math.sin(a0 + da * 0.18) * r]);
      pts.push([cx + Math.cos(a0 + da * 0.5) * r, cy + Math.sin(a0 + da * 0.5) * r]);
      pts.push([cx + Math.cos(a0 + da * 0.68) * (r - depth), cy + Math.sin(a0 + da * 0.68) * (r - depth)]);
    }
    return pts;
  };

  // ------------------------------------------------------------ misc
  D.ellipse = (cx, cy, rx, ry, n, a0) => U.circle(cx, cy, rx, n || 40, a0 || 0, ry);
  D.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  D.roundRect = function (x, y, w, h, r, n) {
    n = n || 5;
    const out = [];
    const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    return out;
  };
  D.close = (pts) => pts.concat([pts[0]]);

  // ------------------------------------------------------------ authoring kit
  const K = (C.Kit = {});
  K.PAL = Ink.PAL;

  K.stroke = function (page, pts, t0, t1, o) { const m = Ink.stroke(pts, t0, t1, o); page.add(m); return m; };
  K.raw = function (page, pts, t0, t1, o) { const m = Ink.stroke(pts, t0, t1, Object.assign({ raw: true }, o)); page.add(m); return m; };
  K.outline = function (page, poly, t0, t1, o) { const m = Ink.outline(poly, t0, t1, o); page.add(m); return m; };
  K.wash = function (page, poly, color, t0, t1, o) { const m = Ink.wash(poly, color, t0, t1, o); page.add(m); return m; };
  K.pencil = function (page, poly, color, t0, t1, o) { const m = Ink.pencil(poly, color, t0, t1, o); page.add(m); return m; };
  K.hatch = function (page, poly, t0, t1, o) { const m = Ink.hatch(poly, t0, t1, o); page.add(m); return m; };
  K.strokes = function (page, strokes, t0, t1, o) { const m = new Ink.StrokeMark(strokes, t0, t1, o); page.add(m); return m; };
  K.lines = function (page, segs, t0, t1, o) {
    o = o || {};
    const strokes = segs.map((s, i) => Ink.path(s, Object.assign({ seed: i, w: 1 }, o)));
    return K.strokes(page, strokes, t0, t1, { mode: o.mode || 'seq', gap: o.gap });
  };

  // Written text: a block that writes itself with several invisible pens.
  K.text = function (page, bo, t0, wo) {
    const block = A.block(bo);
    const marks = A.write(block, t0, wo);
    page.add(marks);
    block.end = marks.end;
    block.marks = marks;
    return block;
  };
  K.printed = function (page, bo, t) {
    const block = A.block(bo);
    const marks = A.printed(block, t);
    page.add(marks);
    block.marks = marks;
    return block;
  };
  K.label = function (page, x, y, size, n, t0, t1, o) {
    const lab = A.label(x, y, size, n, o);
    const m = K.strokes(page, lab.strokes, t0, t1, { mode: 'seq', gap: 0.3 });
    lab.mark = m;
    for (const w of lab.words) w.mark = m;
    return lab;
  };
  // Running head and base-21 page number, already printed when the page appears.
  K.furniture = function (page, num, side, t, o) {
    o = o || {};
    const rand = new U.Rand('furn' + num);
    const head = A.label(500, 78, 6.2, o.headWords || 2, { center: true, rand, alpha: 0.9 });
    page.add(new Ink.StrokeMark(head.strokes, t, t));
    const nx = side === 'L' ? 90 : 910;
    const numS = A.numeral(num, nx, 1356, 8.5, { center: true });
    page.add(new Ink.StrokeMark(numS, t, t));
    return { head };
  };
  // A thin double frame around an illustration.
  K.frame = function (page, x, y, w, h, t0, t1, o) {
    o = o || {};
    const r = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 0.5]];
    const g = o.gap || 5;
    const r2 = [[x - g, y - g], [x + w + g, y - g], [x + w + g, y + h + g], [x - g, y + h + g], [x - g, y - g + 0.5]];
    const s1 = Ink.rule(r, { w: o.w || 1.1, color: o.color });
    const s2 = Ink.rule(r2, { w: (o.w || 1.1) * 0.6, color: o.color });
    return K.strokes(page, [s1, s2], t0, t1, { mode: 'par' });
  };
  // Leader line from a label to a detail.
  K.leader = function (page, x0, y0, x1, y1, t0, t1) {
    return K.stroke(page, [[x0, y0], [(x0 + x1) / 2 + (y1 - y0) * 0.08, (y0 + y1) / 2], [x1, y1]], t0, t1, { w: 0.55, tIn: 1, tOut: 2 });
  };
})((window.Codex = window.Codex || {}));
