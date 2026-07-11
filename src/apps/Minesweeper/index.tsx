import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  XPMenuBar as SharedMenuBar,
  XPMenuBarItem as SharedMenuButton,
  XPMenuSlot as SharedMenuSlot,
  XPMenuDropdown as SharedDropdown,
  XPMenuDropdownItem as SharedDropdownItem,
  XPMenuSeparator as SharedMenuSeparator,
  XPMenuMark as SharedMenuMark,
} from '../../components/XPMenuBar';
import { useTranslation } from 'react-i18next';
import { useWindowManager } from '../../context/WindowManagerContext';
import {
  numberSprites,
  digitSprites,
  configs,
  difficultyKeys,
  empty,
  flag,
  mineCeil,
  mineDeath,
  misflagged,
  question,
  checked,
  smile,
  ohh,
  dead,
  win,
} from './constants';
import {
  createBoard,
  cloneBoard,
  getNeighbors,
  placeMines,
  revealSafeRegion,
  revealLoss,
  isWon,
  flagAllMines,
  formatCounter,
} from './game';
import {
  Wrap,
  MenuCheck,
  GamePanel,
  ScoreBar,
  Counter,
  Digit,
  FaceOuter,
  FaceButton,
  FaceIcon,
  Board,
  Cell,
  CoveredBackground,
  RevealedBackground,
  CellIcon,
  AboutDialog,
  AboutTitle,
  AboutContent,
  AboutActions,
  DialogButton,
} from './styled';
import type { Difficulty, GameStatus, OpenMenu, CellData } from './types';

const Minesweeper = ({ windowId }: { windowId?: string }) => {
  const { t, i18n } = useTranslation();
  const { closeWindow, resizeWindow, setWindowTitle } = useWindowManager();
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [board, setBoard] = useState<CellData[][]>([]);
  const [flags, setFlags] = useState(0);
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState<GameStatus>('new');
  const [firstClick, setFirstClick] = useState(true);
  const [face, setFace] = useState<'smile' | 'ohh' | 'dead' | 'win'>('smile');
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingChordRef = useRef<string | null>(null);

  const config = configs[difficulty];

  const initBoard = useCallback(() => {
    setBoard(createBoard(configs[difficulty]));
    setFlags(0);
    setTime(0);
    setStatus('new');
    setFirstClick(true);
    setFace('smile');
    pendingChordRef.current = null;
  }, [difficulty]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  useEffect(() => {
    if (windowId) setWindowTitle(windowId, t('apps.minesweeper'));
  }, [i18n.language, setWindowTitle, t, windowId]);

  useEffect(() => {
    if (status !== 'playing' || time >= 999) return undefined;

    const timer = window.setInterval(() => {
      setTime(seconds => Math.min(999, seconds + 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, time]);

  useEffect(() => {
    const closeMenuWhenClickingElsewhere = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', closeMenuWhenClickingElsewhere);
    return () => document.removeEventListener('mousedown', closeMenuWhenClickingElsewhere);
  }, []);

  useLayoutEffect(() => {
    if (!windowId || !contentRef.current || board.length === 0) return;

    // Window chrome: 3px on each side, a 25px title bar, and 3px at the bottom.
    resizeWindow(
      windowId,
      contentRef.current.offsetWidth + 6,
      contentRef.current.offsetHeight + 31
    );
  }, [board.length, difficulty, resizeWindow, windowId]);

  const endWithLoss = useCallback((nextBoard: CellData[][], row: number, col: number) => {
    revealLoss(nextBoard, row, col);
    setStatus('lost');
    setFace('dead');
  }, []);

  const endWithWin = useCallback(
    (nextBoard: CellData[][]) => {
      flagAllMines(nextBoard);
      setFlags(configs[difficulty].mines);
      setStatus('won');
      setFace('win');
    },
    [difficulty]
  );

  const revealCell = useCallback(
    (row: number, col: number) => {
      if (status === 'won' || status === 'lost') return;

      setBoard(previousBoard => {
        const target = previousBoard[row]?.[col];
        if (!target || target.isRevealed || target.isFlagged) return previousBoard;

        const nextBoard = cloneBoard(previousBoard);
        if (firstClick) {
          placeMines(nextBoard, row, col, config);
          setFirstClick(false);
        }

        const selected = nextBoard[row][col];
        if (selected.isMine) {
          endWithLoss(nextBoard, row, col);
          return nextBoard;
        }

        revealSafeRegion(nextBoard, row, col, config);
        if (isWon(nextBoard)) {
          endWithWin(nextBoard);
        } else if (firstClick) {
          setStatus('playing');
        }

        return nextBoard;
      });
    },
    [config, endWithLoss, endWithWin, firstClick, status]
  );

  const chordCell = useCallback(
    (row: number, col: number) => {
      if (status !== 'playing') return;

      setBoard(previousBoard => {
        const selected = previousBoard[row]?.[col];
        if (!selected?.isRevealed || selected.value <= 0) return previousBoard;

        const neighbors = getNeighbors(row, col, config);
        const flagCount = neighbors.filter(
          ([neighborRow, neighborCol]) => previousBoard[neighborRow][neighborCol].isFlagged
        ).length;
        if (flagCount !== selected.value) return previousBoard;

        const nextBoard = cloneBoard(previousBoard);
        const mine = neighbors.find(([neighborRow, neighborCol]) => {
          const neighbor = nextBoard[neighborRow][neighborCol];
          return neighbor.isMine && !neighbor.isFlagged;
        });

        if (mine) {
          endWithLoss(nextBoard, mine[0], mine[1]);
          return nextBoard;
        }

        neighbors.forEach(([neighborRow, neighborCol]) => {
          revealSafeRegion(nextBoard, neighborRow, neighborCol, config);
        });

        if (isWon(nextBoard)) endWithWin(nextBoard);
        return nextBoard;
      });
    },
    [config, endWithLoss, endWithWin, status]
  );

  const handleRightClick = useCallback(
    (event: React.MouseEvent, row: number, col: number) => {
      event.preventDefault();
      if (status === 'won' || status === 'lost') return;

      setBoard(previousBoard => {
        const nextBoard = cloneBoard(previousBoard);
        const cell = nextBoard[row][col];
        if (cell.isRevealed) return previousBoard;

        if (!cell.isFlagged && !cell.isQuestioned) {
          cell.isFlagged = true;
          setFlags(currentFlags => currentFlags + 1);
        } else if (cell.isFlagged) {
          cell.isFlagged = false;
          cell.isQuestioned = true;
          setFlags(currentFlags => currentFlags - 1);
        } else {
          cell.isQuestioned = false;
        }

        return nextBoard;
      });
    },
    [status]
  );

  const handleCellMouseDown = useCallback(
    (event: React.MouseEvent, row: number, col: number, cell: CellData) => {
      if (status === 'won' || status === 'lost') return;

      if ((event.buttons & 3) === 3 && cell.isRevealed && cell.value > 0) {
        event.preventDefault();
        pendingChordRef.current = `${row}-${col}`;
        setFace('ohh');
        return;
      }

      if (event.button === 0) setFace('ohh');
    },
    [status]
  );

  const handleCellMouseUp = useCallback(
    (row: number, col: number) => {
      const chordKey = `${row}-${col}`;
      if (pendingChordRef.current === chordKey) {
        pendingChordRef.current = null;
        chordCell(row, col);
      }

      if (status !== 'won' && status !== 'lost') setFace('smile');
    },
    [chordCell, status]
  );

  const resetGame = useCallback(() => {
    setOpenMenu(null);
    initBoard();
  }, [initBoard]);

  const selectDifficulty = useCallback((nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
    setOpenMenu(null);
  }, []);

  const exitGame = useCallback(() => {
    setOpenMenu(null);
    if (windowId) closeWindow(windowId);
  }, [closeWindow, windowId]);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setAboutOpen(false);
      } else if (event.key === 'F2') {
        event.preventDefault();
        resetGame();
      } else if (event.altKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setOpenMenu(current => (current === 'game' ? null : 'game'));
      } else if (event.altKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setOpenMenu(current => (current === 'help' ? null : 'help'));
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [resetGame]);

  const faceSrc = face === 'smile' ? smile : face === 'ohh' ? ohh : face === 'dead' ? dead : win;
  const mineCounter = formatCounter(config.mines - flags);
  const timeCounter = formatCounter(time);

  const renderCounter = (counter: string) =>
    counter
      .split('')
      .map((digit, index) => (
        <Digit key={`${digit}-${index}`} src={digitSprites[digit]} alt="" draggable={false} />
      ));

  return (
    <Wrap
      ref={contentRef}
      onContextMenu={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <SharedMenuBar ref={menuRef}>
        <SharedMenuSlot>
          <SharedMenuButton
            type="button"
            $active={openMenu === 'game'}
            onClick={() => setOpenMenu(current => (current === 'game' ? null : 'game'))}
          >
            {t('minesweeper.menu.game')}
          </SharedMenuButton>
          {openMenu === 'game' && (
            <SharedDropdown role="menu">
              <SharedDropdownItem type="button" role="menuitem" onClick={resetGame}>
                <SharedMenuMark />
                {t('minesweeper.menuItems.new')}
              </SharedDropdownItem>
              <SharedMenuSeparator />
              {difficultyKeys.map(option => (
                <SharedDropdownItem
                  key={option}
                  type="button"
                  role="menuitemradio"
                  aria-checked={difficulty === option}
                  onClick={() => selectDifficulty(option)}
                >
                  <SharedMenuMark>{difficulty === option && <MenuCheck src={checked} alt="" />}</SharedMenuMark>
                  {t(`minesweeper.menuItems.${option}`)}
                </SharedDropdownItem>
              ))}
              <SharedMenuSeparator />
              <SharedDropdownItem type="button" role="menuitem" onClick={exitGame}>
                <SharedMenuMark />
                {t('minesweeper.menuItems.exit')}
              </SharedDropdownItem>
            </SharedDropdown>
          )}
        </SharedMenuSlot>
        <SharedMenuSlot>
          <SharedMenuButton
            type="button"
            $active={openMenu === 'help'}
            onClick={() => setOpenMenu(current => (current === 'help' ? null : 'help'))}
          >
            {t('minesweeper.menu.help')}
          </SharedMenuButton>
          {openMenu === 'help' && (
            <SharedDropdown role="menu">
              <SharedDropdownItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setAboutOpen(true);
                  setOpenMenu(null);
                }}
              >
                <SharedMenuMark />
                {t('minesweeper.menuItems.about')}
              </SharedDropdownItem>
            </SharedDropdown>
          )}
        </SharedMenuSlot>
      </SharedMenuBar>

      <GamePanel>
        <ScoreBar>
          <Counter>{renderCounter(mineCounter)}</Counter>
          <FaceOuter>
            <FaceButton
              type="button"
              onClick={resetGame}
              aria-label={t('minesweeper.aria.newGame')}
            >
              <FaceIcon src={faceSrc} alt="" draggable={false} />
            </FaceButton>
          </FaceOuter>
          <Counter>{renderCounter(timeCounter)}</Counter>
        </ScoreBar>

        <Board $cols={config.cols} $rows={config.rows}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isWrongFlag = status === 'lost' && cell.isFlagged && !cell.isMine;
              const isVisibleMine = status === 'lost' && cell.isMine && !cell.isFlagged;
              const isRevealed = cell.isRevealed || isWrongFlag;
              let icon: string | null = null;

              if (cell.isExploded) {
                icon = mineDeath;
              } else if (isWrongFlag) {
                icon = misflagged;
              } else if (isVisibleMine) {
                icon = mineCeil;
              } else if (cell.isRevealed && cell.value > 0) {
                icon = numberSprites[cell.value];
              } else if (cell.isFlagged) {
                icon = flag;
              } else if (cell.isQuestioned) {
                icon = question;
              } else if (cell.isRevealed) {
                icon = empty;
              }

              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  data-testid={`minesweeper-cell-${rowIndex}-${colIndex}`}
                  data-revealed={cell.isRevealed}
                  data-flagged={cell.isFlagged}
                  $covered={!isRevealed}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={event => handleRightClick(event, rowIndex, colIndex)}
                  onMouseDown={event => handleCellMouseDown(event, rowIndex, colIndex, cell)}
                  onMouseUp={() => handleCellMouseUp(rowIndex, colIndex)}
                  onMouseLeave={() => {
                    pendingChordRef.current = null;
                    if (status !== 'won' && status !== 'lost') setFace('smile');
                  }}
                >
                  {!isRevealed && <CoveredBackground />}
                  {isRevealed && <RevealedBackground />}
                  {icon && <CellIcon src={icon} alt="" draggable={false} />}
                </Cell>
              );
            })
          )}
        </Board>
      </GamePanel>

      {aboutOpen && (
        <AboutDialog role="dialog" aria-modal="true" aria-label={t('minesweeper.about.title')}>
          <AboutTitle>{t('minesweeper.about.title')}</AboutTitle>
          <AboutContent>{t('minesweeper.about.message')}</AboutContent>
          <AboutActions>
            <DialogButton type="button" autoFocus onClick={() => setAboutOpen(false)}>
              {t('minesweeper.about.ok')}
            </DialogButton>
          </AboutActions>
        </AboutDialog>
      )}
    </Wrap>
  );
};

export default Minesweeper;
