import React from 'react';
import styled from 'styled-components';
import { TFunction } from 'i18next';
import XPIcon from '../XPIcon';

const StartMenuContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 0;
  width: 300px;
  background: white;
  border: 1px solid #003399;
  border-radius: 0;
  z-index: 20000;
  box-shadow: 2px -2px 5px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`;

const StartHeader = styled.div`
  height: 50px;
  background: linear-gradient(to bottom, #245edc 0%, #3e87eb 100%);
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 0;

  .user-avatar {
    margin-right: 10px;
    border: 2px solid white;
    border-radius: 3px;
    background: #99ccff;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
  }

  span {
    color: white;
    font-weight: bold;
    text-shadow: 1px 1px 1px black;
  }
`;

const StartBody = styled.div`
  display: flex;
  height: 400px;
  border-top: 1px solid #f5c684;
`;

const StartLeft = styled.div`
  width: 50%;
  background: white;
  padding: 5px;
  overflow-y: auto;
`;

const StartRight = styled.div`
  width: 50%;
  background: #d3e5fa;
  padding: 5px;
  border-left: 1px solid #95bdee;
  overflow-y: auto;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  font-size: 11px;
  color: #333;

  &:hover {
    background: #316ac5;
    color: white;
  }

  .menu-icon {
    margin-right: 5px;
  }
`;

const MenuSeparator = styled.div`
  height: 1px;
  background: #c0c0c0;
  margin: 3px 5px;
`;

const StartFooter = styled.div`
  height: 40px;
  background: linear-gradient(to bottom, #245edc 0%, #3e87eb 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  gap: 10px;

  button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 11px;

    &:hover {
      text-decoration: underline;
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
  onLaunch: (appName: string, pathOrKey?: string) => void;
  onTurnOff: () => void;
  onLogout: () => void;
  t: TFunction;
}

const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  menuRef,
  userName,
  startMenuApps,
  onLaunch,
  onTurnOff,
  onLogout,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <StartMenuContainer ref={menuRef} data-testid="start-menu">
      <StartHeader>
        <div className="user-avatar">
          <XPIcon name="user" size={24} color="white" />
        </div>
        <span>{userName}</span>
      </StartHeader>
      <StartBody>
        <StartLeft>
          <MenuItem onClick={() => onLaunch('AllPrograms')}>
            <XPIcon name="programs" size={24} className="menu-icon" />
            <span>{t('startMenu.allPrograms')}</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => onLaunch('Internet Explorer')}>
            <XPIcon name="ie" size={24} className="menu-icon" />
            <span>{t('startMenu.apps.internetExplorer')}</span>
          </MenuItem>
          <MenuItem onClick={() => onLaunch('QQ')}>
            <XPIcon name="qq" size={24} className="menu-icon" />
            <span>{t('startMenu.apps.qq')}</span>
          </MenuItem>
          <MenuSeparator />
          {startMenuApps.map(app => (
            <MenuItem
              key={app.id}
              data-testid={`start-menu-${app.id}`}
              onClick={() =>
                onLaunch(app.action, app.action === 'DummyApp' ? t(app.nameKey) : undefined)
              }
            >
              <XPIcon name={app.icon} size={24} className="menu-icon" />
              <span>{t(app.nameKey)}</span>
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem onClick={() => onLaunch('RunDialog')}>
            <XPIcon name="run" size={24} className="menu-icon" />
            <span>{t('startMenu.run')}</span>
          </MenuItem>
        </StartLeft>
        <StartRight>
          <MenuItem onClick={() => onLaunch('Explorer', t('startMenu.myDocuments'))}>
            <XPIcon name="documents" size={24} className="menu-icon" />
            <span>{t('startMenu.myDocuments')}</span>
          </MenuItem>
          <MenuItem onClick={() => onLaunch('Explorer', t('startMenu.myComputer'))}>
            <XPIcon name="computer" size={24} className="menu-icon" />
            <span>{t('startMenu.myComputer')}</span>
          </MenuItem>
          <MenuItem onClick={() => onLaunch('Explorer', t('startMenu.myMusic'))}>
            <XPIcon name="folder" size={24} className="menu-icon" />
            <span>{t('startMenu.myMusic')}</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => onLaunch('DummyApp', t('startMenu.controlPanel'))}>
            <XPIcon name="control_panel" size={24} className="menu-icon" />
            <span>{t('startMenu.controlPanel')}</span>
          </MenuItem>
          <MenuItem onClick={() => onLaunch('DummyApp', t('startMenu.printersAndFaxes'))}>
            <XPIcon name="printer" size={24} className="menu-icon" />
            <span>{t('startMenu.printersAndFaxes')}</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => onLaunch('Search')}>
            <XPIcon name="search" size={24} className="menu-icon" />
            <span>{t('startMenu.search')}</span>
          </MenuItem>
          <MenuItem onClick={() => onLaunch('HelpAndSupport')}>
            <XPIcon name="help" size={24} className="menu-icon" />
            <span>{t('startMenu.help')}</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => onLaunch('Recycle Bin', t('desktop.recycleBin'))}>
            <XPIcon name="recycle_bin" size={24} className="menu-icon" />
            <span>{t('desktop.recycleBin')}</span>
          </MenuItem>
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
    </StartMenuContainer>
  );
};

export default StartMenu;
