import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cursors = {
  'arrow_r.cur': [0, 0],
  'harrow.cur': [12, 1],
  'beam_r.cur': [15, 16],
  'busy_r.cur': [16, 16],
  'wait_r.cur': [0, 0],
  'help_r.cur': [5, 7],
  'move_r.cur': [15, 16],
  'no_r.cur': [15, 15],
  'cross_r.cur': [15, 16],
  'size1_r.cur': [16, 16],
  'size2_r.cur': [16, 16],
  'size3_r.cur': [16, 16],
  'size4_r.cur': [15, 16],
} as const;

describe('Windows XP cursor assets', () => {
  it.each(Object.entries(cursors))(
    '%s is a 32px CUR with the expected hotspot',
    (file, hotspot) => {
      // #213: the cursor set lives inside the XP theme package (theme owns its assets).
      const bytes = readFileSync(
        join(__dirname, '..', 'src', 'themes', 'xp', 'assets', 'cursors', file)
      );

      expect(bytes.readUInt16LE(2)).toBe(2);
      expect(bytes.readUInt16LE(4)).toBe(1);
      expect(bytes[6]).toBe(32);
      expect(bytes[7]).toBe(32);
      expect([bytes.readUInt16LE(10), bytes.readUInt16LE(12)]).toEqual(hotspot);
    }
  );
});
