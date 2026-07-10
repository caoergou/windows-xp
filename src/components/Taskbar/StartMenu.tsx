import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { TFunction } from 'i18next';
import XPIcon from '../XPIcon';
import { xpScrollbarStyles } from '../../theme';
import { APP_REGISTRY } from '../../registry/apps';
import { sounds } from '../../utils/soundManager';
import StartMenuFlyout from './StartMenuFlyout';

const StartMenuContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 0;
  width: 380px;
  background-color: #4282d6;
  border-top-left-radius: 5px;
  border-top-right-radius: 8px;
  z-index: 20000;
  box-shadow: 2px -2px 5px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
`;

const StartHeader = styled.div`
  position: relative;
  align-self: flex-start;
  display: flex;
  align-items: center;
  color: #fff;
  height: 54px;
  padding: 6px 5px 5px;
  width: 100%;
  border-top-left-radius: 5px;
  border-top-right-radius: 8px;
  background: linear-gradient(
    to bottom,
    #1868ce 0%,
    #0e60cb 12%,
    #0e60cb 20%,
    #1164cf 32%,
    #1667cf 33%,
    #1b6cd3 47%,
    #1e70d9 54%,
    #2476dc 60%,
    #297ae0 65%,
    #3482e3 77%,
    #3786e5 79%,
    #428ee9 90%,
    #4791eb 100%
  );
  overflow: hidden;

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 1px;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(
      to right,
      transparent 0,
      rgba(255, 255, 255, 0.3) 1%,
      rgba(255, 255, 255, 0.5) 2%,
      rgba(255, 255, 255, 0.5) 95%,
      rgba(255, 255, 255, 0.3) 98%,
      rgba(255, 255, 255, 0.2) 99%,
      transparent 100%
    );
    box-shadow: inset 0 -1px 1px #0e60cb;
  }

  .user-avatar {
    width: 42px;
    height: 42px;
    margin-right: 5px;
    border-radius: 3px;
    border: 2px solid rgba(222, 222, 222, 0.8);
    background: #99ccff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  span {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    text-shadow: 1px 1px rgba(0, 0, 0, 0.7);
  }
`;

const StartBody = styled.div`
  display: flex;
  min-height: 220px;
  max-height: calc(100vh - 84px);
  width: calc(100% - 4px);
  position: relative;
  border-top: 1px solid #385de7;
  box-shadow: 0 1px #385de7;
`;

const OrangeLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0%,
    #da884a 50%,
    rgba(0, 0, 0, 0) 100%
  );
  z-index: 1;
`;

const StartLeft = styled.div`
  width: 190px;
  background: #fff;
  padding: 6px 5px 0;
  overflow-y: auto;
  ${xpScrollbarStyles}
`;

const StartRight = styled.div`
  width: 190px;
  background: #cbe3ff;
  border-left: solid rgba(58, 58, 255, 0.37) 1px;
  padding: 6px 5px 5px;
  overflow-y: auto;
  ${xpScrollbarStyles}
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  font-size: 11px;
  color: #333;

  &:hover {
    background: #2f71cd;
    color: white;
  }

  .menu-icon {
    margin-right: 5px;
  }
`;

const RightMenuItem = styled(MenuItem)`
  color: #00136b;

  &:hover {
    background: #2f71cd;
    color: #fff;
  }
`;

const MenuSeparator = styled.div`
  height: 7.5px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
  background-clip: content-box;
`;

const MenuArrow = styled.span`
  margin-left: auto;
  font-size: 10px;
  color: #666;
`;

const RightMenuSeparator = styled(MenuSeparator)`
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
`;

const StartFooter = styled.div`
  display: flex;
  align-self: flex-end;
  align-items: center;
  justify-content: flex-end;
  color: #fff;
  height: 36px;
  width: 100%;
  padding: 0 10px;
  gap: 10px;
  background: linear-gradient(
    to bottom,
    #4282d6 0%,
    #3b85e0 3%,
    #418ae3 5%,
    #418ae3 17%,
    #3c87e2 21%,
    #3786e4 26%,
    #3482e3 29%,
    #2e7ee1 39%,
    #2374df 49%,
    #2072db 57%,
    #196edb 62%,
    #176bd8 72%,
    #1468d5 75%,
    #1165d2 83%,
    #0f61cb 88%
  );

  button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 11px;
    padding: 3px;

    &:hover {
      background-color: rgba(60, 80, 210, 0.5);
    }

    .footer-icon {
      margin-right: 5px;
    }
  }
`;

interface StartMenuApp {
  id: string;
  nameKey: string;
  icon: string;
  action: string;
}

interface StartMenuProps {
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  userName: string;
  startMenuApps: StartMenuApp[];
  language: string;
  onLaunch: (appName: string, pathOrKey?: string) => void;
  onTurnOff: () => void;
  onLogout: () => void;
  t: TFunction;
}

const INTERNAL_APPS = new Set(['FileProperties', 'DummyApp']);

const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  menuRef,
  userName,
  startMenuApps,
  language,
  onLaunch,
  onTurnOff,
  onLogout,
  t,
}) => {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const isChineseLocale = language?.startsWith('zh');

  const launchWithSound = useCallback(
    (appName: string, pathOrKey?: string) => {
      sounds.menuCommand();
      onLaunch(appName, pathOrKey);
    },
    [onLaunch]
  );

  const allProgramsApps = useMemo(
    () => Object.values(APP_REGISTRY).filter(app => !INTERNAL_APPS.has(app.id)),
    []
  );

  if (!isOpen) return null;

  return (
    <StartMenuContainer
      ref={menuRef}
      data-testid="start-menu"
      onMouseLeave={() => setFlyoutOpen(false)}
    >
      <StartHeader>
        <div className="user-avatar">
          <XPIcon name="user" size={32} color="white" />
        </div>
        <span>{userName}</span>
      </StartHeader>
      <StartBody>
        <OrangeLine />
        <StartLeft>
          <MenuItem
            data-testid="start-menu-all-programs"
            onMouseEnter={() => setFlyoutOpen(true)}
            onClick={() => setFlyoutOpen(prev => !prev)}
          >
            <XPIcon name="programs" size={24} className="menu-icon" />
            <span>{t('startMenu.allPrograms')}</span>
            <MenuArrow>
              <svg width="6" height="10" viewBox="0 0 6 10">
                <path d="M0 0 L6 5 L0 10 Z" fill="currentColor" />
              </svg>
            </MenuArrow>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => launchWithSound('Internet Explorer')}>
            <XPIcon name="ie" size={24} className="menu-icon" />
            <span>{t('startMenu.apps.internetExplorer')}</span>
          </MenuItem>
          {isChineseLocale && (
            <MenuItem onClick={() => launchWithSound('QQ')}>
              <XPIcon name="qq" size={24} className="menu-icon" />
              <span>{t('startMenu.apps.qq')}</span>
            </MenuItem>
          )}
          <MenuSeparator />
          {startMenuApps.map(app => (
            <MenuItem
              key={app.id}
              data-testid={`start-menu-${app.id}`}
              onClick={() =>
                launchWithSound(app.action, app.action === 'DummyApp' ? t(app.nameKey) : undefined)
              }
            >
              <XPIcon name={app.icon} size={24} className="menu-icon" />
              <span>{t(app.nameKey)}</span>
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem onClick={() => launchWithSound('RunDialog')}>
            <XPIcon name="run" size={24} className="menu-icon" />
            <span>{t('startMenu.run')}</span>
          </MenuItem>
        </StartLeft>
        <StartRight>
          <RightMenuItem onClick={() => launchWithSound('Explorer', t('startMenu.myDocuments'))}>
            <XPIcon name="documents" size={24} className="menu-icon" />
            <span>{t('startMenu.myDocuments')}</span>
          </RightMenuItem>
          <RightMenuItem onClick={() => launchWithSound('Explorer', t('startMenu.myComputer'))}>
            <XPIcon name="computer" size={24} className="menu-icon" />
            <span>{t('startMenu.myComputer')}</span>
          </RightMenuItem>
          <RightMenuItem onClick={() => launchWithSound('Explorer', t('startMenu.myMusic'))}>
            <XPIcon name="folder" size={24} className="menu-icon" />
            <span>{t('startMenu.myMusic')}</span>
          </RightMenuItem>
          <RightMenuSeparator />
          <RightMenuItem onClick={() => launchWithSound('ControlPanel')}>
            <XPIcon name="control_panel" size={24} className="menu-icon" />
            <span>{t('startMenu.controlPanel')}</span>
          </RightMenuItem>
          <RightMenuItem onClick={() => launchWithSound('DummyApp', t('startMenu.printersAndFaxes'))}>
            <XPIcon name="printer" size={24} className="menu-icon" />
            <span>{t('startMenu.printersAndFaxes')}</span>
          </RightMenuItem>
          <RightMenuSeparator />
          <RightMenuItem onClick={() => launchWithSound('Search')}>
            <XPIcon name="search" size={24} className="menu-icon" />
            <span>{t('startMenu.search')}</span>
          </RightMenuItem>
          <RightMenuItem onClick={() => launchWithSound('HelpAndSupport')}>
            <XPIcon name="help" size={24} className="menu-icon" />
            <span>{t('startMenu.help')}</span>
          </RightMenuItem>
          <RightMenuSeparator />
          <RightMenuItem onClick={() => launchWithSound('Recycle Bin', t('desktop.recycleBin'))}>
            <XPIcon name="recycle_bin" size={24} className="menu-icon" />
            <span>{t('desktop.recycleBin')}</span>
          </RightMenuItem>
        </StartRight>
      </StartBody>
      <StartFooter>
        <button onClick={onLogout}>
          <XPIcon name="logout" size={16} className="footer-icon" color="white" />
          {t('startMenu.logOff')}
        </button>
        <button onClick={onTurnOff}>
          <XPIcon name="shutdown" size={16} className="footer-icon" color="white" />
          {t('startMenu.turnOff')}
        </button>
      </StartFooter>
      {flyoutOpen && (
        <StartMenuFlyout
          apps={allProgramsApps}
          onLaunch={appId => {
            setFlyoutOpen(false);
            launchWithSound(appId);
          }}
        />
      )}
    </StartMenuContainer>
  );
};

export default StartMenu;
