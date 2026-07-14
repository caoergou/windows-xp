/**
 * Authorized-site page (#241/#149).
 *
 * Renders a {@link SiteDef} from the content-pack site registry: resolves its
 * `html` {@link ContentRef} (inline / url / asset) through the content resolver,
 * then shows it in the same sandboxed, link-forwarding iframe the shell uses for
 * authored `html` pages. An authorized site always wins over the search corpus
 * and the Wayback fallback, so this is how a scenario ships a fake webpage.
 *
 * While the ref resolves we show a minimal "opening" state; if it fails to
 * resolve (dead url / missing asset) we render an error page so a broken pack
 * can't leave a blank frame.
 */
import React, { useEffect, useState } from 'react';
import type { SiteDef } from '../../../content/types';
import type { ContentResolver } from '../../../content/resolver';
import IEErrorPage from '../../../components/Explorer/IEErrorPage';
import { Content } from '../styled';
import { IFRAME_NAVIGATE_SCRIPT } from '../constants';

interface SitePageProps {
  /** The authorized site to render. */
  site: SiteDef;
  /** The normalized URL this page was served for (iframe key + error display). */
  url: string;
  /** Resolver bound to the mounted packs' assets. */
  resolver: ContentResolver;
  /** Forward in-page link clicks to the IE shell. */
  onNavigate: (url: string) => void;
  /** Diagnose link on the error page. */
  onOpenHelp: () => void;
  /** Flip the shell out of its loading state once the page renders. */
  onLoad: () => void;
}

type LoadState = { status: 'loading' } | { status: 'ready'; html: string } | { status: 'error' };

const SitePage: React.FC<SitePageProps> = ({
  site,
  url,
  resolver,
  onNavigate,
  onOpenHelp,
  onLoad,
}) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    resolver.resolveOrNull(site.html).then(html => {
      if (cancelled) return;
      // A failed resolve is a terminal state too: clear the shell's spinner.
      if (html === null) onLoad();
      setState(html === null ? { status: 'error' } : { status: 'ready', html });
    });
    return () => {
      cancelled = true;
    };
  }, [site, resolver, onLoad]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') onNavigate(event.data.href);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigate]);

  if (state.status === 'error') {
    return (
      <Content>
        <IEErrorPage url={url} onRefresh={() => onNavigate(url)} onDiagnose={onOpenHelp} />
      </Content>
    );
  }

  if (state.status === 'loading') return <Content />;

  return (
    <Content>
      <iframe
        id="ie-frame"
        key={url}
        srcDoc={state.html + IFRAME_NAVIGATE_SCRIPT}
        title={site.title ?? url}
        sandbox="allow-scripts allow-same-origin"
        onLoad={onLoad}
      />
    </Content>
  );
};

export default SitePage;
