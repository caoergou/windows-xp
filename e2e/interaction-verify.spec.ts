/**
 * One-off visual verification script for interaction fixes.
 * Run: npx playwright test e2e/interaction-verify.spec.ts --config playwright.config.js
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers/login';

const OUT = path.join('test-results', 'visual-verify');

test.describe('Interaction visual verification', () => {
  test('desktop icons have no shortcut overlay', async ({ page }) => {
    await login(page);
    await page.screenshot({ path: path.join(OUT, '01-desktop-icons.png') });

    const englishIds = ['my-computer', 'Calculator', 'Internet Explorer', 'QQ'];
    for (const id of englishIds) {
      const icon = page.locator(`[data-english-testid="desktop-icon-${id}"]`);
      await expect(icon.locator('.icon-wrapper svg')).toHaveCount(0);
    }
  });

  test('window drag does not show desktop selection box', async ({ page }) => {
    await login(page);

    const calcIcon = page.locator('[data-english-testid="desktop-icon-Calculator"]');
    await calcIcon.dblclick();

    const titleBar = page.locator('.xp-window .title-bar').first();
    await expect(titleBar).toBeVisible();
    await page.screenshot({ path: path.join(OUT, '02-calculator-open.png') });

    const box = await titleBar.boundingBox();
    expect(box).toBeTruthy();

    /* eslint-disable @typescript-eslint/no-non-null-assertion -- box is asserted above */
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 150, box!.y + box!.height / 2 + 100, {
      steps: 10,
    });
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    await page.screenshot({ path: path.join(OUT, '03-during-window-drag.png') });

    const selectionBoxVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(d => {
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
    await login(page);

    // Start on empty desktop background to the right of the icon grid and drag
    // left/down over the icons so the selection box intersects them.
    const startX = 300;
    const startY = 60;
    const endX = 30;
    const endY = 420;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 8 });
    await page.waitForSelector('[data-testid="desktop-selection-box"]', {
      state: 'visible',
      timeout: 2000,
    });
    await page.screenshot({ path: path.join(OUT, '05-during-desktop-select.png') });

    const selectionBoxVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(d => {
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
      return document.querySelectorAll('[data-testid^="desktop-icon-"].desktop-icon-selectable')
        .length > 0
        ? Array.from(document.querySelectorAll('[data-testid^="desktop-icon-"]')).filter(el => {
            const bg = getComputedStyle(el).backgroundColor;
            return bg.includes('49, 106, 197') || bg.includes('316ac5');
          }).length
        : 0;
    });
    expect(selectedCount).toBeGreaterThan(0);
  });
});
