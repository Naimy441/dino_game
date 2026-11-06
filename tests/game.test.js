import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PHYS } from '../src/game/Game.js';
import { Bot } from '../src/game/Bot.js';
import { MAPS, COLOR_SCORE, MAP_LENGTH, mapForScore, mapStartScore } from '../src/game/maps.js';

const STEP = 1 / 120;
const run = (g, secs, each) => {
  for (let t = 0; t < secs && g.alive; t += STEP) {
    if (each) each(g, t);
    g.update(STEP);
  }
};
const idx = (id) => MAPS.findIndex((m) => m.id === id);
const place = (g, type, x, extra = {}) => {
  const spec = [...g.map.ground, ...g.map.air].find((s) => s.type === type);
  const o = { id: 999 + g.obstacles.length, type, map: g.map.id, x, y: 0, baseY: 0, w: spec.w, h: spec.h, vx: 0, tags: spec.tags || [], z: 0, lane: 1, bob: 0, phase: 0, drop: false, falling: false, vy: 0, ceil: false, used: false, ...extra };
  g.obstacles.push(o);
  return o;
};
const quiet = (g) => {
  g.obstacles = [];
  g.nextX = 1e9;
};

test('worlds: classic desert until 200, then a new world every 350 points, looping', () => {
  assert.equal(mapForScore(0).index, 0);
  assert.equal(mapForScore(COLOR_SCORE - 1).index, 0);
  assert.equal(mapForScore(COLOR_SCORE).index, 1);
  assert.equal(mapForScore(COLOR_SCORE + MAP_LENGTH).index, 2);
  const last = mapStartScore(MAPS.length - 1);
  assert.equal(mapForScore(last).index, MAPS.length - 1);
  const loop = mapForScore(last + MAP_LENGTH);
  assert.deepEqual(loop, { index: 1, lap: 1 });
  assert.ok(MAPS.length >= 12);
  // every world after the first has a gimmick
  for (const m of MAPS.slice(1)) assert.ok(m.gimmick, `${m.id} has a gimmick`);
  assert.equal(MAPS[0].gimmick, null);
});

test('the run starts grey and explodes into colour at 200', () => {
  const g = new Game({ seed: 1 });
  assert.equal(g.colorful, false);
  quiet(g);
  g.score = COLOR_SCORE - 0.01;
  g.update(STEP);
  const ev = g.drainEvents().find((e) => e.type === 'map');
  assert.ok(ev && ev.first, 'first map change is the colour explosion');
  assert.equal(g.colorful, true);
  assert.equal(g.map.id, 'forest');
});

test('jump: a tap clears a small cactus, holding goes higher', () => {
  const peak = (hold) => {
    const g = new Game({ seed: 2 });
    quiet(g);
    g.pressJump();
    g.setJump(hold);
    let top = 0;
    run(g, 1.2, () => (top = Math.max(top, g.dino.y)));
    return top;
  };
  const tap = peak(false), held = peak(true);
  assert.ok(tap > 1.3 && tap < 2.2, `tap peak ${tap}`);
  assert.ok(held > tap + 0.6, `held ${held} > tap ${tap}`);
});

test('ducking passes under a head-height bat, standing does not', () => {
  for (const duck of [true, false]) {
    const g = new Game({ seed: 3 });
    quiet(g);
    g.score = 100;
    place(g, 'bat', 6, { y: 1.35, baseY: 1.35 });
    g.setDuck(duck);
    run(g, 1);
    assert.equal(g.alive, duck, duck ? 'ducked under' : 'hit while standing');
  }
});

test('fast fall: holding down in the air lands sooner', () => {
  const air = (down) => {
    const g = new Game({ seed: 4 });
    quiet(g);
    g.pressJump();
    let t = 0;
    run(g, 2, (gg, tt) => {
      if (tt > 0.15) gg.setDuck(down);
      if (!gg.dino.grounded) t = tt;
    });
    return t;
  };
  assert.ok(air(true) < air(false) - 0.08);
});

test('volcano: fire breath burns what is ahead', () => {
  const g = new Game({ seed: 5, startMap: idx('volcano') });
  quiet(g);
  place(g, 'lavaRock', 4);
  g.pressAction();
  run(g, 0.2);
  assert.equal(g.obstacles.length, 0);
  assert.ok(g.alive);
});

test('block world: the diamond pickaxe kills a zombie', () => {
  const g = new Game({ seed: 6, startMap: idx('blocky') });
  quiet(g);
  place(g, 'zombie', 2.2, { vx: 0 });
  g.pressAction();
  run(g, 0.1);
  assert.equal(g.obstacles.length, 0);
  assert.ok(g.alive);
});

test('moon: low gravity makes huge jumps', () => {
  const g = new Game({ seed: 7, startMap: idx('moon') });
  quiet(g);
  g.pressJump();
  g.setJump(true);
  let top = 0;
  run(g, 3, () => (top = Math.max(top, g.dino.y)));
  assert.ok(top > 5, `moon peak ${top}`);
});

test('reef: holding jump swims up, letting go sinks', () => {
  const g = new Game({ seed: 8, startMap: idx('reef') });
  quiet(g);
  g.setJump(true);
  run(g, 0.8);
  const up = g.dino.y;
  assert.ok(up > 2, `swam to ${up}`);
  g.setJump(false);
  run(g, 1.5);
  assert.ok(g.dino.y < up - 1);
});

test('interstellar: jump flips gravity to the ceiling and back', () => {
  const g = new Game({ seed: 9, startMap: idx('space') });
  quiet(g);
  g.pressJump();
  run(g, 0.8);
  assert.equal(g.dino.grav, -1);
  assert.ok(Math.abs(g.dino.y - g.map.ceiling) < 1e-6 && g.dino.grounded);
  g.pressJump();
  run(g, 0.8);
  assert.equal(g.dino.grav, 1);
  assert.equal(g.dino.y, 0);
});

test('sugar rush: candy makes the dino giant and it smashes through', () => {
  const g = new Game({ seed: 10, startMap: idx('candy') });
  quiet(g);
  place(g, 'candy', 1, { y: 0.9, baseY: 0.9 });
  run(g, 0.1);
  assert.ok(g.dino.giant > 0);
  place(g, 'cupcake', 3);
  run(g, 0.3);
  assert.ok(g.alive);
  assert.equal(g.obstacles.length, 0);
});

test('neon highway: lanes dodge cars', () => {
  const g = new Game({ seed: 11, startMap: idx('neon') });
  quiet(g);
  place(g, 'neonCar', 8);
  g.pressLane(1);
  run(g, 0.8);
  assert.ok(g.alive);
  assert.equal(g.dino.lane, 2);
});

test('speed ramps up toward the cap', () => {
  const g = new Game({ seed: 12 });
  const s0 = g.speed;
  g.score = 5000;
  assert.ok(g.targetSpeed() > s0 + 15);
  assert.ok(g.targetSpeed() <= PHYS.maxSpeed);
});

test('fair spawns: the look-ahead bot clears every world', () => {
  for (let i = 0; i < MAPS.length; i++) {
    for (const seed of [11, 29]) {
      const g = new Game({ seed: seed * 101 + i, startMap: i });
      const b = new Bot(g, STEP);
      const end = mapStartScore(i) + (i === 0 ? COLOR_SCORE : MAP_LENGTH);
      let t = 0;
      while (g.alive && g.score < end && t < 90) {
        b.update(STEP);
        g.update(STEP);
        g.drainEvents();
        t += STEP;
      }
      assert.ok(g.alive, `${MAPS[i].id} seed ${seed}: died to ${g.deathCause} at ${Math.round(g.score)}`);
    }
  }
});
