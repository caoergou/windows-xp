const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.{ts,tsx,js}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/windows-xp/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Allow overriding the browser binary in sandboxed environments where
    // downloading browsers is not possible (e.g. PW_CHROMIUM_PATH=/opt/pw-browsers/chromium)
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/windows-xp/',
    timeout: 120000,
    reuseExistingServer: true,
  },
});
