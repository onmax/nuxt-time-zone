import type { Ref } from 'vue'
import { useNuxtApp } from '#app'

/**
 * The visitor's IANA time zone. It stays the same for the whole page load, so the server render, hydration and
 * every request agree.
 */
export function useTimeZone(): Readonly<Ref<string>> {
  return useNuxtApp().$timeZone as Readonly<Ref<string>>
}
