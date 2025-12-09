import React, { useState } from 'react';
import styled from 'styled-components';
import { useUserSession } from '../context/UserSessionContext';

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

// Placeholder icon
const USER_ICON_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/User_Circle.png/480px-User_Circle.png"; 

const LoginScreen = () => {
    const { login } = useUserSession();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (login(password)) {
            setError('');
        } else {
            setError('密码错误，请重试。');
            setPassword('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <Container>
            <Logo>Microsoft Windows<span>XP</span></Logo>
            <Content>
                <UserRow>
                    <UserIcon>
                        <img src={USER_ICON_URL} alt="User" />
                    </UserIcon>
                    <InputArea>
                        <UserName>Administrator</UserName>
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
                    </InputArea>
                </UserRow>
            </Content>
        </Container>
    );
};

export default LoginScreen;
