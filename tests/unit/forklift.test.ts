import { describe, expect, it } from 'vitest';
import {
  FORKLIFT,
  FORKLIFT_HOME,
  forkliftBlocked,
  stepForklift,
  type ForkliftState,
} from '../../src/areas/forkliftPhysics';

const fresh = (): ForkliftState => ({ ...FORKLIFT_HOME, v: 0, steer: 0 });
const free = () => false;
const run = (s: ForkliftState, input: { throttle: number; steer: number }, sec: number, blocked = free) => {
  for (let i = 0; i < Math.round(sec / 0.05); i++) stepForklift(s, input, 0.05, blocked);
  return s;
};

describe('areas/forkliftPhysics', () => {
  it('acelera à frente ao longo do rumo e respeita a velocidade máxima', () => {
    const s = run(fresh(), { throttle: 1, steer: 0 }, 10);
    expect(s.v).toBeCloseTo(FORKLIFT.VMAX, 5);
    expect(s.z).toBeGreaterThan(FORKLIFT_HOME.z + 20); // rumo 0 aponta para +Z
    expect(s.x).toBeCloseTo(FORKLIFT_HOME.x, 5);
  });

  it('dá ré mais devagar e para sozinha sem acelerador', () => {
    const s = run(fresh(), { throttle: -1, steer: 0 }, 6);
    expect(s.v).toBeCloseTo(-FORKLIFT.VREV, 5);
    run(s, { throttle: 0, steer: 0 }, 3);
    expect(s.v).toBe(0);
  });

  it('esterçar à esquerda em movimento aumenta o rumo; parada não gira', () => {
    const parada = run(fresh(), { throttle: 0, steer: 1 }, 2);
    expect(parada.h).toBe(0);
    const s = run(fresh(), { throttle: 1, steer: 1 }, 2);
    expect(s.h).toBeGreaterThan(0.2);
    expect(s.x).toBeGreaterThan(FORKLIFT_HOME.x); // rumo 0 olha para +Z: a esquerda é +X
  });

  it('bloqueada, fica no lugar e zera a velocidade', () => {
    const s = run(fresh(), { throttle: 1, steer: 0 }, 1);
    const antes = { x: s.x, z: s.z };
    run(s, { throttle: 1, steer: 0 }, 1, () => true);
    expect(s.v).toBe(0);
    expect(s.x).toBe(antes.x);
    expect(s.z).toBe(antes.z);
  });

  it('colisão: caixa à frente bloqueia, caixa longe e a área livre não', () => {
    const wall = [{ x0: -60, x1: -56, z0: 6, z1: 8 }];
    expect(forkliftBlocked(wall, null, -58, 3, 0)).toBe(false);
    expect(forkliftBlocked(wall, null, -58, 4.5, 0)).toBe(true); // garfos dentro da caixa
    expect(forkliftBlocked(wall, wall[0], -58, 4.5, 0)).toBe(false); // ignora o próprio colisor
    expect(forkliftBlocked([], null, 70, 0, 0)).toBe(true); // fora do galpão
  });

  it('colisor girado é tratado no referencial dele', () => {
    const rot = [{ cx: -58, cz: 8, r: 1, ang: Math.PI / 2, hw: 0.5, hd: 3 }];
    expect(forkliftBlocked(rot, null, -58, 3, 0)).toBe(false);
    expect(forkliftBlocked(rot, null, -58, 6.5, 0)).toBe(true);
  });
});
