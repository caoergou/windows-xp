import { APP_REGISTRY } from '../registry/apps';
import { AppRegistryEntry } from '../types';

/**
 * 从 localStorage 恢复窗口组件。
 *
 * 持久化的窗口列表带版本号（见 `windowPersistence.ts`），版本升级后旧格式数据
 * 会被丢弃，因此每条待恢复记录都必然携带真实的注册表 `appId`。恢复只走两条
 * 路径：注册表精确匹配，以及 FileProperties 的动态 `properties-*` id。
 */
export const restoreComponent = (
  appId: string,
  componentProps: Record<string, unknown> = {},
  registry: Record<string, AppRegistryEntry> = APP_REGISTRY
): React.ReactNode => {
  // 1. 注册表精确匹配
  const def = registry[appId];
  if (def?.restore) {
    return def.restore(componentProps);
  }

  // 2. FileProperties 动态 appId（形如 'properties-xxx'）
  if (appId?.startsWith('properties-')) {
    return registry.FileProperties?.restore(componentProps) ?? null;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
