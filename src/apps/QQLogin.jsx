import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useApp } from '../hooks/useApp';
import { useWindowManager } from '../context/WindowManagerContext';
import { useTray } from '../context/TrayContext';

// ─── 样式 ─────────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #dce8f7;
  font-family: 'Microsoft YaHei', '微软雅黑', Tahoma, sans-serif;
  font-size: 12px;
  user-select: none;
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #4a90d9 0%, #2a6db5 100%);
  padding: 16px 14px 12px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
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
  </svg>
);

const HeaderText = styled.div`
  color: white;
  line-height: 1.4;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
  }
  .version {
    font-size: 11px;
    color: #c8dff8;
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
  background: linear-gradient(135deg, #b8d4f0 0%, #7fb0e0 100%);
  border: 2px solid #aac8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
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
  }

  input {
    flex: 1;
    height: 22px;
    border: 1px solid #8eb4d8;
    border-radius: 2px;
    padding: 0 6px;
    font-size: 12px;
    font-family: inherit;
    background: white;
    outline: none;

    &:focus {
      border-color: #3a7bd5;
      box-shadow: 0 0 3px rgba(58,123,213,0.4);
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
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #b0c8e0;
  margin: 2px 0;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 4px;
`;

const Btn = styled.button`
  width: 80px;
  height: 26px;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid;

  ${p => p.$primary ? `
    background: linear-gradient(to bottom, #5ba3e8 0%, #2878d6 100%);
    color: white;
    border-color: #1a5cb5;
    &:hover { filter: brightness(1.08); }
    &:active { filter: brightness(0.92); }
  ` : `
    background: linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%);
    color: #333;
    border-color: #aaa;
    &:hover { background: linear-gradient(to bottom, #fff 0%, #e8e8e8 100%); }
    &:active { filter: brightness(0.92); }
  `}
`;

const Footer = styled.div`
  background: #c8daf0;
  border-top: 1px solid #aac0dc;
  padding: 5px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #5577aa;

  a {
    color: #2255aa;
    text-decoration: none;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
`;

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const QQLogin = ({ windowId }) => {
  const api = useApp(windowId);
  const { closeWindow } = useWindowManager();
  const { register, unregister } = useTray();
  const [qqNum, setQqNum] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPwd, setRememberPwd] = useState(true);
  const [autoLogin, setAutoLogin] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaImg, setCaptchaImg] = useState('');

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
        title: 'QQ',
        message: '请输入验证码',
        type: 'error',
      });
      return;
    }
    if (captcha.toUpperCase() !== captchaImg) {
      await api.dialog.alert({
        title: 'QQ',
        message: '验证码错误，请重新输入',
        type: 'error',
      });
      generateCaptcha();
      setCaptcha('');
      return;
    }
    // 不管输什么都提示版本过旧
    await api.dialog.alert({
      title: 'QQ',
      message: '您使用的 QQ 版本过低，无法登录。\n请前往官网下载最新版本的 QQ。',
      type: 'error',
    });
  };

  const handleCancel = () => {
    closeWindow(windowId);
  };

  return (
    <Wrap>
      <Header>
        <Penguin />
        <HeaderText>
          <div className="title">QQ 2007</div>
          <div className="version">版本 7.0.0.8228</div>
        </HeaderText>
      </Header>

      <Body>
        <AvatarRow>
          <Avatar>🐧</Avatar>
        </AvatarRow>

        <FieldRow>
          <label>QQ号：</label>
          <input
            type="text"
            value={qqNum}
            onChange={e => setQqNum(e.target.value)}
            placeholder="QQ号/手机号/邮箱"
            maxLength={20}
          />
        </FieldRow>

        <FieldRow>
          <label>密　码：</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </FieldRow>

        <FieldRow>
          <label>验证码：</label>
          <input
            type="text"
            value={captcha}
            onChange={e => setCaptcha(e.target.value.toUpperCase())}
            placeholder="请输入验证码"
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
            记住密码
          </label>
          <label>
            <input type="checkbox" checked={autoLogin} onChange={e => setAutoLogin(e.target.checked)} />
            自动登录
          </label>
        </CheckRow>

        <Divider />

        <ButtonRow>
          <Btn $primary onClick={handleLogin}>登　录</Btn>
          <Btn onClick={handleCancel}>取　消</Btn>
        </ButtonRow>
      </Body>

      <Footer>
        <a>注册新账号</a>
        <a>找回密码</a>
        <a>申诉解封</a>
      </Footer>
    </Wrap>
  );
};

export default QQLogin;
