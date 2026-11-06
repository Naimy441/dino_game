// All sound is synthesised with Web Audio: no files.
//
// The classic desert is silent apart from the beeps, just like the original
// runner. The moment the world explodes into colour a chiptune kicks in, and
// every world has its own procedurally composed loop (key, scale, tempo,
// instruments), generated from a seed so it is the same every run.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  pent: [0, 2, 4, 7, 9, 12, 14],
};

const SONGS = {
  forest: { root: 55, scale: 'major', bpm: 150, lead: 'square', bass: 'triangle', seed: 3 },
  volcano: { root: 50, scale: 'phrygian', bpm: 168, lead: 'sawtooth', bass: 'square', seed: 11 },
  moon: { root: 57, scale: 'lydian', bpm: 120, lead: 'triangle', bass: 'sine', seed: 5, sparse: true },
  blocky: { root: 53, scale: 'pent', bpm: 140, lead: 'square', bass: 'triangle', seed: 21 },
  reef: { root: 52, scale: 'dorian', bpm: 124, lead: 'sine', bass: 'triangle', seed: 8, sparse: true },
  cave: { root: 45, scale: 'minor', bpm: 132, lead: 'triangle', bass: 'square', seed: 17 },
  store: { root: 60, scale: 'major', bpm: 128, lead: 'sine', bass: 'triangle', seed: 2, swing: true },
  candy: { root: 62, scale: 'pent', bpm: 172, lead: 'square', bass: 'square', seed: 33 },
  tundra: { root: 59, scale: 'major', bpm: 156, lead: 'triangle', bass: 'triangle', seed: 41 },
  neon: { root: 49, scale: 'minor', bpm: 176, lead: 'sawtooth', bass: 'sawtooth', seed: 9 },
  space: { root: 47, scale: 'lydian', bpm: 160, lead: 'square', bass: 'sawtooth', seed: 77 },
};

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function compose(song) {
  const r = rng(song.seed);
  const sc = SCALES[song.scale];
  const prog = [0, 5, 3, 4].map((d) => (r() < 0.3 ? (d + 2) % 7 : d));
  const motif = [];
  for (let i = 0; i < 16; i++) motif.push(r() < (song.sparse ? 0.45 : 0.7) ? Math.floor(r() * 7) : -1);
  const deg = (d, oct = 0) => song.root + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
  const bars = [];
  for (let b = 0; b < 8; b++) {
    const chord = prog[b % 4];
    const lead = motif.map((m, i) => (m < 0 ? null : deg(chord + m + (b >= 4 && i % 4 === 0 ? 2 : 0), 1)));
    bars.push({ chord, bass: deg(chord, -1), lead, arp: [0, 2, 4, 7].map((x) => deg(chord + x)) });
  }
  return bars;
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.song = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.32;
    this.musicBus.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, len);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  tone(freq, dur, { type = 'square', vol = 0.2, slide = 0, at = 0, bus = null, attack = 0.004 } = {}) {
    if (!this.ctx) return;
    const t = (at || this.ctx.currentTime) + 0.001;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  hiss(dur, { vol = 0.2, at = 0, freq = 2000, q = 0.8, bus = null, slide = 1 } = {}) {
    if (!this.ctx) return;
    const t = (at || this.ctx.currentTime) + 0.001;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    if (slide !== 1) f.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus || this.master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  // ------------------------------------------------------------ effects
  sfx(name, arg) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'jump': this.tone(560, 0.11, { slide: 1.6, vol: 0.12 }); break;
      case 'doubleJump': this.tone(760, 0.12, { slide: 1.7, vol: 0.12 }); break;
      case 'swim': this.tone(300, 0.12, { type: 'sine', slide: 1.8, vol: 0.12 }); this.hiss(0.1, { freq: 3000, vol: 0.05 }); break;
      case 'flip': this.tone(220, 0.25, { type: 'sawtooth', slide: 3, vol: 0.08 }); break;
      case 'land': this.hiss(0.05, { freq: 600, vol: 0.04 }); break;
      case 'hundred':
        this.tone(1047, 0.09, { vol: 0.12 });
        this.tone(1568, 0.16, { vol: 0.12, at: now + 0.1 });
        break;
      case 'die':
        this.tone(220, 0.35, { type: 'sawtooth', slide: 0.3, vol: 0.2 });
        this.hiss(0.3, { freq: 400, vol: 0.2 });
        break;
      case 'fire': this.hiss(0.45, { freq: 900, vol: 0.28, slide: 0.4, q: 0.5 }); this.tone(90, 0.4, { type: 'sawtooth', vol: 0.08 }); break;
      case 'swing': this.hiss(0.08, { freq: 4000, vol: 0.1, slide: 0.5 }); break;
      case 'kill':
        this.tone(160, 0.12, { type: 'square', slide: 0.5, vol: 0.14 });
        this.hiss(0.12, { freq: 1200, vol: 0.12 });
        break;
      case 'burn': this.hiss(0.25, { freq: 500, vol: 0.18 }); break;
      case 'smash': this.tone(110, 0.2, { type: 'square', slide: 0.5, vol: 0.18 }); this.hiss(0.15, { freq: 800, vol: 0.15 }); break;
      case 'giant': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, { vol: 0.1, at: now + i * 0.06 })); break;
      case 'shrink': [784, 523, 392].forEach((f, i) => this.tone(f, 0.1, { vol: 0.08, at: now + i * 0.06 })); break;
      case 'trick': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.08, { type: 'triangle', vol: 0.12, at: now + i * 0.05 })); break;
      case 'spin': this.tone(400, 0.4, { type: 'triangle', slide: 2.5, vol: 0.1 }); break;
      case 'lane': this.tone(900, 0.05, { type: 'triangle', vol: 0.06 }); break;
      case 'drop': this.tone(1400, 0.2, { type: 'sine', slide: 0.4, vol: 0.06 }); break;
      case 'crash': this.hiss(0.2, { freq: 300, vol: 0.2 }); break;
      case 'map':
        this.hiss(0.6, { freq: 3000, vol: 0.12, slide: 0.2 });
        [0, 4, 7, 12].forEach((s, i) => this.tone(midi(60 + s), 0.16, { vol: 0.1, at: now + 0.05 + i * 0.07 }));
        break;
      case 'explode':
        this.tone(55, 1.2, { type: 'sawtooth', slide: 0.4, vol: 0.35 });
        this.hiss(1.4, { freq: 1500, vol: 0.45, slide: 0.1, q: 0.4 });
        [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(midi(60 + s), 0.18, { vol: 0.1, at: now + 0.35 + i * 0.06 }));
        break;
      case 'click': this.tone(1200, 0.04, { vol: 0.06 }); break;
      default:
    }
  }

  // ------------------------------------------------------------ music
  playSong(id) {
    if (!this.ctx) return;
    const song = SONGS[id];
    if (!song) {
      this.stopMusic();
      return;
    }
    this.song = { ...song, bars: compose(song) };
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    const s = this.song;
    if (!s || !this.ctx) return;
    const stepDur = 60 / s.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const bar = s.bars[Math.floor(this.step / 16) % s.bars.length];
      const i = this.step % 16;
      let t = this.nextTime;
      if (s.swing && i % 2) t += stepDur * 0.25;
      const bus = this.musicBus;
      if (i % 4 === 0 || (i % 8 === 6 && !s.sparse)) this.tone(midi(bar.bass), stepDur * 1.8, { type: s.bass, vol: 0.32, at: t, bus });
      if (!s.sparse || i % 2 === 0) this.tone(midi(bar.arp[i % 4] + 12), stepDur * 0.8, { type: 'square', vol: 0.05, at: t, bus });
      if (bar.lead[i] != null) this.tone(midi(bar.lead[i]), stepDur * 1.6, { type: s.lead, vol: 0.12, at: t, bus });
      // drums
      if (i % 8 === 0) this.tone(120, 0.15, { type: 'sine', slide: 0.35, vol: 0.5, at: t, bus });
      if (i % 8 === 4) this.hiss(0.12, { freq: 1800, vol: 0.22, at: t, bus });
      if (i % 2 === 1 && !s.sparse) this.hiss(0.03, { freq: 8000, vol: 0.08, at: t, bus });
      this.nextTime += stepDur;
      this.step++;
    }
  }
}
