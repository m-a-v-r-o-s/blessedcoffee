// The 16oz Blessed cup in 3D, ported from social/cup/cup.html (same measurements, label and light rig,
// lighter mesh). Drag to turn it: momentum carries the flick and it settles on the nearest printed panel.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { project, velocityTracker, springTo, prefersReducedMotion } from './spring.js';

// Panel centres in turns, measured off renders (social/cup/shots.mjs): logo, slogan, Mrs Rose.
export const PANELS = [0, 0.37, 0.69];

function buildCup(label) {
  const cup = new THREE.Group();
  const H = 132.8, RT = 45, RB = 31.2;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(RT, RB, H, 96, 1, true, Math.PI),
    new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.8 }),
  );
  body.position.y = H / 2;
  const paper = new THREE.MeshStandardMaterial({ color: 0xefebe4, roughness: 0.7 });
  const base = new THREE.Mesh(new THREE.CircleGeometry(RB, 64), paper);
  base.rotation.x = Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(RT, 64), paper);
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = H - 0.5;

  // Lid: sculpted top (height field) running into the traced side profile, as in cup.html.
  const rAt = (d) => RT - (RT - RB) * d / H;
  const RE = 41.5, RING = 24.1;
  const side = [[42.0, 22.8], [43.8, 16.6], [46.5, 15.3], [48.8, 14.5], [49.8, 11.4], [48.8, 8.3], [49.2, 7.4], [49.8, 3.5], [49.4, 0], [rAt(1), 0]];
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const top = (x, z, r) => {
    const s = -x, v = -z;
    let h = -2.2 * (1 - ss(31.2, 32, r));
    h += 4.6 * ss(5, 10, s);
    h -= 0.6 * ss(40.6, RE, r);
    const q = Math.pow(Math.pow(Math.abs(v) / 6, 4) + Math.pow(Math.abs(s - 36.5) / 2.5, 4), 0.25);
    h -= 9 * (1 - ss(0.85, 1, q));
    const dv = Math.hypot(s + 36, v);
    h += 0.7 * Math.exp(-(dv * dv) / 5) - 5 * (1 - ss(0.7, 1.1, dv));
    return RING + h;
  };
  const A = 240, NR = 90, cols = [], P = [], idx = [], per = NR + 1 + side.length;
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
  const lid = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: 0x08080a, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3, side: THREE.DoubleSide }));
  lid.position.y = H - 1;
  cup.add(body, base, cap, lid);
  return cup;
}

export async function mount(canvas, labelUrl, panelButtons) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.18;
  // LABEL rig from shots.mjs: wide key cone so the spot never draws a hard edge across the paper.
  const key = new THREE.SpotLight(0xfff1e0, 11000, 0, 0.6, 0.6, 1.2);
  key.position.set(-260, 300, 420);
  const rim = new THREE.DirectionalLight(0xffe2c0, 3);
  rim.position.set(300, 120, -300);
  scene.add(key, rim);

  const label = await new THREE.TextureLoader().loadAsync(labelUrl);
  label.colorSpace = THREE.SRGBColorSpace;
  label.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const cup = buildCup(label);
  scene.add(cup);

  // 'front' framing from shots.mjs, so the poster image and the live canvas line up.
  const camera = new THREE.PerspectiveCamera(24, 620 / 820, 20, 1400);
  camera.position.set(0, 150, 560);
  camera.lookAt(0, 72, 0);

  const size = () => {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  size();
  new ResizeObserver(size).observe(canvas);

  // Rotation is tracked in px of drag; one full turn = 2.4 canvas widths.
  const state = { x: 0, v: 0 };
  const perTurn = () => canvas.clientWidth * 2.4;
  const reduced = prefersReducedMotion();
  let stop, idleAt = 0, visible = false, dragging = false, t0 = performance.now();

  const draw = (now) => {
    const turns = state.x / perTurn();
    cup.rotation.y = turns * Math.PI * 2;
    cup.rotation.z = reduced ? 0 : Math.sin(now / 2400) * 0.03;
    renderer.render(scene, camera);
    const p = ((turns % 1) + 1) % 1;
    panelButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(Math.abs(p - PANELS[i]) < 0.06 || Math.abs(p - PANELS[i] - 1) < 0.06)));
  };

  // Idle spin while on screen and untouched: one turn every 26s.
  const loop = (now) => {
    const dt = Math.min(now - t0, 64) / 1000;
    t0 = now;
    if (visible && !dragging && !stop && !reduced && now > idleAt) state.x += (perTurn() / 26) * dt;
    if (visible) draw(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const settle = (targetPx, v = 0) => {
    stop?.();
    if (reduced) { state.x = targetPx; state.v = 0; stop = null; return; }
    state.v = v;
    stop = springTo(state, targetPx, { bounce: 0.2, onDone: () => { stop = null; idleAt = performance.now() + 4000; } });
  };
  const nearestPanelPx = (px) => {
    const turns = px / perTurn(), base = Math.floor(turns);
    let best = 0, bestD = Infinity;
    for (const k of [base - 1, base, base + 1]) for (const c of PANELS) {
      const d = Math.abs(k + c - turns);
      if (d < bestD) { bestD = d; best = k + c; }
    }
    return best * perTurn();
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
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!axis) {
      if (Math.hypot(dx, dy) < 10) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y') { canvas.releasePointerCapture(e.pointerId); dragging = false; idleAt = performance.now() + 2000; return; }
    }
    state.x = startPos + dx;
    vt.add(state.x);
  });
  const release = (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    canvas.releasePointerCapture(e.pointerId);
    dragging = false;
    if (axis !== 'x') { idleAt = performance.now() + 2000; return; }
    const v = vt.get();
    settle(nearestPanelPx(state.x + project(v)), v);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Buttons (and keyboard) turn to a panel the short way round.
  panelButtons.forEach((b, i) => b.addEventListener('click', () => {
    const turns = state.x / perTurn();
    const k = Math.round(turns - PANELS[i]);
    settle((k + PANELS[i]) * perTurn());
  }));

  draw(performance.now());
}

