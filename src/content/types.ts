/**
 * Content reference & content-pack model (#241).
 *
 * The pre-#241 content model had **no file-reference mechanism**: a `FileNode`
 * could only carry inline `content: string`, IE had no authorized-site registry
 * (a "fake webpage" had to be an inline iframe of the real web), and the #137
 * blog pipeline embedded whole Markdown bodies inline. That forces a real puzzle
 * pack (dozens of fake pages + long documents + media) into one giant JSON:
 * web designers can't edit escaped strings, writers lose their `.md` files, and
 * the #208 512 KB scenario ceiling blows out.
 *
 * The split (complementary to #207 string extraction): **small text lives in
 * string tables** (dialogue/notifications — for i18n and copy polish), **large
 * content lives behind file references** (webpages/long docs/media — for the
 * toolchain and role split). The scenario JSON ends up holding only logic.
 *
 * This module is the structural core the issue asks for: `ContentRef`,
 * `ContentPack`, `SiteDef`, plus the type guards that discriminate the three
 * `ContentRef` shapes. Resolution (inline / url / asset lookup + lazy cache)
 * lives in {@link ./resolver}; the pure merge/normalize helpers in {@link ./pack}.
 */
import type { FileNode } from '../types';
import type { Scenario } from '../scenario/types';
import type { RecycleBinItem } from '../utils/storage';
import type { RecentDocumentEntry } from '../context/RecentDocumentsContext';
import type { PrinterDefinition, PrintJob } from '../context/PrintSpoolerContext';
import type { MediaPlaylist } from '../apps/WindowsMediaPlayer';

/**
 * A reference to a piece of content. Three sources, one shape — so a `content:`
 * inline string can grow into a referenced file without changing the field's
 * meaning.
 *
 * - `string` — **inline**. The content itself (current behaviour; the fast path
 *   for prototypes and short bodies).
 * - `{ url }` — a **host asset URL** resolved at load time (a build-time
 *   `import`, a `public/` path, or a CDN URL). Portable only as far as the URL is.
 * - `{ asset }` — a **logical key** resolved through a {@link ContentPack}'s
 *   `assets` manifest. The portable reference: a content pack ships its own
 *   assets map, so the same `{ asset: 'letter' }` resolves wherever the pack is
 *   mounted.
 */
export type ContentRef = string | { url: string } | { asset: string };

/** Narrow a {@link ContentRef} to the inline-string form. */
export function isInlineRef(ref: ContentRef): ref is string {
  return typeof ref === 'string';
}

/** Narrow a {@link ContentRef} to the `{ url }` host-asset form. */
export function isUrlRef(ref: ContentRef): ref is { url: string } {
  return typeof ref === 'object' && ref !== null && 'url' in ref && typeof ref.url === 'string';
}

/** Narrow a {@link ContentRef} to the `{ asset }` manifest-key form. */
export function isAssetRef(ref: ContentRef): ref is { asset: string } {
  return typeof ref === 'object' && ref !== null && 'asset' in ref && typeof ref.asset === 'string';
}

/** True for any value that is shaped like a {@link ContentRef}. */
export function isContentRef(value: unknown): value is ContentRef {
  return (
    typeof value === 'string' || isUrlRef(value as ContentRef) || isAssetRef(value as ContentRef)
  );
}

/**
 * An authorized IE site (#149/#241). Keyed in {@link ContentPack.sites} by a
 * normalized URL (see {@link ./pack}.normalizeSiteUrl); when the player
 * navigates to a matching URL, IE renders `html` instead of falling through to
 * the search corpus or a Wayback iframe. This registry is the declarative way to
 * author a fake webpage — "authorized pages always win" (#149).
 */
export interface SiteDef {
  /** The page body to render (inline HTML, a host URL, or an asset key). */
  html: ContentRef;
  /** Browser/tab title; falls back to the site's URL key when omitted. */
  title?: string;
  /** Optional favicon (icon id, data URI, or a {@link ContentRef}). */
  favicon?: ContentRef;
}

/**
 * A per-culture string table: culture id (`'en'`, `'zh'`, …) → key → text. The
 * carrier for #207 copy extraction inside a pack; merged into the runtime string
 * resolver when the pack is mounted.
 */
export type PackStrings = Record<string, Record<string, string>>;

/**
 * A content pack — the top-level unit of an official game's content repository
 * (#86/#241). Every field is optional; a pack may use only one of them (e.g. a
 * pack that just ships authorized sites, or just a scenario). Multiple packs can
 * be mounted and merged (see {@link ./pack}.mergeContentPacks).
 */
export interface ContentPack {
  /** Stable id — namespaces the asset cache and feeds the snapshot fingerprint. */
  id: string;
  /**
   * Logical asset key → concrete source, resolved once when the host mounts the
   * pack. Values are inline or `{ url }` sources — an `{ asset }` value would be
   * an indirection loop and is rejected by the resolver.
   */
  assets?: Record<string, ContentRef>;
  /** IE authorized-site registry (keys are normalized URLs, rules per #149). */
  sites?: Record<string, SiteDef>;
  /** `customFileSystem` fragment; file nodes may carry a `contentRef`. */
  files?: Record<string, FileNode>;
  /** Authored Recycle Bin records with deterministic deletion metadata (#282). */
  recycleBin?: Record<string, RecycleBinItem>;
  /** Authored historical MRU entries merged with runtime opens (#282). */
  recentDocuments?: RecentDocumentEntry[];
  /** Data-driven printers and initial spool history (#276). */
  printers?: PrinterDefinition[];
  printJobs?: PrintJob[];
  /** Reusable WMP playlists addressable by id (#277). */
  playlists?: MediaPlaylist[];
  /** The scenario rulebook (#84/#207). */
  scenario?: Scenario;
  /** Per-culture string tables (#207 copy extraction carrier). */
  strings?: PackStrings;
}
