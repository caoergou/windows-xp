import type { ContentRef } from '../content/types';
import type { AppMenu, AppRole } from '../os/contract';

// ============================================================
// Common types
// ============================================================

/**
 * Any JSON-serializable value.
 *
 * A window's `componentProps` are written to localStorage to rebuild the window
 * after a refresh, so a custom app's restore props must be JSON-serializable
 * (no functions, DOM nodes, or class instances). Constraining an app's props
 * type with this catches "restoration fails after refresh" bugs at compile time.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// ============================================================
// Filesystem type definitions
// ============================================================

/** Photo EXIF metadata (used for the "Summary" tab of the Properties dialog) */
export interface ExifData {
  Model?: string;
  Make?: string;
  FNumber?: number;
  ExposureTime?: number;
  ISOSpeedRatings?: number;
  FocalLength?: number;
  DateTimeOriginal?: string;
}

/** Base file node - common properties of all file types */
export type FileProvenance = 'authored' | 'local' | 'imported' | 'cache';

export interface BaseFileNode {
  name: string;
  icon?: string;
  /** Derived desktop entry owned by the active culture profile. */
  managedByCulture?: boolean;
  cultureId?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  hint?: string;
  /**
   * XP "Hidden" attribute (#219). Filtered out of Explorer unless the user turns
   * on "show hidden files"; shown ghosted (dimmed) when revealed. Lets a scenario
   * hide a clue the player must go looking for.
   */
  hidden?: boolean;
  /**
   * Protected/system file (#219). The in-fiction UI refuses to delete or rename
   * it (a "you can't just trash this" beat); the host's imperative `fs.*` API is
   * unaffected.
   */
  protected?: boolean;
  /**
   * Last-modified timestamp, ISO 8601 (#219). Surfaces in the Details "Date
   * Modified" column (and its sort) and the Properties dialog; absent falls back
   * to the stable XP-era date.
   */
  mtime?: string;
  /** Creation, last-access and import timestamps used by forensic content (#282). */
  ctime?: string;
  atime?: string;
  importedAt?: string;
  provenance?: FileProvenance;
  /** Path pointing to an EXIF JSON file (under src/data/photos) */
  exifPath?: string;
  /** Directly embedded EXIF data */
  exifData?: ExifData;
}

/** Root directory node */
export interface RootNode extends BaseFileNode {
  type: 'root';
  children: Record<string, FileNode>;
}

/** Folder node */
export interface FolderNode extends BaseFileNode {
  type: 'folder';
  children: Record<string, FileNode>;
}

/** Drive node */
export interface DriveNode extends BaseFileNode {
  type: 'drive';
  children: Record<string, FileNode>;
}

/** Regular file node */
export interface FileContentNode extends BaseFileNode {
  type: 'file';
  content?: string;
  /**
   * A reference to the file's body (#241) — a host asset URL or a content-pack
   * asset key — for content too large to inline (a fake webpage, a long letter,
   * media). Mutually exclusive with `content`: `content` is the inline fast
   * path, `contentRef` moves the body out of the scenario JSON. Resolved lazily
   * via the content resolver (`src/content/resolver.ts`); prefer `content` for
   * short bodies. See {@link ContentRef}.
   */
  contentRef?: ContentRef;
  app?: string;
  readOnly?: boolean;
  description?: string;
}

/** Application shortcut node */
export interface AppShortcutNode extends BaseFileNode {
  type: 'app_shortcut';
  app: string;
  url?: string;
  isHtmlContent?: boolean;
}

/**
 * External link node (#136) - a desktop/Explorer shortcut that leaves the fiction.
 * Opening it navigates to href (a real URL) instead of a desktop window, and
 * emits link:external. newTab defaults to true (open in a new tab).
 */
export interface ExternalLinkNode extends BaseFileNode {
  type: 'external_link';
  href: string;
  newTab?: boolean;
}

/** Union type - all possible file nodes */
export type FileNode =
  | RootNode
  | FolderNode
  | DriveNode
  | FileContentNode
  | AppShortcutNode
  | ExternalLinkNode;

/** Type guard - determines whether a node can contain children */
export function isContainerNode(node: FileNode): node is RootNode | FolderNode | DriveNode {
  return 'children' in node;
}

/** Type guard - determines whether a node is a file node */
export function isFileContentNode(node: FileNode): node is FileContentNode {
  return node.type === 'file';
}

/** Type guard - determines whether a node is an application shortcut node */
export function isAppShortcutNode(node: FileNode): node is AppShortcutNode {
  return node.type === 'app_shortcut';
}

/** Type guard - determines whether a node is an external link node (#136) */
export function isExternalLinkNode(node: FileNode): node is ExternalLinkNode {
  return node.type === 'external_link';
}

// ============================================================
// Filesystem-related types
// ============================================================

/** File properties (used for the Properties dialog) */
export interface FileProperties {
  name: string;
  type: string;
  size: string;
  icon?: string;
  created: string | null;
  modified: string | null;
  accessed: string | null;
  locked: boolean;
  broken: boolean;
  hidden: boolean;
  readOnly: boolean;
}

/** Search result item */
export interface SearchResult {
  path: string[];
  name: string;
  type: string;
  icon?: string;
}

// ============================================================
// Window management types
// ============================================================

/** Window state */
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  component: React.ReactNode;
  componentProps?: Record<string, unknown>;
  icon?: string;
  props: WindowProps;
  isMinimized: boolean;
  isMaximized: boolean;
  isHidden?: boolean;
  zIndex: number;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  badge?: string | number | null;
  progress?: number | null;
  isFlashing?: boolean;
  /** Ephemeral shell transition; omitted from persisted window snapshots. */
  transition?: 'minimize' | 'restore' | 'maximize' | 'unmaximize';
  /** Task-button geometry captured when a minimize/restore transition starts. */
  transitionTarget?: { left: number; top: number; width: number; height: number };
  /** Ephemeral application-start marker used by the shell busy pointer. */
  isOpening?: boolean;
  /** Ephemeral keyboard operation entered from the Alt+Space system menu. */
  interactionMode?: 'move' | 'size' | 'size-ns' | 'size-ew';
  onOpen?: (id: string) => void;
  onClose?: ((id: string) => void) | null;
  onFocus?: ((id: string) => void) | null;
  closeGuard?: ((forceClose: () => void) => void) | null;
  minimizeGuard?: ((defaultMinimize: () => void) => void) | null;
}

/** Window configuration properties */
export interface WindowProps {
  singleton?: boolean;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  left?: number;
  top?: number;
  isMaximized?: boolean;
  resizable?: boolean;
  onOpen?: ((id: string) => void) | null;
  onClose?: ((id: string) => void) | null;
  onFocus?: ((id: string) => void) | null;
  closeGuard?: ((forceClose: () => void) => void) | null;
  minimizeGuard?: ((defaultMinimize: () => void) => void) | null;
  /**
   * Render without the OS window chrome (title bar / frame / background). The
   * app draws its own skin; an element with class `title-bar` inside its
   * content still acts as the drag handle. For self-skinned apps (QQ2006 main
   * panel / chat window). Serializable so it survives refresh recovery.
   */
  frameless?: boolean;
  /**
   * Absolute filesystem path this window was opened from (#136). Set when a
   * window is opened by path (deep link / openFile / a file double-click) so
   * `XPHandle.getShareUrl` can reproduce it; absent for component-only windows.
   */
  sourcePath?: string[];
  [key: string]: unknown;
}

// ============================================================
// Application registry types
// ============================================================

/** App lifecycle callbacks. Runtime-only — never persisted (see AppRegistryEntry). */
export interface AppLifecycle {
  onOpen?: (windowId: string) => void;
  onClose?: (windowId: string) => void;
  onFocus?: (windowId: string) => void;
}

/**
 * File→app association. The app opens for any filesystem node whose `.app`
 * equals `appField`; `getProps` maps that node to the app's restore props.
 */
export interface AppAssociation<TFileNode extends FileNode = FileNode, TProps = unknown> {
  appField: string;
  getProps: (item: TFileNode) => TProps;
}

/**
 * A registered desktop application.
 *
 * `TProps` is the type `restore(props)` receives. **Important:** a window's
 * `componentProps` are persisted to localStorage so the window can be rebuilt
 * after a page refresh, so restore props MUST be JSON-serializable (see
 * {@link JsonValue}) — do not pass functions, callbacks, DOM nodes or class
 * instances, or restoration after refresh will fail. Route runtime callbacks
 * through the event bus (`onEvent`) or `AppLifecycle`, not through props.
 *
 * Prefer the {@link defineApp} factory over writing this literal by hand.
 */
export interface AppRegistryEntry<TProps = unknown> {
  id: string;
  name: string;
  /** i18n key for the window title; falls back to `name` if omitted or untranslated. */
  nameKey?: string;
  icon: string;
  /** Restrict to culture ids (e.g. `['zh']`); omit for apps shared by every culture. */
  locales?: string[];
  /** Whether the app is listed under Start > All Programs. Defaults to true. */
  showInStartMenu?: boolean;
  /** Window size, position and behavior. */
  window?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    /** Initial position; omit to center. Useful for tall windows that morph size. */
    left?: number;
    top?: number;
    singleton?: boolean;
    isMaximized?: boolean;
    resizable?: boolean;
  };
  /** @deprecated Use {@link AppRegistryEntry.window} instead — this duplicate shape will be removed. */
  defaultWindowProps?: Record<string, unknown>;
  lifecycle?: AppLifecycle;
  associations?: AppAssociation[];
  /** Semantic role used by an OS package to map content to an implementation. */
  role?: AppRole;
  /** Declarative commands; the active OS package chooses their menu surface. */
  menus?: AppMenu[];
  /** Runtime command sink for declarative menus; never persisted. */
  onMenuCommand?: (commandId: string, windowId: string) => void;
  restore: (props: TProps) => React.ReactNode;
}

// ============================================================
// Other types
// ============================================================

/** User session */
export interface UserSession {
  isLoggedIn: boolean;
  username: string;
}

/** Clipboard item */
export interface ClipboardItem {
  type: 'cut' | 'copy';
  sourcePath: string[];
  fileName: string;
  /** All file names included in a batch operation; fileName is the first of them */
  fileNames?: string[];
}

/** Context menu item */
export interface MenuItem {
  label?: string;
  type?: 'separator';
  action?: () => void;
  disabled?: boolean;
  icon?: string;
  shortcut?: string;
  submenu?: MenuItem[];
}
