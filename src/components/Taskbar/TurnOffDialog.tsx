import React from 'react';
import styled from 'styled-components';
import standbyIcon from '../../assets/icons/xp/standby.png';
import shutdownIcon from '../../assets/icons/xp/shutdown_action.png';
import restartIcon from '../../assets/icons/xp/restart.png';

const TurnOffOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #0058e6 0%, #003399 100%);
  z-index: 20000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const TurnOffContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 48px;
  max-width: 640px;
  width: 90%;
`;

const Header = styled.div`
  color: white;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: normal;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 72px;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
`;

const ActionButton = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.$disabled ? 0.5 : 1)};
  gap: 12px;

  &:hover .action-icon {
    filter: ${props => (props.$disabled ? 'none' : 'brightness(1.1)')};
  }

  &:active .action-icon {
    filter: ${props => (props.$disabled ? 'none' : 'brightness(0.95)')};
  }

  .action-icon {
    width: 64px;
    height: 64px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* Authentic XP shutdown-dialog button look: subtle raised border */
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 4px 12px rgba(0, 0, 0, 0.35);
  }

  img {
    width: 48px;
    height: 48px;
    image-rendering: auto;
  }

  span {
    font-size: 14px;
    color: white;
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  }
`;

const CancelButton = styled.button`
  position: absolute;
  bottom: 40px;
  right: 40px;
  padding: 4px 24px;
  font-size: 12px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  background: #f0f0f0;
  border: 1px solid #999;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }

  &:active {
    background: #d0d0d0;
  }
`;

interface TurnOffDialogProps {
  visible: boolean;
  title: string;
  message: string;
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
  message,
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
      <TurnOffContent>
        <Header>
          <h2>{title}</h2>
          <p>{message}</p>
        </Header>
        <Actions>
          <ActionButton $disabled>
            <div className="action-icon">
              <img src={standbyIcon} alt={standbyLabel} />
            </div>
            <span>{standbyLabel}</span>
          </ActionButton>
          <ActionButton onClick={onShutdown}>
            <div className="action-icon">
              <img src={shutdownIcon} alt={turnOffLabel} />
            </div>
            <span>{turnOffLabel}</span>
          </ActionButton>
          <ActionButton onClick={onRestart}>
            <div className="action-icon">
              <img src={restartIcon} alt={restartLabel} />
            </div>
            <span>{restartLabel}</span>
          </ActionButton>
        </Actions>
      </TurnOffContent>
      <CancelButton onClick={onCancel}>{cancelLabel}</CancelButton>
    </TurnOffOverlay>
  );
};

export default TurnOffDialog;
