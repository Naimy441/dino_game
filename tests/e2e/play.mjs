// End-to-end check. Run `npm run build` first: this serves dist/ with vite
// preview, drives the game in Chrome/Chromium (CHROMIUM_PATH, or a local
// Google Chrome) and saves screenshots to test-results/.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import fs from 'node:fs';

const out = 'test-results';
fs.mkdirSync(out, { recursive: true });
const server = await preview({ preview: { port: 4174, strictPort: true } });
const url = 'http://localhost:4174/';
const candidates = [
  process.env.CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/opt/pw-browsers/chromium',
].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};
const st = () => page.evaluate(() => {
  const d = window.__dino;
  return { state: d.state, score: d.game.score, alive: d.game.alive, map: d.game.map.id, colorful: d.game.colorful, mode: d.rig.mode, color: document.body.classList.contains('color'), fps: d.fps };
});
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });

try {
  await page.goto(url);
  await page.waitForFunction(() => window.__dino && window.__dino.state === 'menu');
  await page.waitForTimeout(1200);
  await shot('01-menu');
  check(await page.isVisible('#screen-start'), 'title screen shows');

  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  let s = await st();
  check(s.state === 'play' && s.map === 'desert' && !s.colorful, `run starts in the grey desert (${s.map})`);
  await page.waitForTimeout(1500);
  await shot('02-desert');

  // let the autopilot play through the colour explosion
  await page.evaluate(() => { window.__dino.autopilot = true; window.__dino.setScore(185); });
  await page.waitForFunction(() => window.__dino.game.score > 205, null, { timeout: 15000 });
  await page.waitForTimeout(300);
  await shot('03-colour-explosion');
  await page.waitForTimeout(1500);
  s = await st();
  check(s.colorful && s.color && s.map === 'forest', `world explodes into colour at 200 (${s.map})`);
  await shot('04-forest');

  for (const mode of ['chase', 'first', 'side']) {
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(900);
    s = await st();
    check(s.mode === mode, `camera cycles to ${mode}`);
    await shot(`05-cam-${mode}`);
  }

  for (const [i, id] of ['volcano', 'moon', 'blocky', 'reef', 'cave', 'store', 'candy', 'tundra', 'neon', 'space'].entries()) {
    await page.evaluate((m) => { window.__dino.start(m); window.__dino.autopilot = true; }, i + 2);
    await page.waitForTimeout(2500);
    s = await st();
    check(s.map === id && s.alive, `${id} runs (${s.map}, fps ${s.fps})`);
    await shot(`06-${String(i + 2).padStart(2, '0')}-${id}`);
  }

  // dying shows the game-over screen; space restarts
  await page.evaluate(() => { window.__dino.autopilot = false; window.__dino.start(0); });
  await page.waitForFunction(() => window.__dino.state === 'dead', null, { timeout: 20000 });
  check(await page.isVisible('#screen-over'), 'game over screen after a crash');
  await shot('07-game-over');
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  s = await st();
  check(s.state === 'play', 'space restarts');

  check(errors.length === 0, `no console errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ''}`);
} catch (e) {
  console.error(e);
  failures++;
} finally {
  await browser.close();
  server.httpServer.close();
}
console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
process.exit(failures ? 1 : 0);
