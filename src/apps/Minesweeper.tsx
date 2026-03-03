import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #d4d0c8;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', Tahoma, sans-serif;
  font-size: 12px;
  user-select: none;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #d4d0c8;
  padding: 4px 8px;
  margin-bottom: 6px;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
`;

const Counter = styled.div`
  background: #000000;
  color: #ff0000;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  padding: 2px 6px;
  min-width: 60px;
  text-align: center;
  border: 1px solid #808080;
`;

const FaceButton = styled.button`
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 16px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;
  background: #d4d0c8;

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding-top: 1px;
    padding-left: 1px;
  }
`;

const BoardWrapper = styled.div`
  background: #d4d0c8;
  padding: 8px;
  border: 1px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  overflow: auto;
`;

const Board = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols}, 24px);
  grid-template-rows: repeat(${p => p.$rows}, 24px);
  gap: 2px;
  background: #808080;
  padding: 2px;
`;

const Cell = styled.button<{ $revealed?: boolean; $flagged?: boolean; $value?: number }>`
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  border: none;
  outline: none;
  background: ${p => {
    if (p.$revealed) {
      return '#d4d0c8';
    }
    return p.$flagged ? '#d4d0c8' : '#d4d0c8';
  }};
  border: ${p => !p.$revealed ? '1px solid #808080' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: ${p => {
    if (p.$value === 1) return '#0000ff';
    if (p.$value === 2) return '#008000';
    if (p.$value === 3) return '#ff0000';
    if (p.$value === 4) return '#000080';
    if (p.$value === 5) return '#800000';
    if (p.$value === 6) return '#008080';
    if (p.$value === 7) return '#000000';
    if (p.$value === 8) return '#808080';
    return '#000000';
  }};

  &:active {
    padding-top: 1px;
    padding-left: 1px;
  }
`;

interface CellData {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  value: number;
}

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

const Minesweeper = ({ windowId }: { windowId?: string }) => {
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [board, setBoard] = useState<CellData[][]>([]);
  const [mines, setMines] = useState<number>(0);
  const [flags, setFlags] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [firstClick, setFirstClick] = useState<boolean>(true);

  const configs: Record<string, GameConfig> = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
  };

  const initBoard = useCallback(() => {
    const { rows, cols, mines: mineCount } = configs[difficulty];
    const newBoard = Array(rows).fill().map(() =>
      Array(cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        value: 0
      }))
    );
    setBoard(newBoard);
    setMines(mineCount);
    setFlags(0);
    setTime(0);
    setGameOver(false);
    setGameWon(false);
    setFirstClick(true);
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!gameOver && !gameWon && !firstClick) {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameOver, gameWon, firstClick]);

  const placeMines = useCallback((excludeRow: number, excludeCol: number) => {
    const { rows, cols, mines: mineCount } = configs[difficulty];
    const newBoard = [...board.map(row => [...row])];
    let minesPlaced = 0;

    while (minesPlaced < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      if (!newBoard[r][c].isMine && (r !== excludeRow || c !== excludeCol)) {
        newBoard[r][c].isMine = true;
        minesPlaced++;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].isMine) {
              newBoard[nr][nc].value++;
            }
          }
        }
      }
    }
    setBoard(newBoard);
  }, [board, difficulty]);

  const revealCell = useCallback((row: number, col: number) => {
    if (gameOver || gameWon) return;
    const newBoard = [...board.map(row => [...row])];

    if (firstClick) {
      placeMines(row, col);
      setFirstClick(false);
      return;
    }

    if (newBoard[row][col].isRevealed || newBoard[row][col].isFlagged) return;

    newBoard[row][col].isRevealed = true;

    if (newBoard[row][col].isMine) {
      setGameOver(true);
      newBoard[row][col].isRevealed = true;
    } else if (newBoard[row][col].value === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < configs[difficulty].rows && nc >= 0 && nc < configs[difficulty].cols) {
            if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
              newBoard[nr][nc].isRevealed = true;
              if (newBoard[nr][nc].value === 0) {
                revealCell(nr, nc);
              }
            }
          }
        }
      }
    }

    setBoard(newBoard);

    const unrevealedCount = newBoard.flat().filter(cell => !cell.isRevealed && !cell.isMine).length;
    if (unrevealedCount === 0) {
      setGameWon(true);
    }
  }, [board, firstClick, gameOver, gameWon, difficulty]);

  const toggleFlag = useCallback((row: number, col: number) => {
    if (gameOver || gameWon) return;
    const newBoard = [...board.map(row => [...row])];

    if (!newBoard[row][col].isRevealed) {
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      setFlags(prev => prev + (newBoard[row][col].isFlagged ? 1 : -1));
      setBoard(newBoard);
    }
  }, [board, gameOver, gameWon]);

  const handleCellClick = (row: number, col: number) => {
    revealCell(row, col);
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    toggleFlag(row, col);
  };

  const resetGame = () => {
    initBoard();
  };

  const faceEmoji = gameOver ? '😵' : gameWon ? '😎' : '😊';

  return (
    <Wrap>
      <Header>
        <Counter>{mines - flags}</Counter>
        <FaceButton onClick={resetGame}>{faceEmoji}</FaceButton>
        <Counter>{time}</Counter>
      </Header>

      <BoardWrapper>
        <Board $cols={configs[difficulty].cols} $rows={configs[difficulty].rows}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <Cell
                key={`${r}-${c}`}
                $revealed={cell.isRevealed}
                $flagged={cell.isFlagged}
                $value={cell.value}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              >
                {cell.isFlagged ? '🚩' : cell.isRevealed ? (cell.isMine ? '💣' : cell.value > 0 ? cell.value : '') : ''}
              </Cell>
            ))
          )}
        </Board>
      </BoardWrapper>
    </Wrap>
  );
};

export default Minesweeper;
