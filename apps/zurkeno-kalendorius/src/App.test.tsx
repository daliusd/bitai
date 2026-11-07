import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const today = new Date(2026, 10, 7);

describe('App', () => {
  it('generates and saves a PDF for the entered name, year and month', async () => {
    const blob = new Blob(['%PDF']);
    const generate = vi.fn().mockResolvedValue({ blob, fileName: 'Pūkas-kalendorius-2027-01.pdf' });
    const save = vi.fn();
    render(<App generate={generate} save={save} today={today} />);

    const button = screen.getByRole('button', { name: 'Generuoti PDF' });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Langeliai prasidės nuo šiandien \(7 d\.\)/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Žiurkėno vardas'), 'Pūkas');
    const year = screen.getByLabelText('Metai');
    await userEvent.clear(year);
    await userEvent.type(year, '2027');
    await userEvent.selectOptions(screen.getByLabelText('Mėnuo'), 'sausis');

    expect(screen.getByText('Pūko priežiūros kalendorius')).toBeInTheDocument();
    expect(screen.queryByText(/Langeliai prasidės/)).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(generate).toHaveBeenCalledWith({ name: 'Pūkas', year: 2027, month: 1, start: 1 });
    expect(save).toHaveBeenCalledWith(blob, 'Pūkas-kalendorius-2027-01.pdf');
  });

  it('shows an error when generation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const generate = vi.fn().mockRejectedValue(new Error('boom'));
    render(<App generate={generate} save={vi.fn()} today={today} />);
    await userEvent.type(screen.getByLabelText('Žiurkėno vardas'), 'Pupelė');
    await userEvent.click(screen.getByRole('button', { name: 'Generuoti PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nepavyko');
  });
});
