import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { cookieName, fallback } from '#nuxt-time-zone/options'
import { parseTimeZone } from '../../shared/time-zone'

/**
 * The zone in the request's time-zone cookie when Intl knows it, else the `fallback` option. On a server-rendered
 * page that is the page's zone; a prerendered or cached page may show another one.
 */
export function getRequestTimeZone(event: H3Event): string {
  return parseTimeZone(getCookie(event, cookieName)) ?? fallback
}
