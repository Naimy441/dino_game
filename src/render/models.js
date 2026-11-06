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

export function dinoParts(look) {
  return memo(`dino-${look}`, () => {
    const p = DINO_COLORS[look];
    const body = new VoxelSet().sprite(S.DINO_BODY, p, { inflate: 1.6, maxHalf: 4 });
    // a dark pupil behind the eye pixel and a belly stripe for depth
    const duck = new VoxelSet().sprite(S.DINO_DUCK, p, { inflate: 1.6, maxHalf: 4 });
    const leg = new VoxelSet().sprite(S.DINO_LEG, { '#': p.l }, { inflate: 0, depth: 1 });
    return {
      body: body.build(0.1, { centerX: false }),
      duck: duck.build(0.1, { centerX: false }),
      leg: leg.build(0.1, { centerX: false, anchor: 'top' }),
    };
  });
}

// ---------------------------------------------------------------- obstacles
const P = {
  cactusSmall: [S.CACTUS_SMALL, { '#': MONO }],
  cactusTall: [S.CACTUS_TALL, { '#': MONO }],
  bat: [[S.BAT_UP, S.BAT_DOWN], { '#': MONO }],
  stump: [S.STUMP, { r: '#c9a27a', t: '#6d4c41' }],
  mushroom: [S.MUSHROOM, { r: '#e53935', w: '#fff4e0' }],
  logStack: [S.LOG_STACK, { r: '#c9a27a', t: '#6d4c41' }],
  bird: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#ffca28', b: '#ef6c00' }],
  lavaRock: [S.LAVA_ROCK, { r: '#3b2b2b', l: '#ff7b00' }],
  obsidian: [S.OBSIDIAN, { o: '#2a1745', l: '#c060ff' }],
  fireBat: [[S.BAT_UP, S.BAT_DOWN], { '#': '#ff5722' }],
  moonRock: [S.MOON_ROCK, { g: '#9a9a9a', w: '#d0d0d0', d: '#5c5c5c' }],
  moonSpire: [S.MOON_SPIRE, { g: '#9a9a9a', w: '#d0d0d0', d: '#5c5c5c' }],
  ufo: [S.UFO, { g: '#90a4ae', c: '#80deea', y: '#ffeb3b' }],
  zombie: [S.ZOMBIE, { g: '#5f9e4a', c: '#00a0a8', b: '#3b3bb5', k: '#111111' }, { inflate: 0, depth: 3 }],
  blockBat: [[S.BAT_UP, S.BAT_DOWN], { '#': '#3a2a20' }, { inflate: 0, depth: 1 }],
  coral: [S.CORAL, { p: '#ff6f91' }],
  coralTall: [S.CORAL_TALL, { o: '#ff9800' }],
  jelly: [S.JELLY, { p: '#e1a6f0', w: '#ffffff' }],
  shark: [S.SHARK, { g: '#78909c', w: '#eceff1', k: '#111111' }],
  stalagmite: [S.STALAGMITE, { s: '#7d7385', d: '#4d4555' }],
  stalactite: [S.STALACTITE, { s: '#7d7385', d: '#4d4555' }],
  dropper: [S.STALACTITE, { s: '#8d8395', d: '#e05050' }],
  minecart: [S.MINECART, { b: '#6d4c41', g: '#ffd54f', k: '#222222' }],
  cans: [S.CANS, { r: '#e53935', w: '#eeeeee' }],
  wetSign: [S.WET_SIGN, { y: '#ffd600', k: '#222222' }],
  strayCart: [S.CART, { k: '#9e9e9e', d: '#333333' }, { inflate: 0, depth: 4 }],
  saleSign: [S.SALE_SIGN, { r: '#e53935', w: '#ffffff', k: '#555555' }, { inflate: 0, depth: 1 }],
  gumdrop: [S.GUMDROP, { g: '#4dd06a', w: '#c8ffd0' }],
  cupcake: [S.CUPCAKE, { w: '#ffffff', p: '#ff4081', b: '#a1745a', r: '#e53935' }],
  lollipop: [S.LOLLIPOP, { p: '#ff4081', w: '#ffffff' }],
  bee: [S.BEE, { y: '#ffeb3b', k: '#222222', w: '#e3f2fd' }],
  candy: [S.CANDY, { p: '#ff4081', w: '#ffffff' }],
  snowman: [S.SNOWMAN, { w: '#ffffff', k: '#222222', o: '#ff9800', r: '#e53935' }],
  iceSpike: [S.ICE_SPIKE, { c: '#81d4fa', w: '#e1f5fe' }],
  penguin: [S.PENGUIN, { k: '#212121', w: '#ffffff', o: '#ff9800' }],
  snowBird: [[S.BIRD_UP, S.BIRD_DOWN], { y: '#ffffff', b: '#64b5f6' }],
  neonCar: [S.NEON_CAR, { p: '#ff2bd6', c: '#00f0ff', y: '#ffe600', k: '#111111' }, { inflate: 0, depth: 6 }],
  barrier: [S.BARRIER, { y: '#ffe600', k: '#111111', c: '#00f0ff' }, { inflate: 0, depth: 7 }],
  drone: [S.DRONE, { c: '#00f0ff', k: '#222222', p: '#ff2bd6' }],
  asteroid: [S.ASTEROID, { g: '#8d6e63', d: '#5d4037' }],
  asteroidCeil: [S.ASTEROID, { g: '#7e5f54', d: '#4e342e' }],
};
const GLOW = new Set(['candy', 'neonCar', 'barrier', 'drone', 'jelly', 'spill', 'ufo']);

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
    return {
      frames: frames.map((rows) => spriteGeo(rows, pal, size, { inflate: 1.5, maxHalf: 4, ...opts, anchor: 'bottom' })),
      glow: GLOW.has(type),
    };
  });
}

// ---------------------------------------------------------------- props
export const prop = {
  cloud: (c = '#dadada') => memo(`cloud${c}`, () => spriteGeo(S.CLOUD, { '#': c }, 0.25, { inflate: 0, depth: 1 })),
  dune: (c) => memo(`dune${c}`, () => spriteGeo(S.DUNE, { '#': c }, 0.5, { inflate: 0, depth: 1 })),
  pebble: (c) => memo(`peb${c}`, () => spriteGeo(S.PEBBLE, { '#': c }, 0.1, { inflate: 0, depth: 1 })),
  cactus: (c) => memo(`pcact${c}`, () => spriteGeo(S.CACTUS_TALL, { '#': c }, 0.1, { inflate: 1.5 })),
  pine: () => memo('pine', () => spriteGeo(S.PINE, { g: '#2e7d32', t: '#6d4c41' }, 0.35, { inflate: 1.2, maxHalf: 5 })),
  pine2: () => memo('pine2', () => spriteGeo(S.PINE, { g: '#43a047', t: '#5d4037' }, 0.3, { inflate: 1.2, maxHalf: 5 })),
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
  snowPine: () => memo('snowpine', () => spriteGeo(S.SNOW_PINE, { w: '#ffffff', g: '#2e6b4a', t: '#5d4037' }, 0.38, { inflate: 1.2, maxHalf: 5 })),
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
  lamp: () => memo('headlamp', () => new VoxelSet().box(0, 0, 0, 2, 2, 2, '#fff59d').build(0.1)),
};
