import * as THREE from 'three';

// The scene is drawn into a small render target (one texel = `pixel` screen
// pixels) and blown up with nearest filtering: big crunchy pixels and a tiny
// fill cost, which is most of why the game runs so fast.
//
// The final pass also does: a soft bloom around bright things (lava, neon,
// gold), a per-world colour grade, the noir look of Shadow City (black and
// white, except gold), the classic monochrome desert (luminance snapped to
// four greys), the colour explosion, flashes, a vignette and the underwater
// wobble.

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BRIGHT = `
uniform sampler2D tSrc; uniform float uThreshold; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(uThreshold, 1.0, l), 1.0);
}`;
const BLUR = `
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 s = texture2D(tSrc, vUv).rgb * 0.227;
  s += texture2D(tSrc, vUv + uDir * 1.385).rgb * 0.316;
  s += texture2D(tSrc, vUv - uDir * 1.385).rgb * 0.316;
  s += texture2D(tSrc, vUv + uDir * 3.231).rgb * 0.070;
  s += texture2D(tSrc, vUv - uDir * 3.231).rgb * 0.070;
  gl_FragColor = vec4(s, 1.0);
}`;

const FS = `
uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec2 uRes;
uniform float uColor; uniform vec2 uCenter; uniform float uRadius; uniform float uAspect;
uniform float uFlash; uniform vec3 uFlashColor; uniform float uVignette; uniform float uWobble; uniform float uTime;
uniform float uDark; uniform float uInvert;
uniform float uBloom; uniform float uSat; uniform float uContrast; uniform vec3 uTint; uniform float uNoir;
varying vec2 vUv;
vec3 mono(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 g = l < 0.42 ? vec3(0.325) : l < 0.66 ? vec3(0.55) : l < 0.86 ? vec3(0.78) : vec3(0.969);
  return g;
}
// how "gold" a colour is: warm yellow-orange hue, saturated and not dark
float goldness(vec3 c){
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
  float hue = 0.0;
  if (mx - mn > 0.001) {
    if (mx == c.r) hue = mod((c.g - c.b) / (mx - mn), 6.0) / 6.0;
    else if (mx == c.g) hue = ((c.b - c.r) / (mx - mn) + 2.0) / 6.0;
    else hue = ((c.r - c.g) / (mx - mn) + 4.0) / 6.0;
  }
  float h = 1.0 - smoothstep(0.045, 0.075, abs(hue - 0.1));
  return h * smoothstep(0.3, 0.5, sat) * smoothstep(0.25, 0.45, mx);
}
void main(){
  vec2 uv = vUv;
  if (uWobble > 0.0) {
    uv.x += sin(uv.y * 18.0 + uTime * 2.0) * 0.0025 * uWobble;
    uv.y += cos(uv.x * 14.0 + uTime * 1.6) * 0.0018 * uWobble;
  }
  // snap to the low-res grid so wobble stays pixelated
  uv = (floor(uv * uRes) + 0.5) / uRes;
  vec3 c = texture2D(tScene, uv).rgb;
  // bloom (only once the world has colour)
  c += texture2D(tBloom, vUv).rgb * uBloom * uColor;
  // grade
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, uSat);
  c = (c - 0.5) * uContrast + 0.5;
  c *= uTint;
  if (uNoir > 0.0) {
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 g = vec3(pow(clamp(l, 0.0, 1.0), 1.15)) * vec3(0.94, 0.97, 1.06);
    c = mix(c, mix(g, c, goldness(c)), uNoir);
  }
  c = clamp(c, 0.0, 1.0);
  vec3 m = mono(c);
  float k = uColor;
  if (uRadius >= 0.0) {
    vec2 d = (vUv - uCenter) * vec2(uAspect, 1.0);
    float r = length(d);
    float edge = uRadius - r;
    k = step(0.0, edge);
    // a bright ring riding the edge of the explosion
    float ring = smoothstep(0.06, 0.0, abs(edge)) ;
    c = mix(c, vec3(1.0, 0.95, 0.7), ring * 0.85);
  }
  vec3 col = mix(m, c, k);
  if (uInvert > 0.0) col = mix(col, vec3(1.0) - col, uInvert);
  vec2 q = vUv - 0.5;
  float v = 1.0 - dot(q, q) * uVignette;
  col *= v;
  if (uDark > 0.0) col *= 1.0 - uDark * smoothstep(0.25, 0.75, length(q * vec2(uAspect, 1.0)));
  col = mix(col, uFlashColor, uFlash);
  gl_FragColor = vec4(col, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.pixel = 3;
    this.rt = new THREE.WebGLRenderTarget(4, 4, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
    });
    const soft = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.bloomA = new THREE.WebGLRenderTarget(4, 4, soft);
    this.bloomB = new THREE.WebGLRenderTarget(4, 4, soft);
    this.uniforms = {
      tScene: { value: this.rt.texture }, tBloom: { value: this.bloomA.texture }, uRes: { value: new THREE.Vector2(4, 4) },
      uColor: { value: 0 }, uCenter: { value: new THREE.Vector2(0.3, 0.4) }, uRadius: { value: -1 }, uAspect: { value: 1 },
      uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color('#ffffff') }, uVignette: { value: 0.25 },
      uWobble: { value: 0 }, uTime: { value: 0 }, uDark: { value: 0 }, uInvert: { value: 0 },
      uBloom: { value: 0 }, uSat: { value: 1 }, uContrast: { value: 1 }, uTint: { value: new THREE.Color('#ffffff') }, uNoir: { value: 0 },
    };
    this.brightMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: BRIGHT, uniforms: { tSrc: { value: this.rt.texture }, uThreshold: { value: 0.8 } }, depthTest: false, depthWrite: false });
    this.blurMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: BLUR, uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
    this.finalMat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: this.uniforms, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.finalMat);
    this.qScene = new THREE.Scene();
    this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad.frustumCulled = false;
  }

  // per-world look (see `light` in themes.js)
  setLook(L = {}) {
    const g = L.grade || {};
    this.uniforms.uBloom.value = L.bloom ?? 0;
    this.uniforms.uSat.value = g.sat ?? 1;
    this.uniforms.uContrast.value = g.contrast ?? 1;
    this.uniforms.uTint.value.set(g.tint || '#ffffff');
    this.uniforms.uNoir.value = L.noir || 0;
  }

  setSize(w, h) {
    const rw = Math.max(64, Math.round(w / this.pixel));
    const rh = Math.max(48, Math.round(h / this.pixel));
    this.rt.setSize(rw, rh);
    const bw = Math.max(32, Math.round(rw / 2)), bh = Math.max(24, Math.round(rh / 2));
    this.bloomA.setSize(bw, bh);
    this.bloomB.setSize(bw, bh);
    this.bloomRes = [bw, bh];
    this.uniforms.uRes.value.set(rw, rh);
    this.uniforms.uAspect.value = w / h;
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.qScene, this.qCam);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    if (this.uniforms.uBloom.value > 0 && this.uniforms.uColor.value > 0) {
      const [bw, bh] = this.bloomRes;
      this.pass(this.brightMat, this.bloomA);
      for (let i = 0; i < 2; i++) {
        const s = 1 + i;
        this.blurMat.uniforms.tSrc.value = this.bloomA.texture;
        this.blurMat.uniforms.uDir.value.set(s / bw, 0);
        this.pass(this.blurMat, this.bloomB);
        this.blurMat.uniforms.tSrc.value = this.bloomB.texture;
        this.blurMat.uniforms.uDir.value.set(0, s / bh);
        this.pass(this.blurMat, this.bloomA);
      }
    }
    this.pass(this.finalMat, null);
  }
}
