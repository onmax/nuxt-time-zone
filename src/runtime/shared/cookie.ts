// One year, sent on top-level navigations from other sites too, so a link into the app renders in the right zone.
export const COOKIE_ATTRIBUTES = '; Path=/; Max-Age=31536000; SameSite=Lax'

export function timeZoneCookie(name: string, timeZone: string, secure: boolean): string {
  return `${name}=${encodeURIComponent(timeZone)}${COOKIE_ATTRIBUTES}${secure ? '; Secure' : ''}`
}
