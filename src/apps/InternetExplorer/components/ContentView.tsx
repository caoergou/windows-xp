import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import IEErrorPage from '../../../components/Explorer/IEErrorPage';
import { HistoryEntry } from '../types';
import { toWaybackUrl, IFRAME_NAVIGATE_SCRIPT } from '../constants';
import { Content } from '../styled';
import type { SiteDef } from '../../../content/types';
import type { ContentResolver } from '../../../content/resolver';
import { lookupSite } from '../../../content/pack';
import type { GeneratedPageCache } from '../../../content/generatedPageCache';
import type {
  WebContentProvider,
  ModerationProvider,
  GeneratedPage,
} from '../../../providers/types';
import { sanitizeHtml } from '../../../content/sanitizer';
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
  /** WebContentProvider for LLM-generated pages (#149). */
  webContentProvider?: WebContentProvider;
  /** ModerationProvider for screening generated content (#148). */
  moderationProvider?: ModerationProvider;
  /** Cache for generated pages (#149). */
  generatedPageCache?: GeneratedPageCache;
  /** Culture id for era-appropriate styling. */
  culture?: string;
  /** Era-appropriate prompt template from the culture package (#149). */
  eraPrompt?: string;
  /** Callback when a generated page is rendered. */
  onGenerated?: (url: string) => void;
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
  webContentProvider,
  moderationProvider,
  generatedPageCache,
  culture,
  eraPrompt,
  onGenerated,
}) => {
  const { t } = useTranslation();
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const generatedIframeRef = useRef<HTMLIFrameElement>(null);

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

  // Attach click listeners to all links in the generated-page iframe from the
  // parent frame (#149). The iframe uses sandbox="allow-same-origin" without
  // allow-scripts, so the injected IFRAME_NAVIGATE_SCRIPT won't run. Instead,
  // the parent traverses the iframe's DOM after load and intercepts clicks.
  const attachGeneratedLinkHandlers = useCallback(() => {
    const iframe = generatedIframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('a[href]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const href = a.getAttribute('href');
          if (href) onNavigate(href);
        });
      });
    } catch {
      // Cross-origin: can't access iframe DOM
    }
  }, [onNavigate]);

  // Generated page resolution (#149): check cache first, then call provider.
  useEffect(() => {
    if (!currentEntry || currentEntry.error || currentEntry.html) {
      setGeneratedHtml(null);
      return;
    }

    const site = sites && resolver ? lookupSite(sites, currentEntry.url) : undefined;
    if (site) {
      setGeneratedHtml(null);
      return;
    }

    if (pluginContent) {
      setGeneratedHtml(null);
      return;
    }

    if (!webContentProvider || !generatedPageCache) {
      setGeneratedHtml(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const tryGenerate = async () => {
      const cached = await generatedPageCache.get(currentEntry.url);
      if (cached) {
        if (!cancelled) {
          const safe = sanitizeHtml(cached.html, { tier: 'strict' });
          setGeneratedHtml(safe);
          onGenerated?.(currentEntry.url);
          onLoad();
        }
        return;
      }

      const hasRoom = await generatedPageCache.hasCapacity();
      if (!hasRoom) {
        if (!cancelled) setGeneratedHtml(null);
        return;
      }

      setGenerating(true);

      try {
        const result: GeneratedPage = await webContentProvider.generatePage(
          currentEntry.url,
          { url: currentEntry.url, culture: culture ?? 'en', eraPrompt },
          controller.signal
        );

        if (cancelled) return;

        let html = result.html;

        if (moderationProvider) {
          const modResult = await moderationProvider.check(html, controller.signal);
          if (!modResult.allowed) {
            setGenerating(false);
            setGeneratedHtml(null);
            return;
          }
        }

        html = sanitizeHtml(html, { tier: 'strict', maxLinks: 8 });

        await generatedPageCache.put(currentEntry.url, { html, title: result.title });

        if (!cancelled) {
          setGeneratedHtml(html);
          onGenerated?.(currentEntry.url);
          onLoad();
        }
      } catch {
        if (!cancelled) setGeneratedHtml(null);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };

    void tryGenerate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    currentEntry,
    sites,
    resolver,
    pluginContent,
    webContentProvider,
    moderationProvider,
    generatedPageCache,
    culture,
    eraPrompt,
    onLoad,
    onGenerated,
  ]);

  if (!currentEntry) return null;

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

  if (generatedHtml) {
    return (
      <Content>
        <iframe
          ref={generatedIframeRef}
          id="ie-frame"
          srcDoc={generatedHtml}
          title="Generated Content"
          sandbox="allow-same-origin"
          onLoad={() => {
            attachGeneratedLinkHandlers();
            onLoad();
          }}
        />
      </Content>
    );
  }

  if (generating) {
    return (
      <Content>
        <div style={{ padding: 20, fontFamily: 'Tahoma, sans-serif', fontSize: 12 }}>
          {t('internetExplorer.status.opening')}
        </div>
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
