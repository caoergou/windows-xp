#!/usr/bin/env node
/**
 * Install the exact engine and scenario-tools release tarballs into a clean
 * authoring project, then exercise every core CLI path against a real pack.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [engineArg, toolsArg] = process.argv.slice(2);

if (!engineArg || !toolsArg) {
  console.error(
    'Usage: node scripts/scenario-tools-consumer-smoke.mjs <windows-xp.tgz> <xp-scenario-tools.tgz>'
  );
  process.exit(2);
}

const engineTarball = path.resolve(engineArg);
const toolsTarball = path.resolve(toolsArg);
for (const tarball of [engineTarball, toolsTarball]) {
  if (!fs.existsSync(tarball)) throw new Error(`Release artifact not found: ${tarball}`);
}

const log = message => console.log(`\x1b[36m[scenario-consumer-smoke]\x1b[0m ${message}`);
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xp-scenario-consumer-'));
try {
  fs.writeFileSync(
    path.join(tmp, 'package.json'),
    JSON.stringify({ name: 'xp-scenario-consumer-smoke', private: true }, null, 2)
  );
  fs.cpSync(path.join(REPO, 'examples', 'midsummer-pack'), path.join(tmp, 'story'), {
    recursive: true,
  });

  log('installing both release artifacts into a clean authoring project…');
  run('npm', ['install', '--no-audit', '--no-fund', engineTarball, toolsTarball], tmp);

  const cli = path.join(tmp, 'node_modules', '.bin', 'xp-scenario');
  log('running lint, solve, graph, and pack --check…');
  run(cli, ['lint', './story'], tmp);
  run(cli, ['solve', './story', '--expect', 'album_open'], tmp);
  run(cli, ['graph', './story', '--format', 'json', '--out', './graph.json'], tmp);
  run(cli, ['pack', './story', '--check'], tmp);

  const graph = JSON.parse(fs.readFileSync(path.join(tmp, 'graph.json'), 'utf8'));
  if (!graph || typeof graph !== 'object') throw new Error('graph command produced invalid JSON');
  console.log('\n\x1b[32mscenario-consumer-smoke OK — the CLI tarball is usable.\x1b[0m');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
