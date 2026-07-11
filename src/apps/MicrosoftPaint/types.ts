// MicrosoftPaint types (#163/A).

export type MenuKey = 'file' | 'edit' | 'view' | 'help' | null;

export type PaintMenuItem =
  | { type: 'separator' }
  | {
      type?: undefined;
      label: string;
      action: () => void | Promise<void>;
      shortcut?: string;
      disabled?: boolean;
    };

export interface MicrosoftPaintProps {
  windowId?: string;
  src?: string;
  fileName?: string;
  filePath?: string[];
}
