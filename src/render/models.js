import { VoxelSet, spriteGeo } from './voxel.js';
import * as S from './sprites.js';
import { allObstacleSpecs } from '../game/maps.js';

// Every model in the game, built once and cached. Obstacles are scaled so the
// drawing matches their hitbox height; voxels are ~0.1 units, the same pixel
// size as the dino, so the whole world shares one chunky pixel grid.

const MONO = '#535353';
const cache = new Map();
const memo = (k, f) => {
  if (!cache.has(k)) cache.set(k, f());
  return cache.get(k);
};

// ---------------------------------------------------------------- dino
export const DINO_COLORS = {
  mono: { '#': MONO, e: '#f7f7f7', a: MONO, l: MONO },
  color: { '#': '#ff8a2a', e: '#ffffff', a: '#e0661a', l: '#d95f14' },
};

// The body is built as rounded tubes (each column as thick as it is tall), so
// it reads as a solid creature from behind and in first person, not a cut-out.
// Arms ('a') sit on both sides of the chest; the eye ('e') is only on the
// surface, on both sides of the head.
function dinoBody(rows, p) {
  const v = new VoxelSet();
  v.sprite(rows, p, { round: 0.42, maxHalf: 4, surface: { e: '#' }, skip: 'a' });
  const { halfOf, W } = v.halves;
  const H = rows.length;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] !== 'a') continue;
      // the nearest body column to the left decides how wide the chest is
      let h = 2;
      for (let k = x - 1; k >= 0; k--) {
        if (halfOf[y * W + k]) {
          h = halfOf[y * W + k];
          break;
        }
      }
      const yy = H - 1 - y;
      for (const z of [h - 2, h - 1, -h, -h + 1]) v.set(x, yy, z, p.a);
    }
  }
  return v;
}

export function dinoParts(look) {
  return memo(`dino-${look}`, () => {
    const p = DINO_COLORS[look];
    const leg = new VoxelSet().sprite(S.DINO_LEG, { '#': p.l }, { inflate: 0, depth: 1 });
    return {
      body: dinoBody(S.DINO_BODY, p).build(0.1, { centerX: false }),
      duck: dinoBody(S.DINO_DUCK, p).build(0.1, { centerX: false }),
      leg: leg.build(0.1, { centerX: false, anchor: 'top' }),
    };
  });
}

// ---------------------------------------------------------------- obstacles
const P = {
  cactusSmall: [S.CACTUS_SMALL, { '#': MONO }, { cross: true }],
  cactusTall: [S.CACTUS_TALL, { '#': MONO }, { cross: true }],
  bat: [[S.BAT_UP, S.BAT_DOWN], { '#': MONO }, { cross: true }],
  stump: [S.STUMP, { r: '#c9a27a', t: '#6d4c41' }],
  mushroom: [S.MUSHROOM, { r: '#e53935', w: '#fff4e0' }],
  logStack: [S.LOG_STACK, { r: '#c9a27a', t: '#6d4c41' }],
  bird: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#ffca28', b: '#ef6c00' }, { cross: true, front: [S.BIRD_FRONT_UP, S.BIRD_FRONT_DOWN] }],
  lavaRock: [S.LAVA_ROCK, { r: '#3b2b2b', l: '#ff7b00' }],
  obsidian: [S.OBSIDIAN, { o: '#2a1745', l: '#c060ff' }, { cross: true }],
  fireBat: [[S.BAT_UP, S.BAT_DOWN], { '#': '#ff5722' }, { cross: true }],
  moonRock: [S.MOON_ROCK, { g: '#9a9a9a', w: '#d0d0d0', d: '#5c5c5c' }],
  moonSpire: [S.MOON_SPIRE, { g: '#9a9a9a', w: '#d0d0d0', d: '#5c5c5c' }, { cross: true }],
  ufo: [S.UFO, { g: '#90a4ae', c: '#80deea', y: '#ffeb3b' }, { cross: true, frontHalf: 4 }],
  zombie: [S.ZOMBIE, { g: '#5f9e4a', c: '#00a0a8', b: '#3b3bb5', k: '#111111' }, { inflate: 0, depth: 3 }],
  blockBat: [[S.BAT_UP, S.BAT_DOWN], { '#': '#3a2a20' }, { inflate: 0, depth: 1, cross: true }],
  coral: [S.CORAL, { p: '#ff6f91' }, { cross: true }],
  coralTall: [S.CORAL_TALL, { o: '#ff9800' }, { cross: true }],
  jelly: [S.JELLY, { p: '#e1a6f0', w: '#ffffff' }, { cross: true, frontHalf: 3 }],
  shark: [S.SHARK, { g: '#78909c', w: '#eceff1', k: '#111111' }],
  stalagmite: [S.STALAGMITE, { s: '#7d7385', d: '#4d4555' }, { cross: true }],
  stalactite: [S.STALACTITE, { s: '#7d7385', d: '#4d4555' }, { cross: true }],
  dropper: [S.STALACTITE, { s: '#8d8395', d: '#e05050' }, { cross: true }],
  minecart: [S.MINECART, { b: '#6d4c41', g: '#ffd54f', k: '#222222' }],
  cans: [S.CANS, { r: '#e53935', w: '#eeeeee' }],
  wetSign: [S.WET_SIGN, { y: '#ffd600', k: '#222222' }],
  strayCart: [S.CART, { k: '#9e9e9e', d: '#333333' }, { inflate: 0, depth: 4 }],
  saleSign: [S.SALE_SIGN, { r: '#e53935', w: '#ffffff', k: '#555555' }, { inflate: 0, depth: 1 }],
  gumdrop: [S.GUMDROP, { g: '#4dd06a', w: '#c8ffd0' }],
  cupcake: [S.CUPCAKE, { w: '#ffffff', p: '#ff4081', b: '#a1745a', r: '#e53935' }],
  lollipop: [S.LOLLIPOP, { p: '#ff4081', w: '#ffffff' }, { cross: true }],
  bee: [S.BEE, { y: '#ffeb3b', k: '#222222', w: '#e3f2fd' }],
  candy: [S.CANDY, { p: '#ff4081', w: '#ffffff' }],
  snowman: [S.SNOWMAN, { w: '#ffffff', k: '#222222', o: '#ff9800', r: '#e53935' }],
  iceSpike: [S.ICE_SPIKE, { c: '#81d4fa', w: '#e1f5fe' }, { cross: true }],
  penguin: [S.PENGUIN, { k: '#212121', w: '#ffffff', o: '#ff9800' }],
  snowBird: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#ffffff', b: '#64b5f6' }, { cross: true, front: [S.BIRD_FRONT_UP, S.BIRD_FRONT_DOWN] }],
  neonCar: [S.NEON_CAR, { p: '#ff2bd6', c: '#00f0ff', y: '#ffe600', k: '#111111' }, { inflate: 0, depth: 6 }],
  barrier: [S.BARRIER, { y: '#ffe600', k: '#111111', c: '#00f0ff' }, { inflate: 0, depth: 7 }],
  drone: [S.DRONE, { c: '#00f0ff', k: '#222222', p: '#ff2bd6' }, { cross: true }],
  asteroid: [S.ASTEROID, { g: '#8d6e63', d: '#5d4037' }],
  asteroidCeil: [S.ASTEROID, { g: '#7e5f54', d: '#4e342e' }],
  // shadow city
  goon: [S.GOON, { h: '#0b0c10', d: '#2a2d36', k: '#17191f', e: '#ffcf3f' }, { maxHalf: 3 }],
  bruiser: [S.BRUISER, { h: '#0b0c10', d: '#2a2d36', k: '#17191f', e: '#ff3b3b', g: '#ffcf3f' }, { maxHalf: 3 }],
  hydrant: [S.HYDRANT, { g: '#ffcf3f', r: '#b3261e' }, { cross: true }],
  trashCan: [S.TRASH_CAN, { d: '#2f333b', m: '#555b66' }, { cross: true }],
  hangSign: [S.HANG_SIGN, { c: '#555a63', b: '#1a1c22', g: '#ffcf3f' }, { inflate: 0, depth: 1 }],
  crow: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#1d1d24', b: '#ffcf3f' }, { cross: true, front: [S.BIRD_FRONT_UP, S.BIRD_FRONT_DOWN] }],
  // planet zorb
  pod: [S.POD, { p: '#7b2ff7', g: '#3dffb0' }, { cross: true, frontHalf: 4 }],
  tentacle: [S.TENTACLE, { t: '#e0409a', s: '#ffb3e6' }, { cross: true }],
  blob: [S.BLOB, { b: '#58ff6a', w: '#ffffff', k: '#111111' }],
  eyeDrone: [S.EYE_DRONE, { m: '#9aa6c8', w: '#ffffff', i: '#ff2d6f', k: '#111111' }, { cross: true, frontHalf: 4 }],
  // haunted hollow
  tombstone: [S.TOMBSTONE, { s: '#8a8f98', d: '#5f646c', m: '#4f7a3a' }],
  pumpkin: [S.PUMPKIN, { g: '#3f7a2a', o: '#ff7f11', y: '#ffe066' }, { cross: true, frontHalf: 3 }],
  hand: [S.HAND, { h: '#7fa36a', d: '#3b2e26' }, { cross: true }],
  ghost: [S.GHOST, { w: '#eef3ff', k: '#1a1a2a' }, { cross: true, frontHalf: 3 }],
  hauntBat: [[S.BAT_UP, S.BAT_DOWN], { '#': '#7c4dff' }, { cross: true }],
  // sky kingdom
  column: [S.COLUMN, { m: '#f5f1e6', d: '#d8d0bc' }, { cross: true, frontHalf: 4 }],
  balloon: [S.BALLOON, { r: '#ff4f6d', w: '#ffffff', g: '#dddddd' }, { cross: true, frontHalf: 3 }],
  eagle: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#8d5a2b', b: '#ffd23f' }, { cross: true, front: [S.BIRD_FRONT_UP, S.BIRD_FRONT_DOWN] }],
  // bamboo dojo
  bambooSpikes: [S.BAMBOO_SPIKES, { t: '#e9f2c8', g: '#5fa83a', l: '#9ad36a' }, { cross: true }],
  stoneLantern: [S.STONE_LANTERN, { s: '#a29d92', d: '#6f6a60', y: '#ffd166' }, { cross: true, frontHalf: 3 }],
  shuriken: [S.SHURIKEN, { m: '#cfd8dc', d: '#546e7a' }, { inflate: 0, depth: 1 }],
  // toy box
  soldier: [S.SOLDIER, { k: '#1b1b1b', s: '#ffd9b3', r: '#d32f2f', y: '#ffd23f', b: '#1e40af' }],
  marble: [S.MARBLE, { c: '#29b6f6', w: '#ffffff', d: '#0277bd' }, { cross: true, frontHalf: 3 }],
  toyPlane: [S.TOY_PLANE, { r: '#ff5252', w: '#ffffff', b: '#448aff' }, { inflate: 0, depth: 2 }],
  // splash lagoon
  finShark: [S.FIN, { g: '#607d8b', b: '#37474f' }, { maxHalf: 2 }],
  gull: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#ffffff', b: '#ffb300' }, { cross: true, front: [S.BIRD_FRONT_UP, S.BIRD_FRONT_DOWN] }],
};
const GLOW = new Set(['candy', 'neonCar', 'barrier', 'drone', 'jelly', 'spill', 'ufo', 'hangSign', 'field', 'gap', 'chasm']);

// Head-on drawings for the chase and first-person cameras (see ObstacleView).
const FRONT = {
  neonCar: [S.NEON_CAR_BACK, { inflate: 0, depth: 6 }],
  shark: [S.SHARK_FRONT, {}],
  minecart: [S.MINECART_FRONT, { inflate: 0, depth: 5 }],
  strayCart: [S.CART_FRONT, { inflate: 0, depth: 6 }],
  toyPlane: [S.PLANE_FRONT, { inflate: 0, depth: 3 }],
  saleSign: [S.SALE_SIGN, { inflate: 0, depth: 1 }],
};

const lcg = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// The walls that need an ability: big, wide and unmistakable.
function wallGeo(type) {
  const v = new VoxelSet();
  const r = lcg(11);
  if (type === 'thornWall') {
    // charred palisade logs with glowing cracks and thorns pointing at you
    for (let z = -8; z < 8; z++) {
      const log = Math.floor((z + 8) / 3);
      const top = 50 + ((log * 7) % 5) + (z % 3 === 1 ? 2 : 0);
      for (let y = 0; y < top; y++) for (let x = 2; x < 8; x++) {
        const edge = (z + 8) % 3 === 0;
        let c = edge ? '#3a2416' : r() < 0.5 ? '#6d4630' : '#5a3a28';
        if ((x === 2 || x === 7) && r() < 0.14) c = r() < 0.5 ? '#ff7a1a' : '#ffb13a';
        if (y > top - 4 && r() < 0.5) c = '#ff5a1a';
        v.set(x, y, z, c);
      }
    }
    for (let i = 0; i < 70; i++) {
      const y = 2 + Math.floor(r() * 50), z = -8 + Math.floor(r() * 16);
      v.set(1, y, z, '#2a1a12');
      v.set(0, y + 1, z, '#d8c8a0');
    }
    return v.build(0.1);
  }
  if (type === 'stoneWall') {
    // six cobblestone blocks high, mossy on top, a diamond in the middle
    for (let b = 0; b < 6; b++) for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) for (let z = -9; z < 9; z++) {
      const yy = b * 9 + y;
      let c = r() < 0.3 ? '#6e6e6e' : r() < 0.5 ? '#8a8a8a' : '#7b7b7b';
      if ((y === 0 || (z + 9) % 9 === 0) && r() < 0.7) c = '#555555';
      if (b === 5 && y > 6) c = r() < 0.4 ? '#4f8a2b' : '#62a83a';
      if (b === 2 && x === 0 && Math.abs(z + 0.5) < 2 && y > 2 && y < 6 && r() < 0.6) c = '#4ee6e0';
      v.set(x, yy, z, c);
    }
    return v.build(0.1);
  }
  if (type === 'field') {
    // two pylons and a shimmering energy curtain between them
    for (let y = 0; y < 60; y++) for (let z = -11; z <= 11; z++) {
      const pylon = Math.abs(z) >= 10;
      if (pylon) {
        for (let x = 0; x < 5; x++) v.set(x, y, z, y % 6 === 0 ? '#3dffb0' : '#3a2a5a');
      } else if ((y + Math.abs(z)) % 3 !== 0) {
        v.set(2, y, z, y % 4 === 0 ? '#e6fffa' : z % 2 ? '#3dffd0' : '#29d6ff');
      }
    }
    return v.build(0.1);
  }
  if (type === 'shoji') {
    // a paper screen in a dark wooden frame
    for (let y = 0; y < 52; y++) for (let z = -9; z < 9; z++) {
      const frame = y < 2 || y > 49 || Math.abs(z) >= 8 || z === -9;
      const lattice = y % 8 === 0 || (z + 9) % 6 === 0;
      if (frame) for (let x = 0; x < 4; x++) v.set(x, y, z, '#4a2d1c');
      else if (lattice) for (let x = 1; x < 3; x++) v.set(x, y, z, '#6b4226');
      else v.set(2, y, z, r() < 0.05 ? '#e8dcc0' : '#f8f1de');
    }
    for (let z = -11; z < 11; z++) for (let x = -1; x < 5; x++) v.set(x, 52, z, '#2b1a10');
    return v.build(0.1);
  }
  return null;
}

// Splash Lagoon: a striped buoy on its chain, and a floating log
function lagoonGeo(type) {
  const v = new VoxelSet();
  if (type === 'buoy') {
    for (let y = 0; y < 26; y++) v.set(0, y, 0, y % 2 ? '#4a4a4a' : '#6a6a6a'); // chain, under water
    for (let y = 26; y < 38; y++) for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
      if (x * x + z * z > 10) continue;
      v.set(x, y, z, Math.floor((y - 26) / 3) % 2 ? '#ffffff' : '#e53935');
    }
    for (let y = 38; y < 41; y++) for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) v.set(x, y, z, '#333333');
    v.box(-1, 40, -1, 3, 2, 3, '#ffe14d');
    return v.build(0.1);
  }
  if (type === 'floatLog') {
    for (let x = 0; x < 16; x++) for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) {
      if (y * y + z * z > 18) continue;
      const end = x === 0 || x === 15;
      v.set(x, y + 4, z, end ? (y * y + z * z < 6 ? '#d7a86e' : '#b0814a') : (x + y) % 5 === 0 ? '#5d3a1e' : '#7a4f2a');
    }
    return v.build(0.1);
  }
  return null;
}

const LETTER_A = ['.###.', '#...#', '#####', '#...#', '#...#'];
function abcBlock() {
  const v = new VoxelSet();
  const n = 9;
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const edge = [x, y, z].filter((q) => q === 0 || q === n - 1).length >= 2;
    v.set(x, y, z, edge ? '#ffd23f' : '#e53935');
  }
  // the letter on all four sides
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    if (LETTER_A[4 - j][i] !== '#') continue;
    v.set(2 + i, 2 + j, n - 1, '#ffffff');
    v.set(2 + i, 2 + j, 0, '#ffffff');
    v.set(0, 2 + j, 2 + i, '#ffffff');
    v.set(n - 1, 2 + j, 2 + i, '#ffffff');
  }
  return v.build(0.1);
}

// A hole in the path: a slab of sky, scaled to the pit's width in the view.
function pitGeo() {
  const v = new VoxelSet();
  const r = lcg(5);
  for (let x = 0; x < 10; x++) for (let z = -60; z < 60; z++) {
    // deep sky seen through the hole (the slab is stretched to the gap's width)
    const c = Math.abs(z) > 30 ? '#5aa6ea' : r() < 0.2 ? '#2a72c4' : '#3584d6';
    v.set(x, 0, z, c);
  }
  return v.build(0.1);
}

function blockGeo(tall) {
  const v = new VoxelSet();
  const n = 9;
  const layers = tall ? 2 : 1;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let L = 0; L < layers; L++) {
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
      const top = L === layers - 1 && y >= n - 2;
      const c = top ? (r() < 0.25 ? '#4f8a2b' : '#62a83a') : r() < 0.2 ? '#6b4423' : r() < 0.1 ? '#9a7048' : '#86592f';
      v.set(x, y + L * n, z, c);
    }
  }
  return v.build(0.1);
}

export function obstacleModel(type) {
  return memo(`obs-${type}`, () => {
    const spec = allObstacleSpecs()[type];
    if (type === 'dirtBlock' || type === 'dirtTower') return { frames: [blockGeo(type === 'dirtTower')], glow: false };
    const wall = wallGeo(type);
    if (wall) return { frames: [wall], glow: GLOW.has(type) };
    if (type === 'abcBlock') return { frames: [abcBlock()], glow: false };
    const lg = lagoonGeo(type);
    if (lg) return { frames: [lg], glow: false };
    if (type === 'gap' || type === 'chasm') return { frames: [pitGeo()], glow: true };
    if (type === 'spill') {
      const v = new VoxelSet();
      for (let x = 0; x < 16; x++) for (let z = 0; z < 8; z++) {
        const dx = (x - 7.5) / 8, dz = (z - 3.5) / 4;
        if (dx * dx + dz * dz < 1) v.set(x, 0, z, (x + z) % 5 ? '#4fc3f7' : '#b3e5fc');
      }
      return { frames: [v.build(0.1)], glow: true };
    }
    const [art, pal, opts = {}] = P[type];
    const frames = Array.isArray(art[0]) ? art : [art];
    const size = spec.h / frames[0].length;
    const F = FRONT[type];
    return {
      frames: frames.map((rows, i) =>
        spriteGeo(rows, pal, size, { inflate: 1.5, maxHalf: 4, ...opts, front: Array.isArray(opts.front?.[0]) ? opts.front[i] : opts.front, anchor: 'bottom' })),
      // head-on version for the chase / first-person cameras
      front: F ? [spriteGeo(F[0], pal, size, { inflate: 1.5, maxHalf: 4, ...F[1], anchor: 'bottom' })] : null,
      glow: GLOW.has(type),
    };
  });
}

// ---------------------------------------------------------------- props
export const prop = {
  cloud: (c = '#dadada') => memo(`cloud${c}`, () => spriteGeo(S.CLOUD, { '#': c }, 0.25, { inflate: 0, depth: 1 })),
  dune: (c) => memo(`dune${c}`, () => spriteGeo(S.DUNE, { '#': c }, 0.5, { inflate: 0, depth: 1 })),
  pebble: (c) => memo(`peb${c}`, () => spriteGeo(S.PEBBLE, { '#': c }, 0.1, { inflate: 0, depth: 1 })),
  cactus: (c) => memo(`pcact${c}`, () => spriteGeo(S.CACTUS_TALL, { '#': c }, 0.1, { inflate: 1.5, cross: true })),
  pine: () => memo('pine', () => spriteGeo(S.PINE, { g: '#2e7d32', t: '#6d4c41' }, 0.35, { inflate: 1.2, maxHalf: 5, cross: true, frontHalf: 5 })),
  pine2: () => memo('pine2', () => spriteGeo(S.PINE, { g: '#43a047', t: '#5d4037' }, 0.3, { inflate: 1.2, maxHalf: 5, cross: true, frontHalf: 5 })),
  bush: () => memo('bush', () => spriteGeo(S.BUSH, { g: '#388e3c' }, 0.2, { inflate: 1.5 })),
  flower: (c) => memo(`fl${c}`, () => spriteGeo(S.FLOWER, { p: c, y: '#ffeb3b', g: '#2e7d32' }, 0.08, { inflate: 0, depth: 1 })),
  volcano: () => memo('volcano', () => spriteGeo(S.VOLCANO, { r: '#3a1f1a', l: '#ff6a00' }, 1.4, { inflate: 0.6, maxHalf: 6 })),
  deadTree: () => memo('deadtree', () => spriteGeo(S.DEAD_TREE, { b: '#1e1414' }, 0.3, { inflate: 0, depth: 1 })),
  lavaPool: () => memo('lavapool', () => new VoxelSet().box(0, 0, 0, 14, 1, 6, '#ff6a00').box(3, 0, 1, 7, 1, 3, '#ffd23f').build(0.2)),
  moonRock: () => memo('pmoonrock', () => spriteGeo(S.MOON_ROCK, { g: '#8a8a8a', w: '#bdbdbd', d: '#5c5c5c' }, 0.3)),
  flag: () => memo('flag', () => spriteGeo(S.FLAG, { w: '#dddddd', r: '#e53935', b: '#1e40af' }, 0.18, { inflate: 0, depth: 1 })),
  earth: () => memo('earth', () => spriteGeo(S.EARTH, { b: '#2f6fd6', g: '#43a047', w: '#ffffff' }, 2.4, { inflate: 1, maxHalf: 3 })),
  star: (c = '#ffffff') => memo(`star${c}`, () => spriteGeo(S.STAR, { w: c }, 0.35, { inflate: 0, depth: 1 })),
  blockTree: () => memo('btree', () => {
    const v = new VoxelSet();
    v.box(2, 0, 2, 1, 5, 1, '#6b4f2a');
    v.box(0, 4, 0, 5, 2, 5, '#3f8f2f').box(1, 6, 1, 3, 1, 3, '#4fa33a');
    return v.build(0.45);
  }),
  blockCloud: () => memo('bcloud', () => new VoxelSet().box(0, 0, 0, 8, 1, 4, '#ffffff').box(2, 1, 1, 4, 1, 2, '#ffffff').build(1.2)),
  blockSun: () => memo('bsun', () => new VoxelSet().box(0, 0, 0, 4, 4, 1, '#fff36b').box(1, 1, 1, 2, 2, 1, '#ffffff').build(2.5, { anchor: 'center' })),
  kelp: () => memo('kelp', () => spriteGeo(S.KELP, { g: '#2e8b57' }, 0.35, { inflate: 0, depth: 1 })),
  fish: () => memo('fish', () => spriteGeo(S.FISH, { y: '#ffb300', k: '#222' }, 0.15, { inflate: 0, depth: 1 })),
  reefRock: () => memo('reefrock', () => spriteGeo(S.MOON_ROCK, { g: '#4f6d7a', w: '#6f8f9a', d: '#37505a' }, 0.35)),
  crystal: (c) => memo(`crys${c}`, () => spriteGeo(S.CRYSTAL, { c, w: '#ffffff' }, 0.22, { inflate: 1 })),
  caveRock: () => memo('caverock', () => spriteGeo(S.STALAGMITE, { s: '#3b3540', d: '#2a252e' }, 0.5, { inflate: 1 })),
  caveSpike: () => memo('cavespike', () => spriteGeo(S.STALACTITE, { s: '#3b3540', d: '#2a252e' }, 0.45, { inflate: 1, anchor: 'top' })),
  shelf: () => memo('shelf', () => {
    const v = new VoxelSet();
    const cols = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#ffffff'];
    let k = 3;
    v.box(0, 0, 1, 40, 1, 6, '#9e9e9e');
    for (let s = 0; s < 4; s++) {
      const y = 1 + s * 6;
      v.box(0, y + 5, 1, 40, 1, 6, '#bdbdbd');
      for (let x = 0; x < 40; x += 2) {
        k = (k * 1103515245 + 12345) & 0x7fffffff;
        k = k >>> 8;
        const h = 2 + (k % 4);
        v.box(x, y, 2, 2, h, 4, cols[k % cols.length]);
      }
    }
    v.box(0, 0, 0, 40, 25, 1, '#cfcfcf');
    return v.build(0.2);
  }),
  lamp: () => memo('lamp', () => new VoxelSet().box(0, 0, 0, 12, 1, 3, '#ffffff').build(0.25)),
  cane: () => memo('cane', () => spriteGeo(S.CANE, { r: '#e53935', w: '#ffffff' }, 0.45, { inflate: 0, depth: 1 })),
  bigLolly: (c) => memo(`blolly${c}`, () => spriteGeo(S.LOLLIPOP, { p: c, w: '#ffffff' }, 0.4, { inflate: 1 })),
  cottonCloud: (c) => memo(`cotton${c}`, () => spriteGeo(S.CLOUD, { '#': c }, 0.4, { inflate: 1.5, maxHalf: 3 })),
  snowPine: () => memo('snowpine', () => spriteGeo(S.SNOW_PINE, { w: '#ffffff', g: '#2e6b4a', t: '#5d4037' }, 0.38, { inflate: 1.2, maxHalf: 5, cross: true, frontHalf: 5 })),
  igloo: () => memo('igloo', () => spriteGeo(S.IGLOO, { w: '#f0f8ff', k: '#5a7a95' }, 0.35, { inflate: 1.5, maxHalf: 4 })),
  mountain: (c, s) => memo(`mtn${c}${s}`, () => spriteGeo(S.VOLCANO, { r: c, l: s }, 2.2, { inflate: 0, depth: 1 })),
  neonPalm: () => memo('npalm', () => spriteGeo(S.NEON_PALM, { p: '#ff2bd6', c: '#00f0ff' }, 0.45, { inflate: 0, depth: 1 })),
  building: (h, c) => memo(`bld${h}${c}`, () => {
    const v = new VoxelSet();
    v.box(0, 0, 0, 6, h, 6, '#120626');
    for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < 6; x += 2) if ((x * 7 + y * 3) % 5 < 3) v.set(x, y, 6, c);
    v.box(0, h, 0, 6, 1, 6, c);
    return v.build(0.8);
  }),
  stripeSun: () => memo('ssun', () => {
    const v = new VoxelSet();
    const R = 10;
    for (let y = -R; y < R; y++) for (let x = -R; x < R; x++) {
      if (x * x + y * y > R * R) continue;
      if (y < 0 && ((-y) % 4 === 0 || (-y) % 4 === 1 && y < -5)) continue;
      const t = (y + R) / (2 * R);
      v.set(x, y, 0, t > 0.6 ? '#ffe14d' : t > 0.35 ? '#ff8a3d' : '#ff2bd6');
    }
    return v.build(1.6, { anchor: 'center' });
  }),
  planet: (c, r) => memo(`planet${c}${r}`, () => spriteGeo(S.PLANET, { p: c, w: '#ffffff', y: r }, 2.2, { inflate: 1, maxHalf: 3 })),
  satellite: () => memo('sat', () => spriteGeo(S.SATELLITE, { b: '#3f51b5', w: '#cfd8dc' }, 0.4, { inflate: 0, depth: 1 })),
  asteroid: () => memo('past', () => spriteGeo(S.ASTEROID, { g: '#6d5a52', d: '#4e3d36' }, 0.5)),
  sun: (c = '#ffd54f') => memo(`sun${c}`, () => spriteGeo(S.SUN, { y: c }, 2.2, { inflate: 0, depth: 1, anchor: 'center' })),
  // shadow city
  noirBuilding: (h, seed) => memo(`noir${h}-${seed}`, () => {
    const v = new VoxelSet();
    const r = lcg(seed * 31 + 7);
    v.box(0, 0, 0, 8, h, 6, '#15171d');
    for (let y = 2; y < h - 1; y += 2) for (let x = 1; x < 8; x += 2) {
      const lit = r() < 0.35;
      v.set(x, y, 6, lit ? (r() < 0.8 ? '#ffcf3f' : '#ffe9a8') : '#262a33');
      v.set(8, y, 1 + (x % 5), lit && r() < 0.5 ? '#ffcf3f' : '#262a33');
    }
    v.box(0, h, 0, 8, 1, 6, '#0d0e12');
    if (r() < 0.5) v.box(2, h + 1, 2, 2, 3, 2, '#0d0e12');
    return v.build(0.7);
  }),
  streetLamp: () => memo('slamp', () => spriteGeo(S.STREET_LAMP, { g: '#2b2e36', l: '#ffe9a8', p: '#2b2e36' }, 0.36, { inflate: 0, depth: 1, cross: true })),
  lampPool: () => memo('slpool', () => {
    // a warm pool of lamplight on the pavement
    const v = new VoxelSet();
    for (let x = -14; x <= 14; x++) for (let z = -9; z <= 9; z++) {
      const d = Math.sqrt((x * x) / 196 + (z * z) / 81);
      if (d > 1) continue;
      v.set(x, 0, z, d < 0.45 ? '#8a7448' : d < 0.75 ? '#6a5a3c' : '#4c4334');
    }
    return v.build(0.2, { ao: false });
  }),
  lampHead: () => memo('slamph', () => new VoxelSet().box(0, 0, 0, 3, 1, 3, '#ffe39a').build(0.36)),
  // planet zorb
  alienPlant: (c) => memo(`aplant${c}`, () => spriteGeo(S.ALIEN_PLANT, { g: c, s: '#5a2d82' }, 0.3, { inflate: 0, depth: 1, cross: true })),
  eyeStalk: () => memo('estalk', () => spriteGeo(S.EYE_STALK, { w: '#ffffff', k: '#ff2d6f', s: '#7b2ff7' }, 0.25, { inflate: 1, cross: true })),
  alienSpire: () => memo('aspire', () => spriteGeo(S.ALIEN_SPIRE, { p: '#3b1d6e', g: '#3dffb0' }, 1.1, { inflate: 0.8, maxHalf: 3 })),
  // haunted hollow
  grave: () => memo('pgrave', () => spriteGeo(S.TOMBSTONE, { s: '#6d727b', d: '#4b4f57', m: '#3a5a2c' }, 0.12)),
  fence: () => memo('fence', () => spriteGeo(S.FENCE, { b: '#1a141e' }, 0.22, { inflate: 0, depth: 1 })),
  mansion: () => memo('mansion', () => spriteGeo(S.MANSION, { b: '#140f1c', y: '#ffd35a' }, 1.6, { inflate: 0, depth: 1, anchor: 'center' })),
  bigMoon: () => memo('bigmoon', () => spriteGeo(S.MOON_FACE, { w: '#f4f0d8', g: '#cfc8a8' }, 2.6, { inflate: 0, depth: 1, anchor: 'center' })),
  jackLantern: () => memo('jackl', () => spriteGeo(S.PUMPKIN, { g: '#3f7a2a', o: '#ff7f11', y: '#ffe066' }, 0.12)),
  // sky kingdom
  island: () => memo('island', () => spriteGeo(S.ISLAND, { g: '#7ed957', d: '#a1887f' }, 0.6, { inflate: 1, maxHalf: 4 })),
  pillar: () => memo('pillar', () => spriteGeo(S.COLUMN, { m: '#fbf8f0', d: '#e2dac6' }, 0.4, { inflate: 1, cross: true, frontHalf: 4 })),
  // bamboo dojo
  bamboo: () => memo('bamboo', () => spriteGeo(S.BAMBOO, { l: '#b9e07a', g: '#5fa83a', k: '#3f7a2a' }, 0.4, { inflate: 0, depth: 1, cross: true })),
  cherry: () => memo('cherry', () => spriteGeo(S.CHERRY, { p: '#ffaccb', w: '#ffffff', b: '#5d3a2a' }, 0.4, { inflate: 1.2, maxHalf: 4, cross: true, frontHalf: 4 })),
  torii: () => memo('torii', () => spriteGeo(S.TORII, { r: '#d9302c', k: '#2b1a10' }, 0.45, { inflate: 0, depth: 1 })),
  // toy box
  toyTower: (seed) => memo(`ttower${seed}`, () => {
    const v = new VoxelSet();
    const cols = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00'];
    const r = lcg(seed + 3);
    let y = 0;
    for (let i = 0; i < 4 + Math.floor(r() * 4); i++) {
      const s = 3 + Math.floor(r() * 2);
      const c = cols[Math.floor(r() * cols.length)];
      v.box(-Math.floor(s / 2), y, -Math.floor(s / 2), s, s, s, c);
      y += s;
    }
    return v.build(0.35);
  }),
  palm: () => memo('palm', () => spriteGeo(S.PALM, { g: '#2e9d4a', t: '#8d6e4a' }, 0.45, { inflate: 1, maxHalf: 3, cross: true, frontHalf: 3 })),
  sailboat: () => memo('sailboat', () => spriteGeo(S.SAILBOAT, { w: '#ffffff', m: '#6d4c41', b: '#e53935' }, 0.6, { inflate: 0, depth: 2 })),
  sandBar: () => memo('sandbar', () => {
    const v = new VoxelSet();
    for (let x = -14; x <= 14; x++) for (let z = -7; z <= 7; z++) {
      const d = (x * x) / 196 + (z * z) / 49;
      if (d > 1) continue;
      v.set(x, 0, z, d > 0.75 ? '#f3e2b0' : '#e8cf8e');
      if (d < 0.4) v.set(x, 1, z, '#e8cf8e');
    }
    return v.build(0.3);
  }),
  crayon: (c) => memo(`crayon${c}`, () => spriteGeo(S.CRAYON, { c, w: '#ffffff' }, 0.35, { inflate: 1, cross: true })),
};

// ---------------------------------------------------------------- gear
export const gear = {
  pickaxe: () => memo('pickaxe', () => spriteGeo(S.PICKAXE, { d: '#4ee6e0', w: '#8b5a2b' }, 0.09, { inflate: 0, depth: 1, anchor: 'bottom' })),
  cart: () => memo('pcart', () => {
    const v = new VoxelSet().sprite(S.CART, { k: '#b0b0b0', d: '#333333' }, { inflate: 0, depth: 4 });
    return v.build(0.12);
  }),
  board: (c1, c2) => memo(`board${c1}${c2}`, () => {
    const v = new VoxelSet();
    for (let x = 0; x < 18; x++) v.box(x, 0, 0, 1, 1, 6, x % 6 < 3 ? c1 : c2);
    v.box(0, 1, 0, 1, 1, 6, c1).box(17, 1, 0, 1, 1, 6, c1);
    return v.build(0.1);
  }),
  helmet: () => memo('helmet', () => new VoxelSet().box(0, 0, 0, 11, 9, 10, '#cfefff').build(0.1)),
  gun: () => memo('gun', () => spriteGeo(S.GUN, { k: '#26262b', g: '#ffcf3f' }, 0.07, { inflate: 0, depth: 1, anchor: 'top' })),
  katana: () => memo('katana', () => spriteGeo(S.KATANA, { s: '#e6eef2', g: '#ffd23f', h: '#2b1a10' }, 0.09, { inflate: 0, depth: 1, anchor: 'top' })),
  headband: () => memo('headband', () => new VoxelSet().box(0, 0, 0, 12, 1, 11, '#e53935').box(-3, -1, 5, 3, 1, 1, '#e53935').build(0.1)),
  pogo: () => memo('pogo', () => {
    const v = new VoxelSet();
    v.box(0, 0, 0, 1, 2, 1, '#333333'); // rubber tip
    for (let y = 2; y < 7; y++) v.box(-1, y, -1, 3, 1, 3, y % 2 ? '#bdbdbd' : '#757575'); // spring
    v.box(0, 7, 0, 1, 12, 1, '#e53935'); // pole
    v.box(-2, 7, 0, 5, 1, 1, '#333333'); // foot pegs
    v.box(0, 19, -3, 1, 1, 7, '#333333'); // handlebar
    return v.build(0.1, { centerX: true });
  }),
  parasol: () => memo('parasol', () => {
    const v = new VoxelSet();
    const R = 9;
    for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
      const d = Math.sqrt(x * x + z * z);
      if (d > R) continue;
      const y = Math.round(4 - (d * d) / (R * 1.6));
      const seg = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 8);
      v.set(x, y, z, seg % 2 ? '#ffffff' : '#ff4f6d');
    }
    v.box(0, -8, 0, 1, 12, 1, '#5d4037');
    return v.build(0.1, { anchor: 'bottom' });
  }),
  lamp: () => memo('headlamp', () => new VoxelSet().box(0, 0, 0, 2, 2, 2, '#fff59d').build(0.1)),
};

// Should this obstacle turn to face the chase / first-person camera? Flat,
// side-drawn sprites yes; real 3D shapes (walls, blocks, pits) and things
// that already carry a head-on drawing (birds) no.
export function billboards(type) {
  if (FRONT[type]) return true;
  const def = P[type];
  if (!def) return false;
  const opts = def[2] || {};
  return !opts.front;
}
