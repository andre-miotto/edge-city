/** Estado da conversa com o assistente de IA e animação da consulta via MCP. */
import * as THREE from 'three';
import { reduceMotion, el } from '../core/env';
import { QP } from '../screens/wesScreen';
import { ease, prog } from '../core/math';
import { LAY, QS, drawChat, typeOut, type ChatItem, type ChatState } from '../screens/chatScreen';
import type { AfterFlows } from '../ctx';
export function createConversation(ctx: AfterFlows) {
  // ---------------- estado da conversa
  const st: ChatState = { items: [], scroll: 0, typed: '', caret: false };
  const conv = { qi: -1, t0: 0, active: false, doneAt: -99, auto: true, resetAt: -1 };
  const statusEl = el('status');
  let lastStatus = '';
  function setStatus(h: string) {
    if (h !== lastStatus) {
      statusEl.innerHTML = h;
      lastStatus = h;
    }
  }
  function askNext(now: number) {
    if (conv.active) return;
    if (conv.qi >= QS.length - 1) {
      conv.qi = -1;
    }
    conv.qi++;
    conv.t0 = now;
    conv.active = true;
  }
  function resetChat() {
    conv.qi = -1;
    conv.active = false;
  }
  function itemsAt(now: number) {
    const items: ChatItem[] = [];
    let sc = 0;
    const lastQ = conv.active ? conv.qi : conv.qi;
    for (let i = 0; i <= lastQ && i < QS.length; i++) {
      const q = QS[i],
        p = q.plan;
      const tt = i === conv.qi && conv.active ? now - conv.t0 : 999;
      const aB = ease(prog(tt, p.send, p.send + 0.5)),
        aP = ease(prog(tt, p.pill, p.pill + 0.45)),
        aA = ease(prog(tt, p.card, p.card + 0.45));
      items.push({ k: 'b', y: LAY.b[i], text: q.text, a: aB });
      items.push({ k: 'p', y: LAY.p[i], pills: q.pills, a: aP });
      const it: ChatItem = {
        k: 'a',
        y: LAY.a[i],
        h: LAY.ah[i],
        q: q,
        a: aA,
        u: ease(prog(tt, p.ans[0], p.ans[1])),
        c: prog(tt, p.chart[0], p.chart[1]),
      };
      if (q.kind === 'text') it.lines = typeOut(prog(tt, p.ans[0], p.ans[1]), q.lines || []);
      if (q.kind === 'analysis') {
        it.lines = typeOut(prog(tt, p.ans[0], p.ans[1]), q.lines || []);
        it.sug = typeOut(prog(tt, p.sug[0], p.sug[1]), [q.sug || ''])[0];
      }
      items.push(it);
      [
        [LAY.b[i] + 50, aB],
        [LAY.p[i] + 30, aP],
        [LAY.a[i] + LAY.ah[i], aA],
      ].forEach((b) => {
        sc = Math.max(sc, Math.max(0, b[0] - LAY.visB) * b[1]);
      });
    }
    return { items: items, scroll: sc };
  }
  // ---- atualização por quadro: chips da consulta MCP, anéis nos módulos do WES, status e desenho da conversa
  const { chipReq, chipBack, toolChips, retChips, rings, curveM, toW, plen, ppt, chatCv, as } = ctx;
  const tmp = new THREE.Vector3();
  /** Chip de retorno de cada ferramenta MCP. */
  const RET_CHIP: Record<string, string> = { tag: 'valor da tag', hist: 'histórico', alarm: 'alarmes' };
  let lastChat = -1;
  function updateConversation(t: number) {
    const ct = conv.active ? t - conv.t0 : -1;
    const ringA: Record<string, number> = { telas: 0, alarm: 0, disp: 0, tag: 0, hist: 0, mcp: 0 };
    [chipReq, chipBack].forEach((c) => (c.material.opacity = 0));
    Object.values(toolChips).forEach((c) => (c.material.opacity = 0));
    Object.values(retChips).forEach((c) => (c.material.opacity = 0));
    st.typed = '';
    st.caret = (t * 2.2) % 1 < 0.62;
    if (conv.active) {
      const q = QS[conv.qi],
        p = q.plan;
      if (ct < p.send) {
        st.typed = q.text.substring(0, q.kt.filter((k) => k <= ct).length);
      }
      const sw = (a, b, x) => ease(prog(x, a, a + 0.2)) * (1 - ease(prog(x, b - 0.2, b)));
      // pedido: IA -> MCP (pelo cabo)
      if (ct >= p.req[0] - 0.1 && ct <= p.req[1] + 0.1) {
        const u = ease(prog(ct, p.req[0], p.req[1]));
        chipReq.position.copy(curveM.getPointAt(1 - u)).add(tmp.set(0, 0.75, 0));
        chipReq.material.opacity = sw(p.req[0], p.req[1], ct);
      }
      q.tools.forEach((tl, k) => {
        const w = p.tools[k],
          pts = QP[tl[1]],
          L = plen(pts);
        if (ct >= w[0] - 0.1 && ct <= w[1] + 0.1) {
          const s = ease(prog(ct, w[0], w[1])) * L;
          const pp = ppt(pts, s);
          const c = toolChips[tl[0]];
          c.position.copy(toW(pp[0], pp[1], 0.5)).add(tmp.set(0, 0.55, 0));
          c.material.opacity = sw(w[0], w[1], ct);
        }
        ringA[tl[1]] = Math.max(ringA[tl[1]], Math.sin(Math.PI * prog(ct, w[1], w[1] + 1.0)));
        const r = p.rets[k];
        if (ct >= r[0] - 0.1 && ct <= r[1] + 0.1) {
          const s = (1 - ease(prog(ct, r[0], r[1]))) * L;
          const pp = ppt(pts, s);
          const c = retChips[RET_CHIP[tl[1]]];
          c.position.copy(toW(pp[0], pp[1], 0.5)).add(tmp.set(0, 0.5, 0));
          c.material.opacity = sw(r[0], r[1], ct);
        }
      });
      ringA.mcp = Math.max(
        Math.sin(Math.PI * prog(ct, p.req[1] - 0.2, p.req[1] + 0.7)),
        Math.sin(Math.PI * prog(ct, p.cable[0] - 0.3, p.cable[0] + 0.5)),
      );
      if (ct >= p.cable[0] - 0.1 && ct <= p.cable[1] + 0.1) {
        const u = ease(prog(ct, p.cable[0], p.cable[1]));
        chipBack.position.copy(curveM.getPointAt(u)).add(tmp.set(0, 0.7, 0));
        chipBack.material.opacity = sw(p.cable[0], p.cable[1], ct);
      }
      if (ct < p.send) setStatus('<strong>Digitando</strong> · ' + q.text);
      else if (ct < p.cable[1]) setStatus('<strong>IA ' + q.status + '</strong>');
      else if (ct < p.end) setStatus('<strong>Resposta recebida</strong> · dados lidos no WES');
      if (ct >= p.end) {
        conv.active = false;
        conv.doneAt = t;
        setStatus(
          '<strong>IA pronta</strong> · ' +
            (conv.qi < QS.length - 1 ? 'próxima: ' + QS[conv.qi + 1].text : 'conversa concluída'),
        );
      }
    }
    if (!conv.active && conv.auto && !reduceMotion) {
      const wait = conv.qi >= QS.length - 1 ? 7 : 3.5;
      if (t - conv.doneAt > wait) {
        if (conv.qi >= QS.length - 1) resetChat();
        askNext(t);
      }
    }
    Object.keys(rings).forEach((k) => rings[k].userData.set(0.85 * (ringA[k] || 0)));
    // desenha a conversa (até ~30 vezes por segundo)
    if (t - lastChat > 1 / 30) {
      const lay = itemsAt(t);
      st.items = lay.items;
      st.scroll = lay.scroll;
      drawChat(chatCv, st);
      as.t.needsUpdate = true;
      lastChat = t;
    }
  }
  conv.doneAt = 4 - 3.5;
  return Object.assign(ctx, { updateConversation, askNext, conv, itemsAt, resetChat, setStatus, st });
}
