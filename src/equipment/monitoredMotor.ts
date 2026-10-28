/**
 * Motor W22 monitorado com o sensor TT-01 (o único ligado aos valores do WES).
 * Geometria do CAD oficial WEG (W22 NEMA IEEE 841, carcaça 326T), ampliada para a escala de vitrine da cena.
 */
import * as THREE from 'three';
import { applySlots } from '../core/models';
import type { AfterHall } from '../ctx';

/** Altura do eixo do motor (m, escala da cena). */
const C = 2.3;
/** Topo da chapa da base, onde os pés se apoiam. */
const BASE_TOP = 1.1;
/** Face do acoplamento (caixa de aço em x = −26,9 no mundo): a ponta do eixo encosta nela. */
const COUPLING_X = 2.75;
/** Posição do TT-01 ao longo do motor: entre a caixa de ligação e a tampa dianteira. */
const SENSOR_X = 1.18;

export function buildMonitoredMotor(ctx: AfterHall) {
  const { M, colliders, mesh, models, scene } = ctx;
  const motor = new THREE.Group();
  motor.position.set(-30, 0, 0);
  scene.add(motor);

  // modelo CAD: pés na base, ponta do eixo no acoplamento
  const cad = applySlots(models.w22, { paint: M.blue, steel: M.steel, fan: M.blueD });
  const bb = new THREE.Box3().setFromObject(cad);
  const s = (C - BASE_TOP) / -bb.min.y;
  cad.scale.setScalar(s);
  cad.position.set(COUPLING_X - bb.max.x * s, C, 0);
  motor.add(cad);
  motor.updateMatrixWorld(true);
  const x0 = cad.position.x + bb.min.x * s; // fim da tampa defletora

  // base de concreto e chapa, do tamanho do motor (com folga de 0,25 m atrás e até o acoplamento)
  const bx0 = x0 - 0.25,
    bx1 = COUPLING_X - 0.3;
  mesh(new THREE.BoxGeometry(bx1 - bx0, 1.0, 2.8), M.steelD, (bx0 + bx1) / 2, 0.5, 0, motor);
  mesh(new THREE.BoxGeometry(bx1 - bx0 + 0.2, 0.12, 3.0), M.steel, (bx0 + bx1) / 2, 1.04, 0, motor);

  // superfície da carcaça sob o sensor (aletas no topo)
  const hit = new THREE.Raycaster(
    new THREE.Vector3(-30 + SENSOR_X, 20, 0),
    new THREE.Vector3(0, -1, 0),
  ).intersectObject(cad, true)[0];
  if (!hit) throw new Error('TT-01: carcaça do motor não encontrada sob o sensor');
  const topY = hit.point.y;

  // sensor de temperatura TT-01 (o único ligado aos valores do WES)
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 16), M.steel, SENSOR_X, topY + 0.21, 0, motor);
  mesh(
    new THREE.BoxGeometry(0.38, 0.32, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x38a2d8, metalness: 0.3, roughness: 0.4 }),
    SENSOR_X,
    topY + 0.56,
    0,
    motor,
  );
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0x68e2f4 }));
  led.position.set(SENSOR_X, topY + 0.56, 0.2);
  motor.add(led);
  const ttRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.025, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x68e2f4, transparent: true, opacity: 0.8, toneMapped: false }),
  );
  ttRing.rotation.x = Math.PI / 2;
  ttRing.position.set(SENSOR_X, topY + 0.4, 0);
  motor.add(ttRing);
  /** Saída do cabo no topo do sensor (início do fluxo de dados até o CLP). */
  const sensorTop = new THREE.Vector3(-30 + SENSOR_X, topY + 0.74, 0);

  // acoplamento e mancal da carga
  colliders.push({ x0: -30 + bx0 - 0.1, x1: -26.5, z0: -1.8, z1: 1.8 });
  mesh(new THREE.BoxGeometry(0.75, 0.6, 0.9), M.steel, -26.9, C, 0);
  mesh(new THREE.BoxGeometry(1.1, 0.9, 1.3), M.steelD, -26.9, 1.4, 0);
  return Object.assign(ctx, { C, led, ttRing, sensorTop });
}
