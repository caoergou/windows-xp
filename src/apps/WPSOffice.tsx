import React, { useState } from 'react';
import styled from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';

const Wrap = styled(CultureAppShell)`
  background: #ECE9D8;
  color: #000;
`;

const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(to bottom, #fff 0%, #ECE9D8 100%);
  border-bottom: 1px solid #A0A0A0;
  display: flex;
  align-items: center;
  padding: 0 2px;
  flex-shrink: 0;
`;

const MenuItem = styled.div`
  padding: 2px 8px;
  cursor: pointer;

  &:hover {
    background: #316AC5;
    color: white;
  }
`;

const Toolbar = styled.div`
  height: 28px;
  background: linear-gradient(to bottom, #fff 0%, #ECE9D8 100%);
  border-bottom: 1px solid #A0A0A0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  flex-shrink: 0;
`;

const ToolBtn = styled.button`
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid #7F9DB9;
  border-radius: 2px;
  background: linear-gradient(to bottom, #fff 0%, #ECE9D8 100%);

  &:hover {
    background: #fff;
  }

  &:active {
    background: #ECE9D8;
  }
`;

const WorkArea = styled.div`
  flex: 1;
  display: flex;
  background: #7F9DB9;
  padding: 12px;
  overflow: auto;
`;

const Page = styled.div`
  width: 100%;
  max-width: 720px;
  min-height: 100%;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #808080;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  padding: 32px;
  font-family: 'Times New Roman', SimSun, serif;
  font-size: 14px;
  line-height: 1.6;
  color: #000;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

const StatusBar = styled.div`
  height: 20px;
  background: #ECE9D8;
  border-top: 1px solid #A0A0A0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 11px;
  color: #333;
  flex-shrink: 0;
`;

interface WPSOfficeProps {
  windowId?: string;
}

const WPSOffice: React.FC<WPSOfficeProps> = () => {
  const { t } = useTranslation();
  const [zoom] = useState(100);

  return (
    <Wrap>
      <MenuBar>
        <MenuItem>{t('wpsOffice.menu.file')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.edit')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.view')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.insert')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.format')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.tools')}</MenuItem>
        <MenuItem>{t('wpsOffice.menu.help')}</MenuItem>
      </MenuBar>

      <Toolbar>
        <ToolBtn>{t('wpsOffice.toolbar.new')}</ToolBtn>
        <ToolBtn>{t('wpsOffice.toolbar.open')}</ToolBtn>
        <ToolBtn>{t('wpsOffice.toolbar.save')}</ToolBtn>
        <ToolBtn>{t('wpsOffice.toolbar.print')}</ToolBtn>
        <ToolBtn>{t('wpsOffice.toolbar.preview')}</ToolBtn>
      </Toolbar>

      <WorkArea>
        <Page>
          <Title>{t('wpsOffice.documentTitle')}</Title>
          <p>{t('wpsOffice.paragraph1')}</p>
          <p>{t('wpsOffice.paragraph2')}</p>
          <p>{t('wpsOffice.paragraph3')}</p>
        </Page>
      </WorkArea>

      <StatusBar>
        <span>{t('wpsOffice.status.ready')}</span>
        <span>{t('wpsOffice.status.zoom', { zoom })}</span>
      </StatusBar>
    </Wrap>
  );
};

export default WPSOffice;
