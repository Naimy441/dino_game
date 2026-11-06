import * as THREE from 'three';
import { obstacleModel } from './models.js';
import { voxelMaterial, glowMaterial } from './voxel.js';

// Keeps one pooled mesh per live obstacle in sync with the simulation.
const FACE_LEFT = new Set(['shark', 'strayCart', 'bird', 'snowBird', 'penguin', 'minecart']);
const MONO_TYPES = new Set(['cactusSmall', 'cactusTall', 'bat']);

export class ObstacleView {
  constructor(scene) {
    this.scene = scene;
    this.live = new Map();
    this.pool = new Map();
    this.time = 0;
  }

  get(type) {
    const list = this.pool.get(type);
    if (list && list.length) return list.pop();
    const model = obstacleModel(type);
    const mesh = new THREE.Mesh(model.frames[0], model.glow ? glowMaterial() : voxelMaterial());
    mesh.userData.type = type;
    mesh.userData.frames = model.frames;
    return mesh;
  }

  release(mesh) {
    this.scene.remove(mesh);
    const t = mesh.userData.type;
    if (!this.pool.has(t)) this.pool.set(t, []);
    this.pool.get(t).push(mesh);
  }

  clear() {
    for (const m of this.live.values()) this.release(m);
    this.live.clear();
  }

  update(dt, game) {
    this.time += dt;
    const seen = new Set();
    for (const o of game.obstacles) {
      seen.add(o.id);
      let m = this.live.get(o.id);
      if (!m) {
        m = this.get(o.type);
        m.rotation.set(0, 0, 0);
        m.scale.set(FACE_LEFT.has(o.type) ? -1 : 1, 1, 1);
        this.scene.add(m);
        this.live.set(o.id, m);
      }
      let y = o.y;
      let rz = 0;
      const frames = m.userData.frames;
      if (frames.length > 1) m.geometry = frames[Math.floor(this.time * 7 + o.phase) % frames.length];
      if (o.type === 'zombie') {
        rz = Math.sin(this.time * 10 + o.phase) * 0.08;
        y += Math.abs(Math.sin(this.time * 10 + o.phase)) * 0.06;
      }
      if (o.type === 'penguin' || o.type === 'strayCart' || o.type === 'minecart') rz = Math.sin(this.time * 18 + o.phase) * 0.05;
      if (o.drop && !o.falling && o.x < 26) m.position.z = o.z + Math.sin(this.time * 60) * 0.03;
      else m.position.z = o.z;
      if (o.type === 'candy') m.rotation.y = this.time * 3;
      if (o.type === 'ufo') m.rotation.y = this.time * 2;
      m.position.x = o.x;
      m.position.y = y;
      m.rotation.z = rz;
    }
    for (const [id, m] of this.live) {
      if (!seen.has(id)) {
        this.release(m);
        this.live.delete(id);
      }
    }
  }

  // Desert obstacles are grey by design; everything else is coloured.
  static isMono(type) {
    return MONO_TYPES.has(type);
  }
}
