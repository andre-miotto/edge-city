/** Rotas da câmera entre dois pontos (sem dependência do navegador: testável em tests/unit). */
import * as THREE from 'three';

/** Atrás da tela do WES (laboratório, Linha 3) só se chega pelos corredores laterais, sem atravessar a tela. */
export function camRoute(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3[] {
  const back = (p: THREE.Vector3) => p.z < -9.4;
  if (back(a) === back(b)) return [a.clone(), b.clone()];
  const cx = (a.x + b.x) / 2 > 30 ? 56 : 3.5,
    y = 7;
  const f = new THREE.Vector3(cx, y, 3),
    k = new THREE.Vector3(cx, y, -12.5);
  return back(a) ? [a.clone(), k, f, b.clone()] : [a.clone(), f, k, b.clone()];
}
