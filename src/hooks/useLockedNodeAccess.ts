import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';
import { useXPEventBus } from '../context/EventBusContext';
import type { FileNode } from '../types';

/**
 * Apply the same password gate to every user-driven filesystem open path.
 *
 * The imperative XPHandle remains a privileged host surface; callers that
 * emulate user navigation should drive the desktop or Explorer instead.
 */
export const useLockedNodeAccess = () => {
  const { t } = useTranslation();
  const { dialog } = useModal();
  const bus = useXPEventBus();

  return useCallback(
    async (node: FileNode, path: string[]): Promise<boolean> => {
      if (!node.locked) return true;

      let attempt = 0;
      return dialog.password({
        title: t('explorer.password.title'),
        message: t('explorer.password.message'),
        hint: node.hint || '',
        correctPassword: node.password ?? '',
        onFail: () => {
          attempt += 1;
          bus.emit({ type: 'password:fail', path, name: node.name, attempt });
        },
      });
    },
    [bus, dialog, t]
  );
};
