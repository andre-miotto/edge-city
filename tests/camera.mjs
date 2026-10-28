// A câmera não atravessa objetos: visita guiada, visita da logística, voos entre áreas e acompanhamento do WMR.
// A verificação roda dentro da página (debug.js → __checkCamera) porque precisa do Raycaster da cena.
import { openScene, report } from './lib.mjs';

const { browser, page, errors } = await openScene({ width: 320, height: 180 });
const res = await page.evaluate(() => window.__checkCamera());
await browser.close();
let ok = report('sem erros', errors.length === 0, errors.slice(0, 2).join(' | '));
ok =
  report(
    'câmera não atravessa objetos',
    res.issues.length === 0,
    `${res.segments} trechos verificados; ` + res.issues.slice(0, 5).join('; '),
  ) && ok;
process.exitCode = ok ? 0 : 1;
