// Simula ~15 min de logística: WMR completam os ciclos, não colidem entre si, com pedestres nem com equipamentos.
import { openScene, report } from './lib.mjs';

const { browser, page, errors } = await openScene({ width: 320, height: 180 });
const r = await page.evaluate(() => {
  // as docas e estantes de troca de caixas são encostadas pelo robô por projeto; o colisor delas tem folga
  const cols = window.__cols().filter((c) => c.r === undefined);
  const A = window.__areas;
  const hits = {},
    states = {},
    legs = {};
  const inBox = (c, x, z, m) => x > c.x0 - m && x < c.x1 + m && z > c.z0 - m && z < c.z1 + m;
  const docks = cols.filter(
    (c) =>
      c.x1 - c.x0 < 9 &&
      c.z1 - c.z0 < 3 &&
      [
        [38.9, 15.1],
        [-44.1, 3.4],
        [15.1, 18.4],
        [41.6, -16.3],
      ].some((d) => Math.abs(c.x0 - d[0]) < 0.01 && Math.abs(c.z0 - d[1]) < 0.01),
  );
  for (let i = 0; i < 9000; i++) {
    const s = window.__sim(0.1);
    s.forEach((o) => {
      states[o.id + ': ' + o.state] = (states[o.id + ': ' + o.state] || 0) + 1;
      (legs[o.id] = legs[o.id] || new Set()).add(o.li);
    });
    if (i % 5) continue;
    A.fleet.forEach((w) => {
      if (w.mode === 'charge') return;
      cols.forEach((c) => {
        if (docks.includes(c)) return;
        if (inBox(c, w.x, w.z, 0.3)) hits[w.id + ' x colisor ' + [c.x0, c.x1, c.z0, c.z1].map((v) => v.toFixed(1))] = 1;
      });
      A.fleet.forEach((o) => {
        if (o !== w && Math.hypot(o.x - w.x, o.z - w.z) < 0.75) hits['robô x robô ' + w.id + '/' + o.id] = 1;
      });
      A.walkers.forEach((p, pi) => {
        if (Math.hypot(p.x - w.x, p.z - w.z) < 0.6) hits['pedestre ' + pi + ' x ' + w.id] = 1;
      });
    });
  }
  return {
    hits: Object.keys(hits),
    states,
    legs: Object.fromEntries(Object.entries(legs).map(([k, v]) => [k, [...v].length])),
    anim: A.anim.length,
  };
});
await browser.close();
let ok = report('sem erros', errors.length === 0, errors.slice(0, 2).join(' | '));
ok = report('sem colisões de WMR', r.hits.length === 0, r.hits.slice(0, 5).join('; ')) && ok;
ok =
  report(
    'WMR-01 e WMR-02 percorrem as 4 etapas',
    r.legs['WMR-01'] === 4 && r.legs['WMR-02'] === 4,
    JSON.stringify(r.legs),
  ) && ok;
ok =
  report(
    'param para pedestres/cruzamentos',
    Object.keys(r.states).some((k) => k.includes('Aguardando passagem')),
    '',
  ) && ok;
console.log('estados:', JSON.stringify(r.states));
process.exitCode = ok ? 0 : 1;
