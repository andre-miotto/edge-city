/** Linha 1 (célula 01 + transferência + teste final) e Linha 2 (célula 02). */
import * as THREE from 'three';
import { Builder, UG } from '../core/builder';
import { signTex } from '../core/textures';
import { CELL, buildCell } from './cell';
import { motorParts } from './motor';
import type { AfterMonitoredMotor } from '../ctx';
export function buildProductionLines(ctx: AfterMonitoredMotor) {
  const { K, M, MP, box2, hmiMat, rollMat, scene } = ctx;
  // ---------------- célula robotizada 01 (Linha 1) e célula 02 (Linha 2)
  const cell1G = new THREE.Group();
  scene.add(cell1G);
  const XV2 = 0.9;
  const exit1 = (c, pt, v) => {
    const te = (c + 4) * CELL.T + 8.3,
      s = pt - te - 0.6;
    if (s < 0) {
      v.set(CELL.XT, CELL.TOP, 0);
      return true;
    }
    const a = XV2 / 1.2;
    const d = s < 1.2 ? 0.5 * a * s * s : 0.54 + XV2 * (s - 1.2);
    if (d > 18.6) return false;
    v.set(CELL.XT, CELL.TOP, -d);
    return true;
  };
  const cell1 = buildCell(K, cell1G, { detail: true, rollMat: rollMat(), exit: exit1 });
  const cell2G = new THREE.Group();
  cell2G.position.set(-66, 0, -34);
  cell2G.rotation.y = Math.PI;
  scene.add(cell2G);
  const cell2 = buildCell(K, cell2G, {
    detail: false,
    cabinets: false,
    rollMat: rollMat(),
    exitBox: true,
    exit: (c, pt, v) => false,
  });
  {
    const dr = new Builder();
    motorParts(dr, K, 0.55, 0, 0, 0);
    const g = new THREE.Group();
    dr.build(g, true);
    g.position.set(-27.35, 1.7, -1.9);
    g.rotation.y = Math.PI / 2;
    cell2G.add(g);
    const b = new Builder();
    b.box(MP.steelD, 0.8, 1.7, 0.8, -27.35, 0.85, -1.9);
    b.box(M.steel, 0.5, 0.5, 0.6, -26.2, 2.3, -1.55);
    b.build(cell2G, true, true);
  }
  // colisões da Linha 1
  box2(-26.8, -9.2, -1.7, 1.9);
  box2(-31.8, -16.7, -12.8, -1.6);
  box2(-40.2, -31.5, -8.8, -6.4);
  box2(-50.3, -39.8, -11.8, -3.2);
  box2(-31.2, -27.0, -15.2, -14.0);
  box2(-16.8, -15.9, -3.6, -2.8);
  box2(-63.5, -15.5, -37.5, -19.0);
  // transferência e transportador transversal até o teste final (Linha 1)
  const xRoll = rollMat();
  {
    const b = new Builder(),
      rb = new Builder();
    const X = CELL.XT,
      T = CELL.TOP;
    for (let z = 1.0; z > -20.6; z -= 0.35) rb.cyl(xRoll, 0.09, 2.1, X, T - 0.09, z, 0, 0, Math.PI / 2, 12);
    rb.build(scene, false, true);
    b.box(MP.frame, 0.07, 0.24, 21.8, X + 1.12, T - 0.14, -9.8);
    b.box(MP.frame, 0.07, 0.24, 19.0, X - 1.12, T - 0.14, -11.2);
    b.box(MP.frame, 0.07, 0.24, 0.9, X - 1.12, T - 0.14, 1.0);
    for (let z = 0.4; z > -20; z -= 2.4) {
      [-1, 1].forEach((s) => {
        b.box(MP.frame, 0.1, T - 0.25, 0.1, X + s * 1.05, (T - 0.25) / 2, z);
        b.box(MP.steelD, 0.24, 0.02, 0.24, X + s * 1.05, 0.01, z);
      });
      b.box(MP.frame, 2.1, 0.08, 0.08, X, 0.55, z);
    }
    for (let k = 0; k < 4; k++) b.box(MP.dark, 2.6, 0.05, 0.06, X - 0.4, T - 0.03, -0.9 + k * 0.6);
    b.box(MP.steelD, 0.6, 0.5, 1.6, X, 1.6, 0);
    // teste final (recinto com janela)
    const x0 = -11.5,
      x1 = -4.5,
      z0 = -25.5,
      z1 = -16.5,
      h = 5.0;
    b.box(MP.panel, x1 - x0, h, 0.15, (x0 + x1) / 2, h / 2, z0);
    b.box(MP.panel, 0.15, h, z1 - z0, x0, h / 2, (z0 + z1) / 2);
    b.box(MP.panel, 0.15, h, z1 - z0, x1, h / 2, (z0 + z1) / 2);
    b.box(MP.panel, X - 1.15 - x0, h, 0.15, (x0 + X - 1.15) / 2, h / 2, z1);
    b.box(MP.panel, x1 - (X + 1.15), h, 0.15, (x1 + X + 1.15) / 2, h / 2, z1);
    b.box(MP.panel, 2.3, h - 4.6, 0.15, X, (h + 4.6) / 2, z1);
    b.box(MP.roofP, x1 - x0 + 0.2, 0.12, z1 - z0 + 0.2, (x0 + x1) / 2, h + 0.06, (z0 + z1) / 2);
    b.box(MP.weg, x1 - x0 + 0.02, 0.35, 0.17, (x0 + x1) / 2, h - 0.3, z1);
    b.plane(MP.inner, 2.4, 4.4, X, 2.3, z1 - 2.2);
    b.plane(MP.glow, 2.0, 1.0, (x1 + X + 1.15) / 2, 3.0, z1 + 0.09);
    b.plane(MP.glow, 1.4, 1.0, (x0 + X - 1.15) / 2, 3.0, z1 + 0.09);
    b.box(MP.cab, 0.9, 1.6, 0.6, -5.3, 0.8, -15.8);
    b.plane(hmiMat, 0.5, 0.34, -5.3, 1.3, -15.49);
    b.build(scene, true, true);
    const st = signTex({
      w: 520,
      h: 110,
      bg: '#0B2B4D',
      bd: '#5F8FB8',
      lines: [['TESTE FINAL', 72, 40, 700]],
      center: true,
    });
    const sp = new THREE.Mesh(UG.plane, new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 }));
    sp.scale.set(3.2, 0.68, 1);
    sp.position.set(-8, h + 0.42, z1 + 0.09);
    scene.add(sp);
  }
  box2(-9.4, -6.6, -21, 1.5);
  box2(-11.8, -4.2, -25.8, -15.4);
  return Object.assign(ctx, { XV2, cell1, cell2, xRoll });
}
