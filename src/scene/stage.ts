/** Renderizador, cena, câmera, ambiente de reflexos e iluminação geral. */
import * as THREE from 'three';
import { cvs, ctx2d } from '../core/canvas2d';
import type { BaseCtx } from '../ctx';
export function createStage(ctx: BaseCtx) {
  const { canvas } = ctx;
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral (Khronos PBR Neutral): mantém o azul WEG e o branco sem o desvio de matiz do ACES.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false; // atualizado em loop.ts, em quadros alternados
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbcbcb9);
  // Névoa leve e neutra: a poeira de um galpão grande atenua as áreas distantes e dá profundidade.
  scene.fog = new THREE.FogExp2(0xbcbcb9, 0.0032);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.12, 420);
  camera.rotation.order = 'YXZ';
  // ambiente para reflexos controlados nos metais (galpão estilizado: luminárias no teto, faixa de janelas)
  {
    const c = cvs(1024, 512),
      g = ctx2d(c);
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#9aa3ab');
    gr.addColorStop(0.42, '#c9cfd4');
    gr.addColorStop(0.5, '#b4babf');
    gr.addColorStop(1, '#5d6063');
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 512);
    for (let r = 0; r < 5; r++) {
      g.fillStyle = 'rgba(235,243,255,' + (0.95 - r * 0.15) + ')';
      const y = 26 + r * 34;
      for (let k = 0; k < 18; k++) g.fillRect(k * 57 + 12, y, 30 - r * 3, 7 - r);
    }
    g.fillStyle = 'rgba(210,225,240,.35)';
    g.fillRect(0, 196, 1024, 16);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture;
    pm.dispose();
    t.dispose();
  }
  // luzes — unidades físicas (padrão desde o r155).
  // Pontuais e spots usam decay 0: luz de "artista", que só se apaga perto de `distance`. As intensidades foram
  // calculadas na migração do r128 para manter a mesma iluminação na distância típica de cada luz até as peças.
  scene.add(new THREE.HemisphereLight(0xf4f5f6, 0x8f8b86, 0.4));
  // Luz principal (entrada de luz pelas claraboias), com sombras cobrindo o galpão inteiro.
  const key = new THREE.DirectionalLight(0xfff4e6, 2.8);
  key.position.set(-26, 56, 40);
  key.target.position.set(0, 0, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -90, right: 90, top: 80, bottom: -80, near: 5, far: 150 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 3;
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xe4eaf0, 0.55);
  fill.position.set(40, 20, -30);
  scene.add(fill);
  const spotA = new THREE.SpotLight(0xffffff, 2.26, 36, 0.5, 0.75, 0);
  spotA.position.set(-20, 19.5, 1);
  spotA.target.position.set(-22, 2, -5);
  scene.add(spotA);
  scene.add(spotA.target);
  const spotB = new THREE.SpotLight(0xf6faff, 1.45, 34, 0.5, 0.8, 0);
  spotB.position.set(-11, 18.5, 6);
  spotB.target.position.set(-12, 2, 0);
  scene.add(spotB);
  scene.add(spotB.target);
  [
    [22, 8, -2, 0x71bbff, 1.8, 40],
    [45, 8, 3, 0x71bbff, 1.07, 26],
    [-4, 5, 4, 0xa4ddff, 0.7, 10],
    [-28.5, 5.6, 2.4, 0x68e2f4, 0.8, 7],
  ].forEach((l) => {
    const p = new THREE.PointLight(l[3], l[4], l[5], 0);
    p.position.set(l[0], l[1], l[2]);
    scene.add(p);
  });
  return Object.assign(ctx, { camera, maxAniso, renderer, scene });
}
