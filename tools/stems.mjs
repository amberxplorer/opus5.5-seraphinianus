// Loudness of each instrument alone over a time window: node tools/stems.mjs [t0] [t1]
import { chromium } from 'playwright';
const [, , t0 = '0', t1 = '90'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
const res = await page.evaluate(async ([t0, t1]) => {
  const I = Codex.Audio.inst;
  const orig = Object.assign({}, I);
  const names = ['celesta', 'harp', 'choir', 'bass', 'marimba', 'glass', 'drone', 'reed', 'bell', 'timpani', 'swish', 'tick'];
  const out = {};
  const show = window.__codex.show;
  const origLevel = Codex.Audio.penLevel;
  for (const nm of names.concat(['pen'])) {
    for (const k of Object.keys(orig)) I[k] = nm === k ? orig[k] : () => {};
    Codex.Audio.penLevel = nm === 'pen' ? origLevel : () => 0;
    const buf = await Codex.Audio.renderOffline(show, t1, 22050);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const a = Math.floor(t0 * 22050), b = L.length;
    let sum = 0, peak = 0;
    for (let i = a; i < b; i++) { const v = (L[i] + R[i]) / 2; sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    out[nm] = { rms: (10 * Math.log10(sum / (b - a) + 1e-12)).toFixed(1), peak: peak.toFixed(3) };
  }
  Object.assign(I, orig);
  Codex.Audio.penLevel = origLevel;
  return out;
}, [+t0, +t1]);
console.log(`window ${t0}-${t1}s`);
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(9), 'rms', v.rms.padStart(6), 'dB  peak', v.peak);
await browser.close();
