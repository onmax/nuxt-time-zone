# nuxt-time-zone

[SPEC.md](./SPEC.md) is the source of truth for behaviour. Its numbered scenarios are the tests in `test/e2e/scenarios.spec.ts`, one test each, and the playground has a page per scenario.

## Rules

- A behaviour change starts in SPEC.md, then its scenario test, then the code. Run the e2e tests in Chromium and WebKit.
- `src/runtime/head-script.ts` ships inline in every server-rendered page: keep it small and keep every guard.
- The client takes the zone from the payload and never reads the cookie.
- Never touch `window` or `document` during SSR.
- Run `pnpm dev:prepare` before `pnpm check` and `pnpm typecheck`: the type-aware lint and vue-tsc read the generated `.nuxt` tsconfigs.
- Vite+ (`vp`) formats and lints from `vite.config.ts`; Nuxt never loads that file. `pnpm check:fix` formats and applies lint fixes.
- `pnpm exec vp run check:doctor` runs Vite Doctor with every activated pack's strict preset and fails on any warning.
- The logo, favicons and banners in `.github/assets` are generated: edit `.github/scripts/brand.ts` and run `pnpm brand`.
- Use conventional commits. uppt builds the changelog and release PR from them.
