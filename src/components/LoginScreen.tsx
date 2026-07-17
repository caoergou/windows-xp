import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUserSession } from '../context/UserSessionContext';
import XPIcon from './XPIcon';
import { sounds } from '../utils/soundManager';
import { canUseDOM } from '../utils/storage';
import { useStorage } from '../context/StorageContext';
import type { LoginBranding } from '../branding';
import { resolveOSTheme } from '../themes/useOSTheme';

interface LoginScreenProps {
  branding?: LoginBranding;
}

/** A background value is treated as an image when it looks like a URL/path/data URI. */
const isImageBackground = (bg: string): boolean =>
  /^(https?:|data:|\/|\.)/.test(bg) || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(bg);

const Container = styled.div<{ $background?: string }>`
  ${props =>
    props.$background
      ? isImageBackground(props.$background)
        ? `background: url("${props.$background}") center / cover no-repeat;`
        : `background: ${props.$background};`
      : `background-color: ${resolveOSTheme(props.theme).tokens.XP_DEEP_BLUE};`}
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 60%;
  background: linear-gradient(
    to right,
    ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_PANEL_BLUE} 0%,
    ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_PANEL_BLUE} 50%,
    ${({ theme }) => resolveOSTheme(theme).tokens.XP_DEEP_BLUE} 50%,
    ${({ theme }) => resolveOSTheme(theme).tokens.XP_DEEP_BLUE} 100%
  );
  border-top: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_DIVIDER_GOLD};
  border-bottom: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_DIVIDER_GOLD};
  padding: 40px;
  border-radius: 0;
`;

const Logo = styled.div`
  font-size: 42px;
  color: white;
  font-weight: bold;
  margin-bottom: 20px;

  span {
    font-style: italic;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_ORANGE};
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
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
  padding: 3px;
  width: 150px;
  outline: none;
`;

const GoButton = styled.button`
  width: 32px;
  height: 28px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_GO_GRADIENT};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_GO_BORDER};
  border-radius: 0;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.4),
    inset -1px -1px 0 rgba(0, 0, 0, 0.25),
    1px 1px 2px rgba(0, 0, 0, 0.5);

  &:active {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_GO_GRADIENT_HOVER};
    box-shadow:
      inset 1px 1px 0 rgba(0, 0, 0, 0.25),
      inset -1px -1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const ErrorMsg = styled.div`
  color: yellow;
  font-size: 12px;
  margin-top: 5px;
  min-height: 20px;
`;

const HelpLink = styled.a`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.LOGIN_GOLD};
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
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 0;
  color: white;
  font-size: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  padding: 4px 10px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.7);
  }
`;

const LoginScreen: React.FC<LoginScreenProps> = ({ branding }) => {
  const { t } = useTranslation();
  const storage = useStorage();
  const { login, user } = useUserSession();
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const branded = !!(
    branding &&
    (branding.background || branding.title || branding.userTile || branding.userName)
  );
  const tileImage = branding?.userTile ?? user.avatar;
  const displayName = branding?.userName ?? user.name;

  const handleShutdown = () => {
    storage.local.setItem(storage.key('power_state'), 'shutdown');
    storage.local.removeItem(storage.key('first_boot_done'));
    if (canUseDOM) {
      window.location.reload();
    }
  };

  const handleLogin = () => {
    if (login(password)) {
      setError('');
      sounds.logon();
    } else {
      sounds.error();
      setError(t('login.incorrectPassword'));
      setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Container $background={branding?.background} data-testid="login-screen">
      {branding?.title ? (
        <Logo data-testid="login-title">{branding.title}</Logo>
      ) : branded ? null : (
        <Logo>
          Microsoft Windows<span>XP</span>
        </Logo>
      )}
      <Content>
        <UserRow>
          <UserIcon>
            {tileImage ? (
              <img src={tileImage} alt={displayName} />
            ) : (
              <XPIcon name="user" size={64} color="white" />
            )}
          </UserIcon>
          <InputArea>
            <UserName>{displayName}</UserName>
            <PasswordBox>
              <label>{t('login.password')}:</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <GoButton onClick={handleLogin}>→</GoButton>
            </PasswordBox>
            <ErrorMsg>{error}</ErrorMsg>
            <HelpLink
              href="https://github.com/caoergou/windows-xp#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('login.forgotPasswordHint')}
            </HelpLink>
          </InputArea>
        </UserRow>
      </Content>
      <BottomBar>
        <ShutdownButton onClick={handleShutdown}>
          <XPIcon name="shutdown" size={16} />
          {t('login.turnOff')}
        </ShutdownButton>
      </BottomBar>
    </Container>
  );
};

export default LoginScreen;
