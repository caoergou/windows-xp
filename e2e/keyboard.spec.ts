import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Desktop keyboard interaction (#87 KBD-03 / DSK-03/04/05): Ctrl+Esc opens the
 * Start menu; selected desktop icons respond to Enter (open), F2 (rename),
 * Delete (recycle) and Ctrl+A (select all).
 */
test.describe('Desktop keyboard operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
  });

  test('Ctrl+Esc toggles the Start menu (KBD-03)', async ({ page }) => {
    await page.keyboard.press('Control+Escape');
    await expect(page.locator('[data-testid="start-menu"]')).toBeVisible();
    await page.keyboard.press('Control+Escape');
    await expect(page.locator('[data-testid="start-menu"]')).not.toBeVisible();
  });

  test('Enter opens the selected icon', async ({ page }) => {
    await page.locator('[data-english-testid="desktop-icon-Calculator"]').click();
    await page.keyboard.press('Enter');
    await expect(
      page.locator('[data-testid="window-title"]').filter({ hasText: 'Calculator' })
    ).toBeVisible();
  });

  test('F2 opens the rename dialog for the selected icon', async ({ page }) => {
    await page.locator('[data-english-testid="desktop-icon-Notepad"]').click();
    await page.keyboard.press('F2');
    await expect(page.getByText('Enter a new name:')).toBeVisible();
  });

  test('Delete on a selected icon prompts for confirmation', async ({ page }) => {
    await page.locator('[data-english-testid="desktop-icon-Notepad"]').click();
    await page.keyboard.press('Delete');
    await expect(page.getByText(/move .* to the Recycle Bin/i)).toBeVisible();
  });
});
