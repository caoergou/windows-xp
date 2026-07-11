/**
 * Render-smoke tests for the zh culture apps (#163/E).
 *
 * These six apps previously had zero unit and e2e coverage. Now that they share
 * CultureAppShell (#163/B), a lightweight mount test guards against crash-on-
 * render regressions (bad context usage, missing i18n keys throwing, etc.).
 * QQ is covered by its own module's tests.
 */
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from './utils';
import SafeGuard360 from '../src/apps/SafeGuard360';
import Thunder from '../src/apps/Thunder';
import KugouMusic from '../src/apps/KugouMusic';
import BaofengPlayer from '../src/apps/BaofengPlayer';
import WPSOffice from '../src/apps/WPSOffice';

const apps: Array<[string, React.FC<{ windowId?: string }>]> = [
  ['SafeGuard360', SafeGuard360],
  ['Thunder', Thunder],
  ['KugouMusic', KugouMusic],
  ['BaofengPlayer', BaofengPlayer],
  ['WPSOffice', WPSOffice],
];

describe('zh culture apps render (#163/E)', () => {
  for (const [name, App] of apps) {
    it(`${name} mounts and renders a non-empty shell`, () => {
      const { container } = renderWithProviders(<App windowId="test-window" />);
      // The CultureAppShell (or app root) renders at least one element with content.
      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector('div')).toBeTruthy();
      expect((container.textContent ?? '').length).toBeGreaterThan(0);
    });
  }
});
