# nuxt-time-zone

A Nuxt module for the visitor's time zone, extracted from an app's time-zone plugin. [SPEC.md](./SPEC.md) is the source of truth for behaviour: its 15 numbered scenarios are the tests in `test/e2e/scenarios.spec.ts`.

## Layout

- `src/module.ts`: the Nuxt module, config key `timeZone`. Validates the options, writes them to the `#nuxt-time-zone/options` template, adds the head script and registers the plugins and auto-imports.
- `src/head-script.ts`: the inline script that runs first in `<head>`, writes the cookie and reloads once. It ships in every page: keep it small and keep every guard.
- `src/runtime/plugin.server.ts` and `plugin.client.ts`: the zone for the page load. The client takes it from the payload and never reads the cookie.
- `src/runtime/composables/useTimeZone.ts`, `src/runtime/server/utils/time-zone.ts`: `useTimeZone()` and `getRequestTimeZone(event)`.
- `src/runtime/shared/`: `parseTimeZone` and the cookie attributes, used by the app, the server and the head script.
- `playground/`: a Nuxt app that installs the module from `src/`, with one page per scenario. `/stale` stands in for cached HTML, `/prerendered` and `/spa` set route rules.
- `test/e2e/scenarios.spec.ts`: one Playwright test per SPEC scenario. Scenario 13 also runs against `nuxi dev` on port 4321.
- `.github/scripts/brand.ts`: draws the logo, favicons and banners into `.github/assets` (`pnpm brand`).
- `.github/scripts/npm-claim.sh`: run once by hand to claim the npm name and set up trusted publishing.

## Checks

On Slimbook, run installs, builds, typechecks and tests through `heavy` (`heavy pnpm install`).

```sh
pnpm install
pnpm lint
pnpm dev:prepare && pnpm typecheck
pnpm check:doctor
pnpm validate          # build + publint
pnpm build:playground
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

## Rules

- A behaviour change starts in SPEC.md, then a scenario test, then the code. Run the e2e tests in both browsers.

- Never touch `window` or `document` during SSR.
- Use conventional commit messages. uppt builds the changelog and the release PR from them.
