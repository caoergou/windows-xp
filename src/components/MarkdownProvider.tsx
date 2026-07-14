import React, { useCallback, useMemo } from 'react';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useAppRegistry } from '../context/AppRegistryContext';
import { openExternalUrl } from '../utils/externalLink';
import { MarkdownConfigProvider, type MarkdownOptions } from '../apps/MarkdownViewer/config';

/**
 * Supplies MarkdownViewer windows with author config (#254) plus the in-desktop
 * capability to open a link in the Internet Explorer app. Lives inside
 * `WindowManagerProvider` so it can drive `openWindow`; MarkdownViewer stays
 * decoupled from the window manager (and still renders standalone in tests /
 * SSR mirrors, where this provider is absent and links are plain anchors).
 */
export const MarkdownProvider: React.FC<{
  options?: MarkdownOptions;
  children: React.ReactNode;
}> = ({ options, children }) => {
  const { openWindow } = useWindowManagerActions();
  const { registry } = useAppRegistry();

  const openInIE = useCallback(
    (url: string) => {
      const ie = registry.InternetExplorer;
      if (!ie) {
        openExternalUrl(url, true); // no IE registered → fall back to a real tab
        return;
      }
      openWindow('InternetExplorer', url, ie.restore({ url }), ie.icon, {
        isMaximized: true,
        componentProps: { url },
      });
    },
    [openWindow, registry]
  );

  const value = useMemo(() => ({ ...(options ?? {}), openInIE }), [options, openInIE]);

  return <MarkdownConfigProvider value={value}>{children}</MarkdownConfigProvider>;
};

export default MarkdownProvider;
