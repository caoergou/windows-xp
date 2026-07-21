import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Solitaire from '../src/apps/Solitaire';
import { renderWithProviders } from './utils';

describe('Solitaire component', () => {
  it('renders the game board and menu', () => {
    renderWithProviders(<Solitaire />);
    expect(screen.getByText('Game(G)')).toBeInTheDocument();
    expect(screen.getByText('Help(H)')).toBeInTheDocument();
  });

  it('shows score and time in the status bar', () => {
    renderWithProviders(<Solitaire />);
    expect(screen.getByText('Score: 0')).toBeInTheDocument();
    expect(screen.getByText('Time: 0:00')).toBeInTheDocument();
  });

  it('offers new game, undo, draw mode and exit in the game menu', () => {
    renderWithProviders(<Solitaire />);
    fireEvent.click(screen.getByText('Game(G)'));
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Draw One')).toBeInTheDocument();
    expect(screen.getByText('Draw Three')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });

  it('marks the current draw mode in the menu', () => {
    renderWithProviders(<Solitaire />);
    fireEvent.click(screen.getByText('Game(G)'));
    expect(screen.getByText('✓')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Draw Three'));
    fireEvent.click(screen.getByText('Game(G)'));
    expect(screen.getByText('Draw Three').closest('button')?.textContent).toContain('✓');
    expect(screen.getByText('Draw One').closest('button')?.textContent).not.toContain('✓');
  });

  it('opens and closes the about dialog from the help menu', () => {
    renderWithProviders(<Solitaire />);
    fireEvent.click(screen.getByText('Help(H)'));
    fireEvent.click(screen.getByText('About Solitaire'));
    expect(screen.getByRole('dialog', { name: 'About Solitaire' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('OK'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
