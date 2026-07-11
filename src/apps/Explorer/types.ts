// Explorer types (#163/A).

// windowId 由 Window.tsx 通过 cloneElement 自动注入
export interface ExplorerProps {
  initialPath?: string[];
  windowId?: string;
}
