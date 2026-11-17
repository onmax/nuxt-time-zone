import { addImports, addPlugin, addServerImports, addTemplate, addTypeTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import { headScript } from './head-script'
import { parseTimeZone } from './runtime/shared/time-zone'

export interface ModuleOptions {
  /**
   * The cookie that carries the visitor's zone to the server.
   * @default 'tz'
   */
  cookieName: string
  /**
   * The zone used when the request has no valid cookie: a first visit, cookies off, prerendered pages.
   * @default 'UTC'
   */
  fallback: string
}

// RFC 6265 cookie-name characters
const COOKIE_NAME = /^[\w!#$%&'*+.^`|~-]+$/

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-time-zone',
    configKey: 'timeZone',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {
    cookieName: 'tz',
    fallback: 'UTC',
  },
  setup(options, nuxt) {
    if (!COOKIE_NAME.test(options.cookieName))
      throw new Error(`[nuxt-time-zone] \`timeZone.cookieName\` must be a valid cookie name, got ${JSON.stringify(options.cookieName)}.`)
    if (!parseTimeZone(options.fallback))
      throw new Error(`[nuxt-time-zone] \`timeZone.fallback\` must be an IANA time zone that Intl knows, like 'UTC' or 'Europe/Madrid', got ${JSON.stringify(options.fallback)}.`)

    const resolver = createResolver(import.meta.url)

    // Build-time constants, not runtime config: the head script inlines the cookie name, so an env override could
    // only make the server and the script disagree.
    const template = addTemplate({
      filename: 'nuxt-time-zone/options.mjs',
      write: true,
      getContents: () => [
        `export const cookieName = ${JSON.stringify(options.cookieName)}`,
        `export const fallback = ${JSON.stringify(options.fallback)}`,
        '',
      ].join('\n'),
    })
    // Nuxt passes its aliases on to Nitro.
    nuxt.options.alias['#nuxt-time-zone/options'] = template.dst
    addTypeTemplate({
      filename: 'types/nuxt-time-zone.d.ts',
      getContents: () => [
        'declare module \'#nuxt-time-zone/options\' {',
        '  export const cookieName: string',
        '  export const fallback: string',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true, nitro: true })

    nuxt.options.app.head.script ||= []
    nuxt.options.app.head.script.unshift({
      key: 'nuxt-time-zone',
      innerHTML: headScript(options.cookieName),
      tagPriority: 'critical',
    })

    addPlugin(resolver.resolve('./runtime/plugin.server'))
    addPlugin(resolver.resolve('./runtime/plugin.client'))
    addImports({ name: 'useTimeZone', from: resolver.resolve('./runtime/composables/useTimeZone') })
    addServerImports([{ name: 'getRequestTimeZone', from: resolver.resolve('./runtime/server/utils/time-zone') }])
  },
})
