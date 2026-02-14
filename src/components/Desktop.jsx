import React, { useState } from 'react';
import styled from 'styled-components';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useInvestigationNotes } from '../hooks/useInvestigationNotes.jsx';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import QQ from '../apps/QQ';
import TiebaApp from '../apps/TiebaApp';
import QZone from '../apps/QZone';
import DiaryViewer from '../apps/Journal';
import XPIcon from './XPIcon';
import StickyNote from './StickyNote';
import FirstLoginGuide from './FirstLoginGuide';
import AdwarePopups from './AdwarePopups';
import desktopBg from '../assets/images/desktop_bg.jpg';
import { defaultPlugin } from '../apps/BrowserPlugins';
import { useModal } from '../context/ModalContext';

const DesktopContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #3A6EA5;
  background-image: url(${props => props.$bgUrl});
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
      filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.7));
  }
  
  span {
      font-size: 12px;
      text-align: center;
  }
`;

const Desktop = () => {
    const { fs } = useFileSystem();
    const { windows, openWindow, focusWindow } = useWindowManager();
    const { showModal } = useModal();

    // Initialize investigation notes hook
    useInvestigationNotes();

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [refreshKey, setRefreshKey] = useState(0); // For forcing refresh
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleIconDoubleClick = (key, item) => {
        if (item.type === 'folder' || item.type === 'root') { // Root shouldn't technically be on desktop directly unless mapped
             openWindow(key, item.name, <Explorer initialPath={[key]} />, item.icon || 'folder', { width: 800, height: 550 });
        } else if (item.type === 'app_shortcut') {
             if (item.app === 'InternetExplorer') {
                 openWindow(key, item.name, <InternetExplorer url="http://www.hao123.com" plugin={defaultPlugin} />, item.icon, { isMaximized: true });
             } else if (item.app === 'QQ') {
                 const existingQQ = windows.find(w => w.appId === key);
                 if (existingQQ) {
                     focusWindow(existingQQ.id);
                 } else {
                     openWindow(key, item.name, <QQ />, item.icon, { width: 280, height: 600, resizable: false });
                 }
             } else if (item.app === 'Journal') {
                 openWindow(key, item.name, <DiaryViewer />, item.icon, { width: 900, height: 650 });
             } else if (item.app === 'TiebaApp') {
                 openWindow(key, item.name, <TiebaApp initialUrl={item.content} />, item.icon, { isMaximized: true });
             } else if (item.app === 'DummyApp') {
                 showModal(item.name, 'Windows 无法打开此程序。请确认程序已正确安装。', 'error');
             } else if (item.app === 'QQMail') {
                 openWindow('qqmail-browser', 'QQ邮箱', <InternetExplorer url="http://mail.qq.com" plugin={defaultPlugin} />, 'ie', { width: 1000, height: 700 });
             }
        } else if (item.type === 'file') {
             if (item.app === 'Notepad') {
                 openWindow(key, item.name, <Notepad content={item.content} readOnly={item.readOnly} />, 'file');
             } else if (item.app === 'InternetExplorer') {
                 if (item.isHtmlContent) {
                     // Pass HTML directly
                     openWindow(key, item.name, <InternetExplorer html={item.content} plugin={defaultPlugin} />, 'html', { isMaximized: true });
                 } else {
                     openWindow(key, item.name, <InternetExplorer url={item.content} plugin={defaultPlugin} />, 'html', { isMaximized: true });
                 }
             } else if (item.app === 'PhotoViewer') {
                 openWindow(key, item.name, <PhotoViewer src={item.content} />, 'image', { width: 600, height: 500 });
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
        <DesktopContainer $bgUrl={desktopBg} onContextMenu={handleContextMenu}>
            <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
                {Object.entries(desktopItems).map(([key, item]) => {
                    // Recycle bin: show full icon when it has content
                    const iconName = (key === 'Recycle Bin' && item.children && Object.keys(item.children).length > 0)
                        ? 'recycle_bin_full'
                        : item.icon;
                    return (
                    <DesktopIcon key={key} data-testid={`desktop-icon-${key}`} onDoubleClick={() => handleIconDoubleClick(key, item)}>
                        <div className="icon-wrapper">
                            <XPIcon name={iconName} size={32} />
                        </div>
                        <span>{item.name}</span>
                    </DesktopIcon>
                    );
                })}
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

            <StickyNote />

            <FirstLoginGuide />
            <AdwarePopups />
        </DesktopContainer>
    );
};

export default Desktop;
