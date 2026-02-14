import React, { useState, useRef, useEffect } from 'react';
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
    gap: 2px;
`;

const ToolButton = styled.button`
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 5px;
    display: flex;
    align-items: center;
    gap: 3px;

    &:hover {
        background: #FFECB5;
        border: 1px solid #E6C56F;
    }
`;

const ToolbarDivider = styled.div`
    width: 1px;
    height: 20px;
    background: #ccc;
    margin: 0 3px;
`;

const InputToolbar = styled.div`
    height: 24px;
    background: #eee;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    padding: 0 5px;
    gap: 2px;
    border-bottom: 1px solid #ccc;
`;

const InputToolButton = styled.button`
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    display: flex;
    align-items: center;

    &:hover {
        background: #ddd;
        border: 1px solid #bbb;
    }
`;

const ChatBody = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px;
    background: white;

    /* 自定义滚动条样式 */
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

const LoadMoreIndicator = styled.div`
    text-align: center;
    padding: 10px;
    color: #999;
    font-size: 11px;
    cursor: ${props => props.$clickable ? 'pointer' : 'default'};

    &:hover {
        color: ${props => props.$clickable ? '#666' : '#999'};
    }
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

const DateSeparator = styled.div`
    text-align: center;
    margin: 12px 0 8px 0;
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

const QQChat = ({ user, target, type }) => {
    const { openWindow } = useWindowManager();
    const { showAlert } = useModal();
    const [inputValue, setInputValue] = useState('');
    const chatBodyRef = useRef(null);
    const isFirstLoad = useRef(true);

    // 使用统一的历史记录加载 hook（支持分页）
    const { messages, loadMore, hasMore, isLoading } = useQQChatHistory(target, type, user?.id);

    // 首次加载时滚动到底部
    useEffect(() => {
        if (isFirstLoad.current && chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            isFirstLoad.current = false;
        }
    }, [messages]);

    // 监听滚动事件，滚动到顶部时加载更多
    const handleScroll = (e) => {
        const { scrollTop } = e.target;
        if (scrollTop === 0 && hasMore && !isLoading) {
            const previousScrollHeight = chatBodyRef.current.scrollHeight;
            loadMore();

            // 加载完成后保持滚动位置
            setTimeout(() => {
                if (chatBodyRef.current) {
                    const newScrollHeight = chatBodyRef.current.scrollHeight;
                    chatBodyRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                }
            }, 50);
        }
    };

    // 格式化日期显示（用于日期分隔线）
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${year}年${month}月${day}日`;
    };

    // 格式化日期时间显示
    const formatDateTime = (msg) => {
        const date = msg.date || '2023-10-27';
        const time = msg.timestamp || '00:00:00';

        // 格式化为 "2015年10月27日 14:30:25"
        const [year, month, day] = date.split('-');
        return `${year}年${month}月${day}日 ${time}`;
    };

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

    const handleDisabledFeature = (featureName) => {
        showAlert('功能不可用', `${featureName}功能在历史记录存档中不可用。`);
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
                    📋 聊天记录
                </ToolButton>
                {type !== 'group' && (
                    <ToolButton onClick={openQZone}>
                        🌐 QQ空间
                    </ToolButton>
                )}
                <ToolbarDivider />
                <ToolButton onClick={() => handleDisabledFeature('语音通话')}>
                    📞 语音
                </ToolButton>
                <ToolButton onClick={() => handleDisabledFeature('视频通话')}>
                    📹 视频
                </ToolButton>
                <ToolbarDivider />
                <ToolButton onClick={() => handleDisabledFeature('发送文件')}>
                    📁 文件
                </ToolButton>
                <ToolButton onClick={() => handleDisabledFeature('远程协助')}>
                    🖥️ 远程
                </ToolButton>
            </Toolbar>
            <ChatBody ref={chatBodyRef} onScroll={handleScroll}>
                {hasMore && (
                    <LoadMoreIndicator $clickable={!isLoading} onClick={() => !isLoading && loadMore()}>
                        {isLoading ? '加载中...' : '查看更多消息'}
                    </LoadMoreIndicator>
                )}
                {messages.map((msg, idx) => {
                    // 渲染表情
                    const content = renderEmojiHTML(msg.content);
                    const showDateSeparator = idx === 0 || msg.date !== messages[idx - 1].date;

                    return (
                        <React.Fragment key={idx}>
                            {showDateSeparator && (
                                <DateSeparator>
                                    <span>{formatDate(msg.date)}</span>
                                </DateSeparator>
                            )}
                            <ChatMessage>
                                <div className={`header ${msg.senderId === user.id ? 'me' : ''}`}>
                                    {msg.senderId === user.id ? user.nickname : (
                                        type === 'group'
                                            ? target.members?.find(m => m.id === msg.senderId)?.nickname || msg.senderId
                                            : target.nickname
                                    )} &nbsp;
                                    {formatDateTime(msg)}
                                </div>
                                <div className="content" dangerouslySetInnerHTML={{ __html: content }} />
                            </ChatMessage>
                        </React.Fragment>
                    );
                })}
            </ChatBody>
            <ChatFooter>
                 <InputToolbar>
                     <InputToolButton onClick={() => handleDisabledFeature('表情')}>
                         😊
                     </InputToolButton>
                     <InputToolButton onClick={() => handleDisabledFeature('字体')}>
                         A
                     </InputToolButton>
                     <InputToolButton onClick={() => handleDisabledFeature('截图')}>
                         ✂️
                     </InputToolButton>
                     <InputToolButton onClick={() => handleDisabledFeature('抖动窗口')}>
                         📳
                     </InputToolButton>
                 </InputToolbar>
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
