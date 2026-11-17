export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: false },
  routeRules: {
    '/spa': { ssr: false },
    '/prerendered': { prerender: true },
  },
  compatibilityDate: '2026-10-01',
})
