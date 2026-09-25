/* I · Flora — an eye-flower grows, looks about, pulls up its roots and walks off the page;
   a quill plant drips ink; a sapling is trained into the shape of a chair. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;

  // ------------------------------------------------------------------ the walking eye-flower
  function eyeFlower(rand) {
    // local coordinates: base at (0,0) on the ground line, y up is negative
    const stemCtrl = [[0, 0], [-14, -120], [18, -260], [-10, -400], [12, -520], [0, -610]];
    const stem = U.catmull(stemCtrl, 2);
    const stem2 = U.offsetPts(stem, 4, 0).map((p, i) => [p[0] + Math.sin(i * 0.05) * 1.2, p[1]]);
    const at = (u) => U.pointAt(stem, u);
    const leaves = [];
    [[0.2, 1], [0.34, -1], [0.5, 1], [0.64, -1]].forEach(([u, s], i) => {
      const p = at(u);
      const a = -Math.PI / 2 + s * (1.05 - i * 0.12);
      leaves.push(Object.assign(D.leaf(p.x, p.y, a, 120 - i * 14, 30 - i * 3, { bend: s * 0.08 }), { u }));
    });
    const top = at(1);
    const fc = [top.x, top.y - 36];
    const petals = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 - Math.PI / 2;
      petals.push(D.leaf(fc[0] + Math.cos(a) * 26, fc[1] + Math.sin(a) * 20, a, 78, 25, { tip: 0.6 }));
    }
    const inner = [];
    for (let i = 0; i < 11; i++) {
      const a = ((i + 0.5) / 11) * Math.PI * 2 - Math.PI / 2;
      inner.push(D.leaf(fc[0] + Math.cos(a) * 22, fc[1] + Math.sin(a) * 17, a, 44, 15, { tip: 0.5 }));
    }
    const sepals = [];
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i - 1) * 0.7;
      sepals.push(D.leaf(fc[0], fc[1] + 12, a, 38, 12));
    }
    const roots = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + (i - 2.5) * 0.36;
      const pts = D.stem(0, 2, a, 70 + rand.range(0, 30), rand.range(-0.8, 0.8), rand, { wig: 0.12 });
      roots.push(pts);
    }
    return { stem, stem2, leaves, petals, inner, sepals, fc, roots };
  }

  function drawPart(ctx, stroke, u) { if (u > 0) stroke.draw(ctx, 0, U.sat(u)); }

  C.Scenes.push({
    id: 'flora',
    build(show, TL) {
      const sp = show.spread([24, 25]);
      const L = sp.L, Rp = sp.R;
      const T0 = TL.turns[0][1];
      const T1 = TL.turns[1][0];
      show.turn(TL.turns[0][0], TL.turns[0][1], 0, 1, { riffle: 4 });
      const pre = TL.turns[0][0] - 1;
      K.furniture(L, 24, 'L', pre);
      K.furniture(Rp, 25, 'R', pre);

      // ---------------------------------------------------------- left page: chapter opening
      K.strokes(L, A.numeral(1, 500, 150, 26, { center: true, color: PAL.red, weight: 0.13 }), T0 + 0.05, T0 + 0.45, { mode: 'seq' });
      const ttl = A.display(500, 238, 24, { center: true, seed: 'flora-title', swash: false, weight: 0.1 });
      K.strokes(L, ttl.strokes, T0 + 0.3, T0 + 1.15, { mode: 'seq', gap: 0.1 });
      const r1 = new U.Rand('flora-text');
      const txt = K.text(L, { rand: r1, x: 96, y: 330, w: 808, size: 8, lines: 12, dropcap: { lines: 3 } }, T0 + 0.15, { pens: 4, speed: 950 });
      // specimens: seeds in little frames
      const fy = 770, fw = 230, fh = 215;
      const fx = [96, 385, 674];
      fx.forEach((x, i) => K.frame(L, x, fy, fw, fh, T0 + 1.0 + i * 0.25, T0 + 1.6 + i * 0.25, { w: 0.9, gap: 4 }));
      // 1. spiral seed
      {
        const cx = fx[0] + fw / 2, cy = fy + fh / 2 - 6;
        const sp1 = [];
        for (let i = 0; i <= 160; i++) {
          const a = i * 0.075, r = 6 * Math.exp(0.155 * a);
          sp1.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86]);
        }
        const shell = sp1.slice(60);
        K.stroke(L, sp1, T0 + 1.5, T0 + 2.6, { w: 1.2, raw: true });
        for (let k = 0; k < 9; k++) {
          const i = 60 + k * 11;
          const p = sp1[i], q = sp1[Math.min(159, i + 83)] || sp1[159];
          K.stroke(L, [p, [(p[0] + q[0]) / 2 + 3, (p[1] + q[1]) / 2 - 2], q], T0 + 2.4 + k * 0.05, T0 + 2.6 + k * 0.05, { w: 0.7 });
        }
        const poly = sp1.slice(40).concat([[cx, cy]]);
        K.pencil(L, poly, PAL.ochre, T0 + 2.7, T0 + 3.7, { seed: 'sp', alpha: 0.35 });
        K.hatch(L, shell.slice(70).concat([[cx + 10, cy]]), T0 + 3.2, T0 + 3.9, { spacing: 3.5, w: 0.5, angle: 0.6 });
        void shell;
      }
      // 2. eye pod
      {
        const cx = fx[1] + fw / 2, cy = fy + fh / 2;
        const podL = U.catmull([[cx - 80, cy + 30], [cx - 40, cy - 38], [cx + 20, cy - 52], [cx + 85, cy - 20]], 2);
        const podR = U.catmull([[cx - 80, cy + 30], [cx - 10, cy + 42], [cx + 50, cy + 30], [cx + 85, cy - 20]], 2);
        K.stroke(L, podL, T0 + 1.7, T0 + 2.3, { w: 1.3, raw: true });
        K.stroke(L, podR, T0 + 1.9, T0 + 2.5, { w: 1.3, raw: true });
        const inner = U.catmull([[cx - 62, cy + 18], [cx - 20, cy - 22], [cx + 30, cy - 30], [cx + 68, cy - 12], [cx + 30, cy + 20], [cx - 20, cy + 26], [cx - 62, cy + 18]], 2);
        K.stroke(L, inner, T0 + 2.3, T0 + 2.9, { w: 0.9, raw: true });
        K.pencil(L, podL.concat(podR.slice().reverse()), PAL.leaf, T0 + 2.8, T0 + 3.8, { seed: 'pod', alpha: 0.32 });
        for (let k = 0; k < 4; k++) {
          const ex = cx - 40 + k * 28, ey = cy - 4 + Math.sin(k * 1.7) * 4;
          const e = D.eye(ex, ey, 20, 13, { lashes: 0, look: [Math.sin(k) * 0.8, 0] });
          K.strokes(L, [Ink.path(e.upper, { w: 0.9 }), Ink.path(e.lower, { w: 0.7 }), Ink.path(e.iris.concat([e.iris[0]]), { w: 0.6 })], T0 + 2.9 + k * 0.12, T0 + 3.2 + k * 0.12, { mode: 'seq' });
          K.wash(L, e.iris, PAL.ultramarine, T0 + 3.3 + k * 0.1, T0 + 3.7 + k * 0.1, { alpha: 0.55, amp: 0.6, seed: k, soft: 0.1 });
        }
      }
      // 3. feather seed (a samara)
      {
        const cx = fx[2] + fw / 2, cy = fy + fh / 2 + 30;
        const seed = D.ellipse(cx - 60, cy + 20, 16, 11, 20, 0.3);
        K.outline(L, seed, T0 + 1.9, T0 + 2.3, { w: 1.2 });
        const f = D.feather(cx - 48, cy + 12, -0.55, 150, 30, new U.Rand('samara'));
        K.stroke(L, f.outline, T0 + 2.2, T0 + 3.0, { w: 1.1 });
        K.stroke(L, f.quill, T0 + 2.8, T0 + 3.1, { w: 0.8 });
        K.lines(L, f.barbs, T0 + 3.0, T0 + 3.5, { w: 0.5 });
        K.pencil(L, f.outline, PAL.rose, T0 + 3.1, T0 + 4.0, { seed: 'sam', alpha: 0.3 });
        K.hatch(L, seed, T0 + 2.4, T0 + 2.8, { spacing: 2.5, w: 0.5 });
      }
      fx.forEach((x, i) => K.label(L, x + fw / 2, fy + fh + 32, 6.5, 2, T0 + 3.6 + i * 0.2, T0 + 4.1 + i * 0.2, { center: true, seed: 'seedlab' + i }));
      K.text(L, { seed: 'flora-text-2', x: 96, y: 1100, w: 808, size: 8, lines: 8 }, T0 + 3.2, { pens: 4, speed: 950 });

      // ---------------------------------------------------------- right page: the plate
      const R = Rp;
      const gy = 1170;
      K.label(R, 500, 150, 11, 2, pre, pre, { center: true, seed: 'plate-head', cap: true });
      K.stroke(R, U.densify([[70, gy], [930, gy]], 3), T0 + 0.2, T0 + 0.9, { raw: true, w: 1.2, wob: 0.6 });
      // soil in section
      const soil = [[70, gy + 2], [930, gy + 2], [930, gy + 110], [70, gy + 110]];
      K.hatch(R, soil, T0 + 0.5, T0 + 1.8, { spacing: 5, w: 0.55, angle: 0.25, gaps: 0.1, jitter: 0.5 });
      K.pencil(R, soil, PAL.umber, T0 + 1.2, T0 + 2.4, { seed: 'soil', alpha: 0.26, angle: 0.3 });
      const pebbles = [];
      const pr = new U.Rand('pebbles');
      for (let i = 0; i < 28; i++) pebbles.push([pr.range(80, 920), pr.range(gy + 12, gy + 100), pr.range(1.2, 3.2)]);
      R.add(Ink.dots(pebbles, 2, T0 + 1.4, T0 + 2.0));

      // quill plant (Pennifolia)
      const qx = 575;
      const qstem = U.catmull([[qx, gy], [qx + 10, gy - 150], [qx - 12, gy - 300], [qx + 6, gy - 430]], 2);
      K.stroke(R, qstem, T0 + 0.9, T0 + 2.0, { w: 2.2, raw: true, tOut: 20 });
      const qr = new U.Rand('quills');
      const quills = [];
      for (let i = 0; i < 7; i++) {
        const u = 0.25 + i * 0.11;
        const p = U.pointAt(qstem, u);
        const s = i % 2 ? 1 : -1;
        const a = -Math.PI / 2 + s * (0.95 - i * 0.07);
        const f = D.feather(p.x, p.y, a, 120 - i * 7, 20, qr);
        quills.push(f);
        K.stroke(R, f.outline, T0 + 1.6 + i * 0.22, T0 + 2.2 + i * 0.22, { w: 1.1 });
        K.stroke(R, f.quill, T0 + 2.1 + i * 0.22, T0 + 2.4 + i * 0.22, { w: 0.9 });
        K.lines(R, f.barbs, T0 + 2.3 + i * 0.22, T0 + 2.6 + i * 0.22, { w: 0.45 });
        K.pencil(R, f.outline, i % 2 ? PAL.slate : PAL.ochre, T0 + 3.0 + i * 0.1, T0 + 3.8 + i * 0.1, { seed: 'q' + i, alpha: 0.3 });
      }
      // the top quill: its nib drips ink that becomes a word on the ground
      const tq = quills[6];
      const nib = tq.outline[4];
      K.stroke(R, [[nib[0], nib[1]], [nib[0] + 4, nib[1] + 10], [nib[0] + 1, nib[1] + 16]], T0 + 3.7, T0 + 3.9, { w: 1.6 });
      const dripWord = A.label(qx + 20, gy - 16, 9, 1, { seed: 'drip', cap: false });
      const dripT = [T0 + 5.2, T0 + 6.4];
      K.strokes(R, dripWord.strokes, dripT[1], dripT[1] + 0.8, { mode: 'seq' });
      show.actor({
        t0: dripT[0], t1: dripT[1] + 0.2, layer: 0,
        draw(ctx, T) {
          for (let k = 0; k < 3; k++) {
            const u = U.sat((T - dripT[0] - k * 0.38) / 0.55);
            if (u <= 0 || u >= 1) continue;
            const x = nib[0] + 1, y = U.lerp(nib[1] + 16, gy - 20, u * u);
            ctx.fillStyle = U.rgba(PAL.ink, 0.95);
            ctx.beginPath();
            ctx.ellipse(x, y, 2.4, 3.4 + u * 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        },
      });
      show.cue(dripT[0], 'drip', { n: 3, gap: 0.38, fall: 0.55 });

      // chair plant: a sapling trained into the shape of a chair, in three-quarter view
      const cxp = 770;
      const F = [26, -18]; // offset of the far side
      const near = [
        [[cxp, gy], [cxp - 3, gy - 90], [cxp + 2, gy - 172]],
        [[cxp + 2, gy - 172], [cxp + 66, gy - 176], [cxp + 132, gy - 168]],
        [[cxp + 132, gy - 168], [cxp + 136, gy - 84], [cxp + 130, gy]],
        [[cxp + 2, gy - 172], [cxp - 6, gy - 300], [cxp + 4, gy - 420], [cxp + 26, gy - 446]],
      ];
      const far = near.map((pp) => pp.map((p) => [p[0] + F[0], p[1] + F[1]]));
      const slats = [];
      for (let k = 0; k < 4; k++) {
        const x = cxp + 16 + k * 36;
        slats.push([[x, gy - 171 - k * 0.5], [x + F[0] * 0.5, gy - 176 + F[1] * 0.5], [x + F[0], gy - 172 + F[1]]]);
      }
      const rails = [0, 1, 2].map((k) => {
        const y = gy - 250 - k * 62;
        return [[cxp - 2, y], [cxp + 12, y - 8], [cxp + F[0] - 2, y + F[1]]];
      });
      const chair = [].concat(far.map((p) => [p, 2.2, 'far']), near.map((p) => [p, 3.0, 'near']), slats.map((p) => [p, 1.5, 'slat']), rails.map((p) => [p, 1.5, 'rail']));
      chair.forEach(([pp, w, kind], i) => {
        const pts = U.catmull(pp, 2);
        K.stroke(R, pts, T0 + 1.0 + i * 0.16, T0 + 1.5 + i * 0.16, { w, raw: true, tOut: kind === 'near' ? 6 : 3, tIn: 3 });
        if (kind === 'near' || kind === 'far') {
          const ribbon = D.ribbon(pts, () => (kind === 'near' ? 11 : 8));
          K.pencil(R, ribbon, PAL.umber, T0 + 3.3 + i * 0.05, T0 + 3.9 + i * 0.05, { seed: 'ch' + i, alpha: 0.42, spacing: 1.8 });
        }
      });
      // bark rings and knots
      const knots = [[cxp + 1, gy - 120], [cxp + 134, gy - 110], [cxp - 3, gy - 330], [cxp + 60, gy - 175]];
      knots.forEach(([x, y], i) => K.stroke(R, U.circle(x, y, 3.5, 8).concat([[x + 3.5, y]]), T0 + 3.0 + i * 0.1, T0 + 3.2 + i * 0.1, { w: 0.8 }));
      // it still roots into the soil
      [[cxp, gy], [cxp + 130, gy], [cxp + F[0], gy + F[1]], [cxp + 130 + F[0], gy + F[1]]].forEach(([x, y], i) => {
        const rr = new U.Rand('chair-root' + i);
        for (let k = 0; k < 3; k++) K.stroke(R, D.stem(x, y + 2, Math.PI / 2 + rr.range(-0.8, 0.8), rr.range(20, 40), rr.range(-0.6, 0.6), rr), T0 + 2.2 + i * 0.1, T0 + 2.6 + i * 0.1, { raw: true, w: 0.9, tOut: 8 });
      });
      const cl = new U.Rand('chair-leaves');
      const sprouts = [[cxp + 26, gy - 446], [cxp + 52, gy - 464], [cxp + 4, gy - 420], [cxp + 132, gy - 168], [cxp + 158, gy - 186], [cxp - 3, gy - 60]];
      for (let i = 0; i < 12; i++) {
        const base = sprouts[i % sprouts.length];
        const a = -Math.PI / 2 + cl.range(-1.3, 1.3);
        const lf = D.leaf(base[0], base[1], a, cl.range(36, 56), cl.range(12, 16), { bend: cl.range(-0.12, 0.12) });
        K.stroke(R, lf.outline, T0 + 2.9 + i * 0.09, T0 + 3.3 + i * 0.09, { w: 1.0 });
        K.stroke(R, lf.mid, T0 + 3.2 + i * 0.09, T0 + 3.4 + i * 0.09, { w: 0.6 });
        K.wash(R, lf.outline, i % 3 ? PAL.leaf : PAL.moss, T0 + 3.6 + i * 0.06, T0 + 4.3 + i * 0.06, { alpha: 0.55, amp: 1.5, seed: i });
      }

      // labels with base-21 figures under each plant
      [[260, 1], [qx, 2], [cxp + 78, 3]].forEach(([x, n], i) => {
        K.strokes(R, A.numeral(n, x, gy + 150, 8, { center: true, color: PAL.red }), T0 + 4.4 + i * 0.2, T0 + 4.6 + i * 0.2);
        K.label(R, x, gy + 180, 6.4, 2, T0 + 4.6 + i * 0.2, T0 + 5.1 + i * 0.2, { center: true, seed: 'plab' + i });
      });

      // the eye-flower: grown live, then walks away
      const bx = 260;
      const ef = eyeFlower(new U.Rand('eyeflower'));
      const mk = (pts, w, o) => Ink.path(pts, Object.assign({ raw: true, w }, o || {}));
      const S = {
        stem: mk(ef.stem, 2.4, { tOut: 16 }),
        stem2: mk(ef.stem2, 1.1, { tOut: 30 }),
        leaves: ef.leaves.map((l) => ({ o: mk(l.outline, 1.2), m: mk(l.mid, 0.7), v: l.veins.map((v) => Ink.path(v, { w: 0.45 })), u: l.u, poly: l.outline })),
        petals: ef.petals.map((p) => ({ o: mk(p.outline, 1.1), m: mk(p.mid, 0.5), poly: p.outline })),
        inner: ef.inner.map((p) => ({ o: mk(p.outline, 0.9), poly: p.outline })),
        sepals: ef.sepals.map((p) => mk(p.outline, 1.0)),
        roots: ef.roots.map((r, i) => mk(U.catmull(r, 2), 1.3 - i * 0.05, { tOut: 14 })),
      };
      const eyeW = 50, eyeH = 30;
      const wash = {
        leaves: ef.leaves.map((l, i) => Ink.wash(l.outline, PAL.leaf, 0, 1, { alpha: 0.55, amp: 2, seed: 20 + i })),
        petals: ef.petals.map((p, i) => Ink.wash(p.outline, i % 2 ? PAL.rose : PAL.carmine, 0, 1, { alpha: i % 2 ? 0.5 : 0.35, amp: 2, seed: 40 + i })),
        inner: ef.inner.map((p, i) => Ink.wash(p.outline, PAL.saffron, 0, 1, { alpha: 0.5, amp: 1.5, seed: 60 + i })),
        stem: Ink.wash(D.ribbon(ef.stem, (u) => 8 * (1 - u * 0.5)), PAL.moss, 0, 1, { alpha: 0.45, amp: 1.5, seed: 70 }),
      };
      const G = {
        stem: [T0 + 0.7, T0 + 2.0], leaves: T0 + 1.6, petals: [T0 + 2.6, T0 + 3.5], eye: [T0 + 3.4, T0 + 4.0],
        wash: T0 + 3.6, roots: [T0 + 1.0, T0 + 2.2], uproot: T0 + 5.1, walk: 16.25,
      };
      show.warm(G.wash, [wash.stem].concat(wash.leaves, wash.petals, wash.inner));
      const envFor = (sh) => { const s = sh.surf(R); return s ? s.env : { texScale: Ink.texScale || 1.2 }; };

      // pose of the plant: base position, height lift and sway
      const pose = (T) => {
        const up = U.smoothstep(G.uproot, G.uproot + 0.6, T);
        const w = Math.max(0, T - G.walk);
        const speed = 330;
        const x = bx + Math.max(0, w - 0.3) * speed * U.smoothstep(0, 0.9, w) + w * 30;
        const step = Math.sin(w * Math.PI * 3.2);
        const y = gy - Math.abs(step) * 12 * U.sat(w * 3);
        const sway = U.noise(T * 0.9, 4.2) * 0.04 + step * 0.05 * U.sat(w * 3) - up * 0.02;
        return { x, y, up, w, step, sway, lift: up * 60 };
      };
      const eyeLook = (T) => {
        const k = T - G.eye[1];
        return [Math.sin(k * 1.7) * 0.9 * U.sat(k), Math.cos(k * 2.3) * 0.4 * U.sat(k)];
      };
      const blinkAt = (T) => Math.max(U.bump((T - (G.eye[1] + 0.45)) / 0.25), U.bump((T - (G.uproot - 0.25)) / 0.22), U.bump((T - (G.walk + 1.2)) / 0.2));

      // only: 'body' draws everything but the eye, 'eye' only the eye
      const drawPlant = (ctx, T, sh, full, only) => {
        const env = envFor(sh);
        const g = (a, b) => (full ? 1 : U.sat((T - a) / (b - a)));
        // washes first (under the ink)
        const wT = full ? 1 : U.sat((T - G.wash) / 1.2);
        if (only !== 'eye') drawBody(ctx, T, env, g, wT);
        if (only !== 'body') drawEye(ctx, T, g);
      };
      const drawBody = (ctx, T, env, g, wT) => {
        if (wT > 0) {
          wash.stem.draw(ctx, wT, env);
          wash.leaves.forEach((w, i) => w.draw(ctx, U.sat(wT * 1.3 - i * 0.1), env));
          wash.petals.forEach((w, i) => w.draw(ctx, U.sat(wT * 1.2 - (i % 4) * 0.05), env));
          wash.inner.forEach((w) => w.draw(ctx, wT, env));
        }
        drawPart(ctx, S.stem, g(G.stem[0], G.stem[1]));
        drawPart(ctx, S.stem2, g(G.stem[0] + 0.3, G.stem[1] + 0.2));
        S.leaves.forEach((l, i) => {
          const a = G.leaves + i * 0.3;
          drawPart(ctx, l.o, g(a, a + 0.55));
          drawPart(ctx, l.m, g(a + 0.3, a + 0.6));
          l.v.forEach((v, j) => drawPart(ctx, v, g(a + 0.5 + j * 0.02, a + 0.6 + j * 0.02)));
        });
        S.sepals.forEach((s, i) => drawPart(ctx, s, g(G.petals[0] - 0.3 + i * 0.1, G.petals[0] + i * 0.1)));
        S.petals.forEach((p, i) => {
          const a = U.lerp(G.petals[0], G.petals[1] - 0.4, i / S.petals.length);
          drawPart(ctx, p.o, g(a, a + 0.4));
          drawPart(ctx, p.m, g(a + 0.3, a + 0.45));
        });
        S.inner.forEach((p, i) => {
          const a = G.petals[0] + 0.5 + i * 0.05;
          drawPart(ctx, p.o, g(a, a + 0.35));
        });
      };
      const drawEye = (ctx, T, g) => {
        const eu = g(G.eye[0], G.eye[1]);
        if (eu > 0) {
          const open = 1 - blinkAt(T) * 1.9;
          const e = D.eye(ef.fc[0], ef.fc[1], eyeW, eyeH, { look: eyeLook(T), lashes: 7, open: Math.max(-0.4, open) });
          ctx.save();
          ctx.fillStyle = 'rgba(250,244,230,0.9)';
          U.poly(ctx, e.almond);
          ctx.globalAlpha = U.sat(eu * 2);
          ctx.fill();
          ctx.restore();
          if (open > 0.15) {
            ctx.save();
            U.poly(ctx, e.almond);
            ctx.clip();
            ctx.fillStyle = U.rgba(PAL.ultramarine, 0.75 * U.sat(eu * 1.5 - 0.3));
            ctx.beginPath();
            ctx.arc(e.center[0], e.center[1], e.ir, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = U.rgba(PAL.ink, U.sat(eu * 1.5 - 0.4));
            ctx.beginPath();
            ctx.arc(e.center[0], e.center[1], e.ir * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(e.center[0] - e.ir * 0.3, e.center[1] - e.ir * 0.35, e.ir * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          ctx.strokeStyle = U.rgba(PAL.ink);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 1.6;
          U.poly(ctx, e.upper.slice(0, Math.max(2, Math.round(e.upper.length * eu))), false);
          ctx.stroke();
          ctx.lineWidth = 1.1;
          U.poly(ctx, e.lower.slice(0, Math.max(2, Math.round(e.lower.length * eu))), false);
          ctx.stroke();
          if (open > 0.5) {
            ctx.lineWidth = 0.8;
            for (const l of e.lashes) { U.poly(ctx, l, false); ctx.stroke(); }
          }
        }
      };
      const drawRoots = (ctx, T, P) => {
        // underground they are drawn in section; walking they become legs
        S.roots.forEach((r, i) => {
          const u = U.sat((T - G.roots[0] - i * 0.12) / (G.roots[1] - G.roots[0]));
          if (u <= 0) return;
          if (!P || P.up <= 0) { r.draw(ctx, 0, u); return; }
          ctx.save();
          const ph = i * 1.3;
          const swing = Math.sin(P.w * Math.PI * 3.2 + ph) * 0.35 * U.sat(P.w * 2) + (i - 2.5) * 0.05 * P.up;
          ctx.rotate(swing);
          ctx.scale(1, 1 - P.up * 0.25);
          r.draw(ctx, 0, u);
          ctx.restore();
        });
      };

      // growing on the page (layer 0)
      show.actor({
        t0: G.stem[0], t1: G.uproot, layer: 0,
        draw(ctx, T, view, sh) {
          ctx.save();
          ctx.translate(bx, gy);
          drawRoots(ctx, T, null);
          const sway = U.noise(T * 0.9, 4.2) * 0.04 * U.sat(T - G.petals[1]);
          ctx.rotate(sway);
          drawPlant(ctx, T, sh, false);
          ctx.restore();
        },
        activity(T) { return T < G.eye[1] ? 1.5 : 0; },
      });
      // the hole it leaves behind
      const hole = U.catmull([[bx - 50, gy + 2], [bx - 30, gy + 30], [bx, gy + 42], [bx + 34, gy + 28], [bx + 52, gy + 2]], 2);
      R.add(new Ink.FnMark((ctx, u, env) => {
        ctx.save();
        U.poly(ctx, hole.concat([[bx - 50, gy + 2]]));
        ctx.clip();
        if (env && env.paper) {
          const k = env.paper.width / PW;
          ctx.drawImage(env.paper, (bx - 60) * k, (gy - 2) * k, 120 * k, 50 * k, bx - 60, gy - 2, 120, 50);
        }
        ctx.restore();
        Ink.path(hole, { raw: true, w: 1.2 }).draw(ctx, 1);
      }, G.uproot + 0.35, G.uproot + 0.35));
      K.hatch(R, hole.concat([[bx - 50, gy + 2]]), G.uproot + 0.5, G.uproot + 0.9, { spacing: 3.2, w: 0.5, angle: 0.9 });
      K.label(R, bx, gy + 76, 6, 2, G.uproot + 0.9, G.uproot + 1.3, { center: true, seed: 'empty' });

      // Once grown, the body of the plant no longer changes: it is painted once into its own
      // canvas and that picture walks, with only the roots and the eye drawn fresh each frame.
      const bodyBox = (() => {
        const polys = [ef.stem, ef.stem2, wash.stem.poly].concat(ef.leaves.map((l) => l.outline), ef.petals.map((p) => p.outline), ef.inner.map((p) => p.outline), ef.sepals.map((p) => p.outline));
        const b = U.bbox([].concat(...polys));
        return { x0: b.x0 - 16, y0: b.y0 - 16, x1: b.x1 + 16, y1: b.y1 + 16 };
      })();
      let bodyCache = null;
      const drawBodyCached = (ctx, T, view, sh) => {
        if (!bodyCache) {
          const sc = U.clamp(view.pxPerUnit * 1.25, 1.5, 3);
          const bw = bodyBox.x1 - bodyBox.x0, bh = bodyBox.y1 - bodyBox.y0;
          const c = U.canvas(Math.ceil(bw * sc), Math.ceil(bh * sc));
          const g = c.getContext('2d');
          g.setTransform(sc, 0, 0, sc, -bodyBox.x0 * sc, -bodyBox.y0 * sc);
          drawPlant(g, T, sh, true, 'body');
          bodyCache = c;
        }
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(bodyCache, bodyBox.x0, bodyBox.y0, bodyBox.x1 - bodyBox.x0, bodyBox.y1 - bodyBox.y0);
        ctx.restore();
        drawPlant(ctx, T, sh, false, 'eye');
      };

      // walking (lifted, layer 1)
      show.actor({
        t0: G.uproot, t1: T1 + 0.3, layer: 1,
        draw(ctx, T, view, sh) {
          const P = pose(T);
          view.lift(ctx, P.x, P.y, P.lift);
          ctx.rotate(P.sway);
          drawRoots(ctx, T, P);
          drawBodyCached(ctx, T, view, sh);
        },
        shadow(ctx, T) {
          const P = pose(T);
          const z = P.lift + 20;
          ctx.translate(P.x + z * B.LIGHT.sx, P.y + z * B.LIGHT.sy);
          ctx.rotate(P.sway);
          ctx.globalAlpha = 0.34;
          ctx.fillStyle = '#000';
          ctx.strokeStyle = '#000';
          ctx.lineCap = 'round';
          ctx.lineWidth = 8;
          U.poly(ctx, ef.stem, false);
          ctx.stroke();
          for (const l of ef.leaves) { U.poly(ctx, l.outline); ctx.fill(); }
          for (const p of ef.petals) { U.poly(ctx, p.outline); ctx.fill(); }
          ctx.lineWidth = 4;
          for (const r of ef.roots) { U.poly(ctx, r, false); ctx.stroke(); }
        },
      });
      show.cue(G.uproot, 'uproot');
      for (let k = 0; k < 10; k++) show.cue(G.walk + 0.3125 * k, 'step', { k });

      // camera
      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.cam(T0 + 2.4, [-260, 260, 1360, 1180], { n: [0, 240, 1000, 1200] });
      show.cam(T0 + 5.2, [-60, 330, 1080, 980], { n: [20, 330, 980, 1100] });
      show.cam(T0 + 7.8, [520, 300, 1300, 1080], { n: [380, 330, 1000, 1150] });
      show.cam(T1 - 0.35, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'I · Flora', 'plants that grow into furniture, watch you, and walk away');
    },
  });
})((window.Codex = window.Codex || {}));
