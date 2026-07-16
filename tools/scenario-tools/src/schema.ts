import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import contentPackSchema from '../../../schema/content-pack.json';
import scenarioSchema from '../../../schema/scenario.json';
import type { Diagnostic } from './types';
import { diagnostic } from './types';

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validateScenarioJson = ajv.compile(scenarioSchema);
const validateContentPackJson = ajv.compile(contentPackSchema);

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
