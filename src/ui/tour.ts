/**
 * Visita guiada, visita da logística, voos até pontos de interesse e câmera que acompanha um WMR.
 * Cada parada tem: p (posição de chegada), d (deslocamento lento durante a parada), l (ponto observado),
 * h (duração da parada), cap (legenda). Paradas com `track` seguem um WMR em vez de ficarem fixas.
 */
import * as THREE from 'three';
import { ease, prog, smooth5 } from '../core/math';
import { CELL } from '../equipment/cell';
import { QS } from '../screens/chatScreen';
import type { AfterControls } from '../ctx';
import { el } from '../core/env';
import { camRoute } from './camRoute';

export { camRoute };

type V3T = [number, number, number];
/** Parada da visita. `track` acompanha um WMR em vez de uma posição fixa. */
export interface Stop {
  p?: V3T;
  d?: V3T;
  l?: V3T;
  /** Duração da parada (s) e do deslocamento até ela. */
  h: number;
  mv?: number;
  cap: string;
  track?: string;
  /** A espera desta parada é ajustada para chegar à parada `syncTarget` no começo de um ciclo do robô. */
  sync?: boolean;
  syncTarget?: boolean;
  /** Dispara uma pergunta ao assistente de IA. */
  ask?: boolean;
}
type TourKind = 'tour' | 'track' | 'poi';
/** Trecho da visita: deslocamento ('m') ou parada ('h'). */
interface Seg {
  k: 'm' | 'h';
  t0: number;
  t1: number;
  i: number;
  s: Stop;
  cap: string;
  a?: THREE.Vector3;
  b?: THREE.Vector3;
  la?: THREE.Vector3;
  lb?: THREE.Vector3;
  pts?: THREE.Vector3[];
  asked?: boolean;
}

export const STOPS: Stop[] = [
  { p: [-36, 12.5, 31], d: [5, -0.8, -2.5], l: [-2, 2.5, -8], h: 5, cap: 'Visão geral da fábrica' },
  {
    p: [-13.2, 6.8, 11.8],
    d: [-0.8, -0.2, -0.4],
    l: [-22, 3.3, -5],
    h: 3,
    cap: 'Célula robotizada 01 · robô de 6 eixos',
    sync: true,
  },
  {
    p: [-18.0, 5.1, 6.6],
    d: [-1.4, 0, -0.5],
    l: [-23.4, 3.7, -3.6],
    h: 15,
    cap: 'O robô coleta o motor, gira e o posiciona na esteira',
    syncTarget: true,
  },
  {
    p: [-25.2, 4.7, 5.9],
    d: [0.6, 0, -0.3],
    l: [-29.1, 3.9, 0],
    h: 5,
    cap: 'Motor monitorado · sensor TT-01 conectado ao WES',
  },
  {
    p: [-7.6, 3.9, 6.8],
    d: [0.6, 0, -0.4],
    l: [-4.2, 2.9, 0.4],
    h: 4.5,
    cap: 'CLP · lê o TT-01 e envia por protocolos industriais',
  },
  {
    p: [16.5, 7.6, 13.5],
    d: [1, 0, -0.6],
    l: [21, 8.6, -8],
    h: 5,
    cap: 'WES · Dispositivos, Tags · UNS, Historian, Alarmes e Telas',
  },
  {
    p: [23.2, 6.4, 4.4],
    d: [0.8, 0, -0.3],
    l: [24.5, 6.6, -8],
    h: 5,
    cap: 'A temperatura chega às Tags e fica registrada no Historian',
  },
  {
    p: [37.2, 6.4, 9.8],
    d: [0.5, 0, -0.4],
    l: [45.5, 7, -1.5],
    h: 13,
    cap: 'Assistente de IA consulta o WES via MCP',
    ask: true,
  },
  {
    p: [44, 8.5, 6],
    d: [-1.2, 0, -0.4],
    l: [50, 2.2, 26],
    h: 5,
    cap: 'Almoxarifado · componentes organizados por família',
  },
  { track: 'WMR-01', h: 16, cap: 'Logística WMR · caixas KLT da separação até o supermercado da Linha 1' },
  {
    p: [-24, 13, 36],
    d: [-3, 0.5, 1.5],
    l: [6, 3, -8],
    h: 6,
    cap: 'Máquina → CLP → protocolos industriais → WES → MCP → IA',
  },
];

export const LOGI: Stop[] = [
  { p: [44, 8.5, 6], d: [-1.2, 0, -0.4], l: [50, 2.2, 26], h: 6, cap: 'Almoxarifado · separação e abastecimento' },
  { track: 'WMR-01', h: 20, cap: 'WMR-01 leva caixas KLT pelo corredor demarcado' },
  {
    p: [-36.5, 4.6, 11.5],
    d: [0.8, 0, -0.3],
    l: [-40.6, 1.0, 5.0],
    h: 7,
    cap: 'Supermercado da Linha 1 · o operador confere as caixas entregues',
  },
  {
    p: [8, 9, 32],
    d: [2, 0, 0],
    l: [8, 1, 0],
    h: 6,
    cap: 'WMR-02 liga a usinagem à Linha 3; o WMR-03 aguarda na recarga',
  },
];

const V3 = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);

function polyAt(pts: THREE.Vector3[], u: number, o: THREE.Vector3) {
  let L = 0;
  const ls: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const l = pts[i].distanceTo(pts[i - 1]);
    ls.push(l);
    L += l;
  }
  let d = u * L;
  for (let i = 1; i < pts.length; i++) {
    if (d <= ls[i - 1] || i === pts.length - 1)
      return o.copy(pts[i - 1]).lerp(pts[i], ls[i - 1] ? Math.min(1, d / ls[i - 1]) : 1);
    d -= ls[i - 1];
  }
  return o.copy(pts[pts.length - 1]);
}

export function createTour(ctx: AfterControls) {
  const { controls, time } = ctx;
  const player = controls.player;
  const tourBtn = el('bTour');
  const capEl = el('cap'),
    capN = el('capN'),
    capT = el('capT');
  const state = {
    on: false,
    t: 0,
    dur: 0,
    segs: [] as Seg[],
    seg: null as Seg | null,
    kind: 'tour' as TourKind,
    n: 0,
  };
  /** Preenchido pelo HUD (montado depois): fecha o menu de áreas quando uma visita ou voo começa. */
  const hooks = { onStart: () => {} };
  const curLook = new THREE.Vector3(),
    trackT = new THREE.Vector3(),
    trackL = new THREE.Vector3(),
    tmpP = new THREE.Vector3(),
    tmpL = new THREE.Vector3(),
    tmp = new THREE.Vector3();

  /** Pose da câmera que acompanha um WMR: atrás e acima, sempre do lado do corredor. */
  function trackPose(id: string, oP: THREE.Vector3, oL: THREE.Vector3) {
    const W = ctx.AREAS.fleet.find((f) => f.id === id);
    if (!W) throw new Error('WMR inexistente: ' + id);
    const c = Math.cos(W.h),
      s2 = Math.sin(W.h);
    const side = Math.abs(c) > 0.7 ? [0, W.z < 11 ? 1 : -1] : [W.x < 0 ? 1 : -1, 0];
    oP.set(W.x - c * 6.5 + side[0] * 2.8, 6.4, W.z - s2 * 6.5 + side[1] * 2.8);
    if (oP.x < 2) oP.z = Math.max(oP.z, 7.4);
    if (oP.x > 37 && oP.x < 53) oP.z = Math.max(oP.z, 5.0);
    oL.set(W.x + c * 1.5, 0.45, W.z + s2 * 1.5);
    return W;
  }

  function build(holdExtra: number, stops: Stop[], kind: TourKind) {
    const segs: Seg[] = [];
    let t = 0;
    stops.forEach((s, i) => {
      const mv = s.mv || (i === 0 ? 4 : 5.5);
      const m: Seg = { k: 'm', t0: t, t1: t + mv, i, s, cap: s.cap };
      if (!s.track && s.p && s.l) {
        m.b = V3(s.p);
        m.lb = V3(s.l);
      }
      segs.push(m);
      t += mv;
      const h = s.h + (s.sync ? holdExtra : 0);
      const hs: Seg = { k: 'h', t0: t, t1: t + h, i, s, cap: s.cap };
      if (!s.track && s.p && s.l) {
        hs.a = V3(s.p);
        hs.b = V3(s.p).add(V3(s.d || [0, 0, 0]));
        hs.la = V3(s.l);
      }
      segs.push(hs);
      t += h;
    });
    return { segs, dur: t, kind, n: stops.length };
  }

  /** Inicia uma visita. A visita principal espera o robô para chegar à célula no início de um ciclo. */
  function start(stops: Stop[] = STOPS, kind: TourKind = 'tour') {
    let B = build(0, stops, kind);
    const ti = stops.findIndex((x) => x.syncTarget);
    if (time.cellRun && ti >= 0) {
      const arr = B.segs.find((g) => g.k === 'h' && g.i === ti)?.t0 ?? 0;
      const extra = (((15.3 - (time.pt1 + arr)) % CELL.T) + CELL.T) % CELL.T;
      B = build(extra, stops, kind);
    }
    curLook
      .set(
        -Math.sin(player.yaw) * Math.cos(player.pitch),
        Math.sin(player.pitch),
        -Math.cos(player.yaw) * Math.cos(player.pitch),
      )
      .multiplyScalar(12)
      .add(player.pos);
    Object.assign(state, { on: true, t: 0, segs: B.segs, dur: B.dur, seg: null, kind, n: B.n });
    tourBtn.setAttribute('aria-pressed', String(kind === 'tour' && stops === STOPS));
    capEl.classList.add('on');
    hooks.onStart();
  }

  function stop() {
    if (!state.on) return;
    state.on = false;
    tourBtn.setAttribute('aria-pressed', 'false');
    capEl.classList.remove('on');
  }

  function update(dt: number) {
    if (!state.on) return;
    state.t += dt;
    let g = state.segs.find((x) => state.t >= x.t0 && state.t < x.t1);
    let ended = false;
    if (!g) {
      g = state.segs[state.segs.length - 1];
      ended = true;
    }
    if (g !== state.seg) {
      state.seg = g;
      if (g.s.track && g.k === 'm') trackPose(g.s.track, trackT, trackL);
      if (g.k === 'm') {
        g.a = player.pos.clone();
        g.la = curLook.clone();
        g.pts = camRoute(g.a, g.s.track ? trackT : g.b!);
      }
      capN.textContent =
        state.kind === 'tour'
          ? 'Visita guiada · ' + (g.i + 1) + '/' + state.n
          : state.kind === 'track'
            ? 'Acompanhando'
            : 'Indo para';
      capT.textContent = g.cap;
    }
    const u = g.k === 'm' ? ease(prog(state.t, g.t0, g.t1)) : smooth5(prog(state.t, g.t0, g.t1));
    if (g.s.track) {
      trackPose(g.s.track, tmpP, tmpL);
      trackT.lerp(tmpP, 1 - Math.exp(-dt * 1.4));
      trackL.lerp(tmpL, 1 - Math.exp(-dt * 3));
      if (g.k === 'm') {
        const pts = g.pts!;
        pts[pts.length - 1].copy(trackT);
        polyAt(pts, u, player.pos);
        curLook.copy(g.la!).lerp(trackL, u);
      } else {
        player.pos.copy(trackT);
        curLook.copy(trackL);
      }
    } else if (g.k === 'm') {
      polyAt(g.pts!, u, player.pos);
      curLook.copy(g.la!).lerp(g.lb!, u);
    } else {
      player.pos.copy(g.a!).lerp(g.b!, u);
      curLook.copy(g.la!);
    }
    tmp.copy(curLook).sub(player.pos);
    player.yaw = Math.atan2(-tmp.x, -tmp.z);
    player.pitch = Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z));
    // na parada da IA, dispara uma pergunta se o assistente estiver livre
    if (g.k === 'h' && g.s.ask && !g.asked) {
      g.asked = true;
      const { conv, resetChat, askNext } = ctx;
      if (!conv.active) {
        if (conv.qi >= QS.length - 1) resetChat();
        askNext(time.clock);
      }
    }
    if (ended) {
      const k = state.kind;
      stop();
      if (k === 'tour') ctx.setStatus('<strong>Visita concluída</strong> · use WASD ou arraste para explorar');
    }
  }

  /** Voo até um ponto de interesse (ou acompanhamento contínuo de um WMR). */
  function flyTo(name: string) {
    const P = ctx.AREAS.pois[name];
    if (!P) return;
    if (P.track) start([{ track: P.track, h: 1e9, mv: 3.5, cap: P.track + ' · rota de abastecimento' }], 'track');
    else if (P.p && P.l) start([{ p: P.p, l: P.l, d: [0, 0, 0], h: 0.05, mv: 3.5, cap: name }], 'poi');
  }

  controls.hooks.takeOver = stop;
  controls.hooks.isGuided = () => state.on;
  return Object.assign(ctx, {
    tour: { state, start, stop, update, flyTo, trackPose, STOPS, LOGI, hooks },
  });
}
