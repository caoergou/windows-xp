import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import empty from '../assets/games/minesweeper/empty.png';
import open1 from '../assets/games/minesweeper/open1.png';
import open2 from '../assets/games/minesweeper/open2.png';
import open3 from '../assets/games/minesweeper/open3.png';
import open4 from '../assets/games/minesweeper/open4.png';
import open5 from '../assets/games/minesweeper/open5.png';
import open6 from '../assets/games/minesweeper/open6.png';
import open7 from '../assets/games/minesweeper/open7.png';
import open8 from '../assets/games/minesweeper/open8.png';
import flag from '../assets/games/minesweeper/flag.png';
import mineDeath from '../assets/games/minesweeper/mine-death.png';
import question from '../assets/games/minesweeper/question.png';
import smile from '../assets/games/minesweeper/smile.png';
import ohh from '../assets/games/minesweeper/ohh.png';
import dead from '../assets/games/minesweeper/dead.png';
import win from '../assets/games/minesweeper/win.png';
import digit0 from '../assets/games/minesweeper/digit0.png';
import digit1 from '../assets/games/minesweeper/digit1.png';
import digit2 from '../assets/games/minesweeper/digit2.png';
import digit3 from '../assets/games/minesweeper/digit3.png';
import digit4 from '../assets/games/minesweeper/digit4.png';
import digit5 from '../assets/games/minesweeper/digit5.png';
import digit6 from '../assets/games/minesweeper/digit6.png';
import digit7 from '../assets/games/minesweeper/digit7.png';
import digit8 from '../assets/games/minesweeper/digit8.png';
import digit9 from '../assets/games/minesweeper/digit9.png';
import digitMinus from '../assets/games/minesweeper/digit-.png';

const CELL_SIZE = 16;
const FACE_SIZE = 26;

const numberSprites: Record<number, string> = {
  0: open1, 1: open1, 2: open2, 3: open3, 4: open4,
  5: open5, 6: open6, 7: open7, 8: open8,
};

const digitSprites: Record<string, string> = {
  '0': digit0, '1': digit1, '2': digit2, '3': digit3, '4': digit4,
  '5': digit5, '6': digit6, '7': digit7, '8': digit8, '9': digit9,
  '-': digitMinus,
};

const Wrap = styled.div`
  width: fit-content;
  background: #d4d0c8;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-start;
  padding: 6px;
  box-sizing: border-box;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 11px;
  user-select: none;
`;

const MenuBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 2px 8px;
  margin-bottom: 6px;
  color: #000000;
  border-bottom: 1px solid #d4d0c8;
`;

const MenuItem = styled.button`
  background: transparent;
  border: none;
  color: #000000;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  padding: 2px 6px;

  &:hover {
    background: #0a2463;
    color: #ffffff;
  }
`;

const Panel = styled.div`
  display: inline-block;
  vertical-align: top;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  padding: 6px;
  background: #d4d0c8;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  background: #d4d0c8;
  padding: 4px 6px;
  margin-bottom: 6px;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
`;

const Counter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  height: 24px;
  width: 40px;
  flex-shrink: 0;
  background: transparent;
  border-width: 0 1px 1px 0;
  border-style: solid;
  border-color: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
`;

const Digit = styled.img`
  height: 23px;
  width: 13px;
  flex-shrink: 0;
  image-rendering: pixelated;
  display: block;
`;

const FaceButton = styled.button`
  width: ${FACE_SIZE}px;
  height: ${FACE_SIZE}px;
  cursor: pointer;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  background: #d4d0c8;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
  }
`;

const FaceIcon = styled.img`
  width: 17px;
  height: 17px;
  image-rendering: pixelated;
`;

const BoardWrapper = styled.div`
  background: #d4d0c8;
  padding: 6px;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 auto;
`;

const Board = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${p => p.$rows}, ${CELL_SIZE}px);
  background: #808080;
  border: 3px solid;
  border-color: #808080 #ffffff #ffffff #808080;
`;

const Cell = styled.button<{ $revealed?: boolean }>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  box-sizing: border-box;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  ${p => !p.$revealed && `
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
    background: #d4d0c8;
  `}

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
  }
`;

const CellIcon = styled.img`
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  display: block;
`;

interface CellData {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isQuestioned: boolean;
  value: number;
}

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

const configs: Record<string, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 }
};

type GameStatus = 'new' | 'playing' | 'won' | 'lost';

const formatCounter = (value: number): string => {
  if (value < 0) return `-${String(Math.abs(value)).padStart(2, '0')}`;
  return String(value).padStart(3, '0');
};

const Minesweeper = ({ windowId }: { windowId?: string }) => {
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [board, setBoard] = useState<CellData[][]>([]);
  const [mines, setMines] = useState<number>(0);
  const [flags, setFlags] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>('new');
  const [firstClick, setFirstClick] = useState<boolean>(true);
  const [face, setFace] = useState<'smile' | 'ohh' | 'dead' | 'win'>('smile');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { resizeWindow } = useWindowManager();

  const initBoard = useCallback(() => {
    const { rows, cols, mines: mineCount } = configs[difficulty];
    const newBoard = Array(rows).fill(undefined).map(() =>
      Array(cols).fill(undefined).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        isQuestioned: false,
        value: 0
      }))
    );
    setBoard(newBoard);
    setMines(mineCount);
    setFlags(0);
    setTime(0);
    setStatus('new');
    setFirstClick(true);
    setFace('smile');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  useEffect(() => {
    if (status === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    if (status !== 'playing' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Resize the window so the board fits tightly for each difficulty.
  useLayoutEffect(() => {
    if (!windowId || !contentRef.current) return;
    const contentWidth = contentRef.current.offsetWidth;
    const contentHeight = contentRef.current.offsetHeight;
    // Window chrome: 3px padding on each side + 25px title bar + 3px bottom padding.
    const chromeWidth = 6;
    const chromeHeight = 31;
    resizeWindow(windowId, contentWidth + chromeWidth, contentHeight + chromeHeight);
  }, [difficulty, windowId, resizeWindow]);

  const revealCell = useCallback((row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c })));

      if (firstClick) {
        // First click safety: place mines after clicking
        let minesPlaced = 0;
        const { rows, cols, mines: mineCount } = configs[difficulty];
        while (minesPlaced < mineCount) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          if ((r === row && c === col) || newBoard[r][c].isMine) continue;
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
        setFirstClick(false);
        setStatus('playing');
      }

      if (newBoard[row][col].isRevealed || newBoard[row][col].isFlagged) return prev;

      const reveal = (r: number, c: number) => {
        if (r < 0 || r >= newBoard.length || c < 0 || c >= newBoard[0].length) return;
        const cell = newBoard[r][c];
        if (cell.isRevealed || cell.isFlagged || cell.isMine) return;
        cell.isRevealed = true;
        if (cell.value === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(r + dr, c + dc);
            }
          }
        }
      };

      const cell = newBoard[row][col];
      if (cell.isMine) {
        cell.isRevealed = true;
        setStatus('lost');
        setFace('dead');
        // Reveal all mines
        for (let r = 0; r < newBoard.length; r++) {
          for (let c = 0; c < newBoard[0].length; c++) {
            if (newBoard[r][c].isMine) {
              newBoard[r][c].isRevealed = true;
            }
          }
        }
      } else {
        reveal(row, col);
      }

      // Check win
      const { rows, cols, mines: mineCount } = configs[difficulty];
      const revealedCount = newBoard.flat().filter(c => c.isRevealed).length;
      if (revealedCount === rows * cols - mineCount) {
        setStatus('won');
        setFace('win');
      }

      return newBoard;
    });
  }, [firstClick, status, difficulty]);

  const handleCellClick = (row: number, col: number) => {
    revealCell(row, col);
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost') return;
    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];
      if (cell.isRevealed) return prev;
      if (!cell.isFlagged && !cell.isQuestioned) {
        cell.isFlagged = true;
        setFlags(f => f + 1);
      } else if (cell.isFlagged) {
        cell.isFlagged = false;
        cell.isQuestioned = true;
        setFlags(f => f - 1);
      } else {
        cell.isQuestioned = false;
      }
      return newBoard;
    });
  };

  const resetGame = () => {
    initBoard();
  };

  const handleMouseDown = () => {
    if (status !== 'lost' && status !== 'won') setFace('ohh');
  };

  const handleMouseUp = () => {
    if (status !== 'lost' && status !== 'won') setFace('smile');
  };

  const faceSrc = face === 'smile' ? smile : face === 'ohh' ? ohh : face === 'dead' ? dead : win;
  const mineCounter = formatCounter(mines - flags);
  const timeCounter = formatCounter(time);

  return (
    <Wrap ref={contentRef}>
      <MenuBar>
        <MenuItem onClick={() => setDifficulty('beginner')}>初级(B)</MenuItem>
        <MenuItem onClick={() => setDifficulty('intermediate')}>中级(I)</MenuItem>
        <MenuItem onClick={() => setDifficulty('expert')}>高级(E)</MenuItem>
      </MenuBar>
      <Panel>
        <Header>
          <Counter>
            {mineCounter.split('').map((d, i) => (
              <Digit key={i} src={digitSprites[d]} alt={d} />
            ))}
          </Counter>
          <FaceButton
            onClick={resetGame}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <FaceIcon src={faceSrc} alt={face} />
          </FaceButton>
          <Counter>
            {timeCounter.split('').map((d, i) => (
              <Digit key={i} src={digitSprites[d]} alt={d} />
            ))}
          </Counter>
        </Header>
        <BoardWrapper>
          <Board $cols={configs[difficulty].cols} $rows={configs[difficulty].rows}>
            {board.map((row, r) =>
              row.map((cell, c) => {
                let icon = null;
                if (cell.isRevealed) {
                  if (cell.isMine) {
                    icon = mineDeath;
                  } else if (cell.value > 0) {
                    icon = numberSprites[cell.value];
                  } else {
                    icon = empty;
                  }
                } else if (cell.isFlagged) {
                  icon = flag;
                } else if (cell.isQuestioned) {
                  icon = question;
                }
                return (
                  <Cell
                    key={`${r}-${c}`}
                    $revealed={cell.isRevealed}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleRightClick(e, r, c)}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {icon && <CellIcon src={icon} alt="" draggable={false} />}
                  </Cell>
                );
              })
            )}
          </Board>
        </BoardWrapper>
      </Panel>
    </Wrap>
  );
};

export default Minesweeper;
