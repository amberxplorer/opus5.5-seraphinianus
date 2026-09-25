/* Overture — the closed book, its gilt seraph, the marbled endpaper, and a title page that
   writes itself. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, Paper = C.Paper, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW, PH = B.PH, BD = B.BOARD;
  C.Scenes = C.Scenes || [];

  // Timeline shared by every scene (seconds).
  C.TL = {
    cover: [2.4, 4.3],
    turns: [[9.35, 10.65], [19.35, 20.65], [29.35, 30.65], [39.35, 40.65], [49.35, 50.65], [59.35, 60.65], [69.35, 70.65]],
    close: [83.3, 85.0],
    bpm: 96,
    end: 90,
  };

  function seraphStrokes(cx, cy, R, rand, o) {
    o = o || {};
    const S = D.seraph(cx, cy, R, rand);
    const w = o.w || 1.3;
    const wings = S.wings.map((wing) => {
      const strokes = [];
      for (const f of wing.feathers) {
        strokes.push(Ink.path(f.outline, { w, tIn: 2, tOut: 2, seed: rand.range(0, 99), wob: 0.4 }));
        strokes.push(Ink.path(f.quill, { w: w * 0.7, tIn: 1, tOut: 3, wob: 0.3 }));
        if (o.barbs) for (const b of f.barbs) strokes.push(Ink.path(b, { w: w * 0.45, tIn: 1, tOut: 1, wob: 0.2 }));
      }
      strokes.push(Ink.path(wing.edge, { w: w * 1.1, tIn: 2, tOut: 4, wob: 0.3 }));
      strokes.push(Ink.path(wing.covert, { w: w * 0.8, tIn: 2, tOut: 3, wob: 0.3 }));
      return { strokes, wing };
    });
    const e = S.eye;
    const eye = [
      Ink.path(e.upper, { w: w * 1.3, tIn: 2, tOut: 2 }),
      Ink.path(e.lower, { w: w * 1.0, tIn: 2, tOut: 2 }),
      Ink.path(e.iris.concat([e.iris[0], e.iris[1]]), { w: w * 0.9, tIn: 1, tOut: 1 }),
    ].concat(e.lashes.map((l) => Ink.path(l, { w: w * 0.8, tIn: 0.5, tOut: 2 })));
    return { S, wings, eye };
  }

  function gild(g, strokes, x0, y0, x1, y1) {
    const grad = Paper.giltGradient(g, x0, y0, x1, y1);
    const passes = [[1.4, 1.6, 'rgba(6,12,10,0.75)'], [-0.6, -0.7, 'rgba(255,238,190,0.5)'], [0, 0, grad]];
    for (const p of passes) {
      g.save();
      g.translate(p[0], p[1]);
      for (const s of strokes) {
        const css = s.css;
        s.css = p[2];
        s.draw(g, 1);
        s.css = css;
      }
      g.restore();
    }
  }

  function knot(cx, cy, r) {
    // a small figure-of-eight knot for the frame corners
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      pts.push([cx + Math.sin(t) * r, cy + Math.sin(t) * Math.cos(t) * r * 1.1]);
    }
    return pts;
  }

  function buildCover(show) {
    const sc = 1.25;
    const cw = Math.round((PW + BD) * sc), ch = Math.round((PH + BD * 2) * sc);
    const cloth = Paper.cloth(cw, ch, '#1f3a37', 1);
    const front = U.canvas(cw, ch);
    const g = front.getContext('2d');
    g.drawImage(cloth, 0, 0);
    const mask = U.canvas(cw / 2, ch / 2);
    const mg = mask.getContext('2d');
    g.setTransform(sc, 0, 0, sc, 0, 0);
    mg.setTransform(sc / 2, 0, 0, sc / 2, 0, 0);
    const W = PW + BD, H = PH + BD * 2;
    const rand = new U.Rand('cover');
    // blind-stamped outer frame
    const blind = (x, y, w, h) => {
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.strokeRect(x + 1.2, y + 1.2, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.08)';
      g.strokeRect(x - 0.8, y - 0.8, w, h);
    };
    blind(44, 44, W - 88, H - 88);
    blind(52, 52, W - 104, H - 104);
    const gilt = [];
    const rule = (pts, w) => gilt.push(Ink.rule(pts, { w, wob: 0.12 }));
    const inset = 82;
    rule([[inset, inset], [W - inset, inset], [W - inset, H - inset], [inset, H - inset], [inset, inset + 1]], 2.2);
    rule([[inset + 10, inset + 10], [W - inset - 10, inset + 10], [W - inset - 10, H - inset - 10], [inset + 10, H - inset - 10], [inset + 10, inset + 11]], 1.1);
    for (const [x, y] of [[inset, inset], [W - inset, inset], [W - inset, H - inset], [inset, H - inset]]) {
      gilt.push(Ink.path(knot(x, y, 22), { w: 1.8, tIn: 0, tOut: 0, press: 0.05, wob: 0.1 }));
    }
    const ser = seraphStrokes(W / 2, 790, 245, new U.Rand('cover-seraph'), { w: 2.1 });
    for (const w of ser.wings) for (const s of w.strokes) gilt.push(s);
    for (const s of ser.eye) gilt.push(s);
    gilt.push(Ink.path(ser.S.halo, { w: 1.2, wob: 0.2, tIn: 0, tOut: 0 }));
    const title = A.display(W / 2, 318, 62, { center: true, seed: 'cover-title', weight: 0.085, word: A.lex.long(new U.Rand('codex-title'), 8) });
    for (const s of title.strokes) gilt.push(s);
    const author = A.label(W / 2, 1238, 17, 2, { center: true, seed: 'cover-author', weight: 0.11, cap: true });
    for (const s of author.strokes) gilt.push(s);
    gild(g, gilt, 0, 0, W, H * 0.7);
    // mask for the travelling sheen
    for (const s of gilt) { const css = s.css; s.css = '#fff'; s.draw(mg, 1); s.css = css; }
    g.setTransform(1, 0, 0, 1, 0, 0);

    // inside of the front board: cloth turn-ins and a marbled pastedown
    const marble = Paper.marble(Math.round(PW * sc), Math.round(PH * sc), 7);
    const inside = U.canvas(cw, ch);
    const ig = inside.getContext('2d');
    ig.drawImage(cloth, 0, 0);
    ig.drawImage(marble, 0, Math.round(BD * sc), Math.round(PW * sc), Math.round(PH * sc));
    show.cover = { front, inside, cloth, mask, marble, sc };
  }

  C.Scenes.push({
    id: 'overture',
    build(show, TL) {
      buildCover(show);
      const sp = show.spread([1, 5]);
      // the marbled pastedown is the left page of the first opening
      sp.L.base = (wpx) => {
        const c = U.canvas(wpx, Math.round(wpx * 1.414));
        c.getContext('2d').drawImage(show.cover.marble, 0, 0, c.width, c.height);
        return c;
      };
      show.turn(TL.cover[0], TL.cover[1], -1, 0, { kind: 'cover', bend: 0.14 });

      // ---- bookplate on the pastedown (already there)
      const L = sp.L;
      const bx = 330, by = 500, bw = 340, bh = 420;
      L.add(new Ink.FnMark((ctx, u, env) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(bx + 4, by + 5, bw, bh);
        ctx.fillStyle = '#efe4cc';
        ctx.fillRect(bx, by, bw, bh);
        const p = B.paperFor(3, 600);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(p, 40, 40, 200, 247, bx, by, bw, bh);
        ctx.restore();
      }, -1, -1));
      K.frame(L, bx + 22, by + 22, bw - 44, bh - 44, -1, -1, { w: 1.2, gap: 6 });
      // a small cat, curled asleep on the words
      const cat = [];
      const ccx = bx + bw / 2, ccy = by + 205;
      const body = U.catmull([[ccx - 70, ccy + 40], [ccx - 78, ccy + 5], [ccx - 45, ccy - 30], [ccx + 10, ccy - 36], [ccx + 55, ccy - 18], [ccx + 72, ccy + 18], [ccx + 60, ccy + 42], [ccx - 70, ccy + 42]], 1.2);
      const head = U.catmull([[ccx + 38, ccy + 40], [ccx + 30, ccy + 8], [ccx + 40, ccy - 14], [ccx + 47, ccy - 30], [ccx + 56, ccy - 14], [ccx + 70, ccy - 16], [ccx + 80, ccy - 32], [ccx + 84, ccy - 10], [ccx + 88, ccy + 14], [ccx + 76, ccy + 40]], 1.2);
      const tail = U.catmull([[ccx - 68, ccy + 38], [ccx - 40, ccy + 50], [ccx + 10, ccy + 50], [ccx + 40, ccy + 44]], 1.2);
      cat.push(Ink.path(body, { raw: true, w: 1.5 }), Ink.path(head, { raw: true, w: 1.5 }), Ink.path(tail, { raw: true, w: 1.8 }));
      cat.push(Ink.path([[ccx + 55, ccy + 8], [ccx + 60, ccy + 11], [ccx + 64, ccy + 8]], { w: 1 }), Ink.path([[ccx + 70, ccy + 8], [ccx + 74, ccy + 11], [ccx + 78, ccy + 8]], { w: 1 }));
      cat.push(Ink.path([[ccx + 86, ccy + 18], [ccx + 104, ccy + 14]], { w: 0.6 }), Ink.path([[ccx + 86, ccy + 22], [ccx + 104, ccy + 24]], { w: 0.6 }));
      K.strokes(L, cat, -1, -1);
      K.wash(L, body, PAL.ochre, -1, -1, { alpha: 0.3, seed: 12 });
      K.hatch(L, U.catmull([[ccx - 60, ccy + 10], [ccx - 20, ccy - 20], [ccx + 30, ccy - 26], [ccx + 20, ccy + 36], [ccx - 60, ccy + 36]], 3, true), -1, -1, { spacing: 4, w: 0.55, angle: -0.5 });
      const ex = A.label(bx + bw / 2, by + 110, 13, 2, { center: true, seed: 'exlibris', cap: true });
      K.strokes(L, ex.strokes, -1, -1);
      const nm = A.label(bx + bw / 2, by + 330, 10, 2, { center: true, seed: 'owner', cap: true, weight: 0.12 });
      K.strokes(L, nm.strokes, -1, -1);
      K.strokes(L, A.numeral(2026, bx + bw / 2, by + 372, 7.5, { center: true }), -1, -1);

      // ---- title page
      const R = sp.R;
      const rand = new U.Rand('title-page');
      const cx = 500, cy = 540, Rr = 225;
      const ser = seraphStrokes(cx, cy, Rr, new U.Rand('title-seraph'), { w: 1.25, barbs: true });
      // wings in pairs, drawn by several pens at once
      const order = [[2, 3], [4, 5], [0, 1]];
      let t = 3.75;
      for (const pair of order) {
        for (const wi of pair) K.strokes(R, ser.wings[wi].strokes, t, t + 1.35, { mode: 'seq', gap: 0.08 });
        t += 0.62;
      }
      K.strokes(R, ser.eye, 5.35, 6.05, { mode: 'seq', gap: 0.1 });
      // halo and tints
      K.wash(R, ser.S.halo, PAL.saffron, 6.0, 7.2, { alpha: 0.38, seed: 4, amp: 8, soft: 0.6 });
      ser.wings.forEach((w, i) => {
        const col = [PAL.rose, PAL.rose, PAL.sky, PAL.sky, PAL.lilac, PAL.lilac][i];
        for (const f of w.wing.feathers) K.pencil(R, f.outline, col, 6.2 + i * 0.08, 7.3 + i * 0.08, { seed: 'f' + i + f.quill[0][0], alpha: 0.28, spacing: 2.6, passes: 1 });
      });
      K.wash(R, ser.S.eye.iris, PAL.ultramarine, 6.3, 7.0, { alpha: 0.6, seed: 9, amp: 1.5, soft: 0.2 });
      K.wash(R, ser.S.eye.pupil, [30, 20, 14], 6.5, 6.9, { alpha: 0.9, seed: 10, amp: 0.6, soft: 0, grain: 0.1 });

      // title, subtitle, rule, imprint
      const title = A.display(500, 948, 46, { center: true, seed: 'title-word', weight: 0.085, word: A.lex.long(new U.Rand('codex-title'), 8) });
      K.strokes(R, title.strokes, 5.2, 7.3, { mode: 'seq', gap: 0.12 });
      const sub = A.label(500, 1062, 11, 3, { center: true, seed: 'subtitle', cap: true });
      K.strokes(R, sub.strokes, 7.0, 7.9, { mode: 'seq' });
      const rule = [];
      for (let i = 0; i <= 40; i++) {
        const x = 330 + i * 8.5;
        rule.push([x, 1118 + Math.sin(i * 0.9) * (i > 16 && i < 24 ? 7 : 1.2)]);
      }
      K.stroke(R, rule, 7.4, 8.0, { w: 1.1, raw: false });
      const imp = A.label(500, 1240, 8.5, 2, { center: true, seed: 'imprint', cap: true });
      K.strokes(R, imp.strokes, 7.8, 8.5, { mode: 'seq' });
      // the year of first printing, in base 21 (1981 = 4·21² + 10·21 + 7)
      K.strokes(R, A.numeral(1981, 500, 1280, 9, { center: true, color: PAL.red }), 8.3, 8.8, { mode: 'seq' });

      // the seraph's eye blinks and looks about once the page is finished
      const eyeGeo = ser.S.eye;
      show.actor({
        t0: 7.6, t1: TL.turns[0][0], layer: 0,
        draw(ctx, T, view, sh) {
          const s = sh.surf(R);
          if (!s) return;
          const blink = Math.max(U.bump((T - 8.1) / 0.28), U.bump((T - 8.55) / 0.22));
          if (blink <= 0.001) return;
          ctx.save();
          U.poly(ctx, eyeGeo.almond);
          ctx.clip();
          const p = s.base, k = p.width / PW;
          const bb = U.bbox(eyeGeo.almond);
          ctx.drawImage(p, bb.x0 * k, (bb.y0 - 4) * k, bb.w * k, (bb.h + 8) * k, bb.x0, bb.y0 - 4, bb.w, bb.h + 8);
          ctx.restore();
          const lid = D.eye(cx, cy, Rr * 0.34, Rr * 0.2, { open: 1 - blink * 1.9 }).upper;
          const low = eyeGeo.lower;
          ctx.strokeStyle = U.rgba(PAL.ink);
          ctx.lineWidth = 1.7;
          ctx.lineCap = 'round';
          U.poly(ctx, lid, false);
          ctx.stroke();
          ctx.lineWidth = 1.2;
          U.poly(ctx, low, false);
          ctx.stroke();
        },
      });

      // gilt sheen travelling over the closed cover
      show.actor({
        t0: 0, t1: TL.cover[0] + 0.01, layer: 0,
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
          const ph = C.landing ? C.landingPhase || 0 : T;
          const x = U.lerp(-0.6, 1.4, U.sat((ph - 0.2) / 2.2)) * w;
          const grd = g.createLinearGradient(x - w * 0.25, 0, x + w * 0.25, h * 0.5);
          grd.addColorStop(0, 'rgba(255,240,200,0)');
          grd.addColorStop(0.5, 'rgba(255,244,210,0.95)');
          grd.addColorStop(1, 'rgba(255,240,200,0)');
          g.fillStyle = grd;
          g.fillRect(0, 0, w, h);
          g.globalCompositeOperation = 'source-over';
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.55;
          ctx.drawImage(s, 0, 0, w, h, 0, -BD, PW + BD, PH + BD * 2);
        },
      });

      // camera
      show.cam(0, [-190, -240, 1400, 1900], { n: [-60, -120, 1140, 1680] });
      show.cam(2.3, [-80, -120, 1180, 1660], { n: [-30, -60, 1080, 1560] });
      show.cam(4.4, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.cam(6.6, [-420, 60, 1560, 1260], { n: [20, 120, 960, 1180] });
      show.cam(8.9, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });

      show.cue(TL.cover[0], 'cover');
      show.caption(0.4, 4.0, 'Codex Seraphinianus', 'Luigi Serafini · 1976–78 · an encyclopedia of an imagined world');
    },
  });
})((window.Codex = window.Codex || {}));
