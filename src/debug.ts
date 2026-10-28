/**
 * Ganchos usados pelos testes automatizados (tests/*.mjs) e para depuração no console do navegador.
 * Não alteram o comportamento da cena; apenas expõem funções de inspeção e posicionamento.
 */
import * as THREE from 'three';
import { camRoute } from './ui/camRoute';
import type { AfterLoop } from './ctx';
import type { Stop } from './ui/tour';
import { isMesh } from './core/builder';

type V3T = [number, number, number];

function makeHooks(ctx: AfterLoop) {
  const { controls, tour, time, AREAS, renderer, scene, camera, colliders, wmrPanel } = ctx;
  const tmpP = new THREE.Vector3(),
    tmpL = new THREE.Vector3();
  /** Avança a simulação de logística e pessoas sem renderizar (passos de 50 ms). */
  const sim = (sec: number) => {
    const n = Math.round(sec / 0.05);
    for (let i = 0; i < n; i++) {
      time.clock += 0.05;
      AREAS.update(time.clock, 0.05);
    }
    return AREAS.fleet.map((W) => ({
      id: W.id,
      x: +W.x.toFixed(2),
      z: +W.z.toFixed(2),
      li: W.li,
      mode: W.mode,
      state: W.state,
      cargo: W.cargo.length,
      full: W.cargo.length ? (W.cargo[0].userData.full as boolean) : null,
    }));
  };
  return {
    __ready: true,
    __scene: scene,
    __areas: AREAS,
    __cols: () => colliders,
    /** Custo de um quadro: passada principal e passada de sombras separadas (desde o r15x o renderer soma as duas). */
    __info: () => {
      const sm = renderer.shadowMap,
        au = sm.autoUpdate;
      sm.autoUpdate = false;
      renderer.render(scene, camera);
      const calls = renderer.info.render.calls,
        tris = renderer.info.render.triangles;
      sm.autoUpdate = au;
      sm.needsUpdate = true;
      renderer.render(scene, camera);
      return {
        calls,
        tris,
        shadowCalls: renderer.info.render.calls - calls,
        shadowTris: renderer.info.render.triangles - tris,
        geos: renderer.info.memory.geometries,
        tex: renderer.info.memory.textures,
      };
    },
    __view: (x: number, y: number, z: number, yaw: number, pitch: number) => {
      tour.stop();
      controls.player.pos.set(x, y, z);
      controls.player.yaw = yaw;
      controls.player.pitch = pitch;
    },
    __look: (px: number, py: number, pz: number, lx: number, ly: number, lz: number) =>
      controls.lookFrom(px, py, pz, lx, ly, lz),
    __jump: (s: number) => {
      time.clock += s;
      time.pt1 += s;
    },
    __pt: (v: number) => {
      time.pt1 = v;
    },
    __cell: () => ({ pt: time.pt1 }),
    __sim: sim,
    __tourSegs: () => {
      tour.start();
      const s = tour.state.segs.map((g) => ({
        k: g.k,
        t0: g.t0,
        t1: g.t1,
        i: g.i,
        track: !!g.s.track,
        p: g.s.p || null,
        d: g.s.d || null,
      }));
      tour.stop();
      return s;
    },
    __tourAt: (tt: number) => {
      if (!tour.state.on) tour.start();
      tour.state.t = tt;
    },
    __trackPose: (id: string) => {
      tour.trackPose(id, tmpP, tmpL);
      return [tmpP.toArray(), tmpL.toArray()];
    },
    __camRoute: (a: V3T, b: V3T) => camRoute(new THREE.Vector3(...a), new THREE.Vector3(...b)).map((v) => v.toArray()),
    __logi: () => tour.LOGI,
    __fly: (n: string) => tour.flyTo(n),
    __startLogi: () => tour.start(tour.LOGI, 'tour'),
    __sel: (id: string) => wmrPanel.select(AREAS.fleet.find((W) => W.id === id) || null),
    __checkCamera: () => checkCamera(ctx, sim),
  };
}

/** Publica os ganchos como `window.__*` (lidos pelos testes em tests/*.mjs). */
export function installDebugHooks(ctx: AfterLoop) {
  Object.assign(window, makeHooks(ctx));
  return ctx;
}

/**
 * Verifica se algum deslocamento de câmera cruza uma superfície sólida (usado por tests/camera.mjs).
 * Cobre: visita guiada, visita da logística, voos entre pontos de interesse e câmera que acompanha o WMR-01.
 */
function checkCamera(ctx: AfterLoop, sim: (sec: number) => unknown) {
  const { scene, tour, AREAS } = ctx;
  const solids: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if (!isMesh(o)) return;
    for (let q: THREE.Object3D | null = o; q; q = q.parent) if (q.userData && q.userData.wmr) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (m.blending === THREE.AdditiveBlending) return;
    if (m.transparent && m.depthWrite === false && !(m.userData && m.userData.solid)) return;
    solids.push(o);
  });
  const rc = new THREE.Raycaster();
  const V = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
  const issues: string[] = [];
  let segments = 0;
  const seg0 = (a: THREE.Vector3, b: THREE.Vector3, tag: string) => {
    const d = b.clone().sub(a),
      L = d.length();
    if (L < 1e-4) return;
    segments++;
    rc.set(a, d.normalize());
    rc.far = L;
    const h = rc.intersectObjects(solids, false);
    if (h.length)
      issues.push(tag + ' ' + a.toArray().map((v) => v.toFixed(1)) + ' → ' + b.toArray().map((v) => v.toFixed(1)));
  };
  const seg = (a: THREE.Vector3, b: THREE.Vector3, tag: string) => {
    const P = camRoute(a, b);
    for (let i = 1; i < P.length; i++) seg0(P[i - 1], P[i], tag);
  };
  const walkStops = (stops: Stop[], tag: string) => {
    let prev: THREE.Vector3 | null = null;
    stops.forEach((s, i) => {
      if (s.track || !s.p) {
        prev = null;
        return;
      }
      const p0 = V(s.p),
        p1 = p0.clone().add(V(s.d || [0, 0, 0]));
      if (prev) seg(prev, p0, tag + i);
      seg0(p0, p1, tag + i + ' (parada)');
      prev = p1;
    });
  };
  walkStops(tour.STOPS, 'visita ');
  walkStops(tour.LOGI, 'logística ');
  const pois = Object.values(AREAS.pois).flatMap((x) => (x.p ? [V(x.p)] : []));
  pois.forEach((a) => pois.forEach((b) => a !== b && seg(a, b, 'voo')));
  // acompanhamento: amostra a rota do WMR-01 e liga com as paradas vizinhas
  const tP = new THREE.Vector3(),
    tL = new THREE.Vector3();
  const almox = V([42.8, 8.5, 5.6]),
    fim = V([-24, 13, 36]),
    sm = V([-36.5, 4.6, 11.5]);
  let prevT: THREE.Vector3 | null = null;
  for (let k = 0; k < 300; k++) {
    sim(1.0);
    tour.trackPose('WMR-01', tP, tL);
    const t = tP.clone();
    if (prevT) seg0(prevT, t, 'acompanhamento');
    seg(almox, t, 'até o WMR');
    seg(t, fim, 'WMR → visão final');
    seg(t, sm, 'WMR → supermercado');
    prevT = t;
  }
  return { segments, issues: [...new Set(issues)] };
}
