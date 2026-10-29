/** Modelo da empilhadeira (carroceria, protetor, mastro, garfos e rodas). Origem no centro entre os eixos, frente em +Z. */
import * as THREE from 'three';
import { Builder } from '../core/builder';
import type { AfterProductionLines } from '../ctx';

export function makeForklift(MP: AfterProductionLines['MP']) {
  const g = new THREE.Group();
  const b = new Builder();
  b.box(MP.weg, 1.2, 1.0, 2.2, 0, 0.75, 0);
  b.box(MP.dark, 1.1, 0.08, 1.6, 0, 2.4, 0.3);
  [-0.5, 0.5].forEach((x) => {
    b.box(MP.dark, 0.06, 2.2, 0.06, x, 1.35, 1.1);
    b.box(MP.dark, 0.06, 2.2, 0.06, x, 1.35, -0.5);
  });
  b.box(MP.steelD, 0.12, 3.2, 0.12, -0.35, 1.6, 1.25);
  b.box(MP.steelD, 0.12, 3.2, 0.12, 0.35, 1.6, 1.25);
  [-0.2, 0.2].forEach((x) => b.box(MP.steel, 0.12, 0.06, 1.2, x, 0.12, 1.9));
  b.box(MP.dark, 0.5, 0.6, 0.5, 0, 1.55, -0.4);
  b.build(g, true, true);
  // rodas em grupos próprios para girar; o raio claro na lateral deixa o giro visível
  const wheels: THREE.Group[] = [];
  [-1, 1].forEach((s) =>
    [-0.7, 0.7].forEach((z) => {
      const wb = new Builder();
      wb.cyl(MP.rubber, 0.3, 0.25, 0, 0, 0, 0, 0, Math.PI / 2, 16);
      wb.box(MP.steel, 0.27, 0.42, 0.07, 0, 0, 0);
      const w = new THREE.Group();
      wb.build(w, true, true);
      w.position.set(s * 0.62, 0.3, z);
      g.add(w);
      wheels.push(w);
    }),
  );
  return { g, wheels };
}
