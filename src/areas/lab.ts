/** Laboratório de ensaios: bancadas com motor e freio, painéis e mesa de controle. */
import * as THREE from 'three';
import { Builder, UG, std } from '../core/builder';
import { cvs, ctx2d } from '../core/canvas2d';
import { rtex, signTex } from '../core/textures';
import { motorParts } from '../equipment/motor';
import type { AfterCharging } from '../ctx';
export function buildLab(ctx: AfterCharging) {
  const { A, K, LED, MP, box2, floorText, hangSign, hmiMat, imgs, meshMat, plate, rect2, scene, stripeC } = ctx;
  // ---- laboratório de ensaios (bancadas de teste, painéis e mesa de controle)
  rect2(8.5, 34.5, -38.2, -16.4, 0.14);
  floorText('LABORATÓRIO DE ENSAIOS', 'testes de motores · área restrita', 21, -17.6, 9);
  {
    const fz = -16.4;
    for (let x = 8.5; x < 34.4; x += 1.5) {
      A.box(MP.post, 0.07, 1.25, 0.07, x, 0.62, fz);
      if (x < 34.4 - 1.5 && !(x > 19 && x < 22)) A.plane(meshMat, 1.42, 1.05, x + 0.75, 0.62, fz);
    }
    [-1, 1].forEach((s) => {
      const x = s < 0 ? 8.5 : 34.5;
      for (let z = fz; z > -38.2; z -= 1.5) {
        A.box(MP.post, 0.07, 1.25, 0.07, x, 0.62, z);
        if (z - 1.5 > -38.2) A.plane(meshMat, 1.42, 1.05, x, 0.62, z - 0.75, 0, Math.PI / 2, 0);
      }
    });
    A.box(MP.alu, 26, 0.05, 0.05, 21.5, 1.25, fz);
  }
  plate('ÁREA DE ENSAIOS ELÉTRICOS', 'acesso restrito a pessoas autorizadas', 24.6, 1.7, -16.35, 0, 2.6, false);
  /** Acoplamentos das bancadas de ensaio (giram quando `on`). */
  const testCoup: { m: THREE.Mesh; on: boolean }[] = [];
  [13, 21, 29].forEach((x, i) => {
    const z = -28;
    A.box(MP.dark, 4.6, 0.4, 1.8, x, 0.2, z);
    for (let k = 0; k < 5; k++) A.box(MP.steelD, 4.5, 0.02, 0.05, x, 0.41, z - 0.7 + k * 0.35);
    const dr = new Builder();
    motorParts(dr, K, 0.8, 0, 0, 0);
    const g = new THREE.Group();
    dr.build(g, true);
    g.position.set(x - 1.1, 0.4, z);
    scene.add(g);
    A.box(MP.cab, 1.4, 1.15, 1.2, x + 1.4, 0.98, z);
    A.cyl(MP.steelD, 0.5, 1.1, x + 1.4, 1.0, z, 0, 0, Math.PI / 2, 28);
    A.box(MP.steelD, 0.3, 0.25, 0.3, x + 0.45, 0.52, z);
    A.box(MP.alu, 1.0, 0.04, 0.7, x + 0.25, 1.2, z);
    A.plane(MP.poly, 1.0, 0.6, x + 0.25, 0.92, z + 0.35);
    A.plane(MP.poly, 1.0, 0.6, x + 0.25, 0.92, z - 0.35);
    const cpl = new THREE.Mesh(UG.cyl[16], std(0xffffff, 0.35, 0.7, { map: rtex(stripeC, 1, 1, 4) }));
    cpl.scale.set(0.12, 0.42, 0.12);
    cpl.rotation.z = Math.PI / 2;
    cpl.position.set(x + 0.2, 0.92, z);
    cpl.castShadow = true;
    scene.add(cpl);
    testCoup.push({ m: cpl, on: i !== 1 });
    A.box(MP.cab, 1.2, 2.2, 0.7, x - 0.8, 1.1, -33.6);
    A.box(MP.cab, 1.2, 2.2, 0.7, x + 0.6, 1.1, -33.6);
    A.plane(hmiMat, 0.6, 0.4, x - 0.8, 1.6, -33.24);
    A.box(MP.weg, 2.6, 0.1, 0.72, x - 0.1, 2.25, -33.6);
    const bc = new THREE.Mesh(UG.cyl[16], i !== 1 ? LED.blue : LED.on);
    bc.scale.set(0.08, 0.16, 0.08);
    bc.position.set(x + 2.2, 1.75, z + 0.8);
    scene.add(bc);
    A.cyl(MP.dark, 0.025, 1.3, x + 2.2, 1.0, z + 0.8, 0, 0, 0, 8);
    box2(x - 2.4, x + 2.4, z - 1.0, z + 1.0);
    box2(x - 1.5, x + 1.3, -34.0, -33.2);
  });
  // mesa de controle com monitores
  {
    const gr = cvs(320, 200),
      g = ctx2d(gr);
    g.fillStyle = '#0A1E36';
    g.fillRect(0, 0, 320, 200);
    g.strokeStyle = '#5FA6D3';
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= 300; x += 6) {
      const y = 120 - 40 * Math.sin(x / 38) - 12 * Math.sin(x / 9);
      if (x) g.lineTo(10 + x, y);
      else g.moveTo(10, y);
    }
    g.stroke();
    g.fillStyle = '#163B63';
    g.fillRect(10, 150, 300, 36);
    g.fillStyle = '#8FB0D0';
    g.fillRect(16, 160, 120, 14);
    const scm = new THREE.MeshBasicMaterial({ map: rtex(gr, 1, 1), toneMapped: false });
    A.box(MP.frame, 4.0, 0.06, 0.9, 21, 0.78, -20.2);
    [-1, 1].forEach((s) => A.box(MP.frame, 0.06, 0.76, 0.86, 21 + s * 1.95, 0.38, -20.2));
    A.box(MP.cab, 0.6, 0.7, 0.8, 19.6, 0.38, -20.2);
    [-1.1, 0, 1.1].forEach((dx, i) => {
      A.box(MP.dark, 0.9, 0.56, 0.04, 21 + dx, 1.22, -20.45, -0.08, -dx * 0.25, 0);
      const m = new THREE.Mesh(UG.plane, scm);
      m.scale.set(0.84, 0.5, 1);
      m.position.set(21 + dx + Math.sin(-dx * 0.25) * 0.022, 1.22, -20.427 + Math.cos(dx * 0.25) * 0.002);
      m.rotation.set(-0.08, -dx * 0.25, 0);
      scene.add(m);
      A.box(MP.dark, 0.06, 0.3, 0.06, 21 + dx, 0.95, -20.5);
    });
    A.box(MP.dark, 0.45, 0.02, 0.16, 21, 0.82, -19.95);
    box2(18.9, 23.1, -20.7, -19.7);
  }
  hangSign(
    21,
    9,
    -17.2,
    8,
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
        ['LABORATÓRIO DE ENSAIOS', 72, 44, 700],
        ['testes de motores e equipamentos elétricos', 120, 26, 500, '#8FB0D0'],
      ],
    }),
  );
  return Object.assign(ctx, { testCoup });
}
