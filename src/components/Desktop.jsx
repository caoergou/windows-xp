import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import QQ from '../apps/QQ';

// Background Image
const BG_URL = "https://upload.wikimedia.org/wikipedia/en/2/27/Bliss_%28Windows_XP%29.png";

const DesktopContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #3A6EA5;
  background-image: url(${BG_URL});
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
`;

const IconGrid = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: calc(100% - 30px);
  padding: 10px;
  gap: 10px;
  align-content: flex-start;
`;

const DesktopIcon = styled.div`
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border: 1px solid transparent;
  color: white;
  text-shadow: 1px 1px 2px black;

  &:hover {
    background-color: rgba(0, 51, 153, 0.3);
    border: 1px solid rgba(0, 51, 153, 0.5);
  }

  img {
    width: 32px;
    height: 32px;
    margin-bottom: 5px;
  }
  
  span {
      font-size: 12px;
      text-align: center;
  }
`;

// Icon mapping (using wikimedia/github urls verified later, using placeholders for now if needed, or inline svgs/base64)
// I will use reliable external URLs or emojis/placeholders if I can't find direct hotlinkable ones easily.
// Let's use some generic images for now that are likely to work or placeholders.
const ICONS = {
    "computer": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/My_Computer_icon_Windows_XP.png/120px-My_Computer_icon_Windows_XP.png", // Mock
    "documents": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/My_Documents_icon_Windows_XP.png/120px-My_Documents_icon_Windows_XP.png", // Mock
    "recycle_bin": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Recycle_Bin_Full.png/120px-Recycle_Bin_Full.png", // Mock
    "ie": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Internet_Explorer_6_logo.svg/120px-Internet_Explorer_6_logo.svg.png",
    "html": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/120px-HTML5_logo_and_wordmark.svg.png", // Modern but ok
    "folder": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Folder_open_icon_%28Windows_XP%29.png/120px-Folder_open_icon_%28Windows_XP%29.png", // Mock
    "file": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/File_alt_font_awesome.svg/120px-File_alt_font_awesome.svg.png",
    "drive": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Hard_Drive_icon_%28Windows_XP%29.png/120px-Hard_Drive_icon_%28Windows_XP%29.png", // Mock
    "qq": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png"
};

// Fallback if images fail (using generic icons or emoji if needed, but lets try to handle missing images gracefully)
const getIcon = (key) => ICONS[key] || "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/My_Computer_icon_Windows_XP.png/120px-My_Computer_icon_Windows_XP.png";

const Desktop = () => {
    const { fs } = useFileSystem();
    const { windows, openWindow } = useWindowManager();
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

    const handleIconDoubleClick = (key, item) => {
        if (item.type === 'folder' || item.type === 'root') { // Root shouldn't technically be on desktop directly unless mapped
             openWindow(key, item.name, <Explorer initialPath={[key]} />, getIcon(item.icon || 'folder'));
        } else if (item.type === 'app_shortcut') {
             if (item.app === 'InternetExplorer') {
                 openWindow(key, item.name, <InternetExplorer url="https://www.bing.com" />, getIcon(item.icon));
             } else if (item.app === 'QQ') {
                 openWindow(key, item.name, <QQ />, getIcon(item.icon), { width: 300, height: 400 }); // Custom size not fully implemented in window openWindow yet
             }
        } else if (item.type === 'file') {
             if (item.app === 'Notepad') {
                 openWindow(key, item.name, <Notepad content={item.content} />, getIcon('file'));
             } else if (item.app === 'InternetExplorer') {
                 if (item.isHtmlContent) {
                     // Pass HTML directly
                     openWindow(key, item.name, <InternetExplorer html={item.content} />, getIcon('html'));
                 } else {
                     openWindow(key, item.name, <InternetExplorer url={item.content} />, getIcon('html'));
                 }
             }
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0 });
    };

    const handleRefresh = () => {
        // Windows XP 风格的刷新 - 只显示一个提示，不重新加载页面
        // 菜单会自动关闭（由 ContextMenu 组件处理）
        setTimeout(() => {
            alert('桌面已刷新');
            // 这里可以添加真正的刷新逻辑，比如：
            // - 重新加载桌面图标
            // - 清理临时文件
            // - 更新系统状态等
        }, 100);
    };

    // 桌面右键菜单项
    const desktopMenuItems = [
        {
            label: '刷新',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Refresh_icon.svg/120px-Refresh_icon.svg.png',
            action: handleRefresh
        },
        { type: 'separator' },
        {
            label: '粘贴',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Paste_icon.svg/120px-Paste_icon.svg.png',
            action: () => console.log('Paste action')
        },
        { type: 'separator' },
        {
            label: '新建文件夹',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Folder_open_icon_%28Windows_XP%29.png/120px-Folder_open_icon_%28Windows_XP%29.png',
            action: () => console.log('New folder action')
        },
        {
            label: '新建快捷方式',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shortcut_icon.svg/120px-Shortcut_icon.svg.png',
            action: () => console.log('New shortcut action')
        },
        { type: 'separator' },
        {
            label: '属性',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Properties_icon.svg/120px-Properties_icon.svg.png',
            action: () => console.log('Properties action')
        }
    ];

    // We only show direct children of "root" on desktop
    const desktopItems = fs.root.children;

    return (
        <DesktopContainer onContextMenu={handleContextMenu}>
            <IconGrid>
                {Object.entries(desktopItems).map(([key, item]) => (
                    <DesktopIcon key={key} onDoubleClick={() => handleIconDoubleClick(key, item)}>
                        <img src={getIcon(item.icon)} alt={item.name} onError={(e) => {e.target.src='https://via.placeholder.com/32'}} />
                        <span>{item.name}</span>
                    </DesktopIcon>
                ))}
            </IconGrid>

            {windows.map(win => (
                <Window key={win.id} windowState={win} />
            ))}

            <Taskbar />

            <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={closeContextMenu}
                menuItems={desktopMenuItems}
            />
        </DesktopContainer>
    );
};

export default Desktop;
