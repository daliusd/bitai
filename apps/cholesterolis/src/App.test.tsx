import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

async function enterPanel(values: Partial<Record<'tc' | 'hdl' | 'ldl' | 'tg', string>>) {
  const user = userEvent.setup();
  const labels = {
    tc: /Bendrasis cholesterolis/,
    hdl: /DTL/,
    ldl: /MTL/,
    tg: /Trigliceridai/,
  };
  for (const [m, v] of Object.entries(values)) {
    const input = screen.getByRole('textbox', { name: labels[m as keyof typeof labels] });
    await user.clear(input);
    // Paste rather than type: each keystroke re-renders the whole app, which is slow on build machines.
    await user.click(input);
    await user.paste(v);
  }
  return user;
}

const projectionOf = (m: string) => within(screen.getByTestId(`projection-${m}`));
const lever = (name: RegExp) => screen.getByRole('region', { name });

describe('App', () => {
  it('asks for values before showing the formula result and projection', () => {
    render(<App />);
    expect(screen.getByText(/Įveskite bent tris rodiklius, ir čia pamatysite/)).toBeInTheDocument();
    expect(screen.getByText(/Įveskite bent tris tyrimo rodiklius, ir čia matysite prognozę/)).toBeInTheDocument();
  });

  it('shows the formula with the entered numbers and a match verdict (comma decimals)', async () => {
    render(<App />);
    await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    expect(screen.getByText(/4,10 \+ 1,30 \+ 1,80 \/ 2,2 =/)).toHaveTextContent('6,22 mmol/l');
    expect(screen.getByText(/Atitinka:/)).toBeInTheDocument();
    expect(projectionOf('tc').getByText('6,20', { selector: '.projection-now' })).toBeInTheDocument();
  });

  it('reports a mismatch', async () => {
    render(<App />);
    await enterPanel({ tc: '8', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    expect(screen.getByText(/Neatitinka:/)).toBeInTheDocument();
  });

  it('infers missing LDL and uses it for the projection', async () => {
    render(<App />);
    await enterPanel({ tc: '6,2', hdl: '1,3', tg: '2,2' });
    expect(screen.getByText(/pagal formulę būtų apie/)).toHaveTextContent('3,90 mmol/l');
    expect(projectionOf('ldl').getByText('3,90', { selector: '.projection-now' })).toBeInTheDocument();
  });

  it('shows status badges and switches TG reference for non-fasting samples', async () => {
    const user = await (async () => {
      render(<App />);
      return enterPanel({ tg: '1,8' });
    })();
    const tgRef = () => document.getElementById('lipid-tg-ref')!;
    expect(tgRef()).toHaveTextContent('< 1,70 mmol/l nevalgius');
    expect(tgRef()).toHaveTextContent('Šiek tiek per didelis');
    await user.click(screen.getByRole('radio', { name: 'pavalgius' }));
    expect(tgRef()).toHaveTextContent('< 2,00 mmol/l pavalgius');
    expect(tgRef()).toHaveTextContent('Rekomenduojamose ribose');
  });

  it('converts entered values and references when switching to mg/dL', async () => {
    render(<App />);
    const user = await enterPanel({ tc: '5', tg: '1' });
    await user.click(screen.getByRole('radio', { name: 'mg/dl' }));
    expect(screen.getByRole('textbox', { name: /Bendrasis cholesterolis/ })).toHaveValue('193');
    expect(screen.getByRole('textbox', { name: /Trigliceridai/ })).toHaveValue('89');
    expect(document.getElementById('lipid-tc-ref')).toHaveTextContent('< 193 mg/dl');
  });

  it('updates the projection when the weight slider moves', async () => {
    render(<App />);
    await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' }), { target: { value: '20' } });
    expect(projectionOf('tc').getByText('5,37')).toBeInTheDocument();
    expect(projectionOf('ldl').getByText('3,44')).toBeInTheDocument();
    expect(within(lever(/Svorio metimas/)).getByTestId('effect')).toHaveTextContent('BCH −0,83 mmol/l');
  });

  it('warns that the weight effect assumes overweight when BMI is unknown', () => {
    render(<App />);
    expect(within(lever(/Svorio metimas/)).getByText(/nustatytas antsvorio turintiems žmonėms/)).toBeInTheDocument();
    expect(within(lever(/Mažiau angliavandenių/)).getByText(/Normalaus svorio žmonėms MTL/)).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' })).toHaveAttribute('aria-valuetext', '0 kg');
  });

  it('shows kilograms and no warning for an overweight person', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /Svoris/ }), '90');
    await user.type(screen.getByRole('textbox', { name: /Ūgis/ }), '175');
    const slider = screen.getByRole('slider', { name: 'Kiek kilogramų numesti' });
    fireEvent.change(slider, { target: { value: '9' } });
    expect(slider).toHaveAttribute('aria-valuetext', '9 kg (10 % svorio)');
    expect(lever(/Svorio metimas/).querySelector('.warning')).toBeNull();
    expect(lever(/Mažiau angliavandenių/).querySelector('.warning')).toBeNull();
  });

  it('limits the weight slider using BMI from body inputs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /Svoris/ }), '65');
    await user.type(screen.getByRole('textbox', { name: /Ūgis/ }), '180');
    expect(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' })).toHaveAttribute('max', '5');
    expect(screen.getByText(/Kūno masės indeksas/)).toHaveTextContent('20,1');
    expect(within(lever(/Svorio metimas/)).getByText(/pagal CALERIE tyrimą/)).toBeInTheDocument();
    expect(within(lever(/Mažiau angliavandenių/)).getByText(/Prognozėje naudojame šį padidėjimą/)).toBeInTheDocument();
  });

  it('applies checkbox interventions to the projection', async () => {
    render(<App />);
    const user = await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    await user.click(screen.getByRole('checkbox', { name: /Vartoti 2 g per dieną/ }));
    // 4.1 × 0.92 = 3.77
    expect(projectionOf('ldl').getByText('3,77')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Mesti rūkyti' }));
    expect(projectionOf('hdl').getByText('1,40')).toBeInTheDocument();
  });

  it('works without any body data', () => {
    render(<App />);
    expect(screen.getAllByText(/Vidutiniam suaugusiajam \(2000 kcal per dieną\)/)).toHaveLength(2);
    expect(screen.getByText('22 g per dieną')).toBeInTheDocument();
  });

  it('does not offer quitting smoking to non-smokers and removes its effect', async () => {
    render(<App />);
    const user = await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    await user.click(screen.getByRole('checkbox', { name: 'Mesti rūkyti' }));
    expect(projectionOf('hdl').getByText('1,40')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rūkymas' }), 'no');
    expect(screen.queryByRole('checkbox', { name: 'Mesti rūkyti' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tai jau darote' })).toHaveTextContent('Nerūkote');
    expect(projectionOf('hdl').getByText('1,30', { selector: '.projection-after' })).toBeInTheDocument();
  });

  it('hides alcohol and activity levers when already in place', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Alkoholis' }), 'none');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Fizinis aktyvumas' }), 'high');
    expect(screen.queryByRole('checkbox', { name: 'Atsisakyti alkoholio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: /Aerobinis krūvis/ })).not.toBeInTheDocument();
    const already = screen.getByRole('region', { name: 'Tai jau darote' });
    expect(already).toHaveTextContent('Negeriate alkoholio');
    expect(already).toHaveTextContent('daugiau nei 300 min');
  });

  it('offers only the incremental activity option to moderately active users', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Fizinis aktyvumas' }), 'medium');
    expect(screen.queryByRole('radio', { name: '150 min per savaitę' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /iki 300 min per savaitę/ }));
    expect(within(lever(/Fizinis aktyvumas/)).getByTestId('effect')).toHaveTextContent('DTL +0,02 mmol/l');
  });

  it('warns about possible familial hypercholesterolaemia', async () => {
    render(<App />);
    await enterPanel({ tc: '8,5', hdl: '1,3', ldl: '6,4', tg: '1,8' });
    expect(screen.getByRole('note')).toHaveTextContent(/šeiminę hipercholesterolemiją/);
  });

  it('lists out-of-range values in clinical priority order, LDL first', async () => {
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Į ką atkreipti dėmesį' })).not.toBeInTheDocument();
    await enterPanel({ tc: '6,2', hdl: '0,9', ldl: '4,1', tg: '2,84' });
    const items = within(screen.getByRole('region', { name: 'Į ką atkreipti dėmesį' })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent?.split(' – ')[0])).toEqual([
      'MTL („blogasis“) cholesterolis',
      'Bendrasis cholesterolis',
      'Trigliceridai',
      'DTL („gerasis“) cholesterolis',
    ]);
    expect(items[0]).toHaveTextContent('Svarbiausias rodiklis');
  });

  it('says so when every value is in range', async () => {
    render(<App />);
    await enterPanel({ tc: '4,5', hdl: '1,4', ldl: '2,5', tg: '1,2' });
    expect(screen.getByRole('region', { name: 'Į ką atkreipti dėmesį' })).toHaveTextContent(
      'Visi įvesti rodikliai rekomenduojamose ribose',
    );
  });

  it('applies omega-3 doses to triglycerides', async () => {
    render(<App />);
    const user = await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '2' });
    await user.click(screen.getByRole('radio', { name: '2 g' }));
    // TG 2.00 × (1 − 2 × 0.06) = 1.76
    expect(projectionOf('tg').getByText('1,76')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Vartoju žuvų taukus/ }));
    expect(screen.queryByRole('radio', { name: '2 g' })).not.toBeInTheDocument();
    expect(projectionOf('tg').getByText('2,00', { selector: '.projection-after' })).toBeInTheDocument();
  });

  it('shows how much a single result can vary and compares two results', async () => {
    render(<App />);
    const user = await enterPanel({ tg: '2' });
    expect(screen.getByText(/Trigliceridai: nuo 1,09 iki 2,91 mmol\/l/)).toBeInTheDocument();
    const group = within(screen.getByRole('group', { name: 'Palyginkite du tyrimus' }));
    await user.type(group.getByRole('textbox', { name: /Ankstesnis/ }), '1,22');
    await user.type(group.getByRole('textbox', { name: /Naujesnis/ }), '2,84');
    expect(group.getByText(/Pokytis \+133 %/)).toHaveTextContent('greičiausiai tikras pokytis');
    await user.clear(group.getByRole('textbox', { name: /Naujesnis/ }));
    await user.type(group.getByRole('textbox', { name: /Naujesnis/ }), '1,6');
    expect(group.getByText(/Pokytis \+31 %/)).toHaveTextContent('natūralus svyravimas');
  });

  it('remembers entered data after a reload and can clear it', async () => {
    const { unmount } = render(<App />);
    const user = await enterPanel({ tc: '6,2', hdl: '1,3', ldl: '4,1', tg: '1,8' });
    await user.click(screen.getByRole('radio', { name: 'pavalgius' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rūkymas' }), 'no');
    fireEvent.change(screen.getByRole('slider', { name: 'Kiek kilogramų numesti' }), { target: { value: '20' } });
    unmount();

    render(<App />);
    expect(screen.getByRole('textbox', { name: /Bendrasis cholesterolis/ })).toHaveValue('6,2');
    expect(screen.getByRole('radio', { name: 'pavalgius' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Rūkymas' })).toHaveValue('no');
    expect(projectionOf('tc').getByText('5,37')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Ištrinti įvestus duomenis' }));
    expect(screen.getByRole('textbox', { name: /Bendrasis cholesterolis/ })).toHaveValue('');
    expect(screen.getByRole('radio', { name: 'nevalgius' })).toBeChecked();
    expect(localStorage.getItem('cholesterolis.panel')).not.toContain('6,2');
  });
});

