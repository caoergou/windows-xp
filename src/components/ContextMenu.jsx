import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ContextMenuContainer = styled.div`
    position: fixed;
    background: white;
    border: 1px solid #0055EA;
    border-radius: 3px;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    padding: 2px;
    z-index: 99999;
    min-width: 150px;
    font-size: 12px;
`;

const MenuItem = styled.div`
    padding: 8px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #333;

    &:hover {
        background: #316AC5;
        color: white;
    }

    &:active {
        background: #254587;
    }

    img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }
`;

const MenuSeparator = styled.div`
    height: 1px;
    background: #DDD;
    margin: 2px 0;
`;

const ContextMenu = ({ visible, x, y, onClose, menuItems }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleContextMenu = (event) => {
            // Don't close the menu if contextmenu happens inside the menu
            if (menuRef.current && menuRef.current.contains(event.target)) {
                return;
            }
            event.preventDefault();
            onClose();
        };

        if (visible) {
            // Use setTimeout to avoid immediate triggering
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
                document.addEventListener('contextmenu', handleContextMenu);
            }, 100);

            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, [visible, onClose]);

    useEffect(() => {
        if (visible && menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();

            let adjustedX = x;
            let adjustedY = y;

            // Adjust if menu goes off screen right
            if (x + rect.width > window.innerWidth) {
                adjustedX = window.innerWidth - rect.width - 5;
            }

            // Adjust if menu goes off screen bottom
            if (y + rect.height > window.innerHeight) {
                adjustedY = window.innerHeight - rect.height - 5;
            }

            // Adjust if menu goes off screen left
            if (adjustedX < 0) {
                adjustedX = 5;
            }

            // Adjust if menu goes off screen top
            if (adjustedY < 0) {
                adjustedY = 5;
            }

            menu.style.left = `${adjustedX}px`;
            menu.style.top = `${adjustedY}px`;
        }
    }, [visible, x, y]);

    if (!visible) return null;

    return (
        <ContextMenuContainer ref={menuRef}>
            {menuItems.map((item, index) => {
                if (item.type === 'separator') {
                    return <MenuSeparator key={index} />;
                }

                return (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            if (item.action) {
                                item.action();
                            }
                            onClose();
                        }}
                        disabled={item.disabled}
                    >
                        {item.icon && <img src={item.icon} alt="" onError={(e) => {e.target.style.display='none'}} />}
                        {item.label}
                    </MenuItem>
                );
            })}
        </ContextMenuContainer>
    );
};

export default ContextMenu;