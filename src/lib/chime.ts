/**
 * The practice sounds — one bell and one tick, shared by every timer on the site.
 *
 * Both timers used to carry their own copy of a synthesised two-note chime, which
 * meant the public routines and the course practices could drift apart in sound.
 * They now share this.
 *
 * The bell is a real recording (`/audio/bell.mp3`). The tick is synthesised,
 * because it needs to be *quiet* — it marks the last three seconds of a hold so
 * the bell doesn't startle, and a recorded click would be another request for
 * something a filtered noise burst does perfectly well.
 *
 * Audio may only start from a user gesture, so every timer calls prime() from its
 * start button. If the bell can't be fetched or decoded, we fall back to the
 * synthesised chime rather than going silent — a timer nobody can hear from the
 * mat is a broken timer.
 */

const BELL_URL = '/audio/bell.mp3';
const MUTE_KEY = 'yin-sound-off';

/**
 * The bell is a peak-normalised recording; the tick is synthesised, so these
 * two numbers are the only thing keeping them in proportion.
 *
 * Set by ear against each other, not independently: the tick has to be audible
 * to someone lying still with their eyes closed, and the bell has to arrive as
 * the end of a hold rather than as a start. The first pass had the bell four
 * times the tick's amplitude — about 15 dB — which read as a fright after three
 * soft taps. Roughly 8 dB apart lands as the same instrument getting louder.
 */
const BELL_GAIN = 0.3;
const TICK_GAIN = 0.12;

export class Chime {
  private ctx: AudioContext | null = null;
  private bell_: AudioBuffer | null = null;
  private noise: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;

  get muted(): boolean {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  }
  set muted(v: boolean) {
    try { v ? localStorage.setItem(MUTE_KEY, '1') : localStorage.removeItem(MUTE_KEY); } catch {}
  }

  /** Call from a user gesture. Creates/resumes the context and warms the bell. */
  prime(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.bell_ && !this.loading) this.loading = this.load();
    } catch { /* audio unavailable — timers still run silently */ }
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch(BELL_URL);
      if (!res.ok) return;
      const bytes = await res.arrayBuffer();
      this.bell_ = await this.ctx!.decodeAudioData(bytes);
    } catch { /* fall back to the synthesised bell */ }
  }

  /** End of a hold. */
  bell(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    if (this.bell_) {
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = this.bell_;
      g.gain.value = BELL_GAIN;
      src.connect(g).connect(ctx.destination);
      src.start();
    } else {
      this.synthBell();
    }
  }

  /** One of the three counted into the end of a hold. A soft wooden tock. */
  tick(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // A short noise burst through a tight bandpass reads as a woodblock; a pure
    // tone at this length reads as an electronic beep, which is the wrong room.
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1150;
    bp.Q.value = 7;

    const g = ctx.createGain();
    g.gain.setValueAtTime(TICK_GAIN, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.06);
  }

  /** 100 ms of white noise, made once and reused for every tick. */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const len = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }

  /** The original two-note chime, kept as the fallback when the file won't load. */
  private synthBell(): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    ([[880, 0], [587.33, 0.5]] as [number, number][]).forEach(([freq, at]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + at);
      g.gain.exponentialRampToValueAtTime(0.32, now + at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.8);
      o.connect(g).connect(ctx.destination);
      o.start(now + at);
      o.stop(now + at + 1.7);
    });
  }
}

/** One per page — both timers can share a single context. */
export const chime = new Chime();
