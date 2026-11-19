// Stands in for a cache (swr, isr, a CDN) that serves HTML rendered for another visitor: `/stale` always renders as
// if the request had no cookie.
export default defineEventHandler((event) => {
  if (event.path.startsWith('/stale')) delete event.node.req.headers.cookie
})
