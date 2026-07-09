import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/soundManager';

const Popup = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  width: 180px;
  background: #ece9d8;
  border: 1px solid #003c74;
  box-shadow: 2px 2px 0 #808080;
  padding: 10px;
  z-index: 30000;
  font-family: Tahoma, 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: #000;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  flex: 1;
  height: 6px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;
  }
`;

const MuteRow = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
`;

interface VolumePopupProps {
  onClose: () => void;
}

const VolumePopup: React.FC<VolumePopupProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);
  const [volume, setVolumeState] = React.useState<number>(getVolume());
  const [muted, setMutedState] = React.useState<boolean>(getMuted());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setVolumeState(value);
    setVolume(value);
    if (muted && value > 0) {
      setMutedState(false);
      setMuted(false);
    }
  };

  const handleMuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setMutedState(value);
    setMuted(value);
  };

  return (
    <Popup ref={popupRef} data-testid="volume-popup">
      <Row>
        <Slider
          type="range"
          min="0"
          max="100"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label={t('tray.volume')}
        />
        <span>{muted ? 0 : volume}%</span>
      </Row>
      <MuteRow>
        <input type="checkbox" checked={muted} onChange={handleMuteChange} />
        <span>{t('tray.mute')}</span>
      </MuteRow>
    </Popup>
  );
};

export default VolumePopup;
