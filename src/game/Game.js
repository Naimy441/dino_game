// The whole game simulation, independent of rendering, so it can be unit
// tested, cloned for look-ahead (the demo bot) and run headless.
//
// World axes: the dino stands at x = 0 and the world scrolls toward -x.
// y is up (the floor is y = 0). z is across the track (lanes on the neon map).

import { MAPS, mapForScore, mapStartScore, COLOR_SCORE } from './maps.js';

export const PHYS = {
  gravity: 64,
  jumpV: 15.2,
  holdGravity: 0.58, // gravity multiplier while jump is held on the way up
  fastFall: 3.4,
  baseSpeed: 17,
  maxSpeed: 44,
  accel: 0.0085, // speed gained per point
  scoreRate: 0.55, // points per world unit travelled
  spawnAhead: 110,
  startGap: 38,
  jumpBuffer: 0.13,
  coyote: 0.07,
};
export const LANES = [-1.7, 0, 1.7];
const STAND = { x0: -0.42, x1: 0.55, h: 1.82 };
const DUCK = { x0: -0.7, x1: 0.8, h: 1.02 };
const SHRINK = 0.1; // obstacle hitboxes are a little forgiving on each side
export const GIANT_SCALE = 1.8;

function mulberry(a) {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

export class Game {
  constructor({ seed = (Math.random() * 1e9) | 0, startMap = 0 } = {}) {
    this.seed = seed;
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
    const m = mapForScore(this.score);
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
      airTime: 0, sinceGround: 0, jumpBuf: 0, spin: 0, flips: 0,
    };
    this.obstacles = [];
    this.nextId = 1;
    this.nextX = PHYS.startGap;
    this.events = [];
    this.input = { jump: false, duck: false };
    this.hundreds = Math.floor(this.score / 100);
    this.deathCause = null;
  }

  get map() {
    return MAPS[this.mapIndex];
  }

  clone() {
    const g = Object.create(Game.prototype);
    Object.assign(g, this);
    g.dino = { ...this.dino };
    g.obstacles = this.obstacles.map((o) => ({ ...o }));
    g.events = [];
    g.input = { ...this.input };
    return g;
  }

  targetSpeed() {
    const base = Math.min(PHYS.maxSpeed, PHYS.baseSpeed + this.score * PHYS.accel);
    return base * (this.map.speedMul || 1);
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
    if (g === 'fire' && d.fireCd <= 0) {
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
    const v = PHYS.jumpV * (m.jump || 1) * (d.giant > 0 ? 1.12 : 1);
    if (canGround) {
      d.vy = v * d.grav;
      d.grounded = false;
      d.sinceGround = 1;
      d.jumpBuf = 0;
      d.airTime = 0;
      this.events.push({ type: 'jump' });
    } else if (d.airJumps > 0 && d.jumpBuf === PHYS.jumpBuffer) {
      d.airJumps--;
      d.vy = v * 0.92 * d.grav;
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

  airtime() {
    const m = this.map;
    if (m.gimmick === 'swim') return 0.85;
    if (m.gimmick === 'flip') return 0.5;
    const g = PHYS.gravity * (m.gravity || 1);
    const v = PHYS.jumpV * (m.jump || 1);
    return (2 * v) / g;
  }

  spawn(x) {
    const m = this.map;
    const air = m.air.filter((s) => !s.minScore || this.score >= s.minScore);
    const useAir = air.length > 0 && this.rand() < m.airChance;
    const spec = this.pick(useAir ? air : m.ground);
    const maxGroup = spec.group ? Math.min(spec.group, 1 + Math.floor(this.score / 120)) : 1;
    const n = 1 + Math.floor(this.rand() * maxGroup);
    let y = 0;
    if (useAir) y = spec.y[Math.floor(this.rand() * spec.y.length)];
    if (spec.ceil) y = m.ceiling - spec.h;
    // moving things start walking when they get close; leave them room
    const pre = spec.vx ? spec.vx * 1.7 : 0;
    x += pre;
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
          x: x + i * spec.w * 1.02 + spec.w / 2, y, baseY: y, w: spec.w, h: spec.h,
          vx: spec.vx || 0, tags: spec.tags || [], z: LANES[lane], lane,
          bob: spec.bob || 0, phase: this.rand() * 6.28, drop: !!spec.drop, falling: false, vy: 0,
          ceil: !!spec.ceil, used: false,
        });
      }
    }
    const width = n * spec.w * 1.02;
    // Gap after this obstacle: enough to land and react, more at speed.
    const t = this.airtime();
    let min = this.speed * t * 1.15 + 4.5 + width + pre;
    if (spec.type === 'logStack') min += this.speed * 0.35;
    if (spec.vx) min += spec.vx * 1.4;
    if (m.gimmick === 'flip') min = this.speed * 0.75 + 3 + width;
    if (spec.tags && spec.tags.includes('pickup')) min *= 0.6;
    const extra = this.rand() * this.speed * 0.95 * (1 - Math.min(0.45, this.mapTime / 120));
    return min + extra;
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
    const cut = first ? 1.2 : 24;
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

    // speed eases toward its target (so world changes don't jolt)
    const target = this.targetSpeed();
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    const dx = this.speed * dt;
    this.distance += dx;
    this.score += dx * PHYS.scoreRate;

    // timers
    d.jumpBuf = Math.max(0, d.jumpBuf - dt);
    d.fireT = Math.max(0, d.fireT - dt);
    d.fireCd = Math.max(0, d.fireCd - dt);
    d.swingT = Math.max(0, d.swingT - dt);
    d.swingCd = Math.max(0, d.swingCd - dt);
    d.spin = Math.max(0, d.spin - dt);
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
    } else {
      let a = -PHYS.gravity * (m.gravity || 1) * d.grav;
      const rising = d.vy * d.grav > 0;
      if (rising && this.input.jump && m.gimmick !== 'flip') a *= PHYS.holdGravity;
      if (!d.grounded && this.input.duck && m.gimmick !== 'flip') a *= PHYS.fastFall;
      if (!d.grounded) {
        d.vy += a * dt;
        d.y += d.vy * dt;
        d.airTime += dt;
      }
      const floorY = d.grav > 0 ? 0 : ceiling;
      const landed = d.grav > 0 ? d.y <= 0 : d.y >= ceiling;
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
        if (d.jumpBuf > 0) this.tryJump();
      } else if (d.grounded) {
        // standing; walked off nothing (there are no pits) — stays grounded
        d.y = floorY;
      }
      if (!d.grounded) d.sinceGround += dt;
    }
    d.ducking = this.input.duck && (m.gimmick === 'swim' ? d.y <= 0.01 : d.grounded);
    // lanes
    const laneZ = m.lanes ? LANES[d.lane] : 0;
    const dz = laneZ - d.z;
    d.z += Math.sign(dz) * Math.min(Math.abs(dz), dt * 16);

    // ---- obstacles move
    for (const o of this.obstacles) {
      o.x -= dx + (o.x < 28 ? o.vx * dt : 0);
      if (o.bob) o.y = o.baseY + Math.sin(this.time * 3 + o.phase) * o.bob;
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

    // ---- collisions
    const db = this.dinoBox();
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (o.dead) continue;
      if (Math.abs(o.z - d.z) > 0.95) continue;
      const ob = this.obstacleBox(o);
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
      const mp = mapForScore(this.score);
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
      this.bonusPoints(pts);
      this.events.push({ type: evt, x: o.x, y: o.y, z: o.z, obstacle: o.type, points: pts });
    }
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
