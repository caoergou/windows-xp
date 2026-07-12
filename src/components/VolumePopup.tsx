import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/soundManager';
import { XPCheckbox } from './XPCheckbox';
import { xpTrackbarStyles } from '../theme';
import { COLORS } from '../constants';

// Real XP's single-click tray popup: a narrow panel with a vertical volume
// slider and a Mute checkbox at the bottom.
const Popup = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  width: 72px;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.BUTTON_BORDER};
  box-shadow: 2px 2px 0 ${COLORS.BUTTON_SHADOW};
  padding: 8px 6px;
  z-index: 30000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: ${COLORS.BLACK};
`;

const Title = styled.div`
  text-align: center;
  line-height: 12px;
`;

// A vertical range slider: a horizontal xp trackbar rotated so the max end
// sits at the top, wrapped in a box that reserves the rotated footprint.
const SliderBox = styled.div`
  position: relative;
  width: 24px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Slider = styled.input`
  ${xpTrackbarStyles}
  width: 92px;
  transform: rotate(-90deg);
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
    // The popup is rendered as a child of the tray icon whose onClick toggles
    // it open/closed. Without this, a click on the slider or checkbox bubbles up
    // to that toggle and slams the popup shut on release (#223). Stop the click
    // here so only a genuine outside click (document mousedown) closes it.
    <Popup
      ref={popupRef}
      data-testid="volume-popup"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <Title>{t('tray.volume')}</Title>
      <SliderBox>
        <Slider
          data-testid="volume-popup-slider"
          type="range"
          min="0"
          max="100"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label={t('tray.volume')}
        />
      </SliderBox>
      <XPCheckbox checked={muted} onChange={handleMuteChange} label={t('tray.mute')} />
    </Popup>
  );
};

export default VolumePopup;
