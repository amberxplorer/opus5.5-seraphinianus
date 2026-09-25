// Count canvas draw calls per frame, split by target (the screen vs offscreen canvases) and by what
// makes them costly on a GPU: blend modes that read the destination, and shadow blur.
// node tools/drawcalls.mjs [fps] [from] [to]
import { chromium } from 'playwright';
const [, , fps = '10', from = '0', to = '90'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.addInitScript(() => {
  const P = CanvasRenderingContext2D.prototype;
  const C = (window.__calls = { cur: null });
  const cheap = new Set(['source-over', 'lighter', 'copy', 'destination-out', 'destination-in', 'source-atop', 'xor']);
  for (const name of ['stroke', 'fill', 'drawImage', 'fillRect', 'strokeRect', 'fillText', 'clearRect', 'putImageData']) {
    const f = P[name];
    P[name] = function () {
      const c = C.cur;
      if (c) {
        const scr = this.canvas.id === 'stage' ? 'scr' : 'off';
        c[scr] = (c[scr] || 0) + 1;
        const op = this.globalCompositeOperation;
        if (!cheap.has(op)) c[scr + ':' + op] = (c[scr + ':' + op] || 0) + 1;
        if (this.shadowBlur > 0 && this.shadowColor !== 'rgba(0, 0, 0, 0)') c[scr + ':blur'] = (c[scr + ':blur'] || 0) + 1;
        if (this.filter && this.filter !== 'none') c[scr + ':filter'] = (c[scr + ':filter'] || 0) + 1;
        if (name === 'getImageData') c.readback = (c.readback || 0) + 1;
      }
      return f.apply(this, arguments);
    };
  }
  const gi = P.getImageData;
  P.getImageData = function () { if (C.cur) C.cur.readback = (C.cur.readback || 0) + 1; return gi.apply(this, arguments); };
  const oc = document.createElement.bind(document);
  document.createElement = function (t) { if (C.cur && String(t).toLowerCase() === 'canvas') C.cur.newCanvas = (C.cur.newCanvas || 0) + 1; return oc.apply(document, arguments); };
});
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
const rows = await page.evaluate(([fps, a, b]) => {
  const out = [];
  window.__codex.frame(a);
  for (let T = a; T <= b + 1e-6; T += 1 / fps) {
    window.__calls.cur = {};
    window.__codex.frame(T);
    out.push([T, window.__calls.cur]);
    window.__calls.cur = null;
  }
  return out;
}, [+fps, +from, +to]);
// print per-second maxima of each counter
const per = {};
for (const [T, c] of rows) {
  const k = Math.floor(T);
  const m = (per[k] = per[k] || {});
  for (const key in c) m[key] = Math.max(m[key] || 0, c[key]);
}
for (const [k, m] of Object.entries(per)) console.log(String(k).padStart(2), Object.entries(m).sort().map(([a, b]) => a + '=' + b).join(' '));
await browser.close();
