/**
 * Content-pack mounting (#241).
 *
 * Merges the host's `contentPacks` into one bundle and hands the runtime pieces
 * down: the IE authorized-site registry, the merged asset manifest, per-culture
 * string tables, and a {@link ContentResolver} whose cache is backed by this
 * instance's {@link Storage} handle (so fetched content persists and stays
 * isolated per instance, #95). IE reads the registry with {@link useContentPacks}
 * to serve authorized pages; pack `files` are merged into the filesystem one
 * layer up (see `AppProviders`), not here.
 *
 * Without a provider, {@link useContentPacks} returns a stable empty bundle with
 * a no-op resolver, so an app rendered in isolation (or a test) never crashes.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { ContentPack, ContentRef, PackStrings, SiteDef } from '../content/types';
import type { FileNode } from '../types';
import { mergeContentPacks } from '../content/pack';
import {
  createContentResolver,
  storageContentCache,
  memoryContentCache,
  type ContentResolver,
} from '../content/resolver';
import { useStorage } from './StorageContext';

/** The mounted-content bundle exposed to the tree. */
export interface ContentPackContextValue {
  /** Every mounted pack id, in mount order. */
  ids: string[];
  /** Merged asset manifest (logical key → source). */
  assets: Record<string, ContentRef>;
  /** IE authorized-site registry, keyed by normalized URL. */
  sites: Record<string, SiteDef>;
  /** Merged filesystem fragment (also merged into the FS by AppProviders). */
  files: Record<string, FileNode>;
  /** Merged per-culture string tables. */
  strings: PackStrings;
  /** Resolver bound to the merged assets + this instance's storage cache. */
  resolver: ContentResolver;
}

const EMPTY: ContentPackContextValue = {
  ids: [],
  assets: {},
  sites: {},
  files: {},
  strings: {},
  resolver: createContentResolver({ cache: memoryContentCache() }),
};

const ContentPackContext = createContext<ContentPackContextValue | null>(null);

export const ContentPackProvider: React.FC<{
  packs?: ContentPack[];
  children: React.ReactNode;
}> = ({ packs, children }) => {
  const storage = useStorage();
  const merged = useMemo(() => mergeContentPacks(packs ?? []), [packs]);
  const resolver = useMemo(
    () =>
      createContentResolver({
        assets: merged.assets,
        cache: storageContentCache(storage),
        packId: merged.ids.join('+') || undefined,
      }),
    [merged, storage]
  );
  const value = useMemo<ContentPackContextValue>(
    () => ({ ...merged, resolver }),
    [merged, resolver]
  );
  return <ContentPackContext.Provider value={value}>{children}</ContentPackContext.Provider>;
};

/** Read the mounted content bundle (empty + no-op resolver without a provider). */
export const useContentPacks = (): ContentPackContextValue =>
  useContext(ContentPackContext) ?? EMPTY;
