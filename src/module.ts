import { defineNuxtModule } from '@nuxt/kit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the runtime unit fills in the options
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-time-zone',
    configKey: 'timeZone',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {},
  setup() {},
})
