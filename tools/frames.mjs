// Render specific moments of the piece: node tools/frames.mjs <outdir> <w> <h> <t1,t2,...> [extraQuery]
import { chromium } from 'playwright';
import fs from 'fs';

const [, , outdir, w = '1600', h = '900', times = '0', extra = ''] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() !== 'log' || /error|fail/i.test(m.text())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
const t0 = Date.now();
await page.goto(`http://localhost:8123/index.html?test${extra ? '&' + extra : ''}`);
await page.waitForFunction(() => document.title === 'done', null, { timeout: 120000 }).catch(() => logs.push('[timeout]'));
console.log('boot ms', Date.now() - t0);
for (const t of times.split(',').map(Number)) {
  const s = Date.now();
  await page.evaluate((t) => window.__codex.frame(t), t);
  await page.screenshot({ path: `${outdir}/t${String(t.toFixed(2)).padStart(6, '0')}.png` });
  console.log('t', t, 'ms', Date.now() - s);
}
for (const l of logs) console.log(l);
await browser.close();
