/** Cabos, pulsos de dados e sobreposições na tela do WES (fluxo industrial e consultas MCP). */
import * as THREE from 'three';
import { box, cvs, txt, ctx2d } from '../core/canvas2d';
import { clamp, lerp } from '../core/math';
import { glowTex, labelTex, pillTex, tex } from '../core/textures';
import { CS, QS } from '../screens/chatScreen';
import { G4, MAIN, PILLS, QY, RAM, WS } from '../screens/wesScreen';
import type { AfterScreens } from '../ctx';
export function buildFlows(ctx: AfterScreens) {
  const { AH, AW, WH, WW, ai, mesh, scene, sensorTop, toW, wes, wesWorld } = ctx;
  // ---------------- cabos
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x72add1,
    emissive: 0x4083aa,
    emissiveIntensity: 0.22,
    metalness: 0.3,
    roughness: 0.5,
  });
  // o cabo do TT-01 sobe e segue pela eletrocalha até o CLP (fora do alcance do robô)
  const curveS = new THREE.CatmullRomCurve3(
    [
      sensorTop,
      ...(
        [
          [sensorTop.x, sensorTop.y + 1.12, 0.15],
          [sensorTop.x + 0.1, 6.45, 1.5],
          [-28.4, 6.84, 3.2],
          [-26.5, 6.88, 3.5],
          [-20, 6.88, 3.5],
          [-13, 6.88, 3.5],
          [-7.2, 6.88, 3.5],
          [-5.4, 6.7, 3.1],
          [-4.45, 5.7, 1.5],
          [-4.2, 4.36, 0.4],
        ] as [number, number, number][]
      ).map((p) => new THREE.Vector3(...p)),
    ],
    false,
    'centripetal',
  );
  const ipPt = wesWorld(1600, QY);
  const curveC = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.75, 2.8, 0.5),
    new THREE.Vector3(0.5, 2.5, -0.6),
    new THREE.Vector3(4.5, 3.4, -4.4),
    ipPt.clone().add(new THREE.Vector3(-0.8, -0.1, 0.6)),
    ipPt,
  ]);
  const mcpPt = wesWorld(3182, QY);
  const aiEdge = ai.localToWorld(new THREE.Vector3(-AW / 2, (0.5 - (CS.top + 360) / CS.h) * AH, 0.02));
  const curveM = new THREE.CatmullRomCurve3([
    mcpPt,
    mcpPt.clone().add(new THREE.Vector3(1.2, -0.6, 0.8)),
    mcpPt
      .clone()
      .lerp(aiEdge, 0.5)
      .add(new THREE.Vector3(0, -1.8, 2.2)),
    aiEdge.clone().add(new THREE.Vector3(-1.0, -0.4, 0.5)),
    aiEdge,
  ]);
  (
    [
      [curveS, 0.07, 260],
      [curveC, 0.09, 120],
      [curveM, 0.08, 120],
    ] as [THREE.Curve<THREE.Vector3>, number, number][]
  ).forEach((c) => mesh(new THREE.TubeGeometry(c[0], c[2], c[1], 10, false), cableMat, 0, 0, 0));
  // ---------------- pulsos e brilho
  const gTex = glowTex();
  /** Tom dos brilhos aditivos: ciano contido, em vez de branco puro (que estoura sobre o fundo claro). */
  const GLOW = 0x6fb3d4;
  function pulse(sz) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: gTex,
        color: GLOW,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    s.scale.set(sz, sz, 1);
    scene.add(s);
    return s;
  }
  const pS = [0, 1, 2, 3, 4, 5, 6, 7].map(() => pulse(0.5)),
    pC = [0, 1, 2, 3, 4, 5, 6].map(() => pulse(0.65));
  // sobreposições na tela do WES
  const ovGlow = (sz) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: gTex,
        color: GLOW,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    s.scale.set(sz, sz, 1);
    wes.add(s);
    return s;
  };
  const ovMain = [0, 1, 2, 3, 4, 5].map(() => ovGlow(0.55));
  const ovRam = {
    hist: [0, 1].map(() => ovGlow(0.42)),
    telas: [0, 1].map(() => ovGlow(0.42)),
    alarm: [0, 1, 2].map(() => ovGlow(0.42)),
  };
  function ovRect(x, y, w, h, op) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry((w / WS.w) * WW, (h / WS.h) * WH),
      new THREE.MeshBasicMaterial({
        color: 0x68e2f4,
        transparent: true,
        opacity: op || 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    p.position.copy(toW(x + w / 2, y + h / 2, 0.04));
    wes.add(p);
    return p;
  }
  function ovRing(c) {
    const g = new THREE.Group();
    const th = 6;
    [
      [c.x - 6, c.y - 6, c.w + 12, th],
      [c.x - 6, c.y + c.h, c.w + 12, th],
      [c.x - 6, c.y - 6, th, c.h + 12],
      [c.x + c.w, c.y - 6, th, c.h + 12],
    ].forEach((r) => {
      const p = ovRect(r[0], r[1], r[2], r[3], 1);
      wes.remove(p);
      g.add(p);
    });
    wes.add(g);
    g.userData.set = (op: number) =>
      g.children.forEach(
        (p) => ((p as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.opacity = op),
      );
    g.userData.set(0);
    return g;
  }
  const rings = {
    telas: ovRing(G4.telas),
    alarm: ovRing(G4.alarm),
    disp: ovRing(G4.disp),
    tag: ovRing(G4.tags),
    hist: ovRing(G4.hist),
    mcp: ovRing({ x: 3058, y: 982, w: 124, h: 56 }),
  };
  const pillOv = PILLS.map((p) => ovRect(p.x, 995, p.w, 30, 0));
  const tagRow = ovRect(2046, 994, 498, 32, 0);
  const histTop = ovRect(2632, 980, 50, 16, 0);
  // chips da consulta
  function chipSprite(label, ico, style, parent, h) {
    const p = pillTex(label, ico, style);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: p.t, transparent: true, depthWrite: false, toneMapped: false }),
    );
    s.scale.set(h * p.aspect, h, 1);
    s.material.opacity = 0;
    s.renderOrder = 10;
    (parent || scene).add(s);
    return s;
  }
  const chipReq = chipSprite('pedido', 'chat', 'req', scene, 0.9);
  const chipBack = chipSprite('dados do WES', '', 'data', scene, 0.8);
  const toolChips: Record<string, THREE.Sprite> = {},
    retChips: Record<string, THREE.Sprite> = {};
  QS.forEach((q) =>
    q.tools.forEach((t) => {
      const k = t[0];
      if (!toolChips[k])
        toolChips[k] = chipSprite(
          t[0],
          t[1] === 'tag' ? 'search' : t[1] === 'hist' ? 'clock' : 'bell',
          'tool',
          wes,
          0.75,
        );
    }),
  );
  ['valor da tag', 'histórico', 'alarmes'].forEach((k) => (retChips[k] = chipSprite(k, '', 'data', wes, 0.65)));
  // rótulos no espaço
  function label(text, sub, x, y, z, h) {
    const l = labelTex(text, sub);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: l.t, transparent: true, depthWrite: false, toneMapped: false }),
    );
    s.scale.set(h * l.aspect, h, 1);
    s.position.set(x, y, z);
    scene.add(s);
    return s;
  }
  label('Motor W22 · ativo monitorado', 'sensor TT-01 → CLP → WES', -30, 7.9, 1.2, 1.15);
  label('Esteira 01', 'acionada pelo motor monitorado', -11.4, 4.9, 2.3, 0.9);
  label('CLP WEG', 'lê o sensor e envia ao WES', -4.2, 6.0, 1.4, 1.0);
  label('Célula robotizada 01', 'robô de 6 eixos · coleta e posiciona motores', -24.5, 8.6, -6.5, 1.05);
  label('Inspeção visual', 'sensores demonstrativos', -14.75, 6.5, 0, 0.8);
  label('Alimentação de motores', 'presença e leitor de ID · demonstrativos', -30.5, 6.2, -9.4, 0.8);
  // placa do sensor conectado
  {
    const c = cvs(380, 120),
      g = ctx2d(c);
    box(g, 3, 3, 374, 114, 16, 'rgba(6,21,40,.92)', '#23C1E6', 4);
    g.beginPath();
    g.arc(42, 60, 12, 0, 7);
    g.fillStyle = '#23C1E6';
    g.fill();
    txt(g, 'TT-01', 66, 56, 36, 700, '#fff');
    txt(g, 'conectado ao WES', 66, 92, 22, 600, '#7FD3EE');
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex(c, 4), transparent: true, depthWrite: false, toneMapped: false }),
    );
    s.scale.set(1.35, 0.43, 1);
    s.position.set(-28.0, 4.75, 0.9);
    scene.add(s);
  }

  // ---------------- polilinhas em coordenadas da tela
  function plen(p) {
    let L = 0;
    for (let i = 0; i < p.length - 1; i++) L += Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]);
    return L;
  }
  function ppt(p, s) {
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i],
        b = p[i + 1],
        L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= L) {
        const u = L ? s / L : 0;
        return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
      }
      s -= L;
    }
    return p[p.length - 1];
  }
  function flowOn(pool, pts, v, sp, t, phase) {
    const L = plen(pts);
    const s0 = v * t - phase;
    pool.forEach((d) => {
      d.material.opacity = 0;
      d.userData.on = false;
    });
    let n = 0;
    for (let j = Math.ceil((s0 - L) / sp); j <= Math.floor(s0 / sp) && n < pool.length; j++, n++) {
      const s = s0 - sp * j;
      const d = pool[((j % pool.length) + pool.length) % pool.length];
      const p = ppt(pts, s);
      d.position.copy(toW(p[0], p[1], 0.08));
      d.userData.on = true;
      d.material.opacity = clamp(s / 12, 0, 1) * clamp((L - s) / 12, 0, 1);
    }
  }
  // ---- atualização por quadro: pulsos nos cabos e fluxo dentro da tela do WES (sincronizado com a chegada pelo cabo)
  function pulseAlong(pool, curve, vel, sp, t) {
    const L = curve.getLength();
    const s0 = vel * t;
    pool.forEach((p) => (p.material.opacity = 0));
    let n = 0;
    for (let j = Math.ceil((s0 - L) / sp); j <= Math.floor(s0 / sp) && n < pool.length; j++, n++) {
      const s = s0 - sp * j;
      const p = pool[((j % pool.length) + pool.length) % pool.length];
      p.position.copy(curve.getPointAt(clamp(s / L, 0, 1)));
      p.material.opacity = clamp(s / 0.8, 0, 1) * clamp((L - s) / 0.8, 0, 1);
    }
  }
  function updateFlows(t) {
    pulseAlong(pS, curveS, 6, 5.5, t);
    pulseAlong(pC, curveC, 7, 4.2, t);
    const LC = curveC.getLength(),
      tA = t - LC / 7;
    flowOn(ovMain, MAIN, 180, (4.2 * 180) / 7, tA, 0);
    ovMain.forEach((d) => {
      const x = (d.position.x / WW + 0.5) * WS.w + WS.ox;
      [
        [1700, 1786],
        [1814, 1878],
        [1906, 1970],
      ].forEach((h) => {
        if (x > h[0] - 12 && x < h[1] + 12) d.material.opacity *= clamp(Math.max(h[0] - x, x - h[1]) / 12, 0, 1);
      });
    });
    PILLS.forEach((p, k) => {
      let gmax = 0;
      ovMain.forEach((d) => {
        if (!d.userData.on) return;
        const x = (d.position.x / WW + 0.5) * WS.w + WS.ox;
        gmax = Math.max(gmax, clamp(1 - Math.abs(x - (p.x + p.w / 2)) / (p.w * 0.7), 0, 1));
      });
      pillOv[k].material.opacity = 0.55 * gmax;
    });
    const per = 4.2 / 7,
      mainL = plen(MAIN) / 180,
      tArr = tA - mainL;
    const ph = ((tArr % per) + per) % per;
    tagRow.material.opacity = 0.32 * Math.exp(-ph * 4);
    const tR = tArr;
    flowOn(ovRam.hist, RAM.hist, 110, per * 110, tR, 0);
    flowOn(ovRam.telas, RAM.telas, 110, per * 110, tR, 24);
    flowOn(ovRam.alarm, RAM.alarm, 110, per * 110, tR, 50);
    histTop.material.opacity = 0.35 * Math.exp(-((((tR - plen(RAM.hist) / 110) % per) + per) % per) * 4);
  }
  return Object.assign(ctx, {
    updateFlows,
    chipBack,
    chipReq,
    curveC,
    curveM,
    curveS,
    flowOn,
    histTop,
    ovMain,
    ovRam,
    pC,
    pS,
    pillOv,
    plen,
    ppt,
    retChips,
    rings,
    tagRow,
    toolChips,
  });
}
