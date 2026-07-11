import { test, expect } from '@playwright/test';

/**
 * Visual-regression baselines for the XP micro-component gallery (#99).
 *
 * Each shared primitive is screenshot-compared against a committed baseline so
 * a future edit that shifts a colour, border, or metric off the xp.css spec
 * fails CI. The gallery route (`?gallery`) renders the components in isolation
 * for deterministic capture.
 */

const SECTIONS = [
  'gallery-buttons',
  'gallery-inputs',
  'gallery-checkboxes',
  'gallery-select',
  'gallery-slider',
  'gallery-progress',
  'gallery-tooltip',
  'gallery-menubar',
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('./?gallery');
  await page.waitForSelector('[data-testid="gallery"]');
  // Let styled-components inject and fonts settle before capture.
  await page.waitForTimeout(300);
});

test('gallery full page matches baseline', async ({ page }) => {
  await expect(page.locator('[data-testid="gallery"]')).toHaveScreenshot('gallery-full.png');
});

for (const id of SECTIONS) {
  test(`${id} matches baseline`, async ({ page }) => {
    await expect(page.locator(`[data-testid="${id}"]`)).toHaveScreenshot(`${id}.png`);
  });
}
