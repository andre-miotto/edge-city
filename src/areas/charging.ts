/** Estação de recarga dos WMR e faixas de rota no piso. */
import * as THREE from 'three';
import { lerp } from '../core/math';
import type { AfterWarehouse } from '../ctx';
export function buildCharging(ctx: AfterWarehouse) {
  const { A, K, LED, MP, box2, floorText, mk2, plate, rect2, scene, wmrLine } = ctx;
  // ---- estação de recarga dos WMR
  A.box(MP.dark, 5.6, 0.02, 2.4, 32.6, 0.012, 15.6);
  rect2(29.8, 35.4, 14.4, 16.8, 0.1);
  [31.2, 33.6].forEach((x) => {
    A.box(MP.cab, 0.42, 0.7, 0.24, x, 0.75, 16.55);
    A.box(MP.steelD, 0.1, 0.42, 0.1, x, 0.21, 16.55);
    A.box(MP.weg, 0.44, 0.08, 0.26, x, 1.14, 16.55);
    A.box(MP.alu, 0.3, 0.08, 0.06, x, 0.12, 16.22);
    A.box(MP.dark, 0.5, 0.012, 0.4, x, 0.03, 15.95);
  });
  plate('RECARGA WMR', 'estação de carregamento', 32.4, 1.65, 16.72, Math.PI, 2.2, true);
  box2(30, 35.2, 16.2, 16.9);
  const chLed = [31.2, 33.6].map((x) => {
    const m = new THREE.Mesh(K.ledGeo, LED.blue);
    m.position.set(x, 0.96, 16.42);
    scene.add(m);
    return m;
  });
  // ---- rotas WMR (faixas azuis no piso)
  function routeLine(pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b2 = pts[i + 1],
        L2 = Math.hypot(b2[0] - a[0], b2[1] - a[1]);
      const n = Math.floor(L2 / 1.6);
      for (let k = 0; k < n; k++) {
        const u = (k + 0.25) / n,
          u2 = (k + 0.75) / n;
        const x = lerp(a[0], b2[0], (u + u2) / 2),
          z = lerp(a[1], b2[1], (u + u2) / 2);
        mk2.plane(
          wmrLine,
          Math.abs(b2[0] - a[0]) > 0.1 ? 0.8 : 0.09,
          Math.abs(b2[0] - a[0]) > 0.1 ? 0.09 : 0.8,
          x,
          0.014,
          z,
          -Math.PI / 2,
          0,
          0,
        );
      }
    }
  }
  routeLine([
    [47.5, 12.2],
    [-36, 12.2],
  ]);
  routeLine([
    [-34.4, 9.8],
    [47.5, 9.8],
  ]);
  routeLine([
    [3.5, 18.2],
    [3.5, -13.9],
  ]);
  routeLine([
    [3.5, -13.9],
    [40, -13.9],
  ]);
  routeLine([
    [3.5, 18.2],
    [15.0, 18.2],
  ]);
  floorText('ROTA WMR', null, 24, 11.0, 3.2);
  floorText('ROTA WMR', null, 3.5, -2, 3.2, -Math.PI / 2);
  return Object.assign(ctx, { chLed });
}
