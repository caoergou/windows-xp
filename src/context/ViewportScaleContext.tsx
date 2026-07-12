import React, { createContext, useContext } from 'react';

/**
 * The active viewport scale (#215), so components under a scaled stage — most
 * importantly the draggable windows — can compensate. `react-draggable` needs
 * the `scale` factor to translate pointer deltas 1:1 under a CSS transform.
 * Engine-pure: a bare number, no styling.
 */
const ViewportScaleContext = createContext<number>(1);

export const ViewportScaleProvider: React.FC<{ scale: number; children: React.ReactNode }> = ({
  scale,
  children,
}) => <ViewportScaleContext.Provider value={scale}>{children}</ViewportScaleContext.Provider>;

/** The active stage scale (1 when the shell renders natively). */
export const useViewportScaleValue = (): number => useContext(ViewportScaleContext);
