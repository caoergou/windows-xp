import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

// '我的文档' (My Documents) holds readme.txt in the built-in filesystem, so a
// deep link into that folder proves the addressed Explorer window opened.
const MY_DOCS = encodeURIComponent('我的文档');

test.describe('Deep linking (#136)', () => {
  test('?open= opens the addressed window on load', async ({ page }) => {
    await login(page, { lang: 'en', query: `open=${MY_DOCS}` });
    // The Explorer window for 我的文档 opened, showing its contents.
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('invalid ?open= path fails silently to the plain desktop', async ({ page }) => {
    await login(page, { lang: 'en', query: 'open=does-not-exist.txt' });
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible();
    // No window opened; the file-item that a real open would show is absent.
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toHaveCount(0);
  });

  test('with historyIntegration on, browser Back closes the last-opened window', async ({
    page,
  }) => {
    await login(page, { lang: 'en', query: `open=${MY_DOCS}&history=1` });
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();

    await page.goBack();

    // Same-document history pop closes the deep-linked window.
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible();
  });
});
