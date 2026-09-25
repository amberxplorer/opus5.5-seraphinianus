// Break down slow frames by function: node tools/spikes.mjs <t0> <t1> [fps]
import { chromium } from 'playwright';
const [, , a = '0', b = '12', fps = '30'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
const out = await page.evaluate(([a, b, fps]) => {
  const C = window.Codex;
  const P = {};
  const wrapProto = (proto, name, label) => {
    const f = proto[name];
    proto[name] = function () { const t = performance.now(); const r = f.apply(this, arguments); P[label] = (P[label] || 0) + performance.now() - t; return r; };
  };
  wrapProto(C.Ink.WashMark.prototype, 'prepare', 'wash.prepare');
  wrapProto(C.Book.Surface.prototype, 'bake', 'surface.bake');
  wrapProto(C.Book.Surface.prototype, 'reset', 'surface.reset');
  wrapProto(C.Book.InkSprite.prototype, 'bake', 'sprite.bake');
  wrapProto(C.Book.InkSprite.prototype, 'cutout', 'sprite.cutout');
  wrapProto(C.Show.prototype, 'render', 'render');
  wrapProto(C.Show.prototype, 'composeCloseFront', 'closeFront');
  const pp = C.Paper.page; C.Paper.page = function () { const t = performance.now(); const r = pp.apply(this, arguments); P['paper.page'] = (P['paper.page'] || 0) + performance.now() - t; return r; };
  const lines = [];
  for (let T = a; T <= b; T += 1 / fps) {
    for (const k in P) delete P[k];
    const t0 = performance.now();
    window.__codex.frame(T);
    const dt = performance.now() - t0;
    if (dt > 250) lines.push(T.toFixed(2) + ' ' + dt.toFixed(0) + 'ms ' + Object.entries(P).map(([k, v]) => k + '=' + v.toFixed(0)).join(' '));
  }
  return lines;
}, [+a, +b, +fps]);
console.log(out.join('\n'));
await browser.close();
