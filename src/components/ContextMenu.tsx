// @ts-nocheck: temporary suppression of pre-existing type errors during incremental migration
import React, { useEffect, useRef, useLayoutEffect, forwardRef, useCallback } from 'react';
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

    &:hover > .submenu {
        display: block;
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

const SubMenuContainer = styled.div`
    display: none;
    position: absolute;
    left: calc(100% - 1px);
    top: -2px;
    background: #F0F0F0;
    border: 1px solid #000000;
    box-shadow: 2px 2px 0px #808080;
    padding: 1px;
    min-width: 140px;
    z-index: 2147483648;
`;

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  menuItems: MenuItem[];
}

const MenuRow = ({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) => {
  if (item.type === 'separator') {
    return <MenuSeparator />;
  }

  const hasSubmenu = item.submenu && item.submenu.length > 0;

  return (
    <MenuItemComponent
      onClick={() => {
        if (!item.disabled && item.action && !hasSubmenu) {
          item.action();
          onClose();
        }
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
      {hasSubmenu && <SubMenuIndicator>▶</SubMenuIndicator>}
      {hasSubmenu && (
        <SubMenuContainer className="submenu">
          {item.submenu.map((subItem, subIndex) => (
            <MenuRow
              key={subIndex}
              item={subItem}
              onClose={onClose}
            />
          ))}
        </SubMenuContainer>
      )}
    </MenuItemComponent>
  );
};

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(({ visible, x, y, onClose, menuItems }, ref) => {
    const menuRef = useRef<HTMLDivElement>(null);

    const setRef = useCallback((el: HTMLDivElement | null) => {
        menuRef.current = el;
        if (typeof ref === 'function') {
            ref(el);
        } else if (ref) {
            ref.current = el;
        }
    }, [ref]);

    useLayoutEffect(() => {
        if (visible && menuRef.current) {
            menuRef.current.style.left = `${x}px`;
            menuRef.current.style.top = `${y}px`;

            const rect = menuRef.current.getBoundingClientRect();
            let finalX = x;
            let finalY = y;

            if (x + rect.width > window.innerWidth) {
                finalX = x - rect.width;
            }
            if (finalX < 0) finalX = 0;

            if (y + rect.height > window.innerHeight) {
                finalY = y - rect.height;
            }
            if (finalY < 0) finalY = 0;

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
                if (menuRef.current && menuRef.current.contains(event.target as Node)) {
                    return;
                }

                if (event.defaultPrevented) {
                    return;
                }

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
        <ContextMenuContainer ref={setRef} x={x} y={y}>
            {menuItems.map((item, index) => (
                <MenuRow
                  key={index}
                  item={item}
                  onClose={onClose}
                />
            ))}
        </ContextMenuContainer>,
        document.body
    );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
