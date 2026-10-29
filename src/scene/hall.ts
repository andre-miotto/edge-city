/** Galpão: casco em GLB (paredes, pilares, treliças, cobertura, luminárias, portões); piso e demarcações, exaustores, mezanino, tubulações e sinalização. */
import * as THREE from 'three';
import { Builder, UG, std } from '../core/builder';
import { txt, ctx2d } from '../core/canvas2d';
import { rtex, signTex, slatTex } from '../core/textures';
import { concreteDetailCanvas } from '../core/surfaces';
import type { AfterMaterials } from '../ctx';
export function buildHall(ctx: AfterMaterials) {
  const { MP, colliders, imgs, maxAniso, models, scene } = ctx;
  // ---------------- galpão: piso, paredes, pilares, treliças, cobertura e luminárias
  const HX0 = -66,
    HX1 = 66,
    HZ0 = -42,
    HZ1 = 56,
    HC = 24.8;
  // Piso: o mapa de cor grande (lajes, desgaste, sombra de contato) é assado depois, em scene/floorBake.ts, quando
  // os colisores já existem. Aqui ficam o micro-relevo e a rugosidade, que se repetem a cada 3 m.
  const detail = concreteDetailCanvas();
  detail.repeat.set(140 / 3, 110 / 3);
  detail.anisotropy = maxAniso;
  const floorMat = std(0xa3a5a6, 1.25, 0.0, {
    bumpMap: detail,
    bumpScale: 0.12,
    roughnessMap: detail, // média 0,5 × 1,25 = rugosidade ~0,62 (concreto liso, não espelhado)
    envMapIntensity: 0.5,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 110), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 7);
  floor.receiveShadow = true;
  scene.add(floor);
  const mk = new Builder();
  const lineM = std(0xeef1f5, 0.7, 0, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const aisleM = std(0x6d8ea7, 0.68, 0.05, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const hl = (x0, x1, z, w?) => mk.plane(lineM, x1 - x0, w || 0.12, (x0 + x1) / 2, 0.012, z, -Math.PI / 2, 0, 0),
    vl = (z0, z1, x, w?) => mk.plane(lineM, w || 0.12, z1 - z0, x, 0.012, (z0 + z1) / 2, -Math.PI / 2, 0, 0);
  const rect = (x0, x1, z0, z1) => {
    hl(x0, x1, z0);
    hl(x0, x1, z1);
    vl(z0, z1, x0);
    vl(z0, z1, x1);
  };
  mk.plane(aisleM, HX1 - HX0 - 2, 4, 0, 0.008, 11, -Math.PI / 2, 0, 0);
  hl(HX0 + 1, HX1 - 1, 9);
  hl(HX0 + 1, HX1 - 1, 13);
  mk.plane(aisleM, 3, 50, 3.5, 0.008, -16, -Math.PI / 2, 0, 0);
  vl(-41, 9, 2);
  vl(-41, 9, 5);
  mk.plane(aisleM, 3, 42, -52.5, 0.008, 34, -Math.PI / 2, 0, 0);
  vl(13, 55, -54);
  vl(13, 55, -51);
  mk.plane(aisleM, 3, 27, -52.5, 0.008, -4.5, -Math.PI / 2, 0, 0);
  vl(-18, 9, -54);
  vl(-18, 9, -51);
  for (let x = -60; x < 62; x += 6) {
    mk.plane(lineM, 1.2, 0.12, x, 0.012, 11, -Math.PI / 2, 0, 0);
  }
  rect(-50.6, 1.4, -16.2, 8.4);
  rect(-32.2, -16.3, -13.2, -1.0);
  rect(-65, -55, 15.5, 29);
  for (let k = 0; k < 9; k++) {
    const x = -31.8 + k * 1.9;
    mk.plane(lineM, 0.18, 1.2, x, 0.012, -13.0 + 0.0, -Math.PI / 2, 0, 0.75);
  }
  mk.build(scene, false, true);
  // faixa luminosa do centro de monitoramento
  {
    const b = new Builder();
    const gm = new THREE.MeshBasicMaterial({ color: 0x62b4e3 });
    [
      [6, 53, -11.5],
      [6, 53, 7.5],
    ].forEach((r) => b.box(gm, r[1] - r[0], 0.03, 0.1, (r[0] + r[1]) / 2, 0.02, r[2]));
    [
      [6, -11.5, 7.5],
      [53, -11.5, 7.5],
    ].forEach((r) => b.box(gm, 0.1, 0.03, r[2] - r[1], r[0], 0.02, (r[1] + r[2]) / 2));
    b.build(scene, false, false);
  }
  // textos no piso
  function floorText(t, sub, x, z, w, rot?) {
    const c = signTex({
      w: 900,
      h: sub ? 150 : 110,
      bg: 'rgba(0,0,0,0)',
      lines: [[t, 70, 52, 700, 'rgba(225,235,245,.85)']].concat(
        sub ? [[sub, 124, 26, 600, 'rgba(160,190,220,.8)']] : [],
      ),
      center: true,
    });
    const m = new THREE.Mesh(
      UG.plane,
      new THREE.MeshStandardMaterial({
        map: c,
        transparent: true,
        roughness: 0.7,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
    );
    m.scale.set(w, (w * (sub ? 150 : 110)) / 900, 1);
    m.rotation.set(-Math.PI / 2, 0, rot || 0);
    m.position.set(x, 0.015, z);
    scene.add(m);
  }
  floorText('LINHA 1 · CÉLULA 01', 'montagem e movimentação de motores', -21, 5.2, 11);
  floorText('CENTRO DE MONITORAMENTO', 'WEGnology Edge Suite', 29, 5.0, 11);
  floorText('ÁREA DE MANUTENÇÃO', null, -60, 27.6, 7.5);
  // casco do galpão (GLB): paredes, janelas, pilares, treliças, terças, vigas de rolamento, cobertura, claraboias,
  // luminárias e 4 portões. O GLB comprimido não nomeia nós nem malhas, então elas são identificadas pelo material.
  // Cobertura, fechamento e vidros só recebem sombra: se projetassem, o sol do stage.ts (que entra pelas claraboias
  // do modelo original) ficaria preso fora do galpão. O piso do GLB é descartado: vale o piso do projeto, acima.
  const shell = models.hall;
  const NO_CAST = new Set(['M_Cobertura', 'M_Cladding', 'M_Vidro', 'M_Claraboia']);
  const floorMeshes: THREE.Mesh[] = [];
  shell.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const name = (m.material as THREE.Material).name;
    if (name === 'M_Piso') {
      floorMeshes.push(m);
      return;
    }
    m.castShadow = !NO_CAST.has(name);
    m.receiveShadow = true;
  });
  if (!floorMeshes.length) throw new Error('Modelo 3D do galpão: material M_Piso não encontrado');
  floorMeshes.forEach((m) => {
    m.removeFromParent();
    m.geometry.dispose();
    (m.material as THREE.Material).dispose();
  });
  scene.add(shell);
  // portões industriais
  const slat = rtex(slatTex(), 1, 4);
  function door(x, z, w, h, ang) {
    const nx = Math.sin(ang),
      nz = Math.cos(ang);
    const m = new THREE.Mesh(UG.plane, std(0xffffff, 0.5, 0.5, { map: slat }));
    m.scale.set(w, h, 1);
    m.position.set(x + nx * 0.1, h / 2, z + nz * 0.1);
    m.rotation.y = ang;
    scene.add(m);
    const b = new Builder();
    [-1, 1].forEach((s) => {
      b.box(
        MP.struct,
        0.35,
        h + 0.4,
        0.35,
        x + Math.cos(ang) * s * (w / 2 + 0.18) + nx * 0.15,
        (h + 0.4) / 2,
        z - Math.sin(ang) * s * (w / 2 + 0.18) + nz * 0.15,
      );
      b.cyl(
        MP.alu,
        0.16,
        1.2,
        x + Math.cos(ang) * s * (w / 2 + 0.9) + nx * 0.9,
        0.6,
        z - Math.sin(ang) * s * (w / 2 + 0.9) + nz * 0.9,
        0,
        0,
        0,
        16,
      );
    });
    b.box(MP.dark, w + 1, 0.9, 0.7, x + nx * 0.35, h + 0.45, z + nz * 0.35, 0, ang, 0);
    b.build(scene, true, true);
  }
  (
    [
      [-30, HZ0 + 0.4, 'PORTÃO 02', 0],
      [40, HZ0 + 0.4, 'PORTÃO 03', 0],
    ] as [number, number, string, number][]
  ).forEach((d) => {
    const t = signTex({
      w: 360,
      h: 90,
      bg: '#EAF3FB',
      bd: '#5F8FB8',
      lines: [[d[2], 60, 40, 700, '#0B2B4D']],
      center: true,
    });
    const m = new THREE.Mesh(UG.plane, new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
    m.scale.set(2.6, 0.65, 1);
    m.position.set(d[0], 8.0, d[1]);
    scene.add(m);
  });
  // exaustores de parede (giram devagar)
  const fans: THREE.Object3D[] = [];
  [-6, 22].forEach((z) => {
    const b = new Builder();
    b.box(MP.struct, 0.5, 3.2, 3.2, HX1 - 0.3, 13, z);
    b.cyl(MP.dark, 1.35, 0.3, HX1 - 0.62, 13, z, 0, 0, Math.PI / 2, 32);
    b.build(scene, false, true);
    const f = new THREE.Group();
    f.position.set(HX1 - 0.8, 13, z);
    scene.add(f);
    const fb = new Builder();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      fb.box(MP.alu, 0.04, 1.15, 0.38, 0, Math.cos(a) * 0.62, Math.sin(a) * 0.62, a, 0, 0);
    }
    fb.cyl(MP.steelD, 0.18, 0.2, 0, 0, 0, 0, 0, Math.PI / 2, 16);
    fb.build(f, false, true);
    fans.push(f);
  });
  // pilares: as malhas vêm do GLB; aqui ficam só as posições (piso assado e colisores)
  const FX = [-66, -44, -22, 0, 22, 44, 66];
  const columns: { x: number; z: number }[] = [];
  FX.forEach((x) => [HZ0 + 0.4, -18, HZ1 - 0.4].forEach((z) => columns.push({ x, z })));
  [-28, -14, 0, 14, 28, 42].forEach((z) => {
    columns.push({ x: HX0 + 0.4, z });
    columns.push({ x: HX1 - 0.4, z });
  });
  FX.forEach((x) => {
    if (Math.abs(x) !== 66) colliders.push({ x0: x - 0.6, x1: x + 0.6, z0: -18.6, z1: -17.4 });
  });
  const ST = new Builder();
  // mezanino técnico (passarela) ao longo da parede do fundo
  ST.box(MP.frame, HX1 - HX0 - 4, 0.18, 2.8, 0, 6.5, HZ0 + 1.6);
  for (let x = HX0 + 3; x < HX1 - 2; x += 6) {
    ST.box(MP.frame, 0.18, 6.4, 0.18, x, 3.2, HZ0 + 2.9);
  }
  for (let x = HX0 + 2; x < HX1 - 2; x += 1.5) ST.box(MP.alu, 0.05, 1.1, 0.05, x, 7.15, HZ0 + 2.95);
  ST.box(MP.alu, HX1 - HX0 - 4, 0.06, 0.06, 0, 7.7, HZ0 + 2.95);
  ST.box(MP.alu, HX1 - HX0 - 4, 0.05, 0.05, 0, 7.1, HZ0 + 2.95);
  for (let i = 0; i < 14; i++) ST.box(MP.frame, 1.2, 0.06, 0.5, 58.6, 0.46 * (i + 1), -32.4 - i * 0.48);
  ST.beam(MP.frame, 58, 0, -32, 58, 6.5, -39, 0.08, 0.2);
  ST.beam(MP.frame, 59.2, 0, -32, 59.2, 6.5, -39, 0.08, 0.2);
  ST.beam(MP.alu, 58, 1.1, -32, 58, 7.6, -39, 0.05, 0.05);
  ST.beam(MP.alu, 59.2, 1.1, -32, 59.2, 7.6, -39, 0.05, 0.05);
  // tubulações (ar comprimido em azul) e eletrocalhas
  const pipeM = std(0x73afdb, 0.4, 0.5);
  [
    [10.6, 0.14],
    [11.2, 0.1],
  ].forEach((p) => ST.cyl(pipeM, p[1], HX1 - HX0 - 2, 0, p[0], HZ0 + 0.55, 0, 0, Math.PI / 2, 12));
  [
    [HX0 + 0.55, 0.14, 10.6],
    [HX1 - 0.55, 0.12, 11.2],
  ].forEach((p) => ST.cyl(pipeM, p[1], HZ1 - HZ0 - 2, p[0], p[2], (HZ0 + HZ1) / 2, Math.PI / 2, 0, 0, 12));
  for (let x = -60; x < 62; x += 5) ST.box(MP.steelD, 0.08, 0.5, 0.3, x, 10.85, HZ0 + 0.45);
  function tray(x0, x1, y, z) {
    const L = x1 - x0;
    [-1, 1].forEach((s) => ST.box(MP.alu, L, 0.1, 0.04, (x0 + x1) / 2, y, z + s * 0.25));
    for (let x = x0 + 0.15; x < x1; x += 0.3) ST.box(MP.alu, 0.03, 0.03, 0.5, x, y - 0.04, z);
    for (let x = x0 + 1; x < x1; x += 3)
      [-1, 1].forEach((s) => ST.box(MP.steelD, 0.02, HC - 0.3 - y, 0.02, x, (y + HC - 0.3) / 2, z + s * 0.27));
  }
  tray(-40, 4, 9.5, -15.2);
  [-30, -22].forEach((x) => {
    ST.box(MP.alu, 0.5, 9.5 - 2.4, 0.04, x, (9.5 + 2.4) / 2, -14.96);
  });
  tray(-29.6, -5.0, 6.85, 3.5);
  ST.build(scene, false, true);
  // luminárias: as malhas vêm do GLB; aqui ficam só as posições (poças de luz do piso assado)
  const lamps: { x: number; z: number }[] = [];
  [-55, -33, -11, 11, 33, 55].forEach((x) => [-30, -15, 0, 14, 28, 42].forEach((z) => lamps.push({ x, z })));
  // sinalização institucional e de linha
  function hangSign(x, y, z, w, h, tx, ry?, rodTop?) {
    const m = new THREE.Mesh(UG.box, [
      MP.dark,
      MP.dark,
      MP.dark,
      MP.dark,
      new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5 }),
    ]);
    m.scale.set(w, h, 0.12);
    m.position.set(x, y, z);
    m.rotation.y = ry || 0;
    scene.add(m);
    const b = new Builder();
    [-1, 1].forEach((s) =>
      b.box(
        MP.steelD,
        0.03,
        (rodTop || HC - 0.3) - y - h / 2,
        0.03,
        x + Math.cos(ry || 0) * s * w * 0.4,
        (y + h / 2 + (rodTop || HC - 0.3)) / 2,
        z - Math.sin(ry || 0) * s * w * 0.4,
      ),
    );
    b.build(scene, false, false);
  }
  hangSign(
    -19.5,
    11.2,
    0.6,
    10,
    1.7,
    signTex({
      w: 1000,
      h: 170,
      bg: '#0B2B4D',
      bd: '#2F7BC0',
      logo: true,
      imgs: imgs,
      lh: 0.48,
      lines: [
        ['LINHA 1 · MONTAGEM DE MOTORES', 78, 46, 700],
        ['Célula robotizada 01 · inspeção · transferência', 128, 26, 500, '#8FB0D0'],
      ],
    }),
  );
  hangSign(
    -45,
    11,
    -34,
    8,
    1.4,
    signTex({
      w: 900,
      h: 157,
      bg: '#0B2B4D',
      bd: '#2F7BC0',
      logo: true,
      imgs: imgs,
      lh: 0.5,
      lines: [
        ['LINHA 2 · CÉLULA 02', 72, 44, 700],
        ['movimentação de motores', 120, 26, 500, '#8FB0D0'],
      ],
    }),
  );
  hangSign(
    -58,
    6.2,
    22.5,
    5,
    1.0,
    signTex({
      w: 600,
      h: 120,
      bg: '#EAF3FB',
      bd: '#5F8FB8',
      lines: [['MANUTENÇÃO', 78, 48, 700, '#0B2B4D']],
      center: true,
    }),
  );
  {
    const t = signTex({ w: 900, h: 400, bg: '#00579D', r: 16, lines: [] });
    const g = ctx2d(t.image);
    g.setTransform(2, 0, 0, 2, 0, 0);
    if (imgs.weg) g.drawImage(imgs.weg, 300, 70, 300, 200);
    txt(g, 'Automação · Energia · Digital', 450, 330, 30, 600, '#EAF3FB', 'center');
    t.needsUpdate = true;
    const m = new THREE.Mesh(
      UG.plane,
      new THREE.MeshStandardMaterial({
        map: t,
        roughness: 0.5,
        emissive: 0xffffff,
        emissiveMap: t,
        emissiveIntensity: 0.25,
      }),
    );
    m.scale.set(9, 4, 1);
    m.position.set(-12, 13, HZ0 + 0.2);
    scene.add(m);
  }
  return Object.assign(ctx, {
    HC,
    HX0,
    HX1,
    HZ0,
    HZ1,
    columns,
    door,
    fans,
    floor,
    floorText,
    hangSign,
    lamps,
    lineM,
    mk,
    pipeM,
    rect,
  });
}
