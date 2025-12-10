import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    font-family: 'Tahoma', sans-serif;
    font-size: 12px;
    background: #EBF2F9;
`;

const Sidebar = styled.div`
    width: 150px;
    border-right: 1px solid #7F9DB9;
    background: white;
    display: flex;
    flex-direction: column;
`;

const CalendarMock = styled.div`
    padding: 10px;
    border-bottom: 1px solid #eee;
    font-weight: bold;
    text-align: center;
    background: #f9f9f9;
    color: #333;
`;

const DateList = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const DateItem = styled.div`
    padding: 5px 10px;
    cursor: pointer;
    background: ${props => props.active ? '#316AC5' : 'transparent'};
    color: ${props => props.active ? 'white' : 'black'};
    &:hover {
        background: ${props => props.active ? '#316AC5' : '#EBF2F9'};
        color: ${props => props.active ? 'white' : 'black'};
    }
`;

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
`;

const Header = styled.div`
    padding: 8px;
    border-bottom: 1px solid #a0a0a0;
    background: #f5f5f5;
    font-weight: bold;
`;

const MessageList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
`;

const Message = styled.div`
    margin-bottom: 8px;
    line-height: 1.4;
`;

const Sender = styled.div`
    color: #008000; /* Green for others */
    margin-bottom: 2px;

    ${props => props.isMe && `
        color: #0000FF; /* Blue for me */
    `}
`;

const Text = styled.div`
    padding-left: 10px;
`;

const QQHistory = ({ user, target, type }) => {
    const [selectedDate, setSelectedDate] = useState('2023-10-27');

    // Mock dates
    const dates = ['2023-10-27', '2023-10-26', '2023-10-25'];

    // Get history based on date. For now, only '2023-10-27' (Today) has data from props
    const getMessages = (date) => {
        if (date === '2023-10-27') {
            return target.chatHistory || [];
        }
        if (date === '2023-10-26') {
             return [
                 { senderId: target.id, content: "Mock history from yesterday...", timestamp: "14:20" },
                 { senderId: user.id, content: "Oh I see.", timestamp: "14:22" }
             ];
        }
        return [];
    };

    const messages = getMessages(selectedDate);

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
            <Sidebar>
                <CalendarMock>2023年10月</CalendarMock>
                <DateList>
                    {dates.map(date => (
                        <DateItem
                            key={date}
                            active={selectedDate === date}
                            onClick={() => setSelectedDate(date)}
                        >
                            {date}
                        </DateItem>
                    ))}
                </DateList>
            </Sidebar>
            <Content>
                <Header>
                    与 {target.nickname || target.name} 的聊天记录
                </Header>
                <MessageList>
                    {messages.length === 0 ? (
                         <div style={{color: '#999', padding:'20px'}}>无聊天记录</div>
                    ) : (
                        messages.map((msg, i) => (
                            <Message key={i}>
                                <Sender isMe={msg.senderId === user.id}>
                                    {getSenderName(msg.senderId)} {msg.timestamp}
                                </Sender>
                                <Text>{msg.content}</Text>
                            </Message>
                        ))
                    )}
                </MessageList>
            </Content>
        </Container>
    );
};

export default QQHistory;
