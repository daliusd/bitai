import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebAudioPlayer } from './audio';

class FakeContext {
  static instances: FakeContext[] = [];
  state: AudioContextState | 'interrupted' = 'suspended';
  destination = {};
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  decodeAudioData = vi.fn(async () => ({}) as AudioBuffer);
  started: unknown[] = [];
  createBufferSource = vi.fn(() => {
    const source = {
      buffer: null as unknown,
      connect: vi.fn(),
      start: vi.fn(() => this.started.push(source.buffer)),
    };
    return source;
  });
  constructor() {
    FakeContext.instances.push(this);
  }
}

function install() {
  FakeContext.instances = [];
  vi.stubGlobal('AudioContext', FakeContext);
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(1) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('WebAudioPlayer', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads every voice line once from the base URL', async () => {
    const fetchMock = install();
    const player = new WebAudioPlayer('/laikmatis/voices/');
    await Promise.all([player.unlock(), player.unlock()]);
    await player.unlock();
    expect(fetchMock).toHaveBeenCalledTimes(17);
    expect(fetchMock).toHaveBeenCalledWith('/laikmatis/voices/go10.mp3');
    expect(fetchMock).toHaveBeenCalledWith('/laikmatis/voices/3.mp3');
    expect(fetchMock).toHaveBeenCalledWith('/laikmatis/voices/stop.mp3');
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('resumes a suspended context on every start, not only the first', async () => {
    install();
    const player = new WebAudioPlayer('/v/');
    await player.unlock();
    const context = FakeContext.instances[0];
    expect(context.resume).toHaveBeenCalledTimes(1);

    // iOS interrupts the context when the screen locks between sessions.
    context.state = 'interrupted';
    await player.unlock();
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(context.state).toBe('running');
  });

  it('plays loaded sounds and ignores unknown ones before loading', async () => {
    install();
    const player = new WebAudioPlayer('/v/');
    player.play('go'); // No context yet: silently nothing.
    await player.unlock();
    player.play('go');
    player.play('countdown2');
    expect(FakeContext.instances[0].started).toHaveLength(2);
  });

  it('retries loading after a failure', async () => {
    const fetchMock = install();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const player = new WebAudioPlayer('/v/');
    await player.unlock();
    fetchMock.mockClear();
    await player.unlock();
    expect(fetchMock).toHaveBeenCalledTimes(17);
  });

  it('does nothing without Web Audio support', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const player = new WebAudioPlayer('/v/');
    await expect(player.unlock()).resolves.toBeUndefined();
    expect(() => player.play('stop')).not.toThrow();
  });
});
