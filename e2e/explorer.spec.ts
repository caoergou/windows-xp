import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Explorer Details view + view switcher (#120 EXP-02 / #211). Opens My Documents,
 * switches from the default Tiles grid to the sortable Details table via the
 * toolbar Views dropdown, and checks the columns, a row, and click-to-sort.
 */

/** Pick a view from the toolbar Views dropdown by its (mnemonic-suffixed) label. */
async function pickView(page: import('@playwright/test').Page, label: string) {
  await page.locator('button[title="View"]').click();
  await page
    .locator('[role="menu"]')
    .last()
    .locator('button', { hasText: new RegExp(`^${label}`) })
    .first()
    .click();
}

test.describe('Explorer Details view', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('toolbar Views dropdown switches to a sortable Details table', async ({ page }) => {
    // Switch to Details via the toolbar Views dropdown.
    await pickView(page, 'Details');

    // Column headers + the file as a row.
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Date Modified')).toBeVisible();
    const row = page.locator('[data-testid="file-row-readme.txt"]');
    await expect(row).toBeVisible();

    // Selecting a row works, and click-to-sort on a header does not throw.
    await row.click();
    await page.getByText('Size', { exact: true }).click();
    await expect(page.locator('[data-testid="file-row-readme.txt"]')).toBeVisible();

    // Switch back to Tiles.
    await pickView(page, 'Tiles');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('all five views render and the choice persists per folder', async ({ page }) => {
    // Each view shows its own item shape; the testids stay stable across views.
    await pickView(page, 'Thumbnails');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
    await pickView(page, 'Icons');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
    await pickView(page, 'List');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();

    // Set List, dive into a subfolder and back — My Documents stays List (#211).
    await page.locator('[data-item-key="我的图片"]').dblclick();
    await expect(page.locator('[data-testid="file-item-Sample Pictures"]')).toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
    // The List row is compact (~17px) — Tiles would be ~54px.
    const box = await page.locator('[data-item-key="readme.txt"]').boundingBox();
    expect(box?.height).toBeLessThan(30);
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
