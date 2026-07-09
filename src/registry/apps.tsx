import React from 'react';
import Explorer from '../apps/Explorer';
const InternetExplorer = React.lazy(() => import('../apps/InternetExplorer'));
const Notepad = React.lazy(() => import('../apps/Notepad'));
import PhotoViewer from '../apps/PhotoViewer';
import FileProperties from '../components/FileProperties';
import QQLogin from '../apps/QQLogin';
import SafeGuard360 from '../apps/SafeGuard360';
import Calculator from '../apps/Calculator';
import HelpAndSupport from '../apps/HelpAndSupport';
import RunDialog from '../apps/RunDialog';
const CommandPrompt = React.lazy(() => import('../apps/CommandPrompt'));
import VolumeControl from '../apps/VolumeControl';
import NetworkConnections from '../apps/NetworkConnections';
import ControlPanel from '../apps/ControlPanel';
const MicrosoftPaint = React.lazy(() => import('../apps/MicrosoftPaint'));
import Minesweeper from '../apps/Minesweeper';
const Solitaire = React.lazy(() => import('../apps/Solitaire'));
const WindowsMediaPlayer = React.lazy(() => import('../apps/WindowsMediaPlayer'));
const Thunder = React.lazy(() => import('../apps/Thunder'));
const BaofengPlayer = React.lazy(() => import('../apps/BaofengPlayer'));
const KugouMusic = React.lazy(() => import('../apps/KugouMusic'));
const WPSOffice = React.lazy(() => import('../apps/WPSOffice'));
import { AppRegistryEntry, AppAssociation, FileNode, isFileContentNode, isAppShortcutNode } from '../types';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/** Helper to cast unknown props when restoring an app component */
const restoreApp = <P extends Record<string, unknown>>(Component: React.FC<P>) => {
  const RestoredApp = (props: unknown) => {
    if (!Component) {
      return (
        <div style={{ padding: 20, fontFamily: 'Tahoma, sans-serif' }}>
          Unable to restore app component.
        </div>
      );
    }
    return <Component {...(props as P)} />;
  };
  RestoredApp.displayName = `Restored(${Component?.displayName || Component?.name || 'Unknown'})`;
  return RestoredApp;
};

// 占位应用 - 用于尚未实现的应用
const DummyAppContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  font-family: Tahoma, sans-serif;
  text-align: center;
  padding: 20px;
`;

const IconWrapper = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 10px;
  font-size: 18px;
`;

const Message = styled.p`
  color: #666;
  font-size: 12px;
  line-height: 1.6;
`;

interface DummyAppProps {
  appName?: string;
  windowId?: string;
}

const DummyAppComponent: React.FC<DummyAppProps> = ({ appName = '此应用' }) => {
  const { t } = useTranslation();
  return (
    <DummyAppContainer>
      <IconWrapper>🚧</IconWrapper>
      <Title>{appName}</Title>
      <Message>
        {t('apps.comingSoon', '此功能正在开发中，敬请期待！')}
      </Message>
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
 * APP_REGISTRY — 所有可打开应用的唯一注册中心。
 *
 * 每条记录字段说明：
 *   id                  — 应用唯一标识（与 registry key 相同）
 *   name                — 显示名称
 *   icon                — 默认窗口图标（XPIcon key 或 data: URL）
 *   window              — 窗口默认配置
 *     .width / .height  — 初始尺寸
 *     .singleton        — true 时全局只允许一个实例，再次打开会聚焦已有窗口
 *   lifecycle           — 生命周期回调，接收 (windowId)
 *     .onOpen(id)       — 窗口创建后
 *     .onClose(id)      — 窗口关闭前
 *     .onFocus(id)      — 窗口获得焦点时
 *   associations        — 文件关联（filesystem.json 中 node.app 匹配时自动使用）
 *     .appField         — 匹配 node.app 字段值
 *     .getProps(item)   — 将文件系统节点转为组件 props
 *   restore(props)      — 从已保存的 componentProps 重建 JSX（localStorage 恢复时）
 */
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {

  Explorer: {
    id:   'Explorer',
    name: '文件资源管理器',
    icon: 'folder',
    window: { width: 720, height: 500 },
    lifecycle: {},
    restore: restoreApp(Explorer),
    defaultWindowProps: { width: 720, height: 500 },
  },

  InternetExplorer: {
    id:   'InternetExplorer',
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
    id:   'Notepad',
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
          readOnly: isFileContentNode(item) ? item.readOnly : false,
        }),
      },
    ],
    restore: restoreApp(Notepad),
  },

  PhotoViewer: {
    id:   'PhotoViewer',
    name: '图片查看器',
    nameKey: 'photoViewer.title',
    icon: 'image',
    window: { width: 660, height: 520 },
    lifecycle: {},
    associations: [
      {
        appField: 'PhotoViewer',
        getProps: (item: FileNode) => ({ src: isFileContentNode(item) ? item.content : undefined, fileItem: item }),
      },
    ],
    restore: restoreApp(PhotoViewer),
  },

  FileProperties: {
    id:   'FileProperties',
    name: '属性',
    icon: 'properties',
    window: { width: 380, height: 420, resizable: false },
    lifecycle: {},
    restore: restoreApp(FileProperties),
  },

  QQLogin: {
    id:     'QQLogin',
    name:   'QQ',
    nameKey: 'qq.title',
    icon:   'qq',
    window: { width: 320, height: 380, resizable: false, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'QQLogin', getProps: () => ({}) },
    ],
    restore: restoreApp(QQLogin),
  },

  SafeGuard360: {
    id:     'SafeGuard360',
    name:   '360 Safe Guard',
    nameKey: 'safeGuard360.title',
    icon:   '360safe',
    window: { width: 500, height: 360, resizable: false, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'SafeGuard360', getProps: () => ({}) },
    ],
    restore: restoreApp(SafeGuard360),
  },

  Calculator: {
    id:     'Calculator',
    name:   '计算器',
    nameKey: 'apps.calculator',
    icon:   'calculator',
    window: { width: 208, height: 196, resizable: false, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'Calculator', getProps: () => ({}) },
    ],
    restore: restoreApp(Calculator),
  },

  HelpAndSupport: {
    id:     'HelpAndSupport',
    name:   '帮助和支持',
    nameKey: 'helpAndSupport.title',
    icon:   'help',
    window: { width: 600, height: 400 },
    lifecycle: {},
    associations: [
      { appField: 'HelpAndSupport', getProps: () => ({}) },
    ],
    restore: restoreApp(HelpAndSupport),
  },

  RunDialog: {
    id:     'RunDialog',
    name:   '运行',
    icon:   'run',
    window: { width: 400, height: 120, resizable: false, singleton: true },
    lifecycle: {},
    restore: restoreApp(RunDialog),
  },

  CommandPrompt: {
    id:     'CommandPrompt',
    name:   '命令提示符',
    nameKey: 'apps.commandPrompt',
    icon:   'cmd',
    window: { width: 600, height: 400 },
    lifecycle: {},
    restore: restoreApp(CommandPrompt),
  },

  VolumeControl: {
    id:     'VolumeControl',
    name:   '音量控制',
    nameKey: 'apps.volumeControl',
    icon:   'volume',
    window: { width: 280, height: 120, resizable: false, singleton: true },
    lifecycle: {},
    restore: restoreApp(VolumeControl),
  },

  NetworkConnections: {
    id:     'NetworkConnections',
    name:   '网络连接',
    nameKey: 'apps.networkConnections',
    icon:   'network',
    window: { width: 400, height: 300 },
    lifecycle: {},
    restore: restoreApp(NetworkConnections),
  },

  ControlPanel: {
    id:     'ControlPanel',
    name:   '控制面板',
    nameKey: 'startMenu.controlPanel',
    icon:   'controlpanel',
    window: { width: 600, height: 400 },
    lifecycle: {},
    restore: restoreApp(ControlPanel),
  },

  MicrosoftPaint: {
    id:     'MicrosoftPaint',
    name:   '画图',
    nameKey: 'apps.paint',
    icon:   'paint',
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

  Minesweeper: {
    id:     'Minesweeper',
    name:   '扫雷',
    nameKey: 'apps.minesweeper',
    icon:   'minesweeper',
    window: { width: 400, height: 420, resizable: true, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'Minesweeper', getProps: () => ({}) },
    ],
    restore: restoreApp(Minesweeper),
  },

  Solitaire: {
    id:     'Solitaire',
    name:   '纸牌',
    nameKey: 'apps.solitaire',
    icon:   'solitaire',
    window: { width: 700, height: 520, resizable: true, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'Solitaire', getProps: () => ({}) },
    ],
    restore: restoreApp(Solitaire),
  },

  WindowsMediaPlayer: {
    id:     'WindowsMediaPlayer',
    name:   'Windows Media Player',
    nameKey: 'apps.mediaPlayer',
    icon:   'media',
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
    id:     'Thunder',
    name:   '迅雷',
    nameKey: 'thunder.title',
    icon:   'thunder',
    window: { width: 560, height: 400 },
    lifecycle: {},
    associations: [
      { appField: 'Thunder', getProps: () => ({}) },
    ],
    restore: restoreApp(Thunder),
  },

  KugouMusic: {
    id:     'KugouMusic',
    name:   '酷狗音乐',
    nameKey: 'kugouMusic.title',
    icon:   'kugou',
    window: { width: 520, height: 400, resizable: true, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'KugouMusic', getProps: () => ({}) },
    ],
    restore: restoreApp(KugouMusic),
  },

  BaofengPlayer: {
    id:     'BaofengPlayer',
    name:   '暴风影音',
    nameKey: 'baofengPlayer.title',
    icon:   'baofeng',
    window: { width: 600, height: 450, resizable: true, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'BaofengPlayer', getProps: () => ({}) },
    ],
    restore: restoreApp(BaofengPlayer),
  },

  WPSOffice: {
    id:     'WPSOffice',
    name:   'WPS Office',
    nameKey: 'wpsOffice.title',
    icon:   'wps',
    window: { width: 720, height: 520, resizable: true, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'WPSOffice', getProps: () => ({}) },
    ],
    restore: restoreApp(WPSOffice),
  },

  DummyApp: {
    id:   'DummyApp',
    name: '应用',
    icon: 'app_window',
    window: { width: 350, height: 250, resizable: false, singleton: false },
    lifecycle: {},
    associations: [
      { appField: 'DummyApp', getProps: (item: FileNode) => ({ appName: item.name }) },
    ],
    restore: restoreApp(DummyAppComponent),
  },
};

// ── 按 appField 建立快速查找表（避免遍历）──────────────────────────────────
const _assocByField = Object.values(APP_REGISTRY).reduce((acc, def) => {
  for (const assoc of (def.associations || [])) {
    if (assoc.appField) acc[assoc.appField] = { def, assoc };
  }
  return acc;
  }, {} as Record<string, { def: AppRegistryEntry; assoc: AppAssociation }>);

/**
 * resolveFileOpen — 将文件系统节点解析为可直接传给 openWindow() 的参数对象。
 *
 * @param {string} key   节点在父 children 中的 key（用作 Explorer 的 initialPath）
 * @param {object} item  filesystem.json 中的节点
 * @returns {{ appId, component, icon, windowProps } | null}
 *   返回 null 表示无法打开（DummyApp 或未注册），调用方负责给出提示。
 */
export const resolveFileOpen = (key: string, item: FileNode) => {
  // 文件夹 / 根目录 / 驱动器 → 用 Explorer 打开
  if (item.type === 'folder' || item.type === 'root' || item.type === 'drive') {
    const def = APP_REGISTRY.Explorer;
    const componentProps = { initialPath: [key] };
    return {
      appId:       'Explorer',
      component:   def.restore(componentProps),
      icon:        item.icon || def.icon,
      windowProps: {
        ..._buildWindowProps(def),
        componentProps  // 显式传递 componentProps 用于持久化
      },
    };
  }

  // app_shortcut / file → 按 appField 查注册表
  const appField = item.type === 'app_shortcut'
    ? item.app
    : item.type === 'file'
      ? item.app
      : undefined;
  if (!appField) return null;

  const entry = _assocByField[appField];
  if (!entry) return null;

  const { def, assoc } = entry;
  const componentProps = assoc.getProps(item);

  return {
    appId:       def.id,
    component:   def.restore(componentProps),
    icon:        item.icon || def.icon,
    windowProps: {
      ..._buildWindowProps(def),
      componentProps  // 显式传递 componentProps 用于持久化
    },
  };
};

/** 将 manifest.window 映射为 openWindow 的 props 参数格式 */
function _buildWindowProps(def: AppRegistryEntry) {
  return {
    ...(def.window || {}),
    // 传递 lifecycle 回调，供 WindowManagerContext 在适当时机调用
    onOpen:  def.lifecycle?.onOpen  || null,
    onClose: def.lifecycle?.onClose || null,
    onFocus: def.lifecycle?.onFocus || null,
  };
}
