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
        // Every activated pack's strict preset. Replace the --extends list with `--strict` once vite-doctor ships it
        // (onmax/vite-doctor#352).
        command:
          'vite-doctor . --max-warnings 0 --format text --extends auto,vite-doctor/typescript/strict,vite-doctor/vue/strict,vite-doctor/nuxt/strict,vite-doctor/nitro/strict,vite-doctor/vite/strict',
        dependsOn: ['dev:prepare'],
        cache: false,
      },
    },
  },
})
