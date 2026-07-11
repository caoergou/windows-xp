/**
 * Explorer helper unit test (#163/A+E).
 */
import { describe, it, expect } from 'vitest';
import { isOpticalDrive } from '../src/apps/Explorer/helpers';

describe('Explorer helpers (#163)', () => {
  it('isOpticalDrive matches CD/DVD drive keys, not hard disks', () => {
    expect(isOpticalDrive('DVD/CD-RW Drive (E:)')).toBe(true);
    expect(isOpticalDrive('CD-ROM (F:)')).toBe(true);
    expect(isOpticalDrive('本地磁盘 (C:)')).toBe(false);
    expect(isOpticalDrive('Local Disk (D:)')).toBe(false);
  });
});
