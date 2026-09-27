import type { Sound } from './timer';

export interface SoundPlayer {
  /**
   * Prepares audio. Must be called from a user gesture: iOS Safari only lets a page start or
   * resume audio then.
   */
  unlock(): Promise<void>;
  play(sound: Sound): void;
}

const GO_VARIATIONS = 10;
const SINGLE_SOUNDS: Exclude<Sound, 'go'>[] = [
  'rest',
  'stop',
  'countdown1',
  'countdown2',
  'countdown3',
  'countdown4',
  'countdown5',
];

function fileFor(sound: Exclude<Sound, 'go'>): string {
  return sound.startsWith('countdown') ? `${sound.slice('countdown'.length)}.mp3` : `${sound}.mp3`;
}

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext;
}

/**
 * Plays the voice lines through the Web Audio API, which is more reliable on iOS Safari than
 * <audio> elements.
 */
export class WebAudioPlayer implements SoundPlayer {
  private context: AudioContext | null = null;
  private go: AudioBuffer[] = [];
  private buffers = new Map<Sound, AudioBuffer>();
  private loading: Promise<void> | null = null;

  constructor(private readonly baseUrl: string) {}

  async unlock(): Promise<void> {
    const Ctor = audioContextCtor();
    if (!Ctor) return;
    if (!this.context) this.context = new Ctor();
    // Resume on every session start, not only the first one: iOS suspends or "interrupts" the
    // context after the screen locks or another app takes the audio, and a context left that
    // way plays nothing.
    if (this.context.state !== 'running') {
      try {
        await this.context.resume();
      } catch (err) {
        console.error('Audio resume failed:', err);
      }
    }
    this.loading ??= this.load(this.context).catch((err) => {
      console.error('Failed to load audio:', err);
      this.loading = null; // Retry on the next start.
    });
    await this.loading;
  }

  private async load(context: AudioContext): Promise<void> {
    const decode = async (file: string) => {
      const response = await fetch(this.baseUrl + file);
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      return context.decodeAudioData(await response.arrayBuffer());
    };
    const [go, singles] = await Promise.all([
      Promise.all(Array.from({ length: GO_VARIATIONS }, (_, i) => decode(`go${i + 1}.mp3`))),
      Promise.all(SINGLE_SOUNDS.map((s) => decode(fileFor(s)))),
    ]);
    this.go = go;
    SINGLE_SOUNDS.forEach((s, i) => this.buffers.set(s, singles[i]));
  }

  play(sound: Sound): void {
    const context = this.context;
    if (!context) return;
    const buffer = sound === 'go' ? this.go[Math.floor(Math.random() * this.go.length)] : this.buffers.get(sound);
    if (!buffer) return;
    try {
      // Source nodes are single-use.
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    } catch (err) {
      console.error(`Failed to play ${sound}:`, err);
    }
  }
}
