/** Frente do CLP (representação estilizada). */
import { box, txt, ctx2d } from '../core/canvas2d';

export function drawCLP(cv, t, imgs) {
  const g = ctx2d(cv);
  const s = cv.width / 240;
  g.setTransform(s, 0, 0, s, 0, 0);
  g.fillStyle = '#0E2F55';
  g.fillRect(0, 0, 240, 280);
  g.strokeStyle = '#2F7BC0';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 237, 277);
  g.fillStyle = '#8E9BAA';
  g.fillRect(8, 12, 224, 6);
  g.fillRect(8, 250, 224, 6);
  box(
    g,
    14,
    22,
    78,
    226,
    6,
    (() => {
      const gr = g.createLinearGradient(14, 0, 92, 0);
      gr.addColorStop(0, '#D6DDE5');
      gr.addColorStop(0.4, '#F2F5F8');
      gr.addColorStop(1, '#C3CDD8');
      return gr;
    })(),
    '#8E9BAA',
    1.4,
  );
  box(g, 18, 26, 70, 36, 4, '#00579D');
  if (imgs.weg) g.drawImage(imgs.weg, 35, 31, 37, 25);
  box(g, 22, 70, 62, 34, 4, '#0A1424', '#3B4C60', 1.2);
  txt(g, '68,0', 46, 93, 18, 700, '#23C1E6', 'center');
  txt(g, '°C', 80, 98, 9, 600, '#5FA6D3', 'right');
  [28, 40, 52, 64].forEach((x, i) => {
    g.beginPath();
    g.arc(x, 118, 3.4, 0, 7);
    g.globalAlpha = 0.45 + 0.55 * Math.max(0, Math.sin(t * (2.2 + i * 0.7) + i));
    g.fillStyle = i % 2 ? '#5C97C7' : '#23C1E6';
    g.fill();
    g.globalAlpha = 1;
  });
  txt(g, 'RUN', 84, 122, 8, 700, '#5A6B7C', 'right');
  [134, 164].forEach((y) => {
    box(g, 26, y, 24, 20, 2, '#2C3846');
    box(g, 30, y + 4, 16, 9, 1, '#4A5A6C');
  });
  box(g, 22, 198, 62, 40, 3, '#D4DBE3', '#A9B6C4', 1);
  [96, 129, 162, 195].forEach((x, mi) => {
    box(
      g,
      x,
      22,
      30,
      226,
      5,
      (() => {
        const gr = g.createLinearGradient(x, 0, x + 30, 0);
        gr.addColorStop(0, '#D6DDE5');
        gr.addColorStop(0.4, '#F2F5F8');
        gr.addColorStop(1, '#C3CDD8');
        return gr;
      })(),
      '#8E9BAA',
      1.3,
    );
    box(g, x + 2, 25, 26, 10, 2, '#00579D');
    for (let k = 0; k < 4; k++) box(g, x + 6, 42 + k * 13, 18, 9, 1.5, '#A9B6C4', '#7B8A9B', 0.8);
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.arc(x + 15, 110 + k * 14, 2.8, 0, 7);
      g.globalAlpha = 0.45 + 0.55 * Math.max(0, Math.sin(t * (2.2 + ((k + mi) % 4) * 0.7) + k + mi));
      g.fillStyle = (k + mi) % 2 ? '#23C1E6' : '#5C97C7';
      g.fill();
      g.globalAlpha = 1;
    }
    box(g, x + 4, 204, 22, 34, 2, '#5D6B7C');
  });
}
