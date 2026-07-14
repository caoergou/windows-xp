/**
 * Resolve a file body that may be a #241 {@link ContentRef} (PR-C).
 *
 * A file node carries either inline `content` (the fast path) or a `contentRef`
 * pointing at a host asset / pack asset. Content apps (MarkdownViewer, Notepad)
 * call this to get the effective text: inline content passes straight through
 * (synchronous, no loading state), a `contentRef` is resolved lazily through the
 * mounted content resolver and cached. A failed resolve degrades to empty text
 * with `failed` set, so a broken reference shows an empty document rather than
 * crashing the app.
 */
import { useEffect, useState } from 'react';
import type { ContentRef } from '../content/types';
import { useContentPacks } from '../context/ContentPackContext';

export interface ResolvedContent {
  /** Effective text: inline content, the resolved ref, or '' while loading/failed. */
  content: string;
  /** True while a `contentRef` is resolving. */
  loading: boolean;
  /** True if a `contentRef` failed to resolve. */
  failed: boolean;
}

const inlineState = (inline: string | undefined): ResolvedContent => ({
  content: inline ?? '',
  loading: false,
  failed: false,
});

/**
 * @param inline the node's inline `content` (used when there is no `contentRef`)
 * @param contentRef the node's `contentRef` (#241); when present it takes over
 */
export function useResolvedContent(
  inline: string | undefined,
  contentRef: ContentRef | undefined
): ResolvedContent {
  const { resolver } = useContentPacks();
  // Key the effect on the ref's value, not its object identity, so a new
  // equal-valued prop object (fresh getProps on re-render) doesn't refetch.
  const refKey = contentRef === undefined ? undefined : JSON.stringify(contentRef);
  const [state, setState] = useState<ResolvedContent>(() =>
    contentRef ? { content: '', loading: true, failed: false } : inlineState(inline)
  );

  useEffect(() => {
    if (!contentRef) {
      setState(inlineState(inline));
      return;
    }
    let cancelled = false;
    setState({ content: '', loading: true, failed: false });
    resolver.resolveOrNull(contentRef).then(text => {
      if (cancelled) return;
      setState(
        text === null
          ? { content: '', loading: false, failed: true }
          : { content: text, loading: false, failed: false }
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refKey stands in for contentRef by value
  }, [inline, refKey, resolver]);

  return state;
}
