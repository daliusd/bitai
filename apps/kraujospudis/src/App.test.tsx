import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

async function enterReadings(readings: [string, string][]) {
  const user = userEvent.setup();
  for (let i = 0; i < readings.length; i++) {
    const n = i + 1;
    if (!screen.queryByRole('textbox', { name: `${n} matavimas: sistolinis` })) {
      await user.click(screen.getByRole('button', { name: '+ Pridėti matavimą' }));
    }
    const sys = screen.getByRole('textbox', { name: `${n} matavimas: sistolinis` });
    const dia = screen.getByRole('textbox', { name: `${n} matavimas: diastolinis` });
    await user.clear(sys);
    await user.type(sys, readings[i][0]);
    await user.clear(dia);
    await user.type(dia, readings[i][1]);
  }
  return user;
}

const projectionOf = (p: string) => within(screen.getByTestId(`projection-${p}`));
const lever = (name: RegExp) => screen.getByRole('region', { name });

describe('App', () => {
  it('asks for readings before showing the result and projection', () => {
    render(<App />);
    expect(screen.getByText(/Įveskite bent vieną matavimą/)).toBeInTheDocument();
    expect(screen.getByText(/Įveskite bent vieną kraujospūdžio matavimą, ir čia matysite prognozę/)).toBeInTheDocument();
  });

  it('averages readings, drops the first of three and classifies with home thresholds', async () => {
    render(<App />);
    await enterReadings([
      ['152', '94'],
      ['138', '86'],
      ['136', '84'],
    ]);
    expect(screen.getByTestId('average')).toHaveTextContent('137/85');
    expect(screen.getByTestId('average')).toHaveTextContent('Hipertenzija');
    expect(screen.getByText(/Vidurkis iš 2 matavimų \(pirmasis neįskaičiuotas\)/)).toBeInTheDocument();
    expect(projectionOf('sys').getByText('137', { selector: '.projection-now' })).toBeInTheDocument();
  });

  it('uses office thresholds when measured at the doctor', async () => {
    render(<App />);
    const user = await enterReadings([['137', '85']]);
    expect(screen.getByTestId('average')).toHaveTextContent('Hipertenzija');
    await user.click(screen.getByRole('radio', { name: 'pas gydytoją ar vaistinėje' }));
    expect(screen.getByTestId('average')).toHaveTextContent('Padidėjęs');
  });

  it('warns about swapped numbers and ignores that reading', async () => {
    render(<App />);
    await enterReadings([['80', '120']]);
    expect(screen.getByRole('alert')).toHaveTextContent('turi būti didesnis');
    expect(screen.getByText(/Įveskite bent vieną matavimą/)).toBeInTheDocument();
  });

  it('shows an urgent note for very high readings', async () => {
    render(<App />);
    await enterReadings([['185', '112']]);
    expect(screen.getByTestId('average')).toHaveTextContent('Labai aukštas');
    expect(screen.getByRole('note')).toHaveTextContent('112');
  });

  it('flags isolated systolic hypertension', async () => {
    render(<App />);
    await enterReadings([['152', '78']]);
    expect(screen.getByText(/izoliuota sistolinė hipertenzija/)).toBeInTheDocument();
  });

  it('updates the projection when the weight slider moves', async () => {
    render(<App />);
    await enterReadings([['150', '95']]);
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' }), { target: { value: '10' } });
    // 150 − 10 × 1.05 = 139.5 → 140; 95 − 9.2 = 85.8 → 86
    expect(projectionOf('sys').getByText('140', { selector: '.projection-after' })).toBeInTheDocument();
    expect(projectionOf('dia').getByText('86', { selector: '.projection-after' })).toBeInTheDocument();
    expect(within(lever(/Svorio metimas/)).getByTestId('effect')).toHaveTextContent('sistolinis −10,5 mmHg');
    expect(screen.getByTestId('projection-risk')).toHaveTextContent('20 %');
  });

  it('uses the larger salt effect for hypertension', async () => {
    render(<App />);
    const user = await enterReadings([['150', '95']]);
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek druskos suvalgyti mažiau' }), { target: { value: '4.5' } });
    // 5.39 × 4.5 / 4.4 = 5.5
    expect(within(lever(/Mažiau druskos/)).getByTestId('effect')).toHaveTextContent('sistolinis −5,5 mmHg');
    await user.click(screen.getByRole('radio', { name: 'pas gydytoją ar vaistinėje' }));
    await enterReadings([['125', '75']]);
    // 2.42 × 4.5 / 4.4 = 2.5
    expect(within(lever(/Mažiau druskos/)).getByTestId('effect')).toHaveTextContent('sistolinis −2,5 mmHg');
  });

  it('applies exercise and notes the change of category', async () => {
    render(<App />);
    const user = await enterReadings([['142', '88']]);
    await user.click(screen.getByRole('radio', { name: 'izometriniai' }));
    expect(projectionOf('sys').getByText('134', { selector: '.projection-after' })).toBeInTheDocument();
    expect(screen.getByTestId('projection-category')).toHaveTextContent('hipertenzija › padidėjęs');
  });

  it('caps the combined diet effect', async () => {
    render(<App />);
    const user = await enterReadings([['160', '100']]);
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek druskos suvalgyti mažiau' }), { target: { value: '6' } });
    await user.click(screen.getByRole('checkbox', { name: /pakaitalą su kalio chloridu/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Maitintis pagal DASH principus' }));
    expect(screen.getByText(/apribotas pagal DASH-Sodium/)).toBeInTheDocument();
    // 160 − 11.5 = 148.5 → 149
    expect(projectionOf('sys').getByText('149', { selector: '.projection-after' })).toBeInTheDocument();
  });

  it('moves habits already in place to their own list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Alkoholis' }), 'none');
    await user.click(screen.getByRole('checkbox', { name: /Naudoju druskos pakaitalą/ }));
    expect(screen.queryByRole('checkbox', { name: /Gerti bent perpus mažiau/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /pakaitalą su kalio chloridu/ })).not.toBeInTheDocument();
    const already = screen.getByRole('region', { name: 'Tai jau darote' });
    expect(already).toHaveTextContent('Negeriate alkoholio');
    expect(already).toHaveTextContent('Jau naudojate druskos pakaitalą');
  });

  it('offers only extra training types to people who already exercise', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Fizinis aktyvumas' }), 'regular');
    expect(screen.queryByRole('radio', { name: 'aerobinis' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'aerobinis ir jėgos' }));
    expect(within(lever(/Fizinis aktyvumas/)).getByTestId('effect')).toHaveTextContent(/^Numatomas poveikis: sistolinis −1,5 mmHg$/);
  });

  it('limits the weight slider using BMI', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /Svoris/ }), '65');
    await user.type(screen.getByRole('textbox', { name: /Ūgis/ }), '180');
    expect(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' })).toHaveAttribute('max', '5');
  });

  it('comments on widely scattered readings', async () => {
    render(<App />);
    await enterReadings([
      ['165', '95'],
      ['135', '85'],
    ]);
    expect(screen.getByText(/skiriasi iki 30 mmHg/)).toHaveTextContent('Tai daug');
  });

  it('remembers entered data after a reload and can clear it', async () => {
    const { unmount } = render(<App />);
    const user = await enterReadings([['150', '95']]);
    await user.click(screen.getByRole('radio', { name: 'pas gydytoją ar vaistinėje' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' }), { target: { value: '10' } });
    unmount();

    render(<App />);
    expect(screen.getByRole('textbox', { name: '1 matavimas: sistolinis' })).toHaveValue('150');
    expect(screen.getByRole('radio', { name: 'pas gydytoją ar vaistinėje' })).toBeChecked();
    expect(projectionOf('sys').getByText('140', { selector: '.projection-after' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Ištrinti įvestus duomenis' }));
    expect(screen.getByRole('textbox', { name: '1 matavimas: sistolinis' })).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'namuose' })).toBeChecked();
  });
});
