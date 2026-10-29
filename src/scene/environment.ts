/**
 * Ambiente de reflexos e luz indireta gerado a partir do próprio galpão.
 * Depois que a cena está montada, uma captura em cubo (feita uma vez, no meio do galpão) vira o mapa de ambiente.
 * Os metais e a pintura passam a refletir a cobertura clara, as luminárias, as paredes e o piso reais, e a luz
 * rebatida do ambiente acompanha as cores do galpão, em vez de um céu genérico.
 */
import * as THREE from 'three';
import type { AfterHud } from '../ctx';

export function bakeEnvironment(ctx: AfterHud) {
  const { renderer, scene } = ctx;
  renderer.shadowMap.needsUpdate = true; // as sombras entram na captura
  const old = scene.environment;
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.02, 0.2, 260, { size: 256, position: new THREE.Vector3(0, 8, 8) });
  scene.environment = rt.texture;
  pm.dispose();
  if (old) old.dispose();
  return ctx;
}
