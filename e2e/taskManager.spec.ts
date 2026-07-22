import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Task Manager fidelity (#224 part A): the Processes and Performance tabs are
 * real and switchable (they used to be dead labels), and the status bar renders.
 */
test.describe('Task Manager (#224)', () => {
  test('tabs switch: Applications → Processes (system procs) → Performance', async ({ page }) => {
    await login(page, { lang: 'en' });

    // Open Task Manager from the taskbar context menu.
    await page.locator('[data-testid="taskbar"]').click({ button: 'right' });
    await page.getByText('Task Manager', { exact: true }).click();

    await expect(
      page.locator('[data-testid="window-title"]').filter({ hasText: 'Task Manager' })
    ).toBeVisible();

    // Status bar (the most recognizable taskmgr part) is present.
    await expect(page.locator('[data-testid="taskmgr-statusbar"]')).toBeVisible();

    // Processes tab is clickable and lists resident system processes.
    await page.locator('[data-testid="taskmgr-tab-processes"]').click();
    const procTable = page.locator('[data-testid="taskmgr-processes-table"]');
    await expect(procTable).toBeVisible();
    await expect(procTable.getByText('svchost.exe').first()).toBeVisible();
    await expect(procTable.getByText('System Idle Process')).toBeVisible();

    // Performance tab renders the oscilloscope panel.
    await page.locator('[data-testid="taskmgr-tab-performance"]').click();
    const performance = page.locator('[data-testid="taskmgr-performance"]');
    await expect(performance).toBeVisible();

    // The default window is tall enough to show the complete Performance page.
    // A scrollbar may still appear after the user deliberately resizes it smaller.
    const dimensions = await performance.evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(dimensions.scrollHeight).toBe(dimensions.clientHeight);
  });
});
