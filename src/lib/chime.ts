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
 * Levels. Both are expressed as a target output true peak, because the previous
 * pair of numbers were not comparable and the bell was far too loud on a phone.
 *
 * The trap: the bell's gain multiplies a peak-normalised file (true peak
 * -0.9 dBFS), so its number lands almost directly on the output. The tick's gain
 * sits BEFORE a bandpass at Q=7, which throws away most of a white-noise burst —
 * measured at 21 dB of loss. So the old constants, 0.3 against 0.12, looked 8 dB
 * apart and measured 28 dB apart. Lying on a mat with the phone across the room,
 * you set the volume to hear the ticks, and then the bell arrived at full force.
 *
 * Both are now stated as the peak they actually produce, and TICK_MAKEUP puts
 * back what the filter takes so TICK_PEAK means what it says. The bell sits ~5 dB
 * above the tick in peak; because it sustains for seconds where the tick is 55 ms,
 * that reads as roughly 8 dB louder — the same instrument, struck harder.
 *
 * If you change the bell recording, re-measure its true peak and update
 * BELL_FILE_PEAK, or the bell silently changes level with it.
 */
const TICK_PEAK = 0.05;        // −26 dBFS: audible from the mat, still a soft tock
const BELL_PEAK = 0.09;        // −21 dBFS
const BELL_FILE_PEAK = 0.902;  // −0.9 dBFS, measured on /audio/bell.mp3
const TICK_MAKEUP = 11.5;      // +21 dB, the bandpass loss measured below

const BELL_GAIN = BELL_PEAK / BELL_FILE_PEAK;
const TICK_GAIN = TICK_PEAK * TICK_MAKEUP;

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
    // The filter costs ~21 dB, which TICK_MAKEUP puts back — see the note above.
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
      // Matched to BELL_PEAK, so falling back to the synth doesn't fall back to
      // the old, far-too-loud level. A sine's peak is its gain, near enough.
      g.gain.exponentialRampToValueAtTime(BELL_PEAK, now + at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.8);
      o.connect(g).connect(ctx.destination);
      o.start(now + at);
      o.stop(now + at + 1.7);
    });
  }
}

/** One per page — both timers can share a single context. */
export const chime = new Chime();
