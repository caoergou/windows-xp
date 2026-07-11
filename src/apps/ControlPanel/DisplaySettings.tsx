import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUserSession } from '../../context/UserSessionContext';
import { XPSelect } from '../../components/XPSelect';
import { WALLPAPERS, getWallpaperById } from '../../data/wallpapers';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 11px;
  color: #000;
`;

const GroupBox = styled.div`
  border: 1px solid #7f9db9;
  padding: 12px;
  background: #ffffff;
`;

const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #003c74;
`;

const Preview = styled.div<{ $bgUrl: string }>`
  width: 100%;
  height: 140px;
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

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  width: 100px;
  flex-shrink: 0;
  color: #000;
`;

const Select = styled(XPSelect)`
  flex: 1;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #d4d0c8;
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;

  &:hover {
    box-shadow: inset -1px 1px #fff0cf, inset 1px 2px #fdd889, inset -2px 2px #fbc761, inset 2px -2px #e5a01a;
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
  const { wallpaper, setWallpaper, screensaverEnabled, setScreensaverEnabled } = useUserSession();
  const [selectedWallpaper, setSelectedWallpaper] = useState(wallpaper);
  const [selectedResolution, setSelectedResolution] = useState('1024x768');
  const [selectedScreensaver, setSelectedScreensaver] = useState(screensaverEnabled ? 'logo' : 'none');

  const previewBg = getWallpaperById(selectedWallpaper).src;

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
          <Select
            value={selectedWallpaper}
            onChange={(e) => setSelectedWallpaper(e.target.value)}
          >
            {WALLPAPERS.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </Row>
        <Row>
          <Label>{t('controlPanel.displaySettings.resolution', 'Screen resolution:')}</Label>
          <Select
            value={selectedResolution}
            onChange={(e) => setSelectedResolution(e.target.value)}
          >
            {RESOLUTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Row>
        <Row>
          <Label>{t('controlPanel.displaySettings.screensaver', 'Screen saver:')}</Label>
          <Select
            value={selectedScreensaver}
            onChange={(e) => setSelectedScreensaver(e.target.value)}
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
