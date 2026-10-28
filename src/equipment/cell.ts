/** Célula robotizada genérica: alimentação, robô, cercamento, esteira, inspeção e ciclo de produção. */
import * as THREE from 'three';
import { Builder, UG } from '../core/builder';
import { txt, ctx2d } from '../core/canvas2d';
import { clamp, lerp, smooth5, trapz } from '../core/math';
import { picEar, picGlasses, picHelmet, signTex } from '../core/textures';
import { motorParts } from './motor';
import { makeRobot } from './robot';

export const CELL = {
  T: 16,
  D: 3.375,
  TOP: 2.71,
  GR: 1.75,
  PX: -25.0,
  PZ: -7.6,
  BX: -21.6,
  BZ: -4.6,
  PLX: -21.5,
  XT: -8.0,
  IX0: -46,
  IX1: -23.6,
  XI: -14.75,
  ex0: -26.2,
  ex1: -9.8,
  ecy: 2.3,
  er: 0.38,
  bw: 2.4,
};
export function beltPos(pt) {
  const C = CELL;
  const m = Math.floor((pt - 11.3) / C.T);
  const l = pt - 11.3 - m * C.T;
  return (m + (l < 13 ? trapz(l / 13, 0.12) : 1)) * C.D;
}
export function beltMoving(pt) {
  const l = (((pt - 11.3) % CELL.T) + CELL.T) % CELL.T;
  return l < 13;
}
/** Pose do robô da célula: giro, alcance, altura do punho, abertura da garra e se está em movimento. */
export interface RobotPose {
  th: number;
  r: number;
  y: number;
  jaw: number;
  moving: boolean;
}
type PoseKey = 'H' | 'PA' | 'P' | 'QA' | 'Q';
/** Trecho do ciclo do robô: [início, fim, pose de partida, pose de chegada, arco por cima?]. */
type RobotSeg = [number, number, PoseKey, PoseKey, number?];

export interface CellOpts {
  detail?: boolean;
  rollMat: THREE.MeshStandardMaterial;
  /** false: sem os armários elétricos ao lado (Linha 2). */
  cabinets?: boolean;
  /** false: sem o recinto do teste final. */
  exitBox?: boolean;
  /** Posição da unidade depois da esteira (transferência); false quando sai de cena. */
  exit?: (c: number, pt: number, v: THREE.Vector3) => boolean;
}

export function buildCell(K, cg: THREE.Group, o: CellOpts) {
  const C = CELL,
    MP = K.MP,
    D = o.detail;
  const S = new Builder();
  // ---- alimentação (transportador de roletes) com sensores de presença, leitor de ID e batente
  const rollB = new Builder();
  for (let x = C.IX0 + 0.15; x < C.IX1 - 0.1; x += 0.3)
    rollB.cyl(o.rollMat, 0.09, 1.5, x, C.TOP - 0.09, C.PZ, Math.PI / 2, 0, 0, 12);
  rollB.build(cg, false, true);
  const IL = C.IX1 - C.IX0,
    IM = (C.IX0 + C.IX1) / 2;
  [-1, 1].forEach((s) => {
    S.box(MP.frame, IL, 0.24, 0.07, IM, C.TOP - 0.14, C.PZ + s * 0.82);
    S.box(MP.frame, IL, 0.04, 0.12, IM, C.TOP - 0.02, C.PZ + s * 0.86);
  });
  for (let x = C.IX0 + 1; x < C.IX1; x += 2.4) {
    [-1, 1].forEach((s) => {
      S.box(MP.frame, 0.1, C.TOP - 0.25, 0.1, x, (C.TOP - 0.25) / 2, C.PZ + s * 0.76);
      S.box(MP.steelD, 0.24, 0.02, 0.24, x, 0.01, C.PZ + s * 0.76);
    });
    S.box(MP.frame, 0.08, 0.08, 1.5, x, 0.55, C.PZ);
  }
  S.box(MP.dark, 0.14, 0.26, 0.5, C.IX1 - 0.25, C.TOP + 0.04, C.PZ);
  S.box(MP.steelD, 0.3, 0.4, 0.3, C.IX1 - 0.25, C.TOP - 0.4, C.PZ);
  const drv = new Builder();
  motorParts(drv, K, 0.32, 0, 0, 0);
  const dg = new THREE.Group();
  drv.build(dg, true);
  dg.position.set(-33, 1.55, C.PZ - 1.02);
  cg.add(dg);
  S.box(MP.steelD, 0.5, 0.06, 0.5, -33, 1.53, C.PZ - 1.02);
  S.box(MP.dark, 0.3, 0.34, 0.3, -32.6, 2.0, C.PZ - 0.95);
  const leds: THREE.Mesh[] = [];
  function led(x, y, z, mat?) {
    const m = new THREE.Mesh(K.ledGeo, mat || K.LED.off);
    m.position.set(x, y, z);
    cg.add(m);
    leds.push(m);
    return m;
  }
  const pres = [-25.75, -24.25].map((x) => {
    S.box(MP.steelD, 0.06, 0.8, 0.06, x, 2.75, C.PZ - 1.12);
    S.box(MP.sensor, 0.12, 0.1, 0.09, x, 3.0, C.PZ - 1.06);
    S.box(MP.steelD, 0.05, 0.6, 0.05, x, 2.85, C.PZ + 1.12);
    S.box(MP.alu, 0.08, 0.08, 0.02, x, 3.0, C.PZ + 1.1);
    return led(x, 3.07, C.PZ - 1.015);
  });
  [-1, 1].forEach((s) => S.box(MP.steelD, 0.1, 4.95, 0.1, -28.3, 2.475, C.PZ + s * 1.2));
  S.box(MP.steelD, 0.12, 0.12, 2.5, -28.3, 4.95, C.PZ);
  S.box(MP.sensor, 0.32, 0.12, 0.24, -28.3, 4.83, C.PZ);
  const idLed = led(-28.13, 4.83, C.PZ + 0.08);
  // ---- robô
  const R = makeRobot(K, cg, C.BX, C.BZ, D);
  // ---- cercamento (tela), porta intertravada, cortina de luz e sinaleiro
  const fence = new Builder();
  function fenceRun(x0, z0, x1, z1, skip?) {
    const L = Math.hypot(x1 - x0, z1 - z0),
      n = Math.max(1, Math.round(L / 1.5)),
      dx = (x1 - x0) / n,
      dz = (z1 - z0) / n,
      ang = Math.atan2(-(z1 - z0), x1 - x0);
    for (let i = 0; i <= n; i++) {
      const x = x0 + dx * i,
        z = z0 + dz * i;
      fence.box(MP.post, 0.1, 3.1, 0.1, x, 1.55, z);
      fence.box(MP.steelD, 0.22, 0.02, 0.22, x, 0.01, z);
    }
    for (let i = 0; i < n; i++) {
      const x = x0 + dx * (i + 0.5),
        z = z0 + dz * (i + 0.5),
        w = L / n - 0.12;
      if (skip && skip(i)) continue;
      fence.plane(K.meshMat, w, 2.8, x, 1.56, z, 0, ang, 0);
      [0.16, 2.96].forEach((y) => fence.box(MP.post, w, 0.05, 0.05, x, y, z, 0, ang, 0));
    }
  }
  fenceRun(-31.5, -12.5, -17, -12.5);
  fenceRun(-31.5, -12.5, -31.5, -8.75);
  fenceRun(-31.5, -6.45, -31.5, -1.7);
  fenceRun(-17, -12.5, -17, -1.7, (i) => i === 1);
  const DZ = -12.5 + (10.8 / 7) * 1.5;
  fence.build(cg, true, true);
  // porta (painel azul) na lateral direita, com chave de segurança
  [-1, 1].forEach((s) => S.box(MP.weg, 0.07, 2.75, 0.07, -17, 1.56, DZ + s * 0.7));
  [0.2, 2.92].forEach((y) => S.box(MP.weg, 0.07, 0.07, 1.42, -17, y, DZ));
  S.plane(K.meshMat, 1.3, 2.66, -16.99, 1.56, DZ, 0, Math.PI / 2, 0);
  S.box(MP.steel, 0.06, 0.5, 0.06, -16.92, 1.5, DZ + 0.5);
  S.box(MP.sensor, 0.1, 0.18, 0.12, -16.93, 1.95, DZ + 0.62);
  // cortina de luz na entrada da alimentação (demonstrativa)
  [-1, 1].forEach((s) => {
    S.box(MP.sensor, 0.07, 4.3, 0.07, -31.5, 2.65, C.PZ + s * 1.0);
  });
  const lcLed = [led(-31.43, 4.75, C.PZ + 1.0), led(-31.43, 4.75, C.PZ - 1.0)];
  // sinaleiro
  S.cyl(MP.dark, 0.05, 0.9, -17, 3.5, -1.75, 0, 0, 0, 12);
  const tw = [0x2f8fff, 0xffffff, 0xf2a33a].map((c, i) => {
    const m = new THREE.Mesh(UG.cyl[16], K.LED.off);
    m.scale.set(0.085, 0.15, 0.085);
    m.position.set(-17, 4.05 + 0.16 * (2 - i), -1.75);
    cg.add(m);
    return m;
  });
  S.cyl(MP.dark, 0.09, 0.05, -17, 4.56, -1.75, 0, 0, 0, 16);
  // painel de operação ao lado da porta
  S.box(MP.steelD, 0.12, 1.1, 0.12, -16.4, 0.55, -3.2);
  S.box(MP.cab, 0.5, 0.4, 0.36, -16.4, 1.25, -3.2, 0, 0, -0.35);
  S.plane(K.hmiMat, 0.36, 0.24, -16.22, 1.3, -3.2, 0, Math.PI / 2, 0.35);
  // ---- esteira (correia) com proteção frontal transparente
  const elen = C.ex1 - C.ex0,
    em = (C.ex0 + C.ex1) / 2;
  const beltTex = K.beltTex.clone();
  beltTex.needsUpdate = true;
  beltTex.repeat.set(elen / 1.6, 1);
  const belt = new THREE.Mesh(
    UG.box,
    new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.85, metalness: 0.05 }),
  );
  belt.scale.set(elen, 0.1, C.bw);
  belt.position.set(em, C.ecy + C.er - 0.02, 0);
  belt.receiveShadow = true;
  cg.add(belt);
  S.box(MP.rubber, elen, 0.08, C.bw, em, C.ecy - C.er + 0.02, 0);
  const rollers = [C.ex0, C.ex1].map((x) => {
    const r = new THREE.Mesh(UG.cyl[32], MP.steel);
    r.scale.set(C.er, C.bw + 0.2, C.er);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, C.ecy, 0);
    r.castShadow = r.receiveShadow = true;
    cg.add(r);
    return r;
  });
  for (let x = C.ex0 + 1.4; x < C.ex1 - 0.8; x += 1.6)
    S.cyl(MP.steelD, 0.16, C.bw, x, C.ecy + C.er - 0.2, 0, Math.PI / 2, 0, 0, 16);
  [-1, 1].forEach((s) => {
    S.box(MP.steelD, elen + 0.9, 0.38, 0.12, em, C.ecy + 0.05, s * (C.bw / 2 + 0.16));
    S.box(MP.alu, elen, 0.1, 0.06, em, C.TOP + 0.07, s * 1.22);
    for (let x = C.ex0 + 0.6; x < C.ex1; x += 2.0) S.box(MP.steelD, 0.05, 0.18, 0.12, x, C.TOP - 0.04, s * 1.3);
  });
  [C.ex0 + 1.2, em, C.ex1 - 1.2].forEach((x) => {
    [-1, 1].forEach((s) => {
      S.box(MP.steelD, 0.2, C.ecy - 0.1, 0.2, x, (C.ecy - 0.1) / 2, s * (C.bw / 2 + 0.1));
      S.box(MP.steelD, 0.34, 0.02, 0.34, x, 0.01, s * (C.bw / 2 + 0.1));
    });
    S.box(MP.steelD, 0.14, 0.14, C.bw + 0.2, x, 0.7, 0);
  });
  // proteção de policarbonato (lado do corredor)
  const gx0 = -25.6,
    gx1 = -17.2;
  S.plane(MP.poly, gx1 - gx0, 1.5, (gx0 + gx1) / 2, 3.65, 1.55);
  for (let x = gx0; x <= gx1 + 0.01; x += (gx1 - gx0) / 4) S.box(MP.alu, 0.05, 1.6, 0.05, x, 3.62, 1.55);
  [2.88, 4.42].forEach((y) => S.box(MP.alu, gx1 - gx0, 0.05, 0.05, (gx0 + gx1) / 2, y, 1.55));
  // ---- inspeção visual (sensores demonstrativos)
  [-1, 1].forEach((s) => {
    S.box(MP.frame, 0.18, 5.3, 0.18, C.XI, 2.65, s * 1.78);
    S.box(MP.steelD, 0.4, 0.02, 0.4, C.XI, 0.01, s * 1.78);
    S.box(MP.sensor, 0.12, 1.3, 0.1, C.XI, 3.6, s * 1.62);
  });
  S.box(MP.frame, 0.32, 0.3, 3.9, C.XI, 5.3, 0);
  [-0.5, 0.5].forEach((z) => {
    S.box(MP.sensor, 0.24, 0.26, 0.3, C.XI, 5.02, z);
    S.cyl(MP.dark, 0.07, 0.06, C.XI, 4.87, z, 0, 0, 0, 16);
  });
  const lbMat = new THREE.MeshBasicMaterial({ color: 0xe9f1f8 });
  [-1, 1].forEach((s) => {
    const m = new THREE.Mesh(UG.box, lbMat);
    m.scale.set(0.05, 1.2, 0.04);
    m.position.set(C.XI, 3.6, s * 1.565);
    cg.add(m);
  });
  const scan = new THREE.Mesh(
    UG.plane,
    new THREE.MeshBasicMaterial({
      color: 0xf6fafd,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  scan.scale.set(0.05, 1.5, 1);
  scan.rotation.x = -Math.PI / 2;
  scan.position.set(C.XI, 4.4, 0);
  cg.add(scan);
  const insLed = [led(C.XI + 0.13, 5.02, 0.5), led(C.XI + 0.13, 5.02, -0.5)];
  // ---- recinto de montagem (origem dos motores)
  const W = new Builder();
  function enclosure(x0, x1, z0, z1, h, openFace, oz0, oz1, oh, title) {
    const t = 0.15;
    W.box(MP.panel, x1 - x0, h, t, (x0 + x1) / 2, h / 2, z0);
    W.box(MP.panel, x1 - x0, h, t, (x0 + x1) / 2, h / 2, z1);
    if (openFace === 'x1') {
      W.box(MP.panel, t, h, oz0 - z0, x1, h / 2, (z0 + oz0) / 2);
      W.box(MP.panel, t, h, z1 - oz1, x1, h / 2, (oz1 + z1) / 2);
      W.box(MP.panel, t, h - oh, oz1 - oz0, x1, (h + oh) / 2, (oz0 + oz1) / 2);
      W.box(MP.panel, t, h, z1 - z0, x0, h / 2, (z0 + z1) / 2);
    } else {
      W.box(MP.panel, t, h, oz0 - z0, x0, h / 2, (z0 + oz0) / 2);
      W.box(MP.panel, t, h, z1 - oz1, x0, h / 2, (oz1 + z1) / 2);
      W.box(MP.panel, t, h - oh, oz1 - oz0, x0, (h + oh) / 2, (oz0 + oz1) / 2);
      W.box(MP.panel, t, h, z1 - z0, x1, h / 2, (z0 + z1) / 2);
    }
    W.box(MP.roofP, x1 - x0 + 0.2, 0.12, z1 - z0 + 0.2, (x0 + x1) / 2, h + 0.06, (z0 + z1) / 2);
    W.box(MP.weg, x1 - x0 + 0.02, 0.35, t + 0.02, (x0 + x1) / 2, h - 0.3, z1);
    W.box(MP.weg, x1 - x0 + 0.02, 0.35, t + 0.02, (x0 + x1) / 2, h - 0.3, z0);
    const fx = openFace === 'x1' ? x1 : x0;
    W.box(MP.weg, t + 0.02, 0.35, z1 - z0, fx, h - 0.3, (z0 + z1) / 2);
    W.plane(
      MP.inner,
      z1 - z0 - 0.4,
      h - 0.4,
      openFace === 'x1' ? x1 - 2.2 : x0 + 2.2,
      h / 2,
      (z0 + z1) / 2,
      0,
      openFace === 'x1' ? Math.PI / 2 : -Math.PI / 2,
      0,
    );
    // janela com luz interna
    W.plane(MP.glow, (x1 - x0) * 0.5, 0.9, (x0 + x1) / 2, 3.0, z1 + 0.09);
    W.box(MP.alu, (x1 - x0) * 0.5 + 0.1, 0.06, 0.1, (x0 + x1) / 2, 3.47, z1 + 0.08);
    W.box(MP.alu, (x1 - x0) * 0.5 + 0.1, 0.06, 0.1, (x0 + x1) / 2, 2.53, z1 + 0.08);
    const st = signTex({ w: 520, h: 110, bg: '#0B2B4D', bd: '#5F8FB8', lines: [[title, 72, 40, 700]], center: true });
    const sm = new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 });
    const sp = new THREE.Mesh(UG.plane, sm);
    sp.scale.set(3.2, 0.68, 1);
    sp.position.set(fx + (openFace === 'x1' ? 0.09 : -0.09), h + 0.4, (oz0 + oz1) / 2);
    sp.rotation.y = openFace === 'x1' ? Math.PI / 2 : -Math.PI / 2;
    cg.add(sp);
  }
  enclosure(-50, -40, -11.5, -3.5, 5.2, 'x1', C.PZ - 1.1, C.PZ + 1.1, 4.7, 'MONTAGEM');
  if (o.exitBox) enclosure(-9.6, -3.2, -2.4, 2.4, 5.0, 'x0', -1.45, 1.45, 4.6, 'EMBALAGEM');
  W.build(cg, true, true);
  // ---- painéis elétricos da célula (atrás do cercamento)
  let cabLed: THREE.Mesh | null = null;
  if (o.cabinets !== false) {
    const cabX = [-30.4, -29.1, -27.8];
    cabX.forEach((x, i) => {
      S.box(MP.cab, 1.2, 2.3, 0.8, x, 1.25, -14.6);
      S.box(MP.weg, 1.22, 0.1, 0.82, x, 0.05, -14.6);
      S.box(MP.weg, 1.22, 0.12, 0.82, x, 2.46, -14.6);
      S.box(MP.dark, 0.012, 2.1, 0.01, x, 1.25, -14.195);
      S.box(MP.steel, 0.04, 0.3, 0.05, x + 0.48, 1.3, -14.17);
      [0.25, 0.42].forEach((dx, k) =>
        S.cyl(k ? MP.weg : MP.alu, 0.035, 0.04, x - 0.35 + dx, 2.05, -14.18, Math.PI / 2, 0, 0, 12),
      );
    });
    S.plane(K.hmiMat, 0.42, 0.3, -30.4, 1.65, -14.19);
    cabLed = led(-29.1 - 0.1, 2.05, -14.17, K.LED.blue);
    const badge = new THREE.Mesh(UG.plane, K.badgeMat);
    badge.scale.set(0.42, 0.18, 1);
    badge.position.set(-29.1 + 0.2, 2.12, -14.19);
    cg.add(badge);
  }
  if (D) {
    const lt = signTex({
      w: 560,
      h: 120,
      bg: '#EAF3FB',
      bd: '#5F8FB8',
      lines: [
        ['CÉLULA ROBOTIZADA 01', 52, 34, 700, '#0B2B4D'],
        ['Acesso somente com o robô parado', 92, 22, 600, '#3B5570'],
      ],
      center: true,
    });
    const lp = new THREE.Mesh(UG.plane, new THREE.MeshStandardMaterial({ map: lt, roughness: 0.5 }));
    lp.scale.set(3.6, 0.77, 1);
    lp.position.set(-23.2, 2.45, -12.44);
    cg.add(lp);
    const ep = signTex({
      w: 300,
      h: 330,
      bg: '#ffffff',
      bd: '#0A5CB0',
      bw: 4,
      lines: [['USO OBRIGATÓRIO', 300, 26, 700, '#0A3C6E']],
      center: true,
    });
    const epc = ctx2d(ep.image);
    epc.setTransform(2, 0, 0, 2, 0, 0);
    (
      [
        [75, picHelmet],
        [150, picGlasses],
        [225, picEar],
      ] as [number, (g: CanvasRenderingContext2D, x: number, y: number, r: number) => void][]
    ).forEach((p) => {
      epc.beginPath();
      epc.arc(p[0], 120, 34, 0, 7);
      epc.fillStyle = '#0A5CB0';
      epc.fill();
      p[1](epc, p[0], 120, 34);
    });
    txt(epc, 'capacete · óculos · protetor', 150, 212, 17, 600, '#3B5570', 'center');
    ep.needsUpdate = true;
    const epm = new THREE.Mesh(UG.plane, new THREE.MeshStandardMaterial({ map: ep, roughness: 0.5 }));
    epm.scale.set(0.9, 0.99, 1);
    epm.position.set(-16.93, 2.05, -8.6);
    epm.rotation.y = Math.PI / 2;
    cg.add(epm);
  }
  S.build(cg, true, true);
  // ---- unidades (motores sobre berços)
  const NU = 8,
    units: THREE.Object3D[] = [];
  for (let i = 0; i < NU; i++) {
    const u = K.unitTpl.clone();
    u.visible = false;
    cg.add(u);
    units.push(u);
  }
  const P = {
    pick: { th: Math.atan2(C.PZ - C.BZ, C.PX - C.BX), r: Math.hypot(C.PX - C.BX, C.PZ - C.BZ) },
    place: { th: Math.atan2(-C.BZ, C.PLX - C.BX) - Math.PI * 2, r: Math.hypot(C.PLX - C.BX, -C.BZ) },
  };
  const yL = C.TOP + C.GR,
    yA = yL + 1.1;
  const POSE: Record<PoseKey, [number, number, number]> = {
    H: [(P.pick.th + P.place.th) / 2, 3.3, 6.1],
    PA: [P.pick.th, P.pick.r, yA],
    P: [P.pick.th, P.pick.r, yL],
    QA: [P.place.th, P.place.r, yA],
    Q: [P.place.th, P.place.r, yL],
  };
  const SEG: RobotSeg[] = [
    [0, 2.0, 'H', 'PA'],
    [2.0, 3.2, 'PA', 'P'],
    [3.2, 4.0, 'P', 'P'],
    [4.0, 5.2, 'P', 'PA'],
    [5.2, 8.6, 'PA', 'QA', 1],
    [8.6, 9.8, 'QA', 'Q'],
    [9.8, 10.5, 'Q', 'Q'],
    [10.5, 11.5, 'Q', 'QA'],
    [11.5, 13.5, 'QA', 'H'],
    [13.5, 16, 'H', 'H'],
  ];
  const JO = 0.95,
    JC = 0.63;
  function robotAt(tau: number, o2: RobotPose): RobotPose {
    let s = SEG[SEG.length - 1];
    for (const q of SEG)
      if (tau >= q[0] && tau < q[1]) {
        s = q;
        break;
      }
    const u = smooth5((tau - s[0]) / (s[1] - s[0])),
      a = POSE[s[2]],
      b2 = POSE[s[3]];
    o2.th = lerp(a[0], b2[0], u);
    o2.r = lerp(a[1], b2[1], u);
    o2.y = lerp(a[2], b2[2], u);
    if (s[4]) {
      const k = Math.sin(Math.PI * u);
      o2.y += 0.35 * k;
      o2.r -= 0.7 * k;
    }
    o2.jaw =
      tau < 3.2
        ? JO
        : tau < 4.0
          ? lerp(JO, JC, smooth5((tau - 3.2) / 0.8))
          : tau < 9.8
            ? JC
            : tau < 10.5
              ? lerp(JC, JO, smooth5((tau - 9.8) / 0.7))
              : JO;
    o2.moving = !(s[2] === s[3]);
    return o2;
  }
  const rp: RobotPose = { th: 0, r: 0, y: 0, jaw: 0, moving: false };
  // posição de cada unidade pelo índice do ciclo (sem saltos: cada etapa começa onde a anterior terminou)
  function unitAt(c: number, pt: number, v: THREE.Vector3): boolean {
    const t0 = c * C.T;
    if (pt < t0 - 14.5) return false;
    if (pt < t0 + 4.0) {
      const x = lerp(C.IX0 + 2, C.PX, trapz((pt - (t0 - 14.5)) / 13.5, 0.2));
      v.set(x, C.TOP, C.PZ);
      return x > -41.3;
    }
    if (pt < t0 + 9.8) {
      robotAt(pt - t0, rp);
      v.set(C.BX + rp.r * Math.cos(rp.th), rp.y - C.GR, C.BZ + rp.r * Math.sin(rp.th));
      return true;
    }
    const x = C.PLX + beltPos(pt) - c * C.D;
    if (x < C.XT - 1e-6) {
      v.set(x, C.TOP, 0);
      return true;
    }
    return o.exit ? o.exit(c, pt, v) : false;
  }
  const tv = new THREE.Vector3();
  let infOff = 0,
    lastPt: number | null = null;
  function update(pt: number, running: boolean) {
    const c0 = Math.floor(pt / C.T),
      tau = pt - c0 * C.T;
    robotAt(tau, rp);
    R.set(rp.th, rp.r, rp.y, rp.jaw);
    let atPick = false,
      atIns = false,
      idNear = false;
    const bm = beltMoving(pt);
    for (let c = c0 - 6; c <= c0 + 1; c++) {
      const u = units[((c % NU) + NU) % NU];
      const vis = unitAt(c, pt, tv);
      u.visible = vis;
      if (!vis) continue;
      u.position.copy(tv);
      if (tv.z === C.PZ && Math.abs(tv.x - C.PX) < 0.35 && pt < c * C.T + 4.0) atPick = true;
      if (tv.z === C.PZ && Math.abs(tv.x + 28.3) < 1.1) idNear = true;
      if (tv.z === 0 && Math.abs(tv.x - C.XI) < 0.05 && !bm) atIns = true;
    }
    // roletes da alimentação: velocidade da unidade que está chegando
    let vInf = 0;
    for (let c = c0; c <= c0 + 1; c++) {
      const t0 = c * C.T;
      if (pt > t0 - 14.5 && pt < t0 - 1.0) {
        const a = lerp(C.IX0 + 2, C.PX, trapz((pt - (t0 - 14.5)) / 13.5, 0.2)),
          b2 = lerp(C.IX0 + 2, C.PX, trapz((pt + 0.05 - (t0 - 14.5)) / 13.5, 0.2));
        vInf = Math.max(vInf, (b2 - a) / 0.05);
      }
    }
    if (lastPt !== null) infOff += (vInf * (pt - lastPt)) / (2 * Math.PI * 0.09);
    lastPt = pt;
    if (o.rollMat.map) o.rollMat.map.offset.x = -infOff;
    const bp = beltPos(pt);
    beltTex.offset.x = -(bp / 1.6) % 1;
    rollers.forEach((r) => (r.rotation.y = -bp / C.er));
    pres.forEach((l) => (l.material = atPick ? K.LED.on : K.LED.off));
    idLed.material = idNear && (pt * 6) % 1 < 0.5 ? K.LED.on : K.LED.off;
    insLed.forEach((l) => (l.material = atIns ? K.LED.on : K.LED.off));
    if (atIns) {
      const l = (((pt - 8.3) % C.T) + C.T) % C.T;
      scan.material.opacity = 0.55 * Math.sin(Math.PI * clamp(l / 3, 0, 1));
      scan.position.x = C.XI + Math.sin(l * 2.2) * 0.95;
      lbMat.color.setHex(0xffffff);
    } else {
      scan.material.opacity = 0;
      lbMat.color.setHex(0xcfdbe5);
    }
    lcLed.forEach((l) => (l.material = K.LED.on));
    R.gLed.material = rp.jaw < 0.7 ? K.LED.blue : K.LED.off;
    tw[0].material = running ? K.LED.blue : K.LED.off;
    tw[1].material = running && rp.moving && (pt * 2.5) % 1 < 0.6 ? K.LED.on : K.LED.off;
    tw[2].material = K.LED.amberOff;
    if (cabLed) cabLed.material = running ? K.LED.blue : K.LED.off;
    return { atPick: atPick, atIns: atIns, belt: bm, robot: rp };
  }
  return { robot: R, unitAt, update };
}
