import * as THREE from 'three';

// The scene is drawn into a small render target (one texel = `pixel` screen
// pixels) and blown up with nearest filtering: big crunchy pixels and a tiny
// fill cost, which is most of why the game runs so fast.
//
// The final pass also does the classic monochrome look (luminance snapped to
// four greys), the colour explosion (a circle of colour bursting out from the
// dino), flashes, a vignette and the underwater wobble.

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `
uniform sampler2D tScene; uniform vec2 uRes;
uniform float uColor; uniform vec2 uCenter; uniform float uRadius; uniform float uAspect;
uniform float uFlash; uniform vec3 uFlashColor; uniform float uVignette; uniform float uWobble; uniform float uTime;
uniform float uDark; uniform float uInvert;
varying vec2 vUv;
vec3 mono(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 g = l < 0.42 ? vec3(0.325) : l < 0.66 ? vec3(0.55) : l < 0.86 ? vec3(0.78) : vec3(0.969);
  return g;
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
    this.uniforms = {
      tScene: { value: this.rt.texture }, uRes: { value: new THREE.Vector2(4, 4) },
      uColor: { value: 0 }, uCenter: { value: new THREE.Vector2(0.3, 0.4) }, uRadius: { value: -1 }, uAspect: { value: 1 },
      uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color('#ffffff') }, uVignette: { value: 0.25 },
      uWobble: { value: 0 }, uTime: { value: 0 }, uDark: { value: 0 }, uInvert: { value: 0 },
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: this.uniforms, depthTest: false, depthWrite: false }));
    this.qScene = new THREE.Scene();
    this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad.frustumCulled = false;
  }

  setSize(w, h) {
    const rw = Math.max(64, Math.round(w / this.pixel));
    const rh = Math.max(48, Math.round(h / this.pixel));
    this.rt.setSize(rw, rh);
    this.uniforms.uRes.value.set(rw, rh);
    this.uniforms.uAspect.value = w / h;
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  }
}
