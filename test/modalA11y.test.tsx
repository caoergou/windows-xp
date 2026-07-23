/**
 * Modal focus management & keyboard a11y (#124): role/aria, focus trap, Esc =
 * cancel, and focus restore to the invoker on close (DLG-03/04).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { ModalProvider, useModal } from '../src/context/ModalContext';
import { sounds } from '../src/utils/soundManager';

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

function SoundHarness() {
  const { dialog } = useModal();
  return (
    <>
      <button onClick={() => dialog.alert({ title: 'Error', message: 'x', type: 'error' })}>
        error
      </button>
      <button onClick={() => dialog.alert({ title: 'Warning', message: 'x', type: 'warning' })}>
        warning
      </button>
      <button onClick={() => dialog.alert({ title: 'Info', message: 'x', type: 'info' })}>
        info
      </button>
    </>
  );
}

function ChoiceHarness({
  onResult,
}: {
  onResult: (value: 'confirm' | 'alternate' | 'cancel') => void;
}) {
  const { dialog } = useModal();
  return (
    <button
      onClick={() =>
        dialog
          .choice({
            title: 'Save changes',
            message: 'Save before closing?',
            confirmLabel: 'Save',
            alternateLabel: "Don't Save",
            cancelLabel: 'Cancel',
          })
          .then(onResult)
      }
    >
      choice trigger
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
  afterEach(() => vi.restoreAllMocks());

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

  it('distinguishes an alternate action from cancel in a three-button choice', async () => {
    const onResult = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <ModalProvider>
          <ChoiceHarness onResult={onResult} />
        </ModalProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByText('choice trigger'));
    fireEvent.click(await screen.findByText("Don't Save"));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith('alternate'));

    fireEvent.click(screen.getByText('choice trigger'));
    fireEvent.click(await screen.findByLabelText('Close'));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith('cancel'));
  });

  it('maps error, warning and information dialogs to XP system sounds', async () => {
    const criticalStop = vi.spyOn(sounds, 'criticalStop').mockImplementation(() => {});
    const exclamation = vi.spyOn(sounds, 'exclamation').mockImplementation(() => {});
    const notify = vi.spyOn(sounds, 'notify').mockImplementation(() => {});
    render(
      <I18nextProvider i18n={i18n}>
        <ModalProvider>
          <SoundHarness />
        </ModalProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByText('error'));
    expect(criticalStop).toHaveBeenCalledOnce();
    fireEvent.click(await screen.findByText('OK'));
    fireEvent.click(screen.getByText('warning'));
    expect(exclamation).toHaveBeenCalledOnce();
    fireEvent.click(await screen.findByText('OK'));
    fireEvent.click(screen.getByText('info'));
    expect(notify).toHaveBeenCalledOnce();
  });
});
