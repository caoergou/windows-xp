import styled from 'styled-components';
import { COLORS } from '../constants';

/**
 * Canonical XP progress bar (#99 / #78), value-for-value from xp.css's
 * `progress` element: a white rounded trough (1px `#686868`, radius 4px,
 * 14px tall) filled with the classic Luna green — a vertical green gradient
 * overlaid with repeating white segments (the "marching blocks" look).
 *
 * Custom progress bars scattered in the app (SafeGuard360's rounded diagonal
 * stripes, Thunder's blue/green gradient) diverged from this; this is the one
 * XP-faithful bar.
 */

const LUNA_FILL =
  `repeating-linear-gradient(90deg, ${COLORS.WHITE} 0, ${COLORS.WHITE} 2px, transparent 0, transparent 10px), ` +
  `linear-gradient(180deg, #acedad 0, #7be47d 14%, #4cda50 28%, #2ed330 42%, #42d845 57%, #76e275 71%, #8fe791 85%, ${COLORS.WHITE})`;

const Track = styled.div`
  box-sizing: border-box;
  height: 14px;
  border: 1px solid #686868;
  border-radius: 4px;
  padding: 1px 2px 1px 0;
  overflow: hidden;
  background-color: ${COLORS.WHITE};
  box-shadow: inset 0 0 1px 0 #686868;
`;

const Fill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  border-radius: 2px;
  background: ${LUNA_FILL};
  transition: width 0.15s linear;
`;

export interface XPProgressBarProps {
  /** Current progress. */
  value?: number;
  /** Maximum value (default 100). */
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  value = 0,
  max = 100,
  className,
  style,
}) => {
  const ratio = max > 0 ? value / max : 0;
  return (
    <Track
      className={className}
      style={style}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <Fill $ratio={ratio} />
    </Track>
  );
};
