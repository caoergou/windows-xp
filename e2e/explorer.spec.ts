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

/**
 * Explorer Folders tree pane + address-bar history dropdown (#120, EXP-08).
 */
test.describe('Explorer Folders tree + address history', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('Folders toggle shows a tree that navigates', async ({ page }) => {
    await page.locator('button[title="Folders"]').click();
    const tree = page.locator('[data-testid="explorer-folder-tree"]');
    await expect(tree).toBeVisible();

    // The current folder's children appear in the tree; clicking one navigates.
    await expect(page.locator('[data-testid="tree-node-我的图片"]')).toBeVisible();
    await page.locator('[data-testid="tree-node-我的图片"]').click();
    // Navigating expands the branch, revealing the Sample Pictures child node.
    await expect(page.locator('[data-testid="tree-node-Sample Pictures"]')).toBeVisible();

    // Close the pane via its header X.
    await page.locator('[data-testid="explorer-folder-tree"] button[aria-label="Close"]').click();
    await expect(tree).toBeHidden();
  });

  test('address-bar dropdown lists visited paths and navigates', async ({ page }) => {
    // Visit a subfolder so history has more than one entry.
    await page.locator('[data-testid="file-item-我的图片"]').dblclick();
    await page.locator('[data-testid="address-history-toggle"]').click();
    const menu = page.locator('[data-testid="address-history-menu"]');
    await expect(menu).toBeVisible();
    // Pick the earlier "My Documents" entry and confirm we navigate back to it.
    await menu.getByText('My Documents', { exact: true }).click();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });
});
