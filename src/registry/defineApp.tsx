import React from 'react';
import type { AppRegistryEntry, AppAssociation, AppLifecycle, JsonValue } from '../types';

/**
 * App authoring factory (#128).
 *
 * `defineApp()` turns a component into a fully-formed {@link AppRegistryEntry}
 * with sensible defaults, so a custom app is one typed call instead of a
 * hand-written object literal against several unwritten rules.
 */

/**
 * Props an app receives on restore. They are persisted to storage to rebuild
 * the window after a refresh, so they MUST be JSON-serializable — the
 * `JsonValue` constraint makes a non-serializable prop (function, element,
 * class instance) a COMPILE-TIME error instead of a silent refresh bug.
 */
export type SerializableProps = Record<string, JsonValue>;

/** Window sizing/behavior for a registered app. */
export interface AppWindowConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  /** Initial position; omit to center. */
  left?: number;
  top?: number;
  /** Only one instance may be open at a time. Default false. */
  singleton?: boolean;
  isMaximized?: boolean;
  resizable?: boolean;
}

export interface DefineAppConfig<TProps extends SerializableProps> {
  /** Unique app id (used to open the app and match filesystem `.app` fields). */
  id: string;
  /** Fallback display name; prefer `nameKey` for i18n. */
  name: string;
  /** i18n key for the window title; falls back to `name`. */
  nameKey?: string;
  /** `XPIcon` id. Defaults to `'app_window'`. */
  icon?: string;
  /** Restrict to culture ids (e.g. `['zh']`); omit for all cultures. */
  locales?: string[];
  /** Window size/behavior. Defaults to 400×300, non-singleton, resizable. */
  window?: AppWindowConfig;
  /** Open/close/focus callbacks (runtime only — never persisted). */
  lifecycle?: AppLifecycle;
  /** Make the app openable from a filesystem node whose `.app` equals `appField`. */
  associations?: AppAssociation[];
  /**
   * The app component. It may also receive an injected `windowId`. Its own
   * props (`TProps`) must be JSON-serializable (see {@link SerializableProps}).
   */
  component: React.ComponentType<TProps & { windowId?: string }>;
}

const DEFAULT_WINDOW: AppWindowConfig = { width: 400, height: 300 };

const IS_DEV = import.meta.env?.DEV ?? true;

/**
 * Wrap a component so the registry can restore it from persisted (`unknown`)
 * props. Exported for authors who build an {@link AppRegistryEntry} by hand and
 * want the same `unknown → props` cast the built-ins use.
 */
export const restoreApp = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
) => {
  const RestoredApp = (props: unknown) => {
    if (!Component) {
      return (
        <div style={{ padding: 20, fontFamily: 'Tahoma, sans-serif' }}>
          Unable to restore app component.
        </div>
      );
    }
    return <Component {...(props as P)} />;
  };
  RestoredApp.displayName = `Restored(${Component?.displayName || Component?.name || 'Unknown'})`;
  return RestoredApp;
};

/**
 * Define a desktop application in one typed call.
 *
 * @example
 * ```tsx
 * const HelloApp = defineApp({
 *   id: 'Hello',
 *   name: 'Hello',
 *   component: () => <div>Hello from Windows XP!</div>,
 * });
 * // <WindowsXP apps={[HelloApp]} />
 * ```
 */
export function defineApp<TProps extends SerializableProps = Record<string, never>>(
  config: DefineAppConfig<TProps>
): AppRegistryEntry<TProps> {
  if (IS_DEV) {
    if (!config.id) console.warn('[windows-xp] defineApp: `id` is required.');
    if (!config.name) console.warn(`[windows-xp] defineApp("${config.id}"): \`name\` is required.`);
    const fields = new Set<string>();
    for (const assoc of config.associations ?? []) {
      if (fields.has(assoc.appField)) {
        console.warn(
          `[windows-xp] defineApp("${config.id}"): duplicate association appField "${assoc.appField}".`
        );
      }
      fields.add(assoc.appField);
    }
  }

  const Component = config.component;

  return {
    id: config.id,
    name: config.name,
    nameKey: config.nameKey,
    icon: config.icon ?? 'app_window',
    locales: config.locales,
    window: { ...DEFAULT_WINDOW, ...config.window },
    lifecycle: config.lifecycle,
    associations: config.associations,
    restore: restoreApp(Component as React.ComponentType<Record<string, unknown>>),
  };
}
