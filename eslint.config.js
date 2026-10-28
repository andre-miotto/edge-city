import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // 'ai' é um global experimental do Chrome; desligado para não mascarar variáveis da cena
      globals: { ...globals.browser, ai: 'off' },
    },
    rules: {
      // fase 1 da migração: tipos implícitos ainda permitidos (veja docs/ARCHITECTURE.md → TypeScript)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['tests/**/*.mjs', 'scripts/**/*.mjs', 'tools/**/*.mjs', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
);
