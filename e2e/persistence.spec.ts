import { test, expect, type Page } from '@playwright/test';
import { LOGIN_PASSWORD } from './helpers/login';

/**
 * Reload-safe login: the shared helper's addInitScript clears localStorage on
 * EVERY navigation (including page.reload()), which would wipe the very
 * persistence this spec verifies. This variant only seeds boot flags when
 * they are absent, so a reload keeps xp_logged_in / xp_open_windows intact.
 */
async function loginPreservingStorage(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('xp_first_boot_done')) {
      localStorage.clear();
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
    }
  });
  await page.goto('./?lang=en');
  await page.waitForLoadState('networkidle');

  const passwordInput = page.locator('input[type="password"]').first();
  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(LOGIN_PASSWORD);
    await page.keyboard.press('Enter');
  } catch {
    // Already logged in.
  }
  await page.locator('[data-testid="start-button"]').waitFor({ state: 'visible', timeout: 15000 });
}

/** Reloading with a logged-in session lands on the screensaver first. */
async function dismissScreensaver(page: Page) {
  const hint = page
    .locator('text=Click or press any key to continue')
    .or(page.locator('text=点击或按任意键继续'));
  try {
    await hint.first().waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
  } catch {
    // Screensaver not shown; continue.
  }
}

/**
 * "The world survives a refresh" — issue #83.
 *
 * Covers the window persistence round-trip through a real browser reload:
 * localStorage('xp_open_windows') serialization on open, WindowFactory
 * restoration on boot. Known persistence bugs are marked test.fixme and
 * tracked in #81 — they document the gap without failing CI.
 */
test.describe('Persistence across reload', () => {
  test('open window is restored after a page reload', async ({ page }) => {
    await loginPreservingStorage(page);

    // Launch Calculator from the desktop.
    await page.locator('[data-english-testid="desktop-icon-Calculator"]').dblclick();
    const calcTitle = page
      .locator('[data-testid="window-title"]')
      .filter({ hasText: 'Calculator' });
    await expect(calcTitle).toBeVisible();

    // Reload without clearing storage: session and window list must survive.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissScreensaver(page);

    // No login screen (xp_logged_in persists) and the window is restored.
    await expect(calcTitle).toBeVisible({ timeout: 10000 });
  });

  test('window position survives a reload', async ({ page }) => {
    await loginPreservingStorage(page);

    await page.locator('[data-english-testid="desktop-icon-Calculator"]').dblclick();
    const calcTitle = page
      .locator('[data-testid="window-title"]')
      .filter({ hasText: 'Calculator' });
    await expect(calcTitle).toBeVisible();

    // Drag the window somewhere distinctive (raw mouse ops: the title-bar
    // element intercepts pointer events over the title text).
    const grab = await calcTitle.boundingBox();
    if (!grab) throw new Error('calculator title bar has no bounding box');
    await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
    await page.mouse.down();
    await page.mouse.move(600, 400, { steps: 5 });
    await page.mouse.up();

    const before = await calcTitle.boundingBox();
    if (!before) throw new Error('window not measurable before reload');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissScreensaver(page);
    await expect(calcTitle).toBeVisible({ timeout: 10000 });

    const after = await calcTitle.boundingBox();
    if (!after) throw new Error('window not measurable after reload');
    // Allow a small tolerance for chrome/border offsets.
    expect(Math.abs(after.x - before.x)).toBeLessThan(10);
    expect(Math.abs(after.y - before.y)).toBeLessThan(10);
  });

  test.fixme(
    'start-menu-launched Internet Explorer keeps its page after reload (#81: componentProps are not persisted on this launch path)',
    async () => {
      // Blocked on #81: Taskbar launch paths put url/initialPath only into the
      // rendered JSX, not into componentProps, so a reload restores a blank IE.
    }
  );

  test.fixme(
    'newly created empty folder survives reload (#81: structural changes are not persisted)',
    async () => {
      // Blocked on #81: persistFs only serializes nodes with content, so an
      // empty folder disappears after refresh.
    }
  );
});
