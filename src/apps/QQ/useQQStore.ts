import { useSyncExternalStore } from 'react';
import { qqStore, QQState } from './qqStore';

/** 订阅 QQ 运行时 store，任意窗口都能拿到同一份实时状态。 */
export function useQQStore(): QQState {
  return useSyncExternalStore(qqStore.subscribe, qqStore.getState, qqStore.getState);
}
