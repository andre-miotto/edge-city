/** Tela do assistente de IA: perguntas, roteiro temporal e desenho da conversa. */
import { box, check, icon, poly, rr, spark, tw, txt, vgrad, ctx2d } from '../core/canvas2d';
import { clamp, rng } from '../core/math';

export const R = rng(11);
export const CS = { w: 640, h: 772, s: 1.6, top: 52 };
export const LAY = { b: [74, 290, 590], p: [132, 348, 648], a: [172, 388, 688], ah: [92, 176, 214], visB: 630 };
type Span = [number, number];
type Icon = string;
/** Pergunta do roteiro da IA (o que é perguntado, ferramentas MCP usadas e a resposta mostrada). */
interface QuestionDef {
  text: string;
  pills: [string, Icon][];
  tools: [string, Icon][];
  kind: 'text' | 'oee' | 'analysis';
  lines?: string[];
  sug?: string;
  status: string;
}
/** Roteiro temporal (s) de uma pergunta: digitação, envio, chamadas de ferramenta, resposta… */
export interface Plan {
  type: Span;
  send: number;
  req: Span;
  tools: Span[];
  rets: Span[];
  cable: Span;
  pill: number;
  card: number;
  ans: Span;
  chart: Span;
  sug: Span;
  end: number;
}
export interface Question extends QuestionDef {
  plan: Plan;
  /** Instante em que cada letra da pergunta aparece. */
  kt: number[];
}
const QDEF: QuestionDef[] = [
  {
    text: 'Qual é a temperatura do motor agora?',
    pills: [['usando: ler valor da tag', 'search']],
    tools: [['ler valor da tag', 'tag']],
    kind: 'text',
    lines: ['O motor está a 68 °C,', 'dentro do limite de 75 °C.'],
    status: 'consultando Tags · UNS via MCP',
  },
  {
    text: 'Qual é o OEE da linha neste turno?',
    pills: [['usando: ler valor da tag', 'search']],
    tools: [['ler valor da tag', 'tag']],
    kind: 'oee',
    status: 'consultando Tags · UNS via MCP',
  },
  {
    text: 'Por que o OEE está abaixo de ontem?',
    pills: [
      ['usando: consultar histórico', 'clock'],
      ['usando: consultar alarmes', 'bell'],
    ],
    tools: [
      ['consultar histórico', 'hist'],
      ['consultar alarmes', 'alarm'],
    ],
    kind: 'analysis',
    lines: [
      'Ontem o OEE foi 85%; hoje está em 78%.',
      'A queda veio da disponibilidade: 3 paradas',
      'por atolamento na esteira (42 min, 14h–15h).',
    ],
    sug: 'Sugestão: verificar o alinhamento da esteira.',
    status: 'consultando Historian e Alarmes via MCP',
  },
];
export function plan(q: QuestionDef): Plan {
  const n = q.tools.length;
  const tools = q.tools.map((t, k): Span => [3.8 + k * 1.3, 4.9 + k * 1.3]);
  const rets = q.tools.map((t, k): Span => [5.1 + k * 1.3, 6.1 + k * 1.3]);
  const last = 6.1 + (n - 1) * 1.3;
  const pill = last + 1.2,
    card = pill + 0.35;
  const ans: Span = [card + 0.2, card + (q.kind === 'analysis' ? 2.6 : 1.7)];
  const chart: Span = [ans[1], ans[1] + 1.1];
  const sug: Span = [chart[1], chart[1] + 1.1];
  return {
    type: [0, 2.2],
    send: 2.45,
    req: [2.6, 3.7],
    tools,
    rets,
    cable: [last + 0.05, last + 1.15],
    pill,
    card,
    ans,
    chart,
    sug,
    end: (q.kind === 'analysis' ? sug[1] : ans[1]) + 0.4,
  };
}
export const QS: Question[] = QDEF.map((d) => {
  const q: Question = { ...d, plan: plan(d), kt: [] };
  let acc = 0;
  const iv: number[] = [];
  for (let i = 0; i < q.text.length; i++) {
    let d = (0.6 + 0.8 * R()) * 0.07;
    if (q.text[i] === ' ') d += 0.03;
    iv.push(d);
    acc += d;
  }
  let a = 0;
  iv.forEach((d) => {
    a += d;
    q.kt.push(q.plan.type[0] + (a / acc) * (q.plan.type[1] - q.plan.type[0]));
  });
  return q;
});
/** Item desenhado na conversa: balão da pergunta ('b'), ferramentas usadas ('p') ou resposta ('a'). */
export type ChatItem =
  | { k: 'b'; y: number; text: string; a: number }
  | { k: 'p'; y: number; pills: [string, string][]; a: number }
  | {
      k: 'a';
      y: number;
      h: number;
      q: Question;
      a: number;
      u: number;
      c: number;
      lines?: string[];
      sug?: string;
    };
export interface ChatState {
  items: ChatItem[];
  scroll: number;
  typed: string;
  caret: boolean;
}

/** Texto "digitado" até a fração `u` (0..1), distribuído pelas linhas. */
export function typeOut(u: number, lines: string[]): string[] {
  const tot = lines.reduce((x, l) => x + l.length, 0);
  let m = Math.floor(u * tot + 1e-4);
  return lines.map((l) => {
    const n = Math.min(m, l.length);
    m -= n;
    return l.substring(0, n);
  });
}
export function drawChat(cv: HTMLCanvasElement, st: ChatState) {
  const g = ctx2d(cv);
  g.setTransform(CS.s, 0, 0, CS.s, 0, 0);
  g.clearRect(0, 0, CS.w, CS.h);
  g.fillStyle = '#07182C';
  g.fillRect(0, 0, CS.w, CS.h);
  // rótulo
  const lw = tw(g, 'Aplicativo de IA', 16, 600) + 54;
  box(g, 0, 6, lw, 32, 16, '#0A5CB0', '#5DB8F0', 1.5);
  spark(g, 22, 22, 0.6, '#fff');
  txt(g, 'Aplicativo de IA', 40, 28, 16, 600, '#fff');
  txt(g, 'fora do WES · conectado via MCP', CS.w - 6, 28, 13, 500, '#8FB0D0', 'right');
  g.save();
  g.translate(0, CS.top);
  box(g, 0, 0, 640, 720, 22, vgrad(g, 0, 720, '#FFFFFF', '#E7F0FA'), '#9DB6D1', 1.5);
  g.save();
  rr(g, 0, 0, 640, 720, 22);
  g.clip();
  g.fillStyle = '#0D2640';
  g.fillRect(0, 0, 640, 50);
  g.restore();
  spark(g, 34, 26, 1.05, '#23C1E6');
  spark(g, 48, 10, 0.38, '#23C1E6');
  txt(g, 'Assistente de IA', 66, 33, 21, 700, '#fff');
  [574, 592, 610].forEach((x) => {
    g.beginPath();
    g.arc(x, 25, 4, 0, 7);
    g.fillStyle = '#3E5876';
    g.fill();
  });
  // conteúdo
  g.save();
  g.beginPath();
  g.rect(0, 50, 640, 590);
  g.clip();
  g.translate(0, -st.scroll);
  st.items.forEach((it) => {
    if (it.a <= 0.002) return;
    g.save();
    g.globalAlpha = it.a;
    g.translate(0, (1 - it.a) * 14);
    if (it.k === 'b') {
      const w = tw(g, it.text, 20, 600) + 44;
      box(g, 616 - w, it.y, w, 50, 22, '#0B56A0');
      txt(g, it.text, 616 - w + 22, it.y + 32, 20, 600, '#fff');
    }
    if (it.k === 'p') {
      let x = 24;
      it.pills.forEach((pd) => {
        const w = tw(g, pd[0], 14, 600) + 80;
        box(g, x, it.y, w, 30, 15, '#E3F1FC', '#7FC0EA', 1.5);
        icon(g, pd[1], x + 20, it.y + 14, '#0B3C6B', 2.2, 0.85);
        txt(g, pd[0], x + 38, it.y + 20, 14, 600, '#0B3C6B');
        check(g, x + w - 19, it.y + 15, 10);
        x += w + 8;
      });
    }
    if (it.k === 'a') {
      box(g, 24, it.y, 592, it.h, 16, '#fff', '#CFE0F2', 2);
      g.beginPath();
      g.arc(62, it.y + 36, 18, 0, 7);
      g.fillStyle = '#0A4F94';
      g.fill();
      spark(g, 62, it.y + 36, 0.78, '#fff');
      const q = it.q,
        x0 = 96;
      if (q.kind === 'text') {
        (it.lines || []).forEach((l, i) => txt(g, l, x0, it.y + 40 + i * 30, 21, 500, '#10253B'));
      }
      if (q.kind === 'oee') {
        txt(g, 'OEE do turno: ' + Math.round(78 * it.u) + '%', x0, it.y + 44, 24, 700, '#10253B');
        (
          [
            ['Disponibilidade', 88],
            ['Performance', 93],
            ['Qualidade', 95],
          ] as [string, number][]
        ).forEach((r, k) => {
          const y = it.y + 84 + k * 34;
          const u = clamp(it.u * 1.25 - k * 0.12, 0, 1);
          txt(g, r[0], x0, y, 18, 500, '#3B5570');
          box(g, 270, y - 12, 270, 12, 6, '#DCE8F5');
          if (u > 0) box(g, 270, y - 12, Math.max(12, ((270 * r[1]) / 100) * u), 12, 6, '#0A5CB0');
          txt(g, Math.round(r[1] * u) + '%', 600, y, 18, 700, '#10253B', 'right');
        });
      }
      if (q.kind === 'analysis') {
        (it.lines || []).forEach((l, i) => txt(g, l, x0, it.y + 38 + i * 26, 19, 500, '#10253B'));
        (
          [
            ['Ontem', 85, '#8FB0D0'],
            ['Hoje', 78, '#0A5CB0'],
          ] as [string, number, string][]
        ).forEach((r, k) => {
          const y = it.y + 128 + k * 26;
          const u = clamp(it.c * 1.2 - k * 0.2, 0, 1);
          if (it.c <= 0) return;
          g.globalAlpha = it.a * Math.min(1, it.c * 3);
          txt(g, r[0], x0, y, 16, 600, '#3B5570');
          box(g, 160, y - 11, 370, 12, 6, '#DCE8F5');
          if (u > 0) box(g, 160, y - 11, Math.max(12, ((370 * r[1]) / 100) * u), 12, 6, r[2]);
          txt(g, r[1] + '%', 600, y, 16, 700, '#10253B', 'right');
          g.globalAlpha = it.a;
        });
        txt(g, it.sug, x0, it.y + 192, 18, 700, '#0A4F94');
      }
    }
    g.restore();
  });
  g.restore();
  // entrada
  box(g, 24, 652, 592, 48, 24, '#fff', '#C3D0E0', 2);
  g.save();
  g.beginPath();
  g.rect(38, 654, 520, 44);
  g.clip();
  if (st.typed) {
    const w = tw(g, st.typed, 18, 400);
    const sx = w > 500 ? 48 - (w - 500) : 48;
    txt(g, st.typed, sx, 682, 18, 400, '#12253A');
    if (st.caret) {
      g.fillStyle = '#0A4F94';
      g.fillRect(sx + w + 2, 666, 2, 22);
    }
  } else {
    txt(g, 'Escreva uma mensagem...', 48, 682, 18, 400, '#9FB0C6');
    if (st.caret) {
      g.fillStyle = '#0A4F94';
      g.fillRect(48, 666, 2, 22);
    }
  }
  g.restore();
  g.beginPath();
  g.arc(590, 676, 18, 0, 7);
  g.fillStyle = '#0A4F94';
  g.fill();
  poly(
    g,
    [
      [582, 676],
      [598, 676],
    ],
    '#fff',
    2.6,
  );
  poly(
    g,
    [
      [591, 668],
      [599, 676],
      [591, 684],
    ],
    '#fff',
    2.6,
  );
  g.restore();
}
