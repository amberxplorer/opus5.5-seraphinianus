/* IV–V · Physics & Machines — a pendulum draws its own damped memory in red ink; a rainbow
   solidifies and sags like ribbon; a clockwork scribe hanging from threads writes a page. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;

  // where the pen is along a list of writing marks at time T
  function penTracker(marks) {
    const ms = marks.filter((m) => m.strokes && m.strokes.length).sort((a, b) => a.t0 - b.t0);
    const start = (m) => { const t = m.strokes[0].tip(0); return [t.x, t.y]; };
    const end = (m) => { const s = m.strokes[m.strokes.length - 1]; const t = s.tip(1); return [t.x, t.y]; };
    return function (T) {
      if (!ms.length) return null;
      if (T <= ms[0].t0) return { p: start(ms[0]), down: false };
      for (let i = 0; i < ms.length; i++) {
        const m = ms[i];
        if (T >= m.t0 && T < m.t1) {
          const u = (T - m.t0) / (m.t1 - m.t0);
          for (let k = 0; k < m.strokes.length; k++) {
            const a = m.win[k * 2], b = m.win[k * 2 + 1];
            if (u < b || k === m.strokes.length - 1) {
              if (u < a) {
                // lifting between strokes of the same word
                const prev = k > 0 ? m.strokes[k - 1].tip(1) : m.strokes[0].tip(0);
                const next = m.strokes[k].tip(0);
                const f = k > 0 ? (u - m.win[k * 2 - 1]) / (a - m.win[k * 2 - 1] || 1) : 1;
                return { p: [U.lerp(prev.x, next.x, f), U.lerp(prev.y, next.y, f)], down: false };
              }
              const t = m.strokes[k].tip((u - a) / (b - a || 1));
              return { p: [t.x, t.y], down: true };
            }
          }
        }
        const n = ms[i + 1];
        if (n && T >= m.t1 && T < n.t0) {
          const f = U.easeInOut((T - m.t1) / (n.t0 - m.t1));
          const a = end(m), b = start(n);
          return { p: [U.lerp(a[0], b[0], f), U.lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 6], down: false };
        }
      }
      return { p: end(ms[ms.length - 1]), down: false, done: true };
    };
  }

  C.Scenes.push({
    id: 'physics',
    build(show, TL) {
      const sp = show.spread([130, 131]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[2][1], T1 = TL.turns[3][0];
      show.turn(TL.turns[2][0], TL.turns[2][1], 2, 3, { riffle: 5 });
      const pre = TL.turns[2][0] - 1;
      K.furniture(L, 130, 'L', pre);
      K.furniture(R, 131, 'R', pre);
      K.strokes(L, A.numeral(4, 500, 140, 22, { center: true, color: PAL.red, weight: 0.13 }), T0 + 0.05, T0 + 0.45, { mode: 'seq' });
      K.strokes(L, A.display(500, 214, 20, { center: true, seed: 'phys-title', swash: false, weight: 0.1 }).strokes, T0 + 0.3, T0 + 1.15, { mode: 'seq', gap: 0.1 });

      // ---------------------------------------------------------- harmonograph
      const hc = [500, 585];
      const pts = [];
      for (let t = 0; t < 92; t += 0.02) {
        const x = 205 * Math.sin(3.0 * t + 0.4) * Math.exp(-0.011 * t) + 95 * Math.sin(2.005 * t + 1.9) * Math.exp(-0.016 * t);
        const y = 205 * Math.sin(2.0 * t) * Math.exp(-0.01 * t) + 95 * Math.sin(3.004 * t + 0.6) * Math.exp(-0.017 * t);
        pts.push([hc[0] + x, hc[1] + y]);
      }
      const harmo = new Ink.Stroke(pts, { w: 0.85, color: PAL.red, alpha: 0.88, tIn: 4, tOut: 30, press: 0.1, q: 0.15 });
      const hT = [T0 + 0.35, T0 + 5.4];
      L.add(new Ink.StrokeMark(harmo, hT[0], hT[1]));
      const pivot = [500, 88];
      show.actor({
        t0: hT[0] - 0.5, t1: T1, layer: 0,
        draw(ctx, T) {
          const u = U.sat((T - hT[0]) / (hT[1] - hT[0]));
          const tip = harmo.tip(u);
          const px = tip.x - PW, py = tip.y;
          const settle = U.smoothstep(hT[1], hT[1] + 1.2, T);
          const tx = U.lerp(px, hc[0] - PW, settle), ty = U.lerp(py, hc[1], settle);
          ctx.strokeStyle = 'rgba(40,28,20,0.55)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(pivot[0] - PW, pivot[1]);
          ctx.lineTo(tx, ty - 14);
          ctx.stroke();
          // the pendulum bob and pen
          ctx.fillStyle = U.rgba(PAL.ink, 0.9);
          ctx.beginPath();
          ctx.arc(tx, ty - 22, 7, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(tx - 3, ty - 16);
          ctx.lineTo(tx + 3, ty - 16);
          ctx.lineTo(tx, ty);
          ctx.closePath();
          ctx.fill();
        },
        activity(T) { return T > hT[0] && T < hT[1] ? 1 : 0; },
      });
      K.stroke(L, U.circle(pivot[0], pivot[1], 5, 12).concat([[505, 88]]), pre, pre, { w: 1 });
      K.stroke(L, U.densify([[470, 82], [530, 82]], 2), pre, pre, { raw: true, w: 1.3 });

      // ---------------------------------------------------------- prism and a rainbow that sags
      const prism = [[292, 936], [352, 1040], [232, 1040]];
      K.stroke(L, U.densify(prism.concat([prism[0]]), 1.5), T0 + 1.0, T0 + 1.5, { raw: true, w: 1.4 });
      K.hatch(L, [[292, 944], [300, 1034], [244, 1034]], T0 + 1.4, T0 + 1.8, { spacing: 3, w: 0.5, angle: 1.2 });
      K.stroke(L, U.densify([[90, 992], [262, 986]], 2), T0 + 1.5, T0 + 1.8, { raw: true, w: 1.1 });
      K.stroke(L, U.densify([[262, 986], [322, 996]], 2), T0 + 1.8, T0 + 1.9, { raw: true, w: 0.8 });
      const rainbow = [PAL.carmine, PAL.orange, PAL.saffron, PAL.leaf, PAL.sky, PAL.ultramarine, PAL.violet];
      const bandPoly = (k, sag, T) => {
        const top = [], bot = [];
        const n = 24;
        for (let i = 0; i <= n; i++) {
          const f = i / n;
          const x = U.lerp(324, 880, f);
          const y0 = U.lerp(996 + k * 1.2, 930 + k * 26, f);
          const y1 = U.lerp(997 + (k + 1) * 1.2, 930 + (k + 1) * 26, f);
          const droop = sag * Math.pow(f, 2.2) * (170 + k * 18) + sag * Math.sin(T * 1.6 + f * 3 + k * 0.4) * 6 * f;
          top.push([x, y0 + droop]);
          bot.push([x - sag * f * f * (k - 3) * 4, y1 + droop + sag * f * f * 10]);
        }
        return top.concat(bot.reverse());
      };
      const rbT = [T0 + 1.9, T0 + 3.0], sagT = [T0 + 5.6, T0 + 7.4];
      show.actor({
        t0: rbT[0], t1: T1, layer: 0,
        draw(ctx, T) {
          const reveal = U.sat((T - rbT[0]) / (rbT[1] - rbT[0]));
          const sag = U.easeInOut(U.sat((T - sagT[0]) / (sagT[1] - sagT[0])));
          ctx.save();
          ctx.translate(-PW, 0);
          ctx.beginPath();
          ctx.rect(300, 700, U.lerp(0, 700, U.easeOut(reveal)), 700);
          ctx.clip();
          ctx.globalCompositeOperation = 'multiply';
          rainbow.forEach((col, k) => {
            ctx.fillStyle = U.rgba(col, 0.55);
            U.poly(ctx, bandPoly(k, sag, T));
            ctx.fill();
          });
          ctx.globalCompositeOperation = 'source-over';
          if (sag > 0) {
            ctx.strokeStyle = U.rgba(PAL.ink, 0.6 * sag);
            ctx.lineWidth = 0.7;
            U.poly(ctx, bandPoly(0, sag, T).slice(0, 25), false);
            ctx.stroke();
            U.poly(ctx, bandPoly(6, sag, T).slice(25), false);
            ctx.stroke();
          }
          ctx.restore();
        },
      });
      // equations in the margin, with base-21 figures
      const eqr = new U.Rand('eq');
      for (let i = 0; i < 3; i++) {
        const y = 1170 + i * 42;
        const lab = A.label(120, y, 7, 2, { rand: eqr });
        K.strokes(L, lab.strokes, pre, pre);
        const ex = 120 + lab.w + 14;
        K.stroke(L, U.densify([[ex, y - 5], [ex + 16, y - 5]], 2), pre, pre, { raw: true, w: 0.9 });
        K.stroke(L, U.densify([[ex, y - 1], [ex + 16, y - 1]], 2), pre, pre, { raw: true, w: 0.9 });
        K.strokes(L, A.numeral(eqr.int(22, 900), ex + 28, y - 10, 6.5, { color: PAL.red }), pre, pre);
        K.stroke(L, U.densify([[ex + 26, y - 3], [ex + 72, y - 3]], 2), pre, pre, { raw: true, w: 0.8 });
        K.strokes(L, A.numeral(eqr.int(22, 400), ex + 30, y + 9, 6.5, { color: PAL.red }), pre, pre);
      }
      K.printed(L, { seed: 'phys-text', x: 470, y: 1160, w: 434, size: 7, lines: 5, indent: 0 }, pre);

      // ---------------------------------------------------------- the clockwork scribe (right page)
      const hx = 318;
      const body = [];
      const add = (pts, t0, t1, o) => { const m = Ink.stroke(pts, t0, t1, Object.assign({ raw: true }, o)); R.add(m); body.push(m); return m; };
      const a0 = T0 + 0.5;
      // threads from the top margin — it hangs like a marionette
      [[hx - 70, 395], [hx, 356], [hx + 90, 515]].forEach(([x, y], i) => add(U.densify([[x + (i - 1) * 8, 110], [x, y]], 4), a0 + i * 0.1, a0 + 0.5 + i * 0.1, { w: 0.45, tIn: 0, tOut: 0, press: 0 }));
      R.add(Ink.dots([[hx - 78, 110, 2.5], [hx, 110, 2.5], [hx + 98, 110, 2.5]], 2, a0, a0 + 0.1));
      // head: a dome with one lens
      add(U.catmull([[hx - 44, 440], [hx - 42, 400], [hx, 356], [hx + 42, 400], [hx + 44, 440], [hx - 44, 440]], 1.5), a0 + 0.3, a0 + 0.8, { w: 1.4 });
      add(U.circle(hx + 8, 408, 15, 20).concat([[hx + 23, 408]]), a0 + 0.7, a0 + 0.9, { w: 1.2 });
      add(U.circle(hx + 8, 408, 6, 12).concat([[hx + 14, 408]]), a0 + 0.85, a0 + 0.95, { w: 0.8 });
      // neck spring
      const spring = [];
      for (let i = 0; i <= 40; i++) spring.push([hx + Math.sin(i * 0.9) * 9, 440 + i * 0.8]);
      add(spring, a0 + 0.8, a0 + 1.0, { w: 0.9 });
      // torso frame
      const torso = U.catmull([[hx - 70, 480], [hx + 70, 476], [hx + 84, 600], [hx + 66, 712], [hx - 62, 716], [hx - 84, 600], [hx - 70, 480]], 2);
      add(torso, a0 + 0.9, a0 + 1.5, { w: 1.6 });
      add(D.close(D.roundRect(hx - 40, 716, 80, 22, 6)), a0 + 1.4, a0 + 1.6, { w: 1.2 });
      // legs (it is, after all, a biped)
      const legs = [[[hx - 24, 738], [hx - 44, 830], [hx - 30, 930]], [[hx + 24, 738], [hx + 50, 826], [hx + 36, 930]]];
      legs.forEach((lg, i) => {
        add(U.densify(lg, 2), a0 + 1.5 + i * 0.1, a0 + 1.8 + i * 0.1, { w: 2.4 });
        add(U.circle(lg[1][0], lg[1][1], 7, 12).concat([[lg[1][0] + 7, lg[1][1]]]), a0 + 1.7 + i * 0.1, a0 + 1.8 + i * 0.1, { w: 1 });
        add(U.catmull([[lg[2][0] - 26, 944], [lg[2][0] - 20, 928], [lg[2][0] + 16, 926], [lg[2][0] + 30, 944], [lg[2][0] - 26, 944]], 1.5), a0 + 1.8 + i * 0.1, a0 + 2.0 + i * 0.1, { w: 1.2 });
      });
      add(U.densify([[150, 948], [520, 948]], 3), a0 + 1.9, a0 + 2.2, { w: 0.9, wob: 0.4 });
      K.hatch(R, [[150, 950], [520, 950], [520, 966], [150, 966]], a0 + 2.1, a0 + 2.5, { spacing: 4, w: 0.5, angle: 0.8 });
      K.pencil(R, torso, PAL.ochre, a0 + 2.6, a0 + 3.3, { seed: 'torso', alpha: 0.3 });
      K.pencil(R, U.catmull([[hx - 44, 440], [hx - 42, 400], [hx, 356], [hx + 42, 400], [hx + 44, 440]], 2), PAL.gold, a0 + 2.7, a0 + 3.3, { seed: 'head', alpha: 0.4 });
      K.wash(R, U.circle(hx + 8, 408, 14, 20), PAL.sky, a0 + 3.0, a0 + 3.4, { alpha: 0.6, amp: 0.6, seed: 5, soft: 0.1 });

      // gears, turning once the machine is wound
      const gears = [
        { c: [hx - 26, 540], r: 40, n: 12, dir: 1 },
        { c: [hx + 36, 588], r: 31, n: 9, dir: -1 },
        { c: [hx - 16, 652], r: 46, n: 14, dir: -1 },
        { c: [hx + 44, 668], r: 22, n: 7, dir: 1 },
      ];
      const wound = 33.75; // beat two of bar fourteen
      gears.forEach((g, i) => {
        const t = a0 + 1.2 + i * 0.25;
        const outline = D.gear(g.c[0], g.c[1], g.r, g.n, { depth: g.r * 0.16 });
        const marks = [
          new Ink.StrokeMark(Ink.rule(outline.concat([outline[0], outline[1]]), { w: 1.1, wob: 0.15, step: 1.2 }), t, t + 0.6),
          Ink.stroke(U.circle(g.c[0], g.c[1], g.r * 0.22, 16).concat([[g.c[0] + g.r * 0.22, g.c[1]]]), t + 0.5, t + 0.6, { w: 0.9 }),
          new Ink.StrokeMark([0, 1, 2, 3, 4].map((k) => {
            const a = (k / 5) * TAU;
            return Ink.path([[g.c[0] + Math.cos(a) * g.r * 0.22, g.c[1] + Math.sin(a) * g.r * 0.22], [g.c[0] + Math.cos(a) * g.r * 0.72, g.c[1] + Math.sin(a) * g.r * 0.72]], { w: 0.8 });
          }), t + 0.55, t + 0.8, { mode: 'seq' }),
          Ink.pencil(U.circle(g.c[0], g.c[1], g.r * 0.8, 24), i % 2 ? PAL.umber : PAL.gold, t + 0.9, t + 1.5, { seed: 'gear' + i, alpha: 0.35 }),
        ];
        const spriteG = new B.InkSprite({ x0: g.c[0] - g.r - 4, y0: g.c[1] - g.r - 4, x1: g.c[0] + g.r + 4, y1: g.c[1] + g.r + 4 }, marks);
        const speed = (1.6 * 12) / g.n;
        show.actor({
          t0: t, t1: T1 + 0.01, layer: 0,
          draw(ctx, T, view, sh) {
            const s = sh.surf(R);
            spriteG.bake(T, s ? s.scale : Ink.texScale || 1.2);
            // escapement: the train advances in eight small ticks a second
            const k = Math.max(0, T - wound) / 0.15625;
            const stepped = Math.floor(k) + U.easeOut(Math.min(1, (k % 1) * 3));
            const ang = g.dir * speed * stepped * 0.15625;
            ctx.translate(g.c[0], g.c[1]);
            ctx.rotate(ang);
            ctx.translate(-g.c[0], -g.c[1]);
            spriteG.drawOnPage(ctx, T);
          },
        });
      });
      for (let k = 0; wound + k * 0.15625 < T1; k++) show.cue(wound + k * 0.15625, 'tick', { k });

      // what it writes, and the arm that writes it
      const shoulder = [hx + 78, 520];
      const la = 250, lb = 262;
      const script = K.text(R, { seed: 'automaton', x: 560, y: 560, w: 330, size: 7.4, lines: 5, indent: 0, paraMin: 9 }, T0 + 3.7, { pens: 1, speed: 1250, wordGap: 0.06, lineGap: 0.18 });
      const pen = penTracker(script.marks);
      const rest = [hx + 150, 760];
      const armT = [a0 + 2.2, a0 + 2.8];
      show.actor({
        t0: armT[0], t1: T1 + 0.01, layer: 0,
        draw(ctx, T) {
          const pt = pen(T);
          const intoWrite = U.smoothstep(T0 + 3.2, T0 + 3.7, T);
          const outOfWrite = U.smoothstep(script.end, script.end + 0.6, T);
          let tx = U.lerp(rest[0], pt.p[0], intoWrite * (1 - outOfWrite));
          let ty = U.lerp(rest[1], pt.p[1], intoWrite * (1 - outOfWrite));
          if (!pt.down) ty -= 4 * intoWrite * (1 - outOfWrite);
          const dx = tx - shoulder[0], dy = ty - shoulder[1];
          let d = Math.hypot(dx, dy);
          d = U.clamp(d, Math.abs(la - lb) + 2, la + lb - 2);
          const th = Math.atan2(dy, dx);
          const al = Math.acos(U.clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1));
          const ex = shoulder[0] + Math.cos(th - al) * la, ey = shoulder[1] + Math.sin(th - al) * la;
          const reveal = U.sat((T - armT[0]) / (armT[1] - armT[0]));
          ctx.strokeStyle = U.rgba(PAL.ink);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(shoulder[0], shoulder[1]);
          const ux = U.lerp(shoulder[0], ex, U.sat(reveal * 2)), uy = U.lerp(shoulder[1], ey, U.sat(reveal * 2));
          ctx.lineTo(ux, uy);
          if (reveal > 0.5) ctx.lineTo(U.lerp(ex, tx, U.sat(reveal * 2 - 1)), U.lerp(ey, ty, U.sat(reveal * 2 - 1)));
          ctx.stroke();
          ctx.lineWidth = 0.8;
          for (const p of [shoulder, [ex, ey]]) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], 6, 0, TAU);
            ctx.fillStyle = '#e9dcc0';
            ctx.fill();
            ctx.stroke();
          }
          if (reveal >= 1) {
            // the quill in its hand
            const ang = Math.atan2(ty - ey, tx - ex) - 0.9;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-30, -16, -78, -8);
            ctx.quadraticCurveTo(-40, 6, 0, 0);
            ctx.fillStyle = U.rgba(PAL.rose, 0.55);
            ctx.fill();
            ctx.lineWidth = 0.9;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-74, -6);
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.restore();
          }
          // a thread holds the wrist, too
          ctx.strokeStyle = 'rgba(40,28,20,0.45)';
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(ex + 60, 110);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        },
        activity(T) { return T > T0 + 3.7 && T < script.end ? 1.4 : 0; },
      });
      K.label(R, hx, 1010, 7, 2, T0 + 3.2, T0 + 3.7, { center: true, seed: 'autolab', cap: true });
      K.printed(R, { seed: 'mach-text', x: 96, y: 1090, w: 808, size: 7.2, lines: 7 }, pre);
      K.label(R, 500, 150, 10, 2, pre, pre, { center: true, seed: 'mach-head', cap: true });

      show.cue(hT[0], 'pendulum', { dur: hT[1] - hT[0] });
      show.cue(sagT[0], 'sag');
      show.cue(wound, 'wind');
      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-1040, -80, 1080, 1580] });
      show.cam(T0 + 1.4, [-1120, 140, 1240, 1100], { n: [-1000, 150, 1000, 1100] });
      show.cam(T0 + 3.4, [-800, 250, 1300, 1100], { n: [-980, 500, 980, 1000] });
      show.cam(T0 + 5.2, [-60, 200, 1120, 1000], { n: [10, 220, 980, 1000] });
      show.cam(T0 + 7.6, [-420, 60, 1560, 1300], { n: [0, 100, 1000, 1300] });
      show.cam(T1 - 0.35, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'IV–V · Physics & Machines', 'delicate engines, bound by threads, that keep on writing');
    },
  });
})((window.Codex = window.Codex || {}));
