import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings } from '../lib/settings';
import type { SoundPlayer } from '../lib/audio';
import type { ScreenLock } from '../lib/wakeLock';
import { startSession, tick } from '../lib/timer';
import type { Sound, TimerState } from '../lib/timer';

const TICK_MS = 1000;
/** How often the clock is checked; ticks are driven by wall time so they don't drift. */
const POLL_MS = 100;
/** How long the finished screen stays up before returning to the setup screen. */
export const DONE_DELAY_MS = 500;

export interface Timer {
  /** The running session, or null on the setup screen. */
  state: TimerState | null;
  paused: boolean;
  /** True while audio loads after START was pressed. */
  starting: boolean;
  start: () => Promise<void>;
  stop: () => void;
  togglePause: () => void;
}

export function useTimer(settings: Settings, player: SoundPlayer, lock: ScreenLock): Timer {
  const [state, setState] = useState<TimerState | null>(null);
  const [paused, setPaused] = useState(false);
  const [starting, setStarting] = useState(false);

  // Sounds are side effects, so ticks are computed here rather than inside setState updaters
  // (which React may call twice).
  const stateRef = useRef<TimerState | null>(null);
  const settingsRef = useRef(settings);
  const nextTickAt = useRef(0);
  const pausedLeft = useRef(0);
  // Bumped on every start and stop so a start still loading audio can tell it was superseded.
  const session = useRef(0);

  const commit = useCallback(
    (next: TimerState | null, sounds: Sound[]) => {
      stateRef.current = next;
      setState(next);
      for (const s of sounds) player.play(s);
    },
    [player],
  );

  const start = useCallback(async () => {
    const id = ++session.current;
    setStarting(true);
    try {
      await player.unlock();
    } finally {
      if (id === session.current) setStarting(false);
    }
    if (id !== session.current) return;
    settingsRef.current = settings;
    const first = startSession(settings);
    nextTickAt.current = Date.now() + TICK_MS;
    setPaused(false);
    commit(first.state, first.sounds);
    void lock.acquire();
  }, [settings, player, lock, commit]);

  const stop = useCallback(() => {
    session.current++;
    setStarting(false);
    setPaused(false);
    commit(null, []);
    void lock.release();
  }, [lock, commit]);

  const togglePause = useCallback(() => {
    if (!stateRef.current || stateRef.current.phase === 'done') return;
    if (paused) {
      nextTickAt.current = Date.now() + pausedLeft.current;
      void lock.acquire();
    } else {
      pausedLeft.current = Math.max(0, nextTickAt.current - Date.now());
      void lock.release();
    }
    setPaused(!paused);
  }, [paused, lock]);

  const running = state !== null && state.phase !== 'done' && !paused;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      let current = stateRef.current;
      if (!current || current.phase === 'done') return;
      let sounds: Sound[] | null = null;
      // Catch up on ticks missed while the page was throttled in the background, but only
      // speak the latest one.
      while (Date.now() >= nextTickAt.current && current.phase !== 'done') {
        const step = tick(current, settingsRef.current);
        current = step.state;
        sounds = step.sounds;
        nextTickAt.current += TICK_MS;
      }
      if (sounds) commit(current, sounds);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [running, commit]);

  const done = state?.phase === 'done';
  useEffect(() => {
    if (!done) return;
    void lock.release();
    const id = setTimeout(() => commit(null, []), DONE_DELAY_MS);
    return () => clearTimeout(id);
  }, [done, lock, commit]);

  // The browser drops the wake lock whenever the page is hidden; take it back on return.
  useEffect(() => {
    if (!running) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void lock.acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [running, lock]);

  useEffect(() => () => void lock.release(), [lock]);

  return { state, paused, starting, start, stop, togglePause };
}
