export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: false },
  app: {
    head: {
      meta: [{ 'http-equiv': 'content-security-policy', content: "base-uri 'self'" }],
      script: [{ key: 'host-critical', innerHTML: '/* Host inline script */', tagPriority: 'critical' }],
    },
  },
  routeRules: {
    '/spa': { ssr: false },
    '/prerendered': { prerender: true },
  },
  compatibilityDate: '2026-10-01',
})
