import { defineNuxtPlugin, useHead, useRequestEvent, useRequestHeaders, useState } from '#app'
import { cookieName, fallback } from '#nuxt-time-zone/options'
import type { Ref } from 'vue'
import { readonly, shallowRef } from 'vue'
import { headScript } from './head-script'
import { cookieValue } from './shared/cookie'
import { parseTimeZone, STATE_KEY } from './shared/time-zone'

const script = headScript(cookieName)

export default defineNuxtPlugin({
  name: 'nuxt-time-zone',
  enforce: 'pre',
  setup(): { provide: { timeZone: Readonly<Ref<string>> } } {
    const timeZone = parseTimeZone(cookieValue(useRequestHeaders(['cookie']).cookie, cookieName)) ?? fallback
    // The payload carries the zone this page was rendered with, so hydration uses the same one.
    useState(STATE_KEY, () => timeZone)

    const event = useRequestEvent()
    const method = event?.method ?? event?.req?.method
    // The head script compares this with the device's zone and may reload. Reloading a POST would resend it, and
    // prerendered HTML is the same for everyone, so a reload can't change it.
    if (method === 'GET' && !import.meta.prerender) {
      // doctor-disable-next-line nuxt/security/no-unsafe-usehead-script -- The first-party script must run inline and block parsing. Its source uses only the validated build-time cookie name, not request data.
      useHead({
        htmlAttrs: { 'data-time-zone': timeZone },
        script: [{ key: 'nuxt-time-zone', innerHTML: script, tagPriority: 41 }],
      })
    }

    return { provide: { timeZone: readonly(shallowRef(timeZone)) } }
  },
})
