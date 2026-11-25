import { cookieName, fallback } from '#nuxt-time-zone/options'
import { cookieValue } from '../../shared/cookie'
import { parseTimeZone } from '../../shared/time-zone'

type NodeHeaders = Record<string, string | string[] | undefined>
type WebHeaders = { get(name: string): string | null }

/**
 * A `nuxt/server` request, Nitro v3's h3 v2 event, or Nitro v2's h3 v1 event.
 * On Nitro v2, `getCookie` from `nuxt/server` is rewritten to h3 and needs `event.node`,
 * so the cookie is read from Web `Headers` (or Node's `cookie` header) instead.
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
  if (isWebHeaders(event.req?.headers)) return event.req.headers.get('cookie') ?? undefined
  if (isWebHeaders(event.headers)) return event.headers.get('cookie') ?? undefined

  const cookie = event.req?.headers && 'cookie' in event.req.headers ? event.req.headers.cookie : undefined
  return Array.isArray(cookie) ? cookie.join('; ') : cookie
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
