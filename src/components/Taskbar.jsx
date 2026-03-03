import { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useUserSession } from '../context/UserSessionContext';
import { useTray } from '../context/TrayContext';
import XPIcon from './XPIcon';
import SystemClock from './SystemClock';
import { APP_REGISTRY } from '../registry/apps.jsx';
import { defaultPlugin } from '../apps/BrowserPlugins';
import { useModal } from '../context/ModalContext';
import ContextMenu from './ContextMenu';

const TaskbarContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 10%, #245EDC 100%);
    display: flex;
    align-items: center;
    z-index: 2147483647;
    border-top: 1px solid #4886EA;
`;

const StartButton = styled.button`
    height: 30px;
    width: 100px;
    background: linear-gradient(to bottom, #3E864E 0%, #57A965 10%, #3E864E 100%);
    border: none;
    border-radius: 0 10px 10px 0;
    color: white;
    font-style: italic;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    padding-left: 10px;
    cursor: pointer;
    box-shadow: 2px 0 5px rgba(0,0,0,0.5);
    text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
    
    &:hover {
        filter: brightness(1.1);
    }
    
    &:active, &.active {
        filter: brightness(0.9);
        box-shadow: inset 2px 2px 2px rgba(0,0,0,0.5);
    }
    
    .start-icon {
        margin-right: 4px;
        filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));
    }
`;

const Divider = styled.div`
    width: 5px;
    height: 100%;
    background: rgba(0,0,0,0.1);
    margin-left: 5px;
`;

const TaskItems = styled.div`
    flex: 1;
    display: flex;
    padding-left: 5px;
    gap: 2px;
    overflow: hidden;
`;

const taskFlash = keyframes`
    0%, 100% { background: #3980F4; }
    50%       { background: #FF8C00; }
`;

const TaskItem = styled.div`
    width: 150px;
    height: 25px;
    background: ${props => props.$active ? '#1E52B7' : '#3980F4'};
    color: white;
    border: 1px solid #1646A1;
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding: 0 5px;
    font-size: 11px;
    cursor: pointer;
    margin-top: 2px;
    box-shadow: ${props => props.$active ? 'inset 1px 1px 2px black' : 'none'};
    position: relative;
    overflow: hidden;

    ${props => props.$flashing && css`
        animation: ${taskFlash} 0.5s ease-in-out 6;
    `}

    &:hover {
        background: #5092F6;
    }

    .task-icon {
        margin-right: 5px;
    }
`;

const TaskBadge = styled.div`
    position: absolute;
    top: 1px;
    right: 3px;
    background: #E81224;
    color: white;
    border-radius: 50%;
    min-width: 13px;
    height: 13px;
    font-size: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2px;
    font-weight: bold;
    line-height: 1;
    pointer-events: none;
`;

const TaskProgress = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: ${props => props.$pct}%;
    background: linear-gradient(to right, #00C6FF, #0072FF);
    transition: width 0.3s ease;
    pointer-events: none;
`;

const SystemTray = styled.div`
    background: #0B96D5;
    height: 30px;
    min-width: 120px;
    padding: 0 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    border-left: 1px solid #083E6E;
    box-shadow: inset 1px 1px 1px rgba(0,0,0,0.2);
    white-space: nowrap;
`;

const StartMenu = styled.div`
    position: absolute;
    bottom: 30px;
    left: 0;
    width: 300px;
    background: white;
    border: 1px solid #003399;
    border-radius: 5px 5px 0 0;
    z-index: 10000;
    box-shadow: 2px -2px 5px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
`;

const StartHeader = styled.div`
    height: 50px;
    background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 100%);
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-radius: 5px 5px 0 0;
    
    .user-avatar {
        margin-right: 10px;
        border: 2px solid white;
        border-radius: 3px;
        background: #99CCFF;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
    }

    span {
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 1px black;
    }
`;

const StartBody = styled.div`
    display: flex;
    height: 400px;
    border-top: 1px solid #F5C684;
`;

const StartLeft = styled.div`
    width: 50%;
    background: white;
    padding: 5px;
    overflow-y: auto;
`;

const StartRight = styled.div`
    width: 50%;
    background: #D3E5FA;
    padding: 5px;
    border-left: 1px solid #95BDEE;
    overflow-y: auto;
`;

const MenuItem = styled.div`
    display: flex;
    align-items: center;
    padding: 5px;
    cursor: pointer;
    font-size: 11px;
    color: #333;

    &:hover {
        background: #316AC5;
        color: white;
    }

    .menu-icon {
        margin-right: 5px;
    }
`;

const MenuSeparator = styled.div`
    height: 1px;
    background: #C0C0C0;
    margin: 3px 5px;
`;

const StartFooter = styled.div`
    height: 40px;
    background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 100%);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 10px;
    gap: 10px;
    
    button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-size: 11px;
        
        &:hover {
            text-decoration: underline;
        }

        .footer-icon {
            margin-right: 5px;
        }
    }
`;

// Simple Turn Off Dialog styled components (inline for now as it's part of Taskbar logic)
const TurnOffOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 20000;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const TurnOffDialog = styled.div`
    width: 300px;
    background: #003399; /* XP Blue header color as base */
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const DialogHeader = styled.div`
    padding: 5px 10px;
    color: white;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const DialogBody = styled.div`
    background: linear-gradient(to bottom, #f0f0f0 0%, #dcdcdc 100%);
    padding: 20px;
    display: flex;
    justify-content: space-around;
    align-items: center;
`;

const ActionButton = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    &:hover .icon-circle {
        transform: scale(1.1);
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
    }

    .icon-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 5px;
        transition: transform 0.1s;
        border: 1px solid rgba(0,0,0,0.2);
    }

    .shutdown { background: #E04646; } /* Red */
    .restart { background: #45B050; } /* Green */
    .standby { background: #EBC644; } /* Yellow */

    span {
        font-size: 11px;
        color: #333;
    }
`;

const DialogFooter = styled.div`
    background: #003399;
    padding: 5px 10px;
    display: flex;
    justify-content: flex-end;
`;

const CancelButton = styled.button`
    padding: 3px 10px;
    background: #f0f0f0;
    border: 1px solid #999;
    border-radius: 2px;
    cursor: pointer;
    font-size: 11px;

    &:hover {
        background: #e0e0e0;
    }
`;


const Taskbar = () => {
    const { windows, activeWindowId, focusWindow, minimizeWindow, maximizeWindow, openWindow, closeWindow } = useWindowManager();
    const { logout } = useUserSession();
    const { showModal } = useModal();
    const { items: trayItems } = useTray();
    const [startOpen, setStartOpen] = useState(false);
    const [showTurnOff, setShowTurnOff] = useState(false);
    const [qqContextMenu, setQqContextMenu] = useState(null);
    const [taskContextMenu, setTaskContextMenu] = useState(null);
    const [selectedWindow, setSelectedWindow] = useState(null);
    const startMenuRef = useRef(null);
    const startButtonRef = useRef(null);
    const qqContextMenuRef = useRef(null);
    const taskContextMenuRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('xp_open_windows');
        logout();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (startOpen &&
                startMenuRef.current &&
                !startMenuRef.current.contains(event.target) &&
                startButtonRef.current &&
                !startButtonRef.current.contains(event.target)) {
                setStartOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [startOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (qqContextMenu &&
                qqContextMenuRef.current &&
                !qqContextMenuRef.current.contains(event.target)) {
                setQqContextMenu(null);
            }
            if (taskContextMenu &&
                taskContextMenuRef.current &&
                !taskContextMenuRef.current.contains(event.target)) {
                setTaskContextMenu(null);
                setSelectedWindow(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [qqContextMenu, taskContextMenu]);

    const handleTaskContextMenu = (e, win) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedWindow(win);
        setTaskContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleTaskMenuAction = (action) => {
        if (!selectedWindow) return;
        setTaskContextMenu(null);
        setSelectedWindow(null);

        switch (action) {
            case 'close':
                closeWindow(selectedWindow.id);
                break;
            case 'minimize':
                minimizeWindow(selectedWindow.id);
                break;
            case 'maximize':
                maximizeWindow(selectedWindow.id);
                break;
            case 'restore':
                maximizeWindow(selectedWindow.id); // 切换最大化/恢复状态
                break;
        }
    };

    const handleQqContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setQqContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleQqMenuAction = (action) => {
        setQqContextMenu(null);
        const ie = APP_REGISTRY.InternetExplorer;
        const qq = APP_REGISTRY.QQLogin;
        if (action === 'open') {
            openWindow('QQLogin', 'QQ', qq.restore({}), 'qq', qq.window);
        } else if (action === 'space') {
            openWindow('qzone-browser', 'QQ空间',
                ie.restore({ url: 'http://qzone.qq.com', plugin: defaultPlugin }),
                'qzone', { width: 1000, height: 700, isMaximized: true });
        } else if (action === 'mail') {
            openWindow('qqmail-browser', 'QQ邮箱',
                ie.restore({ url: 'http://mail.qq.com', plugin: defaultPlugin }),
                ie.icon, { width: 1000, height: 700 });
        } else if (action === 'exit') {
            windows.forEach(w => {
                if (['QQLogin', 'qzone-browser', 'qqmail-browser'].includes(w.appId)) {
                    closeWindow(w.id);
                }
            });
        }
    };

    const toggleStart = () => setStartOpen(!startOpen);

    const handleTaskClick = (win) => {
        if (activeWindowId === win.id && !win.isMinimized) {
            minimizeWindow(win.id);
        } else {
            focusWindow(win.id);
        }
    };

    const handleLaunch = (appName, pathOrKey) => {
        setStartOpen(false);
        const ie = APP_REGISTRY.InternetExplorer;
        const explorer = APP_REGISTRY.Explorer;

        if (appName === 'Internet Explorer') {
            openWindow('InternetExplorer', 'Internet Explorer',
                ie.restore({ url: 'http://www.hao123.com', plugin: defaultPlugin }),
                ie.icon, { isMaximized: true });
        } else if (appName === 'QQ') {
            const qq = APP_REGISTRY.QQLogin;
            const existing = windows.find(w => w.appId === 'QQLogin');
            if (existing) {
                focusWindow(existing.id);
            } else {
                openWindow('QQLogin', 'QQ', qq.restore({}), 'qq', qq.window);
            }
        } else if (appName === 'QQMail') {
            openWindow('qqmail-browser', 'QQ邮箱',
                ie.restore({ url: 'http://mail.qq.com', plugin: defaultPlugin }),
                ie.icon, { width: 1000, height: 700 });
        } else if (appName === 'Explorer') {
            openWindow('Explorer', pathOrKey,
                explorer.restore({ initialPath: [pathOrKey] }),
                'folder', explorer.defaultWindowProps);
        } else if (appName === 'Recycle Bin') {
            openWindow('Explorer', pathOrKey,
                explorer.restore({ initialPath: [pathOrKey] }),
                'recycle_bin', explorer.defaultWindowProps);
        } else if (appName === 'DummyApp') {
            showModal(pathOrKey || '程序', `找不到文件 "${pathOrKey}"。\n请确认文件名是否正确，然后再试一次。`, 'error');
        }
    };

    const handleTurnOffRequest = () => {
        setStartOpen(false);
        setShowTurnOff(true);
    };

    const performShutdown = () => {
        localStorage.removeItem('xp_open_windows');
        localStorage.setItem('xp_power_state', 'shutdown');
        window.location.reload();
    };

    const performRestart = () => {
        localStorage.removeItem('xp_open_windows');
        localStorage.setItem('xp_power_state', 'restart');
        window.location.reload();
    };

    return (
        <>
            {showTurnOff && (
                <TurnOffOverlay>
                    <TurnOffDialog>
                        <DialogHeader>
                            <span>关闭计算机</span>
                            <XPIcon name="close" size={16} color="white" style={{cursor:'pointer'}} onClick={() => setShowTurnOff(false)}/>
                        </DialogHeader>
                        <DialogBody>
                            <ActionButton className="disabled" style={{ opacity: 0.5 }}>
                                <div className="icon-circle standby">
                                    <XPIcon name="clock" size={16} color="white" />
                                </div>
                                <span>待机</span>
                            </ActionButton>
                            <ActionButton onClick={performShutdown}>
                                <div className="icon-circle shutdown">
                                    <XPIcon name="shutdown" size={16} color="white" />
                                </div>
                                <span>关闭</span>
                            </ActionButton>
                            <ActionButton onClick={performRestart}>
                                <div className="icon-circle restart">
                                    <XPIcon name="refresh" size={16} color="white" />
                                </div>
                                <span>重新启动</span>
                            </ActionButton>
                        </DialogBody>
                        <DialogFooter>
                            <CancelButton onClick={() => setShowTurnOff(false)}>取消</CancelButton>
                        </DialogFooter>
                    </TurnOffDialog>
                </TurnOffOverlay>
            )}

            {startOpen && (
                <StartMenu ref={startMenuRef}>
                    <StartHeader>
                         <div className="user-avatar">
                             <XPIcon name="user" size={24} color="white" />
                         </div>
                         <span>Administrator</span>
                    </StartHeader>
                    <StartBody>
                        <StartLeft>
                            <MenuItem onClick={() => handleLaunch('Internet Explorer')}>
                                <XPIcon name="ie" size={24} className="menu-icon" />
                                <span>Internet Explorer</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('QQ')}>
                                <XPIcon name="qq" size={24} className="menu-icon" />
                                <span>QQ</span>
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem onClick={() => handleLaunch('QQMail')}>
                                <XPIcon name="email" size={24} className="menu-icon" />
                                <span>QQ邮箱</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', 'WPS Office')}>
                                <XPIcon name="wps" size={24} className="menu-icon" />
                                <span>WPS Office</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', '暴风影音')}>
                                <XPIcon name="baofeng" size={24} className="menu-icon" />
                                <span>暴风影音</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', '迅雷')}>
                                <XPIcon name="thunder" size={24} className="menu-icon" />
                                <span>迅雷</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', '360安全卫士')}>
                                <XPIcon name="360safe" size={24} className="menu-icon" />
                                <span>360安全卫士</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', '酷狗音乐')}>
                                <XPIcon name="kugou" size={24} className="menu-icon" />
                                <span>酷狗音乐</span>
                            </MenuItem>
                        </StartLeft>
                        <StartRight>
                            <MenuItem onClick={() => handleLaunch('Explorer', '我的文档')}>
                                <XPIcon name="documents" size={24} className="menu-icon" />
                                <span>我的文档</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('Explorer', '我的电脑')}>
                                <XPIcon name="computer" size={24} className="menu-icon" />
                                <span>我的电脑</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('Explorer', '我的音乐')}>
                                <XPIcon name="folder" size={24} className="menu-icon" />
                                <span>我的音乐</span>
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem onClick={() => handleLaunch('DummyApp', '控制面板')}>
                                <XPIcon name="control_panel" size={24} className="menu-icon" />
                                <span>控制面板</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('DummyApp', '打印机和传真')}>
                                <XPIcon name="printer" size={24} className="menu-icon" />
                                <span>打印机和传真</span>
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem onClick={() => handleLaunch('Recycle Bin', '回收站')}>
                                <XPIcon name="recycle_bin" size={24} className="menu-icon" />
                                <span>回收站</span>
                            </MenuItem>
                        </StartRight>
                    </StartBody>
                    <StartFooter>
                        <button onClick={handleLogout}>
                            <XPIcon name="logout" size={16} className="footer-icon" color="white" />
                            注销
                        </button>
                        <button onClick={handleTurnOffRequest}>
                            <XPIcon name="shutdown" size={16} className="footer-icon" color="white" />
                            关闭计算机
                        </button>
                    </StartFooter>
                </StartMenu>
            )}
            <TaskbarContainer data-testid="taskbar" onClick={() => setStartOpen(false)}>
                <StartButton
                    ref={startButtonRef}
                    onClick={(e) => { e.stopPropagation(); toggleStart(); }}
                    className={startOpen ? 'active' : ''}
                >
                    <XPIcon name="windows" size={20} className="start-icon" color="white" />
                    开始
                </StartButton>
                <Divider />
                <TaskItems>
                    {windows.map(win => (
                        <TaskItem
                            key={win.id}
                            $active={activeWindowId === win.id && !win.isMinimized}
                            $flashing={win.isFlashing}
                            onClick={(e) => { e.stopPropagation(); handleTaskClick(win); }}
                            onContextMenu={(e) => handleTaskContextMenu(e, win)}
                        >
                            <XPIcon name={win.icon} size={16} className="task-icon" />
                            {win.title}
                            {win.badge != null && <TaskBadge>{win.badge}</TaskBadge>}
                            {win.progress != null && <TaskProgress $pct={win.progress} />}
                        </TaskItem>
                    ))}
                </TaskItems>
                <SystemTray>
                    {/* 动态托盘图标（由各应用通过 TrayContext 注册）*/}
                    {trayItems.map(item => (
                        <div
                            key={item.id}
                            style={{ marginRight: '8px', display: 'flex', alignItems: 'center', cursor: item.onClick ? 'pointer' : 'default' }}
                            title={item.tooltip || ''}
                            onClick={item.onClick ? (e) => { e.stopPropagation(); item.onClick(); } : undefined}
                        >
                            <XPIcon name={item.icon} size={16} color="white" />
                        </div>
                    ))}
                    {/* 固定系统托盘图标 */}
                    <div
                        style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}
                        title="音量"
                    >
                        <XPIcon name="sound" size={16} color="white" />
                    </div>
                    {/* QQ tray icon is now dynamically registered by QQLogin component */}
                    <div
                        style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}
                        title="网络已连接"
                    >
                         <XPIcon name="network" size={16} color="white" />
                    </div>
                    <SystemClock />
                </SystemTray>
            </TaskbarContainer>

            {/* 任务栏窗口右键菜单 */}
            {taskContextMenu && (
                <ContextMenu
                    ref={taskContextMenuRef}
                    x={taskContextMenu.x}
                    y={taskContextMenu.y}
                    visible={true}
                    onClose={() => { setTaskContextMenu(null); setSelectedWindow(null); }}
                    menuItems={[
                        { label: selectedWindow?.isMaximized ? '恢复' : '最大化', action: () => handleTaskMenuAction('maximize') },
                        { label: '最小化', action: () => handleTaskMenuAction('minimize') },
                        { type: 'separator' },
                        { label: '关闭', action: () => handleTaskMenuAction('close') }
                    ]}
                />
            )}
        </>
    );
};

export default Taskbar;
