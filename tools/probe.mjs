// Per-step timing of slow frames with an accelerated canvas: node tools/probe.mjs <a-b,...> [fps] [thresholdMs]
import { chromium } from 'playwright';
const [, , wins = '25.3-26.5', fps = '30', thr = '100'] = process.argv;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
await page.evaluate(() => {
  const C = window.Codex;
  const P = (window.__P = {});
  const wrap = (obj, name, label) => {
    const f = obj[name];
    if (!f) return;
    obj[name] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { P[label] = (P[label] || 0) + performance.now() - t; } };
  };
  wrap(C.Ink.WashMark.prototype, 'prepare', 'washPrep');
  wrap(C.Ink.EraseMark.prototype, 'draw', 'erase');
  wrap(C.Book.Surface.prototype, 'bake', 'bake');
  wrap(C.Book.Surface.prototype, 'drawLive', 'live');
  wrap(C.Book.InkSprite.prototype, 'bake', 'spriteBake');
  wrap(C.Book.InkSprite.prototype, 'cutout', 'cutout');
  wrap(C.Show.prototype, 'drawLight', 'light');
  wrap(C.Show.prototype, 'drawDesk', 'desk');
  wrap(C.Show.prototype, 'drawPageAt', 'pages');
  wrap(C.Show.prototype, 'updateSurfaces', 'updSurf');
  wrap(C.Book, 'drawSheet', 'sheet');
  const show = window.__codex.show;
  show.actors.forEach((a, i) => {
    const lab = 'act' + i + '@' + a.t0.toFixed(1);
    wrap(a, 'draw', lab);
    if (a.shadow) wrap(a, 'shadow', lab + '.sh');
  });
  const CP = CanvasRenderingContext2D.prototype;
  for (const n of ['drawImage', 'getImageData', 'createPattern']) wrap(CP, n, 'ctx.' + n);
});
for (const win of wins.split(',')) {
  const [a, b] = win.split('-').map(Number);
  const lines = await page.evaluate(([a, b, fps, thr]) => new Promise((done) => {
    const P = window.__P, out = [];
    let T = a;
    window.__codex.frame(a - 0.2);
    const step = () => {
      for (const k in P) delete P[k];
      const t0 = performance.now();
      window.__codex.frame(T);
      const dt = performance.now() - t0;
      if (dt > thr) out.push(T.toFixed(2) + ' ' + dt.toFixed(0) + 'ms ' + Object.entries(P).filter(([, v]) => v > 2).sort((x, y) => y[1] - x[1]).map(([k, v]) => k + '=' + v.toFixed(0)).join(' '));
      T += 1 / fps;
      if (T <= b) requestAnimationFrame(step); else done(out);
    };
    requestAnimationFrame(step);
  }), [a, b, +fps, +thr]);
  console.log(win + '\n  ' + lines.join('\n  '));
}
await browser.close();
