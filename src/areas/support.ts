/** Setores de apoio: CCM, armários técnicos, qualidade, embalagem, estoque intermediário, utilidades e escritório. */
import * as THREE from 'three';
import { Builder, UG, std } from '../core/builder';
import type { AfterLine3 } from '../ctx';
export function buildSupport(ctx: AfterLine3) {
  const { A, HC, L, MP, badgeMat, box2, colliders, floorText, hmiMat, palGeo, pipeM, plate, rect2, scene, unitLo } =
    ctx;
  // ---- painéis elétricos (CCM) e armários técnicos junto à parede direita
  for (let i = 0; i < 12; i++) {
    const z = -31.4 + i * 1.5;
    A.box(MP.cab, 0.8, 2.3, 1.42, 63.9, 1.25, z);
    A.box(MP.weg, 0.82, 0.1, 1.44, 63.9, 0.05, z);
    A.box(MP.weg, 0.82, 0.12, 1.44, 63.9, 2.46, z);
    A.box(MP.dark, 0.01, 2.1, 0.01, 63.49, 1.25, z);
    A.box(MP.steel, 0.05, 0.3, 0.04, 63.47, 1.3, z + 0.55);
    if (i % 3 === 0) A.plane(hmiMat, 0.3, 0.22, 63.49, 1.7, z, 0, -Math.PI / 2, 0);
    [0.25, 0.45].forEach((dz) => A.cyl(MP.alu, 0.035, 0.04, 63.48, 2.05, z - 0.4 + dz, 0, 0, Math.PI / 2, 12));
  }
  for (let i = 0; i < 6; i++) {
    const z = -8 + i * 2.2;
    A.box(MP.dark, 0.9, 2.1, 0.8, 64.0, 1.05, z);
    A.box(MP.steelD, 0.02, 1.9, 0.7, 63.54, 1.05, z);
    for (let k = 0; k < 6; k++) A.box(MP.alu, 0.01, 0.03, 0.5, 63.53, 0.4 + k * 0.28, z);
  }
  {
    const bb = new THREE.Mesh(UG.plane, badgeMat);
    bb.scale.set(0.6, 0.26, 1);
    bb.position.set(63.48, 2.2, -31.4);
    bb.rotation.y = -Math.PI / 2;
    scene.add(bb);
  }
  ST2();
  function ST2() {
    const L2 = 21;
    [-1, 1].forEach((s) => A.box(MP.alu, 0.04, 0.1, L2, 63.4 + s * 0.25, 3.4, -22.4));
    for (let z = -32.4; z < -11.9; z += 0.3) A.box(MP.alu, 0.5, 0.03, 0.03, 63.4, 3.36, z);
  }
  plate('SALA DE PAINÉIS · CCM', 'alimentação das linhas', 63.45, 3.0, -23, -Math.PI / 2, 2.6, true);
  plate('ARMÁRIOS TÉCNICOS', null, 63.45, 2.6, -2.5, -Math.PI / 2, 2.0, true);
  colliders.push({ x0: 63.3, x1: 66, z0: -32.3, z1: -12.6 });
  colliders.push({ x0: 63.4, x1: 66, z0: -8.6, z1: 3.6 });
  rect2(62.4, 65.4, -32.8, 4.2);

  // ---- controle de qualidade (inspeção final dimensional)
  rect2(-21, -8, 15.4, 25.4);
  floorText('CONTROLE DE QUALIDADE', null, -14.5, 24.4, 6.5);
  A.box(MP.dark, 2.6, 0.12, 1.3, -14.5, 0.86, 18.6);
  A.box(MP.frame, 2.4, 0.8, 1.1, -14.5, 0.4, 18.6);
  {
    const u = unitLo.clone();
    u.position.set(-14.5, 0.92, 18.5);
    scene.add(u);
  }
  A.box(MP.steelD, 0.12, 0.8, 0.12, -13.2, 1.32, 18.2);
  A.box(MP.steelD, 0.5, 0.05, 0.05, -13.4, 1.7, 18.2);
  A.box(MP.sensor, 0.08, 0.18, 0.08, -13.6, 1.55, 18.2);
  A.box(MP.cab, 1.0, 1.1, 0.6, -17.2, 0.55, 17.9);
  A.box(MP.dark, 0.6, 0.4, 0.04, -17.2, 1.55, 17.75);
  A.plane(hmiMat, 0.54, 0.34, -17.2, 1.55, 17.78);
  A.box(MP.steelD, 0.05, 0.4, 0.05, -17.2, 1.28, 17.75);
  box2(-17.8, -12.9, 17.5, 19.4);
  plate('CONTROLE DE QUALIDADE', 'inspeção dimensional final', -17.2, 2.3, 17.58, 0, 2.2, true);
  // ---- embalagem: envolvedora de paletes e montagem de engradados
  rect2(-43, -23, 27, 37);
  floorText('EMBALAGEM', null, -33, 36, 5);
  const wrapG = new THREE.Group();
  wrapG.position.set(-38, 0, 31.5);
  scene.add(wrapG);
  {
    A.cyl(MP.steelD, 1.25, 0.12, -38, 0.06, 31.5, 0, 0, 0, 40);
    A.box(MP.cab, 0.35, 3.0, 0.35, -36.3, 1.5, 31.5);
    A.box(MP.weg, 0.4, 0.12, 0.4, -36.3, 3.05, 31.5);
    const b = new Builder();
    b.cyl(MP.dark, 1.2, 0.04, 0, 0.14, 0, 0, 0, 0, 40);
    b.geo(MP.pallet, palGeo, 0, 0.16, 0, 0, 0, 0, 1);
    b.build(wrapG, true, true);
    const u = unitLo.clone();
    u.position.y = 0.3;
    wrapG.add(u);
    const film = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.08, 0.6, 32, 1, true),
      std(0xf0f5f8, 0.25, 0, { transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
    );
    film.position.y = 0.62;
    wrapG.add(film);
  }
  const wrapCar = new THREE.Mesh(UG.box, MP.steelD);
  wrapCar.scale.set(0.3, 0.25, 0.5);
  wrapCar.position.set(-36.55, 1.0, 31.5);
  scene.add(wrapCar);
  A.box(MP.frame, 3.0, 0.06, 1.2, -29.5, 0.85, 30.4);
  [-1, 1].forEach((s) =>
    [-1, 1].forEach((t) => A.box(MP.frame, 0.06, 0.82, 0.06, -29.5 + s * 1.42, 0.41, 30.4 + t * 0.52)),
  );
  for (let i = 0; i < 4; i++) A.box(MP.wood, 2.6, 0.04, 1.0, -29.5, 0.9 + i * 0.045, 30.4);
  A.box(MP.wood, 1.0, 0.6, 0.08, -31.4, 1.25, 30.0, 0, 0.3, 0);
  {
    L.pal.push([-26.2, 0, 32.8, 0]);
    const u = unitLo.clone();
    u.position.set(-26.2, 0.144, 32.8);
    scene.add(u);
    A.box(MP.wood, 2.7, 1.4, 0.06, -26.2, 0.85, 33.35);
    A.box(MP.wood, 0.06, 1.4, 1.1, -27.55, 0.85, 32.8);
    A.box(MP.wood, 0.06, 1.4, 1.1, -24.85, 0.85, 32.8);
  }
  box2(-39.4, -35.9, 30.1, 32.9);
  box2(-31.1, -27.9, 29.7, 31.1);
  box2(-27.7, -24.7, 32.1, 33.5);
  // ---- estoque intermediário (carcaças em contentores aramados)
  rect2(-50.4, -42.6, 15, 26);
  floorText('ESTOQUE INTERMEDIÁRIO', null, -46.5, 25.2, 5.5);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const x = -49 + i * 2.2,
        z = 17 + j * 2.8;
      L.pal.push([x, 0, z, 0]);
      L.git.push([x, 0.144, z, 0]);
      L.gitM.push([x, 0.144 + 0.55, z, 0, 1.18, 0.85, 0.98]);
      L.frame.push([x, 0.144 + 0.6, z, 0, 0.8, 0.8, 0.8]);
      if ((i + j) % 2 === 0) {
        L.pal.push([x, 1.12, z, 0]);
        L.git.push([x, 1.264, z, 0]);
        L.gitM.push([x, 1.264 + 0.55, z, 0, 1.18, 0.85, 0.98]);
      }
    }
  box2(-49.8, -43.0, 16.3, 23.3);
  // ---- utilidades (ar comprimido) e escritório de produção
  {
    const x0 = -4,
      x1 = 10,
      z0 = 44,
      z1 = 55.6,
      h = 4.5;
    A.box(MP.panel, x1 - x0, h, 0.2, (x0 + x1) / 2, h / 2, z0);
    A.box(MP.panel, 0.2, h, z1 - z0, x0, h / 2, (z0 + z1) / 2);
    A.box(MP.panel, 0.2, h, z1 - z0, x1, h / 2, (z0 + z1) / 2);
    A.box(MP.roofP, x1 - x0 + 0.2, 0.15, z1 - z0 + 0.2, (x0 + x1) / 2, h + 0.07, (z0 + z1) / 2);
    for (let x = x0 + 0.8; x < x1 - 0.5; x += 0.6) A.box(MP.steelD, 0.4, 0.03, 0.04, x, 3.2, z0 - 0.12);
    A.box(MP.steelD, x1 - x0 - 1, 1.1, 0.02, (x0 + x1) / 2, 3.3, z0 - 0.1);
    A.box(MP.dark, 1.4, 2.4, 0.06, 1.0, 1.2, z0 - 0.12);
    A.box(MP.weg, x1 - x0 + 0.02, 0.3, 0.22, (x0 + x1) / 2, h - 0.25, z0);
    A.cyl(pipeM, 0.14, HC - h - 0.5, 7, h + (HC - h) / 2, z0 + 1, 0, 0, 0, 12);
    A.cyl(pipeM, 0.12, HC - h - 0.5, 8, h + (HC - h) / 2, z0 + 1, 0, 0, 0, 12);
    plate('UTILIDADES · AR COMPRIMIDO', 'acesso técnico', 3, 3.9, z0 - 0.13, Math.PI, 3.4, true);
    colliders.push({ x0: x0 - 0.2, x1: x1 + 0.2, z0: z0 - 0.3, z1: z1 });
  }
  {
    const x0 = 16,
      x1 = 32,
      z0 = 42,
      z1 = 54,
      h = 3.2;
    const gl = std(0xcee3f4, 0.08, 0.1, {
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    [x0, x1].forEach((x) => {
      for (let z = z0; z <= z1; z += 2) A.box(MP.struct, 0.1, h, 0.1, x, h / 2, z);
    });
    for (let x = x0; x <= x1; x += 2) {
      A.box(MP.struct, 0.1, h, 0.1, x, h / 2, z0);
    }
    A.plane(gl, x1 - x0, h - 0.9, (x0 + x1) / 2, 0.45 + (h - 0.9) / 2 + 0.45, z0);
    A.box(MP.panel, x1 - x0, 0.9, 0.1, (x0 + x1) / 2, 0.45, z0);
    A.box(MP.roofP, x1 - x0 + 0.2, 0.15, z1 - z0 + 0.2, (x0 + x1) / 2, h + 0.07, (z0 + z1) / 2);
    A.box(MP.panel, 0.1, h, z1 - z0, x0, h / 2, (z0 + z1) / 2);
    A.box(MP.panel, 0.1, h, z1 - z0, x1, h / 2, (z0 + z1) / 2);
    for (let i = 0; i < 3; i++) {
      const x = 19 + i * 5;
      A.box(MP.cab, 2.0, 0.05, 0.9, x, 0.76, z0 + 2.2);
      A.box(MP.dark, 0.6, 0.38, 0.04, x, 1.05, z0 + 2.5);
      A.plane(hmiMat, 0.55, 0.32, x, 1.05, z0 + 2.47, 0, Math.PI, 0);
      A.box(MP.dark, 0.5, 0.9, 0.5, x, 0.45, z0 + 3.1);
    }
    A.plane(MP.glow, x1 - x0 - 0.4, 0.12, (x0 + x1) / 2, h - 0.05, (z0 + z1) / 2, Math.PI / 2, 0, 0);
    plate('ESCRITÓRIO DE PRODUÇÃO', null, (x0 + x1) / 2, h + 0.55, z0 - 0.08, Math.PI, 3.6, true);
    colliders.push({ x0: x0 - 0.2, x1: x1 + 0.2, z0: z0 - 0.2, z1: z1 });
  }
  return Object.assign(ctx, { wrapCar, wrapG });
}
