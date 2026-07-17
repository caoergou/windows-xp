import React from 'react';
import styled from 'styled-components';
import shutdownIcon from '../../assets/icons/xp/shutdown_action.png';
import restartIcon from '../../assets/icons/xp/restart.png';
import windowsFlag from '../../assets/windowsIcons/windows-off.png';
import { COLORS } from '../../themes/xp/tokens';
import { XPButton } from '../XPButton';
import { FONTS } from '../../constants';

const TurnOffOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${COLORS.SHUTDOWN_OVERLAY};
  backdrop-filter: grayscale(100%) brightness(68%);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const TurnOffPanel = styled.div`
  box-sizing: border-box;
  width: min(314px, calc(100% - 24px));
  height: 200px;
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  background: ${COLORS.SHUTDOWN_PANEL_DARK};
  transform: translateY(-66px);
`;

const Header = styled.div`
  box-sizing: border-box;
  height: 45px;
  flex: 0 0 45px;
  padding: 0 9px 0 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${COLORS.SHUTDOWN_PANEL_DARK};
  box-shadow: inset 0 -2px ${COLORS.SHUTDOWN_PANEL_EDGE};
  color: white;
  font-family: ${FONTS.UI};

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 400;
    letter-spacing: 0;
  }
`;

const WindowsFlag = styled.img`
  width: 38px;
  height: 38px;
  object-fit: contain;
  image-rendering: auto;
`;

const Actions = styled.div`
  box-sizing: border-box;
  height: 110px;
  flex: 0 0 110px;
  display: flex;
  gap: 28px;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-top: 3px;
  background: ${COLORS.SHUTDOWN_PANEL_BODY};
`;

const ActionButton = styled.button`
  box-sizing: border-box;
  width: 58px;
  min-width: 58px;
  height: 66px;
  padding: 0;
  border: 0 !important;
  outline: none !important;
  background: transparent !important;
  box-shadow: none !important;
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  color: white;
  font-family: ${FONTS.UI};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-shadow: 1px 1px ${COLORS.SHUTDOWN_PANEL_DARK};
  cursor: pointer;

  &:hover:not(:disabled) [data-testid='turn-off-action-icon'] {
    filter: brightness(1.08);
  }

  &:active:not(:disabled) [data-testid='turn-off-action-icon'] {
    filter: brightness(0.92);
  }

  &:focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }

  &:focus-visible span {
    outline: 1px dotted white;
    outline-offset: 1px;
  }

  img {
    width: 32px;
    height: 32px;
    image-rendering: auto;
  }

  &:disabled {
    cursor: default;
  }
`;

const ActionIcon = styled.img`
  display: block;
`;

const StandbyIcon = styled.span`
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 32px;
  height: 32px;
  border: 1px solid ${COLORS.SHUTDOWN_STANDBY_BORDER};
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    ${COLORS.SHUTDOWN_STANDBY_TOP} 0%,
    ${COLORS.SHUTDOWN_STANDBY_BOTTOM} 100%
  );
  box-shadow:
    inset 1px 1px white,
    inset -1px -1px ${COLORS.SHUTDOWN_STANDBY_BORDER};

  &::before {
    content: '';
    position: absolute;
    box-sizing: border-box;
    left: 8px;
    top: 8px;
    width: 14px;
    height: 14px;
    border: 2px solid white;
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    top: 5px;
    width: 3px;
    height: 11px;
    border: 2px solid ${COLORS.SHUTDOWN_STANDBY_TOP};
    border-width: 0 2px;
    background: white;
  }
`;

const Footer = styled.div`
  box-sizing: border-box;
  height: 43px;
  flex: 0 0 43px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: ${COLORS.SHUTDOWN_PANEL_DARK};
`;

const CancelButton = styled(XPButton)`
  min-width: 58px;
  width: 58px;
  min-height: 21px;
  height: 21px;
  padding: 0 6px;
`;

interface TurnOffDialogProps {
  visible: boolean;
  title: string;
  standbyLabel: string;
  turnOffLabel: string;
  restartLabel: string;
  cancelLabel: string;
  onShutdown: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

const TurnOffDialog: React.FC<TurnOffDialogProps> = ({
  visible,
  title,
  standbyLabel,
  turnOffLabel,
  restartLabel,
  cancelLabel,
  onShutdown,
  onRestart,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <TurnOffOverlay data-testid="turn-off-dialog">
      <TurnOffPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="turn-off-title"
        data-testid="turn-off-panel"
      >
        <Header data-testid="turn-off-header">
          <h2 id="turn-off-title">{title}</h2>
          <WindowsFlag src={windowsFlag} alt="" aria-hidden="true" />
        </Header>
        <Actions data-testid="turn-off-actions">
          <ActionButton type="button" disabled aria-label={standbyLabel}>
            <StandbyIcon data-testid="turn-off-action-icon" aria-hidden="true" />
            <span>{standbyLabel}</span>
          </ActionButton>
          <ActionButton type="button" onClick={onShutdown} aria-label={turnOffLabel}>
            <ActionIcon data-testid="turn-off-action-icon" src={shutdownIcon} alt="" />
            <span>{turnOffLabel}</span>
          </ActionButton>
          <ActionButton type="button" onClick={onRestart} aria-label={restartLabel}>
            <ActionIcon data-testid="turn-off-action-icon" src={restartIcon} alt="" />
            <span>{restartLabel}</span>
          </ActionButton>
        </Actions>
        <Footer data-testid="turn-off-footer">
          <CancelButton onClick={onCancel}>{cancelLabel}</CancelButton>
        </Footer>
      </TurnOffPanel>
    </TurnOffOverlay>
  );
};

export default TurnOffDialog;
