import { test, expect } from '@playwright/test';

test.describe('Windows XP Simulator - Basic Access Test', () => {
  test('应用能够正常加载', async ({ page }) => {
    // 访问开发服务器
    await page.goto('http://localhost:5174/');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/Windows XP|React XP/i);

    // 截图保存
    await page.screenshot({ path: 'test-results/homepage.png' });

    console.log('✓ 页面成功加载');
  });

  test('页面包含基本元素', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    // 检查页面是否有内容
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);

    console.log('✓ 页面包含内容');
  });
});
