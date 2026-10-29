/**
 * Mapa de cor do piso, assado uma vez na carga (não custa nada por quadro).
 * Camadas: concreto em lajes com tom próprio, manchas e desgaste, poças de luz sob as luminárias, escurecimento junto
 * às paredes e sombra de contato (oclusão) sob equipamentos e pilares.
 * É o que quebra a repetição de uma textura pequena e "assenta" os objetos no chão.
 */
import * as THREE from 'three';
import { cvs, ctx2d } from '../core/canvas2d';
import { rng } from '../core/math';
import type { Collider } from './materials';
import type { AfterScreens } from '../ctx';

// o piso é um plano de 140 × 110 m centrado em (0, 7): x de −70 a 70, z de −48 a 62
const FX0 = -70,
  FZ0 = -48,
  FW = 140,
  FH = 110,
  PX = 22; // pixels por metro

export function bakeFloor(ctx: AfterScreens) {
  const { floor, colliders, columns, lamps, HX0, HX1, HZ0, HZ1, maxAniso } = ctx;
  const W = FW * PX,
    H = FH * PX,
    c = cvs(W, H),
    g = ctx2d(c),
    r = rng(7);
  const X = (x: number) => (x - FX0) * PX,
    Z = (z: number) => (z - FZ0) * PX;

  // 1. concreto base e lajes de 7,5 × 7,5 m, cada uma com um tom ligeiramente diferente
  g.fillStyle = '#929394';
  g.fillRect(0, 0, W, H);
  const SL = 7.5;
  for (let x = HX0; x < HX1; x += SL)
    for (let z = HZ0; z < HZ1; z += SL) {
      const v = (r() - 0.5) * 0.09;
      g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + -v + ')';
      g.fillRect(X(x), Z(z), SL * PX, SL * PX);
    }
  // juntas de dilatação
  g.fillStyle = 'rgba(30,32,34,.3)';
  for (let x = HX0; x <= HX1 + 0.01; x += SL) g.fillRect(X(x) - 1, Z(HZ0), 2, (HZ1 - HZ0) * PX);
  for (let z = HZ0; z <= HZ1 + 0.01; z += SL) g.fillRect(X(HX0), Z(z) - 1, (HX1 - HX0) * PX, 2);

  // 2. manchas amplas, desgaste e pequenas manchas de óleo
  const blob = (x: number, y: number, rad: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  for (let i = 0; i < 160; i++) {
    const dark = r() < 0.55;
    blob(r() * W, r() * H, (3 + r() * 11) * PX, dark ? 'rgba(20,22,24,' + (0.03 + r() * 0.05) + ')' : 'rgba(255,255,255,' + (0.025 + r() * 0.04) + ')');
  }
  for (let i = 0; i < 90; i++) blob(X(HX0 + r() * (HX1 - HX0)), Z(HZ0 + r() * (HZ1 - HZ0)), (0.25 + r() * 0.7) * PX, 'rgba(15,16,18,' + (0.18 + r() * 0.2) + ')');
  // corredores de tráfego: concreto polido, mais claro e liso
  g.fillStyle = 'rgba(255,255,255,.045)';
  g.fillRect(X(HX0), Z(9), (HX1 - HX0) * PX, 4 * PX);
  g.fillRect(X(2), Z(-41), 3 * PX, 50 * PX);

  // 3. poças de luz sob as luminárias (iluminação geral distribuída, sem manchas fortes)
  g.globalCompositeOperation = 'lighter';
  lamps.forEach((l) => blob(X(l.x), Z(l.z), 13 * PX, 'rgba(255,250,240,.05)'));
  g.globalCompositeOperation = 'source-over';

  // 4. escurecimento junto às paredes (menos luz e mais poeira)
  const edge = 4.5 * PX;
  const wallGrad = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, 'rgba(18,20,22,.34)');
    gr.addColorStop(1, 'rgba(18,20,22,0)');
    g.fillStyle = gr;
    g.fillRect(rx, ry, rw, rh);
  };
  const lx = X(HX0),
    rx2 = X(HX1),
    tz = Z(HZ0),
    bz = Z(HZ1);
  wallGrad(lx, 0, lx + edge, 0, lx, tz, edge, bz - tz);
  wallGrad(rx2, 0, rx2 - edge, 0, rx2 - edge, tz, edge, bz - tz);
  wallGrad(0, tz, 0, tz + edge, lx, tz, rx2 - lx, edge);
  wallGrad(0, bz, 0, bz - edge, lx, bz - edge, rx2 - lx, edge);
  // fora do galpão: escuro (não aparece, mas evita vazamento de luz no horizonte)
  g.fillStyle = 'rgba(20,22,24,.7)';
  g.fillRect(0, 0, lx, H);
  g.fillRect(rx2, 0, W - rx2, H);
  g.fillRect(0, 0, W, tz);
  g.fillRect(0, bz, W, H - bz);

  // 5. sombra de contato: pilares e equipamentos. Cada retângulo é desenhado fora da tela, só com a sombra suave
  // (shadowBlur) dentro do mapa; duas passagens, uma larga e fraca e uma justa e escura junto ao objeto.
  const OFF = 20000;
  const shadowRect = (x0: number, z0: number, x1: number, z1: number, blurM: number, a: number, ang = 0, cx = 0, cz = 0) => {
    g.save();
    g.shadowColor = 'rgba(8,9,10,' + a + ')';
    g.shadowBlur = blurM * PX;
    g.shadowOffsetX = OFF;
    g.fillStyle = '#000';
    if (ang) {
      g.translate(X(cx) - OFF, Z(cz));
      g.rotate(ang);
      g.fillRect(X(x0) - X(cx), Z(z0) - Z(cz), (x1 - x0) * PX, (z1 - z0) * PX);
    } else {
      g.fillRect(X(x0) - OFF, Z(z0), (x1 - x0) * PX, (z1 - z0) * PX);
    }
    g.restore();
  };
  const bounds = (b: Collider) => {
    if ('hw' in b) return { x0: -b.hw, x1: b.hw, z0: -b.hd, z1: b.hd, ang: -b.ang, cx: b.cx, cz: b.cz };
    return { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, ang: 0, cx: 0, cz: 0 };
  };
  colliders.forEach((b) => {
    const q = bounds(b);
    shadowRect(q.x0, q.z0, q.x1, q.z1, 2.2, 0.32, q.ang, q.cx, q.cz);
    shadowRect(q.x0, q.z0, q.x1, q.z1, 0.5, 0.42, q.ang, q.cx, q.cz);
  });
  columns.forEach((p) => {
    shadowRect(p.x - 0.55, p.z - 0.55, p.x + 0.55, p.z + 0.55, 1.2, 0.4);
    shadowRect(p.x - 0.55, p.z - 0.55, p.x + 0.55, p.z + 0.55, 0.3, 0.45);
  });

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  const m = floor.material as THREE.MeshStandardMaterial;
  m.map = t;
  m.color.set(0xffffff);
  m.needsUpdate = true;
  return ctx;
}
