import { cookieName, fallback } from '#nuxt-time-zone/options'
import { cookieValue } from '../../shared/cookie'
import { parseTimeZone } from '../../shared/time-zone'

/** A Nitro v2 h3 event (raw or `nuxt/server`'s), or a Nitro v3 `nuxt/server` `RequestEvent`. */
export type TimeZoneRequestEvent =
  | { __is_event__: boolean; node: { req: { headers: { cookie?: string } } } }
  | { req: { headers: { get(name: string): string | null } } }

function cookieHeader(event: TimeZoneRequestEvent): string | undefined {
  // Only h3 v1 sets `__is_event__` per instance; its live Node headers can differ from `event.req.headers`.
  if ('__is_event__' in event) return event.node.req.headers.cookie
  return event.req.headers.get('cookie') ?? undefined
}

/**
 * The zone a page sent with the request (`timeZone`, usually `useTimeZone().value`) when Intl knows it, else the
 * request's time-zone cookie when Intl knows it, else the `fallback` option. Without `timeZone`, on a server-rendered
 * page that is the page's zone; a prerendered or cached page may show another one.
 */
export function getRequestTimeZone(event: TimeZoneRequestEvent, timeZone?: unknown): string {
  return parseTimeZone(timeZone) ?? parseTimeZone(cookieValue(cookieHeader(event), cookieName)) ?? fallback
}
