import type { Page } from '@playwright/test';

export const LOGIN_PASSWORD = 'forthe2000s';

export interface LoginOptions {
  lang?: 'en' | 'zh';
  skipBoot?: boolean;
  /** Extra query string appended to the URL (no leading `&`/`?`), e.g. `open=Notepad&history=1`. */
  query?: string;
}

/**
 * Shared login helper for E2E tests.
 *
 * Navigates to the app, optionally skips the boot animation, dismisses the
 * mobile warning if it appears, logs in with the default password, and waits
 * for the desktop/taskbar to be visible.
 */
export async function login(page: Page, options: LoginOptions = {}) {
  // Since #160 the root `/` is the landing page; the live desktop lives at the
  // per-locale demo routes (`/demo/en/`, `/demo/zh/`). Deep-link params
  // (`open=…&history=1`) are preserved on the query string.
  const lang = options.lang ?? 'en';
  const base = `demo/${lang}/`;
  const path = options.query ? `${base}?${options.query}` : base;

  if (options.skipBoot !== false) {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
    });
  }

  await page.goto(path);
  await page.waitForLoadState('networkidle');

  // Dismiss mobile warning overlay if present (Desktop Chrome usually skips this,
  // but the helper is defensive for other viewports).
  const mobileBtn = page
    .getByRole('button', { name: /Continue to Desktop|继续访问桌面版/ })
    .first();
  try {
    await mobileBtn.waitFor({ state: 'visible', timeout: 3000 });
    await mobileBtn.click();
  } catch {
    // Mobile warning not shown; continue.
  }

  // If we landed on the screensaver (e.g. reused logged-in state), dismiss it.
  const screenSaverHint = page
    .locator('text=Click or press any key to continue')
    .or(page.locator('text=点击或按任意键继续'));
  try {
    await screenSaverHint.waitFor({ state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');
  } catch {
    // Screensaver not shown; continue.
  }

  // Login screen: fill password and submit.
  const passwordInput = page.locator('input[type="password"]').first();
  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(LOGIN_PASSWORD);
    await page.keyboard.press('Enter');
  } catch {
    // Already logged in or no password field present.
  }

  // Wait for the desktop / taskbar to confirm login succeeded.
  await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });
}
