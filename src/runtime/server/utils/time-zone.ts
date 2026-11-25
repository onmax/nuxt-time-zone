import { cookieName, fallback } from '#nuxt-time-zone/options'
import { cookieValue } from '../../shared/cookie'
import { parseTimeZone } from '../../shared/time-zone'

type NodeHeaders = Record<string, string | string[] | undefined>
type WebHeaders = { get(name: string): string | null }

/**
 * A `nuxt/server` request, Nitro v3's h3 v2 event, or Nitro v2's h3 v1 event.
 * On Nitro v2, `getCookie` from `nuxt/server` is rewritten to h3 and needs `event.node`,
 * so the cookie is read from the request headers (Node record or Web `Headers`) instead.
 */
export type TimeZoneRequestEvent = {
  req?: { headers?: WebHeaders | NodeHeaders; method?: string }
  headers?: WebHeaders
  method?: string
}

function isWebHeaders(headers: WebHeaders | NodeHeaders | undefined): headers is WebHeaders {
  return !!headers && typeof Reflect.get(headers, 'get') === 'function'
}

function cookieHeader(event: TimeZoneRequestEvent): string | undefined {
  const reqHeaders = event.req?.headers
  // Prefer the request's header collection: on Nitro v2, `event.headers` caches the first read, so a later
  // rewrite or delete of `event.req.headers.cookie` (middleware, stale HTML) is invisible through it.
  if (isWebHeaders(reqHeaders)) return reqHeaders.get('cookie') ?? undefined
  if (reqHeaders) {
    const cookie = reqHeaders.cookie
    return Array.isArray(cookie) ? cookie.join('; ') : cookie
  }
  if (isWebHeaders(event.headers)) return event.headers.get('cookie') ?? undefined
  return undefined
}

function getRequestCookie(event: TimeZoneRequestEvent, name: string): string | undefined {
  return cookieValue(cookieHeader(event), name)
}

/**
 * The zone a page sent with the request (`timeZone`, usually `useTimeZone().value`) when Intl knows it, else the
 * request's time-zone cookie when Intl knows it, else the `fallback` option. Without `timeZone`, on a server-rendered
 * page that is the page's zone; a prerendered or cached page may show another one.
 */
export function getRequestTimeZone(event: TimeZoneRequestEvent, timeZone?: unknown): string {
  return parseTimeZone(timeZone) ?? parseTimeZone(getRequestCookie(event, cookieName)) ?? fallback
}
