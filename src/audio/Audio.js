// All sound is synthesised with Web Audio: no files.
//
// The classic desert is silent apart from the beeps, just like the original
// runner. The moment the world explodes into colour the music kicks in: a
// little four-channel chiptune engine (two pulse channels, a stepped 4-bit
// triangle and noise drums, like an old console) playing a hand-written theme
// for every world (see songs.js).

import { SONGS, DRUMS } from './songs.js';

const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CHORD = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  dim: [0, 3, 6], aug: [0, 4, 8], sus4: [0, 5, 7], sus2: [0, 2, 7], 5: [0, 7],
};

export function parseNote(s) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) return null;
  return (Number(m[3]) + 1) * 12 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function parseChord(s) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(s);
  if (!m || !(m[3] in CHORD)) throw new Error(`bad chord ${s}`);
  const root = PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return { root: (root + 12) % 12, iv: CHORD[m[3]] };
}

// Turn a song into flat per-16th-step arrays the scheduler can walk.
export function compile(song) {
  const beats = song.beats || 4;
  const spb = beats * 4; // 16ths per bar
  const tpb = beats * 2; // 8th-note tokens per bar
  const cells = [];
  const chordAt = [];
  const barStart = [];
  const sectionStart = [];
  for (const name of song.order) {
    const part = song.parts[name];
    const bars = part.mel.split('|').map((b) => b.trim()).filter(Boolean);
    const chords = part.chords.trim().split(/\s+/);
    bars.forEach((bar, bi) => {
      const toks = bar.split(/\s+/);
      if (toks.length !== tpb) throw new Error(`${name} bar ${bi + 1}: ${toks.length} tokens, want ${tpb}`);
      const base = cells.length;
      for (const t of toks) {
        if (t.includes('+')) cells.push(...t.split('+'));
        else if (t === '-' || t === '.') cells.push(t, t);
        else cells.push(t, '-');
      }
      const halves = (chords[bi % chords.length] || 'C').split(',').map(parseChord);
      for (let i = 0; i < spb; i++) {
        chordAt[base + i] = halves[Math.min(halves.length - 1, Math.floor((i / spb) * halves.length))];
        barStart[base + i] = i === 0;
        sectionStart[base + i] = i === 0 && bi === 0;
      }
    });
  }
  const n = cells.length;
  const lead = new Array(n).fill(null);
  let cur = null;
  for (let i = 0; i < n; i++) {
    const c = cells[i];
    if (c === '-') {
      if (cur) cur.len++;
    } else if (c === '.') cur = null;
    else {
      const midi = parseNote(c);
      if (midi == null) throw new Error(`bad note ${c}`);
      cur = { midi, len: 1 };
      lead[i] = cur;
    }
  }
  // last bar of every section gets a drum fill
  const fill = new Array(n).fill(false);
  for (let i = 0; i < n; i++) if (sectionStart[(i + spb) % n]) fill[i] = true;
  return { n, spb, lead, chordAt, barStart, sectionStart, fill };
}

// pulse waves with a given duty, and the NES's 4-bit stepped triangle
function pulseWave(ctx, duty) {
  const N = 48;
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let k = 1; k < N; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(re, im);
}
function steppedTriangle(ctx) {
  const S = 512, N = 40;
  const x = new Float32Array(S);
  for (let i = 0; i < S; i++) {
    const p = i / S;
    const tri = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
    x[i] = Math.round((tri + 1) * 7.5) / 7.5 - 1; // 16 levels
  }
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let k = 1; k < N; k++) {
    let a = 0, b = 0;
    for (let i = 0; i < S; i++) {
      const w = (2 * Math.PI * k * i) / S;
      a += x[i] * Math.cos(w);
      b += x[i] * Math.sin(w);
    }
    re[k] = (2 * a) / S;
    im[k] = (2 * b) / S;
  }
  return ctx.createPeriodicWave(re, im);
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
      if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = (this.ctx = new AC());
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.ratio.value = 3;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.15;
    this.comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.comp);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.72;
    this.musicBus.connect(this.master);
    // lead echo: a dotted-8th delay, darkened a little each repeat
    this.leadBus = ctx.createGain();
    this.leadBus.connect(this.musicBus);
    this.delay = ctx.createDelay(1.5);
    this.delayFb = ctx.createGain();
    this.delayFb.gain.value = 0.3;
    this.delayTone = ctx.createBiquadFilter();
    this.delayTone.type = 'lowpass';
    this.delayTone.frequency.value = 2600;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0.26;
    this.echoSend = ctx.createGain();
    this.echoSend.connect(this.delay);
    this.delay.connect(this.delayTone).connect(this.delayFb).connect(this.delay);
    this.delayTone.connect(this.delayWet).connect(this.musicBus);

    this.waves = {
      p12: pulseWave(ctx, 0.125), p25: pulseWave(ctx, 0.25), p50: pulseWave(ctx, 0.5), tri: steppedTriangle(ctx),
    };
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, len);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // the NES "metallic" short-loop noise, for hats
    this.metal = ctx.createBuffer(1, 4096, len);
    const m = this.metal.getChannelData(0);
    let reg = 1;
    for (let i = 0, v = 1; i < 4096; i++) {
      if (i % 6 === 0) {
        const bit = (reg ^ (reg >> 6)) & 1;
        reg = (reg >> 1) | (bit << 14);
        v = reg & 1 ? 1 : -1;
      }
      m[i] = v;
    }
    // some browsers create the context suspended even inside a key press
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    // when the clock (re)starts, line the song up with it again
    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'running' && this.song) this.nextTime = ctx.currentTime + 0.05;
    });
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  // ------------------------------------------------------------ voices
  osc(wave) {
    const o = this.ctx.createOscillator();
    if (this.waves[wave]) o.setPeriodicWave(this.waves[wave]);
    else o.type = wave === 'saw' ? 'sawtooth' : wave || 'square';
    return o;
  }

  // One pitched note with an attack/decay/sustain envelope, optional delayed
  // vibrato and pitch slide.
  voice(midi, at, dur, { wave = 'p50', vol = 0.1, vib = 0, slide = 0, bus = null, sustain = 0.65, decay = 0.09, send = null } = {}) {
    const ctx = this.ctx;
    const t = Math.max(at, ctx.currentTime) + 0.002;
    const f = hz(midi);
    const o = this.osc(wave);
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * Math.pow(2, slide / 12)), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setTargetAtTime(vol * sustain, t + 0.005, decay / 3);
    g.gain.setTargetAtTime(0, t + dur, 0.018);
    o.connect(g).connect(bus || this.master);
    if (send) g.connect(send);
    if (vib && dur > 0.16) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.8;
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.setValueAtTime(0, t + 0.12);
      lg.gain.linearRampToValueAtTime(f * (Math.pow(2, vib / 12) - 1), t + Math.min(0.4, dur));
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.12);
    }
    o.start(t);
    o.stop(t + dur + 0.12);
  }

  tone(freq, dur, { type = 'square', vol = 0.2, slide = 0, at = 0, bus = null } = {}) {
    if (!this.ctx) return;
    const t = (at || this.ctx.currentTime) + 0.001;
    const o = this.osc(type === 'square' ? 'p50' : type === 'sawtooth' ? 'saw' : type);
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  hiss(dur, { vol = 0.2, at = 0, freq = 2000, q = 0.8, bus = null, slide = 1, type = 'bandpass', metal = false } = {}) {
    if (!this.ctx) return;
    const t = (at || this.ctx.currentTime) + 0.001;
    const s = this.ctx.createBufferSource();
    s.buffer = metal ? this.metal : this.noise;
    s.loop = metal;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slide !== 1) f.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus || this.master);
    s.start(t, metal ? 0 : Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  // quick melodic jingles for effects
  jingle(notes, step, { wave = 'p25', vol = 0.1, at = 0, len = 0.9 } = {}) {
    const t0 = at || this.ctx.currentTime;
    notes.forEach((n, i) => n != null && this.voice(n, t0 + i * step, step * len, { wave, vol, sustain: 0.8 }));
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
      case 'boing': this.tone(180, 0.18, { type: 'tri', slide: 2.6, vol: 0.16 }); break;
      case 'hundred':
        this.tone(1047, 0.09, { vol: 0.12 });
        this.tone(1568, 0.16, { vol: 0.12, at: now + 0.1 });
        break;
      case 'die':
        // the hit, right away
        this.tone(330, 0.16, { type: 'p25', slide: 0.45, vol: 0.12 });
        this.hiss(0.12, { freq: 600, vol: 0.09 });
        // in the colour worlds, a short "game over" sting straight after
        if (arg !== 'classic') this.jingle([71, 67, 64, 59], 0.08, { at: now + 0.12, vol: 0.06, wave: 'p25' });
        break;
      case 'fire': this.hiss(0.45, { freq: 900, vol: 0.28, slide: 0.4, q: 0.5 }); this.tone(90, 0.4, { type: 'sawtooth', vol: 0.08 }); break;
      case 'swing': this.hiss(0.08, { freq: 4000, vol: 0.1, slide: 0.5 }); break;
      case 'kill':
        this.tone(160, 0.12, { type: 'square', slide: 0.5, vol: 0.14 });
        this.hiss(0.12, { freq: 1200, vol: 0.12 });
        break;
      case 'burn': this.hiss(0.25, { freq: 500, vol: 0.18 }); break;
      case 'wall':
        // a big satisfying crunch for walls you had to break
        this.tone(90, 0.35, { type: 'p25', slide: 0.4, vol: 0.2 });
        this.hiss(0.4, { freq: 700, vol: 0.28, slide: 0.3, q: 0.4 });
        this.jingle([76, 79, 84], 0.05, { at: now + 0.06, vol: 0.08, wave: 'p12' });
        break;
      case 'shoot':
        this.tone(1400, 0.07, { type: 'p25', slide: 0.35, vol: 0.09 });
        this.hiss(0.06, { freq: 3500, vol: 0.12, type: 'highpass' });
        break;
      case 'hit': this.tone(1800, 0.05, { type: 'p12', vol: 0.06 }); this.hiss(0.05, { freq: 2500, vol: 0.08 }); break;
      case 'clink': this.tone(2600, 0.06, { type: 'tri', slide: 0.8, vol: 0.06 }); break;
      case 'phase': this.tone(300, 0.4, { type: 'p12', slide: 3, vol: 0.08 }); this.tone(450, 0.4, { type: 'tri', slide: 0.5, vol: 0.08 }); break;
      case 'dash': this.hiss(0.25, { freq: 2500, vol: 0.2, slide: 0.25, q: 0.6 }); this.tone(500, 0.2, { type: 'p25', slide: 2, vol: 0.06 }); break;
      case 'slash': this.hiss(0.12, { freq: 6000, vol: 0.18, slide: 0.4, type: 'highpass' }); this.tone(1200, 0.1, { type: 'p12', slide: 0.5, vol: 0.06 }); break;
      case 'glide': this.hiss(0.3, { freq: 1200, vol: 0.05, slide: 1.5 }); break;
      case 'smash': this.tone(110, 0.2, { type: 'square', slide: 0.5, vol: 0.18 }); this.hiss(0.15, { freq: 800, vol: 0.15 }); break;
      case 'giant': this.jingle([72, 76, 79, 84, 88], 0.06, { vol: 0.1, wave: 'p50' }); break;
      case 'shrink': this.jingle([79, 72, 67], 0.06, { vol: 0.08, wave: 'p50' }); break;
      case 'trick': this.jingle([76, 81, 88], 0.05, { vol: 0.12, wave: 'tri' }); break;
      case 'spin': this.tone(400, 0.4, { type: 'triangle', slide: 2.5, vol: 0.1 }); break;
      case 'lane': this.tone(900, 0.05, { type: 'triangle', vol: 0.06 }); break;
      case 'drop': this.tone(1400, 0.2, { type: 'sine', slide: 0.4, vol: 0.06 }); break;
      case 'crash': this.hiss(0.2, { freq: 300, vol: 0.2 }); break;
      case 'warn': this.jingle([88, 88], 0.07, { vol: 0.05, wave: 'p12', len: 0.6 }); break;
      case 'map':
        this.hiss(0.6, { freq: 3000, vol: 0.1, slide: 0.2 });
        this.jingle([72, 76, 79, 84, 79, 84, 88], 0.055, { at: now + 0.04, vol: 0.09, wave: 'p25' });
        break;
      case 'explode':
        this.tone(55, 1.2, { type: 'sawtooth', slide: 0.4, vol: 0.35 });
        this.hiss(1.4, { freq: 1500, vol: 0.45, slide: 0.1, q: 0.4 });
        this.jingle([60, 64, 67, 72, 76, 79, 84, 88], 0.06, { at: now + 0.35, vol: 0.1, wave: 'p25' });
        break;
      case 'click': this.tone(1200, 0.04, { vol: 0.06 }); break;
      default:
    }
  }

  // ------------------------------------------------------------ music
  playSong(id) {
    if (!this.ctx) return;
    const def = SONGS[id];
    if (!def) {
      this.stopMusic();
      return;
    }
    this.song = { id, def, c: compile(def), stepDur: 60 / def.bpm / 4 };
    this.delay.delayTime.value = Math.min(1.4, (60 / def.bpm) * 0.75);
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
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
      return;
    }
    // fell behind (background tab, a stall): skip ahead instead of firing
    // a pile of late notes at once
    if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(s, this.step % s.c.n, this.nextTime);
      this.nextTime += s.stepDur;
      this.step++;
    }
  }

  playStep(s, k, time) {
    const { def, c, stepDur: sd } = s;
    const key = def.key || 0;
    const i = k % c.spb; // step within the bar
    const t = time + (def.swing && i % 2 ? sd * def.swing : 0);
    const ch = c.chordAt[k];
    const bus = this.musicBus;
    const L = def.lead;

    // ---- lead
    const ev = c.lead[k];
    if (ev) {
      const m = ev.midi + key + 12 * (L.oct || 0);
      const dur = ev.len * sd * (L.gate ?? 0.92);
      this.voice(m, t, dur, { wave: L.wave, vol: L.vol, vib: L.vib, bus: this.leadBus, send: L.echo ? this.echoSend : null });
    }

    // ---- harmony
    const H = def.harm;
    const tones = (oct) => ch.iv.map((iv) => 12 * oct + ((ch.root + key) % 12 + 12) % 12 + iv);
    if (H) {
      switch (H.mode) {
        case 'arp': {
          const tt = tones(5);
          if (H.slow) {
            if (i % 2 === 0) this.voice(tt[(i / 2) % tt.length], t, sd * 1.8, { wave: H.wave, vol: H.vol, bus });
          } else {
            this.voice(tt[(i * (H.fast ? 2 : 1)) % tt.length] + 12, t, sd * (H.fast ? 0.45 : 0.9), { wave: H.wave, vol: H.vol, bus, sustain: 0.9 });
            if (H.fast) this.voice(tt[(i * 2 + 1) % tt.length] + 12, t + sd / 2, sd * 0.45, { wave: H.wave, vol: H.vol, bus, sustain: 0.9 });
          }
          break;
        }
        case 'stab':
          if (i % 4 === 2) for (const n of tones(5)) this.voice(n, t, sd * 1.3, { wave: H.wave, vol: H.vol, bus, sustain: 0.5 });
          break;
        case 'waltz':
          if (i === 4 || i === 8) for (const n of tones(5)) this.voice(n, t, sd * 1.6, { wave: H.wave, vol: H.vol, bus, sustain: 0.5 });
          break;
        case 'pad':
          if (i % 8 === 0) tones(5).forEach((n, j) => this.voice(n, t + j * sd * 0.5, sd * 7.5, { wave: H.wave, vol: H.vol, bus, sustain: 0.8, decay: 0.4 }));
          break;
        case 'echo': {
          const back = c.lead[(k - 3 + c.n) % c.n];
          if (back) this.voice(back.midi + key + 12 * (L.oct || 0), t, Math.min(back.len, 4) * sd * 0.8, { wave: H.wave, vol: H.vol, bus });
          break;
        }
        case 'third':
          if (ev) {
            const m = ev.midi + key;
            // the highest chord tone at least a minor third below the melody
            let best = null;
            for (let o = 3; o <= 6; o++) for (const n of tones(o)) if (n <= m - 3 && (best == null || n > best)) best = n;
            if (best != null) this.voice(best, t, ev.len * sd * 0.9, { wave: H.wave, vol: H.vol, bus });
          }
          break;
        default:
      }
    }

    // ---- bass (the stepped triangle)
    const B = def.bass;
    const root = 36 + ((ch.root + key) % 12 + 12) % 12;
    const fifth = root + (ch.iv.includes(6) ? 6 : ch.iv.includes(8) ? 8 : 7);
    const bv = B.vol;
    const bass = (n, len) => this.voice(n, t, len * sd, { wave: 'tri', vol: bv, bus, sustain: 0.85 });
    switch (B.mode) {
      case 'octave': if (i % 2 === 0) bass(i % 4 === 0 ? root : root + 12, 1.7); break;
      case 'drive': if (i % 2 === 0) bass(root, 1.6); break;
      case 'drive16': bass(i % 8 === 6 ? fifth : root, 0.85); break;
      case 'gallop': if (i % 4 !== 1) bass(i % 8 === 4 ? fifth : root, 0.9); break;
      case 'root': if (i % 8 === 0) bass(i === 0 ? root : fifth, 7.5); break;
      case 'waltz': if (i === 0) bass(root, 3.5); else if (i === 4 || i === 8) bass(fifth - 12 + 12, 1.5); break;
      case 'walk': {
        if (i % 4 !== 0) break;
        const q = i / 4;
        const next = c.chordAt[(k - i + c.spb) % c.n];
        const nroot = 36 + ((next.root + key) % 12 + 12) % 12;
        const third = root + ch.iv[1];
        const n = q === 0 ? root : q === 1 ? third : q === 2 ? fifth : nroot + (nroot > root ? -1 : 1);
        bass(n, 3.6);
        break;
      }
      default:
    }

    // ---- drums
    const D = DRUMS[def.drums];
    if (!D) return;
    const at = (p) => p && p[i % p.length];
    const fill = c.fill[k] && i >= c.spb - 4;
    if (c.sectionStart[k]) this.hiss(0.9, { freq: 5000, vol: 0.07, at: t, bus, type: 'highpass' });
    if (at(D.k) === 'x') {
      this.tone(150, 0.13, { type: 'sine', slide: 0.28, vol: 0.55, at: t, bus });
      this.hiss(0.015, { freq: 1200, vol: 0.12, at: t, bus });
    }
    if (at(D.s) === 'x' || fill) {
      const v = fill ? 0.12 + (i - (c.spb - 4)) * 0.03 : 0.2;
      this.hiss(0.12, { freq: 1900, q: 0.7, vol: v, at: t, bus });
      this.tone(200, 0.07, { type: 'tri', slide: 0.6, vol: 0.12, at: t, bus });
    }
    const h = at(D.h);
    if (h === 'x' || h === 'o') this.hiss(h === 'o' ? 0.16 : 0.03, { freq: 7000, vol: 0.05, at: t, bus, type: 'highpass', metal: true });
  }
}
