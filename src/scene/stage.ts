/** Renderizador, cena, câmera, ambiente de reflexos e iluminação geral. */
import * as THREE from 'three';
import { cvs, ctx2d } from '../core/canvas2d';
import type { BaseCtx } from '../ctx';
export function createStage(ctx: BaseCtx) {
  const { canvas } = ctx;
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061528);
  scene.fog = new THREE.FogExp2(0x0a1c31, 0.0062); // névoa e fundo usam a cor de saída (sRGB) direto, sem conversão;
  const camera = new THREE.PerspectiveCamera(62, 1, 0.12, 420);
  camera.rotation.order = 'YXZ';
  // ambiente para reflexos controlados nos metais (galpão estilizado: luminárias no teto, faixa de janelas)
  {
    const c = cvs(1024, 512),
      g = ctx2d(c);
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#16263b');
    gr.addColorStop(0.42, '#33485f');
    gr.addColorStop(0.5, '#26364a');
    gr.addColorStop(1, '#0e141c');
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 512);
    for (let r = 0; r < 5; r++) {
      g.fillStyle = 'rgba(235,243,255,' + (0.95 - r * 0.15) + ')';
      const y = 26 + r * 34;
      for (let k = 0; k < 18; k++) g.fillRect(k * 57 + 12, y, 30 - r * 3, 7 - r);
    }
    g.fillStyle = 'rgba(110,160,215,.35)';
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
  scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x5c6c7c, 1.32));
  const key = new THREE.DirectionalLight(0xfafbff, 4.08);
  key.position.set(-8, 48, 30);
  key.target.position.set(-24, 0, -10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -38, right: 38, top: 32, bottom: -30, near: 5, far: 110 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xbbd8f5, 1.0);
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
