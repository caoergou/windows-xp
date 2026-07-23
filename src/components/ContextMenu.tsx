import React, {
  useEffect,
  useRef,
  useLayoutEffect,
  forwardRef,
  useCallback,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';
import { useXPEventBus } from '../context/EventBusContext';
import { MenuItem } from '../types';
import { resolveOSTheme } from '../themes/useOSTheme';

const ContextMenuContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  box-sizing: border-box;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
  padding: 2px;
  z-index: 2147483647;
  min-width: 150px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
`;

const MenuItemComponent = styled.div<{ $disabled?: boolean; $default?: boolean }>`
  box-sizing: border-box;
  min-height: ${({ theme }) => resolveOSTheme(theme).tokens.MENU_ITEM_HEIGHT}px;
  padding: 3px 24px 3px 26px;
  cursor: default;
  display: flex;
  align-items: center;
  color: ${props =>
    props.$disabled
      ? resolveOSTheme(props.theme).tokens.GREY_77
      : resolveOSTheme(props.theme).tokens.BLACK};
  position: relative;
  font-weight: ${({ $default }) => ($default ? 700 : 400)};
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};

  &:hover {
    background-color: ${props =>
      props.$disabled
        ? resolveOSTheme(props.theme).tokens.SURFACE
        : resolveOSTheme(props.theme).tokens.MENU_HIGHLIGHT};
    color: ${props =>
      props.$disabled
        ? resolveOSTheme(props.theme).tokens.GREY_77
        : resolveOSTheme(props.theme).tokens.WHITE};
  }

  ${({ $disabled, theme }) =>
    $disabled ? `text-shadow: 1px 1px ${resolveOSTheme(theme).tokens.WHITE};` : ''}

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
  background: ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  box-shadow: 0 1px ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  margin: 3px 2px 4px;
`;

const SubMenuIndicator = styled.span`
  position: absolute;
  right: 8px;
  font-size: 10px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const SubMenuContainer = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  position: absolute;
  left: calc(100% - 1px);
  top: -2px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5);
  padding: 2px;
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

const MenuRow = ({ item, onClose }: { item: MenuItem; onClose: () => void }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
    },
    []
  );

  if (item.type === 'separator') {
    return <MenuSeparator role="separator" />;
  }

  const hasSubmenu = !!item.submenu && item.submenu.length > 0;

  return (
    <MenuItemComponent
      role="menuitem"
      aria-disabled={item.disabled || undefined}
      onMouseEnter={() => {
        if (!hasSubmenu) return;
        submenuTimerRef.current = setTimeout(() => setSubmenuOpen(true), 400);
      }}
      onMouseLeave={() => {
        if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
        submenuTimerRef.current = null;
        setSubmenuOpen(false);
      }}
      onClick={() => {
        if (!item.disabled && item.action && !hasSubmenu) {
          sounds.menuCommand();
          item.action();
          onClose();
        }
      }}
      $disabled={item.disabled}
      $default={item.default}
    >
      {item.icon && (
        <div className="icon-wrapper">
          <XPIcon name={item.icon} size={16} />
        </div>
      )}
      <span className="menu-label">{item.label}</span>
      {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
      {hasSubmenu && (
        <SubMenuIndicator>
          <svg width="6" height="10" viewBox="0 0 6 10">
            <path d="M0 0 L6 5 L0 10 Z" fill="currentColor" />
          </svg>
        </SubMenuIndicator>
      )}
      {hasSubmenu && (
        <SubMenuContainer $open={submenuOpen} className="submenu" role="menu">
          {item.submenu?.map((subItem, subIndex) => (
            <MenuRow key={subIndex} item={subItem} onClose={onClose} />
          ))}
        </SubMenuContainer>
      )}
    </MenuItemComponent>
  );
};

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ visible, x, y, onClose, menuItems }, ref) => {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const bus = useXPEventBus();

    // One emission per open, from the single shared context-menu layer. Call
    // sites can enrich the payload with `target`/`path` later; the bare signal
    // already tells listeners a right-click menu was raised.
    const wasVisibleRef = useRef(false);
    useEffect(() => {
      if (visible && !wasVisibleRef.current) bus.emit({ type: 'contextmenu:open' });
      wasVisibleRef.current = visible;
    }, [visible, bus]);

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        menuRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      },
      [ref]
    );

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

        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
          document.removeEventListener('mousedown', handleClickOutside, true);
          document.removeEventListener('contextmenu', handleContextMenu);
        };
      }
    }, [visible, onClose]);

    if (!visible) return null;

    return createPortal(
      <ContextMenuContainer
        ref={setRef}
        role="menu"
        $x={x}
        $y={y}
        className="windows-xp-portal"
        data-testid="context-menu"
        data-xp-context-boundary="true"
        onMouseDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
        onContextMenu={event => event.stopPropagation()}
      >
        {menuItems.map((item, index) => (
          <MenuRow key={index} item={item} onClose={onClose} />
        ))}
      </ContextMenuContainer>,
      document.body
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
