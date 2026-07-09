import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const TurnOffOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 20000;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TurnOffDialogContainer = styled.div`
  width: 300px;
  background: #003399;
  border-radius: 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DialogHeader = styled.div`
  padding: 5px 10px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DialogBody = styled.div`
  background: linear-gradient(to bottom, #f0f0f0 0%, #dcdcdc 100%);
  padding: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const ActionButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;

  &:hover .icon-circle {
    filter: brightness(1.1);
  }

  &:active .icon-circle {
    filter: brightness(0.9);
  }

  .icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }

  .shutdown { background: #e04646; }
  .restart { background: #45b050; }
  .standby { background: #ebc644; }

  span {
    font-size: 11px;
    color: #333;
  }
`;

const DialogFooter = styled.div`
  background: #003399;
  padding: 5px 10px;
  display: flex;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 3px 10px;
  background: #f0f0f0;
  border: 1px solid #999;
  border-radius: 2px;
  cursor: pointer;
  font-size: 11px;

  &:hover {
    background: #e0e0e0;
  }
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
    <TurnOffOverlay>
      <TurnOffDialogContainer>
        <DialogHeader>
          <span>{title}</span>
          <XPIcon
            name="close"
            size={16}
            color="white"
            style={{ cursor: 'pointer' }}
            onClick={onCancel}
          />
        </DialogHeader>
        <DialogBody>
          <ActionButton className="disabled" style={{ opacity: 0.5 }}>
            <div className="icon-circle standby">
              <XPIcon name="clock" size={16} color="white" />
            </div>
            <span>{standbyLabel}</span>
          </ActionButton>
          <ActionButton onClick={onShutdown}>
            <div className="icon-circle shutdown">
              <XPIcon name="shutdown" size={16} color="white" />
            </div>
            <span>{turnOffLabel}</span>
          </ActionButton>
          <ActionButton onClick={onRestart}>
            <div className="icon-circle restart">
              <XPIcon name="refresh" size={16} color="white" />
            </div>
            <span>{restartLabel}</span>
          </ActionButton>
        </DialogBody>
        <DialogFooter>
          <CancelButton onClick={onCancel}>{cancelLabel}</CancelButton>
        </DialogFooter>
      </TurnOffDialogContainer>
    </TurnOffOverlay>
  );
};

export default TurnOffDialog;
