export type WindowArrangement = 'cascade' | 'tile-horizontal' | 'tile-vertical';

export interface WindowWorkArea {
  width: number;
  height: number;
}

export interface WindowLayoutRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const CASCADE_OFFSET = 22;

export const calculateWindowLayout = (
  count: number,
  arrangement: WindowArrangement,
  workArea: WindowWorkArea
): WindowLayoutRect[] => {
  if (count <= 0 || workArea.width <= 0 || workArea.height <= 0) return [];

  if (arrangement === 'cascade') {
    const visibleSteps = Math.max(1, Math.min(count, 10));
    const width = Math.max(1, workArea.width - CASCADE_OFFSET * visibleSteps);
    const height = Math.max(1, workArea.height - CASCADE_OFFSET * visibleSteps);
    return Array.from({ length: count }, (_, index) => {
      const step = index % visibleSteps;
      return { left: step * CASCADE_OFFSET, top: step * CASCADE_OFFSET, width, height };
    });
  }

  if (arrangement === 'tile-horizontal') {
    const baseHeight = Math.floor(workArea.height / count);
    return Array.from({ length: count }, (_, index) => {
      const top = baseHeight * index;
      const height = index === count - 1 ? workArea.height - top : baseHeight;
      return { left: 0, top, width: workArea.width, height };
    });
  }

  const baseWidth = Math.floor(workArea.width / count);
  return Array.from({ length: count }, (_, index) => {
    const left = baseWidth * index;
    const width = index === count - 1 ? workArea.width - left : baseWidth;
    return { left, top: 0, width, height: workArea.height };
  });
};
