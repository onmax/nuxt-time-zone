import { defineConfig, devices } from '@playwright/test'

// `pnpm test:e2e` runs against a production build of the playground (`pnpm build:playground` first).
// `pnpm test:e2e:dev` (E2E_DEV=1) runs the hydration scenario, tagged @dev, against `nuxi dev`, where Vue reports
// mismatches in detail.
const dev = !!process.env.E2E_DEV
const baseURL = dev ? 'http://127.0.0.1:4321' : 'http://127.0.0.1:4320'

export default defineConfig({
  testDir: 'test/e2e',
  workers: 2,
  // Browser start-up can take a while on a busy machine.
  timeout: 60_000,
  reporter: [['list']],
  use: { locale: 'en-US', timezoneId: 'Europe/Madrid', baseURL },
  projects: dev
    ? [{ name: 'dev', grep: /@dev/, timeout: 180_000, expect: { timeout: 60_000 }, use: devices['Desktop Chrome'] }]
    : [
        { name: 'chromium', use: devices['Desktop Chrome'] },
        { name: 'webkit', use: devices['Desktop Safari'] },
      ],
  webServer: dev
    ? {
        command: 'nuxi dev playground --host 127.0.0.1 --port 4321',
        url: baseURL,
        timeout: 180_000,
        reuseExistingServer: false,
      }
    : {
        command: 'node playground/.output/server/index.mjs',
        url: baseURL,
        env: { HOST: '127.0.0.1', PORT: '4320' },
        reuseExistingServer: false,
      },
})
