import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Multi-selection (#211): the desktop and Explorer share one selection model
 * (`useMultiSelect`). Ctrl/Cmd click toggles membership, Shift click selects a
 * range, Ctrl+A selects all, and a delete over a multi-selection confirms with
 * a count ("these N items") and recycles them in one batch.
 */

const selected = (testid: string) => `[data-testid="${testid}"][data-selected="true"]`;

test.describe('Explorer multi-selection', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('Ctrl+click adds and toggles items in the selection', async ({ page }) => {
    await page.locator('[data-testid="file-item-readme.txt"]').click();
    await page.locator('[data-testid="file-item-about.md"]').click({ modifiers: ['Control'] });
    // Both are now selected.
    await expect(page.locator(selected('file-item-readme.txt'))).toBeVisible();
    await expect(page.locator(selected('file-item-about.md'))).toBeVisible();
    // Ctrl+clicking readme again toggles it off; about.md stays selected.
    await page.locator('[data-testid="file-item-readme.txt"]').click({ modifiers: ['Control'] });
    await expect(page.locator(selected('file-item-readme.txt'))).toHaveCount(0);
    await expect(page.locator(selected('file-item-about.md'))).toBeVisible();
  });

  test('Ctrl+A selects everything and Delete confirms the batch by count', async ({ page }) => {
    // Sample Pictures holds exactly two files — a clean count to assert.
    await page.locator('[data-testid="file-item-我的图片"]').dblclick();
    await page.locator('[data-testid="file-item-Sample Pictures"]').dblclick();
    await expect(page.locator('[data-testid="file-item-Bliss.jpg"]')).toBeVisible();

    // Focus a file so the window owns the keyboard, then select-all.
    await page.locator('[data-testid="file-item-Bliss.jpg"]').click();
    await page.keyboard.press('Control+a');
    await expect(page.locator(selected('file-item-Bliss.jpg'))).toBeVisible();
    await expect(page.locator(selected('file-item-Sunset.jpg'))).toBeVisible();

    // Delete a multi-selection → count confirmation, then both are gone.
    await page.keyboard.press('Delete');
    await expect(page.getByText(/move these 2 items to the Recycle Bin/i)).toBeVisible();
    await page.getByRole('button', { name: /^OK$/i }).click();
    await expect(page.locator('[data-testid="file-item-Bliss.jpg"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="file-item-Sunset.jpg"]')).toHaveCount(0);
  });

  test('Shift+click selects a contiguous range', async ({ page }) => {
    // Switch to Details view (via the Views dropdown) for a stable top-to-bottom
    // order to range over.
    await page.locator('button[title="View"]').click();
    await page
      .locator('[role="menu"]')
      .last()
      .locator('button', { hasText: /^Details/ })
      .first()
      .click();
    await expect(page.locator('[data-testid="file-row-readme.txt"]')).toBeVisible();

    const rows = page.locator('[data-item-key]');
    const first = rows.first();
    const firstKey = await first.getAttribute('data-item-key');
    await first.click();
    // Shift-click the third row selects the inclusive range from the anchor.
    const third = rows.nth(2);
    const thirdKey = await third.getAttribute('data-item-key');
    await third.click({ modifiers: ['Shift'] });
    await expect(page.locator(`[data-item-key="${firstKey}"][data-selected="true"]`)).toBeVisible();
    await expect(page.locator(`[data-item-key="${thirdKey}"][data-selected="true"]`)).toBeVisible();
    // Exactly three rows are selected (the range endpoints plus the middle one).
    await expect(page.locator('[data-item-key][data-selected="true"]')).toHaveCount(3);
  });
});

test.describe('Desktop multi-selection', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
  });

  test('Ctrl+click multi-selects desktop icons', async ({ page }) => {
    const calc = page.locator('[data-english-testid="desktop-icon-Calculator"]');
    const notepad = page.locator('[data-english-testid="desktop-icon-Notepad"]');
    await calc.click();
    await notepad.click({ modifiers: ['Control'] });
    await expect(calc).toHaveAttribute('data-selected', 'true');
    await expect(notepad).toHaveAttribute('data-selected', 'true');
    // A plain click on one collapses the selection to just that icon.
    await notepad.click();
    await expect(calc).toHaveAttribute('data-selected', 'false');
    await expect(notepad).toHaveAttribute('data-selected', 'true');
  });
});
