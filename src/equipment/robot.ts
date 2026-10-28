/** Robô articulado de 6 eixos (desenho original) com cinemática inversa simplificada. */
import * as THREE from 'three';
import { Builder, UG, _v1, _v2 } from '../core/builder';
import { clamp } from '../core/math';

export function makeRobot(K, parent, bx, bz, D) {
  const MR = K.MR,
    MP = K.MP;
  const R = { L2: 3.1, L3: 2.9, A1: 0.55, SH: 2.4, dT: 0.8 };
  const root = new THREE.Group();
  root.position.set(bx, 0, bz);
  parent.add(root);
  let b = new Builder();
  b.box(MP.steelD, 2.8, 0.08, 2.8, 0, 0.04, 0);
  if (D)
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 0.26;
      b.cyl(MP.steel, 0.06, 0.08, Math.cos(a) * 1.22, 0.12, Math.sin(a) * 1.22, 0, 0, 0, 6);
    }
  b.box(MR.ped, 1.9, 0.82, 1.9, 0, 0.49, 0);
  [0, 1, 2, 3].forEach((k) => {
    const a = (k * Math.PI) / 2;
    b.box(MR.ped, 0.08, 0.6, 0.5, Math.cos(a) * 0.99, 0.38, Math.sin(a) * 0.99, 0, -a, 0);
  });
  b.cyl(MR.ped, 1.1, 0.08, 0, 0.94, 0, 0, 0, 0, 32);
  b.cone(MR.body, 0.98, 1.06, 0.48, 0, 1.22, 0, 0, 0, 0, 40);
  if (D)
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      b.cyl(MP.steel, 0.035, 0.05, Math.cos(a) * 1.04, 1.0, Math.sin(a) * 1.04, 0, 0, 0, 6);
    }
  b.box(MR.motor, 0.36, 0.3, 0.5, -0.92, 0.6, 0);
  b.box(MP.dark, 0.12, 0.18, 0.3, -1.12, 0.62, 0);
  b.build(root, true);
  // eixo 1: torre
  const tur = new THREE.Group();
  tur.position.y = 1.46;
  root.add(tur);
  b = new Builder();
  b.cyl(MR.body, 0.95, 0.32, 0, 0.16, 0, 0, 0, 0, 40);
  b.box(MR.body, 1.5, 0.5, 1.3, 0.05, 0.5, 0);
  [-1, 1].forEach((s) => {
    b.box(MR.body, 1.3, 1.1, 0.22, 0.3, 0.72, s * 0.68);
    b.cyl(MR.body, 0.62, 0.22, 0.55, 0.94, s * 0.68, Math.PI / 2, 0, 0, 36);
  });
  b.cyl(MR.accent, 0.36, 0.06, 0.55, 0.94, -0.82, Math.PI / 2, 0, 0, 32);
  b.cyl(MR.motor, 0.3, 0.55, 0.55, 0.94, 1.07, Math.PI / 2, 0, 0, 24);
  b.cyl(MR.accent, 0.31, 0.06, 0.55, 0.94, 1.37, Math.PI / 2, 0, 0, 24);
  b.cyl(MR.motor, 0.24, 0.6, -0.62, 0.75, 0.42, 0, 0, 0, 20);
  b.cyl(MR.accent, 0.25, 0.06, -0.62, 1.08, 0.42, 0, 0, 0, 20);
  b.box(MR.body, 0.5, 0.6, 0.5, -0.65, 1.2, 0);
  if (D) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      [-1, 1].forEach((s) =>
        b.cyl(MP.steel, 0.03, 0.04, 0.55 + Math.cos(a) * 0.5, 0.94 + Math.sin(a) * 0.5, s * 0.8, Math.PI / 2, 0, 0, 6),
      );
    }
    b.tube(
      MR.cable,
      [
        [-1.05, -0.6, 0],
        [-0.95, 0.2, 0.2],
        [-0.7, 0.9, 0.5],
        [-0.1, 1.45, 0.52],
        [0.4, 1.55, 0.42],
      ],
      0.07,
      24,
    );
  }
  b.build(tur, true);
  // contrapeso (cilindro de compensação) — atualizado a cada quadro
  const cbH = new THREE.Mesh(UG.cyl[16], MR.motor),
    cbR = new THREE.Mesh(UG.cyl[12], MP.steel);
  cbH.castShadow = cbR.castShadow = true;
  tur.add(cbH);
  tur.add(cbR);
  const cbA = new THREE.Vector3(-0.65, 1.42, 0),
    cbU = new THREE.Vector3(1.0, 0.56, 0);
  // eixo 2: braço
  const sh = new THREE.Group();
  sh.position.set(R.A1, 0.94, 0);
  tur.add(sh);
  b = new Builder();
  const s2 = new THREE.Shape();
  s2.moveTo(0, -0.56);
  s2.lineTo(R.L2, -0.42);
  s2.absarc(R.L2, 0, 0.42, -Math.PI / 2, Math.PI / 2, false);
  s2.lineTo(0, 0.56);
  s2.absarc(0, 0, 0.56, Math.PI / 2, Math.PI * 1.5, false);
  const ua = new THREE.ExtrudeGeometry(s2, { depth: 0.9, bevelEnabled: false, curveSegments: 18 });
  ua.translate(0, 0, -0.45);
  b.geo(MR.body, ua, 0, 0, 0);
  [-1, 1].forEach((s) => {
    b.box(MR.accent, R.L2 * 0.6, 0.44, 0.02, R.L2 * 0.5, 0, s * 0.455);
    b.box(MR.body, R.L2 * 0.5, 0.2, 0.04, R.L2 * 0.5, 0, s * 0.47);
  });
  b.cyl(MR.body, 0.45, 0.98, R.L2, 0, 0, Math.PI / 2, 0, 0, 32);
  if (D) {
    for (let k = 0; k < 5; k++) b.box(MP.dark, 0.08, 0.14, 0.1, 0.5 + k * 0.5, 0.5, 0.5);
    b.tube(
      MR.cable,
      [
        [0.2, 0.62, 0.52],
        [1.2, 0.56, 0.52],
        [2.2, 0.5, 0.52],
        [R.L2 - 0.2, 0.55, 0.55],
      ],
      0.08,
      24,
    );
  }
  b.build(sh, true);
  // eixo 3: antebraço (eixo 4 representado pelo corpo do antebraço)
  const el = new THREE.Group();
  el.position.set(R.L2, 0, 0);
  sh.add(el);
  b = new Builder();
  b.box(MR.body, 1.55, 0.98, 1.08, -0.2, 0.12, 0);
  b.box(MR.accent, 0.9, 0.5, 0.02, -0.25, 0.14, 0.55);
  b.cyl(MR.motor, 0.26, 0.32, 0, 0.14, -0.7, Math.PI / 2, 0, 0, 20);
  b.cyl(MR.accent, 0.27, 0.05, 0, 0.14, -0.88, Math.PI / 2, 0, 0, 20);
  b.cyl(MR.motor, 0.27, 0.5, -1.22, 0.14, 0, 0, 0, Math.PI / 2, 20);
  b.cyl(MR.accent, 0.28, 0.06, -1.5, 0.14, 0, 0, 0, Math.PI / 2, 20);
  b.cone(MR.body, 0.27, 0.36, R.L3 - 0.85, (0.58 + R.L3 - 0.27) / 2, 0, 0, 0, 0, -Math.PI / 2, 28);
  b.cyl(MR.accent, 0.39, 0.1, 0.62, 0, 0, 0, 0, Math.PI / 2, 28);
  [-1, 1].forEach((s) => b.box(MR.body, 0.56, 0.44, 0.09, R.L3 - 0.12, 0, s * 0.25));
  b.cyl(MR.body, 0.21, 0.58, R.L3, 0, 0, Math.PI / 2, 0, 0, 24);
  [-1, 1].forEach((s) => b.cyl(MR.accent, 0.22, 0.04, R.L3, 0, s * 0.31, Math.PI / 2, 0, 0, 24));
  if (D) {
    b.tube(
      MR.cable,
      [
        [-0.6, 0.62, 0.4],
        [0.4, 0.52, 0.38],
        [1.4, 0.44, 0.34],
        [R.L3 - 0.6, 0.36, 0.3],
        [R.L3 - 0.2, 0.14, 0.34],
      ],
      0.07,
      24,
    );
    [0.8, 1.6].forEach((x) => b.box(MP.dark, 0.08, 0.12, 0.1, x, 0.42, 0.35));
  }
  b.build(el, true);
  // eixo 5: punho
  const wr = new THREE.Group();
  wr.position.set(R.L3, 0, 0);
  el.add(wr);
  b = new Builder();
  b.cyl(MR.body, 0.18, 0.3, 0.15, 0, 0, 0, 0, Math.PI / 2, 24);
  b.build(wr, true);
  const tA = new THREE.Group();
  tA.rotation.z = Math.PI / 2;
  wr.add(tA);
  const tB = new THREE.Group();
  tA.add(tB);
  // eixo 6 + garra de preensão para berço (mordentes fecham sob as barras laterais)
  b = new Builder();
  b.cyl(MP.steel, 0.2, 0.07, 0, -0.345, 0, 0, 0, 0, 32);
  b.cyl(MP.dark, 0.24, 0.12, 0, -0.44, 0, 0, 0, 0, 32);
  b.box(MR.grip, 0.6, 0.06, 0.6, 0, -0.53, 0);
  b.box(MR.accent, 1.7, 0.22, 0.42, 0, -0.69, 0);
  [-0.55, 0.55].forEach((x) => b.box(MP.steel, 0.08, 0.06, 2.2, x, -0.55, 0));
  [-1, 1].forEach((s) =>
    [-1, 1].forEach((t) => b.cyl(MR.grip, 0.065, 0.5, t * 0.86, -0.66, s * 0.32, Math.PI / 2, 0, 0, 12)),
  );
  if (D) {
    b.box(MP.dark, 0.3, 0.14, 0.2, 0.3, -0.51, 0.24);
    b.tube(
      MR.cable,
      [
        [0, -0.38, 0.2],
        [0.12, -0.36, 0.34],
        [0.3, -0.46, 0.3],
      ],
      0.025,
      10,
    );
    b.tube(
      MR.cable,
      [
        [0, -0.38, -0.2],
        [0.2, -0.4, -0.3],
        [0.3, -0.47, 0.2],
      ],
      0.025,
      10,
    );
  }
  b.build(tB, true);
  const gLed = new THREE.Mesh(K.ledGeo, K.LED.off);
  gLed.position.set(0.3, -0.51, 0.345);
  tB.add(gLed);
  const jaw = [1, -1].map((s) => {
    const j = new THREE.Group();
    tB.add(j);
    const jb = new Builder();
    jb.box(MR.grip, 1.35, 0.12, 0.14, 0, -0.6, 0);
    [-0.55, 0.55].forEach((x) => {
      jb.box(MR.grip, 0.16, 1.83, 0.08, x, -1.515, 0);
      jb.box(MR.grip, 0.16, 0.1, 0.17, x, -2.38, -s * 0.1);
      jb.box(MP.rubber, 0.16, 0.02, 0.15, x, -2.32, -s * 0.11);
    });
    jb.box(MP.steel, 0.18, 0.08, 0.2, 0, -0.55, 0);
    jb.build(j, true);
    j.userData.s = s;
    return j;
  });
  /** Pose do braço: giro da base `th`, alcance `r`, altura `y` do punho e abertura da garra `open`. */
  function set(th: number, r: number, y: number, open: number) {
    const wy = y + R.dT - R.SH,
      wrr = r - R.A1;
    const Dd = Math.min(Math.hypot(wrr, wy), R.L2 + R.L3 - 1e-3);
    const al = Math.atan2(wy, wrr) + Math.acos(clamp((R.L2 * R.L2 + Dd * Dd - R.L3 * R.L3) / (2 * R.L2 * Dd), -1, 1));
    const be = Math.atan2(wy - R.L2 * Math.sin(al), wrr - R.L2 * Math.cos(al));
    tur.rotation.y = -th;
    sh.rotation.z = al;
    el.rotation.z = be - al;
    wr.rotation.z = -Math.PI / 2 - be;
    tB.rotation.y = th;
    jaw.forEach((j) => (j.position.z = j.userData.s * open));
    // compensador: carcaça presa na torre, haste presa no braço
    _v1
      .copy(cbU)
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), al)
      .add(sh.position);
    _v2.copy(_v1).sub(cbA);
    const L = _v2.length();
    _v2.normalize();
    cbH.scale.set(0.17, 0.85, 0.17);
    cbH.position.copy(cbA).addScaledVector(_v2, 0.425);
    cbH.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v2);
    const rl = Math.max(0.2, L - 0.6);
    cbR.scale.set(0.075, rl, 0.075);
    cbR.position.copy(_v1).addScaledVector(_v2, -rl / 2);
    cbR.quaternion.copy(cbH.quaternion);
  }
  return Object.assign(R, { root, tur, sh, el, wr, tB, gLed, jaw, set });
}
