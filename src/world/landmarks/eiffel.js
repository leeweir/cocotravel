import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, instancedBeams, signTexture } from '../../core/utils.js';

const ironMat = () => new THREE.MeshStandardMaterial({
  color: '#5c4a3c', roughness: 0.62, metalness: 0.38,
});
const deckMat = new THREE.MeshStandardMaterial({ color: '#6d5b49', roughness: 0.7, metalness: 0.2 });
const trimMat = new THREE.MeshStandardMaterial({ color: '#b28a52', roughness: 0.5, metalness: 0.4 });
const stoneMat = new THREE.MeshStandardMaterial({ color: '#b8a98f', roughness: 0.95 });
const glassMat = () => new THREE.MeshStandardMaterial({
  color: '#a7c4c6', roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55,
  emissive: '#ffb865', emissiveIntensity: 0,
});

function railRing(parent, width, y, height = 0.9, mat = ironMat()) {
  const half = width / 2;
  const postGeo = new THREE.CylinderGeometry(0.035, 0.045, height, 5);
  const n = Math.max(8, Math.round(width * 2.2));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const side = Math.floor(t * 4);
    const k = (t * 4) % 1;
    let x, z;
    if (side === 0) { x = -half + k * width; z = -half; }
    else if (side === 1) { x = half; z = -half + k * width; }
    else if (side === 2) { x = half - k * width; z = half; }
    else { x = -half; z = half - k * width; }
    const post = new THREE.Mesh(postGeo, mat);
    post.position.set(x, y + height / 2, z);
    parent.add(post);
  }
  for (const s of [-1, 1]) {
    const railX = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.06), mat);
    railX.position.set(0, y + height, s * half);
    parent.add(railX);
    const railZ = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, width), mat);
    railZ.position.set(s * half, y + height, 0);
    parent.add(railZ);
  }
}

function platform(parent, w, y, { thickness = 0.4, rails = 1.0, bulbs, glowMats } = {}) {
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, thickness, w), deckMat);
  deck.position.y = y;
  deck.castShadow = true;
  deck.receiveShadow = true;
  parent.add(deck);
  for (const s of [-1, 1]) {
    const trim1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.1, 0.12), trimMat);
    trim1.position.set(0, y + thickness / 2 + 0.02, s * w / 2);
    parent.add(trim1);
    const trim2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, w + 0.14), trimMat);
    trim2.position.set(s * w / 2, y + thickness / 2 + 0.02, 0);
    parent.add(trim2);
  }
  railRing(parent, w, y + thickness / 2, rails);
  // diagonal support brackets below
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, w * 0.42), ironMat());
    bracket.position.set(Math.cos(a) * w * 0.3, y - 0.55, Math.sin(a) * w * 0.3);
    bracket.rotation.y = -a;
    bracket.rotation.x = 0.42;
    parent.add(bracket);
  }
  if (bulbs) {
    const n = Math.round(w * 4);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const side = Math.floor(t * 4);
      const k = (t * 4) % 1;
      const half = w / 2 + 0.02;
      let x, z;
      if (side === 0) { x = -half + k * w; z = -half; }
      else if (side === 1) { x = half; z = -half + k * w; }
      else if (side === 2) { x = half - k * w; z = half; }
      else { x = -half; z = half - k * w; }
      bulbs.push(new THREE.Vector3(x, y + thickness / 2 + 0.02, z));
    }
  }
  return deck;
}

export function createEiffel() {
  const group = new THREE.Group();
  const iron = ironMat();
  const segments = [];
  const bulbs = [];
  const glassMats = [];
  let lit = 0, litTarget = 0, time = 0;

  const legEnd = 15.5;
  const c = (y) => 1.8 + 5.4 * Math.pow(1 - Math.min(1, y / legEnd), 1.25);
  const wOf = (y) => 0.9 + 1.7 * (1 - Math.min(1, y / legEnd));

  // four legs
  const legYs = [0.5, 2.2, 4.1, 6.1, 8.3, 10.7, 13.1, legEnd];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      let prev = null;
      for (const y of legYs) {
        const cc = c(y), w = wOf(y);
        const ox = sx * cc, oz = sz * cc;
        const inner = (sxx, szz) => ({ x: ox + sxx * w / 2, y, z: oz + szz * w / 2 });
        const cur = [inner(-1, -1), inner(1, -1), inner(1, 1), inner(-1, 1)];
        if (prev) {
          // corner rails
          for (let k = 0; k < 4; k++) {
            segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), w: 0.18 });
          }
          // horizontal rings
          for (let k = 0; k < 4; k++) {
            const j = (k + 1) % 4;
            segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), w: 0.1 });
          }
          // x braces
          for (let k = 0; k < 4; k++) {
            const j = (k + 1) % 4;
            segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(cur[j].x, cur[j].y, cur[j].z), w: 0.065, d: 0.065 });
            segments.push({ a: new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), b: new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), w: 0.065, d: 0.065 });
          }
          bulbs.push(new THREE.Vector3((cur[0].x + cur[2].x) / 2, y, (cur[0].z + cur[2].z) / 2));
        }
        prev = cur;
      }
      // base stone pad
      const pad = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.5, 4.4), stoneMat);
      pad.position.set(sx * 7.2, 0.01, sz * 7.2);
      pad.receiveShadow = true;
      pad.castShadow = true;
      group.add(pad);
      const step = new THREE.Mesh(new RoundedBoxGeometry(5.0, 0.24, 5.0, 2, 0.06), stoneMat);
      step.position.set(sx * 7.2, 0.08, sz * 7.2);
      step.receiveShadow = true;
      group.add(step);
    }
  }

  // upper shaft
  const shaftYs = [15.5, 18.3, 21.1, 23.9, 26.6, 28.7, 30.4];
  const shaftW = [2.0, 1.75, 1.5, 1.26, 1.0, 0.86, 0.76];
  let prev = null;
  for (let i = 0; i < shaftYs.length; i++) {
    const y = shaftYs[i], hw = shaftW[i];
    const cur = [
      { x: -hw, y, z: -hw }, { x: hw, y, z: -hw }, { x: hw, y, z: hw }, { x: -hw, y, z: hw },
    ];
    if (prev) {
      for (let k = 0; k < 4; k++) {
        segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), w: 0.16 });
        const j = (k + 1) % 4;
        segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), w: 0.08 });
        segments.push({ a: new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), b: new THREE.Vector3(cur[j].x, cur[j].y, cur[j].z), w: 0.055, d: 0.055 });
        segments.push({ a: new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), b: new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), w: 0.055, d: 0.055 });
      }
    }
    bulbs.push(new THREE.Vector3(hw, y, hw));
    prev = cur;
  }

  group.add(instancedBeams(segments, iron));

  /* arches */
  const archMat = ironMat();
  for (let side = 0; side < 4; side++) {
    const rot = side * Math.PI / 2;
    for (const off of [-0.45, 0.45]) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-5.0, 3.0, off),
        new THREE.Vector3(0, 9.6, off),
        new THREE.Vector3(5.0, 3.0, off),
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.14, 6, false), archMat);
      tube.rotation.y = rot;
      tube.castShadow = true;
      group.add(tube);
    }
    for (let i = 1; i < 14; i++) {
      const t = i / 14;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-5.0, 3.0, -0.45), new THREE.Vector3(0, 9.6, -0.45), new THREE.Vector3(5.0, 3.0, -0.45),
      );
      const p = curve.getPoint(t);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.9), archMat);
      strut.position.set(p.x, p.y, 0);
      strut.rotation.y = rot;
      group.add(strut);
    }
  }

  /* platforms */
  platform(group, 12.6, 8.3, { thickness: 0.45, rails: 1.1, bulbs });
  platform(group, 7.2, 15.5, { thickness: 0.4, rails: 1.0, bulbs });
  platform(group, 3.6, 28.7, { thickness: 0.3, rails: 0.9, bulbs });

  // first-level pavilions
  for (const [x, z, rot] of [[-4.4, -4.4, 0.4], [4.4, 4.4, -0.4]]) {
    const hut = new THREE.Group();
    const gm = glassMat();
    glassMats.push(gm);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 2.4), gm);
    glass.position.y = 9.25;
    hut.add(glass);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 2.8), trimMat);
    roof.position.y = 9.9;
    hut.add(roof);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5), iron);
      post.position.set(sx * 1.25, 9.25, sz * 1.15);
      hut.add(post);
    }
    hut.position.set(x, 0, z);
    hut.rotation.y = rot;
    group.add(hut);
  }

  // top cabin
  const topCabin = new THREE.Group();
  const topGlass = glassMat();
  glassMats.push(topGlass);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.3, 2.8), topGlass);
  cabin.position.y = 30.8;
  topCabin.add(cabin);
  const cabinRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.35, 8), deckMat);
  cabinRoof.position.y = 31.55;
  topCabin.add(cabinRoof);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 5), iron);
    post.position.set(Math.cos(a) * 1.36, 30.8, Math.sin(a) * 1.36);
    topCabin.add(post);
  }
  // antenna
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 5.8, 8), trimMat);
  antenna.position.y = 34.4;
  topCabin.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({
    color: '#ffdca8', emissive: '#ff9f55', emissiveIntensity: 0.2,
  }));
  antennaTip.position.y = 37.4;
  topCabin.add(antennaTip);
  group.add(topCabin);

  // base sign
  const signTex = signTexture('TOUR EIFFEL', { sub: 'PARIS · 1889', bg: '#f1e7d2', fg: '#4a3d31', size: 60 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.98), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8, side: THREE.DoubleSide }));
  sign.position.set(-6.4, 1.5, 9.4);
  sign.rotation.y = 0.24;
  group.add(sign);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6), trimMat);
    post.position.set(-6.4 + s * 0.98, 0.8, 9.35 + s * 0.24);
    group.add(post);
  }

  // base lamps
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({
      color: '#ffe2aa', emissive: '#ffb35e', emissiveIntensity: 0.2,
    }));
    b.position.set(Math.cos(a) * 5.6, 1.0, Math.sin(a) * 5.6);
    group.add(b);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.0, 6), iron);
    pole.position.set(Math.cos(a) * 5.6, 0.5, Math.sin(a) * 5.6);
    group.add(pole);
  }

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  /* bulbs */
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    for (let k = 0; k < 3; k++) {
      bulbs.push(new THREE.Vector3(Math.cos(a) * 3.4, 9.0 + k * 0.25, Math.sin(a) * 3.4));
    }
  }
  const bulbGeo = new THREE.SphereGeometry(0.055, 5, 4);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const bulbMesh = new THREE.InstancedMesh(bulbGeo, bulbMat, bulbs.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  bulbs.forEach((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z);
    bulbMesh.setMatrixAt(i, m4);
    bulbMesh.setColorAt(i, col.setHex(0x2c241c));
  });
  bulbMesh.instanceMatrix.needsUpdate = true;
  bulbMesh.visible = false;
  group.add(bulbMesh);

  // beacon
  const beacon = new THREE.Group();
  beacon.position.y = 31.8;
  const beamGeo = new THREE.ConeGeometry(9, 140, 18, 1, true);
  beamGeo.translate(0, -70, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe9b0, transparent: true, opacity: 0.0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.rotation.z = Math.PI / 2;
  beam.rotation.y = 0;
  beacon.add(beam);
  const beam2 = new THREE.Mesh(beamGeo, beamMat.clone());
  beam2.rotation.z = Math.PI / 2;
  beam2.rotation.y = Math.PI;
  beam2.scale.set(0.7, 0.55, 0.7);
  beacon.add(beam2);
  const beaconGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xffe6b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    map: (() => {
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128;
      const ctx = cvs.getContext('2d');
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,245,215,.95)');
      g.addColorStop(0.45, 'rgba(255,210,130,.3)');
      g.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cvs);
    })(),
  }));
  beaconGlow.scale.setScalar(8);
  beacon.add(beaconGlow);
  beacon.visible = false;
  group.add(beacon);

  const topLight = new THREE.PointLight(0xffc983, 0, 60, 1.5);
  topLight.position.y = 31;
  group.add(topLight);
  const baseLight = new THREE.PointLight(0xffbd7a, 0, 40, 1.8);
  baseLight.position.set(0, 2.2, 6);
  group.add(baseLight);

  function setLit(on) {
    litTarget = on ? 1 : 0;
    bulbMesh.visible = true;
    beacon.visible = true;
  }

  function update(dt, t) {
    time = t;
    lit += (litTarget - lit) * Math.min(1, dt * 0.8);
    const on = lit > 0.02;
    bulbMesh.visible = on;
    beacon.visible = on;
    if (on) {
      const cursor = Math.floor((t * 60) % bulbs.length);
      for (let k = 0; k < 25; k++) {
        const idx = (cursor + k) % bulbs.length;
        const tw = 0.35 + Math.random() * 0.9;
        col.setHSL(0.11, 0.8, 0.55 + tw * 0.3);
        col.multiplyScalar(lit * (0.7 + tw * 0.5));
        bulbMesh.setColorAt(idx, col);
      }
      bulbMesh.instanceColor.needsUpdate = true;
    }
    beamMat.opacity = lit * 0.07;
    beam2.material.opacity = lit * 0.05;
    beacon.rotation.y += dt * 0.18;
    beaconGlow.material.opacity = lit * 0.5;
    beaconGlow.scale.setScalar(8 + Math.sin(t * 1.4) * 0.6);
    topLight.intensity = lit * 30;
    baseLight.intensity = lit * 14;
    glassMats.forEach((g) => { g.emissiveIntensity = lit * 0.9; });
    antennaTip.material.emissiveIntensity = 0.2 + Math.sin(t * 3) * 0.1 + lit * 1.4;
  }

  return {
    group,
    update,
    setLit,
    colliders: [
      { type: 'circle', x: -7.2, z: -7.2, r: 1.9 },
      { type: 'circle', x: 7.2, z: -7.2, r: 1.9 },
      { type: 'circle', x: -7.2, z: 7.2, r: 1.9 },
      { type: 'circle', x: 7.2, z: 7.2, r: 1.9 },
    ],
    heart: new THREE.Vector3(0, 0.4, 11.5),
    anchorTop: new THREE.Vector3(0, 24, 0),
    anchorMid: new THREE.Vector3(0, 10, 0),
  };
}
