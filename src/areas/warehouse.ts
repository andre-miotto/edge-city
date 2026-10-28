/** Almoxarifado: estante de caixas, separação, porta-paletes por família e recebimento. */
import { signTex } from '../core/textures';
import type { AfterStations } from '../ctx';
export function buildWarehouse(ctx: AfterStations) {
  const {
    A,
    HZ1,
    L,
    MP,
    binAt,
    binCols,
    box2,
    colliders,
    door,
    floorText,
    hangSign,
    hash,
    hmiMat,
    imgs,
    plate,
    rect2,
  } = ctx;
  // ---- almoxarifado: separação, estantes de caixas, porta-paletes por família e recebimento
  rect2(37.6, 64.6, 14.4, 54.6, 0.14);
  floorText('ALMOXARIFADO', 'componentes de motores · armazenagem e abastecimento', 52, 23.3, 10);
  floorText('RECEBIMENTO', null, 51, 47.9, 5.5);
  rect2(40, 63, 48.6, 54.4);
  rect2(38.4, 51.2, 18.6, 23.0);
  // estante de caixas (dupla face)
  for (let x = 38.2; x <= 50.21; x += 1.0) {
    [21.0, 22.2].forEach((z) => A.box(MP.weg, 0.06, 2.3, 0.06, x, 1.15, z));
  }
  [0.08, 0.58, 1.08, 1.58, 2.08].forEach((y, lv) => {
    A.box(MP.alu, 12, 0.04, 1.25, 44.2, y, 21.6);
    for (let i = 0; i < 35; i++) {
      const x = 38.4 + i * 0.34;
      if (x > 50.1) break;
      [
        [21.22, Math.PI],
        [21.98, 0],
      ].forEach((zz, sd) => {
        if (lv === 4 && hash(i, sd, 9) < 0.5) return;
        binAt(x, y + 0.02, zz[0], zz[1], binCols[(Math.floor(i / 6) + lv + sd) % binCols.length]);
      });
    }
  });
  plate('ESTANTE B', 'parafusos · rolamentos · vedações', 37.95, 1.7, 21.6, -Math.PI / 2, 1.4, true);
  box2(38.0, 50.4, 20.9, 22.3);
  // bancada de separação de pedidos e carrinhos
  A.box(MP.frame, 2.2, 0.06, 0.9, 49.8, 0.95, 16.6);
  [-1, 1].forEach((s) =>
    [-1, 1].forEach((t) => A.box(MP.frame, 0.06, 0.92, 0.06, 49.8 + s * 1.02, 0.46, 16.6 + t * 0.38)),
  );
  A.box(MP.dark, 0.5, 0.32, 0.04, 49.4, 1.32, 16.95);
  A.plane(hmiMat, 0.44, 0.28, 49.4, 1.32, 16.92, 0, Math.PI, 0);
  A.box(MP.cab, 0.35, 0.25, 0.3, 50.4, 1.1, 16.7);
  binAt(48.95, 0.98, 16.55, 0, 0x2f6db5);
  binAt(50.75, 0.98, 16.55, 0, 0x7d8894);
  box2(48.6, 51.0, 16.1, 17.1);
  function cart(x, z, ry, n) {
    const c = Math.cos(ry),
      s = Math.sin(ry);
    const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    [0.25, 0.75].forEach((y) => {
      const p = P(0, 0);
      A.box(MP.alu, 1.2, 0.03, 0.7, p[0], y, p[1], 0, ry, 0);
    });
    [-1, 1].forEach((a) =>
      [-1, 1].forEach((b2) => {
        const p = P(a * 0.57, b2 * 0.32);
        A.box(MP.alu, 0.03, 0.8, 0.03, p[0], 0.45, p[1]);
        A.cyl(MP.rubber, 0.06, 0.04, p[0], 0.06, p[1], Math.PI / 2, ry, 0, 12);
      }),
    );
    const h = P(0.62, 0);
    A.box(MP.alu, 0.03, 0.5, 0.6, h[0], 1.05, h[1], 0, ry, 0);
    for (let i = 0; i < n; i++) {
      const p = P(-0.33 + (i % 3) * 0.33, i < 3 ? -0.1 : 0.15);
      binAt(p[0], i < 3 ? 0.27 : 0.77, p[1], ry, binCols[i % 5]);
    }
    box2(x - 0.8, x + 0.8, z - 0.8, z + 0.8);
  }
  cart(38.6, 19.4, 0.0, 5);
  cart(51.8, 19.2, Math.PI / 2, 4);
  cart(-35.6, 3.0, 0.2, 5);
  // porta-paletes organizados por família de material
  const RW = [
    { x: 40.4, sides: [-1, 1], fam: ['frames', 'frames'], name: 'RUA C1', sub: 'carcaças' },
    { x: 46.0, sides: [-1, 1], fam: ['shields', 'crate'], name: 'RUA C2', sub: 'tampas e anéis' },
    { x: 51.6, sides: [-1, 1], fam: ['spool', 'spool'], name: 'RUA C3', sub: 'bobinas de fio de cobre' },
    { x: 57.2, sides: [-1, 1], fam: ['wrap', 'crate'], name: 'RUA C4', sub: 'eixos e rolamentos' },
    { x: 63.7, sides: [-1], fam: ['crate'], name: 'RUA C5', sub: 'embalagens' },
  ];
  const RZ0 = 24.5,
    BAY = 2.7,
    NB = 8,
    LV = [0, 2.15, 4.15, 6.15];
  RW.forEach((r, ri) => {
    const xs = r.sides.length === 2 ? [r.x - 1.2, r.x - 0.1, r.x + 0.1, r.x + 1.2] : [r.x - 0.6, r.x + 0.6];
    for (let k = 0; k <= NB; k++) {
      const z = RZ0 + k * BAY;
      xs.forEach((x) => {
        A.box(MP.weg, 0.09, 8.0, 0.09, x, 4.0, z);
        A.box(MP.steelD, 0.2, 0.02, 0.2, x, 0.01, z);
      });
      for (let i = 0; i < xs.length; i += 2) {
        for (let y = 0.4; y < 7.6; y += 1.6) A.beam(MP.weg, xs[i], y, z, xs[i + 1], y + 1.5, z, 0.04, 0.04);
      }
    }
    for (let k = 0; k < NB; k++) {
      const zc = RZ0 + (k + 0.5) * BAY;
      LV.forEach((y, l) => {
        if (l > 0) xs.forEach((x) => A.box(MP.frame, 0.06, 0.13, BAY, x, y - 0.07, zc));
      });
      r.sides.forEach((sd, si) => {
        const xc = r.sides.length === 2 ? r.x + sd * 0.65 : r.x;
        const fam = r.fam[si];
        LV.forEach((y, l) => {
          if (l > 0) {
            const fx = r.sides.length === 2 ? r.x + sd * 1.26 : r.x - 0.66;
            [-0.6, 0.6].forEach((dz) =>
              L.lbl.push([fx, y - 0.07, zc + dz, sd > 0 ? Math.PI / 2 : -Math.PI / 2, 0.2, 0.08, 1]),
            );
          }
          [-0.62, 0.62].forEach((dz, pi) => {
            if (hash(ri * 10 + si, k, l, pi) < 0.16) return;
            const z = zc + dz,
              yb = y + 0.004;
            L.pal.push([xc, yb, z, Math.PI / 2]);
            const y0 = yb + 0.144;
            const v = hash(k, l, pi, ri);
            if (fam === 'frames') {
              if (v < 0.5) {
                L.git.push([xc, y0, z, Math.PI / 2]);
                L.gitM.push([xc, y0 + 0.55, z, Math.PI / 2, 1.18, 0.85, 0.98]);
                L.frame.push([xc, y0 + 0.6, z - 0.02, Math.PI / 2, 0.8, 0.8, 0.8]);
              } else {
                L.frame.push([xc, y0 + 0.42, z, Math.PI / 2, 0.82, 0.82, 0.82]);
              }
            } else if (fam === 'shields') {
              [-0.27, 0.27].forEach((a) =>
                [-0.24, 0.24].forEach((b2) => L.shield.push([xc + a, y0 + 0.21, z + b2, 0, 0.25, 0.42, 0.25])),
              );
            } else if (fam === 'spool') {
              [-0.28, 0.28].forEach((a) =>
                [-0.24, 0.24].forEach((b2) => {
                  L.spool.push([xc + a, y0 + 0.24, z + b2, 0, 0.19, 0.34, 0.19]);
                  L.spoolF.push([xc + a, y0 + 0.03, z + b2, 0, 0.24, 0.04, 0.24]);
                  L.spoolF.push([xc + a, y0 + 0.45, z + b2, 0, 0.24, 0.04, 0.24]);
                }),
              );
            } else if (fam === 'wrap') {
              const h = 0.8 + 0.5 * v;
              L.wrapIn.push([xc, y0 + h / 2, z, Math.PI / 2, 1.12, h, 0.94]);
              L.wrap.push([xc, y0 + h / 2 + 0.01, z, Math.PI / 2, 1.16, h + 0.03, 0.98]);
            } else {
              const h = 0.6 + 0.6 * v;
              L.crate.push([xc, y0 + h / 2, z, Math.PI / 2, 1.16, h, 0.96]);
            }
          });
        });
      });
    }
    const zs = RZ0 - 0.15;
    plate(r.name, r.sub, r.x, 2.9, zs, Math.PI, 1.9, true);
    colliders.push({
      x0: r.x - (r.sides.length === 2 ? 1.3 : 0.7),
      x1: r.x + (r.sides.length === 2 ? 1.3 : 0.7),
      z0: RZ0 - 0.1,
      z1: RZ0 + NB * BAY + 0.1,
    });
  });
  // recebimento: paletes no chão, transpaleteira e eixos em cavaletes
  [
    [43, 51.2],
    [45.6, 51.2],
    [48.2, 51.2],
    [43, 53.4],
    [45.6, 53.4],
    [58, 51.6],
    [60.6, 51.6],
  ].forEach((p, i) => {
    L.pal.push([p[0], 0, p[1], 0]);
    if (i % 3 === 0) {
      L.wrapIn.push([p[0], 0.144 + 0.55, p[1], 0, 1.12, 1.1, 0.94]);
      L.wrap.push([p[0], 0.144 + 0.56, p[1], 0, 1.16, 1.13, 0.98]);
    } else if (i % 3 === 1) {
      L.git.push([p[0], 0.144, p[1], 0]);
      L.gitM.push([p[0], 0.144 + 0.55, p[1], 0, 1.18, 0.85, 0.98]);
      L.frame.push([p[0], 0.144 + 0.62, p[1], 0, 0.8, 0.8, 0.8]);
    } else {
      L.crate.push([p[0], 0.144 + 0.45, p[1], 0, 1.16, 0.9, 0.96]);
    }
  });
  box2(42.3, 49, 50.6, 54.2);
  box2(57.3, 61.3, 51, 52.2);
  for (let i = 0; i < 9; i++)
    L.shaft.push([53.6, 1.0 + ((i / 3) | 0) * 0.08, 50.5 + (i % 3) * 0.2, 0, 0.045, 1.6, 0.045, 0, Math.PI / 2]);
  [52.9, 54.3].forEach((x) => {
    A.box(MP.steelD, 0.08, 1.0, 0.6, x, 0.5, 50.7);
  });
  box2(52.6, 54.6, 50.2, 51.2);
  {
    const b = A;
    b.box(MP.weg, 0.55, 0.12, 1.2, 56.2, 0.08, 49.2);
    b.box(MP.weg, 0.5, 0.9, 0.18, 56.2, 0.55, 48.55);
    b.beam(MP.steelD, 56.2, 0.6, 48.5, 56.2, 1.25, 48.2, 0.04, 0.04);
    b.cyl(MP.rubber, 0.08, 0.06, 56.2, 0.08, 48.6, 0, 0, Math.PI / 2, 12);
  }
  door(52, HZ1, 6, 6, Math.PI);
  hangSign(
    51,
    9.5,
    19.6,
    9,
    1.5,
    signTex({
      w: 900,
      h: 150,
      bg: '#0B2B4D',
      bd: '#2F7BC0',
      logo: true,
      imgs: imgs,
      lh: 0.5,
      lines: [
        ['ALMOXARIFADO', 70, 44, 700],
        ['componentes · separação · abastecimento', 118, 25, 500, '#8FB0D0'],
      ],
    }),
  );
  return ctx;
}
