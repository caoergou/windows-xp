import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: Tahoma, Arial, sans-serif;
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
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    border-radius: 50%;
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
    border-radius: 50%;
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
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
  };

  const handleMuteChange = (e) => {
    setMuted(e.target.checked);
  };

  const getVolumeIcon = () => {
    if (muted || volume === 0) {
      return '🔇';
    } else if (volume < 50) {
      return '🔉';
    } else {
      return '🔊';
    }
  };

  return (
    <Container>
      <VolumeContainer>
        <VolumeIcon>{getVolumeIcon()}</VolumeIcon>
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
        <Checkbox
          type="checkbox"
          id="mute"
          checked={muted}
          onChange={handleMuteChange}
        />
        <Label htmlFor="mute">静音(&M)</Label>
      </CheckboxContainer>
    </Container>
  );
};

export default VolumeControl;
