/* IX–X · Food, Garments & Games — a goose game of sixty-three squares played by itself;
   spaghetti made of handwriting, twirled on a fork; a bleeding fruit; a coat with six sleeves. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;

  function goose(x, y, s, flip) {
    const f = flip ? -1 : 1;
    const P = (pts) => pts.map(([a, b]) => [x + a * s * f, y + b * s]);
    return [
      P([[-10, 4], [-4, -2], [6, -2], [10, 2], [6, 7], [-6, 8], [-10, 4]]),
      P([[6, -1], [8, -8], [7, -14], [11, -15], [14, -13]]),
    ];
  }

  C.Scenes.push({
    id: 'customs',
    build(show, TL) {
      const sp = show.spread([318, 319]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[5][1], T1 = TL.turns[6][0];
      show.turn(TL.turns[5][0], TL.turns[5][1], 5, 6);
      const pre = TL.turns[5][0] - 1;
      K.furniture(L, 318, 'L', pre);
      K.furniture(R, 319, 'R', pre);
      K.strokes(L, A.numeral(10, 500, 140, 22, { center: true, color: PAL.red, weight: 0.13 }), pre, pre);
      K.strokes(L, A.display(500, 214, 20, { center: true, seed: 'game-title', swash: false, weight: 0.1 }).strokes, pre, pre);

      // ---------------------------------------------------------- the goose game: 63 squares on a spiral
      const c = [500, 700];
      const tw = 74, rOut = 380, rMin = 112;
      const thMax = ((rOut - tw - rMin) * TAU) / tw;
      const ph0 = Math.PI; // start at the left
      const rad = (th) => rOut - (tw / TAU) * th;
      const P = (th, r) => [c[0] + Math.cos(ph0 + th) * r, c[1] + Math.sin(ph0 + th) * r];
      const outer = [], inner = [], mid = [];
      for (let i = 0; i <= 900; i++) {
        const th = (i / 900) * thMax;
        outer.push(P(th, rad(th)));
        inner.push(P(th, rad(th) - tw));
        mid.push(P(th, rad(th) - tw / 2));
      }
      const midLen = U.pathLen(mid);
      // cell boundaries at equal arc length along the middle of the track
      const cum = [0];
      for (let i = 1; i < mid.length; i++) cum.push(cum[i - 1] + Math.hypot(mid[i][0] - mid[i - 1][0], mid[i][1] - mid[i - 1][1]));
      const thAt = (d) => {
        let lo = 0, hi = cum.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
        return ((lo + (d - cum[lo]) / (cum[hi] - cum[lo] || 1)) / 900) * thMax;
      };
      const N = 63;
      const bounds = [];
      for (let k = 0; k <= N; k++) bounds.push(thAt((k / N) * midLen));
      const cellCenter = (k) => { const th = thAt(((k + 0.5) / N) * midLen); return P(th, rad(th) - tw / 2); };
      const b0 = T0 + 0.2;
      K.stroke(L, outer, b0, b0 + 1.0, { raw: true, w: 1.4 });
      K.stroke(L, inner, b0 + 0.2, b0 + 1.2, { raw: true, w: 1.2 });
      K.stroke(L, U.densify([P(0, rOut), P(0, rOut - tw)], 1.5), b0 + 0.1, b0 + 0.2, { raw: true, w: 1.2 });
      const dividers = bounds.slice(1, -1).map((th) => [P(th, rad(th)), P(th, rad(th) - tw)]);
      K.lines(L, dividers, b0 + 0.9, b0 + 1.8, { w: 0.8, mode: 'stagger' });
      const special = { 6: 'bridge', 19: 'inn', 31: 'well', 42: 'maze', 52: 'prison', 58: 'death' };
      const geese = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
      const tints = [PAL.ochre, PAL.rose, PAL.sky, PAL.sage];
      for (let k = 0; k < N; k++) {
        const t = b0 + 1.3 + k * 0.022;
        const th0 = bounds[k], th1 = bounds[k + 1];
        const cell = [];
        for (let i = 0; i <= 8; i++) { const th = U.lerp(th0, th1, i / 8); cell.push(P(th, rad(th) - 2)); }
        for (let i = 8; i >= 0; i--) { const th = U.lerp(th0, th1, i / 8); cell.push(P(th, rad(th) - tw + 2)); }
        L.add(Ink.wash(cell, tints[k % 4], t + 0.4, t + 0.7, { alpha: 0.32, amp: 1.2, seed: k, soft: 0.2, layers: 2 }));
        const thm = (th0 + th1) / 2;
        const np = P(thm, rad(thm) - 13);
        K.strokes(L, A.numeral(k + 1, np[0], np[1] + 3, 5.2, { center: true, color: PAL.red, weight: 0.13 }), t, t + 0.06);
        const cc = P(thm, rad(thm) - tw * 0.58);
        const kind = special[k + 1] || (geese.indexOf(k + 1) >= 0 ? 'goose' : null);
        if (!kind) continue;
        const s = 1.25;
        const doodles = {
          goose: () => goose(cc[0], cc[1], s, (k % 2) === 0),
          bridge: () => [U.arc(cc[0], cc[1] + 8, 14, Math.PI, TAU, 10), [[cc[0] - 16, cc[1] + 8], [cc[0] + 16, cc[1] + 8]]],
          inn: () => [[[cc[0] - 10, cc[1] + 9], [cc[0] - 10, cc[1] - 2], [cc[0], cc[1] - 11], [cc[0] + 10, cc[1] - 2], [cc[0] + 10, cc[1] + 9], [cc[0] - 10, cc[1] + 9]]],
          well: () => [U.circle(cc[0], cc[1] + 2, 9, 12).concat([[cc[0] + 9, cc[1] + 2]]), [[cc[0] - 11, cc[1] - 10], [cc[0], cc[1] - 15], [cc[0] + 11, cc[1] - 10]]],
          maze: () => [U.circle(cc[0], cc[1], 1, 2).concat(Array.from({ length: 30 }, (_, i) => [cc[0] + Math.cos(i * 0.6) * i * 0.45, cc[1] + Math.sin(i * 0.6) * i * 0.45]))],
          prison: () => [[[cc[0] - 10, cc[1] - 10], [cc[0] + 10, cc[1] - 10], [cc[0] + 10, cc[1] + 10], [cc[0] - 10, cc[1] + 10], [cc[0] - 10, cc[1] - 10]], [[cc[0] - 3, cc[1] - 10], [cc[0] - 3, cc[1] + 10]], [[cc[0] + 4, cc[1] - 10], [cc[0] + 4, cc[1] + 10]]],
          death: () => [U.circle(cc[0], cc[1] - 2, 9, 14).concat([[cc[0] + 9, cc[1] - 2]]), U.circle(cc[0] - 3.5, cc[1] - 3, 1.6, 6).concat([[cc[0] - 1.9, cc[1] - 3]]), U.circle(cc[0] + 3.5, cc[1] - 3, 1.6, 6).concat([[cc[0] + 5.1, cc[1] - 3]]), [[cc[0] - 5, cc[1] + 10], [cc[0] + 5, cc[1] + 10]]],
        };
        K.lines(L, doodles[kind](), t + 0.1, t + 0.35, { w: 0.8, mode: 'seq' });
      }
      // the goose in the garden at the centre (square sixty-three)
      const gc = [c[0] + 10, c[1] + 10];
      const big = goose(gc[0], gc[1], 5.2, false);
      K.lines(L, big, b0 + 1.6, b0 + 2.3, { w: 1.4, mode: 'seq' });
      K.pencil(L, big[0], PAL.ochre, b0 + 2.3, b0 + 2.9, { seed: 'goose', alpha: 0.35 });
      L.add(Ink.dots([[gc[0] + 54, gc[1] - 64, 3]], 3, b0 + 2.3, b0 + 2.35));
      K.stroke(L, U.circle(gc[0] - 44, gc[1] + 50, 12, 16, 0, 16).concat([[gc[0] - 32, gc[1] + 50]]), b0 + 2.3, b0 + 2.5, { w: 1.1 });
      K.strokes(L, A.numeral(63, gc[0] - 44, gc[1] + 92, 8, { center: true, color: PAL.red }), b0 + 2.4, b0 + 2.6);
      K.printed(L, { seed: 'game-text', x: 96, y: 1150, w: 808, size: 7.4, lines: 7 }, pre);

      // ---------------------------------------------------------- dice and pawns
      const HOP = 0.15625, ROLL = 0.625;
      const rolls = [
        { t: 62.5, v: [3, 5], pawn: 0 },
        { t: 65.0, v: [2, 6], pawn: 1 },
        { t: 67.5, v: [4, 3], pawn: 0 },
      ];
      const moves = [[], []];
      const pos = [0, 0];
      rolls.forEach((r) => {
        const n = r.v[0] + r.v[1];
        const start = r.t + ROLL;
        for (let k = 0; k < n; k++) moves[r.pawn].push({ t: start + k * HOP, from: pos[r.pawn] + k, to: pos[r.pawn] + k + 1 });
        pos[r.pawn] += n;
        r.end = start + n * HOP;
      });
      const startSpot = (p) => { const q = cellCenter(0); return [q[0] - 60 + p * 20, q[1] + 58 - p * 16]; };
      const pawnAt = (p, T) => {
        let cell = -1, hop = 0;
        for (const m of moves[p]) {
          if (T >= m.t + HOP) cell = m.to;
          else if (T >= m.t) { const f = (T - m.t) / HOP; const a = m.from === 0 ? startSpot(p) : cellCenter(m.from - 1), b = cellCenter(m.to - 1); return { x: U.lerp(a[0], b[0], f), y: U.lerp(a[1], b[1], f), z: Math.sin(f * Math.PI) * 26 }; }
        }
        if (cell <= 0) { const q = startSpot(p); return { x: q[0], y: q[1], z: 0 }; }
        const q = cellCenter(cell - 1);
        return { x: q[0] + (p ? 8 : -8), y: q[1] + (p ? 6 : -6), z: hop };
      };
      const pawnCols = [PAL.carmine, PAL.ultramarine];
      const pT = T0 + 2.1;
      show.actor({
        t0: pT, t1: T1 + 0.01, layer: 1,
        draw(ctx, T, view) {
          for (let p = 0; p < 2; p++) {
            const q = pawnAt(p, T);
            const drop = 1 - U.smoothstep(pT + p * 0.15, pT + p * 0.15 + 0.35, T);
            ctx.save();
            view.lift(ctx, q.x - PW, q.y, q.z + drop * 300);
            ctx.globalAlpha = 1 - drop * 0.8;
            ctx.fillStyle = U.rgba(pawnCols[p]);
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = U.rgba(PAL.ink);
            ctx.lineWidth = 1.3;
            ctx.stroke();
            ctx.fillStyle = U.rgba(U.mixc(pawnCols[p], [255, 255, 255], 0.35));
            ctx.beginPath();
            ctx.arc(-2, -2, 6.5, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(-4, -4, 2, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        },
        shadow(ctx, T) {
          for (let p = 0; p < 2; p++) {
            const q = pawnAt(p, T);
            const z = q.z + 20;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath();
            ctx.arc(q.x - PW + z * B.LIGHT.sx, q.y + z * B.LIGHT.sy, 13, 0, TAU);
            ctx.fill();
          }
        },
      });
      for (const r of rolls) {
        let k = 0;
        for (const m of moves[r.pawn]) if (m.t >= r.t && m.t < r.end) show.cue(m.t + HOP * 0.9, 'hop', { k: k++, pawn: r.pawn });
        show.cue(r.t, 'dice');
      }
      // two dice for each roll, tumbling in from the fore-edge
      const dieState = (r, k, T) => {
        const u = U.sat((T - r.t) / ROLL);
        const sx = 960 + k * 30, sy = 1260 - k * 60;
        const ex = 780 + k * 58, ey = 1090 + k * 30;
        const x = U.lerp(sx, ex, U.easeOut(u)), y = U.lerp(sy, ey, U.easeOut(u));
        const bounce = Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * 120;
        const rot = (1 - U.easeOut(u)) * 9 + k * 0.4 + r.v[k] * 0.3;
        return { x, y, z: bounce, rot, landed: u >= 1, u };
      };
      const drawDie = (ctx, d, value, flicker) => {
        const s = 22;
        ctx.rotate(d.rot);
        // sides visible toward the light's opposite
        ctx.fillStyle = '#b9a47f';
        ctx.beginPath();
        ctx.moveTo(-s, s); ctx.lineTo(s, s); ctx.lineTo(s + 6, s + 7); ctx.lineTo(-s + 6, s + 7); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s, -s); ctx.lineTo(s + 6, -s + 7); ctx.lineTo(s + 6, s + 7); ctx.lineTo(s, s); ctx.closePath();
        ctx.fillStyle = '#cdb994';
        ctx.fill();
        ctx.fillStyle = '#f1e7d0';
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.strokeStyle = U.rgba(PAL.ink);
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        const v = flicker ? 1 + ((flicker * 7) % 6) : value;
        const glyphs = A.numeral(v, -5, 9, 16, { weight: 0.13 });
        for (const g of glyphs) g.draw(ctx, 1);
      };
      rolls.forEach((r, ri) => {
        for (let k = 0; k < 2; k++) {
          show.actor({
            t0: r.t, t1: ri < 2 ? rolls[ri + 1].t : T1 + 0.01, layer: 1,
            draw(ctx, T, view) {
              const d = dieState(r, k, T);
              ctx.save();
              view.lift(ctx, d.x - PW, d.y, d.z);
              drawDie(ctx, d, r.v[k], d.landed ? 0 : Math.floor(T * 14));
              ctx.restore();
            },
            shadow(ctx, T) {
              const d = dieState(r, k, T);
              const z = d.z + 16;
              ctx.save();
              ctx.translate(d.x - PW + z * B.LIGHT.sx, d.y + z * B.LIGHT.sy);
              ctx.rotate(d.rot);
              ctx.fillStyle = 'rgba(0,0,0,0.55)';
              ctx.fillRect(-24, -24, 48, 48);
              ctx.restore();
            },
          });
        }
      });

      // ---------------------------------------------------------- the right page: food and a garment
      // a plate of spaghetti made of handwriting
      const plate = [500, 390];
      const r0 = T0 + 0.5;
      K.stroke(R, D.ellipse(plate[0], plate[1], 262, 168, 70).concat([[plate[0] + 262, plate[1]]]), r0, r0 + 0.5, { raw: false, w: 1.4 });
      K.stroke(R, D.ellipse(plate[0], plate[1], 196, 122, 60).concat([[plate[0] + 196, plate[1]]]), r0 + 0.3, r0 + 0.7, { raw: false, w: 1.0 });
      K.pencil(R, D.ellipse(plate[0], plate[1], 262, 168, 50), PAL.sky, r0 + 0.8, r0 + 1.4, { seed: 'plate', alpha: 0.2, passes: 1 });
      const nr = new U.Rand('noodles');
      const noodles = [];
      for (let k = 0; k < 9; k++) {
        const pts = [];
        const n = 7;
        const a0 = nr.range(0, TAU);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * TAU * 1.3 + nr.range(-0.4, 0.4);
          const rr = nr.range(0.25, 0.9);
          pts.push([plate[0] + Math.cos(a) * 170 * rr, plate[1] + Math.sin(a) * 104 * rr]);
        }
        noodles.push(U.catmull(pts, 3));
      }
      noodles.forEach((path, k) => {
        const ws = A.alongPath(path, 5.2, { seed: 'noodle' + k, weight: 0.13, color: PAL.umber });
        const t = r0 + 0.8 + k * 0.12;
        ws.forEach((w, i) => K.strokes(R, w.strokes, t + i * 0.03, t + i * 0.03 + 0.2));
      });
      const sauce = U.deform(D.ellipse(plate[0] + 10, plate[1] - 6, 84, 52, 30), 14, 0.03, 4);
      K.wash(R, sauce, PAL.carmine, r0 + 2.3, r0 + 2.9, { alpha: 0.55, amp: 6, seed: 8 });
      R.add(Ink.dots([[plate[0] - 30, plate[1] - 10, 5], [plate[0] + 44, plate[1] + 12, 4], [plate[0] + 8, plate[1] + 30, 4.5]], 4, r0 + 2.8, r0 + 3.0, { color: PAL.moss }));
      // the fork twirls, winding a spiral of writing around itself
      const tip = [plate[0] + 30, plate[1] - 4];
      const twirl = [T0 + 5.0, T0 + 7.4];
      const windPath = [];
      for (let i = 0; i <= 300; i++) {
        const f = i / 300;
        const a = f * TAU * 4.2;
        const rr = U.lerp(70, 10, f);
        windPath.push([tip[0] + Math.cos(a) * rr, tip[1] + Math.sin(a) * rr * 0.8]);
      }
      const wound = A.alongPath(windPath, 4.6, { seed: 'wind', weight: 0.14, color: PAL.umber });
      wound.forEach((w, i) => R.add(new Ink.StrokeMark(w.strokes, U.lerp(twirl[0], twirl[1], w.s0 / U.pathLen(windPath)), U.lerp(twirl[0], twirl[1], w.s1 / U.pathLen(windPath)))));
      show.actor({
        t0: r0 + 1.8, t1: T1 + 0.01, layer: 1,
        draw(ctx, T, view) {
          const reveal = U.sat((T - (r0 + 1.8)) / 0.5);
          const a = -0.55 + Math.max(0, T - twirl[0]) * 5.5 * (1 - U.smoothstep(twirl[1], twirl[1] + 0.3, T));
          view.lift(ctx, tip[0], tip[1], 20);
          ctx.rotate(a);
          ctx.globalAlpha = reveal;
          ctx.strokeStyle = U.rgba(PAL.ink);
          ctx.lineCap = 'round';
          ctx.fillStyle = '#d9d2c4';
          // handle
          ctx.beginPath();
          ctx.moveTo(34, -5);
          ctx.lineTo(330, -9);
          ctx.quadraticCurveTo(344, 0, 330, 9);
          ctx.lineTo(34, 5);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 1.3;
          ctx.stroke();
          // neck and tines
          ctx.beginPath();
          ctx.moveTo(34, -5);
          ctx.quadraticCurveTo(20, -12, 6, -13);
          ctx.lineTo(6, 13);
          ctx.quadraticCurveTo(20, 12, 34, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          for (let k = 0; k < 4; k++) {
            const y = -10 + k * 6.6;
            ctx.beginPath();
            ctx.moveTo(6, y);
            ctx.lineTo(-40, y);
            ctx.lineWidth = 2.4;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        },
        shadow(ctx, T) {
          const a = -0.55 + Math.max(0, T - twirl[0]) * 5.5 * (1 - U.smoothstep(twirl[1], twirl[1] + 0.3, T));
          ctx.translate(tip[0] + 40 * B.LIGHT.sx, tip[1] + 40 * B.LIGHT.sy);
          ctx.rotate(a);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-40, -12, 380, 24);
        },
      });
      show.cue(twirl[0], 'twirl', { dur: twirl[1] - twirl[0] });

      // a bleeding fruit, cut in half
      const fc = [238, 770];
      const f0 = T0 + 1.4;
      const skin = U.catmull([[fc[0] - 96, fc[1]], [fc[0] - 84, fc[1] - 70], [fc[0] - 30, fc[1] - 106], [fc[0] - 12, fc[1] - 122], [fc[0] + 12, fc[1] - 122], [fc[0] + 30, fc[1] - 106], [fc[0] + 84, fc[1] - 70], [fc[0] + 96, fc[1]], [fc[0] + 70, fc[1] + 64], [fc[0], fc[1] + 92], [fc[0] - 70, fc[1] + 64], [fc[0] - 96, fc[1]]], 2);
      const flesh = skin.map(([x, y]) => [fc[0] + (x - fc[0]) * 0.86, fc[1] + (y - fc[1]) * 0.86 + 4]);
      K.stroke(R, skin, f0, f0 + 0.6, { raw: true, w: 1.5 });
      K.stroke(R, flesh, f0 + 0.4, f0 + 0.9, { raw: true, w: 0.9 });
      const rind = skin.concat(flesh.slice().reverse());
      K.pencil(R, rind, PAL.carmine, f0 + 0.9, f0 + 1.5, { seed: 'skin', alpha: 0.5, spacing: 1.8 });
      K.wash(R, flesh, PAL.blush, f0 + 1.0, f0 + 1.5, { alpha: 0.45, amp: 2, seed: 30, soft: 0.5 });
      K.wash(R, flesh.map(([x, y]) => [fc[0] + (x - fc[0]) * 0.55, fc[1] + (y - fc[1]) * 0.55]), PAL.rose, f0 + 1.2, f0 + 1.6, { alpha: 0.4, amp: 2, seed: 31 });
      const seedsR = new U.Rand('seeds');
      for (let k = 0; k < 16; k++) {
        const a = seedsR.range(0, TAU), rr = seedsR.range(10, 62);
        const sx = fc[0] + Math.cos(a) * rr, sy = fc[1] + Math.sin(a) * rr * 0.9;
        const ws = A.wordStrokes({ g: [seedsR.int(0, A.GL.length - 1)], dia: [], fin: -1 }, seedsR, sx - 4, sy + 4, 9, { color: PAL.red, weight: 0.13 });
        K.strokes(R, ws.strokes, f0 + 1.0 + k * 0.04, f0 + 1.2 + k * 0.04);
      }
      const drip = [T0 + 3.1, T0 + 4.6];
      const dripPath = U.catmull([[fc[0] + 40, fc[1] + 80], [fc[0] + 46, fc[1] + 130], [fc[0] + 40, fc[1] + 190], [fc[0] + 48, fc[1] + 250]], 1.5);
      K.stroke(R, dripPath, drip[0], drip[1], { raw: true, w: 4.2, color: PAL.carmine, alpha: 0.85, tIn: 1, tOut: 1 });
      K.wash(R, U.deform(D.ellipse(fc[0] + 50, fc[1] + 262, 30, 11, 18), 5, 0.1, 2), PAL.carmine, drip[1] - 0.2, drip[1] + 0.6, { alpha: 0.7, amp: 3, seed: 21, origin: [fc[0] + 48, fc[1] + 252] });
      show.cue(drip[0], 'bleed');

      // a coat with six sleeves, hung up like a seraph
      const cc = [690, 860];
      const g0 = T0 + 2.2;
      K.stroke(R, U.catmull([[cc[0], cc[1] - 170], [cc[0] + 10, cc[1] - 186], [cc[0] - 2, cc[1] - 198], [cc[0] - 12, cc[1] - 186]], 1), g0, g0 + 0.15, { raw: true, w: 1.3 });
      K.stroke(R, U.densify([[cc[0], cc[1] - 170], [cc[0] - 90, cc[1] - 130], [cc[0] + 90, cc[1] - 130], [cc[0], cc[1] - 170]], 1.5), g0 + 0.1, g0 + 0.35, { raw: true, w: 1.3 });
      const coat = [[cc[0] - 66, cc[1] - 132], [cc[0] + 66, cc[1] - 132], [cc[0] + 86, cc[1] + 110], [cc[0] - 86, cc[1] + 110]];
      K.stroke(R, U.densify(coat.concat([coat[0]]), 1.5), g0 + 0.3, g0 + 0.8, { raw: true, w: 1.4 });
      K.stroke(R, U.densify([[cc[0], cc[1] - 132], [cc[0], cc[1] + 110]], 1.5), g0 + 0.7, g0 + 0.9, { raw: true, w: 0.9 });
      K.stroke(R, U.catmull([[cc[0] - 28, cc[1] - 132], [cc[0] - 10, cc[1] - 60], [cc[0], cc[1] - 40]], 1), g0 + 0.8, g0 + 0.95, { raw: true, w: 1 });
      K.stroke(R, U.catmull([[cc[0] + 28, cc[1] - 132], [cc[0] + 10, cc[1] - 60], [cc[0], cc[1] - 40]], 1), g0 + 0.85, g0 + 1.0, { raw: true, w: 1 });
      R.add(Ink.dots([[cc[0] + 10, cc[1] - 10, 3.2], [cc[0] + 10, cc[1] + 24, 3.2], [cc[0] + 10, cc[1] + 58, 3.2]], 3, g0 + 1.0, g0 + 1.1));
      K.pencil(R, coat, PAL.violet, g0 + 1.5, g0 + 2.2, { seed: 'coat', alpha: 0.38 });
      const sleeveAngles = [-0.75, -0.1, 0.55];
      sleeveAngles.forEach((a, k) => {
        for (const side of [-1, 1]) {
          const sx = cc[0] + side * 64, sy = cc[1] - 120 + k * 46;
          const ang = side > 0 ? a : Math.PI - a;
          const Pf = D.frame(sx, sy, ang);
          const sl = [Pf(0, -16), Pf(120, -12), Pf(128, 12), Pf(0, 16)];
          K.stroke(R, U.densify(sl.concat([sl[0]]), 1.5), g0 + 1.0 + k * 0.15, g0 + 1.3 + k * 0.15, { raw: true, w: 1.1 });
          K.stroke(R, U.densify([Pf(112, -13), Pf(118, 13)], 1), g0 + 1.3 + k * 0.15, g0 + 1.35 + k * 0.15, { raw: true, w: 0.8 });
          K.pencil(R, sl, k % 2 ? PAL.lilac : PAL.violet, g0 + 1.7 + k * 0.1, g0 + 2.3 + k * 0.1, { seed: 'sl' + k + side, alpha: 0.36 });
        }
      });
      // tailor's dashed pattern line around it
      const dash = D.roundRect(cc[0] - 240, cc[1] - 220, 480, 370, 20, 4);
      const dashes = [];
      const dd = U.resample(dash.concat([dash[0]]), 4);
      for (let i = 0; i + 3 < dd.length; i += 6) dashes.push([dd[i], dd[i + 3]]);
      K.lines(R, dashes, g0 + 2.2, g0 + 2.8, { w: 0.6, mode: 'stagger' });
      [[238, 920, 'fruit'], [500, 610, 'plate'], [cc[0], cc[1] + 150, 'coat']].forEach(([x, y, s], i) => K.label(R, x, y + 22, 6.4, 2, T0 + 3.6 + i * 0.2, T0 + 4.1 + i * 0.2, { center: true, seed: 'cl' + s }));
      K.label(R, 500, 150, 10, 2, pre, pre, { center: true, seed: 'food-head', cap: true });
      K.printed(R, { seed: 'food-text', x: 96, y: 1150, w: 808, size: 7.2, lines: 7 }, pre);

      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-1040, -80, 1080, 1580] });
      show.cam(T0 + 1.0, [-1110, 260, 1220, 1000], { n: [-1000, 280, 1000, 1000] });
      show.cam(T0 + 3.3, [-1150, 120, 2250, 1450], { n: [-1000, 280, 1000, 1000] });
      show.cam(T0 + 5.0, [-40, 140, 1100, 940], { n: [0, 140, 1000, 1000] });
      show.cam(T0 + 6.7, [-1100, 240, 1250, 1040], { n: [-1000, 280, 1000, 1000] });
      show.cam(T1 - 0.3, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'IX–X · Food, Garments & Games', 'a goose game that plays itself; spaghetti made of handwriting');
    },
  });
})((window.Codex = window.Codex || {}));
