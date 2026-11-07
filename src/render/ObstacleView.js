import * as THREE from 'three';
import { obstacleModel, billboards } from './models.js';
import { voxelMaterial, glowMaterial } from './voxel.js';

// Keeps one pooled mesh per live obstacle in sync with the simulation.
//
// Sprite-based obstacles are drawn side-on for the 2.5D view. In the chase
// and first-person views they turn to face the camera (and some swap to a
// head-on drawing), so you can always tell what is coming at you.
const FACE_LEFT = new Set(['shark', 'strayCart', 'bird', 'snowBird', 'penguin', 'minecart', 'crow', 'eagle', 'toyPlane', 'blob', 'marble']);
const MONO_TYPES = new Set(['cactusSmall', 'cactusTall', 'bat']);
const NO_SHADOW = new Set(['gap', 'chasm', 'field', 'spill']);

export class ObstacleView {
  constructor(scene) {
    this.scene = scene;
    this.live = new Map();
    this.pool = new Map();
    this.time = 0;
    this.facing = 0;
    this.fieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    // gold bullets
    const bg = new THREE.BoxGeometry(0.42, 0.12, 0.12);
    this.bullets = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: '#ffd23f' }), 64);
    this.bullets.frustumCulled = false;
    this.bullets.count = 0;
    scene.add(this.bullets);
    this.m4 = new THREE.Matrix4();
  }

  prewarm(map) {
    for (const s of [...map.ground, ...map.air]) obstacleModel(s.type);
  }

  get(type) {
    const list = this.pool.get(type);
    if (list && list.length) return list.pop();
    const model = obstacleModel(type);
    let mat = model.glow ? glowMaterial() : voxelMaterial();
    if (type === 'field') mat = this.fieldMat;
    if (type === 'ghost') mat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 1, emissive: '#3a3f66' });
    const mesh = new THREE.Mesh(model.frames[0], mat);
    mesh.castShadow = !NO_SHADOW.has(type);
    mesh.userData.type = type;
    mesh.userData.frames = model.frames;
    mesh.userData.front = model.front;
    mesh.userData.billboard = billboards(type);
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

  // facing: 0 in the side view, 1 in the chase / first-person views
  update(dt, game, camera, facing = 0) {
    this.time += dt;
    this.facing = facing;
    const seen = new Set();
    const phasing = game.map.gimmick === 'phase' && game.dino.actT > 0;
    this.fieldMat.opacity = (phasing ? 0.25 : 0.62) + Math.sin(this.time * 20) * 0.08;
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
      const ud = m.userData;
      let y = o.y;
      let rz = 0;
      const frames = facing > 0.5 && ud.front ? ud.front : ud.frames;
      if (frames.length > 1) m.geometry = frames[Math.floor(this.time * 7 + o.phase) % frames.length];
      else if (m.geometry !== frames[0]) m.geometry = frames[0];
      if (o.type === 'zombie' || o.type === 'goon' || o.type === 'soldier') {
        rz = Math.sin(this.time * 10 + o.phase) * 0.08;
        y += Math.abs(Math.sin(this.time * 10 + o.phase)) * 0.06;
      }
      if (o.type === 'penguin' || o.type === 'strayCart' || o.type === 'minecart' || o.type === 'blob') rz = Math.sin(this.time * 18 + o.phase) * 0.05;
      if (o.drop && !o.falling && o.x < 26) m.position.z = o.z + Math.sin(this.time * 60) * 0.03;
      else m.position.z = o.z;
      // pop-ups rise out of the ground
      if (o.popup) {
        y -= o.fullH - o.h;
        if (o.rise > 0 && o.rise < 1) m.position.z = o.z + Math.sin(this.time * 70) * 0.04;
      }
      let ry = 0;
      if (ud.billboard && facing > 0) {
        const want = Math.atan2(camera.position.x - o.x, camera.position.z - o.z);
        ry = want * facing;
      }
      if (o.type === 'candy') ry = this.time * 3;
      if (o.type === 'ufo') ry = this.time * 2;
      if (o.type === 'shuriken') rz = this.time * 20;
      if (o.type === 'marble') rz = this.time * 14;
      if (o.type === 'ghost') m.material.opacity = o.vis < 0.4 ? 0.12 : 0.55 + (o.vis - 0.4) * 0.75;
      if (o.pit) {
        m.scale.x = o.w;
        y = 0.012;
      }
      m.position.x = o.x;
      m.position.y = y;
      m.rotation.set(0, ry, rz);
    }
    for (const [id, m] of this.live) {
      if (!seen.has(id)) {
        this.release(m);
        this.live.delete(id);
      }
    }
    // bullets
    const B = game.bullets || [];
    const n = Math.min(B.length, 64);
    for (let i = 0; i < n; i++) {
      this.m4.makeTranslation(B[i].x, B[i].y, B[i].z);
      this.bullets.setMatrixAt(i, this.m4);
    }
    this.bullets.count = n;
    this.bullets.instanceMatrix.needsUpdate = true;
  }

  // Desert obstacles are grey by design; everything else is coloured.
  static isMono(type) {
    return MONO_TYPES.has(type);
  }
}
