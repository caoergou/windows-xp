import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { XPCheckbox } from '../components/XPCheckbox';
import { xpTrackbarStyles } from '../theme';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/soundManager';

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeIcon = styled.div`
  font-size: 32px;
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

const VolumeControl = () => {
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

  const getVolumeIcon = () => {
    return muted || volume === 0 ? 'mute' : 'volume_status';
  };

  return (
    <Container>
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
          <VolumeLabel>{muted ? t('tray.mute') : `${volume}%`}</VolumeLabel>
        </SliderContainer>
      </VolumeContainer>
      <XPCheckbox
        id="mute"
        checked={muted}
        onChange={handleMuteChange}
        label={t('controlPanel.soundSettings.mute')}
      />
    </Container>
  );
};

export default VolumeControl;
