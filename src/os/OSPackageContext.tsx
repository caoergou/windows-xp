import { createContext, useContext } from 'react';
import type { OSPackage } from './contract';

const OSPackageContext = createContext<OSPackage | null>(null);

export const OSPackageProvider = OSPackageContext.Provider;

export function useOSPackage(): OSPackage {
  const os = useContext(OSPackageContext);
  if (!os) throw new Error('useOSPackage must be used inside an OSPackageProvider.');
  return os;
}

export const useOptionalOSPackage = (): OSPackage | null => useContext(OSPackageContext);
