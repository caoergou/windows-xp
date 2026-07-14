import { APP_REGISTRY } from '../registry/apps';
import { AppRegistryEntry } from '../types';

/**
 * Restore window components from localStorage.
 *
 * The persisted window list has a version number (see windowPersistence.ts); after a version upgrade,
 * old-format data is discarded, so every record pending restore must carry a real registry appId.
 * Restoration follows only two paths: exact registry match, and FileProperties' dynamic properties-* id.
 */
export const restoreComponent = (
  appId: string,
  componentProps: Record<string, unknown> = {},
  registry: Record<string, AppRegistryEntry> = APP_REGISTRY
): React.ReactNode => {
  // 1. Exact registry match
  const def = registry[appId];
  if (def?.restore) {
    return def.restore(componentProps);
  }

  // 2. FileProperties dynamic appId (like 'properties-xxx')
  if (appId?.startsWith('properties-')) {
    return registry.FileProperties?.restore(componentProps) ?? null;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
