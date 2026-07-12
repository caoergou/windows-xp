import { test, expect } from '@playwright/test';

test.describe('Branded boot & login (#139)', () => {
  test('branded boot screen shows custom marks and no Microsoft branding', async ({ page }) => {
    // Fresh load (no first_boot_done) → the boot screen renders.
    await page.addInitScript(() => localStorage.clear());
    await page.goto('./?brand=demo');
    const boot = page.locator('[data-testid="boot-screen"]');
    await expect(boot).toBeVisible();
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
    await page.goto('./?brand=demo&lang=en');
    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible();
    await expect(page.locator('[data-testid="login-title"]')).toHaveText('ACME Portal');
    await expect(loginScreen.getByText('Guest')).toBeVisible();
    await expect(page.getByText('Microsoft Windows')).toHaveCount(0);
  });
});
