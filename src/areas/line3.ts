/** Linha 3: submontagem de tampas e estação robotizada de aparafusamento. */
import * as THREE from 'three';
import { lerp } from '../core/math';
import { signTex } from '../core/textures';
import { makeRobot } from '../equipment/robot';
import type { AfterLab } from '../ctx';
export function buildLine3(ctx: AfterLab) {
  const { A, K, M, MP, binAt, binCols, box2, colliders, floorText, hangSign, imgs, meshMat, plate, rect2, scene } = ctx;
  // ---- Linha 3: submontagem de tampas (bancadas manuais e estação robotizada de aparafusamento)
  rect2(36.4, 58.6, -36.4, -13.4, 0.14);
  floorText('LINHA 3 · SUBMONTAGEM', null, 47, -24.6, 8);
  [40.2, 46.2].forEach((x) => {
    A.box(MP.frame, 3.0, 0.06, 1.0, x, 0.92, -21.2);
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) => A.box(MP.frame, 0.06, 0.9, 0.06, x + s * 1.42, 0.45, -21.2 + t * 0.42)),
    );
    A.box(MP.steelD, 0.5, 0.06, 0.5, x, 0.98, -21.2);
    A.cyl(M.blue, 0.34, 0.08, x, 1.05, -21.2, 0, 0, 0, 32);
    A.cyl(M.blueD, 0.12, 0.1, x, 1.12, -21.2, 0, 0, 0, 20);
    A.box(MP.steelD, 0.3, 0.9, 0.3, x + 1.0, 1.4, -21.55);
    A.box(MP.steelD, 0.4, 0.12, 0.5, x + 1.0, 1.9, -21.35);
    A.cyl(MP.steel, 0.04, 0.35, x + 1.0, 1.65, -21.25, 0, 0, 0, 10);
    A.box(MP.alu, 3.0, 0.03, 0.25, x, 1.35, -20.78);
    for (let i = 0; i < 7; i++) binAt(x - 1.2 + i * 0.4, 1.37, -20.78, 0, binCols[i % 5], false);
    A.box(MP.alu, 0.05, 2.2, 0.05, x - 0.5, 2.55, -21.2);
    A.box(MP.alu, 3.2, 0.06, 0.06, x, 3.6, -21.2);
    A.rod(MP.steelD, x - 0.4, 3.6, -21.2, x - 0.4, 1.6, -21.2, 0.008, 6);
    A.box(MP.dark, 0.08, 0.28, 0.08, x - 0.4, 1.46, -21.2);
    box2(x - 1.6, x + 1.6, -21.8, -20.6);
  });
  // transportador de roletes entre a entrada e as bancadas
  {
    const z = -18.9;
    A.box(MP.frame, 15, 0.18, 0.07, 45.5, 0.82, z - 0.38);
    A.box(MP.frame, 15, 0.18, 0.07, 45.5, 0.82, z + 0.38);
    for (let x = 38.1; x < 53; x += 0.25) A.cyl(MP.rail, 0.03, 0.74, x, 0.9, z, Math.PI / 2, 0, 0, 8);
    for (let x = 38.3; x < 53; x += 2.4) [-1, 1].forEach((s) => A.box(MP.frame, 0.06, 0.8, 0.06, x, 0.4, z + s * 0.35));
    [39.5, 43.1, 47.7, 51.4].forEach((x) => {
      A.box(MP.steelD, 0.6, 0.03, 0.5, x, 0.95, z);
      A.cyl(M.blue, 0.28, 0.07, x, 1.0, z, 0, 0, 0, 28);
    });
    box2(37.9, 53.1, -19.4, -18.4);
  }
  // estação robotizada de aparafusamento (cercada)
  {
    const cx = 53.6,
      cz = -29.5;
    const fr = [
      [49.6, -33.6, 57.6, -33.6],
      [49.6, -25.4, 57.6, -25.4],
      [49.6, -33.6, 49.6, -25.4],
      [57.6, -33.6, 57.6, -25.4],
    ];
    fr.forEach((f) => {
      const Lf = Math.hypot(f[2] - f[0], f[3] - f[1]),
        n = Math.round(Lf / 1.6),
        ang = Math.atan2(-(f[3] - f[1]), f[2] - f[0]);
      for (let i = 0; i <= n; i++) {
        const x = lerp(f[0], f[2], i / n),
          z = lerp(f[1], f[3], i / n);
        A.box(MP.post, 0.08, 2.3, 0.08, x, 1.15, z);
      }
      for (let i = 0; i < n; i++) {
        const x = lerp(f[0], f[2], (i + 0.5) / n),
          z = lerp(f[1], f[3], (i + 0.5) / n);
        A.plane(meshMat, Lf / n - 0.1, 2.1, x, 1.15, z, 0, ang, 0);
      }
    });
    A.box(MP.frame, 1.6, 0.9, 1.2, cx + 1.7, 0.45, cz);
    A.cyl(M.blue, 0.32, 0.08, cx + 1.7, 0.94, cz, 0, 0, 0, 28);
    A.box(MP.steelD, 0.12, 0.12, 0.12, cx + 1.7, 1.0, cz);
    colliders.push({ x0: 49.4, x1: 57.8, z0: -33.8, z1: -25.2 });
    plate('ESTAÇÃO ROBOTIZADA · APARAFUSAMENTO', 'representação ilustrativa', 53.6, 2.6, -25.32, 0, 3.2, false);
  }
  const rb3 = new THREE.Group();
  rb3.position.set(53.6, 0, -29.5);
  rb3.scale.setScalar(0.42);
  scene.add(rb3);
  const R3 = makeRobot(K, rb3, 0, 0, false);
  R3.jaw.forEach((j) => (j.visible = false));
  hangSign(
    47,
    9,
    -19.6,
    8.5,
    1.4,
    signTex({
      w: 900,
      h: 157,
      bg: '#0B2B4D',
      bd: '#2F7BC0',
      logo: true,
      imgs: imgs,
      lh: 0.5,
      lines: [
        ['LINHA 3 · SUBMONTAGEM', 72, 44, 700],
        ['tampas, rolamentos e vedações', 120, 26, 500, '#8FB0D0'],
      ],
    }),
  );
  return Object.assign(ctx, { R3 });
}
