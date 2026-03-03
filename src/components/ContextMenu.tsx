import { useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import XPIcon from './XPIcon';
import { MenuItem } from '../types';

const ContextMenuContainer = styled.div`
    position: fixed;
    background: #F0F0F0;
    border: 1px solid #000000;
    box-shadow: 2px 2px 0px #808080;
    padding: 1px;
    z-index: 2147483647;
    min-width: 150px;
    font-size: 12px;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
`;

const MenuItemComponent = styled.div`
    padding: 3px 20px 3px 20px;
    cursor: default;
    display: flex;
    align-items: center;
    color: ${props => props.$disabled ? '#777' : '#000'};
    position: relative;
    border: 1px solid transparent;
    cursor: default;
    background-color: #F0F0F0;

    &:hover {
        background-color: ${props => props.$disabled ? '#F0F0F0' : '#316AC5'};
        color: ${props => props.$disabled ? '#777' : 'white'};
        border: 1px solid #103A7A;
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

    .shortcut {
        position: absolute;
        right: 10px;
        font-size: 11px;
        opacity: 0.7;
    }
`;

const MenuSeparator = styled.div`
    height: 1px;
    background: #808080;
    margin: 4px 2px;
`;

const SubMenuIndicator = styled.span`
    position: absolute;
    right: 8px;
    font-size: 10px;
    color: #666;
`;

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  menuItems: MenuItem[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, onClose, menuItems }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (visible && menuRef.current) {
            // 首先设置到指定位置，以便获取正确的尺寸
            menuRef.current.style.left = `${x}px`;
            menuRef.current.style.top = `${y}px`;

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

            // 应用最终计算出的位置
            menuRef.current.style.left = `${finalX}px`;
            menuRef.current.style.top = `${finalY}px`;
        }
    }, [x, y, visible]);

    useEffect(() => {
        if (visible) {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    onClose();
                }
            };

            const handleContextMenu = (event: MouseEvent) => {
                // Don't close if clicked inside
                if (menuRef.current && menuRef.current.contains(event.target as Node)) {
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

    return createPortal(
        <ContextMenuContainer ref={menuRef} x={x} y={y}>
            {menuItems.map((item, index) => {
                if (item.type === 'separator') {
                    return <MenuSeparator key={index} />;
                }

                return (
                    <MenuItemComponent
                        key={index}
                        onClick={() => {
                            if (!item.disabled && item.action) {
                                item.action();
                            }
                            onClose();
                        }}
                        $disabled={item.disabled}
                    >
                        {item.icon && (
                            <div className="icon-wrapper">
                                <XPIcon name={item.icon} size={16} />
                            </div>
                        )}
                        {item.label}
                        {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                        {item.submenu && <SubMenuIndicator>▶</SubMenuIndicator>}
                    </MenuItemComponent>
                );
            })}
        </ContextMenuContainer>,
        document.body
    );
};

export default ContextMenu;
