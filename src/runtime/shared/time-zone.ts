// The cookie is user input that reaches Intl, so a name Intl doesn't know reads as no zone.
export function parseTimeZone(value: string | undefined): string | null {
  if (!value) return null
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return value
  } catch {
    return null
  }
}

export const STATE_KEY = 'nuxt-time-zone'
