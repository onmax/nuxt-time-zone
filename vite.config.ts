import { defineConfig } from 'vite-plus'

// Vite+ (`vp`) reads this file for lint, format and tasks. Nuxt never loads it.
export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'jsdoc', 'node', 'promise', 'vue'],
    categories: { correctness: 'error', suspicious: 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    tasks: {
      'check:doctor': {
        command: 'vite-doctor . --strict --max-warnings 0 --format text',
        dependsOn: ['dev:prepare'],
        cache: false,
      },
    },
  },
})
