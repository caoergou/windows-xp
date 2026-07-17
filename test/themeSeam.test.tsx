import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP } from '../src/lib';
import { useOSTheme, resolveOSTheme } from '../src/themes/useOSTheme';
import { xpTheme } from '../src/themes/xp';
import { Wrap as MinesweeperGrid } from '../src/apps/Minesweeper/styled';
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

describe('theme fallback without a provider (#213 B1)', () => {
  // Bare usage of the public /apps and /components subpaths has no
  // ThemeProvider above it; theme reads must degrade to the default xpTheme
  // instead of crashing (public-API compatibility).
  const hexToRgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };

  it('resolveOSTheme falls back to xpTheme when the theme is missing', () => {
    expect(resolveOSTheme(undefined).id).toBe('xp');
    expect(resolveOSTheme({} as OSTheme).id).toBe('xp');
    expect(resolveOSTheme(fakeTheme).id).toBe('fake-os');
  });

  it('useOSTheme() falls back to xpTheme with no provider (styled useTheme throws)', () => {
    const Probe: React.FC = () => <span data-testid="probe">{useOSTheme().id}</span>;
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('xp');
  });

  it('a migrated styled component renders with xpTheme tokens and no provider', () => {
    render(<MinesweeperGrid data-testid="grid" />);
    expect(getComputedStyle(screen.getByTestId('grid')).backgroundColor).toBe(
      hexToRgb(xpTheme.tokens.SURFACE)
    );
  });

  it('an enclosing provider still wins over the fallback', () => {
    const custom: OSTheme = {
      ...fakeTheme,
      tokens: { ...fakeTheme.tokens, SURFACE: '#123456' },
    };
    render(
      <ThemeProvider theme={custom}>
        <MinesweeperGrid data-testid="grid" />
      </ThemeProvider>
    );
    expect(getComputedStyle(screen.getByTestId('grid')).backgroundColor).toBe(hexToRgb('#123456'));
  });
});
