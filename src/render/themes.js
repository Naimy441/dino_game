import { prop } from './models.js';

// The look of every world. Props are scattered beside the track and scroll
// with it; `sky` items hang far away and never scroll. z < 0 is behind the
// track (the side view looks at it), z > 0 is the camera side, where only
// small things are drawn in the side view.
//
// ground/track: base colour, speck colours and a pattern for the pixel texture.

export const THEMES = {
  desert: {
    sky: '#f7f7f7', horizon: '#f7f7f7', fog: '#f7f7f7', fogNear: 45, fogFar: 150,
    hemi: ['#ffffff', '#bdbdbd', 1.0], sun: ['#ffffff', 0.45],
    ground: { base: '#f7f7f7', specks: ['#535353', '#bdbdbd'], density: 0.035, pattern: 'specks' },
    track: { base: '#f0f0f0', specks: ['#535353'], density: 0.05, pattern: 'line', line: '#535353' },
    dino: 'mono',
    props: [
      { make: () => prop.pebble('#535353'), n: 24, z: [-2.6, -1.5], s: [0.6, 1] },
      { make: () => prop.dune('#e3e3e3'), n: 8, z: [-70, -40], s: [1, 2] },
      { make: () => prop.cactus('#d0d0d0'), n: 10, z: [-45, -25], s: [1.5, 2.5] },
      { make: () => prop.cactus('#c4c4c4'), n: 8, z: [10, 30], s: [1.5, 2.5], front: true },
    ],
    sky3d: [
      { make: () => prop.cloud('#dcdcdc'), n: 6, drift: 1.5 },
    ],
  },
  forest: {
    sky: '#5fb8f5', horizon: '#c9ecff', fog: '#bde6fb', fogNear: 40, fogFar: 135,
    hemi: ['#e8f6ff', '#4a7a2a', 0.95], sun: ['#fff6d8', 0.75],
    ground: { base: '#5aa83c', specks: ['#3f8a2a', '#76c04f'], density: 0.12, pattern: 'specks' },
    track: { base: '#9a6a36', specks: ['#7a4f24', '#b5834c'], density: 0.12, pattern: 'specks' },
    props: [
      { make: prop.pine, n: 22, z: [-40, -8], s: [1, 1.8] },
      { make: prop.pine2, n: 14, z: [-24, -7], s: [0.9, 1.4] },
      { make: prop.pine, n: 16, z: [6, 40], s: [1, 1.8], front: true },
      { make: prop.bush, n: 16, z: [-6, -2.2], s: [0.8, 1.3] },
      { make: () => prop.flower('#ff6fa8'), n: 18, z: [1.8, 4.5], s: [1, 1.5] },
      { make: () => prop.flower('#ffffff'), n: 18, z: [-4, -1.8], s: [1, 1.5] },
    ],
    sky3d: [{ make: () => prop.cloud('#ffffff'), n: 7, drift: 2 }, { make: () => prop.sun('#ffe066'), n: 1, fixed: true }],
    particles: { kind: 'leaves', color: '#7cc84f', rate: 6 },
  },
  volcano: {
    sky: '#1a0606', horizon: '#9b2c14', fog: '#4a140c', fogNear: 30, fogFar: 120,
    hemi: ['#ff9a6a', '#2a0a05', 0.7], sun: ['#ff7a3a', 0.8],
    ground: { base: '#352626', specks: ['#1f1414', '#ff5a00'], density: 0.08, pattern: 'cracks', glow: '#ff6a00' },
    track: { base: '#241a1a', specks: ['#3a2a2a', '#ff7a1a'], density: 0.06, pattern: 'cracks', glow: '#ff8a1a' },
    props: [
      { make: prop.volcano, n: 4, z: [-95, -70], s: [1, 1.4] },
      { make: prop.deadTree, n: 14, z: [-25, -4], s: [1.5, 2.5] },
      { make: prop.deadTree, n: 8, z: [8, 30], s: [1.5, 2.5], front: true },
      { make: prop.lavaPool, n: 10, z: [-20, -4], s: [1, 1.6], glow: true },
      { make: prop.lavaPool, n: 6, z: [6, 20], s: [1, 1.6], glow: true, front: true },
    ],
    sky3d: [],
    particles: { kind: 'embers', color: '#ff8a1a', rate: 40 },
  },
  moon: {
    sky: '#03030c', horizon: '#0b0b22', fog: '#06061a', fogNear: 60, fogFar: 170,
    hemi: ['#d6dcff', '#2a2a2a', 0.85], sun: ['#ffffff', 0.9],
    ground: { base: '#9a9a9a', specks: ['#7a7a7a', '#b8b8b8'], density: 0.1, pattern: 'craters' },
    track: { base: '#a8a8a8', specks: ['#8a8a8a', '#c4c4c4'], density: 0.08, pattern: 'specks' },
    props: [
      { make: prop.moonRock, n: 18, z: [-40, -12], s: [1, 2.5] },
      { make: prop.moonRock, n: 10, z: [6, 30], s: [1, 2.5], front: true },
      { make: prop.flag, n: 2, z: [-8, -4], s: [1.2, 1.4] },
    ],
    sky3d: [{ make: prop.earth, n: 1, fixed: true }, { make: () => prop.star('#ffffff'), n: 60, stars: true }],
  },
  blocky: {
    sky: '#7ec0ee', horizon: '#b8dcf7', fog: '#a9d6f5', fogNear: 40, fogFar: 140,
    hemi: ['#ffffff', '#5a7a3a', 0.95], sun: ['#fffbe0', 0.7],
    ground: { base: '#62a83a', specks: ['#4f8a2b', '#78bf4a'], density: 0.18, pattern: 'blocks' },
    track: { base: '#86592f', specks: ['#6b4423', '#9a7048'], density: 0.2, pattern: 'blocks' },
    props: [
      { make: prop.blockTree, n: 20, z: [-40, -5], s: [1, 1.5] },
      { make: prop.blockTree, n: 12, z: [6, 40], s: [1, 1.5], front: true },
    ],
    sky3d: [{ make: prop.blockCloud, n: 7, drift: 1.2 }, { make: prop.blockSun, n: 1, fixed: true }],
  },
  reef: {
    sky: '#06304f', horizon: '#1b7fae', fog: '#0f5a86', fogNear: 18, fogFar: 85,
    hemi: ['#9fe8ff', '#1a3a4a', 0.9], sun: ['#bff4ff', 0.6],
    ground: { base: '#e3cf92', specks: ['#c9b26f', '#f2e2b0'], density: 0.12, pattern: 'ripples' },
    track: { base: '#d9c486', specks: ['#c2ab6a'], density: 0.1, pattern: 'ripples' },
    ceiling: { y: 6.4, color: '#5fd0ff', opacity: 0.35 },
    props: [
      { make: prop.kelp, n: 26, z: [-25, -3], s: [1, 2] },
      { make: prop.kelp, n: 12, z: [6, 25], s: [1, 2], front: true },
      { make: prop.reefRock, n: 12, z: [-34, -12], s: [1, 2] },
      { make: prop.fish, n: 22, z: [-18, -4], y: [1.5, 5.5], s: [1, 1.6], swim: true },
    ],
    sky3d: [],
    particles: { kind: 'bubbles', color: '#cff6ff', rate: 18 },
    wobble: 1,
  },
  cave: {
    sky: '#040407', horizon: '#0a0a12', fog: '#06060c', fogNear: 10, fogFar: 48,
    hemi: ['#6a6a90', '#151520', 0.45], sun: ['#8a8ab0', 0.2],
    ground: { base: '#3b3540', specks: ['#29242c', '#4d4555'], density: 0.15, pattern: 'specks' },
    track: { base: '#47404d', specks: ['#2d2831', '#6a5a3a'], density: 0.1, pattern: 'rails', line: '#6d6d6d' },
    ceiling: { y: 7.5, color: '#1f1b22', opacity: 1 },
    headlamp: true,
    props: [
      { make: () => prop.crystal('#7cf5ff'), n: 14, z: [-16, -7], s: [1, 2], glow: true },
      { make: () => prop.crystal('#d07cff'), n: 12, z: [-16, -7], s: [1, 2], glow: true },
      { make: () => prop.crystal('#7cffb0'), n: 8, z: [5, 16], s: [1, 2], glow: true, front: true },
      { make: prop.caveRock, n: 14, z: [-20, -5], s: [1, 2] },
      { make: prop.caveSpike, n: 26, z: [-14, 10], s: [1, 1.8], hang: 7.5 },
    ],
    sky3d: [],
    particles: { kind: 'dust', color: '#9a8fb0', rate: 6 },
  },
  store: {
    sky: '#f2f0e6', horizon: '#f2f0e6', fog: '#ece9dc', fogNear: 40, fogFar: 120,
    hemi: ['#ffffff', '#c9c6b8', 1.05], sun: ['#ffffff', 0.35],
    ground: { base: '#f4f4f4', specks: ['#d6d6d6'], density: 0, pattern: 'checker', alt: '#dedede' },
    track: { base: '#e9e9e9', specks: ['#cfcfcf'], density: 0, pattern: 'checker', alt: '#d2d2d2' },
    ceiling: { y: 8.5, color: '#e6e3d6', opacity: 1 },
    props: [
      { make: prop.shelf, n: 10, z: [-4.2, -4.2], s: [1, 1], spacing: 8.2 },
      { make: prop.shelf, n: 10, z: [5.4, 5.4], s: [1, 1], spacing: 8.2, front: true, faceBack: true },
      { make: prop.lamp, n: 14, z: [-1, -1], y: [8.2, 8.2], s: [1, 1], glow: true },
    ],
    sky3d: [],
  },
  candy: {
    sky: '#ffb3e0', horizon: '#fff0fa', fog: '#ffdcf0', fogNear: 40, fogFar: 140,
    hemi: ['#ffffff', '#ff9ecf', 1.0], sun: ['#fff5fb', 0.6],
    ground: { base: '#ff9ecf', specks: ['#ffffff', '#ff6fb5', '#7fe0ff', '#fff07a'], density: 0.08, pattern: 'specks' },
    track: { base: '#fff3b0', specks: ['#ff4081', '#40c4ff', '#69f0ae', '#ffd740'], density: 0.08, pattern: 'specks' },
    props: [
      { make: prop.cane, n: 14, z: [-30, -4], s: [1.5, 2.5] },
      { make: () => prop.bigLolly('#ff4081'), n: 8, z: [-35, -6], s: [2, 4] },
      { make: () => prop.bigLolly('#40c4ff'), n: 8, z: [-35, -6], s: [2, 4] },
      { make: () => prop.bigLolly('#ffd740'), n: 8, z: [6, 35], s: [2, 4], front: true },
      { make: prop.cane, n: 8, z: [6, 30], s: [1.5, 2.5], front: true },
    ],
    sky3d: [{ make: () => prop.cottonCloud('#ffffff'), n: 5, drift: 1.6 }, { make: () => prop.cottonCloud('#bfe9ff'), n: 4, drift: 1.2 }],
  },
  tundra: {
    sky: '#9fd3ff', horizon: '#eaf6ff', fog: '#e2f2ff', fogNear: 35, fogFar: 130,
    hemi: ['#ffffff', '#a8c8e8', 1.0], sun: ['#ffffff', 0.6],
    ground: { base: '#ffffff', specks: ['#d6ecff', '#e8f4ff'], density: 0.1, pattern: 'specks' },
    track: { base: '#e3f1ff', specks: ['#c8e2fa'], density: 0.1, pattern: 'line', line: '#b0d4f5' },
    props: [
      { make: () => prop.mountain('#c8dcf0', '#ffffff'), n: 5, z: [-100, -75], s: [1, 1.4] },
      { make: prop.snowPine, n: 22, z: [-40, -8], s: [1, 1.7] },
      { make: prop.snowPine, n: 14, z: [6, 35], s: [1, 1.7], front: true },
      { make: prop.igloo, n: 3, z: [-14, -6], s: [1, 1.2] },
    ],
    sky3d: [{ make: () => prop.cloud('#ffffff'), n: 6, drift: 2 }],
    particles: { kind: 'snow', color: '#ffffff', rate: 60 },
  },
  neon: {
    sky: '#0b0221', horizon: '#5a189a', fog: '#24073f', fogNear: 40, fogFar: 140,
    hemi: ['#ffb0ec', '#3a1670', 1.15], sun: ['#ffffff', 0.8],
    ground: { base: '#0d0221', specks: ['#ff2bd6'], density: 0, pattern: 'grid', line: '#ff2bd6', glow: true },
    track: { base: '#14072e', specks: ['#2a1050'], density: 0.05, pattern: 'lanes', line: '#00f0ff', glow: true },
    trackWidth: 6,
    props: [
      { make: prop.neonPalm, n: 18, z: [-14, -5], s: [1.4, 2], glow: true },
      { make: prop.neonPalm, n: 10, z: [7, 16], s: [1.4, 2], glow: true, front: true },
      { make: () => prop.building(14, '#00f0ff'), n: 8, z: [-80, -40], s: [1, 1.6] },
      { make: () => prop.building(20, '#ff2bd6'), n: 8, z: [-80, -40], s: [1, 1.6] },
      { make: () => prop.building(18, '#ffe600'), n: 8, z: [40, 80], s: [1, 1.6], front: true },
    ],
    sky3d: [{ make: prop.stripeSun, n: 1, fixed: true, glow: true }, { make: () => prop.star('#ff9af0'), n: 40, stars: true }],
  },
  space: {
    sky: '#000006', horizon: '#0d0626', fog: '#04020e', fogNear: 60, fogFar: 170,
    hemi: ['#d0c4ff', '#2a2050', 1.05], sun: ['#ffffff', 0.8],
    ground: { base: '#14102a', specks: ['#2a2050', '#4a3a90'], density: 0.05, pattern: 'grid', line: '#6a4aff', glow: true },
    track: { base: '#1c1640', specks: ['#2a2060'], density: 0.05, pattern: 'line', line: '#00e5ff', glow: true },
    ceiling: { y: 5.4, color: '#1c1640', opacity: 1, line: '#ff3df0' },
    props: [
      { make: prop.asteroid, n: 20, z: [-50, -16], y: [-4, 14], s: [1, 3], spin: true },
      { make: prop.asteroid, n: 10, z: [8, 40], y: [-4, 12], s: [1, 3], spin: true, front: true },
      { make: prop.satellite, n: 3, z: [-30, -15], y: [8, 14], s: [1.5, 2] },
    ],
    sky3d: [
      { make: () => prop.planet('#ff7043', '#ffd54f'), n: 1, fixed: true },
      { make: () => prop.planet('#7e57c2', '#80deea'), n: 1, fixed: true, alt: true },
      { make: () => prop.star('#ffffff'), n: 90, stars: true },
    ],
    particles: { kind: 'warp', color: '#ffffff', rate: 50 },
  },
};
