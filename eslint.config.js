import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const frameworkPackages = ['react', 'react-dom', 'react-dom/*', 'react-router-dom', 'react-markdown', 'zustand', 'zustand/*', 'katex', 'd3-*', 'rehype-*', 'remark-*']
const upperLayers = ['**/sim', '**/sim/**', '**/ui', '**/ui/**']

export default tseslint.config(
  { ignores: ['dist/', 'build/', 'coverage/', 'node_modules/', '**/*.min.js', '.specify/', '.github/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Layer 1: the math core is pure TypeScript. No framework, chart, DOM or upper-layer imports.
  {
    files: ['src/core/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...frameworkPackages, ...upperLayers],
              message: 'src/core must stay framework-free and cannot import from sim or ui (Principle VI).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'requestAnimationFrame'].map((name) => ({
          name,
          message: 'src/core must not use DOM APIs (Principle III).',
        })),
      ],
    },
  },
  // Layer 2: simulation and state may import core only. No React, no ui.
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-dom/*', 'react-router-dom', 'react-markdown', 'katex', '**/ui', '**/ui/**'],
              message: 'src/sim cannot import from ui or React (Principle VI).',
            },
          ],
        },
      ],
    },
  },
)
