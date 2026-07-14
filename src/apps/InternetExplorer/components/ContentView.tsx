import React, { useEffect, useMemo } from 'react';
import IEErrorPage from '../../../components/Explorer/IEErrorPage';
import { HistoryEntry } from '../types';
import { toWaybackUrl, IFRAME_NAVIGATE_SCRIPT } from '../constants';
import { Content } from '../styled';
import type { SiteDef } from '../../../content/types';
import type { ContentResolver } from '../../../content/resolver';
import { lookupSite } from '../../../content/pack';
import SitePage from './SitePage';

interface ContentViewProps {
  currentEntry: HistoryEntry | undefined;
  plugin?: (
    url: string,
    navigateTo: (url: string, html?: string) => void,
    openNewIE: (url: string) => void
  ) => React.ReactNode;
  onNavigate: (url: string, html?: string) => void;
  onOpenNewIE: (url: string) => void;
  onLoad: () => void;
  onError: () => void;
  onOpenHelp: () => void;
  /** Content-pack authorized-site registry (#241), keyed by normalized URL. */
  sites?: Record<string, SiteDef>;
  /** Resolver for authorized-site `html` refs (#241). */
  resolver?: ContentResolver;
}

const ContentView: React.FC<ContentViewProps> = ({
  currentEntry,
  plugin,
  onNavigate,
  onOpenNewIE,
  onLoad,
  onError,
  onOpenHelp,
  sites,
  resolver,
}) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') {
        onNavigate(event.data.href);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigate]);

  useEffect(() => {
    const iframe = document.getElementById('ie-frame') as HTMLIFrameElement | null;
    if (!iframe || currentEntry?.html) return;

    let lastUrl = toWaybackUrl(currentEntry?.url || '');

    const checkUrl = setInterval(() => {
      try {
        const currentIframeUrl = iframe.contentWindow?.location.href;
        if (
          currentIframeUrl &&
          currentIframeUrl !== lastUrl &&
          currentIframeUrl !== 'about:blank'
        ) {
          lastUrl = currentIframeUrl;
          const match = currentIframeUrl.match(
            /web\.archive\.org\/web\/\d+[a-z_]*\/(https?:\/\/.+)/
          );
          if (match) {
            const originalUrl = match[1];
            iframe.contentWindow?.stop();
            onNavigate(originalUrl);
          }
        }
      } catch (e) {
        // Cross-origin, ignore
      }
    }, 100);

    return () => clearInterval(checkUrl);
  }, [currentEntry, onNavigate]);

  const pluginContent = useMemo(
    () => currentEntry && plugin?.(currentEntry.url, onNavigate, onOpenNewIE),
    [currentEntry, plugin, onNavigate, onOpenNewIE]
  );

  const isPluginRendered = !!pluginContent;

  useEffect(() => {
    if (isPluginRendered) {
      onLoad();
    }
  }, [isPluginRendered, onLoad]);

  if (!currentEntry) return null;

  // Authorized sites (#241/#149) win over the plugin/search and the Wayback
  // fallback — but an explicit per-nav `html` (below) is still more specific.
  const site = sites && resolver ? lookupSite(sites, currentEntry.url) : undefined;

  if (currentEntry.error) {
    return (
      <Content>
        <IEErrorPage
          url={currentEntry.url}
          onRefresh={() => onNavigate(currentEntry.url)}
          onDiagnose={onOpenHelp}
        />
      </Content>
    );
  }

  if (currentEntry.html) {
    const srcDoc = currentEntry.html + IFRAME_NAVIGATE_SCRIPT;

    return (
      <Content>
        <iframe
          id="ie-frame"
          srcDoc={srcDoc}
          title="Browser Content"
          sandbox="allow-scripts allow-same-origin"
          onLoad={onLoad}
        />
      </Content>
    );
  }

  if (site && resolver) {
    return (
      <SitePage
        site={site}
        url={currentEntry.url}
        resolver={resolver}
        onNavigate={onNavigate}
        onOpenHelp={onOpenHelp}
        onLoad={onLoad}
      />
    );
  }

  if (pluginContent) {
    return <Content>{pluginContent}</Content>;
  }

  return (
    <Content>
      <iframe
        id="ie-frame"
        src={toWaybackUrl(currentEntry.url)}
        title="Browser"
        key={currentEntry.url}
        onLoad={onLoad}
        onError={onError}
      />
    </Content>
  );
};

export default ContentView;
