import { test, expect } from '@playwright/test';

test.describe('Windows XP Simulator - Basic Access Test', () => {
  test('应用能够正常加载', async ({ page }) => {
    // 访问开发服务器（baseURL 在 playwright.config.js 中配置）
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/Windows XP|React XP/i);

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ 页面成功加载');
  });

  test('页面包含基本元素', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查页面是否有内容
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ 页面包含内容');
  });
});
