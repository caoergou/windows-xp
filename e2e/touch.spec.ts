import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Touch usability layer (#125). On an emulated touch device the existing mouse
 * metaphor must be drivable by a finger: tap = select, double-tap = open,
 * long-press = context menu, and a window can be dragged by its title bar.
 *
 * We drive real `TouchEvent`s (with `Touch` points) via the page so timing is
 * deterministic — the app's own long-press timer decides when the menu fires.
 */

test.use({ hasTouch: true, viewport: { width: 420, height: 780 } });

async function dispatchTouch(
  page: Page,
  selector: string,
  type: 'touchstart' | 'touchmove' | 'touchend',
  offset = { dx: 0, dy: 0 }
) {
  await page.evaluate(
    ({ selector, type, offset }) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) throw new Error(`no element for ${selector}`);
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2 + offset.dx;
      const y = r.top + r.height / 2 + offset.dy;
      const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
      const isEnd = type === 'touchend';
      el.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches: isEnd ? [] : [touch],
          targetTouches: isEnd ? [] : [touch],
          changedTouches: [touch],
        })
      );
    },
    { selector, type, offset }
  );
}

async function tap(page: Page, selector: string) {
  await dispatchTouch(page, selector, 'touchstart');
  await dispatchTouch(page, selector, 'touchend');
}

async function doubleTap(page: Page, selector: string) {
  await tap(page, selector);
  await page.waitForTimeout(60);
  await tap(page, selector);
}

async function longPress(page: Page, selector: string) {
  await dispatchTouch(page, selector, 'touchstart');
  await page.waitForTimeout(650); // exceed the 500ms long-press threshold
  await dispatchTouch(page, selector, 'touchend');
}

test.describe('Touch support (#125)', () => {
  test('double-tap a desktop icon opens the app', async ({ page }) => {
    await login(page, { lang: 'en' });
    const icon = '[data-english-testid="desktop-icon-my-documents"]';
    await expect(page.locator(icon)).toBeVisible();

    await doubleTap(page, icon);

    // My Documents opens an Explorer window with its contents.
    await expect(page.locator('.xp-window')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible({ timeout: 8000 });
  });

  test('long-press a desktop icon shows the context menu', async ({ page }) => {
    await login(page, { lang: 'en' });
    const icon = '[data-english-testid="desktop-icon-my-computer"]';
    await expect(page.locator(icon)).toBeVisible();

    await longPress(page, icon);

    await expect(page.locator('[data-testid="context-menu"]')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('[data-testid="context-menu"]').getByText('Open')).toBeVisible();
  });

  test('long-press empty desktop shows the desktop context menu', async ({ page }) => {
    await login(page, { lang: 'en' });
    // The desktop plane itself (not an icon).
    await longPress(page, '[data-testid="desktop"]');
    await expect(page.locator('[data-testid="context-menu"]')).toBeVisible({ timeout: 4000 });
    // Desktop menu has a "Refresh" entry that the icon menu does not.
    await expect(page.locator('[data-testid="context-menu"]').getByText('Refresh')).toBeVisible();
  });

  test('a window can be dragged by its title bar with touch', async ({ page }) => {
    await login(page, { lang: 'en' });
    // Open a window first.
    await doubleTap(page, '[data-english-testid="desktop-icon-my-documents"]');
    const win = page.locator('.xp-window').first();
    await expect(win).toBeVisible({ timeout: 8000 });

    const before = await win.boundingBox();
    if (!before) throw new Error('window not measurable');

    // Touch-drag the title bar by (120, 90).
    await dispatchTouch(page, '.xp-window .title-bar', 'touchstart');
    for (let i = 1; i <= 6; i++) {
      await dispatchTouch(page, '.xp-window .title-bar', 'touchmove', { dx: (120 / 6) * i, dy: (90 / 6) * i });
    }
    await dispatchTouch(page, '.xp-window .title-bar', 'touchend', { dx: 120, dy: 90 });

    const after = await win.boundingBox();
    if (!after) throw new Error('window vanished after drag');
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(40);
    expect(Math.abs(after.y - before.y)).toBeGreaterThan(30);
  });

  test('single tap selects an icon without opening it', async ({ page }) => {
    await login(page, { lang: 'en' });
    const icon = '[data-english-testid="desktop-icon-my-computer"]';
    await tap(page, icon);
    // Selection highlights the icon; no window opens from a single tap.
    await expect(page.locator('.xp-window')).toHaveCount(0);
  });
});

/**
 * Small-screen scale-to-fit strategy (#215). At an iPhone-SE portrait viewport
 * the whole desktop scales to fit (letterboxed) instead of overflowing behind a
 * warning — a designed path, still fully drivable by touch. See docs/VIEWPORT.md.
 */
test.describe('Small-screen viewport (#215)', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

  test('iPhone SE scales the whole desktop to fit and shows the rotate nudge', async ({ page }) => {
    await login(page, { lang: 'en' });

    // The stage is scaled: .windows-xp-root carries a sub-1 scale transform, so
    // its rendered (visual) width is the viewport width, not the 1024 baseline.
    const scale = await page.evaluate(() => {
      const root = document.querySelector('.windows-xp-root') as HTMLElement | null;
      if (!root) return null;
      return new DOMMatrix(getComputedStyle(root).transform).a; // scale-x
    });
    expect(scale).not.toBeNull();
    expect(scale as number).toBeGreaterThan(0.2);
    expect(scale as number).toBeLessThan(0.9);

    // Portrait → the "rotate for a larger view" nudge (landscape scales larger).
    await expect(page.locator('[data-testid="rotate-hint"]')).toBeVisible();

    // The desktop is still drivable: double-tapping an icon opens its app.
    await doubleTap(page, '[data-english-testid="desktop-icon-Calculator"]');
    await expect(
      page.locator('[data-testid="window-title"]').filter({ hasText: 'Calculator' })
    ).toBeVisible({ timeout: 8000 });
  });

  test('desktop-width viewport is not scaled (native path)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, { lang: 'en' });
    const transform = await page.evaluate(() => {
      const root = document.querySelector('.windows-xp-root') as HTMLElement | null;
      return root ? getComputedStyle(root).transform : null;
    });
    expect(transform).toBe('none');
    await expect(page.locator('[data-testid="rotate-hint"]')).toHaveCount(0);
  });
});
