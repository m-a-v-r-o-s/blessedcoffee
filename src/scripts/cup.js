// The 16oz Blessed cup in 3D, ported from social/cup/cup.html (same measurements and label), restaged as a
// studio product shot. Drag to turn it: momentum carries the flick and it settles on the nearest printed panel.
import * as THREE from 'three';
import { project, velocityTracker, springTo, prefersReducedMotion } from './spring.js';

// Panel centres in turns, measured off renders (social/cup/shots.mjs). Seams sit near 0.185 / 0.53 / 0.85.
export const PANELS = [0, 0.37, 0.69];
const H = 132.8, RT = 45, RB = 31.2;
// Label u for a cup turned t turns is 0.5 - t. The paper side seam goes on the scan's stitch at 0.5375 turns.
const SEAM_U = 0.9625;

// Paper grain as a tiling normal map: wrapped value noise, fibres a little longer than they are wide.
function grain(N = 256) {
  const hash = (i, j, s) => {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, cx, cy, s) => {
    const fx = x * cx, fy = y * cy, i = Math.floor(fx), j = Math.floor(fy);
    const u = (fx - i) ** 2 * (3 - 2 * (fx - i)), v = (fy - j) ** 2 * (3 - 2 * (fy - j));
    const r = (a, b) => hash(a % cx, b % cy, s);
    return (r(i, j) * (1 - u) + r(i + 1, j) * u) * (1 - v) + (r(i, j + 1) * (1 - u) + r(i + 1, j + 1) * u) * v;
  };
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x / N, py = y / N;
    h[y * N + x] = 0.5 * noise(px, py, 64, 20, 1) + 0.3 * noise(px, py, 128, 48, 2) + 0.2 * noise(px, py, 24, 64, 3);
  }
  const data = new Uint8Array(N * N * 4), at = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 3, dy = (at(x, y + 1) - at(x, y - 1)) * 3, l = Math.hypot(dx, dy, 1), o = (y * N + x) * 4;
    data[o] = (-dx / l * 0.5 + 0.5) * 255; data[o + 1] = (-dy / l * 0.5 + 0.5) * 255; data[o + 2] = (1 / l * 0.5 + 0.5) * 255; data[o + 3] = 255;
  }
  const t = new THREE.DataTexture(data, N, N);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 8);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// Wall as a lathe of columns (u as in CylinderGeometry, theta = PI + u * 2PI) so the side seam is a real
// step: the overlapping flap stands 0.35mm proud at its edge and tapers into the wall over 7mm.
function wall() {
  const FLAP = 7 / (2 * Math.PI * RT), cols = [];
  for (let i = 0; i <= 256; i++) {
    const u = i / 256;
    if (u > SEAM_U && u < SEAM_U + FLAP) continue;
    if (u > SEAM_U && cols.at(-1)[0] < SEAM_U) {
      cols.push([SEAM_U, 0]);
      for (let k = 0; k <= 8; k++) cols.push([SEAM_U + (k / 8) * FLAP, 0.35 * (1 - k / 8) ** 2]);
    }
    cols.push([u, 0]);
  }
  const P = [], UV = [], idx = [];
  for (const [u, lift] of cols) for (const y of [0, H]) {
    const th = Math.PI + u * 2 * Math.PI, r = RB + ((RT - RB) * y) / H + lift;
    P.push(r * Math.sin(th), y, r * Math.cos(th));
    UV.push(u, y / H);
  }
  for (let c = 0; c < cols.length - 1; c++) {
    const a = c * 2, b = a + 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Lid: sculpted top (height field) running into the traced side profile, as in cup.html, at a finer mesh,
// with a smoothed profile so the beads catch clean highlights, and a rounded lip around the sip slot.
function lid() {
  const rAt = (d) => RT - ((RT - RB) * d) / H;
  const RE = 41.5, RING = 24.1;
  const traced = [[42.0, 22.8], [43.8, 16.6], [46.5, 15.3], [48.8, 14.5], [49.8, 11.4], [48.8, 8.3], [49.2, 7.4], [49.8, 3.5], [49.4, 0]];
  const side = new THREE.CatmullRomCurve3(traced.map(([r, h]) => new THREE.Vector3(r, h, 0)), false, 'centripetal')
    .getPoints(72).map((p) => [p.x, p.y]);
  side.push([rAt(1), 0]);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const top = (x, z, r) => {
    const s = -x, v = -z;
    let h = -2.2 * (1 - ss(31.2, 32, r));
    h += 4.6 * ss(5, 10, s);
    h -= 0.6 * ss(40.6, RE, r);
    const q = Math.pow(Math.pow(Math.abs(v) / 6, 4) + Math.pow(Math.abs(s - 36.5) / 2.5, 4), 0.25);
    h -= 9 * (1 - ss(0.78, 1, q));
    h += 0.45 * Math.exp(-(((q - 1.06) / 0.07) ** 2));
    const dv = Math.hypot(s + 36, v);
    h += 0.7 * Math.exp(-(dv * dv) / 5) - 5 * (1 - ss(0.7, 1.1, dv));
    return RING + h;
  };
  const A = 432, NR = 110, cols = [], P = [], idx = [], per = NR + 1 + side.length;
  for (let i = 0; i <= NR; i++) cols.push(RE * Math.pow(i / NR, 0.85));
  for (let a = 0; a < A; a++) {
    const th = (a / A) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    for (const r of cols) P.push(r * c, top(r * c, r * s, r), r * s);
    for (const [r, h] of side) P.push(r * c, h, r * s);
  }
  for (let a = 0; a < A; a++) {
    const o = a * per, n = ((a + 1) % A) * per;
    for (let k = 0; k < per - 1; k++) idx.push(o + k, o + k + 1, n + k, n + k, o + k + 1, n + k + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({
    color: 0x0b0b0c, roughness: 0.36, clearcoat: 0.25, clearcoatRoughness: 0.3, side: THREE.DoubleSide,
  }));
  m.position.y = H - 1;
  return m;
}

function buildCup(label) {
  const cup = new THREE.Group();
  const body = new THREE.Mesh(wall(), new THREE.MeshStandardMaterial({
    map: label, roughness: 0.74, normalMap: grain(), normalScale: new THREE.Vector2(0.18, 0.18),
  }));
  const paper = new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.62 });
  const base = new THREE.Mesh(new THREE.CircleGeometry(RB, 64), paper);
  base.rotation.x = Math.PI / 2;
  // Rolled rim: the bead the lid snaps over, its lower half shows under the lid skirt.
  const lip = new THREE.Mesh(new THREE.TorusGeometry(RT + 1, 1.7, 16, 192), paper);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = H - 1.7;
  cup.add(body, base, lip, lid());
  return cup;
}

// Studio for the environment map: warm dark room, a big softbox top left, a strip light behind right
// for the rim, a dim fill card front right. Gives the satin lid its long highlights.
function studio() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x100c09, side: THREE.BackSide })));
  const card = (w, h, i, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfffaf4).multiplyScalar(i) }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  card(4, 3, 7, [-3, 3.5, 3]);
  card(0.8, 6, 5, [4, 0.5, -3]);
  card(4, 2, 1.2, [4, 0.5, 3.5]);
  return s;
}

// Contact shadow on the implied surface: tight dark core under the base, soft falloff, nudged away from the key.
const shadowMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec2 vP;
    void main(){
      float r = length(vP - vec2(6.0, 8.0));
      float a = 0.5 * (1.0 - smoothstep(24.0, 40.0, r)) + 0.42 * exp(-r * r / 3600.0);
      gl_FragColor = vec4(0.0, 0.0, 0.0, a);
    }`,
});

// Steam: two octaves of domain-warped noise drifting up a widening column. Scrolls forever, so it never loops
// visibly. Fades before the canvas top so the frame edge never clips it.
const steamMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uTime: { value: 0 }, uTop: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `precision highp float;
    uniform float uTime, uTop;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
    void main(){
      float y = vUv.y, t = uTime;
      float x = vUv.x - 0.5 + (fbm(vec2(y * 1.6 - t * 0.12, t * 0.07)) - 0.5) * 0.55 * y;
      vec2 q = vec2(x * 3.2, y * 2.4 - t * 0.32);
      float n = fbm(q + vec2(fbm(q * 1.7 + t * 0.09), 0.0));
      float column = exp(-x * x / (0.002 + 0.03 * y));
      float fade = smoothstep(0.0, 0.2, y) * (1.0 - smoothstep(0.35, 0.95, y));
      float a = smoothstep(0.42, 0.8, n) * column * fade * (1.0 - smoothstep(0.86, 0.96, gl_FragCoord.y / uTop));
      gl_FragColor = vec4(vec3(1.0), a * 0.42);
    }`,
});

export async function mount(canvas, labelUrl) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  const reduced = prefersReducedMotion();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.32;
  // Key: soft-edged spot (full penumbra) so no edge crosses the label. Fill and rim stay low.
  const key = new THREE.SpotLight(0xfff8f0, 9500, 0, 0.55, 1, 1.2);
  key.position.set(-260, 300, 420);
  key.target.position.set(0, 70, 0);
  const fill = new THREE.DirectionalLight(0xe8eef8, 0.35);
  fill.position.set(320, 60, 260);
  const rim = new THREE.DirectionalLight(0xffead6, 3.2);
  rim.position.set(300, 140, -300);
  scene.add(key, key.target, fill, rim);

  const label = await new THREE.TextureLoader().loadAsync(labelUrl);
  label.colorSpace = THREE.SRGBColorSpace;
  label.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const tilt = new THREE.Group(), cup = buildCup(label);
  tilt.add(cup);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), shadowMat());
  floor.rotation.x = -Math.PI / 2;
  scene.add(tilt, floor);

  // 'front' framing from shots.mjs, so the poster image and the live canvas line up.
  const camera = new THREE.PerspectiveCamera(24, 620 / 820, 300, 900);
  camera.position.set(0, 150, 560);
  camera.lookAt(0, 72, 0);

  const steam = new THREE.Mesh(new THREE.PlaneGeometry(34, 46).translate(0, 23, 0), steamMat());
  steam.quaternion.copy(camera.quaternion);
  steam.visible = !reduced;
  const vent = new THREE.Object3D();
  vent.position.set(-36.5, H + 22, 0);
  cup.add(vent);
  scene.add(steam);

  let dirty = true;
  const size = () => {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    steam.material.uniforms.uTop.value = renderer.domElement.height;
    dirty = true;
  };
  size();
  new ResizeObserver(size).observe(canvas);

  // Rotation is tracked in px of drag; one full turn = 2.4 canvas widths.
  const state = { x: 0, v: 0 };
  const perTurn = () => canvas.clientWidth * 2.4;
  let stop, dragging = false;

  // Scroll turn: up to 0.07 turns either side while the section crosses the viewport, square to the
  // camera when centred. 0.07 keeps every panel well clear of a seam.
  const scrollTurn = () => {
    if (reduced) return 0;
    const r = canvas.getBoundingClientRect();
    const p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2);
    return -Math.max(-1, Math.min(1, p)) * 0.07;
  };

  // Desktop only: the cup leans a few degrees toward the pointer.
  const lean = { x: 0, z: 0, tx: 0, tz: 0 };
  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(), c = (v) => Math.max(-1, Math.min(1, v));
      lean.tx = c((e.clientY - r.top - r.height / 2) / r.height) * 0.07;
      lean.tz = -c((e.clientX - r.left - r.width / 2) / r.width) * 0.07;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { lean.tx = lean.tz = 0; });
  }

  // Render only while on screen. Under reduced motion nothing animates, so draw only after a change.
  let raf = 0, visible = false, last = performance.now();
  const v3 = new THREE.Vector3();
  const frame = (now) => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(now - last, 64) / 1000;
    last = now;
    if (reduced && !dirty) return;
    dirty = false;
    const k = 1 - Math.exp(-dt * 5);
    lean.x += (lean.tx - lean.x) * k;
    lean.z += (lean.tz - lean.z) * k;
    tilt.rotation.set(lean.x, 0, lean.z);
    cup.rotation.y = (state.x / perTurn() + scrollTurn()) * Math.PI * 2;
    if (steam.visible) {
      steam.material.uniforms.uTime.value = now / 1000;
      steam.position.copy(vent.getWorldPosition(v3));
    }
    renderer.render(scene, camera);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); }
  }).observe(canvas);

  const settle = (targetPx, v = 0) => {
    stop?.();
    dirty = true;
    if (reduced) { state.x = targetPx; state.v = 0; stop = null; return; }
    state.v = v;
    stop = springTo(state, targetPx, { bounce: 0.2, onDone: () => { stop = null; } });
  };
  // Nearest panel to where a flick would land, counting the scroll turn, so the panel ends up facing the camera.
  const nearestPanelPx = (px) => {
    const off = scrollTurn(), turns = px / perTurn() + off, base = Math.floor(turns);
    let best = 0, bestD = Infinity;
    for (const k of [base - 1, base, base + 1]) for (const c of PANELS) {
      const d = Math.abs(k + c - turns);
      if (d < bestD) { bestD = d; best = k + c; }
    }
    return (best - off) * perTurn();
  };

  const vt = velocityTracker();
  let sx, sy, startPos, axis;
  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0) return;
    stop?.(); stop = null;
    sx = e.clientX; sy = e.clientY; startPos = state.x; axis = null;
    vt.reset(); vt.add(state.x);
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || !canvas.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!axis) {
      if (Math.hypot(dx, dy) < 10) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y') { canvas.releasePointerCapture(e.pointerId); dragging = false; return; }
    }
    state.x = startPos + dx;
    vt.add(state.x);
    dirty = true;
  });
  const release = (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    canvas.releasePointerCapture(e.pointerId);
    dragging = false;
    if (axis !== 'x') return;
    const v = vt.get();
    settle(nearestPanelPx(state.x + project(v)), v);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}
