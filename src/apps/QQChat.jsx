import React, { useState } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import QQHistory from './QQHistory';

const Container = styled.div`
    width: 100%;
    height: 100%;
    background: #EBF2F9;
    display: flex;
    flex-direction: column;
    font-family: 'Tahoma', sans-serif;
`;

const ChatHeader = styled.div`
    height: 60px;
    background: linear-gradient(to bottom, #dbecf9 0%, #a3d0ef 100%);
    border-bottom: 1px solid #7f9db9;
    display: flex;
    align-items: center;
    padding: 0 10px;
`;

const Avatar = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 3px;
    border: 1px solid #fff;
    margin-right: 10px;
    background: white;
`;

const Title = styled.div`
    font-weight: bold;
    font-size: 14px;
`;

const Toolbar = styled.div`
    height: 30px;
    background: #F3F8FC;
    border-bottom: 1px solid #A0A0A0;
    display: flex;
    align-items: center;
    padding: 0 5px;
`;

const ToolButton = styled.button`
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 5px;
    margin-right: 5px;
    display: flex;
    align-items: center;

    &:hover {
        background: #FFECB5;
        border: 1px solid #E6C56F;
    }
`;

const ChatBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: white;
`;

const ChatFooter = styled.div`
    height: 120px;
    border-top: 1px solid #7f9db9;
    background: #f5f5f5;
    padding: 5px;
    display: flex;
    flex-direction: column;
`;

const ChatInput = styled.textarea`
    flex: 1;
    border: none;
    background: transparent;
    resize: none;
    font-family: 'Tahoma', sans-serif;
    font-size: 12px;
    &:focus { outline: none; }
`;

const ChatMessage = styled.div`
    margin-bottom: 10px;
    font-size: 12px;

    .header {
        color: #008000;
        margin-bottom: 2px;
        font-size: 11px;
    }
    .header.me {
        color: #0000FF;
    }
    .content {
        padding-left: 5px;
    }
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
`;

const SendButton = styled.button`
    padding: 2px 15px;
    font-size: 12px;
`;

const HistoryButton = styled.button`
    padding: 2px 10px;
    font-size: 12px;
    cursor: pointer;
`;

const QQChat = ({ user, target, type }) => {
    const { openWindow } = useWindowManager();
    // Use local state for history so new messages appear immediately in this window
    // In a real app, this would probably sync with a global store.
    const [history, setHistory] = useState(target.chatHistory || []);
    const [inputValue, setInputValue] = useState('');

    const openHistory = () => {
        openWindow(
            `qq-history-${target.id}`,
            `Chat History - ${target.nickname || target.name}`,
            <QQHistory user={user} target={target} type={type} />,
            'qq',
            { width: 500, height: 400 }
        );
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newMsg = {
            senderId: user.id,
            content: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setHistory([...history, newMsg]);
        setInputValue('');

        // Update the target object as well so history persists if window is closed (in memory)
        if (!target.chatHistory) target.chatHistory = [];
        target.chatHistory.push(newMsg);
    };

    return (
        <Container>
            <ChatHeader>
                <Avatar src={target.avatar} />
                <Title>{target.nickname || target.name}</Title>
            </ChatHeader>
            <Toolbar>
                <ToolButton onClick={openHistory}>
                    聊天记录
                </ToolButton>
            </Toolbar>
            <ChatBody>
                {history.map((msg, idx) => (
                    <ChatMessage key={idx}>
                        <div className={`header ${msg.senderId === user.id ? 'me' : ''}`}>
                            {msg.senderId === user.id ? user.nickname : (
                                type === 'group'
                                    ? target.members?.find(m => m.id === msg.senderId)?.nickname || msg.senderId
                                    : target.nickname
                            )} &nbsp;
                            {msg.timestamp}
                        </div>
                        <div className="content">{msg.content}</div>
                    </ChatMessage>
                ))}
            </ChatBody>
            <ChatFooter>
                 <div style={{height: '24px', background:'#eee', marginBottom:'2px', display: 'flex', alignItems: 'center'}}>
                     {/* Toolbar for rich text, etc. */}
                 </div>
                 <ChatInput
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                 />
                 <ButtonRow>
                     <HistoryButton onClick={openHistory}>聊天记录</HistoryButton>
                     <SendButton onClick={handleSend}>发送(S)</SendButton>
                 </ButtonRow>
            </ChatFooter>
        </Container>
    );
};

export default QQChat;
