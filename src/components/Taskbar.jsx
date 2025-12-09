import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useUserSession } from '../context/UserSessionContext';
import XPIcon from './XPIcon';
import timeInfo from '../data/time_info.json';

const TaskbarContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 10%, #245EDC 100%);
    display: flex;
    align-items: center;
    z-index: 9999;
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


const Taskbar = () => {
    const { windows, activeWindowId, focusWindow, minimizeWindow } = useWindowManager();
    const { logout } = useUserSession();
    const [startOpen, setStartOpen] = useState(false);
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();

            // 格式化时间
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // 使用配置文件中的自定义日期，如果存在的话
            const formattedDate = timeInfo.custom_date ||
                `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

            // 组合日期和时间
            setDateTime(`${formattedDate}${timeInfo.separator || ' '}${formattedTime}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleStart = () => setStartOpen(!startOpen);

    const handleTaskClick = (win) => {
        if (activeWindowId === win.id && !win.isMinimized) {
            minimizeWindow(win.id);
        } else {
            focusWindow(win.id);
        }
    };

    return (
        <>
            {startOpen && (
                <StartMenu>
                    <StartHeader>
                         <div className="user-avatar">
                             <XPIcon name="user" size={24} color="white" />
                         </div>
                         <span>Administrator</span>
                    </StartHeader>
                    <StartBody>
                        <StartLeft>
                            <MenuItem>
                                <XPIcon name="ie" size={24} className="menu-icon" />
                                <span>Internet Explorer</span>
                            </MenuItem>
                            <MenuItem>
                                <XPIcon name="qq" size={24} className="menu-icon" />
                                <span>QQ</span>
                            </MenuItem>
                        </StartLeft>
                        <StartRight>
                            <MenuItem>
                                <XPIcon name="documents" size={24} className="menu-icon" />
                                <span>我的文档</span>
                            </MenuItem>
                            <MenuItem>
                                <XPIcon name="computer" size={24} className="menu-icon" />
                                <span>我的电脑</span>
                            </MenuItem>
                            <MenuItem>
                                <XPIcon name="recycle_bin" size={24} className="menu-icon" />
                                <span>回收站</span>
                            </MenuItem>
                        </StartRight>
                    </StartBody>
                    <StartFooter>
                        <button onClick={logout}>
                            <XPIcon name="logout" size={16} className="footer-icon" color="white" />
                            注销
                        </button>
                        <button onClick={() => window.location.reload()}>
                            <XPIcon name="shutdown" size={16} className="footer-icon" color="white" />
                            关闭计算机
                        </button>
                    </StartFooter>
                </StartMenu>
            )}
            <TaskbarContainer onClick={() => setStartOpen(false)}>
                <StartButton onClick={(e) => { e.stopPropagation(); toggleStart(); }} className={startOpen ? 'active' : ''}>
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
                    {dateTime}
                </SystemTray>
            </TaskbarContainer>
        </>
    );
};

export default Taskbar;
