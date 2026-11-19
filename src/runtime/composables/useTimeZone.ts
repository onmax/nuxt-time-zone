import type { Ref } from 'vue'
import { useNuxtApp } from '#app'

declare module '#app' {
  interface NuxtApp {
    // Both plugins provide it, with `enforce: 'pre'`, before any app code runs.
    $timeZone: Readonly<Ref<string>>
  }
}

/**
 * The visitor's IANA time zone. It stays the same for the whole page load, so the server render, hydration and
 * every request agree.
 */
export function useTimeZone(): Readonly<Ref<string>> {
  return useNuxtApp().$timeZone
}
