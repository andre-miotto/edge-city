/** CLP (representação estilizada) que lê o TT-01 e envia ao WES. */
import * as THREE from 'three';
import { tex } from '../core/textures';
import { drawCLP } from '../screens/clpPanel';
import type { AfterCrane } from '../ctx';
export function buildCLP(ctx: AfterCrane) {
  const { M, colliders, imgs, maxAniso, mesh, scene } = ctx;
  // ---------------- CLP WEG
  const clp = new THREE.Group();
  clp.position.set(-4.2, 0, 0.4);
  scene.add(clp);
  mesh(new THREE.BoxGeometry(0.9, 1.3, 0.7), M.steelD, 0, 0.65, 0, clp);
  mesh(new THREE.BoxGeometry(1.6, 0.12, 1.1), M.steel, 0, 0.06, 0, clp);
  mesh(new THREE.BoxGeometry(2.6, 3.05, 0.8), M.navy, 0, 2.82, 0, clp);
  const clpCv = document.createElement('canvas');
  clpCv.width = 480;
  clpCv.height = 560;
  drawCLP(clpCv, 0, imgs);
  const clpTex = tex(clpCv, maxAniso);
  const clpFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.44, 2.85),
    new THREE.MeshStandardMaterial({
      map: clpTex,
      emissive: 0xffffff,
      emissiveMap: clpTex,
      emissiveIntensity: 0.35,
      roughness: 0.6,
    }),
  );
  clpFace.position.set(0, 2.82, 0.41);
  clp.add(clpFace);
  mesh(new THREE.BoxGeometry(0.14, 0.3, 0.3), M.dark, 1.36, 2.8, 0.1, clp);
  colliders.push({ x0: -5.6, x1: -2.8, z0: -0.1, z1: 0.9 });
  return Object.assign(ctx, { clpCv, clpTex });
}
