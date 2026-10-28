/** Registro dos setores ilustrativos (AREAS): pessoas, pedestres, frota, animações e pontos de interesse. */
import type { Person } from '../people/person';
import type { BinAnim, Wmr } from '../logistics/types';

/** Zona de cruzamento: reservada por um WMR ou pedestre antes de entrar. */
export interface Zone {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  owner: Wmr | Walker | null;
}

export interface Walker {
  P: Person;
  pts: [number, number][];
  i: number;
  dirn: number;
  t: number;
  wait: number;
  zone?: number;
  x: number;
  z: number;
  moving: boolean;
  tab: boolean;
}

/** Ponto de interesse da câmera: posição e alvo, ou um WMR para acompanhar. */
export interface Poi {
  p?: [number, number, number];
  l?: [number, number, number];
  track?: string;
}

export interface AreaRegistry {
  people: Person[];
  walkers: Walker[];
  fleet: Wmr[];
  anim: BinAnim[];
  pois: Record<string, Poi>;
  /** Anima tudo o que é ilustrativo (definida em areas/life.ts). */
  update: (t: number, dt: number) => void;
}
