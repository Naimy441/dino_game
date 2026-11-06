import * as THREE from 'three';

// Voxel particles: one InstancedMesh of cubes, unlit so they read as pixels.
// Particles can be pinned to the world (they scroll past with the ground) or
// to the dino (fire breath).

const MAX = 1400;

export class Particles {
  constructor(scene) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: true });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.p = [];
    this.m4 = new THREE.Matrix4();
    this.col = new THREE.Color();
    this.ambient = 0;
  }

  emit({ x = 0, y = 0, z = 0, n = 10, colors = ['#ffffff'], speed = 4, up = 2, size = 0.12, life = 0.8, gravity = -12, drag = 1, scroll = 1, spread = 0.2, dir = null, sizeEnd = 0 }) {
    for (let i = 0; i < n; i++) {
      if (this.p.length >= MAX) this.p.shift();
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * 2 - 1;
      const s = speed * (0.4 + Math.random() * 0.6);
      let vx = Math.cos(a) * Math.sqrt(1 - b * b) * s, vy = b * s + up, vz = Math.sin(a) * Math.sqrt(1 - b * b) * s;
      if (dir) {
        vx = dir[0] * s + (Math.random() - 0.5) * spread * s;
        vy = dir[1] * s + (Math.random() - 0.5) * spread * s;
        vz = dir[2] * s + (Math.random() - 0.5) * spread * s;
      }
      this.p.push({
        x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, z: z + (Math.random() - 0.5) * spread,
        vx, vy, vz, life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.7 + Math.random() * 0.6), sizeEnd,
        color: colors[Math.floor(Math.random() * colors.length)], g: gravity, drag, scroll,
      });
    }
  }

  clear() {
    this.p.length = 0;
  }

  update(dt, speed) {
    const out = [];
    let i = 0;
    for (const p of this.p) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += p.g * dt;
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vz *= k;
      p.x += (p.vx - speed * p.scroll) * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      out.push(p);
      const t = p.life / p.max;
      const s = p.sizeEnd ? p.size * t + p.sizeEnd * (1 - t) : p.size * Math.min(1, t * 3);
      this.m4.makeScale(s, s, s);
      this.m4.setPosition(p.x, p.y, p.z);
      this.mesh.setMatrixAt(i, this.m4);
      this.col.set(p.color);
      this.mesh.instanceColor.setXYZ(i, this.col.r, this.col.g, this.col.b);
      i++;
    }
    this.p = out;
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }

  // Ambient weather per world.
  ambientFor(theme, dt, camX = 0) {
    const a = theme.particles;
    if (!a) return;
    this.ambient += dt * a.rate;
    while (this.ambient >= 1) {
      this.ambient -= 1;
      const x = -5 + Math.random() * 45;
      const z = -18 + Math.random() * 24;
      switch (a.kind) {
        case 'embers':
          this.emit({ x, y: Math.random() * 2, z, n: 1, colors: ['#ff8a1a', '#ffd23f', '#ff4a00'], speed: 0.6, up: 2.5, gravity: 0.6, life: 2.5, size: 0.1 });
          break;
        case 'bubbles':
          this.emit({ x, y: Math.random() * 2, z, n: 1, colors: [a.color], speed: 0.3, up: 1.8, gravity: 0.4, life: 3, size: 0.1 });
          break;
        case 'snow':
          this.emit({ x: x + 6, y: 6 + Math.random() * 4, z, n: 1, colors: ['#ffffff'], speed: 0.4, up: -1.5, gravity: 0, life: 4, size: 0.1, scroll: 0.6 });
          break;
        case 'leaves':
          this.emit({ x: x + 6, y: 5 + Math.random() * 3, z, n: 1, colors: [a.color, '#e5b93a'], speed: 0.6, up: -1, gravity: 0, life: 4, size: 0.12, scroll: 0.7 });
          break;
        case 'dust':
          this.emit({ x, y: Math.random() * 5, z, n: 1, colors: [a.color], speed: 0.2, up: 0, gravity: 0, life: 3, size: 0.06, scroll: 0.9 });
          break;
        case 'warp':
          this.emit({ x: x + 30, y: -2 + Math.random() * 10, z: z - 10, n: 1, colors: ['#ffffff', '#9ad8ff'], speed: 0, up: 0, gravity: 0, life: 1.4, size: 0.12, scroll: 2.2, drag: 0 });
          break;
        default:
      }
    }
  }
}
