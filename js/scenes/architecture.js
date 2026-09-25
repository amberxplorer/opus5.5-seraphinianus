/* XI · Architecture — a lagoon city drawn across both pages: a tower shaped like a pen, a tower
   of books, domes, a rainbow for a bridge, a spiral tower wound with script, a tree that is a
   tower, a lighthouse with an eye. Dusk falls and the windows light. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;
  const HZ = 860; // the waterline

  C.Scenes.push({
    id: 'architecture',
    build(show, TL) {
      const sp = show.spread([370, 371]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[6][1];
      show.turn(TL.turns[6][0], TL.turns[6][1], 6, 7);
      const pre = TL.turns[6][0] - 1;
      K.furniture(L, 370, 'L', pre);
      K.furniture(R, 371, 'R', pre);
      // geometry is authored in spread space; `both` places it on whichever pages it touches
      const sh = (pts, dx) => pts.map((p) => [p[0] + dx, p[1]]);
      const pagesFor = (pts) => {
        let mn = Infinity, mx = -Infinity;
        for (const p of pts) { if (p[0] < mn) mn = p[0]; if (p[0] > mx) mx = p[0]; }
        const out = [];
        if (mn < 0) out.push([L, PW]);
        if (mx > 0) out.push([R, 0]);
        return out;
      };
      const ST = (pts, t0, t1, o) => { for (const [pg, dx] of pagesFor(pts)) K.stroke(pg, sh(pts, dx), t0, t1, Object.assign({ raw: true }, o)); };
      const PE = (poly, col, t0, t1, o) => { for (const [pg, dx] of pagesFor(poly)) K.pencil(pg, sh(poly, dx), col, t0, t1, o); };
      const WA = (poly, col, t0, t1, o) => { for (const [pg, dx] of pagesFor(poly)) K.wash(pg, sh(poly, dx), col, t0, t1, Object.assign({ seed: 7 }, o)); };
      const HA = (poly, t0, t1, o) => { for (const [pg, dx] of pagesFor(poly)) K.hatch(pg, sh(poly, dx), t0, t1, o); };
      const LN = (segs, t0, t1, o) => {
        for (const [pg, dx] of pagesFor([].concat(...segs))) K.lines(pg, segs.map((s) => sh(s, dx)), t0, t1, o);
      };
      const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
      const upward = (pts) => pts; // strokes authored bottom-up so buildings rise
      const windows = [];
      const t0 = T0 + 0.2;

      // ---------------------------------------------------------- sky and water
      // a graded wash for the sky: lilac at the top of the page to saffron at the horizon,
      // laid in one pass from the top, its upper edge left ragged by the brush
      const skyTop = 84;
      for (const [pg, dx] of [[L, PW], [R, 0]]) {
        pg.add(new Ink.FnMark((ctx, u) => {
          const e = U.easeInOutSine(u);
          const reveal = skyTop + (HZ + 4 - skyTop) * e;
          ctx.save();
          ctx.beginPath();
          for (let x = -10; x <= 1010; x += 20) {
            const y = skyTop + U.fbm(U.noise, (x - dx) * 0.006, 3.3, 3) * 14;
            if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.lineTo(1010, reveal);
          ctx.lineTo(-10, reveal);
          ctx.closePath();
          ctx.clip();
          ctx.globalCompositeOperation = 'multiply';
          const g = ctx.createLinearGradient(0, skyTop, 0, HZ + 4);
          g.addColorStop(0, U.rgba(PAL.lilac, 0.5));
          g.addColorStop(0.3, U.rgba(PAL.sky, 0.46));
          g.addColorStop(0.62, U.rgba(PAL.rose, 0.38));
          g.addColorStop(0.86, U.rgba(PAL.saffron, 0.5));
          g.addColorStop(1, U.rgba(PAL.orange, 0.42));
          ctx.fillStyle = g;
          ctx.fillRect(-10, skyTop - 20, 1020, HZ + 30 - skyTop);
          // pigment granulation
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = ctx.createPattern(Ink.grainCanvas(), 'repeat');
          ctx.fillRect(-10, skyTop - 20, 1020, HZ + 30 - skyTop);
          ctx.restore();
        }, t0 + 0.1, t0 + 1.8));
      }
      ST(U.densify([[-960, HZ], [960, HZ]], 3), t0, t0 + 0.8, { w: 1.3, wob: 0.4 });
      const wr = new U.Rand('water');
      const ripples = [];
      for (let y = HZ + 8; y < 1080; y += 7 + (y - HZ) * 0.05) {
        let x = -950 + wr.range(0, 60);
        while (x < 950) {
          const len = wr.range(20, 90) * (1 + (y - HZ) / 300);
          ripples.push([[x, y + wr.range(-1, 1)], [x + len, y + wr.range(-1, 1)]]);
          x += len + wr.range(10, 50);
        }
      }
      LN(ripples.filter((r) => r[0][0] < 0), t0 + 0.6, t0 + 2.0, { w: 0.5, mode: 'stagger' });
      LN(ripples.filter((r) => r[0][0] >= 0), t0 + 0.6, t0 + 2.0, { w: 0.5, mode: 'stagger' });
      WA([[-960, HZ + 2], [960, HZ + 2], [960, 1090], [-960, 1090]], PAL.teal, t0 + 1.4, t0 + 2.4, { alpha: 0.3, amp: 8, seed: 60, origin: [0, 900] });
      // a far shore, faint
      const hills = [[-960, HZ]];
      for (let x = -960; x <= 960; x += 60) hills.push([x, HZ - 40 - Math.abs(Math.sin(x * 0.004)) * 50 - Math.sin(x * 0.013) * 12]);
      hills.push([960, HZ]);
      WA(hills, PAL.slate, t0 + 1.0, t0 + 2.0, { alpha: 0.25, amp: 4, seed: 61 });

      // ---------------------------------------------------------- buildings (they rise from the water)
      let bt = t0 + 0.6;
      const rise = (d) => { const a = bt; bt += d * 0.55; return [a, a + d]; };
      // 1 · a tower shaped like a fountain pen, nib to the sky
      {
        const [a, b] = rise(1.1);
        const x0 = -655, x1 = -585;
        ST(upward([[x0, HZ], [x0, 470], [x0 + 15, 442], [x1 - 15, 442], [x1, 470], [x1, HZ]]), a, b, { w: 1.5 });
        ST([[x0 + 15, 442], [-620, 330], [x1 - 15, 442]], b - 0.3, b, { w: 1.4 });
        ST([[-620, 336], [-620, 420]], b - 0.1, b + 0.1, { w: 0.7 });
        ST(U.circle(-620, 420, 4, 10).concat([[-616, 420]]), b, b + 0.1, { w: 0.8 });
        for (let y = 500; y < HZ - 30; y += 60) {
          ST(box(-630, y, -610, y + 26), b + 0.1, b + 0.3, { w: 0.7 });
          windows.push([-620, y + 13]);
        }
        ST(U.densify([[x0, 520], [x1, 520]], 2), b, b + 0.1, { w: 0.9 });
        ST(U.densify([[x0, 530], [x1, 530]], 2), b, b + 0.1, { w: 0.9 });
        PE([[x0, HZ], [x0, 470], [x0 + 15, 442], [x1 - 15, 442], [x1, 470], [x1, HZ]], PAL.ultramarine, b + 0.3, b + 1.0, { seed: 'pen', alpha: 0.4 });
        PE([[x0 + 15, 442], [-620, 330], [x1 - 15, 442]], PAL.gold, b + 0.4, b + 0.9, { seed: 'nib', alpha: 0.55 });
      }
      // 2 · a tower of books
      {
        const [a] = rise(1.2);
        const br = new U.Rand('books');
        let y = HZ;
        const cols = [PAL.carmine, PAL.moss, PAL.ochre, PAL.ultramarine, PAL.umber, PAL.rose];
        for (let k = 0; k < 9; k++) {
          const h = br.range(30, 46), w = br.range(120, 170) - k * 6, cx = -420 + br.range(-14, 14);
          const bx = box(cx - w / 2, y - h, cx + w / 2, y);
          const t = a + k * 0.12;
          ST(U.densify(bx, 2), t, t + 0.25, { w: 1.1 });
          ST(U.densify([[cx - w / 2 + 12, y - h], [cx - w / 2 + 12, y]], 2), t + 0.2, t + 0.3, { w: 0.6 });
          ST(U.densify([[cx + w / 2 - 12, y - h], [cx + w / 2 - 12, y]], 2), t + 0.2, t + 0.3, { w: 0.6 });
          const title = A.label(cx, y - h / 2 + 3, 4.2, 2, { center: true, seed: 'bk' + k });
          for (const [pg, dx] of pagesFor(bx)) K.strokes(pg, title.strokes.map((s) => { const c2 = new Ink.Stroke(Array.from({ length: s.n }, (_, i) => [s.x[i] + dx, s.y[i]]), { w: 0.5 }); return c2; }), t + 0.25, t + 0.35);
          PE(bx, cols[k % cols.length], t + 0.5, t + 1.1, { seed: 'bk' + k, alpha: 0.42 });
          windows.push([cx - w / 2 + 30, y - h / 2]);
          y -= h;
        }
        ST(U.catmull([[-450, y], [-448, y - 40], [-420, y - 62], [-392, y - 40], [-390, y]], 1.5), a + 1.2, a + 1.4, { w: 1.2 });
        ST([[-420, y - 62], [-420, y - 90]], a + 1.4, a + 1.5, { w: 0.9 });
      }
      // 3 · domes
      {
        const [a, b] = rise(1.3);
        ST(U.densify([[-300, HZ], [-300, 700], [-80, 700], [-80, HZ]], 2), a, a + 0.5, { w: 1.4 });
        for (let k = 0; k < 5; k++) {
          const x = -284 + k * 42;
          const arch = U.catmull([[x, HZ], [x, 780], [x + 14, 760], [x + 28, 780], [x + 28, HZ]], 1.5);
          ST(arch, a + 0.3 + k * 0.06, a + 0.5 + k * 0.06, { w: 0.9 });
          PE(arch, PAL.carmine, b + 0.3, b + 0.8, { seed: 'arch' + k, alpha: 0.35 });
          windows.push([x + 14, 800]);
        }
        const dome = (cx, r, t) => {
          const d = U.arc(cx, 700, r, Math.PI, TAU, 24);
          ST(d, t, t + 0.35, { w: 1.3 });
          for (let k = 1; k < 4; k++) ST(U.arc(cx, 700, r * (1 - k * 0.22), Math.PI + 0.2, TAU - 0.2, 12).map(([x, y]) => [x, y + 0]), t + 0.3, t + 0.4, { w: 0.4 });
          ST([[cx, 700 - r], [cx, 700 - r - 26]], t + 0.35, t + 0.45, { w: 1.1 });
          ST(U.circle(cx, 700 - r - 30, 5, 10).concat([[cx + 5, 700 - r - 30]]), t + 0.4, t + 0.5, { w: 0.9 });
          PE(d, PAL.teal, t + 0.6, t + 1.1, { seed: 'dome' + cx, alpha: 0.45 });
        };
        dome(-190, 62, a + 0.6);
        dome(-262, 34, a + 0.8);
        dome(-118, 34, a + 0.85);
        PE([[-300, HZ], [-300, 700], [-80, 700], [-80, HZ]], PAL.ochre, b + 0.2, b + 0.9, { seed: 'basil', alpha: 0.3 });
      }
      // 4 · a rainbow for a bridge, across the gutter
      {
        const [a, b] = rise(1.0);
        const rb = [PAL.carmine, PAL.orange, PAL.saffron, PAL.leaf, PAL.sky, PAL.ultramarine, PAL.violet];
        rb.forEach((col, k) => {
          const r0 = 108 - k * 8, r1 = r0 - 8;
          const outer = U.arc(20, HZ, r0 + 20, Math.PI, TAU, 30, r0 + 26);
          const inner = U.arc(20, HZ, r1 + 20, TAU, Math.PI, 30, r1 + 26);
          PE(outer.concat(inner), col, a + 0.2 + k * 0.05, a + 0.8 + k * 0.05, { seed: 'rb' + k, alpha: 0.5, spacing: 1.6 });
        });
        ST(U.arc(20, HZ, 128, Math.PI, TAU, 40, 134), a, a + 0.5, { w: 1.1 });
        ST(U.arc(20, HZ, 72, Math.PI, TAU, 40, 78), a + 0.1, a + 0.6, { w: 0.9 });
        const rails = [];
        for (let k = 0; k <= 16; k++) { const ang = Math.PI + (k / 16) * Math.PI; rails.push([[20 + Math.cos(ang) * 128, HZ + Math.sin(ang) * 134], [20 + Math.cos(ang) * 142, HZ + Math.sin(ang) * 148]]); }
        LN(rails, b - 0.3, b + 0.1, { w: 0.6, mode: 'stagger' });
        ST(U.arc(20, HZ, 142, Math.PI, TAU, 40, 148), b - 0.1, b + 0.3, { w: 0.8 });
      }
      // 5 · a spiral tower wound with writing
      {
        const [a, b] = rise(1.5);
        const cx = 250, base = 240, top = 36, y1 = 380;
        const w = (y) => U.lerp(top, base, (y - y1) / (HZ - y1));
        ST([[cx - base / 2, HZ], [cx - top / 2, y1], [cx + top / 2, y1], [cx + base / 2, HZ]], a, a + 0.8, { w: 1.4 });
        const ramp = [];
        for (let i = 0; i <= 400; i++) {
          const f = i / 400;
          const y = U.lerp(HZ - 10, y1 + 12, f);
          const ww = w(y) / 2;
          const ph = f * TAU * 5;
          ramp.push([cx + Math.sin(ph) * ww * 0.96, y + Math.cos(ph) * 7]);
        }
        const front = [];
        let seg = [];
        ramp.forEach((p, i) => {
          const ph = (i / 400) * TAU * 5;
          if (Math.cos(ph) > -0.1) seg.push(p);
          else if (seg.length) { front.push(seg); seg = []; }
        });
        if (seg.length) front.push(seg);
        front.forEach((s, k) => { if (s.length > 2) ST(s, a + 0.5 + k * 0.1, a + 0.7 + k * 0.1, { w: 1.0 }); });
        front.forEach((s, k) => {
          if (s.length < 20) return;
          const ws = A.alongPath(s.map((p) => [p[0], p[1] - 3]), 3.4, { seed: 'babel' + k, weight: 0.12 });
          for (const wd of ws) for (const [pg, dx] of pagesFor(s)) K.strokes(pg, wd.strokes.map((st) => new Ink.Stroke(Array.from({ length: st.n }, (_, i) => [st.x[i] + dx, st.y[i]]), { w: 0.45 })), b + 0.1 + k * 0.08, b + 0.3 + k * 0.08);
        });
        PE([[cx - base / 2, HZ], [cx - top / 2, y1], [cx + top / 2, y1], [cx + base / 2, HZ]], PAL.ochre, b, b + 0.9, { seed: 'babel', alpha: 0.35 });
        HA([[cx + 10, y1 + 10], [cx + top / 2, y1], [cx + base / 2, HZ], [cx + 30, HZ]], b + 0.4, b + 0.9, { spacing: 4, w: 0.5, angle: 1.3 });
        for (let k = 0; k < 6; k++) windows.push([cx + (k % 2 ? 20 : -24), 460 + k * 66]);
        ST([[cx, y1], [cx, y1 - 40]], b, b + 0.1, { w: 1 });
        ST([[cx, y1 - 40], [cx + 30, y1 - 32], [cx, y1 - 24]], b + 0.1, b + 0.2, { w: 0.9 });
        PE([[cx, y1 - 40], [cx + 30, y1 - 32], [cx, y1 - 24]], PAL.carmine, b + 0.2, b + 0.5, { seed: 'flag', alpha: 0.6 });
      }
      // 6 · a tree that is a tower
      {
        const [a, b] = rise(1.2);
        const cx = 480;
        ST(U.catmull([[cx - 34, HZ], [cx - 30, 700], [cx - 26, 600], [cx - 40, 560]], 1.5), a, a + 0.5, { w: 1.5 });
        ST(U.catmull([[cx + 34, HZ], [cx + 30, 700], [cx + 28, 600], [cx + 44, 562]], 1.5), a + 0.05, a + 0.55, { w: 1.5 });
        const tr = new U.Rand('treetower');
        const canopy = [];
        for (let k = 0; k < 22; k++) {
          const ang = -Math.PI / 2 + tr.range(-1.4, 1.4);
          const rr = tr.range(40, 120);
          canopy.push([cx + Math.cos(ang) * rr * 1.2, 520 + Math.sin(ang) * rr * 0.8]);
        }
        for (let k = 0; k < 6; k++) {
          const st = D.stem(cx + tr.range(-20, 20), 580, -Math.PI / 2 + tr.range(-1.1, 1.1), tr.range(60, 110), tr.range(-0.6, 0.6), tr);
          ST(st, a + 0.5 + k * 0.08, a + 0.8 + k * 0.08, { w: 1.0, tOut: 8 });
        }
        canopy.forEach((p, k) => {
          const lf = D.leaf(p[0], p[1], tr.range(0, TAU), tr.range(26, 40), tr.range(9, 13));
          ST(lf.outline, a + 0.7 + k * 0.03, a + 0.9 + k * 0.03, { w: 0.8 });
          WA(lf.outline, k % 3 ? PAL.leaf : PAL.moss, b + 0.2 + k * 0.02, b + 0.6 + k * 0.02, { alpha: 0.55, amp: 1.2, seed: 70 + k });
        });
        PE([[cx - 34, HZ], [cx - 30, 700], [cx - 26, 600], [cx + 28, 600], [cx + 30, 700], [cx + 34, HZ]], PAL.umber, b, b + 0.7, { seed: 'trunk', alpha: 0.42 });
        for (let k = 0; k < 4; k++) {
          const y = 640 + k * 52;
          ST(U.catmull([[cx - 10, y + 18], [cx - 10, y], [cx, y - 8], [cx + 10, y], [cx + 10, y + 18], [cx - 10, y + 18]], 1), b + 0.1 + k * 0.05, b + 0.2 + k * 0.05, { w: 0.8 });
          windows.push([cx, y + 6]);
        }
      }
      // 7 · a lighthouse with an eye
      const lh = [735, 410];
      {
        const [a, b] = rise(1.2);
        ST([[lh[0] - 50, HZ], [lh[0] - 26, 470], [lh[0] + 26, 470], [lh[0] + 50, HZ]], a, a + 0.6, { w: 1.4 });
        for (let k = 1; k < 5; k++) {
          const y = 470 + k * 78;
          const hw = U.lerp(26, 50, (y - 470) / (HZ - 470));
          ST(U.densify([[lh[0] - hw, y], [lh[0] + hw, y]], 2), a + 0.5 + k * 0.05, a + 0.6 + k * 0.05, { w: 0.8 });
          if (k % 2) PE([[lh[0] - hw, y], [lh[0] + hw, y], [lh[0] + hw + 5, y + 78], [lh[0] - hw - 5, y + 78]], PAL.carmine, b + 0.2, b + 0.7, { seed: 'lh' + k, alpha: 0.45 });
        }
        ST(U.densify(box(lh[0] - 34, 410, lh[0] + 34, 470), 2), a + 0.6, a + 0.8, { w: 1.2 });
        ST(U.catmull([[lh[0] - 38, 410], [lh[0] - 20, 382], [lh[0], 372], [lh[0] + 20, 382], [lh[0] + 38, 410]], 1.5), a + 0.8, a + 1.0, { w: 1.2 });
        const e = D.eye(lh[0], 440, 44, 26, { lashes: 5 });
        ST(e.upper, b - 0.2, b, { w: 1.0 });
        ST(e.lower, b - 0.15, b, { w: 0.8 });
        ST(e.iris.concat([e.iris[0]]), b, b + 0.1, { w: 0.7 });
        WA(e.iris, PAL.ultramarine, b + 0.1, b + 0.5, { alpha: 0.6, amp: 0.5, seed: 80, soft: 0 });
      }
      // stilt houses and a boat with a page for a sail
      [[-860, 0.9], [880, 1.1], [610, 0.75]].forEach(([x, s], k) => {
        const [a] = rise(0.5);
        const w = 70 * s, h = 60 * s, y = HZ - 40 * s;
        ST([[x - w / 2, y], [x - w / 2, y - h], [x, y - h - 36 * s], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], a, a + 0.4, { w: 1.1 });
        LN([[[x - w / 2 + 8, y], [x - w / 2 + 8, HZ + 30]], [[x + w / 2 - 8, y], [x + w / 2 - 8, HZ + 30]], [[x, y], [x, HZ + 34]]], a + 0.3, a + 0.5, { w: 1.0 });
        PE([[x - w / 2, y], [x - w / 2, y - h], [x, y - h - 36 * s], [x + w / 2, y - h], [x + w / 2, y]], k % 2 ? PAL.ochre : PAL.rose, a + 0.6, a + 1.1, { seed: 'stilt' + k, alpha: 0.4 });
        windows.push([x, y - h / 2]);
      });
      {
        const [a] = rise(0.6);
        const bx = -330, by = 950;
        ST(U.catmull([[bx - 90, by - 16], [bx - 60, by + 6], [bx + 60, by + 6], [bx + 96, by - 20]], 1.5), a, a + 0.3, { w: 1.3 });
        ST([[bx, by + 2], [bx, by - 130]], a + 0.2, a + 0.3, { w: 1.1 });
        const sail = [[bx + 4, by - 126], [bx + 70, by - 110], [bx + 64, by - 26], [bx + 4, by - 30]];
        ST(sail.concat([sail[0]]), a + 0.3, a + 0.5, { w: 1.0 });
        for (let k = 0; k < 6; k++) ST(U.densify([[bx + 12, by - 112 + k * 14], [bx + 58, by - 106 + k * 13]], 3).map(([x, y], i) => [x, y + Math.sin(i * 1.7) * 1.2]), a + 0.5 + k * 0.03, a + 0.6 + k * 0.03, { w: 0.45 });
        PE(U.catmull([[bx - 90, by - 16], [bx - 60, by + 6], [bx + 60, by + 6], [bx + 96, by - 20]], 2), PAL.umber, a + 0.6, a + 1.0, { seed: 'boat', alpha: 0.45 });
      }
      // reflections: wavering strokes under the buildings
      const rr = new U.Rand('reflect');
      const refl = [];
      for (const x of [-620, -420, -300, -250, -190, -130, -90, 250, 220, 280, 480, 735, -860, 880, 610]) {
        for (let k = 0; k < 4; k++) {
          const xx = x + rr.range(-30, 30);
          const len = rr.range(40, 140);
          const pts = [];
          for (let i = 0; i <= 10; i++) pts.push([xx + Math.sin(i * 1.3 + k) * 4, HZ + 8 + (i / 10) * len]);
          refl.push(pts);
        }
      }
      LN(refl.filter((r) => r[0][0] < 0), bt, bt + 1.0, { w: 0.6, mode: 'stagger' });
      LN(refl.filter((r) => r[0][0] >= 0), bt, bt + 1.0, { w: 0.6, mode: 'stagger' });

      // captions and text beneath the view (these will lift away in the finale)
      const textL = K.printed(L, { seed: 'arch-text-l', x: 96, y: 1150, w: 808, size: 7.2, lines: 6 }, pre);
      const textR = K.printed(R, { seed: 'arch-text-r', x: 96, y: 1150, w: 808, size: 7.2, lines: 6 }, pre);
      const capL = K.label(L, 500, 180, 12, 3, pre, pre, { center: true, seed: 'arch-head', cap: true });
      show.archWords = []
        .concat(textL.words.map((w) => ({ w, side: 'L' })))
        .concat(textR.words.map((w) => ({ w, side: 'R' })))
        .concat(capL.words.map((w) => ({ w, side: 'L' })));
      show.archPages = [L, R];

      // ---------------------------------------------------------- life in the city
      const dusk = [T0 + 5.6, T0 + 8.6];
      // a flock of pen-birds
      show.actor({
        t0: T0 + 3.0, t1: TL.close[0] + 0.5, layer: 1,
        draw(ctx, T, view) {
          ctx.strokeStyle = U.rgba(PAL.ink, 0.9);
          ctx.lineCap = 'round';
          for (let k = 0; k < 7; k++) {
            const u = (T - (T0 + 3.0) - k * 0.18) / 7.5;
            if (u < 0 || u > 1) continue;
            const x = U.lerp(-1150, 1150, u) - (k % 3) * 40, y = 300 + Math.sin(u * 5 + k) * 30 + (k % 4) * 26 - u * 80;
            const p = view.proj(x, y, 60);
            const flap = Math.sin(T * 14 + k) * 7;
            ctx.lineWidth = 1.6 * p[2];
            ctx.beginPath();
            ctx.moveTo(p[0] - 14, p[1] - flap);
            ctx.quadraticCurveTo(p[0] - 6, p[1] - 2, p[0], p[1] + 2);
            ctx.quadraticCurveTo(p[0] + 6, p[1] - 2, p[0] + 14, p[1] - flap);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p[0] + 1, p[1] + 2);
            ctx.lineTo(p[0] + 8, p[1] + 5);
            ctx.lineWidth = 1 * p[2];
            ctx.stroke();
          }
        },
      });
      // the fish from chapter two jumps in the lagoon
      const jumps = [T0 + 4.6, T0 + 6.9];
      show.actor({
        t0: jumps[0], t1: jumps[1] + 1.4, layer: 1,
        draw(ctx, T) {
          for (const j of jumps) {
            const u = (T - j) / 1.0;
            if (u < 0 || u > 1.4) continue;
            const x0 = 380, x = x0 + u * 110;
            if (u <= 1) {
              const y = HZ + 40 - Math.sin(u * Math.PI) * 150;
              const ang = Math.atan2(-Math.cos(u * Math.PI) * 150 * Math.PI, 110);
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(-ang);
              ctx.fillStyle = U.rgba(U.mixc(PAL.ultramarine, [240, 230, 210], 0.35));
              ctx.strokeStyle = U.rgba(PAL.ink);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(-26, 0);
              ctx.quadraticCurveTo(0, -14, 22, 0);
              ctx.quadraticCurveTo(0, 12, -26, 0);
              ctx.moveTo(22, 0);
              ctx.lineTo(34, -9);
              ctx.lineTo(32, 9);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
            // rings where it left and where it lands
            for (const [cx, t] of [[x0, u], [x0 + 110, u - 1]]) {
              if (t < 0 || t > 0.4) continue;
              ctx.strokeStyle = U.rgba(PAL.ink, 1 - t / 0.4);
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.ellipse(cx, HZ + 40, 10 + t * 80, 3 + t * 16, 0, 0, TAU);
              ctx.stroke();
            }
          }
        },
      });
      for (const j of jumps) { show.cue(j, 'splash'); show.cue(j + 1.0, 'splash'); }
      // dusk: the paper darkens, windows and the lighthouse eye glow, stars come out
      const starR = new U.Rand('stars');
      const stars = [];
      for (let k = 0; k < 70; k++) stars.push([starR.range(-950, 950), starR.range(90, 520), starR.range(0.8, 2.2), starR.range(0, 6)]);
      show.actor({
        t0: dusk[0], t1: TL.close[1] + 0.2, layer: 0.5,
        draw(ctx, T) {
          const d = U.smoothstep(dusk[0], dusk[1], T) * (1 - U.smoothstep(82.2, TL.close[0], T));
          if (d <= 0) return;
          ctx.globalCompositeOperation = 'lighter';
          for (const [x, y] of windows) {
            const f = U.smoothstep(dusk[0] + 0.5 + ((x + 1000) % 97) / 60, dusk[0] + 1.2 + ((x + 1000) % 97) / 60, T) * d;
            if (f <= 0) continue;
            const r = 14;
            const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
            gg.addColorStop(0, `rgba(255,200,110,${0.75 * f})`);
            gg.addColorStop(1, 'rgba(255,190,90,0)');
            ctx.fillStyle = gg;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
          }
          const f2 = U.smoothstep(dusk[0] + 0.8, dusk[1], T) * d;
          if (f2 > 0) {
            const gg = ctx.createRadialGradient(lh[0], 440, 0, lh[0], 440, 140);
            gg.addColorStop(0, `rgba(255,230,160,${0.8 * f2})`);
            gg.addColorStop(1, 'rgba(255,220,140,0)');
            ctx.fillStyle = gg;
            ctx.fillRect(lh[0] - 140, 300, 280, 280);
            // a sweeping beam
            const a = Math.sin(T * 0.9) * 0.9 + Math.PI;
            ctx.save();
            ctx.translate(lh[0], 440);
            ctx.rotate(a);
            const bg = ctx.createLinearGradient(0, 0, 700, 0);
            bg.addColorStop(0, `rgba(255,236,180,${0.35 * f2})`);
            bg.addColorStop(1, 'rgba(255,236,180,0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(700, -60);
            ctx.lineTo(700, 60);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          const f3 = U.smoothstep(dusk[0] + 1.6, dusk[1] + 0.4, T) * d;
          if (f3 > 0) {
            ctx.fillStyle = 'rgba(255,248,225,1)';
            for (const [x, y, r, ph] of stars) {
              ctx.globalAlpha = f3 * (0.5 + 0.5 * Math.sin(T * 3 + ph));
              ctx.beginPath();
              ctx.arc(x, y, r, 0, TAU);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          ctx.globalCompositeOperation = 'source-over';
        },
      });
      // the darkening itself is ink on the page, so it closes with the book
      for (const pg of [L, R]) {
        pg.add(new Ink.FnMark((ctx, u) => {
          const d = U.smoothstep(0, 1, u);
          ctx.globalCompositeOperation = 'multiply';
          const g = ctx.createLinearGradient(0, 0, 0, 1414);
          g.addColorStop(0, `rgba(60,70,130,${0.55 * d})`);
          g.addColorStop(0.6, `rgba(120,100,150,${0.35 * d})`);
          g.addColorStop(1, `rgba(90,90,130,${0.4 * d})`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, PW, 1414);
          ctx.globalCompositeOperation = 'source-over';
        }, dusk[0], dusk[1]));
      }
      show.cue(dusk[0], 'dusk');

      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-1040, -80, 1080, 1580] });
      show.cam(T0 + 1.1, [-1120, 260, 1140, 860], { n: [-1000, 260, 800, 900] });
      show.cam(T0 + 5.4, [-40, 250, 1120, 860], { n: [200, 260, 800, 900] });
      show.cam(T0 + 7.4, [-900, 60, 1800, 1300], { n: [-500, 100, 1000, 1300] });
      show.cam(T0 + 9.3, [-1160, -160, 2320, 1720], { n: [-1040, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'XI · Architecture', 'a city that rises out of the water and turns in for the night');
    },
  });
})((window.Codex = window.Codex || {}));
