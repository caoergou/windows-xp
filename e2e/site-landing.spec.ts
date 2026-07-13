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

  test('scrolls past the hero desktop after interacting with it', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('[data-testid="greeter-notepad"]')).toBeVisible({ timeout: 8000 });

    const scrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 100
    );
    expect(scrollable).toBe(true);

    // Focus lands in the engine after a click — scrolling must still work.
    await page.locator('.xp-window').first().click();
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    const afterScroll = await page.evaluate(() => window.scrollY);
    expect(afterScroll).toBeGreaterThan(beforeScroll);
    await expect(page.locator('#engine')).toBeInViewport();

    await page.keyboard.press('End');
    await expect(page.locator('#demos')).toBeInViewport();
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

  test('glass box streams real onEvent traffic when driven (#160 Phase 2)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('./');
    // Progressively scroll so the sentinel crosses the viewport and the lazy
    // glass-box section (engine + terminal) mounts via its IntersectionObserver.
    for (let y = 0; y <= 4000; y += 400) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.locator('#glassbox').scrollIntoViewIfNeeded();
    const ticker = page.locator('[data-testid="glass-ticker"]');
    await expect(ticker).toBeVisible({ timeout: 15000 });
    // Its embedded desktop boots and emits at least session:boot-complete.
    await expect(ticker).toContainText('session:boot-complete', { timeout: 20000 });

    // "Haunt it" drives the desktop over the ref handle → app:launch events.
    const haunt = page.locator('[data-testid="glass-haunt"]');
    await haunt.click();
    await expect(ticker).toContainText('app:launch', { timeout: 10000 });
    // The tour disables the proof buttons while it runs; wait for it to finish.
    await expect(haunt).toBeEnabled({ timeout: 15000 });
    // It ends on a modal alert ("Haunted") — dismiss it so it stops intercepting.
    const okBtn = page.locator('.xp-alert button', { hasText: /OK|确定/ }).first();
    if (await okBtn.count()) await okBtn.click();

    // "Break it" trips a real lock → a genuine file:unlock event on the feed.
    await page.locator('[data-testid="glass-break"]').click();
    await expect(ticker).toContainText('file:unlock', { timeout: 12000 });
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
