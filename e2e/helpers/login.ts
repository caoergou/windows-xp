import type { Page } from '@playwright/test';

export const LOGIN_PASSWORD = 'forthe2000s';

export interface LoginOptions {
  lang?: 'en' | 'zh';
  skipBoot?: boolean;
  /** Skip the password login screen by pre-setting logged-in state (default: true). */
  skipLogin?: boolean;
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

  const skipLogin = options.skipLogin !== false;

  if (options.skipBoot !== false) {
    await page.addInitScript((autoLogin: boolean) => {
      localStorage.clear();
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
      if (autoLogin) {
        localStorage.setItem('xp_logged_in', 'true');
      }
    }, skipLogin);
  }

  await page.goto(path);
  await page.waitForLoadState('networkidle');

  // Dismiss the one-time touch hint if present (only shown on touch devices
  // since #125). Harmless no-op on Desktop Chrome where it never appears.
  const touchHintBtn = page.locator('[data-testid="touch-hint-dismiss"]');
  try {
    await touchHintBtn.waitFor({ state: 'visible', timeout: 2000 });
    await touchHintBtn.click();
  } catch {
    // Touch hint not shown; continue.
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

  if (!skipLogin) {
    // Login screen: fill password and submit.
    const passwordInput = page.locator('input[type="password"]').first();
    try {
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(LOGIN_PASSWORD);
      await page.keyboard.press('Enter');
    } catch {
      // Already logged in or no password field present.
    }
  }

  // Wait for the desktop / taskbar to confirm login succeeded.
  await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });
}
