import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import InternetExplorer from './InternetExplorer';
import Notepad from './Notepad';

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
    
    img {
        width: 32px;
        height: 32px;
        margin-bottom: 5px;
    }
    
    span {
        font-size: 11px;
        text-align: center;
        word-break: break-all;
    }
`;

// Helper to resolve icon
const ICONS = {
    "computer": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/My_Computer_icon_Windows_XP.png/120px-My_Computer_icon_Windows_XP.png",
    "documents": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/My_Documents_icon_Windows_XP.png/120px-My_Documents_icon_Windows_XP.png",
    "recycle_bin": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Recycle_Bin_Full.png/120px-Recycle_Bin_Full.png",
    "ie": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Internet_Explorer_6_logo.svg/120px-Internet_Explorer_6_logo.svg.png",
    "html": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/120px-HTML5_logo_and_wordmark.svg.png",
    "folder": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Folder_open_icon_%28Windows_XP%29.png/120px-Folder_open_icon_%28Windows_XP%29.png",
    "file": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/File_alt_font_awesome.svg/120px-File_alt_font_awesome.svg.png",
    "drive": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Hard_Drive_icon_%28Windows_XP%29.png/120px-Hard_Drive_icon_%28Windows_XP%29.png"
};
const getIcon = (key) => ICONS[key] || ICONS['file'];

const Explorer = ({ initialPath }) => {
    const { getFile, checkAccess } = useFileSystem();
    const { openWindow } = useWindowManager();
    const [currentPath, setCurrentPath] = useState(initialPath);
    
    const currentFolder = getFile(currentPath);

    const handleNavigate = (name) => {
        const newPath = [...currentPath, name];
        const target = getFile(newPath);
        
        if (target.locked) {
            const pwd = prompt("文件夹已锁定。请输入密码：");
            if (!checkAccess(target, pwd)) {
                alert("访问被拒绝");
                return;
            }
        }
        
        if (target.type === 'folder' || target.type === 'root') {
            setCurrentPath(newPath);
        } else if (target.type === 'file') {
             // Open file
             if (target.app === 'Notepad') {
                 openWindow(name, target.name, <Notepad content={target.content} />, getIcon('file'));
             } else if (target.app === 'InternetExplorer') {
                 openWindow(name, target.name, <InternetExplorer url={target.content} />, getIcon('html'));
             }
        }
    };

    const handleUp = () => {
        if (currentPath.length > 1) { // Assuming root is always index 0? actually initialPath might be ["root", "children", "My Computer"]
             // Our path logic in context was simplified. Let's assume path is stack of keys.
             // If initialPath was ["root"], handleUp is tricky if we are at root.
             // But usually we start at ["root", "children", "My Computer"] -> length 3?
             // No, context logic was: fs.root -> key -> key.
             // If path is ["My Computer"], parent is "root" (which is virtual).
             
             // Simplification: just pop the last element
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
                         <img src={getIcon(item.icon || (item.type === 'folder' ? 'folder' : 'file'))} alt="" onError={(e)=>e.target.src='https://via.placeholder.com/32'}/>
                         <span>{item.name}</span>
                     </FileItem>
                ))}
            </FileArea>
        </Container>
    );
};

export default Explorer;
