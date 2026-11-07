import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PHYS } from '../src/game/Game.js';
import { CLASSIC, px, speedForScore } from '../src/game/classic.js';
import { Bot, solve } from '../src/game/Bot.js';
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
  const o = { id: 999 + g.obstacles.length, type, map: g.map.id, x, y: 0, baseY: 0, w: spec.w, h: spec.h, vx: 0, tags: spec.tags || [], z: 0, lane: 1, bob: 0, phase: 0, drop: false, falling: false, vy: 0, ceil: false, used: false, hp: spec.hp || 1, fullH: spec.h, rise: 0, vis: 1, pit: false, ...extra };
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
  assert.ok(MAPS.length >= 18);
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

test('a new world blasts away every obstacle still ahead', () => {
  const g = new Game({ seed: 30, startMap: idx('forest') });
  quiet(g);
  place(g, 'stump', 6);
  place(g, 'stump', 18);
  g.score = mapStartScore(idx('volcano')) - 0.01;
  g.update(STEP);
  assert.equal(g.map.id, 'volcano');
  assert.equal(g.obstacles.filter((o) => o.x > 1.2).length, 0);
});

test('forest: a double jump clears a log stack', () => {
  const g = new Game({ seed: 31, startMap: idx('forest') });
  quiet(g);
  g.pressJump();
  g.setJump(true);
  let top = 0;
  run(g, 1.6, (gg, t) => {
    if (Math.abs(t - 0.3) < STEP / 2) gg.pressJump();
    top = Math.max(top, gg.dino.y);
  });
  assert.ok(top > 3.1 + 1.5, `double jump peak ${top}`);
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

test('walls are too tall to jump: only the ability gets you through', () => {
  for (const [map, type] of [['volcano', 'thornWall'], ['blocky', 'stoneWall']]) {
    // jumping does not clear it
    let g = new Game({ seed: 20, startMap: idx(map) });
    quiet(g);
    place(g, type, 7);
    g.pressJump();
    g.setJump(true);
    run(g, 1.2);
    assert.equal(g.alive, false, `${type}: jumped into it`);
    // the ability does
    g = new Game({ seed: 20, startMap: idx(map) });
    quiet(g);
    place(g, type, type === 'stoneWall' ? 2.6 : 5);
    g.pressAction();
    run(g, 0.3);
    assert.ok(g.alive, `${type}: broke through`);
    assert.ok(g.drainEvents().some((e) => e.type === 'wall'));
  }
});

test('shadow city: gold bullets drop goons, bruisers take three', () => {
  const g = new Game({ seed: 21, startMap: idx('city') });
  quiet(g);
  const b = place(g, 'bruiser', 26);
  g.pressAction();
  run(g, 0.25);
  assert.equal(b.hp, 2);
  g.pressAction(); // buffered until the cooldown ends
  run(g, 0.3);
  assert.equal(b.hp, 1);
  g.pressAction();
  run(g, 0.3);
  assert.ok(!g.obstacles.includes(b), 'bruiser down');
  assert.ok(g.alive);
});

test('planet zorb: phase through force fields, not without', () => {
  for (const phase of [true, false]) {
    const g = new Game({ seed: 22, startMap: idx('alien') });
    quiet(g);
    place(g, 'field', 6);
    if (phase) g.pressAction();
    run(g, 0.6);
    assert.equal(g.alive, phase);
  }
});

test('haunted hollow: ghosts are only solid while visible', () => {
  for (const solid of [true, false]) {
    const g = new Game({ seed: 23, startMap: idx('haunted') });
    quiet(g);
    // phase chosen so the ghost is fully visible / invisible as it arrives
    const ph = solid ? Math.PI / 2 : -Math.PI / 2;
    place(g, 'ghost', 2, { tags: ['ghost'], phase: ph - g.time * 3.4 - 0.05 * 3.4 });
    run(g, 0.1);
    assert.equal(g.alive, !solid);
  }
});

test('sky kingdom: fall in a gap and it is over; gliding crosses a chasm', () => {
  let g = new Game({ seed: 24, startMap: idx('sky') });
  quiet(g);
  place(g, 'gap', 4, { w: 6, tags: ['pit'], pit: true });
  run(g, 1);
  assert.equal(g.alive, false);
  assert.equal(g.deathCause, 'pit');
  g = new Game({ seed: 24, startMap: idx('sky') });
  quiet(g);
  const w = g.speed * 1.0;
  place(g, 'chasm', 1 + w / 2, { w, tags: ['pit'], pit: true });
  g.pressJump();
  g.setJump(true);
  run(g, 2);
  assert.ok(g.alive, 'glided over');
});

test('bamboo dojo: dash cuts through paper walls', () => {
  for (const dash of [true, false]) {
    const g = new Game({ seed: 25, startMap: idx('dojo') });
    quiet(g);
    place(g, 'shoji', 4);
    if (dash) g.pressAction();
    run(g, 0.5);
    assert.equal(g.alive, dash);
  }
});

test('toy box: the pogo stick never stops bouncing; hold jump for big bounces', () => {
  const peak = (hold) => {
    const g = new Game({ seed: 26, startMap: idx('toybox') });
    quiet(g);
    g.setJump(hold);
    let top = 0, bounces = 0;
    run(g, 2, () => (top = Math.max(top, g.dino.y)));
    for (const e of g.drainEvents()) if (e.type === 'boing') bounces++;
    return { top, bounces };
  };
  const small = peak(false), big = peak(true);
  assert.ok(small.bounces >= 4, `kept bouncing (${small.bounces})`);
  assert.ok(big.top > small.top + 1, `big ${big.top} > small ${small.top}`);
});

test('every world unlocked: worlds come in a shuffled order, all before repeats', () => {
  const g = new Game({ seed: 27, startMap: idx('neon'), shuffle: true });
  assert.equal(g.map.id, 'neon');
  const n = MAPS.length - 1;
  const seen = [];
  for (let k = 0; k < n * 2; k++) seen.push(g.mapAt(mapStartScore(idx('neon')) + k * MAP_LENGTH + 1).index);
  for (let k = 1; k < seen.length; k++) assert.notEqual(seen[k], seen[k - 1], 'no world twice in a row');
  assert.ok(!seen.includes(0), 'never back to the grey desert');
  assert.equal(new Set(seen.slice(1, 1 + n)).size, n, 'a full bag of worlds');
  const plain = new Game({ seed: 27, startMap: idx('neon') });
  assert.equal(plain.mapAt(mapStartScore(idx('neon')) + MAP_LENGTH + 1).index, idx('neon') + 1);
});

test('speed and score follow the original runner', () => {
  const g = new Game({ seed: 12 });
  quiet(g);
  const toSpf = (u) => (u * CLASSIC.px) / CLASSIC.fps;
  assert.ok(Math.abs(toSpf(g.speed) - 6) < 1e-9, 'starts at 6 px/frame');
  // +0.001 px/frame every frame: 60 frames later, 6.06
  for (let i = 0; i < 120; i++) g.update(1 / 120);
  assert.ok(Math.abs(g.spf - 6.06) < 1e-6, `after 1 s: ${g.spf}`);
  // score is pixels run x 0.025: about 6 px x 60 frames x 0.025 = 9 a second
  assert.ok(Math.abs(g.score - 9.0) < 0.05, `score after 1 s: ${g.score}`);
  // capped at 13, reached after (13 - 6) / 0.001 frames
  for (let i = 0; i < 120 * 120; i++) g.update(1 / 120);
  assert.equal(g.spf, CLASSIC.maxSpeed);
  // starting in a later world starts at the speed you'd have reached
  const later = new Game({ seed: 12, startMap: 3 });
  assert.ok(Math.abs(later.spf - speedForScore(mapStartScore(3))) < 1e-9);
  assert.ok(later.spf > 6);
});

test('spawns follow the original runner: 3 s clear, gaps, groups, types', () => {
  const g = new Game({ seed: 13 });
  // nothing reaches the dino before 3 s plus the trip across the screen
  const first = Math.min(...g.obstacles.map((o) => o.x - o.w / 2));
  const want = g.speed * CLASSIC.clearTime + px(CLASSIC.screen - CLASSIC.startX);
  assert.ok(first >= want, `first obstacle at ${first}, want >= ${want}`);
  // check every gap against random(minGap, 1.5 minGap) from the formula
  const runs = [];
  let streak = 0, last = null;
  for (let k = 0; k < 400; k++) {
    const spf = (g.speed * CLASSIC.px) / CLASSIC.fps;
    const before = g.obstacles.length;
    const x = 0;
    const adv = g.spawn(x);
    const made = g.obstacles.slice(before);
    const spec = [...g.map.ground, ...g.map.air].find((s) => s.type === made[0].type);
    const n = made.length;
    assert.ok(n >= 1 && n <= 3);
    if (n > 1) assert.ok(spf >= spec.multipleSpeed, 'groups only once fast enough');
    if (spec.minSpeed) assert.ok(spf >= spec.minSpeed, 'pterodactyls only from 8.5');
    const minGap = Math.round(n * spec.pxW * spf + spec.minGap * 0.6);
    const gapPx = (adv - px(spec.pxW) - n * spec.w * 1.02) * CLASSIC.px;
    assert.ok(gapPx >= minGap - 1e-6 && gapPx <= Math.round(minGap * 1.5) + 1e-6, `gap ${gapPx} in [${minGap}, ${minGap * 1.5}]`);
    streak = made[0].type === last ? streak + 1 : 1;
    last = made[0].type;
    assert.ok(streak <= 2, 'never three of a kind in a row');
    runs.push(made[0].type);
    g.obstacles.length = before;
    g.spf = 6 + (k / 400) * 7; // sweep the speed range
    g.speed = g.targetSpeed();
  }
  assert.ok(runs.includes('bat') && runs.includes('cactusSmall') && runs.includes('cactusTall'));
});

// Plays a run with the look-ahead bot. If the bot slips, a breadth-first
// search over every input from about a second earlier decides whether there
// was any way through; if there was, the run carries on along that path.
// Returns the cause of death of a layout nothing could get through, or null.
export function playFair(g, done, maxT = 90) {
  let bot = new Bot(g, STEP);
  let snaps = [];
  let frame = 0;
  const tick = () => {
    if (frame % 30 === 0) {
      snaps.push({ g: g.clone(), frame });
      if (snaps.length > 24) snaps.shift();
    }
    frame++;
  };
  while (!done(g) && frame * STEP < maxT) {
    tick();
    bot.update(STEP);
    g.update(STEP);
    g.drainEvents();
    if (g.alive) continue;
    // search from about a second before, then further back if the dino was
    // already doomed by then
    let s0 = null, path = null;
    for (const x of [...snaps].reverse()) {
      if (frame - x.frame < 120) continue;
      if (frame - x.frame > 360) break;
      path = solve(x.g, 2.5, STEP);
      if (path) {
        s0 = x;
        break;
      }
    }
    if (!path) return `${g.deathCause} at ${Math.round(g.score)}`;
    g = s0.g.clone();
    frame = s0.frame;
    snaps = snaps.filter((x) => x.frame < frame);
    for (const inp of path) {
      if (inp.jump && !g.input.jump) g.pressJump();
      g.setJump(!!inp.jump);
      g.setDuck(!!inp.duck);
      if (inp.act) g.pressAction();
      if (inp.lane) g.pressLane(inp.lane);
      for (let k = 0; k < 2; k++) {
        tick();
        g.update(STEP);
        g.drainEvents();
      }
    }
    g.setJump(false);
    g.setDuck(false);
    bot = new Bot(g, STEP);
  }
  return null;
}

test('fair spawns: every world can always be survived', () => {
  for (let i = 0; i < MAPS.length; i++) {
    for (const seed of [11]) {
      const g = new Game({ seed: seed * 101 + i, startMap: i });
      const end = mapStartScore(i) + (i === 0 ? COLOR_SCORE : MAP_LENGTH);
      const dead = playFair(g, (x) => x.score >= end || x.mapIndex !== i);
      assert.equal(dead, null, `${MAPS[i].id} seed ${seed}: no way past ${dead}`);
    }
  }
});

test('fair spawns: the classic desert stays fair at top speed', () => {
  for (const seed of [3]) {
    const g = new Game({ seed });
    g.mapAt = () => ({ index: 0, lap: 0 }); // never leave the desert
    g.spf = 12; // start near top speed
    g.speed = g.targetSpeed();
    const dead = playFair(g, (x) => x.time > 30, 35);
    assert.equal(dead, null, `desert seed ${seed}: no way past ${dead}`);
  }
});
