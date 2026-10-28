/** Motores W22 das linhas (geometria do CAD oficial WEG) e unidade de produção (motor sobre berço). */
import * as THREE from 'three';
import { Builder } from '../core/builder';
import { slotGeometries, type Models } from '../core/models';

/**
 * Geometria do motor W22 das linhas (versão leve do CAD oficial, carcaça 326T), por slot de material.
 * Em metros reais: eixo em y = 0 ao longo de +x, pés em y = `footY`.
 */
export interface MotorKit {
  paint: THREE.BufferGeometry;
  steel: THREE.BufferGeometry;
  footY: number;
}
export function makeMotorKit(models: Models): MotorKit {
  const g = slotGeometries(models.w22Lo);
  if (!g.paint || !g.steel) throw new Error('w22-326t-lo.glb precisa dos slots paint e steel');
  g.paint.computeBoundingBox();
  return { paint: g.paint, steel: g.steel, footY: g.paint.boundingBox!.min.y };
}

/** Ampliação do motor real para a cena, por unidade de tamanho `s` (s = 1: motor sobre berço da linha). */
const SCALE_PER_S = 2.8;

/**
 * Motor W22 (CAD oficial, versão leve) junto às peças estáticas de `b`, com os pés em (ox, oy, oz),
 * eixo apontando para +x. `s` é o tamanho relativo (1 = motor das linhas).
 */
export function motorParts(
  b: Builder,
  K: { M: { blue: THREE.Material; steel: THREE.Material }; motor: MotorKit },
  s: number,
  ox: number,
  oy: number,
  oz: number,
) {
  const k = SCALE_PER_S * s,
    y = oy - K.motor.footY * k;
  b.geo(K.M.blue, K.motor.paint, ox, y, oz, 0, 0, 0, k);
  b.geo(K.M.steel, K.motor.steel, ox, y, oz, 0, 0, 0, k);
}
export function makeUnitTemplate(K: Parameters<typeof motorParts>[1] & { MP: any }, lo: boolean) {
  const b = new Builder(),
    MP = K.MP;
  const g = new THREE.Group();
  b.box(MP.cradle, 1.8, 0.06, 1.0, 0, 0.03, 0);
  [-0.7, 0, 0.7].forEach((x) => [-1, 1].forEach((s) => b.box(MP.cradle, 0.08, 0.2, 0.08, x, 0.15, s * 0.52)));
  [-1, 1].forEach((s) => b.box(MP.rail, 1.7, 0.12, 0.1, 0, 0.3, s * 0.52));
  if (!lo) {
    [-0.86, 0.86].forEach((x) => b.box(MP.rubber, 0.06, 0.05, 0.86, x, 0.085, 0));
    [-0.86, 0.86].forEach((x) => [-1, 1].forEach((s) => b.cyl(MP.steel, 0.03, 0.08, x, 0.1, s * 0.52, 0, 0, 0, 8)));
  }
  motorParts(b, K, 1, 0, 0.06, 0);
  b.build(g, !lo, true);
  return g;
}
