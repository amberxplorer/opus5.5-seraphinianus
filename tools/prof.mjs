import { chromium } from 'playwright';
const [, , starts = '6,43,63,73'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
for (const s of starts.split(',').map(Number)) {
  const r = await page.evaluate((s) => {
    const show = window.__codex.show;
    const P = {};
    const wrap = (obj, name, label) => {
      const f = obj[name];
      obj[name] = function () { const t = performance.now(); const r = f.apply(this, arguments); P[label] = (P[label] || 0) + performance.now() - t; return r; };
      return () => { obj[name] = f; };
    };
    const undo = [];
    undo.push(wrap(show, 'updateSurfaces', 'bake'));
    undo.push(wrap(show, 'drawDesk', 'desk'));
    undo.push(wrap(show, 'drawLight', 'light'));
    undo.push(wrap(show, 'softShadowRect', 'bookShadow'));
    undo.push(wrap(show, 'drawPageAt', 'pages'));
    undo.push(wrap(show, 'drawShading', 'shading'));
    for (const s2 of show.surfaces.values()) undo.push(wrap(Object.getPrototypeOf(s2), 'drawLive', 'live'));
    const acts = show.actors.filter((a) => s + 0.1 >= a.t0 && s < a.t1);
    acts.forEach((a, i) => { const f = a.draw; a.draw = function () { const t = performance.now(); const r = f.apply(this, arguments); P['actor' + i + ':' + (a.layer)] = (P['actor' + i + ':' + a.layer] || 0) + performance.now() - t; return r; }; });
    window.__codex.frame(s);
    for (const k in P) delete P[k];
    const N = 10;
    const t0 = performance.now();
    for (let i = 1; i <= N; i++) window.__codex.frame(s + i / 60);
    const tot = (performance.now() - t0) / N;
    const out = { total: tot.toFixed(1) };
    for (const k in P) out[k] = (P[k] / N).toFixed(1);
    return out;
  }, s);
  console.log('T=' + s, JSON.stringify(r));
}
await browser.close();
