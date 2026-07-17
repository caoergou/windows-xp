import React, { useState } from 'react';
import styled from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  black: '#000000',
  highlight: '#316AC5',
  grey800: '#333333',
  fieldBorder: '#7F9DB9',
  grey500: '#808080',
  grey400: '#A0A0A0',
  surface: '#ECE9D8',
  white: '#FFFFFF',
};
/* brand-palette:end */

const Wrap = styled(CultureAppShell)`
  background: ${PALETTE.surface};
  color: ${PALETTE.black};
`;

const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.surface} 100%);
  border-bottom: 1px solid ${PALETTE.grey400};
  display: flex;
  align-items: center;
  padding: 0 2px;
  flex-shrink: 0;
`;

const MenuItem = styled.div`
  padding: 2px 8px;
  cursor: pointer;

  &:hover {
    background: ${PALETTE.highlight};
    color: white;
  }
`;

const Toolbar = styled.div`
  height: 28px;
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.surface} 100%);
  border-bottom: 1px solid ${PALETTE.grey400};
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
  border: 1px solid ${PALETTE.fieldBorder};
  border-radius: 2px;
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.surface} 100%);

  &:hover {
    background: ${PALETTE.white};
  }

  &:active {
    background: ${PALETTE.surface};
  }
`;

const WorkArea = styled.div`
  flex: 1;
  display: flex;
  background: ${PALETTE.fieldBorder};
  padding: 12px;
  overflow: auto;
`;

const Page = styled.div`
  width: 100%;
  max-width: 720px;
  min-height: 100%;
  margin: 0 auto;
  background: ${PALETTE.white};
  border: 1px solid ${PALETTE.grey500};
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  padding: 32px;
  font-family: 'Times New Roman', SimSun, serif;
  font-size: 14px;
  line-height: 1.6;
  color: ${PALETTE.black};
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
`;

const StatusBar = styled.div`
  height: 20px;
  background: ${PALETTE.surface};
  border-top: 1px solid ${PALETTE.grey400};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 11px;
  color: ${PALETTE.grey800};
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
