import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

/**
 * Scenario system playthrough (#84): the bundled JSON prologue is playable
 * end-to-end with only clicks + a password — no app code.
 */
test.describe('Scenario prologue (#84)', () => {
  test('play the prologue: clue appears, password gate, payoff', async ({ page }) => {
    await login(page, { lang: 'en', query: 'scenario=prologue' });

    // scenario:start pushes an intro balloon.
    await expect(page.getByText('You have unfinished business')).toBeVisible();

    // Open My Documents → readme.txt; the scenario reveals a clue + a locked file.
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await page.locator('[data-testid="file-item-readme.txt"]').dblclick();
    await expect(page.locator('[data-testid="file-item-线索.txt"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-秘密.txt"]')).toBeVisible();

    // Opening the locked file prompts for a password; 2007 unlocks it.
    await page.locator('[data-testid="file-item-秘密.txt"]').dblclick();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="password"]').fill('2007');
    await page.keyboard.press('Enter');

    // The payoff file is created by the `solved` trigger.
    await expect(page.locator('[data-testid="file-item-结局.txt"]')).toBeVisible();
  });
});
