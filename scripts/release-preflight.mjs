#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(REPO, relative), 'utf8'));
const engine = readJson('package.json');
const tools = readJson('tools/scenario-tools/package.json');
const lock = readJson('package-lock.json');
const changelog = fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8');
const requestedTag =
  process.argv.find(argument => argument.startsWith('--tag='))?.slice('--tag='.length) ??
  process.env.GITHUB_REF_NAME;

const errors = [];
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) errors.push(`${label}: expected ${expected}, got ${actual}`);
};

requireEqual(lock.version, engine.version, 'package-lock root version');
requireEqual(lock.packages[''].version, engine.version, 'package-lock package version');
requireEqual(
  lock.packages['tools/scenario-tools'].version,
  tools.version,
  'package-lock scenario-tools version'
);
requireEqual(
  lock.packages['tools/scenario-tools'].peerDependencies['@caoergou/windows-xp'],
  tools.peerDependencies['@caoergou/windows-xp'],
  'package-lock scenario-tools peer range'
);

requireEqual(
  tools.peerDependencies['@caoergou/windows-xp'],
  `^${engine.version}`,
  'scenario-tools engine peer range'
);
if (!changelog.includes(`## [${engine.version}] - `)) {
  errors.push(`CHANGELOG.md has no dated ${engine.version} release section`);
}
if (requestedTag) requireEqual(requestedTag, `v${engine.version}`, 'release tag');

if (errors.length > 0) {
  errors.forEach(error => console.error(`✗ ${error}`));
  process.exit(1);
}

console.log(
  `✓ release metadata is consistent: ${engine.name}@${engine.version}, ${tools.name}@${tools.version}`
);
