import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import InternetExplorer from './InternetExplorer';
import Notepad from './Notepad';
import PhotoViewer from './PhotoViewer';
import XPIcon from '../components/XPIcon';
import ExplorerSidebar from '../components/Explorer/ExplorerSidebar';
import ExplorerToolbar from '../components/Explorer/ExplorerToolbar';
import AddressBar from '../components/Explorer/AddressBar';

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

import { getPuzzleIdFromPath, isAuxiliaryPuzzle } from '../utils/puzzleMapping';

const Explorer = ({ initialPath = [] }) => {
    const { getFile, checkAccess } = useFileSystem();
    const { openWindow } = useWindowManager();
    const { showModal, showPasswordDialog } = useModal();
    
    const [history, setHistory] = useState([initialPath]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);

    const currentPath = history[historyIndex];
    const currentFolder = getFile(currentPath);

    const handleNavigate = async (name) => {
        const newPath = [...currentPath, name];
        const target = getFile(newPath);
        
        if (target.broken) {
            showModal('Error', "因为磁盘文件损坏无法打开", 'error');
            return;
        }

        if (target.locked) {
            const puzzleId = getPuzzleIdFromPath(newPath);
            const allowSkip = puzzleId ? isAuxiliaryPuzzle(puzzleId) : false;

            const success = await showPasswordDialog({
                title: "输入密码",
                message: "此文件夹已加密，请输入密码访问",
                hint: target.hint || "提示：请输入正确的密码",
                correctPassword: target.password,
                puzzleId: puzzleId,
                allowSkip: allowSkip
            });

            if (!success) {
                return;
            }
        }
        
        if (target.type === 'folder' || target.type === 'root') {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPath);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setSelectedItem(null);
        } else if (target.type === 'file') {
             if (target.app === 'Notepad') {
                 openWindow(name, target.name, <Notepad content={target.content} />, 'file');
             } else if (target.app === 'InternetExplorer') {
                 openWindow(name, target.name, <InternetExplorer url={target.content} />, 'html');
             } else if (target.app === 'PhotoViewer') {
                 openWindow(name, target.name, <PhotoViewer src={target.content} fileItem={target} />, 'image', { width: 600, height: 500 });
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
    const isRoot = currentPath.length === 0 || (currentPath.length === 1 && currentPath[0] === 'My Computer');

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

    const renderFileItem = (key, item) => (
        <FileItem
            key={key}
            data-testid={`file-item-${key}`}
            onDoubleClick={() => handleNavigate(key)}
            onClick={() => setSelectedItem({ name: item.name, type: item.type })}
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
        <Container>
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
        </Container>
    );
};

export default Explorer;
