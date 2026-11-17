import { defineNuxtPlugin, useHead, useRequestEvent, useState } from '#app'
import type { Ref } from 'vue'
import { readonly, shallowRef } from 'vue'
import { getRequestTimeZone } from './server/utils/time-zone'
import { STATE_KEY } from './shared/time-zone'

export default defineNuxtPlugin({
  name: 'nuxt-time-zone',
  enforce: 'pre',
  setup(): { provide: { timeZone: Readonly<Ref<string>> } } {
    const event = useRequestEvent()!
    const timeZone = getRequestTimeZone(event)
    // The payload carries the zone this page was rendered with, so hydration uses the same one.
    useState(STATE_KEY, () => timeZone)

    // The head script compares this with the device's zone and may reload. Reloading a POST would resend it, and
    // prerendered HTML is the same for everyone, so a reload can't change it.
    if (event.method === 'GET' && !import.meta.prerender)
      useHead({ htmlAttrs: { 'data-time-zone': timeZone } })

    return { provide: { timeZone: readonly(shallowRef(timeZone)) } }
  },
})
