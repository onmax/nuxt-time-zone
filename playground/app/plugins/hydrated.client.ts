// Marks <html> once the app has hydrated, so tests know the page they see is the one that stays.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:suspense:resolve', () => {
    document.documentElement.dataset.hydrated = ''
  })
})
