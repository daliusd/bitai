import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('flips the card to show the transcription and moves on after grading', async () => {
    // random() = 0 always draws the first card of the pool: Alef, then Bet.
    render(<App random={() => 0} />);
    const card = screen.getByRole('button', { name: 'Apversti kortelę' });
    expect(card).toHaveTextContent('א');

    await userEvent.click(card);
    expect(screen.getByText('Alef')).toBeInTheDocument();
    expect(screen.getByText('tylioji')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Žinojau' }));
    expect(screen.queryByText('Alef')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apversti kortelę' })).toHaveTextContent('בּ');
    expect(screen.getByText(/šįkart žinojote 1, nežinojote 0/)).toBeInTheDocument();

    // Flip back and forth, then grade from either side.
    const bet = screen.getByRole('button', { name: 'Apversti kortelę' });
    await userEvent.click(bet);
    expect(screen.getByText('b')).toBeInTheDocument();
    await userEvent.click(bet);
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByText(/šįkart žinojote 1, nežinojote 1/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Žinojau' }));
    expect(screen.getByText(/šįkart žinojote 2, nežinojote 1/)).toBeInTheDocument();
  });

  it('switches decks and remembers the choice', async () => {
    render(<App random={() => 0} />);
    await userEvent.click(screen.getByLabelText(/Raidės/));
    expect(screen.getByText('Pasirinkite bent vieną rinkinį.')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Skiemenys/));
    expect(screen.getByRole('button', { name: 'Apversti kortelę' })).toHaveTextContent('אַ');
    expect(screen.getByRole('region', { name: 'Pažanga' })).toHaveTextContent('Išmokta 0 iš 232');
    expect(JSON.parse(localStorage.getItem('hebraju-abecele.decks')!)).toEqual(['skiemenys']);
  });

  it('shows the card in every chosen letter style at once, keeping at least one on', async () => {
    render(<App random={() => 0} />);
    const shown = () =>
      [...screen.getByRole('button', { name: 'Apversti kortelę' }).querySelectorAll('.front .hebrew')].map((el) =>
        el.className.replace('hebrew ', ''),
      );
    const book = screen.getByRole('checkbox', { name: /Knyginis/ });
    expect(book).toBeChecked();
    expect(book).toBeDisabled();
    expect(shown()).toEqual(['style-knyginis']);

    await userEvent.click(screen.getByRole('checkbox', { name: /Rašytinis/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Spausdintinis/ }));
    expect(shown()).toEqual(['style-knyginis', 'style-spausdintinis', 'style-rasytinis']);
    expect(screen.getByRole('button', { name: 'Apversti kortelę' })).toHaveTextContent('Rašytinis');

    await userEvent.click(book);
    await userEvent.click(screen.getByRole('checkbox', { name: /Spausdintinis/ }));
    expect(shown()).toEqual(['style-rasytinis']);
    expect(screen.getByRole('checkbox', { name: /Rašytinis/ })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem('hebraju-abecele.styles')!)).toEqual(['rasytinis']);
  });
});
