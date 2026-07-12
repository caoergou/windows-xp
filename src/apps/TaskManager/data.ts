import type { WindowState } from '../../types';

/**
 * Task Manager process model.
 *
 * A "process" row is either a system process (always present, fixed identity)
 * or a user process derived from an open window. User rows carry the source
 * window id so "End Process" can close the corresponding window.
 */
export interface ProcessRow {
  /** Stable key for React + selection. */
  key: string;
  /** Image name, e.g. `notepad.exe`. */
  imageName: string;
  /** User Name column. */
  userName: string;
  /** True for the fixed system processes (End Process warns first). */
  system: boolean;
  /** Source window id for user processes; undefined for system processes. */
  windowId?: string;
}

/** User-name buckets matching real XP service accounts. */
const USER = {
  SYSTEM: 'SYSTEM',
  LOCAL: 'LOCAL SERVICE',
  NETWORK: 'NETWORK SERVICE',
} as const;

/**
 * The always-present system processes, in the order XP tends to show them.
 * `System Idle Process` is first and, per the real tool, soaks up whatever CPU
 * isn't being used by everything else.
 */
export const SYSTEM_PROCESSES: ReadonlyArray<{ imageName: string; userName: string }> = [
  { imageName: 'System Idle Process', userName: USER.SYSTEM },
  { imageName: 'System', userName: USER.SYSTEM },
  { imageName: 'smss.exe', userName: USER.SYSTEM },
  { imageName: 'csrss.exe', userName: USER.SYSTEM },
  { imageName: 'winlogon.exe', userName: USER.SYSTEM },
  { imageName: 'services.exe', userName: USER.SYSTEM },
  { imageName: 'lsass.exe', userName: USER.SYSTEM },
  { imageName: 'svchost.exe', userName: USER.SYSTEM },
  { imageName: 'svchost.exe', userName: USER.NETWORK },
  { imageName: 'svchost.exe', userName: USER.LOCAL },
  { imageName: 'svchost.exe', userName: USER.SYSTEM },
  { imageName: 'spoolsv.exe', userName: USER.SYSTEM },
  { imageName: 'explorer.exe', userName: USER.SYSTEM },
];

/** Map a registered appId to the executable image name XP would show. */
const APP_IMAGE_NAMES: Record<string, string> = {
  Notepad: 'notepad.exe',
  Calculator: 'calc.exe',
  MicrosoftPaint: 'mspaint.exe',
  CommandPrompt: 'cmd.exe',
  Minesweeper: 'winmine.exe',
  Solitaire: 'sol.exe',
  WindowsMediaPlayer: 'wmplayer.exe',
  InternetExplorer: 'iexplore.exe',
  Explorer: 'explorer.exe',
  ControlPanel: 'control.exe',
  TaskManager: 'taskmgr.exe',
  HelpAndSupport: 'helpctr.exe',
  PhotoViewer: 'shimgvw.exe',
  RunDialog: 'rundll32.exe',
  QQ: 'QQ.exe',
  SafeGuard360: '360safe.exe',
  Thunder: 'Thunder.exe',
  KugouMusic: 'KuGou.exe',
  BaofengPlayer: 'StormPlayer.exe',
  WPSOffice: 'wps.exe',
};

/** Executable image name for a window (registry map, else `<appid>.exe`). */
export const imageNameForWindow = (win: WindowState): string =>
  APP_IMAGE_NAMES[win.appId] ?? `${win.appId.toLowerCase()}.exe`;

/**
 * Build the full process list: user windows first (most recognizable), then the
 * fixed system processes.
 */
export const buildProcessRows = (windows: WindowState[], userName: string): ProcessRow[] => {
  const userRows: ProcessRow[] = windows.map(win => ({
    key: `win-${win.id}`,
    imageName: imageNameForWindow(win),
    userName,
    system: false,
    windowId: win.id,
  }));

  const systemRows: ProcessRow[] = SYSTEM_PROCESSES.map((proc, index) => ({
    key: `sys-${index}`,
    imageName: proc.imageName,
    userName: proc.userName,
    system: true,
  }));

  return [...userRows, ...systemRows];
};
