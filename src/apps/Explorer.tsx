import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useApp } from '../hooks/useApp';
import { resolveFileOpen } from '../registry/apps';
import XPIcon from '../components/XPIcon';
import ExplorerSidebar from '../components/Explorer/ExplorerSidebar';
import ExplorerToolbar from '../components/Explorer/ExplorerToolbar';
import AddressBar from '../components/Explorer/AddressBar';
import ContextMenu from '../components/ContextMenu';
import FileProperties from '../components/FileProperties';
import { FileNode } from '../types';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
`;

const MainContent = styled.div`
    flex: 1;
    display: flex;
    overflow: hidden;
`;

const FileArea = styled.div`
    flex: 1;
    background: white;
    padding: 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const GroupHeader = styled.div`
    font-weight: bold;
    font-size: 11px;
    color: #15428B;
    border-bottom: 1px solid #c6d3f7;
    padding-bottom: 2px;
    margin-bottom: 5px;
    margin-top: 10px;

    &:first-child {
        margin-top: 0;
    }
`;

const IconsGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
`;

const FileItem = styled.div`
    width: 250px; /* List view style often seen in My Computer */
    display: flex;
    align-items: center;
    padding: 3px;
    cursor: pointer;
    border: 1px solid transparent;

    &:hover {
        background-color: #E8F4FF;
        border: 1px solid #C0DEFF;
    }

    ${props => props.selected && `
        background-color: #316AC5;
        color: white;
        border: 1px dotted #fff;

        &:hover {
            background-color: #316AC5;
            color: white;
        }
    `}
`;

const IconWrapper = styled.div`
    margin-right: 5px;
`;

const FileInfo = styled.div`
    display: flex;
    flex-direction: column;
`;

const FileName = styled.span`
    font-size: 11px;
    font-weight: ${props => props.isDrive ? 'bold' : 'normal'};
`;

const FileType = styled.span`
    font-size: 10px;
    color: #666;
    ${props => props.selected && `color: #eee;`}
`;

const StatusBar = styled.div`
    height: 20px;
    background: #ECE9D8;
    border-top: 1px solid #D0D0D0;
    display: flex;
    align-items: center;
    padding: 0 5px;
    font-size: 11px;
    color: #000;
`;

// windowId 由 Window.tsx 通过 cloneElement 自动注入
interface ExplorerProps {
    initialPath?: string[];
    windowId?: string;
}

const Explorer: React.FC<ExplorerProps> = ({ initialPath = [], windowId }) => {
    const { getFile, createFile, renameFile, deleteFile, cutFile, pasteFile, clipboard, getFileProperties, emptyRecycleBin, restoreFromRecycleBin, moveFile } = useFileSystem();
    const api = useApp(windowId);

    const [history, setHistory] = useState<string[][]>([initialPath]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<{ name: string; type: FileNode['type'] } | null>(null);
    const [address, setAddress] = useState<string>(initialPath.join('\\'));
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetItem: { key: string; item: FileNode } | null }>({
        visible: false,
        x: 0,
        y: 0,
        targetItem: null
    });

    const currentPath = history[historyIndex];
    const currentFolder = getFile(currentPath);

    // Keep address bar in sync when navigating
    useEffect(() => {
        setAddress(currentPath.join('\\'));
    }, [currentPath]);

    const handleAddressGo = () => {
        const parts = address.split('\\').filter(p => p.trim() !== '');
        const target = getFile(parts);
        if (target) {
            handleNavigateToPath(parts);
        }
    };

    const handleNavigate = async (name: string) => {
        const newPath = [...currentPath, name];
        const target = getFile(newPath);

        if (target.broken) {
            await api.dialog.alert({ title: '错误', message: '因为磁盘文件损坏无法打开', type: 'error' });
            return;
        }

        if (target.locked) {
            const success = await api.dialog.password({
                title: '输入密码',
                message: '此文件夹已加密，请输入密码访问。',
                hint: target.hint || '',
                correctPassword: target.password,
            });
            if (!success) return;
        }

        if (target.type === 'folder' || target.type === 'root') {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPath);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setSelectedItem(null);
        } else if (target.type === 'file' || target.type === 'app_shortcut') {
            const resolved = resolveFileOpen(name, target);
            if (resolved) {
                api.openWindow(resolved.appId, target.name, resolved.component, resolved.icon, resolved.windowProps);
            }
        }
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setSelectedItem(null);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setSelectedItem(null);
        }
    };

    const handleUp = () => {
        if (currentPath.length > 0) {
            const newPath = [...currentPath];
            newPath.pop();
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPath);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setSelectedItem(null);
        }
    };

    const handleNavigateToPath = (path: string[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setSelectedItem(null);
    };

    if (!currentFolder) return <div>找不到路径</div>;

    // Grouping Logic for "My Computer" (Root or Explicit 'My Computer' path)
    const isRoot = currentPath.length === 0 || (currentPath.length === 1 && currentPath[0] === '我的电脑');

    const renderContent = () => {
        if (!currentFolder.children) return null;

        const children = Object.entries(currentFolder.children);

        if (isRoot) {
            const drives: { key: string; item: FileNode }[] = [];
            const others: { key: string; item: FileNode }[] = [];

            children.forEach(([key, item]) => {
                if (item.type === 'drive' || item.icon === 'drive' || key.includes('Drive') || key.includes('Disk')) {
                    drives.push({ key, item });
                } else {
                    others.push({ key, item });
                }
            });

            // If we have drives, we assume this is the "My Computer" view-like structure
            if (drives.length > 0) {
                return (
                    <>
                        <GroupHeader>硬盘</GroupHeader>
                        <IconsGrid>
                            {drives.map(({ key, item }) => renderFileItem(key, item))}
                        </IconsGrid>

                        {others.length > 0 && (
                            <>
                                <GroupHeader>其他</GroupHeader>
                                <IconsGrid>
                                    {others.map(({ key, item }) => renderFileItem(key, item))}
                                </IconsGrid>
                            </>
                        )}
                    </>
                );
            }
        }

        // Standard Folder View
        return (
             <IconsGrid>
                 {children.map(([key, item]) => renderFileItem(key, item))}
             </IconsGrid>
        );
    };

    const handleContextMenu = (e: React.MouseEvent, key: string, item: FileNode) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedItem({ name: item?.name, type: item?.type });
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: item ? { key, item } : null });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, targetItem: null });
    };

    const handleCreateFile = (type = 'file') => {
        const fileName = type === 'folder' ? '新建文件夹' : '新建文本文档.txt';
        createFile(currentPath, fileName, type);
        closeContextMenu();
    };

    const handleDelete = () => {
        if (contextMenu.targetItem) {
            api.dialog.confirm({
                title: '确认删除',
                message: `确定要删除 "${contextMenu.targetItem.item.name}" 吗？`,
                type: 'warning'
            }).then(confirmed => {
                if (confirmed) {
                    deleteFile(currentPath, contextMenu.targetItem.key);
                    closeContextMenu();
                }
            });
        }
    };

    const handleRename = () => {
        if (contextMenu.targetItem) {
            api.dialog.prompt({
                title: '重命名',
                message: '请输入新名称：',
                defaultValue: contextMenu.targetItem.item.name
            }).then(newName => {
                if (newName && newName.trim() !== '') {
                    renameFile(currentPath, contextMenu.targetItem.key, newName.trim());
                    closeContextMenu();
                }
            });
        }
    };

    const handleCopy = () => {
        if (contextMenu.targetItem) {
            cutFile(currentPath, contextMenu.targetItem.key);
            closeContextMenu();
        }
    };

    const handleCut = () => {
        if (contextMenu.targetItem) {
            cutFile(currentPath, contextMenu.targetItem.key);
            closeContextMenu();
        }
    };

    const handlePaste = () => {
        const success = pasteFile(currentPath);
        if (success) {
            closeContextMenu();
        }
    };

    const handleProperties = () => {
        if (contextMenu.targetItem) {
            const componentProps = {
                fileItem: contextMenu.targetItem.item,
                parentPath: currentPath
            };
            api.openWindow(
                'FileProperties',
                '属性',
                <FileProperties {...componentProps} />,
                'properties',
                { componentProps }  // 显式传递 componentProps 用于持久化
            );
            closeContextMenu();
        }
    };

    const isInRecycleBin = currentPath.length === 1 && currentPath[0] === '回收站';

    const handleEmptyRecycleBin = () => {
        api.dialog.confirm({
            title: '清空回收站',
            message: '确定要永久删除回收站中的所有项目吗？',
            type: 'warning'
        }).then(confirmed => {
            if (confirmed) {
                emptyRecycleBin();
                closeContextMenu();
            }
        });
    };

    const handleRestoreFromRecycleBin = () => {
        if (contextMenu.targetItem) {
            restoreFromRecycleBin(contextMenu.targetItem.key);
            closeContextMenu();
        }
    };

    const recycleBinMenuItems = [
        { label: '还原', action: handleRestoreFromRecycleBin, disabled: !contextMenu.targetItem },
        { type: 'separator' },
        { label: '清空回收站', action: handleEmptyRecycleBin },
        { type: 'separator' },
        { label: '属性', action: handleProperties, disabled: !contextMenu.targetItem }
    ];

    const menuItems = isInRecycleBin ? recycleBinMenuItems : [
        { label: '新建文件夹', action: () => handleCreateFile('folder') },
        { label: '新建文本文档', action: () => handleCreateFile('file') },
        { type: 'separator' },
        { label: '复制', action: handleCopy, disabled: !contextMenu.targetItem },
        { label: '剪切', action: handleCut, disabled: !contextMenu.targetItem },
        { label: '粘贴', action: handlePaste, disabled: !clipboard },
        { type: 'separator' },
        { label: '重命名', action: handleRename, disabled: !contextMenu.targetItem },
        { label: '删除', action: handleDelete, disabled: !contextMenu.targetItem },
        { type: 'separator' },
        { label: '属性', action: handleProperties, disabled: !contextMenu.targetItem }
    ];

    const handleDragStart = (e: React.DragEvent, key: string) => {
        e.dataTransfer.setData('text/plain', key);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDropOnFolder = (e: React.DragEvent, targetKey: string, targetItem: FileNode) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(null);
        if (targetItem.type !== 'folder') return;
        const srcKey = e.dataTransfer.getData('text/plain');
        if (!srcKey || srcKey === targetKey) return;
        moveFile(currentPath, srcKey, [...currentPath, targetKey]);
    };

    const renderFileItem = (key: string, item: FileNode) => (
        <FileItem
            key={key}
            data-testid={`file-item-${key}`}
            onDoubleClick={() => handleNavigate(key)}
            onClick={() => setSelectedItem({ name: item.name, type: item.type })}
            onContextMenu={(e) => handleContextMenu(e, key, item)}
            selected={selectedItem && selectedItem.name === item.name}
            draggable
            onDragStart={(e) => handleDragStart(e, key)}
            onDragOver={(e) => { if (item.type === 'folder') { e.preventDefault(); setDragOver(key); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDropOnFolder(e, key, item)}
            style={dragOver === key && item.type === 'folder' ? { background: '#C1D2EE', border: '1px dashed #316AC5' } : undefined}
        >
            <IconWrapper>
                <XPIcon name={item.icon || (item.type === 'folder' ? 'folder' : 'file')} size={32} />
            </IconWrapper>
            <FileInfo>
                <FileName isDrive={isRoot && (item.type === 'drive' || item.icon === 'drive')}>
                    {item.name}
                    {item.locked && <span style={{ marginLeft: '5px', fontSize: '10px' }}>🔒</span>}
                </FileName>
                {isRoot && (item.type === 'drive' || item.icon === 'drive') && <FileType selected={selectedItem && selectedItem.name === item.name}>本地磁盘</FileType>}
            </FileInfo>
        </FileItem>
    );

    return (
        <Container onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedItem(null);
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: null });
        }}>
            <ExplorerToolbar
                onBack={handleBack}
                onForward={handleForward}
                onUp={handleUp}
                canGoBack={historyIndex > 0}
                canGoForward={historyIndex < history.length - 1}
                canGoUp={currentPath.length > 0}
            />
            <AddressBar
                address={address}
                onAddressChange={setAddress}
                onGo={handleAddressGo}
            />
            <MainContent>
                <ExplorerSidebar
                    currentPath={currentPath}
                    currentItem={selectedItem}
                    onNavigate={handleNavigateToPath}
                />
                <FileArea>
                    {renderContent()}
                </FileArea>
            </MainContent>
            <StatusBar>
                {Object.keys(currentFolder.children || {}).length} 个对象
            </StatusBar>
            <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={closeContextMenu}
                menuItems={menuItems}
            />
        </Container>
    );
};

export default Explorer;
