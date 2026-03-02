import React from 'react';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import FileProperties from '../components/FileProperties';
import QQLogin from '../apps/QQLogin';
import Calculator from '../apps/Calculator';

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
export const APP_REGISTRY = {

  Explorer: {
    id:   'Explorer',
    name: '文件资源管理器',
    icon: 'folder',
    window: { width: 720, height: 500 },
    lifecycle: {},
    restore: (props) => <Explorer {...props} />,
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
        getProps: (item) =>
          item.isHtmlContent
            ? { html: item.content }
            : { url: item.content || item.url || 'about:blank' },
      },
    ],
    restore: (props) => <InternetExplorer {...props} />,
  },

  Notepad: {
    id:   'Notepad',
    name: '记事本',
    icon: 'file',
    window: { width: 480, height: 300 },
    lifecycle: {},
    associations: [
      {
        appField: 'Notepad',
        getProps: (item) => ({ content: item.content ?? '', readOnly: item.readOnly }),
      },
    ],
    restore: (props) => <Notepad {...props} />,
  },

  PhotoViewer: {
    id:   'PhotoViewer',
    name: '图片查看器',
    icon: 'image',
    window: { width: 660, height: 520 },
    lifecycle: {},
    associations: [
      {
        appField: 'PhotoViewer',
        getProps: (item) => ({ src: item.content, fileItem: item }),
      },
    ],
    restore: (props) => <PhotoViewer {...props} />,
  },

  FileProperties: {
    id:   'FileProperties',
    name: '属性',
    icon: 'properties',
    window: { width: 380, height: 420, resizable: false },
    lifecycle: {},
    restore: (props) => <FileProperties {...props} />,
  },

  QQLogin: {
    id:     'QQLogin',
    name:   'QQ',
    icon:   'qq',
    window: { width: 320, height: 380, resizable: false, singleton: true },
    lifecycle: {},
    restore: (props) => <QQLogin {...props} />,
  },

  Calculator: {
    id:     'Calculator',
    name:   '计算器',
    icon:   'calculator',
    window: { width: 280, height: 340, resizable: false, singleton: true },
    lifecycle: {},
    associations: [
      { appField: 'Calculator', getProps: () => ({}) },
    ],
    restore: (props) => <Calculator {...props} />,
  },
};

// ── 按 appField 建立快速查找表（避免遍历）──────────────────────────────────
const _assocByField = Object.values(APP_REGISTRY).reduce((acc, def) => {
  for (const assoc of (def.associations || [])) {
    if (assoc.appField) acc[assoc.appField] = { def, assoc };
  }
  return acc;
}, {});

/**
 * resolveFileOpen — 将文件系统节点解析为可直接传给 openWindow() 的参数对象。
 *
 * @param {string} key   节点在父 children 中的 key（用作 Explorer 的 initialPath）
 * @param {object} item  filesystem.json 中的节点
 * @returns {{ appId, component, icon, windowProps } | null}
 *   返回 null 表示无法打开（DummyApp 或未注册），调用方负责给出提示。
 */
export const resolveFileOpen = (key, item) => {
  // 文件夹 / 根目录 → 用 Explorer 打开
  if (item.type === 'folder' || item.type === 'root') {
    const def = APP_REGISTRY.Explorer;
    return {
      appId:       'Explorer',
      component:   def.restore({ initialPath: [key] }),
      icon:        item.icon || def.icon,
      windowProps: _buildWindowProps(def),
    };
  }

  // app_shortcut / file → 按 appField 查注册表
  const entry = _assocByField[item.app];
  if (!entry) return null;

  const { def, assoc } = entry;
  const componentProps = assoc.getProps(item);

  return {
    appId:       def.id,
    component:   def.restore(componentProps),
    icon:        item.icon || def.icon,
    windowProps: _buildWindowProps(def),
  };
};

/** 将 manifest.window 映射为 openWindow 的 props 参数格式 */
function _buildWindowProps(def) {
  return {
    ...(def.window || {}),
    // 传递 lifecycle 回调，供 WindowManagerContext 在适当时机调用
    onOpen:  def.lifecycle?.onOpen  || null,
    onClose: def.lifecycle?.onClose || null,
    onFocus: def.lifecycle?.onFocus || null,
  };
}
