import React from 'react';
import { APP_REGISTRY } from '../registry/apps.jsx';

/**
 * 从 localStorage 恢复窗口组件。
 *
 * 优先使用注册表（appId 精确匹配），对旧格式数据回退到 prop 启发式识别。
 */
export const restoreComponent = (appId, componentProps = {}) => {
  // 1. 注册表精确匹配（新格式）
  const def = APP_REGISTRY[appId];
  if (def?.restore) {
    return def.restore(componentProps);
  }

  // 2. FileProperties 动态 appId（形如 'properties-xxx'）
  if (appId?.startsWith('properties-')) {
    return APP_REGISTRY.FileProperties.restore(componentProps);
  }

  // 3. 旧格式兼容：按 prop 启发式识别
  if (componentProps.initialPath) {
    return APP_REGISTRY.Explorer.restore(componentProps);
  }
  if (appId === 'Internet Explorer' || componentProps.url || componentProps.html) {
    return APP_REGISTRY.InternetExplorer.restore(componentProps);
  }
  if (componentProps.content !== undefined && !componentProps.url && !componentProps.html) {
    return APP_REGISTRY.Notepad.restore(componentProps);
  }
  if (componentProps.src) {
    return APP_REGISTRY.PhotoViewer.restore(componentProps);
  }
  if (appId === 'HelpAndSupport') {
    return APP_REGISTRY.HelpAndSupport.restore(componentProps);
  }
  if (appId === 'RunDialog' || appId === 'run') {
    return APP_REGISTRY.RunDialog.restore(componentProps);
  }
  if (appId === 'CommandPrompt' || appId === 'cmd' || appId === 'Command Prompt') {
    return APP_REGISTRY.CommandPrompt.restore(componentProps);
  }
  if (appId === 'VolumeControl' || appId === 'volume') {
    return APP_REGISTRY.VolumeControl.restore(componentProps);
  }
  if (appId === 'NetworkConnections' || appId === 'network') {
    return APP_REGISTRY.NetworkConnections.restore(componentProps);
  }
  if (appId === 'ControlPanel' || appId === 'controlpanel') {
    return APP_REGISTRY.ControlPanel.restore(componentProps);
  }
  if (appId === 'MicrosoftPaint' || appId === 'paint' || appId === '画图') {
    return APP_REGISTRY.MicrosoftPaint.restore(componentProps);
  }
  if (appId === 'Minesweeper' || appId === 'minesweeper' || appId === '扫雷') {
    return APP_REGISTRY.Minesweeper.restore(componentProps);
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
