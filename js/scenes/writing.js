/* VIII · Writing — the alphabet, one note per letter; a caterpillar made of letters writes a
   spiral, spins a cocoon of thread, and hatches a moth whose wings are pages. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;

  C.Scenes.push({
    id: 'writing',
    build(show, TL) {
      const sp = show.spread([262, 263]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[4][1], T1 = TL.turns[5][0];
      show.turn(TL.turns[4][0], TL.turns[4][1], 4, 5);
      const pre = TL.turns[4][0] - 1;
      K.furniture(L, 262, 'L', pre);
      K.furniture(R, 263, 'R', pre);
      K.strokes(L, A.numeral(8, 500, 140, 22, { center: true, color: PAL.red, weight: 0.13 }), pre, pre);
      K.strokes(L, A.display(500, 214, 20, { center: true, seed: 'writ-title', swash: false, weight: 0.1 }).strokes, pre, pre);

      // ---------------------------------------------------------- the alphabet table
      const cols = 6, rows = 4, cw = 134, ch = 150, gx = 98, gy = 290;
      const grid = [];
      for (let r = 0; r <= rows; r++) grid.push([[gx, gy + r * ch], [gx + cols * cw, gy + r * ch]]);
      for (let c = 0; c <= cols; c++) grid.push([[gx + c * cw, gy], [gx + c * cw, gy + rows * ch]]);
      K.strokes(L, grid.map((g, i) => Ink.rule(g, { w: i === 0 || i === rows || i === rows + 1 || i === rows + cols + 1 ? 1.2 : 0.6, seed: i })), T0 + 0.1, T0 + 0.7, { mode: 'stagger', overlap: 0.3 });
      const letters = A.GL.slice(0, 24);
      const aT = (i) => 50.0 + 7 * 0.625 / 3 + i * (0.625 / 3);
      const lr = new U.Rand('alphabet');
      letters.forEach((gl, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = gx + c * cw, y = gy + r * ch;
        const size = 30;
        const ws = A.wordStrokes({ g: [A.GL.indexOf(gl)], dia: [], fin: -1 }, lr, x + cw / 2 - gl.adv * size * 0.55, y + 92, size, { weight: 0.075, nib: 0.7 });
        K.strokes(L, ws.strokes, aT(i), aT(i) + 0.32, { mode: 'seq' });
        K.label(L, x + cw / 2, y + 132, 5, 1, aT(i) + 0.2, aT(i) + 0.35, { center: true, rand: lr });
        K.strokes(L, A.numeral(i + 1, x + 10, y + 22, 6, { color: PAL.red }), aT(i), aT(i) + 0.08);
        show.cue(aT(i), 'letter', { i });
      });
      // capitals and the twenty-one numerals beneath
      const capT = aT(24) + 0.1;
      A.CAPS.forEach((cp, i) => {
        const ws = A.wordStrokes({ g: [], dia: [], fin: -1 }, lr, gx + 30 + i * 136, 1000, 17, { cap: i, weight: 0.09 });
        K.strokes(L, ws.strokes, capT + i * 0.08, capT + 0.3 + i * 0.08, { mode: 'seq' });
      });
      for (let d = 0; d < 21; d++) {
        const x = gx + 12 + d * 38.5;
        K.strokes(L, A.digit(d, x, 1080, 12, { color: PAL.red, weight: 0.12 }), capT + 0.5 + d * 0.03, capT + 0.6 + d * 0.03);
      }
      K.stroke(L, U.densify([[gx, 1040], [gx + cols * cw, 1040]], 3), capT, capT + 0.3, { raw: true, w: 0.7 });
      K.printed(L, { seed: 'writ-text', x: 96, y: 1150, w: 808, size: 7.4, lines: 7 }, pre);

      // ---------------------------------------------------------- the scribe-worm's spiral
      const cx = 500, cy = 700;
      const spiral = [];
      const turns = 3.1, r0 = 400, r1 = 70;
      for (let i = 0; i <= 1400; i++) {
        const f = i / 1400;
        const th = -Math.PI / 2 + f * turns * TAU;
        const r = U.lerp(r0, r1, Math.pow(f, 0.9));
        spiral.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
      }
      const sLen = U.pathLen(spiral);
      const words = A.alongPath(spiral, 7.2, { seed: 'spiral', weight: 0.11 });
      const wormL = 170;
      const wT = [T0 + 0.9, T0 + 6.1];
      const headAt = (T) => U.lerp(0, sLen + wormL * 0.3, U.sat((T - wT[0]) / (wT[1] - wT[0])));
      const timeWhen = (d) => U.lerp(wT[0], wT[1], d / (sLen + wormL * 0.3));
      for (const w of words) {
        // written by the worm's tail: the word appears as the tail crosses it
        R.add(new Ink.StrokeMark(w.strokes, timeWhen(w.s0 + wormL), timeWhen(w.s1 + wormL), { mode: 'seq', gap: 0.1 }));
      }
      const cum = [0];
      for (let i = 1; i < spiral.length; i++) cum.push(cum[i - 1] + Math.hypot(spiral[i][0] - spiral[i - 1][0], spiral[i][1] - spiral[i - 1][1]));
      const at = (d) => {
        d = U.clamp(d, 0, sLen);
        let lo = 0, hi = cum.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
        const f = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
        const a = spiral[lo], b = spiral[hi];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0])];
      };
      const cocoonT = [wT[1] - 0.2, wT[1] + 0.7];
      show.actor({
        t0: wT[0], t1: cocoonT[1], layer: 0,
        draw(ctx, T) {
          const hd = Math.min(headAt(T), sLen);
          const curl = U.smoothstep(cocoonT[0], cocoonT[1], T);
          const N = 9;
          const segs = [];
          for (let i = 0; i < N; i++) {
            const d = hd - (i / (N - 1)) * wormL * (1 - curl * 0.85);
            const p = at(d);
            // inchworm bob
            const bob = Math.sin(T * 12 - i * 0.9) * 5 * (1 - curl);
            segs.push([p[0] + Math.cos(p[2] - Math.PI / 2) * bob, p[1] + Math.sin(p[2] - Math.PI / 2) * bob, p[2]]);
          }
          ctx.lineCap = 'round';
          for (let i = N - 1; i >= 0; i--) {
            const s = segs[i];
            const r = i === 0 ? 15 : 13 - i * 0.6;
            // tiny legs
            if (i > 0 && curl < 0.8) {
              ctx.strokeStyle = U.rgba(PAL.ink, 0.9);
              ctx.lineWidth = 1;
              for (const side of [-1, 1]) {
                const a = s[2] + side * Math.PI / 2;
                const k = Math.sin(T * 16 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(s[0] + Math.cos(a) * r * 0.8, s[1] + Math.sin(a) * r * 0.8);
                ctx.lineTo(s[0] + Math.cos(a) * (r + 7) + Math.cos(s[2]) * k, s[1] + Math.sin(a) * (r + 7) + Math.sin(s[2]) * k);
                ctx.stroke();
              }
            }
            ctx.fillStyle = U.rgba(i % 2 ? PAL.saffron : PAL.leaf, 1);
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(s[0], s[1], r, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = U.rgba(PAL.ink);
            ctx.lineWidth = 1.3;
            ctx.stroke();
            if (i > 0) {
              // a letter on each segment
              ctx.lineWidth = 0.9;
              ctx.beginPath();
              ctx.arc(s[0], s[1], r * 0.42, 0.3 + i, 0.3 + i + 4.4);
              ctx.stroke();
            }
          }
          const h = segs[0];
          for (const side of [-1, 1]) {
            const a = h[2] + side * 0.5;
            ctx.strokeStyle = U.rgba(PAL.ink);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(h[0] + Math.cos(a) * 12, h[1] + Math.sin(a) * 12);
            ctx.quadraticCurveTo(h[0] + Math.cos(a) * 26, h[1] + Math.sin(a) * 26, h[0] + Math.cos(a + side * 0.4) * 30, h[1] + Math.sin(a + side * 0.4) * 30);
            ctx.stroke();
            ctx.fillStyle = U.rgba(PAL.ink);
            ctx.beginPath();
            ctx.arc(h[0] + Math.cos(h[2] + side * 0.6) * 7, h[1] + Math.sin(h[2] + side * 0.6) * 7, 2.2, 0, TAU);
            ctx.fill();
          }
        },
        activity(T) { return T < wT[1] ? 1.2 : 0; },
      });
      // the cocoon: a pod wound with thread
      const end = at(sLen);
      const pod = D.ellipse(end[0], end[1], 34, 52, 36, 0);
      const podRot = pod.map(([x, y]) => { const dx = x - end[0], dy = y - end[1], a = end[2]; return [end[0] + dx * Math.cos(a) - dy * Math.sin(a), end[1] + dx * Math.sin(a) + dy * Math.cos(a)]; });
      K.stroke(R, podRot.concat([podRot[0], podRot[1]]), cocoonT[0] + 0.3, cocoonT[1], { raw: true, w: 1.3 });
      const wraps = [];
      for (let k = 0; k < 11; k++) {
        const y = -44 + k * 8.8;
        const hw = 34 * Math.sqrt(Math.max(0, 1 - (y / 52) * (y / 52)));
        const a = end[2];
        const P = (x, yy) => [end[0] + x * Math.cos(a) - yy * Math.sin(a), end[1] + x * Math.sin(a) + yy * Math.cos(a)];
        wraps.push([P(-hw, y), P(0, y + 3), P(hw, y + 5)]);
      }
      K.lines(R, wraps, cocoonT[0] + 0.5, cocoonT[1] + 0.3, { w: 0.6, mode: 'stagger' });
      K.pencil(R, podRot, PAL.lilac, cocoonT[1], cocoonT[1] + 0.4, { seed: 'pod', alpha: 0.35 });
      const hatch = cocoonT[1] + 0.55;
      K.stroke(R, [[end[0] - 20, end[1] - 30], [end[0] - 6, end[1] - 40], [end[0] + 4, end[1] - 26], [end[0] + 16, end[1] - 38], [end[0] + 24, end[1] - 28]], hatch, hatch + 0.12, { w: 1.1, raw: false });

      // ---------------------------------------------------------- the moth, with pages for wings
      const mothWing = (side, upper) => {
        const s = side;
        return upper
          ? [[0, -6], [s * 30, -60], [s * 118, -92], [s * 132, -20], [s * 70, 6], [0, 4]]
          : [[0, 6], [s * 60, 14], [s * 96, 62], [s * 50, 96], [s * 10, 50]];
      };
      const flyT = [hatch + 0.35, T1 + 0.25];
      const mothAt = (T) => {
        const u = U.sat((T - flyT[0]) / (flyT[1] - flyT[0]));
        const e = u * u;
        return {
          x: U.lerp(end[0], -80, e) + Math.sin(u * 9) * 40 * (1 - u),
          y: U.lerp(end[1], 520, e) - Math.sin(u * Math.PI) * 120,
          z: U.lerp(10, 5350, Math.pow(u, 1.7)),
          flap: Math.sin(T * 26),
        };
      };
      const lines = [];
      for (let k = 0; k < 6; k++) lines.push(k);
      const drawMoth = (ctx, T, silhouette) => {
        const M = mothAt(T);
        const open = U.smoothstep(hatch, hatch + 0.4, T);
        const flap = 0.35 + 0.65 * (0.5 + 0.5 * M.flap) * U.smoothstep(flyT[0], flyT[0] + 0.3, T) + (1 - U.smoothstep(flyT[0], flyT[0] + 0.3, T)) * 0.9;
        for (const upper of [false, true]) {
          for (const side of [-1, 1]) {
            const w = mothWing(side, upper).map(([x, y]) => [x * open * flap, y * (0.6 + 0.4 * open)]);
            U.poly(ctx, U.catmull(w.concat([w[0]]), 3, false, 0.3));
            if (silhouette) { ctx.fill(); continue; }
            ctx.fillStyle = upper ? '#efe3c8' : '#e8d8b8';
            ctx.fill();
            ctx.save();
            ctx.clip();
            ctx.fillStyle = U.rgba(upper ? PAL.rose : PAL.sky, 0.35);
            ctx.fillRect(-140, -110, 280, 220);
            // tiny lines of writing on each wing-page
            ctx.strokeStyle = U.rgba(PAL.ink, 0.75);
            ctx.lineWidth = 0.7;
            for (const k of lines) {
              const y = (upper ? -70 : 18) + k * (upper ? 12 : 12);
              ctx.beginPath();
              for (let q = 0; q <= 24; q++) {
                const x = side * (8 + q * 5) * open * flap;
                const yy = y + Math.sin(q * 2.1 + k) * 1.6;
                if (q === 0) ctx.moveTo(x, yy);
                else ctx.lineTo(x, yy);
              }
              ctx.stroke();
            }
            ctx.restore();
            ctx.strokeStyle = U.rgba(PAL.ink);
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
        if (silhouette) return;
        ctx.fillStyle = U.rgba(PAL.umber);
        ctx.beginPath();
        ctx.ellipse(0, 8, 7, 30, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = U.rgba(PAL.ink);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 3, -20);
          ctx.quadraticCurveTo(side * 16, -44, side * 26, -48);
          ctx.stroke();
        }
      };
      show.actor({
        t0: hatch, t1: flyT[1], layer: 5,
        draw(ctx, T, view) {
          const M = mothAt(T);
          view.lift(ctx, M.x, M.y, M.z);
          ctx.rotate(Math.sin(T * 3) * 0.2 - 0.3 * U.sat((T - flyT[0]) * 2));
          drawMoth(ctx, T, false);
        },
        shadow(ctx, T) {
          const M = mothAt(T);
          if (M.z > 1500) return;
          ctx.translate(M.x + M.z * B.LIGHT.sx, M.y + M.z * B.LIGHT.sy);
          ctx.globalAlpha = 0.35 * (1 - M.z / 1500);
          ctx.fillStyle = '#000';
          drawMoth(ctx, T, true);
        },
      });
      K.label(R, 500, 170, 10, 2, pre, pre, { center: true, seed: 'spiral-head', cap: true });
      K.printed(R, { seed: 'writ-right', x: 96, y: 1180, w: 808, size: 7.2, lines: 5 }, pre);

      show.cue(wT[0], 'worm', { dur: wT[1] - wT[0] });
      show.cue(hatch, 'hatch');
      show.cue(flyT[0], 'moth');
      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-1040, -80, 1080, 1580] });
      show.cam(T0 + 0.9, [-1090, 180, 1180, 1000], { n: [-1000, 200, 1000, 1000] });
      show.cam(T0 + 4.2, [-1000, 160, 1500, 1200], { n: [-1000, 200, 1000, 1000] });
      show.cam(T0 + 5.4, [-20, 260, 1060, 940], { n: [20, 300, 960, 900] });
      show.cam(hatch + 0.2, [120, 380, 760, 640], { n: [200, 420, 600, 600] });
      show.cam(T1 - 0.3, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'VIII · Writing', 'an alphabet that means nothing, lovingly');
    },
  });
})((window.Codex = window.Codex || {}));
