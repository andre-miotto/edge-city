/** Materiais compartilhados, texturas de equipamentos, moldes de unidade e colisores. */
import * as THREE from 'three';
import { finGeo, std } from '../core/builder';
import { cvs, ctx2d } from '../core/canvas2d';
import { meshTex, rtex, signTex, stripeTex, tex } from '../core/textures';
import { makeMotorKit, makeUnitTemplate } from '../equipment/motor';
import type { AfterStage } from '../ctx';
/** Retângulo no piso (x0..x1, z0..z1) que a câmera e os pedestres não atravessam. */
export interface Box2 {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Colisor que acompanha um objeto móvel (empilhadeira): fica fora do piso assado (scene/floorBake.ts). */
  dynamic?: boolean;
}
/** Retângulo girado no piso: centro (cx, cz), meia largura `hw`, meia profundidade `hd`, ângulo `ang`. */
export interface RotBox2 {
  cx: number;
  cz: number;
  r: number;
  ang: number;
  hw: number;
  hd: number;
}
export type Collider = Box2 | RotBox2;

export function createMaterials(ctx: AfterStage) {
  const { imgs, models, scene } = ctx;
  // ---------------- materiais
  const M = {
    blue: std(0x71abd1, 0.45, 0.4),
    blueD: std(0x5d94b9, 0.5, 0.4),
    steel: std(0xe2e7ec, 0.25, 0.85),
    steelD: std(0x93a4b4, 0.45, 0.6),
    navy: std(0x42779c, 0.5, 0.5),
    rubber: std(0x5c6a78, 0.9, 0.1),
    dark: std(0x3b5a73, 0.7, 0.3),
    bezel: std(0x384f69, 0.35, 0.6),
  };
  const MP = {
    steel: M.steel,
    steelD: M.steelD,
    rubber: M.rubber,
    dark: std(0x5a6673, 0.6, 0.4),
    cradle: std(0x858f9a, 0.55, 0.6),
    rail: std(0xb9c0c8, 0.35, 0.8),
    frame: std(0x9daab8, 0.5, 0.55),
    post: std(0x838f9b, 0.5, 0.5),
    alu: std(0xdde3e8, 0.32, 0.75),
    sensor: std(0xa1a9b3, 0.45, 0.4),
    cab: std(0xe8ebee, 0.48, 0.2),
    weg: std(0x009ece, 0.42, 0.3),
    panel: std(0xccd3da, 0.62, 0.25),
    roofP: std(0x96a0aa, 0.7, 0.3),
    inner: std(0x3b5366, 0.9, 0),
    poly: std(0xe0f2ff, 0.08, 0, {
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
      userData: { solid: true },
    }),
    glow: new THREE.MeshBasicMaterial({ color: 0xc5dbed }),
    struct: std(0xa2aebb, 0.55, 0.5),
    wood: std(0xccb89c, 0.85, 0),
    pallet: std(0xbaa790, 0.9, 0),
  };
  const MR = {
    body: std(0xeff2f6, 0.42, 0.18),
    accent: std(0x009ece, 0.4, 0.3),
    motor: std(0x727d89, 0.5, 0.5),
    ped: std(0x8493a2, 0.5, 0.5),
    cable: std(0x535f6a, 0.75, 0.1),
    grip: std(0x8f9aa4, 0.4, 0.6),
  };
  const LED = {
    on: new THREE.MeshBasicMaterial({ color: 0xf6fafd }),
    off: new THREE.MeshBasicMaterial({ color: 0x7d8a97 }),
    blue: new THREE.MeshBasicMaterial({ color: 0x77c5ff }),
    amberOff: new THREE.MeshBasicMaterial({ color: 0x958362 }),
  };
  const meshT = rtex(meshTex(), 2.5, 4.6);
  const meshMat = std(0xccd3da, 0.5, 0.6, { map: meshT, alphaTest: 0.5, side: THREE.DoubleSide });
  const wegTex = (() => {
    const t = new THREE.Texture(imgs.weg);
    t.needsUpdate = true;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const wegMat = new THREE.MeshBasicMaterial({ map: wegTex, transparent: true, toneMapped: false });
  const badgeMat = new THREE.MeshStandardMaterial({
    map: signTex({ w: 200, h: 86, bg: '#00579D', r: 8, logo: true, imgs: imgs, lh: 0.62, pad: 46, lines: [] }),
    roughness: 0.5,
  });
  const hmiC = cvs(256, 180),
    hg = ctx2d(hmiC);
  hg.fillStyle = '#0A1E36';
  hg.fillRect(0, 0, 256, 180);
  hg.fillStyle = '#0A5CB0';
  hg.fillRect(0, 0, 256, 28);
  for (let i = 0; i < 4; i++) {
    hg.fillStyle = '#163B63';
    hg.fillRect(14, 40 + i * 32, 228, 24);
    hg.fillStyle = '#5FA6D3';
    hg.fillRect(20, 48 + i * 32, 60 + i * 30, 8);
  }
  const hmiMat = new THREE.MeshBasicMaterial({ map: rtex(hmiC, 1, 1), toneMapped: false });
  const gc = document.createElement('canvas');
  gc.width = gc.height = 256;
  const gg = ctx2d(gc);
  gg.fillStyle = '#1c4c7c';
  gg.fillRect(0, 0, 256, 256);
  gg.fillStyle = '#0b2038';
  for (let r = 30; r <= 118; r += 14) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      gg.save();
      gg.translate(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      gg.rotate(a);
      gg.fillRect(-4, -1.6, 8, 3.2);
      gg.restore();
    }
  }
  const grilleMat = new THREE.MeshStandardMaterial({ map: tex(gc, 4), metalness: 0.3, roughness: 0.6 });
  const bc = document.createElement('canvas');
  bc.width = 512;
  bc.height = 128;
  const bg2 = ctx2d(bc);
  bg2.fillStyle = '#1d2834';
  bg2.fillRect(0, 0, 512, 128);
  bg2.fillStyle = '#2c3a4a';
  for (let i = 0; i < 16; i++) bg2.fillRect(i * 32, 0, 6, 128);
  const beltTexBase = new THREE.CanvasTexture(bc);
  beltTexBase.wrapS = beltTexBase.wrapT = THREE.RepeatWrapping;
  beltTexBase.colorSpace = THREE.SRGBColorSpace;
  const stripeC = stripeTex();
  const rollMat = () => std(0xffffff, 0.35, 0.75, { map: rtex(stripeC, 1, 1, 4) });
  const K0 = {
    /** Motor W22 das linhas (CAD oficial, versão leve). */
    motor: makeMotorKit(models),
    M: M,
    MP: MP,
    MR: MR,
    LED: LED,
    imgs: imgs,
    wegMat: wegMat,
    badgeMat: badgeMat,
    hmiMat: hmiMat,
    grilleMat: grilleMat,
    meshMat: meshMat,
    beltTex: beltTexBase,
    finG: finGeo(0.44, 0.06, 1.45, 36),
    ledGeo: new THREE.SphereGeometry(0.035, 10, 8),
  };
  const K = Object.assign(K0, { unitTpl: makeUnitTemplate(K0, false) });
  const unitLo = makeUnitTemplate(K0, true);
  function mesh(geo, mat, x, y, z, parent?) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }
  const colliders: Collider[] = [];
  const box2 = (x0: number, x1: number, z0: number, z1: number) => colliders.push({ x0, x1, z0, z1 });
  return Object.assign(ctx, {
    K,
    LED,
    M,
    MP,
    MR,
    badgeMat,
    box2,
    colliders,
    grilleMat,
    hmiMat,
    mesh,
    meshMat,
    rollMat,
    stripeC,
    unitLo,
    wegMat,
  });
}
