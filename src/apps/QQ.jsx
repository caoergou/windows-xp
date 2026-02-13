import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useUserProgress } from '../context/UserProgressContext';
import qqData from '../data/qq/index.json';
import QQChat from './QQChat';
import InternetExplorer from './InternetExplorer';
import { defaultPlugin } from './BrowserPlugins';

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
    /* width: 100%; removed to prevent overflow with padding */
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
    background-color: ${props => props.$status === 'online' ? '#4CAF50' : props.$status === 'busy' ? '#F44336' : '#9E9E9E'};
    border: 1px solid white;
    box-shadow: 0 0 1px rgba(0,0,0,0.5);
`;

const QQ = () => {
    const { openWindow, windows, focusWindow } = useWindowManager();
    const { progress, markQqLoggedIn } = useUserProgress();

    // 如果已经登录过，直接显示登录后的界面
    const [status, setStatus] = useState(progress.qqLoggedIn ? 'logged_in' : 'login');

    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    // Unread email count
    const [chenMoCorrespondence, setChenMoCorrespondence] = useState(null);

    useEffect(() => {
        import('../data/email/chenmo_correspondence.json')
            .then(module => {
                setChenMoCorrespondence(module.default);
            })
            .catch(() => {
                setChenMoCorrespondence({ correspondence: [] });
            });
    }, []);

    const unreadEmailCount = useMemo(() => {
        if (!chenMoCorrespondence) return 0;
        try {
            const emails = chenMoCorrespondence.correspondence || [];
            const checkTrigger = (trigger) => {
                const triggerMap = {
                    'game_start': true,
                    'player_view_qzone': progress.qqLoggedIn,
                    'player_unlock_album': progress.albumUnlocked,
                    'player_read_father_diary_layer1': progress.fatherLogLayer1Unlocked,
                    'player_read_linxiaoyu_diary': progress.encryptedDiaryUnlocked,
                    'player_read_father_diary_layer2': progress.fatherLogLayer2Unlocked
                };
                return triggerMap[trigger] || false;
            };
            return emails.filter(email =>
                checkTrigger(email.trigger) && !progress.emailRead?.includes(email.id)
            ).length;
        } catch {
            return 0;
        }
    }, [progress, chenMoCorrespondence]);

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
            markQqLoggedIn();
        }, 1000);
    };

    const { user, friends, groups } = qqData;

    const openChat = (target, type) => {
        // Open a new window for chat
        openWindow(
            `qq-chat-${target.id}`,
            `${target.nickname || target.name}`,
            <QQChat user={user} target={target} type={type} />,
            'qq',
            { width: 500, height: 450 }
        );
    };

    const openQZone = (userId) => {
        // Now opens InternetExplorer with QZone URL
        const url = `http://qzone.qq.com/${userId}`;
        openWindow(
            `qzone-${userId}`,
            `QZone - ${userId}`,
            <InternetExplorer url={url} plugin={defaultPlugin} />,
            'qzone',
            { width: 1000, height: 700, isMaximized: true }
        );
    };

    const openQQMail = () => {
        // Check if QQ Mail is already open
        const existingMail = windows.find(w => w.appId === 'QQMail');
        if (existingMail) {
            focusWindow(existingMail.id);
        } else {
            openWindow(
                'QQMail',
                'QQ邮箱',
                <InternetExplorer url="http://mail.qq.com" plugin={defaultPlugin} />,
                'ie',
                { width: 900, height: 650, isMaximized: true }
            );
        }
    };

    const handleOpenMyQZone = () => {
        openQZone(user.id);
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

    return (
        <Container style={{justifyContent: 'flex-start', alignItems: 'stretch', background: '#fff'}}>
            <UserHeader>
                <Avatar src={user.avatar} onClick={handleOpenMyQZone} style={{cursor: 'pointer'}} title="访问我的QQ空间" />
                <UserInfo>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <Nickname>{user.nickname}</Nickname>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                            <div
                                style={{cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center'}}
                                onClick={openQQMail}
                                title="QQ邮箱"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/>
                                </svg>
                                {unreadEmailCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-10px',
                                        background: '#ff0000',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '14px',
                                        height: '14px',
                                        fontSize: '9px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        lineHeight: 1
                                    }}>
                                        {unreadEmailCount > 9 ? '9+' : unreadEmailCount}
                                    </span>
                                )}
                            </div>
                            <div
                                style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                                onClick={handleOpenMyQZone}
                                title="QQ空间"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                            </div>
                            <StatusDot $status={user.status} title={user.status} />
                        </div>
                    </div>
                    <Signature title={user.signature}>{user.signature}</Signature>
                </UserInfo>
            </UserHeader>

            <div style={{flex: 1, overflowY: 'auto'}}>
                <SectionHeader>我的好友</SectionHeader>
                {friends.map(friend => (
                    <ContactItem key={friend.id} onDoubleClick={() => openChat(friend, 'friend')}>
                        <img
                            src={friend.avatar}
                            style={{width:'30px', height:'30px', marginRight:'8px', borderRadius:'2px'}}
                            onClick={(e) => { e.stopPropagation(); openChat(friend, 'friend'); }}
                        />
                        <div style={{flex:1}}>
                            <div style={{fontSize:'12px'}}>{friend.nickname}</div>
                        </div>
                        <StatusDot $status={friend.status} />
                    </ContactItem>
                ))}

                <SectionHeader>我的群组</SectionHeader>
                {groups.map(group => (
                    <ContactItem key={group.id} onDoubleClick={() => openChat(group, 'group')}>
                        <img
                            src={group.avatar}
                            style={{width:'30px', height:'30px', marginRight:'8px', borderRadius:'2px'}}
                            onClick={(e) => { e.stopPropagation(); openChat(group, 'group'); }}
                        />
                        <div style={{flex:1}}>
                            <div style={{fontSize:'12px'}}>{group.name}</div>
                        </div>
                    </ContactItem>
                ))}
            </div>

            <div style={{height:'30px', background: 'linear-gradient(to bottom, #dbecf9 0%, #a3d0ef 100%)', borderTop:'1px solid #7f9db9', display:'flex', alignItems:'center', padding:'0 5px', gap: '10px'}}>
                 <div style={{width:'20px', height:'20px', background:'url(https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Tencent_QQ_logo_2016.svg/1024px-Tencent_QQ_logo_2016.svg.png) no-repeat center', backgroundSize:'contain'}}></div>
                 <div
                     style={{cursor: 'pointer', fontSize:'11px', color:'#0066CC', position: 'relative'}}
                     onClick={openQQMail}
                     title="打开QQ邮箱"
                 >
                     邮箱
                     {unreadEmailCount > 0 && (
                         <span style={{
                             position: 'absolute',
                             top: '-6px',
                             right: '-12px',
                             background: '#ff0000',
                             color: 'white',
                             borderRadius: '50%',
                             width: '14px',
                             height: '14px',
                             fontSize: '9px',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             fontWeight: 'bold',
                             lineHeight: 1
                         }}>
                             {unreadEmailCount > 9 ? '9+' : unreadEmailCount}
                         </span>
                     )}
                 </div>
                 <div style={{marginLeft: 'auto', fontSize:'11px', color:'#333'}}>查找</div>
            </div>
        </Container>
    );
};

export default QQ;
