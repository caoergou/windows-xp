import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Explorer Details view + view switcher (#120, EXP-02). Opens My Documents,
 * switches from the default Icons grid to the sortable Details table, and
 * checks the columns, a row, and click-to-sort.
 */
test.describe('Explorer Details view', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('toolbar Views button switches to a sortable Details table', async ({ page }) => {
    // Toggle to Details via the toolbar Views button.
    await page.locator('button[title="View"]').click();

    // Column headers + the file as a row.
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Date Modified')).toBeVisible();
    const row = page.locator('[data-testid="file-row-readme.txt"]');
    await expect(row).toBeVisible();

    // Selecting a row works, and click-to-sort on a header does not throw.
    await row.click();
    await page.getByText('Size', { exact: true }).click();
    await expect(page.locator('[data-testid="file-row-readme.txt"]')).toBeVisible();

    // Toggle back to Icons.
    await page.locator('button[title="View"]').click();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });
});
