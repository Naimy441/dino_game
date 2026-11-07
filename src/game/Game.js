// The whole game simulation, independent of rendering, so it can be unit
// tested, cloned for look-ahead (the demo bot) and run headless.
//
// World axes: the dino stands at x = 0 and the world scrolls toward -x.
// y is up (the floor is y = 0). z is across the track (lanes on the neon map).

import { MAPS, mapForScore, mapStartScore, COLOR_SCORE, MAP_LENGTH } from './maps.js';
import { CLASSIC, STAND_H, px, speedForScore, perSec, perSec2 } from './classic.js';

export const PHYS = {
  gravity: 64,
  jumpV: 15.2,
  holdGravity: 0.58, // gravity multiplier while jump is held on the way up
  fastFall: 3.4,
  spawnAhead: 110, // obstacles are created this far ahead (the 3D views see far)
  jumpBuffer: 0.13,
  coyote: 0.07,
};
export const LANES = [-1.7, 0, 1.7];
const FORGIVE = 1.25; // gaps in every world but the classic desert, vs the original
export const DIVE_DEPTH = -2.5; // how deep the dino dives in Splash Lagoon
const STAND = { x0: -0.42, x1: 0.55, h: STAND_H };
const DUCK = { x0: -0.7, x1: 0.8, h: 1.02 };
const SHRINK = 0.1; // obstacle hitboxes are a little forgiving on each side
export const GIANT_SCALE = 1.8;
// ability timings: active time, cooldown
export const ABILITY = {
  fire: [0.42, 0.75], pickaxe: [0.2, 0.32], gun: [0.08, 0.2], phase: [0.6, 1.25], dash: [0.3, 1.35],
};
const SOLID_SKIP = ['pickup', 'puddle', 'pit'];

function mulberry(a) {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

export class Game {
  constructor({ seed = (Math.random() * 1e9) | 0, startMap = 0, shuffle = false } = {}) {
    this.seed = seed;
    this.shuffle = shuffle;
    this.reset(startMap);
  }

  rand() {
    const [v, s] = mulberry(this.rng);
    this.rng = s;
    return v;
  }

  reset(startMap = 0) {
    this.rng = this.seed;
    this.seed = (this.seed * 1664525 + 1013904223) | 0;
    this.startMap = startMap;
    this.score = mapStartScore(startMap);
    // the original's speed, in px per frame (starting later = already faster)
    this.spf = speedForScore(this.score);
    this.history = [];
    this.buildOrder();
    const m = this.mapAt(this.score);
    this.mapIndex = m.index;
    this.lap = m.lap;
    this.colorful = this.score >= COLOR_SCORE;
    this.alive = true;
    this.time = 0;
    this.mapTime = 0;
    this.distance = 0;
    this.speed = this.targetSpeed();
    this.bonus = 0;
    this.dino = {
      y: 0, vy: 0, grounded: true, ducking: false, airJumps: this.map.gimmick === 'doubleJump' ? 1 : 0,
      grav: 1, lane: 1, z: 0, giant: 0, fireT: 0, fireCd: 0, swingT: 0, swingCd: 0,
      airTime: 0, sinceGround: 0, jumpBuf: 0, spin: 0, flips: 0, jumpBase: 0,
      actT: 0, actCd: 0, actBuf: 0, gliding: false, overPit: false, inPit: false,
    };
    this.bullets = [];
    this.obstacles = [];
    this.nextId = 1;
    // the original holds obstacles back for 3 s, then the first one appears
    // at the right edge of its 600 px screen
    this.nextX = this.speed * CLASSIC.clearTime + px(CLASSIC.screen - CLASSIC.startX);
    this.lastAbilityAt = -1e9;
    this.events = [];
    this.input = { jump: false, duck: false };
    this.hundreds = Math.floor(this.score / 100);
    this.deathCause = null;
  }

  get map() {
    return MAPS[this.mapIndex];
  }

  // Once every world is unlocked the order is shuffled: a shuffle bag of all
  // the colour worlds (never the same one twice in a row), fixed by the seed.
  buildOrder() {
    this.order = null;
    if (!this.shuffle) return;
    let s = this.seed ^ 0x5bd1e995;
    const r = () => {
      const [v, n] = mulberry(s);
      s = n;
      return v;
    };
    const n = MAPS.length - 1;
    const order = [this.startMap > 0 ? this.startMap : 1 + Math.floor(r() * n)];
    while (order.length < 400) {
      const bag = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag[0] === order[order.length - 1]) bag.push(bag.shift());
      order.push(...bag);
    }
    this.order = order;
    this.orderBase = this.startMap > 0 ? this.startMap - 1 : 0;
  }
  mapAt(score) {
    const m = mapForScore(score);
    if (!this.order || score < COLOR_SCORE) return m;
    const k = Math.floor((score - COLOR_SCORE) / MAP_LENGTH) - this.orderBase;
    return { index: this.order[Math.max(0, k) % this.order.length], lap: m.lap };
  }

  clone() {
    const g = Object.create(Game.prototype);
    Object.assign(g, this);
    g.dino = { ...this.dino };
    g.obstacles = this.obstacles.map((o) => ({ ...o }));
    g.bullets = this.bullets.map((b) => ({ ...b }));
    g.history = [...this.history];
    g.events = [];
    g.input = { ...this.input };
    return g;
  }

  // world units per second: the original speed, times the world's own pace
  targetSpeed() {
    return (this.spf * CLASSIC.fps) / CLASSIC.px * (this.map.speedMul || 1);
  }

  // ------------------------------------------------------------ input
  pressJump() {
    if (!this.alive) return;
    this.dino.jumpBuf = PHYS.jumpBuffer;
    this.tryJump();
  }
  setJump(held) {
    this.input.jump = held;
  }
  setDuck(held) {
    this.input.duck = held;
  }
  pressAction() {
    if (!this.alive) return;
    const d = this.dino;
    const g = this.map.gimmick;
    const A = ABILITY[g];
    // pressed a moment too early: fire as soon as the cooldown ends
    if ((g === 'gun' || g === 'phase' || g === 'dash') && d.actCd > 0) d.actBuf = g === 'gun' ? 0.2 : 0.12;
    if ((g === 'gun' || g === 'phase' || g === 'dash') && d.actCd <= 0) {
      d.actBuf = 0;
      d.actT = A[0];
      d.actCd = A[1];
      if (g === 'gun') {
        const s = d.giant > 0 ? GIANT_SCALE : 1;
        const up = d.grav > 0 ? 1 : -1;
        this.bullets.push({ x: 0.9, y: d.y + up * (d.ducking ? 0.62 : 1.12) * s, z: d.z, vx: 70 });
        this.events.push({ type: 'shoot' });
      } else this.events.push({ type: g });
    } else if (g === 'fire' && d.fireCd <= 0) {
      d.fireT = 0.42;
      d.fireCd = 0.75;
      this.events.push({ type: 'fire' });
    } else if (g === 'pickaxe' && d.swingCd <= 0) {
      d.swingT = 0.2;
      d.swingCd = 0.32;
      this.events.push({ type: 'swing' });
    }
  }
  pressLane(dir) {
    if (!this.alive || !this.map.lanes) return;
    const d = this.dino;
    const l = Math.max(0, Math.min(2, d.lane + dir));
    if (l !== d.lane) {
      d.lane = l;
      this.events.push({ type: 'lane', dir });
    }
  }

  tryJump() {
    const d = this.dino;
    const m = this.map;
    if (m.gimmick === 'swim') {
      d.vy = Math.max(d.vy, 6.5);
      d.jumpBuf = 0;
      d.grounded = false;
      this.events.push({ type: 'swim' });
      return;
    }
    const canGround = d.grounded || d.sinceGround < PHYS.coyote;
    if (m.gimmick === 'flip') {
      if (!canGround) return;
      d.grav = -d.grav;
      d.vy = -d.grav * 3;
      d.grounded = false;
      d.sinceGround = 1;
      d.jumpBuf = 0;
      this.events.push({ type: 'flip', grav: d.grav });
      return;
    }
    const v = this.jumpSpeed() * (d.giant > 0 ? 1.12 : 1);
    if (m.gimmick === 'pogo') return; // the stick does the jumping
    if (canGround && d.overPit && d.y < -0.3) return; // too late, already falling
    if (canGround) {
      d.vy = v * d.grav;
      d.jumpBase = d.y;
      d.grounded = false;
      d.sinceGround = 1;
      d.jumpBuf = 0;
      d.airTime = 0;
      this.events.push({ type: 'jump' });
    } else if (d.airJumps > 0 && d.jumpBuf === PHYS.jumpBuffer) {
      d.airJumps--;
      d.vy = v * 0.92 * d.grav;
      d.jumpBase = d.y; // the air jump gets its own full rise
      d.jumpBuf = 0;
      this.events.push({ type: 'doubleJump' });
    }
  }

  // ------------------------------------------------------------ hitboxes
  dinoBox() {
    const d = this.dino;
    const b = d.ducking ? DUCK : STAND;
    const s = d.giant > 0 ? GIANT_SCALE : 1;
    const h = b.h * s;
    const y0 = d.grav > 0 ? d.y : d.y - h;
    const m = this.margin || 0; // the bot plans with a safety margin
    return { x0: b.x0 * s - m, x1: b.x1 * s + m, y0: y0 - m, y1: y0 + h + m, z: d.z };
  }
  obstacleBox(o) {
    const sx = o.w * SHRINK, sy = o.h * SHRINK;
    return { x0: o.x - o.w / 2 + sx, x1: o.x + o.w / 2 - sx, y0: o.y + sy, y1: o.y + o.h - sy * 0.5 };
  }

  // ------------------------------------------------------------ spawning
  pick(list) {
    let total = 0;
    for (const s of list) total += s.weight;
    let r = this.rand() * total;
    for (const s of list) {
      r -= s.weight;
      if (r <= 0) return s;
    }
    return list[list.length - 1];
  }

  // Worlds that keep the original T-rex jump (the pogo stick and the
  // gravity flipper have their own).
  classicJump() {
    return this.map.gimmick !== 'pogo' && this.map.gimmick !== 'flip';
  }
  // The original: jump velocity = 10 + speed / 10 (px per frame).
  jumpSpeed() {
    const m = this.map;
    if (!this.classicJump()) return PHYS.jumpV * (m.jump || 1);
    const spf = (this.speed * CLASSIC.px) / CLASSIC.fps;
    return perSec(CLASSIC.jumpVelocity + spf / 10) * (m.jump || 1);
  }
  gravity() {
    return (this.classicJump() ? perSec2(CLASSIC.gravity) : PHYS.gravity) * (this.map.gravity || 1);
  }

  airtime() {
    const m = this.map;
    if (m.gimmick === 'swim') return 0.85;
    if (m.gimmick === 'flip') return 0.5;
    return (2 * this.jumpSpeed()) / this.gravity();
  }

  // The original's pick: any type at random, re-rolled if it's too early for
  // it or it would be the third of a kind in a row.
  pickClassic(m, spf) {
    const list = [...m.ground, ...m.air];
    for (let tries = 0; tries < 30; tries++) {
      const s = list[Math.floor(this.rand() * list.length)];
      const dup = this.history.length >= CLASSIC.maxDuplication && this.history.every((t) => t === s.type);
      if (spf < (s.minSpeed || 0) || dup) continue;
      return s;
    }
    return m.ground[0];
  }

  // Other worlds keep their own mix of things.
  pickWorld(m, spf) {
    const air = m.air.filter((s) => spf >= (s.minSpeed || 0));
    const useAir = air.length > 0 && this.rand() < m.airChance;
    return this.pick(useAir ? air : m.ground);
  }

  // Place the next obstacle with its left edge at x and return how far along
  // the one after it goes. Positions and gaps follow the original runner:
  //   a new obstacle appears one of its own widths past the screen edge,
  //   group size is 1-3 (only 1 below the type's multipleSpeed), and the gap
  //   after it is random(minGap, 1.5 minGap) with
  //   minGap = width * speed + typeMinGap * 0.6   (pixels, px per frame).
  spawn(x) {
    const m = this.map;
    const spf = (this.speed * CLASSIC.px) / CLASSIC.fps; // current speed, px/frame
    const spec = m.classic ? this.pickClassic(m, spf) : this.pickWorld(m, spf);
    const air = !!spec.y;
    this.history.unshift(spec.type);
    this.history.length = Math.min(this.history.length, CLASSIC.maxDuplication);
    let n = 1;
    if (spec.group) {
      n = 1 + Math.floor(this.rand() * CLASSIC.maxLength);
      if (spf < (spec.multipleSpeed ?? (spec.h < 1 ? 4 : 7))) n = 1;
      n = Math.min(n, spec.group);
    }
    let y = 0;
    if (air) y = spec.y[Math.floor(this.rand() * spec.y.length)];
    if (spec.y0 != null) y = spec.y0; // floats in the water / sticks out of it
    if (spec.ceil) y = m.ceiling - spec.h;
    const w = spec.wSpeed ? Math.max(2.5, this.speed * (spec.wSpeed[0] + this.rand() * (spec.wSpeed[1] - spec.wSpeed[0]))) : spec.w;
    // the original's offset: each obstacle starts one type-width off screen
    const lead = spec.pxW ? px(spec.pxW) : w;
    // pterodactyls drift a little faster or slower than the ground
    let vx = spec.vx || 0;
    if (spec.speedOffset) vx = ((this.rand() > 0.5 ? 1 : -1) * spec.speedOffset * CLASSIC.fps) / CLASSIC.px;
    // walking things start moving when they get close; leave them room
    const pre = spec.vx ? spec.vx * 1.7 : 0;
    let at = x + lead + pre;
    // things that need the ability: make sure it has recharged since the last
    // one, so a wall is never unbeatable
    const tags = spec.tags || [];
    const needsAbility = tags.includes('wall') || tags.includes('dashable') || tags.includes('field');
    let shift = 0;
    if (needsAbility && ABILITY[m.gimmick]) {
      const need = this.speed * (ABILITY[m.gimmick][1] + 0.35) + 3;
      const since = this.distance + at - this.lastAbilityAt;
      if (since < need) shift = need - since;
      at += shift;
    }
    const lanes = [];
    if (m.lanes) {
      const a = Math.floor(this.rand() * 3);
      lanes.push(a);
      // sometimes block a second lane (never all three)
      if (this.rand() < 0.45) lanes.push((a + 1 + Math.floor(this.rand() * 2)) % 3);
    } else lanes.push(1);
    for (const lane of lanes) {
      for (let i = 0; i < n; i++) {
        this.obstacles.push({
          id: this.nextId++, type: spec.type, map: m.id,
          x: at + i * w * 1.02 + w / 2, y, baseY: y, w, h: spec.popup ? spec.h * 0.15 : spec.h, fullH: spec.h,
          vx, drift: !!spec.speedOffset, tags, z: LANES[lane], lane,
          bob: spec.bob || 0, phase: this.rand() * 6.28, drop: !!spec.drop, falling: false, vy: 0,
          ceil: !!spec.ceil, used: false, hp: spec.hp || 1, popup: !!spec.popup, rise: 0, vis: 1,
          pit: tags.includes('pit'),
        });
      }
    }
    const width = n * w * 1.02;
    if (needsAbility) this.lastAbilityAt = this.distance + at + width;

    // the original gap, in pixels, from the original sprite width
    const widthPx = n * (spec.pxW ?? w * CLASSIC.px);
    const minGap = Math.round(widthPx * spf + (spec.minGap ?? (air ? 150 : 120)) * CLASSIC.gapCoefficient);
    const maxGap = Math.round(minGap * CLASSIC.maxGapCoefficient);
    let gap = px(minGap + Math.floor(this.rand() * (maxGap - minGap + 1)));

    // Worlds whose jump works differently (floaty, swimming, flipping,
    // bouncing) still need room to land and react, and some obstacles need
    // extra: these only ever widen the original gap.
    if (!m.classic) {
      // the power-up worlds throw more at you: give them a little more room
      gap *= FORGIVE;
      const t = this.airtime();
      if (['swim', 'flip', 'pogo', 'lowGravity'].includes(m.gimmick)) {
        const roam = this.rand() * this.speed * 0.95 * (1 - Math.min(0.45, this.mapTime / 120));
        gap = Math.max(gap, this.speed * t * 1.15 + 4.5 + roam);
      }
      if (m.gimmick === 'flip') gap = Math.max(gap, this.speed * 0.75 + 3);
      if (spec.type === 'logStack') gap += this.speed * 0.35;
      if (spec.vx) gap += pre + spec.vx * 1.4;
      if (tags.includes('wall')) gap += this.speed * 0.35 + 3;
      if (tags.includes('pit')) gap += 3;
      if (spec.popup) gap += this.speed * 0.15;
    }
    return lead + pre + shift + width + gap;
  }

  // ------------------------------------------------------------ map changes
  changeMap(index, lap) {
    const from = this.mapIndex;
    const first = !this.colorful;
    this.mapIndex = index;
    this.lap = lap;
    this.colorful = true;
    this.mapTime = 0;
    // The colour explosion blasts away everything ahead; later worlds only
    // drop what hasn't come into view yet.
    // the change of world blasts away everything still ahead of the dino
    const cut = 1.2;
    const removed = this.obstacles.filter((o) => o.x > cut);
    this.obstacles = this.obstacles.filter((o) => o.x <= cut);
    this.nextX = Math.max(this.nextX, first ? 46 : 36);
    const d = this.dino;
    if (this.map.gimmick !== 'flip' && d.grav < 0) {
      d.grav = 1;
      d.grounded = false;
    }
    if (!this.map.lanes) d.lane = 1;
    d.airJumps = this.map.gimmick === 'doubleJump' ? 1 : 0;
    d.actT = 0;
    d.actCd = 0;
    this.bullets = [];
    this.events.push({ type: 'map', from, to: index, first, lap, removed });
  }

  // ------------------------------------------------------------ update
  update(dt) {
    if (!this.alive) return;
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    this.mapTime += dt;
    const m = this.map;
    const d = this.dino;

    // the original: +0.001 px/frame every frame, up to 13
    this.spf = Math.min(CLASSIC.maxSpeed, this.spf + CLASSIC.accel * dt * CLASSIC.fps);
    // speed eases toward its target (so a world's own pace doesn't jolt)
    const target = this.targetSpeed();
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    const dashing = m.gimmick === 'dash' && d.actT > 0;
    const dx = this.speed * dt * (dashing ? 1.45 : 1);
    this.distance += dx;
    this.score += dx * CLASSIC.px * CLASSIC.coefficient; // pixels run x 0.025

    // timers
    d.jumpBuf = Math.max(0, d.jumpBuf - dt);
    d.fireT = Math.max(0, d.fireT - dt);
    d.fireCd = Math.max(0, d.fireCd - dt);
    d.swingT = Math.max(0, d.swingT - dt);
    d.swingCd = Math.max(0, d.swingCd - dt);
    d.spin = Math.max(0, d.spin - dt);
    d.actT = Math.max(0, d.actT - dt);
    d.actCd = Math.max(0, d.actCd - dt);
    if (d.actBuf > 0) {
      d.actBuf = Math.max(0, d.actBuf - dt);
      if (d.actCd <= 0) this.pressAction();
    }
    if (d.giant > 0) {
      d.giant -= dt;
      if (d.giant <= 0) this.events.push({ type: 'shrink' });
    }

    // ---- dino physics
    const ceiling = m.ceiling || Infinity;
    if (m.gimmick === 'swim') {
      d.grav = 1;
      let a = this.input.jump ? 34 : -19;
      if (this.input.duck) a -= 40;
      d.vy = Math.max(-10, Math.min(8.5, d.vy + a * dt));
      d.y += d.vy * dt;
      const top = ceiling - STAND.h;
      if (d.y > top) {
        d.y = top;
        d.vy = Math.min(0, d.vy);
      }
      if (d.y <= 0) {
        d.y = 0;
        d.vy = Math.max(0, d.vy);
        d.grounded = true;
      } else d.grounded = false;
    } else if (m.gimmick === 'paddle' && d.y <= 0.001 && d.vy <= 0.001) {
      // Splash Lagoon: swimming on the surface. Hold down to dive under
      // things, let go to bob back up; jump leaps out of the water.
      const target = this.input.duck ? DIVE_DEPTH : 0;
      const was = d.y;
      d.y += Math.sign(target - d.y) * Math.min(Math.abs(target - d.y), dt * (this.input.duck ? 13 : 8));
      if (was >= -0.01 && d.y < -0.01) this.events.push({ type: 'dive' });
      d.vy = 0;
      d.speedDrop = false;
      const surfaced = d.y > -0.05;
      if (surfaced && !d.grounded) {
        d.grounded = true;
        d.sinceGround = 0;
        if (d.jumpBuf > 0) this.tryJump();
      }
      d.grounded = surfaced && d.vy <= 0;
      if (!d.grounded) d.sinceGround = 1;
    } else {
      // a hole under the feet?
      const pm = this.margin || 0;
      d.overPit = false;
      for (const o of this.obstacles) {
        if (o.pit && o.x - o.w / 2 + 0.3 - pm < 0.05 && o.x + o.w / 2 - 0.3 + pm > 0.05) d.overPit = true;
      }
      if (d.grounded && d.overPit) {
        d.grounded = false;
        d.vy = 0;
      }
      let a = -this.gravity() * d.grav;
      const rising = d.vy * d.grav > 0;
      const classic = this.classicJump();
      const glide = m.gimmick === 'glide' && !d.grounded && !rising && this.input.jump && d.y > -0.2;
      if (glide && !d.gliding) this.events.push({ type: 'glide' });
      d.gliding = glide;
      if (glide) {
        a *= 0.12;
        d.vy = Math.max(d.vy, -2.4);
      }
      let fall = 1;
      if (classic) {
        // The original T-rex: let go of jump once past the minimum height (or
        // reach the maximum) and the rise is capped to a gentle 5 px/frame.
        if (!d.grounded && rising) {
          // heights scale with the world's jump (the moon's are huge)
          const k = (m.jump || 1) ** 2 / (m.gravity || 1);
          const cap = perSec(CLASSIC.dropVelocity) * (m.jump || 1);
          // (measured from where this jump started, so a double jump isn't cut short)
          const h = d.y - d.jumpBase;
          if ((h >= px(CLASSIC.minJumpHeight) * k && !this.input.jump) || h >= px(CLASSIC.maxJumpHeight) * k) d.vy = Math.min(d.vy, cap);
        }
        // down in the air: the speed drop, three times the fall
        if (!d.grounded && this.input.duck && !glide) {
          if (!d.speedDrop) d.vy = Math.min(d.vy, -perSec(1));
          d.speedDrop = true;
          fall = CLASSIC.speedDrop;
        } else d.speedDrop = false;
      } else {
        if (rising && this.input.jump && m.gimmick !== 'flip') a *= PHYS.holdGravity;
        if (!d.grounded && this.input.duck && m.gimmick !== 'flip') a *= PHYS.fastFall;
      }
      if (!d.grounded) {
        d.vy += a * dt * fall;
        d.y += d.vy * dt * fall;
        d.airTime += dt;
      }
      const floorY = d.grav > 0 ? 0 : ceiling;
      // dropped below the edge of a gap: you hit the far wall, no climbing out
      if (d.overPit && d.y < -0.05) d.inPit = true;
      if (d.inPit && !d.overPit && this.alive) {
        this.alive = false;
        this.deathCause = 'pit';
        this.events.push({ type: 'die', obstacle: 'pit', x: 0, y: d.y });
        return;
      }
      const landed = d.overPit ? false : d.grav > 0 ? d.y <= 0 : d.y >= ceiling;
      if (!d.grounded && landed && d.vy * d.grav <= 0) {
        d.y = floorY;
        d.vy = 0;
        d.grounded = true;
        d.sinceGround = 0;
        d.airJumps = m.gimmick === 'doubleJump' ? 1 : 0;
        this.events.push({ type: 'land', air: d.airTime });
        if (m.gimmick === 'snowboard' && d.airTime > 0.5) {
          const pts = Math.round(d.airTime * 30);
          this.bonusPoints(pts);
          d.flips++;
          this.events.push({ type: 'trick', points: pts });
        }
        d.airTime = 0;
        if (m.gimmick === 'pogo') this.bounce();
        else if (d.jumpBuf > 0) this.tryJump();
      } else if (d.grounded) {
        d.y = floorY;
        if (m.gimmick === 'pogo') this.bounce();
      }
      if (d.y < -1.1 && this.alive) {
        this.alive = false;
        this.deathCause = 'pit';
        this.events.push({ type: 'die', obstacle: 'pit', x: 0, y: d.y });
        return;
      }
      if (!d.grounded) d.sinceGround += dt;
    }
    d.ducking = m.gimmick !== 'pogo' && m.gimmick !== 'paddle' && this.input.duck && (m.gimmick === 'swim' ? d.y <= 0.01 : d.grounded);
    // lanes
    const laneZ = m.lanes ? LANES[d.lane] : 0;
    const dz = laneZ - d.z;
    d.z += Math.sign(dz) * Math.min(Math.abs(dz), dt * 16);

    // ---- obstacles move
    for (const o of this.obstacles) {
      o.x -= dx + (o.drift || o.x < 28 ? o.vx * dt : 0);
      if (o.bob) o.y = o.baseY + Math.sin(this.time * 3 + o.phase) * o.bob;
      if (o.popup && o.x < this.speed * 0.55 + 4) {
        if (o.rise === 0) this.events.push({ type: 'popup', id: o.id });
        o.rise = Math.min(1, o.rise + dt * 6);
        o.h = o.fullH * (0.15 + 0.85 * o.rise);
      }
      if (o.tags.includes('ghost')) o.vis = 0.5 + 0.5 * Math.sin(this.time * 3.4 + o.phase);
      if (o.drop && !o.falling && o.x < this.speed * 0.8 + 5) {
        o.falling = true;
        this.events.push({ type: 'drop', id: o.id });
      }
      if (o.falling) {
        o.vy -= 75 * dt;
        o.y = Math.max(0, o.y + o.vy * dt);
        if (o.y === 0) {
          o.falling = false;
          o.drop = false;
          this.events.push({ type: 'crash', id: o.id, x: o.x });
        }
      }
    }
    this.nextX -= dx;
    while (this.nextX < PHYS.spawnAhead) {
      this.nextX += this.spawn(this.nextX);
    }

    // ---- attacks
    if (d.fireT > 0) this.attack('burnable', 0.2, 7, 'burn', 15);
    if (d.swingT > 0) this.attack('mob', -0.2, 2.9, 'kill', 25);
    this.updateBullets(dt);

    // ---- collisions
    const db = this.dinoBox();
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (o.dead || o.pit) continue;
      if (Math.abs(o.z - d.z) > 0.95) continue;
      if (o.tags.includes('ghost') && o.vis < 0.4) continue;
      const ob = this.obstacleBox(o);
      if (dashing && o.tags.includes('dashable')) ob.x0 -= 0.8; // the blade reaches a little ahead
      if (ob.x1 < db.x0 || ob.x0 > db.x1 || ob.y1 < db.y0 || ob.y0 > db.y1) continue;
      if (o.tags.includes('pickup')) {
        o.dead = true;
        d.giant = 5;
        this.bonusPoints(20);
        this.events.push({ type: 'giant', x: o.x, y: o.y });
        continue;
      }
      if (o.tags.includes('puddle')) {
        if (!o.used && d.grounded) {
          o.used = true;
          d.spin = 0.6;
          this.bonusPoints(10);
          this.events.push({ type: 'spin', points: 10 });
        }
        continue;
      }
      if (dashing && o.tags.includes('dashable')) {
        o.dead = true;
        const wall = o.tags.includes('wall');
        this.bonusPoints(wall ? 30 : 15);
        this.events.push({ type: wall ? 'wall' : 'slash', how: 'slash', x: o.x, y: o.y, z: o.z, obstacle: o.type, points: wall ? 30 : 15 });
        continue;
      }
      if (m.gimmick === 'phase' && d.actT > 0 && o.tags.includes('field')) {
        if (!o.used) {
          o.used = true;
          this.bonusPoints(15);
          this.events.push({ type: 'phased', x: o.x, y: o.y, z: o.z, points: 15 });
        }
        continue;
      }
      if (d.giant > 0) {
        o.dead = true;
        this.bonusPoints(10);
        this.events.push({ type: 'smash', x: o.x, y: o.y, z: o.z, obstacle: o.type });
        continue;
      }
      this.alive = false;
      this.deathCause = o.type;
      this.events.push({ type: 'die', obstacle: o.type, x: o.x, y: o.y });
      break;
    }
    this.obstacles = this.obstacles.filter((o) => !o.dead && o.x > -12);

    // ---- score milestones and world changes
    const h = Math.floor(this.score / 100);
    if (h > this.hundreds) {
      this.hundreds = h;
      this.events.push({ type: 'hundred', score: h * 100 });
    }
    if (this.alive) {
      const mp = this.mapAt(this.score);
      if (mp.index !== this.mapIndex || mp.lap !== this.lap) this.changeMap(mp.index, mp.lap);
    }
  }

  attack(tag, from, to, evt, pts) {
    const d = this.dino;
    const top = (d.grav > 0 ? d.y : d.y - 2) + 2.6;
    for (const o of this.obstacles) {
      if (o.dead || !o.tags.includes(tag)) continue;
      if (Math.abs(o.z - d.z) > 0.95) continue;
      if (o.x + o.w / 2 < from || o.x - o.w / 2 > to) continue;
      if (o.y > top) continue;
      o.dead = true;
      const wall = o.tags.includes('wall');
      this.bonusPoints(wall ? pts * 2 : pts);
      this.events.push({ type: wall ? 'wall' : evt, how: evt, x: o.x, y: o.y, z: o.z, obstacle: o.type, points: wall ? pts * 2 : pts });
    }
  }

  // Gold bullets fly straight ahead; shootable things take damage, anything
  // else solid stops them.
  updateBullets(dt) {
    if (!this.bullets.length) return;
    const keep = [];
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      let hit = false;
      for (const o of this.obstacles) {
        if (o.dead || o.pit || SOLID_SKIP.some((t) => o.tags.includes(t))) continue;
        if (Math.abs(o.z - b.z) > 0.95) continue;
        if (b.x < o.x - o.w / 2 - 0.3 || b.x > o.x + o.w / 2 + 0.3 || b.y < o.y || b.y > o.y + o.h) continue;
        hit = true;
        if (o.tags.includes('shootable')) {
          o.hp--;
          if (o.hp <= 0) {
            o.dead = true;
            const wall = o.tags.includes('wall');
            const pts = wall ? 30 : 15;
            this.bonusPoints(pts);
            this.events.push({ type: wall ? 'wall' : 'shot', how: 'shot', x: o.x, y: o.y, z: o.z, obstacle: o.type, points: pts });
          } else this.events.push({ type: 'hit', x: b.x, y: b.y, z: b.z, id: o.id });
        } else this.events.push({ type: 'clink', x: b.x, y: b.y, z: b.z });
        break;
      }
      if (!hit && b.x < 70) keep.push(b);
    }
    this.bullets = keep;
  }

  // Pogo stick: every landing bounces straight back up. Hold jump for a big
  // bounce, down for a small one.
  bounce() {
    const d = this.dino;
    const k = this.input.jump ? 1 : this.input.duck ? 0.32 : 0.62;
    d.vy = PHYS.jumpV * k * d.grav;
    d.grounded = false;
    d.sinceGround = 1;
    d.airTime = 0;
    this.events.push({ type: 'boing', big: k === 1 });
  }

  // The nearest wall ahead (for the on-screen prompt).
  nextWall(range = 30) {
    let best = null;
    for (const o of this.obstacles) {
      if (o.dead || !o.tags.includes('wall') || o.x < 0) continue;
      if (this.map.lanes && o.lane !== this.dino.lane) continue;
      if (o.x < range && (!best || o.x < best.x)) best = o;
    }
    return best;
  }

  bonusPoints(p) {
    this.score += p;
    this.bonus += p;
  }

  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }
}
