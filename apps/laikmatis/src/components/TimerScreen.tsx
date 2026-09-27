import type { TimerState } from '../lib/timer';
import { formatTime } from '../lib/format';

interface Props {
  state: TimerState;
  intervals: number;
  paused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
}

const PHASE_LABELS = {
  prepare: 'Pasiruošk',
  active: 'Darbas',
  rest: 'Poilsis',
  done: 'Baigta',
} as const;

export default function TimerScreen({ state, intervals, paused, onTogglePause, onStop }: Props) {
  const classes = ['screen', 'timer-screen', `${state.phase}-phase`];
  if (paused) classes.push('paused');
  return (
    <main className={classes.join(' ')}>
      <div className="interval-indicator" data-testid="interval">
        {state.phase === 'prepare' ? 'Pasiruoškite' : `Intervalas ${state.interval} iš ${intervals}`}
      </div>
      <div className="phase-label" data-testid="phase">
        {PHASE_LABELS[state.phase]}
      </div>
      <div className="countdown" data-testid="countdown" role="timer" aria-live="off">
        {formatTime(state.remaining)}
      </div>
      <div className="controls">
        <button type="button" className="control-btn pause-btn" onClick={onTogglePause} disabled={state.phase === 'done'}>
          {paused ? 'TĘSTI' : 'PAUZĖ'}
        </button>
        <button type="button" className="control-btn stop-btn" onClick={onStop}>
          STOP
        </button>
      </div>
    </main>
  );
}
