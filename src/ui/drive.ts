/**
 * Empilhadeira dirigível. Perto dela aparece "E · Dirigir"; ao entrar, W/S aceleram e dão ré, A/D esterçam e a
 * câmera a segue em terceira pessoa; E de novo desce. Uma visita guiada ou voo da câmera também faz descer.
 * A física está em areas/forkliftPhysics.ts; aqui ficam o modelo na cena, o aviso na tela e a câmera.
 */
import { clamp } from '../core/math';
import { el } from '../core/env';
import { makeForklift } from '../areas/forklift';
import {
  FORKLIFT,
  FORKLIFT_HOME,
  FORKLIFT_SPOTS,
  forkliftBlocked,
  stepForklift,
  type ForkliftState,
} from '../areas/forkliftPhysics';
import { EYE, aim } from './controls';
import type { Box2 } from '../scene/materials';
import type { AfterHud } from '../ctx';

/** Distância (m) do jogador ao centro da empilhadeira para o aviso aparecer. */
const REACH = 3.6;
/** Câmera de perseguição: metros atrás, altura e ponto de mira à frente da empilhadeira. */
const CHASE = { back: 6.8, up: 3.8, ahead: 2.5, look: 1.2, follow: 5 };
/** Mesmos limites da câmera a pé (ui/controls.ts). */
const CAM = { x0: -65.2, x1: 65.2, z0: -38.3, z1: 55.2 };

export function createDrive(ctx: AfterHud) {
  const { MP, colliders, controls, scene } = ctx;
  const { player, keys, vehicle, hooks, collide } = controls;

  const model = makeForklift(MP);
  scene.add(model.g);
  const S: ForkliftState = { ...FORKLIFT_HOME, v: 0, steer: 0 };

  // Colisor dinâmico: acompanha a empilhadeira para a pé não atravessá-la. O piso assado ignora colisores dinâmicos.
  const own: Box2 = { x0: 0, x1: 0, z0: 0, z1: 0, dynamic: true };
  colliders.push(own);
  const blocked = (x: number, z: number, h: number) => forkliftBlocked(colliders, own, x, z, h);

  function sync() {
    model.g.position.set(S.x, 0, S.z);
    model.g.rotation.y = S.h;
    const sh = Math.sin(S.h),
      ch = Math.cos(S.h);
    let x0 = Infinity,
      x1 = -Infinity,
      z0 = Infinity,
      z1 = -Infinity;
    for (const off of FORKLIFT_SPOTS) {
      const px = S.x + sh * off,
        pz = S.z + ch * off;
      x0 = Math.min(x0, px - FORKLIFT.R);
      x1 = Math.max(x1, px + FORKLIFT.R);
      z0 = Math.min(z0, pz - FORKLIFT.R);
      z1 = Math.max(z1, pz + FORKLIFT.R);
    }
    Object.assign(own, { x0, x1, z0, z1 });
  }
  sync();

  // ---- aviso na tela
  const box = el('interact'),
    btn = el('interactBtn'),
    nameEl = el('interactName'),
    actEl = el('interactAction');
  let driving = false,
    shown = '';
  function showPrompt(name: string, action: string) {
    const key = name + '|' + action;
    if (key === shown) return;
    shown = key;
    box.hidden = !name;
    nameEl.textContent = name;
    actEl.textContent = action;
  }

  function enter() {
    hooks.takeOver();
    driving = true;
    vehicle.active = true;
  }
  /** Desce pela esquerda da empilhadeira, em pé e olhando na direção em que ela apontava. */
  function leave() {
    driving = false;
    vehicle.active = false;
    S.v = 0;
    S.steer = 0;
    player.pos.set(S.x + Math.cos(S.h) * 2.0, EYE, S.z - Math.sin(S.h) * 2.0);
    collide(player.pos);
    player.yaw = S.h + Math.PI;
    player.pitch = -0.05;
  }
  function toggle() {
    if (driving) leave();
    else if (canEnter()) enter();
  }
  const canEnter = () =>
    !hooks.isGuided() && player.pos.y < 6 && Math.hypot(player.pos.x - S.x, player.pos.z - S.z) < REACH;

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyE' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    toggle();
  });
  btn.addEventListener('click', toggle); // toque: sem teclado, o próprio aviso é o botão

  // "Voltar ao início" durante a direção primeiro desce da empilhadeira
  const goHome = controls.goHome;
  controls.goHome = () => {
    if (driving) leave();
    goHome();
  };

  function chase(dt: number) {
    const sh = Math.sin(S.h),
      ch = Math.cos(S.h),
      k = 1 - Math.exp(-dt * CHASE.follow);
    player.pos.x += (S.x - sh * CHASE.back - player.pos.x) * k;
    player.pos.y += (CHASE.up - player.pos.y) * k;
    player.pos.z += (S.z - ch * CHASE.back - player.pos.z) * k;
    player.pos.x = clamp(player.pos.x, CAM.x0, CAM.x1);
    player.pos.z = clamp(player.pos.z, CAM.z0, CAM.z1);
    aim(
      player,
      S.x + sh * CHASE.ahead - player.pos.x,
      CHASE.look - player.pos.y,
      S.z + ch * CHASE.ahead - player.pos.z,
    );
  }

  /** Chamado a cada quadro, depois de controls.update (que não move o jogador enquanto dirige). */
  function update(dt: number) {
    if (driving && hooks.isGuided()) leave(); // uma visita ou voo assumiu a câmera
    if (driving) {
      const moved = stepForklift(
        S,
        { throttle: (keys.f ? 1 : 0) - (keys.b ? 1 : 0), steer: (keys.l ? 1 : 0) - (keys.r ? 1 : 0) },
        dt,
        blocked,
      );
      model.wheels.forEach((w) => (w.rotation.x += moved / FORKLIFT.WHEEL_R));
      sync();
      chase(dt);
      showPrompt('Empilhadeira · W A S D', 'Descer');
    } else if (canEnter()) {
      showPrompt('Empilhadeira', 'Dirigir');
    } else {
      showPrompt('', '');
    }
  }

  return Object.assign(ctx, {
    drive: { update, enter, leave, isDriving: () => driving, state: S },
  });
}
