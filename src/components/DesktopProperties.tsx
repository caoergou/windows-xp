import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { XPSelect } from './XPSelect';
import { useUserSession } from '../context/UserSessionContext';
import { WALLPAPERS, getWallpaperById } from '../data/wallpapers';

const Container = styled.div`
  width: 360px;
  background: #ece9d8;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 11px;
  color: #000;
  display: flex;
  flex-direction: column;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ece9d8;
  background: #f0f0f0;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 4px 12px;
  border: 1px solid #ece9d8;
  border-bottom: none;
  background: ${props => (props.$active ? '#ece9d8' : '#f8f8f8')};
  cursor: pointer;
  font-size: 11px;
  margin-right: 2px;

  &:hover {
    background: #ece9d8;
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
  border: 1px solid #7f9db9;
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
  color: #333;
`;

const Select = styled(XPSelect)`
  flex: 1;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #ece9d8;
  background: #f0f0f0;
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;

  &:hover {
    box-shadow: inset -1px 1px #fff0cf, inset 1px 2px #fdd889, inset -2px 2px #fbc761, inset 2px -2px #e5a01a;
  }
`;

interface DesktopPropertiesProps {
  onClose?: () => void;
}

const DesktopProperties: React.FC<DesktopPropertiesProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { wallpaper, setWallpaper } = useUserSession();
  const [activeTab, setActiveTab] = useState('desktop');
  const [selected, setSelected] = useState(wallpaper);
  const previewBg = getWallpaperById(selected).src;

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
              <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {WALLPAPERS.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
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
