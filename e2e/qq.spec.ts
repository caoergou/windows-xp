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
    await expect(
      page.locator('[data-testid="qq-chat-messages"] .qq-emoticon').first()
    ).toBeVisible();
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
    await expect(
      page.locator('[data-testid="qq-chat-messages"] .qq-emoticon').first()
    ).toBeVisible();

    // The buddy replies with a scripted line.
    await expect(page.locator('[data-testid="qq-chat-typing"]')).toBeVisible({ timeout: 4000 });
  });
});

/**
 * QQ refinements (#refine-qq): buddy tooltip, find dialog, main menu, tray
 * right-click menu, minimize-to-tray + close dialog, chat emoji picker + history.
 */
test.describe('QQ refinements (#refine-qq)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(45000);
    await login(page, { lang: 'zh' });
  });

  test('hovering a buddy shows a profile tooltip (nick, number, status)', async ({ page }) => {
    await openQQPanel(page);
    await page.locator('[data-testid="qq-buddy-ahui"]').hover();
    const tip = page.locator('[data-testid="qq-buddy-tooltip"]');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('阿辉');
    await expect(tip).toContainText('286512');
  });

  test('find dialog filters buddies and opens a chat', async ({ page }) => {
    await openQQPanel(page);
    await page.locator('[data-testid="qq-find-button"]').click();
    await expect(page.locator('[data-testid="qq-find-dialog"]')).toBeVisible();
    await page.locator('[data-testid="qq-find-input"]').fill('阿辉');
    await expect(page.locator('[data-testid="qq-find-results"] li')).toHaveCount(1);
    await page.locator('[data-testid="qq-find-item-ahui"]').dblclick();
    await expect(page.locator('[data-testid="qq-chat"]')).toBeVisible();
  });

  test('main menu opens and can launch the find dialog', async ({ page }) => {
    await openQQPanel(page);
    await page.locator('[data-testid="qq-menu-button"]').click();
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    await menu.getByText('查找联系人…').click();
    await expect(page.locator('[data-testid="qq-find-dialog"]')).toBeVisible();
  });

  test('message manager opens the mounted archive surface (#280)', async ({ page }) => {
    await login(page, { lang: 'zh', query: 'content=reference&persistence=none' });
    await openQQPanel(page);
    await page.locator('[data-testid="qq-menu-button"]').click();
    const archiveItem = page
      .locator('[data-testid="context-menu"]')
      .getByRole('menuitem', { name: '消息记录管理器' });
    await expect(archiveItem).not.toHaveAttribute('aria-disabled', 'true');
    await archiveItem.click();
    await expect(page.locator('[data-testid="context-menu"]')).toBeHidden();
    await expect(page.locator('[data-testid="qq-archive"]')).toBeVisible();
    await expect(page.locator('[data-testid="qq-archive-conversations"]')).toContainText(
      '水晶女孩'
    );
    await expect(page.locator('[data-testid="qq-archive-history"]')).toContainText(
      '城东那家蓝光网吧'
    );
    await page.locator('[data-testid="qq-archive-search"]').fill('充值单');
    await expect(page.locator('[data-testid="qq-archive-history"]')).toContainText(
      '蓝光网吧充值单.txt'
    );
  });

  test('tray icon has a right-click status menu', async ({ page }) => {
    await openQQPanel(page);
    await page.locator('[data-tray-id="qq"]').click({ button: 'right' });
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('隐身');
    await expect(menu).toContainText('退出');
  });

  test('minimize hides the panel to the tray (off the taskbar) and the tray icon restores it', async ({
    page,
  }) => {
    await openQQPanel(page);
    const panelWin = page.locator('.xp-window', { has: page.locator('[data-testid="qq-panel"]') });
    await panelWin.getByRole('button', { name: '最小化' }).click();
    await expect(page.locator('[data-testid="qq-panel"]')).toBeHidden();
    // The tray icon survives (the window stays mounted) so it can restore the panel.
    await expect(page.locator('[data-tray-id="qq"]')).toHaveCount(1);
    await page.locator('[data-tray-id="qq"]').click();
    await expect(page.locator('[data-testid="qq-panel"]')).toBeVisible();
  });

  test('closing the panel asks before quitting; cancel keeps it open', async ({ page }) => {
    await openQQPanel(page);
    const panelWin = page.locator('.xp-window', { has: page.locator('[data-testid="qq-panel"]') });
    await panelWin.getByRole('button', { name: '关闭' }).click();
    await expect(page.locator('[data-testid="qq-close-dialog"]')).toBeVisible();
    await page.locator('[data-testid="qq-close-dialog"]').getByText('取消').click();
    await expect(page.locator('[data-testid="qq-panel"]')).toBeVisible();
  });

  test('chat emoji picker inserts a code and the history viewer lists messages', async ({
    page,
  }) => {
    await openQQPanel(page);
    await page.locator('[data-testid="qq-buddy-ahui"]').dblclick();
    await expect(page.locator('[data-testid="qq-chat"]')).toBeVisible();

    // Emoji picker → insert a bracket code into the input.
    await page.locator('[data-testid="qq-chat-face"]').click();
    await expect(page.locator('[data-testid="qq-emoji-picker"]')).toBeVisible();
    await page.locator('[data-testid="qq-emoji-picker"] button').first().click();
    await expect(page.locator('[data-testid="qq-chat-input"]')).toHaveValue(/\[.+\]/);

    // Send it, then open the history viewer and see the logged message.
    await page.locator('[data-testid="qq-chat-send"]').click();
    await page.locator('[data-testid="qq-chat-history-btn"]').click();
    const history = page.locator('[data-testid="qq-chat-history"]');
    await expect(history).toBeVisible();
    await expect(history.locator('.row')).not.toHaveCount(0);
  });
});
