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
import Email from '../apps/Email';
import TiebaApp, { tiebaPlugin } from '../apps/TiebaApp';
import XPIcon from './XPIcon';

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

  .icon-wrapper {
      margin-bottom: 5px;
      filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));
  }
  
  span {
      font-size: 12px;
      text-align: center;
  }
`;

const Desktop = () => {
    const { fs } = useFileSystem();
    const { windows, openWindow, focusWindow } = useWindowManager();
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [refreshKey, setRefreshKey] = useState(0); // For forcing refresh
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleIconDoubleClick = (key, item) => {
        if (item.type === 'folder' || item.type === 'root') { // Root shouldn't technically be on desktop directly unless mapped
             openWindow(key, item.name, <Explorer initialPath={[key]} />, item.icon || 'folder');
        } else if (item.type === 'app_shortcut') {
             if (item.app === 'InternetExplorer') {
                 openWindow(key, item.name, <InternetExplorer url="https://www.bing.com" plugin={tiebaPlugin} />, item.icon);
             } else if (item.app === 'QQ') {
                 const existingQQ = windows.find(w => w.appId === key);
                 if (existingQQ) {
                     focusWindow(existingQQ.id);
                 } else {
                     openWindow(key, item.name, <QQ />, item.icon, { width: 280, height: 600, resizable: false });
                 }
             } else if (item.app === 'Email') {
                 openWindow(key, item.name, <Email />, item.icon, { width: 800, height: 600 });
             } else if (item.app === 'TiebaApp') {
                 openWindow(key, item.name, <TiebaApp initialUrl={item.content} />, item.icon);
             }
        } else if (item.type === 'file') {
             if (item.app === 'Notepad') {
                 openWindow(key, item.name, <Notepad content={item.content} />, 'file');
             } else if (item.app === 'InternetExplorer') {
                 if (item.isHtmlContent) {
                     // Pass HTML directly
                     openWindow(key, item.name, <InternetExplorer html={item.content} plugin={tiebaPlugin} />, 'html');
                 } else {
                     openWindow(key, item.name, <InternetExplorer url={item.content} plugin={tiebaPlugin} />, 'html');
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
        // Blink effect to simulate refresh
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setRefreshKey(prev => prev + 1);
        }, 100);
    };

    // 桌面右键菜单项
    const desktopMenuItems = [
        {
            label: '刷新',
            icon: 'refresh',
            action: handleRefresh
        },
        { type: 'separator' },
        {
            label: '粘贴',
            icon: 'paste',
            action: () => console.log('Paste action')
        },
        { type: 'separator' },
        {
            label: '新建文件夹',
            icon: 'new_folder',
            action: () => console.log('New folder action')
        },
        {
            label: '新建快捷方式',
            icon: 'new_shortcut',
            action: () => console.log('New shortcut action')
        },
        { type: 'separator' },
        {
            label: '属性',
            icon: 'properties',
            action: () => console.log('Properties action')
        }
    ];

    // We only show direct children of "root" on desktop
    const desktopItems = fs.root.children;

    return (
        <DesktopContainer onContextMenu={handleContextMenu}>
            <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
                {Object.entries(desktopItems).map(([key, item]) => (
                    <DesktopIcon key={key} onDoubleClick={() => handleIconDoubleClick(key, item)}>
                        <div className="icon-wrapper">
                            <XPIcon name={item.icon} size={32} />
                        </div>
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
