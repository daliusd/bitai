import { useMemo } from 'react';
import { usePersistentState } from './lib/storage';
import { DEFAULT_SETTINGS, sanitizeSettings } from './lib/settings';
import type { Settings } from './lib/settings';
import { WebAudioPlayer } from './lib/audio';
import type { SoundPlayer } from './lib/audio';
import { WakeLock } from './lib/wakeLock';
import type { ScreenLock } from './lib/wakeLock';
import { useTimer } from './hooks/useTimer';
import { useTheme } from './hooks/useTheme';
import SetupScreen from './components/SetupScreen';
import TimerScreen from './components/TimerScreen';
import ThemeToggle from './components/ThemeToggle';

interface Props {
  player?: SoundPlayer;
  lock?: ScreenLock;
}

export default function App({ player, lock }: Props) {
  const sounds = useMemo(() => player ?? new WebAudioPlayer(`${import.meta.env.BASE_URL}voices/`), [player]);
  const screenLock = useMemo(() => lock ?? new WakeLock(), [lock]);
  const [stored, setSettings] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS);
  const settings = useMemo(() => sanitizeSettings(stored), [stored]);
  const [theme, toggleTheme] = useTheme();
  const timer = useTimer(settings, sounds, screenLock);

  if (timer.state) {
    return (
      <TimerScreen
        state={timer.state}
        intervals={settings.intervals}
        paused={timer.paused}
        onTogglePause={timer.togglePause}
        onStop={timer.stop}
      />
    );
  }

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <SetupScreen settings={settings} starting={timer.starting} onChange={setSettings} onStart={() => void timer.start()} />
    </>
  );
}
