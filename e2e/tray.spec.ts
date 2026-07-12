import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * System-tray volume affordances (#223):
 *  - single-click the speaker opens the volume popup, and interacting inside it
 *    (dragging the slider) must NOT slam it shut — only an outside click closes;
 *  - double-clicking the speaker opens the full VolumeControl (sndvol32) window.
 */
test.describe('Tray volume (#223)', () => {
  test('volume popup stays open while adjusting the slider; outside click closes it', async ({
    page,
  }) => {
    await login(page, { lang: 'en' });

    const speaker = page.locator('[data-tray-id="volume"]');
    await speaker.click();

    const popup = page.locator('[data-testid="volume-popup"]');
    await expect(popup).toBeVisible();

    // Interacting inside the popup used to bubble to the tray toggle and close
    // it on release. The slider must move the value AND leave the popup open.
    const slider = popup.locator('input[type="range"]');
    await slider.fill('40');
    await expect(popup).toBeVisible();
    await expect(popup.getByText('40%')).toBeVisible();

    // Only a genuine click outside dismisses it.
    await page.mouse.click(500, 300);
    await expect(popup).toBeHidden();
  });

  test('double-clicking the speaker opens the VolumeControl window', async ({ page }) => {
    await login(page, { lang: 'en' });

    await page.locator('[data-tray-id="volume"]').dblclick();

    await expect(
      page.locator('[data-testid="window-title"]').filter({ hasText: 'Volume Control' })
    ).toBeVisible();
  });
});
