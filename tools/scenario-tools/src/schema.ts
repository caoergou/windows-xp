import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import contentPackSchema from '../../../schema/content-pack.json';
import scenarioSchema from '../../../schema/scenario.json';
import xpspackManifestSchema from '../../../schema/xpspack-manifest.json';
import type { XpspackManifestV1 } from './distribution';
import type { Diagnostic } from './types';
import { diagnostic } from './types';

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validateScenarioJson = ajv.compile(scenarioSchema);
const validateContentPackJson = ajv.compile(contentPackSchema);
const validateXpspackManifestJson = ajv.compile(xpspackManifestSchema);

const pathFor = (error: ErrorObject): string => {
  const base = error.instancePath ? `$${error.instancePath.replace(/\//g, '.')}` : '$';
  const missing =
    error.keyword === 'required' && typeof error.params.missingProperty === 'string'
      ? `.${error.params.missingProperty}`
      : '';
  return `${base}${missing}`;
};

const run = (validator: ValidateFunction, value: unknown, code: string): Diagnostic[] => {
  if (validator(value)) return [];
  return (validator.errors ?? []).map(error =>
    diagnostic(
      'error',
      code,
      `${error.message ?? 'does not match JSON Schema'}${
        error.keyword === 'enum'
          ? `; allowed: ${(error.params.allowedValues as unknown[]).join(', ')}`
          : ''
      }`,
      pathFor(error)
    )
  );
};

export const validateScenarioSchema = (value: unknown): Diagnostic[] =>
  run(validateScenarioJson, value, 'scenario-schema');

export const validateContentPackSchema = (value: unknown): Diagnostic[] =>
  run(validateContentPackJson, value, 'pack-schema');

export const validateXpspackManifestSchema = (value: unknown): Diagnostic[] =>
  run(validateXpspackManifestJson, value, 'xpspack-manifest-schema');

const unsafeArchivePath = (value: string): boolean =>
  value.startsWith('/') ||
  value.includes('\\') ||
  value.includes('\0') ||
  value.split('/').some(segment => segment === '' || segment === '.' || segment === '..');

/** Validates both the JSON shape and the v1 cross-entry security invariants. */
export const validateXpspackManifest = (value: unknown): Diagnostic[] => {
  const diagnostics = validateXpspackManifestSchema(value);
  if (diagnostics.length > 0) return diagnostics;
  const manifest = value as XpspackManifestV1;
  const entries = [...manifest.chunks, ...manifest.assets];
  const ids = new Set<string>();
  const paths = new Set<string>();
  entries.forEach((entry, index) => {
    const area = index < manifest.chunks.length ? 'chunks' : 'assets';
    const itemIndex = area === 'chunks' ? index : index - manifest.chunks.length;
    const itemPath = `$.${area}.${itemIndex}`;
    if (ids.has(entry.id)) {
      diagnostics.push(
        diagnostic(
          'error',
          'xpspack-duplicate-id',
          `duplicate entry id: ${entry.id}`,
          `${itemPath}.id`
        )
      );
    }
    ids.add(entry.id);
    if (paths.has(entry.path)) {
      diagnostics.push(
        diagnostic(
          'error',
          'xpspack-duplicate-path',
          `duplicate archive path: ${entry.path}`,
          `${itemPath}.path`
        )
      );
    }
    paths.add(entry.path);
    if (unsafeArchivePath(entry.path)) {
      diagnostics.push(
        diagnostic(
          'error',
          'xpspack-unsafe-path',
          `unsafe archive path: ${entry.path}`,
          `${itemPath}.path`
        )
      );
    }
  });
  if (manifest.chunks.filter(chunk => chunk.id === manifest.rootChunk).length !== 1) {
    diagnostics.push(
      diagnostic(
        'error',
        'xpspack-root-chunk',
        `rootChunk must identify exactly one chunk: ${manifest.rootChunk}`,
        '$.rootChunk'
      )
    );
  }
  return diagnostics;
};
