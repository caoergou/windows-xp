import { test, expect } from '@playwright/test';
import { login, LOGIN_PASSWORD } from './helpers/login';

/**
 * Keyboard accessibility & modal focus (#124): a mouse-free path through the
 * core loop, and Esc dismissing a modal dialog (DLG-03/04).
 */
test.describe('Keyboard a11y (#124)', () => {
  test('keyboard-only: boot → login → desktop, no mouse', async ({ page }) => {
    // Fresh load → the boot screen plays, then the login screen appears. Since
    // #160 the live desktop lives at the per-locale demo route; the branded
    // variant keeps boot + login (no auto-login) so we can exercise the keys.
    await page.addInitScript(() => localStorage.clear());
    await page.goto('demo/en/?brand=demo');
    const pw = page.locator('input[type="password"]').first();
    await pw.waitFor({ state: 'visible', timeout: 20000 });
    // Type the password and submit with the keyboard only.
    await pw.focus();
    await page.keyboard.type(LOGIN_PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible({ timeout: 20000 });
  });

  test('Esc closes a modal dialog (focus never escapes to the desktop)', async ({ page }) => {
    await login(page, { lang: 'en' });
    // Trigger the recycle-confirm dialog.
    await page.locator('[data-english-testid="desktop-icon-Notepad"]').click();
    await page.keyboard.press('Delete');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Esc cancels — the Notepad shortcut is still on the desktop.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-english-testid="desktop-icon-Notepad"]')).toBeVisible();
  });

  test('Enter activates the default button (recycle confirmed)', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-Solitaire"]').click();
    await page.keyboard.press('Delete');
    await expect(page.getByRole('dialog')).toBeVisible();
    // Enter fires the bold default button (OK) → the shortcut is recycled.
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-english-testid="desktop-icon-Solitaire"]')).toHaveCount(0);
  });
});
