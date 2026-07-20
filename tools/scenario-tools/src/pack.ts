import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentPack, ContentRef } from '../../../src/content/types';
import { SCENARIO_MAX_BYTES } from '../../../src/scenario/validate';
import { lintContentPack } from './lint';
import { loadInput } from './loader';
import type { Diagnostic, LintResult } from './types';
import { diagnostic, hasErrors } from './types';
import type { XpspackCompression, XpspackManifestV1 } from './distribution';
import {
  buildXpspack,
  type XpspackAssetInput,
  type XpspackChunkInput,
  type XpspackSigningOptions,
} from './xpspack';

export interface PackedAssetSize {
  key: string;
  source: string;
  bytes: number | null;
}

export interface PackSizeReport {
  logicBytes: number;
  scenarioBytes: number;
  assetBytes: number;
  totalBytes: number;
  transferredBytes: number;
  assets: PackedAssetSize[];
  chunks: Array<{
    id: string;
    rawBytes: number;
    storedBytes: number;
    compression: XpspackCompression;
  }>;
  scenarioLimitBytes: number;
}

export interface PackBuildResult extends LintResult {
  pack: ContentPack;
  report: PackSizeReport;
  format: 'json' | 'xpspack';
  manifest?: XpspackManifestV1;
  output?: string;
}

export interface PackOptions {
  check?: boolean;
  output?: string;
  format?: 'json' | 'xpspack';
  compression?: XpspackCompression;
  signing?: XpspackSigningOptions;
  /** Additional lazy chapter packs. Encryption keys stay in process memory only. */
  chunks?: XpspackChunkInput[];
}

const isRemote = (url: string): boolean =>
  /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:');

const MEDIA_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

const collectXpspackAssets = async (
  pack: ContentPack,
  baseDir: string
): Promise<XpspackAssetInput[]> => {
  const assets: XpspackAssetInput[] = [];
  for (const [id, ref] of Object.entries(pack.assets ?? {})) {
    if (typeof ref === 'string' || 'asset' in ref || isRemote(ref.url)) continue;
    const file = path.resolve(baseDir, ref.url);
    assets.push({
      id,
      bytes: await readFile(file),
      mediaType: MEDIA_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    });
  }
  return assets;
};

const allFiles = async (dir: string): Promise<string[]> => {
  const info = await stat(dir).catch(() => null);
  if (!info?.isDirectory()) return [];
  const out: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) out.push(file);
    }
  };
  await visit(dir);
  return out;
};

const inlineAsset = async (
  key: string,
  ref: ContentRef,
  baseDir: string,
  diagnostics: Diagnostic[]
): Promise<{ ref: ContentRef; size: PackedAssetSize; local?: string }> => {
  if (typeof ref === 'string') {
    const bytes = Buffer.byteLength(ref);
    return { ref, size: { key, source: 'inline', bytes } };
  }
  if ('asset' in ref) {
    diagnostics.push(
      diagnostic(
        'error',
        'asset-indirection',
        'asset manifest values cannot reference another asset',
        `$.assets.${key}`
      )
    );
    return { ref, size: { key, source: `asset:${ref.asset}`, bytes: null } };
  }
  if (isRemote(ref.url)) {
    return { ref, size: { key, source: ref.url, bytes: null } };
  }
  const local = path.resolve(baseDir, ref.url);
  try {
    const body = await readFile(local, 'utf8');
    return {
      ref: body,
      size: { key, source: ref.url, bytes: Buffer.byteLength(body) },
      local,
    };
  } catch {
    diagnostics.push(
      diagnostic('error', 'missing-file', `cannot read asset file: ${ref.url}`, `$.assets.${key}`)
    );
    return { ref, size: { key, source: ref.url, bytes: null }, local };
  }
};

export const normalizeContentPack = async (
  pack: ContentPack,
  baseDir: string
): Promise<{ pack: ContentPack; report: PackSizeReport; diagnostics: Diagnostic[] }> => {
  const diagnostics: Diagnostic[] = [];
  const normalizedAssets: Record<string, ContentRef> = {};
  const sizes: PackedAssetSize[] = [];
  const localOwners = new Map<string, string>();
  for (const [key, ref] of Object.entries(pack.assets ?? {})) {
    const normalized = await inlineAsset(key, ref, baseDir, diagnostics);
    normalizedAssets[key] = normalized.ref;
    sizes.push(normalized.size);
    if (normalized.local) {
      const previous = localOwners.get(normalized.local);
      if (previous) {
        diagnostics.push(
          diagnostic(
            'error',
            'duplicate-file',
            `asset file is declared by both "${previous}" and "${key}"`,
            `$.assets.${key}`
          )
        );
      }
      localOwners.set(normalized.local, key);
    }
  }

  const sourceAssetDir = path.join(baseDir, 'assets');
  for (const file of await allFiles(sourceAssetDir)) {
    if (!localOwners.has(path.resolve(file))) {
      diagnostics.push(
        diagnostic(
          'error',
          'unlisted-file',
          `file exists under assets/ but is not declared in the manifest: ${path.relative(baseDir, file)}`
        )
      );
    }
  }

  const normalized: ContentPack = {
    ...pack,
    ...(pack.assets ? { assets: normalizedAssets } : {}),
  };
  const logicShape = {
    ...pack,
    ...(pack.assets
      ? {
          assets: Object.fromEntries(
            Object.keys(pack.assets).map(key => [key, { assetFile: true }])
          ),
        }
      : {}),
  };
  const logicBytes = Buffer.byteLength(JSON.stringify(logicShape));
  const scenarioBytes = pack.scenario ? Buffer.byteLength(JSON.stringify(pack.scenario)) : 0;
  const assetBytes = sizes.reduce((sum, item) => sum + (item.bytes ?? 0), 0);
  const totalBytes = Buffer.byteLength(JSON.stringify(normalized));
  if (scenarioBytes > SCENARIO_MAX_BYTES) {
    diagnostics.push(
      diagnostic(
        'error',
        'scenario-budget',
        `scenario is ${scenarioBytes} bytes, above the ${SCENARIO_MAX_BYTES}-byte runtime limit`,
        '$.scenario'
      )
    );
  }
  return {
    pack: normalized,
    diagnostics,
    report: {
      logicBytes,
      scenarioBytes,
      assetBytes,
      totalBytes,
      transferredBytes: Buffer.byteLength(`${JSON.stringify(normalized, null, 2)}\n`),
      assets: sizes,
      chunks: [],
      scenarioLimitBytes: SCENARIO_MAX_BYTES,
    },
  };
};

export const packDirectory = async (
  directory: string,
  options: PackOptions = {}
): Promise<PackBuildResult> => {
  const input = await loadInput(directory);
  if (input.kind !== 'pack')
    throw new Error('pack command requires a content-pack manifest or directory');
  const source = input.value as ContentPack;
  const lint = await lintContentPack(source, { baseDir: input.baseDir });
  const normalized = await normalizeContentPack(source, input.baseDir);
  const diagnostics = [...lint.diagnostics, ...normalized.diagnostics];
  const format = options.format ?? 'json';
  const compression = options.compression ?? 'none';
  if (format === 'json' && compression !== 'none')
    throw new Error('compression is only supported with --format xpspack');
  let output: string | undefined;
  let manifest: XpspackManifestV1 | undefined;
  let artifact: Uint8Array | string = `${JSON.stringify(normalized.pack, null, 2)}\n`;
  if (format === 'xpspack' && !hasErrors(diagnostics)) {
    const assets = await collectXpspackAssets(source, input.baseDir);
    const built = await buildXpspack(
      normalized.pack,
      compression,
      options.signing,
      assets,
      options.chunks
    );
    artifact = built.bytes;
    manifest = built.manifest;
    normalized.report.transferredBytes = built.bytes.byteLength;
    normalized.report.chunks = built.manifest.chunks.map(chunk => ({
      id: chunk.id,
      rawBytes: chunk.uncompressedBytes,
      storedBytes: chunk.storedBytes,
      compression: chunk.compression,
    }));
  } else if (format === 'xpspack') {
    normalized.report.transferredBytes = 0;
  }
  if (!options.check && !hasErrors(diagnostics)) {
    output = path.resolve(
      options.output ??
        path.join(
          input.baseDir,
          'dist',
          format === 'xpspack' ? `${normalized.pack.id}.xpspack` : 'content-pack.json'
        )
    );
    await mkdir(path.dirname(output), { recursive: true });
    if (typeof artifact === 'string') await writeFile(output, artifact, 'utf8');
    else await writeFile(output, artifact);
  }
  return {
    ok: !hasErrors(diagnostics),
    diagnostics,
    pack: normalized.pack,
    report: normalized.report,
    format,
    ...(manifest ? { manifest } : {}),
    ...(output ? { output } : {}),
  };
};
