/* Tiny WebAudio synth. Event-driven SFX, optional music box loop (off by default). */

const SCALES = {
  usa: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5],
  france: [523.25, 587.33, 698.46, 783.99, 932.33, 1046.5],
  japan: [523.25, 587.33, 698.46, 880.0, 1046.5, 1174.66],
};

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxOn = true;
    this.musicOn = false;
    this.musicTimer = null;
    this.city = 'usa';
    this.musicStep = 0;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) { this.ctx?.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    if (this.musicOn) this.startMusic();
  }

  setSfx(on) {
    this.sfxOn = on;
  }

  setMusic(on) {
    this.musicOn = on;
    if (on) this.startMusic(); else this.stopMusic();
  }

  startMusic() {
    this.unlock();
    if (!this.ctx || this.musicTimer) return;
    this.nextNote = this.ctx.currentTime + 0.4;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 380);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  scheduleMusic() {
    if (!this.musicOn || !this.ctx) return;
    const ahead = this.ctx.currentTime + 1.1;
    if (!this.nextNote) this.nextNote = this.ctx.currentTime + 0.4;
    const scale = SCALES[this.city] || SCALES.usa;
    while (this.nextNote < ahead) {
      const step = this.musicStep++;
      if (step % 2 === 0 || Math.random() < 0.72) {
        const idx = (step * 3 + Math.floor(step / 4)) % scale.length;
        const octave = step % 8 === 6 ? 0.5 : 1;
        this.note(scale[idx] * octave, this.nextNote, 1.5, 0.028, 'sine');
      }
      if (step % 8 === 0) {
        this.note(scale[0] / 2, this.nextNote, 3.2, 0.022, 'triangle');
      }
      this.nextNote += step % 4 === 3 ? 0.95 : 0.48;
    }
  }

  note(freq, when, dur, vol, type = 'sine') {
    if (!this.ctx || !this.sfxOn) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(this.master);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  noise(when, dur, vol, type = 'lowpass', freq = 800, q = 0.7) {
    if (!this.ctx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(when);
    src.stop(when + dur + 0.05);
  }

  play(name, opts = {}) {
    if (!this.sfxOn) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'click':
        this.note(880, t, 0.07, 0.05, 'triangle');
        this.note(1320, t + 0.035, 0.06, 0.025, 'sine');
        break;
      case 'spark': {
        const n = opts.index ?? 0;
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        for (let i = 0; i < 3; i++) {
          this.note(notes[Math.min(n + i, notes.length - 1)] * 2, t + i * 0.06, 0.5, 0.045, 'sine');
          this.note(notes[Math.min(n + i, notes.length - 1)] * 4, t + i * 0.06, 0.25, 0.012, 'triangle');
        }
        break;
      }
      case 'quest':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.note(f, t + i * 0.1, 0.7, 0.045, 'triangle'));
        break;
      case 'questUpdate':
        this.note(523.25, t, 0.35, 0.04, 'sine');
        this.note(783.99, t + 0.09, 0.5, 0.035, 'sine');
        break;
      case 'stamp':
        this.noise(t, 0.18, 0.16, 'lowpass', 420, 1.2);
        this.note(150, t, 0.3, 0.12, 'sine');
        [1046.5, 1318.5, 1568].forEach((f, i) => this.note(f, t + 0.18 + i * 0.08, 0.9, 0.04, 'sine'));
        break;
      case 'jump':
        this.note(392, t, 0.12, 0.035, 'triangle');
        this.note(587.33, t + 0.03, 0.16, 0.03, 'sine');
        break;
      case 'land':
        this.note(146.83, t, 0.16, 0.05, 'sine');
        this.noise(t, 0.1, 0.02, 'lowpass', 500);
        break;
      case 'talk':
        this.note(620 + Math.random() * 160, t, 0.035, 0.014, 'sine');
        break;
      case 'open':
        this.note(523.25, t, 0.3, 0.035, 'sine');
        this.note(783.99, t + 0.08, 0.4, 0.03, 'sine');
        break;
      case 'close':
        this.note(783.99, t, 0.25, 0.03, 'sine');
        this.note(523.25, t + 0.06, 0.3, 0.025, 'sine');
        break;
      case 'whoosh':
        this.noise(t, 1.5, 0.1, 'bandpass', 700, 0.8);
        break;
      case 'firework':
        this.noise(t, 0.5, opts.volume ?? 0.1, 'lowpass', 260, 0.8);
        this.noise(t + 0.25, 0.9, (opts.volume ?? 0.1) * 0.6, 'highpass', 2400, 0.5);
        break;
      case 'bell':
        this.note(1568, t, 2.6, 0.035, 'sine');
        this.note(2093, t, 1.8, 0.015, 'sine');
        this.note(1046.5, t, 3, 0.02, 'sine');
        break;
      case 'finish':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.note(f, t + i * 0.13, 1.2, 0.045, 'sine'));
        break;
      case 'nope':
        this.note(220, t, 0.16, 0.035, 'triangle');
        this.note(196, t + 0.12, 0.22, 0.03, 'triangle');
        break;
      case 'carousel':
        [659.25, 783.99, 1046.5, 783.99].forEach((f, i) => this.note(f, t + i * 0.18, 1.1, 0.02, 'sine'));
        break;
      default:
        break;
    }
  }
}
