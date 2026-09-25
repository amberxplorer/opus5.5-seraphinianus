/* VI · Humankind — a head that grows a garden; two lovers asleep under a blanket slowly become
   an alligator, which climbs out of its panel and eats the text on the facing page. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;

  // Side view of an alligator along a spine (snout → tail): outline, scutes, eye, teeth, legs.
  function crocSide(spineCtrl) {
    const spine = U.resample(U.catmull(spineCtrl, 2), 3);
    const n = spine.length;
    const Lc = U.pathLen(spine);
    const h = (u) => {
      const k = [[0, 5], [0.05, 9], [0.16, 16], [0.22, 13], [0.3, 19], [0.48, 23], [0.62, 18], [0.75, 11], [1, 2]];
      for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return U.lerp(k[i - 1][1], k[i][1], (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
      return 2;
    };
    const top = [], bot = [], normals = [];
    let s = 0;
    for (let i = 0; i < n; i++) {
      if (i) s += Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]);
      const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      // "up" is the normal that points more upward on the page
      let nx = dy / d, ny = -dx / d;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const u = s / Lc;
      const hh = h(u);
      const bump = u > 0.26 && u < 0.92 ? Math.max(0, Math.sin(u * 150)) * 3.2 : 0;
      const eye = Math.exp(-Math.pow((u - 0.14) / 0.025, 2)) * 5;
      top.push([spine[i][0] + nx * (hh * 0.55 + bump + eye), spine[i][1] + ny * (hh * 0.55 + bump + eye)]);
      bot.push([spine[i][0] - nx * hh * 0.45, spine[i][1] - ny * hh * 0.45]);
      normals.push([nx, ny, u]);
    }
    const outline = top.concat(bot.slice().reverse());
    const at = (u) => Math.min(n - 1, Math.round(u * (n - 1)));
    const ei = at(0.14);
    const eye = [spine[ei][0] + normals[ei][0] * 7, spine[ei][1] + normals[ei][1] * 7];
    const teeth = [];
    for (let i = at(0.02); i < at(0.13); i++) {
      const p = bot[i];
      teeth.push([p[0], p[1] + (i % 2 ? 0 : -2.2)]);
    }
    const legs = [0.3, 0.62].map((u) => {
      const i = at(u);
      const p = bot[i];
      return [p, [p[0] - 3, p[1] + 16], [p[0] - 10, p[1] + 24]];
    });
    const scutes = [];
    for (let u = 0.3; u < 0.9; u += 0.035) {
      const i = at(u);
      scutes.push([[spine[i][0] + normals[i][0] * 2, spine[i][1] + normals[i][1] * 2], [spine[i][0] - normals[i][0] * 4, spine[i][1] - normals[i][1] * 4]]);
    }
    return { outline, top, bot, eye, teeth, legs, scutes, spine };
  }

  C.Scenes.push({
    id: 'lovers',
    build(show, TL) {
      const sp = show.spread([196, 197]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[3][1], T1 = TL.turns[4][0];
      show.turn(TL.turns[3][0], TL.turns[3][1], 3, 4);
      const pre = TL.turns[3][0] - 1;
      K.furniture(L, 196, 'L', pre);
      K.furniture(R, 197, 'R', pre);
      K.strokes(L, A.numeral(6, 500, 140, 22, { center: true, color: PAL.red, weight: 0.13 }), pre, pre);
      K.strokes(L, A.display(500, 214, 20, { center: true, seed: 'hum-title', swash: false, weight: 0.1 }).strokes, pre, pre);

      // ---------------------------------------------------------- left: a head that grows a garden
      const face = U.catmull([[392, 796], [372, 690], [376, 590], [398, 520], [440, 478], [500, 458], [558, 470], [592, 520], [596, 552], [590, 566], [628, 612], [598, 626], [608, 646], [597, 655], [605, 668], [594, 700], [566, 718], [552, 740], [552, 800]], 2);
      const hT = T0 + 0.2;
      K.stroke(L, face, hT, hT + 1.3, { raw: true, w: 1.5 });
      K.stroke(L, U.catmull([[548, 556], [560, 562], [574, 558]], 1), hT + 1.1, hT + 1.25, { raw: true, w: 1.1 });
      K.lines(L, [[[552, 560], [549, 568]], [[560, 563], [559, 571]], [[568, 561], [569, 569]]], hT + 1.2, hT + 1.35, { w: 0.6 });
      K.stroke(L, U.catmull([[468, 578], [452, 568], [440, 590], [450, 616], [466, 610]], 1), hT + 1.2, hT + 1.4, { raw: true, w: 1.0 });
      K.pencil(L, face.concat([[392, 796]]), PAL.flesh, hT + 1.4, hT + 2.2, { seed: 'face', alpha: 0.4 });
      K.hatch(L, [[380, 600], [420, 560], [430, 700], [398, 780], [384, 700]], hT + 1.6, hT + 2.0, { spacing: 3.5, w: 0.5, angle: 1.1 });
      // the scalp opens into a garden
      const gr = new U.Rand('garden');
      const scalp = U.catmull([[398, 520], [440, 478], [500, 458], [558, 470], [592, 520]], 2);
      for (let i = 0; i < 9; i++) {
        const base = U.pointAt(scalp, 0.08 + i * 0.105);
        const ang = -Math.PI / 2 + (i - 4) * 0.2 + gr.range(-0.15, 0.15);
        const len = gr.range(110, 230);
        const stem = D.stem(base.x, base.y, ang, len, gr.range(-0.6, 0.6), gr, { wig: 0.05 });
        const t = hT + 1.0 + i * 0.12;
        K.stroke(L, stem, t, t + 0.6, { raw: true, w: 1.1, tOut: 10 });
        const tip = stem[stem.length - 1];
        const nl = gr.int(1, 3);
        for (let k = 0; k < nl; k++) {
          const p = stem[Math.floor(stem.length * gr.range(0.35, 0.8))];
          const lf = D.leaf(p[0], p[1], ang + gr.sign() * gr.range(0.6, 1.1), gr.range(30, 46), gr.range(9, 13));
          K.stroke(L, lf.outline, t + 0.4, t + 0.7, { w: 0.8 });
          K.wash(L, lf.outline, PAL.leaf, t + 0.9, t + 1.4, { alpha: 0.5, amp: 1, seed: i * 7 + k });
        }
        if (i % 3 === 1) {
          // a bird perched on a stem
          const bx = tip[0], by = tip[1];
          K.stroke(L, U.catmull([[bx - 16, by - 2], [bx - 4, by - 10], [bx + 10, by - 8], [bx + 18, by - 14], [bx + 14, by - 4], [bx + 4, by + 2], [bx - 16, by - 2]], 1), t + 0.6, t + 0.9, { raw: true, w: 0.9 });
          K.stroke(L, [[bx + 18, by - 12], [bx + 26, by - 10], [bx + 18, by - 9]], t + 0.85, t + 0.95, { w: 0.8 });
          K.wash(L, U.catmull([[bx - 14, by - 2], [bx - 4, by - 9], [bx + 10, by - 7], [bx + 4, by + 1]], 1, true), PAL.sky, t + 1.0, t + 1.4, { alpha: 0.6, amp: 1, seed: i });
        } else {
          const fc = [tip[0], tip[1] - 6];
          const nP = 6;
          const petals = [];
          for (let k = 0; k < nP; k++) {
            const a = (k / nP) * TAU;
            petals.push(D.leaf(fc[0], fc[1], a, gr.range(16, 22), 7, { tip: 0.5 }).outline);
          }
          K.strokes(L, petals.map((p) => Ink.path(p, { raw: true, w: 0.8 })), t + 0.55, t + 0.9, { mode: 'par' });
          petals.forEach((p, k) => K.wash(L, p, i % 2 ? PAL.rose : PAL.lilac, t + 0.9, t + 1.4, { alpha: 0.5, amp: 0.8, seed: i * 11 + k }));
          L.add(Ink.dots([[fc[0], fc[1], 3.5]], 3, t + 0.9, t + 0.95, { color: PAL.ochre }));
        }
      }
      K.label(L, 480, 842, 7, 3, hT + 2.0, hT + 2.6, { center: true, seed: 'hum-lab', cap: true });
      const food = K.printed(L, { seed: 'hum-text', x: 96, y: 896, w: 808, size: 8, lines: 15 }, pre);

      // ---------------------------------------------------------- right: the six panels
      const pw = 380, ph = 280;
      const cells = [[96, 196], [524, 196], [96, 530], [524, 530], [96, 864], [524, 864]];
      const pT = (i) => T0 + 0.3 + i * 0.78;
      const bed = (ox, oy, t, withPillow) => {
        const P = (pts) => pts.map((p) => [ox + p[0], oy + p[1]]);
        K.stroke(R, U.densify(P([[30, 250], [30, 92], [36, 80], [48, 80], [52, 92], [52, 250]]), 1.5), t, t + 0.25, { raw: true, w: 1.2 });
        K.stroke(R, U.densify(P([[328, 250], [328, 128], [334, 120], [346, 120], [350, 128], [350, 250]]), 1.5), t + 0.1, t + 0.3, { raw: true, w: 1.2 });
        K.stroke(R, U.densify(P([[52, 172], [328, 172]]), 2), t + 0.15, t + 0.3, { raw: true, w: 1.0 });
        K.stroke(R, U.densify(P([[52, 198], [328, 198]]), 2), t + 0.2, t + 0.35, { raw: true, w: 0.9 });
        K.stroke(R, U.densify(P([[10, 254], [370, 254]]), 3), t, t + 0.2, { raw: true, w: 0.7 });
        K.pencil(R, P([[30, 250], [30, 92], [36, 80], [48, 80], [52, 92], [52, 250]]), PAL.umber, t + 0.5, t + 0.9, { seed: 'hb' + ox + oy, alpha: 0.4 });
        K.pencil(R, P([[328, 250], [328, 128], [334, 120], [346, 120], [350, 128], [350, 250]]), PAL.umber, t + 0.5, t + 0.9, { seed: 'fb' + ox + oy, alpha: 0.4 });
        if (withPillow) {
          const pil = P(D.ellipse(88, 162, 34, 11, 24));
          K.outline(R, pil, t + 0.2, t + 0.35, { w: 1.0 });
          K.pencil(R, pil, PAL.sky, t + 0.5, t + 0.8, { seed: 'pil' + ox + oy, alpha: 0.35 });
        }
        return P;
      };
      const blanket = (P, top, t, col, hem) => {
        const hemPts = hem || [[330, 168], [334, 206], [300, 214], [260, 207], [220, 214], [180, 207], [140, 214], [100, 207], [66, 212], [62, 172]];
        const poly = P(top.concat(hemPts));
        K.stroke(R, U.catmull(P(top), 1.5), t, t + 0.35, { raw: true, w: 1.2 });
        K.stroke(R, U.catmull(P(hemPts), 1.5), t + 0.25, t + 0.5, { raw: true, w: 1.0 });
        K.pencil(R, poly, col, t + 0.45, t + 0.85, { seed: 'bl' + t, alpha: 0.38 });
        return poly;
      };
      const head = (P, cx, cy, r, t, long) => {
        const c = P(D.ellipse(cx, cy, r, r * 1.05, 20));
        K.outline(R, c, t, t + 0.15, { w: 1.0 });
        K.pencil(R, c, PAL.flesh, t + 0.3, t + 0.6, { seed: 'hd' + cx + t, alpha: 0.45 });
        // closed eye and a nose, in profile to the right
        K.stroke(R, U.catmull(P([[cx + r * 0.15, cy - r * 0.05], [cx + r * 0.38, cy + r * 0.08], [cx + r * 0.6, cy - r * 0.02]]), 0.8), t + 0.15, t + 0.2, { raw: true, w: 0.6 });
        K.stroke(R, U.catmull(P([[cx + r * 0.92, cy - r * 0.2], [cx + r * 1.22, cy + r * 0.18], [cx + r * 0.95, cy + r * 0.3]]), 0.8), t + 0.18, t + 0.25, { raw: true, w: 0.8 });
        if (long) {
          // long hair spilling over the pillow
          const hair = [];
          for (let k = 0; k < 5; k++) hair.push(U.catmull(P([[cx + r * 0.6 - k * 5, cy - r * 0.95], [cx - r * 0.4 - k * 3, cy - r * 1.05], [cx - r * 1.3 - k * 2, cy - r * 0.2 + k * 2], [cx - r * 1.6 - k * 3, cy + r * 0.9 + k * 3]]), 1));
          K.strokes(R, hair.map((h) => Ink.path(h, { raw: true, w: 0.7 })), t + 0.1, t + 0.35, { mode: 'stagger' });
          K.pencil(R, P([[cx + r * 0.5, cy - r], [cx - r * 1.4, cy - r * 0.3], [cx - r * 1.8, cy + r], [cx - r * 0.6, cy + r * 0.2], [cx - r * 0.2, cy - r * 0.5]]), PAL.umber, t + 0.3, t + 0.6, { seed: 'hair' + t, alpha: 0.45 });
        } else {
          // short dark hair, a cap over the crown
          const cap = P([[cx - r * 1.02, cy + r * 0.1], [cx - r * 0.95, cy - r * 0.7], [cx - r * 0.2, cy - r * 1.12], [cx + r * 0.6, cy - r * 0.95], [cx + r * 0.9, cy - r * 0.45], [cx + r * 0.2, cy - r * 0.55], [cx - r * 0.5, cy - r * 0.2]]);
          K.stroke(R, U.catmull(cap.concat([cap[0]]), 1), t + 0.1, t + 0.28, { raw: true, w: 0.8 });
          K.pencil(R, cap, PAL.ink, t + 0.3, t + 0.55, { seed: 'cap' + t, alpha: 0.4 });
        }
      };
      // 1 · asleep
      {
        const [ox, oy] = cells[0], t = pT(0);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        head(P, 80, 142, 17, t + 0.25, true);
        head(P, 112, 138, 16, t + 0.3, false);
        blanket(P, [[64, 168], [92, 152], [126, 142], [170, 146], [210, 150], [250, 152], [290, 146], [312, 150], [330, 166]], t + 0.35, PAL.rose);
      }
      // 2 · the blanket begins to scale
      {
        const [ox, oy] = cells[1], t = pT(1);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        head(P, 86, 142, 17, t + 0.25, true);
        head(P, 104, 139, 16, t + 0.3, false);
        const poly = blanket(P, [[64, 168], [92, 150], [126, 140], [150, 137], [170, 142], [190, 137], [210, 144], [230, 139], [250, 146], [290, 142], [312, 148], [330, 166]], t + 0.35, PAL.rose);
        const arcs = [];
        for (let x = 150; x < 300; x += 18) for (let y = 156; y < 196; y += 13) {
          const cx = ox + x + ((y / 13) % 2) * 9, cy = oy - 10 + y;
          if (!U.pointInPoly(cx, cy, poly)) continue;
          arcs.push(U.arc(cx, cy, 6, 0.2, Math.PI - 0.2, 6).map(([x2, y2]) => [x2, y2]));
        }
        K.lines(R, arcs, t + 0.6, t + 0.9, { w: 0.55, mode: 'stagger' });
        K.pencil(R, poly, PAL.moss, t + 0.7, t + 1.0, { seed: 'bl2g', alpha: 0.18, passes: 1 });
      }
      // 3 · something with a snout
      {
        const [ox, oy] = cells[2], t = pT(2);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        const hd = P([[26, 158], [48, 150], [78, 140], [96, 128], [108, 131], [118, 140], [118, 152], [92, 160], [50, 162], [26, 160]]);
        K.stroke(R, U.catmull(hd.concat([hd[0]]), 1.2), t + 0.25, t + 0.45, { raw: true, w: 1.2 });
        K.pencil(R, hd, PAL.moss, t + 0.5, t + 0.8, { seed: 'h3', alpha: 0.4 });
        R.add(Ink.dots([[ox + 100, oy - 10 + 133, 2.5]], 2, t + 0.45, t + 0.5));
        const zig = [];
        for (let x = 30; x < 90; x += 4) zig.push([ox + x, oy - 10 + 158 + (x % 8 ? -2 : 0)]);
        K.stroke(R, zig, t + 0.45, t + 0.55, { raw: true, w: 0.6 });
        const poly = blanket(P, [[116, 142], [140, 136], [160, 130], [176, 138], [192, 130], [208, 138], [224, 130], [240, 138], [256, 131], [272, 138], [296, 136], [316, 142], [330, 160]], t + 0.35, PAL.carmine,
          [[330, 160], [338, 206], [296, 216], [256, 204], [214, 218], [176, 204], [140, 216], [118, 204], [116, 150]]);
        K.pencil(R, poly, PAL.moss, t + 0.7, t + 1.0, { seed: 'bl3g', alpha: 0.3, passes: 1 });
        K.stroke(R, U.catmull(P([[330, 150], [346, 140], [360, 146], [368, 160], [372, 182]]), 1.2), t + 0.55, t + 0.7, { raw: true, w: 1.1, tOut: 8 });
      }
      // 4 · an alligator in bed; the blanket on the floor
      const drawCrocSide = (ox, oy, spine, t, alpha) => {
        const cr = crocSide(spine.map((p) => [ox + p[0], oy + p[1]]));
        K.stroke(R, cr.outline.concat([cr.outline[0]]), t, t + 0.45, { raw: true, w: 1.2 });
        K.pencil(R, cr.outline, PAL.moss, t + 0.4, t + 0.8, { seed: 'croc' + t, alpha: alpha || 0.45 });
        K.pencil(R, cr.outline, PAL.leaf, t + 0.5, t + 0.85, { seed: 'croc2' + t, alpha: 0.25, angle: 0.5, passes: 1 });
        K.lines(R, cr.scutes, t + 0.4, t + 0.6, { w: 0.6, mode: 'stagger' });
        K.stroke(R, U.densify(cr.teeth, 1), t + 0.35, t + 0.45, { raw: true, w: 0.55 });
        R.add(Ink.dots([[cr.eye[0], cr.eye[1], 2.4]], 2, t + 0.4, t + 0.45));
        cr.legs.forEach((lg, i) => K.stroke(R, U.catmull(lg, 1), t + 0.3 + i * 0.05, t + 0.4 + i * 0.05, { raw: true, w: 1.2 }));
        return cr;
      };
      {
        const [ox, oy] = cells[3], t = pT(3);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        drawCrocSide(ox, oy - 10, [[20, 154], [100, 150], [200, 152], [300, 146], [345, 136], [372, 178]], t + 0.2);
        const heap = P([[118, 254], [140, 236], [170, 240], [196, 228], [232, 240], [262, 232], [292, 246], [300, 254]]);
        K.stroke(R, U.catmull(heap, 1.2), t + 0.5, t + 0.7, { raw: true, w: 1.0 });
        K.pencil(R, heap, PAL.rose, t + 0.6, t + 0.9, { seed: 'heap4', alpha: 0.4 });
      }
      // 5 · it slides off the end of the bed
      {
        const [ox, oy] = cells[4], t = pT(4);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        drawCrocSide(ox, oy - 10, [[372, 250], [362, 200], [345, 140], [300, 150], [200, 158], [120, 162]], t + 0.2);
        const heap = P([[118, 254], [150, 232], [186, 240], [226, 230], [262, 244], [288, 254]]);
        K.stroke(R, U.catmull(heap, 1.2), t + 0.5, t + 0.7, { raw: true, w: 1.0 });
        K.pencil(R, heap, PAL.rose, t + 0.6, t + 0.9, { seed: 'heap5', alpha: 0.4 });
      }
      // 6 · an empty bed
      {
        const [ox, oy] = cells[5], t = pT(5);
        K.frame(R, ox, oy, pw, ph, t - 0.2, t + 0.2, { w: 1, gap: 4 });
        const P = bed(ox, oy - 10, t, true);
        K.stroke(R, U.catmull(P([[70, 170], [100, 164], [140, 168]]), 1), t + 0.3, t + 0.4, { raw: true, w: 0.8 });
        const heap = P([[104, 254], [130, 228], [170, 238], [210, 226], [246, 242], [276, 254]]);
        K.stroke(R, U.catmull(heap, 1.2), t + 0.3, t + 0.5, { raw: true, w: 1.0 });
        K.pencil(R, heap, PAL.rose, t + 0.4, t + 0.7, { seed: 'heap6', alpha: 0.4 });
      }
      cells.forEach(([x, y], i) => {
        K.strokes(R, A.numeral(i + 1, x + 14, y + ph + 30, 7, { color: PAL.red }), pT(i) + 0.4, pT(i) + 0.5);
        K.label(R, x + 40, y + ph + 30, 6.2, 2, pT(i) + 0.5, pT(i) + 0.9, { seed: 'pl' + i });
      });

      // ---------------------------------------------------------- the alligator gets out
      const path = U.catmull([[930, 1236], [700, 1250], [420, 1236], [120, 1170], [-200, 1060], [-430, 1010], [-680, 1016], [-880, 1080], [-1040, 1250], [-1150, 1520]], 4);
      const pathLen = U.pathLen(path);
      const cum = [0];
      for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      const posAt = (d) => {
        d = U.clamp(d, 0, pathLen);
        let lo = 0, hi = cum.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
        const f = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
        return [path[lo][0] + (path[hi][0] - path[lo][0]) * f, path[lo][1] + (path[hi][1] - path[lo][1]) * f];
      };
      const cT = [45.625, T1 + 0.35];
      const Lc = 380;
      const headDist = (T) => {
        const u = U.sat((T - cT[0]) / (cT[1] - cT[0]));
        return Lc * 0.2 + (pathLen - Lc * 0.2) * (0.6 * u + 0.4 * u * u);
      };
      const width = (u) => {
        const k = [[0, 3], [0.03, 13], [0.12, 22], [0.2, 32], [0.26, 26], [0.34, 48], [0.52, 52], [0.64, 36], [0.72, 22], [1, 1]];
        for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return U.lerp(k[i - 1][1], k[i][1], (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
        return 1;
      };
      const crocTop = (T) => {
        const hd = headDist(T);
        const N = 60;
        const sp = [];
        for (let i = 0; i <= N; i++) {
          const s = (i / N) * Lc;
          sp.push(posAt(hd - s));
        }
        // undulation
        const pts = sp.map((p, i) => {
          const a = sp[Math.max(0, i - 1)], b = sp[Math.min(N, i + 1)];
          const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
          const u = i / N;
          const w = Math.sin(u * 5.5 - T * 9) * 16 * Math.pow(u, 1.2);
          return [p[0] - (dy / d) * w, p[1] + (dx / d) * w, -dy / d, dx / d];
        });
        const left = [], right = [];
        pts.forEach((p, i) => {
          const w = width(i / N) / 2;
          left.push([p[0] + p[2] * w, p[1] + p[3] * w]);
          right.push([p[0] - p[2] * w, p[1] - p[3] * w]);
        });
        return { pts, outline: left.concat(right.reverse()), N };
      };
      const drawCroc = (ctx, T, silhouette) => {
        const c = crocTop(T);
        const { pts, N } = c;
        const legs = [[0.3, 1], [0.3, -1], [0.6, 1], [0.6, -1]];
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        legs.forEach(([u, side], k) => {
          const p = pts[Math.round(u * N)];
          const phase = Math.sin(T * 9 + (k === 0 || k === 3 ? 0 : Math.PI));
          const w = width(u) / 2;
          const bx = p[0] + p[2] * w * side, by = p[1] + p[3] * w * side;
          const fwdx = pts[Math.max(0, Math.round(u * N) - 3)][0] - p[0], fwdy = pts[Math.max(0, Math.round(u * N) - 3)][1] - p[1];
          const fl = Math.hypot(fwdx, fwdy) || 1;
          const fx = bx + p[2] * side * 26 + (fwdx / fl) * phase * 20, fy = by + p[3] * side * 26 + (fwdy / fl) * phase * 20;
          ctx.strokeStyle = silhouette ? '#000' : U.rgba(PAL.ink);
          ctx.lineWidth = silhouette ? 9 : 8.5;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + p[2] * side * 20, by + p[3] * side * 20, fx, fy);
          ctx.stroke();
          if (!silhouette) {
            ctx.strokeStyle = U.rgba(U.mixc(PAL.moss, [240, 230, 200], 0.2));
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.strokeStyle = U.rgba(PAL.ink);
            ctx.lineWidth = 1.2;
            for (let t = -1; t <= 1; t++) {
              ctx.beginPath();
              ctx.moveTo(fx, fy);
              ctx.lineTo(fx + (fwdx / fl) * 8 + p[2] * side * t * 5, fy + (fwdy / fl) * 8 + p[3] * side * t * 5);
              ctx.stroke();
            }
          }
        });
        U.poly(ctx, c.outline);
        if (silhouette) { ctx.fillStyle = '#000'; ctx.fill(); return; }
        ctx.fillStyle = U.rgba(U.mixc(PAL.moss, [236, 226, 196], 0.18));
        ctx.fill();
        ctx.strokeStyle = U.rgba(PAL.ink);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // scutes in two rows, and the eyes
        ctx.lineWidth = 1.1;
        for (let i = Math.round(N * 0.3); i < N * 0.92; i += 2) {
          const p = pts[i];
          for (const side of [-1, 1]) {
            const o = width(i / N) * 0.16 * side;
            ctx.beginPath();
            ctx.moveTo(p[0] + p[2] * o - p[3] * 2, p[1] + p[3] * o + p[2] * 2);
            ctx.lineTo(p[0] + p[2] * o + p[3] * 2, p[1] + p[3] * o - p[2] * 2);
            ctx.stroke();
          }
        }
        const e = pts[Math.round(N * 0.14)];
        for (const side of [-1, 1]) {
          const w = width(0.14) * 0.36 * side;
          ctx.fillStyle = U.rgba(PAL.saffron);
          ctx.beginPath();
          ctx.arc(e[0] + e[2] * w, e[1] + e[3] * w, 4.2, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = U.rgba(PAL.ink);
          ctx.beginPath();
          ctx.ellipse(e[0] + e[2] * w, e[1] + e[3] * w, 1.2, 3, Math.atan2(e[3], e[2]), 0, TAU);
          ctx.fill();
        }
        // jaws: open a little as it eats
        const chomp = Math.max(0, Math.sin(T * 14)) * 0.5;
        const s0 = pts[0], s1 = pts[Math.round(N * 0.12)];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s0[0], s0[1]);
        ctx.lineTo(s1[0] + s1[2] * chomp * 6, s1[1] + s1[3] * chomp * 6);
        ctx.stroke();
      };
      show.actor({
        t0: cT[0], t1: cT[1], layer: 1,
        draw(ctx, T, view) {
          view.lift(ctx, 0, 0, 0);
          drawCroc(ctx, T, false);
        },
        shadow(ctx, T) {
          ctx.translate(10 * B.LIGHT.sx * 3, 10 * B.LIGHT.sy * 3);
          ctx.globalAlpha = 0.4;
          drawCroc(ctx, T, true);
        },
      });
      // it emerges from the last panel: a little tail flick still inside the frame
      // words it swallows on its way
      const eaten = [];
      const words = food.words;
      for (const w of words) {
        const wx = w.x + w.w / 2 - PW, wy = w.y - w.size * 0.4;
        for (let T = cT[0]; T < cT[1]; T += 0.02) {
          const h = posAt(headDist(T));
          if (Math.hypot(h[0] - wx, (h[1] - wy) * 1.3) < 62) {
            L.add(new Ink.EraseMark(w.x - 3, w.y - w.size * 2.55, w.w + 8, w.size * 3.9, T, w.mark));
            eaten.push({ T, x: wx, y: wy, w });
            break;
          }
        }
      }
      show.actor({
        t0: cT[0], t1: cT[1], layer: 2,
        draw(ctx, T) {
          ctx.fillStyle = U.rgba(PAL.ink, 0.85);
          for (const e of eaten) {
            const age = T - e.T;
            if (age < 0 || age > 0.35) continue;
            const h = posAt(headDist(T));
            const f = age / 0.35;
            for (let k = 0; k < 5; k++) {
              const x = U.lerp(e.x + (k - 2) * e.w.w * 0.2, h[0], f), y = U.lerp(e.y, h[1], f) - Math.sin(f * Math.PI) * 18;
              ctx.beginPath();
              ctx.arc(x, y, 2.2 * (1 - f) + 0.6, 0, TAU);
              ctx.fill();
            }
          }
        },
      });
      eaten.sort((a, b) => a.T - b.T);
      let lastGulp = -1;
      for (const e of eaten) if (e.T - lastGulp > 0.42) { show.cue(e.T, 'gulp'); lastGulp = e.T; }
      show.cue(pT(0), 'lovers');
      show.cue(pT(2), 'turning');
      show.cue(cT[0], 'croc');

      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-1040, -80, 1080, 1580] });
      show.cam(T0 + 1.0, [-960, 60, 2000, 1400], { n: [-40, 100, 1080, 1100] });
      show.cam(T0 + 3.2, [-160, 320, 1260, 1140], { n: [40, 420, 960, 1000] });
      show.cam(cT[0] + 0.3, [-560, 520, 1560, 1100], { n: [-300, 600, 1000, 1100] });
      show.cam(cT[0] + 2.3, [-1250, 450, 1600, 1150], { n: [-1000, 600, 1000, 1100] });
      show.cam(T1 - 0.3, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'VI · Humankind', 'two lovers, a blanket, and then an alligator');
    },
  });
})((window.Codex = window.Codex || {}));
