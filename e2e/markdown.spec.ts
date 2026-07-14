import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

const ABOUT = encodeURIComponent('我的文档/about.md');

test.describe('MarkdownViewer (#137)', () => {
  test('a .md file opens in MarkdownViewer with rendered markup', async ({ page }) => {
    await login(page, { lang: 'en', query: `open=${ABOUT}` });

    const viewer = page.locator('[data-testid="markdown-viewer"]');
    await expect(viewer).toBeVisible();
    // Markdown is rendered, not shown as raw text.
    await expect(
      viewer.getByRole('heading', { level: 1, name: 'About This Desktop' })
    ).toBeVisible();
    await expect(viewer.locator('strong', { hasText: 'Windows XP' }).first()).toBeVisible();
    await expect(viewer.locator('code', { hasText: 'ref' }).first()).toBeVisible();
  });

  test('double-clicking a .md file in Explorer opens MarkdownViewer', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await page.locator('[data-testid="file-item-about.md"]').dblclick();
    await expect(page.locator('[data-testid="markdown-viewer"]')).toBeVisible();
  });
});
