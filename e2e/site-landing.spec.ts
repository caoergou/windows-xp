import { test, expect } from '@playwright/test';

/**
 * Landing page acceptance (#250 — "one monitor, one room"). The page IS the
 * product: a real, self-driving desktop the visitor can drag within seconds;
 * the zh/en worlds are desktop shortcuts inside the screen; navigation is one
 * quiet line of real links; the glass box lives on at /lab/.
 */

test.describe('Landing page (#250)', () => {
  test('boots a real, draggable desktop within a few seconds', async ({ page }) => {
    await page.goto('./');
    // The engine lazy-loads and drives itself: the REAL Notepad opens in
    // auto-type mode over the public handle (#250 — no mock greeter).
    const editor = page.locator('[data-xp-anchor="notepad.textarea"]');
    await expect(editor).toBeVisible({ timeout: 8000 });
    await expect(editor).toHaveValue(/This is not a video|这不是一段视频/, { timeout: 15000 });

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

  test('desktop shortcuts inside the hero navigate to the demos', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('[data-xp-anchor="notepad.textarea"]')).toBeVisible({ timeout: 8000 });

    const shortcut = page.locator('[data-english-testid="desktop-icon-English Desktop"]');
    await expect(shortcut).toBeVisible();
    await shortcut.dblclick();
    await expect(page).toHaveURL(/\/demo\/en\/$/);
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible({ timeout: 20000 });
  });

  test('the quiet line links every destination and the demos are real links', async ({ page }) => {
    await page.goto('./');
    const nav = page.locator('nav[aria-label="site"]');
    await expect(nav.locator('a[href="demo/zh/"]')).toBeVisible();
    await expect(nav.locator('a[href="demo/en/"]')).toBeVisible();
    await expect(nav.locator('a[href="docs/"]')).toBeVisible();
    await expect(nav.locator('a[href="gallery/"]')).toBeVisible();
    await expect(nav.locator('a[href="https://github.com/caoergou/windows-xp"]')).toBeVisible();

    await nav.locator('a[href="demo/zh/"]').click();
    await expect(page).toHaveURL(/\/demo\/zh\/$/);
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible({ timeout: 20000 });
  });

  test('install pill shows the real version and copies the command', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./');
    const pill = page.locator('[data-testid="install-pill"]');
    await expect(pill).toBeVisible();
    await expect(pill).toContainText('npm install @caoergou/windows-xp');
    await expect(pill).toContainText(/v\d+\.\d+\.\d+/);
    await pill.click();
    await expect(pill).toContainText(/Copied|已复制/);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe('npm install @caoergou/windows-xp');
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

  test('reduced motion keeps the content complete (SEO/a11y floor)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /millennium/i })).toBeVisible();
    await expect(page.locator('a[href="demo/zh/"]').first()).toBeVisible();
    await expect(page.locator('a[href="demo/en/"]').first()).toBeVisible();
    // The desktop still comes up, with the greeter fully typed instantly.
    const editor = page.locator('[data-xp-anchor="notepad.textarea"]');
    await expect(editor).toBeVisible({ timeout: 8000 });
    await expect(editor).toHaveValue(/XPHandle/, { timeout: 4000 });
  });

  test('small screens get the poster fallback, not a shrunken engine', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    // No engine mounts at this width; the screen is a poster linking to a demo.
    const poster = page.locator('a[aria-label]').filter({ hasText: /→/ }).first();
    await expect(poster).toBeVisible();
    await expect(poster).toHaveAttribute('href', /demo\/(zh|en)\/$/);
    await page.waitForTimeout(2500); // past the auto power-on window
    await expect(page.locator('[data-xp-anchor="notepad.textarea"]')).toHaveCount(0);
  });
});

test.describe('Event lab at /lab/ (glass box, moved off the landing by #250)', () => {
  test('streams real onEvent traffic when driven', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('./lab/');
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
});
