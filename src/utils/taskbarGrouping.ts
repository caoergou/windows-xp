import { WindowState } from '../types';

export interface TaskbarEntry {
  key: string;
  windows: WindowState[];
  grouped: boolean;
}

// XP first shrinks buttons and groups similar applications only when the
// individual buttons no longer fit in the available taskbar strip.
export const TASKBAR_MIN_BUTTON_WIDTH = 40;
export const TASKBAR_BUTTON_GAP = 2;
export const TASKBAR_LEFT_PADDING = 5;

export const buildTaskbarEntries = (
  windows: WindowState[],
  availableWidth: number
): TaskbarEntry[] => {
  const visible = windows.filter(window => !window.isHidden);
  const buckets = new Map<string, WindowState[]>();
  visible.forEach(window => {
    const bucket = buckets.get(window.appId);
    if (bucket) bucket.push(window);
    else buckets.set(window.appId, [window]);
  });

  const requiredWidth =
    visible.length * TASKBAR_MIN_BUTTON_WIDTH +
    Math.max(0, visible.length - 1) * TASKBAR_BUTTON_GAP +
    TASKBAR_LEFT_PADDING;
  const crowded = availableWidth > 0 && requiredWidth > availableWidth;
  const entries: TaskbarEntry[] = [];
  buckets.forEach((appWindows, appId) => {
    if (crowded && appWindows.length > 1) {
      entries.push({ key: `group:${appId}`, windows: appWindows, grouped: true });
      return;
    }
    appWindows.forEach(window => {
      entries.push({ key: window.id, windows: [window], grouped: false });
    });
  });
  return entries;
};
