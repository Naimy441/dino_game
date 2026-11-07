// The original offline dino runner's tuning (Chromium, BSD licence), kept in
// its own units: canvas pixels and 60 fps frames. Speed gain, scoring and
// where obstacles spawn follow these rules exactly (see Game.spawn).
//
// One world unit is PX pixels, chosen so the dino stands exactly as tall as
// the original T-rex (47 px).

export const STAND_H = 1.82; // the dino's standing hitbox height in world units

export const CLASSIC = {
  px: 47 / STAND_H, // pixels per world unit
  fps: 60,
  speed: 6, // starting speed, px per frame
  maxSpeed: 13,
  accel: 0.001, // added to the speed every frame
  coefficient: 0.025, // score per pixel run
  clearTime: 3, // seconds with no obstacles at the start of a run
  gapCoefficient: 0.6,
  maxGapCoefficient: 1.5,
  maxLength: 3, // obstacles grouped side by side, at most
  maxDuplication: 2, // the same type at most twice in a row
  screen: 600, // canvas width: obstacles appear at its right edge...
  startX: 50, // ...and the T-rex runs at this x
  // the T-rex's jump
  gravity: 0.6, // px per frame, per frame
  jumpVelocity: 10, // plus speed / 10: faster runs jump harder
  dropVelocity: 5, // rising speed is capped to this once the jump ends
  minJumpHeight: 30, // let go after this height and the jump ends (a hop)
  maxJumpHeight: 63, // ...and it always ends here (93 px ground - 30)
  speedDrop: 3, // down in the air: fall three times as fast
};

export const px = (p) => p / CLASSIC.px; // pixels to world units

// Speed (px/frame) after running far enough to score `score` from a standing
// start. Speed grows by `accel` every frame, so distance is the sum of an
// arithmetic series: d = v0 t + a t^2 / 2  =>  v = sqrt(v0^2 + 2 a d).
export function speedForScore(score) {
  const d = score / CLASSIC.coefficient;
  return Math.min(CLASSIC.maxSpeed, Math.sqrt(CLASSIC.speed ** 2 + 2 * CLASSIC.accel * d));
}

// px/frame (or px/frame^2) to world units per second (or per second^2)
export const perSec = (v) => (v * CLASSIC.fps) / CLASSIC.px;
export const perSec2 = (a) => (a * CLASSIC.fps * CLASSIC.fps) / CLASSIC.px;
