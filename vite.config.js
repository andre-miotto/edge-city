import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// O build gera um único dist/index.html (JS, CSS, imagens e modelos 3D embutidos),
// pronto para abrir direto no navegador ou publicar como artifact.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  // modelos glTF/GLB importados com ?url entram embutidos no arquivo único
  assetsInclude: ['**/*.glb'],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 3000,
  },
  server: { open: true },
  // testes unitários (lógica pura, sem navegador): npm run test:unit
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
});
