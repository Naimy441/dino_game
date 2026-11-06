import * as THREE from 'three';

// Three views of the same run:
//   side   the classic flat runner, tilted a little so the 3D depth shows
//   chase  third person behind the dino
//   first  through the dino's eyes
// Switching blends smoothly; shake is added on top.

export const CAMERA_MODES = ['side', 'chase', 'first'];
export const CAMERA_NAMES = { side: '2.5D', chase: '3RD PERSON', first: '1ST PERSON' };

const tmpP = new THREE.Vector3();
const tmpL = new THREE.Vector3();

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'side';
    this.blend = 1;
    this.fromP = new THREE.Vector3();
    this.fromL = new THREE.Vector3();
    this.fromFov = 32;
    this.pos = new THREE.Vector3(4, 4.4, 20);
    this.look = new THREE.Vector3(5.5, 2, 0);
    this.fov = 32;
    this.roll = 0;
    this.shakeAmt = 0;
    this.time = 0;
    this.smoothY = 0;
    this.smoothZ = 0;
    this.flipT = 0;
    this.attract = false;
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.fromP.copy(this.pos);
    this.fromL.copy(this.look);
    this.fromFov = this.fov;
    this.mode = mode;
    this.blend = 0;
  }

  shake(a) {
    this.shakeAmt = Math.max(this.shakeAmt, a);
  }

  target(mode, game, scale, P, L) {
    const d = game.dino;
    const m = game.map;
    const ceil = m.ceiling || 0;
    const z = this.smoothZ;
    const flip = d.grav < 0;
    if (mode === 'side') {
      // pull back when there is a ceiling, tilt more on the lane map
      const lanes = !!m.lanes;
      const tall = ceil > 0 ? Math.max(0, ceil - 5) * 0.6 : 0;
      // pulled well back so there is room to see what's coming
      let y = (lanes ? 8.2 : 5.6) + tall + (m.gimmick === 'lowGravity' ? Math.min(3, this.smoothY * 0.5) : 0);
      // with a ceiling, look straight into the middle of the tunnel so the
      // floor and the ceiling are both in view (and never from above it)
      if (ceil) y = ceil * 0.58;
      // keep the dino about a sixth of the way in from the left on any aspect
      const dist = 27 + tall * 2.2;
      const hw = Math.tan((32 * Math.PI) / 360) * dist * this.camera.aspect;
      const cx = Math.max(5, hw * 0.68);
      P.set(cx - 2.6, y, dist);
      L.set(cx, (ceil ? ceil * 0.5 : 2.1) + (m.gimmick === 'lowGravity' ? this.smoothY * 0.4 : 0), 0);
      return 32;
    }
    if (mode === 'chase') {
      // high and back, looking past the dino: it sits low in the frame so
      // its head never hides the track ahead. Under a ceiling the camera
      // stays inside the tunnel, and through a gravity flip it glides
      // between floor-side and ceiling-side instead of snapping.
      let h = 5.4 * scale;
      if (ceil) h = Math.min(h, ceil * 0.62);
      const rise = ceil ? 0 : this.smoothY * 0.55;
      const lift = Math.min(0.6 + this.smoothY * 0.5, ceil ? ceil - 0.6 : Infinity);
      const yUp = h + (ceil && m.gimmick === 'swim' ? Math.min(this.smoothY * 0.5, ceil - h - 0.5) : rise);
      const f = this.flipT;
      const y = Math.max(0.5, yUp * (1 - f) + (ceil - h) * f);
      P.set(-7.2 * scale, y, z * 0.85);
      L.set(16, lift * (1 - f) + (ceil - 0.6) * f, z * 0.4);
      return 62;
    }
    // first person: eyes, a touch above the snout
    const eye = (d.ducking ? 0.95 : 1.78) * scale;
    const y = flip ? d.y - eye : d.y + eye;
    P.set(0.9 * scale, y, d.z);
    L.set(16, flip ? y - 0.4 : y - 0.35, d.z);
    return 78;
  }

  update(dt, game, scale = 1) {
    this.time += dt;
    const d = game.dino;
    this.smoothY += (d.y - this.smoothY) * Math.min(1, dt * 5);
    this.smoothZ += (d.z - this.smoothZ) * Math.min(1, dt * 10);
    const wantFlip = d.grav < 0 ? 1 : 0;
    this.flipT += (wantFlip - this.flipT) * Math.min(1, dt * 7);
    const fov = this.target(this.mode, game, scale, tmpP, tmpL);
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + dt * 2.2);
      const t = this.blend * this.blend * (3 - 2 * this.blend);
      this.pos.lerpVectors(this.fromP, tmpP, t);
      this.look.lerpVectors(this.fromL, tmpL, t);
      this.fov = this.fromFov + (fov - this.fromFov) * t;
    } else {
      this.pos.copy(tmpP);
      this.look.copy(tmpL);
      this.fov = fov;
    }
    if (this.attract) {
      // title screen: slow orbit around the dino
      const a = this.time * 0.15;
      this.pos.set(Math.sin(a) * 2 + 3, 3.6, 15 + Math.cos(a) * 2);
      this.look.set(4, 1.6, 0);
      this.fov = 34;
    }
    // roll upside down with the dino in the chase and first-person views
    const wantRoll = d.grav < 0 && this.mode !== 'side' ? Math.PI : 0;
    this.roll += (wantRoll - this.roll) * Math.min(1, dt * 6);

    const c = this.camera;
    c.position.copy(this.pos);
    if (this.shakeAmt > 0) {
      const s = this.shakeAmt;
      c.position.x += (Math.random() - 0.5) * s;
      c.position.y += (Math.random() - 0.5) * s;
      this.shakeAmt = Math.max(0, s - dt * 2.5);
    }
    // a little head bob when running in first person
    if (this.mode === 'first' && d.grounded && game.alive) c.position.y += Math.abs(Math.sin(this.time * 14)) * 0.05;
    c.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.roll);
    c.lookAt(this.look);
    if (Math.abs(c.fov - this.fov) > 0.01) {
      c.fov = this.fov;
      c.updateProjectionMatrix();
    }
  }
}
