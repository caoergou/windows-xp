// Minesweeper types (#163/A).

export type Difficulty = 'beginner' | 'intermediate' | 'expert';
export type GameStatus = 'new' | 'playing' | 'won' | 'lost';
export type OpenMenu = 'game' | 'help' | null;

export interface CellData {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isQuestioned: boolean;
  isExploded: boolean;
  value: number;
}

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}
