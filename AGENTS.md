# nuxt-time-zone

[SPEC.md](./SPEC.md) is the source of truth for behaviour. Its numbered scenarios are the tests in `test/e2e/scenarios.spec.ts`, one test each, and the playground has a page per scenario.

## Rules

- A behaviour change starts in SPEC.md, then its scenario test, then the code. Run the e2e tests in Chromium and WebKit.
- `src/head-script.ts` ships inline in every page: keep it small and keep every guard.
- The client takes the zone from the payload and never reads the cookie.
- Never touch `window` or `document` during SSR.
- Run `pnpm dev:prepare` before `pnpm typecheck`.
- The logo, favicons and banners in `.github/assets` are generated: edit `.github/scripts/brand.ts` and run `pnpm brand`.
- Use conventional commits. uppt builds the changelog and release PR from them.
