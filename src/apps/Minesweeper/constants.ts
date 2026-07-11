// Minesweeper constants & sprite assets (#163/A — split out of the app).
import empty from '../../assets/games/minesweeper/empty.png';
import open1 from '../../assets/games/minesweeper/open1.png';
import open2 from '../../assets/games/minesweeper/open2.png';
import open3 from '../../assets/games/minesweeper/open3.png';
import open4 from '../../assets/games/minesweeper/open4.png';
import open5 from '../../assets/games/minesweeper/open5.png';
import open6 from '../../assets/games/minesweeper/open6.png';
import open7 from '../../assets/games/minesweeper/open7.png';
import open8 from '../../assets/games/minesweeper/open8.png';
import flag from '../../assets/games/minesweeper/flag.png';
import mineCeil from '../../assets/games/minesweeper/mine-ceil.png';
import mineDeath from '../../assets/games/minesweeper/mine-death.png';
import misflagged from '../../assets/games/minesweeper/misflagged.png';
import question from '../../assets/games/minesweeper/question.png';
import checked from '../../assets/games/minesweeper/checked.png';
import smile from '../../assets/games/minesweeper/smile.png';
import ohh from '../../assets/games/minesweeper/ohh.png';
import dead from '../../assets/games/minesweeper/dead.png';
import win from '../../assets/games/minesweeper/win.png';
import digit0 from '../../assets/games/minesweeper/digit0.png';
import digit1 from '../../assets/games/minesweeper/digit1.png';
import digit2 from '../../assets/games/minesweeper/digit2.png';
import digit3 from '../../assets/games/minesweeper/digit3.png';
import digit4 from '../../assets/games/minesweeper/digit4.png';
import digit5 from '../../assets/games/minesweeper/digit5.png';
import digit6 from '../../assets/games/minesweeper/digit6.png';
import digit7 from '../../assets/games/minesweeper/digit7.png';
import digit8 from '../../assets/games/minesweeper/digit8.png';
import digit9 from '../../assets/games/minesweeper/digit9.png';
import digitMinus from '../../assets/games/minesweeper/digit-.png';
import type { Difficulty, GameConfig } from './types';

export const CELL_SIZE = 16;

export { empty, flag, mineCeil, mineDeath, misflagged, question, checked, smile, ohh, dead, win };

export const numberSprites: Record<number, string> = {
  1: open1,
  2: open2,
  3: open3,
  4: open4,
  5: open5,
  6: open6,
  7: open7,
  8: open8,
};

export const digitSprites: Record<string, string> = {
  '0': digit0,
  '1': digit1,
  '2': digit2,
  '3': digit3,
  '4': digit4,
  '5': digit5,
  '6': digit6,
  '7': digit7,
  '8': digit8,
  '9': digit9,
  '-': digitMinus,
};

export const configs: Record<Difficulty, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export const difficultyKeys: Difficulty[] = ['beginner', 'intermediate', 'expert'];
