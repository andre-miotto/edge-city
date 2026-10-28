/**
 * Modelos 3D externos (GLB com compressão meshopt), gerados pelo pipeline de CAD em tools/cad/.
 * Os materiais do arquivo são só "slots" com nome (paint, steel, fan…): quem usa o modelo troca pelos materiais da cena.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import w22Url from '../assets/models/w22-326t.glb?url';
import w22LoUrl from '../assets/models/w22-326t-lo.glb?url';

/** Modelos carregados antes da montagem da cena (main.ts). */
export interface Models {
  /** Motor W22 carcaça 326T (CAD oficial WEG), versão detalhada: motor monitorado. */
  w22: THREE.Group;
  /** Mesmo motor, versão leve: motores das linhas, berços e bancadas. */
  w22Lo: THREE.Group;
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/** Ângulo a partir do qual uma aresta fica "viva" (sombreamento quebrado) nos modelos sem normais. */
const CREASE = THREE.MathUtils.degToRad(35);

export function loadModel(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) =>
    loader.load(
      url,
      (g) => {
        // versões leves vêm sem normais (simplificam melhor): recalcula com quebra nas arestas vivas
        g.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh && !m.geometry.attributes.normal) m.geometry = toCreasedNormals(m.geometry, CREASE);
        });
        resolve(g.scene);
      },
      undefined,
      reject,
    ),
  );
}

/**
 * Cópia da geometria com todos os atributos em Float32 sem normalização.
 * Os GLB comprimidos guardam posições e normais como inteiros normalizados (a escala fica no nó);
 * transformar esses atributos direto cortaria os valores fora de −1…1.
 */
export function toFloat32(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geo.attributes)) {
    const a = attr as THREE.BufferAttribute;
    const n = a.count,
      k = a.itemSize,
      arr = new Float32Array(n * k);
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) arr[i * k + j] = a.getComponent(i, j);
    g.setAttribute(name, new THREE.BufferAttribute(arr, k));
  }
  if (geo.index) g.setIndex(geo.index.clone());
  return g;
}

/** Geometria de cada slot de material de um modelo (para juntar em Builder ou usar em InstancedMesh). */
export function slotGeometries(root: THREE.Object3D): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const name = (m.material as THREE.Material).name;
    if (out[name]) throw new Error(`Modelo 3D: mais de uma malha no slot "${name}"`);
    out[name] = toFloat32(m.geometry).applyMatrix4(m.matrixWorld);
  });
  return out;
}

export async function loadModels(): Promise<Models> {
  const [w22, w22Lo] = await Promise.all([loadModel(w22Url), loadModel(w22LoUrl)]);
  return { w22, w22Lo };
}

/** Troca os materiais do modelo pelos da cena, pelo nome do slot, e liga as sombras. */
export function applySlots<T extends THREE.Object3D>(
  root: T,
  slots: Record<string, THREE.Material>,
  shadows = true,
): T {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const name = (m.material as THREE.Material).name;
    if (!slots[name]) throw new Error(`Modelo 3D: slot de material sem correspondência na cena: "${name}"`);
    m.material = slots[name];
    m.castShadow = shadows;
    m.receiveShadow = true;
  });
  return root;
}
