// Imagem de conferência do modelo bruto: cada sólido numerado, com a cor do seu slot (paint, steel, fan…).
// Serve para conferir o mapeamento de tools/cad/models.json antes de gerar os modelos finais.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PAGE = `<!doctype html><html><body style="margin:0;background:#dde3ea"><canvas id=c width=1600 height=900></canvas>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const r = new THREE.WebGLRenderer({ canvas: c, antialias: true }); r.setClearColor(0xdde3ea);
const s = new THREE.Scene(); s.add(new THREE.HemisphereLight(0xffffff, 0x667788, 2.5));
const d = new THREE.DirectionalLight(0xffffff, 2.5); d.position.set(2, 3, 2); s.add(d);
const SLOT = { paint: 0x3d7fc0, steel: 0xb8c2cc, fan: 0x333a44 };
new GLTFLoader().load('/model.glb', (g) => {
  const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()).length();
  const ctr = box.getCenter(new THREE.Vector3());
  const views = [[1, 0.6, 1], [-1, 0.6, -1]];
  const W = 800, H = 900; r.setScissorTest(true);
  g.scene.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: SLOT[o.material.name] ?? 0xff00ff, roughness: 0.6 }); });
  s.add(g.scene);
  const labels = [];
  views.forEach((v, i) => {
    const cam = new THREE.PerspectiveCamera(32, W / H, size / 100, size * 10);
    cam.position.copy(ctr).add(new THREE.Vector3(...v).normalize().multiplyScalar(size * 1.5)); cam.lookAt(ctr);
    r.setViewport(i * W, 0, W, H); r.setScissor(i * W, 0, W, H); r.render(s, cam);
    g.scene.traverse((o) => { if (!o.isMesh) return; const b = new THREE.Box3().setFromObject(o); const p = b.getCenter(new THREE.Vector3()).project(cam);
      if (p.z < 1) labels.push([i * W + (p.x + 1) / 2 * W, (1 - p.y) / 2 * H, o.name.replace('solid_', '')]); });
  });
  const o = document.createElement('canvas'); o.width = 1600; o.height = 900; const x = o.getContext('2d');
  x.drawImage(c, 0, 0); x.font = '600 13px sans-serif'; x.textAlign = 'center';
  labels.forEach(([lx, ly, t]) => { x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(lx - 11, ly - 9, 22, 16); x.fillStyle = '#fff'; x.fillText(t, lx, ly + 4); });
  window.png = o.toDataURL('image/png');
});
</script></body></html>`;

export async function renderPreview(root, glb, out) {
  const srv = http.createServer((req, res) => {
    if (req.url === '/') return res.end(PAGE);
    if (req.url === '/model.glb') return res.end(fs.readFileSync(glb));
    const f = path.join(root, decodeURIComponent(req.url));
    if (!f.startsWith(path.join(root, 'node_modules')) || !fs.existsSync(f)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': 'text/javascript' }).end(fs.readFileSync(f));
  });
  await new Promise((r) => srv.listen(0, r));
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto('http://localhost:' + srv.address().port + '/');
    await page.waitForFunction('window.png', null, { timeout: 300000 });
    const data = await page.evaluate(() => window.png);
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  } finally {
    await browser.close();
    srv.close();
  }
}
