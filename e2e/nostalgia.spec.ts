import { test, expect, Page } from '@playwright/test';

/**
 * Dogfood end-to-end tests for the Windows XP nostalgia simulator.
 *
 * These tests exercise the user-facing features that make the project
 * interesting as a demo: login, desktop icons, Start menu, IE portal,
 * QQ login easter egg, and the nostalgic Chinese apps.
 *
 * The tests run in Chinese locale (?lang=zh) because the most distinctive
 * 2000s cultural apps (QQ, 360, 迅雷, 暴风影音, 酷狗音乐) are only wired
 * up as real apps in the Chinese cultural package.
 */

const DEFAULT_PASSWORD = 'forthe2000s';

async function login(page: Page) {
  await page.goto('./?lang=zh');
  await page.waitForLoadState('networkidle');

  // Robustly detect login screen vs. already-logged-in desktop.
  const passwordInput = page.locator('input[type="password"]');
  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(DEFAULT_PASSWORD);
    await page.keyboard.press('Enter');
  } catch {
    // Already at desktop, no password field present.
  }

  await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });
}

async function openStartMenu(page: Page) {
  const startBtn = page.locator('[data-testid="start-button"]');
  await startBtn.click();
  await expect(page.locator('[data-testid="start-menu"]')).toBeVisible();
}

async function closeAllWindows(page: Page) {
  // Close any open window via the close button in title bar
  const closeButtons = page.locator('[data-testid="window-close"], .window-close, [title="关闭"], [title="Close"]');
  let attempts = 0;
  while ((await closeButtons.count()) > 0 && attempts < 10) {
    await closeButtons.first().click();
    await page.waitForTimeout(100);
    attempts += 1;
  }
}

test.describe('Windows XP Nostalgia - Dogfood Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await closeAllWindows(page);
  });

  test('desktop loads with essential icons', async ({ page }) => {
    await expect(page.locator('[data-testid="desktop-icon-Internet Explorer"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-icon-Notepad"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-icon-QQ"]')).toBeVisible();

    // Chinese cultural shortcuts
    await expect(page.locator('[data-testid="desktop-icon-360安全卫士"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-icon-暴风影音"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-icon-迅雷"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-icon-酷狗音乐"]')).toBeVisible();
  });

  test('Start menu contains culture-aware apps', async ({ page }) => {
    await openStartMenu(page);

    const startMenu = page.locator('[data-testid="start-menu"]');

    // Universal apps
    await expect(startMenu.locator('text=Internet Explorer').first()).toBeVisible();
    await expect(startMenu.locator('text=QQ').first()).toBeVisible();

    // Chinese cultural apps
    await expect(startMenu.locator('text=暴风影音')).toBeVisible();
    await expect(startMenu.locator('text=迅雷')).toBeVisible();
    await expect(startMenu.locator('text=360 安全卫士')).toBeVisible();
    await expect(startMenu.locator('text=酷狗音乐')).toBeVisible();
  });

  test('IE opens archive hao123 portal by default', async ({ page }) => {
    const ieIcon = page.locator('[data-testid="desktop-icon-Internet Explorer"]');
    await expect(ieIcon).toBeVisible();
    await ieIcon.dblclick();

    // Wait for the IE window title bar
    await expect(page.locator('text=Internet Explorer').nth(1)).toBeVisible();

    // The address bar should contain the wayback hao123 URL
    const addressBar = page.locator('input[value*="hao123"], input[value*="web.archive.org"]').first();
    await expect(addressBar).toBeVisible({ timeout: 10000 });
  });

  test('IE favorites sidebar shows 2000s memories', async ({ page }) => {
    const ieIcon = page.locator('[data-testid="desktop-icon-Internet Explorer"]');
    await ieIcon.dblclick();

    // Open favorites via the toolbar button (text is hardcoded Chinese in current UI)
    const favoritesBtn = page.locator('button').filter({ hasText: '收藏夹' }).first();
    await favoritesBtn.click();

    await expect(page.locator('text=百度').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=天涯社区').first()).toBeVisible();
  });

  test('QQ login shows captcha and version-too-old easter egg', async ({ page }) => {
    const qqIcon = page.locator('[data-testid="desktop-icon-QQ"]');
    await qqIcon.dblclick();

    // QQ login window appears
    await expect(page.locator('text=QQ 2007')).toBeVisible();

    // Fill account / password / captcha
    await page.locator('input[placeholder*="QQ号"]').fill('123456');
    await page.locator('input[placeholder*="密码"]').fill('fakepassword');

    // Captcha image is shown next to the input
    const captchaText = await page.locator('div').filter({ hasText: /^[A-Z0-9]{4}$/ }).first().textContent();
    const captcha = captchaText?.trim() || 'ABCD';
    await page.locator('input[placeholder*="验证码"]').fill(captcha);

    // Click login
    await page.locator('button:has-text("登  录")').click();

    // Loading state
    await expect(page.locator('text=正在登录')).toBeVisible({ timeout: 5000 });

    // Eventually the version-too-old alert appears
    await expect(page.locator('text=版本过低')).toBeVisible({ timeout: 10000 });
  });

  test('360 Safe Guard can perform a scan', async ({ page }) => {
    await openStartMenu(page);

    const safeGuardItem = page.locator('[data-testid="start-menu-360safe"]');
    await expect(safeGuardItem).toBeVisible();
    await safeGuardItem.click();

    await expect(page.locator('[data-testid="window-title"]:has-text("360 安全卫士")')).toBeVisible();

    // Click scan button
    const scanBtn = page.locator('[data-testid="safe-guard-scan-button"]');
    await scanBtn.click();

    // Scanning overlay
    await expect(page.locator('text=/正在体检/').first()).toBeVisible({ timeout: 5000 });

    // Result appears
    await expect(page.locator('text=/您的电脑很安全/').first()).toBeVisible({ timeout: 15000 });
  });

  test('Thunder download manager shows default tasks', async ({ page }) => {
    await openStartMenu(page);

    const thunderItem = page.locator('[data-testid="start-menu-thunder"]');
    await expect(thunderItem).toBeVisible();
    await thunderItem.click();

    await expect(page.locator('[data-testid="window-title"]:has-text("迅雷")')).toBeVisible();

    // Default download tasks
    await expect(page.locator('text=QQ2007').first()).toBeVisible();
    await expect(page.locator('text=暴风影音').first()).toBeVisible();
  });

  test('Baofeng Player opens with playlist', async ({ page }) => {
    const baofengIcon = page.locator('[data-testid="desktop-icon-暴风影音"]');
    await expect(baofengIcon).toBeVisible();
    await baofengIcon.dblclick();

    await expect(page.locator('text=暴风影音').first()).toBeVisible();
    await expect(page.locator('text=播放列表').first()).toBeVisible();
  });

  test('Kugou Music opens and can play songs', async ({ page }) => {
    const kugouIcon = page.locator('[data-testid="desktop-icon-酷狗音乐"]');
    await expect(kugouIcon).toBeVisible();
    await kugouIcon.dblclick();

    await expect(page.locator('text=酷狗音乐').first()).toBeVisible();

    // Play button (triangle icon)
    const playBtn = page.locator('button').filter({ hasText: '▶' }).first();
    await playBtn.click();

    // Status bar shows "正在播放"
    await expect(page.locator('text=正在播放').first()).toBeVisible({ timeout: 5000 });
  });
});
