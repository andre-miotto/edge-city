import { describe, expect, it } from 'vitest';
import { clamp, ease, lerp, prog, rng, smooth5, trapz } from '../../src/core/math';

describe('core/math', () => {
  it('clamp, lerp e prog', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(prog(5, 0, 10)).toBe(0.5);
    expect(prog(-1, 0, 10)).toBe(0);
    expect(prog(20, 0, 10)).toBe(1);
  });
  it('curvas de suavização vão de 0 a 1 sem sair do intervalo', () => {
    for (const f of [ease, smooth5]) {
      expect(f(0)).toBeCloseTo(0);
      expect(f(1)).toBeCloseTo(1);
      for (let u = 0; u <= 1; u += 0.05) {
        expect(f(u)).toBeGreaterThanOrEqual(-1e-9);
        expect(f(u)).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
    expect(trapz(0, 0.2)).toBeCloseTo(0);
    expect(trapz(1, 0.2)).toBeCloseTo(1);
  });
  it('rng é determinístico pela semente (cena igual em toda carga)', () => {
    const a = rng(7),
      b = rng(7);
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    xs.forEach((x) => expect(x >= 0 && x < 1).toBe(true));
  });
});
