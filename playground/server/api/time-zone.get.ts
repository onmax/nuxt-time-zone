import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler((event) => ({ timeZone: getRequestTimeZone(event, getQuery(event).timeZone) }))
