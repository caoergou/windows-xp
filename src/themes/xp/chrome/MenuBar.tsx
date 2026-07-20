import React from 'react';
import {
  XPMenuBar,
  XPMenuBarItem,
  XPMenuDropdown,
  XPMenuDropdownItem,
  XPMenuMark,
  XPMenuSeparator,
  XPMenuSlot,
} from '../../../components/XPMenuBar';
import type { OSMenuBarProps } from '../../../os/contract';

const XPDataMenuBar: React.FC<OSMenuBarProps> = ({ menus, onCommand }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <XPMenuBar role="menubar" onMouseLeave={() => setOpenId(null)}>
      {menus.map(menu => (
        <XPMenuSlot key={menu.id}>
          <XPMenuBarItem
            type="button"
            role="menuitem"
            aria-expanded={openId === menu.id}
            $active={openId === menu.id}
            onClick={() => setOpenId(current => (current === menu.id ? null : menu.id))}
          >
            {menu.label}
          </XPMenuBarItem>
          {openId === menu.id && (
            <XPMenuDropdown role="menu">
              {menu.items.map(item =>
                item.type === 'separator' ? (
                  <XPMenuSeparator key={item.id} />
                ) : (
                  <XPMenuDropdownItem
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    $disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      onCommand(item.id);
                      setOpenId(null);
                    }}
                  >
                    <XPMenuMark />
                    <span>{item.label}</span>
                    <span>{item.shortcut}</span>
                  </XPMenuDropdownItem>
                )
              )}
            </XPMenuDropdown>
          )}
        </XPMenuSlot>
      ))}
    </XPMenuBar>
  );
};

export default XPDataMenuBar;
