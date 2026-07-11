import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Notepad keyboard shortcuts are scoped to the focused Notepad window via an
 * onKeyDown handler on its root container (#121) — not a window-level listener.
 * This verifies the shortcut still fires while the window is focused and opens
 * the shared XP dialog chrome.
 */
test.describe('Notepad shortcuts (focus-scoped)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-Notepad"]').dblclick();
    await expect(
      page.locator('[data-testid="window-title"]').filter({ hasText: 'Notepad' })
    ).toBeVisible();
  });

  test('Ctrl+F opens the Find dialog with shared XP chrome', async ({ page }) => {
    // Focus the editor so the window-scoped handler receives the shortcut.
    await page.locator('textarea').first().click();
    await page.keyboard.press('Control+f');

    const dialog = page.locator('[data-testid="xp-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Find Next' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
