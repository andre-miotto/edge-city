/** Fecha os setores: gera as instâncias de estoque, junta as malhas estáticas e acende as luzes de destaque. */
import * as THREE from 'three';
import { UG, std, ucyl } from '../core/builder';
import type { AfterSupport } from '../ctx';
export function finishAreas(ctx: AfterSupport) {
  const { A, K, L, M, MP, binGeo, gitFrame, inst, meshMat, mk2, palGeo, scene } = ctx;
  // ---- instâncias (estoque)
  const binMat = std(0xffffff, 0.55, 0.05),
    lblMat = std(0xfafbfb, 0.6, 0, { side: THREE.DoubleSide });
  inst(binGeo, binMat, L.bin, false);
  inst(UG.plane, lblMat, L.lbl, false);
  inst(palGeo, MP.pallet, L.pal, false);
  inst(UG.box, MP.wood, L.crate, true);
  inst(gitFrame, MP.steelD, L.git, true);
  inst(UG.box, meshMat, L.gitM, false);
  inst(UG.box, std(0xd8c2a3, 0.85, 0), L.wrapIn, true);
  inst(UG.box, std(0xf4f7fb, 0.2, 0, { transparent: true, opacity: 0.42, depthWrite: false }), L.wrap, false);
  inst(ucyl(24), std(0xddb37c, 0.32, 0.9), L.spool, true);
  inst(ucyl(24), MP.steelD, L.spoolF, true);
  inst(ucyl(28), std(0x88b0ce, 0.5, 0.4), L.shield, true);
  inst(K.finG, M.blue, L.frame, false);
  inst(ucyl(12), M.steel, L.shaft, true);
  A.build(scene, true, true);
  mk2.build(scene, false, true);
  // iluminação de destaque por setor (sem sombras)
  [
    [50, 19, 33, 0.9, 0.62],
    [22, 19, -26, 0.75, 0.6],
    [47, 18.5, -24, 0.55, 0.55],
  ].forEach((l) => {
    const s = new THREE.SpotLight(0xf9fbff, l[3] * 1.76, 34, l[4], 0.85, 0); // 1,76: conversão da intensidade do r128 (veja scene/stage.js);
    s.position.set(l[0], l[1], l[2]);
    s.target.position.set(l[0], 0, l[2]);
    scene.add(s);
    scene.add(s.target);
  });
  return ctx;
}
