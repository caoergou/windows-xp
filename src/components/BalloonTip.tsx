import React from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';

/**
 * BalloonTip — the classic Windows XP tray notification bubble (#118).
 *
 * A presentational primitive (no providers required): light-yellow rounded
 * bubble with a diamond tail, a bold title, body text, and a close box. It is
 * `position: relative` by default so it flows in normal layout (gallery, docs);
 * the tray notification host (`TrayProvider`) wraps it in a fixed-position
 * container anchored above the taskbar. Exported from `/components`.
 *
 * For the driven, queued experience (auto-fade, notify sound, events) use
 * `useTray().notify(...)` instead of rendering this directly.
 */
export interface BalloonTipProps {
  /** Bold heading line (XP blue). */
  title: React.ReactNode;
  /** Body text; `children` is used when `body` is omitted. */
  body?: React.ReactNode;
  children?: React.ReactNode;
  /** XPIcon key shown at 32px on the left; omit for a text-only balloon. */
  icon?: string;
  /** Close-box handler. When omitted, the close box is hidden. */
  onClose?: () => void;
  /** Click handler for the bubble body (excludes the close box). */
  onClick?: () => void;
  /** Distance in px from the right edge to the tail (anchors it to a tray icon). */
  tailOffset?: number;
  /** Whether to draw the downward diamond tail. Default true. */
  showTail?: boolean;
  /** Accessible label for the close box. Default "Close". */
  closeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Bubble = styled.div<{ $tailOffset: number; $showTail: boolean; $clickable: boolean }>`
  position: relative;
  width: 242px;
  min-height: 50px;
  box-sizing: border-box;
  background: #ffffe1;
  border: 1px solid #7f9db9;
  border-radius: 2px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
  padding: 7px 24px 7px 8px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: ${props => (props.$clickable ? 'pointer' : 'default')};

  ${props =>
    props.$showTail &&
    `
  &::after {
    content: '';
    position: absolute;
    right: ${props.$tailOffset}px;
    bottom: -8px;
    width: 12px;
    height: 12px;
    background: #ffffe1;
    border-right: 1px solid #7f9db9;
    border-bottom: 1px solid #7f9db9;
    transform: rotate(45deg);
  }
  `}
`;

const IconSlot = styled.div`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  flex: 1;
  line-height: 1.4;
  min-width: 0;
`;

const TitleLine = styled.div`
  font-weight: bold;
  margin-bottom: 2px;
  color: #003399;
`;

const BodyLine = styled.div`
  font-size: 11px;
  color: #333;
`;

const CloseBox = styled.button`
  position: absolute;
  top: 3px;
  right: 4px;
  width: 15px;
  height: 15px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  line-height: 12px;
  cursor: pointer;
  color: #404040;

  &:hover {
    background: #e5e5c5;
    border-color: #aca899;
  }
`;

export const BalloonTip: React.FC<BalloonTipProps> = ({
  title,
  body,
  children,
  icon,
  onClose,
  onClick,
  tailOffset = 29,
  showTail = true,
  closeLabel = 'Close',
  className,
  style,
}) => {
  const content = body ?? children;
  return (
    <Bubble
      className={className}
      style={style}
      role="alert"
      aria-live="polite"
      $tailOffset={tailOffset}
      $showTail={showTail}
      $clickable={!!onClick}
      onClick={onClick}
    >
      {icon && (
        <IconSlot>
          <XPIcon name={icon} size={32} />
        </IconSlot>
      )}
      <Message>
        <TitleLine>{title}</TitleLine>
        {content != null && <BodyLine>{content}</BodyLine>}
      </Message>
      {onClose && (
        <CloseBox
          type="button"
          aria-label={closeLabel}
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </CloseBox>
      )}
    </Bubble>
  );
};

export default BalloonTip;
