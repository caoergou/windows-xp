import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../components/XPIcon';
import { XPCheckbox } from '../../components/XPCheckbox';
import { xpTrackbarStyles } from '../../theme';
import { getVolume, setVolume, getMuted, setMuted, sounds } from '../../utils/soundManager';
import { FONTS } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: ${FONTS.UI};
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

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeIcon = styled.div`
  font-size: 24px;
  color: #000000;
`;

const SliderContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Slider = styled.input`
  width: 100%;
  ${xpTrackbarStyles}
`;

const VolumeLabel = styled.div`
  font-size: 11px;
  color: #666666;
  text-align: center;
`;

const CheckboxContainer = styled.div`
  margin-top: 8px;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #7f9db9;
  background: #ffffff;
  max-height: 140px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: default;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #e8f4ff;
  }
`;

const EventName = styled.div`
  flex: 1;
`;

const PlayButton = styled.button`
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: ${FONTS.UI};

  &:hover {
    box-shadow:
      inset -1px 1px #fff0cf,
      inset 1px 2px #fdd889,
      inset -2px 2px #fbc761,
      inset 2px -2px #e5a01a;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #ece9d8;
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: ${FONTS.UI};

  &:hover {
    box-shadow:
      inset -1px 1px #fff0cf,
      inset 1px 2px #fdd889,
      inset -2px 2px #fbc761,
      inset 2px -2px #e5a01a;
  }
`;

interface SoundSettingsProps {
  onBack: () => void;
}

const SOUND_EVENTS: { key: keyof typeof sounds; i18nKey: string }[] = [
  { key: 'startup', i18nKey: 'startup' },
  { key: 'shutdown', i18nKey: 'shutdown' },
  { key: 'error', i18nKey: 'error' },
  { key: 'ding', i18nKey: 'ding' },
  { key: 'exclamation', i18nKey: 'exclamation' },
  { key: 'notify', i18nKey: 'notify' },
  { key: 'menuCommand', i18nKey: 'menuCommand' },
  { key: 'minimize', i18nKey: 'minimize' },
  { key: 'restore', i18nKey: 'restore' },
  { key: 'recycle', i18nKey: 'recycle' },
];

const SoundSettings: React.FC<SoundSettingsProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [volume, setVolumeState] = useState<number>(getVolume());
  const [muted, setMutedState] = useState<boolean>(getMuted());

  useEffect(() => {
    setVolume(volume);
  }, [volume]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolumeState(parseInt(e.target.value));
  };

  const handleMuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMutedState(e.target.checked);
  };

  const handlePlay = (name: keyof typeof sounds) => {
    const sound = sounds[name];
    if (sound) {
      sound();
    }
  };

  const getVolumeIcon = () => {
    return muted || volume === 0 ? 'mute' : 'volume_status';
  };

  return (
    <Container>
      <GroupBox>
        <GroupTitle>{t('controlPanel.soundSettings.volume', 'Device volume')}</GroupTitle>
        <VolumeContainer>
          <VolumeIcon>
            <XPIcon name={getVolumeIcon()} size={24} />
          </VolumeIcon>
          <SliderContainer>
            <Slider
              type="range"
              min="0"
              max="100"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
            />
            <VolumeLabel>{muted ? t('tray.mute', 'Mute') : `${volume}%`}</VolumeLabel>
          </SliderContainer>
        </VolumeContainer>
        <CheckboxContainer>
          <XPCheckbox
            id="cp-mute"
            checked={muted}
            onChange={handleMuteChange}
            label={t('controlPanel.soundSettings.mute', 'Mute(M)')}
          />
        </CheckboxContainer>
      </GroupBox>
      <GroupBox>
        <GroupTitle>{t('controlPanel.soundSettings.programEvents', 'Program events:')}</GroupTitle>
        <EventList>
          {SOUND_EVENTS.map(event => (
            <EventItem key={event.key}>
              <EventName>{t(`controlPanel.soundSettings.events.${event.i18nKey}`)}</EventName>
              <PlayButton onClick={() => handlePlay(event.key)}>
                {t('controlPanel.soundSettings.play', 'Play')}
              </PlayButton>
            </EventItem>
          ))}
        </EventList>
      </GroupBox>
      <ButtonRow>
        <Button onClick={onBack}>{t('controlPanel.ok', 'OK')}</Button>
        <Button onClick={onBack}>{t('controlPanel.cancel', 'Cancel')}</Button>
      </ButtonRow>
    </Container>
  );
};

export default SoundSettings;
