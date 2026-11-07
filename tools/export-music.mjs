// Renders every world's theme to an .m4a in music/: one full loop plus the
// echo's tail, using the game's own chiptune engine in headless Chrome
// (an OfflineAudioContext, so it renders faster than real time), then
// converts with macOS `afconvert` (AAC, 256 kbps).
//
//   node tools/export-music.mjs [world ...]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'music';
fs.mkdirSync(outDir, { recursive: true });
const server = await createServer({ server: { port: 5299, strictPort: true }, logLevel: 'error' });
await server.listen();
const candidates = [
  process.env.CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = await chromium.launch({ executablePath: candidates.find((p) => fs.existsSync(p)) });
const page = await browser.newPage();
await page.goto('http://localhost:5299/src/audio/songs.js');

const { MAPS } = await server.ssrLoadModule('/src/game/maps.js');
const { SONGS } = await server.ssrLoadModule('/src/audio/songs.js');
const wanted = process.argv.slice(2);
const ids = Object.keys(SONGS).filter((id) => !wanted.length || wanted.includes(id));
const nameOf = (id) => {
  const i = MAPS.findIndex((m) => m.id === id);
  return `${String(i + 1).padStart(2, '0')}-${id}`;
};

for (const id of ids) {
  const b64 = await page.evaluate(async (id) => {
    const { Audio, compile } = await import('/src/audio/Audio.js');
    const { SONGS } = await import('/src/audio/songs.js');
    const def = SONGS[id];
    const c = compile(def);
    const stepDur = 60 / def.bpm / 4;
    const tail = 2;
    const rate = 44100;
    const off = new OfflineAudioContext(1, Math.ceil(rate * (c.n * stepDur + tail + 0.1)), rate);
    // run the engine against the offline context
    const A = new Audio();
    const Real = window.AudioContext;
    window.AudioContext = function () { return off; };
    A.ensure();
    window.AudioContext = Real;
    A.delay.delayTime.value = Math.min(1.4, (60 / def.bpm) * 0.75);
    const song = { def, c, stepDur };
    for (let k = 0; k < c.n; k++) A.playStep(song, k, 0.05 + k * stepDur);
    const buf = await off.startRendering();
    // 16-bit PCM WAV
    const d = buf.getChannelData(0);
    const bytes = new ArrayBuffer(44 + d.length * 2);
    const v = new DataView(bytes);
    const str = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    str(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, d.length * 2, true);
    for (let i = 0; i < d.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    // base64 in chunks
    const u8 = new Uint8Array(bytes);
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return btoa(s);
  }, id);
  const wav = path.join(outDir, `${nameOf(id)}.wav`);
  const m4a = path.join(outDir, `${nameOf(id)}.m4a`);
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '256000', wav, m4a]);
  fs.unlinkSync(wav);
  console.log(`${m4a}  ${(fs.statSync(m4a).size / 1024).toFixed(0)} KB`);
}

await browser.close();
await server.close();
