// Gera capturas de referência em tests/output/ para revisão visual depois de cada atualização.
// Usa o tempo parado (?freeze) para que as capturas sejam comparáveis entre versões.
import { openScene, ensureOut } from './lib.mjs';
import { VIEWS, FREEZE_T, goTo } from './views.mjs';
import path from 'path';

const out = ensureOut();
const { browser, page, errors } = await openScene({ query: '?freeze=' + FREEZE_T });
for (const [name, v] of VIEWS) {
  await goTo(page, v);
  await page.screenshot({ path: path.join(out, name + '.png'), timeout: 300000 });
  console.log('captura', name);
}
await browser.close();
if (errors.length) console.log('erros:', errors.slice(0, 3).join(' | '));
