import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { XPSelect } from './XPSelect';
import { XPTabs, XPTab } from './XPTabs';
import { XPButton } from './XPButton';
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
`;

interface DesktopPropertiesProps {
  onClose?: () => void;
}

const DesktopProperties: React.FC<DesktopPropertiesProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { wallpaper, setWallpaper, wallpapers, resolveWallpaperSrc } = useUserSession();
  const [selected, setSelected] = useState(wallpaper);
  const previewBg = resolveWallpaperSrc(selected);

  const handleOk = () => {
    setWallpaper(selected);
    onClose?.();
  };

  const placeholder = (
    <Row>
      <XPIcon name="computer" size={32} />
      <span>{t('desktopProperties.comingSoon', 'This tab is for display only.')}</span>
    </Row>
  );

  const tabs: XPTab[] = [
    { id: 'themes', label: t('desktopProperties.themes', 'Themes'), content: placeholder },
    {
      id: 'desktop',
      label: t('desktopProperties.desktop', 'Desktop'),
      content: (
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
      ),
    },
    {
      id: 'screenSaver',
      label: t('desktopProperties.screenSaver', 'Screen Saver'),
      content: placeholder,
    },
    {
      id: 'appearance',
      label: t('desktopProperties.appearance', 'Appearance'),
      content: placeholder,
    },
    { id: 'settings', label: t('desktopProperties.settings', 'Settings'), content: placeholder },
  ];

  return (
    <Container>
      <XPTabs defaultActiveId="desktop" tabs={tabs} />
      <ButtonRow>
        <XPButton $default onClick={handleOk}>
          {t('common.ok')}
        </XPButton>
        <XPButton onClick={onClose}>{t('common.cancel')}</XPButton>
      </ButtonRow>
    </Container>
  );
};

export default DesktopProperties;
