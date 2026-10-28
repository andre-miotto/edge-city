/** Funções matemáticas e de animação usadas em toda a cena. */

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x)),
  lerp = (a, b, u) => a + (b - a) * u;
export const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const smooth5 = (u) => {
  u = clamp(u, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export function trapz(u, f) {
  u = clamp(u, 0, 1);
  f = f || 0.18;
  const vp = 1 / (1 - f);
  if (u < f) return (vp * u * u) / (2 * f);
  if (u > 1 - f) {
    const w = 1 - u;
    return 1 - (vp * w * w) / (2 * f);
  }
  return vp * (f / 2 + (u - f));
}
