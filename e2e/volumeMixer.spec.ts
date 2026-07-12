import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Volume / sndvol32 fidelity (#224 part C): double-clicking the tray speaker
 * opens the multi-channel mixer, and the master channel is wired to the shared
 * volume — a change there is reflected by the single-click tray popup.
 */
test.describe('Volume mixer (#224)', () => {
  test('mixer master channel adjustment takes effect (popup reflects it)', async ({ page }) => {
    await login(page, { lang: 'en' });

    // Double-click opens the sndvol32 mixer.
    await page.locator('[data-tray-id="volume"]').dblclick();
    const mixer = page.locator('[data-testid="sndvol-mixer"]');
    await expect(mixer).toBeVisible();

    // Set the master volume to a known value.
    const master = mixer.locator('[data-testid="sndvol-master-volume"]');
    await master.fill('35');
    await expect(master).toHaveValue('35');

    // Open the single-click tray popup — its slider reads the same shared
    // volume, proving the master channel is really wired to soundManager.
    await page.locator('[data-tray-id="volume"]').click();
    const popupSlider = page.locator('[data-testid="volume-popup-slider"]');
    await expect(popupSlider).toBeVisible();
    await expect(popupSlider).toHaveValue('35');
  });
});
