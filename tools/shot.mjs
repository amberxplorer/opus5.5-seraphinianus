// Screenshot helper: node tools/shot.mjs <url> <out.png> [width] [height] [waitForTitlePrefix] [evalScript]
import { chromium } from 'playwright';

const [, , url, out, w = '1400', h = '1980', waitTitle = 'done', evalScript = ''] = process.argv;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(url);
try {
  await page.waitForFunction((p) => document.title.startsWith(p), waitTitle, { timeout: 60000 });
} catch (e) {
  logs.push('[timeout] title=' + (await page.title()));
}
if (evalScript) {
  const r = await page.evaluate(evalScript);
  if (r !== undefined) logs.push('[eval] ' + JSON.stringify(r));
}
await page.screenshot({ path: out });
console.log('title:', await page.title());
for (const l of logs) console.log(l);
await browser.close();
