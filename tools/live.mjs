// Drive the real page: landing → click → play; screenshots at wall-clock moments.
// node tools/live.mjs <outdir> <w> <h> <shots comma list of seconds after click>
import { chromium } from 'playwright';
import fs from 'fs';
const [, , outdir, w = '1440', h = '900', shots = '1,3'] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto('http://localhost:8123/index.html');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outdir}/landing.png` });
await page.click('#begin');
const t0 = Date.now();
for (const s of shots.split(',').map(Number)) {
  const wait = s * 1000 - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const info = await page.evaluate(() => ({ T: Codex.App.time().toFixed(2), audio: Codex.Audio.ready(), state: Codex.Audio.context() && Codex.Audio.context().state }));
  await page.screenshot({ path: `${outdir}/after_${String(s).padStart(3, '0')}.png` });
  console.log('shot', s, JSON.stringify(info));
}
for (const l of logs) console.log(l);
await browser.close();
