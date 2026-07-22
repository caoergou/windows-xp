import { expect, test } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Issue #87 behavior fidelity', () => {
  test('uses XP cursor roles and all eight resize directions', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();

    const window = page.locator('.xp-window').first();
    await expect(window).toBeVisible();
    const handles = window.locator('.react-resizable-handle');
    await expect(handles).toHaveCount(8);

    const expectedHandles: Record<string, string> = {
      n: 'size4_r.cur',
      ne: 'size1_r.cur',
      e: 'size3_r.cur',
      se: 'size2_r.cur',
      s: 'size4_r.cur',
      sw: 'size1_r.cur',
      w: 'size3_r.cur',
      nw: 'size2_r.cur',
    };
    for (const [direction, asset] of Object.entries(expectedHandles)) {
      const cursor = await window
        .locator(`.react-resizable-handle-${direction}`)
        .evaluate(element => getComputedStyle(element).cursor);
      expect(cursor).toContain(asset);
    }

    const roles = await page.locator('[data-testid="desktop"]').evaluate(desktop => {
      const samples = [
        ['link', 'a', 'xp-link'],
        ['text', 'input', ''],
        ['checkbox', 'input', ''],
        ['busy', 'div', 'xp-busy'],
        ['progress', 'div', 'xp-progress'],
        ['help', 'div', 'xp-help'],
        ['move', 'div', 'xp-move'],
        ['unavailable', 'div', 'xp-not-allowed'],
        ['crosshair', 'div', 'xp-crosshair'],
      ] as const;
      const result: Record<string, string> = {};
      samples.forEach(([name, tag, className]) => {
        const element = document.createElement(tag);
        element.className = className;
        if (name === 'link') (element as HTMLAnchorElement).href = '#cursor-test';
        if (name === 'text') (element as HTMLInputElement).type = 'text';
        if (name === 'checkbox') (element as HTMLInputElement).type = 'checkbox';
        desktop.appendChild(element);
        result[name] = getComputedStyle(element).cursor;
        element.remove();
      });
      return result;
    });

    expect(roles.link).toContain('harrow.cur');
    expect(roles.text).toContain('beam_r.cur');
    expect(roles.checkbox).toContain('arrow_r.cur');
    expect(roles.busy).toContain('busy_r.cur');
    expect(roles.progress).toContain('wait_r.cur');
    expect(roles.help).toContain('help_r.cur');
    expect(roles.move).toContain('move_r.cur');
    expect(roles.unavailable).toContain('no_r.cur');
    expect(roles.crosshair).toContain('cross_r.cur');
  });

  test('Ctrl+drag advertises copy and copies the Explorer item into a folder', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    const source = page.locator('[data-testid="file-item-readme.txt"]');
    const target = page.locator('[data-testid="file-item-我的视频"]');
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();

    await page.keyboard.down('Control');
    await source.dragTo(target);
    await page.keyboard.up('Control');

    await expect(source).toBeVisible();
    await target.dblclick();
    await expect(page.locator('[data-testid="file-item-readme.txt"]')).toBeVisible();
  });

  test('animates minimize and restore against the task button', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();

    const window = page.locator('.xp-window').first();
    await window.getByRole('button', { name: 'Minimize' }).click();
    const minimizing = page.locator('[data-window-transition="minimize"]');
    await expect(minimizing).toBeVisible();
    expect(await minimizing.evaluate(element => getComputedStyle(element).animationName)).not.toBe(
      'none'
    );
    await expect(minimizing).toHaveText('');
    expect(
      await minimizing.evaluate(element => getComputedStyle(element, '::before').backgroundImage)
    ).not.toBe('none');
    const realSurface = window.locator('[data-testid^="window-surface-"]');
    expect(
      await realSurface.evaluate(element => ({
        opacity: getComputedStyle(element).opacity,
        transform: getComputedStyle(element).transform,
        visibility: getComputedStyle(element).visibility,
      }))
    ).toEqual({ opacity: '1', transform: 'none', visibility: 'hidden' });
    await expect(window).toHaveCount(0);

    await page.locator('[data-testid^="task-button-"]').click();
    const restoring = page.locator('[data-window-transition="restore"]');
    await expect(restoring).toBeVisible();
    expect(await restoring.evaluate(element => getComputedStyle(element).animationName)).not.toBe(
      'none'
    );
  });

  test('uses the compact three-band XP Turn Off Computer panel', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-testid="start-button"]').click();
    await page
      .locator('[data-testid="start-menu"]')
      .getByText('Turn Off Computer', { exact: true })
      .click();

    const overlay = page.locator('[data-testid="turn-off-dialog"]');
    const panel = page.locator('[data-testid="turn-off-panel"]');
    await expect(panel).toBeVisible();
    const panelBox = await panel.boundingBox();
    if (!panelBox) throw new Error('Turn Off Computer panel geometry is required');
    expect(panelBox.width).toBeCloseTo(314, 0);
    expect(panelBox.height).toBeCloseTo(200, 0);
    expect(await overlay.evaluate(element => getComputedStyle(element).backdropFilter)).toContain(
      'grayscale(1)'
    );
    const actionIcons = panel.locator('[data-testid="turn-off-action-icon"]');
    await expect(actionIcons).toHaveCount(3);
    expect(await actionIcons.first().evaluate(element => getComputedStyle(element).width)).toBe(
      '32px'
    );
    expect(
      await panel
        .locator('[data-testid="turn-off-header"]')
        .evaluate(element => getComputedStyle(element).backgroundColor)
    ).toBe('rgb(0, 51, 153)');
    expect(
      await panel
        .locator('[data-testid="turn-off-actions"]')
        .evaluate(element => getComputedStyle(element).backgroundColor)
    ).toBe('rgb(90, 125, 222)');
    expect(
      await panel
        .locator('[data-testid="turn-off-footer"]')
        .evaluate(element => getComputedStyle(element).backgroundColor)
    ).toBe('rgb(0, 51, 153)');

    const turnOffButton = panel.getByRole('button', { name: 'Turn Off' });
    await turnOffButton.hover();
    expect(
      await turnOffButton.evaluate(element => {
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          outlineStyle: style.outlineStyle,
        };
      })
    ).toEqual({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: '0px',
      boxShadow: 'none',
      outlineStyle: 'none',
    });
  });

  test('keeps a tall All Programs flyout above the taskbar', async ({ page }) => {
    await page.setViewportSize({ width: 603, height: 461 });
    await login(page, { lang: 'zh' });
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="start-menu-all-programs"]').hover();

    const flyout = page.locator('[data-testid="start-menu-flyout"]');
    const taskbar = page.locator('[data-testid="taskbar"]');
    await expect(flyout).toBeVisible();
    const flyoutBox = await flyout.boundingBox();
    const taskbarBox = await taskbar.boundingBox();
    if (!flyoutBox || !taskbarBox) throw new Error('Flyout and taskbar geometry is required');

    expect(flyoutBox.y).toBeGreaterThanOrEqual(0);
    expect(flyoutBox.y + flyoutBox.height).toBeLessThanOrEqual(taskbarBox.y);
    await expect(flyout.locator('[data-testid="flyout-app-DeductionSheet"]')).toHaveCount(0);
    await expect(flyout.locator('[data-testid="flyout-app-EvidenceBoard"]')).toHaveCount(0);
  });

  test('closes the Explorer context menu on outside left-click and nests creation commands', async ({
    page,
  }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();

    const fileArea = page.locator('[data-testid="explorer-file-area"]');
    await expect(fileArea).toBeVisible();
    await fileArea.click({ button: 'right', position: { x: 420, y: 240 } });

    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    const topLevelLabels = await menu.locator(':scope > div > .menu-label').allTextContents();
    expect(topLevelLabels).toContain('New');
    expect(topLevelLabels).not.toContain('Folder');
    expect(topLevelLabels).not.toContain('Text Document');

    await menu.getByText('New', { exact: true }).hover();
    await expect(menu.getByText('Folder', { exact: true })).toBeVisible();
    await expect(menu.getByText('Text Document', { exact: true })).toBeVisible();

    await fileArea.click({ position: { x: 10, y: 10 } });
    await expect(menu).toBeHidden();

    const readme = page.locator('[data-testid="file-item-readme.txt"]');
    await readme.click({ button: 'right' });
    const rename = menu.getByRole('menuitem', { name: 'Rename' });
    await expect(rename).not.toHaveAttribute('aria-disabled', 'true');
    await rename.click();
    await expect(page.getByRole('dialog', { name: 'Rename' })).toBeVisible();
    await page.keyboard.press('Escape');

    await readme.click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('disables destructive commands for protected drives', async ({ page }) => {
    await login(page, { lang: 'zh' });
    await page.locator('[data-english-testid="desktop-icon-my-computer"]').dblclick();

    const drive = page.locator('[data-testid="file-item-本地磁盘 (D:)"]');
    await expect(drive).toBeVisible();
    const explorerWindow = page.locator('.xp-window').filter({ has: drive });
    await drive.click({ button: 'right' });

    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu.getByRole('menuitem', { name: '剪切' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await expect(menu.getByRole('menuitem', { name: '重命名' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await expect(menu.getByRole('menuitem', { name: '删除' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    const propertiesTitle = '本地磁盘 (D:) 属性';
    await menu.getByRole('menuitem', { name: '属性' }).click();

    const propertiesWindow = page.locator('.xp-window').filter({ hasText: propertiesTitle });
    const propertiesTask = page
      .locator('[data-testid^="task-button-"]')
      .filter({ hasText: propertiesTitle });
    await expect(propertiesWindow).toBeVisible();
    await expect(propertiesTask).toBeVisible();

    const explorerZIndex = Number(
      await explorerWindow.evaluate(element => getComputedStyle(element).zIndex)
    );
    const propertiesZIndex = Number(
      await propertiesWindow.evaluate(element => getComputedStyle(element).zIndex)
    );
    expect(propertiesZIndex).toBeGreaterThan(explorerZIndex);
    await expect(propertiesWindow).toHaveCSS('width', '380px');
    await expect(propertiesWindow).toHaveCSS('height', '420px');

    await propertiesWindow.getByRole('button', { name: '确定' }).click();
    await expect(propertiesWindow).toBeHidden();
    await expect(propertiesTask).toBeHidden();
  });

  test('taskbar commands tile visible windows and ignore minimized ones', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await page.locator('[data-english-testid="desktop-icon-Calculator"]').dblclick({ force: true });
    await expect(page.locator('.xp-window')).toHaveCount(2);

    await page.locator('[data-testid="taskbar"]').dispatchEvent('contextmenu', {
      clientX: 500,
      clientY: 740,
    });
    const taskbarBox = await page.locator('[data-testid="taskbar"]').boundingBox();
    const menuBox = await page.locator('[data-testid="context-menu"]').boundingBox();
    if (!taskbarBox || !menuBox) throw new Error('Taskbar menu geometry is required');
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(taskbarBox.y);
    await page.getByText('Tile Windows Vertically', { exact: true }).click();

    const boxes = await page.locator('.xp-window').evaluateAll(elements =>
      elements
        .map(element => element.getBoundingClientRect())
        .map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }))
        .sort((a, b) => a.x - b.x)
    );
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('A fixed viewport is required for the layout assertion');
    const halfWidth = viewport.width / 2;
    expect(boxes[0].x).toBeCloseTo(0, 0);
    expect(boxes[1].x).toBeCloseTo(halfWidth, 0);
    expect(boxes[0].width).toBeCloseTo(halfWidth, 0);
    expect(Math.abs(boxes[0].height - (viewport.height - 30))).toBeLessThanOrEqual(1);
  });

  test('Show the Desktop restores exactly the windows hidden by the previous command', async ({
    page,
  }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    await page.locator('[data-english-testid="desktop-icon-Calculator"]').dblclick({ force: true });
    await expect(page.locator('.xp-window')).toHaveCount(2);

    const showDesktop = async () => {
      await page.locator('[data-testid="taskbar"]').dispatchEvent('contextmenu', {
        clientX: 500,
        clientY: 740,
      });
      await page.getByText('Show the Desktop', { exact: true }).click();
    };

    await showDesktop();
    await expect(page.locator('.xp-window')).toHaveCount(0);
    await showDesktop();
    await expect(page.locator('.xp-window')).toHaveCount(2);
  });

  test('Alt+Space supports keyboard move, edge size, commit and cancel', async ({ page }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    const window = page.locator('.xp-window').first();
    const initial = await window.boundingBox();
    if (!initial) throw new Error('Window geometry is required');

    await page.keyboard.press('Alt+Space');
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error('System menu geometry is required');
    expect(Math.abs(menuBox.x - (initial.x + 3))).toBeLessThanOrEqual(2);
    expect(Math.abs(menuBox.y - (initial.y + 25))).toBeLessThanOrEqual(2);
    await menu.getByText('Move', { exact: true }).click();
    const moveSurface = window.locator('.xp-move');
    await expect(moveSurface).toBeVisible();
    expect(await moveSurface.evaluate(element => getComputedStyle(element).cursor)).toContain(
      'move_r.cur'
    );
    for (let index = 0; index < 10; index += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const moved = await window.boundingBox();
    if (!moved) throw new Error('Moved window geometry is required');
    expect(moved.x - initial.x).toBeCloseTo(10, 0);

    await page.keyboard.press('Alt+Space');
    await menu.getByText('Size', { exact: true }).click();
    await page.keyboard.press('ArrowRight');
    const horizontalResizeSurface = window.locator('.resize-ew');
    await expect(horizontalResizeSurface).toBeVisible();
    expect(
      await horizontalResizeSurface.evaluate(element => getComputedStyle(element).cursor)
    ).toContain('size3_r.cur');
    for (let index = 0; index < 9; index += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const resized = await window.boundingBox();
    if (!resized) throw new Error('Resized window geometry is required');
    expect(resized.width - moved.width).toBeCloseTo(10, 0);

    await page.keyboard.press('Alt+Space');
    await menu.getByText('Move', { exact: true }).click();
    for (let index = 0; index < 5; index += 1) await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');
    await expect(window.locator('.xp-move')).toHaveCount(0);
    const cancelled = await window.boundingBox();
    if (!cancelled) throw new Error('Cancelled window geometry is required');
    expect(cancelled.x).toBeCloseTo(resized.x, 0);
    expect(cancelled.width).toBeCloseTo(resized.width, 0);
  });

  test('groups similar task buttons only after the taskbar becomes crowded', async ({ page }) => {
    await login(page, { lang: 'en' });
    const explorerCount = 25;
    for (let index = 0; index < explorerCount; index += 1) {
      await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
      const openWindow = page.locator('.xp-window');
      await expect(openWindow).toHaveCount(1);
      await openWindow.getByRole('button', { name: 'Minimize' }).click();
      await expect(openWindow).toHaveCount(0);
    }

    const explorerGroup = page.locator('[data-testid="task-group-Explorer"]');
    await expect(explorerGroup).toBeVisible();
    await expect(explorerGroup).toContainText(new RegExp(`^${explorerCount} Windows Explorer`));
    await explorerGroup.click();
    const menu = page.locator('[data-testid="context-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('[class*="menu-label"]')).toHaveCount(explorerCount);
    await page.locator('[data-testid="desktop"]').click({ position: { x: 900, y: 500 } });

    await explorerGroup.click({ button: 'right' });
    await expect(page.getByText('Minimize Group', { exact: true })).toBeVisible();
    await expect(page.getByText('Close Group', { exact: true })).toBeVisible();
  });

  test('blocks only the modal parent and flashes the dialog on parent interaction', async ({
    page,
  }) => {
    await login(page, { lang: 'en' });
    await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
    const explorer = page.locator('.xp-window').first();
    await explorer.locator('[data-testid^="file-item-"]').first().click();
    await page.keyboard.press('Delete');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const activeDialogBackground = await dialog
      .locator('.title-bar')
      .evaluate(element => getComputedStyle(element).backgroundImage);
    const explorerBox = await explorer.boundingBox();
    const dialogBox = await dialog.boundingBox();
    if (!explorerBox || !dialogBox) throw new Error('Owner/dialog geometry is required');
    expect(dialogBox.x + dialogBox.width / 2).toBeCloseTo(explorerBox.x + explorerBox.width / 2, 0);
    expect(dialogBox.y + dialogBox.height / 2).toBeCloseTo(
      explorerBox.y + explorerBox.height / 2,
      0
    );
    const ownerZIndex = Number(
      await explorer.evaluate(element => getComputedStyle(element).zIndex)
    );
    const dialogZIndex = Number(
      await dialog.evaluate(
        element => getComputedStyle(element.parentElement as HTMLElement).zIndex
      )
    );
    expect(dialogZIndex).toBe(ownerZIndex);

    const showDesktop = async () => {
      await page.locator('[data-testid="taskbar"]').dispatchEvent('contextmenu', {
        clientX: 500,
        clientY: 740,
      });
      await page.getByText('Show the Desktop', { exact: true }).click();
    };
    await showDesktop();
    await expect(dialog).toHaveCount(0);
    await showDesktop();
    await expect(dialog).toBeVisible();

    const blocker = page.locator('[data-testid^="modal-blocker-"]');
    await expect(blocker).toBeVisible();
    await blocker.click({ position: { x: 10, y: 10 } });
    expect(
      await dialog
        .locator('.title-bar')
        .evaluate(element => getComputedStyle(element).animationName)
    ).not.toBe('none');

    await page.locator('[data-english-testid="desktop-icon-Calculator"]').dblclick({ force: true });
    const calculator = page.locator('.xp-window').filter({ hasText: 'Calculator' });
    await expect(calculator).toBeVisible();
    const calculatorZIndex = Number(
      await calculator.evaluate(element => getComputedStyle(element).zIndex)
    );
    expect(calculatorZIndex).toBeGreaterThan(dialogZIndex);
    const inactiveDialogBackground = await dialog
      .locator('.title-bar')
      .evaluate(element => getComputedStyle(element).backgroundImage);
    expect(inactiveDialogBackground).not.toBe(activeDialogBackground);
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible();
  });
});
