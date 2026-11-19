export default defineEventHandler((event) => ({ timeZone: getRequestTimeZone(event, getQuery(event).timeZone) }))
