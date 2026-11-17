export default defineEventHandler(event => ({ timeZone: getRequestTimeZone(event) }))
