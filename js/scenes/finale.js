/* Finale — the words lift off the last page and wheel above the book like starlings; the book
   closes; for a moment the unreadable writing gathers into the only legible words in the piece. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW, BD = B.BOARD;
  const TAU = Math.PI * 2;

  C.TITLE = 'Codex Seraphinianus';

  C.Scenes.push({
    id: 'finale',
    build(show, TL) {
      const last = show.spreads.length - 1;
      show.turn(TL.close[0], TL.close[1], last, last, { kind: 'close', bend: 0.22 });
      const words = show.archWords || [];
      const pages = { L: show.spreads[last].L, R: show.spreads[last].R };
      const lift0 = 80.15, lift1 = 83.0;
      const gather = [85.7, 87.5];
      const rr = new U.Rand('murmuration');
      const center = [120, 620];
      const flock = words.map(({ w, side }, i) => {
        const hx = w.x + w.w / 2 - (side === 'L' ? PW : 0), hy = w.y - w.size * 0.5;
        const d = Math.hypot(hx - center[0], hy - center[1]);
        const s = U.lerp(lift0, lift1, U.sat((1414 - hy) / 1414 * 0.2 + rr.range(0, 0.8)));
        pages[side].add(new Ink.EraseMark(w.x - 3, w.y - w.size * 2.55, w.w + 8, w.size * 3.9, s, w.mark));
        const pts = [];
        for (const st of w.strokes) {
          const arr = [];
          for (let k = 0; k < st.n; k += 3) arr.push(st.x[k] - (w.x + w.w / 2), st.y[k] - hy);
          pts.push(new Float32Array(arr));
        }
        return {
          s, pts, hx, hy, ang0: Math.atan2(hy - center[1], hx - center[0]), r0: d,
          R: rr.range(240, 1080), om: rr.range(0.5, 1.05), zH: rr.range(380, 1500), ph: rr.range(0, TAU),
          wd: Math.max(0.8, w.size * 0.12), gi: i,
        };
      });
      const vortex = (f, T) => {
        const tt = T - f.s;
        const a = U.smoothstep(f.s, f.s + 1.5, T);
        const ang = f.ang0 + f.om * tt * a + 0.25 * a;
        const r = U.lerp(f.r0, f.R * (1 - 0.25 * U.smoothstep(83, 86, T)), U.easeInOut(a));
        const cx = center[0] + 380 * U.smoothstep(TL.close[0], TL.close[1], T); // drift over the closing book
        return {
          x: cx + Math.cos(ang) * r,
          y: center[1] + Math.sin(ang) * r * 0.82 - a * 40,
          z: a * f.zH + Math.max(0, tt - 1) * 55 + Math.sin(T * 1.3 + f.ph) * 30 * a,
          rot: U.lerp(0, ang + Math.PI / 2, a),
        };
      };
      // screen-space targets: the title, sampled from type
      let targets = null, targetsFor = '';
      const makeTargets = (W, H) => {
        const key = W + 'x' + H;
        if (targets && targetsFor === key) return targets;
        const fs = Math.round(Math.min(W * 0.075, H * 0.11, 104));
        const c = U.canvas(W, fs * 1.6);
        const g = c.getContext('2d');
        g.fillStyle = '#000';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = `italic 400 ${fs}px "Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif`;
        g.fillText(C.TITLE, W / 2, fs * 0.8);
        const img = g.getImageData(0, 0, W, c.height).data;
        const pix = [];
        for (let y = 0; y < c.height; y += 2) for (let x = 0; x < W; x += 2) if (img[(y * W + x) * 4 + 3] > 128) pix.push([x, y]);
        const r = new U.Rand('targets');
        const y0 = H * 0.2 - fs * 0.8;
        targets = { pts: flock.map(() => { const p = pix.length ? pix[Math.floor(r.next() * pix.length)] : [W / 2, fs]; return [p[0], p[1] + y0]; }), fs, y: H * 0.2 };
        targetsFor = key;
        return targets;
      };
      show.titleTargets = makeTargets;
      const drawWord = (ctx, f, amp, T) => {
        ctx.beginPath();
        for (const arr of f.pts) {
          for (let k = 0; k < arr.length; k += 2) {
            const px = arr[k], py = arr[k + 1] + amp * Math.sin(px * 0.2 - T * 8 + f.ph);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      };
      show.actor({
        t0: lift0, t1: 90.01, layer: 6, post: true,
        draw(ctx, T, view) {
          const W = view.W, H = view.H, dpr = view.dpr;
          const tg = T > gather[0] - 0.1 ? makeTargets(W, H) : null;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (const f of flock) {
            if (T < f.s) continue;
            const v = vortex(f, T);
            const a = U.smoothstep(f.s, f.s + 1.5, T);
            const gs = gather[0] + (f.gi % 50) * 0.012;
            const q = tg ? U.easeInOut(U.sat((T - gs) / (gather[1] - gather[0]))) : 0;
            if (q <= 0) {
              view.apply(ctx);
              ctx.save();
              view.lift(ctx, v.x, v.y, v.z);
              ctx.rotate(v.rot);
              // ink on the page, then lamplit gold once it is in the air
              const glow = U.smoothstep(f.s + 0.5, f.s + 2.0, T);
              ctx.strokeStyle = glow > 0 ? U.rgba(U.mixc(PAL.ink, [252, 226, 170], glow), 0.95) : U.rgba(PAL.ink, 0.95);
              ctx.lineWidth = f.wd * (1 + glow * 0.4);
              if (glow > 0.3) { ctx.shadowColor = `rgba(255,200,120,${(0.5 * glow).toFixed(2)})`; ctx.shadowBlur = 6 * view.dpr; }
              drawWord(ctx, f, 2 * a, T);
              ctx.restore();
              continue;
            }
            // gathering: fly in screen space toward a point of the title
            const p = view.proj(v.x, v.y, v.z);
            const s0 = view.toScreen(p[0], p[1]);
            const t = tg.pts[f.gi];
            const x = U.lerp(s0[0], t[0], q), y = U.lerp(s0[1], t[1], q) - Math.sin(q * Math.PI) * 40;
            const sc = U.lerp(p[2] * view.zoom, 0.12, q);
            ctx.setTransform(dpr * sc, 0, 0, dpr * sc, x * dpr, y * dpr);
            ctx.rotate(U.lerp(v.rot, 0, q));
            const fade = 1 - U.smoothstep(gather[1] - 0.1, gather[1] + 0.6, T);
            ctx.strokeStyle = `rgba(250,232,190,${0.95 * fade})`;
            ctx.lineWidth = f.wd / Math.max(0.2, sc) * 0.9 * (1 - q) + f.wd * q * 2;
            drawWord(ctx, f, 1.5 * (1 - q), T);
          }
          // the title itself, in type, as the writing settles into it
          if (tg) {
            const k = U.smoothstep(gather[1] - 0.45, gather[1] + 0.5, T);
            if (k > 0) {
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.font = `italic 400 ${tg.fs}px "Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif`;
              ctx.shadowColor = `rgba(255,214,150,${0.55 * k})`;
              ctx.shadowBlur = 24 * dpr;
              ctx.fillStyle = `rgba(247,234,204,${k})`;
              ctx.fillText(C.TITLE, W / 2, tg.y);
              ctx.shadowBlur = 0;
              ctx.shadowColor = 'transparent';
            }
          }
        },
      });

      // a last gleam across the gilt of the closed cover
      show.actor({
        t0: TL.close[1], t1: 90.01, layer: 0,
        draw(ctx, T) {
          const cv = show.cover;
          if (!cv) return;
          const w = cv.mask.width, h = cv.mask.height;
          const s = Ink.scratch(w, h);
          const g = s.getContext('2d');
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.globalCompositeOperation = 'copy';
          g.drawImage(cv.mask, 0, 0);
          g.globalCompositeOperation = 'source-in';
          const x = U.lerp(-0.6, 1.5, U.sat((T - TL.close[1] - 0.6) / 2.6)) * w;
          const grd = g.createLinearGradient(x - w * 0.25, 0, x + w * 0.25, h * 0.5);
          grd.addColorStop(0, 'rgba(255,240,200,0)');
          grd.addColorStop(0.5, 'rgba(255,244,210,0.95)');
          grd.addColorStop(1, 'rgba(255,240,200,0)');
          g.fillStyle = grd;
          g.fillRect(0, 0, w, h);
          g.globalCompositeOperation = 'source-over';
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.5;
          ctx.drawImage(s, 0, 0, w, h, 0, -BD, PW + BD, B.PH + BD * 2);
        },
      });
      // the lamp dims at the very end
      show.fadeOut = [88.4, 90];

      show.cue(lift0, 'lift');
      show.cue(TL.close[0], 'close');
      show.cue(gather[0], 'gather');
      show.cue(gather[1], 'title');
      show.cam(80.0, [-1160, -160, 2320, 1720], { n: [-1040, -80, 1080, 1580] });
      show.cam(82.6, [-1400, -420, 2800, 2100], { n: [-900, -400, 1400, 2100] });
      show.cam(85.4, [-760, -620, 2540, 2200], { n: [-300, -500, 1600, 2300] });
      show.cam(89.5, [-693, -1020, 2400, 3600], { n: [-393, -760, 1800, 3000] });
      show.caption(80.6, 84.2, 'Coda', 'the words fly off the page, and the book closes');
    },
  });
})((window.Codex = window.Codex || {}));
