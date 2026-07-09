import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

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
  align-items: center;
  gap: 40px;
  max-width: 640px;
  width: 90%;
`;

const Header = styled.div`
  align-self: flex-start;
  color: white;
  font-family: Tahoma, 'Microsoft YaHei', sans-serif;

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
  gap: 60px;
  justify-content: center;
  align-items: flex-start;
`;

const ActionButton = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.$disabled ? 0.5 : 1)};
  gap: 10px;

  &:hover .action-icon {
    filter: ${props => (props.$disabled ? 'none' : 'brightness(1.15)')};
  }

  &:active .action-icon {
    filter: ${props => (props.$disabled ? 'none' : 'brightness(0.9)')};
  }

  .action-icon {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3), 2px 2px 8px rgba(0, 0, 0, 0.4);
  }

  .standby { background: #ebc644; }
  .shutdown { background: #e04646; }
  .restart { background: #45b050; }

  span {
    font-size: 14px;
    color: white;
    font-family: Tahoma, 'Microsoft YaHei', sans-serif;
  }
`;

const CancelButton = styled.button`
  position: absolute;
  bottom: 40px;
  right: 40px;
  padding: 4px 24px;
  font-size: 12px;
  font-family: Tahoma, 'Microsoft YaHei', sans-serif;
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
            <div className="action-icon standby">
              <XPIcon name="clock" size={32} color="white" />
            </div>
            <span>{standbyLabel}</span>
          </ActionButton>
          <ActionButton onClick={onShutdown}>
            <div className="action-icon shutdown">
              <XPIcon name="shutdown" size={32} color="white" />
            </div>
            <span>{turnOffLabel}</span>
          </ActionButton>
          <ActionButton onClick={onRestart}>
            <div className="action-icon restart">
              <XPIcon name="refresh" size={32} color="white" />
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
