// Gera os modelos 3D da cena a partir de CAD (STEP), conforme tools/cad/models.json.
// Uso: npm run cad                  (todos os modelos)
//      npm run cad -- w22-326t      (um modelo)
//      npm run cad -- w22-326t --preview   (também salva uma imagem com as peças numeradas e coloridas por slot)
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, 'tools/cad/.cache');
const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/cad/models.json'), 'utf8'));
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const ids = args.filter((a) => !a.startsWith('--'));
const todo = ids.length ? ids : Object.keys(models).filter((k) => !k.startsWith('$'));

function python() {
  for (const p of [process.env.PYTHON, 'python3', 'python'].filter(Boolean)) {
    try {
      execFileSync(p, ['-c', 'import OCP'], { stdio: 'ignore' });
      return p;
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error('Python com OpenCascade não encontrado. Rode: pip install -r tools/cad/requirements.txt');
}

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
fs.mkdirSync(CACHE, { recursive: true });

for (const id of todo) {
  const m = models[id];
  if (!m) throw new Error('Modelo desconhecido: ' + id);
  const src = path.join(ROOT, m.source);
  if (!fs.existsSync(src))
    throw new Error(`Falta o arquivo CAD ${m.source} (origem: ${m.origin}). Veja tools/cad/README.md.`);
  const raw = path.join(CACHE, id + '.raw.glb');
  const slots = Object.fromEntries(
    Object.entries(m.slots).map(([k, v]) => [k, { solids: v.solids, default: v.default }]),
  );
  const info = execFileSync(
    python(),
    [path.join(ROOT, 'tools/cad/step_to_glb.py'), src, raw, String(m.deflection_mm), JSON.stringify(slots)],
    {
      encoding: 'utf8',
    },
  );
  console.log(id, '· CAD triangulado:', info.trim());
  for (const [out, o] of Object.entries(m.outputs)) {
    const doc = await io.read(raw);
    const drop = new Set((o.dropSolids || []).map((i) => 'solid_' + String(i).padStart(2, '0')));
    for (const n of doc.getRoot().listNodes()) if (drop.has(n.getName())) n.dispose();
    // Sem normais, os vértices de faces vizinhas do CAD se unem e a malha simplifica muito mais;
    // a cena recalcula as normais com quebra nas arestas vivas (src/core/models.ts).
    if (o.rebuildNormals)
      for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) p.setAttribute('NORMAL', null);
    await doc.transform(
      prune(),
      dedup({ keepUniqueNames: true }), // os slots só diferem pelo nome: não podem ser fundidos
      flatten(),
      join({ keepNamed: false }),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: o.ratio, error: o.error, lockBorder: false }),
      prune(),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    );
    let tris = 0,
      prims = 0;
    for (const me of doc.getRoot().listMeshes())
      for (const p of me.listPrimitives()) {
        tris += p.getIndices().getCount() / 3;
        prims++;
      }
    await io.write(path.join(ROOT, out), doc);
    const kb = Math.round(fs.statSync(path.join(ROOT, out)).size / 1024);
    console.log(`  → ${out}: ${tris} triângulos, ${kb} KB, ${prims} partes (uma por slot de material)`);
  }
  if (preview) {
    const { renderPreview } = await import('./preview.mjs');
    const png = path.join(CACHE, id + '-parts.png');
    await renderPreview(ROOT, raw, png);
    console.log('  → peças numeradas:', path.relative(ROOT, png));
  }
}
