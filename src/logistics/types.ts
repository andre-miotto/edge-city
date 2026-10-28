/** Tipos da logística ilustrativa (frota WMR, estações de troca de caixas, animações de caixas). */
import type * as THREE from 'three';

/** Ponto amostrado de uma rota: posição no piso (x, z), rumo `h` (rad) e se está numa curva. */
export interface PathPoint {
  x: number;
  z: number;
  h: number;
  curve: boolean;
}
/** Vértice da polilinha [x, z]; `curve` marca os vértices gerados no arredondamento de cantos. */
export type PathVertex = [number, number] & { curve?: 1 };

export interface Path {
  /** Comprimento total (m). */
  L: number;
  S: PathVertex[];
  /** Ponto a `s` metros do início (escreve em `o` e o devolve). */
  at(s: number, o: Partial<PathPoint>): PathPoint;
  /** Distância até o começo da próxima curva (1e9 se não houver). */
  nextCurve(s: number): number;
}

export type StationId = 'ALM' | 'SM' | 'US' | 'L3';

export interface LegCfg {
  pts: [number, number][];
  act?: 'load' | 'unload';
  st?: StationId;
  /** Pista (x) da estante onde o WMR troca as caixas. */
  lx?: number;
  /** Gira 180° no lugar ao fim da troca. */
  rotate?: boolean;
  from?: string;
  to?: string;
  mat?: string;
}
export interface Leg extends LegCfg {
  path: Path;
}

/** Malhas de um WMR. */
export interface WmrModel {
  g: THREE.Group;
  strip: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  id: string;
}

export type WmrMode = 'drive' | 'act' | 'rot' | 'charge';

/** Caixa KLT (grupo com `userData.content` e `userData.full`). */
export type Bin = THREE.Group;

export interface Wmr {
  id: string;
  m: WmrModel;
  legs: Leg[];
  /** Trecho atual e distância percorrida nele. */
  li: number;
  s: number;
  v: number;
  mode: WmrMode;
  t: number;
  h: number;
  h0?: number;
  x: number;
  z: number;
  cargo: Bin[];
  state: string;
  prio?: number;
  /** Cores das caixas KLT e das peças (hex sRGB). */
  col: number;
  part: number;
  charge: number;
  fixed?: [number, number, number];
  total: number;
  refill?: { st: StationId; lx: number; full: boolean; at: number } | null;
  batt?: number;
}

/** Deslocamento de caixas entre o WMR e a estante. */
export interface BinAnim {
  bins: Bin[];
  ax: number[];
  from: number;
  to: number;
  t0: number;
  delay: number;
  dur: number;
  hide?: boolean;
  onEnd?: () => void;
  next?: { from: number; to: number; dur: number; hide?: boolean };
}

/** Estante dinâmica (flow rack) onde os WMR trocam caixas. */
export interface Station {
  x: number[];
  zr: number;
  dir: number;
  /** z da frente (troca) e de onde as caixas somem atrás do painel. */
  zFront: number;
  zHide: number;
  /** Caixas esperando na frente de cada pista. */
  staged: Record<number, Bin[] | null>;
  title: string;
}
