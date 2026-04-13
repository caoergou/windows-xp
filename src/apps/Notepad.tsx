import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import ContextMenu from '../components/ContextMenu';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { useFileSystem } from '../context/FileSystemContext';
import { isContainerNode, isFileContentNode, FileNode } from '../types';

const Container = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
`;

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
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
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

interface NotepadProps {
  content?: string;
  readOnly?: boolean;
  windowId?: string;
  filePath?: string[];
  fileName?: string;
}

const Notepad = ({ content: initialContent = '', readOnly = false, windowId, filePath, fileName }: NotepadProps) => {
    const { t } = useTranslation();
    const api = useApp(windowId);
    const { getFile, updateFile, createFile, fs } = useFileSystem();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [openMenu, setOpenMenu] = useState<MenuKey>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Editor state
    const [content, setContent] = useState(initialContent);
    const [currentFilePath, setCurrentFilePath] = useState<string[] | undefined>(filePath);
    const [currentFileName, setCurrentFileName] = useState<string | undefined>(fileName);
    const [isModified, setIsModified] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(readOnly);

    // Update window title when file changes
    useEffect(() => {
        if (currentFileName) {
            const title = isModified ? `${currentFileName} * - 记事本` : `${currentFileName} - 记事本`;
            api.window.setTitle(title);
        } else {
            api.window.setTitle(isModified ? '无标题 * - 记事本' : '无标题 - 记事本');
        }
    }, [currentFileName, isModified, api.window]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsModified(true);
    };

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

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const ta = textareaRef.current;
            if (ta) {
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const newValue = content.substring(0, start) + text + content.substring(end);
                setContent(newValue);
                setIsModified(true);
                // Restore cursor position after paste
                setTimeout(() => {
                    ta.selectionStart = ta.selectionEnd = start + text.length;
                    ta.focus();
                }, 0);
            }
        } catch (e) {
            console.error('Failed to paste:', e);
        }
    };

    const handleSelectAll = () => {
        if (textareaRef.current) {
            textareaRef.current.select();
        }
    };

    const handleCut = () => {
        const ta = textareaRef.current;
        if (ta) {
            const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
            if (selected) {
                navigator.clipboard.writeText(selected);
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const newValue = content.substring(0, start) + content.substring(end);
                setContent(newValue);
                setIsModified(true);
            }
        }
    };

    // File Operations
    const handleNew = () => {
        if (isModified) {
            api.dialog.confirm({
                title: '记事本',
                message: '文件已修改，是否保存更改？',
                type: 'question'
            }).then(confirmed => {
                if (confirmed) {
                    handleSave().then(() => {
                        resetEditor();
                    });
                } else {
                    resetEditor();
                }
            });
        } else {
            resetEditor();
        }
    };

    const resetEditor = () => {
        setContent('');
        setCurrentFilePath(undefined);
        setCurrentFileName(undefined);
        setIsModified(false);
        setIsReadOnly(false);
    };

    const handleOpen = () => {
        if (isModified) {
            api.dialog.confirm({
                title: '记事本',
                message: '文件已修改，是否保存更改？',
                type: 'question'
            }).then(confirmed => {
                if (confirmed) {
                    handleSave().then(() => {
                        showOpenDialog();
                    });
                } else {
                    showOpenDialog();
                }
            });
        } else {
            showOpenDialog();
        }
    };

    const showOpenDialog = () => {
        // Create a file browser dialog for selecting text files
        openFileBrowserForOpen();
    };

    const openFileBrowserForOpen = () => {
        // We'll use a simple approach - open Explorer and let user navigate
        // For now, show a prompt to enter file path
        api.dialog.prompt({
            title: '打开',
            message: '请输入文件路径（例如：我的文档\\readme.txt）：',
            defaultValue: currentFileName || ''
        }).then(filePathStr => {
            if (!filePathStr) return;

            const parts = filePathStr.split('\\').filter(Boolean);
            if (parts.length === 0) return;

            const fileName = parts[parts.length - 1];
            const parentPath = parts.slice(0, -1);

            const node = getFile(parts);
            if (!node) {
                api.dialog.alert({ title: '打开', message: '找不到文件。', type: 'error' });
                return;
            }

            if (node.type !== 'file') {
                api.dialog.alert({ title: '打开', message: '无法打开文件夹。', type: 'error' });
                return;
            }

            if (!isFileContentNode(node) || node.content === undefined) {
                api.dialog.alert({ title: '打开', message: '无法读取此文件类型。', type: 'error' });
                return;
            }

            setContent(node.content);
            setCurrentFilePath(parentPath);
            setCurrentFileName(fileName);
            setIsModified(false);
            setIsReadOnly(!!node.readOnly);
        });
    };

    const handleSave = async (): Promise<void> => {
        if (currentFilePath && currentFileName) {
            // Save to existing file
            const fullPath = [...currentFilePath, currentFileName];
            const node = getFile(fullPath);

            if (node && isFileContentNode(node)) {
                if (node.readOnly) {
                    await api.dialog.alert({ title: '保存', message: '文件是只读的。', type: 'error' });
                    return;
                }

                updateFile(fullPath, { content });
                setIsModified(false);
            }
        } else {
            // Save As for new file
            await handleSaveAs();
        }
    };

    const handleSaveAs = async (): Promise<void> => {
        const filePathStr = await api.dialog.prompt({
            title: '另存为',
            message: '请输入文件名和路径（例如：我的文档\\newfile.txt）：',
            defaultValue: currentFileName || '未命名.txt'
        });

        if (!filePathStr) return;

        const parts = filePathStr.split('\\').filter(Boolean);
        if (parts.length === 0) return;

        const newFileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1);

        // Validate parent path exists
        const parent = getFile(parentPath);
        if (!parent) {
            await api.dialog.alert({ title: '另存为', message: '路径不存在。', type: 'error' });
            return;
        }

        if (!isContainerNode(parent)) {
            await api.dialog.alert({ title: '另存为', message: '无效的路径。', type: 'error' });
            return;
        }

        // Check if file already exists
        const existingFile = getFile(parts);
        if (existingFile) {
            const overwrite = await api.dialog.confirm({
                title: '另存为',
                message: `文件 "${newFileName}" 已存在。是否覆盖？`,
                type: 'warning'
            });
            if (!overwrite) return;

            // Update existing file
            updateFile(parts, { content });
        } else {
            // Create new file
            createFile(parentPath, newFileName, 'file', {
                content,
                app: 'Notepad'
            });
        }

        setCurrentFilePath(parentPath);
        setCurrentFileName(newFileName);
        setIsModified(false);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName || '未命名.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExit = () => {
        if (isModified) {
            api.dialog.confirm({
                title: '记事本',
                message: '文件已修改，是否保存更改？',
                type: 'question'
            }).then(confirmed => {
                if (confirmed) {
                    handleSave().then(() => {
                        api.window.close();
                    });
                } else {
                    api.window.close();
                }
            });
        } else {
            api.window.close();
        }
    };

    // Click outside to close menu
    useEffect(() => {
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

        const fileMenuItems = [
            { label: '新建(N)', shortcut: 'Ctrl+N', action: handleNew },
            { label: '打开(O)...', shortcut: 'Ctrl+O', action: handleOpen },
            { label: '保存(S)', shortcut: 'Ctrl+S', action: handleSave, disabled: isReadOnly },
            { label: '另存为(A)...', action: handleSaveAs },
            { type: 'separator' as const },
            { label: '下载到本地...', action: handleDownload },
            { type: 'separator' as const },
            { label: '退出(X)', action: handleExit },
        ];

        const editMenuItems = [
            { label: '撤销(U)', shortcut: 'Ctrl+Z', action: () => {}, disabled: true },
            { type: 'separator' as const },
            { label: '剪切(T)', shortcut: 'Ctrl+X', action: handleCut },
            { label: '复制(C)', shortcut: 'Ctrl+C', action: handleCopy },
            { label: '粘贴(P)', shortcut: 'Ctrl+V', action: handlePaste },
            { label: '删除(L)', shortcut: 'Del', action: () => {} },
            { type: 'separator' as const },
            { label: '查找(F)...', shortcut: 'Ctrl+F', action: () => {}, disabled: true },
            { label: '替换(R)...', shortcut: 'Ctrl+H', action: () => {}, disabled: true },
            { type: 'separator' as const },
            { label: '全选(A)', shortcut: 'Ctrl+A', action: handleSelectAll },
        ];

        const formatMenuItems = [
            { label: '自动换行(W)', action: () => {}, disabled: true },
            { label: '字体(F)...', action: () => {}, disabled: true },
        ];

        const viewMenuItems = [
            { label: '状态栏(S)', action: () => {}, disabled: true },
        ];

        const helpMenuItems = [
            { label: '帮助主题(H)', action: () => {}, disabled: true },
            { type: 'separator' as const },
            { label: '关于记事本(A)', action: () => {}, disabled: true },
        ];

        const menuMap: Record<string, typeof fileMenuItems> = {
            file: fileMenuItems,
            edit: editMenuItems,
            format: formatMenuItems,
            view: viewMenuItems,
            help: helpMenuItems,
        };

        const items = menuMap[key] || [];

        return (
            <DropdownMenu>
                {items.map((item, i) =>
                    item.type === 'separator'
                        ? <DropdownSeparator key={i} />
                        : (
                            <DropdownItem
                                key={i}
                                $disabled={item.disabled}
                                onClick={() => {
                                    if (!item.disabled && item.action) {
                                        item.action();
                                    }
                                    setOpenMenu(null);
                                }}
                            >
                                <span>{item.label}</span>
                                {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                            </DropdownItem>
                        )
                )}
            </DropdownMenu>
        );
    };

    const contextMenuItems = [
        { label: '撤销(U)', action: () => {}, disabled: true },
        { type: 'separator' as const },
        { label: '剪切(T)', action: handleCut },
        { label: '复制(C)', action: handleCopy },
        { label: '粘贴(P)', action: handlePaste },
        { label: '删除(D)', action: () => {}, disabled: true },
        { type: 'separator' as const },
        { label: '全选(A)', action: handleSelectAll },
    ];

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        handleNew();
                        break;
                    case 'o':
                        e.preventDefault();
                        handleOpen();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleSaveAs();
                        } else {
                            handleSave();
                        }
                        break;
                    case 'a':
                        e.preventDefault();
                        handleSelectAll();
                        break;
                    case 'x':
                        e.preventDefault();
                        handleCut();
                        break;
                    case 'c':
                        e.preventDefault();
                        handleCopy();
                        break;
                    case 'v':
                        e.preventDefault();
                        handlePaste();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, isModified, currentFileName, currentFilePath]);

    return (
        <Container ref={menuRef}>
            <MenuBar>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
                        文件(F)
                    </MenuItem>
                    {renderDropdown('file')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
                        编辑(E)
                    </MenuItem>
                    {renderDropdown('edit')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'format'} onClick={() => toggleMenu('format')}>
                        格式(O)
                    </MenuItem>
                    {renderDropdown('format')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
                        查看(V)
                    </MenuItem>
                    {renderDropdown('view')}
                </MenuItemWrapper>
                <MenuItemWrapper>
                    <MenuItem $active={openMenu === 'help'} onClick={() => toggleMenu('help')}>
                        帮助(H)
                    </MenuItem>
                    {renderDropdown('help')}
                </MenuItemWrapper>
            </MenuBar>
            <TextArea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onContextMenu={handleContextMenu}
                readOnly={isReadOnly}
            />
            {createPortal(
                <ContextMenu
                    visible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                    menuItems={contextMenuItems}
                />,
                document.body
            )}
        </Container>
    );
};

export default Notepad;
