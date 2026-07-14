/**
 * Modal focus management & keyboard a11y (#124): role/aria, focus trap, Esc =
 * cancel, and focus restore to the invoker on close (DLG-03/04).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { ModalProvider, useModal } from '../src/context/ModalContext';

function Harness({ onResult }: { onResult?: (v: boolean) => void }) {
  const { dialog } = useModal();
  return (
    <button
      onClick={() =>
        dialog.confirm({ title: 'Delete file', message: 'Are you sure?' }).then(onResult)
      }
    >
      trigger
    </button>
  );
}

const renderHarness = (onResult?: (v: boolean) => void) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ModalProvider>
        <Harness onResult={onResult} />
      </ModalProvider>
    </I18nextProvider>
  );

describe('modal a11y (#124)', () => {
  it('exposes role=dialog, aria-modal and an accessible name', async () => {
    renderHarness();
    fireEvent.click(screen.getByText('trigger'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Delete file');
  });

  it('Escape cancels the dialog (resolves false) and closes it', async () => {
    let result: boolean | undefined;
    renderHarness(v => {
      result = v;
    });
    fireEvent.click(screen.getByText('trigger'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(result).toBe(false);
  });

  it('traps Tab focus within the dialog (wraps at the boundaries)', async () => {
    renderHarness();
    fireEvent.click(screen.getByText('trigger'));
    const dialog = await screen.findByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement; // the focus-trap container
    const focusables = Array.from(overlay.querySelectorAll<HTMLElement>('button'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    expect(focusables.length).toBeGreaterThanOrEqual(2);

    act(() => last.focus());
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    act(() => first.focus());
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus to the invoker when the dialog closes', async () => {
    renderHarness();
    const trigger = screen.getByText('trigger');
    act(() => trigger.focus());
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
