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
  if (g === 'fire' || g === 'pickaxe') P.push({ name: 'attack', action: [0] });
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
  if (g === 'fire' || g === 'pickaxe') P.push({ name: 'jump-attack', press: [0], jump: 2, action: [0.05] });
  if (game.map.lanes) {
    P.push({ name: 'left-jump', lane: -1, press: [0], jump: 2 });
    P.push({ name: 'right-jump', lane: 1, press: [0], jump: 2 });
  }
  P.push({ name: 'wait-jump', press: [0.15], jump: 2 });
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
  game.setJump(plan.jump ? t >= start && t < start + plan.jump : false);
  const duck = (plan.duck && t < plan.duck) || (plan.duckAfter && t > plan.duckAfter);
  game.setDuck(!!duck);
}

function survives(game, plan, horizon, margin) {
  const g = game.clone();
  g.margin = margin;
  for (let t = 0; t < horizon; t += STEP) {
    apply(g, plan, t);
    g.update(STEP);
    if (!g.alive) return false;
  }
  return true;
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
      const horizon = Math.max(0.7, Math.min(3.2, game.airtime() * 1.6 + 0.1));
      // keep the current plan while it still works, otherwise replan
      // Try idle, then every plan started as late as possible: if a late
      // start survives, there is no need to act yet.
      let chosen = null;
      const base = plans(game);
      for (const margin of [0.14, 0]) {
        if (survives(game, base[0], horizon, margin)) chosen = base[0];
        for (const delay of DELAYS) {
          if (chosen) break;
          for (const p of base.slice(1)) {
            const q = delay ? { ...p, delay } : p;
            if (survives(game, q, horizon + delay, margin)) {
              chosen = delay ? base[0] : p;
              break;
            }
          }
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
