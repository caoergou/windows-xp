import { describe, expect, it } from 'vitest';
import { calculateWindowLayout } from '../src/utils/windowLayout';

describe('calculateWindowLayout', () => {
  it('cascades visible windows with XP caption-height offsets', () => {
    expect(calculateWindowLayout(3, 'cascade', { width: 900, height: 600 })).toEqual([
      { left: 0, top: 0, width: 834, height: 534 },
      { left: 22, top: 22, width: 834, height: 534 },
      { left: 44, top: 44, width: 834, height: 534 },
    ]);
  });

  it('tiles horizontally without leaving remainder pixels unused', () => {
    expect(calculateWindowLayout(3, 'tile-horizontal', { width: 901, height: 602 })).toEqual([
      { left: 0, top: 0, width: 901, height: 200 },
      { left: 0, top: 200, width: 901, height: 200 },
      { left: 0, top: 400, width: 901, height: 202 },
    ]);
  });

  it('tiles vertically and ignores empty work areas', () => {
    expect(calculateWindowLayout(2, 'tile-vertical', { width: 901, height: 600 })).toEqual([
      { left: 0, top: 0, width: 450, height: 600 },
      { left: 450, top: 0, width: 451, height: 600 },
    ]);
    expect(calculateWindowLayout(0, 'cascade', { width: 900, height: 600 })).toEqual([]);
  });
});
