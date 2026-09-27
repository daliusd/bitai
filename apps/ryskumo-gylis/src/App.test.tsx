import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const card = (n: number) => screen.getByRole('region', { name: new RegExp(`^(Jutiklis|Sensor) ${n}$`) });
const results = (n: number) => within(screen.getByTestId(`sensor${n - 1}-results`));

async function type(field: HTMLElement, value: string) {
  const user = userEvent.setup();
  await user.clear(field);
  await user.type(field, value);
  await user.tab();
  return user;
}

describe('language', () => {
  it('is Lithuanian by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ryškumo gylio vizualizacija');
    expect(document.documentElement.lang).toBe('lt');
    expect(document.title).toBe('Ryškumo gylio vizualizacija');
  });

  it('is taken from ?lang= in the URL', () => {
    window.history.replaceState(null, '', '/ryskumo-gylis/?lang=en');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Depth of field visualization');
    expect(document.documentElement.lang).toBe('en');
    // Numbers follow the language too.
    expect(results(1).getByText('2.67 m')).toBeInTheDocument();
  });

  it('switches language and writes it to the URL', async () => {
    render(<App />);
    expect(results(1).getByText('2,67 m')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('link', { name: 'EN' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Depth of field visualization');
    expect(window.location.search).toBe('?lang=en');
    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'true');
    expect(results(1).getByText('2.67 m')).toBeInTheDocument();
  });

  it('follows the browser back button', async () => {
    render(<App />);
    await userEvent.setup().click(screen.getByRole('link', { name: 'EN' }));
    window.history.replaceState(null, '', '/?lang=lt');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ryškumo gylio vizualizacija' })).toBeInTheDocument();
  });
});

describe('depth of field', () => {
  it('shows near and far limits for every enabled sensor', () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    // Full frame, 50 mm f/3.5 at 3 m.
    expect(results(1).getByText('2.67 m')).toBeInTheDocument();
    expect(results(1).getByText('3.42 m')).toBeInTheDocument();
    expect(results(1).getByText('50 mm f/3.5')).toBeInTheDocument();
    // Micro Four Thirds 25 mm f/1.8 is equivalent to 50 mm f/3.6.
    expect(results(3).getByText('50 mm f/3.6')).toBeInTheDocument();
  });

  it('recalculates when a value is typed, with a decimal comma', async () => {
    render(<App />);
    await type(within(card(1)).getByRole('textbox', { name: 'Diafragma' }), '1,4');
    expect(results(1).getByText('2,86 m')).toBeInTheDocument();
    expect(results(1).getByText('3,16 m')).toBeInTheDocument();
  });

  it('shows infinity past the hyperfocal distance', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    await type(screen.getByRole('textbox', { name: 'Focus distance' }), '30');
    expect(results(1).getAllByText('∞')).toHaveLength(2); // far limit and depth
    expect(screen.getByTestId('blur-view-0')).toHaveTextContent('to ∞');
  });

  it('warns when the camera stands behind the subject', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    await type(within(card(1)).getByRole('textbox', { name: 'Stepped back' }), '4');
    expect(within(card(1)).getByRole('alert')).toHaveTextContent('in front of the camera');
    expect(within(screen.getByTestId('blur-view-0')).getByText(/behind or too close/)).toBeInTheDocument();
  });
});

describe('sensors', () => {
  it('keeps sensors equivalent when locked', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('switch', { name: /Lock all sensors/ }));
    // Locking syncs everyone to sensor 1: APS-C gets 50 / 1.5 ≈ 33 mm.
    expect(within(card(2)).getByRole('textbox', { name: 'Focal length' })).toHaveValue('33');
    await type(within(card(1)).getByRole('textbox', { name: 'Focal length' }), '100');
    expect(within(card(3)).getByRole('textbox', { name: 'Focal length' })).toHaveValue('50');
    expect(within(card(4)).getByRole('textbox', { name: 'Focal length' })).toHaveValue('200');
  });

  it('snaps apertures to third stops', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    await type(within(card(1)).getByRole('textbox', { name: 'Aperture' }), '3.3');
    await userEvent.setup().click(screen.getByRole('switch', { name: /Third stops/ }));
    expect(within(card(1)).getByRole('textbox', { name: 'Aperture' })).toHaveValue('3.2');
    expect(within(card(1)).getByRole('slider', { name: 'Aperture' })).toHaveAttribute('max', '33');
  });

  it('turns sensors on and off everywhere', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    const user = userEvent.setup();
    expect(screen.queryByTestId('map-sensor-4')).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Show: Sensor 5' }));
    expect(screen.getByTestId('map-sensor-4')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sensor 5' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Show: Sensor 1' }));
    expect(screen.queryByTestId('map-sensor-0')).not.toBeInTheDocument();
    expect(within(card(1)).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('switches to a custom format when the crop factor is edited', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    await type(within(card(1)).getByRole('textbox', { name: 'Crop factor' }), '1.3');
    expect(within(card(1)).getByRole('combobox', { name: 'Format' })).toHaveValue('custom');
    await userEvent.setup().selectOptions(within(card(1)).getByRole('combobox', { name: 'Format' }), 'm43');
    expect(within(card(1)).getByRole('textbox', { name: 'Crop factor' })).toHaveValue('2');
    expect(within(card(1)).getByRole('textbox', { name: 'Circle of confusion' })).toHaveValue('0.015');
  });
});

describe('views', () => {
  it('shows all cameras side by side, or one of them', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    expect(screen.getAllByTestId(/^blur-view-/)).toHaveLength(4);
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Sensor 2' }));
    expect(screen.getAllByTestId(/^blur-view-/)).toHaveLength(1);
    expect(screen.getByTestId('blur-view-1')).toHaveTextContent('35 mm · f/2.2');
  });

  it('draws one map, or one per sensor', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    render(<App />);
    expect(screen.getAllByRole('img', { name: /^Fields of view/ })).toHaveLength(1);
    await userEvent.setup().click(screen.getByRole('switch', { name: /Separate maps/ }));
    expect(screen.getAllByRole('img', { name: /^Fields of view/ })).toHaveLength(4);
  });
});

describe('storage', () => {
  it('remembers settings and resets them', async () => {
    window.history.replaceState(null, '', '/?lang=en');
    const { unmount } = render(<App />);
    await type(within(card(1)).getByRole('textbox', { name: 'Focal length' }), '85');
    unmount();
    render(<App />);
    expect(within(card(1)).getByRole('textbox', { name: 'Focal length' })).toHaveValue('85');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(within(card(1)).getByRole('textbox', { name: 'Focal length' })).toHaveValue('50');
  });
});
