import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const TODAY = new Date(2026, 10, 9);

async function fill(values: Record<string, string>) {
  const user = userEvent.setup();
  for (const [label, value] of Object.entries(values)) {
    const input = screen.getByRole('textbox', { name: new RegExp(label) });
    await user.clear(input);
    await user.click(input);
    // Paste rather than type: each keystroke re-renders the whole app, which is slow on build machines.
    if (value) await user.paste(value);
  }
  return user;
}

describe('App', () => {
  it('shows the deadline from today and asks for the age', () => {
    render(<App today={TODAY} />);
    expect(screen.getByRole('status')).toHaveTextContent('Iki lango pabaigos liko 418 d.');
    expect(screen.getByRole('status')).toHaveTextContent('iki 2026-12-31');
    expect(screen.getByRole('status')).toHaveTextContent('iki 2027-01-15');
    expect(screen.getByText(/Įveskite amžių, ir čia/)).toBeInTheDocument();
  });

  it('says so when the window is closed', () => {
    render(<App today={new Date(2028, 1, 1)} />);
    expect(screen.getByRole('status')).toHaveTextContent('Pereinamasis laikotarpis baigėsi');
  });

  it('compares the three options and lists reasons for the age', async () => {
    render(<App today={TODAY} />);
    await fill({ Amžius: '40', 'Atsiimtumėte': '10 000', 'grįžtanti': '5000', Atlyginimas: '2000' });

    expect(screen.getByRole('heading', { name: 'Likti II pakopoje' })).toBeInTheDocument();
    const etf = within(screen.getByTestId('option-etf'));
    expect(etf.getByText('Naujoje II pakopos sąskaitoje')).toBeInTheDocument();
    expect(etf.getByText('GPM nuo prieaugio')).toBeInTheDocument();
    expect(within(screen.getByTestId('option-pillar3')).queryByText('GPM nuo prieaugio')).not.toBeInTheDocument();
    expect(screen.getAllByText('Daugiausia')).toHaveLength(1);

    const move = within(screen.getByTestId('reasons-move'));
    expect(move.getByText('II pakopoje pinigai užrakinti dar 25 m.')).toBeInTheDocument();
    expect(move.getByText('Paskatos neprarandate')).toBeInTheDocument();
  });

  it('estimates the state part until it is entered', async () => {
    render(<App today={TODAY} />);
    await fill({ Amžius: '40', 'Atsiimtumėte': '10000' });
    expect(screen.getByTestId('sodra-estimate')).toHaveTextContent('skaičiuojame apytiksliai: 3 500 €');
    expect(within(screen.getByTestId('option-etf')).getByText(/„Sodros“ pensijos priedas/)).toBeInTheDocument();
    await fill({ 'grįžtanti': '0' });
    expect(screen.queryByTestId('sodra-estimate')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('option-etf')).queryByText(/„Sodros“ pensijos priedas/)).not.toBeInTheDocument();
  });

  it('moves the incentive to the reasons for staying when not rejoining', async () => {
    render(<App today={TODAY} />);
    const user = await fill({ Amžius: '40', 'Atsiimtumėte': '10000', Atlyginimas: '2000' });
    await user.click(screen.getByRole('checkbox', { name: /vėl kaupčiau II pakopoje/ }));

    expect(within(screen.getByTestId('option-etf')).queryByText('Naujoje II pakopos sąskaitoje')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('reasons-stay')).getByText(/Valstybės paskata: \+56 %/)).toBeInTheDocument();
    expect(screen.getByTestId('verdict')).toHaveTextContent('likti II pakopoje finansiškai naudingiausia');
  });

  it('explains what applies at pension age instead of calculating', async () => {
    render(<App today={TODAY} />);
    await fill({ Amžius: '67' });
    expect(screen.getByText(/Sulaukus 65 m\. II pakopos pinigus jau galima gauti/)).toBeInTheDocument();
    expect(screen.queryByTestId('reasons-move')).not.toBeInTheDocument();
  });

  it('remembers the inputs and clears them on request', async () => {
    const first = render(<App today={TODAY} />);
    const user = await fill({ Amžius: '33' });
    first.unmount();
    render(<App today={TODAY} />);
    expect(screen.getByRole('textbox', { name: /Amžius/ })).toHaveValue('33');
    await user.click(screen.getByRole('button', { name: 'Ištrinti įvestus duomenis' }));
    expect(screen.getByRole('textbox', { name: /Amžius/ })).toHaveValue('');
  });
});
