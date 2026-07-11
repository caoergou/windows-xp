import { defineConfig, devices } from '@playwright/test';

/**
 * Visual-regression config for the micro-component gallery (#99).
 *
 * Kept separate from the behavioural e2e suite (`playwright.config.js`) so the
 * pixel baselines only run where the rendering environment is controlled — CI
 * runs this inside the official Playwright container (matching Chromium + fonts
 * to the committed `-linux` baselines). Regenerate baselines with:
 *
 *   npm run test:visual:update
 */
export default defineConfig({
  testDir: './e2e-visual',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    // Tolerate sub-pixel anti-aliasing / font-fallback noise while still
    // catching real colour, border, and layout regressions.
    toHaveScreenshot: { maxDiffPixelRatio: 0.05, threshold: 0.2 },
  },
  use: {
    baseURL: 'http://localhost:5173/windows-xp/',
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 1300 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/windows-xp/',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
