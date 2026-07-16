import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import XPAlert from '../components/XPAlert';
import XPInput from '../components/XPInput';
import XPConfirm from '../components/XPConfirm';
import PasswordDialog from '../components/PasswordDialog';
import { useOptionalActiveWindowId, useOptionalWindows } from './WindowManagerContext';
import { sounds } from '../utils/soundManager';
import type { XPDialogPlacement } from '../components/XPDialogChrome';

const getOwnerPlacement = (parentWindowId: string | null): XPDialogPlacement | undefined => {
  if (!parentWindowId || typeof document === 'undefined') return undefined;
  const owner = Array.from(document.querySelectorAll<HTMLElement>('[data-window-id]')).find(
    element => element.dataset.windowId === parentWindowId
  );
  if (!owner) return undefined;

  const rect = owner.getBoundingClientRect();
  const ownerZIndex = Number.parseInt(getComputedStyle(owner).zIndex, 10);
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    // The modal is rendered after the desktop, so the owner's own stacking
    // level keeps it above that owner. A subsequently focused independent
    // window receives the next z-index and can correctly cover the dialog.
    zIndex: Number.isFinite(ownerZIndex) ? ownerZIndex : 99999,
  };
};

export interface ModalContextType {
  showModal: (title: string, message: string, type?: 'info' | 'warning' | 'error') => Promise<void>;
  hideModal: () => void;
  showInput: (title: string, message: string, defaultValue?: string) => Promise<string | null>;
  showPasswordDialog: (options: {
    title: string;
    message: string;
    hint?: string;
    correctPassword: string;
    onFail?: () => void;
  }) => Promise<boolean>;
  showConfirm: (
    title: string,
    message: string,
    type?: 'question' | 'info' | 'warning' | 'error',
    confirmLabel?: string,
    cancelLabel?: string
  ) => Promise<boolean>;
  dialog: {
    alert: (opts: {
      title: string;
      message: string;
      type?: 'info' | 'warning' | 'error';
    }) => Promise<void>;
    confirm: (opts: {
      title: string;
      message: string;
      type?: 'question' | 'info' | 'warning' | 'error';
      confirmLabel?: string;
      cancelLabel?: string;
    }) => Promise<boolean>;
    prompt: (opts: {
      title: string;
      message: string;
      defaultValue?: string;
    }) => Promise<string | null>;
    // onFail fires on each incorrect entry (the dialog stays open for retries)
    // so callers can surface a password:fail event with the target/attempt (#116).
    password: (opts: {
      title: string;
      message: string;
      hint?: string;
      correctPassword: string;
      onFail?: () => void;
    }) => Promise<boolean>;
  };
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalInteractionState {
  blockedWindowId: string | null;
  signalBlockedInteraction: () => void;
}

const ModalInteractionContext = createContext<ModalInteractionState>({
  blockedWindowId: null,
  signalBlockedInteraction: () => {},
});

export const useModalInteraction = (): ModalInteractionState => useContext(ModalInteractionContext);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeWindowId = useOptionalActiveWindowId();
  const windows = useOptionalWindows();
  const [attentionSequence, setAttentionSequence] = useState(0);
  const [modal, setModal] = useState<null | {
    mode: 'alert' | 'confirm' | 'input' | 'password';
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'question';
    confirmLabel?: string;
    cancelLabel?: string;
    defaultValue?: string;
    hint?: string;
    correctPassword?: string;
    onClose?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    onOk?: (value: string) => void;
    onSuccess?: () => void;
    onFail?: () => void;
    parentWindowId: string | null;
    placement?: XPDialogPlacement;
  }>(null);

  const ownerWindow = modal?.parentWindowId
    ? windows?.find(window => window.id === modal.parentWindowId)
    : undefined;
  const ownerVisible =
    !modal?.parentWindowId ||
    (!!ownerWindow &&
      !ownerWindow.isMinimized &&
      !ownerWindow.isHidden &&
      ownerWindow.transition !== 'minimize');
  const modalActive = !modal?.parentWindowId || activeWindowId === modal.parentWindowId;

  useEffect(() => {
    if (!modal?.parentWindowId || windows === null || ownerWindow) return;
    if (modal.mode === 'alert') modal.onClose?.();
    else modal.onCancel?.();
  }, [modal, ownerWindow, windows]);

  const playDialogSound = useCallback((type?: 'info' | 'warning' | 'error' | 'question') => {
    if (type === 'error') sounds.criticalStop();
    else if (type === 'warning') sounds.exclamation();
    else if (type === 'info') sounds.notify();
  }, []);

  const signalBlockedInteraction = useCallback(() => {
    if (!modal?.parentWindowId) return;
    sounds.ding();
    setAttentionSequence(sequence => sequence + 1);
  }, [modal?.parentWindowId]);

  // Show alert modal (Promise<void>)
  const showModal = useCallback(
    (
      title: string,
      message: string,
      type: 'info' | 'warning' | 'error' = 'info'
    ): Promise<void> => {
      return new Promise(resolve => {
        playDialogSound(type);
        const parentWindowId = activeWindowId;
        setModal({
          mode: 'alert',
          title,
          message,
          type,
          parentWindowId,
          placement: getOwnerPlacement(parentWindowId),
          onClose: () => {
            setModal(null);
            resolve();
          },
        });
      });
    },
    [activeWindowId, playDialogSound]
  );

  const hideModal = useCallback(() => setModal(null), []);

  // Show confirm modal (Promise<boolean>)
  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      type: 'question' | 'info' | 'warning' | 'error' = 'question',
      confirmLabel?: string,
      cancelLabel?: string
    ): Promise<boolean> => {
      return new Promise(resolve => {
        playDialogSound(type);
        const parentWindowId = activeWindowId;
        setModal({
          mode: 'confirm',
          title,
          message,
          type,
          confirmLabel,
          cancelLabel,
          parentWindowId,
          placement: getOwnerPlacement(parentWindowId),
          onConfirm: () => {
            setModal(null);
            resolve(true);
          },
          onCancel: () => {
            setModal(null);
            resolve(false);
          },
        });
      });
    },
    [activeWindowId, playDialogSound]
  );

  // Show input modal (Promise<string | null>)
  const showInput = useCallback(
    (title: string, message: string, defaultValue = ''): Promise<string | null> => {
      return new Promise(resolve => {
        const parentWindowId = activeWindowId;
        setModal({
          mode: 'input',
          title,
          message,
          defaultValue,
          parentWindowId,
          placement: getOwnerPlacement(parentWindowId),
          onOk: value => {
            setModal(null);
            resolve(value);
          },
          onCancel: () => {
            setModal(null);
            resolve(null);
          },
        });
      });
    },
    [activeWindowId]
  );

  // Show password dialog (Promise<boolean>)
  const showPasswordDialog = useCallback(
    (options: {
      title: string;
      message: string;
      hint?: string;
      correctPassword: string;
      onFail?: () => void;
    }): Promise<boolean> => {
      return new Promise(resolve => {
        const parentWindowId = activeWindowId;
        setModal({
          mode: 'password',
          ...options,
          parentWindowId,
          placement: getOwnerPlacement(parentWindowId),
          onSuccess: () => {
            setModal(null);
            resolve(true);
          },
          onCancel: () => {
            setModal(null);
            resolve(false);
          },
        });
      });
    },
    [activeWindowId]
  );

  // Unified dialog object for useApp
  const dialog = useMemo(
    () => ({
      alert: (opts: { title: string; message: string; type?: 'info' | 'warning' | 'error' }) =>
        showModal(opts.title, opts.message, opts.type),
      confirm: (opts: {
        title: string;
        message: string;
        type?: 'question' | 'info' | 'warning' | 'error';
        confirmLabel?: string;
        cancelLabel?: string;
      }) => showConfirm(opts.title, opts.message, opts.type, opts.confirmLabel, opts.cancelLabel),
      prompt: (opts: { title: string; message: string; defaultValue?: string }) =>
        showInput(opts.title, opts.message, opts.defaultValue),
      password: (opts: {
        title: string;
        message: string;
        hint?: string;
        correctPassword: string;
        onFail?: () => void;
      }) => showPasswordDialog(opts),
    }),
    [showModal, showConfirm, showInput, showPasswordDialog]
  );

  const contextValue: ModalContextType = {
    showModal,
    hideModal,
    showInput,
    showPasswordDialog,
    showConfirm,
    dialog,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      <ModalInteractionContext.Provider
        value={{ blockedWindowId: modal?.parentWindowId ?? null, signalBlockedInteraction }}
      >
        {children}

        {ownerVisible && modal?.mode === 'alert' && (
          <XPAlert
            title={modal.title}
            message={modal.message}
            type={modal.type as 'info' | 'warning' | 'error' | undefined}
            attentionSequence={attentionSequence}
            placement={modal.placement}
            isActive={modalActive}
            onClose={modal.onClose || (() => setModal(null))}
          />
        )}
        {ownerVisible && modal?.mode === 'confirm' && (
          <XPConfirm
            title={modal.title}
            message={modal.message}
            type={modal.type as 'question' | 'info' | 'warning' | 'error' | undefined}
            confirmLabel={modal.confirmLabel}
            cancelLabel={modal.cancelLabel}
            attentionSequence={attentionSequence}
            placement={modal.placement}
            isActive={modalActive}
            onConfirm={modal.onConfirm || (() => setModal(null))}
            onCancel={modal.onCancel || (() => setModal(null))}
          />
        )}
        {ownerVisible && modal?.mode === 'input' && (
          <XPInput
            title={modal.title}
            message={modal.message}
            defaultValue={modal.defaultValue}
            attentionSequence={attentionSequence}
            placement={modal.placement}
            isActive={modalActive}
            onOk={modal.onOk || (() => setModal(null))}
            onCancel={modal.onCancel || (() => setModal(null))}
          />
        )}
        {ownerVisible && modal?.mode === 'password' && (
          <PasswordDialog
            title={modal.title}
            message={modal.message}
            hint={modal.hint}
            correctPassword={modal.correctPassword || ''}
            attentionSequence={attentionSequence}
            placement={modal.placement}
            isActive={modalActive}
            onSuccess={modal.onSuccess || (() => setModal(null))}
            onCancel={modal.onCancel || (() => setModal(null))}
            onFail={modal.onFail}
          />
        )}
      </ModalInteractionContext.Provider>
    </ModalContext.Provider>
  );
};
