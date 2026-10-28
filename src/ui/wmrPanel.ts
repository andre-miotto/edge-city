/**
 * Painel contextual do WMR selecionado (estado, origem, destino, material, progresso, próxima estação).
 * Os dados vêm da simulação ilustrativa em logistics/fleet.js; não há integração com o WMR Fleet Management.
 */
import * as THREE from 'three';
import { clamp } from '../core/math';
import type { AfterTour } from '../ctx';
import { el } from '../core/env';
import type { Wmr } from '../logistics/types';
import { isMesh } from '../core/builder';

const MAT_FULL: Record<string, string> = {
  'WMR-01': 'Tampas e rolamentos · 2 caixas KLT',
  'WMR-02': 'Eixos e tampas usinados · 2 caixas KLT',
};

export function createWmrPanel(ctx: AfterTour) {
  const { canvas, camera, AREAS } = ctx;
  const ray = new THREE.Raycaster(),
    ndc = new THREE.Vector2();
  const panel = el('wmr');
  const FIELDS = ['wmrId', 'wmrState', 'wmrFrom', 'wmrTo', 'wmrMat', 'wmrNext', 'wmrBat', 'wmrBar', 'wmrProg'] as const;
  const PE = {} as Record<(typeof FIELDS)[number], HTMLElement>;
  FIELDS.forEach((k) => (PE[k] = el(k)));
  let selected: Wmr | null = null,
    last = 0;

  /** Retorna o WMR sob o ponteiro (ou null). */
  function pick(e: { clientX: number; clientY: number }): Wmr | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const objs: THREE.Object3D[] = [];
    AREAS.fleet.forEach((W) =>
      W.m.g.traverse((o) => {
        if (isMesh(o) && o !== W.m.ring) objs.push(o);
      }),
    );
    const h = ray.intersectObjects(objs, false);
    if (!h.length || h[0].distance > 70) return null;
    return AREAS.fleet.find((W) => W.id === h[0].object.userData.wmr) || null;
  }

  function select(W: Wmr | null) {
    if (selected) selected.m.ring.material.opacity = 0;
    selected = W;
    panel.classList.toggle('on', !!W);
    if (W) {
      W.m.ring.material.opacity = 0.85;
      render();
    }
  }

  function render() {
    const W = selected;
    if (!W) return;
    PE.wmrId.textContent = W.id;
    PE.wmrState.textContent = W.state;
    if (W.mode === 'charge') {
      PE.wmrFrom.textContent = 'Estação de recarga';
      PE.wmrTo.textContent = '—';
      PE.wmrMat.textContent = 'sem carga';
      PE.wmrNext.textContent = 'aguardando tarefa';
      PE.wmrBat.textContent = Math.round(W.charge * 100) + '%';
      PE.wmrBar.style.width = Math.round(W.charge * 100) + '%';
      PE.wmrProg.textContent = 'Carga da bateria (ilustrativa)';
      return;
    }
    const leg = W.legs[W.li];
    const next = W.mode === 'drive' ? leg : W.legs[(W.li + 1) % W.legs.length];
    PE.wmrFrom.textContent = leg.from || '';
    PE.wmrTo.textContent = leg.to || '';
    PE.wmrMat.textContent = W.cargo.length
      ? W.cargo[0].userData.full
        ? MAT_FULL[W.id]
        : 'Caixas KLT vazias (retorno)'
      : 'em troca de caixas';
    PE.wmrNext.textContent = next.to || '';
    let done = 0;
    for (let i = 0; i < W.li; i++) done += W.legs[i].path.L;
    const pr = clamp((done + W.s) / W.total, 0, 1);
    PE.wmrBar.style.width = Math.round(pr * 100) + '%';
    PE.wmrProg.textContent = 'Progresso do ciclo de abastecimento: ' + Math.round(pr * 100) + '%';
    W.batt = W.batt || (W.id === 'WMR-01' ? 0.84 : 0.71);
    PE.wmrBat.textContent = Math.round(W.batt * 100) + '%';
  }

  function update(t: number) {
    if (selected && t - last > 0.25) {
      last = t;
      render();
    }
  }

  el('wmrClose').addEventListener('click', () => select(null));
  ctx.controls.hooks.click = (e) => select(pick(e));
  ctx.controls.hooks.hover = (e) => (pick(e) ? 'pointer' : '');
  return Object.assign(ctx, {
    wmrPanel: {
      pick,
      select,
      update,
      get selected() {
        return selected;
      },
    },
  });
}
