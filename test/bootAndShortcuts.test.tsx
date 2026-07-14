import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WindowsXP } from '../src/lib';
import { encodeOpenWindows } from '../src/utils/windowPersistence';

// Storage keys use the default 'xp_' prefix (see src/utils/storage.ts).
const KEY_FIRST_BOOT = 'xp_first_boot_done';
const KEY_POWER_STATE = 'xp_power_state';
const KEY_LOGGED_IN = 'xp_logged_in';
const KEY_OPEN_WINDOWS = 'xp_open_windows';

// Timings from src/components/BootScreen.tsx and src/constants.ts.
const BOOT_DURATION = 4000;
const SCREENSAVER_TIMEOUT = 60000;
const SCREENSAVER_FADE = 500;

// alt texts: BootScreen logo is 'Microsoft Windows XP', screensaver logo is 'Windows XP'.
const bootLogo = () => screen.queryByAltText('Microsoft Windows XP');
const screensaverLogo = () => screen.queryByAltText('Windows XP');
const taskbar = () => screen.queryByTestId('taskbar');
const passwordInput = () => document.querySelector('input[type="password"]');
// Note: restored apps overwrite the persisted title on mount (e.g. Calculator sets its
// localized name), so window presence is asserted via the window-title testid count.
const openWindowCount = () => screen.queryAllByTestId('window-title').length;

/** Simulate a previous session that finished booting and is still running. */
const seedRunningSession = ({ loggedIn }: { loggedIn: boolean }) => {
  localStorage.setItem(KEY_FIRST_BOOT, 'true');
  localStorage.setItem(KEY_POWER_STATE, 'running');
  if (loggedIn) localStorage.setItem(KEY_LOGGED_IN, 'true');
};

/** Build a persisted window entry that WindowManagerProvider can restore. */
const makeSavedWindow = (id: string, title: string, zIndex: number) => ({
  id,
  appId: 'Calculator',
  title,
  componentProps: {},
  icon: 'calculator',
  props: { width: 208, height: 196, resizable: false },
  isMinimized: false,
  isMaximized: false,
  zIndex,
  width: 208,
  height: 196,
  left: 100,
  top: 100,
});

const seedOpenWindows = (...titles: string[]) => {
  const wins = titles.map((title, i) => makeSavedWindow(`win-${i + 1}`, title, 10001 + i));
  localStorage.setItem(KEY_OPEN_WINDOWS, encodeOpenWindows(wins));
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

describe('boot state machine', () => {
  it('shows the boot screen on first load when xp_first_boot_done is not set', () => {
    render(<WindowsXP />);

    expect(bootLogo()).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();
    expect(passwordInput()).not.toBeInTheDocument();
  });

  it('finishes booting after the boot timer, persists flags and shows the login screen', () => {
    vi.useFakeTimers();
    render(<WindowsXP />);
    expect(bootLogo()).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(BOOT_DURATION + 100);
    });

    expect(bootLogo()).not.toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(localStorage.getItem(KEY_FIRST_BOOT)).toBe('true');
    expect(localStorage.getItem(KEY_POWER_STATE)).toBe('running');
  });

  it('skips the boot screen on a running session that is not logged in and shows login', () => {
    seedRunningSession({ loggedIn: false });
    render(<WindowsXP />);

    expect(bootLogo()).not.toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();
  });

  it.each(['shutdown', 'restart', 'logout'])(
    'boots again when xp_power_state is %s even if first boot is done',
    powerState => {
      localStorage.setItem(KEY_FIRST_BOOT, 'true');
      localStorage.setItem(KEY_LOGGED_IN, 'true');
      localStorage.setItem(KEY_POWER_STATE, powerState);

      render(<WindowsXP />);

      expect(bootLogo()).toBeInTheDocument();
      expect(taskbar()).not.toBeInTheDocument();
    }
  );

  it('resumes into the screensaver when refreshed while logged in, and a key press returns to the desktop', () => {
    vi.useFakeTimers();
    seedRunningSession({ loggedIn: true });
    render(<WindowsXP />);

    // Refresh while logged in starts in the SCREENSAVER phase, not the desktop.
    expect(screensaverLogo()).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(SCREENSAVER_FADE + 50);
    });

    expect(screensaverLogo()).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();
  });

  it('goes straight to the desktop with skipBoot when previously logged in (no screensaver interstitial)', () => {
    seedRunningSession({ loggedIn: true });
    render(<WindowsXP skipBoot />);

    expect(bootLogo()).not.toBeInTheDocument();
    expect(screensaverLogo()).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();
  });
});

describe('global keyboard shortcuts', () => {
  it('Alt+F4 closes the active (topmost) window', () => {
    seedOpenWindows('AltF4 Target');
    render(<WindowsXP skipBoot autoLogin />);

    expect(taskbar()).toBeInTheDocument();
    expect(openWindowCount()).toBe(1);

    fireEvent.keyDown(window, { key: 'F4', altKey: true });

    expect(openWindowCount()).toBe(0);
    expect(taskbar()).toBeInTheDocument();
  });

  it('Alt+F4 does nothing when disableGlobalShortcuts is set', () => {
    seedOpenWindows('Protected Window');
    render(<WindowsXP skipBoot autoLogin disableGlobalShortcuts />);

    expect(openWindowCount()).toBe(1);

    fireEvent.keyDown(window, { key: 'F4', altKey: true });

    expect(openWindowCount()).toBe(1);
  });

  it('Alt+Tab shows the window switcher overlay and releasing Alt hides it', () => {
    seedOpenWindows('Window A', 'Window B');
    render(<WindowsXP skipBoot autoLogin />);

    expect(screen.queryByText('Switch windows')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab', altKey: true });
    expect(screen.getByText('Switch windows')).toBeInTheDocument();

    fireEvent.keyUp(window, { key: 'Alt' });
    expect(screen.queryByText('Switch windows')).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();
  });

  it('Ctrl+Shift+Alt+B shows the BSOD easter egg; clicking it fake-reboots (#85)', () => {
    render(<WindowsXP skipBoot autoLogin />);

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true, shiftKey: true, altKey: true });
    expect(screen.getByTestId('bsod-screen')).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();

    // Clicking the blue screen restarts the machine: BSOD clears and the boot
    // screen returns instead of dropping straight back to the desktop.
    fireEvent.click(screen.getByTestId('bsod-screen'));
    expect(screen.queryByTestId('bsod-screen')).not.toBeInTheDocument();
    expect(screen.getByAltText('Microsoft Windows XP')).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();
  });
});

describe('screensaver idle timer', () => {
  it('activates after the idle timeout and a click brings the desktop back', () => {
    vi.useFakeTimers();
    render(<WindowsXP skipBoot autoLogin />);
    expect(taskbar()).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(SCREENSAVER_TIMEOUT + 100);
    });

    expect(screensaverLogo()).toBeInTheDocument();
    expect(screen.getByText('Click or press any key to continue...')).toBeInTheDocument();
    expect(taskbar()).not.toBeInTheDocument();

    fireEvent.click(screensaverLogo() as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(SCREENSAVER_FADE + 50);
    });

    expect(screensaverLogo()).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();
  });

  it('user activity (mousemove) resets the idle timer', () => {
    vi.useFakeTimers();
    render(<WindowsXP skipBoot autoLogin />);

    // 45s idle, then activity: the 60s countdown restarts.
    act(() => {
      vi.advanceTimersByTime(45000);
    });
    fireEvent.mouseMove(window);

    // 45s more (90s total) is still short of the restarted 60s timeout.
    act(() => {
      vi.advanceTimersByTime(45000);
    });
    expect(screensaverLogo()).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();

    // Complete the restarted timeout without further activity.
    act(() => {
      vi.advanceTimersByTime(SCREENSAVER_TIMEOUT);
    });
    expect(screensaverLogo()).toBeInTheDocument();
  });

  it('never activates when disableScreenSaver is set', () => {
    vi.useFakeTimers();
    render(<WindowsXP skipBoot autoLogin disableScreenSaver />);

    act(() => {
      vi.advanceTimersByTime(SCREENSAVER_TIMEOUT * 3);
    });

    expect(screensaverLogo()).not.toBeInTheDocument();
    expect(taskbar()).toBeInTheDocument();
  });
});

describe('integration mode (fullscreen vs embedded)', () => {
  it('fullscreen mode (default) blocks the browser context menu on window', () => {
    render(<WindowsXP skipBoot />);

    // fireEvent returns false when preventDefault() was called on the event.
    const notPrevented = fireEvent.contextMenu(document.body);
    expect(notPrevented).toBe(false);
  });

  it('embedded mode does not intercept contextmenu on window', () => {
    render(<WindowsXP skipBoot mode="embedded" />);

    const notPrevented = fireEvent.contextMenu(document.body);
    expect(notPrevented).toBe(true);
  });

  it('embedded mode also disables global shortcuts by default (Alt+F4 keeps the window open)', () => {
    seedOpenWindows('Embedded Window');
    render(<WindowsXP skipBoot autoLogin mode="embedded" />);

    expect(openWindowCount()).toBe(1);
    fireEvent.keyDown(window, { key: 'F4', altKey: true });
    expect(openWindowCount()).toBe(1);
  });
});
