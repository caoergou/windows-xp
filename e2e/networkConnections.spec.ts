import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Network Connections fidelity (#224 part B): the connection detail is the real
 * "Local Area Connection Status" dialog — General/Support tabs, live counters,
 * and a working Repair flow.
 */
test.describe('Network Connections (#224)', () => {
  test('status dialog: live duration, Support tab IP, and Repair', async ({ page }) => {
    await login(page, { lang: 'en' });

    // Open Network Connections from the tray, then open the connection status.
    await page.locator('[data-tray-id="network"]').click();
    await page.locator('[data-testid^="netconn-item-"]').first().dblclick();

    const dialog = page.locator('[data-testid="netconn-status-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-testid="netconn-tab-general"]')).toBeVisible();

    // Duration is live — it must advance while the dialog is open.
    const duration = dialog.locator('[data-testid="netconn-duration"]');
    const first = await duration.textContent();
    await expect(async () => {
      expect(await duration.textContent()).not.toBe(first);
    }).toPass({ timeout: 4000 });

    // Support tab shows the DHCP address set, and Repair reports success.
    await dialog.locator('[data-testid="netconn-tab-support"]').click();
    await expect(dialog.getByText('192.168.1.101')).toBeVisible();
    await dialog.locator('[data-testid="netconn-repair"]').click();
    await expect(dialog.getByText(/repaired/i)).toBeVisible({ timeout: 5000 });
  });
});
