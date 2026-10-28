/** Animações dos setores e pontos de interesse da câmera. */
import { clamp, lerp, smooth5 } from '../core/math';
import type { AfterFleet } from '../ctx';
export function buildAreaLife(ctx: AfterFleet) {
  const { AREAS, FLEET, LED, R3, animUpdate, chLed, testCoup, walkUpdate, wmrUpdate, wrapCar, wrapG } = ctx;
  AREAS.update = function (t, dt) {
    AREAS.people.forEach((P) => P.update(t));
    AREAS.walkers.forEach((W) => walkUpdate(W, dt, t));
    FLEET.forEach((W) => wmrUpdate(W, dt));
    animUpdate(dt);
    testCoup.forEach((c) => {
      if (c.on) c.m.rotation.x += dt * 18;
    });
    wrapG.rotation.y = t * 0.9;
    wrapCar.position.y = 0.55 + 0.5 * (1 - Math.cos(t * 0.35));
    chLed.forEach((l, i) => (l.material = i === 1 && FLEET[2].charge < 1 && (t * 1.2) % 1 < 0.6 ? LED.on : LED.blue));
    // aparafusamento: 4 pontos sobre a tampa, com pausa em cada um
    {
      const k = Math.floor(t / 2.4) % 4,
        u = (t % 2.4) / 2.4,
        pts = [
          [0.1, 4.15],
          [0.18, 3.95],
          [0.1, 3.75],
          [0.02, 3.95],
        ];
      const a = pts[k],
        b2 = pts[(k + 1) % 4];
      const mv = smooth5(clamp((u - 0.55) / 0.45, 0, 1));
      const dip = u < 0.5 ? 0.06 * Math.sin((Math.PI * u) / 0.5) : 0;
      R3.set(lerp(a[0], b2[0], mv), lerp(a[1], b2[1], mv), 4.15 - dip / 0.42, 0.7);
    }
  };
  AREAS.pois = {
    'Visão geral': { p: [-26, 11, 30], l: [-6, 2.5, -8] },
    Almoxarifado: { p: [44, 8.5, 6], l: [50, 2.2, 26] },
    'Logística WMR': { track: 'WMR-01' },
    'Linha de montagem': { p: [-13.2, 6.8, 11.8], l: [-20, 3.0, -2] },
    'Célula robotizada': { p: [-18.0, 5.1, 6.6], l: [-23.4, 3.7, -3.6] },
    'Motor TT-01': { p: [-25.2, 4.7, 5.9], l: [-29.1, 3.9, 0] },
    CLP: { p: [-7.6, 3.9, 6.8], l: [-4.2, 2.9, 0.4] },
    WES: { p: [16.5, 7.6, 13.5], l: [21, 8.6, -8] },
    'Assistente de IA': { p: [37.2, 6.4, 9.8], l: [45.5, 7, -1.5] },
    'Laboratório de ensaios': { p: [13.5, 6.2, -12.5], l: [21, 1.0, -27] },
    'Linha 3': { p: [46, 6.5, -11], l: [48, 1.5, -24] },
  };
  return ctx;
}
