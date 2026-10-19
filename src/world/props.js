import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  TAU, canvas2d, canvasTexture, barkTexture, signTexture, canvasPlane,
  rand, randInt, mulberry32, clamp, damp, blobShadow, sparkleTexture, dotTexture,
} from '../core/utils.js';

const S = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o });
const iron = new THREE.MeshStandardMaterial({ color: '#33302c', roughness: 0.55, metalness: 0.5 });
const gold = new THREE.MeshStandardMaterial({ color: '#d9a94a', roughness: 0.38, metalness: 0.65 });
const marble = new THREE.MeshStandardMaterial({ color: '#e9e0cd', roughness: 0.72 });
const stone = new THREE.MeshStandardMaterial({ color: '#c6b79d', roughness: 0.95 });
const darkStone = new THREE.MeshStandardMaterial({ color: '#8e8270', roughness: 0.95 });

function woodTexture(seed = 4, base = '#a3764d') {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(512, 512);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = `rgba(60,38,22,${0.05 + r() * 0.08})`;
    ctx.fillRect(0, i * 57, 512, 2);
  }
  for (let i = 0; i < 220; i++) {
    ctx.strokeStyle = `rgba(${r() > 0.5 ? '70,45,25' : '220,180,130'},${0.04 + r() * 0.08})`;
    ctx.lineWidth = 1 + r() * 2;
    const y = r() * 512;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.bezierCurveTo(150, y + 10, 320, y - 8, 522, y + 4);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [2, 2] });
}

export function createTree({
  height = 2.2, canopy = 1.5, colors = ['#7f9f57', '#8fae63', '#6f9150'],
  trunkColor = '#7b5a3f', blossom = false, seed = 1,
} = {}) {
  const r = mulberry32(seed);
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, map: barkTexture(seed), roughness: 1 });
  const trunkScale = blossom ? 0.62 : 1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * canopy * 0.55 * trunkScale, 0.24 * canopy * 0.55 * trunkScale, height, 9), trunkMat);
  trunk.position.y = height / 2;
  trunk.castShadow = trunk.receiveShadow = true;
  group.add(trunk);

  const branchCount = blossom ? 4 : 3;
  for (let i = 0; i < branchCount; i++) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(
      (blossom ? 0.018 : 0.035) * canopy,
      (blossom ? 0.03 : 0.07) * canopy,
      height * (blossom ? 0.4 : 0.55), 6,
    ), trunkMat);
    const a = (i / branchCount) * TAU + r();
    branch.position.set(Math.cos(a) * 0.16 * canopy, height * (blossom ? 0.88 : 0.78), Math.sin(a) * 0.16 * canopy);
    branch.rotation.set(Math.cos(a) * (blossom ? 0.38 : 0.55), 0, -Math.sin(a) * (blossom ? 0.38 : 0.55));
    branch.castShadow = true;
    group.add(branch);
  }

  const leafMats = colors.map((c) => new THREE.MeshStandardMaterial({
    color: c, roughness: 1, flatShading: !blossom,
    ...(blossom ? { emissive: c, emissiveIntensity: 0.05 } : {}),
  }));
  const blobs = blossom ? 36 + Math.floor(r() * 9) : 5 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const a = r() * TAU;
    const rr = r() * canopy * (blossom ? 0.98 : 0.62);
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(canopy * (blossom ? 0.1 + r() * 0.1 : 0.46 + r() * 0.26), blossom ? 2 : 1), leafMats[i % leafMats.length]);
    blob.position.set(Math.cos(a) * rr, height + canopy * (blossom ? 0.1 + r() * 0.58 : 0.1 + r() * 0.32), Math.sin(a) * rr);
    blob.rotation.set(r() * TAU, r() * TAU, r() * TAU);
    blob.scale.y = (blossom ? 0.76 : 0.82) + r() * 0.18;
    blob.castShadow = true;
    blob.receiveShadow = true;
    group.add(blob);
  }
  if (blossom) {
    const petalMat = new THREE.MeshStandardMaterial({ color: '#fff1f5', emissive: '#ffdfe8', emissiveIntensity: 0.08, roughness: 0.9 });
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU;
      const rr = canopy * (0.3 + r() * 0.7);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012 + r() * 0.013, 5, 4), petalMat);
      dot.position.set(Math.cos(a) * rr, height + canopy * (0.1 + r() * 0.6), Math.sin(a) * rr);
      group.add(dot);
    }
  }
  const shadow = blobShadow(canopy * 0.9, 0.16);
  shadow.position.y = 0.02;
  group.add(shadow);
  return group;
}

export function createPine({ height = 3, radius = 1.1 } = {}) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, height * 0.6, 8), S('#6d5138', { map: barkTexture(3) }));
  trunk.position.y = height * 0.3;
  trunk.castShadow = true;
  group.add(trunk);
  const mat = S('#517a56', { flatShading: true });
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * (1 - i * 0.2), height * 0.38, 8), mat);
    cone.position.y = height * (0.42 + i * 0.16);
    cone.rotation.y = i * 0.4;
    cone.castShadow = true;
    group.add(cone);
  }
  return group;
}

export function createBush(scale = 1, color = '#7d9b58') {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 * scale * (0.7 + Math.random() * 0.5), 1), mat);
    b.position.set(rand(-0.35, 0.35) * scale, 0.25 * scale, rand(-0.3, 0.3) * scale);
    b.castShadow = true;
    group.add(b);
  }
  return group;
}

export function createHedge(length = 4, h = 0.8) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#6f9152', roughness: 1, flatShading: true });
  const base = new THREE.Mesh(new RoundedBoxGeometry(length, h, 0.8, 3, 0.3), mat);
  base.position.y = h / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  for (let i = 0; i < length * 3; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + Math.random() * 0.16, 0), mat);
    b.position.set(rand(-length / 2, length / 2), h * 0.85 + Math.random() * 0.18, rand(-0.3, 0.3));
    group.add(b);
  }
  return group;
}

export function createFlowerBed(radius = 2, colors = ['#f0b64b', '#e9705b', '#f7d6df', '#8fa9d8', '#ffffff']) {
  const group = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.08, 0.22, 24), S('#6b5138'));
  soil.position.y = 0.11;
  soil.receiveShadow = true;
  group.add(soil);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.05, 0.12, 6, 28), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  group.add(rim);

  const n = Math.floor(radius * radius * 18);
  const stemGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.35, 4);
  const headGeo = new THREE.SphereGeometry(0.065, 6, 5);
  const stems = new THREE.InstancedMesh(stemGeo, S('#5f854e'), n);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const rr = Math.sqrt(Math.random()) * (radius - 0.25);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const hh = 0.22 + Math.random() * 0.2;
    m.makeTranslation(x, hh / 2 + 0.2, z);
    stems.setMatrixAt(i, m);
    m.makeTranslation(x, hh + 0.28, z);
    heads.setMatrixAt(i, m);
    col.set(colors[i % colors.length]);
    heads.setColorAt(i, col);
  }
  stems.castShadow = true;
  heads.castShadow = false;
  group.add(stems, heads);
  return group;
}

export function createLamp(style = 'ny', { lit = true } = {}) {
  const group = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#ffe1a3', emissive: '#ffbe62', emissiveIntensity: lit ? 1.5 : 0.15,
    roughness: 0.3, transparent: true, opacity: 0.92,
  });
  if (style === 'tokyo') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.22, 8), darkStone);
    base.position.y = 0.11;
    group.add(base);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 1.1, 8), stone);
    pillar.position.y = 0.72;
    group.add(pillar);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.14, 8), stone);
    collar.position.y = 1.3;
    group.add(collar);
    const box = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 6), stone);
    box.position.y = 1.58;
    group.add(box);
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 6), glassMat);
    win.position.y = 1.58;
    group.add(win);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.24, 6), darkStone);
    roof.position.y = 1.92;
    group.add(roof);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), stone);
    cap.position.y = 2.08;
    group.add(cap);
    const light = new THREE.PointLight(0xffb55e, lit ? 5 : 0, 6, 2);
    light.position.y = 1.6;
    group.add(light);
  } else {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.3, 10), iron);
    base.position.y = 0.15;
    group.add(base);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), iron);
    knob.position.y = 0.32;
    knob.scale.y = 0.6;
    group.add(knob);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 3.4, 8), iron);
    pole.position.y = 1.9;
    group.add(pole);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 5, 12), gold);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 3.2;
    group.add(collar);
    if (style === 'paris') {
      const armCurve = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 5, 12, Math.PI * 0.7), iron);
      armCurve.position.set(0, 3.45, 0);
      armCurve.rotation.set(0, 0, -0.2);
      group.add(armCurve);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.08, 8), iron);
      top.position.set(0.37, 3.55, 0);
      group.add(top);
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.36, 6), glassMat);
      lantern.position.set(0.37, 3.32, 0);
      group.add(lantern);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 6), iron);
      cap.position.set(0.37, 3.58, 0);
      group.add(cap);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), gold);
      tip.position.set(0.37, 3.68, 0);
      group.add(tip);
      const light = new THREE.PointLight(0xffc078, lit ? 6 : 0, 7, 2);
      light.position.set(0.37, 3.3, 0);
      group.add(light);
    } else {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.06), iron);
      cross.position.y = 3.45;
      group.add(cross);
      for (const s of [-1, 1]) {
        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 5), iron);
        hanger.position.set(s * 0.72, 3.34, 0);
        group.add(hanger);
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.4, 4), glassMat);
        lantern.position.set(s * 0.72, 3.08, 0);
        lantern.rotation.y = Math.PI / 4;
        group.add(lantern);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.16, 4), iron);
        cap.position.set(s * 0.72, 3.34, 0);
        cap.rotation.y = Math.PI / 4;
        group.add(cap);
      }
      const light = new THREE.PointLight(0xffc078, lit ? 7 : 0, 8, 2);
      light.position.y = 3.1;
      group.add(light);
    }
    const postLight = new THREE.PointLight(0xffc078, 0, 5, 2);
    postLight.position.y = 3.2;
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function createBench(color = '#9a6c46') {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color, roughness: 0.85, map: woodTexture(6, color) });
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.06, 0.16, 2, 0.02), wood);
    slat.position.set(0, 0.48, -0.16 + i * 0.17);
    slat.castShadow = true;
    group.add(slat);
  }
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.16, 0.05, 2, 0.02), wood);
    slat.position.set(0, 0.72 + i * 0.19, -0.28);
    slat.rotation.x = -0.12;
    slat.castShadow = true;
    group.add(slat);
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.5), iron);
    leg.position.set(s * 0.72, 0.25, 0);
    group.add(leg);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), iron);
    back.position.set(s * 0.72, 0.75, -0.28);
    back.rotation.x = -0.12;
    group.add(back);
    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.55), iron);
    armrest.position.set(s * 0.72, 0.78, -0.02);
    group.add(armrest);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function createFlagPole(flagTex, { height = 6, scale = 1.5 } = {}) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, height, 8), new THREE.MeshStandardMaterial({ color: '#d8d3c4', metalness: 0.6, roughness: 0.3 }));
  pole.position.y = height / 2;
  pole.castShadow = true;
  group.add(pole);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), gold);
  tip.position.y = height + 0.05;
  group.add(tip);
  const geo = new THREE.PlaneGeometry(scale * 2, scale * 1.25, 16, 10);
  const mat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.9 });
  const flag = new THREE.Mesh(geo, mat);
  flag.position.set(scale, height - scale * 0.68, 0);
  flag.castShadow = true;
  group.add(flag);
  const base = geo.attributes.position.array.slice();
  function update(t) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const k = (x + scale) / (scale * 2);
      pos.setZ(i, Math.sin(t * 4 + x * 2.2 + y) * 0.13 * k + Math.sin(t * 2.3 + y * 1.5) * 0.05 * k);
      pos.setY(i, y + Math.sin(t * 2 + x) * 0.02 * k);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return { group, update };
}

export function createPigeons(count = 5, seed = 2) {
  const group = new THREE.Group();
  const r = mulberry32(seed);
  const bodyMat = S('#9aa0a4', { roughness: 0.9 });
  const headMat = S('#6f7f8a', { roughness: 0.9 });
  const beakMat = S('#d9a15b');
  const list = [];
  for (let i = 0; i < count; i++) {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), bodyMat);
    body.scale.set(1, 0.9, 1.35);
    body.position.y = 0.14;
    p.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), headMat);
    head.position.set(0, 0.26, 0.1);
    p.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 5), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.25, 0.18);
    p.add(beak);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.16), headMat);
    tail.position.set(0, 0.15, -0.15);
    tail.rotation.x = 0.2;
    p.add(tail);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 4), beakMat);
      leg.position.set(s * 0.04, 0.05, 0.02);
      p.add(leg);
    }
    p.position.set(rand(-1.6, 1.6), 0.02, rand(-1.2, 1.2));
    p.rotation.y = r() * TAU;
    p.userData = {
      phase: r() * TAU, speed: 0.8 + r() * 0.8, baseY: 0.02,
      hopTimer: r() * 4, home: p.position.clone(),
    };
    group.add(p);
    list.push(p);
  }
  function update(dt, t) {
    for (const p of list) {
      const u = p.userData;
      u.hopTimer -= dt;
      const peck = Math.max(0, Math.sin(t * u.speed * 2 + u.phase));
      p.rotation.x = peck * 0.35;
      p.position.y = u.baseY + Math.abs(Math.sin(t * 2 + u.phase)) * 0.01;
      if (u.hopTimer < 0) {
        u.hopTimer = 3 + Math.random() * 5;
        const a = Math.random() * TAU;
        p.position.x = clamp(u.home.x + Math.cos(a) * 1.2, -2, 2);
        p.position.z = clamp(u.home.z + Math.sin(a) * 1.2, -1.5, 1.5);
        p.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      }
    }
  }
  return { group, update };
}

export function createCrate(size = 1, color = '#b08753') {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color, roughness: 0.9, map: woodTexture(8, color) });
  const box = new THREE.Mesh(new RoundedBoxGeometry(size, size, size, 2, 0.04), wood);
  box.position.y = size / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  const edgeMat = S('#8a6238', { roughness: 0.9 });
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, size + 0.02, 0.07), edgeMat);
      post.position.set(s * size / 2, size / 2, t * size / 2);
      group.add(post);
    }
  }
  for (const yy of [0.14, size - 0.14]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(size + 0.02, 0.06, size + 0.02), edgeMat);
    band.position.y = yy;
    group.add(band);
  }
  group.userData.size = size;
  return group;
}

export function createFountain({ radius = 3, seed = 2 } = {}) {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.26, 10, 40), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.42;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.2, radius + 0.32, 0.55, 40, 1, true), stone);
  wall.position.y = 0.22;
  group.add(wall);
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#7ec4c3', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.85,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(radius + 0.05, 40), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.4;
  group.add(water);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 1.1, 12), stone);
  base.position.y = 0.8;
  base.castShadow = true;
  group.add(base);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.12, 0), new THREE.Vector2(0.5, 0.1), new THREE.Vector2(0.95, 0.3),
    new THREE.Vector2(1.05, 0.42), new THREE.Vector2(0.9, 0.44),
  ], 24), marble);
  bowl.position.y = 1.3;
  bowl.castShadow = true;
  group.add(bowl);
  const topWater = new THREE.Mesh(new THREE.CircleGeometry(0.88, 24), waterMat);
  topWater.rotation.x = -Math.PI / 2;
  topWater.position.y = 1.72;
  group.add(topWater);
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.8, 10), stone);
  finial.position.y = 1.85;
  group.add(finial);
  const spout = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gold);
  spout.position.y = 2.3;
  group.add(spout);

  // simple rising droplets
  const drops = [];
  const dropMat = new THREE.SpriteMaterial({
    map: dotTexture(), color: 0xcdeeed, transparent: true, opacity: 0.7, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(dropMat.clone());
    s.position.set(0, 2.3, 0);
    s.userData = { phase: Math.random(), speed: 0.5 + Math.random() * 0.5, angle: Math.random() * TAU, rad: 0.1 + Math.random() * 0.3 };
    group.add(s);
    drops.push(s);
  }
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xd8ad55, metalness: 0.8, roughness: 0.3 });
  for (let i = 0; i < 5; i++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 10), coinMat);
    const a = Math.random() * TAU;
    coin.position.set(Math.cos(a) * radius * 0.6, 0.415, Math.sin(a) * radius * 0.6);
    group.add(coin);
  }
  function update(dt, t) {
    waterMat.color.setHex(0x7ec4c3);
    for (const d of drops) {
      const u = d.userData;
      const phase = (t * u.speed + u.phase) % 1;
      const r = u.rad * (0.2 + phase);
      d.position.set(Math.cos(u.angle) * r, 2.3 + Math.sin(phase * Math.PI) * 0.65 - phase * 0.2, Math.sin(u.angle) * r);
      d.material.opacity = 0.65 * (1 - phase * 0.7);
      d.scale.setScalar(0.1 + phase * 0.12);
    }
  }
  return { group, update, radius };
}

export function createCafeSet({ umbrellaColor = '#e9705b' } = {}) {
  const group = new THREE.Group();
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20), marble);
  top.position.y = 0.72;
  top.castShadow = true;
  table.add(top);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 8), iron);
  column.position.y = 0.36;
  table.add(column);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.05, 12), iron);
  foot.position.y = 0.03;
  table.add(foot);
  group.add(table);

  const chairMat = S('#6e5643');
  for (const s of [-1, 1]) {
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.05, 0.42, 2, 0.02), chairMat);
    seat.position.y = 0.45;
    chair.add(seat);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.45, 0.05, 2, 0.02), chairMat);
    back.position.set(0, 0.68, -0.18);
    back.rotation.x = -0.08;
    chair.add(back);
    for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 5), iron);
      leg.position.set(lx, 0.22, lz);
      chair.add(leg);
    }
    chair.position.set(s * 1.05, 0, 0);
    chair.rotation.y = s * -Math.PI / 2;
    group.add(chair);
  }

  // umbrella
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8), S('#e8ddc8'));
  pole.position.y = 1.25;
  group.add(pole);
  const canopyTex = (() => {
    const { c, ctx } = canvas2d(256, 64);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#f5ead5' : umbrellaColor;
      ctx.fillRect(i * 256 / 12, 0, 256 / 12 + 1, 64);
    }
    return canvasTexture(c, { repeat: [1, 1] });
  })();
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.65, 0.55, 12, 1, true),
    new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.9 }),
  );
  canopy.position.y = 2.45;
  canopy.castShadow = true;
  group.add(canopy);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), gold);
  tip.position.y = 2.75;
  group.add(tip);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function createVendingMachine() {
  const group = new THREE.Group();
  const bodyMat = S('#cf4c44', { roughness: 0.5, metalness: 0.1 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.1, 2.0, 0.75, 2, 0.06), bodyMat);
  body.position.y = 1.0;
  group.add(body);
  const faceTex = (() => {
    const { c, ctx } = canvas2d(256, 384);
    ctx.fillStyle = '#f4ede0'; ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#cf4c44'; ctx.fillRect(0, 0, 256, 60);
    ctx.fillStyle = '#fff8ea'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center';
    ctx.fillText('DRINKS', 128, 40);
    const cans = ['#e86f5c', '#6fa9c7', '#e8c25e', '#8db36a', '#d7d2c7', '#b58ac1'];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const x = 22 + i * 37, y = 80 + row * 62;
        ctx.fillStyle = cans[(row * 6 + i) % cans.length];
        ctx.fillRect(x, y, 27, 44);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 3, y + 4, 21, 8);
        ctx.fillStyle = '#4a3a31'; ctx.font = 'bold 10px Arial'; ctx.fillText('¥150', x + 13, y + 38);
      }
    }
    ctx.fillStyle = '#37302b'; ctx.fillRect(26, 310, 110, 44);
    ctx.fillStyle = '#fff2d8'; ctx.font = 'bold 15px Arial'; ctx.fillText('PUSH', 81, 338);
    ctx.fillStyle = '#e9b64d'; ctx.beginPath(); ctx.arc(200, 332, 19, 0, TAU); ctx.fill();
    return canvasTexture(c);
  })();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.44), new THREE.MeshBasicMaterial({ map: faceTex }));
  face.position.set(0, 1.32, 0.385);
  group.add(face);
  const glow = new THREE.PointLight(0xffe6c4, 2.5, 4, 2);
  glow.position.set(0, 1.5, 0.8);
  group.add(glow);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function createStoneLantern(lit = true) {
  return createLamp('tokyo', { lit });
}

export function createStringLanterns(points, { count = 12, color = '#ff9d6e' } = {}) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const lanternMat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.1, roughness: 0.7,
  });
  const lanterns = [];
  const wirePoints = curve.getPoints(40);
  const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
  const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: '#5c463a' }));
  group.add(wire);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const p = curve.getPoint(t);
    const lan = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.32, 8), lanternMat);
    lan.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.035, 8), S('#5e4038'));
    band.position.y = 0.12; lan.add(band);
    const band2 = band.clone(); band2.position.y = -0.12; lan.add(band2);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 3), S('#5e4038'));
    str.position.y = 0.23; lan.add(str);
    lan.position.copy(p);
    lan.position.y -= 0.2;
    lan.userData.phase = Math.random() * TAU;
    group.add(lan);
    lanterns.push(lan);
  }
  function update(dt, t) {
    for (const l of lanterns) {
      l.rotation.z = Math.sin(t * 1.4 + l.userData.phase) * 0.09;
      l.rotation.x = Math.cos(t * 1.1 + l.userData.phase) * 0.06;
    }
  }
  return { group, update, lanterns };
}

export function createBicycle(color = '#5f8f89') {
  const group = new THREE.Group();
  const frameMat = S(color, { metalness: 0.4, roughness: 0.4 });
  const wheelMat = S('#3b3733');
  const wheelGeo = new THREE.TorusGeometry(0.38, 0.035, 6, 20);
  for (const x of [-0.58, 0.58]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, 0.38, 0);
    wheel.castShadow = true;
    group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8), gold);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, 0.38, 0);
    group.add(hub);
  }
  const tubes = [
    [-0.58, 0.38, 0.02, 1.0, 0.03, 0.02],
    [0.0, 0.62, 0.45, 0.25, 0.03, 0.02],
    [0.0, 0.62, -0.4, 0.55, 0.03, 0.02],
  ];
  const bar = (a, b, r = 0.028) => {
    const dv = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dv.length(), 6), frameMat);
    m.position.copy(a).addScaledVector(dv, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize());
    group.add(m);
  };
  bar(new THREE.Vector3(-0.58, 0.38, 0), new THREE.Vector3(0, 0.72, 0));
  bar(new THREE.Vector3(0, 0.72, 0), new THREE.Vector3(0.42, 0.95, 0));
  bar(new THREE.Vector3(0.42, 0.95, 0), new THREE.Vector3(0.58, 0.38, 0));
  bar(new THREE.Vector3(-0.58, 0.38, 0), new THREE.Vector3(0.05, 0.42, 0));
  bar(new THREE.Vector3(0.05, 0.42, 0), new THREE.Vector3(0, 0.72, 0));
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.06, 0.13, 2, 0.03), S('#4b3a2c'));
  seat.position.set(0, 1.02, 0);
  group.add(seat);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), frameMat);
  handle.position.set(0.48, 1.0, 0);
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = 0.3;
  group.add(handle);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.26, 10, 1, true), S('#c8a06e', { side: THREE.DoubleSide }));
  basket.position.set(0.62, 0.9, 0);
  basket.rotation.z = Math.PI / 2;
  group.add(basket);
  // flowers in basket
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), S(['#f4c6d3', '#f2d06b', '#ffffff'][i % 3]));
    f.position.set(0.62, 0.98 + Math.random() * 0.1, (Math.random() - 0.5) * 0.2);
    group.add(f);
  }
  group.scale.setScalar(1.15);
  return group;
}

export function createSign(text, sub, { width = 2.2, height = 0.9, postH = 1.8, style = 'post' } = {}) {
  const group = new THREE.Group();
  const tex = signTexture(text, { sub, size: text.length > 8 ? 56 : 74 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.9,
  }));
  board.position.y = postH;
  board.castShadow = true;
  group.add(board);
  if (style === 'post') {
    const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), S('#9c7c56', { roughness: 0.92 }));
    back.position.set(0, postH, -0.02);
    back.rotation.y = Math.PI;
    group.add(back);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, postH, 6), S('#8a6748'));
      post.position.set(s * width * 0.34, postH / 2 - 0.1, -0.03);
      group.add(post);
    }
  } else {
    const boardBack = new THREE.Mesh(new RoundedBoxGeometry(width + 0.12, height + 0.1, 0.08, 2, 0.02), S('#8a6748'));
    boardBack.position.set(0, postH + 0.05, -0.06);
    group.add(boardBack);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), S('#8a6748'));
    top.position.set(0, postH + height / 2 + 0.15, 0);
    group.add(top);
  }
  return group;
}

export function createStairs({ steps = 6, width = 3.2, rise = 0.18, run = 0.38, color = '#c6b79d' } = {}) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
  const walkables = [];
  for (let i = 0; i < steps; i++) {
    const h = rise * (i + 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, h, run), mat);
    step.position.set(0, h / 2, -(i + 0.5) * run);
    step.receiveShadow = true;
    step.castShadow = true;
    group.add(step);
    walkables.push(step);
  }
  // side walls
  const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.18, steps * rise + 0.4, steps * run), wallMat);
    wall.position.set(s * (width / 2 + 0.09), (steps * rise + 0.4) / 2, -steps * run / 2);
    wall.receiveShadow = true;
    wall.castShadow = true;
    group.add(wall);
  }
  return { group, walkables, top: steps * rise, depth: steps * run };
}

/* ------------------------------------------------------------------ */
/*  carousel                                                           */
/* ------------------------------------------------------------------ */
function buildHorse(saddleColor) {
  const group = new THREE.Group();
  const white = S('#f8f1e2', { roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 10), white);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.85;
  group.add(body);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.35, 5, 8), white);
  neck.position.set(0, 1.12, 0.32);
  neck.rotation.x = -0.6;
  group.add(neck);
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 4, 8), white);
  head.position.set(0, 1.33, 0.51);
  head.rotation.x = Math.PI / 2 - 0.2;
  group.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 5), white);
    ear.position.set(s * 0.06, 1.48, 0.48);
    group.add(ear);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.6, 6), white);
    leg.position.set(s * 0.13, 0.42, 0.3);
    leg.rotation.x = 0.25;
    group.add(leg);
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.6, 6), white);
    leg2.position.set(s * 0.13, 0.42, -0.3);
    leg2.rotation.x = -0.25;
    group.add(leg2);
  }
  const saddle = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.1, 0.3, 2, 0.04), S(saddleColor));
  saddle.position.set(0, 1.0, 0);
  group.add(saddle);
  const mane = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 3, 6), S('#7a5a3c'));
  mane.position.set(0, 1.22, 0.3);
  mane.rotation.x = -0.6;
  group.add(mane);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), S('#7a5a3c'));
  tail.position.set(0, 0.88, -0.48);
  tail.rotation.x = 0.8;
  group.add(tail);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2e241f });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), eyeMat);
    eye.position.set(s * 0.085, 1.4, 0.6);
    group.add(eye);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function createCarousel() {
  const group = new THREE.Group();
  const spinning = new THREE.Group();
  group.add(spinning);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.3, 0.22, 32), marble);
  base.position.y = 0.11;
  base.receiveShadow = true;
  group.add(base);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.2, 0.4, 32, 1, true), S('#d9a3a0'));
  skirt.position.y = 0.38;
  group.add(skirt);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshStandardMaterial({
      color: '#fff3cd', emissive: '#ffd27a', emissiveIntensity: 1.2,
    }));
    bulb.position.set(Math.cos(a) * 4.13, 0.6, Math.sin(a) * 4.13);
    group.add(bulb);
  }
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.12, 32), S('#f4e7cf'));
  deck.position.y = 0.28;
  spinning.add(deck);
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 3.6, 16), new THREE.MeshStandardMaterial({
    color: '#e8d5a8', metalness: 0.4, roughness: 0.3, map: (() => {
      const { c, ctx } = canvas2d(64, 256);
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#e8d5a8' : '#caa96b'; ctx.fillRect(0, i * 32, 64, 32); }
      return canvasTexture(c); })()
  }));
  center.position.y = 2.1;
  spinning.add(center);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const horse = buildHorse(['#e9705b', '#4f938c', '#d9a3a0'][i % 3]);
    horse.position.set(Math.cos(a) * 2.75, 0.3, Math.sin(a) * 2.75);
    horse.rotation.y = -a + Math.PI / 2;
    horse.scale.setScalar(0.9);
    spinning.add(horse);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.9, 6), gold);
    pole.position.set(Math.cos(a) * 2.75, 1.85, Math.sin(a) * 2.75);
    spinning.add(pole);
    horse.userData.phase = i * 1.1;
    horse.userData.baseY = 0.3;
  }

  // canopy
  const canopyTex = (() => {
    const { c, ctx } = canvas2d(512, 128);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? '#f8ecd8' : '#e9705b';
      ctx.fillRect(i * 32, 0, 32, 128);
    }
    ctx.fillStyle = 'rgba(90,50,30,.25)';
    for (let i = 0; i < 16; i++) ctx.fillRect(i * 32, 0, 2, 128);
    return canvasTexture(c);
  })();
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(4.15, 3.1, 1.3, 16, 1, true),
    new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.9 }),
  );
  canopy.position.y = 3.55;
  canopy.castShadow = true;
  spinning.add(canopy);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.1, 16), S('#cf5c4d'));
  roof.position.y = 4.7;
  roof.castShadow = true;
  spinning.add(roof);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gold);
  finial.position.y = 5.35;
  spinning.add(finial);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshStandardMaterial({ color: '#f0c46a', side: THREE.DoubleSide }));
  flag.position.set(0.36, 5.55, 0);
  spinning.add(flag);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshStandardMaterial({
      color: '#fff3cd', emissive: '#ffcf78', emissiveIntensity: 1.6,
    }));
    bulb.position.set(Math.cos(a) * 3.12, 3.0, Math.sin(a) * 3.12);
    spinning.add(bulb);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  base.castShadow = false;

  let speed = 0.22;
  let targetSpeed = 0.22;
  function update(dt, t) {
    speed = damp(speed, targetSpeed, 1.5, dt);
    spinning.rotation.y += speed * dt;
    spinning.children.forEach((c) => {
      if (c.userData.phase !== undefined) {
        c.position.y = c.userData.baseY + Math.sin(t * 2.2 + c.userData.phase) * 0.18;
      }
    });
  }
  function celebrate() { targetSpeed = 1.2; }
  function reset() { targetSpeed = 0.22; }
  return { group, update, celebrate, reset };
}

/* ------------------------------------------------------------------ */
/*  New York taxi                                                      */
/* ------------------------------------------------------------------ */
export function createTaxi() {
  const group = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: '#e8b83e', roughness: 0.42, metalness: 0.25 });
  const dark = S('#2f3136', { roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: '#9ec4cc', roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.75 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.72, 4.0, 3, 0.18), yellow);
  body.position.y = 0.72;
  group.add(body);
  const hood = new THREE.Mesh(new RoundedBoxGeometry(1.82, 0.32, 1.15, 3, 0.12), yellow);
  hood.position.set(0, 0.98, 1.5);
  group.add(hood);
  const trunk = new THREE.Mesh(new RoundedBoxGeometry(1.82, 0.3, 0.8, 3, 0.12), yellow);
  trunk.position.set(0, 0.98, -1.65);
  group.add(trunk);
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.66, 0.8, 2.1, 3, 0.2), yellow);
  cabin.position.set(0, 1.38, -0.18);
  group.add(cabin);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.62), glass);
  windshield.position.set(0, 1.52, 0.92);
  windshield.rotation.x = -0.3;
  group.add(windshield);
  const rear = windshield.clone();
  rear.position.set(0, 1.52, -1.26);
  rear.rotation.x = Math.PI + 0.28;
  group.add(rear);
  for (const s of [-1, 1]) {
    const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), glass);
    sideWin.position.set(s * 0.84, 1.52, -0.2);
    sideWin.rotation.y = s * Math.PI / 2;
    group.add(sideWin);
    const stripe = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2) continue;
        const sq = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0x2f3136 }));
        sq.position.set(s * 0.96, 0.85 - j * 0.09, -1.1 + i * 0.27);
        stripe.add(sq);
      }
    }
    group.add(stripe);
  }
  for (const [x, z] of [[-0.92, 1.3], [0.92, 1.3], [-0.92, -1.3], [0.92, -1.3]]) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), dark);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.38, z);
    tire.castShadow = true;
    group.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 10), new THREE.MeshStandardMaterial({ color: '#cfd2d0', metalness: 0.8, roughness: 0.25 }));
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, 0.38, z);
    group.add(hub);
  }
  for (const s of [-1, 1]) {
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff2c4', emissive: '#ffe4a0', emissiveIntensity: 0.8 }));
    headlight.position.set(s * 0.6, 0.86, 2.03);
    group.add(headlight);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: '#d74d43', emissive: '#c7352c', emissiveIntensity: 0.5 }));
    tail.position.set(s * 0.62, 0.9, -2.02);
    group.add(tail);
  }
  const signTex = (() => {
    const { c, ctx } = canvas2d(256, 96);
    ctx.fillStyle = '#f6e8cb'; ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#2f3136'; ctx.font = 'bold 58px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TAXI', 128, 50);
    return canvasTexture(c);
  })();
  for (const s of [-1, 1]) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.24), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    sign.position.set(0, 1.94, -0.18);
    sign.rotation.y = s * Math.PI / 2;
    group.add(sign);
  }
  const plateTex = (() => {
    const { c, ctx } = canvas2d(128, 64);
    ctx.fillStyle = '#f3e7c9'; ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#3b4f77'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('NYC', 64, 42);
    return canvasTexture(c);
  })();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: plateTex }));
  plate.position.set(0, 0.55, -2.02);
  plate.rotation.y = Math.PI;
  group.add(plate);
  group.traverse((o) => { if (o.isMesh && o.material !== glass) { o.castShadow = true; o.receiveShadow = true; } });
  const shadow = blobShadow(1.8, 0.28);
  shadow.position.y = 0.02;
  group.add(shadow);
  return group;
}

/* ------------------------------------------------------------------ */
/*  NY skyline & bridge backdrops                                      */
/* ------------------------------------------------------------------ */
export function createSkyline() {
  const group = new THREE.Group();
  const r = mulberry32(42);
  const palette = ['#8c9aa6', '#7b8b99', '#9aa7b1', '#748692', '#8a94a2', '#a3aeb5'];
  const buildings = [];
  const count = 34;
  for (let i = 0; i < count; i++) {
    const h = 10 + r() * 34;
    const w = 4 + r() * 7;
    const d = 4 + r() * 7;
    const x = -95 + (i / count) * 190 + (r() - 0.5) * 5;
    const z = 95 + r() * 55 - Math.abs(x) * 0.15;
    const mat = new THREE.MeshStandardMaterial({
      color: palette[i % palette.length],
      roughness: 0.85,
      map: (() => {
        const { c, ctx } = canvas2d(128, 256);
        ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(0, 0, 128, 256);
        for (let y = 0; y < 16; y++) {
          for (let xx = 0; xx < 6; xx++) {
            const lit = r() < 0.25;
            ctx.fillStyle = lit ? '#f6d99b' : 'rgba(46,60,72,.55)';
            ctx.fillRect(8 + xx * 19, 8 + y * 15, 11, 8);
          }
        }
        return canvasTexture(c);
      })(),
      emissive: new THREE.Color('#ffcf88'),
      emissiveIntensity: 0.04,
    });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, h / 2 - 1.2, z);
    b.castShadow = false;
    b.receiveShadow = false;
    group.add(b);
    buildings.push(b);
    if (r() > 0.55) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, h * 0.12, d * 0.55), mat);
      cap.position.set(x, h + h * 0.05, z);
      group.add(cap);
    }
    if (r() > 0.82) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 8 + r() * 12, 6), S('#8a969e'));
      spire.position.set(x, h + 7, z);
      group.add(spire);
    }
  }
  function glow(on = true) {
    buildings.forEach((b) => { b.material.emissiveIntensity = on ? 0.6 : 0.04; });
  }
  return { group, glow, buildings };
}

export function createSuspensionBridge(scale = 1) {
  const group = new THREE.Group();
  const cableMat = new THREE.LineBasicMaterial({ color: '#5c656d' });
  const towerMat = S('#8b7f6d', { roughness: 0.9 });
  const deckMat = S('#6d6253', { roughness: 0.9 });
  const W = 60, H = 22;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, 4), deckMat);
  deck.position.y = 2;
  group.add(deck);
  for (const x of [-W * 0.25, W * 0.25]) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, H, 1.2), towerMat);
      leg.position.set(x + s * 1.6, H / 2, 0);
      group.add(leg);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1.4), towerMat);
    top.position.set(x, H, 0);
    group.add(top);
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3.4), towerMat);
    base.position.set(x, 1, 0);
    group.add(base);
  }
  const cables = [];
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const x = -W / 2 + t * W;
      let y;
      if (x < -W * 0.25) {
        const k = (x + W / 2) / (W * 0.25);
        y = 2.5 + k * (H - 2.5) + Math.sin(k * Math.PI) * 2.5;
      } else if (x > W * 0.25) {
        const k = (W / 2 - x) / (W * 0.25);
        y = 2.5 + k * (H - 2.5) + Math.sin(k * Math.PI) * 2.5;
      } else {
        const k = (x + W * 0.25) / (W * 0.5);
        y = H - Math.sin(k * Math.PI) * 6;
      }
      pts.push(new THREE.Vector3(x, y, s * 1.8));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
    cables.push(pts);
  }
  for (let i = 4; i < W - 4; i += 5) {
    const x = -W / 2 + i;
    const t = i / W;
    let y;
    if (x < -W * 0.25) {
      const k = (x + W / 2) / (W * 0.25);
      y = 2.5 + k * (H - 2.5) + Math.sin(k * Math.PI) * 2.5;
    } else if (x > W * 0.25) {
      const k = (W / 2 - x) / (W * 0.25);
      y = 2.5 + k * (H - 2.5) + Math.sin(k * Math.PI) * 2.5;
    } else {
      const k = (x + W * 0.25) / (W * 0.5);
      y = H - Math.sin(k * Math.PI) * 6;
    }
    for (const s of [-1, 1]) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 2.6, s * 1.8), new THREE.Vector3(x, y, s * 1.8),
      ]), cableMat);
      group.add(line);
    }
  }
  group.scale.setScalar(scale);
  return group;
}
