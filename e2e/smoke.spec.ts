import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Windows XP Simulator - Basic Access Test', () => {
  test('应用能够正常加载', async ({ page }) => {
    // 访问开发服务器（baseURL 在 playwright.config.js 中配置）
    await page.goto('./');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/Windows XP|React XP/i);

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ 页面成功加载');
  });

  test('页面包含基本元素', async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    // 检查页面是否有内容
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ 页面包含内容');
  });

  // FIXME(#123): the en culture package only renders one desktop shortcut
  // (Windows Media Player). Norton/Winamp/uTorrent/Office/iTunes live in the
  // suppression list + i18n strings but are never rendered, so this assertion
  // can never pass. Re-enable once en-culture parity lands (#123).
  test.fixme('英文语言下显示西方文化桌面图标', async ({ page }) => {
    await login(page, { lang: 'en' });

    // Western 2000s cultural shortcuts expected in English locale
    const expectedIcons = ['Norton AntiVirus', 'Winamp', 'uTorrent', 'Microsoft Office', 'iTunes'];
    for (const name of expectedIcons) {
      await expect(page.locator(`[data-english-testid="desktop-icon-${name}"]`)).toBeVisible();
    }

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ English locale shows Western cultural icons');
  });

  test('运行对话框可以启动计算器', async ({ page }) => {
    await login(page, { lang: 'en' });

    // Open Start menu and click Run
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="start-menu"]').getByText('Run...').click();

    // Type calc and submit
    await page.locator('[data-testid="run-dialog-input"], input[placeholder*="program"]').fill('calc');
    await page.getByRole('button', { name: 'OK' }).click();

    // Calculator window should appear
    await expect(page.locator('[data-testid="window-title"]').filter({ hasText: 'Calculator' })).toBeVisible();

    // eslint-disable-next-line no-console -- Playwright test logging
    console.log('✓ Run Dialog launches Calculator');
  });
});
