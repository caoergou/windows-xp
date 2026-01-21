import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useUserSession } from '../context/UserSessionContext';
import XPIcon from './XPIcon';
import SystemClock from './SystemClock';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import QQ from '../apps/QQ';
import { tiebaPlugin } from '../apps/TiebaApp';

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

const TaskItem = styled.div`
    width: 150px;
    height: 25px;
    background: ${props => props.active ? '#1E52B7' : '#3980F4'};
    color: white;
    border: 1px solid #1646A1;
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding: 0 5px;
    font-size: 11px;
    cursor: pointer;
    margin-top: 2px;
    box-shadow: ${props => props.active ? 'inset 1px 1px 2px black' : 'none'};
    
    &:hover {
        background: #5092F6;
    }
    
    .task-icon {
        margin-right: 5px;
    }
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
    height: 300px;
    border-top: 1px solid #F5C684;
`;

const StartLeft = styled.div`
    width: 50%;
    background: white;
    padding: 5px;
`;

const StartRight = styled.div`
    width: 50%;
    background: #D3E5FA;
    padding: 5px;
    border-left: 1px solid #95BDEE;
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
    const { windows, activeWindowId, focusWindow, minimizeWindow, openWindow } = useWindowManager();
    const { logout } = useUserSession();
    const [startOpen, setStartOpen] = useState(false);
    const [showTurnOff, setShowTurnOff] = useState(false);
    const startMenuRef = useRef(null);
    const startButtonRef = useRef(null);

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
        if (appName === 'Internet Explorer') {
             openWindow('Internet Explorer', 'Internet Explorer', <InternetExplorer plugin={tiebaPlugin} />, 'ie', { isMaximized: true });
        } else if (appName === 'QQ') {
             const existingQQ = windows.find(w => w.appId === 'QQ');
             if (existingQQ) {
                 focusWindow(existingQQ.id);
             } else {
                 openWindow('QQ', 'QQ', <QQ />, 'qq', { width: 280, height: 600, resizable: false });
             }
        } else if (appName === 'Explorer') {
             // For folders
             openWindow(pathOrKey, pathOrKey, <Explorer initialPath={[pathOrKey]} />, 'folder');
        } else if (appName === 'Recycle Bin') {
             openWindow(pathOrKey, pathOrKey, <Explorer initialPath={[pathOrKey]} />, 'recycle_bin');
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
                        </StartLeft>
                        <StartRight>
                            <MenuItem onClick={() => handleLaunch('Explorer', 'My Documents')}>
                                <XPIcon name="documents" size={24} className="menu-icon" />
                                <span>我的文档</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('Explorer', 'My Computer')}>
                                <XPIcon name="computer" size={24} className="menu-icon" />
                                <span>我的电脑</span>
                            </MenuItem>
                            <MenuItem onClick={() => handleLaunch('Recycle Bin', 'Recycle Bin')}>
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
                            active={activeWindowId === win.id && !win.isMinimized}
                            onClick={(e) => { e.stopPropagation(); handleTaskClick(win); }}
                        >
                            <XPIcon name={win.icon} size={16} className="task-icon" />
                            {win.title}
                        </TaskItem>
                    ))}
                </TaskItems>
                <SystemTray>
                    <div
                        style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}
                        title="网络已连接"
                    >
                         <XPIcon name="network" size={16} color="white" />
                    </div>
                    <SystemClock />
                </SystemTray>
            </TaskbarContainer>
        </>
    );
};

export default Taskbar;
