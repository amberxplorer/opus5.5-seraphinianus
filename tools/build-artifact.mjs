// Bundle the page into one self-contained HTML body for sharing as a claude.ai artifact:
// node tools/build-artifact.mjs <out.html>
// (The artifact host supplies the <html>/<head>/<body> skeleton itself.)
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, 'dist', 'codicillus.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
let js = '';
for (const s of scripts) {
  const src = fs.readFileSync(path.join(root, s), 'utf8');
  if (/<\/script/i.test(src)) throw new Error('script terminator inside ' + s);
  js += `\n/* ---- ${s} ---- */\n` + src;
}
const title = /<title>([^<]*)<\/title>/.exec(html)[1];
const fonts = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)">/.exec(html)[1];
const body = /<body>([\s\S]*?)<script src=/.exec(html)[1].trim();
const page = `<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
${body}
<script>
${js}
</script>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log('wrote', out, (page.length / 1024).toFixed(0) + ' KB', scripts.length, 'scripts');
