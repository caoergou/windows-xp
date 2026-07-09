import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WindowsXP } from '../src/lib';

describe('WindowsXP component props', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the boot screen by default', () => {
    render(<WindowsXP />);
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('skipBoot bypasses the boot screen and renders the login screen', async () => {
    render(<WindowsXP skipBoot />);

    expect(screen.queryByText('Microsoft')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });
  });

  it('autoLogin bypasses both boot and login screens and renders the desktop', async () => {
    render(<WindowsXP skipBoot autoLogin />);

    expect(screen.queryByText('Microsoft')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('taskbar')).toBeInTheDocument();
    });
  });
});
