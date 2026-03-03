// 文件系统类型
export interface FileNode {
  type: 'file' | 'folder' | 'drive' | 'root' | 'app_shortcut';
  name: string;
  icon?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  children?: Record<string, FileNode>;
  content?: string;
  app?: string;
  hint?: string;
}

// 窗口类型
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  component: React.ReactNode;
  componentProps?: any;
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

export interface AppLifecycle {
  onOpen?: (windowId: string) => void;
  onClose?: (windowId: string) => void;
  onFocus?: (windowId: string) => void;
}

export interface AppAssociation {
  appField: string;
  getProps: (item: any) => any;
}

export interface AppRegistryEntry {
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
  restore: (props: any) => React.ReactNode;
}

export interface WindowProps {
  singleton?: boolean;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  isMaximized?: boolean;
  onOpen?: (id: string) => void;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
  [key: string]: any;
}

// 用户会话类型
export interface UserSession {
  isLoggedIn: boolean;
  username: string;
}

// 剪贴板类型
export interface ClipboardItem {
  type: 'cut' | 'copy';
  sourcePath: string[];
  fileName: string;
}

// 文件别名（兼容旧代码）
export type FileItem = FileNode;

// 右键菜单项类型
export interface MenuItem {
  label?: string;
  type?: 'separator';
  action?: () => void;
  disabled?: boolean;
  icon?: string;
  shortcut?: string;
  submenu?: MenuItem[];
}
