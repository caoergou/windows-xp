import { useSyncExternalStore } from 'react';
import { qqStore, QQState } from './qqStore';

/** Subscribe to the QQ runtime store; any window can get the same live state. */
export function useQQStore(): QQState {
  return useSyncExternalStore(qqStore.subscribe, qqStore.getState, qqStore.getState);
}
