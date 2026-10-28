/** Ferramentas compartilhadas pelos setores: instâncias de estoque, caixas KLT, placas e demarcações. */
import * as THREE from 'three';
import { Builder, UG, _o, mergeGeos, std } from '../core/builder';
import { signTex } from '../core/textures';
import type { AfterCLP } from '../ctx';
import type { AreaRegistry } from './types';
export function createAreaKit(ctx: AfterCLP) {
  const { lineM, scene } = ctx;
  const AREAS: AreaRegistry = { people: [], walkers: [], fleet: [], anim: [], pois: {}, update: () => {} };
  function inst(geo, mat, list, cast) {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, list.length);
    const col = new THREE.Color();
    list.forEach((p, i) => {
      _o.position.set(p[0], p[1], p[2]);
      _o.rotation.set(p[7] || 0, p[3] || 0, p[8] || 0);
      _o.scale.set(p[4] === undefined ? 1 : p[4], p[5] === undefined ? 1 : p[5], p[6] === undefined ? 1 : p[6]);
      _o.updateMatrix();
      m.setMatrixAt(i, _o.matrix);
      if (p[9] !== undefined) {
        col.setHex(p[9]);
        m.setColorAt(i, col);
      }
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = !!cast;
    m.receiveShadow = true;
    m.frustumCulled = false;
    scene.add(m);
    return m;
  }
  function geoOf(fn) {
    // material temporário: só serve de chave para juntar as peças numa geometria
    const b = new Builder(),
      k = new THREE.MeshBasicMaterial();
    fn(b, k);
    k.dispose();
    return mergeGeos(b.g.get(k) || []);
  }
  const binGeo = geoOf((b, k) => {
    const W = 0.3,
      D = 0.4,
      H = 0.22,
      t = 0.012;
    b.box(k, W, t, D, 0, t / 2, 0);
    [-1, 1].forEach((s) => {
      b.box(k, W, H, t, 0, H / 2, s * (D / 2 - t / 2));
      b.box(k, t, H, D, s * (W / 2 - t / 2), H / 2, 0);
    });
    b.box(k, W + 0.01, 0.018, D + 0.01, 0, H - 0.009, 0);
  });
  const palGeo = geoOf((b, k) => {
    for (let i = 0; i < 5; i++) b.box(k, 1.2, 0.022, 0.14, 0, 0.133, -0.43 + i * 0.215);
    [-0.5, 0, 0.5].forEach((x) => b.box(k, 0.1, 0.1, 1.0, x, 0.072, 0));
    [-0.43, 0, 0.43].forEach((z) => b.box(k, 1.2, 0.022, 0.1, 0, 0.011, z));
  });
  const gitFrame = geoOf((b, k) => {
    const W = 1.2,
      D = 1.0,
      H = 0.85;
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) => b.box(k, 0.04, H, 0.04, s * (W / 2 - 0.02), H / 2 + 0.12, t * (D / 2 - 0.02))),
    );
    [0.14, H + 0.1].forEach((y) => {
      [-1, 1].forEach((s) => {
        b.box(k, W, 0.035, 0.035, 0, y, s * (D / 2 - 0.02));
        b.box(k, 0.035, 0.035, D, s * (W / 2 - 0.02), y, 0);
      });
    });
    [-1, 1].forEach((s) => [-1, 1].forEach((t) => b.box(k, 0.08, 0.12, 0.08, s * 0.55, 0.06, t * 0.45)));
  });
  /** Linhas das InstancedMesh geradas em areas/finish.ts: [x, y, z, ry, sx, sy, sz, rx, rz, cor]. */
  const L: Record<string, number[][]> = {
    bin: [],
    lbl: [],
    pal: [],
    crate: [],
    git: [],
    gitM: [],
    wrap: [],
    wrapIn: [],
    spool: [],
    spoolF: [],
    shield: [],
    frame: [],
    shaft: [],
  };
  /** Cores por instância (hex sRGB). */
  const binCols = [0x2f6db5, 0x2f6db5, 0x7d8894, 0x4a5563, 0x2f6db5];
  const hash = (a, b, c, d?) => {
    let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791) ^ ((d || 0) * 2654435761);
    h = (h ^ (h >>> 13)) >>> 0;
    return (h % 1000) / 1000;
  };
  function binAt(x, y, z, ry, col, label?) {
    L.bin.push([x, y, z, ry || 0, 1, 1, 1, 0, 0, col]);
    if (label !== false) {
      const c = Math.cos(ry || 0),
        s = Math.sin(ry || 0);
      L.lbl.push([x + s * 0.203, y + 0.12, z + c * 0.203, ry || 0, 0.12, 0.06, 1]);
    }
  }
  const A = new Builder(),
    mk2 = new Builder();
  const hl2 = (x0, x1, z, w) => mk2.plane(lineM, x1 - x0, w || 0.12, (x0 + x1) / 2, 0.013, z, -Math.PI / 2, 0, 0),
    vl2 = (z0, z1, x, w) => mk2.plane(lineM, w || 0.12, z1 - z0, x, 0.013, (z0 + z1) / 2, -Math.PI / 2, 0, 0);
  const rect2 = (x0, x1, z0, z1, w?) => {
    hl2(x0, x1, z0, w);
    hl2(x0, x1, z1, w);
    vl2(z0, z1, x0, w);
    vl2(z0, z1, x1, w);
  };
  const wmrLine = std(0x88c5ed, 0.6, 0, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  function plate(text, sub, x, y, z, ry, w, dark) {
    const t = signTex({
      w: 640,
      h: sub ? 150 : 110,
      bg: dark ? '#0B2B4D' : '#EAF3FB',
      bd: '#5F8FB8',
      lines: [[text, sub ? 64 : 70, 40, 700, dark ? '#fff' : '#0B2B4D']].concat(
        sub ? [[sub, 116, 24, 600, dark ? '#8FB0D0' : '#3B5570']] : [],
      ),
      center: true,
    });
    const m = new THREE.Mesh(UG.plane, new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
    m.scale.set(w, (w * (sub ? 150 : 110)) / 640, 1);
    m.position.set(x, y, z);
    m.rotation.y = ry || 0;
    scene.add(m);
    return m;
  }
  return Object.assign(ctx, {
    A,
    AREAS,
    L,
    binAt,
    binCols,
    binGeo,
    gitFrame,
    hash,
    inst,
    mk2,
    palGeo,
    plate,
    rect2,
    wmrLine,
  });
}
