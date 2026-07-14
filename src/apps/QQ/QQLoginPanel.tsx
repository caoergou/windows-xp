import React, { useState } from 'react';
import { LoginRoot } from './styles';
import { qqImg } from './assets';
import { XPCheckbox } from '../../components/XPCheckbox';

interface QQLoginPanelProps {
  onLogin: (opts: { qqNum: string; invisible: boolean }) => void;
}

/**
 * QQ2006 login form - authentic structure (no CAPTCHA): number combo box +
 * register number, password + forgot password, auto-login / invisible login,
 * advanced settings / login / cancel. Rendered inside the engine's XP window
 * chrome; the top is the original 47px brand banner login_banner.png
 * ("QQ(R)2006 网络新生活，体验新感受!").
 */
const QQLoginPanel: React.FC<QQLoginPanelProps> = ({ onLogin }) => {
  const [qqNum, setQqNum] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);
  const [invisible, setInvisible] = useState(false);

  const submit = () => onLogin({ qqNum, invisible });

  return (
    <LoginRoot data-testid="qq-login">
      <div className="qq-login-banner" />
      <div className="qq-login-form">
        <div className="qq-login-form-row">
          <label htmlFor="qq-login-num">
            QQ号码
            <img className="qq-login-method" src={qqImg('select.png')} alt="" />
          </label>
          <div className="qq-login-num-wrap">
            <input
              id="qq-login-num"
              type="text"
              data-testid="qq-login-number"
              value={qqNum}
              onChange={e => setQqNum(e.target.value)}
              placeholder="<请在这儿输入QQ号码>"
              maxLength={11}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            <button className="qq-login-num-select" tabIndex={-1} />
          </div>
          <button className="qq-btn qq-login-reg">申请号码</button>
        </div>
        <div className="qq-login-form-row">
          <label htmlFor="qq-login-password">QQ密码</label>
          <input
            id="qq-login-password"
            type="password"
            data-testid="qq-login-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          <span className="qq-login-forget">忘了密码？</span>
        </div>
        <div className="qq-login-form-row qq-login-check">
          <label style={{ width: 55 }} />
          <XPCheckbox
            checked={autoLogin}
            onChange={e => setAutoLogin(e.target.checked)}
            label="自动登录"
          />
          <XPCheckbox
            checked={invisible}
            onChange={e => setInvisible(e.target.checked)}
            label="隐身登录"
          />
        </div>
      </div>
      <div className="qq-login-buttons">
        <button className="qq-btn" style={{ width: 78 }}>
          高级设置 ↓
        </button>
        <span />
        <button className="qq-btn" data-testid="qq-login-button" onClick={submit}>
          登录
        </button>
        <button className="qq-btn">取消</button>
      </div>
    </LoginRoot>
  );
};

export default QQLoginPanel;
