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

    let value = cookie.slice(prefix.length)
    // RFC 6265 cookie-value may be a quoted-string; h3 stripped the quotes, so keep that behavior.
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return undefined
}
