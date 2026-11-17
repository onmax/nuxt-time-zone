# nuxt-time-zone

A Nuxt module for the visitor's time zone, extracted from an app's time-zone plugin.

## Layout

<!-- runtime layout added by the runtime unit -->
- `src/module.ts`: the Nuxt module, config key `timeZone`.
- `playground/`: a Nuxt app that installs the module from `src/`.
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

- Never touch `window` or `document` during SSR.
- Use conventional commit messages. uppt builds the changelog and the release PR from them.
