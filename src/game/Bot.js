// A look-ahead autopilot. Every few frames it clones the game, tries a small
// set of input plans for the next ~1.3 seconds and keeps the first one that
// survives (doing nothing is tried first, so it never jumps for no reason).
// It drives the title-screen demo and the fairness tests: if the bot can't
// find any plan that survives, the spawner made something impossible.

let STEP = 1 / 60;
const DELAYS = [0.5, 0.3, 0.15, 0.06, 0];

function plans(game) {
  const g = game.map.gimmick;
  const P = [{ name: 'idle' }];
  if (g === 'swim') {
    for (const t of [0.12, 0.25, 0.4, 0.6, 0.9]) P.push({ name: `swim${t}`, jump: t });
    P.push({ name: 'dive', duck: 0.5 });
    P.push({ name: 'dive-short', duck: 0.2 });
    P.push({ name: 'dive-swim', duck: 0.25, press: [0.25], jump: 0.5 });
    P.push({ name: 'swim-dive', jump: 0.3, duckAfter: 0.4 });
    P.push({ name: 'swim-hold', jump: 2 });
    return P;
  }
  if (g === 'flip') {
    P.push({ name: 'flip', press: [0] });
    P.push({ name: 'flip-late', press: [0.18] });
    P.push({ name: 'flip-twice', press: [0, 0.45] });
    P.push({ name: 'duck', duck: 2 });
    return P;
  }
  const act = g === 'fire' || g === 'pickaxe' || g === 'gun' || g === 'phase' || g === 'dash';
  if (act) P.push({ name: 'attack', action: [0] });
  if (g === 'gun') {
    P.push({ name: 'burst', action: [0, 0.21, 0.42, 0.63] });
    P.push({ name: 'duck-burst', duck: 0.8, action: [0, 0.21, 0.42, 0.63] });
    P.push({ name: 'spray', action: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] });
  }
  if (game.map.lanes) {
    P.push({ name: 'left', lane: -1 });
    P.push({ name: 'right', lane: 1 });
    P.push({ name: 'left2', lane: -1, lane2: true });
    P.push({ name: 'right2', lane: 1, lane2: true });
  }
  P.push({ name: 'duck', duck: 2 });
  for (const t of [0.05, 0.16, 0.3, 2]) P.push({ name: `jump${t}`, press: [0], jump: t });
  if (g === 'doubleJump') P.push({ name: 'double', press: [0, 0.3], jump: 0.6 });
  if (g === 'doubleJump') P.push({ name: 'double-late', press: [0, 0.42], jump: 0.8 });
  P.push({ name: 'jump-slam', press: [0], jump: 0.2, duckAfter: 0.35 });
  if (act) P.push({ name: 'jump-attack', press: [0], jump: 2, action: [0.05] });
  if (act) P.push({ name: 'jump-attack-late', press: [0], jump: 0.3, action: [0.25] });
  if (g === 'pogo') {
    P.push({ name: 'small-big', duck: 0.25, press: [0.25], jump: 0.8 });
    P.push({ name: 'big-slam', jump: 0.5, duckAfter: 0.6 });
  }
  if (game.map.lanes) {
    P.push({ name: 'left-jump', lane: -1, press: [0], jump: 2 });
    P.push({ name: 'right-jump', lane: 1, press: [0], jump: 2 });
  }
  P.push({ name: 'wait-jump', press: [0.15], jump: 2 });
  // two jumps back to back (the original's gaps often need a hop, a landing
  // and another jump)
  for (const d of [0.32, 0.4, 0.48, 0.58, 0.7]) {
    P.push({ name: `hop-hop${d}`, press: [0, d], holds: [[0, 0.04], [d, d + 0.04]] });
    P.push({ name: `hop-jump${d}`, press: [0, d], holds: [[0, 0.04], [d, d + 0.6]] });
    P.push({ name: `jump-hop${d + 0.12}`, press: [0, d + 0.12], holds: [[0, 0.6], [d + 0.12, d + 0.16]] });
  }
  for (const d of [0.12, 0.22, 0.35]) {
    P.push({ name: `duck-jump${d}`, duck: d, press: [d], jump: 2 });
    P.push({ name: `duck-hop${d}`, duck: d, press: [d], jump: 0.1 });
  }
  return P;
}

function apply(game, plan, t0) {
  const t = Math.round((t0 - (plan.delay || 0)) / STEP) * STEP;
  if (t < 0) {
    game.setJump(false);
    game.setDuck(false);
    return;
  }
  const inWin = (list) => list && list.some((s) => t >= s && t < s + STEP * 0.99);
  if (plan.lane && t === 0) game.pressLane(plan.lane);
  if (plan.lane2 && Math.abs(t - 0.2) < STEP / 2) game.pressLane(plan.lane);
  if (inWin(plan.press)) game.pressJump();
  if (inWin(plan.action)) game.pressAction();
  const start = plan.press ? plan.press[0] : 0;
  if (plan.holds) game.setJump(plan.holds.some(([a, b]) => t >= a && t < b));
  else game.setJump(plan.jump ? t >= start && t < start + plan.jump : false);
  const duck = (plan.duck && t < plan.duck) || (plan.duckAfter && t > plan.duckAfter);
  game.setDuck(!!duck);
}

function survives(game, plan, horizon, margin) {
  const g = game.clone();
  g.margin = margin;
  for (let t = 0; t < horizon; t += STEP) {
    apply(g, plan, t);
    g.update(STEP);
    if (!g.alive) return null;
  }
  return g;
}

// After a plan, is there still a way on? (Stops the bot jumping into a spot
// it can't get out of: the original's tight gaps punish greedy jumps.)
const FOLLOW = [{ name: 'idle' }, { name: 'duck', duck: 2 }];
for (let d = 0; d <= 0.6; d += 0.1) {
  FOLLOW.push({ name: 'hop', press: [d], holds: [[d, d + 0.04]] });
  FOLLOW.push({ name: 'jump', press: [d], holds: [[d, d + 0.6]] });
}
function safe(game, plan, horizon, margin) {
  const end = survives(game, plan, horizon, margin);
  if (!end) return false;
  if (!end.classicJump() || end.map.lanes) return true;
  return FOLLOW.some((f) => survives(end, f, 0.9, margin));
}

export class Bot {
  constructor(game, step = 1 / 60) {
    STEP = step;
    this.game = game;
    this.plan = { name: 'idle' };
    this.t = 0;
    this.think = 0;
    this.stuck = 0;
  }
  update(dt) {
    const game = this.game;
    if (!game.alive) return;
    this.think -= dt;
    if (this.think <= 0) {
      this.think = 0.05;
      const horizon = Math.max(0.9, Math.min(3.2, game.airtime() * 1.8 + 0.1));
      // keep the current plan while it still works, otherwise replan
      // Try idle, then every plan started as late as possible: if a late
      // start survives, there is no need to act yet.
      let chosen = null;
      const base = plans(game);
      // first a plan that also leaves a way on; failing that, any that survives
      for (const test of [safe, (g, p, h, mg) => !!survives(g, p, h, mg)]) {
        for (const margin of [0.14, 0]) {
          if (test(game, base[0], horizon, margin)) chosen = base[0];
          for (const delay of DELAYS) {
            if (chosen) break;
            for (const p of base.slice(1)) {
              const q = delay ? { ...p, delay } : p;
              if (test(game, q, horizon + delay, margin)) {
                chosen = delay ? base[0] : p;
                break;
              }
            }
          }
          if (chosen) break;
        }
        if (chosen) break;
      }
      if (!chosen) {
        this.stuck++;
        chosen = { name: 'idle' };
      }
      this.plan = chosen;
      this.t = 0;
    }
    apply(game, this.plan, this.t);
    this.t += dt;
  }
}

// Exhaustive check used by the fairness tests: a breadth-first search over
// every input (jump held or not, duck, the world's ability, lane changes)
// every two frames, merging identical dino states so it stays small. Returns
// the inputs for a way through the next `seconds`, or null if there is none.
const ACTION_WORLDS = new Set(['fire', 'pickaxe', 'gun', 'phase', 'dash']);
export function solve(game, seconds = 3, step = 1 / 120) {
  const K = 2;
  const m = game.map;
  const inputs = [{ jump: 0, duck: 0 }, { jump: 1, duck: 0 }, { jump: 0, duck: 1 }];
  if (ACTION_WORLDS.has(m.gimmick)) inputs.push({ jump: 0, duck: 0, act: 1 }, { jump: 1, duck: 0, act: 1 }, { jump: 0, duck: 1, act: 1 });
  if (m.lanes) inputs.push({ jump: 0, duck: 0, lane: -1 }, { jump: 0, duck: 0, lane: 1 });
  let frontier = [{ g: game.clone(), inp: null, parent: null }];
  const ticks = Math.round(seconds / (step * K));
  const r = (v, k) => Math.round(v * k);
  for (let i = 0; i < ticks; i++) {
    const next = new Map();
    for (const node of frontier) {
      for (const inp of inputs) {
        const c = node.g.clone();
        if (inp.jump && !c.input.jump) c.pressJump();
        c.setJump(!!inp.jump);
        c.setDuck(!!inp.duck);
        if (inp.act) c.pressAction();
        if (inp.lane) c.pressLane(inp.lane);
        for (let k = 0; k < K && c.alive; k++) {
          c.update(step);
          c.drainEvents();
        }
        if (!c.alive) continue;
        const d = c.dino;
        const key = [r(d.y, 12), r(d.vy, 1.5), d.grounded, d.speedDrop, inp.jump, inp.duck, d.airJumps, r(d.actCd, 10), r(d.fireCd, 10), r(d.swingCd, 10), c.obstacles.length, d.lane, d.grav, r(d.giant, 2)].join();
        if (!next.has(key)) next.set(key, { g: c, inp, parent: node });
      }
    }
    frontier = [...next.values()];
    if (!frontier.length) return null;
    if (frontier.length > 400) {
      // too many: keep an even spread rather than the first few
      const keep = [];
      for (let j = 0; j < 400; j++) keep.push(frontier[Math.floor((j * frontier.length) / 400)]);
      frontier = keep;
    }
  }
  const path = [];
  for (let n = frontier[0]; n && n.inp; n = n.parent) path.push(n.inp);
  return path.reverse();
}

// Replay the first `ticks` inputs of a solved path on a copy of the game.
export function replay(game, path, ticks, step = 1 / 120) {
  const c = game.clone();
  for (let i = 0; i < Math.min(ticks, path.length); i++) {
    const inp = path[i];
    if (inp.jump && !c.input.jump) c.pressJump();
    c.setJump(!!inp.jump);
    c.setDuck(!!inp.duck);
    if (inp.act) c.pressAction();
    if (inp.lane) c.pressLane(inp.lane);
    for (let k = 0; k < 2; k++) {
      c.update(step);
      c.drainEvents();
    }
  }
  c.setJump(false);
  c.setDuck(false);
  return c;
}
