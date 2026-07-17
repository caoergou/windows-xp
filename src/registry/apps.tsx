import React from 'react';
import Explorer from '../apps/Explorer';
const InternetExplorer = React.lazy(() => import('../apps/InternetExplorer'));
const Notepad = React.lazy(() => import('../apps/Notepad'));
const MarkdownViewer = React.lazy(() => import('../apps/MarkdownViewer'));
import PhotoViewer from '../apps/PhotoViewer';
import FileProperties, { FILE_PROPERTIES_WINDOW_PROPS } from '../components/FileProperties';
import QQ from '../apps/QQ';
import SafeGuard360 from '../apps/SafeGuard360';
import Calculator from '../apps/Calculator';
// Lazy: HelpAndSupport uses the lesson context (#141), which pulls the app
// registry; loading it eagerly here would be a circular import. Lazy defers it
// until the window opens, by which point this module is fully initialized.
const HelpAndSupport = React.lazy(() => import('../apps/HelpAndSupport'));
import RunDialog from '../apps/RunDialog';
import TaskManager from '../apps/TaskManager';
const CommandPrompt = React.lazy(() => import('../apps/CommandPrompt'));
import VolumeControl from '../apps/VolumeControl';
import NetworkConnections from '../apps/NetworkConnections';
import ControlPanel from '../apps/ControlPanel';
const MicrosoftPaint = React.lazy(() => import('../apps/MicrosoftPaint'));
import Minesweeper from '../apps/Minesweeper';
const Solitaire = React.lazy(() => import('../apps/Solitaire'));
const DeductionSheet = React.lazy(() => import('../apps/DeductionSheet'));
const EvidenceBoard = React.lazy(() => import('../apps/EvidenceBoard'));
const WindowsMediaPlayer = React.lazy(() => import('../apps/WindowsMediaPlayer'));
const Thunder = React.lazy(() => import('../apps/Thunder'));
const BaofengPlayer = React.lazy(() => import('../apps/BaofengPlayer'));
const KugouMusic = React.lazy(() => import('../apps/KugouMusic'));
const WPSOffice = React.lazy(() => import('../apps/WPSOffice'));
// en culture apps (#123)
const Winamp = React.lazy(() => import('../apps/Winamp'));
const NortonAntiVirus = React.lazy(() => import('../apps/NortonAntiVirus'));
const UTorrent = React.lazy(() => import('../apps/UTorrent'));
const ITunes = React.lazy(() => import('../apps/ITunes'));
const MicrosoftOffice = React.lazy(() => import('../apps/MicrosoftOffice'));
import {
  AppRegistryEntry,
  AppAssociation,
  FileNode,
  isFileContentNode,
  isAppShortcutNode,
} from '../types';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import XPIcon from '../components/XPIcon';
import { restoreApp } from './defineApp';
import { resolveOSTheme } from '../themes/useOSTheme';

// Placeholder app - used for apps not yet implemented
const DummyAppContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  text-align: center;
  padding: 20px;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
  margin-bottom: 10px;
  font-size: 18px;
`;

const Message = styled.p`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
  font-size: 12px;
  line-height: 1.6;
`;

interface DummyAppProps {
  appName?: string;
  windowId?: string;
}

const DummyAppComponent: React.FC<DummyAppProps> = ({ appName = 'This Application' }) => {
  const { t } = useTranslation();
  return (
    <DummyAppContainer>
      <IconWrapper>
        <XPIcon name="alert" size={64} />
      </IconWrapper>
      <Title>{appName}</Title>
      <Message>{t('apps.comingSoon', 'This feature is coming soon!')}</Message>
    </DummyAppContainer>
  );
};

/** Resolve the localized display title for a registry entry. */
export const getAppDisplayName = (def: AppRegistryEntry, t: TFunction): string => {
  if (!def.nameKey) return def.name;
  const translated = t(def.nameKey, { defaultValue: '' });
  return translated || def.name;
};

/**
 * APP_REGISTRY - the single registry for all openable apps.
 *
 * Field description for each record:
 *   id                  - unique app identifier (same as the registry key)
 *   name                - display name
 *   icon                - default window icon (XPIcon key or data: URL)
 *   window              - default window configuration
 *     .width / .height  - initial size
 *     .singleton        - when true, only one instance is allowed globally; reopening focuses the existing window
 *   lifecycle           - lifecycle callbacks, receiving (windowId)
 *     .onOpen(id)       - after the window is created
 *     .onClose(id)      - before the window is closed
 *     .onFocus(id)      - when the window gains focus
 *   associations        - file associations (used automatically when node.app in filesystem.json matches)
 *     .appField         - matches the node.app field value
 *     .getProps(item)   - converts a filesystem node into component props
 *   restore(props)      - reconstructs JSX from saved componentProps (used during localStorage restore)
 */
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  Explorer: {
    id: 'Explorer',
    name: 'Windows Explorer',
    nameKey: 'apps.explorer',
    icon: 'folder',
    window: { width: 720, height: 500 },
    lifecycle: {},
    restore: restoreApp(Explorer),
  },

  InternetExplorer: {
    id: 'InternetExplorer',
    name: 'Internet Explorer',
    icon: 'ie',
    window: { isMaximized: true },
    lifecycle: {},
    associations: [
      {
        appField: 'InternetExplorer',
        getProps: (item: FileNode) => {
          if (isAppShortcutNode(item)) {
            if (item.isHtmlContent) {
              return { html: item.url ?? '' };
            }
            return { url: item.url || 'about:blank' };
          }
          return { url: isFileContentNode(item) ? item.content || 'about:blank' : 'about:blank' };
        },
      },
    ],
    restore: restoreApp(InternetExplorer),
  },

  Notepad: {
    id: 'Notepad',
    name: '记事本',
    nameKey: 'apps.notepad',
    icon: 'file',
    window: { width: 480, height: 300 },
    lifecycle: {},
    associations: [
      {
        appField: 'Notepad',
        getProps: (item: FileNode) => ({
          content: isFileContentNode(item) ? (item.content ?? '') : '',
          contentRef: isFileContentNode(item) ? item.contentRef : undefined,
          readOnly: isFileContentNode(item) ? item.readOnly : false,
        }),
      },
    ],
    restore: restoreApp(Notepad),
  },

  MarkdownViewer: {
    id: 'MarkdownViewer',
    name: 'Markdown Viewer',
    nameKey: 'apps.markdownViewer',
    icon: 'markdown',
    window: { width: 560, height: 440, resizable: true },
    lifecycle: {},
    associations: [
      {
        appField: 'MarkdownViewer',
        getProps: (item: FileNode) => ({
          content: isFileContentNode(item) ? (item.content ?? '') : '',
          contentRef: isFileContentNode(item) ? item.contentRef : undefined,
          fileName: item.name,
        }),
      },
    ],
    restore: restoreApp(MarkdownViewer),
  },

  PhotoViewer: {
    id: 'PhotoViewer',
    name: '图片查看器',
    nameKey: 'photoViewer.title',
    icon: 'image',
    window: { width: 660, height: 520 },
    lifecycle: {},
    associations: [
      {
        appField: 'PhotoViewer',
        getProps: (item: FileNode) => ({
          src: isFileContentNode(item) ? item.content : undefined,
          fileItem: item,
        }),
      },
    ],
    restore: restoreApp(PhotoViewer),
  },

  FileProperties: {
    id: 'FileProperties',
    name: '属性',
    icon: 'properties',
    showInStartMenu: false,
    window: FILE_PROPERTIES_WINDOW_PROPS,
    lifecycle: {},
    restore: restoreApp(FileProperties),
  },

  QQ: {
    id: 'QQ',
    name: 'QQ',
    nameKey: 'qq.title',
    icon: 'qq',
    locales: ['zh'],
    // Opens at the login size; the app resizes itself to the 202×600 buddy-list
    // panel on successful login (one window that morphs across phases, #119).
    // Fixed top so the window fits on screen both as the short login box and
    // after it morphs into the 600px-tall buddy-list panel (#119).
    window: {
      width: 352,
      height: 266,
      top: 40,
      minWidth: 190,
      minHeight: 200,
      resizable: false,
      singleton: true,
    },
    lifecycle: {},
    associations: [{ appField: 'QQ', getProps: () => ({}) }],
    restore: restoreApp(QQ),
  },

  SafeGuard360: {
    id: 'SafeGuard360',
    name: '360 Safe Guard',
    nameKey: 'safeGuard360.title',
    icon: '360safe',
    locales: ['zh'],
    window: { width: 500, height: 360, resizable: false, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'SafeGuard360', getProps: () => ({}) }],
    restore: restoreApp(SafeGuard360),
  },

  Calculator: {
    id: 'Calculator',
    name: '计算器',
    nameKey: 'apps.calculator',
    icon: 'calculator',
    window: { width: 208, height: 196, resizable: false, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'Calculator', getProps: () => ({}) }],
    restore: restoreApp(Calculator),
  },

  HelpAndSupport: {
    id: 'HelpAndSupport',
    name: '帮助和支持',
    nameKey: 'helpAndSupport.title',
    icon: 'help',
    window: { width: 600, height: 400 },
    lifecycle: {},
    associations: [{ appField: 'HelpAndSupport', getProps: () => ({}) }],
    restore: restoreApp(HelpAndSupport),
  },

  RunDialog: {
    id: 'RunDialog',
    name: '运行',
    icon: 'run',
    window: { width: 380, height: 178, resizable: false, singleton: true },
    lifecycle: {},
    restore: restoreApp(RunDialog),
  },

  TaskManager: {
    id: 'TaskManager',
    name: 'Windows Task Manager',
    nameKey: 'taskManager.title',
    icon: 'computer',
    window: { width: 540, height: 470, minWidth: 400, minHeight: 320, singleton: true },
    lifecycle: {},
    restore: restoreApp(TaskManager),
  },

  CommandPrompt: {
    id: 'CommandPrompt',
    name: '命令提示符',
    nameKey: 'apps.commandPrompt',
    icon: 'cmd',
    window: { width: 600, height: 400 },
    lifecycle: {},
    restore: restoreApp(CommandPrompt),
  },

  VolumeControl: {
    id: 'VolumeControl',
    name: '音量控制',
    nameKey: 'apps.volumeControl',
    icon: 'volume',
    window: { width: 320, height: 300, resizable: false, singleton: true },
    lifecycle: {},
    restore: restoreApp(VolumeControl),
  },

  NetworkConnections: {
    id: 'NetworkConnections',
    name: '网络连接',
    nameKey: 'apps.networkConnections',
    icon: 'network',
    window: { width: 388, height: 452, resizable: false, singleton: true },
    lifecycle: {},
    restore: restoreApp(NetworkConnections),
  },

  ControlPanel: {
    id: 'ControlPanel',
    name: '控制面板',
    nameKey: 'startMenu.controlPanel',
    icon: 'controlpanel',
    window: { width: 700, height: 520 },
    lifecycle: {},
    restore: restoreApp(ControlPanel),
  },

  MicrosoftPaint: {
    id: 'MicrosoftPaint',
    name: '画图',
    nameKey: 'apps.paint',
    icon: 'paint',
    window: { width: 700, height: 500 },
    lifecycle: {},
    associations: [
      {
        appField: 'MicrosoftPaint',
        getProps: (item: FileNode) => ({
          src: isFileContentNode(item) ? item.content : undefined,
          fileName: item.name,
        }),
      },
    ],
    restore: restoreApp(MicrosoftPaint),
  },

  DeductionSheet: {
    id: 'DeductionSheet',
    name: 'Deduction Sheet',
    nameKey: 'apps.deductionSheet',
    icon: 'notepad',
    showInStartMenu: false,
    // Scenario-layer app (#219): opened by a scenario/host with a puzzle via
    // `openApp('DeductionSheet', { formId, wordBank, slots, groups, solution })`.
    window: { width: 460, height: 420 },
    restore: restoreApp(DeductionSheet),
  },
  EvidenceBoard: {
    id: 'EvidenceBoard',
    name: 'Evidence Board',
    nameKey: 'apps.evidenceBoard',
    icon: 'notepad',
    showInStartMenu: false,
    // Scenario-layer app (#219): opened with an evidence pool via
    // `openApp('EvidenceBoard', { boardId, items })`.
    window: { width: 560, height: 400 },
    restore: restoreApp(EvidenceBoard),
  },
  Minesweeper: {
    id: 'Minesweeper',
    name: '扫雷',
    nameKey: 'apps.minesweeper',
    icon: 'minesweeper',
    // The game measures its panel and resizes the window to fit the current difficulty.
    window: { width: 170, height: 260, minWidth: 170, resizable: false, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'Minesweeper', getProps: () => ({}) }],
    restore: restoreApp(Minesweeper),
  },

  Solitaire: {
    id: 'Solitaire',
    name: '纸牌',
    nameKey: 'apps.solitaire',
    icon: 'solitaire',
    window: { width: 700, height: 520, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'Solitaire', getProps: () => ({}) }],
    restore: restoreApp(Solitaire),
  },

  WindowsMediaPlayer: {
    id: 'WindowsMediaPlayer',
    name: 'Windows Media Player',
    nameKey: 'apps.mediaPlayer',
    icon: 'media',
    window: { width: 520, height: 420 },
    lifecycle: {},
    associations: [
      { appField: 'WindowsMediaPlayer', getProps: () => ({}) },
      {
        appField: 'mp3',
        getProps: (item: FileNode) => ({
          src: isFileContentNode(item) ? item.content : undefined,
        }),
      },
      {
        appField: 'wma',
        getProps: (item: FileNode) => ({
          src: isFileContentNode(item) ? item.content : undefined,
        }),
      },
      {
        appField: 'avi',
        getProps: (item: FileNode) => ({
          src: isFileContentNode(item) ? item.content : undefined,
        }),
      },
    ],
    restore: restoreApp(WindowsMediaPlayer),
  },

  Thunder: {
    id: 'Thunder',
    name: '迅雷',
    nameKey: 'thunder.title',
    icon: 'thunder',
    locales: ['zh'],
    window: { width: 560, height: 400 },
    lifecycle: {},
    associations: [{ appField: 'Thunder', getProps: () => ({}) }],
    restore: restoreApp(Thunder),
  },

  KugouMusic: {
    id: 'KugouMusic',
    name: '酷狗音乐',
    nameKey: 'kugouMusic.title',
    icon: 'kugou',
    locales: ['zh'],
    window: { width: 520, height: 400, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'KugouMusic', getProps: () => ({}) }],
    restore: restoreApp(KugouMusic),
  },

  BaofengPlayer: {
    id: 'BaofengPlayer',
    name: '暴风影音',
    nameKey: 'baofengPlayer.title',
    icon: 'baofeng',
    locales: ['zh'],
    window: { width: 600, height: 450, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'BaofengPlayer', getProps: () => ({}) }],
    restore: restoreApp(BaofengPlayer),
  },

  WPSOffice: {
    id: 'WPSOffice',
    name: 'WPS Office',
    nameKey: 'wpsOffice.title',
    icon: 'wps',
    locales: ['zh'],
    window: { width: 720, height: 520, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'WPSOffice', getProps: () => ({}) }],
    restore: restoreApp(WPSOffice),
  },

  Winamp: {
    id: 'Winamp',
    name: 'Winamp',
    icon: 'winamp',
    locales: ['en'],
    window: {
      width: 380,
      height: 440,
      minWidth: 300,
      minHeight: 320,
      resizable: true,
      singleton: true,
    },
    lifecycle: {},
    associations: [{ appField: 'Winamp', getProps: () => ({}) }],
    restore: restoreApp(Winamp),
  },

  NortonAntiVirus: {
    id: 'NortonAntiVirus',
    name: 'Norton AntiVirus',
    icon: 'nav',
    locales: ['en'],
    window: { width: 480, height: 380, resizable: false, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'NortonAntiVirus', getProps: () => ({}) }],
    restore: restoreApp(NortonAntiVirus),
  },

  UTorrent: {
    id: 'UTorrent',
    name: 'uTorrent',
    icon: 'utorrent',
    locales: ['en'],
    window: { width: 560, height: 380, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'UTorrent', getProps: () => ({}) }],
    restore: restoreApp(UTorrent),
  },

  ITunes: {
    id: 'ITunes',
    name: 'iTunes',
    icon: 'itunes',
    locales: ['en'],
    window: { width: 600, height: 420, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'ITunes', getProps: () => ({}) }],
    restore: restoreApp(ITunes),
  },

  MicrosoftOffice: {
    id: 'MicrosoftOffice',
    name: 'Microsoft Office',
    icon: 'msoffice',
    locales: ['en'],
    window: { width: 520, height: 380, resizable: true, singleton: true },
    lifecycle: {},
    associations: [{ appField: 'MicrosoftOffice', getProps: () => ({}) }],
    restore: restoreApp(MicrosoftOffice),
  },

  DummyApp: {
    id: 'DummyApp',
    name: '应用',
    icon: 'app_window',
    showInStartMenu: false,
    window: { width: 350, height: 250, resizable: false, singleton: false },
    lifecycle: {},
    associations: [
      { appField: 'DummyApp', getProps: (item: FileNode) => ({ appName: item.name }) },
    ],
    restore: restoreApp(DummyAppComponent),
  },
};

// --- Build a fast lookup table by appField (avoid iteration) -------------------------------
const _assocByField = Object.values(APP_REGISTRY).reduce(
  (acc, def) => {
    for (const assoc of def.associations || []) {
      if (assoc.appField) acc[assoc.appField] = { def, assoc };
    }
    return acc;
  },
  {} as Record<string, { def: AppRegistryEntry; assoc: AppAssociation }>
);

/**
 * resolveFileOpen - resolve a filesystem node into a parameter object that can be passed directly to openWindow().
 *
 * @param {string} key   The node's key among its parent's children (used as Explorer's initialPath)
 * @param {object} item  A node from filesystem.json
 * @returns {{ appId, component, icon, windowProps } | null}
 *   Returns null when the node cannot be opened (DummyApp or unregistered); the caller is responsible for showing a hint.
 */
export const resolveFileOpen = (key: string, item: FileNode) => {
  // Folder / root / drive -> open with Explorer
  if (item.type === 'folder' || item.type === 'root' || item.type === 'drive') {
    const def = APP_REGISTRY.Explorer;
    const componentProps = { initialPath: [key] };
    return {
      appId: 'Explorer',
      component: def.restore(componentProps),
      icon: item.icon || def.icon,
      windowProps: {
        ..._buildWindowProps(def),
        componentProps, // Pass componentProps explicitly for persistence
      },
    };
  }

  // app_shortcut / file -> look up in registry by appField
  let appField =
    item.type === 'app_shortcut' ? item.app : item.type === 'file' ? item.app : undefined;
  // Extension fallback (#137): .md files open in MarkdownViewer unless the node
  // explicitly names another app.
  if (!appField && item.type === 'file' && item.name.toLowerCase().endsWith('.md')) {
    appField = 'MarkdownViewer';
  }
  if (!appField) return null;

  const entry = _assocByField[appField];
  if (!entry) return null;

  const { def, assoc } = entry;
  const componentProps = assoc.getProps(item);

  return {
    appId: def.id,
    component: def.restore(componentProps),
    icon: item.icon || def.icon,
    windowProps: {
      ..._buildWindowProps(def),
      componentProps, // Pass componentProps explicitly for persistence
    },
  };
};

/** Map manifest.window to the props argument format of openWindow */
function _buildWindowProps(def: AppRegistryEntry) {
  return {
    ...(def.window || {}),
    // Pass lifecycle callbacks for WindowManagerContext to invoke at the appropriate times
    onOpen: def.lifecycle?.onOpen || null,
    onClose: def.lifecycle?.onClose || null,
    onFocus: def.lifecycle?.onFocus || null,
  };
}
