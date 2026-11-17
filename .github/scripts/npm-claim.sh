#!/usr/bin/env bash
# Run once, by hand: claims `nuxt-time-zone` on npm with an empty 0.0.0 placeholder, then lets
# .github/workflows/release.yaml publish it from GitHub Actions without a token (trusted publishing).
# npm asks for your 2FA code at each step. Needs npm 11.19 or later for `npm trust`.
set -euo pipefail

name=nuxt-time-zone
repo=onmax/nuxt-time-zone

npm whoami >/dev/null || npm login

if [ -n "$(npm view "$name" version 2>/dev/null)" ]; then
  echo "$name is already on npm; skipping the placeholder"
else
  dir=$(mktemp -d)
  trap 'rm -rf "$dir"' EXIT
  cat >"$dir/package.json" <<JSON
{
  "name": "$name",
  "version": "0.0.0",
  "description": "Placeholder. The first release comes from github.com/$repo.",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/$repo.git" }
}
JSON
  printf '# %s\n\nPlaceholder. Source: https://github.com/%s\n' "$name" "$repo" >"$dir/README.md"
  (cd "$dir" && npm publish --access public)
fi

# Only release.yaml, running in the `npm` environment (tags v*), may publish.
npm trust github "$name" --repo "$repo" --file release.yaml --env npm --allow-publish --yes
npm trust list "$name"
