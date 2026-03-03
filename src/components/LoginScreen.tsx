import React, { useState } from 'react';
import styled from 'styled-components';
import { useUserSession } from '../context/UserSessionContext';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';

const Container = styled.div`
  background-color: #003399;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const LoginBox = styled.div`
    width: 100%;
    max-width: 800px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 60%;
    background: linear-gradient(to right, #5A7EDC 0%, #5A7EDC 50%, #003399 50%, #003399 100%);
    border-top: 2px solid #F5C684;
    border-bottom: 2px solid #F5C684;
    padding: 40px;
    border-radius: 5px;
`;

const Logo = styled.div`
    font-size: 42px;
    color: white;
    font-weight: bold;
    margin-bottom: 20px;
    
    span {
        font-style: italic;
        color: #FF6600;
        margin-left: 5px;
        font-size: 50px;
    }
`;

const UserRow = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    background: transparent;
    z-index: 2;
`;

const UserIcon = styled.div`
    width: 80px;
    height: 80px;
    border: 2px solid white;
    border-radius: 4px;
    background: orange;
    margin-right: 20px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const InputArea = styled.div`
    display: flex;
    flex-direction: column;
    color: white;
`;

const UserName = styled.div`
    font-size: 24px;
    margin-bottom: 5px;
`;

const PasswordBox = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    
    label {
        font-size: 14px;
    }
`;

const Input = styled.input`
    border: 1px solid #666;
    padding: 3px;
    width: 150px;
    outline: none;
`;

const GoButton = styled.button`
    width: 30px;
    height: 30px;
    background: #009933;
    border: 1px solid white;
    border-radius: 4px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 1px 1px 2px black;
    
    &:active {
        box-shadow: inset 1px 1px 2px black;
    }
`;

const ErrorMsg = styled.div`
    color: yellow;
    font-size: 12px;
    margin-top: 5px;
    min-height: 20px;
`;

const HelpLink = styled.a`
    color: #FFD700;
    font-size: 11px;
    text-decoration: none;
    margin-top: 3px;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

const BottomBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 60%;
    padding: 10px 0;
    gap: 10px;
`;

const ShutdownButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 3px;
    color: white;
    font-size: 12px;
    font-family: Tahoma, sans-serif;
    padding: 4px 10px;
    cursor: pointer;

    &:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.7);
    }
`;

const LoginScreen = () => {
    const { login, user } = useUserSession();
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleShutdown = () => {
        localStorage.setItem('xp_power_state', 'shutdown');
        localStorage.removeItem('xp_first_boot_done');
        window.location.reload();
    };

    const handleLogin = () => {
        if (login(password)) {
            setError('');
            sounds.logon();
        } else {
            sounds.error();
            setError('密码错误，请重试。');
            setPassword('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <Container>
            <Logo>Microsoft Windows<span>XP</span></Logo>
            <Content>

                <UserRow>
                    <UserIcon>
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <XPIcon name="user" size={64} color="white" />
                        )}
                    </UserIcon>
                    <InputArea>
                        <UserName>{user.name}</UserName>
                        <PasswordBox>
                            <label>输入密码:</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoFocus
                            />
                            <GoButton onClick={handleLogin}>→</GoButton>
                        </PasswordBox>
                        <ErrorMsg>{error}</ErrorMsg>
                        <HelpLink href="https://github.com/caoergou/windows-xp#readme" target="_blank" rel="noopener noreferrer">
                            忘记密码？查看 README
                        </HelpLink>
                    </InputArea>
                </UserRow>
            </Content>
            <BottomBar>
                <ShutdownButton onClick={handleShutdown}>
                    <XPIcon name="shutdown" size={16} />
                    关闭计算机
                </ShutdownButton>
            </BottomBar>
        </Container>
    );
};

export default LoginScreen;
