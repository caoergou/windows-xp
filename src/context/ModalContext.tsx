import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import XPAlert from '../components/XPAlert';
import XPInput from '../components/XPInput';
import XPConfirm from '../components/XPConfirm';
import PasswordDialog from '../components/PasswordDialog';

export interface ModalContextType {
  showModal: (title: string, message: string, type?: 'info' | 'warning' | 'error') => Promise<void>;
  hideModal: () => void;
  showInput: (title: string, message: string, defaultValue?: string) => Promise<string | null>;
  showPasswordDialog: (options: { title: string; message: string; hint?: string; correctPassword: string; onFail?: () => void }) => Promise<boolean>;
  showConfirm: (title: string, message: string, type?: 'question' | 'info' | 'warning' | 'error', confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
  dialog: {
    alert: (opts: { title: string; message: string; type?: 'info' | 'warning' | 'error' }) => Promise<void>;
    confirm: (opts: { title: string; message: string; type?: 'question' | 'info' | 'warning' | 'error'; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
    prompt: (opts: { title: string; message: string; defaultValue?: string }) => Promise<string | null>;
    // onFail fires on each incorrect entry (the dialog stays open for retries)
    // so callers can surface a password:fail event with the target/attempt (#116).
    password: (opts: { title: string; message: string; hint?: string; correctPassword: string; onFail?: () => void }) => Promise<boolean>;
  };
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  }>(null);

  // Show alert modal (Promise<void>)
  const showModal = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'alert',
        title,
        message,
        type,
        onClose: () => { setModal(null); resolve(); },
      });
    });
  }, []);

  const hideModal = useCallback(() => setModal(null), []);

  // Show confirm modal (Promise<boolean>)
  const showConfirm = useCallback((title: string, message: string, type: 'question' | 'info' | 'warning' | 'error' = 'question', confirmLabel?: string, cancelLabel?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'confirm',
        title,
        message,
        type,
        confirmLabel,
        cancelLabel,
        onConfirm: () => { setModal(null); resolve(true); },
        onCancel: () => { setModal(null); resolve(false); },
      });
    });
  }, []);

  // Show input modal (Promise<string | null>)
  const showInput = useCallback((title: string, message: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'input',
        title,
        message,
        defaultValue,
        onOk: (value) => { setModal(null); resolve(value); },
        onCancel: () => { setModal(null); resolve(null); },
      });
    });
  }, []);

  // Show password dialog (Promise<boolean>)
  const showPasswordDialog = useCallback((options: { title: string; message: string; hint?: string; correctPassword: string; onFail?: () => void }): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'password',
        ...options,
        onSuccess: () => { setModal(null); resolve(true); },
        onCancel: () => { setModal(null); resolve(false); },
      });
    });
  }, []);

  // Unified dialog object for useApp
  const dialog = useMemo(() => ({
    alert: (opts: { title: string; message: string; type?: 'info' | 'warning' | 'error' }) => showModal(opts.title, opts.message, opts.type),
    confirm: (opts: { title: string; message: string; type?: 'question' | 'info' | 'warning' | 'error'; confirmLabel?: string; cancelLabel?: string }) => showConfirm(opts.title, opts.message, opts.type, opts.confirmLabel, opts.cancelLabel),
    prompt: (opts: { title: string; message: string; defaultValue?: string }) => showInput(opts.title, opts.message, opts.defaultValue),
    password: (opts: { title: string; message: string; hint?: string; correctPassword: string; onFail?: () => void }) => showPasswordDialog(opts),
  }), [showModal, showConfirm, showInput, showPasswordDialog]);

  const contextValue: ModalContextType = {
    showModal,
    hideModal,
    showInput,
    showPasswordDialog,
    showConfirm,
    dialog
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      {modal?.mode === 'alert' && (
        <XPAlert
          title={modal.title}
          message={modal.message}
          type={modal.type as 'info' | 'warning' | 'error' | undefined}
          onClose={modal.onClose || (() => setModal(null))}
        />
      )}
      {modal?.mode === 'confirm' && (
        <XPConfirm
          title={modal.title}
          message={modal.message}
          type={modal.type as 'question' | 'info' | 'warning' | 'error' | undefined}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          onConfirm={modal.onConfirm || (() => setModal(null))}
          onCancel={modal.onCancel || (() => setModal(null))}
        />
      )}
      {modal?.mode === 'input' && (
        <XPInput
          title={modal.title}
          message={modal.message}
          defaultValue={modal.defaultValue}
          onOk={modal.onOk || (() => setModal(null))}
          onCancel={modal.onCancel || (() => setModal(null))}
        />
      )}
      {modal?.mode === 'password' && (
        <PasswordDialog
          title={modal.title}
          message={modal.message}
          hint={modal.hint}
          correctPassword={modal.correctPassword || ''}
          onSuccess={modal.onSuccess || (() => setModal(null))}
          onCancel={modal.onCancel || (() => setModal(null))}
          onFail={modal.onFail}
        />
      )}
    </ModalContext.Provider>
  );
};
