/** Texturas procedurais (canvas) e placas de sinalização. */
import * as THREE from 'three';
import { box, cvs, font, icon, tw, txt, ctx2d } from './canvas2d';
import { rng } from './math';

export function tex(cv, aniso) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso || 8;
  return t;
}
export function rtex(c, rx, ry, aniso?) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso || 8;
  return t;
}
export function pillTex(label, ico, style) {
  const c = document.createElement('canvas');
  const g = ctx2d(c);
  const s = 3;
  font(g, 17, 700);
  const w = Math.ceil(g.measureText(label).width + (ico ? 60 : 36));
  c.width = w * s;
  c.height = 40 * s;
  g.scale(s, s);
  const bg = style === 'tool' ? '#23C1E6' : style === 'data' ? '#0B3B6E' : '#EAF3FB',
    fg = style === 'tool' ? '#05223D' : style === 'data' ? '#fff' : '#0B3C6B',
    st = style === 'tool' ? '#C8F3FF' : style === 'data' ? '#23C1E6' : '#7FD3EE';
  box(g, 2, 2, w - 4, 36, 18, bg, st, 2);
  if (ico) icon(g, ico, 22, 20, fg, 2.2);
  txt(g, label, ico ? 40 : w / 2, 26, 17, 700, fg, ico ? 'left' : 'center');
  const t = tex(c, 4);
  return { t: t, aspect: w / 40 };
}
export function labelTex(text, sub) {
  const c = document.createElement('canvas');
  const g = ctx2d(c);
  const s = 2;
  font(g, 30, 700);
  const w = Math.ceil(Math.max(g.measureText(text).width, sub ? tw(g, sub, 18, 500) : 0) + 48);
  const h = sub ? 84 : 58;
  c.width = w * s;
  c.height = h * s;
  g.scale(s, s);
  box(g, 2, 2, w - 4, h - 4, 14, 'rgba(8,32,58,.88)', 'rgba(93,184,240,.8)', 2);
  txt(g, text, 24, 40, 30, 700, '#fff');
  if (sub) txt(g, sub, 24, 68, 18, 500, '#8FB0D0');
  return { t: tex(c, 4), aspect: w / h };
}
export function glowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = ctx2d(c);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(180,240,255,1)');
  gr.addColorStop(0.25, 'rgba(35,193,230,.8)');
  gr.addColorStop(1, 'rgba(35,193,230,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
export function concreteTex() {
  const c = cvs(1024, 1024),
    g = ctx2d(c);
  g.fillStyle = '#56616d';
  g.fillRect(0, 0, 1024, 1024);
  const r = rng(5);
  for (let i = 0; i < 46; i++) {
    const x = r() * 1024,
      y = r() * 1024,
      rad = 60 + r() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const d = r() < 0.5;
    gr.addColorStop(0, d ? 'rgba(30,38,48,.10)' : 'rgba(140,150,160,.07)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 70000; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? 'rgba(28,34,42,.10)' : 'rgba(170,180,190,.07)';
    g.fillRect(r() * 1024, r() * 1024, 1 + r() * 2, 1 + r() * 2);
  }
  g.strokeStyle = 'rgba(22,28,36,.55)';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 1021, 1021);
  g.strokeStyle = 'rgba(150,160,170,.12)';
  g.lineWidth = 1;
  g.strokeRect(4.5, 4.5, 1015, 1015);
  return c;
}
export function ribTex(base, hi, lo, n) {
  const c = cvs(256, 64),
    g = ctx2d(c);
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 64);
  const w = 256 / n;
  for (let i = 0; i < n; i++) {
    const x = i * w;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, lo);
    gr.addColorStop(0.18, hi);
    gr.addColorStop(0.34, base);
    gr.addColorStop(1, base);
    g.fillStyle = gr;
    g.fillRect(x, 0, w, 64);
  }
  return c;
}
export function meshTex() {
  const c = cvs(128, 128),
    g = ctx2d(c);
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) {
    g.fillRect(i * 16, 0, 4, 128);
    g.fillRect(0, i * 16, 128, 4);
  }
  return c;
}
export function slatTex() {
  const c = cvs(64, 256),
    g = ctx2d(c);
  g.fillStyle = '#8f9aa6';
  g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 16; i++) {
    const y = i * 16;
    g.fillStyle = '#6f7a86';
    g.fillRect(0, y, 64, 2);
    g.fillStyle = '#a9b3bd';
    g.fillRect(0, y + 3, 64, 2);
  }
  return c;
}
export function stripeTex() {
  const c = cvs(64, 16),
    g = ctx2d(c);
  g.fillStyle = '#b9c3cd';
  g.fillRect(0, 0, 64, 16);
  g.fillStyle = '#7b8794';
  for (let i = 0; i < 4; i++) g.fillRect(i * 16, 0, 5, 16);
  return c;
}
export function signTex(o) {
  const s = 2,
    W = o.w,
    H = o.h;
  const c = cvs(W * s, H * s),
    g = ctx2d(c);
  g.scale(s, s);
  box(g, 0, 0, W, H, o.r || 10, o.bg || '#0B2B4D', o.bd || null, o.bw || 3);
  let x = o.pad || 24;
  if (o.logo && o.imgs && o.imgs.weg) {
    const lh = H * (o.lh || 0.5),
      lw = lh * 1.5;
    box(g, x, (H - lh) / 2 - 6, lw + 16, lh + 12, 6, '#00579D');
    g.drawImage(o.imgs.weg, x + 8, (H - lh) / 2, lw, lh);
    x += lw + 16 + 22;
  }
  if (o.icon) {
    const R = H * 0.32;
    g.beginPath();
    g.arc(x + R, H / 2, R, 0, 7);
    g.fillStyle = '#0A5CB0';
    g.fill();
    g.strokeStyle = '#fff';
    g.lineWidth = 3;
    g.stroke();
    o.icon(g, x + R, H / 2, R);
    x += R * 2 + 18;
  }
  (o.lines || []).forEach((l) =>
    txt(g, l[0], o.center ? W / 2 : x, l[1], l[2], l[3] || 700, l[4] || '#fff', o.center ? 'center' : 'left'),
  );
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
export function picHelmet(g, x, y, R) {
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(x, y + R * 0.15, R * 0.52, Math.PI, 0);
  g.fill();
  g.fillRect(x - R * 0.68, y + R * 0.12, R * 1.36, R * 0.14);
}
export function picGlasses(g, x, y, R) {
  g.strokeStyle = '#fff';
  g.lineWidth = R * 0.12;
  g.beginPath();
  g.arc(x - R * 0.3, y, R * 0.22, 0, 7);
  g.stroke();
  g.beginPath();
  g.arc(x + R * 0.3, y, R * 0.22, 0, 7);
  g.stroke();
  g.beginPath();
  g.moveTo(x - R * 0.08, y);
  g.lineTo(x + R * 0.08, y);
  g.stroke();
}
export function picEar(g, x, y, R) {
  g.strokeStyle = '#fff';
  g.lineWidth = R * 0.13;
  g.beginPath();
  g.arc(x, y + R * 0.05, R * 0.48, Math.PI * 1.05, Math.PI * 1.95);
  g.stroke();
  g.fillStyle = '#fff';
  g.fillRect(x - R * 0.62, y, R * 0.26, R * 0.42);
  g.fillRect(x + R * 0.36, y, R * 0.26, R * 0.42);
}
