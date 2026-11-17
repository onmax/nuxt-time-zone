import { defineConfig, devices } from '@playwright/test'

// Runs against a production build of the playground (`pnpm build:playground` first), and the hydration scenario
// (tagged @dev) also against `nuxi dev`, where Vue reports mismatches in detail.
const baseURL = 'http://127.0.0.1:4320'
const devURL = 'http://127.0.0.1:4321'

export default defineConfig({
  testDir: 'test/e2e',
  workers: 2,
  // Browser start-up can take a while on a busy machine.
  timeout: 60_000,
  reporter: [['list']],
  use: { locale: 'en-US', timezoneId: 'Europe/Madrid' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL } },
    { name: 'dev', grep: /@dev/, timeout: 180_000, expect: { timeout: 60_000 }, use: { ...devices['Desktop Chrome'], baseURL: devURL } },
  ],
  webServer: [
    {
      command: 'node playground/.output/server/index.mjs',
      url: baseURL,
      env: { HOST: '127.0.0.1', PORT: '4320' },
      reuseExistingServer: false,
    },
    {
      command: 'nuxi dev playground --host 127.0.0.1 --port 4321',
      url: devURL,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
})
