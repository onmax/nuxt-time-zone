import { defineConfig, devices } from '@playwright/test'

// Runs against a production build of the playground: `pnpm build:playground` first.
const baseURL = 'http://127.0.0.1:4320'

export default defineConfig({
  testDir: 'test/e2e',
  workers: 2,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL } },
  ],
  webServer: {
    command: 'node playground/.output/server/index.mjs',
    url: baseURL,
    env: { HOST: '127.0.0.1', PORT: '4320' },
    reuseExistingServer: false,
  },
})
