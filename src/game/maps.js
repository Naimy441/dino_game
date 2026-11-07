// Gameplay definition of every world: physics, gimmick, and what spawns.
// Visuals live in src/render/themes.js under the same ids.
//
// Obstacle specs: w/h are the hitbox in world units (the dino is ~2 tall).
//   y: list of heights for flying things (bottom edge)
//   tags: burnable (fire breath kills it), mob (pickaxe kills it),
//         pickup (collect, never hurts), puddle (harmless, spins the cart)
//   vx: extra speed toward the dino; drop: falls when the dino gets close;
//   bob: floats up and down; ceil: hangs from the ceiling (gravity flip map)
//   group: max copies placed side by side
//   wall: too tall to jump and nothing to duck under: the world's ability
//         (fire, pickaxe, gun, phase, dash) is the only way through
//   shootable + hp: gold bullets take it down; field: phase through it;
//   dashable: a dash cuts through it; ghost: only solid while visible;
//   pit: a hole in the path (fall in and it's over); wSpeed: pit width as a
//   multiple of the current speed; popup: pokes out of the ground as you near

import { px } from './classic.js';

export const COLOR_SCORE = 200; // the classic desert explodes into colour here
export const MAP_LENGTH = 350; // points per world after that

const BAT_Y = [0.25, 1.35, 1.35, 2.7];

export const MAPS = [
  {
    // The original runner, rule for rule: types picked evenly (never three
    // in a row), groups of up to three once fast enough, gaps from the
    // original formula. pxW is the original sprite width the gap is based
    // on; pterodactyls (bats here) only appear from speed 8.5 and fly at the
    // original three heights (ground, duck-under, run-under).
    id: 'desert', name: 'CLASSIC DESERT', gimmick: null, hint: 'SPACE JUMP   DOWN DUCK', classic: true,
    ground: [
      { type: 'cactusSmall', w: 0.62, h: 0.95, pxW: 17, group: 3, multipleSpeed: 4, minGap: 120 },
      { type: 'cactusTall', w: 0.85, h: 1.55, pxW: 25, group: 3, multipleSpeed: 7, minGap: 120 },
    ],
    air: [{ type: 'bat', w: 1.4, h: 0.62, pxW: 46, y: [0, px(25) + 0.15, px(50)], minSpeed: 8.5, minGap: 150, speedOffset: 0.8 }],
    airChance: 0,
  },
  {
    id: 'forest', name: 'PIXEL FOREST', gimmick: 'doubleJump', hint: 'DOUBLE JUMP! TAP JUMP AGAIN IN THE AIR',
    ground: [
      { type: 'stump', w: 0.8, h: 0.75, weight: 3, group: 2 },
      { type: 'mushroom', w: 0.75, h: 0.6, weight: 2, group: 3 },
      { type: 'logStack', w: 0.75, h: 3.1, weight: 2 },
    ],
    air: [{ type: 'bird', w: 1.0, h: 0.6, y: BAT_Y, weight: 1 }],
    airChance: 0.25,
  },
  {
    id: 'volcano', name: 'MOUNT MAGMA', gimmick: 'fire', hint: 'X / F  BREATHE FIRE. BURN THE THORN WALLS!',
    ground: [
      { type: 'thornWall', w: 0.9, h: 5.6, weight: 1.3, tags: ['burnable', 'wall'] },
      { type: 'lavaRock', w: 1.0, h: 0.75, weight: 3, group: 2, tags: ['burnable'] },
      { type: 'obsidian', w: 0.7, h: 1.6, weight: 2, group: 2, tags: ['burnable'] },
    ],
    air: [{ type: 'fireBat', w: 1.4, h: 0.62, y: BAT_Y, weight: 1, tags: ['burnable'] }],
    airChance: 0.3,
  },
  {
    id: 'moon', name: 'THE MOON', gimmick: 'lowGravity', hint: 'LOW GRAVITY! DOWN TO SLAM',
    gravity: 0.24, jump: 0.7, speedMul: 0.85,
    ground: [
      { type: 'moonRock', w: 1.4, h: 0.75, weight: 3, group: 2 },
      { type: 'moonSpire', w: 0.75, h: 2.4, weight: 2 },
    ],
    air: [{ type: 'ufo', w: 1.6, h: 0.75, y: [1.35, 3.6, 5.2, 6.5], weight: 1, bob: 0.4 }],
    airChance: 0.35,
  },
  {
    id: 'blocky', name: 'BLOCK WORLD', gimmick: 'pickaxe', hint: 'X / F  PICKAXE. MINE THROUGH STONE WALLS!',
    ground: [
      { type: 'stoneWall', w: 0.9, h: 5.4, weight: 1.4, tags: ['mob', 'wall'] },
      { type: 'zombie', w: 0.75, h: 1.9, weight: 4, vx: 2.5, tags: ['mob'] },
      { type: 'dirtBlock', w: 0.9, h: 0.9, weight: 2, group: 2, tags: ['mob'] },
      { type: 'dirtTower', w: 0.9, h: 1.8, weight: 1, tags: ['mob'] },
    ],
    air: [{ type: 'blockBat', w: 1.4, h: 0.62, y: BAT_Y, weight: 1, tags: ['mob'] }],
    airChance: 0.2,
  },
  {
    id: 'reef', name: 'DEEP REEF', gimmick: 'swim', hint: 'HOLD JUMP TO SWIM UP',
    ceiling: 6.4, speedMul: 0.82,
    ground: [
      { type: 'coral', w: 0.9, h: 1.1, weight: 3, group: 2 },
      { type: 'coralTall', w: 0.7, h: 2.6, weight: 2 },
    ],
    air: [
      { type: 'jelly', w: 0.75, h: 0.9, y: [1.6, 2.6, 3.6, 4.6], weight: 2, bob: 0.6 },
      { type: 'shark', w: 1.9, h: 0.8, y: [1.4, 3.0, 4.4], weight: 1, vx: 4 },
    ],
    airChance: 0.5,
  },
  {
    id: 'cave', name: 'CRYSTAL CAVE', gimmick: 'dark', hint: 'DARK! WATCH FOR FALLING STALACTITES',
    speedMul: 0.95,
    ground: [
      { type: 'stalagmite', w: 0.7, h: 1.05, weight: 3, group: 3 },
      { type: 'minecart', w: 1.2, h: 0.75, weight: 1, vx: 3 },
    ],
    air: [
      { type: 'stalactite', w: 0.7, h: 1.05, y: [1.4], weight: 2 },
      { type: 'dropper', w: 0.7, h: 1.05, y: [4.2], weight: 2, drop: true },
    ],
    airChance: 0.4,
  },
  {
    id: 'store', name: 'AISLE 9', gimmick: 'cart', hint: 'CART RIDE! SPILLS = SPIN BONUS',
    ground: [
      { type: 'cans', w: 1.0, h: 1.0, weight: 3, group: 2 },
      { type: 'wetSign', w: 0.7, h: 0.85, weight: 2 },
      { type: 'strayCart', w: 1.4, h: 0.85, weight: 2, vx: 4 },
      { type: 'spill', w: 1.6, h: 0.05, weight: 2, tags: ['puddle'] },
    ],
    air: [{ type: 'saleSign', w: 1.1, h: 0.95, y: [1.35], weight: 1 }],
    airChance: 0.25,
  },
  {
    id: 'candy', name: 'SUGAR RUSH', gimmick: 'giant', hint: 'EAT CANDY TO GO GIANT',
    ground: [
      { type: 'gumdrop', w: 0.75, h: 0.65, weight: 3, group: 3 },
      { type: 'cupcake', w: 0.75, h: 0.85, weight: 2, group: 2 },
      { type: 'lollipop', w: 0.6, h: 1.6, weight: 2 },
    ],
    air: [
      { type: 'bee', w: 0.75, h: 0.6, y: BAT_Y, weight: 2 },
      { type: 'candy', w: 0.8, h: 0.5, y: [0.9, 2.2, 3.0], weight: 1, tags: ['pickup'], bob: 0.25 },
    ],
    airChance: 0.35,
  },
  {
    id: 'tundra', name: 'FROSTBITE PEAKS', gimmick: 'snowboard', hint: 'SNOWBOARD! BIG AIR = FLIP BONUS',
    ground: [
      { type: 'snowman', w: 0.8, h: 1.45, weight: 2 },
      { type: 'iceSpike', w: 0.75, h: 0.7, weight: 3, group: 3 },
      { type: 'penguin', w: 0.6, h: 0.95, weight: 2, vx: 5 },
    ],
    air: [{ type: 'snowBird', w: 1.0, h: 0.6, y: BAT_Y, weight: 1 }],
    airChance: 0.22,
  },
  {
    id: 'neon', name: 'NEON HIGHWAY', gimmick: 'lanes', hint: 'LEFT / RIGHT SWITCH LANES',
    lanes: true,
    ground: [
      { type: 'neonCar', w: 2.4, h: 1.0, weight: 3, vx: 6 },
      { type: 'barrier', w: 0.6, h: 0.8, weight: 2 },
    ],
    air: [{ type: 'drone', w: 1.0, h: 0.5, y: [1.35], weight: 1 }],
    airChance: 0.2,
  },
  {
    id: 'space', name: 'INTERSTELLAR', gimmick: 'flip', hint: 'JUMP FLIPS GRAVITY',
    ceiling: 5.4,
    ground: [
      { type: 'asteroid', w: 1.0, h: 0.95, weight: 3, group: 2 },
      { type: 'asteroidCeil', w: 1.0, h: 0.95, weight: 3, group: 2, ceil: true },
    ],
    air: [],
    airChance: 0,
  },
  {
    id: 'city', name: 'SHADOW CITY', gimmick: 'gun', hint: 'X / F  FIRE GOLD BULLETS. BIG GOONS TAKE 3',
    speedMul: 0.95,
    ground: [
      { type: 'goon', w: 0.8, h: 2.0, weight: 3, vx: 2, tags: ['shootable'], hp: 1 },
      { type: 'bruiser', w: 1.2, h: 4.6, weight: 1.5, tags: ['shootable', 'wall'], hp: 3 },
      { type: 'hydrant', w: 0.6, h: 0.8, weight: 2, group: 2 },
      { type: 'trashCan', w: 0.8, h: 1.0, weight: 2 },
    ],
    air: [
      { type: 'hangSign', w: 1.3, h: 0.9, y: [1.35], weight: 1 },
      { type: 'crow', w: 1.0, h: 0.6, y: BAT_Y, weight: 1, tags: ['shootable'], hp: 1 },
    ],
    airChance: 0.25,
  },
  {
    id: 'alien', name: 'PLANET ZORB', gimmick: 'phase', hint: 'X / F  PHASE THROUGH FORCE FIELDS',
    ground: [
      { type: 'pod', w: 0.9, h: 0.85, weight: 3, group: 2 },
      { type: 'tentacle', w: 0.6, h: 2.0, weight: 2, popup: true },
      { type: 'field', w: 0.5, h: 6, weight: 1.4, tags: ['field', 'wall'] },
      { type: 'blob', w: 1.0, h: 0.7, weight: 1.5, vx: 3 },
    ],
    air: [{ type: 'eyeDrone', w: 0.9, h: 0.8, y: BAT_Y, weight: 1, bob: 0.18 }],
    airChance: 0.25,
  },
  {
    id: 'haunted', name: 'HAUNTED HOLLOW', gimmick: 'ghosts', hint: 'GHOSTS ARE ONLY SOLID WHILE YOU CAN SEE THEM',
    speedMul: 0.95,
    ground: [
      { type: 'tombstone', w: 0.8, h: 1.1, weight: 3, group: 2 },
      { type: 'pumpkin', w: 0.8, h: 0.7, weight: 2, group: 3 },
      { type: 'hand', w: 0.6, h: 1.1, weight: 1.5, popup: true },
    ],
    air: [
      { type: 'ghost', w: 0.9, h: 1.4, y: [0, 1.35, 1.35], weight: 3, tags: ['ghost'], bob: 0.15 },
      { type: 'hauntBat', w: 1.4, h: 0.62, y: BAT_Y, weight: 1 },
    ],
    airChance: 0.4,
  },
  {
    id: 'sky', name: 'SKY KINGDOM', gimmick: 'glide', hint: 'MIND THE GAPS! HOLD JUMP TO GLIDE',
    ground: [
      { type: 'column', w: 0.8, h: 1.3, weight: 2 },
      { type: 'gap', w: 3, h: 0.02, weight: 2.2, tags: ['pit'], wSpeed: [0.3, 0.48] },
      { type: 'chasm', w: 8, h: 0.02, weight: 1.3, tags: ['pit'], wSpeed: [0.85, 1.1] },
    ],
    air: [
      { type: 'balloon', w: 0.8, h: 1.1, y: [1.35, 2.6], weight: 1, bob: 0.3 },
      { type: 'eagle', w: 1.2, h: 0.6, y: BAT_Y, weight: 1 },
    ],
    airChance: 0.25,
  },
  {
    id: 'dojo', name: 'BAMBOO DOJO', gimmick: 'dash', hint: 'X / F  DASH THROUGH PAPER WALLS AND STARS',
    ground: [
      { type: 'bambooSpikes', w: 0.9, h: 0.7, weight: 3, group: 3 },
      { type: 'stoneLantern', w: 0.7, h: 1.4, weight: 2 },
      { type: 'shoji', w: 0.6, h: 5.2, weight: 1.4, tags: ['dashable', 'wall'] },
    ],
    air: [{ type: 'shuriken', w: 0.6, h: 0.6, y: BAT_Y, weight: 1, vx: 8, tags: ['dashable'] }],
    airChance: 0.25,
  },
  {
    id: 'toybox', name: 'TOY BOX', gimmick: 'pogo', hint: 'POGO! HOLD JUMP = BIG BOUNCE, DOWN = SMALL',
    ground: [
      { type: 'abcBlock', w: 0.9, h: 0.9, weight: 3, group: 2 },
      { type: 'soldier', w: 0.6, h: 1.5, weight: 2, vx: 2 },
      { type: 'marble', w: 0.5, h: 0.5, weight: 1.5, vx: 7 },
    ],
    air: [{ type: 'toyPlane', w: 1.3, h: 0.6, y: [2.7, 3.4], weight: 1.2 }],
    airChance: 0.25,
  },
  {
    id: 'lagoon', name: 'SPLASH LAGOON', gimmick: 'paddle', hint: 'SWIMMING! JUMP TO LEAP OUT, DOWN TO DIVE UNDER',
    ground: [
      { type: 'floatLog', w: 1.6, h: 0.9, y0: -0.35, weight: 3 },
      { type: 'buoy', w: 0.7, h: 4.2, y0: -2.8, weight: 2 },
      { type: 'finShark', w: 1.2, h: 0.9, y0: -0.3, weight: 2, vx: 4 },
    ],
    air: [{ type: 'gull', w: 1.0, h: 0.6, y: [1.0, 1.5], weight: 1 }],
    airChance: 0.3,
  },
];

export const MAP_IDS = MAPS.map((m) => m.id);

// Score at which a map starts (first lap).
export function mapStartScore(index) {
  return index === 0 ? 0 : COLOR_SCORE + (index - 1) * MAP_LENGTH;
}

// Which map (and lap) a score belongs to. After the last world the run loops
// back to the forest, so the colour never goes away again.
export function mapForScore(score) {
  if (score < COLOR_SCORE) return { index: 0, lap: 0 };
  const n = MAPS.length - 1;
  const k = Math.floor((score - COLOR_SCORE) / MAP_LENGTH);
  return { index: 1 + (k % n), lap: Math.floor(k / n) };
}

export function allObstacleSpecs() {
  const out = {};
  for (const m of MAPS) for (const s of [...m.ground, ...m.air]) out[s.type] = s;
  return out;
}
