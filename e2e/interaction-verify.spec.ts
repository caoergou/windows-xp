/**
 * One-off visual verification script for interaction fixes.
 * Run: npx playwright test e2e/interaction-verify.spec.ts --config playwright.config.js
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:5174/windows-xp/';
const OUT = path.join('test-results', 'visual-verify');

async function skipToDesktop(page: import('@playwright/test').Page) {
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('xp_first_boot_done', 'true');
    localStorage.setItem('xp_logged_in', 'true');
    localStorage.setItem('xp_power_state', 'running');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');

  const mobileBtn = page.getByRole('button', { name: 'Continue to Desktop' });
  if (await mobileBtn.isVisible().catch(() => false)) {
    await mobileBtn.click();
  }

  // Dismiss screensaver (logged-in users land on screensaver first)
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await page.waitForTimeout(700);

  await page.waitForSelector('[data-testid="desktop-icon-我的电脑"]', { timeout: 8000 });
}

test.describe('Interaction visual verification', () => {
  test('desktop icons have no shortcut overlay', async ({ page }) => {
    await skipToDesktop(page);
    await page.screenshot({ path: path.join(OUT, '01-desktop-icons.png') });

    const iconKeys = ['我的电脑', 'Calculator', 'Internet Explorer', 'QQ'];
    for (const key of iconKeys) {
      const icon = page.locator(`[data-testid="desktop-icon-${key}"]`);
      await expect(icon.locator('.icon-wrapper svg')).toHaveCount(0);
    }
  });

  test('window drag does not show desktop selection box', async ({ page }) => {
    await skipToDesktop(page);

    await page.locator('[data-testid="desktop-icon-Calculator"]').dblclick();
    await page.waitForSelector('.title-bar', { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, '02-calculator-open.png') });

    const titleBar = page.locator('.xp-window .title-bar').first();
    const box = await titleBar.boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 150, box!.y + box!.height / 2 + 100, { steps: 10 });
    await page.screenshot({ path: path.join(OUT, '03-during-window-drag.png') });

    const selectionBoxVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some((d) => {
        const s = getComputedStyle(d);
        return (
          s.position === 'absolute' &&
          s.borderStyle.includes('dotted') &&
          s.pointerEvents === 'none' &&
          s.backgroundColor.includes('197') &&
          parseFloat(s.width) > 5
        );
      });
    });
    expect(selectionBoxVisible).toBe(false);

    await page.mouse.up();
    await page.screenshot({ path: path.join(OUT, '04-after-window-drag.png') });
  });

  test('desktop box selection still works on background', async ({ page }) => {
    await skipToDesktop(page);

    const viewport = page.viewportSize()!;
    const startX = 30;
    const startY = 60;
    const endX = 220;
    const endY = 420;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 8 });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(OUT, '05-during-desktop-select.png') });

    const selectionBoxVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some((d) => {
        const s = getComputedStyle(d);
        return (
          s.position === 'absolute' &&
          s.borderStyle.includes('dotted') &&
          s.pointerEvents === 'none' &&
          parseFloat(s.width) > 5
        );
      });
    });
    expect(selectionBoxVisible).toBe(true);

    await page.mouse.up();

    const selectedCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid^="desktop-icon-"].desktop-icon-selectable').length > 0
        ? Array.from(document.querySelectorAll('[data-testid^="desktop-icon-"]')).filter(el => {
            const bg = getComputedStyle(el).backgroundColor;
            return bg.includes('49, 106, 197') || bg.includes('316ac5');
          }).length
        : 0;
    });
    expect(selectedCount).toBeGreaterThan(0);
  });
});
