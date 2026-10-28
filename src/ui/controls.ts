/**
 * Navegação livre: arrastar para olhar, WASD/setas para andar, Shift para correr, botões de toque.
 * Clique sem arrastar seleciona um WMR (painel em ui/wmrPanel.js).
 * A câmera começa elevada (visão geral) e desce até a altura dos olhos quando o visitante anda.
 */
import * as THREE from 'three';
import { clamp } from '../core/math';
import type { AfterConversation } from '../ctx';

const EYE = 1.75;
const BOUNDS = { x0: -65.2, x1: 65.2, z0: -38.3, z1: 55.2 };

/** Posição e direção do visitante (câmera em primeira pessoa). */
export interface Player {
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
}

export function aim(player: Player, dx: number, dy: number, dz: number) {
  player.yaw = Math.atan2(-dx, -dz);
  player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
}

/**
 * Pontos de extensão preenchidos pelas etapas seguintes (visita guiada e painel do WMR), que são montadas depois
 * dos controles. Os padrões deixam a navegação funcionando sozinha.
 */
export interface ControlHooks {
  /** O visitante assumiu a câmera (arrastou, andou, voltou ao início): interrompe visita ou voo. */
  takeOver: () => void;
  /** true enquanto uma visita ou voo controla a câmera. */
  isGuided: () => boolean;
  /** Clique simples (sem arrastar) no canvas. */
  click: (e: PointerEvent) => void;
  /** Cursor ao passar o ponteiro sem arrastar. */
  hover: (e: PointerEvent) => string;
}

export function createControls(ctx: AfterConversation) {
  const { canvas, colliders } = ctx;
  const hooks: ControlHooks = { takeOver: () => {}, isGuided: () => false, click: () => {}, hover: () => '' };
  const player: Player = { pos: new THREE.Vector3(-26, 11, 30), yaw: 0, pitch: 0 };
  aim(player, 20, -8.5, -38);
  const HOME = { pos: player.pos.clone(), yaw: player.yaw, pitch: player.pitch };
  type Key = 'f' | 'b' | 'l' | 'r' | 'run';
  const keys: Partial<Record<Key, boolean>> = {};
  let dragging = false,
    lx = 0,
    ly = 0,
    moved = 0,
    lastHover = 0;

  // ---- ponteiro: arrastar olha, clique seleciona WMR
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    moved = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    canvas.focus();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) {
      const n = performance.now();
      if (n - lastHover > 120) {
        lastHover = n;
        canvas.style.cursor = hooks.hover(e);
      }
      return;
    }
    const dx = e.clientX - lx,
      dy = e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 5) {
      hooks.takeOver();
      player.yaw -= dx * 0.0032;
      player.pitch = clamp(player.pitch - dy * 0.0032, -1.1, 1.1);
    }
  });
  const endDrag = () => {
    dragging = false;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', (e) => {
    if (dragging && moved < 6) hooks.click(e);
    endDrag();
  });
  canvas.addEventListener('pointercancel', endDrag);

  // ---- teclado e botões de toque
  const KM: Record<string, Key> = {
    KeyW: 'f',
    ArrowUp: 'f',
    KeyS: 'b',
    ArrowDown: 'b',
    KeyA: 'l',
    ArrowLeft: 'l',
    KeyD: 'r',
    ArrowRight: 'r',
  };
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement | null)?.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;
    const k = KM[e.code];
    if (k) {
      keys[k] = true;
      hooks.takeOver();
      e.preventDefault();
    }
    if (e.key === 'Shift') keys.run = true;
  });
  window.addEventListener('keyup', (e) => {
    const k = KM[e.code];
    if (k) keys[k] = false;
    if (e.key === 'Shift') keys.run = false;
  });
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
  });
  document.querySelectorAll<HTMLButtonElement>('#pad button').forEach((b) => {
    const k = b.dataset.k as Key;
    const on = (e: Event) => {
      e.preventDefault();
      keys[k] = true;
      hooks.takeOver();
    };
    const off = () => {
      keys[k] = false;
    };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });

  // ---- colisão 2D com os equipamentos (caixas alinhadas e uma caixa girada para a tela da IA)
  function collide(p: THREE.Vector3) {
    for (const c of colliders) {
      if ('r' in c) {
        const ca = Math.cos(-c.ang),
          sa = Math.sin(-c.ang);
        const dx = p.x - c.cx,
          dz = p.z - c.cz;
        const lx2 = dx * ca - dz * sa,
          lz = dx * sa + dz * ca;
        if (Math.abs(lx2) < c.hw && Math.abs(lz) < c.hd + 0.5) {
          const pz = (lz < 0 ? -1 : 1) * (c.hd + 0.5);
          p.x = c.cx + lx2 * ca + pz * sa;
          p.z = c.cz - lx2 * sa + pz * ca;
        }
        continue;
      }
      const x0 = c.x0 - 0.5,
        x1 = c.x1 + 0.5,
        z0 = c.z0 - 0.5,
        z1 = c.z1 + 0.5;
      if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
        const d = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z];
        const m = Math.min(...d);
        if (m === d[0]) p.x = x0;
        else if (m === d[1]) p.x = x1;
        else if (m === d[2]) p.z = z0;
        else p.z = z1;
      }
    }
    p.x = clamp(p.x, BOUNDS.x0, BOUNDS.x1);
    p.z = clamp(p.z, BOUNDS.z0, BOUNDS.z1);
  }

  /** Movimento a pé (ignorado enquanto uma visita ou voo controla a câmera). */
  function update(dt: number) {
    if (hooks.isGuided()) return;
    const sp = (keys.run ? 15 : 7.5) * dt;
    const fx = -Math.sin(player.yaw),
      fz = -Math.cos(player.yaw);
    let mx = 0,
      mz = 0;
    if (keys.f) {
      mx += fx;
      mz += fz;
    }
    if (keys.b) {
      mx -= fx;
      mz -= fz;
    }
    if (keys.l) {
      mx += fz;
      mz -= fx;
    }
    if (keys.r) {
      mx -= fz;
      mz += fx;
    }
    const ml = Math.hypot(mx, mz);
    if (ml > 0) {
      player.pos.x += (mx / ml) * sp;
      player.pos.z += (mz / ml) * sp;
      collide(player.pos);
      player.pos.y += (EYE - player.pos.y) * Math.min(1, dt * 2.2);
      if (Math.abs(player.pos.y - EYE) < 0.01) player.pos.y = EYE;
    }
  }

  function goHome() {
    hooks.takeOver();
    player.pos.copy(HOME.pos);
    player.yaw = HOME.yaw;
    player.pitch = HOME.pitch;
  }

  /** Posiciona a câmera olhando para um ponto (usado em testes e depuração). */
  function lookFrom(px: number, py: number, pz: number, lx2: number, ly2: number, lz: number) {
    hooks.takeOver();
    player.pos.set(px, py, pz);
    aim(player, lx2 - px, ly2 - py, lz - pz);
  }

  return Object.assign(ctx, {
    controls: { player, HOME, update, goHome, lookFrom, collide, hooks },
  });
}
