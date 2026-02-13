import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useModal } from '../context/ModalContext';
import { useFileSystem } from '../context/FileSystemContext';
import ContextMenu from '../components/ContextMenu';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ECE9D8;
`;

const MenuBar = styled.div`
    height: 20px;
    background: #F1EFE2;
    border-bottom: 1px solid #ACA899;
    display: flex;
    align-items: center;
    padding: 0 4px;
    font-size: 11px;
`;

const MenuItem = styled.div`
    padding: 2px 8px;
    cursor: pointer;

    &:hover {
        background: #316AC5;
        color: #fff;
    }
`;

const Toolbar = styled.div`
    height: 32px;
    background: linear-gradient(to bottom, #F9FCFD 0%, #DDECFD 100%);
    border-bottom: 1px solid #A0B2C8;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
`;

const ToolButton = styled.button`
    padding: 4px 8px;
    background: linear-gradient(to bottom, #fff 0%, #e5e5e5 100%);
    border: 1px solid #999;
    border-radius: 2px;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        background: linear-gradient(to bottom, #f0f0f0 0%, #d5d5d5 100%);
    }

    &:active {
        background: linear-gradient(to bottom, #d5d5d5 0%, #e5e5e5 100%);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const MainContent = styled.div`
    flex: 1;
    display: flex;
    overflow: hidden;
`;

const Sidebar = styled.div`
    width: 220px;
    background: #F1EFE2;
    border-right: 1px solid #ACA899;
    overflow-y: auto;
`;

const YearGroup = styled.div`
    border-bottom: 1px solid #D4D0C8;
`;

const YearHeader = styled.div`
    padding: 6px 10px;
    background: ${props => props.$expanded ? '#E8E5D8' : 'transparent'};
    cursor: pointer;
    font-size: 11px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        background: #E8E5D8;
    }
`;

const MonthGroup = styled.div`
    padding-left: 10px;
`;

const MonthHeader = styled.div`
    padding: 4px 10px;
    background: ${props => props.$expanded ? '#DDD9CC' : 'transparent'};
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        background: #DDD9CC;
    }
`;

const LogEntry = styled.div`
    padding: 4px 10px 4px 30px;
    font-size: 11px;
    cursor: pointer;
    border-bottom: 1px solid #E8E5D8;
    background: ${props => props.$selected ? '#316AC5' : 'transparent'};
    color: ${props => props.$selected ? '#fff' : '#000'};

    &:hover {
        background: ${props => props.$selected ? '#316AC5' : '#E8E5D8'};
    }
`;

const LogDate = styled.div`
    font-weight: bold;
    margin-bottom: 2px;
`;

const LogPreview = styled.div`
    font-size: 10px;
    color: ${props => props.$selected ? '#fff' : '#666'};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ContentArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
`;

const NavigationBar = styled.div`
    height: 32px;
    background: #F1EFE2;
    border-bottom: 1px solid #ACA899;
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 8px;
`;

const NavButton = styled.button`
    padding: 4px 12px;
    background: linear-gradient(to bottom, #fff 0%, #e5e5e5 100%);
    border: 1px solid #999;
    border-radius: 2px;
    cursor: pointer;
    font-size: 11px;

    &:hover:not(:disabled) {
        background: linear-gradient(to bottom, #f0f0f0 0%, #d5d5d5 100%);
    }

    &:active:not(:disabled) {
        background: linear-gradient(to bottom, #d5d5d5 0%, #e5e5e5 100%);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const ContentBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
`;

const ContentTitle = styled.div`
    font-size: 14px;
    font-weight: bold;
    color: #000;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid #D4D0C8;
`;

const ContentText = styled.div`
    font-size: 12px;
    line-height: 1.8;
    color: #000;
    white-space: pre-wrap;
    font-family: 'Microsoft YaHei', sans-serif;
    user-select: text;
    cursor: text;
`;

const LockedContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #999;
    gap: 15px;
`;

const UnlockButton = styled.button`
    padding: 8px 20px;
    background: linear-gradient(to bottom, #fff 0%, #e5e5e5 100%);
    border: 1px solid #999;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;

    &:hover {
        background: linear-gradient(to bottom, #f0f0f0 0%, #d5d5d5 100%);
    }

    &:active {
        background: linear-gradient(to bottom, #d5d5d5 0%, #e5e5e5 100%);
    }
`;

const DiaryViewer = () => {
    const { fs: fileSystem } = useFileSystem();
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [unlockedLogs, setUnlockedLogs] = useState(new Set());
    const [expandedYears, setExpandedYears] = useState(new Set(['2015', '2016']));
    const [expandedMonths, setExpandedMonths] = useState(new Set(['2015-12', '2016-01', '2016-02']));
    const { showPasswordDialog } = useModal();
    const contentBodyRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

    const handleContentContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0 });
    };

    const handleCopy = () => {
        const selected = window.getSelection().toString();
        if (selected) {
            navigator.clipboard.writeText(selected);
        }
    };

    const handleSelectAll = () => {
        if (contentBodyRef.current) {
            const range = document.createRange();
            range.selectNodeContents(contentBodyRef.current);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    const contentMenuItems = [
        { label: '复制(C)', action: handleCopy },
        { type: 'separator' },
        { label: '全选(A)', action: handleSelectAll },
    ];

    useEffect(() => {
        const loadLogs = async () => {
            const parsedLogs = [];

            const extractLogs = (node, path = []) => {
                if (!node || !node.children) return;

                for (const key in node.children) {
                    const child = node.children[key];
                    const currentPath = [...path, key];

                    if (child.type === 'file' && child.name && child.name.match(/\d{4}\.\d{2}\.\d{2}/)) {
                        const match = child.name.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(.+)\.txt/);
                        if (match) {
                            const year = match[1];
                            const month = match[2];
                            const day = match[3];
                            const date = `${year}.${month}.${day}`;
                            const weekday = match[4];
                            const isLocked = date === '2016.02.16';

                            parsedLogs.push({
                                date,
                                year,
                                month,
                                weekday,
                                content: child.content || '',
                                path: currentPath.join(' > '),
                                locked: isLocked,
                                password: isLocked ? '20151123' : null
                            });
                        }
                    } else if (child.type === 'folder') {
                        extractLogs(child, currentPath);
                    }
                }
            };

            if (fileSystem?.root?.children) {
                extractLogs(fileSystem.root);
            }

            parsedLogs.sort((a, b) => a.date.localeCompare(b.date));

            setLogs(parsedLogs);
            if (parsedLogs.length > 0) {
                setSelectedLog(parsedLogs[0]);
            }
        };

        if (fileSystem) {
            loadLogs();
        }
    }, [fileSystem]);

    const handleUnlock = async (log) => {
        const success = await showPasswordDialog({
            title: '输入密码',
            message: `此日志已加密，请输入密码查看`,
            correctPassword: log.password,
            puzzleId: `log_${log.date.replace(/\./g, '_')}`
        });

        if (success) {
            setUnlockedLogs(prev => new Set([...prev, log.date]));
        }
    };

    const getPreview = (log) => {
        if (log.locked && !unlockedLogs.has(log.date)) {
            return '🔒 已加密';
        }
        const content = log.content;
        const firstLine = content.split('\n')[0];
        return firstLine.substring(0, 25);
    };

    const isLogUnlocked = (log) => {
        return !log.locked || unlockedLogs.has(log.date);
    };

    const toggleYear = (year) => {
        setExpandedYears(prev => {
            const newSet = new Set(prev);
            if (newSet.has(year)) {
                newSet.delete(year);
            } else {
                newSet.add(year);
            }
            return newSet;
        });
    };

    const toggleMonth = (yearMonth) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(yearMonth)) {
                newSet.delete(yearMonth);
            } else {
                newSet.add(yearMonth);
            }
            return newSet;
        });
    };

    const goToPrevious = () => {
        const currentIndex = logs.findIndex(log => log === selectedLog);
        if (currentIndex > 0) {
            setSelectedLog(logs[currentIndex - 1]);
        }
    };

    const goToNext = () => {
        const currentIndex = logs.findIndex(log => log === selectedLog);
        if (currentIndex < logs.length - 1) {
            setSelectedLog(logs[currentIndex + 1]);
        }
    };

    // 按年月分组
    const groupedLogs = logs.reduce((acc, log) => {
        if (!acc[log.year]) acc[log.year] = {};
        if (!acc[log.year][log.month]) acc[log.year][log.month] = [];
        acc[log.year][log.month].push(log);
        return acc;
    }, {});

    const currentIndex = logs.findIndex(log => log === selectedLog);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < logs.length - 1;

    return (
        <Container>
            <MenuBar>
                <MenuItem>文件(F)</MenuItem>
                <MenuItem>编辑(E)</MenuItem>
                <MenuItem>查看(V)</MenuItem>
                <MenuItem>帮助(H)</MenuItem>
            </MenuBar>
            <Toolbar>
                <ToolButton>新建</ToolButton>
                <ToolButton>打开</ToolButton>
                <ToolButton>保存</ToolButton>
                <div style={{ width: '1px', height: '20px', background: '#999', margin: '0 4px' }} />
                <ToolButton>编辑</ToolButton>
                <ToolButton>删除</ToolButton>
            </Toolbar>
            <MainContent>
                <Sidebar>
                    {Object.keys(groupedLogs).sort().map(year => (
                        <YearGroup key={year}>
                            <YearHeader
                                $expanded={expandedYears.has(year)}
                                onClick={() => toggleYear(year)}
                            >
                                <span>{expandedYears.has(year) ? '▼' : '▶'}</span>
                                <span>{year}年</span>
                            </YearHeader>
                            {expandedYears.has(year) && Object.keys(groupedLogs[year]).sort().map(month => (
                                <MonthGroup key={`${year}-${month}`}>
                                    <MonthHeader
                                        $expanded={expandedMonths.has(`${year}-${month}`)}
                                        onClick={() => toggleMonth(`${year}-${month}`)}
                                    >
                                        <span>{expandedMonths.has(`${year}-${month}`) ? '▼' : '▶'}</span>
                                        <span>{month}月</span>
                                    </MonthHeader>
                                    {expandedMonths.has(`${year}-${month}`) && groupedLogs[year][month].map((log, index) => (
                                        <LogEntry
                                            key={index}
                                            $selected={selectedLog === log}
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <LogDate>{log.date.split('.')[2]} {log.weekday}</LogDate>
                                            <LogPreview $selected={selectedLog === log}>
                                                {getPreview(log)}
                                            </LogPreview>
                                        </LogEntry>
                                    ))}
                                </MonthGroup>
                            ))}
                        </YearGroup>
                    ))}
                </Sidebar>
                <ContentArea>
                    <NavigationBar>
                        <NavButton onClick={goToPrevious} disabled={!hasPrevious}>
                            ← 上一篇
                        </NavButton>
                        <NavButton onClick={goToNext} disabled={!hasNext}>
                            下一篇 →
                        </NavButton>
                    </NavigationBar>
                    <ContentBody ref={contentBodyRef} onContextMenu={handleContentContextMenu}>
                        {selectedLog ? (
                            <>
                                <ContentTitle>
                                    {selectedLog.date} {selectedLog.weekday}
                                </ContentTitle>
                                {isLogUnlocked(selectedLog) ? (
                                    <ContentText>{selectedLog.content}</ContentText>
                                ) : (
                                    <LockedContent>
                                        <div style={{ fontSize: '32px' }}>🔒</div>
                                        <div>此日志已加密</div>
                                        <UnlockButton onClick={() => handleUnlock(selectedLog)}>
                                            解锁
                                        </UnlockButton>
                                    </LockedContent>
                                )}
                            </>
                        ) : (
                            <ContentText>请从左侧选择日志条目</ContentText>
                        )}
                    </ContentBody>
                    {createPortal(
                        <ContextMenu
                            visible={contextMenu.visible}
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={closeContextMenu}
                            menuItems={contentMenuItems}
                        />,
                        document.body
                    )}
                </ContentArea>
            </MainContent>
        </Container>
    );
};

export default DiaryViewer;
