import './style.css';
import * as THREE from 'three';
import { Game, ABILITY } from './game/Game.js';
import { Bot } from './game/Bot.js';
import { MAPS, COLOR_SCORE, mapStartScore } from './game/maps.js';
import { World } from './render/World.js';
import { THEMES } from './render/themes.js';
import { DinoView } from './render/DinoView.js';
import { ObstacleView } from './render/ObstacleView.js';
import { Particles } from './render/Particles.js';
import { CameraRig, CAMERA_MODES, CAMERA_NAMES } from './render/CameraRig.js';
import { Post } from './render/Post.js';
import { Audio } from './audio/Audio.js';

THREE.ColorManagement.enabled = false;

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(`dino-dash-${k}`);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`dino-dash-${k}`, JSON.stringify(v));
    } catch {
      /* private mode */
    }
  },
};

const PIXELS = [
  { id: 'chunky', name: 'CHUNKY', px: 4 },
  { id: 'big', name: 'BIG', px: 3 },
  { id: 'fine', name: 'FINE', px: 2 },
];

function boot() {
  const canvas = $('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  } catch (e) {
    document.body.classList.add('boot-failed');
    $('loader-msg').textContent = 'WebGL is not available in this browser.';
    return;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const post = new Post(renderer);
  const world = new World(scene);
  const dino = new DinoView(scene);
  const obstacles = new ObstacleView(scene);
  const particles = new Particles(scene);
  const rig = new CameraRig(camera);
  const audio = new Audio();

  const settings = {
    camera: store.get('camera', 'side'),
    pixels: store.get('pixels', 'big'),
    muted: store.get('muted', false),
  };
  let best = store.get('best', 0);
  let unlocked = store.get('unlocked', 0);
  let pickMap = Math.min(store.get('pick', 0), unlocked);
  audio.setMuted(settings.muted);

  const params = new URLSearchParams(location.search);
  if (params.has('map')) {
    const i = MAPS.findIndex((m) => m.id === params.get('map'));
    if (i >= 0) {
      unlocked = Math.max(unlocked, i);
      pickMap = i;
    }
  }
  if (params.has('fps')) $('fps').classList.remove('hidden');

  let game = new Game({ startMap: 0 });
  let bot = new Bot(game, 1 / 120);
  let state = 'menu';
  let timeScale = 1;
  let slowmo = 0;
  let reveal = null; // colour explosion progress
  let flash = 0;
  let deadAt = 0;
  let hintTimer = 0;
  let currentTheme = null;
  let fps = 60;
  let autopilot = params.has('bot');
  let faceAmt = settings.camera === 'side' ? 0 : 1;
  let underwater = false;
  const UNDERWATER = new THREE.Color('#0b5d86');
  const tmp = new THREE.Vector3();

  // ------------------------------------------------------------ setup
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    post.pixel = (PIXELS.find((p) => p.id === settings.pixels) || PIXELS[1]).px;
    post.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function applyTheme(force = false) {
    const id = game.map.id;
    if (id === currentTheme && !force) return;
    currentTheme = id;
    const T = THEMES[id];
    world.setTheme(id);
    dino.setGear(game.map.gimmick, T);
    post.uniforms.uWobble.value = T.wobble || 0;
    post.setLook(T.light);
    obstacles.prewarm(game.map);
    post.uniforms.uDark.value = T.headlamp ? 0.6 : 0;
    applyVignette();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', T.fog);
  }

  function setColorful(on) {
    document.body.classList.toggle('color', on);
    dino.setLook(on ? 'color' : 'mono');
    post.uniforms.uColor.value = on ? 1 : 0;
    applyVignette();
  }
  function applyVignette() {
    const T = THEMES[game.map.id];
    post.uniforms.uVignette.value = !document.body.classList.contains('color') ? 0 : T.headlamp ? 0.9 : 0.25;
  }

  const allUnlocked = () => unlocked >= MAPS.length - 1;
  function newGame(startMap, demo = false) {
    // once every world has been reached, runs visit them in a random order
    game = new Game({ startMap, shuffle: !demo && allUnlocked() });
    bot = new Bot(game, 1 / 120);
    obstacles.clear();
    particles.clear();
    currentTheme = null;
    applyTheme(true);
    setColorful(game.colorful);
    reveal = null;
    post.uniforms.uRadius.value = -1;
    timeScale = 1;
    slowmo = 0;
    updateWorldLabel();
    if (!demo) {
      audio.ensure();
      if (game.colorful) audio.playSong(game.map.id);
      else audio.stopMusic();
      showCard(true);
    }
  }

  // ------------------------------------------------------------ HUD
  const pad = (n) => String(Math.floor(n)).padStart(5, '0');
  let lastScoreText = '';
  function updateHud() {
    const s = pad(game.score);
    if (s !== lastScoreText) {
      $('hud-score').textContent = s;
      lastScoreText = s;
    }
    $('hud-hi').textContent = pad(Math.max(best, state === 'play' ? 0 : 0));
    const d = game.dino;
    const g = game.map.gimmick;
    let meter = null;
    if (g === 'fire') meter = ['FIRE', 1 - d.fireCd / 0.75];
    else if (g === 'pickaxe') meter = ['PICK', 1 - d.swingCd / 0.32];
    else if (ABILITY[g]) meter = [ACT_NAME[g], 1 - d.actCd / ABILITY[g][1]];
    else if (d.giant > 0) meter = ['GIANT', d.giant / 5];
    const el = $('hud-meter');
    if (meter && state === 'play') {
      el.classList.remove('hidden');
      $('hud-meter-label').textContent = meter[0];
      $('hud-meter-fill').style.width = `${Math.max(0, Math.min(1, meter[1])) * 100}%`;
    } else el.classList.add('hidden');

    // a wall you can only get through with the world's ability: say so
    const wall = state === 'play' && game.alive ? game.nextWall(26) : null;
    const hint = $('hud-hint');
    if (wall) {
      if (wall.id !== lastWall) {
        lastWall = wall.id;
        audio.sfx('warn');
      }
      const verb = { fire: 'BURN IT', pickaxe: 'MINE IT', gun: 'SHOOT IT', phase: 'PHASE', dash: 'DASH' }[g] || 'GO';
      hint.textContent = `${isTouch ? ACT_NAME[g] || 'X' : 'X'}  ${verb}!`;
      hint.classList.remove('hidden');
      hint.classList.toggle('urgent', wall.x < game.speed * 0.45 + 4);
    } else hint.classList.add('hidden');
  }
  let lastWall = -1;
  const ACT_NAME = { fire: 'FIRE', pickaxe: 'PICK', gun: 'SHOOT', phase: 'PHASE', dash: 'DASH' };
  function updateWorldLabel() {
    $('hud-world-n').textContent = `${game.mapIndex + 1}/${MAPS.length}`;
    $('hud-world-name').textContent = game.map.name;
    const lap = $('hud-lap');
    lap.classList.toggle('hidden', game.lap === 0);
    lap.textContent = `LAP ${game.lap + 1}`;
  }
  function showCard(start = false) {
    const card = $('card');
    card.classList.remove('hidden');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    $('card-n').textContent = start && game.mapIndex === 0 ? 'GET READY' : `WORLD ${game.mapIndex + 1}`;
    $('card-name').textContent = game.map.name;
    $('card-hint').textContent = game.map.hint;
    clearTimeout(showCard.t);
    showCard.t = setTimeout(() => card.classList.add('hidden'), 2700);
  }
  function popText(text, x, y) {
    tmp.set(x, y, game.dino.z).project(camera);
    if (tmp.z > 1) return;
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = text;
    el.style.left = `${(tmp.x * 0.5 + 0.5) * 100}%`;
    el.style.top = `${(-tmp.y * 0.5 + 0.5) * 100}%`;
    $('hud-pop').appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function syncOptions() {
    $('opt-cam').textContent = CAMERA_NAMES[settings.camera];
    $('hud-cam').textContent = CAMERA_NAMES[settings.camera];
    $('opt-pix').textContent = (PIXELS.find((p) => p.id === settings.pixels) || PIXELS[1]).name;
    $('opt-mute').textContent = settings.muted ? 'OFF' : 'ON';
    $('hud-mute').textContent = settings.muted ? 'MUTED' : 'SOUND';
    $('world-pick').textContent = MAPS[pickMap].name;
    $('world-prev').disabled = pickMap <= 0;
    $('world-next').disabled = pickMap >= unlocked;
    $('menu-best').textContent = String(best);
    $('menu-shuffle').classList.toggle('hidden', !allUnlocked());
    $('hud-hi').textContent = pad(best);
  }

  // ------------------------------------------------------------ actions
  function cycleCamera() {
    const i = CAMERA_MODES.indexOf(settings.camera);
    settings.camera = CAMERA_MODES[(i + 1) % CAMERA_MODES.length];
    store.set('camera', settings.camera);
    rig.setMode(settings.camera);
    world.setMode(settings.camera);
    syncOptions();
    audio.sfx('click');
  }
  function cyclePixels() {
    const i = PIXELS.findIndex((p) => p.id === settings.pixels);
    settings.pixels = PIXELS[(i + 1) % PIXELS.length].id;
    store.set('pixels', settings.pixels);
    resize();
    syncOptions();
  }
  function toggleMute() {
    settings.muted = !settings.muted;
    store.set('muted', settings.muted);
    audio.ensure();
    audio.setMuted(settings.muted);
    syncOptions();
  }
  function pickWorld(dir) {
    pickMap = Math.max(0, Math.min(unlocked, pickMap + dir));
    store.set('pick', pickMap);
    syncOptions();
    audio.sfx('click');
  }

  function show(id, on) {
    $(id).classList.toggle('hidden', !on);
  }
  function startRun() {
    state = 'play';
    show('screen-start', false);
    show('screen-over', false);
    show('screen-pause', false);
    show('hud', true);
    rig.attract = false;
    newGame(pickMap);
    touchUi();
  }
  function toMenu() {
    state = 'menu';
    show('screen-over', false);
    show('screen-pause', false);
    show('screen-start', true);
    show('hud', false);
    show('touch', false);
    $('card').classList.add('hidden');
    audio.stopMusic();
    newGame(0, true);
    syncOptions();
  }
  function die() {
    state = 'dead';
    deadAt = performance.now();
    const s = Math.floor(game.score);
    const newBest = s > best;
    if (newBest) {
      best = s;
      store.set('best', best);
    }
    $('over-score').textContent = newBest ? `NEW BEST ${s}!` : `SCORE ${s}`;
    show('screen-over', true);
    show('touch', false);
    audio.stopMusic();
    syncOptions();
  }
  function togglePause() {
    if (state === 'play') {
      state = 'paused';
      show('screen-pause', true);
      audio.stopMusic();
    } else if (state === 'paused') {
      state = 'play';
      show('screen-pause', false);
      if (game.colorful) audio.playSong(game.map.id);
    }
  }

  // ------------------------------------------------------------ events
  function burstAt(x, y, z, colors, n = 24, speed = 6) {
    particles.emit({ x, y, z, n, colors, speed, up: 3, life: 0.9, size: 0.16, gravity: -14 });
  }
  function handleEvents() {
    for (const e of game.drainEvents()) {
      if (state === 'menu') {
        if (e.type === 'map' || e.type === 'die') continue;
      }
      const d = game.dino;
      switch (e.type) {
        case 'jump':
        case 'doubleJump':
          audio.sfx(e.type);
          particles.emit({ x: -0.3, y: d.y, z: d.z, n: 6, colors: [game.colorful ? THEMES[game.map.id].track.specks[0] : '#535353'], speed: 2, up: 1, life: 0.4, size: 0.1, gravity: -6 });
          break;
        case 'swim':
          audio.sfx('swim');
          dino.mouth(game, tmp);
          particles.emit({ x: tmp.x, y: tmp.y, z: tmp.z, n: 4, colors: ['#cff6ff'], speed: 1, up: 2, life: 1, size: 0.1, gravity: 1 });
          break;
        case 'flip':
          audio.sfx('flip');
          rig.shake(0.15);
          break;
        case 'land':
          if (e.air > 0.3) audio.sfx('land');
          break;
        case 'hundred':
          audio.sfx('hundred');
          $('hud-score').parentElement.classList.remove('blink');
          void $('hud-score').offsetWidth;
          $('hud-score').parentElement.classList.add('blink');
          break;
        case 'fire':
          audio.sfx('fire');
          break;
        case 'swing':
          audio.sfx('swing');
          break;
        case 'burn':
          audio.sfx('burn');
          burstAt(e.x, e.y + 0.6, e.z, ['#1a1010', '#ff7b00', '#ffd23f', '#3b2b2b'], 30, 7);
          popText(`+${e.points}`, e.x, e.y + 1.8);
          break;
        case 'shoot': {
          audio.sfx('shoot');
          const s = dino.scale, up = d.grav > 0 ? 1 : -1;
          particles.emit({ x: 1.1 * s, y: d.y + up * (d.ducking ? 0.62 : 1.12) * s, z: d.z + 0.3, n: 6, colors: ['#ffd23f', '#fff3b0', '#ff9f1a'], speed: 5, dir: [1, 0.1, 0], spread: 0.6, gravity: 0, life: 0.12, size: 0.12, scroll: 0 });
          break;
        }
        case 'hit':
          audio.sfx('hit');
          burstAt(e.x, e.y, e.z, ['#ffd23f', '#ffffff'], 8, 5);
          break;
        case 'clink':
          audio.sfx('clink');
          burstAt(e.x, e.y, e.z, ['#ffd23f', '#9e9e9e'], 5, 4);
          break;
        case 'shot':
          audio.sfx('kill');
          burstAt(e.x, e.y + 0.8, e.z, ['#17191f', '#2a2d36', '#ffcf3f'], 26, 7);
          popText(`+${e.points}`, e.x, e.y + 2);
          break;
        case 'wall': {
          // the big payoff: the thing you couldn't jump is blown apart
          audio.sfx('wall');
          const C = {
            thornWall: ['#ff7a1a', '#3b2a22', '#ffd23f', '#1c1210'], stoneWall: ['#7b7b7b', '#555555', '#62a83a', '#4ee6e0'],
            bruiser: ['#17191f', '#ffcf3f', '#2a2d36'], shoji: ['#f8f1de', '#6b4226', '#ffffff'],
          }[e.obstacle] || ['#ffffff', '#ffd23f'];
          for (let k = 0; k < 5; k++) burstAt(e.x, e.y + 0.5 + k, e.z, C, 18, 9);
          popText(`+${e.points}`, e.x, e.y + 3);
          rig.shake(0.3);
          flash = Math.max(flash, 0.2);
          post.uniforms.uFlashColor.value.set('#ffffff');
          break;
        }
        case 'phase':
          audio.sfx('phase');
          particles.emit({ x: 0, y: d.y + 1, z: d.z, n: 20, colors: ['#5dfff0', '#ffffff', '#ff4fd8'], speed: 3, up: 0, life: 0.5, size: 0.1, gravity: 0, scroll: 0 });
          break;
        case 'phased':
          popText(`PHASE +${e.points}`, 0.5, 2.8);
          break;
        case 'dash':
          audio.sfx('dash');
          rig.shake(0.12);
          break;
        case 'slash':
          audio.sfx('slash');
          burstAt(e.x, e.y + 0.4, e.z, ['#cfd8dc', '#ffffff'], 12, 6);
          popText(`+${e.points}`, e.x, e.y + 1.4);
          break;
        case 'dive':
          audio.sfx('swim');
          particles.emit({ x: 0.2, y: 0.1, z: d.z, n: 18, colors: ['#ffffff', '#bdeeff', '#4fc3f7'], speed: 4, up: 4, life: 0.6, size: 0.13, gravity: -14 });
          break;
        case 'glide':
          audio.sfx('glide');
          break;
        case 'boing':
          if (e.big) audio.sfx('boing');
          break;
        case 'popup':
          audio.sfx('crash');
          break;
        case 'kill':
          audio.sfx('kill');
          burstAt(e.x, e.y + 0.6, e.z, e.obstacle === 'zombie' ? ['#5f9e4a', '#00a0a8', '#3b3bb5'] : ['#86592f', '#62a83a', '#6b4423'], 30, 7);
          popText(`+${e.points}`, e.x, e.y + 2);
          rig.shake(0.12);
          break;
        case 'smash':
          audio.sfx('smash');
          burstAt(e.x, e.y + 0.5, e.z, ['#ff4081', '#ffffff', '#40c4ff', '#ffd740'], 30, 9);
          rig.shake(0.2);
          break;
        case 'giant':
          audio.sfx('giant');
          burstAt(e.x, e.y, 0, ['#ff4081', '#ffffff', '#ffd740'], 30, 5);
          popText('GIANT!', 0, 3);
          break;
        case 'shrink':
          audio.sfx('shrink');
          break;
        case 'trick':
          audio.sfx('trick');
          popText(`FLIP +${e.points}`, 0, 2.6);
          particles.emit({ x: 0, y: 0.1, z: d.z, n: 14, colors: ['#ffffff', '#d6ecff'], speed: 4, up: 2, life: 0.6, size: 0.12 });
          break;
        case 'spin':
          audio.sfx('spin');
          popText(`SPIN +${e.points}`, 0, 2.6);
          break;
        case 'lane':
          audio.sfx('lane');
          break;
        case 'drop':
          audio.sfx('drop');
          break;
        case 'crash':
          audio.sfx('crash');
          particles.emit({ x: e.x, y: 0.1, z: 0, n: 12, colors: ['#7d7385', '#4d4555'], speed: 3, up: 2, life: 0.5, size: 0.12 });
          rig.shake(0.1);
          break;
        case 'die':
          audio.sfx('die', game.colorful ? null : 'classic');
          rig.shake(0.45);
          flash = 0.35;
          post.uniforms.uFlashColor.value.set(game.colorful ? '#ff3b3b' : '#ffffff');
          particles.emit({ x: 0.4, y: d.y + 1, z: d.z, n: 20, colors: game.colorful ? ['#ff8a2a', '#e0661a', '#ffffff'] : ['#535353'], speed: 5, up: 3, life: 0.8, size: 0.14, scroll: 0 });
          break;
        case 'map':
          onMapChange(e);
          break;
        default:
      }
    }
  }

  function onMapChange(e) {
    if (game.mapIndex > unlocked && game.lap === 0) {
      unlocked = game.mapIndex;
      store.set('unlocked', unlocked);
    }
    // blow up what's left of the old world's obstacles ahead
    for (const o of e.removed) {
      if (o.x < 70) burstAt(o.x, o.y + 0.5, o.z, game.colorful && !e.first ? ['#ffffff', '#ffd23f'] : ['#535353', '#9a9a9a'], 14, 6);
    }
    if (e.first) {
      // THE moment: the grey desert shatters and colour bursts out of the dino
      for (const it of world.visibleProps(60)) {
        particles.emit({ x: it.x, y: it.y + 0.8, z: it.z, n: 10, colors: ['#535353', '#9a9a9a', '#c4c4c4'], speed: 9, up: 6, life: 1.4, size: 0.25, gravity: -16 });
      }
      applyTheme();
      dino.setLook('color');
      document.body.classList.add('color');
      applyVignette();
      tmp.set(0.3, game.dino.y + 1.2, game.dino.z).project(camera);
      post.uniforms.uCenter.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
      post.uniforms.uRadius.value = 0;
      post.uniforms.uColor.value = 0;
      reveal = { t: 0 };
      const rainbow = ['#ff3b3b', '#ff9f1a', '#ffe14d', '#4fd65a', '#3bb2ff', '#a35bff', '#ff5bd1'];
      particles.emit({ x: 0.3, y: game.dino.y + 1.2, z: game.dino.z, n: 260, colors: rainbow, speed: 16, up: 4, life: 1.8, size: 0.22, gravity: -8, drag: 0.8, scroll: 0.3 });
      flash = 0.9;
      post.uniforms.uFlashColor.value.set('#ffffff');
      rig.shake(1.0);
      slowmo = 0.9;
      audio.sfx('explode');
      setTimeout(() => state === 'play' && audio.playSong(game.map.id), 900);
    } else {
      applyTheme();
      flash = 0.75;
      post.uniforms.uFlashColor.value.set('#ffffff');
      rig.shake(0.35);
      slowmo = 0.45;
      const rainbow = ['#ffffff', '#ffe14d', '#3bb2ff', '#ff5bd1'];
      particles.emit({ x: 0.3, y: game.dino.y + 1.2, z: game.dino.z, n: 90, colors: rainbow, speed: 12, up: 3, life: 1.2, size: 0.18, gravity: -8, scroll: 0.3 });
      audio.sfx('map');
      audio.playSong(game.map.id);
    }
    updateWorldLabel();
    showCard();
    touchUi();
  }

  // ------------------------------------------------------------ input
  const held = { jump: new Set(), duck: new Set() };
  // A short guard after dying stops a held jump from restarting by accident,
  // but a press during it isn't lost: the run restarts as soon as it ends.
  const RESTART_GUARD = 220;
  let restartTimer = null;
  function requestRestart() {
    if (state !== 'dead' || restartTimer) return;
    const wait = RESTART_GUARD - (performance.now() - deadAt);
    if (wait <= 0) return startRun();
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (state === 'dead') startRun();
    }, wait);
  }
  function jumpDown(src) {
    audio.ensure();
    if (state === 'menu') return startRun();
    if (state === 'dead') {
      requestRestart();
      return;
    }
    if (state !== 'play') return;
    if (!held.jump.has(src)) game.pressJump();
    held.jump.add(src);
    game.setJump(true);
  }
  function jumpUp(src) {
    held.jump.delete(src);
    game.setJump(held.jump.size > 0);
  }
  function duckDown(src) {
    if (state !== 'play') return;
    held.duck.add(src);
    game.setDuck(true);
  }
  function duckUp(src) {
    held.duck.delete(src);
    game.setDuck(held.duck.size > 0);
  }
  function action() {
    if (state === 'play') game.pressAction();
  }

  window.addEventListener('keydown', (e) => {
    const k = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    if (e.repeat && !['ArrowLeft', 'ArrowRight'].includes(k)) return;
    // after a crash, any key restarts (except the settings and menu keys)
    if (state === 'dead' && !['KeyC', 'KeyV', 'KeyM', 'KeyP', 'Escape', 'Backquote', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'Tab'].includes(k)) {
      audio.ensure();
      requestRestart();
      return;
    }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') jumpDown(k);
    else if (k === 'ArrowDown' || k === 'KeyS') duckDown(k);
    else if (k === 'KeyX' || k === 'KeyF' || k === 'KeyE' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'Enter') {
      if (state === 'menu' && k === 'Enter') startRun();
      else action();
    } else if (k === 'ArrowLeft' || k === 'KeyA' || k === 'ArrowRight' || k === 'KeyD') {
      const dir = k === 'ArrowLeft' || k === 'KeyA' ? -1 : 1;
      if (state === 'menu') pickWorld(dir);
      else if (state === 'play' && !e.repeat) game.pressLane(dir);
    } else if (k === 'KeyC') cycleCamera();
    else if (k === 'KeyV') cyclePixels();
    else if (k === 'KeyM') toggleMute();
    else if (k === 'KeyP') togglePause();
    else if (k === 'Escape') {
      if (state === 'play') togglePause();
      else if (state === 'paused' || state === 'dead') toMenu();
    } else if (k === 'Backquote') $('fps').classList.toggle('hidden');
  });
  window.addEventListener('keyup', (e) => {
    const k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') jumpUp(k);
    else if (k === 'ArrowDown' || k === 'KeyS') duckUp(k);
  });
  window.addEventListener('blur', () => {
    held.jump.clear();
    held.duck.clear();
    game.setJump(false);
    game.setDuck(false);
    if (state === 'play') togglePause();
  });

  // unlock audio on the very first interaction of any kind, and pick the
  // song back up when the tab comes back
  const unlock = () => {
    audio.ensure();
    if (state === 'play' && game.colorful && !audio.song) audio.playSong(game.map.id);
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audio.ctx) audio.ensure();
  });

  // touch: tap anywhere to jump, buttons for the rest
  const isTouch = matchMedia('(pointer: coarse)').matches;
  function touchUi() {
    if (!isTouch || state !== 'play') return show('touch', false);
    show('touch', true);
    const g = game.map.gimmick;
    show('t-act', !!ACT_NAME[g]);
    $('t-act').textContent = ACT_NAME[g] || 'FIRE';
    show('t-left', !!game.map.lanes);
    show('t-right', !!game.map.lanes);
  }
  const bindHold = (id, down, up) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture?.(e.pointerId);
      down(`p${e.pointerId}`);
    });
    const end = (e) => up(`p${e.pointerId}`);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };
  bindHold('t-jump', jumpDown, jumpUp);
  bindHold('t-duck', duckDown, duckUp);
  bindHold('t-act', action, () => {});
  bindHold('t-left', () => state === 'play' && game.pressLane(-1), () => {});
  bindHold('t-right', () => state === 'play' && game.pressLane(1), () => {});
  canvas.addEventListener('pointerdown', (e) => {
    if (state === 'play' || state === 'dead') jumpDown(`c${e.pointerId}`);
  });
  canvas.addEventListener('pointerup', (e) => jumpUp(`c${e.pointerId}`));
  $('screen-over').addEventListener('pointerdown', () => jumpDown('over'));
  $('screen-over').addEventListener('pointerup', () => jumpUp('over'));

  $('btn-play').addEventListener('click', () => {
    audio.ensure();
    startRun();
  });
  $('btn-retry').addEventListener('click', () => startRun());
  $('btn-cam').addEventListener('click', cycleCamera);
  $('opt-cam').addEventListener('click', cycleCamera);
  $('opt-pix').addEventListener('click', cyclePixels);
  $('opt-mute').addEventListener('click', toggleMute);
  $('btn-mute').addEventListener('click', toggleMute);
  $('btn-pause').addEventListener('click', togglePause);
  $('world-prev').addEventListener('click', () => pickWorld(-1));
  $('world-next').addEventListener('click', () => pickWorld(1));

  // gamepad
  const padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [...pads].find(Boolean);
    if (!p) return;
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const edge = (name, now, down, up) => {
      if (now && !padPrev[name]) down();
      if (!now && padPrev[name] && up) up();
      padPrev[name] = now;
    };
    edge('a', b(0) || b(12), () => jumpDown('pad'), () => jumpUp('pad'));
    edge('down', b(13) || p.axes[1] > 0.6, () => duckDown('pad'), () => duckUp('pad'));
    edge('x', b(2) || b(1) || b(7), action);
    edge('y', b(3), cycleCamera);
    edge('lb', b(4) || b(14), () => (state === 'menu' ? pickWorld(-1) : game.pressLane(-1)));
    edge('rb', b(5) || b(15), () => (state === 'menu' ? pickWorld(1) : game.pressLane(1)));
    edge('start', b(9), () => (state === 'menu' ? startRun() : togglePause()));
  }

  // ------------------------------------------------------------ loop
  const FIXED = 1 / 120;
  let acc = 0;
  let last = performance.now();
  let fpsAcc = 0, fpsN = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fpsAcc += dt;
    fpsN++;
    if (fpsAcc > 0.5) {
      fps = Math.round(fpsN / fpsAcc);
      $('fps').textContent = `${fps} FPS`;
      fpsAcc = 0;
      fpsN = 0;
    }
    pollPad();

    // slow motion during the big moments
    if (slowmo > 0) {
      slowmo -= dt;
      timeScale = 0.3;
    } else timeScale += (1 - timeScale) * Math.min(1, dt * 4);
    const sdt = dt * timeScale;

    const running = state === 'play' || state === 'menu';
    if (running) {
      acc += sdt;
      while (acc >= FIXED) {
        if (state === 'menu' || autopilot) bot.update(FIXED);
        game.update(FIXED);
        acc -= FIXED;
        if (!game.alive) break;
      }
      if (state === 'menu' && !game.alive) newGame(0, true);
      if (state === 'menu' && game.score > COLOR_SCORE - 5) newGame(0, true);
      handleEvents();
      if (state === 'play' && !game.alive) die();
    }
    const speed = running && game.alive ? game.speed * timeScale : 0;
    const visDt = state === 'paused' ? 0 : dt;
    world.update(visDt * (state === 'dead' ? 0 : timeScale), state === 'dead' ? 0 : game.speed, game.distance, camera);
    // hide the dino's own body once the camera is (nearly) inside its head
    dino.setFirstPerson(rig.mode === 'first' && rig.blend > 0.6);
    dino.update(visDt, game, game.alive);
    // obstacles turn to face the chase / first-person camera
    faceAmt += ((rig.mode === 'side' ? 0 : 1) - faceAmt) * Math.min(1, dt * 5);
    obstacles.update(visDt * timeScale, game, camera, faceAmt);
    // fire breath and other trails
    if (state === 'play' && game.alive) {
      const d = game.dino;
      const g0 = game.map.gimmick;
      if (d.fireT > 0) {
        dino.mouth(game, tmp);
        // in first person the flames start a little ahead so they don't fill the lens
        if (rig.mode === 'first') tmp.set(tmp.x + 1.4, tmp.y - 0.45 * d.grav, tmp.z);
        particles.emit({ x: tmp.x, y: tmp.y, z: tmp.z, n: 6, colors: ['#ff3b00', '#ff8a1a', '#ffd23f', '#fff3b0'], speed: 16, dir: [1, 0.06, 0], spread: 0.45, gravity: 3, life: 0.36, size: 0.14, sizeEnd: 0.45, scroll: 0, drag: 2 });
      }
      if (g0 === 'dash' && d.actT > 0) {
        // speed lines and an afterimage while dashing
        particles.emit({ x: -0.6 + Math.random(), y: d.y + 0.2 + Math.random() * 1.6, z: d.z + (Math.random() - 0.5) * 0.6, n: 2, colors: ['#ffffff', '#ffaccb', '#ff8a2a'], speed: 0, up: 0, gravity: 0, life: 0.18, size: 0.12, scroll: 1.4, drag: 0 });
      }
      if (g0 === 'paddle') {
        // splashing along the surface, bubbles when under
        if (d.y > -0.05 && d.y < 0.3) particles.emit({ x: 0.6 + Math.random() * 0.4, y: 0.05, z: d.z + (Math.random() - 0.5) * 0.8, n: 2, colors: ['#ffffff', '#d6f4ff'], speed: 2, up: 3, life: 0.4, size: 0.1, gravity: -14 });
        else if (d.y < -0.05 && Math.random() < 0.4) particles.emit({ x: 0.8, y: d.y + 1.2, z: d.z, n: 1, colors: ['#e0f8ff'], speed: 0.3, up: 2, life: 0.8, size: 0.08, gravity: 1 });
      }
      if (g0 === 'phase' && d.actT > 0 && Math.random() < 0.6) particles.emit({ x: -0.6 + Math.random() * 1.4, y: d.y + Math.random() * 1.8, z: d.z, n: 1, colors: ['#5dfff0', '#ffffff'], speed: 0.5, up: 0.5, gravity: 0, life: 0.4, size: 0.08, scroll: 0.5 });
      if (d.giant > 0 && Math.random() < 0.5) particles.emit({ x: (Math.random() - 0.5) * 2, y: d.y + Math.random() * 3, z: d.z, n: 1, colors: ['#ff4081', '#ffd740', '#ffffff'], speed: 1, up: 1, life: 0.6, size: 0.12, gravity: 0 });
      const g = game.map.gimmick;
      if (g === 'lanes') particles.emit({ x: -1, y: 0.2, z: d.z + (Math.random() - 0.5) * 0.5, n: 1, colors: ['#ff2bd6', '#00f0ff'], speed: 0.5, up: 0, life: 0.5, size: 0.1, gravity: 0 });
      if (g === 'snowboard' && d.grounded) particles.emit({ x: -0.9, y: 0.1, z: d.z, n: 1, colors: ['#ffffff'], speed: 2, up: 2.5, life: 0.5, size: 0.1, gravity: -8 });
      if (g === 'cart' && d.grounded && Math.random() < 0.3) particles.emit({ x: -0.6, y: 0.05, z: d.z + 0.3, n: 1, colors: ['#ffe14d'], speed: 1, up: 1, life: 0.25, size: 0.06, gravity: -6 });
      if (g === 'swim' && Math.random() < 0.08) {
        dino.mouth(game, tmp);
        particles.emit({ x: tmp.x, y: tmp.y, z: tmp.z, n: 1, colors: ['#cff6ff'], speed: 0.4, up: 1.6, life: 1.6, size: 0.1, gravity: 0.6 });
      }
      if (game.colorful) particles.ambientFor(THEMES[game.map.id], dt * timeScale);
    } else if (state === 'menu' && game.colorful) particles.ambientFor(THEMES[game.map.id], dt);
    particles.update(state === 'paused' ? 0 : dt * timeScale, state === 'dead' ? 0 : speed);
    rig.update(dt, game, dino.scale);
    if (state === 'dead') timeScale = 0;

    // colour explosion
    if (reveal) {
      reveal.t += dt;
      const t = Math.min(1, reveal.t / 1.25);
      post.uniforms.uRadius.value = Math.pow(t, 1.6) * 2.4;
      if (t >= 1) {
        reveal = null;
        post.uniforms.uRadius.value = -1;
        post.uniforms.uColor.value = 1;
      }
    }
    if (flash > 0) flash = Math.max(0, flash - dt * 2.2);
    post.uniforms.uFlash.value = flash * flash;
    post.uniforms.uTime.value = now / 1000;

    if (state === 'play' || state === 'dead') updateHud();
    // under the lagoon's surface: blue haze, a wobble, the surface overhead
    const under = game.map.gimmick === 'paddle' && camera.position.y < -0.05;
    if (under !== underwater) {
      underwater = under;
      if (under) {
        scene.fog.color.set('#0e6f9c');
        scene.fog.near = 1;
        scene.fog.far = 24;
        scene.background = UNDERWATER;
        post.uniforms.uWobble.value = 1.2;
        post.uniforms.uTint.value.set('#9fdcff');
      } else applyTheme(true);
    }
    post.render(scene, camera);
  }

  // ------------------------------------------------------------ go
  resize();
  rig.setMode(settings.camera);
  rig.blend = 1;
  world.setMode(settings.camera);
  newGame(0, true);
  syncOptions();
  document.body.classList.remove('loading');
  requestAnimationFrame(frame);

  // for tests and debugging
  window.__dino = {
    get game() { return game; }, get state() { return state; }, rig, world, post, camera, audio, renderer, settings,
    get fps() { return fps; },
    set autopilot(v) { autopilot = v; },
    start: (map = 0) => { pickMap = map; unlocked = Math.max(unlocked, map); startRun(); },
    setScore: (s) => { game.score = s; },
    mapStartScore,
  };
}

try {
  boot();
} catch (e) {
  console.error(e);
  document.body.classList.add('boot-failed');
  const msg = document.getElementById('loader-msg');
  if (msg) msg.textContent = `Something went wrong: ${e.message}`;
}
