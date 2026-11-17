<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./.github/assets/banner-light.svg">
    <img src="./.github/assets/banner-light.svg" alt="nuxt-time-zone" width="100%">
  </picture>
</h1>

[![CI](https://github.com/onmax/nuxt-time-zone/actions/workflows/ci.yml/badge.svg)](https://github.com/onmax/nuxt-time-zone/actions/workflows/ci.yml)
[![status: private preview](https://comark-ui.onmax.me/badge.svg?label=status&value=private%20preview)](#status)
[![for Nuxt 4](https://comark-ui.onmax.me/badge.svg?label=for&value=Nuxt%204)](https://nuxt.com)
[![license: MIT](https://comark-ui.onmax.me/badge.svg?label=license&value=MIT)](./LICENSE)

The visitor's time zone in Nuxt, the same on the server and the client for the whole page load.

A server render doesn't know the visitor's zone, so "today", day keys and wall-clock times come out in UTC and change after hydration, or the client renders them differently and Vue reports a hydration mismatch. This module keeps the zone in a cookie. A small script at the top of `<head>` compares the device's zone with the one the page was rendered in, and when they differ it writes the cookie and reloads once, before the body is parsed. From then on the server renders in the visitor's zone and hydration agrees with it.

[How it works](#how-it-works) · [Caveats](#caveats) · [How it's checked](#how-its-checked) · [SPEC.md](./SPEC.md)

```vue
<script setup lang="ts">
const timeZone = useTimeZone()
const today = computed(() => new Intl.DateTimeFormat('en-CA', { timeZone: timeZone.value }).format(new Date()))
</script>

<template>
  <p>Today is {{ today }} in {{ timeZone }}.</p>
</template>
```

```ts
// server/api/today.get.ts
export default defineEventHandler((event) => {
  const timeZone = getRequestTimeZone(event)
  return { today: new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date()) }
})
```

Both read the same zone: the page and every request it makes agree on what "today" is.

## Install

```sh
npx nuxi module add nuxt-time-zone
```

That works once the package is on npm. Until then it is a [private preview](#status).

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-time-zone'],
})
```

It needs Nuxt 4.

## Usage

`useTimeZone()` is auto-imported in the app. It returns a read-only ref holding an IANA zone such as `Europe/Madrid`. The value doesn't change during a page load, so you can use it in `computed`, stores and `useFetch` keys without watching it.

`getRequestTimeZone(event)` is auto-imported in Nitro. It returns the zone of the page that sent the request: the cookie when Intl knows it, otherwise `fallback`.

### `<NuxtTime>`

Omit `time-zone`. `<NuxtTime>` then formats in the device's zone, before and during hydration, which after the reload is the zone this module gives you anyway. Pass `useTimeZone().value` only to pin a zone, for example to show times in an account's zone instead of the visitor's.

```vue
<NuxtTime :datetime="order.createdAt" date-style="medium" time-style="short" />
```

## Options

```ts
export default defineNuxtConfig({
  modules: ['nuxt-time-zone'],
  timeZone: {
    cookieName: 'tz',
    fallback: 'UTC',
  },
})
```

| Option       | Default | What it does                                                                                                                                    |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `cookieName` | `'tz'`  | The cookie that carries the zone. It must be a valid cookie name.                                                                               |
| `fallback`   | `'UTC'` | The zone when the request has no valid cookie: a first visit, cookies off, prerendered pages. Setup throws if Intl doesn't know it. |

Both are build-time options. The head script inlines the cookie name, so they aren't read from runtime config.

## How it works

1. The server reads the cookie. If Intl knows the zone it uses it, otherwise `fallback`. It renders with that zone, puts it in the payload and on `<html data-time-zone>`.
2. The head script runs first in `<head>`. It reads the device zone with `Intl.DateTimeFormat().resolvedOptions().timeZone` and compares it with `data-time-zone`. If they match, it does nothing.
3. If they differ, it writes the cookie (`Path=/; Max-Age=31536000; SameSite=Lax`, plus `Secure` on https), checks that the cookie reads back, and reloads. The second response is rendered in the device zone.
4. On the client, `useTimeZone()` returns the zone from the payload, the one the server rendered with. It never reads the cookie, so hydration matches the HTML.

The script reloads at most once per tab session for the same rendered and device zones, and it skips the reload when:

- cookies are off, or the cookie doesn't read back
- sessionStorage is unavailable, since nothing could then stop a loop
- the page was rendered for a POST or another non-GET request, since a reload would resend it
- the page was prerendered or rendered with `ssr: false`; the server leaves out `data-time-zone` for those

With `ssr: false` nothing was rendered, so the app uses the device zone directly and writes the cookie itself.

A zone change while a tab stays open, say after a flight, shows up on the next page load, with one reload.

## Caveats

- **Cached HTML.** Prerendered pages, `swr`, `isr`, `cache` route rules and CDNs serve one zone to everyone. Prerendered pages use `fallback` and never reload. Other cached pages reload once per tab session and then keep the cached zone. Don't cache pages that show zone-dependent values, or make the cache vary on the `Cookie` header.
- **Safari caps cookies written by JavaScript at 7 days.** After a week away the cookie is gone, and the first visit reloads once.
- **Cross-site frames.** Inside an iframe on another site, the browser usually blocks the cookie. The page then doesn't reload and uses `fallback`.
- **A cookie that changes during a page load.** Another tab can rewrite the cookie. The open page keeps its zone, but its later requests send the new cookie, so `getRequestTimeZone` can disagree with `useTimeZone` until the next load.
- **Content Security Policy.** The head script is inline. A strict CSP needs to allow it, with a hash or a nonce.

## How it's checked

Each row is a numbered scenario in [SPEC.md](./SPEC.md) and a Playwright test in [`test/e2e/scenarios.spec.ts`](./test/e2e/scenarios.spec.ts). They run against a production build of [`playground/`](./playground) in Chromium and WebKit, with the device in `Europe/Madrid`.

| #   | Check                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------ |
| 1   | A first visit reloads exactly once. Then the HTML, the cookie, `useTimeZone`, an API route and `<NuxtTime>` show the device zone. |
| 2   | A return visit doesn't reload.                                                                               |
| 3   | A device in the fallback zone doesn't reload and gets no cookie.                                             |
| 4   | An invalid cookie renders the fallback, then reloads once with the cookie fixed.                             |
| 5   | With cookies off there is no reload.                                                                         |
| 6   | A cookie that doesn't read back causes no reload.                                                            |
| 7   | Without sessionStorage there is no reload and no cookie.                                                     |
| 8   | HTML that keeps the old zone, like a cache that ignores the cookie, reloads once and never loops.            |
| 9   | A prerendered page doesn't reload and uses the fallback.                                                     |
| 10  | A page rendered for a form POST doesn't reload.                                                              |
| 11  | An `ssr: false` page uses the device zone and writes the cookie.                                             |
| 12  | A cookie changed by another tab doesn't change the zone of an open page.                                     |
| 13  | Zone-dependent text and classes hydrate without mismatch warnings, in production and in `nuxi dev`.          |
| 14  | `<NuxtTime>` without `time-zone` shows the device zone, even on a page rendered in the fallback.              |
| 15  | Setup throws for a `fallback` Intl doesn't know.                                                             |

## Status

Private preview: the repository is private and nothing is on npm yet.

## Credit

The approach comes from Nuxt's [`<NuxtTime>`](https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-time.vue) by Daniel Roe: fix the zone with a script that runs before hydration, and hydrate from what the server rendered. This module moves the script into `<head>`, so a reload can happen before anything paints, and applies the zone to the whole app instead of one component. The reload guards follow [`@epic-web/client-hints`](https://github.com/epicweb-dev/client-hints).

## Develop

```sh
pnpm install
pnpm dev:prepare       # stub the module and generate types
pnpm dev               # playground on http://localhost:4320
pnpm lint
pnpm typecheck
pnpm build:playground
pnpm test:e2e          # the 15 scenarios, Chromium and WebKit
```

## License

[MIT](./LICENSE)
