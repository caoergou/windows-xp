import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

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

const DateInput = styled.input`
    border: 1px solid #7F9DB9;
    padding: 2px;
    font-family: inherit;
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

    ${props => props.isMe && `
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

const QQHistory = ({ user, target, type }) => {
    const [filterDate, setFilterDate] = useState('');

    const allMessages = useMemo(() => {
        // augment props data with a date

        const recentMessages = (target.chatHistory || []).map(m => ({
            ...m,
            date: '2023-10-27', // The "Current" date in our simulation universe
            fullTimestamp: `2023-10-27T${m.timestamp}`
        }));

        const oldMessages = [
            { senderId: target.id, content: "Mock history from yesterday...", timestamp: "14:20", date: '2023-10-26', fullTimestamp: '2023-10-26T14:20' },
            { senderId: user.id, content: "Oh I see.", timestamp: "14:22", date: '2023-10-26', fullTimestamp: '2023-10-26T14:22' },
            { senderId: user.id, content: "Old message.", timestamp: "09:00", date: '2023-10-25', fullTimestamp: '2023-10-25T09:00' },
            { senderId: target.id, content: "Ancient history.", timestamp: "09:05", date: '2023-10-25', fullTimestamp: '2023-10-25T09:05' }
        ];

        return [...recentMessages, ...oldMessages].sort((a, b) => {
            // Sort by date/time ascending
            return a.fullTimestamp.localeCompare(b.fullTimestamp);
        });
    }, [target.chatHistory, target.id, user.id]);

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
            <Toolbar>
                <span>日期:</span>
                <DateInput
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
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
                                    <MessageHeader isMe={msg.senderId === user.id}>
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
