import React, { createContext, useState, useContext, useCallback } from 'react';
import XPAlert from '../components/XPAlert';
import XPInput from '../components/XPInput';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    const showModal = useCallback((title, message, type = 'info') => {
        setModal({
            mode: 'alert',
            title,
            message,
            type,
            onClose: () => setModal(null)
        });
    }, []);

    const hideModal = useCallback(() => {
        setModal(null);
    }, []);

    const showInput = useCallback((title, message, defaultValue = '') => {
        return new Promise((resolve) => {
            setModal({
                mode: 'input',
                title,
                message,
                defaultValue,
                onOk: (value) => {
                    setModal(null);
                    resolve(value);
                },
                onCancel: () => {
                    setModal(null);
                    resolve(null);
                }
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal, showInput }}>
            {children}
            {modal && modal.mode === 'alert' && (
                <XPAlert
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    onClose={modal.onClose}
                />
            )}
            {modal && modal.mode === 'input' && (
                <XPInput
                    title={modal.title}
                    message={modal.message}
                    defaultValue={modal.defaultValue}
                    onOk={modal.onOk}
                    onCancel={modal.onCancel}
                />
            )}
        </ModalContext.Provider>
    );
};
