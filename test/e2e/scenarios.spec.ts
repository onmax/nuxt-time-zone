import type { BrowserContext, Page } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { expect, test } from '@playwright/test'

// The playground's ZoneReport formats 2026-06-01T12:00:00Z: 14:00 in Madrid (the device zone set in
// playwright.config.ts), 12:00 in UTC (the fallback).
const DEVICE = 'Europe/Madrid'
const FALLBACK = 'UTC'
const hourIn = { [DEVICE]: '14', [FALLBACK]: '12', 'Asia/Tokyo': '21' } as Record<string, string>

interface RenderedDocument {
  method: string
  html: string
}

// Every document the main frame loads, the first load plus each reload, with the HTML the server sent. A browser
// drops the body of a page that reloaded, so it is read on the way in.
async function trackDocuments(page: Page) {
  const documents: RenderedDocument[] = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    if (!request.isNavigationRequest() || request.frame() !== page.mainFrame())
      return route.fallback()
    const response = await route.fetch()
    documents.push({ method: request.method(), html: await response.text() })
    await route.fulfill({ response })
  })
  return documents
}

// Waits for the page that stays: the head script reloads before the body is parsed, so a page that hydrated
// won't reload any more. The extra wait catches a reload from anywhere else.
async function settled(page: Page) {
  await expect(page.locator('html[data-hydrated]')).toBeAttached()
  await page.waitForTimeout(300)
}

async function visit(page: Page, path: string) {
  await page.unrouteAll()
  const documents = await trackDocuments(page)
  await page.goto(path, { waitUntil: 'commit' })
  await settled(page)
  return documents
}

async function cookie(context: BrowserContext) {
  const value = (await context.cookies()).find(c => c.name === 'tz')?.value
  return value === undefined ? undefined : decodeURIComponent(value)
}

async function apiZone(page: Page) {
  return page.evaluate(() => fetch('/api/time-zone').then(r => r.json()).then(r => r.timeZone as string))
}

async function expectPageZone(page: Page, zone: string) {
  await expect(page.getByTestId('zone')).toHaveText(zone)
  await expect(page.getByTestId('wall-clock')).toHaveClass(`hour-${hourIn[zone]}`)
}

// A page stuck in a reload loop still has a document request in flight when the test fails.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

function blockCookieWrites(page: Page) {
  return page.addInitScript(() => {
    Object.defineProperty(Document.prototype, 'cookie', { configurable: true, get: () => '', set: () => {} })
  })
}

interface DocumentLog {
  contentLoaded: boolean
  paints: string[]
}

// Logs, per document, whether it fired DOMContentLoaded and which paint entries it recorded, in sessionStorage so
// the log survives the reload.
function logDocuments(page: Page) {
  return page.addInitScript(() => {
    const log: DocumentLog[] = JSON.parse(sessionStorage.getItem('test:documents') || '[]')
    const entry: DocumentLog = { contentLoaded: false, paints: [] }
    log.push(entry)
    const save = () => sessionStorage.setItem('test:documents', JSON.stringify(log))
    const paints = () => {
      entry.paints = performance.getEntriesByType('paint').map(paint => paint.name)
      save()
    }
    save()
    new PerformanceObserver(paints).observe({ type: 'paint', buffered: true })
    addEventListener('pagehide', paints)
    document.addEventListener('DOMContentLoaded', () => {
      entry.contentLoaded = true
      save()
    })
  })
}

test('1. first visit in another zone reloads once and renders in the device zone', async ({ page, context }) => {
  await logDocuments(page)
  const documents = await visit(page, '/')
  expect(documents).toHaveLength(2)

  // The script blocks in <head>, before any body markup, and the first document stops before it paints.
  const first = documents[0]!.html
  const script = first.indexOf('<script data-hid="nuxt-time-zone">')
  expect(first.indexOf('<head>')).toBeGreaterThanOrEqual(0)
  expect(script).toBeGreaterThan(first.indexOf('<head>'))
  expect(script).toBeLessThan(first.indexOf('</head>'))
  expect(first.indexOf('</head>')).toBeLessThan(first.indexOf('<body'))
  const log: DocumentLog[] = await page.evaluate(() => JSON.parse(sessionStorage.getItem('test:documents')!))
  expect(log).toHaveLength(2)
  expect(log[0]).toEqual({ contentLoaded: false, paints: [] })
  expect(log[1]!.contentLoaded).toBe(true)

  const html = documents.at(-1)!.html
  expect(html).toContain(`data-time-zone="${DEVICE}"`)
  expect(html).toContain(`hour-${hourIn[DEVICE]}`)
  await expectPageZone(page, DEVICE)
  expect(await cookie(context)).toBe(DEVICE)
  expect(await apiZone(page)).toBe(DEVICE)
  await expect(page.getByTestId('nuxt-time')).toHaveText('14:00')
})

test('2. a return visit does not reload', async ({ page }) => {
  await visit(page, '/')
  const documents = await visit(page, '/other')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, DEVICE)
})

test.describe('3. device in the fallback zone', () => {
  test.use({ timezoneId: FALLBACK })

  test('renders the fallback without a reload or a cookie', async ({ page, context }) => {
    const documents = await visit(page, '/')
    expect(documents).toHaveLength(1)
    await expectPageZone(page, FALLBACK)
    expect(await cookie(context)).toBeUndefined()
    expect(await apiZone(page)).toBe(FALLBACK)
  })
})

test('4. an invalid cookie renders the fallback, then reloads once with the device zone', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'tz', value: 'Mars%2FOlympus_Mons', url: baseURL! }])
  const documents = await visit(page, '/')
  expect(documents).toHaveLength(2)
  expect(documents[0]!.html).toContain(`data-time-zone="${FALLBACK}"`)
  await expectPageZone(page, DEVICE)
  expect(await cookie(context)).toBe(DEVICE)
})

test('5. with cookies off the page keeps the fallback and does not reload', async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'cookieEnabled', { configurable: true, get: () => false })
  })
  const documents = await visit(page, '/')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, FALLBACK)
  expect(await cookie(context)).toBeUndefined()
})

test('6. a cookie that does not read back does not reload', async ({ page }) => {
  await blockCookieWrites(page)
  const documents = await visit(page, '/')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, FALLBACK)
})

test('7. without sessionStorage nothing is written and nothing reloads', async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })
  })
  const documents = await visit(page, '/')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, FALLBACK)
  expect(await cookie(context)).toBeUndefined()
})

test('8. HTML that keeps the old zone reloads once per tab session, never in a loop', async ({ page, context }) => {
  let documents = await visit(page, '/stale')
  expect(documents).toHaveLength(2)
  await expectPageZone(page, FALLBACK)
  expect(await cookie(context)).toBe(DEVICE)

  documents = await visit(page, '/stale')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, FALLBACK)
})

test('9. a prerendered page does not reload and uses the fallback', async ({ page, context }) => {
  const documents = await visit(page, '/prerendered')
  expect(documents).toHaveLength(1)
  expect(documents[0]!.html).not.toContain('data-time-zone=')
  await expectPageZone(page, FALLBACK)
  expect(await cookie(context)).toBeUndefined()
})

test('10. a page rendered for a POST does not reload', async ({ page }) => {
  await visit(page, '/prerendered')
  await page.unrouteAll()
  const documents = await trackDocuments(page)
  await page.getByTestId('post').click()
  await page.waitForURL('**/posted', { waitUntil: 'commit' })
  await settled(page)
  expect(documents.map(d => d.method)).toEqual(['POST'])
  await expectPageZone(page, FALLBACK)
})

test('11. an `ssr: false` page uses the device zone and writes the cookie', async ({ page, context }) => {
  const documents = await visit(page, '/spa')
  expect(documents).toHaveLength(1)
  await expectPageZone(page, DEVICE)
  expect(await cookie(context)).toBe(DEVICE)
  expect(await apiZone(page)).toBe(DEVICE)
})

test('12. the zone stays fixed for the page load', async ({ page, context, baseURL }) => {
  await visit(page, '/')
  // Another tab, or a device that changed zone, rewrites the cookie while this page is open.
  await context.addCookies([{ name: 'tz', value: 'Asia%2FTokyo', url: baseURL! }])
  await page.getByTestId('nav-other').click()
  await expect(page).toHaveURL(/\/other$/)
  await expectPageZone(page, DEVICE)

  // The next load renders Tokyo, sees the device is in Madrid, and reloads once.
  await page.unrouteAll()
  const documents = await trackDocuments(page)
  await page.reload({ waitUntil: 'commit' })
  await settled(page)
  expect(documents).toHaveLength(2)
  expect(documents[0]!.html).toContain('data-time-zone="Asia/Tokyo"')
  await expectPageZone(page, DEVICE)
})

test('13. zone-dependent text and classes hydrate without mismatches', { tag: '@dev' }, async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (/hydrat|mismatch/i.test(message.text()))
      warnings.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', error => warnings.push(`pageerror: ${error.message}`))

  await visit(page, '/')
  await expectPageZone(page, DEVICE)
  // Prerendered only in the production build; in dev it renders like any page.
  await visit(page, '/prerendered')
  await visit(page, '/stale')
  await expectPageZone(page, FALLBACK)
  expect(warnings).toEqual([])
})

test('14. <NuxtTime> without `time-zone` shows the device zone, even when the page rendered in another', async ({ page }) => {
  await visit(page, '/prerendered')
  await expectPageZone(page, FALLBACK)
  await expect(page.getByTestId('nuxt-time')).toHaveText('14:00')
})

test('15. setup rejects a fallback Intl does not know', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'runs Nuxt, not a browser')
  const fixture = fileURLToPath(new URL('../fixtures/invalid-fallback', import.meta.url))
  const result = spawnSync('pnpm', ['exec', 'nuxi', 'prepare', fixture], { encoding: 'utf8' })
  rmSync(new URL('../fixtures/invalid-fallback/.nuxt', import.meta.url), { recursive: true, force: true })
  expect(result.status).not.toBe(0)
  expect(stripVTControlCharacters(result.stdout + result.stderr)).toMatch(/`?timeZone\.fallback`? must be an IANA time zone/)
})

test('16. a cookie lost in the same tab reloads once and recovers', async ({ page, context }) => {
  await visit(page, '/')
  // Cleared cookies, or Safari's 7-day cap in a tab that stays open.
  await context.clearCookies()
  const documents = await visit(page, '/other')
  expect(documents).toHaveLength(2)
  await expectPageZone(page, DEVICE)
  expect(await cookie(context)).toBe(DEVICE)
})
