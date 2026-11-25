// One year, sent on top-level navigations from other sites too, so a link into the app renders in the right zone.
export const COOKIE_ATTRIBUTES = '; Path=/; Max-Age=31536000; SameSite=Lax'

export function timeZoneCookie(name: string, timeZone: string, secure: boolean): string {
  return `${name}=${encodeURIComponent(timeZone)}${COOKIE_ATTRIBUTES}${secure ? '; Secure' : ''}`
}

export function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined

  const prefix = `${name}=`
  for (const part of header.split(';')) {
    const cookie = part.trim()
    if (!cookie.startsWith(prefix)) continue

    const value = cookie.slice(prefix.length)
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return undefined
}
