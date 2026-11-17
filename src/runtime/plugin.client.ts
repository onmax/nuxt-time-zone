import { defineNuxtPlugin, useState } from '#app'
import { cookieName, fallback } from '#nuxt-time-zone/options'
import type { Ref } from 'vue'
import { readonly, shallowRef } from 'vue'
import { parseTimeZone, STATE_KEY } from './shared/time-zone'
import { timeZoneCookie } from './shared/cookie'

export default defineNuxtPlugin({
  name: 'nuxt-time-zone',
  enforce: 'pre',
  setup(nuxtApp): { provide: { timeZone: Readonly<Ref<string>> } } {
    // Hydrate with the zone the server rendered. The cookie may have changed since, so it is never read here.
    let timeZone: string | undefined = nuxtApp.payload.serverRendered ? useState<string | undefined>(STATE_KEY).value : undefined

    // `ssr: false`: nothing was rendered, so use the device's zone and send it with every request from now on.
    if (!timeZone) {
      const device = parseTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      if (device)
        document.cookie = timeZoneCookie(cookieName, device, location.protocol === 'https:')
      timeZone = device ?? fallback
    }

    return { provide: { timeZone: readonly(shallowRef(timeZone)) } }
  },
})
