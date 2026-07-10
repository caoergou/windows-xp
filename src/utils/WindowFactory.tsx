import { APP_REGISTRY } from '../registry/apps';
import { AppRegistryEntry } from '../types';

/**
 * 从 localStorage 恢复窗口组件。
 *
 * 优先使用注册表（appId 精确匹配），对旧格式数据回退到 prop 启发式识别。
 */
export const restoreComponent = (
  appId: string,
  componentProps: Record<string, unknown> = {},
  registry: Record<string, AppRegistryEntry> = APP_REGISTRY
): React.ReactNode => {
  // 1. 注册表精确匹配（新格式）
  const def = registry[appId];
  if (def?.restore) {
    return def.restore(componentProps);
  }

  // 2. FileProperties 动态 appId（形如 'properties-xxx'）
  if (appId?.startsWith('properties-')) {
    return registry.FileProperties?.restore(componentProps) ?? null;
  }

  // 3. 旧格式兼容：按 prop 启发式识别
  if (componentProps.initialPath) {
    return registry.Explorer?.restore(componentProps) ?? null;
  }
  if (appId === 'Internet Explorer' || componentProps.url || componentProps.html) {
    return registry.InternetExplorer?.restore(componentProps) ?? null;
  }
  if (componentProps.content !== undefined && !componentProps.url && !componentProps.html) {
    return registry.Notepad?.restore(componentProps) ?? null;
  }
  if (componentProps.src) {
    return registry.PhotoViewer?.restore(componentProps) ?? null;
  }
  if (appId === 'HelpAndSupport') {
    return registry.HelpAndSupport?.restore(componentProps) ?? null;
  }
  if (appId === 'RunDialog' || appId === 'run') {
    return registry.RunDialog?.restore(componentProps) ?? null;
  }
  if (appId === 'CommandPrompt' || appId === 'cmd' || appId === 'Command Prompt') {
    return registry.CommandPrompt?.restore(componentProps) ?? null;
  }
  if (appId === 'VolumeControl' || appId === 'volume') {
    return registry.VolumeControl?.restore(componentProps) ?? null;
  }
  if (appId === 'NetworkConnections' || appId === 'network') {
    return registry.NetworkConnections?.restore(componentProps) ?? null;
  }
  if (appId === 'ControlPanel' || appId === 'controlpanel') {
    return registry.ControlPanel?.restore(componentProps) ?? null;
  }
  if (appId === 'MicrosoftPaint' || appId === 'paint' || appId === '画图') {
    return registry.MicrosoftPaint?.restore(componentProps) ?? null;
  }
  if (appId === 'Minesweeper' || appId === 'minesweeper' || appId === '扫雷') {
    return registry.Minesweeper?.restore(componentProps) ?? null;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
