/** Construção eficiente de geometria: peças estáticas agrupadas por material (Builder) ou com cor por vértice (VB). */
import * as THREE from 'three';

/** Guarda de tipo para percorrer cenas (`traverse`). */
export const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh === true;

export const _o = new THREE.Object3D(),
  _X = new THREE.Vector3(1, 0, 0),
  _Y = new THREE.Vector3(0, 1, 0),
  _v1 = new THREE.Vector3(),
  _v2 = new THREE.Vector3();
/** Geometrias unitárias compartilhadas (escaladas por instância). Criadas por initUG() no início da montagem. */
export interface UnitGeos {
  box: THREE.BoxGeometry;
  plane: THREE.PlaneGeometry;
  cyl: Record<number, THREE.CylinderGeometry>;
  cone: Record<string, THREE.CylinderGeometry>;
}
export const UG = {} as UnitGeos;
export function initUG() {
  UG.box = new THREE.BoxGeometry(1, 1, 1);
  UG.plane = new THREE.PlaneGeometry(1, 1);
  UG.cyl = {};
  [6, 8, 12, 16, 24, 32, 48].forEach((n) => (UG.cyl[n] = new THREE.CylinderGeometry(1, 1, 1, n)));
  UG.cone = {};
}
export function ucyl(n: number): THREE.CylinderGeometry {
  if (!UG.cyl[n]) UG.cyl[n] = new THREE.CylinderGeometry(1, 1, 1, n);
  return UG.cyl[n];
}
/** Junta geometrias não indexadas (posição, normal, uv) numa só. Descarta as originais. */
export function mergeGeos(L: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let n = 0;
  L.forEach((g) => (n += g.attributes.position.count));
  const P = new Float32Array(n * 3),
    N = new Float32Array(n * 3),
    U = new Float32Array(n * 2);
  let o = 0;
  L.forEach((g) => {
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
    g.dispose();
  });
  const G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.BufferAttribute(P, 3));
  G.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  G.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  G.computeBoundingSphere();
  G.computeBoundingBox();
  return G;
}
type Pt3 = [number, number, number] | number[];

/**
 * Formas básicas posicionadas (caixa, cilindro, plano, viga…). Cada forma vira uma cópia transformada da geometria,
 * entregue a `put` junto com a chave de agrupamento: material (Builder) ou cor (VB).
 */
abstract class Shapes<K> {
  abstract put(key: K, geo: THREE.BufferGeometry, m: THREE.Matrix4): this;
  tr(x: number, y: number, z: number, rx?: number, ry?: number, rz?: number, sx?: number, sy?: number, sz?: number) {
    _o.position.set(x, y, z);
    _o.rotation.set(rx || 0, ry || 0, rz || 0);
    _o.scale.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
    _o.updateMatrix();
    return _o.matrix;
  }
  box(k: K, w: number, h: number, d: number, x: number, y: number, z: number, rx?: number, ry?: number, rz?: number) {
    return this.put(k, UG.box, this.tr(x, y, z, rx, ry, rz, w, h, d));
  }
  cyl(k: K, r: number, h: number, x: number, y: number, z: number, rx?: number, ry?: number, rz?: number, n?: number) {
    return this.put(k, ucyl(n || 24), this.tr(x, y, z, rx, ry, rz, r, h, r));
  }
  cone(
    k: K,
    r1: number,
    r2: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rx?: number,
    ry?: number,
    rz?: number,
    n?: number,
  ) {
    const key = r1 + '_' + r2 + '_' + (n || 24);
    if (!UG.cone[key]) UG.cone[key] = new THREE.CylinderGeometry(r1, r2, 1, n || 24);
    return this.put(k, UG.cone[key], this.tr(x, y, z, rx, ry, rz, 1, h, 1));
  }
  plane(k: K, w: number, h: number, x: number, y: number, z: number, rx?: number, ry?: number, rz?: number) {
    return this.put(k, UG.plane, this.tr(x, y, z, rx, ry, rz, w, h, 1));
  }
  geo(
    k: K,
    g: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rx?: number,
    ry?: number,
    rz?: number,
    s?: number,
  ) {
    return this.put(k, g, this.tr(x, y, z, rx, ry, rz, s, s, s));
  }
  geoS(
    k: K,
    g: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    return this.put(k, g, this.tr(x, y, z, rx, ry, rz, sx, sy, sz));
  }
  /** Perfil retangular entre dois pontos. */
  beam(k: K, ax: number, ay: number, az: number, bx: number, by: number, bz: number, w: number, h: number) {
    _v1.set(bx - ax, by - ay, bz - az);
    const L = _v1.length();
    _v1.normalize();
    _o.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    _o.quaternion.setFromUnitVectors(_X, _v1);
    _o.scale.set(L, h, w);
    _o.updateMatrix();
    return this.put(k, UG.box, _o.matrix);
  }
  /** Barra cilíndrica entre dois pontos. */
  rod(k: K, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, n?: number) {
    _v1.set(bx - ax, by - ay, bz - az);
    const L = _v1.length();
    _v1.normalize();
    _o.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    _o.quaternion.setFromUnitVectors(_Y, _v1);
    _o.scale.set(r, L, r);
    _o.updateMatrix();
    return this.put(k, ucyl(n || 8), _o.matrix);
  }
  tube(k: K, pts: Pt3[], r: number, n?: number) {
    const c = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      false,
      'centripetal',
    );
    return this.put(k, new THREE.TubeGeometry(c, n || 24, r, 8, false), new THREE.Matrix4());
  }
}

/** Peças estáticas agrupadas por material: `build` gera uma malha por material (poucas chamadas de desenho). */
export class Builder extends Shapes<THREE.Material> {
  g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  put(mat: THREE.Material, geo: THREE.BufferGeometry, m: THREE.Matrix4) {
    let L = this.g.get(mat);
    if (!L) this.g.set(mat, (L = []));
    const c = geo.index ? geo.toNonIndexed() : geo.clone();
    c.applyMatrix4(m);
    L.push(c);
    return this;
  }
  build(parent: THREE.Object3D, cast?: boolean, recv?: boolean): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    this.g.forEach((L, mat) => {
      const m = new THREE.Mesh(mergeGeos(L), mat);
      m.castShadow = !!cast;
      m.receiveShadow = recv !== false;
      parent.add(m);
      out.push(m);
    });
    this.g.clear();
    return out;
  }
}

/** Peças com cor por vértice (hex sRGB): `make` gera uma única malha para um material com `vertexColors`. */
export class VB extends Shapes<THREE.ColorRepresentation> {
  L: THREE.BufferGeometry[] = [];
  put(col: THREE.ColorRepresentation, geo: THREE.BufferGeometry, m: THREE.Matrix4) {
    const c = geo.index ? geo.toNonIndexed() : geo.clone();
    c.applyMatrix4(m);
    c.userData.col = new THREE.Color(col);
    this.L.push(c);
    return this;
  }
  make(mat: THREE.Material, cast?: boolean): THREE.Mesh {
    if (!this.L.length) throw new Error('VB.make: nenhuma peça adicionada');
    let n = 0;
    this.L.forEach((g) => (n += g.attributes.position.count));
    const C = new Float32Array(n * 3);
    let o = 0;
    this.L.forEach((g) => {
      const k = g.attributes.position.count,
        c = g.userData.col as THREE.Color;
      for (let i = 0; i < k; i++) {
        C[(o + i) * 3] = c.r;
        C[(o + i) * 3 + 1] = c.g;
        C[(o + i) * 3 + 2] = c.b;
      }
      o += k;
    });
    const G = mergeGeos(this.L);
    G.setAttribute('color', new THREE.BufferAttribute(C, 3));
    this.L = [];
    const m = new THREE.Mesh(G, mat);
    m.castShadow = cast !== false;
    m.receiveShadow = true;
    return m;
  }
}
/** Material PBR padrão. `color` em hex sRGB (como aparece na tela sob luz neutra). */
export function std(
  color: THREE.ColorRepresentation,
  rough: number,
  metal: number,
  extra?: THREE.MeshStandardMaterialParameters,
) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra || {}));
}
/** Carcaça aletada estilo W22 (extrusão ao longo de x). */
export function finGeo(r: number, fin: number, len: number, nf: number) {
  const s = new THREE.Shape();
  const pts: [number, number][] = [];
  const w = 0.016 / r;
  for (let k = 0; k < nf; k++) {
    const a0 = (k / nf) * Math.PI * 2 - Math.PI / 2 + Math.PI / nf;
    const a1 = ((k + 1) / nf) * Math.PI * 2 - Math.PI / 2 + Math.PI / nf;
    const am = a0;
    const bottom = Math.abs(Math.atan2(Math.sin(am + Math.PI / 2), Math.cos(am + Math.PI / 2))) < 0.62;
    if (!bottom) {
      pts.push(
        [r * Math.cos(am - w), r * Math.sin(am - w)],
        [(r + fin) * Math.cos(am - w * 0.75), (r + fin) * Math.sin(am - w * 0.75)],
        [(r + fin) * Math.cos(am + w * 0.75), (r + fin) * Math.sin(am + w * 0.75)],
        [r * Math.cos(am + w), r * Math.sin(am + w)],
      );
    }
    for (let j = 1; j < 3; j++) {
      const a = a0 + w + ((a1 - a0 - 2 * w) * j) / 3;
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
  }
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, steps: 1 });
  g.rotateY(Math.PI / 2);
  g.translate(-len / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}
