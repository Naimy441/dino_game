import * as THREE from 'three';
import { THEMES } from './themes.js';
import { voxelMaterial, glowMaterial } from './voxel.js';

// Ground, track, ceiling, scenery, sky and light for the current world.
// Ground and track are pixel textures (1 texel = 0.1 units, the dino's pixel
// size) scrolled by offset; scenery is one InstancedMesh per prop kind,
// recycled as it scrolls past.

const TEXEL = 0.1;
const TILE = 64; // texels per texture tile
const TILE_U = TILE * TEXEL;
const RANGE_X0 = -50;
const RANGE_LEN = 230;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

// --------------------------------------------------------------- textures
function paint(spec, w, h, seed, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = spec.base;
  g.fillRect(0, 0, w, h);
  const px = (x, y, col, ww = 1, hh = 1) => {
    g.fillStyle = col;
    g.fillRect(((x % w) + w) % w, ((y % h) + h) % h, ww, hh);
  };
  const specks = () => {
    const n = Math.floor(w * h * spec.density);
    for (let i = 0; i < n; i++) {
      const col = spec.specks[Math.floor(r() * spec.specks.length)];
      px(Math.floor(r() * w), Math.floor(r() * h), col, r() < 0.3 ? 2 : 1, 1);
    }
  };
  switch (spec.pattern) {
    case 'line': {
      specks();
      // the classic horizon line, with little bumps
      const y = opts.lineRow ?? 2;
      for (let x = 0; x < w; x++) px(x, y, spec.line);
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(r() * (w - 4));
        px(x, y - 1, spec.line, 2 + Math.floor(r() * 3), 1);
      }
      break;
    }
    case 'cracks': {
      specks();
      for (let k = 0; k < 5; k++) {
        let x = Math.floor(r() * w), y = Math.floor(r() * h);
        for (let i = 0; i < 26; i++) {
          px(x, y, spec.glow);
          if (r() < 0.6) x += r() < 0.5 ? 1 : -1;
          else y += r() < 0.5 ? 1 : -1;
        }
      }
      break;
    }
    case 'craters': {
      specks();
      for (let k = 0; k < 4; k++) {
        const cx = r() * w, cy = r() * h, rad = 3 + r() * 6;
        for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
          const d = Math.sqrt(x * x + y * y);
          if (d < rad) px(Math.floor(cx + x), Math.floor(cy + y), d > rad - 1.2 ? spec.specks[1] : spec.specks[0]);
        }
      }
      break;
    }
    case 'blocks': {
      for (let by = 0; by < h; by += 8) for (let bx = 0; bx < w; bx += 8) {
        g.fillStyle = r() < 0.5 ? spec.base : spec.specks[2] || spec.base;
        g.fillRect(bx, by, 8, 8);
        for (let i = 0; i < 10; i++) px(bx + Math.floor(r() * 8), by + Math.floor(r() * 8), spec.specks[Math.floor(r() * 2)]);
      }
      break;
    }
    case 'ripples': {
      specks();
      for (let y = 4; y < h; y += 8) for (let x = 0; x < w; x++) {
        const yy = y + Math.round(Math.sin((x / w) * Math.PI * 4 + y) * 1.5);
        if (x % 7 < 5) px(x, yy, spec.specks[0]);
      }
      break;
    }
    case 'checker': {
      for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
        g.fillStyle = ((x + y) / 16) % 2 ? spec.alt : spec.base;
        g.fillRect(x, y, 16, 16);
      }
      g.fillStyle = spec.specks[0];
      for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1);
      for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h);
      break;
    }
    case 'grid': {
      specks();
      g.fillStyle = spec.line;
      for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1);
      for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h);
      break;
    }
    case 'lanes': {
      specks();
      g.fillStyle = spec.line;
      for (const v of opts.laneRows || []) for (let x = 0; x < w; x += 16) g.fillRect(x, v, 9, 1);
      g.fillRect(0, 0, w, 1);
      g.fillRect(0, h - 1, w, 1);
      break;
    }
    case 'stones': {
      // paving stones / flagstones with dark grout
      for (let y = 0; y < h; y += 8) {
        const off = (y / 8) % 2 ? 6 : 0;
        for (let x = 0; x < w; x += 12) {
          g.fillStyle = r() < 0.5 ? spec.base : spec.alt || spec.base;
          g.fillRect((x + off) % w, y, 11, 7);
          if (x + off + 11 > w) g.fillRect(0, y, (x + off + 11) % w, 7);
        }
      }
      specks();
      break;
    }
    case 'planks': {
      specks();
      g.fillStyle = spec.line;
      for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1);
      for (let y = 0; y < h; y += 6) g.fillRect(Math.floor(r() * w), y, 1, 6);
      break;
    }
    case 'rails': {
      specks();
      for (let x = 0; x < w; x += 8) {
        g.fillStyle = '#5a4030';
        g.fillRect(x, 3, 3, h - 6);
      }
      g.fillStyle = spec.line;
      g.fillRect(0, 6, w, 1);
      g.fillRect(0, h - 7, w, 1);
      break;
    }
    default:
      specks();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

function gradientTex(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, top);
  gr.addColorStop(0.75, bottom);
  gr.addColorStop(1, bottom);
  g.fillStyle = gr;
  g.fillRect(0, 0, 2, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });

// --------------------------------------------------------------- world
export class World {
  constructor(scene) {
    this.scene = scene;
    this.themes = new Map();
    this.current = null;
    this.mode = 'side';
    this.time = 0;

    this.hemi = new THREE.HemisphereLight('#fff', '#888', 1);
    this.sun = new THREE.DirectionalLight('#fff', 0.5);
    this.sun.position.set(-5, 14, 9);
    // real shadows from the sun, in a box that follows the action
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -34; sc.right = 34; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 120;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.03;
    this.sun.target.position.set(18, 0, 0);
    this.sunDir = new THREE.Vector3(-0.4, 1, 0.5).normalize();
    // a coloured kicker light, level with the ground so it tints the faces
    // of things standing on the track (what every camera sees of them) and
    // never the ground itself
    this.rim = new THREE.DirectionalLight('#fff', 0);
    this.rim.position.set(-20, 0, 14);
    scene.add(this.hemi, this.sun, this.sun.target, this.rim);
    scene.fog = new THREE.Fog('#f7f7f7', 40, 150);

    const groundGeo = new THREE.PlaneGeometry(RANGE_LEN + 60, 200);
    groundGeo.rotateX(-Math.PI / 2);
    this.ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial());
    this.ground.receiveShadow = true;
    this.ground.position.set(RANGE_X0 + (RANGE_LEN + 60) / 2 - 10, -0.002, -40);
    this.track = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial());
    this.track.position.set(this.ground.position.x, 0.004, 0);
    this.track.receiveShadow = true;
    this.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(RANGE_LEN + 60, 200).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }));
    this.ceiling.position.set(this.ground.position.x, 6, -40);
    this.ceilTrack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial());
    scene.add(this.ground, this.track, this.ceiling, this.ceilTrack);

    this.sky = new THREE.Group();
    scene.add(this.sky);
  }

  build(id) {
    if (this.themes.has(id)) return this.themes.get(id);
    const T = THEMES[id];
    const seed = hash(id);
    const r = rng(seed);
    const trackW = T.trackWidth || 2.4;
    const trackRows = Math.round(trackW / TEXEL);
    const laneRows = [Math.round(trackRows / 2 - 8.5), Math.round(trackRows / 2 + 8.5)];
    const built = {
      id, T,
      groundTex: paint(T.ground, TILE, TILE, seed),
      trackTex: paint(T.track, TILE, trackRows, seed + 1, { laneRows, lineRow: 3 }),
      background: gradientTex(T.sky, T.horizon),
      props: [],
      sky: new THREE.Group(),
      trackW,
    };
    built.groundTex.repeat.set((RANGE_LEN + 60) / TILE_U, 200 / TILE_U);
    built.trackTex.repeat.set((RANGE_LEN + 60) / TILE_U, 1);
    for (const def of T.props) {
      const geo = def.make();
      const mesh = new THREE.InstancedMesh(geo, def.glow ? glowMaterial() : voxelMaterial(), def.n);
      mesh.frustumCulled = false;
      mesh.castShadow = !def.glow && Math.abs(def.z[1]) < 45;
      mesh.receiveShadow = !def.glow;
      const items = [];
      const range = def.spacing ? def.n * def.spacing : RANGE_LEN;
      for (let i = 0; i < def.n; i++) {
        items.push({
          x: def.spacing ? RANGE_X0 + i * def.spacing + (def.offset || 0) : RANGE_X0 + r() * range,
          z: def.z[0] + r() * (def.z[1] - def.z[0]),
          y: def.hang ?? (def.y ? def.y[0] + r() * (def.y[1] - def.y[0]) : 0),
          s: def.s[0] + r() * (def.s[1] - def.s[0]),
          rot: def.faceBack ? Math.PI : def.spacing ? 0 : (r() - 0.5) * 0.6,
          phase: r() * 6.28,
        });
      }
      built.props.push({ def, mesh, items, range });
    }
    // far-away sky pieces: one copy toward the side view and one ahead, so
    // every camera has something on its horizon
    for (const def of T.sky3d || []) {
      const geo = def.make();
      for (let i = 0; i < def.n; i++) {
        if (def.fixed) {
          for (const [x, y, z] of def.alt ? [[-60, 45, -150], [150, 55, 60]] : [[60, 38, -150], [150, 35, -50]]) {
            const m = new THREE.Mesh(geo, skyMat);
            m.position.set(x, y, z);
            m.lookAt(0, y * 0.4, 0);
            built.sky.add(m);
          }
        } else if (def.stars) {
          const m = new THREE.Mesh(geo, skyMat);
          const a = r() * Math.PI * 2, e = 0.08 + r() * 1.2;
          m.position.set(Math.cos(a) * Math.cos(e) * 170, Math.sin(e) * 170, Math.sin(a) * Math.cos(e) * 170);
          m.lookAt(0, 0, 0);
          m.scale.setScalar(0.5 + r() * 1.2);
          built.sky.add(m);
        } else {
          const m = new THREE.Mesh(geo, skyMat);
          const a = -Math.PI / 2 + (r() - 0.5) * 2.4 + (i % 2 ? Math.PI / 2.2 : 0);
          m.position.set(Math.cos(a) * 140, 22 + r() * 30, Math.sin(a) * 140);
          m.lookAt(0, m.position.y, 0);
          m.userData.drift = def.drift || 0;
          m.userData.a = a;
          m.scale.setScalar(1 + r() * 1.5);
          built.sky.add(m);
        }
      }
    }
    this.themes.set(id, built);
    return built;
  }

  setTheme(id) {
    const b = this.build(id);
    if (this.current) {
      for (const p of this.current.props) this.scene.remove(p.mesh);
      this.sky.remove(this.current.sky);
    }
    this.current = b;
    const T = b.T;
    for (const p of b.props) this.scene.add(p.mesh);
    this.sky.add(b.sky);
    this.scene.background = b.background;
    this.scene.fog.color.set(T.fog);
    this.scene.fog.near = T.fogNear;
    this.scene.fog.far = T.fogFar;
    this.hemi.color.set(T.hemi[0]);
    this.hemi.groundColor.set(T.hemi[1]);
    this.hemi.intensity = T.hemi[2] * Math.PI;
    this.sun.color.set(T.sun[0]);
    this.sun.intensity = T.sun[1] * Math.PI;
    const L = T.light || {};
    this.sunDir.set(...(L.sunDir || [-0.4, 1, 0.5])).normalize();
    const sh = L.shadow ?? 0.5;
    this.sun.castShadow = sh > 0;
    this.sun.shadow.intensity = Math.min(1, sh);
    // push more of the light into the sun so shadows actually read
    // shift a little of the fill into the sun so shadows read, without
    // brightening the scene overall
    if (sh > 0) {
      const k = sh * 0.12 * T.hemi[2] * Math.PI;
      this.hemi.intensity -= k;
      this.sun.intensity += k * 0.8;
    }
    // exposure: keep sky + sun on flat ground from blowing colours out to
    // white (bright worlds used to wash out; dark ones are left alone)
    const flat = (this.hemi.intensity + this.sun.intensity * Math.max(0, this.sunDir.y)) / Math.PI;
    if (flat > 1.08) {
      const k = 1.08 / flat;
      this.hemi.intensity *= k;
      this.sun.intensity *= k;
    }
    this.rim.color.set(L.rim ? L.rim[0] : '#ffffff');
    this.rim.intensity = (L.rim ? L.rim[1] : 0.3) * Math.PI * 0.5;

    const glowGround = !!T.ground.glow;
    this.ground.material.dispose();
    this.ground.material = glowGround ? new THREE.MeshBasicMaterial({ map: b.groundTex }) : new THREE.MeshLambertMaterial({ map: b.groundTex });
    this.track.material.dispose();
    this.track.material = T.track.glow ? new THREE.MeshBasicMaterial({ map: b.trackTex }) : new THREE.MeshLambertMaterial({ map: b.trackTex });
    // open water: see-through, so you can see the dino dive
    if (T.water) {
      for (const mat of [this.ground.material, this.track.material]) {
        mat.transparent = true;
        mat.opacity = mat === this.track.material ? 0.55 : 0.72;
        mat.depthWrite = false;
      }
    }
    this.waterTex = T.water ? b.groundTex : null;
    this.track.scale.set(RANGE_LEN + 60, 1, b.trackW);
    const C = T.ceiling;
    this.ceiling.visible = !!C;
    this.surfaceTex = null;
    this.ceilTrack.visible = !!(C && C.line);
    if (C) {
      this.ceiling.position.y = C.y;
      // under the sea the ceiling is the water's surface: rippling light
      // seen from below, drifting with the swell
      this.ceiling.material.dispose();
      this.ceiling.material = C.water
        ? new THREE.MeshBasicMaterial({ map: b.surfaceTex || (b.surfaceTex = paint({ base: '#3aa7d8', specks: ['#bff4ff', '#7fdcff', '#e8fdff'], density: 0.16, pattern: 'ripples' }, TILE, TILE, 77)), transparent: true, opacity: C.opacity, side: THREE.DoubleSide, depthWrite: false, fog: false })
        : new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: C.color, transparent: C.opacity < 1, opacity: C.opacity });
      if (C.water) b.surfaceTex.repeat.set((RANGE_LEN + 60) / TILE_U / 2, 200 / TILE_U / 2);
      this.surfaceTex = C.water ? b.surfaceTex : null;
      if (C.line) {
        this.ceilTrack.material.map = b.trackTex;
        this.ceilTrack.material.needsUpdate = true;
        this.ceilTrack.scale.set(RANGE_LEN + 60, 1, b.trackW);
        this.ceilTrack.position.set(this.track.position.x, C.y - 0.004, 0);
      }
    }
    this.applyMode();
    return b;
  }

  setMode(mode) {
    this.mode = mode;
    this.applyMode();
  }
  applyMode() {
    if (!this.current) return;
    for (const p of this.current.props) p.mesh.visible = !(p.def.front && this.mode === 'side');
  }

  // Positions of scenery currently near the camera (for the colour explosion).
  visibleProps(limit = 40) {
    const out = [];
    if (!this.current) return out;
    for (const p of this.current.props) {
      if (!p.mesh.visible) continue;
      for (const it of p.items) {
        if (it.x > -8 && it.x < 40 && Math.abs(it.z) < 40) out.push(it);
        if (out.length >= limit) return out;
      }
    }
    return out;
  }

  update(dt, speed, distance, camera) {
    this.time += dt;
    const b = this.current;
    if (!b) return;
    const off = distance / TILE_U;
    b.groundTex.offset.x = off % 1;
    b.trackTex.offset.x = off % 1;
    // water swells
    if (this.waterTex) {
      this.waterTex.offset.y = Math.sin(this.time * 0.7) * 0.05;
      b.trackTex.offset.y = Math.sin(this.time * 0.9 + 1) * 0.04;
    }
    if (this.surfaceTex) {
      this.surfaceTex.offset.x = (off * 0.5 + this.time * 0.03) % 1;
      this.surfaceTex.offset.y = Math.sin(this.time * 0.5) * 0.1;
    }
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    for (const p of b.props) {
      const { def, mesh, items, range } = p;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        it.x -= speed * dt * (def.swim ? 1.25 : 1);
        if (it.x < RANGE_X0) it.x += range;
        let y = it.y;
        let rx = 0, ry = it.rot, rz = 0;
        if (def.swim) y += Math.sin(this.time * 2 + it.phase) * 0.3;
        if (def.spin) {
          rx = this.time * 0.3 + it.phase;
          rz = this.time * 0.2;
          y += Math.sin(this.time * 0.6 + it.phase) * 0.6;
        }
        e.set(rx, ry, rz);
        q.setFromEuler(e);
        pos.set(it.x, y, it.z);
        scl.setScalar(it.s);
        m4.compose(pos, q, scl);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    // the sun (and its shadow box) stays aimed at the stretch ahead
    this.sun.target.position.set(16, 0, 0);
    this.sun.position.copy(this.sun.target.position).addScaledVector(this.sunDir, 60);
    this.rim.target.position.set(0, 0, 0);
    // sky follows the camera; clouds drift
    this.sky.position.copy(camera.position);
    for (const m of b.sky.children) {
      if (!m.userData.drift) continue;
      m.userData.a -= dt * m.userData.drift * 0.004;
      m.position.x = Math.cos(m.userData.a) * 140;
      m.position.z = Math.sin(m.userData.a) * 140;
      m.lookAt(0, m.position.y, 0);
    }
  }
}
