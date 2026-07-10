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
  // Legacy aliases from pre-registry persisted windows. Exact registry ids
  // (e.g. 'RunDialog') never reach here - the registry match above wins -
  // so only the alias spellings remain (#82 dead-branch cleanup).
  const LEGACY_ALIASES: Record<string, string> = {
    run: 'RunDialog',
    cmd: 'CommandPrompt',
    'Command Prompt': 'CommandPrompt',
    volume: 'VolumeControl',
    network: 'NetworkConnections',
    controlpanel: 'ControlPanel',
    paint: 'MicrosoftPaint',
    画图: 'MicrosoftPaint',
    minesweeper: 'Minesweeper',
    扫雷: 'Minesweeper',
  };
  const aliasTarget = LEGACY_ALIASES[appId];
  if (aliasTarget) {
    return registry[aliasTarget]?.restore(componentProps) ?? null;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
