// Steady-state cost per frame: node tools/perf.mjs <w> <h> <start,start,...> [frames]
import { chromium } from 'playwright';
const [, , w = '1440', h = '900', starts = '5,15,25', nf = '30'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
for (const s of starts.split(',').map(Number)) {
  const r = await page.evaluate(([s, nf]) => {
    window.__codex.frame(s); // warm: bake everything up to s
    const times = [];
    for (let i = 1; i <= nf; i++) {
      const t0 = performance.now();
      window.__codex.frame(s + i / 60);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    return { med: times[Math.floor(times.length / 2)].toFixed(1), max: times[times.length - 1].toFixed(1) };
  }, [s, +nf]);
  console.log(`T=${s}: median ${r.med} ms, max ${r.max} ms`);
}
await browser.close();
