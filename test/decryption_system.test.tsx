import { test, expect } from '@playwright/test';

test.describe('Decryption System', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for this hook
    test.setTimeout(60000);

    // Open the app
    await page.goto('http://localhost:5173');

    // Wait for boot sequence
    await page.waitForTimeout(5000); // Give it some time to boot

    // Wait for either login screen or desktop
    try {
        await page.waitForSelector('input[type="password"], [data-testid="taskbar"]', { timeout: 10000 });
    } catch (e) {
        console.log("Timeout waiting for initial screen");
    }

    // Check if we are at login screen
    const loginInput = page.locator('input[type="password"]');
    if (await loginInput.count() > 0 && await loginInput.isVisible()) {
        console.log("Login screen detected");
        // Login
        // Password from src/data/user_config.json
        await loginInput.fill('shanyue2015');
        await page.keyboard.press('Enter');

        // Wait for Desktop after login
        await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });
    } else {
        console.log("Already at desktop or login input not found");
    }
  });

  test('Explorer: Encrypted Folder requires password', async ({ page }) => {
    // Open My Computer
    const myComputerIcon = page.locator('[data-testid="desktop-icon-My Computer"]');
    await expect(myComputerIcon).toBeVisible();
    await myComputerIcon.dblclick();

    // Navigate to C: -> Windows (which is locked in filesystem.json)

    await page.waitForSelector('[data-testid="file-item-Local Disk (C:)"]');
    await page.locator('[data-testid="file-item-Local Disk (C:)"]').dblclick();

    await page.waitForSelector('[data-testid="file-item-Windows"]');
    await page.locator('[data-testid="file-item-Windows"]').dblclick();

    // Expect Password Dialog
    const dialog = page.locator('text=此文件夹已加密，请输入密码访问');
    await expect(dialog).toBeVisible();

    // Enter Wrong Password
    // Use a specific selector for the password dialog input to avoid confusion
    const passwordInput = page.locator('input[placeholder="输入密码..."]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('wrongpass');

    await page.click('button:has-text("确定")');

    // Expect Error Message
    await expect(page.locator('text=密码错误，请重试')).toBeVisible();

    // Enter Correct Password
    await passwordInput.fill('admin');
    await page.click('button:has-text("确定")');

    // Expect Dialog to close and folder to open
    await expect(dialog).not.toBeVisible();

    // Since Windows folder is empty in filesystem.json, we might just see 0 objects
    await expect(page.locator('text=0 个对象')).toBeVisible();
  });

  test('QZone: Encrypted Album requires password', async ({ page }) => {
    // Launch QQ
    const qqIcon = page.locator('[data-testid="desktop-icon-QQ"]');
    await expect(qqIcon).toBeVisible();
    await qqIcon.dblclick();

    // Login to QQ (it auto-fills in dev or remember is set, otherwise click login)
    try {
        const loginBtn = page.locator('button:has-text("登录")');
        if (await loginBtn.isVisible({ timeout: 5000 })) {
            await loginBtn.click();
        }
    } catch (e) {
        // Maybe already logged in or transition too fast
    }

    // Wait for user header or something indicating logged in state
    await page.waitForSelector('text=[空间]');

    // Click on [空间] to open QZone
    await page.click('text=[空间]');

    // Wait for QZone window
    await page.waitForSelector('text=QZone');

    // Click on "相册 (Album)" tab
    await page.click('text=相册 (Album)');

    // Find "Secret" album
    const secretAlbum = page.locator('text=Secret');
    await expect(secretAlbum).toBeVisible();

    // Click it
    await secretAlbum.click();

    // Expect Password Dialog (generic one)
    const dialog = page.locator('text=此内容已加密，请输入密码访问');
    await expect(dialog).toBeVisible();

    // Enter Wrong Password
    const passwordInput = page.locator('input[placeholder="输入密码..."]');
    await passwordInput.fill('wrong');
    await page.click('button:has-text("确定")');

    // Expect Error
    await expect(page.locator('text=密码错误，请重试')).toBeVisible();

    // Enter Correct Password (123)
    await passwordInput.fill('123');
    await page.click('button:has-text("确定")');

    // Expect Album content
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('text=← Back')).toBeVisible();
    await expect(page.locator('h2:has-text("Secret")')).toBeVisible();
  });
});
