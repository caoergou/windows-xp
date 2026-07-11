import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/login';

/**
 * QQ Messenger MVP (#119): unified QQ app — login → buddy-list panel → chat,
 * with a scripted buddy that comes online, sends messages with a typing effect,
 * and replies to the player. Content flows from the zh culture profile.
 */

async function openQQPanel(page: Page) {
  await page.locator('[data-english-testid="desktop-icon-QQ"]').dblclick();
  await expect(page.locator('[data-testid="qq-login"]')).toBeVisible();
  await page.locator('[data-testid="qq-login-button"]').click();
  await expect(page.locator('[data-testid="qq-panel"]')).toBeVisible({ timeout: 8000 });
}

test.describe('QQ Messenger (#119)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(45000);
    await login(page, { lang: 'zh' });
  });

  test('login morphs one window into the buddy-list panel', async ({ page }) => {
    await openQQPanel(page);
    // My banner + a grouped buddy from the culture profile.
    await expect(page.locator('[data-testid="qq-me-nick"]')).toContainText('往事随风');
    await expect(page.locator('[data-testid="qq-group-friends"]')).toBeVisible();
    await expect(page.locator('[data-testid="qq-buddy-crystal"]')).toBeVisible();
  });

  test('scripted buddy comes online and sends messages with a typing effect', async ({ page }) => {
    await openQQPanel(page);

    // 水晶女孩 starts offline (grayscale) and comes online on a scripted delay.
    const crystal = page.locator('[data-testid="qq-buddy-crystal"]');
    await expect(crystal).toHaveClass(/qq-offline/);
    await expect(crystal).not.toHaveClass(/qq-offline/, { timeout: 12000 });

    // Open her chat; her scripted messages arrive (typing indicator → text).
    await crystal.dblclick();
    await expect(page.locator('[data-testid="qq-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="qq-chat-messages"]')).toContainText('网吧联机 CS', {
      timeout: 10000,
    });
    // emojiRenderer turns classic codes into inline emoticons.
    await expect(page.locator('[data-testid="qq-chat-messages"] .qq-emoticon').first()).toBeVisible();
  });

  test('player can reply and receives a scripted response', async ({ page }) => {
    await openQQPanel(page);
    const crystal = page.locator('[data-testid="qq-buddy-crystal"]');
    await crystal.dblclick();
    await expect(page.locator('[data-testid="qq-chat"]')).toBeVisible();

    // Send a message from the player (own name shows on the message).
    await page.locator('[data-testid="qq-chat-input"]').fill('好啊，晚上见 /wx');
    await page.locator('[data-testid="qq-chat-send"]').click();
    await expect(page.locator('[data-testid="qq-chat-messages"]')).toContainText('往事随风');
    // /wx shorthand renders as an inline emoticon on the outgoing message.
    await expect(page.locator('[data-testid="qq-chat-messages"] .qq-emoticon').first()).toBeVisible();

    // The buddy replies with a scripted line.
    await expect(page.locator('[data-testid="qq-chat-typing"]')).toBeVisible({ timeout: 4000 });
  });
});
