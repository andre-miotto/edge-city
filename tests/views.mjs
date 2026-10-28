// Pontos de vista usados pelas capturas de referência e pelo teste visual.
// [nome, 'home' | [px, py, pz, lx, ly, lz]]
export const VIEWS = [
  ['01-visao-geral', 'home'],
  ['02-celula-robo', [-17.5, 5.2, 6.5, -24, 4.2, -3]],
  ['03-motor-tt01', [-25.2, 4.7, 5.9, -29.1, 3.9, 0]],
  ['04-clp', [-7.6, 3.9, 6.8, -4.2, 2.9, 0.4]],
  ['05-wes', [16.5, 7.6, 13.5, 21, 8.6, -8]],
  ['06-ia', [37.2, 6.4, 9.8, 45.5, 7, -1.5]],
  ['07-almoxarifado', [44, 8.5, 6, 50, 2.2, 26]],
  ['08-laboratorio', [13.5, 6.2, -12.5, 21, 1.0, -27]],
  ['09-linha3', [46, 6.5, -11, 48, 1.5, -24]],
  ['10-fundo', [30, 9, -36, 10, 2, 0]],
];

/** Instante fixo das capturas: célula 01 no meio do ciclo, robô em movimento. */
export const FREEZE_T = 7.0;

export async function goTo(page, v) {
  if (v === 'home') await page.click('#bHome');
  else await page.evaluate((a) => window.__look(...a), v);
  await page.waitForTimeout(1200);
}
