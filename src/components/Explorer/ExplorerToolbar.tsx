import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import XPIcon from '../XPIcon';
import {
  XPMenuBar as MenuBar,
  XPMenuSlot as MenuBarItemWrapper,
  XPMenuBarItem as MenuBarItem,
  XPMenuDropdown as DropdownMenu,
  XPMenuDropdownItem as DropdownItem,
  XPMenuSeparator as DropdownSeparator,
  XPMenuMark,
} from '../XPMenuBar';
import type { ExplorerViewMode } from '../../apps/Explorer/types';
import { EXPLORER_VIEW_MODES } from '../../apps/Explorer/types';
import { resolveOSTheme } from '../../themes/useOSTheme';

/* --- Menu bar: shared XPMenuBar primitives (#99/#78). The previous local bar
   added a hard bottom divider and surfaced (not white) dropdowns — neither
   matches real XP Explorer under Luna. --- */

/* --- Toolbar --- */
const ToolbarContainer = styled.div`
  height: 36px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TOOLBAR_GRADIENT};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 1px 3px 0;
  gap: 0;
`;

/* Back/forward buttons (green icons shown directly) */
const NavBtn = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  padding: 0 4px 0 2px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
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
    background-color: ${p =>
      p.$disabled ? 'transparent' : resolveOSTheme(p.theme).tokens.GREY_DE};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)')};

    & > * {
      transform: ${p => (p.$disabled ? 'none' : 'translate(1px, 1px)')};
    }
  }
`;

const NavLabel = styled.span`
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  white-space: nowrap;
`;

const NavDropArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
  padding-left: 2px;
`;

/* Normal toolbar buttons (search/folders/up) */
const ToolBtn = styled.button<{ $disabled?: boolean; $active?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  height: 100%;
  padding: 0 6px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  /* Pressed/toggled look (e.g. Folders pane active) — sunken XP toolbar button. */
  background: ${p => (p.$active ? resolveOSTheme(p.theme).tokens.GREY_DE : 'transparent')};
  border: 1px solid ${p => (p.$active ? 'rgb(185, 185, 185)' : 'rgba(0, 0, 0, 0)')};
  box-shadow: ${p => (p.$active ? 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)' : 'none')};
  border-radius: 3px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.7 : 1)};
  filter: ${p => (p.$disabled ? 'grayscale(1)' : 'none')};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  white-space: nowrap;

  &:hover {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgba(0, 0, 0, 0.1)')};
    box-shadow: ${p => (p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(0, 0, 0, 0.1)')};
  }
  &:active {
    border: ${p => (p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgb(185, 185, 185)')};
    background-color: ${p =>
      p.$disabled ? 'transparent' : resolveOSTheme(p.theme).tokens.GREY_DE};
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
type DropdownActionEntry = {
  label: string;
  disabled?: boolean;
  action?: () => void;
  checked?: boolean;
};
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
  /** Current file-list view mode (#120 / #211). */
  view?: ExplorerViewMode;
  /** Switch the file-list view mode (#120 / #211). */
  onViewChange?: (mode: ExplorerViewMode) => void;
  /** Whether the Folders tree pane is showing (#120). */
  foldersOpen?: boolean;
  /** Toggle the Folders tree pane (#120). */
  onToggleFolders?: () => void;
}

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  onBack,
  onForward,
  onUp,
  onRefresh: _onRefresh,
  canGoBack = false,
  canGoForward = false,
  canGoUp = false,
  view = 'icons',
  onViewChange,
  foldersOpen = false,
  onToggleFolders,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<ExplorerMenuKey | null>(null);
  // The toolbar "Views" button opens the same five-option chooser as the menu-bar
  // View submenu (#211), anchored to the button.
  const viewsBtnRef = useRef<HTMLDivElement>(null);
  const [viewsOpen, setViewsOpen] = useState(false);

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

  useEffect(() => {
    if (!viewsOpen) return;
    const close = (event: MouseEvent) => {
      if (viewsBtnRef.current && !viewsBtnRef.current.contains(event.target as Node)) {
        setViewsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [viewsOpen]);

  // The five XP views, in menu order, with their i18n labels — shared by the
  // menu-bar View submenu and the toolbar Views dropdown (#211).
  const viewMenuKey: Record<ExplorerViewMode, string> = {
    thumbnails: 'explorer.menuItems.thumbnails',
    tiles: 'explorer.menuItems.tiles',
    icons: 'explorer.menuItems.icons',
    list: 'explorer.menuItems.list',
    details: 'explorer.menuItems.details',
  };
  const viewEntries = useMemo<DropdownEntry[]>(
    () =>
      EXPLORER_VIEW_MODES.map(mode => ({
        label: t(viewMenuKey[mode]),
        action: () => onViewChange?.(mode),
        checked: view === mode,
      })),
    // viewMenuKey is a static literal; only translation/view/handler change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, view, onViewChange]
  );

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
          ...viewEntries,
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
    [_onRefresh, t, viewEntries]
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
                      <XPMenuMark>{entry.checked ? '●' : ''}</XPMenuMark>
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
        {/* Back */}
        <NavBtn
          $disabled={!canGoBack}
          onClick={canGoBack ? onBack : undefined}
          title={t('explorer.back')}
        >
          <XPIcon name="back" size={24} />
          <NavLabel>{t('explorer.back')}</NavLabel>
          <NavDropArrow>▾</NavDropArrow>
        </NavBtn>

        {/* Forward */}
        <NavBtn
          $disabled={!canGoForward}
          onClick={canGoForward ? onForward : undefined}
          title={t('explorer.forward')}
        >
          <XPIcon name="forward" size={24} />
          <NavDropArrow>▾</NavDropArrow>
        </NavBtn>

        {/* Up */}
        <ToolBtn $disabled={!canGoUp} onClick={canGoUp ? onUp : undefined} title={t('explorer.up')}>
          <XPIcon name="up" size={24} />
        </ToolBtn>

        <Separator />

        {/* Search */}
        <ToolBtn title={t('explorer.search')}>
          <XPIcon name="search" size={16} />
          {t('explorer.search')}
        </ToolBtn>

        {/* Folders - toggles the Folders tree pane (#120) */}
        <ToolBtn
          title={t('explorer.folders')}
          $active={foldersOpen}
          aria-pressed={foldersOpen}
          onClick={onToggleFolders}
        >
          <XPIcon name="folder_open_toolbar" size={22} />
          {t('explorer.folders')}
        </ToolBtn>

        <Separator />

        {/* View - opens the five-view chooser dropdown, XP-style (#211) */}
        <MenuBarItemWrapper ref={viewsBtnRef}>
          <ToolBtn
            title={t('explorer.view')}
            $active={viewsOpen}
            aria-haspopup="menu"
            aria-expanded={viewsOpen}
            onClick={() => setViewsOpen(o => !o)}
          >
            <XPIcon name="views" size={16} />
            <span style={{ fontSize: 9, marginLeft: 1 }}>▾</span>
          </ToolBtn>
          {viewsOpen && (
            <DropdownMenu role="menu" style={{ left: 'auto', right: 0, top: 34, minWidth: 140 }}>
              {viewEntries.map((entry, index) =>
                isSeparatorEntry(entry) ? (
                  <DropdownSeparator key={`vsep-${index}`} />
                ) : (
                  <DropdownItem
                    key={entry.label}
                    type="button"
                    onClick={() => {
                      entry.action?.();
                      setViewsOpen(false);
                    }}
                  >
                    <XPMenuMark>{entry.checked ? '●' : ''}</XPMenuMark>
                    {entry.label}
                  </DropdownItem>
                )
              )}
            </DropdownMenu>
          )}
        </MenuBarItemWrapper>
      </ToolbarContainer>
    </>
  );
};

export default ExplorerToolbar;
