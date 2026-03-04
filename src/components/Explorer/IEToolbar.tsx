import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
`;

const MenuBar = styled.div`
    height: 20px;
    background: transparent;
    display: flex;
    align-items: center;
    padding: 0 2px;
    font-size: 11px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const MenuItemWrapper = styled.div`
    position: relative;
`;

const MenuItem = styled.div<{ $active?: boolean }>`
    padding: 2px 8px;
    cursor: pointer;
    background: ${p => p.$active ? '#316AC5' : 'transparent'};
    color: ${p => p.$active ? 'white' : 'inherit'};

    &:hover {
        background: #316AC5;
        color: white;
    }
`;

/* Windows XP 风格下拉菜单 */
const DropdownMenu = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 180px;
    background: #F0F0F0;
    border: 1px solid #000;
    box-shadow: 2px 2px 0px #808080;
    padding: 2px 0;
    z-index: 9999;
    font-size: 12px;
    font-family: Tahoma, sans-serif;
`;

const DropdownItem = styled.div<{ $disabled?: boolean }>`
    padding: 3px 24px 3px 24px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${p => p.$disabled ? '#A0A0A0' : '#000'};
    position: relative;
    white-space: nowrap;

    &:hover {
        background: ${p => p.$disabled ? 'transparent' : '#316AC5'};
        color: ${p => p.$disabled ? '#A0A0A0' : 'white'};
    }

    .shortcut {
        margin-left: 24px;
        font-size: 11px;
        color: inherit;
        opacity: 0.8;
    }
`;

const DropdownSeparator = styled.div`
    height: 1px;
    background: #808080;
    margin: 3px 2px;
`;

const ToolbarContainer = styled.div`
    height: 36px;
    background: transparent;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    padding: 1px 3px 0;
    gap: 0;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: auto;
    padding: 0 4px;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 3px;
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
    opacity: ${p => p.$disabled ? 0.7 : 1};
    filter: ${p => p.$disabled ? 'grayscale(1)' : 'none'};

    &:hover {
        border: ${p => p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgba(0, 0, 0, 0.1)'};
        box-shadow: ${p => p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(0, 0, 0, 0.1)'};
    }

    &:active {
        border: ${p => p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgb(185, 185, 185)'};
        background-color: ${p => p.$disabled ? 'transparent' : '#dedede'};
        box-shadow: ${p => p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)'};

        & > * {
            transform: ${p => p.$disabled ? 'none' : 'translate(1px, 1px)'};
        }
    }
`;

const ToolbarButton = styled.button`
    display: flex;
    align-items: center;
    gap: 3px;
    height: 100%;
    padding: 0 6px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.1);
    }

    &:active {
        border: 1px solid rgb(185, 185, 185);
        background-color: #dedede;
        box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.7);

        & > * {
            transform: translate(1px, 1px);
        }
    }
`;

const Separator = styled.div`
    width: 1px;
    height: 90%;
    background-color: rgba(0, 0, 0, 0.2);
    margin: 0 2px;
`;

type MenuKey = 'file' | 'edit' | 'view' | 'favorites' | 'tools' | 'help' | null;

const MENUS: Record<Exclude<MenuKey, null>, { labelKey: string; shortcut?: string; separator?: boolean; disabled?: boolean }[]> = {
    file: [
        { labelKey: 'internetExplorer.menuitems.new', shortcut: 'Ctrl+N' },
        { labelKey: 'internetExplorer.menuitems.open', shortcut: 'Ctrl+O' },
        { labelKey: 'internetExplorer.menuitems.edit' },
        { labelKey: 'internetExplorer.menuitems.save', shortcut: 'Ctrl+S', disabled: true },
        { labelKey: 'internetExplorer.menuitems.saveAs' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.pageSetup' },
        { labelKey: 'internetExplorer.menuitems.printPreview' },
        { labelKey: 'internetExplorer.menuitems.print', shortcut: 'Ctrl+P' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.close' },
    ],
    edit: [
        { labelKey: 'internetExplorer.menuitems.cut', shortcut: 'Ctrl+X' },
        { labelKey: 'internetExplorer.menuitems.copy', shortcut: 'Ctrl+C' },
        { labelKey: 'internetExplorer.menuitems.paste', shortcut: 'Ctrl+V' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.selectAll', shortcut: 'Ctrl+A' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.find', shortcut: 'Ctrl+F' },
    ],
    view: [
        { labelKey: 'internetExplorer.menuitems.toolbar' },
        { labelKey: 'internetExplorer.menuitems.statusBar' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.refresh', shortcut: 'F5' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.textSize' },
        { labelKey: 'internetExplorer.menuitems.encoding' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.fullScreen', shortcut: 'F11' },
    ],
    favorites: [
        { labelKey: 'internetExplorer.menuitems.addToFavorites' },
        { labelKey: 'internetExplorer.menuitems.organizeFavorites' },
    ],
    tools: [
        { labelKey: 'internetExplorer.menuitems.email' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.internetOptions' },
    ],
    help: [
        { labelKey: 'internetExplorer.menuitems.helpTopics' },
        { label: '', separator: true },
        { labelKey: 'internetExplorer.menuitems.about' },
    ],
};

interface IEToolbarProps {
    onBack?: () => void;
    onForward?: () => void;
    onStop?: () => void;
    onRefresh?: () => void;
    onHome?: () => void;
    onSearch?: () => void;
    onFavorites?: () => void;
    onHistory?: () => void;
    onPrint?: () => void;
    onHelp?: () => void;
    canBack?: boolean;
    canForward?: boolean;
    showFavorites?: boolean;
    showHistory?: boolean;
    isLoading?: boolean;
}

const IEToolbar: React.FC<IEToolbarProps> = ({
    onBack,
    onForward,
    onStop,
    onRefresh,
    onHome,
    onSearch,
    onFavorites,
    onHistory,
    onPrint,
    onHelp,
    canBack = false,
    canForward = false,
    showFavorites = false,
    showHistory = false,
    isLoading = false
}) => {
    const { t } = useTranslation();
    const [openMenu, setOpenMenu] = useState<MenuKey>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenu]);

    const toggleMenu = (key: Exclude<MenuKey, null>, callback?: () => void) => {
        setOpenMenu(prev => prev === key ? null : key);
        if (key === 'favorites' && callback) callback();
        if (key === 'help' && callback) callback();
    };

    const renderDropdown = (key: Exclude<MenuKey, null>) => {
        if (openMenu !== key) return null;
        const items = MENUS[key];
        return (
            <DropdownMenu>
                {items.map((item, i) =>
                    item.separator
                        ? <DropdownSeparator key={i} />
                        : (
                            <DropdownItem
                                key={i}
                                $disabled={item.disabled}
                                onClick={() => setOpenMenu(null)}
                            >
                                <span>{item.labelKey ? t(item.labelKey) : ''}</span>
                                {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                            </DropdownItem>
                        )
                )}
            </DropdownMenu>
        );
    };

    return (
        <Container ref={containerRef}>
            <MenuBar>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
                        {t('internetExplorer.menu.file')}
                    </MenuItem>
                    {renderDropdown('file')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
                        {t('internetExplorer.menu.edit')}
                    </MenuItem>
                    {renderDropdown('edit')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
                        {t('internetExplorer.menu.view')}
                    </MenuItem>
                    {renderDropdown('view')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem
                        $active={openMenu === 'favorites' || showFavorites}
                        onClick={() => { toggleMenu('favorites'); onFavorites?.(); }}
                    >
                        {t('internetExplorer.menu.favorites')}
                    </MenuItem>
                    {renderDropdown('favorites')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'tools'} onClick={() => toggleMenu('tools')}>
                        {t('internetExplorer.menu.tools')}
                    </MenuItem>
                    {renderDropdown('tools')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem
                        $active={openMenu === 'help'}
                        onClick={() => { toggleMenu('help'); }}
                    >
                        {t('internetExplorer.menu.help')}
                    </MenuItem>
                    {renderDropdown('help')}
                </MenuItemWrapper>
            </MenuBar>
            <ToolbarContainer>
                <NavButton onClick={onBack} disabled={!canBack} $disabled={!canBack} title="后退">
                    <XPIcon name="back" size={24} />
                </NavButton>
                <NavButton onClick={onForward} disabled={!canForward} $disabled={!canForward} title="前进">
                    <XPIcon name="forward" size={24} />
                </NavButton>
                <Separator />
                <ToolbarButton onClick={isLoading ? onStop : onRefresh} title={isLoading ? "停止" : "刷新"}>
                    <XPIcon name={isLoading ? "stop" : "refresh"} size={16} />
                    {isLoading ? "停止" : "刷新"}
                </ToolbarButton>
                <ToolbarButton onClick={onHome} title="主页">
                    <XPIcon name="home" size={16} />
                    主页
                </ToolbarButton>
                <Separator />
                <ToolbarButton onClick={onSearch} title="搜索">
                    <XPIcon name="search" size={16} />
                    搜索
                </ToolbarButton>
                <ToolbarButton onClick={onFavorites} title="收藏夹">
                    <XPIcon name="favorites" size={16} />
                    收藏夹
                </ToolbarButton>
                <ToolbarButton onClick={onHistory} title="历史记录">
                    <XPIcon name="history" size={16} />
                    历史
                </ToolbarButton>
            </ToolbarContainer>
        </Container>
    );
};

export default IEToolbar;
