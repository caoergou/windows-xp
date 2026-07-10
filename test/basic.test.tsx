import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AppProviders from '../src/components/AppProviders';

describe('AppProviders smoke test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without throwing and shows the login screen when skipBoot is true', async () => {
    expect(() => render(<AppProviders skipBoot />)).not.toThrow();

    await waitFor(() => {
      expect(document.body.textContent).toContain('Windows');
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });
  });

  it('renders the desktop when skipBoot and autoLogin are true', async () => {
    render(<AppProviders skipBoot autoLogin />);

    await waitFor(() => {
      expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
    });

    expect(document.body.textContent).toContain('My Computer');
  });
});
