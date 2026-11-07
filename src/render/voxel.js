import * as THREE from 'three';

// Chunky voxel models built from pixel art. A sprite is an array of strings
// (top row first) plus a palette mapping characters to colours. Each pixel
// becomes a column of cubes; with `inflate` the column is thicker the further
// the pixel is from the sprite's edge, so flat pixel art turns into a rounded,
// chunky 3D model while staying perfectly pixelated from the side.
//
// Only faces between a filled and an empty cell are emitted, every face has
// its own flat normal, and the whole model is a single BufferGeometry with
// vertex colours: one draw call per model.

const FACES = [
  // dir, corner offsets (counter-clockwise from outside)
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];
// Baked per-face shade so voxels read well even under flat light.
const FACE_SHADE = [0.9, 0.9, 1.0, 0.62, 0.97, 0.8];
const AO_LEVELS = [0.52, 0.68, 0.84, 1];

const key = (x, y, z) => `${x},${y},${z}`;

export class VoxelSet {
  constructor() {
    this.map = new Map();
  }
  set(x, y, z, color) {
    this.map.set(key(x, y, z), { x, y, z, c: color instanceof THREE.Color ? color : new THREE.Color(color) });
  }
  has(x, y, z) {
    return this.map.has(key(x, y, z));
  }
  box(x, y, z, w, h, d, color) {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) for (let k = 0; k < d; k++) this.set(x + i, y + j, z + k, color);
    return this;
  }
  // Pixel sprite into this set. Row 0 of the sprite is the top; the bottom
  // row lands on y = oy. Columns run along +x from ox.
  //   inflate  pixels far from the drawing's edge get thicker (rounded look)
  //   round    instead, each column is a rounded tube as thick as it is tall
  //            (used for the dino, so it has a real body from every side)
  //   cross    also stamp the drawing (or `front`) across the track (in the
  //            z/y plane), so arms and wings stick out toward every camera
  //   surface  characters drawn only on the outer layer (eyes); inside they
  //            use the given fill character
  sprite(rows, palette, opts = {}) {
    const { ox = 0, oy = 0, oz = 0, cross = false, front = null } = opts;
    const W = Math.max(...rows.map((r) => r.length));
    const cx = cross ? Math.floor(W / 2) : 0;
    this.plane(rows, palette, opts, (x, y, z, c) => this.set(ox + x - cx, oy + y, oz + z, c));
    if (cross) {
      const f = front || rows;
      const fw = Math.max(...f.map((r) => r.length));
      const fc = Math.floor(fw / 2);
      const fopts = { ...opts, maxHalf: opts.frontHalf ?? Math.min(2, opts.maxHalf ?? 2) };
      this.plane(f, opts.frontPalette || palette, fopts, (x, y, z, c) => {
        if (!this.has(ox + z, oy + y, oz + x - fc)) this.set(ox + z, oy + y, oz + x - fc, c);
      });
    }
    return this;
  }

  // Calls put(x, yUp, z, colour) for every voxel of one extruded drawing.
  plane(rows, palette, { inflate = 2, depth = 1, maxHalf = 4, round = 0, surface = null, skip = '' } = {}, put) {
    const H = rows.length;
    const W = Math.max(...rows.map((r) => r.length));
    const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] || '.' : '.');
    const filled = (x, y) => {
      const ch = at(x, y);
      return ch !== '.' && ch !== ' ' && !skip.includes(ch);
    };
    const halfOf = new Array(W * H).fill(0);
    if (round) {
      // vertical runs: each one becomes a rounded tube
      for (let x = 0; x < W; x++) {
        let y = 0;
        while (y < H) {
          if (!filled(x, y)) {
            y++;
            continue;
          }
          let e = y;
          while (e < H && filled(x, e)) e++;
          const L = e - y;
          const hm = Math.max(2, Math.min(maxHalf, Math.round(L * round)));
          const c = (y + e) / 2;
          for (let k = y; k < e; k++) {
            const t = (k + 0.5 - c) / (L / 2);
            halfOf[k * W + x] = Math.max(1, Math.round(hm * Math.sqrt(Math.max(0, 1 - t * t * 0.85))));
          }
          y = e;
        }
      }
    } else {
      // distance to the nearest empty pixel (4-neighbourhood BFS)
      const dist = new Array(W * H).fill(Infinity);
      const q = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (!filled(x, y)) continue;
          if (!filled(x + 1, y) || !filled(x - 1, y) || !filled(x, y + 1) || !filled(x, y - 1)) {
            dist[y * W + x] = 1;
            q.push([x, y]);
          }
        }
      }
      for (let i = 0; i < q.length; i++) {
        const [x, y] = q[i];
        const d = dist[y * W + x] + 1;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (filled(nx, ny) && dist[ny * W + nx] > d) {
            dist[ny * W + nx] = d;
            q.push([nx, ny]);
          }
        }
      }
      for (let i = 0; i < W * H; i++) {
        if (dist[i] === Infinity) continue;
        halfOf[i] = inflate ? Math.min(maxHalf, Math.max(depth, Math.round(dist[i] * inflate * 0.5))) : depth;
      }
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!filled(x, y)) continue;
        const ch = at(x, y);
        const col = palette[ch];
        if (col === undefined) continue;
        const half = halfOf[y * W + x];
        const inner = surface && surface[ch] ? palette[surface[ch]] : col;
        const yy = H - 1 - y;
        for (let z = -half; z < half; z++) put(x, yy, z, z === -half || z === half - 1 ? col : inner);
      }
    }
    this.halves = { halfOf, W, H };
  }
  // Build a geometry. `size` is the edge of one voxel in world units; the
  // model is centred on x and z (unless anchor says otherwise) with its lowest
  // voxel at y = 0.
  build(size = 0.1, { anchor = 'bottom', centerX = true, ao: aoOn = true } = {}) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const v of this.map.values()) {
      if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
      if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
    }
    const cx = centerX ? (minX + maxX + 1) / 2 : 0;
    const cz = (minZ + maxZ + 1) / 2;
    const cy = anchor === 'center' ? (minY + maxY + 1) / 2 : anchor === 'top' ? maxY + 1 : minY;
    const pos = [], nor = [], col = [];
    const cell = [0, 0, 0];
    const occ = (base, k, axis, o) => {
      cell[0] = base[0]; cell[1] = base[1]; cell[2] = base[2];
      cell[axis] += o;
      if (k !== -1) cell[k[0]] += k[1];
      return this.has(cell[0], cell[1], cell[2]) ? 1 : 0;
    };
    for (const v of this.map.values()) {
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        if (this.has(v.x + F.n[0], v.y + F.n[1], v.z + F.n[2])) continue;
        const s = FACE_SHADE[f];
        const corners = F.c.map(([a, b2, c]) => [(v.x + a - cx) * size, (v.y + b2 - cy) * size, (v.z + c - cz) * size]);
        // Ambient occlusion per corner: darken where neighbouring voxels
        // crowd the face (the classic voxel look that makes shapes read).
        const ao = [1, 1, 1, 1];
        if (aoOn) {
          const axisN = F.n[0] ? 0 : F.n[1] ? 1 : 2;
          const [U, V] = [0, 1, 2].filter((a) => a !== axisN);
          const base = [v.x + F.n[0], v.y + F.n[1], v.z + F.n[2]];
          for (let i = 0; i < 4; i++) {
            const c = F.c[i];
            const ou = c[U] * 2 - 1, ov = c[V] * 2 - 1;
            const s1 = occ(base, -1, U, ou), s2 = occ(base, -1, V, ov);
            const cc = occ(base, [V, ov], U, ou);
            const lvl = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
            ao[i] = AO_LEVELS[lvl];
          }
        }
        // flip the quad's diagonal so the gradient doesn't streak
        const order = ao[0] + ao[2] < ao[1] + ao[3] ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
        for (const idx of order) {
          pos.push(...corners[idx]);
          nor.push(...F.n);
          const k = s * ao[idx];
          col.push(v.c.r * k, v.c.g * k, v.c.b * k);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    geo.userData.size = {
      w: (maxX - minX + 1) * size,
      h: (maxY - minY + 1) * size,
      d: (maxZ - minZ + 1) * size,
    };
    return geo;
  }
}

export function spriteGeo(rows, palette, size = 0.1, opts = {}) {
  return new VoxelSet().sprite(rows, palette, opts).build(size, opts);
}

// One shared material for every voxel model: vertex colours, flat faces.
let shared = null;
export function voxelMaterial() {
  if (!shared) shared = new THREE.MeshLambertMaterial({ vertexColors: true });
  return shared;
}
let glow = null;
// Unlit (emissive-looking) voxels: lava, neon, crystals, flames.
export function glowMaterial() {
  if (!glow) glow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
  return glow;
}
