// Minesweeper game logic (#163/A+E) — pure functions extracted from the app so
// board generation, flood-reveal, and win/loss detection are unit-testable.
import type { CellData, GameConfig } from './types';

export const createBoard = (config: GameConfig): CellData[][] =>
  Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      isQuestioned: false,
      isExploded: false,
      value: 0,
    }))
  );

export const cloneBoard = (board: CellData[][]): CellData[][] =>
  board.map(row => row.map(cell => ({ ...cell })));

export const getNeighbors = (
  row: number,
  col: number,
  config: GameConfig
): Array<[number, number]> => {
  const neighbors: Array<[number, number]> = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < config.rows && nextCol >= 0 && nextCol < config.cols) {
        neighbors.push([nextRow, nextCol]);
      }
    }
  }

  return neighbors;
};

export const placeMines = (
  board: CellData[][],
  excludedRow: number,
  excludedCol: number,
  config: GameConfig
) => {
  let minesPlaced = 0;

  while (minesPlaced < config.mines) {
    const row = Math.floor(Math.random() * config.rows);
    const col = Math.floor(Math.random() * config.cols);
    const cell = board[row][col];

    if ((row === excludedRow && col === excludedCol) || cell.isMine) continue;

    cell.isMine = true;
    minesPlaced += 1;

    getNeighbors(row, col, config).forEach(([neighborRow, neighborCol]) => {
      const neighbor = board[neighborRow][neighborCol];
      if (!neighbor.isMine) neighbor.value += 1;
    });
  }
};

export const revealSafeRegion = (
  board: CellData[][],
  row: number,
  col: number,
  config: GameConfig
) => {
  const queue: Array<[number, number]> = [[row, col]];

  while (queue.length > 0) {
    const [currentRow, currentCol] = queue.pop() as [number, number];
    const cell = board[currentRow][currentCol];

    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

    cell.isRevealed = true;

    if (cell.value === 0) {
      getNeighbors(currentRow, currentCol, config).forEach(([neighborRow, neighborCol]) => {
        const neighbor = board[neighborRow][neighborCol];
        if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
          queue.push([neighborRow, neighborCol]);
        }
      });
    }
  }
};

export const revealLoss = (board: CellData[][], explodedRow: number, explodedCol: number) => {
  board.forEach(row =>
    row.forEach(cell => {
      if (cell.isMine && !cell.isFlagged) cell.isRevealed = true;
    })
  );

  const exploded = board[explodedRow][explodedCol];
  exploded.isRevealed = true;
  exploded.isExploded = true;
};

export const isWon = (board: CellData[][]) =>
  board.every(row => row.every(cell => cell.isMine || cell.isRevealed));

export const flagAllMines = (board: CellData[][]) => {
  board.forEach(row =>
    row.forEach(cell => {
      if (cell.isMine) {
        cell.isFlagged = true;
        cell.isQuestioned = false;
      }
    })
  );
};

export const formatCounter = (value: number): string => {
  if (value < 0) return `-${String(Math.min(99, Math.abs(value))).padStart(2, '0')}`;
  return String(Math.min(999, value)).padStart(3, '0');
};
