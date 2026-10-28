// Teste visual: compara as capturas (tempo parado em FREEZE_T) com as referências em tests/baseline/.
//   npm run test:visual              compara e salva as diferenças em tests/output/diff/
//   npm run test:visual -- --update  aceita o visual atual como nova referência (depois de revisar as capturas!)
// A comparação tolera pequenas diferenças de renderização entre máquinas (SwiftShader, drivers).
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { openScene, ensureOut, report, ROOT } from './lib.mjs';
import { VIEWS, FREEZE_T, goTo } from './views.mjs';

const BASE = path.join(ROOT, 'tests', 'baseline');
const update = process.argv.includes('--update');
// fração máxima de pixels diferentes por captura (texto e serrilhado variam entre máquinas)
const MAX_DIFF = Number(process.env.VISUAL_MAX_DIFF || 0.02);

const out = ensureOut();
const diffDir = path.join(out, 'diff');
fs.mkdirSync(diffDir, { recursive: true });
fs.mkdirSync(BASE, { recursive: true });
const { browser, page, errors } = await openScene({ query: '?freeze=' + FREEZE_T });
let ok = true;
for (const [name, v] of VIEWS) {
  await goTo(page, v);
  const shot = PNG.sync.read(await page.screenshot({ timeout: 300000 }));
  const ref = path.join(BASE, name + '.png');
  if (update || !fs.existsSync(ref)) {
    fs.writeFileSync(ref, PNG.sync.write(shot));
    console.log((update ? 'referência atualizada: ' : 'referência criada: ') + name);
    continue;
  }
  const base = PNG.sync.read(fs.readFileSync(ref));
  if (base.width !== shot.width || base.height !== shot.height) {
    ok = report(name, false, 'tamanho diferente da referência') && ok;
    continue;
  }
  const diff = new PNG({ width: shot.width, height: shot.height });
  const n = pixelmatch(base.data, shot.data, diff.data, shot.width, shot.height, { threshold: 0.15 });
  const frac = n / (shot.width * shot.height);
  if (frac > MAX_DIFF) fs.writeFileSync(path.join(diffDir, name + '.png'), PNG.sync.write(diff));
  ok = report(name, frac <= MAX_DIFF, (frac * 100).toFixed(2) + '% dos pixels diferentes') && ok;
}
await browser.close();
if (errors.length) ok = report('sem erros no console', false, errors.slice(0, 3).join(' | ')) && ok;
process.exitCode = ok ? 0 : 1;
