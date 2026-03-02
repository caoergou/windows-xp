import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import ContextMenu from '../components/ContextMenu';

const Container = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
`;

const TextArea = styled.textarea`
    width: 100%;
    height: 100%;
    border: none;
    resize: none;
    font-family: 'Lucida Console', monospace;
    font-size: 14px;
    padding: 5px;
    outline: none;
`;

// windowId 由 Window.jsx 通过 cloneElement 自动注入，可传给 useApp(windowId)
const Notepad = ({ content, windowId }) => {
    const textareaRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0 });
    };

    const handleCopy = () => {
        const ta = textareaRef.current;
        if (ta) {
            const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
            if (selected) {
                navigator.clipboard.writeText(selected);
            }
        }
    };

    const handleSelectAll = () => {
        if (textareaRef.current) {
            textareaRef.current.select();
        }
    };

    const menuItems = [
        { label: '复制(C)', action: handleCopy },
        { type: 'separator' },
        { label: '全选(A)', action: handleSelectAll },
    ];

    return (
        <Container>
            <TextArea
                ref={textareaRef}
                defaultValue={content}
                onContextMenu={handleContextMenu}
            />
            {createPortal(
                <ContextMenu
                    visible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                    menuItems={menuItems}
                />,
                document.body
            )}
        </Container>
    );
};

export default Notepad;
