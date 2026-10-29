/**
 * Movimento da empilhadeira: cinemática de bicicleta (dirige com a velocidade, não gira parada) e colisão da
 * carroceria, aproximada por três círculos ao longo do eixo, contra os colisores da cena.
 * Sem dependência de three: o modelo e a câmera ficam em areas/forklift.ts e ui/drive.ts.
 */
import { clamp } from '../core/math';
import type { Collider } from '../scene/materials';

export const FORKLIFT = {
  /** Distância entre eixos (m). */
  WB: 1.4,
  /** Raio dos círculos de colisão (m). */
  R: 0.8,
  /** Velocidade máxima à frente e de ré (m/s). */
  VMAX: 4.2,
  VREV: 2.2,
  /** Aceleração, frenagem (acelerador contrário ao movimento) e desaceleração livre (m/s²). */
  ACC: 3.2,
  BRAKE: 7,
  COAST: 2.4,
  /** Esterçamento máximo (rad) e velocidade de giro do volante (rad/s). */
  STEER_MAX: 0.6,
  STEER_RATE: 2.4,
  WHEEL_R: 0.3,
};

/** Centros dos círculos de colisão, em metros à frente do centro entre os eixos (de trás do contrapeso à ponta dos garfos). */
export const FORKLIFT_SPOTS = [-0.3, 0.9, 2.0];

/** Onde a empilhadeira fica estacionada (rumo 0: frente em +Z). */
export const FORKLIFT_HOME = { x: -58, z: 3, h: 0 };

/** Região onde os centros dos círculos podem ficar (as paredes e o mezanino ficam além dela). */
export const FORKLIFT_AREA = { x0: -64.5, x1: 64.5, z0: -37.4, z1: 54.3 };

export interface ForkliftState {
  x: number;
  z: number;
  /** Rumo (rad): a frente aponta para (sin h, cos h). Aumentar h gira para a esquerda. */
  h: number;
  /** Velocidade ao longo do rumo (m/s, negativa na ré). */
  v: number;
  /** Esterçamento atual (rad, positivo = esquerda). */
  steer: number;
}

export type Blocked = (x: number, z: number, h: number) => boolean;

/** true se a carroceria na pose (x, z, h) sai da área útil ou toca algum colisor (exceto `ignore`). */
export function forkliftBlocked(colliders: readonly Collider[], ignore: Collider | null, x: number, z: number, h: number) {
  const sh = Math.sin(h),
    ch = Math.cos(h),
    r2 = FORKLIFT.R * FORKLIFT.R,
    A = FORKLIFT_AREA;
  for (const off of FORKLIFT_SPOTS) {
    const px = x + sh * off,
      pz = z + ch * off;
    if (px < A.x0 || px > A.x1 || pz < A.z0 || pz > A.z1) return true;
    for (const c of colliders) {
      if (c === ignore) continue;
      let ex: number, ez: number;
      if ('r' in c) {
        const ca = Math.cos(-c.ang),
          sa = Math.sin(-c.ang),
          dx = px - c.cx,
          dz = pz - c.cz,
          lx = dx * ca - dz * sa,
          lz = dx * sa + dz * ca;
        ex = lx - clamp(lx, -c.hw, c.hw);
        ez = lz - clamp(lz, -c.hd, c.hd);
      } else {
        ex = px - clamp(px, c.x0, c.x1);
        ez = pz - clamp(pz, c.z0, c.z1);
      }
      if (ex * ex + ez * ez < r2) return true;
    }
  }
  return false;
}

/**
 * Avança a empilhadeira `dt` segundos. `throttle` e `steer` vão de −1 a 1 (steer > 0 = esquerda).
 * Em colisão tenta deslizar por um eixo; sem saída, para. Devolve a distância percorrida (m, com sinal) para girar as rodas.
 */
export function stepForklift(
  s: ForkliftState,
  input: { throttle: number; steer: number },
  dt: number,
  blocked: Blocked,
) {
  const F = FORKLIFT;
  if (input.throttle !== 0) {
    const braking = s.v !== 0 && Math.sign(input.throttle) !== Math.sign(s.v);
    s.v += input.throttle * (braking ? F.BRAKE : F.ACC) * dt;
  } else {
    s.v -= Math.sign(s.v) * Math.min(Math.abs(s.v), F.COAST * dt);
  }
  s.v = clamp(s.v, -F.VREV, F.VMAX);
  s.steer += clamp(input.steer * F.STEER_MAX - s.steer, -F.STEER_RATE * dt, F.STEER_RATE * dt);

  const nh = s.h + ((s.v * Math.tan(s.steer)) / F.WB) * dt,
    nx = s.x + Math.sin(nh) * s.v * dt,
    nz = s.z + Math.cos(nh) * s.v * dt;
  let x = s.x,
    z = s.z;
  if (!blocked(nx, nz, nh)) {
    x = nx;
    z = nz;
    s.h = nh;
  } else if (!blocked(nx, s.z, nh)) {
    x = nx;
    s.h = nh;
    s.v *= 0.5;
  } else if (!blocked(s.x, nz, nh)) {
    z = nz;
    s.h = nh;
    s.v *= 0.5;
  } else {
    s.v = 0;
  }
  const d = Math.hypot(x - s.x, z - s.z) * Math.sign(s.v);
  s.x = x;
  s.z = z;
  return d;
}
