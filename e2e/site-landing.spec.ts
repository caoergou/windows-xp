import { test, expect } from '@playwright/test';

/**
 * Landing page acceptance (#160, Phase 1). The page IS the product: a real,
 * self-driving desktop the visitor can drag within seconds; the demo doors are
 * real links; legacy query routes redirect; reduced-motion keeps content whole.
 */

test.describe('Landing page (#160)', () => {
  test('boots a real, draggable desktop within a few seconds', async ({ page }) => {
    await page.goto('./');
    // The engine lazy-loads and drives itself: a self-typing Notepad appears.
    await expect(page.locator('[data-testid="greeter-notepad"]')).toBeVisible({ timeout: 8000 });

    // It's a real window, not a screenshot — drag it and assert it moved.
    const win = page.locator('.xp-window').first();
    const before = await win.boundingBox();
    const title = page.locator('.title-bar').first();
    const tb = await title.boundingBox();
    if (!before || !tb) throw new Error('hero window not measurable');
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
    await page.mouse.down();
    await page.mouse.move(tb.x + tb.width / 2 + 100, tb.y + tb.height / 2 + 60, { steps: 10 });
    await page.mouse.up();
    const after = await win.boundingBox();
    if (!after) throw new Error('hero window vanished after drag');
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(25);
  });

  test('legacy query routes redirect to the new paths', async ({ page }) => {
    await page.goto('./?gallery');
    await expect(page).toHaveURL(/\/gallery\/$/);
    await expect(page.locator('[data-testid="gallery"]')).toBeVisible();

    await page.goto('./?demo=1&lang=zh');
    await expect(page).toHaveURL(/\/demo\/zh\/$/);

    await page.goto('./?demo=1&lang=en');
    await expect(page).toHaveURL(/\/demo\/en\/$/);
  });

  test('demo doors are real links to the two desktops', async ({ page }) => {
    await page.goto('./');
    const zhDoor = page.locator('a[href="demo/zh/"]').first();
    const enDoor = page.locator('a[href="demo/en/"]').first();
    await expect(zhDoor).toBeVisible();
    await expect(enDoor).toBeVisible();
    await enDoor.click();
    await expect(page).toHaveURL(/\/demo\/en\/$/);
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible({ timeout: 20000 });
  });

  test('reduced motion keeps the content complete (SEO/a11y floor)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /Three Desktops, One Engine/ })).toBeVisible();
    await expect(page.locator('a[href="demo/zh/"]').first()).toBeVisible();
    await expect(page.locator('a[href="demo/en/"]').first()).toBeVisible();
    // The desktop still comes up (content is complete, just without self-typing motion).
    await expect(page.locator('[data-testid="greeter-notepad"]')).toBeVisible({ timeout: 8000 });
  });
});
