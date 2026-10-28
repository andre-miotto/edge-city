/** Telas do WES e do assistente de IA no espaço 3D. */
import * as THREE from 'three';
import { Builder } from '../core/builder';
import { glowTex, tex } from '../core/textures';
import { CS } from '../screens/chatScreen';
import { WS, drawWES } from '../screens/wesScreen';
import type { AfterAreaLife } from '../ctx';
export function buildScreens(ctx: AfterAreaLife) {
  const { M, MP, colliders, imgs, maxAniso, mesh, scene } = ctx;
  // ---------------- telas
  function screenMesh(cv: HTMLCanvasElement, w: number, h: number) {
    const t = tex(cv, maxAniso);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    return { m: m, t: t };
  }
  // WES
  const wesCv = document.createElement('canvas');
  wesCv.width = WS.w * WS.s;
  wesCv.height = WS.h * WS.s;
  drawWES(wesCv, imgs);
  const WW = 27.5,
    WH = (WW * WS.h) / WS.w;
  const wes = new THREE.Group();
  wes.position.set(21, 1.3 + WH / 2, -8);
  scene.add(wes);
  const ws = screenMesh(wesCv, WW, WH);
  wes.add(ws.m);
  mesh(new THREE.BoxGeometry(WW + 0.7, WH + 0.7, 0.45), M.bezel, 0, 0, -0.26, wes);
  [-9, 9].forEach((x) => {
    mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), M.steelD, x, -WH / 2 - 0.65, -0.3, wes);
    mesh(new THREE.BoxGeometry(2.4, 0.14, 1.8), M.steel, x, -WH / 2 - 1.23, -0.3, wes);
  });
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(WW * 1.5, WH * 1.6),
    new THREE.MeshBasicMaterial({
      map: glowTex(),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  halo.position.set(0, 0, -0.6);
  wes.add(halo);
  colliders.push({ x0: 21 - WW / 2 - 0.5, x1: 21 + WW / 2 + 0.5, z0: -9, z1: -7.2 });
  // IA
  const chatCv = document.createElement('canvas');
  chatCv.width = CS.w * CS.s;
  chatCv.height = CS.h * CS.s;
  const AW = 10.6,
    AH = (AW * CS.h) / CS.w;
  const ai = new THREE.Group();
  ai.position.set(45.5, 1.3 + AH / 2, -1.5);
  ai.rotation.y = -0.55;
  scene.add(ai);
  const as = screenMesh(chatCv, AW, AH);
  ai.add(as.m);
  mesh(new THREE.BoxGeometry(AW + 0.6, AH + 0.6, 0.4), M.bezel, 0, 0, -0.24, ai);
  mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), M.steelD, 0, -AH / 2 - 0.65, -0.3, ai);
  mesh(new THREE.BoxGeometry(3.0, 0.14, 1.8), M.steel, 0, -AH / 2 - 1.23, -0.3, ai);
  const halo2 = halo.clone();
  halo2.scale.set((AW / WW) * 1.1, AH / WH, 1);
  ai.add(halo2);
  colliders.push({ cx: 45.5, cz: -1.5, r: 6.2, ang: -0.55, hw: AW / 2 + 0.5, hd: 0.9 });
  // estrutura de suporte atrás das telas (vista de quem circula pelos fundos)
  (
    [
      [wes, WW, WH],
      [ai, AW, AH],
    ] as [THREE.Group, number, number][]
  ).forEach((q) => {
    const b = new Builder(),
      w = q[1] + 0.7,
      h = q[2] + 0.7;
    b.plane(MP.panel, w, h, 0, 0, -0.49, 0, Math.PI, 0);
    const n = Math.max(2, Math.round(w / 4.5));
    for (let i = 0; i <= n; i++) {
      const x = -w / 2 + 0.3 + (i * (w - 0.6)) / n;
      b.box(MP.struct, 0.22, h - 0.2, 0.22, x, 0, -0.65);
    }
    [-h / 2 + 0.6, 0, h / 2 - 0.6].forEach((y) => b.box(MP.struct, w - 0.4, 0.18, 0.18, 0, y, -0.62));
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + 0.3 + (i * (w - 0.6)) / n,
        x1 = x0 + (w - 0.6) / n;
      b.beam(MP.struct, x0, -h / 2 + 0.6, -0.66, x1, 0, -0.66, 0.1, 0.1);
      b.beam(MP.struct, x0, h / 2 - 0.6, -0.66, x1, 0, -0.66, 0.1, 0.1);
    }
    b.build(q[0], false, true);
  });
  // mapeamento arte -> tela do WES
  const toW = (x: number, y: number, z?: number) =>
    new THREE.Vector3(((x - WS.ox) / WS.w - 0.5) * WW, (0.5 - (y - WS.oy) / WS.h) * WH, z || 0.06);
  const wesWorld = (x: number, y: number) => wes.localToWorld(toW(x, y, 0.02));
  wes.updateMatrixWorld(true);
  ai.updateMatrixWorld(true);
  return Object.assign(ctx, { AH, AW, WH, WW, ai, as, chatCv, toW, wes, wesWorld });
}
