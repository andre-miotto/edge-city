/** Operadores posicionados por tarefa e pedestres que respeitam as zonas de cruzamento. */
import { makePerson, type PersonOpts } from './person';
import type { AfterFinish } from '../ctx';
import type { Walker, Zone } from '../areas/types';
export function buildCrowd(ctx: AfterFinish) {
  const { AREAS, colliders, scene } = ctx;
  // ---- operadores
  const PPL: PersonOpts[] = [
    { x: 44, z: 20.25, ry: 0, pose: 'pick', shirt: 0x2b3e57, skin: 0xc68e6a },
    { x: 49.6, z: 15.5, ry: 0, pose: 'bench', shirt: 0x34465e, skin: 0x8d5b3e },
    { x: 56.6, z: 50.4, ry: -1.2, pose: 'tablet', tablet: true, skin: 0xe0b090 },
    { x: -42.6, z: 3.0, ry: 0, pose: 'tablet', tablet: true, skin: 0xd6a27a },
    { x: -46, z: -0.95, ry: Math.PI, pose: 'bench', skin: 0xa86f4c },
    { x: -15.75, z: -3.2, ry: -Math.PI / 2, pose: 'hmi', skin: 0xe3b48e },
    { x: -12.4, z: 3.5, ry: Math.PI - 0.25, pose: 'tablet', tablet: true, skin: 0x7a4b31 },
    { x: 21, z: -19.3, ry: Math.PI, pose: 'monitor', skin: 0xc68e6a },
    { x: 16.0, z: -26.2, ry: -2.11, pose: 'inspect', skin: 0xd9a57f },
    { x: 40.2, z: -22.3, ry: 0, pose: 'bench', skin: 0xb67a52 },
    { x: 46.2, z: -22.3, ry: 0, pose: 'bench', skin: 0xe0b090, shirt: 0x34465e },
    { x: -63.55, z: 22.6, ry: -Math.PI / 2, pose: 'bench', skin: 0x9c6644 },
    { x: 19.0, z: 19.6, ry: 0, pose: 'hmi', skin: 0xd6a27a },
    { x: -14.5, z: 19.75, ry: Math.PI, pose: 'inspect', skin: 0xc68e6a },
    { x: -29.5, z: 31.4, ry: Math.PI, pose: 'bench', skin: 0x8d5b3e },
  ];
  PPL.forEach((o, i) => {
    o.phase = i * 1.37;
    o.pants = 0x253246;
    const P = makePerson(o);
    scene.add(P.root);
    AREAS.people.push(P);
    colliders.push({ x0: o.x - 0.3, x1: o.x + 0.3, z0: o.z - 0.3, z1: o.z + 0.3 });
  });
  // pedestres com rota: um cruza o corredor principal (respeita a faixa), outro circula entre as ruas do almoxarifado
  const ZONES: Zone[] = [
    { x0: 1.6, x1: 5.4, z0: 8.3, z1: 13.9, owner: null },
    { x0: 6.3, x1: 9.7, z0: 8.3, z1: 13.9, owner: null },
  ];
  const inZ = (z: Pick<Zone, 'x0' | 'x1' | 'z0' | 'z1'>, x: number, y: number) =>
    x > z.x0 && x < z.x1 && y > z.z0 && y < z.z1;
  function walker(o: Omit<PersonOpts, 'x' | 'z'> & { pts: [number, number][]; zone?: number }): Walker {
    const P = makePerson(Object.assign({ x: o.pts[0][0], z: o.pts[0][1], pose: 'walk' }, o));
    scene.add(P.root);
    const W: Walker = {
      P: P,
      pts: o.pts,
      i: 0,
      dirn: 1,
      t: 0,
      wait: 2,
      zone: o.zone,
      x: o.pts[0][0],
      z: o.pts[0][1],
      moving: false,
      tab: !!o.tablet,
    };
    AREAS.walkers.push(W);
    return W;
  }
  walker({
    pts: [
      [8, 17.2],
      [8, 14.1],
      [8, 8.1],
      [8, 3.4],
    ],
    zone: 1,
    skin: 0xc68e6a,
    shirt: 0x2b3e57,
    phase: 3,
  });
  walker({
    pts: [
      [54.4, 47.0],
      [54.4, 25.0],
    ],
    skin: 0xa86f4c,
    shirt: 0x34465e,
    phase: 7,
    tablet: true,
  });
  function walkUpdate(W: Walker, dt: number, t: number) {
    const P = W.P;
    if (W.wait > 0) {
      W.wait -= dt;
      P.pose = W.tab ? 'tablet' : 'stand';
      W.moving = false;
      P.update(t);
      return;
    }
    const ni = W.i + W.dirn;
    if (ni < 0 || ni >= W.pts.length) {
      W.dirn *= -1;
      W.wait = 5;
      P.update(t);
      return;
    }
    const a = W.pts[W.i],
      b2 = W.pts[ni];
    // antes de cruzar a faixa dos WMR, aguarda a zona ficar livre
    if (W.zone !== undefined) {
      const Z = ZONES[W.zone];
      const crossing = inZ(Z, (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2);
      if (crossing && Z.owner !== W) {
        if (Z.owner) {
          P.pose = 'stand';
          W.moving = false;
          P.update(t);
          return;
        }
        Z.owner = W;
      }
    }
    const dx = b2[0] - W.x,
      dz = b2[1] - W.z,
      dd = Math.hypot(dx, dz),
      sp = 1.15 * dt;
    W.moving = true;
    P.pose = 'walk';
    const want = Math.atan2(dx, dz);
    let dy = want - P.root.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    P.root.rotation.y += dy * Math.min(1, dt * 6);
    if (dd <= sp) {
      W.x = b2[0];
      W.z = b2[1];
      W.i = ni;
      if (W.zone !== undefined) {
        const Z = ZONES[W.zone];
        if (Z.owner === W && !inZ(Z, W.x, W.z)) Z.owner = null;
      }
      if (ni === 0 || ni === W.pts.length - 1) W.wait = 6;
    } else {
      W.x += (dx / dd) * sp;
      W.z += (dz / dd) * sp;
    }
    P.root.position.set(W.x, 0, W.z);
    P.update(t);
  }
  return Object.assign(ctx, { ZONES, inZ, walkUpdate });
}
