import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../XPIcon';
import { SYSTEM_PATHS, getSystemPathTitle } from '../../data/systemPaths';
import { resolveOSTheme } from '../../themes/useOSTheme';

const SidebarContainer = styled.div`
  width: 180px;
  min-width: 180px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_GRADIENT};
  overflow: auto;
  padding: 10px;
`;

const Panel = styled.div`
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  width: 100%;
  overflow: hidden;

  &:not(:last-child) {
    margin-bottom: 12px;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  height: 23px;
  padding-left: 11px;
  padding-right: 2px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    rgb(240, 240, 255) 0,
    rgb(240, 240, 255) 30%,
    rgb(168, 188, 255) 100%
  );

  &:hover .panel-title {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_LINK};
  }
`;

const PanelTitle = styled.div`
  font-weight: 700;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_HEADER_TEXT};
  flex: 1;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const CollapseBtn = styled.img`
  width: 18px;
  height: 18px;
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
`;

const PanelBody = styled.div<{ $collapsed: boolean }>`
  padding: ${p => (p.$collapsed ? '0' : '5px 10px')};
  max-height: ${p => (p.$collapsed ? '0' : '500px')};
  overflow: hidden;
  background: linear-gradient(
    to right,
    rgb(180, 200, 251) 0%,
    rgb(164, 185, 251) 50%,
    rgb(180, 200, 251) 100%
  );
  background-color: rgba(198, 211, 255, 0.87);
`;

const LinkItem = styled.div<{ $active?: boolean }>`
  display: flex;
  margin-bottom: 2px;
  cursor: pointer;
  font-size: 10px;
  line-height: 14px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_HEADER_TEXT};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};

  &:hover {
    cursor: pointer;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_LINK_HOVER};
    text-decoration: underline;
  }

  .link-icon {
    width: 14px;
    height: 14px;
    margin-right: 5px;
    flex-shrink: 0;
  }
`;

/* Detail text */
const DetailText = styled.div`
  padding: 3px 10px 2px 12px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
  line-height: 1.5;
`;

const DetailName = styled.div`
  font-weight: bold;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  margin-bottom: 1px;
`;

const DetailType = styled.div`
  font-size: 10px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

interface ExplorerSidebarProps {
  currentPath: string[];
  currentItem: { name: string; type: string } | null;
  onNavigate: (path: string[]) => void;
}

const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  currentPath,
  currentItem,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState({ task: false, places: false, detail: false });

  const isActive = (path: string[]) => {
    if (path.length === 0) return currentPath.length === 0;
    return currentPath.length === path.length && path.every((p, i) => currentPath[i] === p);
  };

  const toggle = (key: 'task' | 'places' | 'detail') =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const currentName =
    currentPath.length === 0 ? t('desktop.myComputer') : getSystemPathTitle(currentPath, t);

  return (
    <SidebarContainer>
      <Panel>
        <PanelHeader onClick={() => toggle('task')}>
          <PanelTitle className="panel-title">{t('explorer.sidebar.systemTasks')}</PanelTitle>
          <CollapseBtn
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
            alt={collapsed.task ? t('explorer.sidebar.expand') : t('explorer.sidebar.collapse')}
          />
        </PanelHeader>
        <PanelBody $collapsed={collapsed.task}>
          <LinkItem>
            <XPIcon name="view_info" size={14} className="link-icon" />
            <span>{t('explorer.sidebar.viewSystemInfo')}</span>
          </LinkItem>
          <LinkItem>
            <XPIcon name="remove" size={14} className="link-icon" />
            <span>{t('explorer.sidebar.addRemovePrograms')}</span>
          </LinkItem>
          <LinkItem>
            <XPIcon name="control" size={14} className="link-icon" />
            <span>{t('explorer.sidebar.changeSettings')}</span>
          </LinkItem>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader onClick={() => toggle('places')}>
          <PanelTitle className="panel-title">{t('explorer.sidebar.otherPlaces')}</PanelTitle>
          <CollapseBtn
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
            alt={collapsed.places ? t('explorer.sidebar.expand') : t('explorer.sidebar.collapse')}
          />
        </PanelHeader>
        <PanelBody $collapsed={collapsed.places}>
          <LinkItem $active={isActive([])} onClick={() => onNavigate([])}>
            <XPIcon name="computer" size={14} className="link-icon" />
            <span>{t('desktop.myComputer')}</span>
          </LinkItem>
          <LinkItem
            $active={isActive([...SYSTEM_PATHS.myDocuments])}
            onClick={() => onNavigate([...SYSTEM_PATHS.myDocuments])}
          >
            <XPIcon name="documents" size={14} className="link-icon" />
            <span>{t('desktop.myDocuments')}</span>
          </LinkItem>
          <LinkItem
            $active={isActive([...SYSTEM_PATHS.network])}
            onClick={() => onNavigate([...SYSTEM_PATHS.network])}
          >
            <XPIcon name="network" size={14} className="link-icon" />
            <span>{t('desktop.networkNeighborhood')}</span>
          </LinkItem>
          <LinkItem
            $active={isActive([...SYSTEM_PATHS.recycleBin])}
            onClick={() => onNavigate([...SYSTEM_PATHS.recycleBin])}
          >
            <XPIcon name="recycle_bin" size={14} className="link-icon" />
            <span>{t('desktop.recycleBin')}</span>
          </LinkItem>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader onClick={() => toggle('detail')}>
          <PanelTitle className="panel-title">{t('explorer.sidebar.details')}</PanelTitle>
          <CollapseBtn
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
            alt={collapsed.detail ? t('explorer.sidebar.expand') : t('explorer.sidebar.collapse')}
          />
        </PanelHeader>
        <PanelBody $collapsed={collapsed.detail}>
          <DetailText>
            <DetailName>{currentItem ? currentItem.name : currentName}</DetailName>
            <DetailType>
              {currentItem
                ? currentItem.type === 'folder'
                  ? t('explorer.types.folder')
                  : currentItem.type === 'drive'
                    ? t('explorer.types.localDisk')
                    : t('explorer.types.file')
                : t('explorer.types.systemFolder')}
            </DetailType>
          </DetailText>
        </PanelBody>
      </Panel>
    </SidebarContainer>
  );
};

export default ExplorerSidebar;
