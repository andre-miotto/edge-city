// Utilitários dos testes: abre o build (dist/index.html) no Chromium e expõe os ganchos de debug.js.
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const OUT = path.join(ROOT, 'tests', 'output');

// Renderização por software (SwiftShader) funciona em máquinas sem GPU e em CI; em máquina com GPU também roda.
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export async function openScene({ width = 1280, height = 720, timeout = 300000, query = '' } = {}) {
  const file = path.join(ROOT, 'dist', 'index.html');
  if (!fs.existsSync(file)) throw new Error('Rode "npm run build" antes dos testes (dist/index.html não existe).');
  const browser = await chromium.launch({ args: GL_ARGS });
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  // a cena não usa rede (fontes e modelos embutidos): qualquer requisição externa é um erro
  await page.route(/^https?:/, (r) => {
    errors.push('requisição externa: ' + r.request().url());
    r.abort();
  });
  await page.goto(pathToFileURL(file).href + query);
  await page.waitForFunction('window.__ready === true', null, { timeout });
  return { browser, page, errors };
}

export function report(name, ok, details) {
  console.log((ok ? 'OK   ' : 'FALHA') + ' ' + name + (details ? ' — ' + details : ''));
  return ok;
}

export function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
  return OUT;
}
