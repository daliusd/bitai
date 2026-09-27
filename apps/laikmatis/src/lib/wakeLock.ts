export interface ScreenLock {
  acquire(): Promise<void>;
  release(): Promise<void>;
}

/** Keeps the screen on during a workout where the Screen Wake Lock API exists. */
export class WakeLock implements ScreenLock {
  private sentinel: WakeLockSentinel | null = null;

  async acquire(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    if (this.sentinel && !this.sentinel.released) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
    } catch (err) {
      // Refused when the page is hidden or on low battery; the timer still works.
      console.warn('Wake Lock request failed:', err);
    }
  }

  async release(): Promise<void> {
    const sentinel = this.sentinel;
    this.sentinel = null;
    if (!sentinel) return;
    try {
      await sentinel.release();
    } catch (err) {
      console.warn('Wake Lock release failed:', err);
    }
  }
}
