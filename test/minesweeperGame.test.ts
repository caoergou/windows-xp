/**
 * Minesweeper game-logic unit tests (#163/A+E).
 *
 * The board generation, flood-reveal and win/loss rules were extracted from the
 * app into pure functions; this exercises their invariants directly (the
 * 831-line app previously had only component-level coverage).
 */
import { describe, it, expect } from 'vitest';
import {
  createBoard,
  getNeighbors,
  placeMines,
  revealSafeRegion,
  revealLoss,
  isWon,
  flagAllMines,
  formatCounter,
} from '../src/apps/Minesweeper/game';
import type { GameConfig, CellData } from '../src/apps/Minesweeper/types';

const cfg: GameConfig = { rows: 9, cols: 9, mines: 10 };

const countMines = (board: CellData[][]) =>
  board.reduce((n, row) => n + row.filter(c => c.isMine).length, 0);

describe('Minesweeper game logic (#163)', () => {
  it('createBoard makes a rows×cols grid of blank cells', () => {
    const board = createBoard(cfg);
    expect(board).toHaveLength(9);
    expect(board[0]).toHaveLength(9);
    expect(board.flat().every(c => !c.isMine && !c.isRevealed && c.value === 0)).toBe(true);
  });

  it('getNeighbors returns 3 for a corner, 8 for an interior cell', () => {
    expect(getNeighbors(0, 0, cfg)).toHaveLength(3);
    expect(getNeighbors(4, 4, cfg)).toHaveLength(8);
  });

  it('placeMines lays exactly `mines`, never on the excluded cell, with correct counts', () => {
    const board = createBoard(cfg);
    placeMines(board, 4, 4, cfg);
    expect(countMines(board)).toBe(cfg.mines);
    expect(board[4][4].isMine).toBe(false);
    // Every non-mine cell's value equals its number of neighboring mines.
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (board[r][c].isMine) continue;
        const mines = getNeighbors(r, c, cfg).filter(([nr, nc]) => board[nr][nc].isMine).length;
        expect(board[r][c].value).toBe(mines);
      }
    }
  });

  it('revealSafeRegion floods a fully-empty board to every cell', () => {
    const board = createBoard(cfg); // no mines → all values 0
    revealSafeRegion(board, 0, 0, cfg);
    expect(board.flat().every(c => c.isRevealed)).toBe(true);
  });

  it('revealSafeRegion stops at numbered borders', () => {
    const board = createBoard(cfg);
    // A single mine at (0,8) makes (0,7)/(1,7)/(1,8) numbered; flooding from the
    // opposite corner reveals the open region but not the mine.
    board[0][8].isMine = true;
    getNeighbors(0, 8, cfg).forEach(([r, c]) => (board[r][c].value += 1));
    revealSafeRegion(board, 8, 0, cfg);
    expect(board[0][8].isRevealed).toBe(false);
    expect(board[8][0].isRevealed).toBe(true);
  });

  it('isWon is true exactly when all non-mine cells are revealed', () => {
    const board = createBoard(cfg);
    board[0][0].isMine = true;
    expect(isWon(board)).toBe(false);
    board.flat().forEach(c => {
      if (!c.isMine) c.isRevealed = true;
    });
    expect(isWon(board)).toBe(true);
  });

  it('revealLoss reveals all mines and marks the exploded one', () => {
    const board = createBoard(cfg);
    board[1][1].isMine = true;
    board[2][2].isMine = true;
    revealLoss(board, 1, 1);
    expect(board[1][1].isRevealed && board[1][1].isExploded).toBe(true);
    expect(board[2][2].isRevealed).toBe(true);
    expect(board[2][2].isExploded).toBe(false);
  });

  it('flagAllMines flags every mine and clears its question mark', () => {
    const board = createBoard(cfg);
    board[3][3].isMine = true;
    board[3][3].isQuestioned = true;
    flagAllMines(board);
    expect(board[3][3].isFlagged).toBe(true);
    expect(board[3][3].isQuestioned).toBe(false);
  });

  it('formatCounter zero-pads to 3 digits and clamps negatives', () => {
    expect(formatCounter(0)).toBe('000');
    expect(formatCounter(7)).toBe('007');
    expect(formatCounter(999)).toBe('999');
    expect(formatCounter(1500)).toBe('999');
    expect(formatCounter(-3)).toBe('-03');
  });
});
