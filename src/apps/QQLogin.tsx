// @ts-nocheck: temporary suppression of pre-existing type errors during incremental migration
import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { useWindowManager } from '../context/WindowManagerContext';
import { useTray } from '../context/TrayContext';
import XPIcon from '../components/XPIcon';

// ─── 样式 ─────────────────────────────────────────────────────────────────────

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-7px); }
  30% { transform: translateX(7px); }
  45% { transform: translateX(-5px); }
  60% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
`;

const Wrap = styled.div<{ $shake?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #dce8f7 0%, #c8d8e8 100%);
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  user-select: none;
  position: relative;
  overflow: hidden;
  animation: ${p => p.$shake ? css`${shake} 0.45s ease-in-out` : 'none'};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255,255,255,0.1) 2px,
        rgba(255,255,255,0.1) 4px
      );
    pointer-events: none;
    opacity: 0.3;
  }
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #4a90d9 0%, #3a7bd5 50%, #2a6bc5 100%);
  padding: 16px 14px 12px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 3px,
        rgba(255,255,255,0.1) 3px,
        rgba(255,255,255,0.1) 6px
      );
    pointer-events: none;
  }
`;

const Penguin = () => (
  <svg width="52" height="62" viewBox="0 0 52 62" fill="none">
    {/* 身体 */}
    <ellipse cx="26" cy="38" rx="18" ry="22" fill="#1a1a1a"/>
    {/* 腹部 */}
    <ellipse cx="26" cy="40" rx="11" ry="14" fill="#f5f0e8"/>
    {/* 头 */}
    <circle cx="26" cy="17" r="14" fill="#1a1a1a"/>
    {/* 脸 */}
    <ellipse cx="26" cy="19" rx="9" ry="8" fill="#f5f0e8"/>
    {/* 眼睛 */}
    <circle cx="22" cy="16" r="3" fill="white"/>
    <circle cx="30" cy="16" r="3" fill="white"/>
    <circle cx="22.8" cy="16.5" r="1.5" fill="#1a1a1a"/>
    <circle cx="30.8" cy="16.5" r="1.5" fill="#1a1a1a"/>
    {/* 高光 */}
    <circle cx="21.5" cy="15.5" r="1" fill="#ffffff"/>
    <circle cx="29.5" cy="15.5" r="1" fill="#ffffff"/>
    {/* 嘴 */}
    <ellipse cx="26" cy="22" rx="4" ry="2.5" fill="#f0a020"/>
    {/* 翅膀 */}
    <ellipse cx="9" cy="38" rx="5" ry="11" fill="#1a1a1a" transform="rotate(-10 9 38)"/>
    <ellipse cx="43" cy="38" rx="5" ry="11" fill="#1a1a1a" transform="rotate(10 43 38)"/>
    {/* 脚 */}
    <ellipse cx="20" cy="58" rx="6" ry="3" fill="#f0a020"/>
    <ellipse cx="32" cy="58" rx="6" ry="3" fill="#f0a020"/>
    {/* 围巾/领结 */}
    <rect x="19" y="28" width="14" height="4" rx="2" fill="#e8001c"/>
    {/* 围巾细节 */}
    <rect x="18" y="27" width="2" height="6" fill="#c00"/>
    <rect x="32" y="27" width="2" height="6" fill="#c00"/>
  </svg>
);

const HeaderText = styled.div`
  color: white;
  line-height: 1.4;
  position: relative;
  z-index: 1;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4), 0 0 3px rgba(255,255,255,0.3);
  }
  .version {
    font-size: 11px;
    color: #c8dff8;
    text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
  }
`;

const Body = styled.div`
  flex: 1;
  padding: 14px 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #dce8f7;
`;

const AvatarRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 6px;
  background: linear-gradient(135deg, #b8d4f0 0%, #7fb0e0 50%, #9cc6e8 100%);
  border: 2px solid #aac8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  label {
    width: 44px;
    text-align: right;
    color: #444;
    flex-shrink: 0;
    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
  }

  input {
    flex: 1;
    height: 22px;
    border: 1px solid #8eb4d8;
    border-radius: 3px;
    padding: 0 6px;
    font-size: 12px;
    font-family: inherit;
    background: white;
    outline: none;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);

    &:focus {
      border-color: #3a7bd5;
      box-shadow: 0 0 0 2px rgba(58,123,213,0.2), inset 0 1px 2px rgba(0,0,0,0.1);
    }
  }
`;

const CheckRow = styled.div`
  display: flex;
  gap: 16px;
  padding-left: 50px;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #444;
    cursor: pointer;
    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);

    input[type="checkbox"] {
      width: 13px;
      height: 13px;
      cursor: pointer;
    }
  }
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(to right, transparent 0%, #b0c8e0 50%, transparent 100%);
  margin: 4px 0;
  box-shadow: 0 1px 0 rgba(255,255,255,0.3);
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 8px;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  width: 80px;
  height: 26px;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid;
  position: relative;
  overflow: hidden;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  ${p => p.$primary ? `
    background: linear-gradient(to bottom, #7cb3f0 0%, #5a93e0 50%, #3a7bd5 100%);
    color: white;
    border-color: #1a5cb5;
    text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);

    &:hover {
      background: linear-gradient(to bottom, #8cc4f0 0%, #6ba4e0 50%, #4a8bd5 100%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    &:active {
      background: linear-gradient(to bottom, #3a7bd5 0%, #2a6bc5 50%, #1a5cb5 100%);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
    }
  ` : `
    background: linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%);
    color: #333;
    border-color: #aaa;
    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);

    &:hover {
      background: linear-gradient(to bottom, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    &:active {
      background: linear-gradient(to bottom, #d0d0d0 0%, #c0c0c0 50%, #b0b0b0 100%);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    }
  `}
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(220, 232, 247, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 10;
  font-size: 13px;
  color: #3a7bd5;
  text-shadow: 1px 1px 1px rgba(255,255,255,0.8);
`;

const LoadingPenguin = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90d9 0%, #2a6bc5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  animation: qqBounce 0.6s ease-in-out infinite;

  @keyframes qqBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
`;

const Footer = styled.div`
  background: linear-gradient(to bottom, #c8daf0 0%, #b8c8d8 100%);
  border-top: 1px solid #aac0dc;
  padding: 5px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #5577aa;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);

  a {
    color: #2255aa;
    text-decoration: none;
    cursor: pointer;
    text-shadow: 1px 1px 1px rgba(255,255,255,0.7);
    padding: 2px 4px;
    border-radius: 2px;

    &:hover {
      text-decoration: underline;
      background: rgba(255,255,255,0.3);
    }
  }
`;

// ─── 组件 ─────────────────────────────────────────────────────────────────────

interface QQLoginProps {
  windowId?: string;
}

const QQLogin = ({ windowId }: QQLoginProps) => {
  const { t } = useTranslation();
  const api = useApp(windowId);
  const { closeWindow } = useWindowManager();
  const { register, unregister } = useTray();
  const [qqNum, setQqNum] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberPwd, setRememberPwd] = useState<boolean>(true);
  const [autoLogin, setAutoLogin] = useState<boolean>(false);
  const [invisibleLogin, setInvisibleLogin] = useState<boolean>(false);
  const [captcha, setCaptcha] = useState<string>('');
  const [captchaImg, setCaptchaImg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Generate a simple captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCaptcha = '';
    for (let i = 0; i < 4; i++) {
      newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaImg(newCaptcha);
  };

  useEffect(() => {
    // Register QQ tray icon
    register('qq', {
      icon: 'qq',
      tooltip: 'QQ — 右键更多选项',
      order: 40,
      onClick: () => {
        // Left click opens QQLogin window (if not already open)
        // Since we're already in QQLogin, this could focus the window
      },
    });
    generateCaptcha();

    return () => {
      // Unregister QQ tray icon when component unmounts
      unregister('qq');
    };
  }, [register, unregister]);

  const handleLogin = async () => {
    if (!captcha) {
      await api.dialog.alert({
        title: t('qq.title'),
        message: t('qq.login.enterCaptcha'),
        type: 'error',
      });
      return;
    }
    if (captcha.toUpperCase() !== captchaImg) {
      await api.dialog.alert({
        title: t('qq.title'),
        message: t('qq.login.captchaError'),
        type: 'error',
      });
      generateCaptcha();
      setCaptcha('');
      return;
    }

    // 进入登录等待：播放敲门声并展示 1.5s 加载态
    setIsLoggingIn(true);
    api.sound.play('qqKnock');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoggingIn(false);

    // 彩蛋：无论输入什么，都提示版本过旧，并触发窗口抖动
    setShake(true);
    api.sound.play('error');
    setTimeout(() => setShake(false), 450);

    await api.dialog.alert({
      title: t('qq.title'),
      message: t('qq.login.versionTooOld'),
      type: 'error',
    });
  };

  const handleCancel = () => {
    if (windowId) {
      closeWindow(windowId);
    }
  };

  return (
    <Wrap $shake={shake}>
      {isLoggingIn && (
        <LoadingOverlay>
          <LoadingPenguin><XPIcon name="qq" size={48} /></LoadingPenguin>
          <span>{t('qq.login.loggingIn')}</span>
        </LoadingOverlay>
      )}
      <Header>
        <Penguin />
        <HeaderText>
          <div className="title">QQ 2007</div>
          <div className="version">版本 7.0.0.8228</div>
        </HeaderText>
      </Header>

      <Body>
        <AvatarRow>
          <Avatar><XPIcon name="qq" size={64} /></Avatar>
        </AvatarRow>

        <FieldRow>
          <label>{t('qq.login.accountLabel')}</label>
          <input
            type="text"
            value={qqNum}
            onChange={e => setQqNum(e.target.value)}
            placeholder={t('qq.login.accountPlaceholder')}
            maxLength={20}
          />
        </FieldRow>

        <FieldRow>
          <label>{t('qq.login.passwordLabel')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('qq.login.passwordPlaceholder')}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </FieldRow>

        <FieldRow>
          <label>{t('qq.login.captchaLabel')}</label>
          <input
            type="text"
            value={captcha}
            onChange={e => setCaptcha(e.target.value.toUpperCase())}
            placeholder={t('qq.login.captchaPlaceholder')}
            maxLength={4}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3a7bd5', cursor: 'pointer', marginLeft: '8px' }}
               onClick={generateCaptcha}>
            {captchaImg}
          </div>
        </FieldRow>

        <CheckRow>
          <label>
            <input type="checkbox" checked={rememberPwd} onChange={e => setRememberPwd(e.target.checked)} />
            {t('qq.login.rememberPassword')}
          </label>
          <label>
            <input type="checkbox" checked={autoLogin} onChange={e => setAutoLogin(e.target.checked)} />
            {t('qq.login.autoLogin')}
          </label>
          <label>
            <input type="checkbox" checked={invisibleLogin} onChange={e => setInvisibleLogin(e.target.checked)} />
            {t('qq.login.invisibleLogin')}
          </label>
        </CheckRow>

        <Divider />

        <ButtonRow>
          <Btn $primary onClick={handleLogin} disabled={isLoggingIn}>{t('qq.login.loginButton')}</Btn>
          <Btn onClick={handleCancel} disabled={isLoggingIn}>{t('qq.login.cancelButton')}</Btn>
        </ButtonRow>
      </Body>

      <Footer>
        <a>{t('qq.login.register')}</a>
        <a>{t('qq.login.forgotPassword')}</a>
        <a>{t('qq.login.appeal')}</a>
      </Footer>
    </Wrap>
  );
};

export default QQLogin;
