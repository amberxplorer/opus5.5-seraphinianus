/* II · Fauna — creatures stitched from other things; a fish swims out of its own description
   and the words of the page follow it as a shoal. */
(function (C) {
  'use strict';
  const U = C.U, Ink = C.Ink, A = C.Asemic, D = C.Draw, K = C.Kit, B = C.Book;
  const PAL = Ink.PAL;
  const PW = B.PW;
  const TAU = Math.PI * 2;

  function fishGeometry(ox, oy) {
    const T = (pts) => pts.map((p) => [ox + p[0], oy + p[1]]);
    const top = U.catmull([[0, 0], [40, -62], [150, -118], [300, -128], [430, -100], [520, -52], [560, -28]], 2);
    const bottom = U.catmull([[560, 24], [505, 52], [400, 104], [260, 122], [120, 100], [35, 52], [0, 0]], 2);
    const body = top.concat(bottom);
    const tail = U.catmull([[556, -26], [610, -92], [684, -152], [668, -62], [652, 0], [672, 66], [694, 142], [612, 82], [556, 22]], 2);
    const dorsal = U.catmull([[190, -120], [228, -206], [300, -218], [372, -192], [424, -104]], 2);
    const anal = U.catmull([[380, 106], [420, 164], [482, 152], [506, 54]], 2);
    const pect = U.catmull([[132, 40], [176, 96], [216, 112], [204, 70], [150, 34]], 2);
    const pelv = U.catmull([[258, 118], [290, 172], [322, 162], [310, 114]], 2);
    const gill = U.catmull([[135, -100], [162, -30], [160, 30], [138, 98]], 2);
    const mouth = U.catmull([[3, 6], [22, 12], [34, 7]], 1);
    const rays = [];
    const fan = (base, edge, n) => {
      for (let i = 1; i < n; i++) {
        const q = edge[Math.round((i / n) * (edge.length - 1))];
        rays.push([base(i / n), q]);
      }
    };
    fan(() => [560, 0], tail.slice(6, tail.length - 6), 11);
    fan((t) => [190 + t * 230, -118 + Math.sin(t * Math.PI) * -8], dorsal, 9);
    fan(() => [140, 40], pect, 6);
    fan((t) => [385 + t * 115, 100 - t * 40], anal, 6);
    const scales = [];
    let row = 0;
    for (let cy = -100; cy <= 100; cy += 23, row++) {
      for (let cx = 185 + (row % 2) * 13; cx <= 530; cx += 26) {
        if (!U.pointInPoly(cx, cy, body)) continue;
        if (!U.pointInPoly(cx + 16, cy + 14, body) || !U.pointInPoly(cx + 16, cy - 14, body)) continue;
        const arc = [];
        for (let k = 0; k <= 8; k++) {
          const a = -1.25 + (k / 8) * 2.5;
          arc.push([cx + Math.cos(a) * 13, cy + Math.sin(a) * 13]);
        }
        scales.push(arc);
      }
    }
    const lateral = [];
    for (let x = 170; x < 545; x += 12) lateral.push([x, -8 + (x - 170) * 0.02, 1.4]);
    const backPoly = top.concat([[560, 0], [300, -20], [150, -10], [0, 0]]);
    const bellyPoly = [[0, 0], [150, 20], [300, 30], [560, 5]].concat(bottom);
    return {
      body: T(body), tail: T(tail), dorsal: T(dorsal), anal: T(anal), pect: T(pect), pelv: T(pelv), gill: T(gill), mouth: T(mouth),
      rays: rays.map(T), scales: scales.map(T), lateral: lateral.map((p) => [ox + p[0], oy + p[1], p[2]]),
      backPoly: T(backPoly), bellyPoly: T(bellyPoly),
      eye: [ox + 70, oy - 14],
      all: T(U.catmull([[-6, 0], [40, -70], [190, -130], [300, -226], [380, -200], [440, -110], [560, -40], [690, -160], [700, 150], [560, 40], [500, 160], [400, 175], [300, 180], [200, 120], [120, 110], [30, 60], [-6, 0]], 3)),
    };
  }

  C.Scenes.push({
    id: 'fauna',
    build(show, TL) {
      const sp = show.spread([60, 61]);
      const L = sp.L, R = sp.R;
      const T0 = TL.turns[1][1], T1 = TL.turns[2][0];
      show.turn(TL.turns[1][0], TL.turns[1][1], 1, 2);
      const pre = TL.turns[1][0] - 1;
      K.furniture(L, 60, 'L', pre);
      K.furniture(R, 61, 'R', pre);
      K.strokes(L, A.numeral(2, 500, 150, 26, { center: true, color: PAL.red, weight: 0.13 }), pre, pre);
      K.strokes(L, A.display(500, 236, 22, { center: true, seed: 'fauna-title', swash: false, weight: 0.1 }).strokes, pre, pre);

      // ---------------------------------------------------------- four specimens
      const boxes = [[96, 300], [524, 300], [96, 690], [524, 690]];
      const fw = 380, fh = 330;
      boxes.forEach(([x, y], i) => K.frame(L, x, y, fw, fh, T0 + 0.2 + i * 0.15, T0 + 0.8 + i * 0.15, { w: 0.9, gap: 4 }));
      const ld = (i) => T0 + 0.7 + i * 0.35; // start of each drawing
      // 1 · snail whose shell is a house
      {
        const t = ld(0);
        const body = U.catmull([[150, 562], [168, 546], [230, 536], [330, 534], [398, 530], [420, 526], [432, 544], [414, 562], [150, 564]], 2);
        K.stroke(L, body, t, t + 0.7, { raw: true, w: 1.3 });
        K.stroke(L, U.catmull([[410, 530], [424, 500], [432, 478]], 1.5), t + 0.6, t + 0.8, { raw: true, w: 0.9 });
        K.stroke(L, U.catmull([[398, 532], [402, 506], [406, 486]], 1.5), t + 0.65, t + 0.85, { raw: true, w: 0.9 });
        L.add(Ink.dots([[432, 476, 3], [406, 484, 3]], 3, t + 0.85, t + 0.9));
        const walls = [[205, 535], [205, 442], [335, 442], [335, 535]];
        K.stroke(L, U.densify(walls, 2), t + 0.5, t + 0.9, { raw: true, w: 1.2 });
        K.stroke(L, U.densify([[192, 448], [270, 384], [348, 448]], 2), t + 0.8, t + 1.1, { raw: true, w: 1.3 });
        K.stroke(L, U.densify([[304, 408], [304, 380], [320, 380], [320, 420]], 1.5), t + 1.0, t + 1.2, { raw: true, w: 1.0 });
        K.stroke(L, U.catmull([[256, 535], [256, 502], [270, 490], [284, 502], [284, 535]], 1.5), t + 1.1, t + 1.3, { raw: true, w: 1.0 });
        for (const [wx, wy] of [[220, 460], [298, 460]]) {
          K.stroke(L, U.densify([[wx, wy], [wx + 24, wy], [wx + 24, wy + 22], [wx, wy + 22], [wx, wy]], 1.5), t + 1.2, t + 1.35, { raw: true, w: 0.8 });
          K.stroke(L, U.densify([[wx + 12, wy], [wx + 12, wy + 22]], 1.5), t + 1.3, t + 1.4, { raw: true, w: 0.6 });
        }
        // chimney smoke becomes writing
        const smoke = [];
        for (let i = 0; i <= 60; i++) {
          const a = i * 0.16;
          smoke.push([312 + Math.sin(a) * (4 + i * 0.5) + i * 0.8, 376 - i * 1.1]);
        }
        const words = A.alongPath(smoke, 4.2, { seed: 'smoke', weight: 0.11 });
        words.forEach((w, i) => K.strokes(L, w.strokes, t + 1.3 + i * 0.15, t + 1.5 + i * 0.15));
        K.pencil(L, walls, PAL.ochre, t + 1.4, t + 2.1, { seed: 'walls', alpha: 0.35 });
        K.pencil(L, [[192, 448], [270, 384], [348, 448]], PAL.carmine, t + 1.5, t + 2.1, { seed: 'roof', alpha: 0.4 });
        K.pencil(L, body, PAL.sage, t + 1.6, t + 2.3, { seed: 'snail', alpha: 0.42 });
        K.hatch(L, [[160, 556], [420, 548], [414, 562], [150, 564]], t + 1.8, t + 2.1, { spacing: 2.5, w: 0.5 });
        K.stroke(L, U.densify([[120, 566], [460, 566]], 3), t + 0.2, t + 0.5, { raw: true, w: 0.7 });
      }
      // 2 · bird with a pen-nib beak
      {
        const t = ld(1);
        const body = D.ellipse(700, 480, 72, 44, 40, 0);
        const bodyR = body.map(([x, y]) => { const dx = x - 700, dy = y - 480, a = -0.3; return [700 + dx * Math.cos(a) - dy * Math.sin(a), 480 + dx * Math.sin(a) + dy * Math.cos(a)]; });
        K.outline(L, bodyR, t, t + 0.6, { w: 1.3 });
        const head = D.ellipse(780, 420, 27, 25, 28);
        K.outline(L, head, t + 0.5, t + 0.8, { w: 1.3 });
        const nib = [[800, 408], [866, 440], [801, 432]];
        K.stroke(L, U.densify(nib.concat([nib[0]]), 1.5), t + 0.8, t + 1.05, { raw: true, w: 1.2 });
        K.stroke(L, U.densify([[818, 423], [862, 439]], 1.5), t + 1.0, t + 1.1, { raw: true, w: 0.6 });
        K.stroke(L, U.circle(818, 422, 2.8, 10).concat([[820.8, 422]]), t + 1.05, t + 1.12, { w: 0.6 });
        L.add(Ink.dots([[784, 414, 3.2]], 3, t + 1.1, t + 1.15));
        L.add(Ink.dots([[868, 454, 3.5], [869, 468, 2.6]], 3, t + 1.6, t + 1.8));
        const qr = new U.Rand('bird-tail');
        const tails = [[632, 500, Math.PI + 0.55, 118], [628, 494, Math.PI + 0.35, 132], [626, 488, Math.PI + 0.15, 108]].map(([x, y, a, l]) => D.feather(x, y, a, l, 13, qr));
        tails.forEach((f, i) => {
          K.stroke(L, f.outline, t + 0.9 + i * 0.12, t + 1.2 + i * 0.12, { w: 1.0 });
          K.stroke(L, f.quill, t + 1.1 + i * 0.12, t + 1.3 + i * 0.12, { w: 0.7 });
          K.pencil(L, f.outline, PAL.violet, t + 1.6, t + 2.1, { seed: 'bt' + i, alpha: 0.36 });
        });
        const wing = D.leaf(662, 470, 0.25, 92, 26, { bend: 0.05 });
        K.stroke(L, wing.outline, t + 1.0, t + 1.3, { w: 1.0 });
        K.lines(L, wing.veins, t + 1.25, t + 1.5, { w: 0.5 });
        K.stroke(L, U.catmull([[700, 520], [690, 560], [712, 600]], 1.5), t + 1.2, t + 1.4, { raw: true, w: 1.4 });
        K.lines(L, [[[712, 600], [694, 610]], [[712, 600], [712, 614]], [[712, 600], [730, 609]]], t + 1.35, t + 1.5, { w: 1.0 });
        K.stroke(L, U.densify([[600, 612], [820, 612]], 3), t + 0.1, t + 0.4, { raw: true, w: 0.7 });
        K.pencil(L, bodyR, PAL.slate, t + 1.5, t + 2.2, { seed: 'bbody', alpha: 0.4 });
        K.pencil(L, head, PAL.slate, t + 1.6, t + 2.1, { seed: 'bhead', alpha: 0.35 });
        K.pencil(L, nib, PAL.gold, t + 1.6, t + 2.0, { seed: 'nib', alpha: 0.5 });
      }
      // 3 · butterfly whose wings are pages
      {
        const t = ld(2);
        const cx = 286, cy = 858;
        K.outline(L, D.ellipse(cx, cy, 7, 52, 24), t, t + 0.4, { w: 1.2 });
        for (let k = 1; k < 6; k++) K.stroke(L, [[cx - 6, cy - 40 + k * 14], [cx + 6, cy - 38 + k * 14]], t + 0.35, t + 0.45, { w: 0.5 });
        K.stroke(L, U.catmull([[cx - 3, cy - 50], [cx - 22, cy - 88], [cx - 44, cy - 104], [cx - 50, cy - 92], [cx - 40, cy - 88]], 1.2), t + 0.4, t + 0.6, { raw: true, w: 0.8 });
        K.stroke(L, U.catmull([[cx + 3, cy - 50], [cx + 22, cy - 88], [cx + 44, cy - 104], [cx + 50, cy - 92], [cx + 40, cy - 88]], 1.2), t + 0.45, t + 0.65, { raw: true, w: 0.8 });
        const wings = [
          [[cx - 8, cy - 28], [cx - 130, cy - 100], [cx - 158, cy + 4], [cx - 8, cy + 8]],
          [[cx + 8, cy - 28], [cx + 130, cy - 100], [cx + 158, cy + 4], [cx + 8, cy + 8]],
          [[cx - 8, cy + 12], [cx - 96, cy + 20], [cx - 84, cy + 100], [cx - 8, cy + 44]],
          [[cx + 8, cy + 12], [cx + 96, cy + 20], [cx + 84, cy + 100], [cx + 8, cy + 44]],
        ];
        wings.forEach((w, i) => {
          const poly = U.catmull(w.concat([w[0]]), 2, false, 0.2);
          K.stroke(L, poly, t + 0.5 + i * 0.15, t + 0.9 + i * 0.15, { raw: true, w: 1.1 });
          // lines of text across each page-wing
          const left = i % 2 === 0;
          const n = i < 2 ? 6 : 3;
          for (let k = 0; k < n; k++) {
            const f = (k + 1) / (n + 1);
            const ya = U.lerp(w[0][1], w[3][1], f), yb = U.lerp(w[1][1], w[2][1], f);
            const xa = U.lerp(w[0][0], w[3][0], f), xb = U.lerp(w[1][0], w[2][0], f);
            const lx0 = U.lerp(xa, xb, 0.12), lx1 = U.lerp(xa, xb, 0.84);
            const ly0 = U.lerp(ya, yb, 0.12), ly1 = U.lerp(ya, yb, 0.84);
            const line = [];
            for (let q = 0; q <= 18; q++) {
              const u = q / 18;
              line.push([U.lerp(lx0, lx1, u), U.lerp(ly0, ly1, u) + Math.sin(q * 2.3 + k) * 1.4]);
            }
            K.stroke(L, line, t + 1.0 + i * 0.1 + k * 0.05, t + 1.2 + i * 0.1 + k * 0.05, { raw: true, w: 0.55 });
          }
          void left;
          K.pencil(L, poly, i < 2 ? PAL.rose : PAL.sky, t + 1.5 + i * 0.1, t + 2.1 + i * 0.1, { seed: 'bw' + i, alpha: 0.3 });
        });
      }
      // 4 · giraffe with a ladder for a neck
      {
        const t = ld(3);
        const body = D.ellipse(684, 900, 72, 38, 36);
        K.outline(L, body, t, t + 0.5, { w: 1.3 });
        [[640, 928], [662, 934], [716, 934], [738, 926]].forEach(([x, y], i) => {
          K.stroke(L, U.catmull([[x, y], [x + (i % 2 ? 3 : -3), y + 36], [x, 996]], 1.5), t + 0.4 + i * 0.08, t + 0.6 + i * 0.08, { raw: true, w: 1.2 });
          K.stroke(L, U.densify([[x - 5, 996], [x + 6, 996], [x + 5, 1004], [x - 5, 1004], [x - 5, 996]], 1), t + 0.6 + i * 0.05, t + 0.7 + i * 0.05, { raw: true, w: 0.9 });
        });
        const railA = [[730, 882], [806, 738]], railB = [[750, 890], [826, 746]];
        K.stroke(L, U.densify(railA, 2), t + 0.6, t + 0.85, { raw: true, w: 1.3 });
        K.stroke(L, U.densify(railB, 2), t + 0.65, t + 0.9, { raw: true, w: 1.3 });
        for (let k = 1; k <= 6; k++) {
          const f = k / 7;
          K.stroke(L, U.densify([[U.lerp(730, 806, f), U.lerp(882, 738, f)], [U.lerp(750, 826, f), U.lerp(890, 746, f)]], 1.5), t + 0.85 + k * 0.05, t + 0.95 + k * 0.05, { raw: true, w: 0.9 });
        }
        const head = U.catmull([[800, 742], [812, 722], [846, 718], [868, 730], [852, 744], [826, 750], [806, 750], [800, 742]], 1.5);
        K.stroke(L, head, t + 1.1, t + 1.35, { raw: true, w: 1.2 });
        K.lines(L, [[[816, 722], [812, 700]], [[828, 720], [828, 698]]], t + 1.3, t + 1.4, { w: 1.0 });
        L.add(Ink.dots([[812, 698, 3], [828, 696, 3], [836, 730, 2.4]], 3, t + 1.4, t + 1.45));
        K.stroke(L, U.catmull([[614, 890], [598, 910], [596, 940]], 1.5), t + 0.5, t + 0.65, { raw: true, w: 0.9 });
        const sr = new U.Rand('spots');
        for (let k = 0; k < 9; k++) {
          const sx = 684 + sr.range(-55, 55), sy = 900 + sr.range(-24, 24);
          if (!U.pointInPoly(sx, sy, body)) continue;
          const spot = U.deform(D.ellipse(sx, sy, sr.range(7, 12), sr.range(5, 9), 14), 3, 0.2, k);
          K.outline(L, spot, t + 1.4 + k * 0.04, t + 1.5 + k * 0.04, { w: 0.7 });
          K.wash(L, spot, PAL.umber, t + 1.7 + k * 0.03, t + 2.1 + k * 0.03, { alpha: 0.5, amp: 1, seed: k });
        }
        K.pencil(L, body, PAL.saffron, t + 1.5, t + 2.2, { seed: 'gir', alpha: 0.4 });
        K.pencil(L, head, PAL.saffron, t + 1.6, t + 2.1, { seed: 'girh', alpha: 0.4 });
        K.stroke(L, U.densify([[560, 1006], [860, 1006]], 3), t + 0.1, t + 0.4, { raw: true, w: 0.7 });
      }
      boxes.forEach(([x, y], i) => K.label(L, x + fw / 2, y + fh + 30, 6.4, 2, T0 + 2.4 + i * 0.12, T0 + 2.9 + i * 0.12, { center: true, seed: 'flab' + i }));

      // the text that will swim away
      const shoalBlock = K.printed(L, { seed: 'fauna-shoal', x: 96, y: 1112, w: 808, size: 7.4, lines: 7 }, pre);

      // ---------------------------------------------------------- the fish (a sprite, so it can leave)
      const ox = 175, oy = 612;
      const G = fishGeometry(ox, oy);
      const fm = [];
      const f0 = T0 + 0.35;
      const S = (pts, a, b, o) => fm.push(Ink.stroke(pts, a, b, Object.assign({ raw: true }, o)));
      S(G.body, f0, f0 + 1.1, { w: 1.7 });
      S(G.tail, f0 + 0.9, f0 + 1.35, { w: 1.4 });
      S(G.dorsal, f0 + 1.0, f0 + 1.3, { w: 1.2 });
      S(G.pect, f0 + 1.2, f0 + 1.4, { w: 1.1 });
      S(G.anal, f0 + 1.25, f0 + 1.45, { w: 1.1 });
      S(G.pelv, f0 + 1.3, f0 + 1.5, { w: 1.1 });
      S(G.gill, f0 + 1.35, f0 + 1.55, { w: 1.3 });
      S(G.mouth, f0 + 1.4, f0 + 1.5, { w: 1.0 });
      fm.push(new Ink.StrokeMark(G.rays.map((r, i) => Ink.path(r, { w: 0.55, seed: i, tIn: 1, tOut: 3 })), f0 + 1.45, f0 + 2.1, { mode: 'stagger', overlap: 0.25 }));
      fm.push(new Ink.StrokeMark(G.scales.map((r, i) => Ink.path(r, { w: 0.75, seed: i, tIn: 1, tOut: 1 })), f0 + 1.6, f0 + 2.8, { mode: 'stagger', overlap: 0.08 }));
      fm.push(Ink.dots(G.lateral, 1.4, f0 + 2.3, f0 + 2.8));
      const eyeO = U.circle(G.eye[0], G.eye[1], 22, 30), iris = U.circle(G.eye[0], G.eye[1], 14, 24), pupil = U.circle(G.eye[0] - 2, G.eye[1], 7, 16);
      S(eyeO.concat([eyeO[0], eyeO[1]]), f0 + 1.5, f0 + 1.7, { w: 1.2 });
      S(iris.concat([iris[0]]), f0 + 1.65, f0 + 1.8, { w: 0.8 });
      fm.push(Ink.wash(iris, PAL.saffron, f0 + 2.5, f0 + 3.0, { alpha: 0.7, amp: 0.8, seed: 3, soft: 0.1 }));
      fm.push(Ink.wash(pupil, [28, 20, 14], f0 + 2.6, f0 + 2.9, { alpha: 0.95, amp: 0.4, seed: 4, soft: 0, grain: 0 }));
      fm.push(Ink.pencil(G.backPoly, PAL.ultramarine, f0 + 2.4, f0 + 3.3, { seed: 'back', alpha: 0.34, spacing: 2.3 }));
      fm.push(Ink.pencil(G.backPoly, PAL.teal, f0 + 2.6, f0 + 3.4, { seed: 'back2', alpha: 0.22, angle: 0.4, passes: 1 }));
      fm.push(Ink.pencil(G.bellyPoly, PAL.saffron, f0 + 2.5, f0 + 3.3, { seed: 'belly', alpha: 0.34 }));
      for (const [poly, col, i] of [[G.tail, PAL.carmine, 0], [G.dorsal, PAL.rose, 1], [G.anal, PAL.rose, 2], [G.pect, PAL.rose, 3], [G.pelv, PAL.rose, 4]]) {
        fm.push(Ink.pencil(poly, col, f0 + 2.7 + i * 0.1, f0 + 3.3 + i * 0.1, { seed: 'fin' + i, alpha: 0.32 }));
      }
      fm.push(Ink.hatch(G.bellyPoly.slice(Math.floor(G.bellyPoly.length * 0.35)), f0 + 2.9, f0 + 3.5, { spacing: 3.2, w: 0.45, angle: 0.5 }));
      const sprite = new B.InkSprite({ x0: ox - 20, y0: oy - 240, x1: ox + 720, y1: oy + 190 }, fm, { outline: G.all });

      // specimen annotations that will outlive the fish
      const notes = [[G.eye[0], G.eye[1] - 24, 120, 330], [ox + 300, oy - 210, 430, 300], [ox + 670, oy - 150, 800, 300], [ox + 170, oy + 105, 250, 900], [ox + 450, oy + 150, 640, 900]];
      notes.forEach(([x, y, lx, ly], i) => {
        K.leader(R, lx, ly + (ly < 500 ? 8 : -22), x, y, T0 + 3.4 + i * 0.1, T0 + 3.7 + i * 0.1);
        K.label(R, lx, ly, 6.2, 2, T0 + 3.5 + i * 0.1, T0 + 3.9 + i * 0.1, { center: true, seed: 'fn' + i });
      });
      K.label(R, 500, 170, 11, 2, pre, pre, { center: true, seed: 'fish-head', cap: true });
      K.printed(R, { seed: 'fauna-right', x: 96, y: 1010, w: 808, size: 7.4, lines: 9 }, pre);

      const alive = 25.0;
      const keys = [
        [alive, 505, oy, 0], [alive + 1.0, 330, 520, 150], [alive + 2.0, -150, 380, 300],
        [alive + 3.0, -760, 190, 420], [alive + 4.2, -1500, -220, 520], [alive + 5.2, -2300, -700, 600],
      ];
      const fishAt = (T) => {
        if (T <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: 0, a: 0 };
        let i = 0;
        while (i < keys.length - 2 && T > keys[i + 1][0]) i++;
        const u = U.sat((T - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
        const P = (j) => keys[U.clamp(j, 0, keys.length - 1)];
        const cr = (k) => {
          const p0 = P(i - 1)[k], p1 = P(i)[k], p2 = P(i + 1)[k], p3 = P(i + 2)[k];
          return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
        };
        const x = cr(1), y = cr(2), z = cr(3);
        return { x, y, z };
      };
      const heading = (T) => {
        const a = fishAt(T - 0.05), b = fishAt(T + 0.05);
        return Math.atan2(b.y - a.y, b.x - a.x);
      };
      const drawFish = (ctx, T, view, sh, lifted) => {
        const s = sh.surf(R);
        const scale = s ? s.scale : Ink.texScale || 1.2;
        sprite.bake(T, scale);
        if (!lifted) { sprite.drawOnPage(ctx, T); return; }
        const cut = sprite.cutout(s && s.base);
        const P = fishAt(T);
        const turn = U.smoothstep(alive, alive + 0.8, T);
        const ang = U.angLerp(0, heading(T) - Math.PI, turn);
        const cx = (sprite.bb.x0 + sprite.bb.x1) / 2, cy = oy;
        view.lift(ctx, P.x, P.y, P.z);
        ctx.rotate(ang);
        const w = sprite.bb.x1 - sprite.bb.x0, h = sprite.bb.y1 - sprite.bb.y0;
        const N = 28;
        const amp = 26 * U.smoothstep(alive - 0.2, alive + 0.6, T);
        const cw = cut.width;
        for (let i = 0; i < N; i++) {
          const f = i / N;
          const tailF = U.sat((f - 0.12) / 0.88);
          const dy = amp * Math.pow(tailF, 1.6) * Math.sin(TAU * (tailF * 0.9 - T * 1.9));
          ctx.drawImage(cut, (f * cw) | 0, 0, Math.ceil(cw / N) + 1, cut.height, sprite.bb.x0 - cx + f * w, sprite.bb.y0 - cy + dy, w / N + 0.8, h);
        }
      };
      show.actor({ t0: T0 - 0.01, t1: alive, layer: 0, draw(ctx, T, view, sh) { drawFish(ctx, T, view, sh, false); }, activity(T) { return T < f0 + 3.4 ? 1.2 : 0; } });
      show.actor({
        t0: alive, t1: T1 + 0.4, layer: 3,
        draw(ctx, T, view, sh) { drawFish(ctx, T, view, sh, true); },
        shadow(ctx, T) {
          const P = fishAt(T);
          const turn = U.smoothstep(alive, alive + 0.8, T);
          const ang = U.angLerp(0, heading(T) - Math.PI, turn);
          ctx.translate(P.x + P.z * B.LIGHT.sx, P.y + P.z * B.LIGHT.sy);
          ctx.rotate(ang);
          ctx.translate(-(sprite.bb.x0 + sprite.bb.x1) / 2, -oy);
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = '#000';
          U.poly(ctx, G.all);
          ctx.fill();
        },
      });
      // bubbles from its mouth
      show.actor({
        t0: alive + 0.3, t1: T1 + 0.4, layer: 4,
        draw(ctx, T, view) {
          ctx.strokeStyle = U.rgba(PAL.ink, 0.8);
          ctx.lineWidth = 1.2;
          for (let k = 0; k < 16; k++) {
            const born = alive + 0.3 + k * 0.28;
            const age = T - born;
            if (age < 0 || age > 1.6) continue;
            const P = fishAt(born);
            const hd = heading(born);
            const nx = P.x + Math.cos(hd) * 250, ny = P.y + Math.sin(hd) * 250;
            const x = nx + Math.sin(age * 5 + k) * 10, y = ny - age * 120;
            const p = view.proj(x, y, P.z + age * 60);
            const r = (3 + (k % 3) * 2.5 + age * 3) * p[2];
            ctx.globalAlpha = 1 - age / 1.6;
            ctx.beginPath();
            ctx.arc(p[0], p[1], r, 0, TAU);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        },
      });

      // ---------------------------------------------------------- the shoal of words
      const words = shoalBlock.words;
      const sr = new U.Rand('shoal');
      const shoal = words.map((w, i) => {
        const t = alive + 0.4 + i * 0.022 + sr.range(0, 0.1);
        L.add(new Ink.EraseMark(w.x - 3, w.y - w.size * 2.55, w.w + 8, w.size * 3.9, t, w.mark));
        const pts = [];
        const cx = w.x + w.w / 2, cy = w.y - w.size * 0.5;
        for (const st of w.strokes) {
          const arr = [];
          for (let k = 0; k < st.n; k += 3) arr.push(st.x[k] - cx, st.y[k] - cy);
          pts.push(new Float32Array(arr));
        }
        return { t, pts, hx: cx - PW, hy: cy, lag: 0.35 + sr.range(0, 0.9), ox: sr.range(-230, 230), oy: sr.range(-150, 150), ph: sr.range(0, TAU), wd: Math.max(0.7, w.size * 0.11) };
      });
      show.actor({
        t0: alive + 0.4, t1: T1 + 0.4, layer: 2,
        draw(ctx, T, view) {
          ctx.strokeStyle = U.rgba(PAL.ink, 0.92);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (const s of shoal) {
            if (T < s.t) continue;
            const p = U.smoothstep(s.t, s.t + 1.3, T);
            const F = fishAt(T - s.lag);
            const hd = heading(T - s.lag);
            const tx = F.x + s.ox * 0.9 + Math.cos(hd) * -120, ty = F.y + s.oy;
            const x = U.lerp(s.hx, tx, U.easeInOut(p));
            const y = U.lerp(s.hy, ty, U.easeInOut(p)) - U.bump(p) * 60;
            const z = F.z * 0.85 * p + U.bump(p) * 40;
            const ang = U.angLerp(0, hd - Math.PI, p) + Math.sin(T * 3 + s.ph) * 0.1 * p;
            ctx.save();
            view.lift(ctx, x, y, z);
            ctx.rotate(ang);
            ctx.lineWidth = s.wd;
            const amp = 2.2 * p;
            ctx.beginPath();
            for (const arr of s.pts) {
              for (let k = 0; k < arr.length; k += 2) {
                const px = arr[k], py = arr[k + 1] + amp * Math.sin(px * 0.22 - T * 10 + s.ph);
                if (k === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
            }
            ctx.stroke();
            ctx.restore();
          }
        },
        shadow(ctx, T) {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          for (const s of shoal) {
            if (T < s.t) continue;
            const p = U.smoothstep(s.t, s.t + 1.3, T);
            const F = fishAt(T - s.lag);
            const hd = heading(T - s.lag);
            const tx = F.x + s.ox * 0.9 + Math.cos(hd) * -120, ty = F.y + s.oy;
            const x = U.lerp(s.hx, tx, U.easeInOut(p)), y = U.lerp(s.hy, ty, U.easeInOut(p)) - U.bump(p) * 60;
            const z = F.z * 0.85 * p + U.bump(p) * 40;
            ctx.fillRect(x + z * B.LIGHT.sx - 20, y + z * B.LIGHT.sy - 4, 40, 8);
          }
        },
      });

      show.cue(alive, 'fish');
      show.cue(alive + 0.4, 'shoal');
      show.cam(T0 + 0.1, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.cam(T0 + 1.6, [-1060, 200, 1320, 1150], { n: [-1000, 200, 1000, 1150] });
      show.cam(T0 + 3.4, [-150, 250, 1250, 1000], { n: [40, 300, 980, 1000] });
      show.cam(alive + 0.4, [-760, 0, 1900, 1520], { n: [-300, 100, 1200, 1500] });
      show.cam(alive + 2.8, [-1560, -420, 2500, 1960], { n: [-1100, -400, 1400, 2000] });
      show.cam(T1 - 0.35, [-1160, -130, 2320, 1680], { n: [-40, -80, 1080, 1580] });
      show.caption(T0 + 0.3, T0 + 4.8, 'II · Fauna', 'a fish swims out of its own description, and the words follow');
    },
  });
})((window.Codex = window.Codex || {}));
