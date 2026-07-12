/**
 * Application registry for extending the Windows XP desktop.
 *
 * Use `defineApp()` to author a custom app in one typed call, or the lower-level
 * helpers to register/inspect the default registry.
 */

export { defineApp, restoreApp } from '../registry/defineApp';
export type { DefineAppConfig, AppWindowConfig, SerializableProps } from '../registry/defineApp';
export { APP_REGISTRY, getAppDisplayName, resolveFileOpen } from '../registry/apps';
export type { AppRegistryEntry, AppAssociation, AppLifecycle } from '../types';
