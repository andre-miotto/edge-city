// Converte dist/index.html no formato de página do artifact do Claude
// (sem <html>/<head>/<body>, com <title> no topo). Saída: dist/edge-city.artifact.html
import fs from 'fs';

const src = fs.readFileSync('dist/index.html', 'utf8');
const title = (src.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
const head = (src.match(/<head>([\s\S]*?)<\/head>/) || ['', ''])[1]
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
const body = (src.match(/<body>([\s\S]*?)<\/body>/) || ['', ''])[1];
const out = [title, head.trim(), body.trim()].join('\n');
fs.writeFileSync('dist/edge-city.artifact.html', out);
console.log('dist/edge-city.artifact.html', (out.length / 1024).toFixed(0) + ' KB');
