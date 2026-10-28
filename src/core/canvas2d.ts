/** Primitivas de desenho 2D (canvas) usadas nas telas e placas. */

/** Contexto 2D de um canvas (sempre existe em navegadores com canvas; falha cedo se não existir). */
export function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas 2D indisponível');
  return g;
}

export const F = "'IBM Plex Sans', system-ui, sans-serif";
export function font(g, size, wt) {
  g.font = (wt || 400) + ' ' + size + 'px ' + F;
}
export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function box(g, x, y, w, h, r, fill, stroke?, lw?) {
  rr(g, x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw || 1;
    g.stroke();
  }
}
export function txt(g, s, x, y, size, wt, col, align?) {
  font(g, size, wt);
  g.fillStyle = col;
  g.textAlign = align || 'left';
  g.textBaseline = 'alphabetic';
  g.fillText(s, x, y);
}
export function tw(g, s, size, wt) {
  font(g, size, wt);
  return g.measureText(s).width;
}
export function line(g, x1, y1, x2, y2, col, lw, dash?) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.setLineDash(dash || []);
  g.stroke();
  g.setLineDash([]);
}
export function poly(g, pts, col, lw, dash?) {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.setLineDash(dash || []);
  g.stroke();
  g.setLineDash([]);
}
export const IC = {
  monitor: [
    'M-11 -6.5 A2.5 2.5 0 0 1 -8.5 -9 H8.5 A2.5 2.5 0 0 1 11 -6.5 V3.5 A2.5 2.5 0 0 1 8.5 6 H-8.5 A2.5 2.5 0 0 1 -11 3.5 Z M-5 10 H5 M0 6 V10',
  ],
  bell: ['M-6 5 V-1 A6 6 0 0 1 6 -1 V5 L8 7 H-8 Z M-2 10 H2'],
  net: ['M-5 -13 H5 V-5 H-5 Z M-14 5 H-4 V13 H-14 Z M4 5 H14 V13 H4 Z M0 -5 V0 M-9 5 V0 H9 V5'],
  tags: ['M-10 -9 H1 L10 0 L1 9 H-10 Z'],
  db: ['M-9 -7 A9 3.5 0 1 0 9 -7 A9 3.5 0 1 0 -9 -7 M-9 -7 V7 A9 3.5 0 0 0 9 7 V-7 M-9 0 A9 3.5 0 0 0 9 0'],
  code: ['M-5 -7 L-11 0 L-5 7 M5 -7 L11 0 L5 7 M2 -9 L-2 9'],
  doc: ['M-8 -11 H4 L9 -6 V11 H-8 Z M-4 -1 H5 M-4 4 H5'],
  table: ['M-11 -9 H11 V9 H-11 Z M-11 -3 H11 M-11 3 H11 M-3 -9 V9'],
  lock: ['M-9 -2 H9 V11 H-9 Z M-5 -2 V-6 A5 5 0 0 1 5 -6 V-2'],
  folder: ['M-7 -5 H-2 L0 -3 H7 V6 H-7 Z'],
  solution: ['M0 -15 L13 -7.5 V7.5 L0 15 L-13 7.5 V-7.5 Z M-13 -7.5 L0 0 L13 -7.5 M0 0 V15'],
  search: ['M4.5 -1.5 A6 6 0 1 1 -7.5 -1.5 A6 6 0 1 1 4.5 -1.5 M3 3 L8 8'],
  clock: ['M8 0 A8 8 0 1 1 -8 0 A8 8 0 1 1 8 0 M0 -4 V0 L4 2'],
  chat: ['M-8 -7 H8 V4 H0 L-5 8 V4 H-8 Z'],
  plug: ['M-5 -11 V-5 M5 -11 V-5 M-9 -5 H9 V1 A9 9 0 0 1 -9 1 Z M0 10 V15'],
};
// criado no primeiro uso: assim o módulo pode ser importado fora do navegador (testes unitários)
let sparkPath: Path2D | null = null;
export const SPARK = () =>
  (sparkPath ||= new Path2D(
    'M0 -13 C1.5 -4 4 -1.5 13 0 C4 1.5 1.5 4 0 13 C-1.5 4 -4 1.5 -13 0 C-4 -1.5 -1.5 -4 0 -13Z',
  ));
export function icon(g, name, x, y, col, lw?, sc?) {
  g.save();
  g.translate(x, y);
  if (sc) g.scale(sc, sc);
  g.strokeStyle = col;
  g.lineWidth = lw || 2.2;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  IC[name].forEach((d) => g.stroke(new Path2D(d)));
  if (name === 'tags') {
    g.beginPath();
    g.arc(-4, 0, 2, 0, 7);
    g.fillStyle = col;
    g.fill();
  }
  g.restore();
}
export function spark(g, x, y, s, col) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = col;
  g.fill(SPARK());
  g.restore();
}
export function check(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fillStyle = '#0A5CB0';
  g.fill();
  poly(
    g,
    [
      [x - r * 0.45, y + r * 0.02],
      [x - r * 0.1, y + r * 0.38],
      [x + r * 0.5, y - r * 0.32],
    ],
    '#fff',
    2.2,
  );
}
export function vgrad(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  return gr;
}

export function cvs(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
