/**
 * Botões e mensagens do HUD: perguntas à IA, modo automático, visita, voltar ao início,
 * menu de áreas (pontos de interesse) e pausa da célula 01.
 */
import { QS } from '../screens/chatScreen';
import { LOGI } from './tour';
import type { AfterWmrPanel } from '../ctx';
import { el } from '../core/env';

export function createHud(ctx: AfterWmrPanel) {
  const { canvas, conv, askNext, resetChat, time, tour, controls } = ctx;

  el('bAsk').addEventListener('click', () => {
    if (conv.active) return;
    if (conv.qi >= QS.length - 1) resetChat();
    askNext(time.clock);
  });

  const autoBtn = el('bAuto');
  autoBtn.addEventListener('click', () => {
    conv.auto = !conv.auto;
    autoBtn.setAttribute('aria-pressed', String(conv.auto));
  });

  el('bHome').addEventListener('click', () => controls.goHome());

  el('bTour').addEventListener('click', () => {
    if (tour.state.on && tour.state.kind === 'tour') tour.stop();
    else tour.start();
  });

  // Pausa explícita da célula 01 (robô, alimentação e esteira). Fluxos de dados, IA e Linha 2 continuam.
  const pauseBtn = el('bPause'),
    cellEl = el('cell');
  pauseBtn.addEventListener('click', () => {
    time.cellRun = !time.cellRun;
    pauseBtn.setAttribute('aria-pressed', String(!time.cellRun));
    pauseBtn.textContent = time.cellRun ? 'Pausar célula' : 'Retomar célula';
    cellEl.innerHTML = time.cellRun
      ? '<strong>Célula 01 em operação</strong> · ciclo de 16 s'
      : '<strong>Célula 01 pausada</strong> · demonstração';
  });

  // Menu de áreas
  const poiEl = el('poi'),
    areasBtn = el('bAreas');
  Object.keys(ctx.AREAS.pois).forEach((n) => {
    const b = document.createElement('button');
    b.textContent = n;
    b.setAttribute('role', 'menuitem');
    b.addEventListener('click', () => tour.flyTo(n));
    poiEl.appendChild(b);
  });
  {
    const b = document.createElement('button');
    b.className = 'wide';
    b.textContent = 'Visita da logística (almoxarifado → linha)';
    b.addEventListener('click', () => tour.start(LOGI, 'tour'));
    poiEl.appendChild(b);
  }
  function closePoi() {
    poiEl.classList.remove('on');
    areasBtn.setAttribute('aria-expanded', 'false');
  }

  // Menu (hambúrguer): reúne o que é secundário; fecha com Esc, ao tocar na cena ou ao iniciar uma visita
  const menuEl = el('menu'),
    menuBtn = el('bMenu');
  function setMenu(on: boolean) {
    menuEl.classList.toggle('on', on);
    menuBtn.setAttribute('aria-expanded', String(on));
    if (!on) closePoi();
  }
  menuBtn.addEventListener('click', () => setMenu(!menuEl.classList.contains('on')));
  canvas.addEventListener('pointerdown', () => setMenu(false));
  areasBtn.addEventListener('click', () => {
    const on = !poiEl.classList.contains('on');
    poiEl.classList.toggle('on', on);
    areasBtn.setAttribute('aria-expanded', String(on));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  ctx.tour.hooks.onStart = () => setMenu(false);
  return Object.assign(ctx, {
    hud: { closePoi },
  });
}
