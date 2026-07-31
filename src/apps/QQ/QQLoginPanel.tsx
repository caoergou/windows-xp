import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginRoot } from './styles';
import { qqImg } from './assets';
import { XPCheckbox } from '../../components/XPCheckbox';

interface QQLoginPanelProps {
  defaultNumber?: string;
  defaultPassword?: string;
  defaultRememberPassword?: boolean;
  onLogin: (opts: {
    qqNum: string;
    password: string;
    rememberPassword: boolean;
    invisible: boolean;
  }) => void;
}

/**
 * QQ2006 login form - authentic structure (no CAPTCHA): number combo box +
 * register number, password + forgot password, auto-login / invisible login,
 * advanced settings / login / cancel. Rendered inside the engine's XP window
 * chrome; the top is the original 47px brand banner login_banner.png
 * ("QQ(R)2006 网络新生活，体验新感受!").
 */
const QQLoginPanel: React.FC<QQLoginPanelProps> = ({
  defaultNumber = '',
  defaultPassword = '',
  defaultRememberPassword = defaultPassword.length > 0,
  onLogin,
}) => {
  const { t } = useTranslation();
  const [qqNum, setQqNum] = useState(defaultNumber);
  const [password, setPassword] = useState(defaultPassword);
  const [rememberPassword, setRememberPassword] = useState(defaultRememberPassword);
  const [invisible, setInvisible] = useState(false);
  const canSubmit = qqNum.trim().length > 0 && password.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onLogin({ qqNum: qqNum.trim(), password, rememberPassword, invisible });
  };

  const submitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') submit();
  };

  return (
    <LoginRoot data-testid="qq-login">
      <div className="qq-login-banner" />
      <div className="qq-login-form">
        <div className="qq-login-form-row">
          <label htmlFor="qq-login-num">
            {t('qq.login.accountLabel')}
            <img className="qq-login-method" src={qqImg('select.png')} alt="" />
          </label>
          <div className="qq-login-num-wrap">
            <input
              id="qq-login-num"
              type="text"
              data-testid="qq-login-number"
              value={qqNum}
              onChange={e => setQqNum(e.target.value)}
              placeholder={t('qq.login.accountPlaceholder')}
              maxLength={11}
              onKeyDown={submitOnEnter}
            />
            <button className="qq-login-num-select" tabIndex={-1} />
          </div>
          <button className="qq-btn qq-login-reg">{t('qq.login.register')}</button>
        </div>
        <div className="qq-login-form-row">
          <label htmlFor="qq-login-password">{t('qq.login.passwordLabel')}</label>
          <input
            id="qq-login-password"
            type="password"
            data-testid="qq-login-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('qq.login.passwordPlaceholder')}
            onKeyDown={submitOnEnter}
          />
          <span className="qq-login-forget">{t('qq.login.forgotPassword')}</span>
        </div>
        <div className="qq-login-form-row qq-login-check">
          <label style={{ width: 55 }} />
          <XPCheckbox
            checked={rememberPassword}
            onChange={e => setRememberPassword(e.target.checked)}
            label={t('qq.login.rememberPassword')}
          />
          <XPCheckbox
            checked={invisible}
            onChange={e => setInvisible(e.target.checked)}
            label={t('qq.login.invisibleLogin')}
          />
        </div>
      </div>
      <div className="qq-login-buttons">
        <button className="qq-btn" style={{ width: 78 }}>
          {t('qq.login.advancedSettings')} ↓
        </button>
        <span />
        <button
          className="qq-btn"
          data-testid="qq-login-button"
          disabled={!canSubmit}
          onClick={submit}
        >
          {t('qq.login.loginButton')}
        </button>
        <button className="qq-btn">{t('qq.login.cancelButton')}</button>
      </div>
    </LoginRoot>
  );
};

export default QQLoginPanel;
