/**
 * Content-pack pure helpers (#241).
 *
 * The declarative side of a {@link ContentPack}: URL normalization for the IE
 * site registry (rules aligned with #149) and merging several packs into one.
 * All functions here are pure and dependency-free — the runtime mounting (into
 * the provider tree, IE navigation, snapshot) is PR-B; this is the layer those
 * consume.
 */
import type { ContentPack, ContentRef, PackStrings, SiteDef } from './types';
import type { FileNode } from '../types';

/**
 * Normalize a URL into a stable {@link ContentPack.sites} lookup key (#149).
 * Lower-cases, drops the protocol, a leading `www.`, a trailing slash, and any
 * fragment, so `https://www.Example.com/`, `http://example.com`, and
 * `example.com#top` all collapse to `example.com`. Query strings are kept (a
 * results page differs from a home page). Mirrors IE's existing `isSearchEngineUrl`
 * canonicalization so the registry and the search layer agree on identity.
 */
export function normalizeSiteUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/#.*$/, '')
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

/**
 * Build a site registry keyed by normalized URL from a pack's raw `sites` map.
 * Author keys can be written naturally (`https://www.foo.com/`); this returns
 * them canonicalized. When two author keys normalize to the same URL the later
 * one wins and the collision is reported via `onConflict` (the lint pass in #238
 * turns that into an error).
 */
export function buildSiteRegistry(
  sites: Record<string, SiteDef> | undefined,
  onConflict?: (normalized: string, a: string, b: string) => void
): Record<string, SiteDef> {
  const out: Record<string, SiteDef> = {};
  const seenRaw: Record<string, string> = {};
  for (const [raw, def] of Object.entries(sites ?? {})) {
    const key = normalizeSiteUrl(raw);
    if (key in out && onConflict) onConflict(key, seenRaw[key], raw);
    out[key] = def;
    seenRaw[key] = raw;
  }
  return out;
}

/** Look up an authorized site for a URL, applying #149 normalization. */
export function lookupSite(registry: Record<string, SiteDef>, url: string): SiteDef | undefined {
  return registry[normalizeSiteUrl(url)];
}

/**
 * Deep-merge two filesystem fragments: container nodes (with `children`) merge
 * recursively; anything else is replaced wholesale by the incoming node (so
 * `incoming` wins on leaf collisions). Used to layer content-pack files under a
 * host's explicit `customFileSystem` and to combine two packs' fragments.
 */
export function mergeFsFragments(
  base: Record<string, FileNode>,
  incoming: Record<string, FileNode>
): Record<string, FileNode> {
  const out: Record<string, FileNode> = { ...base };
  for (const [key, node] of Object.entries(incoming)) {
    const existing = out[key];
    if (existing && 'children' in existing && 'children' in node && existing.type === node.type) {
      out[key] = {
        ...existing,
        ...node,
        children: mergeFsFragments(existing.children, node.children),
      };
    } else {
      out[key] = node;
    }
  }
  return out;
}

/** The flattened result of mounting one or more {@link ContentPack}s. */
export interface MountedContent {
  /** Union of every pack id, in mount order (feeds the snapshot fingerprint). */
  ids: string[];
  /** Merged asset manifest (logical key → source). */
  assets: Record<string, ContentRef>;
  /** Merged site registry, keyed by normalized URL. */
  sites: Record<string, SiteDef>;
  /** Merged `customFileSystem` fragment. */
  files: Record<string, FileNode>;
  recycleBin: NonNullable<ContentPack['recycleBin']>;
  recentDocuments: NonNullable<ContentPack['recentDocuments']>;
  printers: NonNullable<ContentPack['printers']>;
  printJobs: NonNullable<ContentPack['printJobs']>;
  playlists: NonNullable<ContentPack['playlists']>;
  reports: NonNullable<ContentPack['reports']>;
  powerSequence?: ContentPack['powerSequence'];
  qqArchives: NonNullable<ContentPack['qqArchives']>;
  /** Merged per-culture string tables. */
  strings: PackStrings;
}

function mergeStrings(base: PackStrings, incoming: PackStrings): PackStrings {
  const out: PackStrings = { ...base };
  for (const [culture, table] of Object.entries(incoming)) {
    out[culture] = { ...(out[culture] ?? {}), ...table };
  }
  return out;
}

/**
 * Merge content packs into one {@link MountedContent} bundle. Later packs win on
 * key collisions (asset keys, site URLs, string keys), and filesystem fragments
 * deep-merge so two packs can contribute into the same folder. Scenarios are
 * **not** merged here — a run has at most one active scenario; the host picks it
 * (or the last pack that declares one) separately.
 *
 * `onSiteConflict` surfaces two author URLs that normalize to the same key
 * (#238 lint hook); omit it to merge silently.
 */
export function mergeContentPacks(
  packs: ContentPack[],
  onSiteConflict?: (normalized: string, a: string, b: string) => void
): MountedContent {
  const result: MountedContent = {
    ids: [],
    assets: {},
    sites: {},
    files: {},
    recycleBin: {},
    recentDocuments: [],
    printers: [],
    printJobs: [],
    playlists: [],
    reports: [],
    strings: {},
    qqArchives: [],
  };
  for (const pack of packs) {
    result.ids.push(pack.id);
    Object.assign(result.assets, pack.assets ?? {});
    result.files = mergeFsFragments(result.files, pack.files ?? {});
    Object.assign(result.recycleBin, pack.recycleBin ?? {});
    result.recentDocuments.push(...(pack.recentDocuments ?? []));
    result.printers.push(...(pack.printers ?? []));
    result.printJobs.push(...(pack.printJobs ?? []));
    result.playlists.push(...(pack.playlists ?? []));
    result.reports.push(...(pack.reports ?? []));
    if (pack.powerSequence) result.powerSequence = pack.powerSequence;
    result.qqArchives.push(...(pack.qqArchives ?? []));
    result.strings = mergeStrings(result.strings, pack.strings ?? {});
    const registry = buildSiteRegistry(pack.sites, onSiteConflict);
    Object.assign(result.sites, registry);
  }
  return result;
}
