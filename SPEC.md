# Spec

The visitor's IANA time zone in a Nuxt app, the same on the server and the client for the whole page load.

## Problem

A server render has no idea which zone the visitor is in. An app that turns instants into days ("today", "due tomorrow", a calendar grid) or wall-clock times either renders in a default zone and then changes text after hydration, or renders in the device zone on the client only and gets hydration mismatches.

The app this module comes from kept the zone in a `tz` cookie. The server rendered in the cookie zone (UTC without one), hydration used the same zone, and after hydration the device zone took over and the cookie followed. A first visit, and the first visit after travel, rendered UTC and then the text jumped. Its last version changed the model: one zone per page load, and when the device zone differs on load, write the cookie and reload once.

Prior art:

- Nuxt's [`<NuxtTime>`](https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-time.vue) formats one date. Before Vue hydrates, an `onPrehydrate` script reformats its text in the browser's locale and zone; while hydrating, the component reads the date and locale back from its own server-rendered element, so its text matches the rewritten DOM. That fixes display text with a script that runs before hydration and hydrating from what the server rendered. It gives no zone to computed values, stores or API routes.
- [`@epic-web/client-hints`](https://github.com/epicweb-dev/client-hints/blob/main/src/index.ts) puts the zone in a cookie from a script in `<head>` and reloads when the cookie changed. It checks `navigator.cookieEnabled`, checks that a test cookie reads back, and stops after three reloads per tab session.

## Scope

One zone per page load: what the server rendered with. No setter for a user-chosen zone, no switch after hydration, no component of its own. Plain `<NuxtTime>` without `time-zone` already formats in the device zone before and during hydration.

## Behaviour

Each numbered scenario is one Playwright test in `test/e2e/scenarios.spec.ts`, run against a production build of `playground/` in Chromium and WebKit, with the device in `Europe/Madrid` and the fallback `UTC` unless a scenario says otherwise. Scenario 13 also runs against `nuxi dev` (`pnpm test:e2e:dev`). A scenario is done when its test passes in all of them.

1. **First visit in another zone.** No cookie: the server renders the fallback, the head script writes the cookie and the page reloads exactly once. The script sits in `<head>` after document metadata such as CSP and before blocking inline `app.head` scripts marked `critical`. The first document never paints and never fires `DOMContentLoaded`. The second response's HTML, the cookie, `useTimeZone()`, `getRequestTimeZone(event)` in an API route and `<NuxtTime>` all use the device zone.
2. **Return visit.** With the cookie set, a new page load doesn't reload.
3. **Device in the fallback zone.** No reload, and no cookie is written: without one the server already renders the device's zone.
4. **Invalid cookie.** A cookie Intl doesn't know renders the fallback, then reloads once with the cookie replaced.
5. **Cookies off.** `navigator.cookieEnabled` is false: no reload, the fallback zone.
6. **Cookie doesn't read back.** The browser drops the write (blocked cookies, a cross-site frame): no reload.
7. **No sessionStorage.** Reading it throws: no reload and no cookie, since nothing could stop a loop.
8. **HTML that keeps the old zone.** A cache that ignores the cookie (swr, isr, a CDN) keeps serving the fallback. The page reloads once. When the next response still shows the fallback while the cookie holds the device zone, it stays on the fallback for that pair of zones for the rest of the tab session.
9. **Prerendered page.** The HTML is the same for everyone, so it never reloads and uses the fallback.
10. **Non-GET render.** A page rendered for a form POST doesn't reload, since a reload would resend the form.
11. **`ssr: false`.** Nothing was rendered: the app uses the device zone and writes the cookie, without a reload.
12. **Fixed for the page load.** A cookie changed while the page is open (another tab) doesn't change `useTimeZone()`, also across client-side navigation. The next load renders the new cookie and reloads once if the device disagrees.
13. **Hydration.** Text and a class that depend on the zone hydrate without mismatch warnings, in production and in `nuxi dev`, on pages rendered in the device zone, prerendered and stale.
14. **`<NuxtTime>`.** Without `time-zone` it shows the device zone, even on a page rendered in the fallback.
15. **Invalid fallback.** Module setup throws unless `fallback` is a string naming a zone Intl knows.
16. **Cookie lost in the same tab.** After a reload has fixed the zone, the cookie disappears (cleared, or Safari's 7-day cap in a tab left open). The next load reloads once and the cookie is back, however many times it happens in one tab.
17. **`ssr: false` where cookies throw.** In a sandboxed frame, `document.cookie` throws. The app still starts, in the device zone.

## Shape

```ts
// nuxt.config.ts, config key `timeZone`
timeZone: { cookieName?: string /* 'tz' */, fallback?: string /* 'UTC' */ }

useTimeZone(): Readonly<Ref<string>> // app, auto-imported
getRequestTimeZone(event: H3Event): string // Nitro, auto-imported
```

- **Head script** (`src/runtime/head-script.ts`). A blocking inline script, added by the server plugin with `useHead` alongside `data-time-zone` only on non-prerendered SSR GETs. Its priority puts it after document metadata such as CSP and before blocking inline `app.head` scripts marked `critical`, so it runs before the body is parsed and before anything paints. It is the only writer of the cookie on server-rendered pages. It reads the device zone from `Intl.DateTimeFormat().resolvedOptions().timeZone` and compares it with `<html data-time-zone>`, the zone the server rendered with, never with the live cookie. When they differ it writes the cookie (`Path=/; Max-Age=31536000; SameSite=Lax`, `Secure` on https), checks it reads back, calls `window.stop()` (before `location.reload()`, the reverse order cancels the reload) so the old body never paints, and reloads. It does nothing when `data-time-zone` is missing, the device zone is missing or unknown to Intl, `navigator.cookieEnabled` is false, the cookie doesn't read back, sessionStorage throws, this tab already reloaded for the same rendered and device zones and the cookie already holds the device zone (the server ignored it, as cached HTML does), or this tab reloaded 3 times in a row without reaching the device zone (a page rendered in the device zone resets that count).
- **Server plugin.** The zone is the cookie when Intl knows it, else `fallback`. It goes into the payload (`useState`) on every server render, including POST and prerendered pages, so hydration uses the zone the server rendered with. `<html data-time-zone>` and the head script are added only on non-prerendered SSR GETs. The script uses priority `41`, just ahead of Unhead's `critical` blocking-script weight (`42`).
- **Client plugin.** The zone is the one in the payload. It never reads the cookie. Without a server render (`ssr: false`) it uses the device zone and writes the cookie, and a write that throws doesn't stop the app.
- **`getRequestTimeZone(event)`.** The cookie when Intl knows it, else `fallback`. On a server-rendered page that is the page's zone. A prerendered or cached page can show the fallback or a cached zone while the cookie holds the device's, so such a page should send `useTimeZone().value` with its requests.
- `cookieName` and `fallback` are build-time constants in a template (`#nuxt-time-zone/options`), not runtime config, because the head script inlines the cookie name. The zone is checked with Intl, not Temporal.

## Out of scope

A user-chosen zone that overrides the device, following a zone change while a tab stays open, and per-visitor HTML from caches. The README says how to cache.
