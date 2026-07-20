import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUserSession } from '../../context/UserSessionContext';
import { useWindowManager } from '../../context/WindowManagerContext';
import type {
  BootScreenSlotProps,
  LoginScreenSlotProps,
  OSMenuBarProps,
  WindowDecorationProps,
} from '../../os/contract';
import { resolveOSTheme } from '../useOSTheme';

const Screen = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const Panel = styled.div`
  min-width: 260px;
  padding: 24px;
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  box-shadow: 6px 6px 0 ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

export const PaperBootScreen: React.FC<BootScreenSlotProps> = ({ onComplete, branding }) => {
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <Screen data-testid="boot-screen">
      <Panel>{branding?.text ?? t('paperOS.name')}</Panel>
    </Screen>
  );
};

export const PaperLoginScreen: React.FC<LoginScreenSlotProps> = ({ branding }) => {
  const { t } = useTranslation();
  const { login, user } = useUserSession();
  const [password, setPassword] = React.useState('');
  return (
    <Screen data-testid="login-screen">
      <Panel>
        <h1>{branding?.title ?? t('paperOS.name')}</h1>
        <p>{branding?.userName ?? user.name}</p>
        <label>
          {t('login.password')}
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </label>
        <button type="button" onClick={() => login(password)}>
          {t('login.login')}
        </button>
      </Panel>
    </Screen>
  );
};

const PaperWindow = styled.section<{ $focused: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  box-shadow: ${({ $focused, theme }) =>
    $focused ? `5px 5px 0 ${resolveOSTheme(theme).tokens.BUTTON_SHADOW}` : 'none'};
  box-sizing: border-box;
`;

const PaperTitle = styled.header`
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  border-bottom: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.TITLEBAR};
  user-select: none;

  strong {
    flex: 1;
  }
`;

const PaperBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

export const PaperWindowDecoration: React.FC<WindowDecorationProps> = ({
  windowState,
  isFocused,
  isResizable,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <PaperWindow $focused={isFocused} onMouseDown={onFocus}>
      <PaperTitle onDoubleClick={() => isResizable && onMaximize()}>
        <strong>{windowState.title}</strong>
        <button type="button" aria-label={t('window.minimize')} onClick={onMinimize}>
          −
        </button>
        {isResizable && (
          <button type="button" aria-label={t('window.maximize')} onClick={onMaximize}>
            □
          </button>
        )}
        <button type="button" aria-label={t('window.close')} onClick={onClose}>
          ×
        </button>
      </PaperTitle>
      <PaperBody>{children}</PaperBody>
    </PaperWindow>
  );
};

const Dock = styled.nav`
  position: absolute;
  z-index: 9000;
  right: 12px;
  bottom: 8px;
  left: 12px;
  min-height: 30px;
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

export const PaperDock: React.FC = () => {
  const { t } = useTranslation();
  const { windows, activeWindowId, focusWindow, minimizeWindow, registerTaskTarget } =
    useWindowManager();
  const refs = useRef(new Map<string, HTMLButtonElement>());
  return (
    <Dock aria-label={t('paperOS.name')}>
      {windows.map(window => (
        <button
          key={window.id}
          ref={element => {
            if (element) refs.current.set(window.id, element);
            else refs.current.delete(window.id);
            registerTaskTarget(window.id, element);
          }}
          type="button"
          aria-pressed={activeWindowId === window.id && !window.isMinimized}
          onClick={() =>
            activeWindowId === window.id && !window.isMinimized
              ? minimizeWindow(window.id)
              : focusWindow(window.id)
          }
        >
          {window.title}
        </button>
      ))}
    </Dock>
  );
};

const MenuBar = styled.nav`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const PaperMenuSlot = styled.div`
  position: relative;
`;

const PaperMenuDropdown = styled.div`
  position: absolute;
  z-index: 9999;
  top: 100%;
  left: 0;
  min-width: 160px;
  padding: 4px;
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};

  button {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
`;

const PaperMenuSeparator = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

export const PaperMenuBar: React.FC<OSMenuBarProps> = ({ menus, onCommand }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <MenuBar role="menubar" onMouseLeave={() => setOpenId(null)}>
      {menus.map(menu => (
        <PaperMenuSlot key={menu.id}>
          <button
            type="button"
            role="menuitem"
            aria-expanded={openId === menu.id}
            onClick={() => setOpenId(current => (current === menu.id ? null : menu.id))}
          >
            {menu.label}
          </button>
          {openId === menu.id && (
            <PaperMenuDropdown role="menu">
              {menu.items.map(item =>
                item.type === 'separator' ? (
                  <PaperMenuSeparator key={item.id} />
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      onCommand(item.id);
                      setOpenId(null);
                    }}
                  >
                    <span>{item.label}</span>
                    <span>{item.shortcut}</span>
                  </button>
                )
              )}
            </PaperMenuDropdown>
          )}
        </PaperMenuSlot>
      ))}
    </MenuBar>
  );
};
