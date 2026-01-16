import React, { useState, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import historyData from '../data/qq/history.json';

// 动态导入群聊数据
const groupHistoryFiles = import.meta.glob('../data/qq/groups/*.json', { eager: true });

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: 'Tahoma', sans-serif;
    font-size: 12px;
    background: #EBF2F9;
`;

const Toolbar = styled.div`
    padding: 8px;
    border-bottom: 1px solid #7F9DB9;
    background: #F0F0F0;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Button = styled.button`
    border: 1px solid #7F9DB9;
    background: linear-gradient(to bottom, #f9f9f9, #e3e3e3);
    padding: 2px 8px;
    cursor: pointer;
    font-size: 11px;
    border-radius: 2px;

    &:hover {
        background: #e3e3e3;
    }
`;

const MessageList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: white;
`;

const Message = styled.div`
    margin-bottom: 12px;
    line-height: 1.4;
`;

const MessageHeader = styled.div`
    color: #008000; /* Default green */
    margin-bottom: 2px;

    ${props => props.$isMe && `
        color: #0000FF; /* Blue for me */
    `}
`;

const Text = styled.div`
    padding-left: 10px;
    color: black;
`;

const DateHeader = styled.div`
    text-align: center;
    margin: 10px 0;
    color: #888;
    border-bottom: 1px dashed #ccc;
    line-height: 0.1em;

    span {
        background: white;
        padding: 0 10px;
    }
`;

// --- Calendar Components ---

const CalendarContainer = styled.div`
    position: absolute;
    top: 100%;
    left: 40px;
    background: white;
    border: 1px solid #7F9DB9;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    padding: 5px;
    z-index: 100;
    width: 200px; /* Slightly wider for year/month text */
`;

const CalendarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 3px;
`;

const NavButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-weight: bold;
    color: #0066cc;

    &:disabled {
        color: #ccc;
        cursor: default;
    }
`;

const TitleLabel = styled.span`
    font-weight: bold;
    cursor: pointer;
    color: #0066cc;

    &:hover {
        text-decoration: underline;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    text-align: center;
`;

const MonthGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    text-align: center;
`;

const YearGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    text-align: center;
`;

const Cell = styled.div`
    padding: 4px 2px;
    cursor: pointer;
    border: 1px solid transparent;
    font-size: 11px;

    &:hover {
        background: #e1f0ff;
        border: 1px solid #aaddff;
    }

    ${props => props.$hasData && `
        font-weight: bold;
        color: #000;
        background: #e6f7ff;
    `}

    ${props => !props.$hasData && `
        color: #888;
    `}

    ${props => props.$isSelected && `
        background: #316ac5 !important;
        color: white !important;
    `}
`;

const CalendarPicker = ({ selectedDate, onSelect, availableData, onClose }) => {
    // viewDate is used to determine which month/year page we are looking at.
    // We initialize it to selectedDate or today.
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const [viewMode, setViewMode] = useState('day'); // 'day', 'month', 'year'

    const { years, yearMonths, dates } = availableData;

    useEffect(() => {
        if (selectedDate) {
            setViewDate(new Date(selectedDate));
        }
    }, [selectedDate]);

    // Helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, year, month };
    };

    const handlePrev = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (viewMode === 'month') {
            newDate.setFullYear(newDate.getFullYear() - 1);
        } else if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() - 10);
        }
        setViewDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (viewMode === 'month') {
            newDate.setFullYear(newDate.getFullYear() + 1);
        } else if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() + 10);
        }
        setViewDate(newDate);
    };

    // Render Logic

    // --- DAY VIEW ---
    const renderDayView = () => {
        const { days, firstDay, year, month } = getDaysInMonth(viewDate);
        const cells = [];

        // Header Days
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        weekDays.forEach(d => cells.push(<div key={`wd-${d}`} style={{color:'#666'}}>{d}</div>));

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} />);
        }

        // Days
        for (let d = 1; d <= days; d++) {
            const monthStr = (month + 1).toString().padStart(2, '0');
            const dayStr = d.toString().padStart(2, '0');
            const dateStr = `${year}-${monthStr}-${dayStr}`;
            const hasData = dates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            cells.push(
                <Cell
                    key={d}
                    $hasData={hasData}
                    $isSelected={isSelected}
                    onClick={() => {
                        if (hasData) {
                            onSelect(dateStr);
                            onClose();
                        }
                    }}
                    title={hasData ? "有记录" : ""}
                >
                    {d}
                </Cell>
            );
        }
        return <Grid>{cells}</Grid>;
    };

    // --- MONTH VIEW ---
    const renderMonthView = () => {
        const year = viewDate.getFullYear();
        const months = [];
        for (let m = 0; m < 12; m++) {
            const monthStr = (m + 1).toString().padStart(2, '0');
            const key = `${year}-${monthStr}`;
            const hasData = yearMonths.has(key);

            months.push(
                <Cell
                    key={m}
                    $hasData={hasData}
                    onClick={() => {
                        const newDate = new Date(viewDate);
                        newDate.setMonth(m);
                        setViewDate(newDate);
                        setViewMode('day');
                    }}
                >
                    {m + 1}月
                </Cell>
            );
        }
        return <MonthGrid>{months}</MonthGrid>;
    };

    // --- YEAR VIEW ---
    const renderYearView = () => {
        const currentYear = viewDate.getFullYear();
        const startYear = currentYear - (currentYear % 10);
        const endYear = startYear + 11; // Show 12 items for grid

        const yearCells = [];
        for (let y = startYear; y < endYear; y++) {
            const hasData = years.has(y);
            yearCells.push(
                <Cell
                    key={y}
                    $hasData={hasData}
                    onClick={() => {
                        const newDate = new Date(viewDate);
                        newDate.setFullYear(y);
                        setViewDate(newDate);
                        setViewMode('month');
                    }}
                >
                    {y}
                </Cell>
            );
        }
        return <YearGrid>{yearCells}</YearGrid>;
    };

    // Header Title Logic
    let title = '';
    if (viewMode === 'day') {
        title = `${viewDate.getFullYear()}年 ${viewDate.getMonth() + 1}月`;
    } else if (viewMode === 'month') {
        title = `${viewDate.getFullYear()}年`;
    } else {
        const startYear = viewDate.getFullYear() - (viewDate.getFullYear() % 10);
        title = `${startYear} - ${startYear + 9}`;
    }

    const handleTitleClick = () => {
        if (viewMode === 'day') setViewMode('month');
        else if (viewMode === 'month') setViewMode('year');
    };

    return (
        <CalendarContainer>
            <CalendarHeader>
                <NavButton onClick={handlePrev}>&lt;</NavButton>
                <TitleLabel onClick={handleTitleClick}>{title}</TitleLabel>
                <NavButton onClick={handleNext}>&gt;</NavButton>
            </CalendarHeader>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'year' && renderYearView()}
        </CalendarContainer>
    );
};


const QQHistory = ({ user, target, type }) => {
    const [filterDate, setFilterDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const allMessages = useMemo(() => {
        const recentMessages = (target.chatHistory || []).map(m => ({
            ...m,
            date: '2023-10-27',
            fullTimestamp: `2023-10-27T${m.timestamp}`
        }));

        // 加载历史记录
        let archived = [];

        // 如果是群聊，尝试从群聊数据文件加载
        if (type === 'group' && target.id === 'mountain_office') {
            // 合并所有群聊数据文件
            Object.values(groupHistoryFiles).forEach(module => {
                const data = module.default || module;
                if (Array.isArray(data)) {
                    archived = [...archived, ...data];
                }
            });
        } else {
            // 从 history.json 加载
            archived = historyData[target.id] || [];
        }

        const normalizedArchived = archived.map(m => ({
            ...m,
            fullTimestamp: m.fullTimestamp || `${m.date}T${m.timestamp}`
        }));

        return [...recentMessages, ...normalizedArchived].sort((a, b) => {
            return a.fullTimestamp.localeCompare(b.fullTimestamp);
        });
    }, [target.chatHistory, target.id, type]);

    const availableData = useMemo(() => {
        const years = new Set();
        const yearMonths = new Set(); // "YYYY-MM"
        const dates = new Set(); // "YYYY-MM-DD"

        allMessages.forEach(m => {
            if (m.date) {
                dates.add(m.date);
                const [y, mon] = m.date.split('-');
                if (y && mon) {
                    years.add(parseInt(y, 10));
                    yearMonths.add(`${y}-${mon}`);
                }
            }
        });
        return { years, yearMonths, dates };
    }, [allMessages]);

    const displayMessages = useMemo(() => {
        if (!filterDate) return allMessages;
        return allMessages.filter(m => m.date === filterDate);
    }, [allMessages, filterDate]);

    const getSenderName = (id) => {
        if (id === user.id) return user.nickname;
        if (type === 'group') {
            const member = target.members?.find(m => m.id === id);
            return member ? member.nickname : id;
        }
        return target.nickname;
    };

    return (
        <Container>
            <Toolbar ref={calendarRef}>
                <span>日期:</span>
                <div style={{position: 'relative', display: 'inline-block'}}>
                    <div
                        onClick={() => setShowCalendar(!showCalendar)}
                        style={{
                            border: '1px solid #7F9DB9',
                            background: 'white',
                            padding: '2px 5px',
                            width: '90px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{filterDate || '选择日期...'}</span>
                        <span style={{fontSize: '10px'}}>▼</span>
                    </div>
                    {showCalendar && (
                        <CalendarPicker
                            selectedDate={filterDate}
                            onSelect={setFilterDate}
                            availableData={availableData}
                            onClose={() => setShowCalendar(false)}
                        />
                    )}
                </div>

                <Button onClick={() => setFilterDate('')}>显示全部</Button>
            </Toolbar>
            <MessageList>
                {displayMessages.length === 0 ? (
                     <div style={{color: '#999', padding:'20px', textAlign: 'center'}}>该日期无记录</div>
                ) : (
                    displayMessages.map((msg, i) => {
                        const showDateHeader = i === 0 || msg.date !== displayMessages[i-1].date;
                        return (
                            <div key={i}>
                                {showDateHeader && !filterDate && (
                                    <DateHeader><span>{msg.date}</span></DateHeader>
                                )}
                                <Message>
                                    <MessageHeader $isMe={msg.senderId === user.id}>
                                        {getSenderName(msg.senderId)} {msg.timestamp}
                                    </MessageHeader>
                                    <Text>{msg.content}</Text>
                                </Message>
                            </div>
                        );
                    })
                )}
            </MessageList>
        </Container>
    );
};

export default QQHistory;
