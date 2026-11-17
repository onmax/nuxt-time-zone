// The cookie is user input that reaches Intl, so a name Intl doesn't know reads as no zone.
export function parseTimeZone(value: unknown): string | null {
  if (typeof value !== 'string' || !value)
    return null
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return value
  }
  catch {
    return null
  }
}

export const STATE_KEY = 'nuxt-time-zone'
