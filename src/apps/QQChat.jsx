import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import { useQQChatHistory } from '../hooks/useQQChatHistory';
import { renderEmojiHTML } from '../utils/emojiRenderer';
import QQHistory from './QQHistory';
import InternetExplorer from './InternetExplorer';
import { defaultPlugin } from './BrowserPlugins';

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
    padding: 5px;
    border-radius: 2px;

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

    .emoji {
        font-size: 16px;
        line-height: 1;
        display: inline-block;
        margin: 0 2px;
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
    const { showAlert } = useModal();
    const [inputValue, setInputValue] = useState('');

    // 使用统一的历史记录加载 hook
    const history = useQQChatHistory(target, type);

    const openHistory = () => {
        openWindow(
            `qq-history-${target.id}`,
            `Chat History - ${target.nickname || target.name}`,
            <QQHistory user={user} target={target} type={type} />,
            'qq',
            { width: 500, height: 400 }
        );
    };

    const openQZone = () => {
        const url = `http://qzone.qq.com/${target.id}`;
        openWindow(
            `qzone-${target.id}`,
            `QZone - ${target.id}`,
            <InternetExplorer url={url} plugin={defaultPlugin} />,
            'qzone',
            { width: 800, height: 600, isMaximized: true }
        );
    };

    const handleSend = () => {
        // 这是历史记录存档,不允许发送新消息
        showAlert('无法发送消息', '这是2015-2016年的聊天记录存档，无法发送新消息。');
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
                {type !== 'group' && (
                    <ToolButton onClick={openQZone}>
                        QQ空间
                    </ToolButton>
                )}
            </Toolbar>
            <ChatBody>
                {history.map((msg, idx) => {
                    // 渲染表情
                    const content = renderEmojiHTML(msg.content);

                    return (
                        <ChatMessage key={idx}>
                            <div className={`header ${msg.senderId === user.id ? 'me' : ''}`}>
                                {msg.senderId === user.id ? user.nickname : (
                                    type === 'group'
                                        ? target.members?.find(m => m.id === msg.senderId)?.nickname || msg.senderId
                                        : target.nickname
                                )} &nbsp;
                                {msg.timestamp}
                            </div>
                            <div className="content" dangerouslySetInnerHTML={{ __html: content }} />
                        </ChatMessage>
                    );
                })}
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
