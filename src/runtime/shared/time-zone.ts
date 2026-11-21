export function parseTimeZone(value: unknown): string | null {
  // Reject non-strings before Intl coerces them.
  if (typeof value !== 'string' || !value) return null
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return value
  } catch {
    return null
  }
}

export const STATE_KEY = 'nuxt-time-zone'
