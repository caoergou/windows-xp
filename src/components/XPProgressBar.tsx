import styled, { type DefaultTheme } from 'styled-components';
import { resolveOSTheme } from '../themes/useOSTheme';

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

const LUNA_FILL = ({ theme }: { theme: DefaultTheme }) =>
  `repeating-linear-gradient(90deg, ${resolveOSTheme(theme).tokens.WHITE} 0, ${resolveOSTheme(theme).tokens.WHITE} 2px, transparent 0, transparent 10px), ` +
  resolveOSTheme(theme).tokens.PROGRESS_FILL_GRADIENT;

const Track = styled.div`
  box-sizing: border-box;
  height: 14px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.PROGRESS_BORDER};
  border-radius: 4px;
  padding: 1px 2px 1px 0;
  overflow: hidden;
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  box-shadow: inset 0 0 1px 0 ${({ theme }) => resolveOSTheme(theme).tokens.PROGRESS_BORDER};
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
