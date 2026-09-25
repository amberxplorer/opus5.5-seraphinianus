// Step through the piece like real playback and list slow frames: node tools/hitches.mjs [fps] [threshold ms]
import { chromium } from 'playwright';
const [, , fps = '30', thr = '60'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
const res = await page.evaluate(([fps, thr]) => {
  const slow = [];
  let total = 0, n = 0;
  for (let T = 0; T <= 90; T += 1 / fps) {
    const t0 = performance.now();
    window.__codex.frame(T);
    const dt = performance.now() - t0;
    total += dt; n++;
    if (dt > thr) slow.push([T.toFixed(2), dt.toFixed(0)]);
  }
  return { avg: (total / n).toFixed(1), slow };
}, [+fps, +thr]);
console.log('average JS ms per frame', res.avg, 'slow frames:', res.slow.length);
console.log(res.slow.map((s) => s.join(':')).join('  '));
await browser.close();
