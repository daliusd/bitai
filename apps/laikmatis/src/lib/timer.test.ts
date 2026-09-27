import { describe, expect, it } from 'vitest';
import { startSession, tick, totalDuration } from './timer';
import type { Sound, TimerState } from './timer';
import type { Settings } from './settings';

const settings: Settings = { intervals: 2, active: 5, rest: 4, countdown: 3 };

/** Runs a whole session, recording each second's state and sounds. */
function run(s: Settings) {
  const first = startSession(s);
  const timeline: { state: TimerState; sounds: Sound[] }[] = [first];
  let state = first.state;
  while (state.phase !== 'done') {
    const step = tick(state, s);
    timeline.push(step);
    state = step.state;
  }
  return timeline;
}

describe('timer', () => {
  it('starts with the prepare countdown when enabled', () => {
    expect(startSession(settings)).toEqual({
      state: { phase: 'prepare', interval: 1, remaining: 3 },
      sounds: ['countdown3'],
    });
  });

  it('starts straight away without a countdown', () => {
    expect(startSession({ ...settings, countdown: 0 })).toEqual({
      state: { phase: 'active', interval: 1, remaining: 5 },
      sounds: ['go'],
    });
  });

  it('counts down into each phase change and ends with stop', () => {
    const timeline = run(settings);
    const said = timeline.map((t) => t.sounds.join(',')).join(' ');
    // prepare 3..1, active 5 (go) with 3..1, rest 4 with 3..1, active again, rest, stop.
    expect(said).toBe(
      [
        'countdown3 countdown2 countdown1',
        'go  countdown3 countdown2 countdown1',
        'rest countdown3 countdown2 countdown1',
        'go  countdown3 countdown2 countdown1',
        'rest countdown3 countdown2 countdown1',
        'stop',
      ].join(' '),
    );
    expect(timeline.length - 1).toBe(totalDuration(settings));
  });

  it('moves through intervals in order', () => {
    const phases = run(settings)
      .map(({ state }) => `${state.phase}${state.interval}`)
      .filter((p, i, all) => p !== all[i - 1]);
    expect(phases).toEqual(['prepare1', 'active1', 'rest1', 'active2', 'rest2', 'done2']);
  });

  it('says nothing but phase changes without a countdown', () => {
    const sounds = run({ ...settings, countdown: 0 }).flatMap((t) => t.sounds);
    expect(sounds).toEqual(['go', 'rest', 'go', 'rest', 'stop']);
  });

  it('stays done', () => {
    const done: TimerState = { phase: 'done', interval: 2, remaining: 0 };
    expect(tick(done, settings)).toEqual({ state: done, sounds: [] });
  });

  it('adds up the session length', () => {
    expect(totalDuration({ intervals: 8, active: 60, rest: 30, countdown: 3 })).toBe(723);
  });
});
