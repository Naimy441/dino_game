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
  sprite(rows, palette, { ox = 0, oy = 0, oz = 0, inflate = 2, depth = 1, maxHalf = 4 } = {}) {
    const H = rows.length;
    const W = Math.max(...rows.map((r) => r.length));
    const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && rows[y][x] && rows[y][x] !== '.' && rows[y][x] !== ' ';
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
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!filled(x, y)) continue;
        const ch = rows[y][x];
        const col = palette[ch];
        if (col === undefined) continue;
        const half = inflate ? Math.min(maxHalf, Math.max(depth, Math.round(dist[y * W + x] * inflate * 0.5))) : depth;
        const yy = oy + (H - 1 - y);
        for (let z = -half; z < half; z++) this.set(ox + x, yy, oz + z, col);
      }
    }
    return this;
  }
  // Build a geometry. `size` is the edge of one voxel in world units; the
  // model is centred on x and z (unless anchor says otherwise) with its lowest
  // voxel at y = 0.
  build(size = 0.1, { anchor = 'bottom', centerX = true } = {}) {
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
    for (const v of this.map.values()) {
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        if (this.has(v.x + F.n[0], v.y + F.n[1], v.z + F.n[2])) continue;
        const s = FACE_SHADE[f];
        const r = v.c.r * s, g = v.c.g * s, b = v.c.b * s;
        const corners = F.c.map(([a, b2, c]) => [(v.x + a - cx) * size, (v.y + b2 - cy) * size, (v.z + c - cz) * size]);
        for (const idx of [0, 1, 2, 0, 2, 3]) {
          pos.push(...corners[idx]);
          nor.push(...F.n);
          col.push(r, g, b);
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
