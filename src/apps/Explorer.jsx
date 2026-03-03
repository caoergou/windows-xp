import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useApp } from '../hooks/useApp';
import { resolveFileOpen } from '../registry/apps.jsx';
import XPIcon from '../components/XPIcon';
import ExplorerSidebar from '../components/Explorer/ExplorerSidebar';
import ExplorerToolbar from '../components/Explorer/ExplorerToolbar';
import AddressBar from '../components/Explorer/AddressBar';
import ContextMenu from '../components/ContextMenu';

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

// windowId 由 Window.jsx 通过 cloneElement 自动注入
const Explorer = ({ initialPath = [], windowId }) => {
    const { getFile, checkAccess, createFile, renameFile, deleteFile, copyFile, cutFile, pasteFile, getFileProperties } = useFileSystem();
    const api = useApp(windowId);

    const [history, setHistory] = useState([initialPath]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetItem: null });

    const currentPath = history[historyIndex];
    const currentFolder = getFile(currentPath);

    const handleNavigate = async (name) => {
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

    const handleNavigateToPath = (path) => {
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
            const drives = [];
            const others = [];

            children.forEach(([key, item]) => {
                // Check if it's a drive by icon or explicit type/name
                // Also common tasks might want to group "My Documents" under "Files stored on this computer" if we were mimicking that exactly,
                // but usually My Computer view has "Hard Disk Drives" and "Devices with Removable Storage".
                // "My Documents" usually appears in "Other Places" sidebar or as a folder under Desktop.
                // If we are at Root (Desktop), we see "My Computer", "My Documents", etc.
                // If we are at My Computer, we see "Local Disk (C:)".

                if (item.type === 'drive' || item.icon === 'drive' || key.includes('Drive') || key.includes('Disk')) {
                    drives.push({key, ...item});
                } else {
                    others.push({key, ...item});
                }
            });

            // If we have drives, we assume this is the "My Computer" view-like structure
            if (drives.length > 0) {
                return (
                    <>
                        <GroupHeader>硬盘</GroupHeader>
                        <IconsGrid>
                            {drives.map((item) => renderFileItem(item.key, item))}
                        </IconsGrid>

                        {others.length > 0 && (
                            <>
                                <GroupHeader>其他</GroupHeader>
                                <IconsGrid>
                                    {others.map((item) => renderFileItem(item.key, item))}
                                </IconsGrid>
                            </>
                        )}
                    </>
                );
            }
            // If no drives found but isRoot is true (e.g. Desktop view), just show standard or group differently.
            // But let's fall through to standard view if no drives to group.
        }

        // Standard Folder View
        return (
             <IconsGrid>
                 {children.map(([key, item]) => renderFileItem(key, item))}
             </IconsGrid>
        );
    };

    const handleContextMenu = (e, key, item) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedItem({ name: item.name, type: item.type });
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: { key, item } });
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
            api.openWindow(
                'FileProperties',
                '属性',
                <FileProperties
                    fileItem={contextMenu.targetItem.item}
                    parentPath={currentPath}
                />,
                'properties'
            );
            closeContextMenu();
        }
    };

    const menuItems = [
        { label: '新建', action: () => handleCreateFile('folder'), icon: 'folder' },
        { label: '新建文件', action: () => handleCreateFile('file'), icon: 'file' },
        { type: 'separator' },
        { label: '复制', action: handleCopy, icon: 'copy', disabled: !contextMenu.targetItem },
        { label: '剪切', action: handleCut, icon: 'cut', disabled: !contextMenu.targetItem },
        { label: '粘贴', action: handlePaste, icon: 'paste', disabled: false },
        { type: 'separator' },
        { label: '重命名', action: handleRename, disabled: !contextMenu.targetItem },
        { label: '删除', action: handleDelete, icon: 'delete', disabled: !contextMenu.targetItem },
        { type: 'separator' },
        { label: '属性', action: handleProperties, icon: 'properties', disabled: !contextMenu.targetItem }
    ];

    const renderFileItem = (key, item) => (
        <FileItem
            key={key}
            data-testid={`file-item-${key}`}
            onDoubleClick={() => handleNavigate(key)}
            onClick={() => setSelectedItem({ name: item.name, type: item.type })}
            onContextMenu={(e) => handleContextMenu(e, key, item)}
            selected={selectedItem && selectedItem.name === item.name}
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
        <Container onContextMenu={closeContextMenu}>
            <ExplorerToolbar
                onBack={handleBack}
                onForward={handleForward}
                onUp={handleUp}
                canBack={historyIndex > 0}
                canForward={historyIndex < history.length - 1}
            />
            <AddressBar currentPath={currentPath} />
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
