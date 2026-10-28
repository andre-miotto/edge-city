/** Ponte rolante sobre a Linha 2. */
import * as THREE from 'three';
import { Builder } from '../core/builder';
import type { AfterWorkshop } from '../ctx';
export function buildCrane(ctx: AfterWorkshop) {
  const { HZ0, MP, MR, scene } = ctx;
  // ponte rolante (desliza devagar sobre a Linha 2)
  const crane = new THREE.Group();
  scene.add(crane);
  {
    const b = new Builder();
    const zA = HZ0 + 1.2,
      zB = -18.7,
      zm = (zA + zB) / 2,
      L = zB - zA;
    [-0.8, 0.8].forEach((dx) => b.box(MP.weg, 0.5, 1.1, L, dx, 16.15, zm));
    [zA, zB].forEach((z) => b.box(MP.struct, 3.0, 0.6, 0.7, 0, 15.85, z));
    b.build(crane, true, true);
  }
  const trolley = new THREE.Group();
  crane.add(trolley);
  {
    const b = new Builder();
    b.box(MP.dark, 2.4, 0.7, 1.6, 0, 17.0, 0);
    b.box(MR.motor, 0.8, 0.6, 0.6, 0.7, 17.3, 0.6);
    b.cyl(MP.steelD, 0.03, 7.4, -0.25, 12.6, 0, 0, 0, 0, 6);
    b.cyl(MP.steelD, 0.03, 7.4, 0.25, 12.6, 0, 0, 0, 0, 6);
    b.box(MP.weg, 0.7, 0.6, 0.4, 0, 8.7, 0);
    b.box(MP.steel, 0.12, 0.5, 0.12, 0, 8.15, 0);
    b.build(trolley, true, true);
  }
  return Object.assign(ctx, { crane, trolley });
}
