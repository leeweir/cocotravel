import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  TAU, copperTexture, canvas2d, canvasTexture, signTexture, addMesh,
} from '../../core/utils.js';
import { createStairs } from '../props.js';

const copperMat = () => new THREE.MeshStandardMaterial({
  map: copperTexture(), color: '#e6f2e9', roughness: 0.58, metalness: 0.22,
});
const granite = new THREE.MeshStandardMaterial({ color: '#c9bca4', roughness: 0.92 });
const graniteDark = new THREE.MeshStandardMaterial({ color: '#ac9e87', roughness: 0.95 });
const bronze = new THREE.MeshStandardMaterial({ color: '#7d9b8b', roughness: 0.5, metalness: 0.4 });

function cylinderBetween(a, b, r1, r2, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r2, r1, len, 10);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function tabletTexture() {
  const { c, ctx } = canvas2d(256, 340);
  ctx.fillStyle = '#8fae9e';
  ctx.fillRect(0, 0, 256, 340);
  ctx.strokeStyle = 'rgba(58,86,72,.6)';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 224, 308);
  ctx.fillStyle = 'rgba(47,74,60,.78)';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px Georgia';
  ctx.fillText('JULY IV', 128, 132);
  ctx.fillText('MDCCLXXVI', 128, 178);
  ctx.font = '22px Georgia';
  ctx.fillText('1776', 128, 242);
  return canvasTexture(c);
}

export function createLiberty() {
  const group = new THREE.Group();
  const copper = copperMat();
  const flameMat = new THREE.MeshStandardMaterial({
    color: '#ffe9b0', emissive: '#ffb648', emissiveIntensity: 0.1, roughness: 0.4,
    transparent: true, opacity: 0.95,
  });
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: '#ffcf6a', transparent: true, opacity: 0.0, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const windowMats = [];
  let lit = 0;
  let litTarget = 0;
  let time = 0;

  /* ---------- star fort ---------- */
  const starShape = new THREE.Shape();
  const points = 11;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 11.4 : 8.2;
    const a = (i / (points * 2)) * TAU + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const fortGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 1.8, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.18, bevelThickness: 0.16,
  });
  fortGeo.rotateX(-Math.PI / 2);
  const fort = new THREE.Mesh(fortGeo, granite);
  fort.position.y = 0;
  fort.castShadow = true;
  fort.receiveShadow = true;
  group.add(fort);

  // fort top trim
  const trim = new THREE.Mesh(new THREE.TorusGeometry(8.15, 0.18, 5, 11), graniteDark);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.82;
  trim.rotation.z = Math.PI / 2;
  trim.scale.set(1, 1.35, 1);
  group.add(trim);

  // low parapet blocks around points
  for (let i = 0; i < points; i++) {
    const a = (i / points) * TAU + Math.PI / 2;
    const block = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.55, 0.7, 2, 0.12), graniteDark);
    block.position.set(Math.cos(a) * 9.6, 2.05, Math.sin(a) * 9.6);
    block.rotation.y = -a + Math.PI / 2;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  }

  // entrance stairs up to fort (south)
  const stairs = createStairs({ steps: 9, width: 4.2, rise: 0.2, run: 0.42, color: '#c9bca4' });
  stairs.group.position.set(0, 0, 11.7);
  group.add(stairs.group);

  /* ---------- pedestal ---------- */
  const pedestal = new THREE.Group();
  pedestal.position.y = 1.8;
  group.add(pedestal);

  addMesh(pedestal, new THREE.CylinderGeometry(5.4, 5.9, 1.0, 8), graniteDark, [0, 0.5, 0]);
  addMesh(pedestal, new THREE.CylinderGeometry(4.7, 5.1, 0.8, 8), granite, [0, 1.4, 0]);
  addMesh(pedestal, new THREE.CylinderGeometry(3.8, 4.0, 3.6, 8), granite, [0, 3.6, 0]);
  addMesh(pedestal, new THREE.CylinderGeometry(4.5, 4.0, 0.6, 8), graniteDark, [0, 5.7, 0]);
  addMesh(pedestal, new THREE.CylinderGeometry(3.95, 3.95, 0.3, 8), granite, [0, 6.15, 0]);
  addMesh(pedestal, new RoundedBoxGeometry(3.4, 0.9, 3.4, 2, 0.1), graniteDark, [0, 6.75, 0]);

  // pilasters
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    const pil = new THREE.Mesh(new RoundedBoxGeometry(0.52, 3.3, 0.24, 2, 0.05), granite);
    pil.position.set(Math.cos(a) * 3.78, 3.6, Math.sin(a) * 3.78);
    pil.rotation.y = -a + Math.PI / 2;
    pil.castShadow = true;
    pedestal.add(pil);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.36), graniteDark);
    cap.position.set(Math.cos(a) * 3.78, 5.3, Math.sin(a) * 3.78);
    cap.rotation.y = -a + Math.PI / 2;
    pedestal.add(cap);
  }

  // balustrade
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * TAU + Math.PI / 8;
    const a1 = ((i + 1) / 8) * TAU + Math.PI / 8;
    const mid = (a0 + a1) / 2;
    const len = 2 * 3.95 * Math.sin((a1 - a0) / 2);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, len), granite);
    rail.position.set(Math.cos(mid) * 3.95, 6.55, Math.sin(mid) * 3.95);
    rail.rotation.y = -mid;
    pedestal.add(rail);
    for (let k = 0; k <= 3; k++) {
      const a = a0 + (a1 - a0) * (k / 3);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.45, 6), granite);
      post.position.set(Math.cos(a) * 3.95, 6.42, Math.sin(a) * 3.95);
      pedestal.add(post);
    }
  }

  // south door and windows
  const door = new THREE.Mesh(new RoundedBoxGeometry(1.5, 2.3, 0.4, 3, 0.5), new THREE.MeshStandardMaterial({ color: '#5c4a3b', roughness: 0.8 }));
  door.position.set(0, 2.1, 3.62);
  pedestal.add(door);
  const doorTop = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.4, 12, 1, false, 0, Math.PI), graniteDark);
  doorTop.rotation.set(Math.PI / 2, 0, 0);
  doorTop.position.set(0, 3.25, 3.62);
  pedestal.add(doorTop);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.26, 0.5), graniteDark);
  lintel.position.set(0, 3.75, 3.65);
  pedestal.add(lintel);

  const plaqueTex = signTexture('LIBERTY', { sub: 'ENLIGHTENING THE WORLD', bg: '#b7ab94', fg: '#4b4132', border: '#6d6252', size: 52, tape: false });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.85 }));
  plaque.position.set(0, 4.6, 3.82);
  pedestal.add(plaque);

  for (const [x, y, rot] of [[0, 3.9, 0], [Math.PI / 2, 3.9, 0], [Math.PI, 3.9, 0], [Math.PI * 1.5, 3.9, 0]]) {
    const wmat = new THREE.MeshStandardMaterial({ color: '#4a4640', emissive: '#ffc46b', emissiveIntensity: 0, roughness: 0.4 });
    windowMats.push(wmat);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.2), wmat);
    win.position.set(Math.cos(x) * 3.83, y, Math.sin(x) * 3.83);
    win.rotation.y = -x + Math.PI / 2;
    pedestal.add(win);
  }
  // corner lamps
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const lampMat = new THREE.MeshStandardMaterial({ color: '#f7dfae', emissive: '#ffbe62', emissiveIntensity: 0.1, roughness: 0.4 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), lampMat);
    lamp.position.set(Math.cos(a) * 4.05, 6.75, Math.sin(a) * 4.05);
    pedestal.add(lamp);
  }

  /* ---------- statue ---------- */
  const statue = new THREE.Group();
  statue.position.y = 7.2;
  pedestal.add(statue);

  // robe trunk with drapery folds
  const profile = [
    [0.001, 0], [1.65, 0.02], [1.9, 0.28], [1.78, 0.9], [1.63, 1.9],
    [1.55, 3.0], [1.5, 4.1], [1.42, 5.1], [1.28, 5.9], [1.02, 6.55],
    [0.66, 6.9], [0.42, 7.0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const robeGeo = new THREE.LatheGeometry(profile, 40);
  const rp = robeGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i);
    const a = Math.atan2(z, x);
    const fade = 1 - Math.min(1, y / 6.2) * 0.55;
    const fold = 1 + Math.sin(a * 11 + 0.4) * 0.038 * fade + Math.sin(a * 5 + 1.4) * 0.022 * fade;
    rp.setX(i, x * fold);
    rp.setZ(i, z * fold);
    if (y < 0.3) rp.setY(i, y + Math.sin(a * 7) * 0.035);
  }
  robeGeo.computeVertexNormals();
  const robe = new THREE.Mesh(robeGeo, copper);
  robe.castShadow = true;
  robe.receiveShadow = true;
  statue.add(robe);

  // robe hem ripple
  const hem = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.1, 6, 40), copper);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.12;
  statue.add(hem);

  // feet
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.22, 0.9, 2, 0.1), copper);
    foot.position.set(s * 0.55, 0.07, 1.44);
    foot.rotation.y = s * 0.12;
    statue.add(foot);
  }

  // sash across body
  const sash = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.13, 6, 30), copper);
  sash.rotation.x = Math.PI / 2 + 0.06;
  sash.rotation.z = 0.05;
  sash.position.y = 4.15;
  statue.add(sash);
  const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.52, 1.9, 12, 1, true), copper);
  drape.position.set(-1.35, 3.1, 0.55);
  drape.rotation.z = 0.25;
  statue.add(drape);

  // chest drapery / folds
  for (let i = 0; i < 4; i++) {
    const strip = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 2.2, 4, 6), copper);
    strip.position.set(-0.7 + i * 0.42, 4.6 - i * 0.15, 1.28 - i * 0.03);
    strip.rotation.z = -0.12 + i * 0.08;
    strip.rotation.x = 0.15;
    statue.add(strip);
  }

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.35, 10), copper);
  neck.position.y = 7.05;
  statue.add(neck);
  const head = new THREE.Group();
  head.position.y = 7.6;
  statue.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), copper);
  skull.scale.set(0.92, 1.06, 1);
  skull.castShadow = true;
  head.add(skull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 6), copper);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.05, 0.51);
  head.add(nose);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.1, 3, 6), new THREE.MeshStandardMaterial({ color: '#7a9c8c', roughness: 0.6 }));
    eye.position.set(s * 0.19, 0.11, 0.46);
    eye.rotation.z = Math.PI / 2;
    eye.scale.set(1, 1, 0.4);
    head.add(eye);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.16, 3, 5), copper);
    brow.position.set(s * 0.19, 0.25, 0.47);
    brow.rotation.z = Math.PI / 2 + s * 0.12;
    head.add(brow);
  }
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.04), new THREE.MeshStandardMaterial({ color: '#7fa090', roughness: 0.6 }));
  lips.position.set(0, -0.24, 0.47);
  head.add(lips);

  // hair & bun
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 14, 0, TAU, 0, Math.PI * 0.62), copper);
  hair.position.set(0, 0.02, -0.03);
  head.add(hair);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), copper);
  bun.position.set(0, 0.06, -0.5);
  bun.scale.set(1.2, 0.9, 0.8);
  head.add(bun);
  const hairRollL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 8), copper);
  hairRollL.position.set(-0.4, -0.1, 0.18);
  hairRollL.rotation.z = 0.3;
  head.add(hairRollL);
  const hairRollR = hairRollL.clone();
  hairRollR.position.x = 0.4;
  hairRollR.rotation.z = -0.3;
  head.add(hairRollR);

  // crown
  const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.28, 24, 1, true), bronze);
  crownBand.position.y = 0.42;
  head.add(crownBand);
  const rayMat = new THREE.MeshStandardMaterial({ color: '#8fb3a0', roughness: 0.45, metalness: 0.35 });
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.62 + (i / 6) * Math.PI * 1.24;
    const ray = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.95, 5), rayMat);
    ray.position.set(Math.sin(a) * 0.62, 0.95, Math.cos(a) * 0.3 - 0.08);
    ray.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    ray.castShadow = true;
    head.add(ray);
  }

  // right arm raised with torch
  const shoulderR = new THREE.Vector3(-0.92, 6.05, 0.05);
  const elbowR = new THREE.Vector3(-1.42, 7.35, 0.16);
  const wristR = new THREE.Vector3(-1.66, 8.42, 0.22);
  statue.add(cylinderBetween(shoulderR, elbowR, 0.34, 0.27, copper));
  statue.add(cylinderBetween(elbowR, wristR, 0.26, 0.2, copper));
  const shoulderDrape = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.35, 8, 1, true), copper);
  shoulderDrape.position.copy(shoulderR).add(new THREE.Vector3(-0.1, -0.55, 0));
  shoulderDrape.rotation.z = 0.15;
  statue.add(shoulderDrape);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), copper);
  handR.position.copy(wristR);
  handR.scale.set(0.9, 1.1, 0.8);
  statue.add(handR);

  const torch = new THREE.Group();
  torch.position.copy(wristR).add(new THREE.Vector3(-0.06, 0.26, 0));
  statue.add(torch);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.62, 10), bronze);
  stem.position.y = 0.3;
  torch.add(stem);
  const cup = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.08, 0), new THREE.Vector2(0.24, 0.16), new THREE.Vector2(0.34, 0.38),
    new THREE.Vector2(0.28, 0.44), new THREE.Vector2(0.2, 0.36),
  ], 14), bronze);
  cup.position.y = 0.58;
  cup.castShadow = true;
  torch.add(cup);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), flameMat);
  flame.scale.set(0.9, 1.9, 0.9);
  flame.position.y = 1.22;
  flame.castShadow = false;
  torch.add(flame);
  const outerFlame = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), outerFlameMat);
  outerFlame.scale.set(0.9, 1.9, 0.9);
  outerFlame.position.y = 1.24;
  torch.add(outerFlame);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    map: (() => {
      const { c, ctx } = canvas2d(128, 128);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,230,170,.9)');
      g.addColorStop(0.5, 'rgba(255,190,90,.35)');
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      return canvasTexture(c);
    })(),
  }));
  glow.scale.setScalar(5.5);
  glow.position.y = 1.3;
  torch.add(glow);
  const torchLight = new THREE.PointLight(0xffc066, 0, 40, 1.8);
  torchLight.position.y = 1.3;
  torch.add(torchLight);

  // left arm + tablet
  const shoulderL = new THREE.Vector3(0.92, 6.05, 0.05);
  const elbowL = new THREE.Vector3(1.38, 5.4, 0.4);
  const wristL = new THREE.Vector3(1.2, 4.85, 0.85);
  statue.add(cylinderBetween(shoulderL, elbowL, 0.32, 0.26, copper));
  statue.add(cylinderBetween(elbowL, wristL, 0.25, 0.19, copper));
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), copper);
  handL.position.copy(wristL);
  statue.add(handL);
  const tabletMat = new THREE.MeshStandardMaterial({ map: tabletTexture(), roughness: 0.62, metalness: 0.15 });
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.85, 0.2), [
    copper, copper, copper, copper,
    tabletMat, copper,
  ]);
  tablet.position.set(1.15, 5.45, 1.02);
  tablet.rotation.set(0.22, -0.3, -0.16);
  tablet.castShadow = true;
  statue.add(tablet);

  // sparkle motes around torch (lit only)
  const motes = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: (() => {
        const { c, ctx } = canvas2d(32, 32);
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255,250,230,1)');
        g.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
        return canvasTexture(c);
      })(),
    }));
    s.userData = { phase: Math.random() * TAU, speed: 0.4 + Math.random() * 0.7, rad: 0.4 + Math.random() * 0.8 };
    s.scale.setScalar(0.28);
    torch.add(s);
    motes.push(s);
  }

  group.traverse((o) => {
    if (o.isMesh && o !== fort) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  const torchAnchor = new THREE.Vector3(0, 1.8 + 7.2 + torch.position.y + 1.2, 0);
  const crownAnchor = new THREE.Vector3(0, 1.8 + 7.2 + 7.6, 0);

  function setLit(on) {
    litTarget = on ? 1 : 0;
  }

  function update(dt, t) {
    time = t;
    lit += (litTarget - lit) * Math.min(1, dt * 1.6);
    flameMat.emissiveIntensity = 0.1 + lit * (2.6 + Math.sin(t * 9) * 0.35);
    flame.scale.set(0.9 + Math.sin(t * 7.3) * 0.05 * lit, 1.9 + Math.sin(t * 6.1) * 0.14 * lit, 0.9);
    outerFlameMat.opacity = lit * (0.35 + Math.sin(t * 5.3) * 0.08);
    outerFlame.scale.set(0.9 + Math.sin(t * 4) * 0.06, 1.9 + Math.cos(t * 5) * 0.12, 0.9);
    glow.material.opacity = lit * 0.85;
    glow.scale.setScalar(5.5 + Math.sin(t * 3) * 0.4);
    torchLight.intensity = lit * 46;
    windowMats.forEach((m) => { m.emissiveIntensity = lit * 1.7; });
    copper.emissive = new THREE.Color('#3a2412');
    copper.emissiveIntensity = lit * 0.12;
    motes.forEach((s) => {
      const u = s.userData;
      const k = (t * u.speed + u.phase) % 1;
      s.position.set(Math.cos(u.phase * 3 + t) * u.rad * (1 - k), 1.0 + k * 2.2, Math.sin(u.phase * 2 + t) * u.rad * (1 - k));
      s.material.opacity = Math.sin(k * Math.PI) * 0.8 * lit;
    });
    head.rotation.y = Math.sin(t * 0.12) * 0.02;
  }

  return {
    group,
    update,
    setLit,
    get lit() { return lit; },
    walkables: [fort, ...stairs.walkables],
    colliders: [
      { type: 'circle', x: 0, z: 0, r: 6.05 },
    ],
    stairs: stairs.group,
    anchors: { torch: torchAnchor, crown: crownAnchor },
    heart: new THREE.Vector3(0, 2.35, 7.2),
    statue,
    pedestal,
  };
}
