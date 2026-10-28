import { describe, expect, it } from 'vitest';
import { QS } from '../../src/screens/chatScreen';

describe('screens/chatScreen (roteiro da IA)', () => {
  it('cada pergunta tem um roteiro em ordem: digitação → pedido → ferramentas → resposta', () => {
    for (const q of QS) {
      const p = q.plan;
      expect(p.type[1]).toBeLessThan(p.send);
      expect(p.send).toBeLessThan(p.req[0]);
      p.tools.forEach((t, k) => {
        expect(t[0]).toBeGreaterThanOrEqual(p.req[1]);
        expect(p.rets[k][0]).toBeGreaterThan(t[1]);
      });
      expect(p.cable[0]).toBeGreaterThan(p.rets[p.rets.length - 1][1]);
      expect(p.end).toBeGreaterThan(p.ans[1]);
    }
  });
  it('uma ferramenta MCP por chamada, e só ferramentas que o WES expõe', () => {
    const known = new Set(['tag', 'hist', 'alarm']);
    for (const q of QS) {
      expect(q.tools.length).toBe(q.plan.tools.length);
      q.tools.forEach((t) => expect(known.has(t[1])).toBe(true));
    }
  });
  it('as letras aparecem em ordem durante a digitação', () => {
    for (const q of QS) {
      expect(q.kt).toHaveLength(q.text.length);
      for (let i = 1; i < q.kt.length; i++) expect(q.kt[i]).toBeGreaterThanOrEqual(q.kt[i - 1]);
    }
  });
});
