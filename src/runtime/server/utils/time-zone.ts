import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { cookieName, fallback } from '#nuxt-time-zone/options'
import { parseTimeZone } from '../../shared/time-zone'

/**
 * The zone a page sent with the request (`timeZone`, usually `useTimeZone().value`) when Intl knows it, else the
 * request's time-zone cookie when Intl knows it, else the `fallback` option. Without `timeZone`, on a server-rendered
 * page that is the page's zone; a prerendered or cached page may show another one.
 */
export function getRequestTimeZone(event: H3Event, timeZone?: unknown): string {
  return parseTimeZone(timeZone) ?? parseTimeZone(getCookie(event, cookieName)) ?? fallback
}
