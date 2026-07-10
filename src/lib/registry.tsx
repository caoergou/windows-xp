/**
 * Application registry for extending the Windows XP desktop.
 *
 * Use these helpers to register custom apps or to inspect the default registry.
 */

export { APP_REGISTRY, getAppDisplayName, resolveFileOpen } from '../registry/apps';
export type { AppRegistryEntry, AppAssociation, AppLifecycle } from '../types';
