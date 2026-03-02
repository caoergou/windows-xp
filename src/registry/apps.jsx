import React from 'react';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import FileProperties from '../components/FileProperties';

/**
 * APP_REGISTRY — 所有可打开应用的唯一注册中心。
 *
 * 每条记录包含：
 *   component       — 组件类（便于外部引用）
 *   icon            — 默认窗口图标名
 *   defaultWindowProps — 默认窗口尺寸/状态
 *   getProps(item)  — 将文件系统节点转为组件 props（文件关联时使用）
 *   restore(props)  — 从已保存的 componentProps 重建 JSX（localStorage 恢复时使用）
 */
export const APP_REGISTRY = {
  Explorer: {
    component: Explorer,
    icon: 'folder',
    defaultWindowProps: { width: 800, height: 550 },
    restore: (props) => <Explorer {...props} />,
  },

  InternetExplorer: {
    component: InternetExplorer,
    icon: 'ie',
    defaultWindowProps: { isMaximized: true },
    getProps: (item) =>
      item.isHtmlContent
        ? { html: item.content }
        : { url: item.content || item.url || 'about:blank' },
    restore: (props) => <InternetExplorer {...props} />,
  },

  Notepad: {
    component: Notepad,
    icon: 'file',
    defaultWindowProps: { width: 600, height: 400 },
    getProps: (item) => ({ content: item.content ?? '', readOnly: item.readOnly }),
    restore: (props) => <Notepad {...props} />,
  },

  PhotoViewer: {
    component: PhotoViewer,
    icon: 'image',
    defaultWindowProps: { width: 600, height: 500 },
    getProps: (item) => ({ src: item.content }),
    restore: (props) => <PhotoViewer {...props} />,
  },

  FileProperties: {
    component: FileProperties,
    icon: 'properties',
    defaultWindowProps: { width: 400, height: 450 },
    restore: (props) => <FileProperties {...props} />,
  },
};

/**
 * 将文件系统节点解析为可直接传给 openWindow() 的参数对象。
 *
 * @param {string} key   - 该节点在父 children 中的 key（同时用作 Explorer 的 initialPath）
 * @param {object} item  - filesystem.json 中的节点
 * @returns {{ appId, component, icon, windowProps } | null}
 *   返回 null 表示无法打开（DummyApp 或未知 app），由调用方决定如何提示。
 */
export const resolveFileOpen = (key, item) => {
  // 文件夹 / 根目录 → 用 Explorer 打开
  if (item.type === 'folder' || item.type === 'root') {
    const def = APP_REGISTRY.Explorer;
    return {
      appId: 'Explorer',
      component: def.restore({ initialPath: [key] }),
      icon: item.icon || def.icon,
      windowProps: def.defaultWindowProps,
    };
  }

  // app_shortcut / file → 查注册表
  const def = APP_REGISTRY[item.app];
  if (!def?.getProps) return null; // DummyApp 或未注册应用

  return {
    appId: item.app,
    component: def.restore(def.getProps(item)),
    icon: item.icon || def.icon,
    windowProps: def.defaultWindowProps,
  };
};
