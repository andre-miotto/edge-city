/** Arte 2D da tela do WES (Solução Linha 1) e coordenadas usadas pelos fluxos sobrepostos. */
import { box, icon, line, poly, rr, tw, txt, vgrad, ctx2d } from '../core/canvas2d';

export const WS = { ox: 1500, oy: 300, w: 1720, h: 1060, s: 1.6 };
export const BX = { x: 1600, y: 330, w: 1520, h: 1004 };
export const G4 = {
  telas: { x: 1680, y: 466, w: 880, h: 380 },
  alarm: { x: 2600, y: 466, w: 440, h: 380 },
  disp: { x: 1680, y: 886, w: 310, h: 248 },
  tags: { x: 2030, y: 886, w: 530, h: 248 },
  hist: { x: 2600, y: 886, w: 440, h: 248 },
};
export const ROW3 = { xs: [1680, 2030, 2380, 2730], y: 1174, w: 310, h: 120 };
export const QY = 1010,
  MCPX = 3120;
export const MAIN = [
  [1678, QY],
  [2050, QY],
];
export const RAM = {
  hist: [
    [2560, QY],
    [2632, QY],
  ],
  telas: [
    [2300, 886],
    [2300, 846],
  ],
  alarm: [
    [2520, 886],
    [2520, 866],
    [2660, 866],
    [2660, 846],
  ],
};
export const QP = {
  hist: [
    [MCPX, QY],
    [3040, QY],
  ],
  alarm: [
    [MCPX, QY],
    [3080, QY],
    [3080, 656],
    [3040, 656],
  ],
  tag: [
    [MCPX, QY],
    [3080, QY],
    [3080, 1154],
    [2300, 1154],
    [2300, 1134],
  ],
};
export const PILLS = [
  { x: 1700, w: 86, t: 'Channel' },
  { x: 1814, w: 64, t: 'Node' },
  { x: 1906, w: 64, t: 'Point' },
];
export function card(g, c, title, ic, sub?) {
  box(g, c.x, c.y, c.w, c.h, 16, vgrad(g, c.y, c.y + c.h, '#103F72', '#0A2B4F'), '#2F7BC0', 2);
  icon(g, ic, c.x + 30, c.y + 29, '#8FD3F5');
  txt(g, title, c.x + 52, c.y + 37, 21, 700, '#fff');
  if (sub) txt(g, sub, c.x + c.w - 20, c.y + 36, 13, 600, '#8FB0D0', 'right');
  line(g, c.x + 18, c.y + 56, c.x + c.w - 18, c.y + 56, 'rgba(47,123,192,.5)', 1);
}
export function drawHMI(g) {
  g.save();
  g.translate(1706.5, 526);
  g.scale(0.975, 0.975);
  g.translate(-1696, -512);
  box(g, 1696, 512, 848, 318, 12, '#0A1424', '#3D5A78', 1.5);
  box(g, 1704, 520, 832, 302, 4, '#E3E7EB');
  box(g, 1704, 520, 832, 32, 4, '#34495E');
  g.fillStyle = '#34495E';
  g.fillRect(1704, 540, 832, 12);
  txt(g, 'Linha 1 — Visão geral', 1718, 541, 15, 600, '#fff');
  let tx = 2522;
  [
    ['Alarmes', 0],
    ['Tendências', 0],
    ['Visão geral', 1],
  ].forEach((tb) => {
    const w = tw(g, tb[0], 13, 600) + 22;
    tx -= w;
    if (tb[1]) box(g, tx, 524, w, 24, 3, '#4D6680');
    txt(g, tb[0], tx + w / 2, 541, 13, 600, tb[1] ? '#fff' : '#BFCBD7', 'center');
    tx -= 6;
  });
  box(g, 1716, 564, 470, 222, 4, '#F2F4F6', '#C3CBD4', 1.2);
  txt(g, 'Esteira 01', 1728, 584, 14, 700, '#2F3E4D');
  const sw = tw(g, 'Em operação', 12, 600) + 30;
  box(g, 2174 - sw, 571, sw, 20, 10, '#fff', '#8E9AA6', 1);
  g.beginPath();
  g.arc(2174 - sw + 11, 581, 3.5, 0, 7);
  g.fillStyle = '#1F4E7A';
  g.fill();
  txt(g, 'Em operação', 2174 - sw + 19, 585, 12, 600, '#2F3E4D');
  line(g, 1760, 718, 1760, 760, '#8E9AA6', 3);
  line(g, 1990, 718, 1990, 760, '#8E9AA6', 3);
  line(g, 1736, 762, 2110, 762, '#B5BEC8', 2);
  box(g, 1740, 700, 272, 18, 9, '#9AA5B1', '#6B7785', 1.2);
  line(g, 1750, 704, 2002, 704, '#6B7785', 2.5, [8, 6]);
  [1749, 2003].forEach((cx) => {
    g.beginPath();
    g.arc(cx, 709, 9, 0, 7);
    g.fillStyle = '#C3CBD4';
    g.fill();
    g.strokeStyle = '#6B7785';
    g.lineWidth = 1.2;
    g.stroke();
  });
  [1772, 1868, 1946].forEach((x) => {
    box(g, x, 681, 26, 18, 5, '#4D7FB0', '#2E5478', 1);
    for (let k = 1; k < 4; k++) line(g, x + k * 6.5, 683, x + k * 6.5, 697, '#2E5478', 1.2);
    box(g, x + 8, 676, 9, 6, 1.5, '#4D7FB0', '#2E5478', 1);
    line(g, x + 26, 690, x + 32, 690, '#6B7785', 2.2);
  });
  box(g, 2018, 684, 72, 52, 6, '#B3BCC6', '#6B7785', 1.2);
  for (let k = 0; k < 6; k++) line(g, 2027 + k * 10, 690, 2027 + k * 10, 730, '#7D8996', 2.2);
  g.fillStyle = '#8E9AA6';
  g.fillRect(2012, 704, 6, 12);
  txt(g, 'Motor01', 2054, 756, 12, 600, '#2F3E4D', 'center');
  poly(
    g,
    [
      [2070, 684],
      [2070, 640],
      [2080, 640],
    ],
    '#6B7785',
    1.5,
  );
  g.beginPath();
  g.arc(2070, 684, 3, 0, 7);
  g.fillStyle = '#1F4E7A';
  g.fill();
  box(g, 2080, 624, 100, 32, 3, '#fff', '#6B7785', 1.2);
  txt(g, 'TT-01', 2087, 644, 10, 600, '#6B7785');
  txt(g, '68,0 °C', 2175, 645, 13, 700, '#1C2B3A', 'right');
  [
    ['Temperatura', '68,0 °C', 'temp'],
    ['OEE do turno', '78 %', 'oee'],
    ['Paradas no turno', '3', 'par'],
  ].forEach((r, k) => {
    const y = 564 + k * 77;
    box(g, 2198, y, 326, 68, 4, '#F2F4F6', '#C3CBD4', 1.2);
    txt(g, r[0], 2210, y + 21, 12, 600, '#5A6B7C');
    txt(g, r[1], 2210, y + 53, 24, 700, '#1C2B3A');
    if (r[2] !== 'par') {
      const f = r[2] === 'temp' ? 0.68 : 0.78;
      box(g, 2350, y + 40, 160, 8, 4, '#D3D9DF');
      box(g, 2350, y + 40, 160 * f, 8, 4, '#4D6A86');
    }
    if (r[2] === 'temp') {
      line(g, 2470, y + 35, 2470, y + 53, '#2F3E4D', 2);
      txt(g, 'limite 75 °C', 2510, y + 28, 11, 600, '#5A6B7C', 'right');
    }
    if (r[2] === 'oee') txt(g, 'meta 85 %', 2510, y + 28, 11, 600, '#5A6B7C', 'right');
    if (r[2] === 'par') txt(g, '14h–15h', 2510, y + 53, 13, 600, '#5A6B7C', 'right');
  });
  box(g, 1716, 794, 808, 22, 3, '#D5DBE1');
  txt(g, 'Alarmes ativos: 0   ·   Último: 14:51 Atolamento na esteira (normalizado)', 1728, 809, 12, 600, '#3A4A5A');
  g.restore();
}
export function drawWES(cv, imgs) {
  const g = ctx2d(cv);
  g.setTransform(WS.s, 0, 0, WS.s, -WS.ox * WS.s, -WS.oy * WS.s);
  g.fillStyle = '#07182C';
  g.fillRect(WS.ox, WS.oy, WS.w, WS.h);
  const vg = g.createRadialGradient(2360, 800, 100, 2360, 800, 1100);
  vg.addColorStop(0, 'rgba(20,70,130,.35)');
  vg.addColorStop(1, 'rgba(6,21,40,0)');
  g.fillStyle = vg;
  g.fillRect(WS.ox, WS.oy, WS.w, WS.h);
  // caixa da solução
  box(g, BX.x, BX.y, BX.w, BX.h, 24, 'rgba(9,33,62,.92)', '#1F62A3', 3);
  g.save();
  rr(g, BX.x, BX.y, BX.w, 96, 24);
  g.clip();
  g.fillStyle = '#00579D';
  g.fillRect(BX.x, BX.y, BX.w, 96);
  g.restore();
  g.fillStyle = '#00579D';
  g.fillRect(BX.x, BX.y + 50, BX.w, 46);
  box(g, BX.x + 24, BX.y + 18, 60, 60, 14, '#0A4A86', '#5DB8F0', 1.5);
  icon(g, 'solution', BX.x + 54, BX.y + 48, '#fff', 2.4);
  txt(g, 'Solução Linha 1', BX.x + 102, BX.y + 50, 30, 700, '#fff');
  g.beginPath();
  g.arc(BX.x + 108, BX.y + 70, 5, 0, 7);
  g.fillStyle = '#23C1E6';
  g.fill();
  txt(g, 'Linha1.dbsln  ·  em execução (Runtime)', BX.x + 120, BX.y + 76, 16, 600, '#CFE6FA');
  const wx = BX.x + BX.w - 30;
  if (imgs.wes) g.drawImage(imgs.wes, wx - 62, BX.y + 17, 62, 62);
  txt(g, 'WES', wx - 76, BX.y + 50, 28, 700, '#fff', 'right');
  txt(g, 'WEGnology Edge Suite', wx - 76, BX.y + 72, 15, 600, '#DCEBFA', 'right');
  // Telas
  card(g, G4.telas, 'Telas (Displays)', 'monitor', 'IHM da linha');
  drawHMI(g);
  // Alarmes
  card(g, G4.alarm, 'Alarmes', 'bell');
  let x = 2620;
  [
    ['Ativos', '0', 1],
    ['Normalizados', '3', 0],
  ].forEach((c) => {
    const w = tw(g, c[0] + ' ' + c[1], 14, 700) + 30;
    const col = c[2] ? '#23C1E6' : '#5F8FB8';
    box(g, x, 534, w, 28, 14, c[2] ? 'rgba(35,193,230,.14)' : 'rgba(95,143,184,.14)', col, 1.5);
    txt(g, c[0] + ' ', x + 15, 553, 14, 600, c[2] ? '#8FE3F7' : '#B9D3EC');
    txt(g, c[1], x + w - 15, 553, 14, 700, '#fff', 'right');
    x += w + 10;
  });
  txt(g, 'Hora', 2628, 592, 12, 600, '#7FA0C2');
  txt(g, 'Mensagem', 2688, 592, 12, 600, '#7FA0C2');
  txt(g, 'Prioridade', 2862, 592, 12, 600, '#7FA0C2');
  txt(g, 'Estado', 3020, 592, 12, 600, '#7FA0C2', 'right');
  line(g, 2616, 602, 3024, 602, 'rgba(47,123,192,.6)', 1);
  ['14:51', '14:22', '14:05'].forEach((h, k) => {
    const y = 612 + k * 64;
    box(g, 2616, y, 408, 56, 8, '#0A2B4F', '#1E4F82', 1);
    box(g, 2616, y, 5, 56, 2.5, 'rgba(242,163,58,.8)');
    txt(g, h, 2628, y + 34, 15, 700, '#E8F3FC');
    txt(g, 'Atolamento na esteira', 2688, y + 25, 15, 600, '#fff');
    txt(g, 'Linha 1 · Esteira 01', 2688, y + 44, 12, 500, '#8FB0D0');
    g.fillStyle = 'rgba(242,163,58,.85)';
    g.fillRect(2862, y + 24, 9, 9);
    txt(g, 'Média', 2878, y + 33, 13, 600, '#E8D3B0');
    txt(g, 'Normalizado', 3016, y + 33, 13, 600, '#9FC3E6', 'right');
  });
  txt(g, '3 ocorrências no turno', 2620, 828, 12, 600, '#7FA0C2');
  // Dispositivos
  card(g, G4.disp, 'Dispositivos', 'net');
  [
    ['Modbus TCP', 'OPC UA', 'MQTT'],
    ['EtherNet/IP', '+100 conectores'],
  ].forEach((r, ri) => {
    let x = 1700;
    const y = 1042 + ri * 28;
    r.forEach((p) => {
      const w = tw(g, p, 12, 700) + 18;
      box(g, x, y, w, 22, 11, '#0A2B4F', '#3D8FD6', 1);
      txt(g, p, x + w / 2, y + 15, 12, 700, '#CFE6FA', 'center');
      x += w + 6;
    });
  });
  g.beginPath();
  g.arc(1706, 1112, 4, 0, 7);
  g.fillStyle = '#23C1E6';
  g.fill();
  txt(g, 'CLP_Linha1 · comunicação OK', 1716, 1116, 12, 600, '#B9D3EC');
  // Tags
  card(g, G4.tags, 'Tags · UNS', 'tags', 'valores em tempo real');
  box(g, 2046, 994, 498, 32, 6, 'rgba(15,90,165,.35)');
  g.strokeStyle = 'rgba(61,127,184,.7)';
  g.lineWidth = 1.2;
  g.stroke(new Path2D('M2063 966 V1073 M2063 983 H2076 M2087 993 V1010 H2100 M2063 1046 H2076 M2063 1073 H2076'));
  icon(g, 'folder', 2063, 956, '#8FD3F5', 1.8);
  txt(g, 'Linha1', 2076, 961, 15, 700, '#CFE6FA');
  icon(g, 'folder', 2087, 983, '#8FD3F5', 1.8);
  txt(g, 'Motor01', 2100, 988, 15, 600, '#CFE6FA');
  txt(g, 'Temperatura', 2108, 1015, 15, 600, '#fff');
  txt(g, '68,0 °C', 2536, 1016, 16, 700, '#fff', 'right');
  txt(g, 'OEE', 2084, 1051, 15, 600, '#CFE6FA');
  txt(g, '78 %', 2536, 1052, 16, 700, '#fff', 'right');
  txt(g, 'Paradas', 2084, 1078, 15, 600, '#CFE6FA');
  txt(g, '3', 2536, 1079, 16, 700, '#fff', 'right');
  txt(g, 'Empresa / Planta / Linha1', 2050, 1116, 12, 600, '#7FA0C2');
  // Historian
  card(g, G4.hist, 'Historian', 'db', 'banco de dados');
  g.fillStyle = (() => {
    const gr = g.createLinearGradient(2632, 0, 2682, 0);
    gr.addColorStop(0, '#0A3A6C');
    gr.addColorStop(0.45, '#1468B4');
    gr.addColorStop(1, '#0A3A6C');
    return gr;
  })();
  g.beginPath();
  g.moveTo(2632, 988);
  g.lineTo(2632, 1032);
  g.ellipse(2657, 1032, 25, 8, 0, Math.PI, 0, true);
  g.lineTo(2682, 988);
  g.closePath();
  g.fill();
  g.strokeStyle = '#4CB4F0';
  g.lineWidth = 1.6;
  g.stroke();
  g.beginPath();
  g.ellipse(2657, 988, 25, 8, 0, 0, 7);
  g.fillStyle = '#1A6FC0';
  g.fill();
  g.strokeStyle = '#6CC6F5';
  g.stroke();
  txt(g, 'gravando', 2657, 1066, 12, 600, '#8FB0D0', 'center');
  txt(g, 'Motor01.Temperatura · últimas 8 h', 2704, 962, 12, 600, '#8FB0D0');
  const x0 = 2704,
    x1 = 3020,
    y0 = 978,
    y1 = 1096,
    ty = (v) => y1 - 10 - ((v - 58) / (80 - 58)) * (y1 - y0 - 20);
  box(g, x0, y0, x1 - x0, y1 - y0, 6, '#0A2B4F', '#1E4F82', 1);
  [60, 70, 80].forEach((v) => {
    line(g, x0 + 30, ty(v), x1 - 8, ty(v), 'rgba(47,123,192,.35)', 1);
    txt(g, '' + v, x0 + 24, ty(v) + 4, 10, 600, '#7FA0C2', 'right');
  });
  line(g, x0 + 30, ty(75), x1 - 8, ty(75), 'rgba(242,163,58,.6)', 1.2, [5, 4]);
  txt(g, 'limite', x1 - 10, ty(75) - 4, 10, 600, '#E8D3B0', 'right');
  const pts: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const u = i / 47;
    const v = 64.5 + 3.2 * u + 0.6 * Math.sin(i * 0.9) + 0.35 * Math.sin(i * 2.3);
    pts.push([x0 + 34 + u * (x1 - x0 - 50), ty(v)]);
  }
  poly(g, pts, '#23C1E6', 2.5);
  txt(g, '68 °C', pts[47][0] + 2, pts[47][1] - 12, 12, 700, '#DCEBFA', 'right');
  // demais módulos
  [
    ['Scripts', 'lógica e cálculos', 'code'],
    ['Relatórios', 'relatórios da produção', 'doc'],
    ['Datasets', 'consultas a bancos SQL', 'table'],
    ['Segurança', 'usuários e permissões', 'lock'],
  ].forEach((m, i) => {
    const x = ROW3.xs[i],
      y = ROW3.y;
    box(g, x, y, ROW3.w, ROW3.h, 16, vgrad(g, y, y + ROW3.h, '#103F72', '#0A2B4F'), '#2F7BC0', 2);
    g.beginPath();
    g.arc(x + 38, y + 40, 20, 0, 7);
    g.fillStyle = '#0F5AA5';
    g.fill();
    icon(g, m[2], x + 38, y + 40, '#E8F3FC');
    txt(g, m[0], x + 70, y + 47, 20, 700, '#fff');
    txt(g, m[1], x + 22, y + 92, 14, 500, '#8FB0D0');
  });
  // fluxo industrial e ramais
  line(g, 1600, QY, 2050, QY, 'rgba(35,193,230,.12)', 12);
  line(g, 1600, QY, 2050, QY, '#2B6AA3', 4);
  Object.values(RAM).forEach((p) => poly(g, p, '#2B6AA3', 3));
  PILLS.forEach((p) => {
    box(g, p.x, 995, p.w, 30, 15, '#0F5AA5', '#3D8FD6', 1.5);
    txt(g, p.t, p.x + p.w / 2, 1015, 14, 700, '#fff', 'center');
  });
  // consulta lógica
  Object.values(QP).forEach((p) => poly(g, p, 'rgba(191,217,242,.55)', 2.5, [9, 8]));
  // conectores de borda
  box(g, 1522, 976, 156, 68, 16, '#0A5CB0', '#23C1E6', 2.5);
  icon(g, 'net', 1548, QY, '#fff');
  txt(g, 'Industrial', 1570, QY - 4, 17, 700, '#fff');
  txt(g, 'Protocols', 1570, QY + 17, 17, 700, '#fff');
  box(g, 3058, 982, 124, 56, 16, '#0A5CB0', '#23C1E6', 2.5);
  icon(g, 'plug', 3087, QY - 2, '#fff', 2.4);
  txt(g, 'MCP', 3106, QY + 9, 24, 700, '#fff');
}
