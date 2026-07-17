import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP } from '../src/lib';
import { useOSTheme } from '../src/themes/useOSTheme';
import { xpTheme } from '../src/themes/xp';
import type { OSTheme } from '../src/themes/contract';
import type { AppRegistryEntry } from '../src/types';
import type { XPHandle } from '../src/components/XPBridge';

// #213 B1: the runtime theme-selection seam. A `theme?: OSTheme` prop is
// injected through a styled-components ThemeProvider; consumers read it with
// `useOSTheme()` (and styled components via `props.theme`). XP stays the default.

// A distinct fake theme: same shape as xpTheme, different identity + sounds, so
// we can assert the *selected* theme (not the XP default) reaches consumers.
const fakeTheme: OSTheme = {
  ...xpTheme,
  id: 'fake-os',
  name: 'Fake OS 1.0',
  sounds: { ...xpTheme.sounds, startup: 'data:audio/wav;base64,ZmFrZQ==' },
};

describe('OS theme seam (#213 B1)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('useOSTheme() reads the theme injected via ThemeProvider', () => {
    const Probe: React.FC = () => {
      const theme = useOSTheme();
      return <span data-testid="probe">{`${theme.id}|${theme.sounds.startup}`}</span>;
    };
    render(
      <ThemeProvider theme={fakeTheme}>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('fake-os|data:audio/wav;base64,ZmFrZQ==');
  });

  it('defaults to xpTheme when no theme prop is passed', async () => {
    const seen: OSTheme[] = [];
    const probeApp: AppRegistryEntry = {
      id: 'ThemeProbe',
      name: 'Theme Probe',
      icon: 'app_window',
      restore: () => {
        const Inner: React.FC = () => {
          seen.push(useOSTheme());
          return null;
        };
        return <Inner />;
      },
    };
    const ref = React.createRef<XPHandle>();
    render(<WindowsXP ref={ref} apps={[probeApp]} skipBoot autoLogin />);
    await waitFor(() => expect(ref.current).not.toBeNull());
    act(() => {
      ref.current!.openApp('ThemeProbe');
    });
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen[seen.length - 1].id).toBe('xp');
  });

  it('threads a custom theme from the WindowsXP prop through to consumers', async () => {
    const seen: OSTheme[] = [];
    const probeApp: AppRegistryEntry = {
      id: 'ThemeProbe',
      name: 'Theme Probe',
      icon: 'app_window',
      restore: () => {
        const Inner: React.FC = () => {
          seen.push(useOSTheme());
          return null;
        };
        return <Inner />;
      },
    };
    const ref = React.createRef<XPHandle>();
    render(<WindowsXP ref={ref} theme={fakeTheme} apps={[probeApp]} skipBoot autoLogin />);
    await waitFor(() => expect(ref.current).not.toBeNull());
    act(() => {
      ref.current!.openApp('ThemeProbe');
    });
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    const active = seen[seen.length - 1];
    expect(active.id).toBe('fake-os');
    expect(active.sounds.startup).toBe('data:audio/wav;base64,ZmFrZQ==');
  });
});
