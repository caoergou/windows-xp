/**
 * contentRef file rendering (#241, PR-C): MarkdownViewer resolves a `contentRef`
 * body, the reference content pack opens its `.md` letter end-to-end, and the
 * useResolvedContent hook's inline/ref/failure behaviour.
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP, ContentPackProvider, referenceContentPack } from '../src/lib';
import type { ContentPack } from '../src/lib';
import MarkdownViewer from '../src/apps/MarkdownViewer';
import { useResolvedContent } from '../src/hooks/useResolvedContent';

describe('MarkdownViewer contentRef (#241)', () => {
  it('renders an inline content string unchanged (no provider needed)', () => {
    render(<MarkdownViewer content={'# Inline\n\nbody'} fileName="a.md" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Inline' })).toBeInTheDocument();
  });

  it('resolves a { asset } contentRef through the mounted pack', async () => {
    const pack: ContentPack = {
      id: 'p',
      assets: { note: '# Resolved Heading\n\nfrom an asset' },
    };
    render(
      <ContentPackProvider packs={[pack]}>
        <MarkdownViewer contentRef={{ asset: 'note' }} fileName="note.md" />
      </ContentPackProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Resolved Heading' })
      ).toBeInTheDocument()
    );
  });
});

describe('useResolvedContent (#241)', () => {
  const wrapper = (packs: ContentPack[]) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ContentPackProvider packs={packs}>{children}</ContentPackProvider>
    );
    Wrapper.displayName = 'TestContentPackWrapper';
    return Wrapper;
  };

  it('passes inline content through synchronously', () => {
    const { result } = renderHook(() => useResolvedContent('hello', undefined));
    expect(result.current).toEqual({ content: 'hello', loading: false, failed: false });
  });

  it('resolves a ref and reports loading then ready', async () => {
    const { result } = renderHook(() => useResolvedContent(undefined, { asset: 'k' }), {
      wrapper: wrapper([{ id: 'p', assets: { k: 'value' } }]),
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.content).toBe('value'));
    expect(result.current.failed).toBe(false);
  });

  it('flags a failed ref (unknown asset) as failed with empty content', async () => {
    const { result } = renderHook(() => useResolvedContent(undefined, { asset: 'missing' }), {
      wrapper: wrapper([{ id: 'p', assets: {} }]),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({ content: '', loading: false, failed: true });
  });
});

describe('reference content pack (#241 acceptance)', () => {
  beforeEach(() => localStorage.clear());

  it('opens the .md letter (contentRef) and renders its resolved body', async () => {
    render(
      <WindowsXP skipBoot autoLogin disableScreenSaver contentPacks={[referenceContentPack]} />
    );
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());

    // The pack's letter.md is a desktop file; open it.
    await waitFor(() => expect(screen.getByTestId('desktop-icon-letter.md')).toBeInTheDocument());
    screen
      .getByTestId('desktop-icon-letter.md')
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    // MarkdownViewer resolves the { asset } ref and renders the letter's heading.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: '外婆的信' })).toBeInTheDocument()
    );
  });
});
