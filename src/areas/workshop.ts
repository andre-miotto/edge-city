/** Manutenção, montagem manual, porta-paletes da parede, usinagem e expedição. */
import * as THREE from 'three';
import { Builder, UG, std } from '../core/builder';
import type { AfterProductionLines } from '../ctx';
export function buildWorkshop(ctx: AfterProductionLines) {
  const { LED, MP, box2, floorText, hmiMat, mk, rect, scene, unitLo } = ctx;
  // ---------------- área de manutenção, montagem manual, estoque e paletes
  {
    const b = new Builder();
    // bancada e painel de ferramentas
    b.box(MP.frame, 0.9, 0.06, 2.6, -64.6, 0.95, 22);
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) => b.box(MP.frame, 0.06, 0.92, 0.06, -64.6 + s * 0.38, 0.46, 22 + t * 1.22)),
    );
    b.box(MP.cab, 0.86, 0.5, 1.0, -64.6, 0.55, 21.2);
    b.box(MP.steelD, 0.25, 0.22, 0.15, -64.5, 1.09, 22.8);
    b.box(MP.post, 0.04, 1.4, 2.6, -65.6, 1.9, 22);
    for (let i = 0; i < 14; i++)
      b.box(
        i % 3 ? MP.steel : MP.weg,
        0.04,
        0.25 + ((i * 7) % 5) * 0.05,
        0.05,
        -65.55,
        2.1 + ((i * 3) % 3) * 0.35,
        21 + ((i * 5) % 9) * 0.25,
      );
    // carrinho de ferramentas
    b.box(MP.weg, 0.9, 0.9, 0.55, -61.5, 0.6, 19.5);
    for (let k = 0; k < 4; k++) b.box(MP.alu, 0.82, 0.02, 0.02, -61.5, 0.35 + k * 0.2, 19.79);
    b.box(MP.dark, 0.95, 0.05, 0.6, -61.5, 1.08, 19.5);
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) =>
        b.cyl(MP.rubber, 0.07, 0.06, -61.5 + s * 0.38, 0.07, 19.5 + t * 0.22, Math.PI / 2, 0, 0, 12),
      ),
    );
    // suporte de reparo com motor
    b.box(MP.frame, 1.6, 0.8, 1.0, -58, 0.4, 24);
    b.box(MP.steelD, 2.0, 0.06, 1.2, -58, 0.83, 24);
    // prateleira de peças
    b.box(MP.frame, 0.6, 2.4, 1.8, -64.9, 1.2, 27.4);
    [0.5, 1.2, 1.9].forEach((y) => {
      b.box(MP.wood, 0.5, 0.3, 0.4, -64.8, y + 0.18, 26.9);
      b.box(MP.wood, 0.5, 0.25, 0.35, -64.8, y + 0.16, 27.8);
    });
    // montagem manual (diante do recinto de montagem)
    b.box(MP.frame, 2.8, 0.06, 0.9, -46, 0.95, -1.9);
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) => b.box(MP.frame, 0.06, 0.92, 0.06, -46 + s * 1.32, 0.46, -1.9 + t * 0.38)),
    );
    b.box(MP.steelD, 0.6, 0.3, 0.4, -46.8, 1.13, -1.9);
    b.box(MP.steel, 0.2, 0.2, 0.2, -45.4, 1.08, -1.8);
    b.box(MP.steelD, 0.12, 1.2, 0.12, -43.6, 0.6, -0.6);
    b.box(MP.cab, 0.5, 0.4, 0.3, -43.6, 1.35, -0.6);
    b.plane(hmiMat, 0.36, 0.24, -43.6, 1.36, -0.44);
    b.box(MP.frame, 2.0, 0.7, 1.2, -41.6, 0.35, -0.9);
    // estoque (porta-paletes)
    for (let i = 0; i <= 8; i++) {
      const z = -15 + i * 3;
      [-63.0, -64.4].forEach((x) => b.box(MP.weg, 0.1, 8.2, 0.1, x, 4.1, z));
    }
    [0.15, 2.3, 4.4, 6.5].forEach((y) => [-63.0, -64.4].forEach((x) => b.box(MP.frame, 0.08, 0.14, 24, x, y, -3)));
    for (let i = 0; i < 8; i++)
      for (let l = 0; l < 4; l++) {
        const z = -13.5 + i * 3,
          y = [0.22, 2.37, 4.47, 6.57][l];
        const k = (i * 7 + l * 3) % 5;
        if (k === 4) continue;
        b.box(MP.pallet, 1.2, 0.14, 1.2, -63.7, y + 0.07, z - 0.7);
        b.box(MP.pallet, 1.2, 0.14, 1.2, -63.7, y + 0.07, z + 0.7);
        if (k < 2) {
          b.box(MP.wood, 1.1, 1.0, 1.1, -63.7, y + 0.66, z - 0.7);
          b.box(MP.wood, 1.1, 0.8, 1.1, -63.7, y + 0.56, z + 0.7);
        }
      }
    // paletes e caixas perto do portão 03
    [
      [38, -37],
      [40.5, -37],
      [43, -36.8],
      [38.2, -34.5],
    ].forEach((p, i) => {
      b.box(MP.pallet, 1.2, 0.14, 1.0, p[0], 0.07, p[1]);
      b.box(MP.wood, 1.1, 0.9 + 0.2 * (i % 2), 0.9, p[0], 0.6 + 0.1 * (i % 2), p[1]);
    });
    b.build(scene, true, true);
    [
      [-58, 0.86, 24, 0.6],
      [-41.6, 0.7, -0.9, Math.PI / 2],
      [-63.7, 4.61, -1.4, 0],
    ].forEach((p) => {
      const u = unitLo.clone();
      u.position.set(p[0], p[1], p[2]);
      u.rotation.y = p[3];
      scene.add(u);
    });
    [
      [-63.7, 0.36, 4.8],
      [-63.7, 2.51, -7.2],
      [-63.7, 6.71, 10.8],
      [-63.7, 0.36, -10.2],
    ].forEach((p) => {
      const u = unitLo.clone();
      u.position.set(p[0], p[1], p[2]);
      u.rotation.y = Math.PI / 2;
      u.scale.setScalar(0.8);
      scene.add(u);
    });
  }
  box2(-65.2, -62.6, -15.4, 9.4);
  box2(-65.2, -63.9, 20.6, 28.4);
  box2(-62.1, -60.9, 19.1, 19.9);
  box2(-58.9, -57.1, 23.4, 24.6);
  box2(-47.5, -40.4, -2.5, -0.2);
  box2(37, 44, -38, -33.8);
  box2(57.6, 59.8, -39, -31.5);
  // usinagem: centros de usinagem (representação genérica) e expedição de motores prontos
  {
    const b = new Builder();
    const glass = std(0x405d73, 0.15, 0.3, { transparent: true, opacity: 0.55 });
    const lit = new THREE.MeshBasicMaterial({ color: 0xa3bbcf });
    [12, 21, 30].forEach((x, i) => {
      const z = 22;
      b.box(MP.cab, 4.4, 2.7, 2.8, x, 1.45, z);
      b.box(MP.weg, 4.42, 0.28, 2.82, x, 2.94, z);
      b.box(MP.dark, 4.4, 0.1, 2.8, x, 0.05, z);
      b.plane(lit, 2.3, 1.3, x + 0.4, 1.75, z - 0.9, 0, Math.PI, 0);
      b.plane(glass, 2.5, 1.5, x + 0.4, 1.75, z - 1.41, 0, Math.PI, 0);
      b.box(MP.alu, 2.6, 0.06, 0.08, x + 0.4, 2.53, z - 1.42);
      b.box(MP.alu, 2.6, 0.06, 0.08, x + 0.4, 0.97, z - 1.42);
      b.box(MP.steel, 0.06, 0.5, 0.06, x - 0.75, 1.75, z - 1.47);
      b.box(MP.steelD, 0.12, 0.12, 0.6, x - 2.0, 2.0, z - 1.6);
      b.box(MP.cab, 0.6, 0.8, 0.2, x - 2.0, 1.9, z - 1.95);
      b.plane(hmiMat, 0.44, 0.32, x - 2.0, 2.0, z - 2.06, 0, Math.PI, 0);
      b.box(MP.steelD, 1.2, 0.6, 0.7, x + 2.6, 0.6, z + 0.5);
      b.beam(MP.steelD, x + 2.6, 0.9, z + 0.5, x + 3.4, 2.3, z + 0.5, 0.6, 0.25);
      b.box(MP.dark, 0.7, 0.5, 0.6, x + 3.6, 0.3, z + 0.5);
      b.cyl(MP.dark, 0.04, 0.7, x - 1.9, 3.45, z + 1.0, 0, 0, 0, 8);
    });
    // paletes com motores prontos (expedição)
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 5; k++) {
        const x = -38 + k * 3.2,
          z = 42 + r * 3.6;
        b.box(MP.pallet, 2.0, 0.14, 1.2, x, 0.07, z);
      }
    b.build(scene, true, true);
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 5; k++) {
        if ((r * 5 + k) % 4 === 3) continue;
        const u = unitLo.clone();
        u.position.set(-38 + k * 3.2, 0.14, 42 + r * 3.6);
        scene.add(u);
      }
    [12, 21, 30].forEach((x) => {
      const m = new THREE.Mesh(UG.cyl[16], LED.blue);
      m.scale.set(0.07, 0.14, 0.07);
      m.position.set(x - 1.9, 3.85, 23);
      scene.add(m);
    });
    floorText('USINAGEM', null, 21, 26.0, 6);
    floorText('EXPEDIÇÃO', null, -31.6, 38.6, 6);
    rect(9, 33, 19.6, 27.4);
    rect(-40, -22, 39.8, 50);
    mk.build(scene, false, true);
  }
  box2(9.4, 34.4, 20.2, 24.6);
  [
    [-38, 42],
    [-38, 45.6],
  ].forEach(() => {});
  box2(-39.3, -23.7, 41.2, 48.4);
  return ctx;
}
