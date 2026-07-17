import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUserSession } from '../../context/UserSessionContext';
import { XPSelect } from '../../components/XPSelect';
import { resolveOSTheme } from '../../themes/useOSTheme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const GroupBox = styled.div`
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  padding: 12px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
`;

const Preview = styled.div<{ $bgUrl: string }>`
  width: 100%;
  height: 140px;
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

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  width: 100px;
  flex-shrink: 0;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const Select = styled(XPSelect)`
  flex: 1;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_GRADIENT};
  cursor: pointer;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};

  &:hover {
    box-shadow: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HOVER_SHADOW};
  }
`;

interface DisplaySettingsProps {
  onBack: () => void;
}

const RESOLUTIONS = ['1024x768', '1280x1024', '1920x1080'];
const SCREENSAVER_OPTIONS = [
  { value: 'none', key: 'screensaverNone' },
  { value: 'logo', key: 'screensaverLogo' },
];

const DisplaySettings: React.FC<DisplaySettingsProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const {
    wallpaper,
    setWallpaper,
    screensaverEnabled,
    setScreensaverEnabled,
    wallpapers,
    resolveWallpaperSrc,
  } = useUserSession();
  const [selectedWallpaper, setSelectedWallpaper] = useState(wallpaper);
  const [selectedResolution, setSelectedResolution] = useState('1024x768');
  const [selectedScreensaver, setSelectedScreensaver] = useState(
    screensaverEnabled ? 'logo' : 'none'
  );

  const previewBg = resolveWallpaperSrc(selectedWallpaper);

  const handleApply = () => {
    setWallpaper(selectedWallpaper);
    setScreensaverEnabled(selectedScreensaver === 'logo');
  };

  const handleOk = () => {
    handleApply();
    onBack();
  };

  return (
    <Container>
      <GroupBox>
        <GroupTitle>{t('controlPanel.displaySettings.preview', 'Preview')}</GroupTitle>
        <Preview $bgUrl={previewBg} />
      </GroupBox>
      <GroupBox>
        <Row>
          <Label>{t('controlPanel.displaySettings.wallpaper', 'Wallpaper:')}</Label>
          <Select value={selectedWallpaper} onChange={e => setSelectedWallpaper(e.target.value)}>
            {wallpapers.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Row>
        <Row>
          <Label>{t('controlPanel.displaySettings.resolution', 'Screen resolution:')}</Label>
          <Select value={selectedResolution} onChange={e => setSelectedResolution(e.target.value)}>
            {RESOLUTIONS.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Row>
        <Row>
          <Label>{t('controlPanel.displaySettings.screensaver', 'Screen saver:')}</Label>
          <Select
            value={selectedScreensaver}
            onChange={e => setSelectedScreensaver(e.target.value)}
          >
            {SCREENSAVER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {t(`controlPanel.displaySettings.${o.key}`)}
              </option>
            ))}
          </Select>
        </Row>
      </GroupBox>
      <ButtonRow>
        <Button onClick={handleOk}>{t('controlPanel.ok', 'OK')}</Button>
        <Button onClick={handleApply}>{t('controlPanel.apply', 'Apply')}</Button>
        <Button onClick={onBack}>{t('controlPanel.cancel', 'Cancel')}</Button>
      </ButtonRow>
    </Container>
  );
};

export default DisplaySettings;
