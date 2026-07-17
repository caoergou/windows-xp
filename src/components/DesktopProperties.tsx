import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { XPSelect } from './XPSelect';
import { useUserSession } from '../context/UserSessionContext';
import { resolveOSTheme } from '../themes/useOSTheme';

const Container = styled.div`
  width: 360px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  display: flex;
  flex-direction: column;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 4px 12px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border-bottom: none;
  background: ${props =>
    props.$active
      ? resolveOSTheme(props.theme).tokens.SURFACE
      : resolveOSTheme(props.theme).tokens.GREY_F8};
  cursor: pointer;
  font-size: 11px;
  margin-right: 2px;

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  }
`;

const TabContent = styled.div`
  padding: 12px;
  flex: 1;
`;

const Preview = styled.div<{ $bgUrl: string }>`
  width: 100%;
  height: 120px;
  background-image: url(${props => props.$bgUrl});
  background-size: cover;
  background-position: center;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  margin-bottom: 12px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const Label = styled.div`
  width: 70px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
`;

const Select = styled(XPSelect)`
  flex: 1;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_GRADIENT};
  cursor: pointer;

  &:hover {
    box-shadow: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HOVER_SHADOW};
  }
`;

interface DesktopPropertiesProps {
  onClose?: () => void;
}

const DesktopProperties: React.FC<DesktopPropertiesProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { wallpaper, setWallpaper, wallpapers, resolveWallpaperSrc } = useUserSession();
  const [activeTab, setActiveTab] = useState('desktop');
  const [selected, setSelected] = useState(wallpaper);
  const previewBg = resolveWallpaperSrc(selected);

  const handleOk = () => {
    setWallpaper(selected);
    onClose?.();
  };

  return (
    <Container>
      <Tabs>
        <Tab $active={activeTab === 'themes'} onClick={() => setActiveTab('themes')}>
          {t('desktopProperties.themes', 'Themes')}
        </Tab>
        <Tab $active={activeTab === 'desktop'} onClick={() => setActiveTab('desktop')}>
          {t('desktopProperties.desktop', 'Desktop')}
        </Tab>
        <Tab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          {t('desktopProperties.settings', 'Settings')}
        </Tab>
      </Tabs>
      <TabContent>
        {activeTab === 'desktop' && (
          <>
            <Preview $bgUrl={previewBg} />
            <Row>
              <Label>{t('desktopProperties.background', 'Background:')}</Label>
              <Select value={selected} onChange={e => setSelected(e.target.value)}>
                {wallpapers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Row>
            <Row>
              <Label>{t('desktopProperties.position', 'Position:')}</Label>
              <Select defaultValue="stretch">
                <option value="stretch">{t('desktopProperties.stretch', 'Stretch')}</option>
              </Select>
            </Row>
          </>
        )}
        {activeTab !== 'desktop' && (
          <Row>
            <XPIcon name="computer" size={32} />
            <span>{t('desktopProperties.comingSoon', 'This tab is for display only.')}</span>
          </Row>
        )}
      </TabContent>
      <ButtonRow>
        <Button onClick={handleOk}>{t('common.ok')}</Button>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </ButtonRow>
    </Container>
  );
};

export default DesktopProperties;
