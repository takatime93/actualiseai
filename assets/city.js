// Lab: a detailed city of cubes, seen from above. Half-size cubes, varied building types, pavements,
// lane markings, crossings, street lamps, a river with embankments and boats, parks, flocks of birds,
// and lit windows at night. Only the outer shell of each building is built, so the cubes go where you can see them.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Every element with data-city-view gets its own camera on the one shared city:
// hero (aerial orbit), road (street level, moving along a road) and orbit (slow aerial turn).
const VIEWS = [...document.querySelectorAll('[data-city-view]')];
const host = VIEWS[0] || document.querySelector('.city-3d');

const QP = new URLSearchParams(location.search), SHOT = QP.get('shot');
const SHOTS = {
  aerial: { az: 0.7, el: 0.84, r: 1.2, look: [0, 1.5, 0] },
  low:    { az: 2.45, el: 0.24, r: 1.0, look: [0, 5, 0] },
  tower:  { az: 1.05, el: 0.52, r: 0.5, look: [2, 9, 0] },
};
if (SHOT) {
  const r = document.documentElement; r.classList.add('shot');
  if (QP.get('concept')) r.dataset.concept = QP.get('concept');
  if (QP.get('theme')) r.dataset.theme = QP.get('theme');
}
if (host) start();

function start() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = !SHOT && matchMedia('(max-width: 760px)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !SHOT, preserveDrawingBuffer: !!SHOT, powerPreference: 'high-performance' }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.shadowMap.enabled = !small; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const shared = !SHOT;
  // the WebGL canvas stays off-screen; every view box gets its own 2D canvas that the frame is copied into,
  // so no canvas ever covers the rest of the page
  if (!shared) host.appendChild(renderer.domElement);
  (VIEWS.length ? VIEWS : [host]).forEach((v) => v.classList.add('live'));

  let s0 = 20261015;
  const rnd = () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const N = small ? 54 : 72, H = N / 2, P = 9, V = 2, u = 1 / V;   // tiles; V cubes per tile
  const BUDGET = small ? 12000 : 40000;                              // building cubes
  const kind = new Uint8Array(N * N);                               // 0 lot, 1 road, 2 water, 3 park
  const inMap = (x, z) => x >= -H && x < H && z >= -H && z < H;
  const at = (x, z) => inMap(x, z) ? kind[(z + H) * N + (x + H)] : 1;
  const set = (x, z, v) => { kind[(z + H) * N + (x + H)] = v; };
  const mod = (a) => ((a % P) + P) % P;
  const river = (x) => 13 * Math.sin(x / 13 + 0.6) + 1.5 * Math.sin(x / 5.3) - 5;
  for (let z = -H; z < H; z++) for (let x = -H; x < H; x++) {
    const w = Math.abs(z - river(x)) < 2.6, road = mod(x) < 2 || mod(z) < 2;
    set(x, z, road && !(w && mod(z) < 2) ? 1 : w ? 2 : 0);
  }

  // ---------- blocks and lots
  const lots = [], trees = [];
  const tree = (x, z, big) => trees.push([x, z, big]);
  for (let bz = -H; bz < H; bz += P) for (let bx = -H; bx < H; bx += P) {
    const x0 = bx + 2, z0 = bz + 2, x1 = Math.min(bx + P, H), z1 = Math.min(bz + P, H);
    if (x1 - x0 < 2 || z1 - z0 < 2) continue;
    let water = 0; for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) if (at(x, z) === 2) water++;
    const d = Math.hypot((x0 + x1) / 2, (z0 + z1) / 2);
    if (water > 4 || rnd() < 0.12 + d / N * 0.16) {
      for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) if (at(x, z) === 0) { set(x, z, 3); if (rnd() < 0.42) tree(x + rnd() * 0.6 + 0.2, z + rnd() * 0.6 + 0.2, rnd() < 0.35); }
      continue;
    }
    const rects = [[x0, z0, x1, z1]];
    for (let n = 0; n < 1 + (rnd() * 3 | 0); n++) {
      rects.sort((a, b) => (b[2] - b[0]) * (b[3] - b[1]) - (a[2] - a[0]) * (a[3] - a[1]));
      const [a0, b0, a1, b1] = rects.shift();
      if (a1 - a0 >= b1 - b0 && a1 - a0 > 3) { const m = a0 + 2 + (rnd() * (a1 - a0 - 3) | 0); rects.push([a0, b0, m, b1], [m, b0, a1, b1]); }
      else if (b1 - b0 > 3) { const m = b0 + 2 + (rnd() * (b1 - b0 - 3) | 0); rects.push([a0, b0, a1, m], [a0, m, a1, b1]); }
      else rects.push([a0, b0, a1, b1]);
    }
    for (const r of rects) {
      let ok = true; for (let z = r[1]; z < r[3]; z++) for (let x = r[0]; x < r[2]; x++) if (at(x, z) !== 0) ok = false;
      if (!ok) continue;
      const dd = Math.hypot((r[0] + r[2]) / 2, (r[1] + r[3]) / 2), core = Math.exp(-((dd / (N * 0.27)) ** 2));
      const w = r[2] - r[0], dz = r[3] - r[1], roll = rnd();
      let type = core > 0.6 ? (roll < 0.5 ? 'tower' : roll < 0.75 ? 'twin' : 'step') : core > 0.25 ? (roll < 0.45 ? 'court' : roll < 0.8 ? 'tower' : 'step') : (roll < 0.55 ? 'low' : 'court');
      if (type === 'court' && (w < 3 || dz < 3)) type = 'tower';
      if (type === 'twin' && Math.max(w, dz) < 3) type = 'tower';
      const h = (2 + 52 * Math.pow(core, 1.6)) * (0.6 + rnd() * 0.85) * (core > 0.45 && rnd() < 0.22 ? 1.9 : 1);
      lots.push({ r, X0: r[0] * V, Z0: r[1] * V, X1: r[2] * V, Z1: r[3] * V, h, type, d: dd, tone: rnd(), podium: 2 + (rnd() * 4 | 0), spire: rnd() < 0.35, seed: rnd() });
    }
  }
  // street trees
  for (let z = -H; z < H; z++) for (let x = -H; x < H; x++) if (at(x, z) === 1 && (x + z) % 3 === 0 && rnd() < 0.2) {
    // on the pavement strip just inside the block, never on the road
    const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([a, b]) => at(x + a, z + b) === 0);
    if (side) tree(x + 0.5 + side[0] * 0.75, z + 0.5 + side[1] * 0.75, false);
  }

  // ---------- building shapes: a height for every column of cubes in a lot
  function heights(l, k) {
    const w = l.X1 - l.X0, d = l.Z1 - l.Z0, hm = new Int16Array(w * d), H0 = Math.max(2, Math.round(l.h * k));
    // a pavement: buildings step back one cube from any side that faces a street, park or the river
    const pw = at(l.r[0] - 1, l.r[1]) !== 0, pe = at(l.r[2], l.r[1]) !== 0, pn = at(l.r[0], l.r[1] - 1) !== 0, ps = at(l.r[0], l.r[3]) !== 0;
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
      if ((pw && i === 0) || (pe && i === w - 1) || (pn && j === 0) || (ps && j === d - 1)) { hm[j * w + i] = 0; continue; }
      const e = Math.min(i, j, w - 1 - i, d - 1 - j);
      let h = 0;
      if (l.type === 'tower') { const i1 = w > 6 && d > 6 ? 2 : 1; h = e < i1 ? Math.min(l.podium, H0) : e < i1 + 1 && w > 5 && d > 5 ? H0 - 3 : H0; }
      else if (l.type === 'twin') { const long = w >= d, t = long ? i : j, L = long ? w : d, mid = Math.floor(L / 2); h = e < 1 ? Math.min(l.podium, H0) : Math.abs(t - mid + 0.5) < 1 ? Math.min(l.podium, H0) : (t < mid ? H0 : Math.round(H0 * 0.78)); }
      else if (l.type === 'step') h = Math.max(1, Math.min(H0, Math.round(l.podium + e * H0 / Math.max(2, Math.min(w, d) / 2))));
      else if (l.type === 'court') h = e < 2 ? Math.max(3, Math.min(14, Math.round(H0 * 0.55))) : 0;
      else { const ci = Math.floor(i / 3), cj = Math.floor(j / 3); h = (i % 3 === 2 || j % 3 === 2) ? 0 : 2 + ((ci * 7 + cj * 13 + (l.seed * 10 | 0)) % 3); }
      hm[j * w + i] = h;
    }
    return { hm, w, d, H0 };
  }
  function shell(l, k, out) {
    const { hm, w, d, H0 } = heights(l, k); let n = 0;
    const hAt = (i, j) => (i < 0 || j < 0 || i >= w || j >= d) ? 0 : hm[j * w + i];
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
      const hc = hm[j * w + i];
      const low = Math.min(hAt(i - 1, j), hAt(i + 1, j), hAt(i, j - 1), hAt(i, j + 1));
      for (let y = 0; y < hc; y++) if (y === hc - 1 || y >= low) {
        n++;
        if (out) out.push([(l.X0 + i + 0.5) * u, y, (l.Z0 + j + 0.5) * u, l, y < hc - 1 && ((i * 31 + j * 17 + y * 7 + (l.seed * 1000 | 0)) % 23 === 0) ? 3 : 0]);
      }
      if (l.type === 'court' && hc === 0 && out && i > 1 && j > 1 && i < w - 2 && j < d - 2 && ((i + j) % 4 === 0)) tree((l.X0 + i + 0.5) * u, (l.Z0 + j + 0.5) * u, false);
    }
    if (l.type === 'tower' && l.spire && H0 > 18 && w > 3 && d > 3) {
      const cx = l.X0 + Math.floor(w / 2), cz = l.Z0 + Math.floor(d / 2);
      for (let y = H0; y < H0 + 5; y++) { n++; if (out) out.push([(cx + 0.5) * u, y, (cz + 0.5) * u, l, 7]); }
    }
    return n;
  }
  // find the height scale that fills the cube budget
  let lo = 0.05, hi = 3;
  for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2, c = lots.reduce((a, l) => a + shell(l, m, null), 0); if (c > BUDGET) hi = m; else lo = m; }
  // the really tall towers are held down: the two supertalls to 64%, the next tier to 80%
  const tops = lots.filter((l) => l.type !== 'low' && l.type !== 'court'), hmax = Math.max(...tops.map((l) => l.h));
  tops.forEach((l) => { if (l.h > hmax * 0.7) l.h *= 0.64; else if (l.h > hmax * 0.48) l.h *= 0.8; });
  const cubes = [];
  lots.forEach((l) => shell(l, lo, cubes));
  const nBuild = cubes.length;
  for (const [x, z, big] of trees) {
    for (let y = 0; y < (big ? 3 : 2); y++) cubes.push([x, y, z, null, 1]);
    const r = big ? 2 : 1, top = big ? 3 : 2;
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = 0; c < (big ? 3 : 2); c++) {
      if (a * a + b * b + (c - 0.5) * (c - 0.5) * 1.6 <= r * r + 0.6 && rnd() < 0.9) cubes.push([x + a * u * 0.9, top + c, z + b * u * 0.9, null, 2]);
    }
  }
  // embankments along the river
  for (let x = -H; x < H; x += u) {
    const zc = river(x + u / 2);
    for (const side of [-1, 1]) { const z = zc + side * 2.55; if (at(Math.floor(x), Math.floor(z)) !== 1) cubes.push([x + u / 2, 0, z, null, 6]); }
  }
  host.dataset.cubes = String(cubes.length);

  // ---------- scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 700);
  const root = document.documentElement;
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim() || '#888';
  scene.fog = new THREE.Fog(0x000000, 80, 220);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445066, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-40, 75, 28);
  sun.castShadow = !small; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -H - 10, right: H + 10, top: H + 10, bottom: -H - 10, near: 1, far: 300 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.015; scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(N * 4, N * 4), new THREE.MeshStandardMaterial({ roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const inst = (geo, mat, n, shadow) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.count = n; if (shadow && !small) { m.castShadow = true; m.receiveShadow = true; } scene.add(m); return m; };

  // ground tiles: roads, pavements, lawns, water
  const flat = [];
  for (let z = -H; z < H; z++) for (let x = -H; x < H; x++) flat.push([x, z, at(x, z)]);
  const tiles = inst(new THREE.BoxGeometry(1, 0.06, 1), new THREE.MeshStandardMaterial({ roughness: 0.95 }), flat.length, false);
  tiles.receiveShadow = !small;
  flat.forEach(([x, z, v], i) => { m4.compose(v3.set(x + 0.5, v === 2 ? -0.08 : v === 1 ? -0.01 : 0.03, z + 0.5), q, sc); tiles.setMatrixAt(i, m4); });

  // lane markings and crossings
  const marks = [];
  for (let p = -H; p < H; p += P) for (let t = -H; t < H; t += 1) {
    if (mod(t) >= 2) { if (at(p, t) === 1 && t % 2 === 0) marks.push([p + 1, t + 0.5, 0.06, 0.5]); if (at(t, p) === 1 && t % 2 === 0) marks.push([t + 0.5, p + 1, 0.5, 0.06]); }
  }
  for (let px = -H; px < H; px += P) for (let pz = -H; pz < H; pz += P) for (let s = 0; s < 4; s++) {
    if (at(px, pz) !== 1) continue;
    for (let k = 0; k < 2; k++) { marks.push([px + 0.25 + s * 0.5, pz + 2.25 + k * 0, 0.22, 0.4]); marks.push([px + 2.25, pz + 0.25 + s * 0.5, 0.4, 0.22]); }
  }
  const markMesh = inst(new THREE.BoxGeometry(1, 0.03, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), marks.length, false);
  marks.forEach(([x, z, w, d], i) => { m4.compose(v3.set(x, 0.035, z), q, sc.set(w, 1, d)); markMesh.setMatrixAt(i, m4); }); sc.set(1, 1, 1);

  // street lamps
  const lamps = [];
  for (let p = -H; p < H; p += P) for (let t = -H + 3; t < H; t += 3) {
    if (at(p - 1, t) === 0 || at(p - 1, t) === 3) lamps.push([p - 0.1, t + 0.5]);
    if (at(t, p + 2) === 0 || at(t, p + 2) === 3) lamps.push([t + 0.5, p + 2.1]);
  }
  const posts = inst(new THREE.BoxGeometry(0.08, 1.1, 0.08), new THREE.MeshStandardMaterial({ roughness: 0.6 }), lamps.length, true);
  const heads = inst(new THREE.BoxGeometry(0.22, 0.1, 0.22), new THREE.MeshBasicMaterial(), lamps.length, false);
  lamps.forEach(([x, z], i) => { m4.compose(v3.set(x, 0.55, z), q, sc); posts.setMatrixAt(i, m4); m4.compose(v3.set(x, 1.12, z), q, sc); heads.setMatrixAt(i, m4); });

  // the city: one mesh for lit materials, one unlit mesh for glowing windows
  const box = new THREE.BoxGeometry(u * 0.92, u * 0.92, u * 0.92);
  const lit = cubes.filter((c) => c[4] !== 3 && c[4] !== 1 && c[4] !== 2), glow = cubes.filter((c) => c[4] === 3), leafy = cubes.filter((c) => c[4] === 1 || c[4] === 2);
  let paintStreet = null;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.06 });
  // street level: every cube face reads as four smaller cubes (bevelled 2x2 cells with gaps)
  const fineTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#6c6c6c'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i * 64 + 2, y = j * 64 + 2, w = 60;
      g.fillStyle = '#f4f4f4'; g.fillRect(x, y, w, w);
      g.fillStyle = '#ffffff'; g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, w);
      g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x, y + w - 3, w, 3); g.fillRect(x + w - 3, y, 3, w);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  const fineMat = mat.clone(); fineMat.map = fineTex; fineMat.bumpMap = fineTex; fineMat.bumpScale = 1.2;
  const city = inst(box, mat, lit.length, true); city.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const treeMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0 });
  const trees3d = inst(box, treeMat, leafy.length, true); trees3d.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const winMat = new THREE.MeshBasicMaterial();
  const fineWin = new THREE.MeshBasicMaterial({ map: fineTex });
  const wins = inst(box, winMat, glow.length, false); wins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // traffic and boats
  const lanes = [];
  // no traffic on the avenue the street camera drives (cross streets keep theirs)
  for (let p = -H; p < H; p += P) { if (p !== 0) lanes.push({ ax: 'x', c: p + 0.5, dir: 1 }, { ax: 'x', c: p + 1.5, dir: -1 }); lanes.push({ ax: 'z', c: p + 0.5, dir: 1 }, { ax: 'z', c: p + 1.5, dir: -1 }); }
  const CARS = small ? 110 : 320, BOATS = small ? 4 : 9;
  const cars = inst(new THREE.BoxGeometry(0.34, 0.2, 0.34), new THREE.MeshBasicMaterial(), CARS, false);
  const car = Array.from({ length: CARS }, () => ({ l: lanes[rnd() * lanes.length | 0], p: rnd() * N - H, v: 0.015 + rnd() * 0.03 }));
  const boats = inst(new THREE.BoxGeometry(1.2, 0.22, 0.42), new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOATS, true);
  const boat = Array.from({ length: BOATS }, (_, i) => ({ p: rnd() * N - H, v: (0.01 + rnd() * 0.02) * (i % 2 ? 1 : -1), off: (i % 2 ? 0.8 : -0.8) }));

  // birds: three loose flocks circling above the city, two flapping wings each
  const FLOCKS = small ? 2 : 3, PER = small ? 9 : 14, BIRDS = FLOCKS * PER;
  const wingMat = new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide });
  const wings = inst(new THREE.BoxGeometry(0.5, 0.03, 0.2), wingMat, BIRDS * 2, false);
  const flock = Array.from({ length: FLOCKS }, (_, f) => ({ r: H * (0.35 + 0.25 * f), y: 11 + f * 3.5, w: (0.05 + rnd() * 0.03) * (f % 2 ? 1 : -1), ph: rnd() * 6.28 }));
  const bird = Array.from({ length: BIRDS }, (_, i) => ({ f: i / PER | 0, ox: (rnd() - 0.5) * 6, oy: (rnd() - 0.5) * 1.6, oz: (rnd() - 0.5) * 4 - (i % PER) * 0.35, flap: rnd() * 6.28, rate: 7 + rnd() * 4, wob: rnd() * 6.28 }));
  const dummy = new THREE.Object3D(), wing = new THREE.Object3D(); dummy.add(wing);
  function birds(time) {
    for (let i = 0; i < BIRDS; i++) {
      const b = bird[i], F = flock[b.f], a = F.ph + time * F.w;
      const cx = Math.cos(a) * F.r, cz = Math.sin(a) * F.r, hx = -Math.sin(a) * Math.sign(F.w), hz = Math.cos(a) * Math.sign(F.w);
      const sx = -hz, sz = hx;   // side vector
      const wob = Math.sin(time * 0.7 + b.wob);
      dummy.position.set(cx + sx * b.ox + hx * b.oz + wob * 0.4, F.y + b.oy + Math.sin(time * 1.3 + b.wob) * 0.5, cz + sz * b.ox + hz * b.oz);
      dummy.rotation.set(0, Math.atan2(hx, hz), 0); dummy.rotateZ(-0.35 * Math.sign(F.w));
      const flap = Math.sin(time * b.rate + b.flap) * 0.7 + 0.15;
      for (const side of [-1, 1]) {
        wing.position.set(side * 0.24, 0, 0); wing.rotation.set(0, 0, side * flap);
        dummy.updateMatrixWorld(true); wings.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), wing.matrixWorld);
      }
    }
    wings.instanceMatrix.needsUpdate = true;
  }
  birds(0);

  function paint() {
    // Punk is a night city: lit windows in acid, traffic in hot pink
    const punk = root.dataset.theme === 'punk', dark = root.dataset.theme !== 'light', cobalt = root.dataset.concept === 'cobalt';
    const fg = new THREE.Color(css('--fg')), bg = new THREE.Color(css('--bg')), acc = new THREE.Color(css('--accent'));
    const raised = new THREE.Color(css('--raised')), line = new THREE.Color(css('--line'));
    scene.fog.color.copy(bg); ground.material.color.copy(raised);
    renderer.setClearColor(bg, SHOT ? 1 : 0); renderer.autoClear = !shared;
    // trees are green in every concept: nature is the one colour the city keeps
    const leaf = new THREE.Color(dark ? (cobalt ? '#4FBF6A' : '#56B567') : (cobalt ? '#3A9A52' : '#3F9150')), bark = new THREE.Color(dark ? '#5B4A3C' : '#6E5A47');
    const warm = punk ? acc.clone() : cobalt ? new THREE.Color('#FFFFFF') : new THREE.Color(dark ? '#F3E3B5' : '#46538A');
    const building = fg.clone().lerp(bg, dark ? 0.14 : 0.06), c = new THREE.Color();
    mat.emissive.copy(fg).multiplyScalar(dark ? 0.08 : 0);
    lit.forEach((cb, i) => {
      const t = cb[4];
      if (t === 0) { c.copy(building).lerp(bg, cb[3].tone * (dark ? 0.45 : 0.32) + (cb[1] % 2) * 0.04); }
      else if (t === 7) c.copy(acc);
      else if (t === 1) c.copy(bark);
      else if (t === 2) c.copy(leaf).offsetHSL(((i * 37) % 11 - 5) * 0.006, 0, ((i * 53) % 9 - 4) * 0.02);
      else if (t === 6) c.copy(building).lerp(bg, 0.35);
      city.setColorAt(i, c);
    });
    city.instanceColor.needsUpdate = true;
    leafy.forEach((cb, i) => { trees3d.setColorAt(i, cb[4] === 1 ? bark : c.copy(leaf).offsetHSL(((i * 37) % 11 - 5) * 0.006, 0, ((i * 53) % 9 - 4) * 0.02)); });
    trees3d.instanceColor.needsUpdate = true; treeMat.emissive.copy(leaf).multiplyScalar(dark ? 0.06 : 0);
    winMat.color.copy(dark ? warm : building.clone().lerp(acc, 0.35));
    fineMat.emissive.copy(mat.emissive); fineWin.color.copy(winMat.color);
    if (paintStreet) paintStreet(building, bg, dark);
    const pave = raised.clone().lerp(fg, dark ? 0.06 : 0.04), lawn = leaf.clone().lerp(raised, dark ? 0.62 : 0.55), water = acc.clone().lerp(bg, dark ? 0.6 : 0.4);
    flat.forEach(([, , v], i) => tiles.setColorAt(i, v === 1 ? line : v === 2 ? water : v === 3 ? lawn : pave));
    tiles.instanceColor.needsUpdate = true;
    markMesh.material.color.copy(fg).lerp(line, dark ? 0.55 : 0.4);
    posts.material.color.copy(line).lerp(fg, 0.3);
    heads.material.color.copy(dark ? warm : line);
    cars.material.color.copy(punk ? new THREE.Color(css('--hot') || '#FF2E88') : dark ? warm : fg);
    boats.material.color.copy(fg).lerp(bg, 0.15);
    wingMat.color.copy(fg).lerp(bg, dark ? 0.1 : 0.2); wingMat.emissive.copy(fg).multiplyScalar(dark ? 0.25 : 0);
  }
  paint();
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-concept'] });

  const views = (VIEWS.length ? VIEWS : [host]).map((el) => {
    const v = { el, kind: el.dataset.cityView || 'hero', cam: new THREE.PerspectiveCamera(30, 1, 0.3, 700), on: true };
    if (shared) { v.cv = document.createElement('canvas'); v.cv.className = 'view-canvas'; v.cv.setAttribute('aria-hidden', 'true'); Object.assign(v.cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }); el.prepend(v.cv); v.ctx = v.cv.getContext('2d'); }
    return v;
  });
  views.forEach((v) => { new IntersectionObserver((es) => { v.on = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(v.el); });
  let W = 1, Hh = 1;
  function size() {
    if (shared) {
      const pr = renderer.getPixelRatio(); let mw = 1, mh = 1;
      views.forEach((v) => { const r = v.el.getBoundingClientRect(); v.w = Math.max(1, Math.round(r.width)); v.h = Math.max(1, Math.round(r.height)); v.cv.width = Math.round(v.w * pr); v.cv.height = Math.round(v.h * pr); mw = Math.max(mw, v.w); mh = Math.max(mh, v.h); });
      W = mw; Hh = mh;
    } else { const r = host.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height); }
    renderer.setSize(W, Hh, false);
  }
  size(); addEventListener('resize', size); const ro = new ResizeObserver(size); (shared ? views.map((v) => v.el) : [host]).forEach((e) => ro.observe(e));
  const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;

  // the street-level route: along the eastbound lane of the road nearest the centre
  const laneZ = Math.round(0 / P) * P + 0.5, roadFrom = -H * 0.62, roadTo = H * 0.62;
  // the street route stays inside the city: east along one lane, a U-turn, back along the other
  const seg = roadTo - roadFrom, turn = Math.PI * 0.5, loopLen = 2 * seg + 2 * turn;
  function route(d) {
    d = ((d % loopLen) + loopLen) % loopLen;
    if (d < seg) return [roadFrom + d, laneZ];
    d -= seg; if (d < turn) { const a = -Math.PI / 2 + d / turn * Math.PI; return [roadTo + Math.cos(a) * 0.5, laneZ + 0.5 + Math.sin(a) * 0.5]; }
    d -= turn; if (d < seg) return [roadTo - d, laneZ + 1];
    d -= seg; const a = Math.PI / 2 + d / turn * Math.PI; return [roadFrom + Math.cos(a) * 0.5, laneZ + 0.5 + Math.sin(a) * 0.5];
  }
  let roadD = 4;

  let t0 = performance.now() + (document.documentElement.classList.contains('intro-on') ? 5600 : 200);
  addEventListener('aai-skip', () => { t0 = performance.now() + 150; });
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const del = (cb) => (cb[3] ? cb[3].d / H * 1.5 + cb[3].tone * 0.4 : Math.hypot(cb[0], cb[2]) / H * 1.5 + 0.3) + cb[1] * 0.012;
  const dl = lit.map(del), dg = glow.map(del), dt = leafy.map(del);
  function place(mesh, arr, delays, t) {
    for (let i = 0; i < arr.length; i++) {
      const cb = arr[i], p = reduce ? 1 : ease((t - delays[i]) / 0.8), s = cb[4] === 2 ? 1.12 : 1;
      m4.compose(v3.set(cb[0], (cb[1] + 0.5) * u * p + 0.03 - (1 - p) * 1.5, cb[2]), q, sc.set(s * p, s * p, s * p)); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true; sc.set(1, 1, 1);
  }
  let risen = reduce || !!SHOT;
  place(city, lit, dl, risen ? 99 : 0); place(wins, glow, dg, risen ? 99 : 0); place(trees3d, leafy, dt, risen ? 99 : 0);

  // the street view gets its own build of the buildings along the avenue, with cubes half the size
  // (a quarter of a tile), the same shapes, only the faces you can see from the road, capped above the frame
  let sCity = null, sWins = null, sTrees = null, sProps = null, sSignals = null, paintProps = null;
  if (!small && !SHOT) {
    const uf = u / 2, CAP = 64, fine = [], fineGlow = [];
    for (const l of lots) {
      const zc = (l.r[1] + l.r[3]) / 2;
      if (l.r[3] < laneZ - 11 || l.r[1] > laneZ + 12 || l.r[2] < roadFrom - 12 || l.r[0] > roadTo + 12) continue;
      const { hm, w, d } = heights(l, lo), W2 = w * 2, D2 = d * 2, north = zc < laneZ;
      const fh = (i, j) => (i < 0 || j < 0 || i >= W2 || j >= D2) ? 0 : Math.min(CAP, hm[(j >> 1) * w + (i >> 1)] * 2);
      for (let j = 0; j < D2; j++) for (let i = 0; i < W2; i++) {
        const hc = fh(i, j); if (!hc) continue;
        const hw = fh(i - 1, j), he = fh(i + 1, j), hn = fh(i, j - 1), hs = fh(i, j + 1);
        for (let y = 0; y < hc; y++) {
          const roof = y === hc - 1, side = y >= hw || y >= he, toRoad = north ? y >= hs : y >= hn;
          if (!(roof || side || toRoad)) continue;
          const x = (l.X0 * 2 + i + 0.5) * uf, z = (l.Z0 * 2 + j + 0.5) * uf, yy = (y + 0.5) * uf + 0.03;
          const lit = !roof && ((i * 31 + j * 17 + y * 7 + (l.seed * 1000 | 0)) % 29 === 0);
          (lit ? fineGlow : fine).push([x, yy, z, l]);
        }
      }
    }
    // trees along the avenue in the same small cubes: a trunk and a rounded canopy shell
    const fineLeaf = [], fineBark = [];
    for (const [tx, tz, big] of trees) {
      if (Math.abs(tz - laneZ - 0.5) > 11 || tx < roadFrom - 12 || tx > roadTo + 12) continue;
      const r = big ? 1.05 : 0.72, cy = big ? 1.9 : 1.35, th = big ? 1.3 : 0.9;
      for (let y = 0; y < th; y += uf) fineBark.push([tx, y + uf / 2 + 0.03, tz]);
      for (let x = -r; x <= r; x += uf) for (let y = -r; y <= r; y += uf) for (let z = -r; z <= r; z += uf) {
        const dd = Math.sqrt(x * x + y * y * 1.2 + z * z);
        if (dd <= r && dd > r - uf * 1.6) fineLeaf.push([tx + x, cy + y, tz + z]);
      }
    }
    const fbox = new THREE.BoxGeometry(uf * 0.9, uf * 0.9, uf * 0.9);
    // street furniture on the two pavements of the avenue: traffic lights, shelters, benches, bins, bollards, planters
    const zN = laneZ - 0.75, zS = laneZ + 1.75, props = [], signals = [];
    const P_ = (x, y, z, sx, sy, sz, k) => props.push([x, y, z, sx, sy, sz, k]);
    const lampX = new Set(); for (let t = -H + 3; t < H; t += 3) lampX.add(Math.round((t + 0.5) * 10));
    const nearLamp = (x) => [...lampX].some((lx) => Math.abs(lx / 10 - x) < 0.45);
    for (let p = Math.floor((roadFrom - 9) / P) * P; p <= roadTo + 9; p += P) {
      // traffic lights on opposite corners of each crossing
      for (const [x, z, dz] of [[p - 0.2, zN, 1], [p + 2.2, zS, -1]]) {
        P_(x, 0.55, z, 0.06, 1.1, 0.06, 'metal'); P_(x, 1.08, z + dz * 0.18, 0.05, 0.05, 0.36, 'metal');
        P_(x, 0.92, z + dz * 0.36, 0.12, 0.3, 0.1, 'dark');
        signals.push([x - 0.07, 1.01, z + dz * 0.36, 'red'], [x - 0.07, 0.92, z + dz * 0.36, 'amber'], [x - 0.07, 0.83, z + dz * 0.36, 'green']);
      }
      for (let b = 0; b < 3; b++) P_(p + 2.2 + b * 0.22, 0.09, zN + 0.18, 0.05, 0.18, 0.05, 'metal');   // bollards
      if ((p / P) % 2 === 0) {   // a bus shelter on the north pavement
        const x = p + 5.5;
        P_(x, 0.64, zN, 1.2, 0.04, 0.42, 'metal'); P_(x, 0.36, zN - 0.19, 1.2, 0.52, 0.03, 'glass');
        P_(x - 0.58, 0.32, zN, 0.04, 0.64, 0.04, 'metal'); P_(x + 0.58, 0.32, zN, 0.04, 0.64, 0.04, 'metal');
        P_(x, 0.17, zN - 0.08, 0.9, 0.05, 0.16, 'wood');
      }
      for (const x of [p + 3.6, p + 7.4]) if (!nearLamp(x)) { P_(x, 0.16, zS + 0.12, 0.5, 0.05, 0.16, 'wood'); P_(x, 0.25, zS + 0.2, 0.5, 0.12, 0.03, 'wood'); P_(x - 0.2, 0.07, zS + 0.12, 0.04, 0.14, 0.14, 'metal'); P_(x + 0.2, 0.07, zS + 0.12, 0.04, 0.14, 0.14, 'metal'); }
      for (const [x, z] of [[p + 4.3, zN + 0.12], [p + 6.6, zS - 0.1]]) if (!nearLamp(x)) P_(x, 0.11, z, 0.13, 0.22, 0.13, 'dark');   // bins
      if (!nearLamp(p + 8.2)) { P_(p + 8.2, 0.07, zS + 0.05, 0.42, 0.14, 0.24, 'line'); for (let k = 0; k < 4; k++) P_(p + 8.05 + k * 0.1, 0.19, zS + 0.05, 0.09, 0.09, 0.09, 'leaf'); }   // planter
    }
    const unit = new THREE.BoxGeometry(1, 1, 1);
    sProps = inst(unit, new THREE.MeshStandardMaterial({ roughness: 0.6 }), props.length, true);
    props.forEach((p, i) => { m4.compose(v3.set(p[0], p[1] + 0.03, p[2]), q, sc.set(p[3], p[4], p[5])); sProps.setMatrixAt(i, m4); }); sc.set(1, 1, 1);
    sSignals = inst(new THREE.BoxGeometry(0.02, 0.07, 0.07), new THREE.MeshBasicMaterial(), signals.length, false);
    signals.forEach((g, i) => { m4.compose(v3.set(g[0], g[1] + 0.03, g[2]), q, sc); sSignals.setMatrixAt(i, m4); });
    paintProps = (fg, bg, acc, dark) => {
      const pal = { metal: fg.clone().lerp(bg, dark ? 0.45 : 0.35), dark: fg.clone().lerp(bg, dark ? 0.7 : 0.15), glass: acc.clone().lerp(bg, 0.5), wood: new THREE.Color(dark ? '#7A6048' : '#8A6B4E'), line: fg.clone().lerp(bg, 0.6), leaf: new THREE.Color(dark ? '#56B567' : '#3F9150') };
      props.forEach((p, i) => sProps.setColorAt(i, pal[p[6]])); sProps.instanceColor.needsUpdate = true;
      const lit = { red: new THREE.Color('#FF5A4E'), amber: new THREE.Color('#FFC24A'), green: new THREE.Color('#4CE38A') };
      signals.forEach((g, i) => sSignals.setColorAt(i, lit[g[3]])); sSignals.instanceColor.needsUpdate = true;
    };
    sCity = inst(fbox, mat, fine.length, true); sWins = inst(fbox, winMat, fineGlow.length, false);
    fine.forEach((c, i) => { m4.compose(v3.set(c[0], c[1], c[2]), q, sc); sCity.setMatrixAt(i, m4); });
    fineGlow.forEach((c, i) => { m4.compose(v3.set(c[0], c[1], c[2]), q, sc); sWins.setMatrixAt(i, m4); });
    sTrees = inst(fbox, treeMat, fineLeaf.length + fineBark.length, true);
    fineLeaf.concat(fineBark).forEach((c, i) => { m4.compose(v3.set(c[0], c[1], c[2]), q, sc); sTrees.setMatrixAt(i, m4); });
    sCity.visible = sWins.visible = sTrees.visible = sProps.visible = sSignals.visible = false;
    paintStreet = (building, bg, dark) => {
      const c = new THREE.Color();
      fine.forEach((f, i) => { c.copy(building).lerp(bg, f[3].tone * (dark ? 0.45 : 0.32) + ((f[1] / uf | 0) % 2) * 0.04); sCity.setColorAt(i, c); });
      sCity.instanceColor.needsUpdate = true;
      const dark2 = dark, leaf2 = new THREE.Color(dark2 ? '#56B567' : '#3F9150'), bark2 = new THREE.Color(dark2 ? '#5B4A3C' : '#6E5A47');
      for (let i = 0; i < fineLeaf.length + fineBark.length; i++) sTrees.setColorAt(i, i < fineLeaf.length ? c.copy(leaf2).offsetHSL(((i * 37) % 11 - 5) * 0.006, 0, ((i * 53) % 9 - 4) * 0.025) : bark2);
      sTrees.instanceColor.needsUpdate = true;
      if (paintProps) paintProps(new THREE.Color(css('--fg')), bg, new THREE.Color(css('--accent')), dark);
    };
    paint();
    host.dataset.street = String(fine.length + fineGlow.length + fineLeaf.length + fineBark.length);
  }

  let az = 0.7, orbitA = 2.2;
  function aim(v, t) {
    const cam = v.cam, r = v.el.getBoundingClientRect();
    cam.aspect = Math.max(0.2, r.width / Math.max(1, r.height));
    if (SHOT) { const S = SHOTS[SHOT]; const R = N * S.r; cam.position.set(Math.cos(S.az) * Math.cos(S.el) * R, Math.sin(S.el) * R, Math.sin(S.az) * Math.cos(S.el) * R); cam.lookAt(...S.look); v.fog = [R * 0.8, R * 2]; }
    else if (v.kind === 'road') {
      const [px, pz] = route(roadD);
      if (sCity) {
        // street level, driving the avenue; the view looks ahead along the route, so it swings round at each U-turn
        const [ax, az2] = route(roadD + 7);
        cam.fov = 54; cam.position.set(px, 0.62 + Math.sin(t * 1.9) * 0.012, pz);
        cam.lookAt(ax, 0.95 - sm.y * 0.5, az2 + sm.x * 1.6); v.fog = [10, 80];
      } else {
        // phones use the lighter city, so the street is filmed from above the trees with a long lens
        const [bx, bz] = route(roadD - 10), [ax, az2] = route(roadD + 26);
        cam.fov = 26; cam.position.set(bx, 6.2 + Math.sin(t * 0.9) * 0.08, bz);
        cam.lookAt(ax, 3.4 - sm.y * 1.4, az2 + sm.x * 4); v.fog = [20, 110];
      }
    } else if (v.kind === 'orbit') {
      const R = N * 1.1, el = 0.62, a = orbitA;
      cam.position.set(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R); cam.lookAt(0, 3, 0);
      v.fog = [R * 0.8, R * 2];
    } else {
      const scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.9)));
      // portrait screens: pull back so the whole city fits the width, and lift it into the top of the hero
      const portrait = cam.aspect < 0.95;
      const R = (portrait ? N * 2.5 : N * (small ? 1.4 : 1.2) * 1.4) - scroll * N * 0.35, el = 0.52 - sm.y * 0.04 - scroll * 0.2, a = az + sm.x * 0.16;
      cam.position.set(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R); cam.lookAt(0, 4 - scroll * 3, 0);
      if (portrait) cam.setViewOffset(r.width, r.height, 0, r.height * 0.2, r.width, r.height); else cam.clearViewOffset();
      v.fog = [R * 0.8, R * 2];
    }
    cam.updateProjectionMatrix();
    return r;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!SHOT && !views.some((v) => v.on)) return;
    const t = (now - t0) / 1000;
    if (!risen) { place(city, lit, dl, t); place(wins, glow, dg, t); place(trees3d, leafy, dt, t); renderer.shadowMap.needsUpdate = true; if (t > 5) { place(city, lit, dl, 99); place(wins, glow, dg, 99); place(trees3d, leafy, dt, 99); risen = true; } }
    sm.x += (mouse.x - sm.x) * 0.04; sm.y += (mouse.y - sm.y) * 0.04;
    if (!reduce) { az += 0.0004; orbitA += 0.0011; roadD += 0.022; }

    for (let i = 0; i < CARS; i++) {
      const c = car[i]; if (!reduce) c.p += c.v * c.l.dir; if (c.p > H) c.p -= N; if (c.p < -H) c.p += N;
      const x = c.l.ax === 'x' ? c.p : c.l.c, z = c.l.ax === 'x' ? c.l.c : c.p;
      m4.compose(v3.set(x, 0.12, z), q, sc); cars.setMatrixAt(i, m4);
    }
    cars.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < BOATS; i++) {
      const b = boat[i]; if (!reduce) b.p += b.v; if (b.p > H) b.p -= N; if (b.p < -H) b.p += N;
      const z = river(b.p) + b.off, ang = Math.atan2(river(b.p + 0.5) - river(b.p - 0.5), 1);
      q.setFromAxisAngle(v3.set(0, 1, 0), -ang); m4.compose(v3.set(b.p, 0.0, z), q, sc); boats.setMatrixAt(i, m4);
    }
    q.identity(); boats.instanceMatrix.needsUpdate = true;
    if (!reduce) birds(now / 1000);
    if (!shared) { const v = views[0]; aim(v, t); scene.fog.near = v.fog[0]; scene.fog.far = v.fog[1]; v.cam.aspect = W / Hh; v.cam.updateProjectionMatrix(); renderer.render(scene, v.cam); }
    else {
      const pr = renderer.getPixelRatio(), gl = renderer.domElement;
      renderer.setScissorTest(true);
      for (const v of views) {
        if (!v.on || !v.ctx) continue;
        const rr = aim(v, t);
        if (Math.abs(rr.width - v.w) > 1 || Math.abs(rr.height - v.h) > 1) size();   // never draw a stretched frame
        const w = v.w, h = v.h; if (w < 2 || h < 2) continue;
        v.cam.aspect = w / h; v.cam.updateProjectionMatrix();
        renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.clear();
        scene.fog.near = v.fog[0]; scene.fog.far = v.fog[1];
        const street = v.kind === 'road';
        if (sCity) { city.visible = wins.visible = trees3d.visible = !street; sCity.visible = sWins.visible = sTrees.visible = sProps.visible = sSignals.visible = street; }
        else { city.material = street ? fineMat : mat; wins.material = street ? fineWin : winMat; }
        renderer.render(scene, v.cam);
        const sw = Math.round(w * pr), sh = Math.round(h * pr);
        v.ctx.clearRect(0, 0, v.cv.width, v.cv.height);
        v.ctx.drawImage(gl, 0, gl.height - sh, sw, sh, 0, 0, v.cv.width, v.cv.height);
      }
    }
    if (SHOT && ++shotFrames === 6) document.title = 'shot-ready';
  }
  let shotFrames = 0;
  requestAnimationFrame(frame);
}
