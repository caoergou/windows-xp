import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useQQChatHistory } from '../hooks/useQQChatHistory';
import { renderEmojiHTML } from '../utils/emojiRenderer';

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
    flex-wrap: wrap;
`;

const Label = styled.span`
    font-size: 12px;
    color: #333;
`;

const Select = styled.select`
    border: 1px solid #7F9DB9;
    padding: 3px 5px;
    font-size: 11px;
    font-family: 'Tahoma', sans-serif;
    background: white;
    cursor: pointer;
    min-width: 80px;

    &:focus {
        outline: 1px solid #316ac5;
    }
`;

const SearchInput = styled.input`
    border: 1px solid #7F9DB9;
    padding: 3px 5px;
    font-size: 11px;
    width: 120px;
    min-width: 80px;
    font-family: 'Tahoma', sans-serif;

    &:focus {
        outline: 1px solid #316ac5;
    }
`;

const Button = styled.button`
    border: 1px solid #7F9DB9;
    background: linear-gradient(to bottom, #f9f9f9, #e3e3e3);
    padding: 3px 10px;
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

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
        width: 12px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 6px;
        border: 2px solid #f1f1f1;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
`;

const Message = styled.div`
    margin-bottom: 12px;
    line-height: 1.4;
    padding: 5px;
    border-radius: 2px;

    .emoji {
        font-size: 16px;
        line-height: 1;
        display: inline-block;
        margin: 0 2px;
    }
`;

const MessageHeader = styled.div`
    color: ${props => props.$isMe ? '#0000FF' : '#008000'};
    margin-bottom: 2px;
    font-size: 11px;
`;

const MessageContent = styled.div`
    padding-left: 10px;
    color: black;
`;

const DateHeader = styled.div`
    text-align: center;
    margin: 15px 0 10px 0;
    color: #888;
    font-size: 11px;
    position: relative;

    &:before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        border-top: 1px solid #ddd;
        z-index: 0;
    }

    span {
        background: white;
        padding: 0 10px;
        position: relative;
        z-index: 1;
    }
`;

const EmptyState = styled.div`
    color: #999;
    padding: 40px 20px;
    text-align: center;
    font-size: 12px;
`;

const ResultCount = styled.div`
    padding: 5px 10px;
    background: #f9f9f9;
    border-bottom: 1px solid #ddd;
    font-size: 11px;
    color: #666;
`;

const QQHistory = ({ user, target, type }) => {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');

    // 使用统一的历史记录加载 hook
    const { messages: allMessages } = useQQChatHistory(target, type, user?.id);

    // 提取可用的年份、月份、日期
    const { availableYears, availableMonths, availableDays } = useMemo(() => {
        const yearsSet = new Set();
        const monthsMap = {}; // year -> Set of months
        const daysMap = {}; // year-month -> Set of days

        allMessages.forEach(m => {
            if (m.date) {
                const [year, month, day] = m.date.split('-');
                if (year && month && day) {
                    yearsSet.add(year);

                    if (!monthsMap[year]) monthsMap[year] = new Set();
                    monthsMap[year].add(month);

                    const yearMonth = `${year}-${month}`;
                    if (!daysMap[yearMonth]) daysMap[yearMonth] = new Set();
                    daysMap[yearMonth].add(day);
                }
            }
        });

        return {
            availableYears: Array.from(yearsSet).sort(),
            availableMonths: monthsMap,
            availableDays: daysMap
        };
    }, [allMessages]);

    // 当前可选的月份和日期
    const currentMonths = selectedYear ? (availableMonths[selectedYear] ? Array.from(availableMonths[selectedYear]).sort() : []) : [];
    const currentDays = (selectedYear && selectedMonth) ? (availableDays[`${selectedYear}-${selectedMonth}`] ? Array.from(availableDays[`${selectedYear}-${selectedMonth}`]).sort() : []) : [];

    // 过滤消息
    const displayMessages = useMemo(() => {
        let filtered = allMessages;

        // 按日期过滤
        if (selectedYear || selectedMonth || selectedDay) {
            filtered = filtered.filter(m => {
                if (!m.date) return false;
                const [year, month, day] = m.date.split('-');

                if (selectedYear && year !== selectedYear) return false;
                if (selectedMonth && month !== selectedMonth) return false;
                if (selectedDay && day !== selectedDay) return false;

                return true;
            });
        }

        // 按关键词搜索
        if (searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase();
            filtered = filtered.filter(m =>
                m.content.toLowerCase().includes(keyword) ||
                (m.senderId && m.senderId.toLowerCase().includes(keyword))
            );
        }

        return filtered;
    }, [allMessages, selectedYear, selectedMonth, selectedDay, searchKeyword]);

    const getSenderName = (id) => {
        if (id === user.id) return user.nickname;
        if (type === 'group') {
            const member = target.members?.find(m => m.id === id);
            return member ? member.nickname : id;
        }
        return target.nickname;
    };

    const formatDateTime = (msg) => {
        const date = msg.date || '';
        const time = msg.timestamp || '';

        if (!date) return time;

        const [year, month, day] = date.split('-');
        return `${year}年${month}月${day}日 ${time}`;
    };

    const formatDateLabel = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${year}年${month}月${day}日`;
    };

    const handleReset = () => {
        setSelectedYear('');
        setSelectedMonth('');
        setSelectedDay('');
        setSearchKeyword('');
    };

    // 当年份改变时，重置月份和日期
    const handleYearChange = (year) => {
        setSelectedYear(year);
        setSelectedMonth('');
        setSelectedDay('');
    };

    // 当月份改变时，重置日期
    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        setSelectedDay('');
    };

    return (
        <Container>
            <Toolbar>
                <Label>日期:</Label>
                <Select value={selectedYear} onChange={(e) => handleYearChange(e.target.value)}>
                    <option value="">全部年份</option>
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}年</option>
                    ))}
                </Select>

                <Select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    disabled={!selectedYear}
                >
                    <option value="">全部月份</option>
                    {currentMonths.map(month => (
                        <option key={month} value={month}>{month}月</option>
                    ))}
                </Select>

                <Select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    disabled={!selectedMonth}
                >
                    <option value="">全部日期</option>
                    {currentDays.map(day => (
                        <option key={day} value={day}>{day}日</option>
                    ))}
                </Select>

                <Label style={{marginLeft: '10px'}}>搜索:</Label>
                <SearchInput
                    type="text"
                    placeholder="输入关键词..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                />

                <Button onClick={handleReset}>重置</Button>
            </Toolbar>

            {(selectedYear || selectedMonth || selectedDay || searchKeyword) && (
                <ResultCount>
                    找到 {displayMessages.length} 条记录
                </ResultCount>
            )}

            <MessageList>
                {displayMessages.length === 0 ? (
                    <EmptyState>
                        {searchKeyword ? '没有找到匹配的记录' : '该时间段无聊天记录'}
                    </EmptyState>
                ) : (
                    displayMessages.map((msg, i) => {
                        const showDateHeader = i === 0 || msg.date !== displayMessages[i-1].date;
                        const content = renderEmojiHTML(msg.content);

                        return (
                            <div key={i}>
                                {showDateHeader && (
                                    <DateHeader>
                                        <span>{formatDateLabel(msg.date)}</span>
                                    </DateHeader>
                                )}
                                <Message>
                                    <MessageHeader $isMe={msg.senderId === user.id}>
                                        {getSenderName(msg.senderId)} {formatDateTime(msg)}
                                    </MessageHeader>
                                    <MessageContent dangerouslySetInnerHTML={{ __html: content }} />
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
