// render one moment with a forced camera box: node camtest.mjs out.png T x y w h
import { chromium } from 'playwright';
const [, , out, T, x, y, w, h, vw = '1600', vh = '900'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +vw, height: +vh } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
await page.evaluate(([T, x, y, w, h]) => {
  const show = window.__codex.show;
  show.camera = () => ({ cx: x + w / 2, cy: y + h / 2, zoom: Math.min(innerWidth / w, innerHeight / h), rot: 0 });
  window.__codex.frame(T);
}, [+T, +x, +y, +w, +h]);
await page.screenshot({ path: out });
await browser.close();
