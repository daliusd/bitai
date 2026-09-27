import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import type { SoundPlayer } from './lib/audio';
import type { ScreenLock } from './lib/wakeLock';
import type { Sound } from './lib/timer';

function fakes() {
  const played: Sound[] = [];
  const player: SoundPlayer & { unlock: ReturnType<typeof vi.fn> } = {
    unlock: vi.fn(async () => {}),
    play: (s) => played.push(s),
  };
  const lock = { acquire: vi.fn(async () => {}), release: vi.fn(async () => {}) } satisfies ScreenLock;
  return { played, player, lock };
}

function setup() {
  const f = fakes();
  render(<App player={f.player} lock={f.lock} />);
  return f;
}

const spin = (name: string) => screen.getByRole('spinbutton', { name });
const text = (id: string) => screen.getByTestId(id).textContent;

async function start() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'PRADĖTI' }));
  });
}

async function seconds(n: number) {
  await act(async () => {
    vi.advanceTimersByTime(n * 1000);
  });
}

/** Sets the four values with the keyboard (Home = minimum, then arrow up). */
function configure(values: { intervals: number; active: number; rest: number; countdown: number }) {
  const set = (name: string, ups: number) => {
    fireEvent.keyDown(spin(name), { key: 'Home' });
    for (let i = 0; i < ups; i++) fireEvent.keyDown(spin(name), { key: 'ArrowUp' });
  };
  set('Intervalai', values.intervals - 1);
  set('Darbas', (values.active - 5) / 5);
  set('Poilsis', (values.rest - 5) / 5);
  set('Atgalinis skaičiavimas', values.countdown);
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset.theme;
  });

  it('shows the default settings', () => {
    setup();
    expect(spin('Intervalai')).toHaveAttribute('aria-valuenow', '8');
    expect(spin('Darbas')).toHaveTextContent('1:00');
    expect(spin('Poilsis')).toHaveTextContent('0:30');
    expect(spin('Atgalinis skaičiavimas')).toHaveTextContent('3');
    expect(text('total')).toBe('Iš viso 12:03');
  });

  it('has no voice selector', () => {
    setup();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('adjusts values by dragging and remembers them', () => {
    setup();
    const active = spin('Darbas');
    fireEvent.pointerDown(active, { clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(active, { clientY: 250, pointerId: 1 }); // 2 steps up
    fireEvent.pointerUp(active, { pointerId: 1 });
    expect(active).toHaveTextContent('1:10');
    fireEvent.pointerMove(active, { clientY: 0, pointerId: 1 }); // Not dragging any more.
    expect(active).toHaveTextContent('1:10');
    expect(JSON.parse(localStorage.getItem('laikmatis.settings')!)).toMatchObject({ active: 70 });
  });

  it('respects limits', () => {
    setup();
    const countdown = spin('Atgalinis skaičiavimas');
    fireEvent.keyDown(countdown, { key: 'End' });
    fireEvent.keyDown(countdown, { key: 'ArrowUp' });
    expect(countdown).toHaveAttribute('aria-valuenow', '5');
    fireEvent.keyDown(spin('Intervalai'), { key: 'PageDown' });
    expect(spin('Intervalai')).toHaveAttribute('aria-valuenow', '1');
  });

  it('runs a full session with voice cues and returns to setup', async () => {
    const { played, lock } = setup();
    configure({ intervals: 2, active: 5, rest: 5, countdown: 2 });
    await start();

    expect(text('phase')).toBe('Pasiruošk');
    expect(text('countdown')).toBe('0:02');
    expect(played).toEqual(['countdown2']);
    expect(lock.acquire).toHaveBeenCalled();

    await seconds(2);
    expect(text('phase')).toBe('Darbas');
    expect(text('interval')).toBe('Intervalas 1 iš 2');
    expect(text('countdown')).toBe('0:05');

    await seconds(5);
    expect(text('phase')).toBe('Poilsis');
    await seconds(5);
    expect(text('interval')).toBe('Intervalas 2 iš 2');
    await seconds(10);
    expect(text('phase')).toBe('Baigta');
    expect(played).toEqual([
      'countdown2', 'countdown1', 'go', 'countdown2', 'countdown1', 'rest', 'countdown2', 'countdown1',
      'go', 'countdown2', 'countdown1', 'rest', 'countdown2', 'countdown1', 'stop',
    ]);
    expect(lock.release).toHaveBeenCalled();

    await seconds(1);
    expect(screen.getByRole('button', { name: 'PRADĖTI' })).toBeInTheDocument();
  });

  it('starts a clean session after a finished one', async () => {
    const { played, player } = setup();
    configure({ intervals: 1, active: 5, rest: 5, countdown: 0 });
    await start();
    await seconds(10);
    await seconds(1);
    expect(screen.getByRole('button', { name: 'PRADĖTI' })).toBeInTheDocument();

    played.length = 0;
    await start();
    expect(player.unlock).toHaveBeenCalledTimes(2);
    expect(text('phase')).toBe('Darbas');
    expect(text('countdown')).toBe('0:05');
    await seconds(1);
    // One tick per second: a leftover timer from the first session would make this 0:03.
    expect(text('countdown')).toBe('0:04');
    expect(played).toEqual(['go']);
  });

  it('starts a clean session after stopping mid-way', async () => {
    const { played } = setup();
    configure({ intervals: 3, active: 20, rest: 10, countdown: 0 });
    await start();
    await seconds(25);
    expect(text('phase')).toBe('Poilsis');
    fireEvent.click(screen.getByRole('button', { name: 'STOP' }));

    played.length = 0;
    await start();
    expect(text('interval')).toBe('Intervalas 1 iš 3');
    expect(text('phase')).toBe('Darbas');
    await seconds(3);
    expect(text('countdown')).toBe('0:17');
    expect(played).toEqual(['go']);
  });

  it('disables START while the voice lines load', async () => {
    const { player } = setup();
    let finishLoading = () => {};
    player.unlock.mockImplementationOnce(() => new Promise<void>((r) => (finishLoading = r)));
    fireEvent.click(screen.getByRole('button', { name: 'PRADĖTI' }));
    expect(screen.getByRole('button', { name: 'RUOŠIAMA…' })).toBeDisabled();
    await act(async () => {
      finishLoading();
    });
    expect(screen.getByTestId('phase')).toBeInTheDocument();
  });

  it('pauses and resumes without losing time', async () => {
    const { lock } = setup();
    configure({ intervals: 1, active: 30, rest: 5, countdown: 0 });
    await start();
    await seconds(4);
    expect(text('countdown')).toBe('0:26');
    fireEvent.click(screen.getByRole('button', { name: 'PAUZĖ' }));
    expect(lock.release).toHaveBeenCalled();
    await seconds(60);
    expect(text('countdown')).toBe('0:26');
    fireEvent.click(screen.getByRole('button', { name: 'TĘSTI' }));
    await seconds(1);
    expect(text('countdown')).toBe('0:25');
  });

  it('catches up after the page was throttled, speaking only the latest cue', async () => {
    const { played } = setup();
    configure({ intervals: 1, active: 30, rest: 30, countdown: 0 });
    await start();
    played.length = 0;
    // Jump the clock without firing the intervals in between, as a background tab would.
    await act(async () => {
      vi.setSystemTime(Date.now() + 40_000);
      vi.advanceTimersByTime(100);
    });
    expect(text('phase')).toBe('Poilsis');
    expect(text('countdown')).toBe('0:20');
    expect(played).toEqual([]);
  });

  it('toggles between light and dark themes and remembers the choice', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Įjungti tamsią temą' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Įjungti šviesią temą' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('laikmatis.theme')).toBe('"light"');
  });

  it('follows the system theme until the visitor chooses', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === '(prefers-color-scheme: dark)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    setup();
    expect(document.documentElement.dataset.theme).toBe('dark');
    vi.unstubAllGlobals();
  });
});
