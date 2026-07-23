import { expect, test, describe } from 'vitest';
import { parseCmdArgs, resolveCmdPath } from '../src/utils/commandPath';

const DRIVE_ROOT = ['我的电脑', '本地磁盘 (C:)'];

describe('parseCmdArgs', () => {
  test('splits simple commands', () => {
    expect(parseCmdArgs('md Test')).toEqual(['md', 'Test']);
  });

  test('preserves quoted paths with spaces', () => {
    expect(parseCmdArgs('md "My Folder"')).toEqual(['md', 'My Folder']);
  });

  test('handles multiple quoted arguments', () => {
    expect(parseCmdArgs('ren "old name.txt" "new name.txt"')).toEqual([
      'ren',
      'old name.txt',
      'new name.txt',
    ]);
  });

  test('keeps unquoted text intact', () => {
    expect(parseCmdArgs('echo hello world')).toEqual(['echo', 'hello', 'world']);
  });
});

describe('resolveCmdPath', () => {
  test('resolves absolute C: paths', () => {
    const result = resolveCmdPath('C:\\Windows', DRIVE_ROOT, DRIVE_ROOT);
    expect(result).toEqual([...DRIVE_ROOT, 'Windows']);
  });

  test('resolves C: to current directory', () => {
    const current = [...DRIVE_ROOT, 'Program Files'];
    expect(resolveCmdPath('C:', current, DRIVE_ROOT)).toEqual(current);
  });

  test('resolves C:relative to current directory', () => {
    const current = [...DRIVE_ROOT, 'Program Files'];
    expect(resolveCmdPath('C:Accessories', current, DRIVE_ROOT)).toEqual([
      ...DRIVE_ROOT,
      'Program Files',
      'Accessories',
    ]);
  });

  test('resolves root backslash', () => {
    expect(resolveCmdPath('\\', DRIVE_ROOT, DRIVE_ROOT)).toEqual(DRIVE_ROOT);
  });

  test('resolves a root-relative path from the drive root', () => {
    const current = [...DRIVE_ROOT, 'WINDOWS', 'system32'];
    expect(resolveCmdPath('\\Program Files', current, DRIVE_ROOT)).toEqual([
      ...DRIVE_ROOT,
      'Program Files',
    ]);
  });

  test('resolves relative paths', () => {
    const current = [...DRIVE_ROOT, 'Program Files'];
    expect(resolveCmdPath('Internet Explorer', current, DRIVE_ROOT)).toEqual([
      ...DRIVE_ROOT,
      'Program Files',
      'Internet Explorer',
    ]);
  });

  test('handles parent directory ..\\', () => {
    const current = [...DRIVE_ROOT, 'Program Files', 'Internet Explorer'];
    expect(resolveCmdPath('..\\', current, DRIVE_ROOT)).toEqual([...DRIVE_ROOT, 'Program Files']);
  });

  test('handles current directory .\\', () => {
    const current = [...DRIVE_ROOT, 'Program Files'];
    expect(resolveCmdPath('.\\Accessories', current, DRIVE_ROOT)).toEqual([
      ...DRIVE_ROOT,
      'Program Files',
      'Accessories',
    ]);
  });

  test('strips surrounding quotes', () => {
    const current = [...DRIVE_ROOT, 'My Documents'];
    expect(resolveCmdPath('"My Folder"', current, DRIVE_ROOT)).toEqual([
      ...DRIVE_ROOT,
      'My Documents',
      'My Folder',
    ]);
  });
});
