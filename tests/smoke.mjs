// Teste rápido: a cena carrega sem erros, desenha um quadro e fica dentro do orçamento de desempenho.
import { openScene, report, ensureOut } from './lib.mjs';
import path from 'path';

/**
 * Orçamento por quadro (passada principal, vista inicial). Subir esses limites é uma decisão de projeto:
 * registre o motivo em docs/CHANGELOG.md. Referência: GPU integrada de notebook a 60 quadros/s.
 */
const BUDGET = { calls: 800, tris: 750_000, shadowCalls: 550 };

const { browser, page, errors } = await openScene();
await page.waitForTimeout(1500);
const info = await page.evaluate(() => window.__info());
await page.screenshot({ path: path.join(ensureOut(), 'smoke.png'), timeout: 300000 });
await browser.close();
let ok = report('carrega sem erros', errors.length === 0, errors.slice(0, 3).join(' | '));
ok =
  report(
    'desenha a cena',
    info.calls > 100,
    `${info.calls} chamadas, ${info.tris} triângulos (sombras: ${info.shadowCalls} chamadas, ${info.shadowTris} triângulos)`,
  ) && ok;
ok =
  report(
    'dentro do orçamento',
    info.calls <= BUDGET.calls && info.tris <= BUDGET.tris && info.shadowCalls <= BUDGET.shadowCalls,
    `limites: ${BUDGET.calls} chamadas, ${BUDGET.tris} triângulos, ${BUDGET.shadowCalls} chamadas de sombra`,
  ) && ok;
process.exitCode = ok ? 0 : 1;
