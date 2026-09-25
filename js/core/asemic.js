/* Codicillus Seraphinianus — an asemic script.
   Thread-like cursive letters with loops and knots, a Zipfian lexicon so that words recur
   the way words do, capitals at the start of sentences, diacritics, and base-21 numerals.
   Glyph skeletons are drawn in a small design space: baseline y = 0, x-height y = 1, y up. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink;
  const A = (C.Asemic = {});

  // ------------------------------------------------------------------ glyphs
  // c: 'x' x-height, 'a' ascender, 'd' descender; f: relative frequency
  const GL = [
    { n: 'cup', c: 'x', f: 4.5, adv: 0.95, p: [[0, 0.08], [0.16, 0.55], [0.2, 0.82], [0.25, 0.35], [0.45, 0.04], [0.68, 0.2], [0.78, 0.72], [0.8, 0.35], [0.95, 0.08]], dia: 'dot', dy: 1.2 },
    { n: 'knot', c: 'x', f: 10, adv: 0.72, p: [[0, 0.1], [0.3, 0.14], [0.46, 0.46], [0.36, 0.64], [0.22, 0.46], [0.4, 0.18], [0.72, 0.1]] },
    { n: 'alif', c: 'a', f: 6, adv: 0.72, p: [[0, 0.1], [0.25, 0.6], [0.35, 1.3], [0.15, 2.0], [-0.05, 2.1], [0.02, 1.8], [0.25, 1.62], [0.42, 1.76], [0.32, 1.92], [0.28, 1.2], [0.3, 0.3], [0.42, 0.02], [0.72, 0.12]] },
    { n: 'bowl', c: 'x', f: 7, adv: 0.9, p: [[0, 0.1], [0.06, 0.55], [0.2, 0.95], [0.44, 0.98], [0.6, 0.7], [0.56, 0.25], [0.36, 0.04], [0.18, 0.2], [0.25, 0.44], [0.4, 0.38], [0.44, 0.2], [0.62, 0.05], [0.9, 0.1]] },
    { n: 'hump', c: 'x', f: 6, adv: 0.88, p: [[0, 0.05], [0.12, 0.8], [0.25, 0.96], [0.36, 0.55], [0.3, 0.3], [0.2, 0.4], [0.35, 0.56], [0.5, 0.95], [0.62, 0.8], [0.66, 0.1], [0.88, 0.1]] },
    { n: 'curl', c: 'x', f: 6, adv: 0.75, p: [[0, 0.1], [0.35, 0.4], [0.55, 0.9], [0.46, 1.16], [0.3, 1.06], [0.35, 0.88], [0.48, 0.95], [0.45, 0.6], [0.3, 0.2], [0.42, 0.02], [0.75, 0.1]] },
    { n: 'wave', c: 'x', f: 6, adv: 1.05, p: [[0, 0.1], [0.2, 0.26], [0.45, 0.05], [0.65, 0.28], [0.73, 0.47], [0.62, 0.52], [0.6, 0.35], [0.8, 0.12], [1.05, 0.1]] },
    { n: 'flag', c: 'a', f: 5, adv: 0.7, p: [[0, 0.1], [0.2, 0.9], [0.28, 1.8], [0.4, 2.05], [0.6, 1.9], [0.42, 1.7], [0.3, 1.76], [0.3, 0.4], [0.42, 0.02], [0.7, 0.12]] },
    { n: 'drop', c: 'd', f: 4, adv: 0.78, p: [[0, 0.25], [0.22, 0.75], [0.4, 0.86], [0.48, 0.5], [0.4, -0.3], [0.5, -0.9], [0.72, -0.95], [0.75, -0.6], [0.45, -0.2], [0.4, 0.1], [0.78, 0.15]] },
    { n: 'saucer', c: 'x', f: 4, adv: 0.82, p: [[0, 0.5], [0.1, 0.1], [0.35, 0.0], [0.55, 0.25], [0.6, 0.7], [0.5, 0.96], [0.4, 0.75], [0.55, 0.45], [0.82, 0.3]], dia: 'dotb' },
    { n: 'infinity', c: 'x', f: 4, adv: 0.88, p: [[0, 0.1], [0.15, 0.4], [0.3, 0.56], [0.45, 0.36], [0.6, 0.15], [0.78, 0.3], [0.65, 0.5], [0.45, 0.36], [0.3, 0.15], [0.5, 0.02], [0.88, 0.1]] },
    { n: 'hook', c: 'a', f: 4, adv: 0.68, p: [[0, 0.2], [0.3, 0.95], [0.2, 1.32], [0.05, 1.22], [0.15, 1.0], [0.35, 0.7], [0.4, 0.3], [0.3, 0.0], [0.15, 0.1], [0.3, 0.2], [0.68, 0.12]] },
    { n: 'zig', c: 'x', f: 3, adv: 0.82, p: [[0, 0.15], [0.25, 0.85], [0.35, 0.4], [0.5, 0.86], [0.6, 0.35], [0.5, 0.25], [0.55, 0.1], [0.82, 0.12]] },
    { n: 'eye', c: 'a', f: 4, adv: 0.72, p: [[0, 0.1], [0.2, 0.6], [0.25, 1.1], [0.1, 1.36], [0.25, 1.62], [0.45, 1.42], [0.3, 1.15], [0.3, 0.3], [0.45, 0.02], [0.72, 0.1]] },
    { n: 'rev', c: 'x', f: 6, adv: 0.76, p: [[0, 0.1], [0.1, 0.6], [0.3, 0.96], [0.5, 0.7], [0.3, 0.45], [0.15, 0.55], [0.3, 0.1], [0.6, 0.05], [0.76, 0.15]] },
    { n: 'tail', c: 'd', f: 3, adv: 0.86, p: [[0, 0.8], [0.1, 0.25], [0.3, 0.02], [0.5, 0.3], [0.55, 0.86], [0.52, 0.1], [0.45, -0.6], [0.62, -0.95], [0.85, -0.7], [0.65, -0.45], [0.6, -0.1], [0.86, 0.1]] },
    { n: 'twin', c: 'a', f: 4, adv: 0.7, p: [[0, 0.1], [0.25, 0.8], [0.35, 1.35], [0.2, 1.46], [0.2, 1.25], [0.38, 1.4], [0.45, 2.0], [0.3, 2.2], [0.22, 1.9], [0.35, 1.0], [0.38, 0.1], [0.7, 0.12]] },
    { n: 'arch', c: 'x', f: 5, adv: 0.86, p: [[0, 0.05], [0.1, 0.7], [0.35, 0.98], [0.6, 0.7], [0.65, 0.05], [0.86, 0.1]], dia: 'dotin' },
    { n: 'snail', c: 'x', f: 3, adv: 0.82, p: [[0, 0.1], [0.3, 0.12], [0.47, 0.36], [0.36, 0.52], [0.25, 0.38], [0.33, 0.27], [0.41, 0.33], [0.55, 0.2], [0.82, 0.1]] },
    { n: 'sigma', c: 'x', f: 2.5, adv: 0.72, p: [[0, 0.2], [0.42, 0.95], [0.1, 0.9], [0.4, 0.5], [0.1, 0.1], [0.45, 0.05], [0.72, 0.15]] },
    { n: 'staff', c: 'a', f: 3, adv: 0.62, p: [[0, 0.1], [0.28, 1.2], [0.3, 1.75], [0.46, 1.55], [0.25, 1.3], [0.22, 0.3], [0.35, 0.02], [0.62, 0.15]] },
    { n: 'swan', c: 'd', f: 2.5, adv: 0.84, p: [[0, 0.2], [0.2, 0.9], [0.55, 0.95], [0.3, 0.5], [0.55, 0.25], [0.55, -0.45], [0.3, -0.9], [0.1, -0.7], [0.4, -0.35], [0.84, 0.1]] },
    { n: 'lemni', c: 'a', f: 2, adv: 0.7, p: [[0, 0.1], [0.32, 0.5], [0.12, 1.02], [0.3, 1.55], [0.5, 1.05], [0.3, 0.52], [0.44, 0.05], [0.7, 0.12]] },
    { n: 'comma', c: 'd', f: 2, adv: 0.82, p: [[0, 0.3], [0.3, 0.9], [0.52, 0.6], [0.36, 0.12], [0.42, -0.5], [0.66, -0.92], [0.82, -0.62], [0.56, -0.42], [0.52, 0.02], [0.82, 0.12]] },
  ];
  A.GL = GL;

  // Word-final forms: tails that sweep back beneath the word, or curl shut.
  const FINALS = [
    { adv: 0.4, p: [[0, 0.3], [0.25, 0.8], [0.36, 0.6], [0.3, 0.0], [0.2, -0.5], [-0.1, -0.75], [-0.5, -0.62], [-0.62, -0.4]] },
    { adv: 1.0, p: [[0, 0.1], [0.3, 0.3], [0.45, 0.8], [0.35, 1.1], [0.2, 0.9], [0.45, 0.6], [0.8, 0.7], [0.95, 1.05]] },
    { adv: 0.55, p: [[0, 0.1], [0.3, 0.05], [0.5, 0.25], [0.45, 0.46], [0.3, 0.36], [0.38, 0.2]] },
    { adv: 0.9, p: [[0, 0.1], [0.4, 0.02], [0.75, 0.15], [0.9, 0.5], [0.72, 0.62], [0.66, 0.4]] },
  ];

  // Capitals: larger arabesques; height ~2.4 x-heights.
  const CAPS = [
    { adv: 1.2, p: [[0, 0.2], [0.5, 1.2], [0.7, 2.2], [0.45, 2.5], [0.2, 2.25], [0.35, 1.95], [0.6, 1.9], [0.62, 2.15], [0.5, 2.1], [0.55, 1.2], [0.4, 0.3], [0.2, 0.05], [0.05, 0.25], [0.3, 0.35], [0.8, 0.15], [1.2, 0.2]] },
    { adv: 1.25, p: [[0.55, 1.5], [0.7, 1.45], [0.72, 1.7], [0.5, 1.85], [0.3, 1.6], [0.35, 1.2], [0.7, 1.05], [0.95, 1.4], [0.9, 2.0], [0.5, 2.35], [0.1, 2.1], [0.0, 1.4], [0.15, 0.4], [0.45, 0.02], [0.9, 0.1], [1.25, 0.25]] },
    { adv: 1.35, p: [[0, 0.0], [0.1, 1.5], [0.35, 2.3], [0.55, 1.6], [0.55, 0.9], [0.62, 1.9], [0.85, 2.35], [1.05, 1.9], [1.0, 0.6], [0.8, 0.1], [0.6, 0.3], [0.9, 0.35], [1.35, 0.2]] },
    { adv: 1.4, p: [[0.3, 0.0], [0.0, 1.0], [0.2, 2.0], [0.5, 2.3], [0.6, 1.9], [0.5, 1.5], [0.7, 1.3], [0.9, 1.6], [0.75, 2.2], [1.0, 2.35], [1.15, 1.8], [0.9, 0.8], [0.6, 0.05], [1.0, 0.1], [1.4, 0.3]] },
    { adv: 1.45, p: [[0.0, 0.1], [0.4, 0.3], [0.8, 0.9], [0.7, 1.7], [0.4, 2.1], [0.2, 1.9], [0.35, 1.65], [0.55, 1.9], [0.6, 2.4], [0.9, 2.45], [1.0, 2.2], [0.8, 2.1], [1.0, 1.0], [1.1, 0.2], [1.45, 0.25]] },
    { adv: 1.3, p: [[0.0, 0.2], [0.3, 1.2], [0.1, 1.9], [0.35, 2.3], [0.65, 2.0], [0.9, 2.3], [1.15, 2.0], [0.9, 1.7], [0.65, 2.0], [0.35, 1.7], [0.5, 0.8], [0.4, 0.1], [0.8, 0.0], [1.3, 0.25]] },
  ];
  A.CAPS = CAPS;

  const XS = [], TALLS = [];
  GL.forEach((g, i) => (g.c === 'x' ? XS : TALLS).push(i));

  const DIA = {
    dot: (cx, y) => [[cx - 0.05, y], [cx + 0.03, y + 0.07], [cx + 0.07, y - 0.01], [cx - 0.02, y - 0.05], [cx - 0.04, y + 0.02]],
    bar: (cx, y) => [[cx - 0.26, y - 0.06], [cx + 0.02, y + 0.03], [cx + 0.28, y + 0.08]],
    tilde: (cx, y) => [[cx - 0.26, y], [cx - 0.1, y + 0.12], [cx + 0.08, y - 0.02], [cx + 0.26, y + 0.1]],
    ring: (cx, y) => U.circle(cx, y + 0.13, 0.13, 9).concat([[cx + 0.14, y + 0.15]]),
    caret: (cx, y) => [[cx - 0.18, y], [cx, y + 0.2], [cx + 0.18, y]],
    hook: (cx, y) => [[cx - 0.15, y + 0.15], [cx + 0.05, y + 0.22], [cx + 0.12, y + 0.05], [cx - 0.02, y - 0.05]],
    twin: (cx, y) => [[cx - 0.14, y], [cx - 0.1, y + 0.05], [cx - 0.06, y], [cx + 0.08, y + 0.02], [cx + 0.12, y + 0.07]],
    dotb: (cx) => DIA.dot(cx, -0.45),
    dotin: (cx) => DIA.dot(cx - 0.05, 0.42),
    cross: (cx) => [[cx - 0.3, 1.05], [cx - 0.05, 1.18], [cx + 0.1, 1.02], [cx + 0.32, 1.12]],
  };
  const DIA_KEYS = ['dot', 'bar', 'tilde', 'ring', 'caret', 'hook', 'twin'];
  const DIA_W = [5, 3, 3, 2, 1.5, 1.5, 2];

  // ------------------------------------------------------------------ words & lexicon
  function makeWord(rand, len) {
    const g = [];
    let prevTall = false, prev = -1;
    const xw = XS.map((i) => GL[i].f), tw = TALLS.map((i) => GL[i].f);
    for (let i = 0; i < len; i++) {
      let idx;
      if (!prevTall && i > 0 && rand.chance(0.32)) idx = TALLS[rand.weighted(tw)];
      else idx = XS[rand.weighted(xw)];
      if (idx === prev && rand.chance(0.7)) idx = XS[rand.weighted(xw)];
      g.push(idx);
      prevTall = GL[idx].c !== 'x';
      prev = idx;
    }
    const dia = [];
    if (len > 1 && rand.chance(0.4)) dia.push([rand.int(0, len - 1), DIA_KEYS[rand.weighted(DIA_W)]]);
    if (len > 4 && rand.chance(0.2)) dia.push([rand.int(0, len - 1), DIA_KEYS[rand.weighted(DIA_W)]]);
    return { g, dia, fin: len > 1 && rand.chance(0.38) ? rand.int(0, FINALS.length - 1) : -1 };
  }

  class Lexicon {
    constructor(seed, n) {
      n = n || 260;
      const rand = new U.Rand('lexicon-' + seed);
      this.words = [];
      for (let i = 0; i < n; i++) {
        let len;
        if (i < 10) len = rand.int(1, 3);
        else len = 2 + rand.weighted([2, 4, 5, 5, 4, 3, 2, 1]);
        this.words.push(makeWord(rand, len));
      }
      let acc = 0;
      this.cum = this.words.map((_, k) => (acc += 1 / Math.pow(k + 2.2, 1.05)));
      this.total = acc;
    }
    sample(rand) {
      const r = rand.next() * this.total;
      let lo = 0, hi = this.cum.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.cum[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      return this.words[lo];
    }
    long(rand, min) {
      for (let k = 0; k < 40; k++) {
        const w = this.words[rand.int(10, this.words.length - 1)];
        if (w.g.length >= (min || 6)) return w;
      }
      return this.words[this.words.length - 1];
    }
  }
  A.Lexicon = Lexicon;
  A.lex = new Lexicon('codex', 280);

  // Skeleton points (design space) for one word instance, with handwriting jitter.
  A.skeleton = function (word, rand, o) {
    o = o || {};
    const j = o.jitter === undefined ? 0.035 : o.jitter;
    const pts = [];
    const dias = [];
    let x = 0;
    const J = () => rand.range(-j, j);
    if (o.cap !== undefined && o.cap >= 0) {
      const cap = CAPS[o.cap % CAPS.length];
      for (const p of cap.p) pts.push([p[0] + J() * 1.5, p[1] + J() * 1.5]);
      x += cap.adv;
    } else {
      pts.push([-0.22, -0.02 + J()]);
    }
    const kx = o.wide || 1;
    for (let gi = 0; gi < word.g.length; gi++) {
      const gl = GL[word.g[gi]];
      const sx = kx * (1 + J() * 1.5);
      for (let k = 0; k < gl.p.length; k++) {
        const p = gl.p[k];
        if (k === 0 && pts.length && gi > 0) {
          // soften the join: skip the entry point when it doubles back
          const last = pts[pts.length - 1];
          if (Math.abs(last[1] - p[1]) < 0.1 && x + p[0] * sx - last[0] < 0.08) continue;
        }
        pts.push([x + p[0] * sx + J(), p[1] + J()]);
      }
      if (gl.dia) dias.push(DIA[gl.dia](x + gl.adv * 0.42 * sx, gl.dy || (gl.c === 'a' ? 2.35 : 1.4)));
      x += gl.adv * sx;
    }
    for (const d of word.dia) {
      let px = o.cap !== undefined && o.cap >= 0 ? CAPS[o.cap % CAPS.length].adv : 0;
      for (let gi = 0; gi < d[0]; gi++) px += GL[word.g[gi]].adv * kx;
      const gl = GL[word.g[d[0]]];
      if (gl.dia) continue;
      dias.push(DIA[d[1]](px + gl.adv * 0.45, gl.c === 'a' ? 2.4 : 1.45));
    }
    let extra = 0.1;
    if (word.fin !== undefined && word.fin >= 0) {
      const f = FINALS[word.fin];
      for (const p of f.p) pts.push([x + p[0] + J(), p[1] + J()]);
      extra = f.adv;
    } else {
      pts.push([x + 0.15, 0.22]);
    }
    if (o.stop) {
      // sentence stop: a small knot and a dot
      const sx = x + extra + 0.35;
      dias.push([[sx, 0.35], [sx + 0.12, 0.5], [sx + 0.2, 0.3], [sx + 0.05, 0.18], [sx + 0.02, 0.4]]);
      dias.push(DIA.dot(sx + 0.42, 0.08));
      return { pts, dias, adv: x + extra + 0.75 };
    }
    return { pts, dias, adv: x + extra };
  };

  // Map design space into page space: baseline at (x, y), size = x-height in page units.
  A.place = function (pts, x, y, size, slant, rot) {
    slant = slant === undefined ? 0.1 : slant;
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    return pts.map((p) => {
      const dx = (p[0] + p[1] * slant) * size, dy = -p[1] * size;
      return [x + dx * c - dy * s, y + dx * s + dy * c];
    });
  };

  // Strokes for one word placed on the page.
  A.wordStrokes = function (word, rand, x, y, size, o) {
    o = o || {};
    const sk = A.skeleton(word, rand, o);
    const slant = o.slant === undefined ? 0.1 : o.slant;
    const step = Math.max(0.35, size * 0.075);
    const weight = (o.weight || 0.1) * size;
    const color = o.color || Ink.PAL.ink;
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    // width steps of the nib: about half a pixel at reading size, which halves the draw calls
    const wq = Math.max(0.15, Math.min(0.35, weight * 0.4));
    let pts = U.catmull(A.place(sk.pts, x, y, size, slant, o.rot), step);
    if (o.bend) pts = pts.map(o.bend);
    const main = new Ink.Stroke(pts, {
      w: weight, nib: o.nib === undefined ? 0.5 : o.nib, tIn: size * 0.35, tOut: size * 0.5,
      press: 0.12, color, alpha, seed: rand.range(0, 99), q: wq,
    });
    const extras = sk.dias.map((d) => {
      let dp = U.catmull(A.place(d, x, y, size, slant, o.rot), step * 0.8);
      if (o.bend) dp = dp.map(o.bend);
      return new Ink.Stroke(dp, { w: weight * 0.95, tIn: size * 0.08, tOut: size * 0.1, press: 0.05, color, alpha, q: wq });
    });
    return { strokes: [main].concat(extras), adv: sk.adv * size, main };
  };

  // ------------------------------------------------------------------ text blocks
  // o: {seed, x, y, w, size, lead, lines, justify, indent, paraMin, paraMax, cap, dropcap, color, weight, lex}
  A.block = function (o) {
    const rand = o.rand || new U.Rand(o.seed || 'block');
    const lex = o.lex || A.lex;
    const size = o.size || 8;
    const lead = o.lead || size * 2.9;
    const gap = o.gap || size * 0.8;
    const words = [];
    const lines = o.lines || 10;
    const justify = o.justify !== false;
    const pMin = o.paraMin || 3, pMax = o.paraMax || 6;
    let dropcap = null;
    const dcLines = o.dropcap ? o.dropcap.lines || 3 : 0;
    const dcW = dcLines ? lead * dcLines * 0.72 + size : 0;
    if (dcLines) {
      const capSize = (lead * (dcLines - 1) + size) / 2.3;
      const ci = o.dropcap.cap === undefined ? rand.int(0, CAPS.length - 1) : o.dropcap.cap;
      const sk = A.skeleton({ g: [], dia: [], fin: -1 }, rand, { cap: ci, jitter: 0.01 });
      const pts = U.catmull(A.place(sk.pts.slice(0, -1), o.x + size * 0.4, o.y + lead * (dcLines - 1), capSize, 0.12), 0.8);
      dropcap = {
        x: o.x, y: o.y - size * 2.2, w: dcW - size * 0.6, h: lead * (dcLines - 1) + size * 3.4,
        stroke: new Ink.Stroke(pts, { w: capSize * 0.11, nib: 0.9, tIn: capSize * 0.3, tOut: capSize * 0.5, color: o.dcColor || Ink.PAL.red }),
      };
    }
    let sentenceLeft = 0;
    let paraLeft = rand.int(pMin, pMax);
    let firstWord = true;
    const nextItem = () => {
      let start = false;
      if (sentenceLeft <= 0) { sentenceLeft = rand.int(o.sMin || 9, o.sMax || 22); start = true; }
      const item = { word: lex.sample(rand), cap: -1, stop: sentenceLeft === 1 && o.stops !== false, endPara: false };
      if (start && o.cap !== false && !(dcLines && firstWord)) item.cap = rand.int(0, CAPS.length - 1);
      firstWord = false;
      sentenceLeft--;
      if (sentenceLeft === 0) {
        paraLeft--;
        if (paraLeft <= 0) { item.endPara = true; paraLeft = rand.int(pMin, pMax); }
      }
      return item;
    };
    const est = new U.Rand(1);
    let li = 0;
    let pending = null;
    let newPara = o.indentFirst !== false;
    while (li < lines) {
      const y = o.y + li * lead;
      const indent = newPara && li >= dcLines && o.indent !== 0 ? (o.indent || size * 3) : 0;
      const left = o.x + (li < dcLines ? dcW : 0) + indent;
      const right = o.x + o.w;
      const lineWords = [];
      let cx = left;
      let endPara = false;
      newPara = false;
      for (;;) {
        const item = pending || nextItem();
        pending = null;
        const ww = A.skeleton(item.word, est, { cap: item.cap, stop: item.stop }).adv * size;
        if (cx + ww > right && lineWords.length > 0) { pending = item; break; }
        lineWords.push({ item, x: cx, w: ww });
        cx += ww + gap * rand.range(0.9, 1.15);
        if (item.endPara && o.paragraphs !== false) { endPara = true; break; }
      }
      const last = lineWords[lineWords.length - 1];
      const slack = right - (last.x + last.w);
      const doJ = justify && !endPara && lineWords.length > 1 && slack < o.w * 0.3;
      for (let k = 0; k < lineWords.length; k++) {
        const lw = lineWords[k];
        const shift = doJ ? (slack * k) / (lineWords.length - 1) : o.align === 'center' ? slack / 2 : 0;
        const wy = y + U.noise(lw.x * 0.004 + li * 7.1, li * 1.3) * size * 0.08;
        const ws = A.wordStrokes(lw.item.word, rand, lw.x + shift, wy, size, {
          cap: lw.item.cap, stop: lw.item.stop, color: o.color, weight: o.weight, slant: o.slant, alpha: o.alpha,
        });
        words.push({ strokes: ws.strokes, x: lw.x + shift, y: wy, w: lw.w, line: li, size });
      }
      if (endPara) newPara = true;
      li++;
    }
    return { words, dropcap, lines, lead, size, x: o.x, y: o.y, w: o.w, h: lines * lead };
  };

  // Marks that write a block with several invisible pens.
  // o: {pens, speed (units/s), wordGap, lineGap, stagger}
  A.write = function (block, t0, o) {
    o = o || {};
    const pens = o.pens || 3;
    const speed = o.speed || 700;
    const wordGap = o.wordGap === undefined ? 0.035 : o.wordGap;
    const lineGap = o.lineGap === undefined ? 0.08 : o.lineGap;
    const stagger = o.stagger === undefined ? 0.18 : o.stagger;
    const marks = [];
    const cursor = [];
    for (let p = 0; p < pens; p++) cursor.push(t0 + p * stagger);
    let t = t0;
    if (block.dropcap) {
      const dc = block.dropcap;
      const bg = U.circle(dc.x + dc.w / 2, dc.y + dc.h / 2, dc.w * 0.5, 12, 0.3, dc.h * 0.47);
      marks.push(Ink.wash(bg, o.dcWash || Ink.PAL.ochre, t0, t0 + 0.9, { alpha: 0.35, amp: 5, seed: 3 }));
      marks.push(new Ink.StrokeMark(dc.stroke, t0, t0 + 0.8));
    }
    const byLine = {};
    for (const w of block.words) (byLine[w.line] = byLine[w.line] || []).push(w);
    const lineIds = Object.keys(byLine).map(Number).sort((a, b) => a - b);
    let maxEnd = t;
    for (const li of lineIds) {
      const p = li % pens;
      let c = cursor[p];
      for (const w of byLine[li]) {
        let L = 0;
        for (const s of w.strokes) L += s.L;
        const d = L / speed;
        const m = new Ink.StrokeMark(w.strokes, c, c + d, { mode: 'seq', gap: 0.25 });
        m.word = w;
        w.mark = m;
        marks.push(m);
        c += d + wordGap;
      }
      c += lineGap;
      cursor[p] = c;
      maxEnd = Math.max(maxEnd, c);
    }
    marks.end = maxEnd;
    return marks;
  };

  // Text that is already on the page (printed before we arrive).
  A.printed = function (block, t) {
    const marks = [];
    if (block.dropcap) {
      const dc = block.dropcap;
      const bg = U.circle(dc.x + dc.w / 2, dc.y + dc.h / 2, dc.w * 0.5, 12, 0.3, dc.h * 0.47);
      marks.push(Ink.wash(bg, Ink.PAL.ochre, t, t, { alpha: 0.35, amp: 5, seed: 3 }));
      marks.push(new Ink.StrokeMark(dc.stroke, t, t));
    }
    for (const w of block.words) {
      const m = new Ink.StrokeMark(w.strokes, t, t);
      m.word = w;
      w.mark = m;
      marks.push(m);
    }
    return marks;
  };

  // A single line of words (a caption or label), centred on x if o.center.
  A.label = function (x, y, size, nWords, o) {
    o = o || {};
    const rand = o.rand || new U.Rand(o.seed || 'label' + x + y);
    const lex = o.lex || A.lex;
    const items = [];
    let total = 0;
    for (let i = 0; i < nWords; i++) {
      const w = i === 0 && o.long ? lex.long(rand, o.long) : lex.sample(rand);
      const cap = i === 0 && o.cap ? rand.int(0, CAPS.length - 1) : -1;
      const sk = A.skeleton(w, new U.Rand(1), { cap, stop: o.stop && i === nWords - 1 });
      items.push({ w, cap, adv: sk.adv * size });
      total += sk.adv * size + (i ? size * 0.95 : 0);
    }
    let cx = o.center ? x - total / 2 : o.right ? x - total : x;
    const strokes = [];
    const words = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ws = A.wordStrokes(it.w, rand, cx, y, size, { cap: it.cap, stop: o.stop && i === items.length - 1, color: o.color, weight: o.weight, slant: o.slant, rot: o.rot, alpha: o.alpha });
      for (const s of ws.strokes) strokes.push(s);
      words.push({ strokes: ws.strokes, x: cx, y, w: it.adv, size });
      cx += it.adv + size * 0.95;
    }
    return { strokes, words, w: total, x: o.center ? x - total / 2 : x };
  };

  // Words written along an arbitrary path (spirals, arcs, a worm's trail).
  A.alongPath = function (path, size, o) {
    o = o || {};
    const rand = o.rand || new U.Rand(o.seed || 'along');
    const lex = o.lex || A.lex;
    const L = U.pathLen(path);
    const words = [];
    let s = o.start || 0;
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const at = (d) => {
      let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (cum[m] < d) lo = m;
        else hi = m;
      }
      const t = U.sat((d - cum[lo]) / (cum[hi] - cum[lo] || 1));
      const a = path[lo], b = path[hi];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    while (s < L - size * 2) {
      const w = lex.sample(rand);
      const sk = A.skeleton(w, rand, { stop: rand.chance(0.12) });
      const adv = sk.adv * size;
      if (s + adv > L) break;
      // bend every point onto the path: x → arc length, y → normal offset
      const pts = A.place(sk.pts, 0, 0, size, o.slant === undefined ? 0.2 : o.slant).map((p) => {
        const q = at(s + p[0]);
        return [q.x - Math.sin(q.a) * -p[1] * (o.flip ? -1 : 1), q.y + Math.cos(q.a) * -p[1] * (o.flip ? -1 : 1)];
      });
      const dense = U.catmull(pts, Math.max(0.35, size * 0.075));
      const weight = (o.weight || 0.1) * size;
      const strokes = [new Ink.Stroke(dense, { w: weight, nib: 0.6, tIn: size * 0.35, tOut: size * 0.5, color: o.color || Ink.PAL.ink, alpha: o.alpha === undefined ? 1 : o.alpha })];
      for (const d of sk.dias) {
        const dp = A.place(d, 0, 0, size, 0.2).map((p) => {
          const q = at(s + p[0]);
          return [q.x - Math.sin(q.a) * -p[1] * (o.flip ? -1 : 1), q.y + Math.cos(q.a) * -p[1] * (o.flip ? -1 : 1)];
        });
        strokes.push(new Ink.Stroke(U.catmull(dp, 0.6), { w: weight * 0.9, tIn: 0.5, tOut: 0.5, color: o.color || Ink.PAL.ink, alpha: o.alpha === undefined ? 1 : o.alpha }));
      }
      const c = at(s + adv / 2);
      words.push({ strokes, s0: s, s1: s + adv, x: c.x, y: c.y, w: adv, size });
      s += adv + size * rand.range(0.85, 1.1);
    }
    return words;
  };

  // ------------------------------------------------------------------ numerals (base 21)
  const BODIES = [
    [[0.1, 1.1], [0.12, 0.3], [0.2, 0.0], [0.38, 0.12]],
    U.circle(0.22, 0.5, 0.22, 10, -Math.PI / 2, 0.42).concat([[0.2, 0.08], [0.4, 0.12]]),
    [[0.05, 0.9], [0.3, 1.05], [0.45, 0.6], [0.3, 0.05], [0.05, 0.15]],
    [[0.42, 1.0], [0.1, 0.88], [0.32, 0.52], [0.45, 0.2], [0.12, 0.0]],
    [[0.0, 0.9], [0.2, 0.0], [0.46, 1.0]],
    [[0.4, 1.1], [0.4, 0.12], [0.22, 0.0], [0.06, 0.28], [0.3, 0.45], [0.48, 0.38]],
    [[0.05, 1.0], [0.46, 1.0], [0.05, 0.0], [0.46, 0.05]],
  ];
  A.digit = function (d, x, y, size, o) {
    o = o || {};
    const body = BODIES[d % 7];
    const mark = Math.floor(d / 7);
    const w = (o.weight || 0.12) * size;
    const color = o.color || Ink.PAL.ink;
    const strokes = [new Ink.Stroke(U.catmull(A.place(body, x, y, size, 0.12), 0.5), { w, tIn: 0.6, tOut: 0.8, color })];
    if (mark === 1) strokes.push(new Ink.Stroke(U.catmull(A.place(DIA.dot(0.25, 1.45), x, y, size, 0.12), 0.4), { w, tIn: 0.2, tOut: 0.2, color }));
    if (mark === 2) strokes.push(new Ink.Stroke(U.catmull(A.place([[-0.08, 0.55], [0.25, 0.62], [0.58, 0.58]], x, y, size, 0.12), 0.5), { w: w * 0.9, tIn: 0.4, tOut: 0.4, color }));
    return strokes;
  };
  A.toBase21 = function (n) {
    const ds = [];
    do { ds.unshift(n % 21); n = Math.floor(n / 21); } while (n > 0);
    return ds;
  };
  A.numeral = function (n, x, y, size, o) {
    o = o || {};
    const ds = A.toBase21(n);
    const adv = size * 0.72;
    let cx = o.center ? x - (ds.length * adv - size * 0.24) / 2 : o.right ? x - ds.length * adv : x;
    const strokes = [];
    for (const d of ds) {
      for (const s of A.digit(d, cx, y, size, o)) strokes.push(s);
      cx += adv;
    }
    return strokes;
  };

  // A display word for titles: long word, big capital, entry swash and a looping underline.
  A.display = function (x, y, size, o) {
    o = o || {};
    const rand = o.rand || new U.Rand(o.seed || 'display');
    const lex = o.lex || A.lex;
    const word = o.word || lex.long(rand, o.min || 7);
    const cap = o.cap === undefined ? rand.int(0, CAPS.length - 1) : o.cap;
    const sk = A.skeleton(word, rand, { cap, jitter: 0.015 });
    const adv = sk.adv;
    const pts = sk.pts.slice();
    if (o.swash !== false) {
      // exit into a long underline that loops back under the word
      pts.push([adv + 0.3, 0.9], [adv + 0.55, 0.35], [adv * 0.7, -0.55], [adv * 0.25, -0.62], [-0.1, -0.35], [0.25, -0.2]);
    }
    const x0 = o.center ? x - (adv * size) / 2 - 0.2 * size : x;
    const placed = A.place(pts, x0, y, size, o.slant === undefined ? 0.16 : o.slant);
    const main = new Ink.Stroke(U.catmull(placed, Math.max(0.5, size * 0.05)), {
      w: size * (o.weight || 0.1), nib: 0.9, tIn: size * 0.5, tOut: size * 1.2, press: 0.15, color: o.color || Ink.PAL.ink, q: 0.25,
    });
    const extras = sk.dias.map((d) => new Ink.Stroke(U.catmull(A.place(d, x0, y, size, o.slant === undefined ? 0.16 : o.slant), 0.8), { w: size * 0.09, tIn: size * 0.1, tOut: size * 0.1, color: o.color || Ink.PAL.ink }));
    return { strokes: [main].concat(extras), w: adv * size, x: x0 };
  };
})((window.Codex = window.Codex || {}));
