// Main-thread cost per frame with an accelerated canvas, frame by frame through requestAnimationFrame,
// so the compositor presents between frames the way a real browser does.
// node tools/bench.mjs [w] [h] [windows a-b,c-d,...] [fps] [spikeMs]   (BASE=url to test another server)
import { chromium } from 'playwright';
const [, , w = '1600', h = '900', wins = '0-90', fps = '60', spike = '16'] = process.argv;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
for (const win of wins.split(',')) {
  const [from, to] = win.split('-').map(Number);
  const res = await page.evaluate(([a, b, fps, spike]) => new Promise((done) => {
    const times = [], spikes = [];
    let T = a;
    const step = () => {
      const t0 = performance.now();
      window.__codex.frame(T);
      const dt = performance.now() - t0;
      times.push(dt);
      if (dt > spike) spikes.push(T.toFixed(2) + ':' + dt.toFixed(0));
      T += 1 / fps;
      if (T <= b) requestAnimationFrame(step);
      else done({ times, spikes });
    };
    window.__codex.frame(a - 0.2);
    requestAnimationFrame(step);
  }), [from, to, +fps, +spike]);
  const d = res.times.slice().sort((x, y) => x - y);
  const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))].toFixed(1);
  console.log(`${win.padEnd(7)} median ${q(0.5).padStart(5)} ms  p90 ${q(0.9).padStart(5)}  max ${q(1).padStart(6)}  mean ${(d.reduce((s, x) => s + x, 0) / d.length).toFixed(1).padStart(5)}  spikes ${res.spikes.join(' ')}`);
}
await browser.close();
