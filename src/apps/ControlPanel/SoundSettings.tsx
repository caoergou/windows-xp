import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../components/XPIcon';
import { XPCheckbox } from '../../components/XPCheckbox';
import { xpTrackbarStyles } from '../../theme';
import { getVolume, setVolume, getMuted, setMuted, sounds } from '../../utils/soundManager';
import { COLORS, FONTS } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: ${FONTS.UI};
  font-size: 11px;
  color: ${COLORS.BLACK};
`;

const GroupBox = styled.div`
  border: 1px solid ${COLORS.FIELD_BORDER};
  padding: 12px;
  background: ${COLORS.WHITE};
`;

const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: ${COLORS.BUTTON_BORDER};
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeIcon = styled.div`
  font-size: 24px;
  color: ${COLORS.BLACK};
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
  color: ${COLORS.GREY_66};
  text-align: center;
`;

const CheckboxContainer = styled.div`
  margin-top: 8px;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${COLORS.FIELD_BORDER};
  background: ${COLORS.WHITE};
  max-height: 140px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid ${COLORS.GREY_F0};
  cursor: default;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${COLORS.PANEL_TINT_BLUE};
  }
`;

const EventName = styled.div`
  flex: 1;
`;

const PlayButton = styled.button`
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid ${COLORS.BUTTON_BORDER};
  background: ${COLORS.BUTTON_GRADIENT};
  cursor: pointer;
  font-family: ${FONTS.UI};

  &:hover {
    box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid ${COLORS.SURFACE};
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid ${COLORS.BUTTON_BORDER};
  background: ${COLORS.BUTTON_GRADIENT};
  cursor: pointer;
  font-family: ${FONTS.UI};

  &:hover {
    box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
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
