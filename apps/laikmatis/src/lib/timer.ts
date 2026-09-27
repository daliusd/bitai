import type { Settings } from './settings';

export type Phase = 'prepare' | 'active' | 'rest' | 'done';

export type Sound = 'go' | 'rest' | 'stop' | 'countdown1' | 'countdown2' | 'countdown3' | 'countdown4' | 'countdown5';

export interface TimerState {
  phase: Phase;
  /** 1-based interval number. */
  interval: number;
  /** Whole seconds left in the current phase. */
  remaining: number;
}

export interface Step {
  state: TimerState;
  sounds: Sound[];
}

function countdownSound(n: number): Sound {
  return `countdown${n}` as Sound;
}

/** The first state of a session, plus what to say as it begins. */
export function startSession(settings: Settings): Step {
  if (settings.countdown > 0) {
    return {
      state: { phase: 'prepare', interval: 1, remaining: settings.countdown },
      sounds: [countdownSound(settings.countdown)],
    };
  }
  return { state: { phase: 'active', interval: 1, remaining: settings.active }, sounds: ['go'] };
}

/** Advances the session by one second. */
export function tick(state: TimerState, settings: Settings): Step {
  if (state.phase === 'done') return { state, sounds: [] };

  const remaining = state.remaining - 1;
  if (remaining > 0) {
    const counting = state.phase === 'prepare' || remaining <= settings.countdown;
    return { state: { ...state, remaining }, sounds: counting ? [countdownSound(remaining)] : [] };
  }

  switch (state.phase) {
    case 'prepare':
      return { state: { phase: 'active', interval: state.interval, remaining: settings.active }, sounds: ['go'] };
    case 'active':
      return { state: { phase: 'rest', interval: state.interval, remaining: settings.rest }, sounds: ['rest'] };
    case 'rest':
      if (state.interval >= settings.intervals) {
        return { state: { phase: 'done', interval: state.interval, remaining: 0 }, sounds: ['stop'] };
      }
      return { state: { phase: 'active', interval: state.interval + 1, remaining: settings.active }, sounds: ['go'] };
  }
}

/** Total session length in seconds, including the opening countdown. */
export function totalDuration(settings: Settings): number {
  return settings.countdown + settings.intervals * (settings.active + settings.rest);
}
