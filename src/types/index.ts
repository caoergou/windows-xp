// ============================================================
// 通用类型
// ============================================================

/**
 * 任意 JSON 可序列化值。
 *
 * 窗口的 `componentProps` 会被写入 localStorage 以便刷新后重建窗口，
 * 因此自定义应用的 restore props 必须是 JSON 可序列化的（不能含函数、
 * DOM 节点、类实例等）。用它约束 `AppRegistryEntry` 的 props 类型即可
 * 在类型层面挡住"刷新后恢复失败"的坑。
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// ============================================================
// 文件系统类型定义
// ============================================================

/** 照片 EXIF 元数据（用于属性对话框“摘要”页） */
export interface ExifData {
  Model?: string;
  Make?: string;
  FNumber?: number;
  ExposureTime?: number;
  ISOSpeedRatings?: number;
  FocalLength?: number;
  DateTimeOriginal?: string;
}

/** 基础文件节点 - 所有文件类型的共同属性 */
interface BaseFileNode {
  name: string;
  icon?: string;
  /** Derived desktop entry owned by the active culture profile. */
  managedByCulture?: boolean;
  cultureId?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  hint?: string;
  /** 指向 EXIF JSON 文件的路径（src/data/photos 下） */
  exifPath?: string;
  /** 直接内嵌的 EXIF 数据 */
  exifData?: ExifData;
}

/** 根目录节点 */
export interface RootNode extends BaseFileNode {
  type: 'root';
  children: Record<string, FileNode>;
}

/** 文件夹节点 */
export interface FolderNode extends BaseFileNode {
  type: 'folder';
  children: Record<string, FileNode>;
}

/** 驱动器节点 */
export interface DriveNode extends BaseFileNode {
  type: 'drive';
  children: Record<string, FileNode>;
}

/** 普通文件节点 */
export interface FileContentNode extends BaseFileNode {
  type: 'file';
  content?: string;
  app?: string;
  readOnly?: boolean;
  description?: string;
}

/** 应用快捷方式节点 */
export interface AppShortcutNode extends BaseFileNode {
  type: 'app_shortcut';
  app: string;
  url?: string;
  isHtmlContent?: boolean;
}

/** 联合类型 - 所有可能的文件节点 */
export type FileNode = RootNode | FolderNode | DriveNode | FileContentNode | AppShortcutNode;

/** 类型守卫 - 判断是否为可包含子节点的节点 */
export function isContainerNode(node: FileNode): node is RootNode | FolderNode | DriveNode {
  return 'children' in node;
}

/** 类型守卫 - 判断是否为文件节点 */
export function isFileContentNode(node: FileNode): node is FileContentNode {
  return node.type === 'file';
}

/** 类型守卫 - 判断是否为应用快捷方式节点 */
export function isAppShortcutNode(node: FileNode): node is AppShortcutNode {
  return node.type === 'app_shortcut';
}

// ============================================================
// 文件系统相关类型
// ============================================================

/** 文件属性（用于属性对话框） */
export interface FileProperties {
  name: string;
  type: string;
  size: string;
  icon?: string;
  created: string;
  modified: string;
  accessed: string;
  locked: boolean;
  broken: boolean;
}

/** 搜索结果项 */
export interface SearchResult {
  path: string[];
  name: string;
  type: string;
  icon?: string;
}

// ============================================================
// 窗口管理类型
// ============================================================

/** 窗口状态 */
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
  zIndex: number;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  badge?: string | number | null;
  progress?: number | null;
  isFlashing?: boolean;
  onOpen?: (id: string) => void;
  onClose?: ((id: string) => void) | null;
  onFocus?: ((id: string) => void) | null;
}

/** 窗口配置属性 */
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
  [key: string]: unknown;
}

// ============================================================
// 应用注册表类型
// ============================================================

/** 应用生命周期回调 */
export interface AppLifecycle {
  onOpen?: (windowId: string) => void;
  onClose?: (windowId: string) => void;
  onFocus?: (windowId: string) => void;
}

/** 应用文件关联 */
export interface AppAssociation<TFileNode extends FileNode = FileNode, TProps = unknown> {
  appField: string;
  getProps: (item: TFileNode) => TProps;
}

/**
 * 应用注册表条目。
 *
 * `TProps` 是该应用 `restore(props)` 接收的属性类型。**注意**：窗口的
 * `componentProps` 会被持久化到 localStorage 以便刷新后重建窗口，因此用于
 * 恢复的 props 必须是 JSON 可序列化的（见 {@link JsonValue}）——不要放函数、
 * 回调、DOM 节点或类实例，否则刷新后恢复会失败。运行期回调请走事件总线
 * (`onEvent`) 或 `AppLifecycle`，不要塞进 props。
 */
export interface AppRegistryEntry<TProps = unknown> {
  id: string;
  name: string;
  /** i18n key for the window title; falls back to `name` if omitted or untranslated */
  nameKey?: string;
  icon: string;
  /** Omitted for applications shared by every culture profile. */
  locales?: string[];
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
  defaultWindowProps?: Record<string, unknown>;
  lifecycle?: AppLifecycle;
  associations?: AppAssociation[];
  restore: (props: TProps) => React.ReactNode;
}

// ============================================================
// 其他类型
// ============================================================

/** 用户会话 */
export interface UserSession {
  isLoggedIn: boolean;
  username: string;
}

/** 剪贴板项 */
export interface ClipboardItem {
  type: 'cut' | 'copy';
  sourcePath: string[];
  fileName: string;
  /** 批量操作时包含的全部文件名；fileName 为其中第一项 */
  fileNames?: string[];
}

/** 右键菜单项 */
export interface MenuItem {
  label?: string;
  type?: 'separator';
  action?: () => void;
  disabled?: boolean;
  icon?: string;
  shortcut?: string;
  submenu?: MenuItem[];
}
