import { test, expect } from '@playwright/test';

test.describe('Branded boot & login (#139)', () => {
  test('branded boot screen shows custom marks and no Microsoft branding', async ({ page }) => {
    // Fresh load (no first_boot_done) → the boot screen renders. Since #160 the
    // desktop demo lives at /demo/<lang>/; `?brand=demo` skins boot + login.
    await page.addInitScript(() => localStorage.clear());
    await page.goto('demo/en/?brand=demo');
    const boot = page.locator('[data-testid="boot-screen"]');
    await expect(boot).toBeVisible({ timeout: 40000 });
    await expect(boot.getByText('ACME 2000')).toBeVisible();
    await expect(boot.getByAltText('Microsoft Windows XP')).toHaveCount(0);
    await expect(boot.getByAltText('Microsoft')).toHaveCount(0);
  });

  test('branded login replaces the wordmark and user name', async ({ page }) => {
    // Skip boot but stay on the login screen (no autoLogin in the demo).
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
    });
    await page.goto('demo/en/?brand=demo');
    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible({ timeout: 40000 });
    await expect(page.locator('[data-testid="login-title"]')).toHaveText('ACME Portal');
    await expect(loginScreen.getByText('Guest')).toBeVisible();
    await expect(page.getByText('Microsoft Windows')).toHaveCount(0);
  });
});

test.describe('Demo session and story links (#216)', () => {
  test('session=full keeps the default XP login screen without custom branding', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
    });
    await page.goto('demo/en/?session=full&persistence=none');

    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible({ timeout: 40000 });
    await expect(page.getByText('Microsoft Windows')).toBeVisible();
    await expect(page.locator('[data-testid="login-title"]')).toHaveCount(0);
  });

  test('scenario=prologue mounts the declarative story', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('demo/zh/?scenario=prologue&persistence=none');

    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('还记得吗？')).toBeVisible();
  });
});
