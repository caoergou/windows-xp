import path from 'node:path';
import type { AuthoringSnapshot, PackAuthoringCommand } from './serveProtocol';
import { packDirectory, type PackSizeReport } from './pack';
import type { LoadedInput } from './types';

export interface StudioPackReceipt {
  mode: 'estimate' | 'export';
  format: PackAuthoringCommand['format'];
  compression: PackAuthoringCommand['compression'];
  filename: string;
  signed: false;
  report: PackSizeReport;
  output?: string;
}

const gateFailure = (snapshot: AuthoringSnapshot): string | null => {
  if (snapshot.reload.status !== 'current') return 'the current draft is stale or reloading';
  const failed = [
    ['lint', snapshot.lint.status],
    ['solve', snapshot.solve.status],
    ['pack', snapshot.pack.status],
  ].find(([, status]) => status !== 'pass');
  return failed ? `${failed[0]} gate is ${failed[1]}` : null;
};

/** Execute Studio exports through the same packer used by the headless CLI. */
export const runStudioPackCommand = async (
  input: LoadedInput,
  snapshot: AuthoringSnapshot,
  command: PackAuthoringCommand
): Promise<StudioPackReceipt> => {
  if (input.kind !== 'pack') {
    throw new Error('Studio export requires a ContentPack input');
  }
  const blocked = gateFailure(snapshot);
  if (blocked) throw new Error(`Studio export is blocked: ${blocked}`);
  if (command.format === 'json' && command.compression !== 'none') {
    throw new Error('JSON export does not support payload compression');
  }

  const result = await packDirectory(input.file, {
    check: command.type === 'pack-estimate',
    format: command.format,
    compression: command.compression,
  });
  if (!result.ok) {
    const first = result.diagnostics.find(item => item.level === 'error');
    throw new Error(`Studio export failed${first ? ` [${first.code}]: ${first.message}` : ''}`);
  }

  const filename =
    result.output === undefined
      ? command.format === 'xpspack'
        ? `${result.pack.id}.xpspack`
        : 'content-pack.json'
      : path.basename(result.output);
  return {
    mode: command.type === 'pack-estimate' ? 'estimate' : 'export',
    format: result.format,
    compression: command.compression,
    filename,
    signed: false,
    report: result.report,
    ...(result.output ? { output: result.output } : {}),
  };
};
