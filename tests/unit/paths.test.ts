import { describe, expect, it } from 'vitest';
import { makePath } from '../../src/logistics/wmrModel';

describe('logistics/makePath (rotas dos WMR)', () => {
  const pts: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 8],
  ];
  const P = makePath(pts, 1.4);

  it('começa e termina nos pontos dados', () => {
    const a = P.at(0, {}),
      b = P.at(P.L, {});
    expect([a.x, a.z]).toEqual([0, 0]);
    expect(b.x).toBeCloseTo(10);
    expect(b.z).toBeCloseTo(8);
  });
  it('o canto arredondado encurta a rota (menor que a soma dos trechos retos)', () => {
    expect(P.L).toBeLessThan(18);
    expect(P.L).toBeGreaterThan(17);
  });
  it('é contínua: passos pequenos nunca saltam', () => {
    let prev = P.at(0, {});
    for (let s = 0.1; s <= P.L; s += 0.1) {
      const q = P.at(s, {});
      expect(Math.hypot(q.x - prev.x, q.z - prev.z)).toBeLessThan(0.11);
      prev = { ...q };
    }
  });
  it('marca a curva e avisa a distância até ela (para o WMR desacelerar)', () => {
    expect(P.at(9.5, {}).curve).toBe(true);
    expect(P.at(2, {}).curve).toBe(false);
    const d = P.nextCurve(2);
    expect(d).toBeGreaterThan(6);
    expect(d).toBeLessThan(8.7);
  });
});
