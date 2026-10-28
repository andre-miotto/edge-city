/** Estantes dinâmicas (flow rack) onde os WMR trocam caixas KLT. */
import { lerp } from '../core/math';
import { WMR_TOP } from '../logistics/wmrModel';
import type { AfterAreaKit } from '../ctx';
import type { Station, StationId } from '../logistics/types';
export function buildStations(ctx: AfterAreaKit) {
  const { A, MP, binAt, binCols, box2, hash, plate } = ctx;
  // ---- estante dinâmica (flow rack) com pistas para troca de caixas com o WMR
  const STN = {} as Record<StationId, Station>;
  function flowStation(id: StationId, o) {
    const d = o.dir,
      zf = o.zr + d * 0.35,
      zb = zf + d * o.depth;
    STN[id] = {
      x: o.dyn,
      zr: o.zr,
      dir: d,
      zFront: o.zr + d * 0.62,
      zHide: o.zr + d * o.hide,
      staged: {},
      title: o.title,
    };
    o.up.forEach((x) =>
      [zf, zb].forEach((z) => {
        A.box(MP.weg, 0.08, 2.5, 0.08, x, 1.25, z);
        A.box(MP.steelD, 0.18, 0.02, 0.18, x, 0.01, z);
      }),
    );
    const x0 = Math.min(...o.up),
      x1 = Math.max(...o.up),
      xm = (x0 + x1) / 2,
      zm = (zf + zb) / 2;
    [zf, zb].forEach((z) => {
      A.box(MP.frame, x1 - x0, 0.06, 0.05, xm, 0.45, z);
      A.box(MP.frame, x1 - x0, 0.05, 0.05, xm, 2.42, z);
    });
    A.box(MP.frame, x1 - x0 + 0.1, 0.03, o.depth + 0.1, xm, 2.47, zm);
    // pistas inferiores (roletes) na altura do módulo superior do WMR
    o.dyn.concat(o.stat).forEach((x) => {
      [-1, 1].forEach((s) => A.box(MP.alu, 0.03, 0.05, o.depth, x + s * 0.34, WMR_TOP - 0.04, zm));
      for (let k = 0; k < Math.round(o.depth / 0.09); k++)
        A.cyl(MP.rail, 0.018, 0.66, x, WMR_TOP - 0.02, zf + d * (0.05 + k * 0.09), 0, 0, Math.PI / 2, 8);
    });
    // níveis superiores inclinados com caixas
    [
      [1.18, 1.32],
      [1.85, 1.99],
    ].forEach((lv) => {
      A.beam(MP.frame, x0, lv[0] - 0.05, zf, x0, lv[1] - 0.05, zb, 0.05, 0.05);
      A.box(MP.alu, x1 - x0, 0.03, 0.04, xm, lv[0] - 0.04, zf);
      A.box(MP.alu, x1 - x0, 0.03, 0.04, xm, lv[1] - 0.04, zb);
      o.lanes.forEach((x, li) => {
        for (let k = 0; k < 3; k++) {
          const u = (k + 0.5) / 3.2,
            z = lerp(zf, zb, u),
            y = lerp(lv[0], lv[1], u);
          [-0.16, 0.16].forEach((dx) => {
            if (hash(li, k, Math.round(lv[0] * 10), dx > 0 ? 1 : 2) < 0.92)
              binAt(x + dx, y, z, d > 0 ? 0 : Math.PI, o.col || binCols[(li + k) % binCols.length]);
          });
        }
      });
    });
    o.stat.forEach((x, li) => {
      for (let k = 0; k < 3; k++) {
        const z = zf + d * (0.22 + k * 0.4);
        [-0.16, 0.16].forEach((dx) =>
          binAt(x + dx, WMR_TOP, z, d > 0 ? 0 : Math.PI, o.col || binCols[(li + k + 1) % binCols.length]),
        );
      }
    });
    // painel do fundo com passagem baixa nas pistas dinâmicas (o operador abastece por trás)
    const zp = zf + d * o.panel;
    A.box(MP.panel, x1 - x0, 1.62, 0.04, xm, 1.62, zp);
    A.box(MP.panel, x1 - x0, 0.4, 0.04, xm, 0.2, zp);
    o.stat.forEach((x) => A.box(MP.panel, 0.7, 0.44, 0.04, x, 0.62, zp));
    plate(o.title, o.sub, xm, 2.85, zf - d * 0.02, d > 0 ? Math.PI : 0, 2.6, true);
  }
  flowStation('ALM', {
    zr: 14.9,
    dir: 1,
    depth: 2.1,
    panel: 1.5,
    hide: 2.2,
    dyn: [44.4, 43.2],
    stat: [39.6, 40.4, 41.2, 42.0, 45.6, 46.4],
    lanes: [39.6, 40.4, 41.2, 42.0, 42.8, 43.6, 44.4, 45.2, 46.0, 46.6],
    up: [39.2, 42.65, 44.95, 46.9],
    title: 'SEPARAÇÃO A',
    sub: 'abastecimento da Linha 1 · KLT',
  });
  flowStation('SM', {
    zr: 6.0,
    dir: -1,
    depth: 2.1,
    panel: 1.4,
    hide: 2.1,
    dyn: [-40.0, -41.2],
    stat: [-43.4, -42.6, -38.8, -38.0],
    lanes: [-43.4, -42.6, -41.8, -41.0, -40.2, -39.4, -38.6, -38.0],
    up: [-43.85, -41.82, -40.6, -39.4, -37.6],
    title: 'SUPERMERCADO · LINHA 1',
    sub: 'tampas e rolamentos',
  });
  flowStation('US', {
    zr: 18.2,
    dir: 1,
    depth: 1.8,
    panel: 1.25,
    hide: 1.75,
    dyn: [15.9, 17.1],
    stat: [],
    lanes: [15.9, 17.1],
    up: [15.3, 16.5, 17.7],
    title: 'PEÇAS USINADAS',
    sub: 'saída para a Linha 3',
    col: 0x7d8894,
  });
  flowStation('L3', {
    zr: -13.9,
    dir: -1,
    depth: 1.8,
    panel: 1.25,
    hide: 1.75,
    dyn: [42.4, 43.6],
    stat: [],
    lanes: [42.4, 43.6],
    up: [41.8, 43.0, 44.2],
    title: 'ENTRADA · LINHA 3',
    sub: 'eixos e tampas usinados',
    col: 0x7d8894,
  });
  box2(38.9, 47.2, 15.1, 17.5);
  box2(-44.1, -37.4, 3.4, 5.8);
  box2(15.1, 17.9, 18.4, 20.5);
  box2(41.6, 44.4, -16.3, -14.1);
  return Object.assign(ctx, { STN });
}
