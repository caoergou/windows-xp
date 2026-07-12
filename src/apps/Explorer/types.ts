// Explorer types (#163/A).

// windowId 由 Window.tsx 通过 cloneElement 自动注入
export interface ExplorerProps {
  initialPath?: string[];
  windowId?: string;
}

// The five XP file-list views (#211): Thumbnails, Tiles, Icons, List, Details.
// Persisted per folder so each remembers how it was last shown (#120 mechanism).
export type ExplorerViewMode = 'thumbnails' | 'tiles' | 'icons' | 'list' | 'details';

export const EXPLORER_VIEW_MODES: ExplorerViewMode[] = [
  'thumbnails',
  'tiles',
  'icons',
  'list',
  'details',
];
