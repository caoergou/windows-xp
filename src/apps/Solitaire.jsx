import React, { useState } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #008000;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', Tahoma, sans-serif;
  font-size: 12px;
  user-select: none;
  color: #ffffff;
`;

const MenuBar = styled.div`
  background: #d4d0c8;
  padding: 2px 8px;
  margin-bottom: 6px;
  color: #000000;
  display: flex;
  gap: 12px;
`;

const MenuItem = styled.button`
  background: transparent;
  border: none;
  color: #000000;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  padding: 2px 6px;

  &:hover {
    background: #0a2463;
    color: #ffffff;
  }
`;

const GameArea = styled.div`
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 10px;
`;

const FoundationArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-right: 20px;
`;

const Foundation = styled.div`
  width: 71px;
  height: 96px;
  background: rgba(0, 255, 0, 0.3);
  border: 2px solid #00ff00;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  position: relative;
`;

const TableauArea = styled.div`
  flex: 1;
  display: flex;
  gap: 10px;
`;

const TableauPile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 71px;
  height: 100%;
  position: relative;
`;

const Card = styled.div`
  width: 71px;
  height: 96px;
  background: ${p => p.$faceUp ? (p.$suit === '♠' || p.$suit === '♣' ? '#ffffff' : '#ffffff') : '#0000ff'};
  border: 1px solid #808080;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  box-sizing: border-box;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: ${p => p.$zIndex || 0};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

const CardRank = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: ${p => p.$suit === '♠' || p.$suit === '♣' ? '#000000' : '#ff0000'};
  margin-bottom: 2px;
`;

const CardSuit = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: ${p => p.$suit === '♠' || p.$suit === '♣' ? '#000000' : '#ff0000'};
`;

const StockArea = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const StockPile = styled.div`
  width: 71px;
  height: 96px;
  background: rgba(0, 255, 0, 0.3);
  border: 2px solid #00ff00;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 255, 0, 0.5);
  }
`;

const WastePile = styled.div`
  width: 71px;
  height: 96px;
  background: rgba(0, 255, 0, 0.3);
  border: 2px solid #00ff00;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Solitaire = ({ windowId }) => {
  const [gameState, setGameState] = useState(() => {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, faceUp: false });
      }
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const tableaus = [];
    for (let i = 0; i < 7; i++) {
      const pile = deck.slice(i * (i + 1), (i + 1) * (i + 2));
      pile[pile.length - 1].faceUp = true;
      tableaus.push(pile);
    }

    return {
      stock: deck.slice(28),
      waste: [],
      foundations: [[], [], [], []],
      tableaus
    };
  });

  const dealCard = () => {
    if (gameState.stock.length === 0) {
      setGameState(prev => ({
        ...prev,
        stock: [...prev.waste.reverse().map(card => ({ ...card, faceUp: false }))],
        waste: []
      }));
    } else {
      const card = gameState.stock[gameState.stock.length - 1];
      setGameState(prev => ({
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, { ...card, faceUp: true }]
      }));
    }
  };

  const resetGame = () => {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, faceUp: false });
      }
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const tableaus = [];
    for (let i = 0; i < 7; i++) {
      const pile = deck.slice(i * (i + 1), (i + 1) * (i + 2));
      pile[pile.length - 1].faceUp = true;
      tableaus.push(pile);
    }

    setGameState({
      stock: deck.slice(28),
      waste: [],
      foundations: [[], [], [], []],
      tableaus
    });
  };

  return (
    <Wrap>
      <MenuBar>
        <MenuItem onClick={resetGame}>游戏(G)</MenuItem>
        <MenuItem>帮助(H)</MenuItem>
      </MenuBar>

      <StockArea>
        <StockPile onClick={dealCard}>
          {gameState.stock.length === 0 ? '📂' : '🃏'}
        </StockPile>
        <WastePile>
          {gameState.waste.length > 0 && (
            <Card
              $faceUp={true}
              $suit={gameState.waste[gameState.waste.length - 1].suit}
              $rank={gameState.waste[gameState.waste.length - 1].rank}
            >
              <CardRank $suit={gameState.waste[gameState.waste.length - 1].suit}>
                {gameState.waste[gameState.waste.length - 1].rank}
              </CardRank>
              <CardSuit $suit={gameState.waste[gameState.waste.length - 1].suit}>
                {gameState.waste[gameState.waste.length - 1].suit}
              </CardSuit>
            </Card>
          )}
        </WastePile>
        <FoundationArea>
          {gameState.foundations.map((foundation, index) => (
            <Foundation key={index}>
              {foundation.length > 0 ? (
                <Card
                  $faceUp={true}
                  $suit={foundation[foundation.length - 1].suit}
                  $rank={foundation[foundation.length - 1].rank}
                >
                  <CardRank $suit={foundation[foundation.length - 1].suit}>
                    {foundation[foundation.length - 1].rank}
                  </CardRank>
                  <CardSuit $suit={foundation[foundation.length - 1].suit}>
                    {foundation[foundation.length - 1].suit}
                  </CardSuit>
                </Card>
              ) : (
                <span>🀄</span>
              )}
            </Foundation>
          ))}
        </FoundationArea>
      </StockArea>

      <GameArea>
        <TableauArea>
          {gameState.tableaus.map((pile, pileIndex) => (
            <TableauPile key={pileIndex}>
              {pile.map((card, cardIndex) => (
                <Card
                  key={cardIndex}
                  $faceUp={card.faceUp}
                  $suit={card.suit}
                  $rank={card.rank}
                  $zIndex={cardIndex}
                >
                  {card.faceUp && (
                    <>
                      <CardRank $suit={card.suit}>{card.rank}</CardRank>
                      <CardSuit $suit={card.suit}>{card.suit}</CardSuit>
                    </>
                  )}
                </Card>
              ))}
            </TableauPile>
          ))}
        </TableauArea>
      </GameArea>
    </Wrap>
  );
};

export default Solitaire;
