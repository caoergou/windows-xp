import { useEffect, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';

const ContextMenuContainer = styled.div`
    position: fixed;
    background: white;
    border: 1px solid #ACA899;
    box-shadow: 4px 4px 2px rgba(0,0,0,0.5);
    padding: 2px;
    z-index: 99999;
    min-width: 150px;
    font-size: 12px;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
`;

const MenuItem = styled.div`
    padding: 4px 20px 4px 20px;
    cursor: default;
    display: flex;
    align-items: center;
    color: #000;
    position: relative;
    border: 1px solid transparent;

    &:hover {
        background-color: #316AC5;
        color: white;
        border: 1px solid #316AC5;
    }

    .icon-wrapper {
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

const MenuSeparator = styled.div`
    height: 1px;
    background: #ACA899;
    margin: 4px 2px;
`;

const ContextMenu = ({ visible, x, y, onClose, menuItems }) => {
    const menuRef = useRef(null);

    useLayoutEffect(() => {
        if (visible && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let finalX = x;
            let finalY = y;

            // Horizontal flip if it overflows right
            if (x + rect.width > window.innerWidth) {
                finalX = x - rect.width;
            }
            // Safety clamp for left edge
            if (finalX < 0) finalX = 0;

            // Vertical flip if it overflows bottom
            if (y + rect.height > window.innerHeight) {
                finalY = y - rect.height;
            }
            // Safety clamp for top edge
            if (finalY < 0) finalY = 0;

            menuRef.current.style.left = `${finalX}px`;
            menuRef.current.style.top = `${finalY}px`;
        }
    }, [x, y, visible]);

    useEffect(() => {
        if (visible) {
            const handleClickOutside = (event) => {
                if (menuRef.current && !menuRef.current.contains(event.target)) {
                    onClose();
                }
            };

            const handleContextMenu = (event) => {
                // Don't close if clicked inside
                if (menuRef.current && menuRef.current.contains(event.target)) {
                    return;
                }

                // Don't close if another handler (like Desktop) processed this event.
                // This allows the menu to move to a new position instead of closing.
                if (event.defaultPrevented) {
                    return;
                }

                // Otherwise, close the menu and prevent browser context menu
                event.preventDefault();
                onClose();
            };

            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('contextmenu', handleContextMenu);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <ContextMenuContainer ref={menuRef} x={x} y={y}>
            {menuItems.map((item, index) => {
                if (item.type === 'separator') {
                    return <MenuSeparator key={index} />;
                }

                return (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            if (!item.disabled && item.action) {
                                item.action();
                            }
                            onClose();
                        }}
                        disabled={item.disabled}
                    >
                         {item.icon && (
                            <div className="icon-wrapper">
                                <XPIcon name={item.icon} size={16} />
                            </div>
                        )}
                        {item.label}
                    </MenuItem>
                );
            })}
        </ContextMenuContainer>
    );
};

export default ContextMenu;
