import React, { useEffect, useMemo } from 'react';
import IEErrorPage from '../../../components/Explorer/IEErrorPage';
import { HistoryEntry } from '../types';
import { toWaybackUrl } from '../constants';
import { Content } from '../styled';

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
}

const ContentView: React.FC<ContentViewProps> = ({
  currentEntry,
  plugin,
  onNavigate,
  onOpenNewIE,
  onLoad,
  onError,
  onOpenHelp,
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
    const script = `
      <script>
        document.addEventListener('click', function(e) {
          var anchor = e.target.closest('a');
          if (anchor && anchor.href) {
            e.preventDefault();
            window.parent.postMessage({ type: 'NAVIGATE', href: anchor.href }, '*');
          }
        });
      </script>
    `;
    const srcDoc = currentEntry.html + script;

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
