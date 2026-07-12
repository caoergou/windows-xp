/**
 * Boot & login branding (#139): opt-in skinning, trademark suppression, and a
 * custom startup sound that respects the sound manager.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BootScreen from '../src/components/BootScreen';
import { WindowsXP } from '../src/lib';
import * as soundManager from '../src/utils/soundManager';

describe('BootScreen branding (#139)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('default: shows the Microsoft XP logo + copyright and plays the XP chime', () => {
    const startup = vi.spyOn(soundManager.sounds, 'startup').mockImplementation(() => {});
    render(<BootScreen onComplete={() => {}} />);
    expect(screen.getByAltText('Microsoft Windows XP')).toBeInTheDocument();
    expect(screen.getByAltText('Microsoft')).toBeInTheDocument();
    vi.advanceTimersByTime(300);
    expect(startup).toHaveBeenCalled();
  });

  it('branded: shows custom logo/text, suppresses Microsoft marks, plays custom sound', () => {
    const startup = vi.spyOn(soundManager.sounds, 'startup').mockImplementation(() => {});
    const custom = vi.spyOn(soundManager, 'playCustomSound').mockImplementation(() => {});
    render(
      <BootScreen
        onComplete={() => {}}
        branding={{ logo: 'https://x.dev/logo.png', text: 'ACME OS', startupSound: 'https://x.dev/boot.mp3' }}
      />
    );
    expect(screen.getByText('ACME OS')).toBeInTheDocument();
    expect(screen.getByAltText('ACME OS')).toHaveAttribute('src', 'https://x.dev/logo.png');
    // Microsoft trademarks are gone.
    expect(screen.queryByAltText('Microsoft Windows XP')).toBeNull();
    expect(screen.queryByAltText('Microsoft')).toBeNull();
    vi.advanceTimersByTime(300);
    expect(custom).toHaveBeenCalledWith('https://x.dev/boot.mp3');
    expect(startup).not.toHaveBeenCalled();
  });
});

describe('LoginScreen branding through <WindowsXP/> (#139)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('default login shows the Microsoft Windows XP wordmark', async () => {
    render(<WindowsXP skipBoot disableScreenSaver />);
    await waitFor(() => expect(screen.getByTestId('login-screen')).toBeInTheDocument());
    expect(screen.getByText('Microsoft Windows')).toBeInTheDocument();
    expect(screen.queryByTestId('login-title')).toBeNull();
  });

  it('branded login replaces the wordmark and user tile/name', async () => {
    render(
      <WindowsXP
        skipBoot
        disableScreenSaver
        login={{ title: 'ACME Portal', userName: 'Guest', background: 'linear-gradient(#111, #222)' }}
      />
    );
    await waitFor(() => expect(screen.getByTestId('login-screen')).toBeInTheDocument());
    expect(screen.getByTestId('login-title')).toHaveTextContent('ACME Portal');
    // The Microsoft wordmark is suppressed.
    expect(screen.queryByText('Microsoft Windows')).toBeNull();
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });
});
