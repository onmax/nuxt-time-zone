import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Map the Nuxt build alias and TypeScript extensionless imports for node:test.
register(
  `data:text/javascript,${encodeURIComponent(`
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '#nuxt-time-zone/options') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export const cookieName = "tz"; export const fallback = "UTC";',
    }
  }
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const base = new URL(context.parentURL)
    for (const ext of ['.ts', '/index.ts']) {
      const candidate = new URL(specifier + ext, base)
      if (existsSync(candidate)) {
        return { shortCircuit: true, url: candidate.href }
      }
    }
  }
  return nextResolve(specifier, context)
}
`)}`,
  pathToFileURL('./'),
)
