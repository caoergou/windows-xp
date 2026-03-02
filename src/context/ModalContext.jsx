import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import XPAlert from '../components/XPAlert';
import XPInput from '../components/XPInput';
import XPConfirm from '../components/XPConfirm';
import PasswordDialog from '../components/PasswordDialog';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    // ── 基础弹窗（Promise<void>）──────────────────────────────────────────
    const showModal = useCallback((title, message, type = 'info') => {
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

    // ── 确认框（Promise<boolean>）──────────────────────────────────────────
    const showConfirm = useCallback((title, message, type = 'question', confirmLabel, cancelLabel) => {
        return new Promise((resolve) => {
            setModal({
                mode: 'confirm',
                title,
                message,
                type,
                confirmLabel,
                cancelLabel,
                onConfirm: () => { setModal(null); resolve(true); },
                onCancel:  () => { setModal(null); resolve(false); },
            });
        });
    }, []);

    // ── 输入框（Promise<string | null>）───────────────────────────────────
    const showInput = useCallback((title, message, defaultValue = '') => {
        return new Promise((resolve) => {
            setModal({
                mode: 'input',
                title,
                message,
                defaultValue,
                onOk:    (value) => { setModal(null); resolve(value); },
                onCancel: ()     => { setModal(null); resolve(null); },
            });
        });
    }, []);

    // ── 密码框（Promise<boolean>）──────────────────────────────────────────
    const showPasswordDialog = useCallback((options) => {
        return new Promise((resolve) => {
            setModal({
                mode: 'password',
                ...options,
                onSuccess: () => { setModal(null); resolve(true); },
                onCancel:  () => { setModal(null); resolve(false); },
            });
        });
    }, []);

    // ── 统一 dialog 对象（供 useApp 使用）────────────────────────────────
    const dialog = useMemo(() => ({
        alert:    (opts) => showModal(opts.title, opts.message, opts.type),
        confirm:  (opts) => showConfirm(opts.title, opts.message, opts.type, opts.confirmLabel, opts.cancelLabel),
        prompt:   (opts) => showInput(opts.title, opts.message, opts.defaultValue),
        password: (opts) => showPasswordDialog(opts),
    }), [showModal, showConfirm, showInput, showPasswordDialog]);

    return (
        <ModalContext.Provider value={{ showModal, hideModal, showInput, showPasswordDialog, showConfirm, dialog }}>
            {children}

            {modal?.mode === 'alert' && (
                <XPAlert
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    onClose={modal.onClose}
                />
            )}
            {modal?.mode === 'confirm' && (
                <XPConfirm
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    confirmLabel={modal.confirmLabel}
                    cancelLabel={modal.cancelLabel}
                    onConfirm={modal.onConfirm}
                    onCancel={modal.onCancel}
                />
            )}
            {modal?.mode === 'input' && (
                <XPInput
                    title={modal.title}
                    message={modal.message}
                    defaultValue={modal.defaultValue}
                    onOk={modal.onOk}
                    onCancel={modal.onCancel}
                />
            )}
            {modal?.mode === 'password' && (
                <PasswordDialog
                    title={modal.title}
                    message={modal.message}
                    hint={modal.hint}
                    correctPassword={modal.correctPassword}
                    onSuccess={modal.onSuccess}
                    onCancel={modal.onCancel}
                />
            )}
        </ModalContext.Provider>
    );
};
