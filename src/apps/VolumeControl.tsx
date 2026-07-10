import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/soundManager';

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
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
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;

    &:hover {
      background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;
  }
`;

const VolumeLabel = styled.div`
  font-size: 11px;
  color: #666666;
  text-align: center;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 13px;
  height: 13px;
  cursor: pointer;
`;

const Label = styled.label`
  cursor: pointer;
`;

const VolumeControl = () => {
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
        <VolumeIcon><XPIcon name={getVolumeIcon()} size={24} /></VolumeIcon>
        <SliderContainer>
          <Slider
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
          />
          <VolumeLabel>{muted ? '静音' : `${volume}%`}</VolumeLabel>
        </SliderContainer>
      </VolumeContainer>
      <CheckboxContainer>
        <Checkbox type="checkbox" id="mute" checked={muted} onChange={handleMuteChange} />
        <Label htmlFor="mute">静音(&M)</Label>
      </CheckboxContainer>
    </Container>
  );
};

export default VolumeControl;
