import { useEffect, useState } from 'react';
import { usePersistentState } from '../lib/storage';

export type Theme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/** The page theme: the visitor's choice if they made one, otherwise the system's. */
export function useTheme() {
  const [stored, setStored] = usePersistentState<string>('theme', '');
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme: Theme = stored === 'light' || stored === 'dark' ? stored : system;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setStored(theme === 'dark' ? 'light' : 'dark');
  return [theme, toggle] as const;
}
