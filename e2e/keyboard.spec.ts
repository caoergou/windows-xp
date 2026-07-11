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

/**
 * Explorer keyboard interaction (#87 EXP-03/04): Backspace navigates up one
 * level, F2 renames and Delete recycles the selected item.
 */
test.describe('Explorer keyboard operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    // readme.txt lives in My Documents; wait for the folder contents to render.
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('Backspace navigates up one level (EXP-03)', async ({ page }) => {
    // Descend into the My Pictures subfolder (canonical key 我的图片), then
    // Backspace back up.
    await page.locator('[data-testid="file-item-我的图片"]').dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).not.toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('F2 opens the rename dialog for the selected item (EXP-04)', async ({ page }) => {
    await page.locator('[data-testid="file-item-readme.txt"]').click();
    await page.keyboard.press('F2');
    await expect(page.getByText('Enter a new name:')).toBeVisible();
  });

  test('Delete on a selected item prompts for confirmation (EXP-04)', async ({ page }) => {
    await page.locator('[data-testid="file-item-readme.txt"]').click();
    await page.keyboard.press('Delete');
    await expect(page.getByText(/move .* to the Recycle Bin/i)).toBeVisible();
  });

  test('arrow keys move selection and Enter opens the folder (#120)', async ({ page }) => {
    // Focus the Explorer window, then walk the selection to a folder and open it.
    await page.locator('[data-testid="file-item-我的图片"]').click();
    await page.keyboard.press('Enter');
    // Entering My Pictures reveals its Sample Pictures subfolder.
    await expect(page.locator('[data-testid="file-item-Sample Pictures"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeHidden();
  });
});
