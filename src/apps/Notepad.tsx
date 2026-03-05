import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import ContextMenu from '../components/ContextMenu';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';

const Container = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
`;

/* Windows XP 风格菜单栏 */
const MenuBar = styled.div`
    height: 20px;
    background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    border-bottom: 1px solid #808080;
    display: flex;
    align-items: center;
    padding: 0 2px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    flex-shrink: 0;
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
    min-width: 160px;
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

const TextArea = styled.textarea`
    width: 100%;
    height: 100%;
    border: none;
    resize: none;
    font-family: 'Lucida Console', monospace;
    font-size: 14px;
    padding: 5px;
    outline: none;
    background: white;
`;

type MenuKey = 'file' | 'edit' | 'format' | 'view' | 'help' | null;

const MENUS: Record<Exclude<MenuKey, null>, { labelKey: string; shortcut?: string; separator?: boolean; disabled?: boolean }[]> = {
    file: [
        { labelKey: 'notepad.menuitems.new', shortcut: 'Ctrl+N' },
        { labelKey: 'notepad.menuitems.open', shortcut: 'Ctrl+O' },
        { labelKey: 'notepad.menuitems.save', shortcut: 'Ctrl+S' },
        { labelKey: 'notepad.menuitems.saveAs' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.pageSetup' },
        { labelKey: 'notepad.menuitems.print', shortcut: 'Ctrl+P' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.exit' },
    ],
    edit: [
        { labelKey: 'notepad.menuitems.undo', shortcut: 'Ctrl+Z' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.cut', shortcut: 'Ctrl+X' },
        { labelKey: 'notepad.menuitems.copy', shortcut: 'Ctrl+C' },
        { labelKey: 'notepad.menuitems.paste', shortcut: 'Ctrl+V' },
        { labelKey: 'notepad.menuitems.delete', shortcut: 'Del' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.find', shortcut: 'Ctrl+F' },
        { labelKey: 'notepad.menuitems.replace', shortcut: 'Ctrl+H' },
        { labelKey: 'notepad.menuitems.goTo', shortcut: 'Ctrl+G' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.selectAll', shortcut: 'Ctrl+A' },
    ],
    format: [
        { labelKey: 'notepad.menuitems.wrap', shortcut: 'Ctrl+W' },
        { labelKey: 'notepad.menuitems.font' },
    ],
    view: [
        { labelKey: 'notepad.menuitems.statusBar' },
    ],
    help: [
        { labelKey: 'notepad.menuitems.help' },
        { label: '', separator: true },
        { labelKey: 'notepad.menuitems.about' },
    ],
};

interface NotepadProps {
  content?: string;
  readOnly?: boolean;
  windowId?: string;
}

// windowId 由 Window.jsx 通过 cloneElement 自动注入，可传给 useApp(windowId)
const Notepad = ({ content = '', readOnly = false, windowId }: NotepadProps) => {
    const { t } = useTranslation();
    const api = useApp(windowId);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [openMenu, setOpenMenu] = useState<MenuKey>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
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

    // 点击外部关闭菜单
    React.useEffect(() => {
        if (!openMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenu]);

    const toggleMenu = (key: Exclude<MenuKey, null>) => {
        setOpenMenu(prev => prev === key ? null : key);
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
        <Container ref={menuRef}>
            <MenuBar>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
                        {t('notepad.menu.file')}
                    </MenuItem>
                    {renderDropdown('file')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
                        {t('notepad.menu.edit')}
                    </MenuItem>
                    {renderDropdown('edit')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'format'} onClick={() => toggleMenu('format')}>
                        {t('notepad.menu.format')}
                    </MenuItem>
                    {renderDropdown('format')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
                        {t('notepad.menu.view')}
                    </MenuItem>
                    {renderDropdown('view')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'help'} onClick={() => toggleMenu('help')}>
                        {t('notepad.menu.help')}
                    </MenuItem>
                    {renderDropdown('help')}
                </MenuItemWrapper>
            </MenuBar>
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
