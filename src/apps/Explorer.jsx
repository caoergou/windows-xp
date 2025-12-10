import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import InternetExplorer from './InternetExplorer';
import Notepad from './Notepad';
import XPIcon from '../components/XPIcon';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const Toolbar = styled.div`
    height: 30px;
    background: #ECE9D8;
    border-bottom: 1px solid #999;
    display: flex;
    align-items: center;
    padding: 0 5px;
    font-size: 11px;
`;

const FileArea = styled.div`
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    padding: 10px;
    background: white;
    gap: 10px;
`;

const FileItem = styled.div`
    width: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5px;
    cursor: pointer;
    
    &:hover {
        background-color: #E8F4FF;
        border: 1px solid #C0DEFF;
    }
    
    .file-icon {
        margin-bottom: 5px;
    }
    
    span {
        font-size: 11px;
        text-align: center;
        word-break: break-all;
    }
`;

const Explorer = ({ initialPath }) => {
    const { getFile, checkAccess } = useFileSystem();
    const { openWindow } = useWindowManager();
    const { showModal } = useModal();
    const [currentPath, setCurrentPath] = useState(initialPath);
    
    const currentFolder = getFile(currentPath);

    const handleNavigate = (name) => {
        const newPath = [...currentPath, name];
        const target = getFile(newPath);
        
        if (target.locked) {
            // Since prompt is also a popup, technically we should replace it too, but prompt expects input.
            // For now, replacing alert is the priority.
            // However, to avoid blocking UI with native prompt, ideally we would use a custom input modal.
            // But let's stick to replacing the alert for "Access Denied" first.
            const pwd = prompt("文件夹已锁定。请输入密码：");
            if (!checkAccess(target, pwd)) {
                showModal('Error', "访问被拒绝", 'error');
                return;
            }
        }
        
        if (target.type === 'folder' || target.type === 'root') {
            setCurrentPath(newPath);
        } else if (target.type === 'file') {
             // Open file
             if (target.app === 'Notepad') {
                 openWindow(name, target.name, <Notepad content={target.content} />, 'file');
             } else if (target.app === 'InternetExplorer') {
                 openWindow(name, target.name, <InternetExplorer url={target.content} />, 'html');
             }
        }
    };

    const handleUp = () => {
        if (currentPath.length > 1) {
             const newPath = [...currentPath];
             newPath.pop();
             if (newPath.length > 0) setCurrentPath(newPath);
        }
    };

    if (!currentFolder) return <div>找不到路径</div>;

    return (
        <Container>
            <Toolbar>
                <button onClick={handleUp} disabled={currentPath.length <= 1}>向上</button>
                <span style={{marginLeft: '10px'}}>地址: {currentPath.join('\\')}</span>
            </Toolbar>
            <FileArea>
                {currentFolder.children && Object.entries(currentFolder.children).map(([key, item]) => (
                     <FileItem key={key} onDoubleClick={() => handleNavigate(key)}>
                         <XPIcon name={item.icon || (item.type === 'folder' ? 'folder' : 'file')} size={32} className="file-icon" />
                         <span>{item.name}</span>
                     </FileItem>
                ))}
            </FileArea>
        </Container>
    );
};

export default Explorer;
