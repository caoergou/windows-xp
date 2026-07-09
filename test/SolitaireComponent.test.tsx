import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Solitaire from '../src/apps/Solitaire';

describe('Solitaire component', () => {
  it('renders the game board and menu', () => {
    render(<Solitaire />);
    expect(screen.getByText('游戏(G)')).toBeInTheDocument();
    expect(screen.getByText('帮助(H)')).toBeInTheDocument();
  });
});
