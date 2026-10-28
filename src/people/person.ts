/** Operadores procedurais com EPI e poses animadas. */
import * as THREE from 'three';
import { UG, VB, ucyl } from '../core/builder';
import { clamp, smooth5 } from '../core/math';

/** Geometrias compartilhadas por todos os operadores (criadas na primeira pessoa). */
interface PersonGeos {
  torso: THREE.LatheGeometry;
  pelvis: THREE.LatheGeometry;
  sph: THREE.SphereGeometry;
  half: THREE.SphereGeometry;
  limb: Record<string, THREE.CylinderGeometry>;
}
export let PG: PersonGeos | null = null;
function initPG(): PersonGeos {
  return (PG = {
    torso: new THREE.LatheGeometry(
      [
        [0, 0],
        [0.135, 0],
        [0.15, 0.06],
        [0.146, 0.14],
        [0.158, 0.24],
        [0.182, 0.34],
        [0.19, 0.41],
        [0.165, 0.47],
        [0.075, 0.505],
        [0, 0.505],
      ].map((p) => new THREE.Vector2(p[0], p[1])),
      18,
    ),
    pelvis: new THREE.LatheGeometry(
      [
        [0, -0.13],
        [0.115, -0.13],
        [0.148, -0.07],
        [0.142, 0.02],
        [0, 0.02],
      ].map((p) => new THREE.Vector2(p[0], p[1])),
      18,
    ),
    sph: new THREE.SphereGeometry(1, 16, 12),
    half: new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    limb: {},
  });
}
export function limb(r1: number, r2: number): THREE.CylinderGeometry {
  const L = (PG || initPG()).limb;
  const k = r1 + '_' + r2;
  if (!L[k]) L[k] = new THREE.CylinderGeometry(r1, r2, 1, 12);
  return L[k];
}
let personMat: THREE.MeshStandardMaterial | null = null;

export type Pose = 'stand' | 'walk' | 'bench' | 'pick' | 'tablet' | 'inspect' | 'hmi' | 'monitor';
export type JointName = 'hips' | 'spine' | 'head' | 'shL' | 'shR' | 'elL' | 'elR' | 'thL' | 'thR' | 'knL' | 'knR';

/** Opções de um operador. Cores em hex sRGB (cor por vértice). */
export interface PersonOpts {
  x: number;
  z: number;
  ry?: number;
  pose?: Pose;
  phase?: number;
  skin?: number;
  shirt?: number;
  pants?: number;
  glove?: number;
  helmet?: number;
  tablet?: boolean;
}

export interface Person {
  root: THREE.Group;
  J: Record<JointName, THREE.Group>;
  pose: Pose;
  ph: number;
  update: (t: number) => void;
}

export function makePerson(o: PersonOpts): Person {
  const G0 = PG || initPG();
  if (!personMat) personMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.02 });
  const mat = personMat,
    skin = o.skin || 0xc68e6a,
    shirt = o.shirt || 0x2b3e57,
    pants = o.pants || 0x253246,
    ref = 0xd5dde4,
    glove = o.glove || 0x3a4048,
    boot = 0x1d2126,
    helm = o.helmet || 0xf1f3f5,
    muff = 0x00579d;
  const root = new THREE.Group();
  root.position.set(o.x, 0, o.z);
  root.rotation.y = o.ry || 0;
  const J = {} as Record<JointName, THREE.Group>;
  const G = (name: JointName, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    (parent || root).add(g);
    J[name] = g;
    return g;
  };
  const hips = G('hips', root, 0, 0.96, 0);
  let b = new VB();
  b.geo(pants, G0.pelvis, 0, 0, 0, 0, 0, 0, 1);
  b.box(0x1a1f26, 0.3, 0.035, 0.2, 0, 0.0, 0);
  {
    const m = b.make(mat);
    m.scale.set(1, 1, 0.72);
    hips.add(m);
  }
  const spine = G('spine', hips, 0, 0.02, 0);
  b = new VB();
  b.geo(shirt, G0.torso, 0, 0, 0);
  b.cyl(ref, 0.172, 0.035, 0, 0.27, 0, 0, 0, 0, 18);
  b.cyl(ref, 0.16, 0.03, 0, 0.12, 0, 0, 0, 0, 18);
  b.box(0x1d2a3a, 0.09, 0.06, 0.02, -0.07, 0.33, 0.15);
  {
    const m = b.make(mat);
    m.scale.set(1, 1, 0.64);
    spine.add(m);
  }
  b = new VB();
  b.cyl(skin, 0.05, 0.1, 0, 0.53, 0, 0, 0, 0, 12);
  b.cyl(shirt, 0.07, 0.04, 0, 0.49, 0, 0, 0, 0, 14);
  spine.add(b.make(mat));
  const head = G('head', spine, 0, 0.57, 0);
  b = new VB();
  b.geoS(skin, G0.sph, 0, 0.1, 0, 0, 0, 0, 0.092, 0.112, 0.102);
  b.geoS(skin, G0.sph, 0, 0.04, 0.02, 0, 0, 0, 0.075, 0.06, 0.08);
  b.box(skin, 0.024, 0.042, 0.03, 0, 0.085, 0.104);
  [-1, 1].forEach((s) => {
    b.geo(skin, G0.sph, s * 0.092, 0.095, 0, 0, 0, 0, 0.022);
  });
  b.box(0x171c22, 0.17, 0.036, 0.016, 0, 0.112, 0.1);
  [-1, 1].forEach((s) => b.box(0x171c22, 0.008, 0.01, 0.11, s * 0.086, 0.118, 0.045));
  b.geoS(helm, G0.half, 0, 0.135, 0, 0, 0, 0, 0.124, 0.105, 0.135);
  b.geoS(helm, ucyl(18), 0, 0.14, 0.03, 0, 0, 0, 0.125, 0.014, 0.1525);
  b.box(helm, 0.03, 0.025, 0.22, 0, 0.24, 0);
  [-1, 1].forEach((s) => {
    b.cyl(muff, 0.042, 0.035, s * 0.112, 0.1, 0, 0, 0, Math.PI / 2, 14);
    b.box(0x2a323c, 0.012, 0.06, 0.02, s * 0.112, 0.15, 0);
  });
  head.add(b.make(mat));
  // braços
  ['L', 'R'].forEach((side, i) => {
    const s = i ? -1 : 1;
    const sh = G(('sh' + side) as JointName, spine, s * 0.2, 0.42, 0);
    b = new VB();
    b.geo(shirt, G0.sph, 0, 0, 0, 0, 0, 0, 0.06);
    b.geoS(shirt, limb(0.056, 0.046), 0, -0.14, 0, 0, 0, 0, 1, 0.28, 1);
    sh.add(b.make(mat));
    const el = G(('el' + side) as JointName, sh, 0, -0.28, 0);
    b = new VB();
    b.geo(shirt, G0.sph, 0, 0, 0, 0, 0, 0, 0.047);
    b.geoS(shirt, limb(0.047, 0.038), 0, -0.12, 0, 0, 0, 0, 1, 0.24, 1);
    b.cyl(ref, 0.041, 0.03, 0, -0.17, 0, 0, 0, 0, 12);
    b.cyl(glove, 0.04, 0.04, 0, -0.235, 0, 0, 0, 0, 12);
    b.box(glove, 0.075, 0.085, 0.034, 0, -0.3, 0.004);
    b.box(glove, 0.07, 0.07, 0.026, 0, -0.365, 0.018, 0.35, 0, 0);
    b.box(glove, 0.024, 0.055, 0.024, s * 0.043, -0.29, 0.022, 0, 0, s * 0.5);
    el.add(b.make(mat));
  });
  // pernas
  ['L', 'R'].forEach((side, i) => {
    const s = i ? -1 : 1;
    const th = G(('th' + side) as JointName, hips, s * 0.09, -0.06, 0);
    b = new VB();
    b.geoS(pants, limb(0.085, 0.062), 0, -0.22, 0, 0, 0, 0, 1, 0.44, 1);
    th.add(b.make(mat));
    const kn = G(('kn' + side) as JointName, th, 0, -0.44, 0);
    b = new VB();
    b.geo(pants, G0.sph, 0, 0, 0, 0, 0, 0, 0.062);
    b.geoS(pants, limb(0.062, 0.048), 0, -0.2, 0, 0, 0, 0, 1, 0.4, 1);
    b.cyl(ref, 0.054, 0.03, 0, -0.3, 0, 0, 0, 0, 12);
    b.box(boot, 0.115, 0.1, 0.27, 0, -0.47, 0.045);
    b.box(0x0f1215, 0.12, 0.022, 0.28, 0, -0.51, 0.045);
    kn.add(b.make(mat));
  });
  // prancheta/tablet opcional na mão esquerda
  if (o.tablet) {
    const t = new THREE.Group();
    t.position.set(0, -0.33, 0.06);
    t.rotation.x = -0.25;
    J.elL.add(t);
    b = new VB();
    b.box(0x161b22, 0.2, 0.012, 0.27, 0, 0, 0);
    t.add(b.make(mat));
    const sc = new THREE.Mesh(UG.plane, new THREE.MeshBasicMaterial({ color: 0x88bbe1 }));
    sc.scale.set(0.17, 0.23, 1);
    sc.rotation.x = -Math.PI / 2;
    sc.position.y = 0.007;
    t.add(sc);
  }
  const ph = o.phase || 0;
  const S = (g: THREE.Object3D, x: number, y?: number, z?: number) => {
    g.rotation.set(x, y || 0, z || 0);
  };
  const P: Person = { root, J, pose: o.pose || 'stand', ph, update };
  function update(t: number) {
    const p = P.pose,
      w = t + ph;
    // base: respiração e alternância de apoio
    const br = Math.sin(w * 1.6) * 0.01;
    J.spine.rotation.set(0.03 + br, 0, 0);
    J.hips.position.y = 0.96;
    J.hips.rotation.set(0, 0, Math.sin(w * 0.3) * 0.012);
    S(J.thL, 0, 0, 0.02);
    S(J.thR, 0, 0, -0.02);
    S(J.knL, 0);
    S(J.knR, 0);
    const look = Math.sin(w * 0.23) * 0.45 + Math.sin(w * 0.61) * 0.12;
    if (p === 'walk') {
      const f = w * 5.4,
        a = Math.sin(f);
      S(J.thL, -a * 0.42);
      S(J.thR, a * 0.42);
      S(J.knL, Math.max(0, Math.sin(f + 1.3)) * 0.7);
      S(J.knR, Math.max(0, Math.sin(f + 1.3 + Math.PI)) * 0.7);
      S(J.shL, a * 0.32, 0, 0.06);
      S(J.shR, -a * 0.32, 0, -0.06);
      S(J.elL, -0.25);
      S(J.elR, -0.25);
      J.hips.position.y = 0.96 - Math.abs(Math.cos(f)) * 0.025;
      S(J.head, 0.05, Math.sin(w * 0.4) * 0.15, 0);
      J.spine.rotation.x = 0.05;
    } else if (p === 'bench') {
      J.spine.rotation.x = 0.24 + br;
      S(J.head, 0.4, Math.sin(w * 0.35) * 0.12, 0);
      const k = Math.sin(w * 2.1),
        k2 = Math.sin(w * 1.7 + 1);
      S(J.shL, -0.72 + k * 0.06, 0, -0.12);
      S(J.shR, -0.78 + k2 * 0.07, 0, 0.12);
      S(J.elL, -0.95 + k2 * 0.12);
      S(J.elR, -0.9 + k * 0.14);
    } else if (p === 'pick') {
      const c = (w % 6) / 6;
      const up = c < 0.4 ? smooth5(c / 0.18) : c < 0.55 ? 1 : 1 - smooth5((c - 0.55) / 0.25);
      J.spine.rotation.set(0.1 - 0.08 * up, 0.18 * (1 - up), 0);
      S(J.shR, -0.6 - 1.35 * up, 0, 0.05);
      S(J.elR, -1.1 + 0.85 * up);
      S(J.shL, -0.5, 0, -0.1);
      S(J.elL, -1.2);
      S(J.head, 0.3 - 0.55 * up, 0.12 * (1 - up), 0);
    } else if (p === 'tablet') {
      const up = smooth5(clamp((Math.sin(w * 0.5) - 0.55) * 3, 0, 1));
      S(J.shL, -0.55, 0, -0.06);
      S(J.elL, -1.35);
      S(J.shR, -0.5, 0, 0.18);
      S(J.elR, -1.15 + Math.max(0, Math.sin(w * 3.2)) * 0.12 * (1 - up));
      S(J.head, 0.45 - 0.55 * up, look * 0.5 * up, 0);
    } else if (p === 'inspect') {
      J.spine.rotation.x = 0.42 + br;
      S(J.head, 0.38, Math.sin(w * 0.5) * 0.2, 0);
      S(J.shR, -1.05 + Math.sin(w * 0.8) * 0.1, Math.sin(w * 0.6) * 0.25, 0.1);
      S(J.elR, -0.35);
      S(J.shL, -0.25, 0, -0.15);
      S(J.elL, -0.6);
      S(J.thL, -0.12, 0, 0.06);
      S(J.thR, -0.12, 0, -0.06);
      S(J.knL, 0.22);
      S(J.knR, 0.22);
      J.hips.position.y = 0.94;
    } else if (p === 'hmi') {
      const tap = Math.max(0, Math.sin(w * 1.3));
      S(J.shR, -1.1 - 0.15 * tap, 0, 0.1);
      S(J.elR, -0.45 - 0.2 * tap);
      S(J.shL, 0.05, 0, 0.08);
      S(J.elL, -0.2);
      S(J.head, 0.12, 0.1 * Math.sin(w * 0.3), 0);
    } else if (p === 'monitor') {
      S(J.shL, -0.4, 0, -0.35);
      S(J.elL, -1.75);
      S(J.shR, -0.45, 0, 0.35);
      S(J.elR, -1.7);
      S(J.head, 0.1, look * 0.6, 0);
    } else {
      S(J.shL, 0.04, 0, 0.07);
      S(J.shR, 0.04, 0, -0.07);
      S(J.elL, -0.15);
      S(J.elR, -0.15);
      S(J.head, 0.05, look, 0);
    }
  }
  P.update(0);
  return P;
}
