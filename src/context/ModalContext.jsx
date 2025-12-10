import React, { createContext, useState, useContext, useCallback } from 'react';
import XPAlert from '../components/XPAlert';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState(null);

    const showModal = useCallback((title, message, type = 'info') => {
        setModal({ title, message, type });
    }, []);

    const hideModal = useCallback(() => {
        setModal(null);
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {modal && (
                <XPAlert
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    onClose={hideModal}
                />
            )}
        </ModalContext.Provider>
    );
};
