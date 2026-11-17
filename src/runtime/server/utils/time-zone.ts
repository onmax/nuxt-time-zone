import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { cookieName, fallback } from '#nuxt-time-zone/options'
import { parseTimeZone } from '../../shared/time-zone'

/**
 * The zone the page that sent this request was rendered with: the time-zone cookie when Intl knows it, else the
 * `fallback` option.
 */
export function getRequestTimeZone(event: H3Event): string {
  return parseTimeZone(getCookie(event, cookieName)) ?? fallback
}
