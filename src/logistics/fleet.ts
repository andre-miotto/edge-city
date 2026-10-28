/** Frota WMR: rotas, docas de troca de caixas, zonas de cruzamento e simulação. */
import * as THREE from 'three';
import { lerp, smooth5 } from '../core/math';
import { WMR_TOP, makeBin, makePath, makeWMR } from './wmrModel';
import type { AfterCrowd } from '../ctx';
import type { Bin, Leg, LegCfg, PathPoint, StationId, Wmr } from './types';
import { isMesh } from '../core/builder';

interface WmrCfg {
  legs: LegCfg[];
  li?: number;
  s?: number;
  mode?: Wmr['mode'];
  prio?: number;
  col?: number;
  part?: number;
  charge?: number;
  fixed?: [number, number, number];
  cargo?: boolean;
  cargoFull?: boolean;
}
export function buildFleet(ctx: AfterCrowd) {
  const { AREAS, K, STN, ZONES, inZ, scene } = ctx;
  // ---- frota WMR: rotas por pontos, docas de troca de caixas, zonas de cruzamento
  const BIN_POOL: Bin[] = [],
    SLOT = [-0.16, 0.16];
  function newBin(col: number, part: number): Bin {
    const b = makeBin(col, part);
    b.visible = false;
    scene.add(b);
    b.traverse((o) => {
      if (isMesh(o)) o.castShadow = true;
    });
    BIN_POOL.push(b);
    return b;
  }
  function setFull(b: Bin, f: boolean) {
    b.userData.content.visible = f;
    b.userData.full = f;
  }
  function stageLane(st: StationId, lx: number, full: boolean, col: number, part: number, delay?: number) {
    const bins = [newBin(col, part), newBin(col, part)];
    bins.forEach((b) => {
      setFull(b, full);
      b.rotation.y = 0;
    });
    AREAS.anim.push({
      bins: bins,
      ax: [lx + SLOT[0], lx + SLOT[1]],
      from: STN[st].zHide,
      to: STN[st].zFront,
      t0: 0,
      delay: delay || 0,
      dur: 3.0,
      onEnd: () => {
        STN[st].staged[lx] = bins;
      },
    });
  }
  const FLEET = AREAS.fleet;
  function wmr(id: string, cfg: WmrCfg): Wmr {
    const m = makeWMR(K, id);
    scene.add(m.g);
    const legs: Leg[] = cfg.legs.map((l) => Object.assign({ path: makePath(l.pts, 1.4) }, l));
    const W: Wmr = {
      id: id,
      m: m,
      legs: legs,
      li: cfg.li || 0,
      s: cfg.s || 0,
      v: 0,
      mode: cfg.mode || 'drive',
      t: 0,
      h: 0,
      x: 0,
      z: 0,
      cargo: [],
      state: 'Em rota',
      prio: cfg.prio,
      // cores das caixas (hex sRGB); o WMR-03 não leva caixas e fica com o cinza padrão
      col: cfg.col ?? 0x7d8894,
      part: cfg.part ?? 0xc2ccd6,
      charge: cfg.charge || 0,
      fixed: cfg.fixed,
      total: legs.reduce((a, l) => a + l.path.L, 0),
    };
    if (cfg.fixed) {
      W.x = cfg.fixed[0];
      W.z = cfg.fixed[1];
      W.h = cfg.fixed[2];
      W.mode = 'charge';
      W.state = 'Carregando bateria';
    } else {
      const p = legs[W.li].path.at(W.s, {});
      W.x = p.x;
      W.z = p.z;
      W.h = p.h;
      if (cfg.cargo) {
        W.cargo = [newBin(W.col, W.part), newBin(W.col, W.part)];
        W.cargo.forEach((b) => {
          setFull(b, !!cfg.cargoFull);
          b.visible = true;
        });
      }
    }
    FLEET.push(W);
    return W;
  }
  wmr('WMR-01', {
    col: 0x2f6db5,
    part: 0x9aa5b1,
    li: 0,
    s: 28,
    cargo: true,
    cargoFull: true,
    prio: 2,
    legs: [
      {
        pts: [
          [43.2, 14.9],
          [37.8, 14.9],
          [35.6, 12.2],
          [-36, 12.2],
          [-36, 6.0],
          [-40.0, 6.0],
        ],
        act: 'unload',
        st: 'SM',
        lx: -40.0,
        from: 'Almoxarifado · Separação A',
        to: 'Supermercado · Linha 1',
        mat: 'Tampas e rolamentos · 2 caixas KLT',
      },
      {
        pts: [
          [-40.0, 6.0],
          [-41.2, 6.0],
        ],
        act: 'load',
        st: 'SM',
        lx: -41.2,
        rotate: true,
        from: 'Supermercado · Linha 1',
        to: 'Supermercado · Linha 1',
        mat: 'troca de caixas',
      },
      {
        pts: [
          [-41.2, 6.0],
          [-34.4, 6.0],
          [-34.4, 9.8],
          [47.5, 9.8],
          [47.5, 14.9],
          [44.4, 14.9],
        ],
        act: 'unload',
        st: 'ALM',
        lx: 44.4,
        from: 'Supermercado · Linha 1',
        to: 'Almoxarifado · Separação A',
        mat: 'Caixas KLT vazias (retorno)',
      },
      {
        pts: [
          [44.4, 14.9],
          [43.2, 14.9],
        ],
        act: 'load',
        st: 'ALM',
        lx: 43.2,
        from: 'Almoxarifado · Separação A',
        to: 'Almoxarifado · Separação A',
        mat: 'troca de caixas',
      },
    ],
  });
  wmr('WMR-02', {
    col: 0x7d8894,
    part: 0xc2ccd6,
    li: 2,
    s: 12,
    cargo: true,
    cargoFull: false,
    prio: 1,
    legs: [
      {
        pts: [
          [17.1, 18.2],
          [3.5, 18.2],
          [3.5, -13.9],
          [42.4, -13.9],
        ],
        act: 'unload',
        st: 'L3',
        lx: 42.4,
        from: 'Usinagem · peças usinadas',
        to: 'Linha 3 · entrada',
        mat: 'Eixos e tampas usinados · 2 caixas KLT',
      },
      {
        pts: [
          [42.4, -13.9],
          [43.6, -13.9],
        ],
        act: 'load',
        st: 'L3',
        lx: 43.6,
        rotate: true,
        from: 'Linha 3 · entrada',
        to: 'Linha 3 · entrada',
        mat: 'troca de caixas',
      },
      {
        pts: [
          [43.6, -13.9],
          [3.5, -13.9],
          [3.5, 18.2],
          [15.9, 18.2],
        ],
        act: 'unload',
        st: 'US',
        lx: 15.9,
        from: 'Linha 3 · entrada',
        to: 'Usinagem · peças usinadas',
        mat: 'Caixas KLT vazias (retorno)',
      },
      {
        pts: [
          [15.9, 18.2],
          [17.1, 18.2],
        ],
        act: 'load',
        st: 'US',
        lx: 17.1,
        rotate: true,
        from: 'Usinagem · peças usinadas',
        to: 'Usinagem · peças usinadas',
        mat: 'troca de caixas',
      },
    ],
  });
  wmr('WMR-03', {
    fixed: [33.6, 15.55, -Math.PI / 2],
    charge: 0.62,
    legs: [
      {
        pts: [
          [33.6, 15.55],
          [33.6, 14],
        ],
      },
    ],
  });
  stageLane('ALM', 43.2, true, 0x2f6db5, 0x9aa5b1, 0);
  stageLane('SM', -41.2, false, 0x2f6db5, 0x9aa5b1, 0);
  stageLane('US', 17.1, true, 0x7d8894, 0xc2ccd6, 0);
  stageLane('L3', 43.6, false, 0x7d8894, 0xc2ccd6, 0);
  function slotPos(W: Wmr, k: number, o: THREE.Vector3) {
    const c = Math.cos(W.h),
      s = Math.sin(W.h);
    o.set(W.x + c * SLOT[k], WMR_TOP, W.z + s * SLOT[k]);
    return o;
  }
  function obstacleAhead(W: Wmr) {
    const c = Math.cos(W.h),
      s = Math.sin(W.h);
    let block = false;
    AREAS.walkers.forEach((P) => {
      const dx = P.x - W.x,
        dz = P.z - W.z,
        ah = dx * c + dz * s,
        lat = Math.abs(-dx * s + dz * c);
      if (ah > 0 && ah < 2.7 && lat < 0.9) block = true;
    });
    FLEET.forEach((o) => {
      if (o === W) return;
      const dx = o.x - W.x,
        dz = o.z - W.z,
        ah = dx * c + dz * s,
        lat = Math.abs(-dx * s + dz * c);
      const lim = (o.prio || 0) >= (W.prio || 0) ? [2.4, 0.85] : [1.4, 0.6];
      if (ah > 0 && ah < lim[0] && lat < lim[1]) block = true;
    });
    return block;
  }
  const pp: Partial<PathPoint> = {};
  function zoneCheck(W: Wmr) {
    const P = W.legs[W.li].path;
    let blocked = false;
    ZONES.forEach((Z) => {
      let first = -1;
      for (let d = 0; d <= 2.4; d += 0.3) {
        const q = P.at(W.s + d, pp);
        if (inZ(Z, q.x, q.z)) {
          first = d;
          break;
        }
      }
      const inside = inZ({ x0: Z.x0 - 0.45, x1: Z.x1 + 0.45, z0: Z.z0 - 0.45, z1: Z.z1 + 0.45 }, W.x, W.z);
      if (first >= 0) {
        if (Z.owner && Z.owner !== W) {
          if (!inside) blocked = true;
        } else if (first < 1.5) Z.owner = W;
      } else if (Z.owner === W && !inside) Z.owner = null;
    });
    return blocked;
  }
  const tv2 = new THREE.Vector3();
  function binStart(W: Wmr, leg: Leg) {
    if (!leg.st || leg.lx === undefined) return;
    const st = STN[leg.st];
    if (leg.act === 'unload') {
      const bins = W.cargo;
      W.cargo = [];
      AREAS.anim.push({
        bins: bins,
        ax: bins.map((b) => b.position.x),
        from: W.z,
        to: st.zFront,
        t0: 0,
        delay: 0,
        dur: 1.4,
        next: { from: st.zFront, to: st.zHide, dur: 2.4, hide: true },
      });
    } else {
      const bins = st.staged[leg.lx] || [];
      st.staged[leg.lx] = null;
      AREAS.anim.push({
        bins: bins,
        ax: bins.map((b) => b.position.x),
        from: st.zFront,
        to: W.z,
        t0: 0,
        delay: 0.3,
        dur: 1.4,
        onEnd: () => {
          const cargo: Bin[] = [];
          [0, 1].forEach((k) => {
            slotPos(W, k, tv2);
            let best: Bin | null = null,
              bd = 9;
            for (const b of bins) {
              const d = Math.abs(b.position.x - tv2.x);
              if (d < bd && cargo.indexOf(b) < 0) {
                bd = d;
                best = b;
              }
            }
            if (best) cargo.push(best);
          });
          W.cargo = cargo;
        },
      });
      W.refill = { st: leg.st, lx: leg.lx, full: leg.st === 'ALM' || leg.st === 'US', at: 7 };
    }
  }
  function wmrUpdate(W: Wmr, dt: number) {
    const m = W.m;
    if (W.mode === 'charge') {
      W.charge = Math.min(1, W.charge + dt * 0.0016);
      W.state = W.charge < 1 ? 'Carregando bateria' : 'Aguardando tarefa';
      m.strip.material.color.setHex(0x77c5ff);
    } else if (W.mode === 'drive') {
      const leg = W.legs[W.li],
        P = leg.path;
      const rem = P.L - W.s;
      const blk = zoneCheck(W) || obstacleAhead(W);
      const cur = P.at(W.s, pp).curve;
      const dc = cur ? 0 : P.nextCurve(W.s);
      const vt = blk
        ? 0
        : Math.min(
            cur ? 0.45 : 1.1,
            Math.sqrt(2 * 0.55 * Math.max(0, rem)) + 0.04,
            Math.sqrt(0.2 + 2 * 0.55 * Math.max(0, dc)),
          );
      W.v = W.v < vt ? Math.min(vt, W.v + 0.45 * dt) : Math.max(vt, W.v - 0.9 * dt);
      W.s = Math.min(P.L, W.s + W.v * dt);
      const q = P.at(W.s, pp);
      W.x = q.x;
      W.z = q.z;
      W.h = q.h;
      W.state = blk && W.v < 0.05 ? 'Aguardando passagem' : cur ? 'Em rota · curva' : 'Em rota';
      if (rem < 0.004 && W.v < 0.06) {
        W.mode = 'act';
        W.t = 0;
        binStart(W, leg);
      }
    } else if (W.mode === 'act') {
      W.t += dt;
      const leg = W.legs[W.li];
      W.state = leg.act === 'unload' ? 'Descarregando caixas' : 'Carregando caixas';
      if (W.t > (leg.act === 'unload' ? 1.8 : 2.2)) {
        if (leg.rotate) {
          W.mode = 'rot';
          W.t = 0;
          W.h0 = W.h;
        } else {
          W.li = (W.li + 1) % W.legs.length;
          W.s = 0;
          W.mode = 'drive';
        }
      }
    } else if (W.mode === 'rot') {
      W.t += dt;
      W.state = 'Manobrando';
      W.h = (W.h0 ?? W.h) + Math.PI * smooth5(W.t / 3.2);
      if (W.t >= 3.2) {
        W.li = (W.li + 1) % W.legs.length;
        W.s = 0;
        W.mode = 'drive';
      }
    }
    if (W.refill) {
      W.refill.at -= dt;
      if (W.refill.at <= 0) {
        const r = W.refill;
        W.refill = null;
        stageLane(r.st, r.lx, r.full, W.col, W.part, 0);
      }
    }
    m.g.position.set(W.x, 0, W.z);
    m.g.rotation.y = -W.h;
    if (W.mode !== 'charge')
      m.strip.material.color.setHex(
        W.state === 'Aguardando passagem' ? ((ctx.time.clock * 3) % 1 < 0.5 ? 0xf6fafd : 0xa0adb9) : 0xf6fafd,
      );
    W.cargo.forEach((b, k) => {
      slotPos(W, k, tv2);
      b.position.copy(tv2);
      b.rotation.y = -W.h;
      b.visible = true;
    });
  }
  function animUpdate(dt: number) {
    for (let i = AREAS.anim.length - 1; i >= 0; i--) {
      const a = AREAS.anim[i];
      if (a.delay > 0) {
        a.delay -= dt;
        continue;
      }
      a.t0 += dt;
      const u = smooth5(a.t0 / a.dur);
      a.bins.forEach((b, k) => {
        b.position.set(a.ax[k], WMR_TOP, lerp(a.from, a.to, u));
        b.visible = true;
      });
      if (a.t0 >= a.dur) {
        AREAS.anim.splice(i, 1);
        if (a.onEnd) a.onEnd();
        if (a.next)
          AREAS.anim.push({
            bins: a.bins,
            ax: a.ax,
            from: a.next.from,
            to: a.next.to,
            t0: 0,
            delay: 0.2,
            dur: a.next.dur,
            hide: a.next.hide,
          });
        if (a.hide)
          a.bins.forEach((b) => {
            b.visible = false;
            const j = BIN_POOL.indexOf(b);
            if (j >= 0) BIN_POOL.splice(j, 1);
            scene.remove(b);
          });
      }
    }
  }
  return Object.assign(ctx, { FLEET, animUpdate, wmrUpdate });
}
