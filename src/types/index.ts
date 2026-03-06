// ============================================================
// 文件系统类型定义
// ============================================================

/** 基础文件节点 - 所有文件类型的共同属性 */
interface BaseFileNode {
  name: string;
  icon?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  hint?: string;
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
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
}

/** 窗口配置属性 */
export interface WindowProps {
  singleton?: boolean;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  isMaximized?: boolean;
  resizable?: boolean;
  onOpen?: (id: string) => void;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
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

/** 应用注册表条目 */
export interface AppRegistryEntry<TProps = unknown> {
  id: string;
  name: string;
  icon: string;
  window?: {
    width?: number;
    height?: number;
    singleton?: boolean;
    isMaximized?: boolean;
    resizable?: boolean;
  };
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

// 文件别名（兼容旧代码）
export type FileItem = FileNode;
