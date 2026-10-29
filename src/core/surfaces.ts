/**
 * Superfícies de grande escala do galpão (canvas procedural): fechamento metálico, vidro de fachada e detalhe do concreto.
 * São texturas grandes, usadas uma vez por superfície, para evitar a repetição visível de um padrão pequeno.
 */
import * as THREE from 'three';
import { cvs, ctx2d } from './canvas2d';
import { rng } from './math';

/**
 * Fechamento metálico trapezoidal, pintado em cinza-claro neutro, com envelhecimento vertical.
 * A textura cobre 2,4 m na horizontal (8 nervuras) e toda a altura do painel; as juntas de chapa ficam a cada ~5 m.
 */
export function wallCladCanvas() {
  const W = 2048,
    H = 1024,
    c = cvs(W, H),
    g = ctx2d(c),
    r = rng(11);
  const base = '#c9caca';
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const ribs = 32,
    w = W / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * w,
      gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#9fa1a2');
    gr.addColorStop(0.16, '#e3e4e4');
    gr.addColorStop(0.36, base);
    gr.addColorStop(0.86, base);
    gr.addColorStop(1, '#b7b8b9');
    g.fillStyle = gr;
    g.fillRect(x, 0, w, H);
    // pequena variação de tom entre chapas vizinhas
    g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,' + r() * 0.035 + ')' : 'rgba(255,255,255,' + r() * 0.035 + ')';
    g.fillRect(x, 0, w, H);
  }
  // juntas horizontais entre fiadas de chapa
  for (const y of [190, 450, 700, 960]) {
    g.fillStyle = 'rgba(40,46,52,.22)';
    g.fillRect(0, y, W, 2);
    g.fillStyle = 'rgba(255,255,255,.18)';
    g.fillRect(0, y + 2, W, 2);
  }
  // escorrimento de chuva e poeira
  for (let i = 0; i < 320; i++) {
    const x = r() * W,
      y0 = r() * H * 0.7,
      len = 90 + r() * 420,
      wd = 1.5 + r() * 5;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len);
    const a = 0.025 + r() * 0.05;
    gr.addColorStop(0, 'rgba(70,64,58,0)');
    gr.addColorStop(0.2, 'rgba(70,64,58,' + a + ')');
    gr.addColorStop(1, 'rgba(70,64,58,0)');
    g.fillStyle = gr;
    g.fillRect(x, y0, wd, len);
  }
  // sujeira acumulada na base (a parede inferior de concreto cobre os primeiros 3,2 m)
  const dirt = g.createLinearGradient(0, H, 0, H * 0.72);
  dirt.addColorStop(0, 'rgba(64,60,56,.34)');
  dirt.addColorStop(1, 'rgba(64,60,56,0)');
  g.fillStyle = dirt;
  g.fillRect(0, H * 0.72, W, H * 0.28);
  // sombra sob a viga de beiral
  const top = g.createLinearGradient(0, 0, 0, 90);
  top.addColorStop(0, 'rgba(40,46,52,.22)');
  top.addColorStop(1, 'rgba(40,46,52,0)');
  g.fillStyle = top;
  g.fillRect(0, 0, W, 90);
  return c;
}

/** Vidro da fachada: reflete o céu (mais claro no alto), com leve esverdeado do vidro comum. */
export function glazingCanvas() {
  const c = cvs(16, 128),
    g = ctx2d(c),
    gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#ebeeef');
  gr.addColorStop(0.5, '#cfd9dc');
  gr.addColorStop(1, '#a5b4ba');
  g.fillStyle = gr;
  g.fillRect(0, 0, 16, 128);
  return c;
}

/** Cobertura metálica pintada de branco-gelo: rebate a luz das luminárias, como em galpões reais. */
export function roofDeckCanvas() {
  const c = cvs(512, 128),
    g = ctx2d(c),
    r = rng(23),
    n = 8,
    w = 512 / n;
  g.fillStyle = '#dcdbd8';
  g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < n; i++) {
    const x = i * w,
      gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#aeaca8');
    gr.addColorStop(0.18, '#f1f0ee');
    gr.addColorStop(0.4, '#dcdbd8');
    gr.addColorStop(1, '#dcdbd8');
    g.fillStyle = gr;
    g.fillRect(x, 0, w, 128);
    g.fillStyle = 'rgba(0,0,0,' + r() * 0.03 + ')';
    g.fillRect(x, 0, w, 128);
  }
  return c;
}

/**
 * Micro-relevo do concreto (cinza neutro, sem emenda visível): serve de bump e de variação de rugosidade do piso.
 * Ruído fino colocado também nas bordas opostas, para a textura repetir sem costura.
 */
export function concreteDetailCanvas() {
  const S = 512,
    c = cvs(S, S),
    g = ctx2d(c),
    r = rng(31);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26000; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)';
    const x = r() * S,
      y = r() * S,
      s = 1 + r() * 2.4;
    for (const dx of [0, S, -S]) for (const dy of [0, S, -S]) if (x + dx < S + 4 && y + dy < S + 4) g.fillRect(x + dx, y + dy, s, s);
  }
  // pequenos poros
  for (let i = 0; i < 700; i++) {
    const x = r() * S,
      y = r() * S,
      rad = 0.8 + r() * 2.2;
    g.fillStyle = 'rgba(0,0,0,.35)';
    for (const dx of [0, S, -S]) for (const dy of [0, S, -S]) {
      g.beginPath();
      g.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
