import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { camRoute } from '../../src/ui/camRoute';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

describe('ui/camRoute (câmera não atravessa a tela do WES)', () => {
  it('mesmo lado da tela: vai direto', () => {
    expect(camRoute(V(0, 5, 10), V(20, 5, 5))).toHaveLength(2);
  });
  it('para trás da tela: passa pelo corredor lateral mais próximo', () => {
    const r = camRoute(V(16, 7, 13), V(21, 6, -20));
    expect(r).toHaveLength(4);
    expect(r[1].x).toBe(3.5);
    expect(r[2].x).toBe(3.5);
    const r2 = camRoute(V(44, 8, 6), V(48, 6, -11));
    expect(r2[1].x).toBe(56);
  });
  it('não altera os pontos de entrada', () => {
    const a = V(1, 2, 3);
    camRoute(a, V(1, 2, -30))[0].x = 99;
    expect(a.x).toBe(1);
  });
});
