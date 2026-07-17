import React from 'react';
import { useOSTheme } from '../themes/useOSTheme';

// Icon lookup is a pure name → URL resolution against the active theme's icon
// registry (#213): the binding table (and every asset import) lives in the
// theme package, so this component — and everything that says `icon: 'folder'`
// — never knows which OS look is installed.

interface XPIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const isUrl = (s: string) =>
  s.startsWith('/') || s.startsWith('http') || s.startsWith('data:') || s.startsWith('blob:');

const XPIcon = ({ name, size = 32, className, _color, style, ...rest }: XPIconProps) => {
  const { icons } = useOSTheme().assets;
  const iconSrc = isUrl(name) ? name : icons[name] || icons.file;

  return (
    <img
      src={iconSrc}
      alt={name}
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{
        imageRendering: size <= 16 ? 'auto' : undefined,
        ...style,
      }}
      {...rest}
    />
  );
};

export default XPIcon;
