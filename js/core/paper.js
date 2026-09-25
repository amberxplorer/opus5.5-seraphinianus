/* Codicillus Seraphinianus — procedural materials: laid paper, walnut desk, book cloth,
   Italian marbled endpapers, gilding. */
(function (C) {
  'use strict';
  const U = C.U;
  const P = (C.Paper = {});

  P.PAGE_W = 1000;
  P.PAGE_H = 1414;
  P.PAPER = U.hex('#efe4cc');

  function tile(n, fn) {
    const c = U.canvas(n, n);
    const g = c.getContext('2d');
    const img = g.createImageData(n, n);
    const d = img.data;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 4;
        const v = fn(x, y);
        d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3];
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // Fine paper grain tile, shared.
  let grainTile = null;
  P.grainTile = function () {
    if (grainTile) return grainTile;
    const r = new U.Rand('paper-grain');
    grainTile = tile(256, () => {
      const v = r.next();
      const dark = v < 0.5;
      const a = dark ? (0.5 - v) * 70 : (v - 0.5) * 50;
      return dark ? [70, 50, 30, a] : [255, 250, 235, a];
    });
    return grainTile;
  };

  // One page of warm, slightly mottled paper with fibres and foxing.
  P.page = function (wpx, seed, o) {
    o = o || {};
    const hpx = Math.round(wpx * 1.414);
    const c = U.canvas(wpx, hpx);
    const g = c.getContext('2d');
    const r = new U.Rand('page' + seed);
    const noise = U.makeNoise2D('pg' + seed);
    const base = o.color || P.PAPER;
    g.fillStyle = U.rgba(base);
    g.fillRect(0, 0, wpx, hpx);

    // cloudy formation of the sheet (low resolution, smoothly enlarged)
    const lw = 90, lh = 128;
    const low = tile(Math.max(lw, lh), (x, y) => {
      const n = U.fbm(noise, x * 0.035, y * 0.035, 4);
      const m = U.fbm(noise, x * 0.12 + 40, y * 0.12, 2);
      const v = 0.5 + n * 0.5 + m * 0.18;
      const k = U.clamp(v, 0, 1);
      return [120 + k * 40, 90 + k * 30, 55 + k * 25, 26 + (1 - k) * 34];
    });
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(low, 0, 0, lw, lh, 0, 0, wpx, hpx);

    // grain
    g.globalCompositeOperation = 'source-over';
    const pat = g.createPattern(P.grainTile(), 'repeat');
    g.save();
    g.translate(r.range(0, 256), r.range(0, 256));
    g.fillStyle = pat;
    g.globalAlpha = 0.55;
    g.fillRect(-256, -256, wpx + 512, hpx + 512);
    g.restore();

    // fibres
    const sc = wpx / 1000;
    g.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = r.range(0, wpx), y = r.range(0, hpx);
      const a = r.range(0, U.TAU), len = r.range(6, 26) * sc;
      g.strokeStyle = r.chance(0.6) ? `rgba(110,80,50,${r.range(0.05, 0.12)})` : `rgba(255,252,240,${r.range(0.15, 0.3)})`;
      g.lineWidth = r.range(0.4, 1.0) * sc;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }

    // foxing — age spots, mostly near the edges
    const spots = o.spots === undefined ? r.int(2, 7) : o.spots;
    for (let i = 0; i < spots; i++) {
      const edge = r.chance(0.7);
      const x = edge ? (r.chance(0.5) ? r.range(0, 0.12) : r.range(0.88, 1)) * wpx : r.range(0.1, 0.9) * wpx;
      const y = r.range(0, 1) * hpx;
      const rad = r.range(2, 12) * sc;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      const a = r.range(0.06, 0.16);
      grd.addColorStop(0, `rgba(150,95,45,${a})`);
      grd.addColorStop(0.6, `rgba(160,110,60,${a * 0.5})`);
      grd.addColorStop(1, 'rgba(160,110,60,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, rad, 0, U.TAU);
      g.fill();
    }

    // aged edges
    g.globalCompositeOperation = 'multiply';
    const edges = [
      [0, 0, wpx * 0.06, 0, 'rgba(200,170,120,0.35)'],
      [wpx, 0, wpx - wpx * 0.06, 0, 'rgba(200,170,120,0.35)'],
    ];
    for (const e of edges) {
      const grd = g.createLinearGradient(e[0], e[1], e[2], e[3]);
      grd.addColorStop(0, e[4]);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, wpx, hpx);
    }
    for (const [y0, y1] of [[0, hpx * 0.045], [hpx, hpx - hpx * 0.045]]) {
      const grd = g.createLinearGradient(0, y0, 0, y1);
      grd.addColorStop(0, 'rgba(200,170,120,0.3)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, wpx, hpx);
    }
    g.globalCompositeOperation = 'source-over';
    return c;
  };

  // Dark walnut desk, rendered small: it sits out of focus behind the book.
  P.desk = function (w, h) {
    const noise = U.makeNoise2D('desk');
    const c = U.canvas(w, h);
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const warp = U.fbm(noise, x * 0.004, y * 0.02, 3) * 6;
        const ring = Math.sin((y * 0.09 + warp) * 2.2) * 0.5 + 0.5;
        const fine = U.fbm(noise, x * 0.05 + 100, y * 0.6, 2) * 0.5 + 0.5;
        const k = 0.55 * ring + 0.45 * fine;
        const big = U.fbm(noise, x * 0.002 + 7, y * 0.003, 2) * 0.5 + 0.5;
        const i = (y * w + x) * 4;
        const l = 0.6 + big * 0.5;
        d[i] = (26 + k * 22) * l;
        d[i + 1] = (16 + k * 13) * l;
        d[i + 2] = (10 + k * 8) * l;
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  };

  // Book cloth: a tight weave with worn corners.
  P.cloth = function (wpx, hpx, color, seed) {
    const c = U.canvas(wpx, hpx);
    const g = c.getContext('2d');
    const r = new U.Rand('cloth' + seed);
    const col = typeof color === 'string' ? U.hex(color) : color;
    g.fillStyle = U.rgba(col);
    g.fillRect(0, 0, wpx, hpx);
    // weave tile
    const n = 8;
    const t = tile(n * 8, (x, y) => {
      const wx = (x % n) < n / 2, wy = (y % n) < n / 2;
      const over = (Math.floor(x / n) + Math.floor(y / n)) % 2 === 0;
      const v = (over ? (wx ? 0.7 : 0.35) : (wy ? 0.65 : 0.3)) + r.range(-0.15, 0.15);
      return v > 0.5 ? [255, 255, 255, (v - 0.5) * 60] : [0, 0, 0, (0.5 - v) * 120];
    });
    const sc = Math.max(0.35, wpx / 2400);
    g.save();
    g.scale(sc, sc);
    g.fillStyle = g.createPattern(t, 'repeat');
    g.fillRect(0, 0, wpx / sc, hpx / sc);
    g.restore();
    // mottled dye
    const noise = U.makeNoise2D('clothdye' + seed);
    const low = tile(96, (x, y) => {
      const v = U.fbm(noise, x * 0.05, y * 0.05, 3);
      return v > 0 ? [255, 255, 255, v * 26] : [0, 0, 0, -v * 60];
    });
    g.drawImage(low, 0, 0, 96, 96, 0, 0, wpx, hpx);
    // rubbed edges and corners
    const rub = (x, y, rad, a) => {
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, `rgba(255,240,210,${a})`);
      grd.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = grd;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    };
    const rr = wpx * 0.08;
    rub(wpx, 0, rr, 0.18);
    rub(wpx, hpx, rr, 0.2);
    rub(0, 0, rr * 0.6, 0.1);
    rub(0, hpx, rr * 0.6, 0.1);
    g.strokeStyle = 'rgba(255,235,200,0.12)';
    g.lineWidth = wpx * 0.004;
    g.strokeRect(wpx * 0.002, wpx * 0.002, wpx - wpx * 0.004, hpx - wpx * 0.004);
    return c;
  };

  // ------------------------------------------------------------ marbling
  // Mathematical marbling (after Jaffer & Lu), rendered exactly by inverse mapping:
  // every pixel is traced back through the combs, waves and ink drops to the drop it came from.
  P.marble = function (wpx, hpx, seed, o) {
    o = o || {};
    const r = new U.Rand('marble' + seed);
    const W = 1000, H = 1414;
    const pal = (o.palette || ['#1d3461', '#d7a646', '#f0e4c6', '#7a2a29', '#3a6a64', '#1c1b1c', '#c46a3c']).map(U.hex);
    const pw = o.weights || [5, 3.2, 3.2, 2, 2, 1.2, 1];
    const bg = U.hex(o.bg || '#1d3461');
    const ops = [];
    // ink drops, each followed by a few concentric drops (rings)
    const clusters = o.clusters || 120;
    for (let i = 0; i < clusters; i++) {
      const x = r.range(-60, W + 60), y = r.range(-60, H + 60);
      let rad = r.range(32, 95);
      const rings = r.int(2, 4);
      for (let k = 0; k < rings; k++) {
        ops.push({ t: 0, x, y, r2: rad * rad, c: pal[r.weighted(pw)] });
        rad *= r.range(0.45, 0.72);
      }
    }
    // a gentle wave, then combs up and down, then a fine comb across
    ops.push({ t: 2, A: r.range(18, 34), f: r.range(0.005, 0.009), ph: r.range(0, 6) });
    const combs = o.combs || 16;
    for (let i = 0; i < combs; i++) {
      const x = ((i + 0.5) / combs) * W;
      ops.push({ t: 1, bx: x, by: 0, mx: 0, my: i % 2 ? 1 : -1, nx: 1, ny: 0, z: r.range(40, 60), lu: Math.log(1 / Math.pow(2, 1 / 12)) });
    }
    if (o.fine !== false) {
      const fine = 11;
      for (let i = 0; i < fine; i++) {
        const y = ((i + 0.5) / fine) * H;
        ops.push({ t: 1, bx: 0, by: y, mx: i % 2 ? 1 : -1, my: 0, nx: 0, ny: 1, z: r.range(16, 26), lu: Math.log(1 / Math.pow(2, 1 / 8)) });
      }
    }
    const rw = Math.min(wpx, o.res || 460), rh = Math.round((rw * hpx) / wpx);
    const c = U.canvas(rw, rh);
    const g = c.getContext('2d');
    const img = g.createImageData(rw, rh);
    const d = img.data;
    const n = ops.length;
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        let x = ((px + 0.5) / rw) * W, y = ((py + 0.5) / rh) * H;
        let col = bg;
        for (let k = n - 1; k >= 0; k--) {
          const op = ops[k];
          if (op.t === 0) {
            const dx = x - op.x, dy = y - op.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < op.r2) { col = op.c; break; }
            const f = Math.sqrt(1 - op.r2 / d2);
            x = op.x + dx * f;
            y = op.y + dy * f;
          } else if (op.t === 1) {
            const dist = Math.abs((x - op.bx) * op.nx + (y - op.by) * op.ny);
            const f = op.z * Math.exp(dist * op.lu);
            x -= op.mx * f;
            y -= op.my * f;
          } else {
            x -= op.A * Math.sin(y * op.f + op.ph);
          }
        }
        const i = (py * rw + px) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const out = U.canvas(wpx, hpx);
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = true;
    og.imageSmoothingQuality = 'high';
    og.drawImage(c, 0, 0, wpx, hpx);
    // paper grain and a little age
    og.globalAlpha = 0.45;
    og.fillStyle = og.createPattern(P.grainTile(), 'repeat');
    og.fillRect(0, 0, wpx, hpx);
    og.globalAlpha = 1;
    og.globalCompositeOperation = 'multiply';
    og.fillStyle = 'rgba(236,218,180,0.32)';
    og.fillRect(0, 0, wpx, hpx);
    og.globalCompositeOperation = 'source-over';
    return out;
  };

  // A gold gradient for gilt stamping on a surface of the given size (in drawing units).
  P.giltGradient = function (g, x0, y0, x1, y1) {
    const grd = g.createLinearGradient(x0, y0, x1, y1);
    grd.addColorStop(0.0, '#8a6a2c');
    grd.addColorStop(0.18, '#e9cf86');
    grd.addColorStop(0.32, '#b58c3f');
    grd.addColorStop(0.5, '#f6e3a4');
    grd.addColorStop(0.66, '#a57c34');
    grd.addColorStop(0.82, '#e2c173');
    grd.addColorStop(1.0, '#7d5f28');
    return grd;
  };
})((window.Codex = window.Codex || {}));
