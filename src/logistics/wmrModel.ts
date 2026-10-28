/** Modelo do robô móvel WMR, caixas KLT e caminhos com cantos arredondados. */
import * as THREE from 'three';
import { UG, VB, isMesh } from '../core/builder';
import { box, cvs, txt, ctx2d } from '../core/canvas2d';
import { clamp, lerp } from '../core/math';
import type { Path, PathPoint, PathVertex, WmrModel } from './types';
import type { Imgs } from '../ctx';

export const WMR_TOP = 0.51;
export function roundRect(w, d, r) {
  const s = new THREE.Shape(),
    x = -w / 2,
    y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function slab(w, d, r, h) {
  const g = new THREE.ExtrudeGeometry(roundRect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  return g;
}
/** Geometrias e material compartilhados por todos os WMR (criados no primeiro). */
let WG: {
  shell: THREE.ExtrudeGeometry;
  bump: THREE.ExtrudeGeometry;
  deck: THREE.ExtrudeGeometry;
  mat: THREE.MeshStandardMaterial;
} | null = null;
function wmrGeos() {
  return (WG ||= {
    shell: slab(0.75, 0.53, 0.075, 0.25),
    bump: slab(0.77, 0.55, 0.085, 0.09),
    deck: slab(0.71, 0.49, 0.06, 0.035),
    mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.2 }),
  });
}
export function wmrTex(imgs: Imgs, id: string) {
  const c = cvs(600, 140),
    g = ctx2d(c);
  g.clearRect(0, 0, 600, 140);
  if (imgs.weg) {
    box(g, 6, 22, 150, 96, 10, '#00579D');
    g.drawImage(imgs.weg, 22, 34, 118, 72);
  }
  txt(g, 'WMR', 176, 92, 64, 700, '#0B2B4D');
  txt(g, id, 400, 92, 34, 600, '#3B5570');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function makeWMR(K: { imgs: Imgs }, id: string): WmrModel {
  const WG = wmrGeos();
  const g = new THREE.Group();
  const b = new VB();
  b.geo(0x2a323c, WG.bump, 0, 0.035, 0);
  b.geo(0xdfe4ea, WG.shell, 0, 0.11, 0);
  b.geo(0x39434e, WG.deck, 0, 0.36, 0);
  [-1, 1].forEach((s) => {
    b.box(0x00579d, 0.6, 0.06, 0.006, 0, 0.29, s * 0.266);
    b.box(0x2a323c, 0.2, 0.07, 0.006, 0, 0.075, s * 0.276);
  });
  b.box(0x14191f, 0.03, 0.085, 0.3, 0.378, 0.165, 0);
  b.box(0x1d232a, 0.035, 0.035, 0.24, 0.384, 0.07, 0);
  b.box(0x1d232a, 0.03, 0.05, 0.44, 0.38, 0.29, 0);
  [-0.12, 0.12].forEach((z) => b.cyl(0xa9b3bd, 0.018, 0.012, -0.379, 0.2, z, 0, 0, Math.PI / 2, 12));
  b.cyl(0x2a323c, 0.032, 0.02, -0.3, 0.405, 0.19, 0, 0, 0, 14);
  b.cyl(0xc0392b, 0.024, 0.025, -0.3, 0.425, 0.19, 0, 0, 0, 14);
  b.box(0x1d232a, 0.13, 0.012, 0.1, -0.31, 0.4, -0.12, 0, 0, 0.3);
  // módulo superior de roletes (ilustrativo) para caixas KLT
  [-1, 1].forEach((s) => {
    b.box(0xb9c3cd, 0.68, 0.06, 0.03, 0, 0.43, s * 0.25);
    b.box(0x8f9aa6, 0.03, 0.12, 0.03, s * 0.33, 0.47, s * 0.25);
    b.box(0x8f9aa6, 0.03, 0.12, 0.03, s * 0.33, 0.47, -s * 0.25);
  });
  for (let k = 0; k < 6; k++) b.cyl(0x9aa5b1, 0.018, 0.64, 0, 0.49, -0.2 + k * 0.08, 0, 0, Math.PI / 2, 10);
  b.box(0xb9c3cd, 0.04, 0.05, 0.5, 0.34, 0.47, 0);
  b.box(0xb9c3cd, 0.04, 0.05, 0.5, -0.34, 0.47, 0);
  // rodas: duas de tração (160 mm) e rodízios
  [-1, 1].forEach((s) => {
    b.cyl(0x15191e, 0.08, 0.05, 0, 0.08, s * 0.235, Math.PI / 2, 0, 0, 20);
    b.cyl(0x8f9aa6, 0.035, 0.055, 0, 0.08, s * 0.235, Math.PI / 2, 0, 0, 12);
    [-0.27, 0.27].forEach((x) => b.cyl(0x15191e, 0.035, 0.03, x, 0.035, s * 0.19, Math.PI / 2, 0, 0, 12));
  });
  const body = b.make(WG.mat);
  g.add(body);
  const lt = new THREE.MeshBasicMaterial({ map: wmrTex(K.imgs, id), transparent: true, toneMapped: true });
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(UG.plane, lt);
    p.scale.set(0.3, 0.07, 1);
    p.position.set(-0.05, 0.205, s * 0.268);
    if (s < 0) p.rotation.y = Math.PI;
    g.add(p);
  });
  const strip = new THREE.Mesh(UG.box, new THREE.MeshBasicMaterial({ color: 0xf6fafd }));
  strip.scale.set(0.012, 0.022, 0.36);
  strip.position.set(0.383, 0.29, 0);
  g.add(strip);
  const side = new THREE.MeshBasicMaterial({ color: 0x77c5ff });
  [-1, 1].forEach((s) =>
    [-0.24, 0.24].forEach((x) => {
      const m = new THREE.Mesh(UG.box, side);
      m.scale.set(0.05, 0.018, 0.004);
      m.position.set(x, 0.33, s * 0.268);
      g.add(m);
    }),
  );
  const hmi = new THREE.Mesh(UG.plane, new THREE.MeshBasicMaterial({ color: 0x88bbe1 }));
  hmi.scale.set(0.11, 0.08, 1);
  hmi.position.set(-0.31, 0.408, -0.12);
  hmi.rotation.set(-Math.PI / 2, 0, 0);
  hmi.rotateX(0.3);
  g.add(hmi);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.7, 40),
    new THREE.MeshBasicMaterial({ color: 0xf6fafd, transparent: true, opacity: 0, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(ring);
  g.traverse((o) => {
    if (isMesh(o)) {
      o.castShadow = o !== ring;
      o.userData.wmr = id;
    }
  });
  return { g: g, strip: strip, ring: ring, id: id };
}
export function makeBin(col: number, partCol: number): THREE.Group {
  const b = new VB();
  const W = 0.3,
    D = 0.4,
    H = 0.22,
    t = 0.012;
  b.box(col, W, t, D, 0, t / 2, 0);
  [-1, 1].forEach((s) => {
    b.box(col, W, H, t, 0, H / 2, s * (D / 2 - t / 2));
    b.box(col, t, H, D, s * (W / 2 - t / 2), H / 2, 0);
  });
  b.box(col, W + 0.01, 0.018, D + 0.01, 0, H - 0.009, 0);
  b.box(0xf3f5f7, 0.006, 0.06, 0.12, W / 2 + 0.002, 0.12, 0);
  b.box(0xf3f5f7, 0.006, 0.06, 0.12, -W / 2 - 0.002, 0.12, 0);
  const g = new THREE.Group();
  const m = b.make(wmrGeos().mat);
  g.add(m);
  const c = new VB();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) c.cyl(partCol, 0.055, 0.03, -0.08 + i * 0.08, 0.15, -0.07 + j * 0.14, 0, 0, 0, 14);
  c.cyl(partCol, 0.03, 0.2, 0.06, 0.16, 0.1, 0, 0, Math.PI / 2, 8);
  const cm = c.make(wmrGeos().mat);
  g.add(cm);
  g.userData.content = cm;
  return g;
}
/** Rota pelos pontos `pts` [x, z] com os cantos arredondados (raio máximo `r`). */
export function makePath(pts: [number, number][], r: number): Path {
  const P = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  const S: PathVertex[] = [];
  const push = (x: number, z: number) => S.push([x, z]);
  push(P[0].x, P[0].y);
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1],
      c = P[i],
      n = P[i + 1];
    const d0 = c.clone().sub(a),
      d1 = n.clone().sub(c);
    const l0 = d0.length(),
      l1 = d1.length();
    d0.normalize();
    d1.normalize();
    const ang = Math.acos(clamp(d0.dot(d1), -1, 1));
    if (ang < 1e-3) {
      push(c.x, c.y);
      continue;
    }
    const tl = Math.min(r * Math.tan(ang / 2), l0 * 0.45, l1 * 0.45);
    const rr = tl / Math.tan(ang / 2);
    const A = c.clone().addScaledVector(d0, -tl),
      B = c.clone().addScaledVector(d1, tl);
    push(A.x, A.y);
    const cr = d0.x * d1.y - d0.y * d1.x;
    const nrm = new THREE.Vector2(-d0.y, d0.x).multiplyScalar(cr > 0 ? 1 : -1);
    const O = A.clone().addScaledVector(nrm, rr);
    const a0 = Math.atan2(A.y - O.y, A.x - O.x),
      a1 = Math.atan2(B.y - O.y, B.x - O.x);
    let da = a1 - a0;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const n2 = Math.max(4, Math.ceil(Math.abs(da) / 0.12));
    for (let k = 1; k <= n2; k++) {
      const aa = a0 + (da * k) / n2;
      push(O.x + Math.cos(aa) * rr, O.y + Math.sin(aa) * rr);
      S[S.length - 1].curve = 1;
    }
  }
  push(P[P.length - 1].x, P[P.length - 1].y);
  const cum = [0];
  for (let i = 1; i < S.length; i++) cum.push(cum[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
  const L = cum[cum.length - 1];
  function at(s: number, o: Partial<PathPoint>): PathPoint {
    s = clamp(s, 0, L);
    let i = 1;
    while (i < S.length - 1 && cum[i] < s) i++;
    const u = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    const a = S[i - 1],
      b2 = S[i];
    o.x = lerp(a[0], b2[0], u);
    o.z = lerp(a[1], b2[1], u);
    o.h = Math.atan2(b2[1] - a[1], b2[0] - a[0]);
    o.curve = !!b2.curve;
    return o as PathPoint;
  }
  function nextCurve(s: number) {
    for (let i = 1; i < S.length; i++) {
      if (S[i].curve && cum[i] > s - 0.01) return cum[i - 1] - s;
    }
    return 1e9;
  }
  return { L: L, at: at, S: S, nextCurve: nextCurve };
}
