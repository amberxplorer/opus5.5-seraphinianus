// Render the whole score offline and save a WAV: node tools/render-audio.mjs out.wav [seconds]
import { chromium } from 'playwright';
import fs from 'fs';
const [, , out, secs = '92'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message, e.stack));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text()); });
await page.goto('http://localhost:8123/index.html?test');
await page.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
const t0 = Date.now();
const b64 = await page.evaluate(async (secs) => {
  const buf = await Codex.Audio.renderOffline(window.__codex.show, secs, 44100);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const n = L.length;
  const bytes = new Uint8Array(44 + n * 4);
  const dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, 44100, true); dv.setUint32(28, 44100 * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
  w(36, 'data'); dv.setUint32(40, n * 4, true);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, L[i])), r = Math.max(-1, Math.min(1, R[i]));
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    dv.setInt16(44 + i * 4, l * 32767, true);
    dv.setInt16(46 + i * 4, r * 32767, true);
  }
  console.log('peak ' + peak);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}, +secs);
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('rendered in', Date.now() - t0, 'ms ->', out);
await browser.close();
