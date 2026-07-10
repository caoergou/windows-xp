import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Solitaire from '../src/apps/Solitaire';
import { renderWithProviders } from './utils';

describe('Solitaire component', () => {
  it('renders the game board and menu', () => {
    renderWithProviders(<Solitaire />);
    expect(screen.getByText('Game(G)')).toBeInTheDocument();
    expect(screen.getByText('Help(H)')).toBeInTheDocument();
  });
});
