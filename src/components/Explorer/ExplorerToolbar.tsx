import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

/* ── 菜单栏 ── */
const MenuBar = styled.div`
  height: 20px;
  background: #ece9d8;
  border-bottom: 1px solid #aca899;
  display: flex;
  align-items: center;
  padding: 0 2px;
`;

const MenuBarItemWrapper = styled.div`
  position: relative;
`;

const MenuBarItem = styled.button<{ $active?: boolean }>`
  padding: 1px 6px;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  cursor: default;
  border: 1px solid transparent;
  background: ${p => (p.$active ? '#316AC5' : 'transparent')};
  color: ${p => (p.$active ? '#fff' : '#000')};
  height: 18px;

  &:hover {
    background: #316ac5;
    color: white;
    border-color: #316ac5;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 18px;
  left: 0;
  min-width: 176px;
  background: #ece9d8;
  border: 1px solid #808080;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.35);
  padding: 2px;
  z-index: 3000;
`;

const DropdownItem = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  height: 20px;
  padding: 0 22px 0 22px;
  border: 1px solid transparent;
  background: transparent;
  color: ${p => (p.$disabled ? '#808080' : '#000')};
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  text-align: left;
  white-space: nowrap;
  cursor: ${p => (p.$disabled ? 'default' : 'default')};

  &:hover {
    background: ${p => (p.$disabled ? 'transparent' : '#316AC5')};
    color: ${p => (p.$disabled ? '#808080' : '#fff')};
  }
`;

const DropdownSeparator = styled.div`
  height: 1px;
  background: #aca899;
  border-bottom: 1px solid #fff;
  margin: 3px 2px;
`;

/* ── 工具栏 ── */
const ToolbarContainer = styled.div`
  height: 36px;
  background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 1px 3px 0;
  gap: 0;
`;

/* 后退/前进按钮（直接显示绿色图标） */
const NavBtn = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  padding: 0 4px 0 2px;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0);
  border-radius: 3px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.7 : 1)};
  filter: ${p => (p.$disabled ? 'grayscale(1)' : 'none')};

  &:hover {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgba(0, 0, 0, 0.1)')};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(0, 0, 0, 0.1)')};
  }
  &:active {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgb(185, 185, 185)')};
    background-color: ${p => (p.$disabled ? 'transparent' : '#dedede')};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)')};

    & > * {
      transform: ${p => (p.$disabled ? 'none' : 'translate(1px, 1px)')};
    }
  }
`;

const NavLabel = styled.span`
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  white-space: nowrap;
`;

const NavDropArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  color: #333;
  padding-left: 2px;
`;

/* 普通工具按钮（搜索/文件夹/上） */
const ToolBtn = styled.button<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  height: 100%;
  padding: 0 6px;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0);
  border-radius: 3px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.7 : 1)};
  filter: ${p => (p.$disabled ? 'grayscale(1)' : 'none')};
  color: #000;
  white-space: nowrap;

  &:hover {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgba(0, 0, 0, 0.1)')};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(0, 0, 0, 0.1)')};
  }
  &:active {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgb(185, 185, 185)')};
    background-color: ${p => (p.$disabled ? 'transparent' : '#dedede')};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)')};

    & > * {
      transform: ${p => (p.$disabled ? 'none' : 'translate(1px, 1px)')};
    }
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 90%;
  background-color: rgba(0, 0, 0, 0.2);
  margin: 0 2px;
`;

type ExplorerMenuKey = 'file' | 'edit' | 'view' | 'favorites' | 'tools' | 'help';

type DropdownSeparatorEntry = { type: 'separator' };
type DropdownActionEntry = { label: string; disabled?: boolean; action?: () => void };
type DropdownEntry = DropdownSeparatorEntry | DropdownActionEntry;

const isSeparatorEntry = (entry: DropdownEntry): entry is DropdownSeparatorEntry =>
  (entry as DropdownSeparatorEntry).type === 'separator';

interface ExplorerToolbarProps {
  onBack?: () => void;
  onForward?: () => void;
  onUp?: () => void;
  onRefresh?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  canGoUp?: boolean;
}

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  onBack,
  onForward,
  onUp,
  onRefresh: _onRefresh,
  canGoBack = false,
  canGoForward = false,
  canGoUp = false,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<ExplorerMenuKey | null>(null);

  useEffect(() => {
    if (!openMenu) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [openMenu]);

  const menus = useMemo<Array<{ key: ExplorerMenuKey; label: string; entries: DropdownEntry[] }>>(
    () => [
      {
        key: 'file',
        label: `${t('explorer.file')}(F)`,
        entries: [
          { label: t('explorer.menuItems.newWindow'), disabled: true },
          { type: 'separator' },
          { label: t('contextMenu.delete'), disabled: true },
          { label: t('contextMenu.rename'), disabled: true },
          { type: 'separator' },
          { label: t('contextMenu.properties'), disabled: true },
          { label: t('explorer.menuItems.close'), action: () => setOpenMenu(null) },
        ],
      },
      {
        key: 'edit',
        label: `${t('explorer.edit')}(E)`,
        entries: [
          { label: t('contextMenu.cut'), disabled: true },
          { label: t('contextMenu.copy'), disabled: true },
          { label: t('contextMenu.paste'), disabled: true },
          { type: 'separator' },
          { label: t('explorer.menuItems.selectAll'), disabled: true },
        ],
      },
      {
        key: 'view',
        label: `${t('explorer.view')}(V)`,
        entries: [
          { label: t('explorer.menuItems.toolbars') },
          { label: t('explorer.menuItems.statusBar') },
          { label: t('explorer.menuItems.explorerBar') },
          { type: 'separator' },
          { label: t('explorer.menuItems.thumbnails') },
          { label: t('explorer.menuItems.tiles') },
          { label: t('explorer.menuItems.icons') },
          { label: t('explorer.menuItems.list') },
          { label: t('explorer.menuItems.details') },
          { type: 'separator' },
          { label: t('explorer.menuItems.refresh'), action: _onRefresh },
        ],
      },
      {
        key: 'favorites',
        label: `${t('explorer.favorites')}(A)`,
        entries: [
          { label: t('explorer.menuItems.addToFavorites'), disabled: true },
          { label: t('explorer.menuItems.organizeFavorites'), disabled: true },
        ],
      },
      {
        key: 'tools',
        label: `${t('explorer.tools')}(T)`,
        entries: [
          { label: t('explorer.menuItems.mapNetworkDrive'), disabled: true },
          { label: t('explorer.menuItems.disconnectNetworkDrive'), disabled: true },
          { type: 'separator' },
          { label: t('explorer.menuItems.folderOptions'), disabled: true },
        ],
      },
      {
        key: 'help',
        label: `${t('explorer.help')}(H)`,
        entries: [
          { label: t('explorer.menuItems.helpTopics'), disabled: true },
          { type: 'separator' },
          { label: t('explorer.menuItems.aboutWindows'), disabled: true },
        ],
      },
    ],
    [_onRefresh, t]
  );

  return (
    <>
      <MenuBar ref={menuRef}>
        {menus.map(menu => (
          <MenuBarItemWrapper key={menu.key}>
            <MenuBarItem
              type="button"
              $active={openMenu === menu.key}
              onClick={() => setOpenMenu(current => (current === menu.key ? null : menu.key))}
            >
              {menu.label}
            </MenuBarItem>
            {openMenu === menu.key && (
              <DropdownMenu role="menu">
                {menu.entries.map((entry, index) => {
                  if (isSeparatorEntry(entry)) {
                    return <DropdownSeparator key={`separator-${index}`} />;
                  }

                  return (
                    <DropdownItem
                      key={`${entry.label}-${index}`}
                      type="button"
                      $disabled={entry.disabled}
                      disabled={entry.disabled}
                      onClick={() => {
                        if (entry.disabled) return;
                        entry.action?.();
                        setOpenMenu(null);
                      }}
                    >
                      {entry.label}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            )}
          </MenuBarItemWrapper>
        ))}
      </MenuBar>
      <ToolbarContainer>
        {/* 后退 */}
        <NavBtn
          $disabled={!canGoBack}
          onClick={canGoBack ? onBack : undefined}
          title={t('explorer.back')}
        >
          <XPIcon name="back" size={24} />
          <NavLabel>{t('explorer.back')}</NavLabel>
          <NavDropArrow>▾</NavDropArrow>
        </NavBtn>

        {/* 前进 */}
        <NavBtn
          $disabled={!canGoForward}
          onClick={canGoForward ? onForward : undefined}
          title={t('explorer.forward')}
        >
          <XPIcon name="forward" size={24} />
          <NavDropArrow>▾</NavDropArrow>
        </NavBtn>

        {/* 向上 */}
        <ToolBtn $disabled={!canGoUp} onClick={canGoUp ? onUp : undefined} title={t('explorer.up')}>
          <XPIcon name="up" size={24} />
        </ToolBtn>

        <Separator />

        {/* 搜索 */}
        <ToolBtn title={t('explorer.search')}>
          <XPIcon name="search" size={16} />
          {t('explorer.search')}
        </ToolBtn>

        {/* 文件夹 */}
        <ToolBtn title={t('explorer.folders')}>
          <XPIcon name="folder_open_toolbar" size={22} />
          {t('explorer.folders')}
        </ToolBtn>

        <Separator />

        {/* 视图 */}
        <ToolBtn title={t('explorer.view')}>
          <XPIcon name="views" size={16} />
          <span style={{ fontSize: 9, marginLeft: 1 }}>▾</span>
        </ToolBtn>
      </ToolbarContainer>
    </>
  );
};

export default ExplorerToolbar;
