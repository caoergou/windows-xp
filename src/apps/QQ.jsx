import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import qqData from '../data/qq/index.json';
import QZone from './QZone';

const Container = styled.div`
    width: 100%;
    height: 100%;
    background: #EBF2F9;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    font-family: 'Tahoma', sans-serif;
`;

const LoginHeader = styled.div`
    width: 100%;
    height: 100px;
    background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png') no-repeat center;
    background-size: contain;
    margin-top: 30px;
    margin-bottom: 20px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 200px;
`;

const Input = styled.input`
    padding: 5px;
    border: 1px solid #7F9DB9;
    border-radius: 2px;
    font-size: 12px;
`;

const Button = styled.button`
    margin-top: 10px;
    padding: 5px;
    background: #0099FF;
    color: white;
    border: 1px solid #0066CC;
    border-radius: 3px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;

    &:hover {
        background: #33ADFF;
    }

    &:active {
        background: #007ACC;
    }
`;

const Links = styled.div`
    margin-top: 20px;
    font-size: 12px;
    color: #0066CC;
    display: flex;
    gap: 10px;
    cursor: pointer;

    span:hover {
        text-decoration: underline;
    }
`;

const UserHeader = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 10px;
    background: linear-gradient(to bottom, #dbecf9 0%, #a3d0ef 100%);
    border-bottom: 1px solid #7f9db9;
`;

const Avatar = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 3px;
    border: 1px solid #fff;
    margin-right: 10px;
    background: white;
`;

const UserInfo = styled.div`
    flex: 1;
`;

const Nickname = styled.div`
    font-weight: bold;
    font-size: 13px;
`;

const Signature = styled.div`
    font-size: 11px;
    color: #555;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
`;

const SectionHeader = styled.div`
    padding: 5px;
    padding-left: 10px;
    font-weight: bold;
    font-size: 12px;
    background: #f0f0f0;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
        background: #e5e5e5;
    }
`;

const ContactItem = styled.div`
    padding: 5px 10px;
    display: flex;
    align-items: center;
    cursor: pointer;

    &:hover {
        background: #ffe48d;
        border: 1px solid #e5c365;
        padding: 4px 9px; /* adjust for border */
    }
`;

const StatusDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
    background-color: ${props => props.status === 'online' ? '#4CAF50' : props.status === 'busy' ? '#F44336' : '#9E9E9E'};
    border: 1px solid white;
    box-shadow: 0 0 1px rgba(0,0,0,0.5);
`;

const ChatOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #EBF2F9;
    display: flex;
    flex-direction: column;
    z-index: 10;
`;

const ChatHeader = styled.div`
    height: 30px;
    background: linear-gradient(to bottom, #dbecf9 0%, #a3d0ef 100%);
    border-bottom: 1px solid #7f9db9;
    display: flex;
    align-items: center;
    padding: 0 10px;
    justify-content: space-between;
`;

const ChatBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: white;
`;

const ChatFooter = styled.div`
    height: 100px;
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

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-weight: bold;
    color: #555;
    &:hover { color: red; }
`;

const SendButton = styled.button`
    align-self: flex-end;
    padding: 2px 10px;
    font-size: 11px;
`;

const QQ = () => {
    const [status, setStatus] = useState('login'); // login, logging_in, logged_in
    const { openWindow } = useWindowManager();

    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    const [activeChat, setActiveChat] = useState(null); // { type, target }

    useEffect(() => {
        // Initialize from JSON data
        if (qqData.login) {
            if (qqData.login.remember) {
                setAccount(qqData.login.account);
                setPassword(qqData.login.password);
                setRemember(true);
            }
        }
    }, []);

    const handleLogin = () => {
        setStatus('logging_in');
        setTimeout(() => {
            setStatus('logged_in');
        }, 1000);
    };

    const openChat = (target, type) => {
        setActiveChat({ target, type });
    };

    const openQZone = (userId) => {
        openWindow(`qzone-${userId}`, `QZone - ${userId}`, <QZone userId={userId} />, 'ie');
    };

    if (status === 'login') {
        return (
            <Container>
                <LoginHeader />
                <InputGroup>
                    <Input
                        type="text"
                        placeholder="QQ号码/手机/邮箱"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div style={{display:'flex', fontSize:'12px', alignItems:'center'}}>
                        <input
                            type="checkbox"
                            id="rem"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        <label htmlFor="rem">记住密码</label>
                    </div>
                    <Button onClick={handleLogin} disabled={status === 'logging_in'}>
                        {status === 'logging_in' ? '登录中...' : '登录'}
                    </Button>
                </InputGroup>
                <Links>
                    <span>找回密码</span>
                    <span>注册账号</span>
                </Links>
            </Container>
        );
    }

    const { user, friends, groups } = qqData;

    return (
        <Container style={{justifyContent: 'flex-start', alignItems: 'stretch', background: '#fff'}}>
            {activeChat && (
                <ChatOverlay>
                    <ChatHeader>
                        <div style={{display:'flex', alignItems:'center'}}>
                            <img src={activeChat.target.avatar} style={{width:'20px', height:'20px', marginRight:'5px'}} />
                            <span style={{fontWeight:'bold', fontSize:'12px'}}>{activeChat.target.nickname || activeChat.target.name}</span>
                        </div>
                        <CloseButton onClick={() => setActiveChat(null)}>X</CloseButton>
                    </ChatHeader>
                    <ChatBody>
                        {activeChat.target.chatHistory && activeChat.target.chatHistory.map((msg, idx) => (
                            <ChatMessage key={idx}>
                                <div className={`header ${msg.senderId === user.id ? 'me' : ''}`}>
                                    {msg.senderId === user.id ? user.nickname : (
                                        activeChat.type === 'group'
                                            ? activeChat.target.members.find(m => m.id === msg.senderId)?.nickname || msg.senderId
                                            : activeChat.target.nickname
                                    )} &nbsp;
                                    {msg.timestamp}
                                </div>
                                <div className="content">{msg.content}</div>
                            </ChatMessage>
                        ))}
                    </ChatBody>
                    <ChatFooter>
                         <div style={{height: '20px', background:'#eee', marginBottom:'2px'}}></div>
                         <ChatInput />
                         <SendButton>发送(S)</SendButton>
                    </ChatFooter>
                </ChatOverlay>
            )}

            <UserHeader>
                <Avatar src={user.avatar} />
                <UserInfo>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <Nickname>{user.nickname}</Nickname>
                        <StatusDot status={user.status} title={user.status} />
                    </div>
                    <Signature title={user.signature}>{user.signature}</Signature>
                </UserInfo>
            </UserHeader>

            <div style={{flex: 1, overflowY: 'auto'}}>
                <SectionHeader>我的好友</SectionHeader>
                {friends.map(friend => (
                    <ContactItem key={friend.id} onDoubleClick={() => openChat(friend, 'friend')}>
                        <img src={friend.avatar} style={{width:'30px', height:'30px', marginRight:'8px', borderRadius:'2px'}} />
                        <div style={{flex:1}}>
                            <div style={{fontSize:'12px'}}>{friend.nickname}</div>
                        </div>
                        <StatusDot status={friend.status} />
                    </ContactItem>
                ))}

                <SectionHeader>我的群组</SectionHeader>
                {groups.map(group => (
                    <ContactItem key={group.id} onDoubleClick={() => openChat(group, 'group')}>
                        <img src={group.avatar} style={{width:'30px', height:'30px', marginRight:'8px', borderRadius:'2px'}} />
                        <div style={{flex:1}}>
                            <div style={{fontSize:'12px'}}>{group.name}</div>
                        </div>
                    </ContactItem>
                ))}
            </div>

            <div style={{height:'30px', background: 'linear-gradient(to bottom, #dbecf9 0%, #a3d0ef 100%)', borderTop:'1px solid #7f9db9', display:'flex', alignItems:'center', padding:'0 5px'}}>
                 <div style={{width:'20px', height:'20px', background:'url(https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png) no-repeat center', backgroundSize:'contain'}}></div>
                 <div style={{marginLeft: 'auto', fontSize:'11px', color:'#333'}}>查找</div>
            </div>
        </Container>
    );
};

export default QQ;
