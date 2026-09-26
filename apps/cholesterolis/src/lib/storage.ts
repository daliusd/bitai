import { useEffect, useState } from 'react';

const PREFIX = 'cholesterolis.';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Reads a stored value, falling back to `initial` when missing, unreadable or of another shape. */
export function readStored<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return initial;
    const stored: unknown = JSON.parse(raw);
    if (isPlainObject(initial)) {
      // Merge so that fields added in newer versions keep their defaults.
      return isPlainObject(stored) ? ({ ...initial, ...stored } as T) : initial;
    }
    return typeof stored === typeof initial ? (stored as T) : initial;
  } catch {
    return initial;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, blocked site data); the page still works.
  }
}

export function clearStored(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // Ignore: nothing was stored.
  }
}

/** Like useState, but the value survives page reloads via localStorage. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial));
  useEffect(() => writeStored(key, value), [key, value]);
  return [value, setValue] as const;
}
