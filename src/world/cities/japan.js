import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THEMES, createEnvironment, createIsland, createBirds, createPetals } from '../environment.js';
import {
  createTree, createPine, createBush, createBench, createStoneLantern,
  createVendingMachine, createStringLanterns, createSign, createCrate, createFlowerBed,
  createStairs, createBicycle,
} from '../props.js';
import { createBuildingRow } from '../buildings.js';
import { createTokyoTower } from '../landmarks/tokyotower.js';
import { createPagoda, createMtFuji } from '../landmarks/japan.js';
import { createNPC } from '../npc.js';
import { createSpark, createQuestItem } from '../collectibles.js';
import {
  grassTexture, pavingTexture, flagTexture, dotTexture,
  canvas2d, canvasTexture, TAU,
} from '../../core/utils.js';
import {
  addPath, addCirclePatch, addGroundPatch, placeLandmark, addFlag, labelSprite,
} from './common.js';

function createKoiPond() {
  const group = new THREE.Group();
  const radius = 4;
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#6aa9a2', roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.82,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.07;
  group.add(water);
  const rimMat = new THREE.MeshStandardMaterial({ color: '#9a9184', roughness: 0.95, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.2, 0), rimMat);
    rock.position.set(Math.cos(a) * (radius + 0.18), 0.12, Math.sin(a) * (radius + 0.18));
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.6;
    rock.castShadow = true;
    group.add(rock);
  }
  // lily pads
  const padMat = new THREE.MeshStandardMaterial({ color: '#6f9555', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.25 + Math.random() * 0.18, 12, 0.4, Math.PI * 1.7), padMat);
    pad.rotation.x = -Math.PI / 2;
    const a = Math.random() * TAU, rr = 1.2 + Math.random() * 2;
    pad.position.set(Math.cos(a) * rr, 0.09, Math.sin(a) * rr);
    group.add(pad);
  }
  const koi = [];
  const colors = ['#e8875c', '#f0e7d8', '#e8a85c', '#df6e50', '#f4f0e2'];
  for (let i = 0; i < 6; i++) {
    const fish = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bodyMat);
    body.scale.set(0.55, 0.42, 1.35);
    fish.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 6), bodyMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.16;
    fish.add(tail);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), new THREE.MeshBasicMaterial({ color: 0x2e241f }));
      eye.position.set(s * 0.045, 0.015, 0.1);
      fish.add(eye);
    }
    fish.position.y = 0.1;
    fish.userData = { a: Math.random() * TAU, r: 1 + Math.random() * 2.3, speed: 0.12 + Math.random() * 0.12, phase: Math.random() * TAU };
    group.add(fish);
    koi.push(fish);
  }
  function update(dt, t) {
    waterMat.opacity = 0.78 + Math.sin(t * 1.3) * 0.04;
    for (const f of koi) {
      const u = f.userData;
      u.a += u.speed * dt;
      f.position.x = Math.cos(u.a) * u.r + Math.sin(t * 0.4 + u.phase) * 0.2;
      f.position.z = Math.sin(u.a) * u.r * 0.8;
      f.rotation.y = -u.a + Math.PI / 2;
      f.position.y = 0.1 + Math.sin(t * 2 + u.phase) * 0.015;
      f.children[1].rotation.z = Math.sin(t * 5 + u.phase) * 0.35;
    }
  }
  return { group, update, radius };
}

function createBamboo(count = 14) {
  const group = new THREE.Group();
  const stalkMat = new THREE.MeshStandardMaterial({ color: '#7ca25f', roughness: 0.85 });
  const nodeMat = new THREE.MeshStandardMaterial({ color: '#5c7d44', roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#88ac63', roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < count; i++) {
    const x = -5 + Math.random() * 10;
    const z = -5 + Math.random() * 10;
    const h = 3.2 + Math.random() * 2.4;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, h, 6), stalkMat);
    stalk.position.set(x, h / 2, z);
    stalk.rotation.z = (Math.random() - 0.5) * 0.08;
    stalk.castShadow = true;
    group.add(stalk);
    for (let k = 1; k < 5; k++) {
      const node = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 8), nodeMat);
      node.rotation.x = Math.PI / 2;
      node.position.set(x, (h / 5) * k, z);
      group.add(node);
    }
    for (let k = 0; k < 3; k++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), leafMat);
      leaf.position.set(x + (Math.random() - 0.5) * 0.7, h - 0.3 - k * 0.4, z + (Math.random() - 0.5) * 0.7);
      leaf.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * TAU, (Math.random() - 0.5) * 0.8);
      group.add(leaf);
    }
  }
  return group;
}

function createRamenStall() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8f6744', roughness: 0.85 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#5b422d', roughness: 0.9 });
  const counter = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.05, 1.1, 2, 0.08), wood);
  counter.position.y = 0.55;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.5, 6), darkWood);
    post.position.set(s * 1.6, 1.25, -0.45);
    group.add(post);
  }
  const roof = new THREE.Mesh(new RoundedBoxGeometry(3.9, 0.16, 2.0, 2, 0.04), darkWood);
  roof.position.set(0, 2.55, -0.1);
  roof.rotation.x = 0.06;
  group.add(roof);
  // noren curtain
  const norenTex = (() => {
    const { c, ctx } = canvas2d(512, 220);
    ctx.fillStyle = '#34465a'; ctx.fillRect(0, 0, 512, 220);
    ctx.fillStyle = '#f4e7cf';
    ctx.font = '600 96px "Hiragino Sans GB", "PingFang SC", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('らーめん', 256, 112);
    ctx.fillStyle = 'rgba(52,70,90,.8)';
    for (let i = 1; i < 4; i++) ctx.fillRect(i * 128 - 3, 0, 6, 220);
    return canvasTexture(c);
  })();
  const noren = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.7), new THREE.MeshStandardMaterial({
    map: norenTex, side: THREE.DoubleSide, roughness: 0.9,
  }));
  noren.position.set(0, 2.1, 0.52);
  group.add(noren);

  // stools
  for (const x of [-1.1, 0, 1.1]) {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12), new THREE.MeshStandardMaterial({ color: '#cf5c4d' }));
    seat.position.set(x, 0.48, 1.1);
    seat.castShadow = true;
    group.add(seat);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.46, 5), darkWood);
      leg.position.set(x + Math.cos(a) * 0.14, 0.23, 1.1 + Math.sin(a) * 0.14);
      group.add(leg);
    }
  }
  // bowls & pot
  for (let i = 0; i < 3; i++) {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.12, 12), new THREE.MeshStandardMaterial({ color: '#eae1cf' }));
    bowl.position.set(-0.85 + i * 0.85, 1.14, 0.15);
    group.add(bowl);
    const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.015, 12), new THREE.MeshStandardMaterial({ color: '#c98a4e' }));
    soup.position.set(-0.85 + i * 0.85, 1.2, 0.15);
    group.add(soup);
    const chop = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.4, 4), darkWood);
    chop.rotation.x = Math.PI / 2;
    chop.position.set(-0.85 + i * 0.85 + 0.12, 1.25, 0.15);
    group.add(chop);
  }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.38, 14), new THREE.MeshStandardMaterial({ color: '#8a8f8c', metalness: 0.5, roughness: 0.45 }));
  pot.position.set(-1.1, 1.32, -0.2);
  group.add(pot);

  // red lantern
  const lantern = new THREE.Group();
  const lanMat = new THREE.MeshStandardMaterial({ color: '#d96a4e', emissive: '#ff8457', emissiveIntensity: 1.1, roughness: 0.65 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.45, 12), lanMat);
  body.scale.y = 1.1;
  lantern.add(body);
  for (const y of [-0.23, 0.23]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 12), darkWood);
    band.position.y = y;
    lantern.add(band);
  }
  const lanLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshBasicMaterial({
    map: (() => {
      const { c, ctx } = canvas2d(128, 96);
      ctx.fillStyle = '#d96a4e'; ctx.fillRect(0, 0, 128, 96);
      ctx.fillStyle = '#f8e9c9'; ctx.font = 'bold 54px "Hiragino Sans GB", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('麺', 64, 50);
      return canvasTexture(c);
    })(),
    side: THREE.DoubleSide,
  }));
  lanLabel.position.z = 0.29;
  lantern.add(lanLabel);
  lantern.position.set(1.85, 2.0, 0.3);
  group.add(lantern);

  const steam = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture(), color: '#fffaf0', transparent: true, opacity: 0.18, depthWrite: false,
    }));
    s.position.set(-0.9 + i * 0.4, 1.35, -0.1);
    s.scale.setScalar(0.4);
    s.userData.phase = Math.random();
    group.add(s);
    steam.push(s);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  function update(dt, t) {
    steam.forEach((s, i) => {
      const k = (t * 0.2 + s.userData.phase) % 1;
      s.position.y = 1.35 + k * 1.3;
      s.position.x = -0.9 + i * 0.4 + Math.sin(t * 1.2 + i) * 0.09;
      s.material.opacity = 0.22 * (1 - k);
      s.scale.setScalar(0.35 + k * 0.7);
    });
    lantern.rotation.z = Math.sin(t * 1.1) * 0.04;
  }
  return { group, update };
}

function createMochi() {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  const white = new THREE.MeshStandardMaterial({ color: '#f6efe2', roughness: 0.8 });
  const orange = new THREE.MeshStandardMaterial({ color: '#df9d5e', roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#4a4038', roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), white);
  body.scale.set(1, 1.2, 0.9);
  body.position.y = 0.24;
  body.castShadow = true;
  bodyGroup.add(body);
  const patch = new THREE.Mesh(new THREE.SphereGeometry(0.205, 14, 10, 0, Math.PI * 0.9, 0, Math.PI * 0.7), orange);
  patch.position.set(0.02, 0.28, -0.01);
  bodyGroup.add(patch);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), white);
  head.position.y = 0.52;
  head.castShadow = true;
  bodyGroup.add(head);
  const headPatch = new THREE.Mesh(new THREE.SphereGeometry(0.162, 14, 10, 0, Math.PI * 0.8, 0, Math.PI * 0.65), dark);
  headPatch.position.set(-0.02, 0.545, -0.02);
  bodyGroup.add(headPatch);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.14, 4), s > 0 ? orange : dark);
    ear.position.set(s * 0.1, 0.66, 0);
    ear.rotation.z = s * -0.25;
    ear.castShadow = true;
    bodyGroup.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.08, 4), new THREE.MeshStandardMaterial({ color: '#f0b8a2', roughness: 0.9 }));
    inner.position.set(s * 0.1, 0.655, 0.022);
    inner.rotation.z = s * -0.25;
    bodyGroup.add(inner);
  }
  // eyes (happy arcs)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3a2c24 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 4, 10, Math.PI), eyeMat);
    eye.position.set(s * 0.06, 0.53, 0.147);
    eye.rotation.z = Math.PI;
    bodyGroup.add(eye);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.02, 8), new THREE.MeshBasicMaterial({ color: 0xe59b8a, transparent: true, opacity: 0.5 }));
    blush.position.set(s * 0.105, 0.49, 0.14);
    bodyGroup.add(blush);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 5), new THREE.MeshBasicMaterial({ color: 0xd08776 }));
  nose.position.set(0, 0.515, 0.16);
  bodyGroup.add(nose);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.13, 3), eyeMat);
      whisker.position.set(s * 0.13, 0.505 + i * 0.02, 0.13);
      whisker.rotation.z = Math.PI / 2 + s * (i ? -0.2 : 0.2);
      bodyGroup.add(whisker);
    }
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 6, 16), new THREE.MeshStandardMaterial({ color: '#c95b4e', roughness: 0.7 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.37;
  bodyGroup.add(collar);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), new THREE.MeshStandardMaterial({ color: '#e7c05a', metalness: 0.6, roughness: 0.3 }));
  bell.position.set(0, 0.34, 0.11);
  bodyGroup.add(bell);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.28, 4, 6), white);
  tail.position.set(-0.2, 0.22, -0.14);
  tail.rotation.z = 0.8;
  tail.rotation.x = 0.3;
  bodyGroup.add(tail);
  for (const s of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), white);
    paw.scale.set(0.9, 0.6, 1.2);
    paw.position.set(s * 0.11, 0.08, 0.16);
    bodyGroup.add(paw);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({
    color: 0x2c2119, transparent: true, opacity: 0.2, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const name = labelSprite(['Mochi', '招财猫'], { width: 1.4, height: 0.42, scale: 1 });
  name.position.y = 1.25;
  root.add(name);

  const markerTex = (() => {
    const { c, ctx } = canvas2d(128, 128);
    ctx.beginPath(); ctx.arc(64, 58, 34, 0, TAU);
    ctx.fillStyle = '#fffaf0'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#7b8b99'; ctx.stroke();
    ctx.fillStyle = '#7b8b99'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('…', 64, 58);
    return canvasTexture(c);
  })();
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex, transparent: true, depthWrite: false }));
  marker.scale.setScalar(0.48);
  marker.position.y = 1.0;
  root.add(marker);

  let talking = false;
  let time = 0;
  function update(dt, t, playerPos) {
    time += dt;
    bodyGroup.position.y = Math.sin(time * 1.7) * 0.012;
    tail.rotation.z = 0.8 + Math.sin(time * 1.3) * 0.25;
    marker.position.y = 1.0 + Math.sin(time * 2.2) * 0.05;
    marker.visible = !talking;
    if (playerPos) {
      const dx = playerPos.x - root.position.x;
      const dz = playerPos.z - root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 5) {
        const target = Math.atan2(dx, dz);
        let diff = target - root.rotation.y;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        root.rotation.y += diff * Math.min(1, dt * 4);
        head.rotation.y = Math.max(-0.4, Math.min(0.4, diff)) * 0.6;
      }
    }
    if (talking) {
      head.rotation.z = Math.sin(time * 2) * 0.08;
    }
  }
  function setMarker() {}
  function setTalking(on) { talking = on; marker.visible = !on; name.visible = !on; }
  return {
    def: { id: 'mochi', name: 'Mochi', nameSub: '招财猫', species: 'cat', marker: 'hint', dialogues: {} },
    root, body: bodyGroup, headGroup: head, marker, nameSprite: name, update, setMarker, setTalking,
  };
}

/* ------------------------------------------------------------------ */
/*  Asakusa architecture                                               */
/* ------------------------------------------------------------------ */

function box(parent, w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const MAT = {
  vermilion: new THREE.MeshStandardMaterial({ color: '#b23a2e', roughness: 0.72 }),
  vermilionDark: new THREE.MeshStandardMaterial({ color: '#8a2a22', roughness: 0.78 }),
  plaster: new THREE.MeshStandardMaterial({ color: '#efe5d0', roughness: 0.94 }),
  charcoal: new THREE.MeshStandardMaterial({ color: '#3c3b37', roughness: 0.64, metalness: 0.12 }),
  copper: new THREE.MeshStandardMaterial({ color: '#4e6259', roughness: 0.55, metalness: 0.3 }),
  stone: new THREE.MeshStandardMaterial({ color: '#b8ae99', roughness: 0.95 }),
  darkStone: new THREE.MeshStandardMaterial({ color: '#8d8575', roughness: 0.97 }),
  wood: new THREE.MeshStandardMaterial({ color: '#63482f', roughness: 0.86 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#443322', roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: '#c9a24e', roughness: 0.34, metalness: 0.62 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#6e6250', roughness: 0.5, metalness: 0.45 }),
  white: new THREE.MeshStandardMaterial({ color: '#f4f0e5', roughness: 0.78 }),
};

function lanternLabel(text) {
  const { c, ctx } = canvas2d(512, 512);
  ctx.clearRect(0, 0, 512, 512);
  ctx.fillStyle = '#241512';
  ctx.textAlign = 'center';
  const chars = [...text].slice(0, 3);
  ctx.font = `bold ${chars.length === 3 ? 116 : chars.length === 2 ? 168 : 210}px "Hiragino Mincho ProN", "Songti SC", serif`;
  const ys = chars.length === 3 ? [132, 274, 416] : chars.length === 2 ? [220, 410] : [330];
  chars.forEach((ch, i) => ctx.fillText(ch, 256, ys[i]));
  return canvasTexture(c);
}

function redLantern(radius, height, text) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#b33026', emissive: '#ff6f4e', emissiveIntensity: 0.32, roughness: 0.7,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, height, 24, 1, true), bodyMat);
  group.add(body);
  for (const s of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.04, radius * 1.04, 0.12, 24), MAT.darkWood);
    rim.position.y = s * (height / 2 - 0.02);
    group.add(rim);
  }
  for (const k of [-0.18, 0.18]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.99, 0.014, 4, 28), new THREE.MeshStandardMaterial({ color: '#73241d', roughness: 0.8 }));
    rib.rotation.x = Math.PI / 2;
    rib.position.y = k * height;
    group.add(rib);
  }
  const labelMat = new THREE.MeshBasicMaterial({
    map: lanternLabel(text), transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  const arc = Math.PI * 0.62;
  for (const s of [-1, 1]) {
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.008, radius * 1.008, height * 0.66, 16, 1, true, -arc / 2, arc),
      labelMat,
    );
    if (s < 0) label.rotation.y = Math.PI;
    group.add(label);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.4, 0.16, 10), MAT.darkWood);
  cap.position.y = height / 2 + 0.08;
  group.add(cap);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), MAT.darkWood);
  hook.position.y = height / 2 + 0.36;
  group.add(hook);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}

function hipRoof(group, { radius, height, y, scaleZ = 0.62, material = MAT.charcoal, ridge = 0, eaveFactor = null }) {
  const eaveW = radius * (eaveFactor ?? Math.SQRT2 * 1.06);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(eaveW, 0.26, eaveW * scaleZ), material);
  eave.position.y = y;
  eave.castShadow = true;
  eave.receiveShadow = true;
  group.add(eave);

  const W = radius * Math.SQRT2;
  const D = W * scaleZ;
  const hw = W / 2, hd = D / 2;
  const hl = Math.min(ridge || W * 0.42, W * 0.95) / 2;
  const v = [
    [-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],
    [-hl, height, 0], [hl, height, 0],
  ];
  const tris = [
    [3, 2, 5], [3, 5, 4],
    [1, 0, 4], [1, 4, 5],
    [0, 3, 4],
    [2, 1, 5],
  ];
  const positions = [];
  for (const t of tris) for (const i of t) positions.push(...v[i]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  const roof = new THREE.Mesh(geo, material);
  roof.position.y = y;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  if (ridge && W > 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(hl * 2 + 0.3, 0.3, 0.38), material);
    beam.position.y = y + height + 0.06;
    beam.castShadow = true;
    group.add(beam);
    for (const s of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), MAT.gold);
      end.position.set(s * (hl + 0.12), y + height + 0.1, 0);
      group.add(end);
    }
    const theta = Math.atan2(height, hd);
    const slopeLen = Math.hypot(height, hd);
    const ribs = W > 14 ? 9 : W > 7 ? 7 : 5;
    for (let i = 0; i < ribs; i++) {
      const x = -hl + (i / (ribs - 1)) * hl * 2;
      for (const s of [-1, 1]) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, slopeLen * 0.97), material);
        rib.position.set(x, y + height / 2 + Math.cos(theta) * 0.05, s * (hd / 2 + Math.sin(theta) * 0.05));
        rib.rotation.x = s > 0 ? theta : -theta;
        group.add(rib);
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.5), material);
    tip.position.set(Math.cos(a) * eaveW * 0.49, y + 0.06, Math.sin(a) * eaveW * 0.49 * scaleZ);
    tip.rotation.y = -a;
    tip.rotation.z = 0.16;
    group.add(tip);
  }
  return roof;
}

function createKaminarimon() {
  const group = new THREE.Group();
  const W = 10.4, D = 5.4;
  const base = box(group, W, 0.35, D, MAT.stone, 0, 0.175, 0);
  base.receiveShadow = true;

  for (const z of [-2.05, 2.05]) {
    for (const x of [-4.4, -2.4, 2.4, 4.4]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 5.0, 12), MAT.vermilion);
      col.position.set(x, 2.85, z);
      col.castShadow = true;
      group.add(col);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.34, 0.34, 10), MAT.charcoal);
      foot.position.set(x, 0.49, z);
      group.add(foot);
    }
  }
  for (const z of [-2.05, 2.05]) {
    box(group, W + 0.4, 0.26, 0.3, MAT.vermilionDark, 0, 4.6, z);
    box(group, W + 0.2, 0.2, 0.24, MAT.vermilion, 0, 1.15, z);
  }
  for (const x of [-4.4, 4.4]) {
    box(group, 0.28, 0.26, D, MAT.vermilionDark, x, 4.6, 0);
  }
  // balcony deck and upper storey
  box(group, W + 0.9, 0.24, D + 0.9, MAT.darkWood, 0, 5.16, 0);
  box(group, W + 0.98, 0.12, D + 0.98, MAT.vermilion, 0, 5.32, 0);
  for (const z of [-2.2, 2.2]) {
    for (const x of [-3.9, -1.3, 1.3, 3.9]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.4, 10), MAT.vermilion);
      col.position.set(x, 6.55, z);
      group.add(col);
    }
    box(group, 8.4, 0.18, 0.2, MAT.vermilionDark, 0, 7.65, z);
  }
  box(group, 8.2, 2.3, 0.24, MAT.plaster, 0, 6.6, -2.15);
  for (const x of [-4.05, 4.05]) box(group, 0.24, 2.3, 4.2, MAT.plaster, x, 6.6, 0);
  // railing around upper balcony
  for (const z of [-2.55, 2.55]) {
    box(group, W + 0.7, 0.1, 0.1, MAT.vermilionDark, 0, 6.55, z);
    for (let i = 0; i < 13; i++) {
      box(group, 0.07, 1.15, 0.07, MAT.vermilion, -W / 2 + 0.4 + i * (W - 0.8) / 12, 5.95, z);
    }
  }
  for (const x of [-5.0, 5.0]) {
    box(group, 0.1, 0.1, D + 0.1, MAT.vermilionDark, x, 6.55, 0);
  }
  hipRoof(group, { radius: 8.6, height: 3.3, y: 7.78, scaleZ: 0.62, ridge: 5.6 });
  // upper plaque
  const plaqueTex = (() => {
    const { c, ctx } = canvas2d(384, 256);
    ctx.fillStyle = '#2f2620'; ctx.fillRect(0, 0, 384, 256);
    ctx.strokeStyle = '#c9a24e'; ctx.lineWidth = 10; ctx.strokeRect(12, 12, 360, 232);
    ctx.fillStyle = '#e8d4a2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 128px "Hiragino Mincho ProN", serif';
    ctx.fillText('雷門', 192, 134);
    return canvasTexture(c);
  })();
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.0), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.8 }));
  plaque.position.set(0, 7.05, 2.24);
  group.add(plaque);
  // giant lantern
  const lantern = redLantern(1.32, 3.4, '雷門');
  lantern.position.set(0, 3.38, 0);
  group.add(lantern);
  // guardian statues in the side bays
  const guardianSkin = new THREE.MeshStandardMaterial({ color: '#96543f', roughness: 0.92 });
  const guardianCloth = new THREE.MeshStandardMaterial({ color: '#74352b', roughness: 0.95 });
  const guardianDark = new THREE.MeshStandardMaterial({ color: '#2f1c16', roughness: 0.9 });
  const guardianPale = new THREE.MeshStandardMaterial({ color: '#f1e3cd', roughness: 0.85 });
  for (const s of [-1, 1]) {
    const niche = new THREE.Group();
    const plinth = box(niche, 1.35, 0.9, 1.2, MAT.darkStone, 0, 0.45, 0);
    plinth.receiveShadow = true;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.48, 0.82, 8), guardianCloth);
    skirt.position.y = 1.32;
    niche.add(skirt);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.56, 4, 9), guardianSkin);
    torso.position.y = 1.96;
    torso.scale.set(1.12, 1, 0.76);
    niche.add(torso);
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.46), guardianCloth);
    sash.position.set(0, 1.62, 0.05);
    sash.rotation.z = 0.16;
    niche.add(sash);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.05), guardianCloth);
    scarf.position.set(s * 0.26, 1.9, -0.2);
    scarf.rotation.z = s * 0.24;
    niche.add(scarf);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), guardianSkin);
    head.position.set(0, 2.6, 0.04);
    head.scale.set(0.94, 1.02, 0.92);
    niche.add(head);
    // topknot
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), guardianDark);
    knot.position.set(0, 2.88, -0.01);
    niche.add(knot);
    for (const e of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 3, 6), guardianSkin);
      ear.position.set(e * 0.27, 2.6, 0.02);
      ear.rotation.z = Math.PI / 2;
      niche.add(ear);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.045, 0.05), guardianDark);
      brow.position.set(e * 0.11, 2.71, 0.24);
      brow.rotation.z = e * 0.32;
      niche.add(brow);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), guardianPale);
      eye.position.set(e * 0.1, 2.63, 0.24);
      eye.scale.set(1.15, 0.85, 0.7);
      niche.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), guardianDark);
      pupil.position.set(e * 0.1, 2.63, 0.275);
      niche.add(pupil);
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.05), guardianDark);
    mouth.position.set(0, 2.46, 0.255);
    niche.add(mouth);
    for (const e of [-1, 1]) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.075, 4), guardianPale);
      tooth.position.set(e * 0.07, 2.48, 0.28);
      niche.add(tooth);
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 5, 16), MAT.gold);
    halo.position.set(0, 2.62, -0.2);
    niche.add(halo);
    for (const a of [-1, 1]) {
      const armGroup = new THREE.Group();
      armGroup.position.set(a * 0.34, 2.16, 0.02);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.52, 3, 6), guardianSkin);
      arm.position.y = -0.3;
      armGroup.add(arm);
      const fist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), guardianSkin);
      fist.position.y = -0.62;
      armGroup.add(fist);
      armGroup.rotation.z = a === s ? a * 2.0 : a * 0.26;
      armGroup.rotation.x = a === s ? -0.2 : 0.18;
      niche.add(armGroup);
    }
    niche.position.set(s * 4.0, 0, 2.2);
    group.add(niche);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const light = new THREE.PointLight(0xff8d63, 5, 8, 2);
  light.position.set(0, 3.3, 1.1);
  group.add(light);
  return {
    group,
    colliders: [
      { type: 'box', x: -3.5, z: 0, w: 3.4, d: 5.9 },
      { type: 'box', x: 3.5, z: 0, w: 3.4, d: 5.9 },
    ],
  };
}

function createHozomon() {
  const group = new THREE.Group();
  const W = 13.2, D = 5.4;
  box(group, W, 0.42, D, MAT.stone, 0, 0.21, 0);
  box(group, W - 1.2, 0.18, D - 1.0, MAT.darkStone, 0, 0.5, 0);
  for (const z of [-2.05, 2.05]) {
    for (const x of [-5.5, -2.75, 2.75, 5.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 5.4, 12), MAT.vermilion);
      col.position.set(x, 3.25, z);
      col.castShadow = true;
      group.add(col);
    }
  }
  for (const z of [-2.05, 2.05]) {
    box(group, W + 0.4, 0.3, 0.32, MAT.vermilionDark, 0, 5.1, z);
    box(group, W - 0.2, 0.22, 0.24, MAT.vermilion, 0, 1.35, z);
  }
  for (const x of [-5.5, 5.5]) box(group, 0.3, 0.28, D, MAT.vermilionDark, x, 5.1, 0);
  // upper storey with white plaster
  box(group, W + 1.0, 0.26, D + 1.0, MAT.darkWood, 0, 5.7, 0);
  box(group, W + 1.08, 0.12, D + 1.08, MAT.vermilion, 0, 5.87, 0);
  box(group, W - 2.2, 2.5, 0.28, MAT.plaster, 0, 7.25, -2.1);
  for (const x of [-5.3, 5.3]) box(group, 0.28, 2.5, 4.0, MAT.plaster, x, 7.25, 0);
  for (const z of [-2.25, 2.25]) {
    for (let i = 0; i < 15; i++) {
      box(group, 0.12, 1.45, 0.12, MAT.vermilion, -W / 2 + 0.55 + i * (W - 1.1) / 14, 6.55, z);
    }
    box(group, W - 0.7, 0.12, 0.14, MAT.vermilionDark, 0, 7.35, z);
    for (const x of [-2.6, 2.6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 10), MAT.vermilion);
      col.position.set(x, 7.2, z);
      group.add(col);
    }
  }
  // upper wall glowing windows
  const shoji = shojiTexture();
  for (const x of [-3.4, 0, 3.4]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshStandardMaterial({
      map: shoji, emissive: '#ffbf74', emissiveIntensity: 0.28, roughness: 0.8,
    }));
    win.position.set(x, 7.3, 2.27);
    group.add(win);
  }
  hipRoof(group, { radius: 10.1, height: 3.6, y: 8.55, scaleZ: 0.6, material: MAT.copper, ridge: 6.4 });
  // 小舟町 lantern
  const lantern = redLantern(1.2, 3.7, '小舟町');
  lantern.position.set(0, 3.62, 0);
  group.add(lantern);
  // side bronze lanterns
  for (const s of [-1, 1]) {
    const metal = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.85, 8), MAT.bronze);
    metal.position.set(s * 4.0, 3.2, 2.35);
    group.add(metal);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.28, 8), MAT.bronze);
    cap.position.set(s * 4.0, 3.75, 2.35);
    group.add(cap);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const light = new THREE.PointLight(0xff9868, 6, 9, 2);
  light.position.set(0, 3.5, 1.3);
  group.add(light);
  return {
    group,
    colliders: [
      { type: 'box', x: -4.4, z: 0, w: 4.6, d: 5.9 },
      { type: 'box', x: 4.4, z: 0, w: 4.6, d: 5.9 },
    ],
  };
}

function shojiTexture() {
  const { c, ctx } = canvas2d(256, 256);
  ctx.fillStyle = '#f0d9a6'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#533a2a'; ctx.lineWidth = 6;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(256, i * 64); ctx.stroke();
  }
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 150);
  g.addColorStop(0, 'rgba(255,244,214,.7)');
  g.addColorStop(1, 'rgba(196,152,96,.28)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(c);
}

function createHondo() {
  const group = new THREE.Group();
  const PH = 1.15;
  const platform = box(group, 20, PH, 11.5, MAT.darkStone, 0, PH / 2, 0);
  platform.castShadow = true;
  platform.receiveShadow = true;
  box(group, 19.4, 0.14, 10.9, new THREE.MeshStandardMaterial({ color: '#cfc5ae', roughness: 0.95 }), 0, PH + 0.06, 0);
  const stairs = createStairs({ steps: 5, width: 6.4, rise: PH / 5, run: 0.46, color: '#b8ae99' });
  stairs.group.position.set(0, 0, 5.75 + 4.5 * 0.46);
  group.add(stairs.group);
  for (const s of [-1, 1]) {
    const rail = box(group, 0.18, 0.85, 2.5, MAT.darkWood, s * 3.35, PH + 0.42, 6.6);
    rail.rotation.x = 0;
  }

  const hallW = 15.6, hallD = 8.6, hallH = 4.3;
  const baseY = PH;
  box(group, hallW, 0.45, hallD, MAT.darkWood, 0, baseY + 0.22, 0);
  for (const z of [-4.15, 4.15]) {
    for (const x of [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, hallH, 12), MAT.vermilion);
      col.position.set(x, baseY + hallH / 2, z);
      col.castShadow = true;
      group.add(col);
    }
  }
  for (const x of [-7.5, 7.5]) {
    for (let i = 0; i < 5; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, hallH, 10), MAT.vermilion);
      col.position.set(x, baseY + hallH / 2, -3.4 + i * 1.7);
      group.add(col);
    }
  }
  // plaster walls and glowing doors
  box(group, hallW - 0.4, hallH - 0.3, 0.3, MAT.plaster, 0, baseY + hallH / 2, -4.05);
  for (const x of [-7.5, 7.5]) box(group, 0.3, hallH - 0.3, hallD - 0.4, MAT.plaster, x, baseY + hallH / 2, 0);
  const shoji = shojiTexture();
  for (const x of [-3.0, 0, 3.0]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.25), new THREE.MeshStandardMaterial({
      map: shoji, emissive: '#ffc17a', emissiveIntensity: 0.34, roughness: 0.75,
    }));
    door.position.set(x, baseY + 1.72, 4.18);
    group.add(door);
    for (const s of [-1, 1]) box(group, 0.09, 3.35, 0.12, MAT.vermilionDark, x + s * 1.3, baseY + 1.72, 4.22);
  }
  for (const x of [-6.0, 6.0]) {
    box(group, 2.4, 3.3, 0.16, MAT.vermilionDark, x, baseY + 1.75, 4.16);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.8), new THREE.MeshStandardMaterial({ color: '#7d3227', roughness: 0.85 }));
    panel.position.set(x, baseY + 1.7, 4.25);
    group.add(panel);
  }
  for (const y of [baseY + 0.72, baseY + 3.2, baseY + 4.06]) {
    box(group, hallW + 0.35, 0.26, hallD + 0.35, MAT.vermilionDark, 0, y, 0);
  }
  // eaves and roof
  box(group, hallW + 2.6, 0.32, hallD + 2.4, MAT.charcoal, 0, baseY + hallH + 0.2, 0);
  hipRoof(group, {
    radius: 11.9, height: 4.3, y: baseY + hallH + 0.38, scaleZ: 0.55, ridge: 8.6,
  });
  for (const s of [-1, 1]) {
    const ornament = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 6), MAT.gold);
    ornament.position.set(s * 4.2, baseY + hallH + 3.98, 0);
    group.add(ornament);
  }
  // offering box and bell rope
  const boxMesh = box(group, 3.4, 0.95, 0.95, MAT.darkWood, 0, PH + 0.55, 5.2);
  for (let i = 0; i < 7; i++) box(group, 0.1, 0.12, 0.09, MAT.wood, -1.45 + i * 0.48, PH + 1.03, 5.68);
  boxMesh.castShadow = true;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), MAT.gold);
  bell.position.set(0, PH + 4.25, 4.55);
  group.add(bell);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), new THREE.MeshStandardMaterial({ color: '#d9c9a8', roughness: 0.95 }));
  rope.position.set(0, PH + 2.55, 4.55);
  group.add(rope);
  for (const s of [-1, 1]) {
    const rope2 = rope.clone();
    rope2.scale.set(0.7, 1, 0.7);
    rope2.position.x = s * 0.3;
    group.add(rope2);
  }
  const lantern = redLantern(0.52, 1.35, '観音');
  lantern.position.set(0, PH + 3.45, 5.0);
  group.add(lantern);
  // hanging side lanterns
  for (const s of [-1, 1]) {
    const side = redLantern(0.34, 0.95, '浅草');
    side.position.set(s * 5.2, PH + 3.0, 4.65);
    group.add(side);
    const glow = new THREE.PointLight(0xff9a66, 3.2, 7, 2);
    glow.position.set(s * 5.2, PH + 2.8, 4.9);
    group.add(glow);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  platform.castShadow = false;
  return {
    group,
    walkables: [platform, ...stairs.walkables],
    colliders: [
      { type: 'box', x: 0, z: 0, w: 16.2, d: 9.0 },
      { type: 'box', x: 0, z: 5.2, w: 3.5, d: 1.1 },
    ],
    anchor: new THREE.Vector3(0, 8.4, 0),
  };
}

function createNakamiseShop(name, accent, seed = 1) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#7d5a3b', roughness: 0.88 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 0.9 });
  box(group, 2.4, 0.18, 2.6, darkWood, 0, 0.09, 0);
  box(group, 2.3, 2.35, 0.12, wood, 0, 1.35, -1.24);
  for (const s of [-1, 1]) box(group, 0.12, 2.35, 2.5, wood, s * 1.14, 1.35, 0);
  for (const x of [-1.1, 1.1]) for (const z of [-1.18, 1.12]) {
    box(group, 0.12, 2.3, 0.12, darkWood, x, 1.26, z);
  }
  const counter = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.85, 0.6, 2, 0.04), wood);
  counter.position.set(0, 0.62, 0.95);
  counter.castShadow = true;
  group.add(counter);
  // warm interior
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.7), new THREE.MeshStandardMaterial({
    color: '#f0c88c', emissive: '#ffb968', emissiveIntensity: 0.55, roughness: 0.9,
  }));
  glow.position.set(0, 1.35, -1.16);
  group.add(glow);
  // noren curtain with shop name
  const nameTex = (() => {
    const { c, ctx } = canvas2d(512, 192);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, 512, 192);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 1; i < 4; i++) ctx.fillRect(i * 128 - 3, 0, 5, 192);
    ctx.fillStyle = '#fbf3e2';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 78px "Hiragino Sans GB", "PingFang SC", sans-serif';
    ctx.fillText(name, 256, 100);
    return canvasTexture(c);
  })();
  const noren = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.72), new THREE.MeshStandardMaterial({
    map: nameTex, side: THREE.DoubleSide, roughness: 0.92,
  }));
  noren.position.set(0, 2.03, 1.24);
  group.add(noren);
  // roof
  hipRoof(group, { radius: 1.7, height: 0.85, y: 2.4, scaleZ: 0.9, ridge: 2.2, eaveFactor: 1.55 });
  // sign board
  const signTex = (() => {
    const { c, ctx } = canvas2d(384, 128);
    ctx.fillStyle = '#2d241d'; ctx.fillRect(0, 0, 384, 128);
    ctx.strokeStyle = '#c9a24e'; ctx.lineWidth = 5; ctx.strokeRect(6, 6, 372, 116);
    ctx.fillStyle = '#f2dfb7'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 62px "Hiragino Mincho ProN", serif';
    ctx.fillText(name, 192, 68);
    return canvasTexture(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.85 }));
  sign.position.set(0, 2.55, 1.38);
  group.add(sign);
  // goods on the counter
  const goodsColors = ['#d46a4f', '#e5b958', '#8ca86a', '#c9a27b', '#e7dcc5'];
  for (let i = 0; i < 4; i++) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.34), darkWood);
    tray.position.set(-0.78 + i * 0.52, 1.08, 0.92);
    group.add(tray);
    for (let k = 0; k < 3; k++) {
      const good = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 5), new THREE.MeshStandardMaterial({ color: goodsColors[(seed + i + k) % goodsColors.length], roughness: 0.8 }));
      good.position.set(-0.88 + i * 0.52 + (k % 2) * 0.13, 1.16, 0.86 + Math.floor(k / 2) * 0.13);
      group.add(good);
    }
  }
  const crate = createCrate(0.5, '#a8835a');
  crate.position.set(-0.78, 0.34, 0.25);
  group.add(crate);
  // hanging lantern
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.5, 10), new THREE.MeshStandardMaterial({
    color: '#d35c45', emissive: '#ff9968', emissiveIntensity: 0.8, roughness: 0.7,
  }));
  lan.position.set(0.95, 1.75, 1.0);
  group.add(lan);
  for (const y of [-0.26, 0.26]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.045, 10), darkWood);
    band.position.set(0.95, 1.75 + y, 1.0);
    group.add(band);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createInariShrine() {
  const group = new THREE.Group();
  const foxMat = new THREE.MeshStandardMaterial({ color: '#e9e3d4', roughness: 0.86 });
  const shrine = new THREE.Group();
  // stone base and steps
  box(shrine, 4.6, 0.55, 3.5, MAT.stone, 0, 0.275, 0);
  box(shrine, 2.2, 0.22, 0.8, MAT.darkStone, 0, 0.11, 1.95);
  for (const x of [-1.65, 1.65]) for (const z of [-1.15, 1.15]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.5, 10), MAT.vermilion);
    col.position.set(x, 1.85, z);
    shrine.add(col);
  }
  box(shrine, 3.4, 2.15, 0.18, MAT.plaster, 0, 1.82, -1.12);
  for (const s of [-1, 1]) box(shrine, 0.18, 2.15, 2.2, MAT.plaster, s * 1.62, 1.82, 0);
  const glowDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.55), new THREE.MeshStandardMaterial({
    map: shojiTexture(), emissive: '#ffbb72', emissiveIntensity: 0.4, roughness: 0.8,
  }));
  glowDoor.position.set(0, 1.65, 1.17);
  shrine.add(glowDoor);
  box(shrine, 3.7, 0.22, 2.7, MAT.vermilionDark, 0, 3.02, 0);
  hipRoof(shrine, { radius: 3.35, height: 1.5, y: 3.12, scaleZ: 0.8, ridge: 2.0, material: MAT.copper });
  box(shrine, 1.2, 0.6, 0.7, MAT.darkWood, 0, 0.86, 1.55);
  for (let i = 0; i < 5; i++) box(shrine, 0.06, 0.08, 0.06, MAT.gold, -0.45 + i * 0.225, 1.2, 1.9);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), MAT.gold);
  bell.position.set(0, 2.35, 1.35);
  shrine.add(bell);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#dfcfae', roughness: 0.95 }));
  rope.position.set(0, 1.5, 1.35);
  shrine.add(rope);
  const signTex = (() => {
    const { c, ctx } = canvas2d(256, 384);
    ctx.fillStyle = '#2f2620'; ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = '#c9a24e'; ctx.lineWidth = 8; ctx.strokeRect(10, 10, 236, 364);
    ctx.fillStyle = '#e8d4a2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 66px "Hiragino Mincho ProN", serif';
    ['稲', '荷', '神', '社'].forEach((ch, i) => ctx.fillText(ch, 128, 70 + i * 82));
    return canvasTexture(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.15), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.85 }));
  sign.position.set(0, 2.7, 1.25);
  shrine.add(sign);
  shrine.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  group.add(shrine);
  // fox guardians
  for (const s of [-1, 1]) {
    const fox = new THREE.Group();
    box(fox, 0.82, 0.8, 0.82, MAT.stone, 0, 0.4, 0);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), foxMat);
    body.position.y = 1.16;
    body.scale.z = 0.84;
    fox.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), foxMat);
    head.position.set(0, 1.55, 0.06);
    head.scale.set(0.92, 1, 1.05);
    fox.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 6), foxMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 1.48, 0.28);
    fox.add(snout);
    for (const e of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 4), foxMat);
      ear.position.set(e * 0.11, 1.76, 0.03);
      ear.rotation.z = e * -0.15;
      fox.add(ear);
    }
    const bib = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 5, 1, true), new THREE.MeshStandardMaterial({ color: '#b93f33', roughness: 0.8, side: THREE.DoubleSide }));
    bib.rotation.x = Math.PI;
    bib.position.set(0, 1.23, 0.19);
    fox.add(bib);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.55, 3, 6), foxMat);
    tail.position.set(s * 0.3, 1.25, -0.3);
    tail.rotation.set(0.5, 0, s * -0.5);
    fox.add(tail);
    for (const e of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 5, 4), new THREE.MeshBasicMaterial({ color: '#33251f' }));
      eye.position.set(e * 0.075, 1.58, 0.24);
      fox.add(eye);
    }
    fox.position.set(s * 1.75, 0, 2.1);
    fox.rotation.y = s * -0.16;
    fox.scale.setScalar(0.9);
    group.add(fox);
  }
  // senbon torii path
  for (let i = 0; i < 4; i++) {
    const gate = new THREE.Group();
    const z = 4.2 + i * 1.62;
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.135, 2.9, 8), MAT.vermilion);
      post.position.set(s * 1.42, 1.45, 0);
      gate.add(post);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.25, 8), MAT.charcoal);
      foot.position.set(s * 1.42, 0.12, 0);
      gate.add(foot);
    }
    box(gate, 3.7, 0.2, 0.28, MAT.vermilion, 0, 2.78, 0);
    box(gate, 4.3, 0.18, 0.4, MAT.vermilionDark, 0, 3.1, 0);
    box(gate, 4.5, 0.1, 0.46, MAT.charcoal, 0, 3.24, 0);
    box(gate, 0.6, 0.5, 0.08, MAT.darkWood, 0, 2.55, 0.02);
    gate.children.forEach((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    gate.position.z = z;
    group.add(gate);
  }
  return {
    group,
    colliders: [
      { type: 'box', x: 0, z: 0, w: 4.8, d: 3.8 },
      { type: 'circle', x: -1.75, z: 2.1, r: 0.45 },
      { type: 'circle', x: 1.75, z: 2.1, r: 0.45 },
      ...Array.from({ length: 4 }, (_, i) => ([
        { type: 'circle', x: -1.42, z: 4.2 + i * 1.62, r: 0.16 },
        { type: 'circle', x: 1.42, z: 4.2 + i * 1.62, r: 0.16 },
      ])).flat(),
    ],
  };
}

function createIncenseBurner() {
  const group = new THREE.Group();
  box(group, 2.5, 0.35, 2.5, MAT.darkStone, 0, 0.175, 0);
  box(group, 2.05, 0.3, 2.05, MAT.stone, 0, 0.5, 0);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.72, 1.05, 16), MAT.bronze);
  pot.position.y = 1.18;
  pot.castShadow = true;
  group.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.11, 6, 20), MAT.bronze);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.68;
  group.add(rim);
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 5, 12, Math.PI), MAT.bronze);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(s * 0.98, 1.25, 0);
    group.add(handle);
  }
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.06, 16), new THREE.MeshStandardMaterial({ color: '#9b9485', roughness: 1 }));
  ash.position.y = 1.7;
  group.add(ash);
  const sticks = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.9, 5), new THREE.MeshStandardMaterial({ color: '#6b4b31', roughness: 0.95 }));
    stick.position.set(Math.cos(a) * 0.28, 2.1, Math.sin(a) * 0.28);
    stick.rotation.z = Math.cos(a) * 0.18;
    stick.rotation.x = Math.sin(a) * 0.18;
    group.add(stick);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshBasicMaterial({ color: '#ff9a55' }));
    ember.position.set(Math.cos(a) * 0.34, 2.56, Math.sin(a) * 0.34);
    group.add(ember);
    sticks.push(ember);
  }
  const smoke = [];
  for (let i = 0; i < 12; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture(), color: '#f4ead8', transparent: true, opacity: 0.16, depthWrite: false,
    }));
    sprite.position.set((Math.random() - 0.5) * 0.9, 1.9 + Math.random() * 2, (Math.random() - 0.5) * 0.9);
    sprite.scale.setScalar(0.6);
    sprite.userData.phase = Math.random();
    group.add(sprite);
    smoke.push(sprite);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  function update(dt, t) {
    for (const s of smoke) {
      const k = (t * 0.12 + s.userData.phase) % 1;
      s.position.y = 2.1 + k * 3.4;
      s.position.x = Math.sin(t * 0.5 + s.userData.phase * 6) * (0.35 + k * 0.9);
      s.position.z = Math.cos(t * 0.4 + s.userData.phase * 5) * (0.3 + k * 0.7);
      s.material.opacity = 0.22 * (1 - k) * Math.min(1, k * 5);
      s.scale.setScalar(0.45 + k * 1.5);
    }
    sticks.forEach((e, i) => { e.material.color.setHSL(0.06, 1, 0.55 + Math.sin(t * 4 + i) * 0.08); });
  }
  return { group, update };
}

function createTemizuya() {
  const group = new THREE.Group();
  box(group, 3.4, 0.22, 2.8, MAT.stone, 0, 0.11, 0);
  for (const x of [-1.35, 1.35]) for (const z of [-1.15, 1.15]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.5, 8), MAT.wood);
    post.position.set(x, 1.45, z);
    post.castShadow = true;
    group.add(post);
  }
  box(group, 3.0, 0.18, 2.4, MAT.wood, 0, 2.65, 0);
  hipRoof(group, { radius: 2.35, height: 1.0, y: 2.74, scaleZ: 0.88, ridge: 2.0, material: MAT.copper });
  // basin
  box(group, 2.2, 0.6, 1.0, MAT.darkStone, 0, 0.62, 0);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.78), new THREE.MeshStandardMaterial({
    color: '#8fb6ad', roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.85,
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.925, 0);
  group.add(water);
  // bamboo spout and ladles
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), new THREE.MeshStandardMaterial({ color: '#8ba56a', roughness: 0.8 }));
  spout.rotation.z = Math.PI / 2;
  spout.position.set(0, 1.45, -0.72);
  group.add(spout);
  for (let i = 0; i < 3; i++) {
    const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 10), MAT.wood);
    ladle.position.set(-0.55 + i * 0.55, 0.98, 0.55);
    group.add(ladle);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 5), MAT.wood);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.55 + i * 0.55 + 0.3, 1.02, 0.55);
    group.add(handle);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    group,
    colliders: [{ type: 'box', x: 0, z: 0, w: 2.5, d: 1.3 }],
  };
}

function createEmaRack() {
  const group = new THREE.Group();
  for (const s of [-1, 1]) {
    box(group, 0.16, 2.4, 0.16, MAT.wood, s * 2.1, 1.2, 0);
  }
  box(group, 4.5, 0.15, 0.18, MAT.wood, 0, 2.32, 0);
  box(group, 4.5, 0.12, 0.18, MAT.wood, 0, 1.55, 0);
  box(group, 4.9, 0.1, 1.0, MAT.charcoal, 0, 2.55, -0.2);
  const emaTex = (() => {
    const { c, ctx } = canvas2d(128, 128);
    ctx.fillStyle = '#d8bd93'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#8d5a3a'; ctx.fillRect(8, 8, 112, 112);
    ctx.fillStyle = '#e7d3ab'; ctx.beginPath();
    ctx.moveTo(18, 26); ctx.lineTo(110, 20); ctx.lineTo(112, 104); ctx.lineTo(20, 110); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9c5c3f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, 48); ctx.lineTo(90, 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(42, 68); ctx.lineTo(94, 64); ctx.stroke();
    ctx.fillStyle = '#b0473c'; ctx.beginPath(); ctx.arc(64, 88, 9, 0, TAU); ctx.fill();
    return canvasTexture(c);
  })();
  const emaMat = new THREE.MeshStandardMaterial({ map: emaTex, roughness: 0.9, side: THREE.DoubleSide });
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 9; i++) {
      const ema = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.3), emaMat);
      ema.position.set(-1.85 + i * 0.46 + (row % 2) * 0.12, 2.1 - row * 0.42, 0.08);
      ema.rotation.z = (Math.random() - 0.5) * 0.12;
      ema.rotation.y = (Math.random() - 0.5) * 0.18;
      group.add(ema);
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 3), MAT.darkWood);
      string.position.set(ema.position.x, ema.position.y + 0.19, 0.08);
      group.add(string);
    }
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    group,
    colliders: [{ type: 'box', x: 0, z: 0, w: 4.5, d: 0.8 }],
  };
}

function createStreetLamp() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#5f6b64', roughness: 0.6, metalness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.4, 10), metal);
  base.position.y = 0.2;
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 4.5, 8), metal);
  pole.position.y = 2.45;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 5, 12, Math.PI / 2), metal);
  arm.position.set(0, 4.7, 0);
  arm.rotation.y = Math.PI / 2;
  group.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.72), metal);
  head.position.set(0, 5.3, 0.66);
  group.add(head);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.6), new THREE.MeshStandardMaterial({
    color: '#ffe4b0', emissive: '#ffc471', emissiveIntensity: 1.4, roughness: 0.4,
  }));
  lamp.position.set(0, 5.22, 0.66);
  group.add(lamp);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createTrafficSignal() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#59615d', roughness: 0.55, metalness: 0.45 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.9, 8), metal);
  pole.position.y = 1.95;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 8), metal);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(1.15, 3.82, 0);
  group.add(arm);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.1, 0.3), new THREE.MeshStandardMaterial({ color: '#2f3431', roughness: 0.6 }));
  housing.position.set(2.15, 3.25, 0);
  group.add(housing);
  const lensMat = {
    red: new THREE.MeshStandardMaterial({ color: '#5a2420', emissive: '#ff4435', emissiveIntensity: 0.1, roughness: 0.4 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#5e4d24', emissive: '#ffc53f', emissiveIntensity: 0.1, roughness: 0.4 }),
    green: new THREE.MeshStandardMaterial({ color: '#21483b', emissive: '#4fe0a2', emissiveIntensity: 1.3, roughness: 0.4 }),
  };
  const lenses = [];
  [['red', 0.32], ['yellow', 0], ['green', -0.32]].forEach(([key, y]) => {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), lensMat[key]);
    lens.position.set(2.15, 3.25 + y, 0.16);
    group.add(lens);
    lenses.push({ key, mat: lensMat[key] });
  });
  // pedestrian signal
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.2), new THREE.MeshStandardMaterial({ color: '#2f3431', roughness: 0.6 }));
  ped.position.set(0.12, 2.9, 0.14);
  group.add(ped);
  const pedLight = new THREE.Mesh(new THREE.CircleGeometry(0.075, 10), new THREE.MeshStandardMaterial({
    color: '#21483b', emissive: '#59e6a4', emissiveIntensity: 1.2, roughness: 0.4,
  }));
  pedLight.position.set(0.12, 2.9, 0.25);
  group.add(pedLight);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  function update(dt, t) {
    const phase = (t + 1.5) % 14;
    const green = phase < 6;
    const yellow = phase >= 6 && phase < 8;
    lenses.forEach((l) => {
      if (l.key === 'green') l.mat.emissiveIntensity = green ? 1.4 : 0.06;
      if (l.key === 'yellow') l.mat.emissiveIntensity = yellow ? 1.4 : 0.06;
      if (l.key === 'red') l.mat.emissiveIntensity = !green && !yellow ? 1.4 : 0.06;
    });
    pedLight.material.emissiveIntensity = green ? 1.3 : 0.06;
  }
  return { group, update };
}

function createPostBox() {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: '#c94a3e', roughness: 0.5, metalness: 0.15 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.66, 1.15, 0.56, 3, 0.1), red);
  body.position.y = 0.95;
  group.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 16), red);
  cap.position.y = 1.55;
  group.add(cap);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.06), new THREE.MeshStandardMaterial({ color: '#41231f' }));
  slot.position.set(0, 1.3, 0.29);
  group.add(slot);
  const tex = (() => {
    const { c, ctx } = canvas2d(128, 128);
    ctx.fillStyle = '#f4ede0'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#c94a3e'; ctx.font = 'bold 84px "Hiragino Sans GB", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('〒', 64, 68);
    return canvasTexture(c);
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(0, 1.03, 0.287);
  group.add(sign);
  for (const x of [-0.22, 0.22]) for (const z of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.4, 6), new THREE.MeshStandardMaterial({ color: '#6b3b33', roughness: 0.7 }));
    leg.position.set(x, 0.2, z);
    group.add(leg);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createKeiVan(color = '#e7e4d8', { taxi = false } = {}) {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.25 });
  const glass = new THREE.MeshStandardMaterial({ color: '#37505a', roughness: 0.16, metalness: 0.4 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.95, 1.52, 3, 0.14), paint);
  body.position.y = 0.78;
  group.add(body);
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(2.05, 0.78, 1.48, 3, 0.12), paint);
  cabin.position.set(-0.22, 1.55, 0);
  group.add(cabin);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.5), glass);
  windshield.position.set(0.84, 1.6, 0);
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.z = 0.14;
  group.add(windshield);
  for (const s of [-1, 1]) {
    const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.46), glass);
    sideWin.position.set(-0.25, 1.62, s * 0.75);
    if (s < 0) sideWin.rotation.y = Math.PI;
    group.add(sideWin);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), paint);
    mirror.position.set(0.92, 1.45, s * 0.86);
    group.add(mirror);
  }
  for (const x of [-1.05, 1.05]) for (const s of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.2, 14), new THREE.MeshStandardMaterial({ color: '#2f302e', roughness: 0.85 }));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.35, s * 0.76);
    group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10), new THREE.MeshStandardMaterial({ color: '#a7a49b', metalness: 0.6, roughness: 0.4 }));
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.35, s * 0.77);
    group.add(hub);
  }
  for (const s of [-1, 1]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.3), new THREE.MeshStandardMaterial({
      color: '#fff1c8', emissive: '#ffdd9a', emissiveIntensity: 0.7, roughness: 0.3,
    }));
    light.position.set(1.6, 0.82, s * 0.52);
    group.add(light);
  }
  if (taxi) {
    const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.38), new THREE.MeshStandardMaterial({
      color: '#f2d27c', emissive: '#ffcf62', emissiveIntensity: 0.9, roughness: 0.5,
    }));
    roofSign.position.set(-0.1, 2.06, 0);
    group.add(roofSign);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.13, 1.54), new THREE.MeshStandardMaterial({ color: '#3f5a72', roughness: 0.6 }));
    stripe.position.set(0, 0.58, 0);
    group.add(stripe);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createUtilityPole() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8b877d', roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: '#5c605d', roughness: 0.6, metalness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 9.2, 8), wood);
  pole.position.y = 4.6;
  pole.castShadow = true;
  group.add(pole);
  for (const y of [7.4, 8.0]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.1), metal);
    arm.position.y = y;
    group.add(arm);
    for (const x of [-0.8, 0.8]) {
      const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 6), new THREE.MeshStandardMaterial({ color: '#d8d3c4', roughness: 0.5 }));
      insulator.position.set(x, y + 0.14, 0);
      group.add(insulator);
    }
  }
  const transformer = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.8, 10), metal);
  transformer.position.set(0.3, 6.6, 0);
  group.add(transformer);
  for (const y of [0.9, 1.1]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 8), new THREE.MeshStandardMaterial({ color: '#d2b23f', roughness: 0.7 }));
    band.position.y = y;
    group.add(band);
  }
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.4), metal);
    step.position.set(0.16, 2.2 + i * 0.45, 0);
    group.add(step);
  }
  return group;
}

function addWire(parent, a, b, { sag = 0.5, color = '#3e3b36', radius = 0.012 } = {}) {
  const mid = new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...a), mid, new THREE.Vector3(...b),
  ]);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 3, false), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  parent.add(wire);
  return wire;
}

export function createJapan(scene) {
  const root = new THREE.Group();
  root.name = 'city-japan';
  scene.add(root);
  const env = createEnvironment(scene, THEMES.japan, { radius: 55 });

  const grass = grassTexture(41, [112, 148, 88], [140, 172, 107]);
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(13, 13);
  const island = createIsland(THEMES.japan, {
    radius: 55, seed: 37, groundTexture: grass, groundColor: '#f0edd8',
    cliffColor: '#bfa886', sandColor: '#e8d6b2',
  });
  root.add(island.group);

  const stone = pavingTexture('stone', 21);
  const slab = pavingTexture('slab', 9);
  const gravel = pavingTexture('gravel', 17);
  const asphalt = pavingTexture('asphalt', 7);

  // ---------------- street grid ----------------
  addGroundPatch(root, { x: 0, z: 34, width: 68, depth: 7, texture: asphalt, y: 0.02 });
  addGroundPatch(root, { x: 0, z: 29, width: 68, depth: 3, texture: slab, y: 0.035 });
  addGroundPatch(root, { x: 0, z: 39, width: 68, depth: 3, texture: slab, y: 0.035 });
  addGroundPatch(root, { x: 19, z: 10.5, width: 5.5, depth: 45, texture: asphalt, y: 0.021 });
  addGroundPatch(root, { x: 22.35, z: 9, width: 1.3, depth: 42, texture: slab, y: 0.036 });
  addGroundPatch(root, { x: 0, z: 20.5, width: 8.4, depth: 13.5, texture: stone, y: 0.045 });
  addGroundPatch(root, { x: 0, z: 28.9, width: 14, depth: 3.0, texture: stone, y: 0.046 });
  addGroundPatch(root, { x: 11.3, z: 20.5, width: 10.4, depth: 13.5, texture: stone, y: 0.044 });
  addGroundPatch(root, { x: 0, z: 3.2, width: 39, depth: 22.4, texture: stone, y: 0.047 });
  addGroundPatch(root, { x: 0, z: -12, width: 34, depth: 9, texture: stone, y: 0.046 });

  const paintMat = new THREE.MeshStandardMaterial({
    color: '#efe9da', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  });
  function paint(w, d, x, z) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), paintMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.062, z);
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (let x = -32; x <= 32; x += 3.2) {
    if (Math.abs(x) < 4.5 || Math.abs(x - 19) < 3.2) continue;
    paint(1.7, 0.14, x, 34);
  }
  paint(66, 0.13, 0, 30.85);
  paint(66, 0.13, 0, 37.15);
  for (let i = 0; i < 7; i++) paint(0.54, 6.1, -3 + i, 34.05);
  for (let i = 0; i < 5; i++) paint(0.54, 6.1, 17 + i, 34.05);
  for (let z = -9; z <= 27; z += 3.4) paint(0.13, 1.7, 19, z);
  paint(0.12, 41, 16.45, 9.5);
  paint(0.12, 41, 21.55, 9.5);
  paint(5.4, 0.3, 19, 29.9);

  const curbMat = new THREE.MeshStandardMaterial({ color: '#c9c1b1', roughness: 0.93 });
  for (const z of [30.4, 37.6]) {
    for (const [x, w] of [[-18.5, 29], [9.75, 11.5], [27.75, 10.5]]) {
      box(root, w, 0.16, 0.26, curbMat, x, 0.08, z);
    }
  }

  const cameraBlockers = [];
  function addCameraBlocker(x, z, w, d, height = 24) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), new THREE.MeshBasicMaterial({ color: 0xff5060 }));
    mesh.position.set(x, height / 2, z);
    mesh.visible = false;
    root.add(mesh);
    cameraBlockers.push(mesh);
  }

  const colliders = [];
  function addBuildingRow({ x, z, yaw, length, w, d, seed, shopNames, floors = [2, 4], depth = [5.4, 6.4], minWidth = 4.6, maxWidth = 6.4, shops = true }) {
    const row = createBuildingRow({
      x, z, yaw, length, styles: ['tokyo'], minWidth, maxWidth,
      depth, floors, seed, floorHeight: 2.8, gap: 0.3,
      shops, shopNames, fireEscapes: false, stoopEvery: 99,
    });
    root.add(row);
    colliders.push({ type: 'box', x, z, w, d });
    addCameraBlocker(x, z, w, d);
    return row;
  }

  addBuildingRow({
    x: -20, z: 41.5, yaw: Math.PI, length: 20, w: 20.8, d: 7.2, seed: 71,
    shopNames: ['和菓子 花月', 'お茶', '文房具', '天ぷら'],
  });
  addBuildingRow({
    x: 20, z: 41.5, yaw: Math.PI, length: 20, w: 20.8, d: 7.2, seed: 173,
    shopNames: ['薬局', 'パン', '米穀店', 'クリーニング'], floors: [2, 3],
  });
  addBuildingRow({
    x: -30, z: 25.9, yaw: 0, length: 16, w: 16.6, d: 7.2, seed: 91,
    shopNames: ['甘味処', '陶器'], floors: [2, 3],
  });
  addBuildingRow({
    x: 28, z: 26.5, yaw: 0, length: 12, w: 12.6, d: 6.8, seed: 133,
    shopNames: ['喫茶', '花屋'], floors: [2, 3], depth: [5.0, 5.8],
  });
  addBuildingRow({
    x: -42, z: 10, yaw: Math.PI / 2, length: 16, w: 7.6, d: 16.8, seed: 55,
    shopNames: ['豆腐店', '書店'], floors: [2, 3], depth: [5.4, 6.2], minWidth: 5.2, maxWidth: 7.0,
  });
  addBuildingRow({
    x: -15, z: -23, yaw: 0, length: 18, w: 18.8, d: 6.8, seed: 201,
    shopNames: [], shops: false, floors: [3, 4], minWidth: 5.4, maxWidth: 7.2,
  });

  // ---------------- landmarks & temple ----------------
  const tower = createTokyoTower();
  const placed = placeLandmark(root, tower, 24, -31);

  const pagoda = createPagoda();
  const pagodaPlaced = placeLandmark(root, pagoda, -15, -1.5);

  const hondo = createHondo();
  hondo.group.position.set(0, 0, -10.5);
  root.add(hondo.group);
  hondo.colliders.forEach((c) => colliders.push({ ...c, z: c.z - 10.5 }));

  const kaminarimon = createKaminarimon();
  kaminarimon.group.position.set(0, 0, 27.4);
  root.add(kaminarimon.group);
  kaminarimon.colliders.forEach((c) => colliders.push({ ...c, z: c.z + 27.4 }));

  const hozomon = createHozomon();
  hozomon.group.position.set(0, 0, 11.3);
  root.add(hozomon.group);
  hozomon.colliders.forEach((c) => colliders.push({ ...c, z: c.z + 11.3 }));

  const fuji = createMtFuji();
  fuji.group.position.set(-80, 0, -180);
  fuji.group.scale.setScalar(1.35);
  root.add(fuji.group);

  // ---------------- Nakamise ----------------
  const shopNames = ['人形焼', '雷おこし', '抹茶', '扇子', '団子', '佃煮', '和菓子', 'かき氷'];
  const accents = ['#a8483b', '#3f5f6a', '#667c4a', '#8a5a43', '#b06048', '#4c5e57', '#a06a3f', '#58798a'];
  const shopZ = [15.5, 17.95, 20.4, 22.85];
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const idx = i + (side > 0 ? 4 : 0);
      const shop = createNakamiseShop(shopNames[idx], accents[idx], idx + 1);
      shop.position.set(side * 5.0, 0, shopZ[i]);
      shop.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      root.add(shop);
    }
  }

  // Inari shrine
  const inari = createInariShrine();
  inari.group.position.set(36, 0, 9);
  root.add(inari.group);
  inari.colliders.forEach((c) => colliders.push({ ...c, x: c.x + 36, z: c.z + 9 }));

  // ---------------- gardens ----------------
  const pond = createKoiPond();
  pond.group.position.set(28, 0, 6);
  root.add(pond.group);
  addCirclePatch(root, { x: 28, z: 6, radius: 5.9, texture: gravel, ringColor: '#a99c84', y: 0.043 });

  const bambooA = createBamboo(14);
  bambooA.position.set(31.8, 0, 20.8);
  bambooA.scale.setScalar(0.95);
  root.add(bambooA);
  const bambooB = createBamboo(12);
  bambooB.position.set(42, 0, 15.8);
  bambooB.scale.setScalar(1.05);
  root.add(bambooB);

  addCirclePatch(root, { x: -31, z: 12, radius: 8, texture: grass, ringColor: '#b9a98e', y: 0.041 });
  addPath(root, {
    points: [[-18, 31.5], [-18, 27], [-19.5, 22], [-23, 18], [-27, 15], [-30, 12.5]],
    width: 2.7, texture: gravel, repeat: 8,
  });
  addPath(root, {
    points: [[-18, 8.5], [-21, 9.6], [-24, 10.6], [-27.5, 11.6]],
    width: 2.3, texture: gravel, repeat: 5,
  });
  addPath(root, {
    points: [[21.8, 18.5], [26, 18.5], [31, 18.5], [36, 18.6]],
    width: 2.8, texture: gravel, repeat: 6,
  });
  addPath(root, {
    points: [[36, 20.4], [36, 17.5], [36, 12.5], [36, 9.8]],
    width: 3.0, texture: gravel, repeat: 5,
  });
  addPath(root, {
    points: [[21.8, 6], [23.2, 6], [24.6, 6.2]],
    width: 2.4, texture: gravel, repeat: 3,
  });
  addPath(root, {
    points: [[19, -10], [19.6, -13.5], [21.5, -17.5], [24, -22]],
    width: 3.4, texture: stone, repeat: 5,
  });
  addCirclePatch(root, { x: 24, z: -24, radius: 12, texture: stone, ringColor: '#b5a98f' });

  // ---------------- city trees ----------------
  const cherries = [
    [-32, 12.8, 1.22, 4.3, 3.0], [-35.5, 17.5, 1.0, 3.6, 2.4], [-36, 7.2, 0.98, 3.4, 2.3],
    [-26.5, 8.6, 0.95, 3.2, 2.2], [-27, 16.5, 0.9, 3.1, 2.1],
    [31.5, 26, 0.95, 3.2, 2.2], [-8, 31.5, 0.9, 3.0, 2.0], [8, 31.8, 0.92, 3.1, 2.1],
  ];
  cherries.forEach(([x, z, s, h, c], i) => {
    const tree = createTree({
      height: h, canopy: c, blossom: true, seed: i + 51,
      colors: ['#f2afc6', '#f8c8d8', '#eb9fba'],
    });
    tree.position.set(x, 0, z);
    tree.rotation.y = i * 0.9;
    tree.scale.setScalar(s);
    root.add(tree);
    if (i < 5) colliders.push({ type: 'circle', x, z, r: 0.35 * s });
  });
  const pines = [
    [-10.8, 9.6, 1.0], [10.8, 9.9, 1.0], [-21.2, -4.6, 1.1], [21.5, -4.2, 1.0],
    [-5.8, -17.2, 0.9], [5.8, -17.4, 0.95], [42.5, 4.6, 0.9],
  ];
  pines.forEach(([x, z, s], i) => {
    const pine = createPine({ height: 3.4 + (i % 3) * 0.5, radius: 1.1 });
    pine.position.set(x, 0, z);
    pine.rotation.y = i * 1.3;
    pine.scale.setScalar(s);
    root.add(pine);
    colliders.push({ type: 'circle', x, z, r: 0.3 });
  });
  [[-34, 20.5, 4.2, 0.8], [-37, 13, 3.2, 0.7], [-25, 13.5, 2.8, 0.65], [40, 11, 3.0, 0.7]].forEach(([x, z, len, h], i) => {
    const hedge = createBush(1.0);
    hedge.position.set(x, 0, z);
    hedge.scale.set(len / 2, h * 1.4, 1);
    hedge.rotation.y = i * 0.7;
    root.add(hedge);
    colliders.push({ type: 'circle', x, z, r: len / 3.2 });
  });
  [[-9.5, -2.0, 1.6], [9.5, -2.0, 1.6], [-6.5, 27.0, 1.3], [14.5, 14.8, 1.4]].forEach(([x, z, r], i) => {
    const bed = createFlowerBed(r, i % 2
      ? ['#e8a3b3', '#f7d6df', '#f4d06b', '#ffffff']
      : ['#f0b64b', '#e9705b', '#f7d6df', '#c5a3cf']);
    bed.position.set(x, 0, z);
    root.add(bed);
  });
  const rocks = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.5, 0), new THREE.MeshStandardMaterial({ color: '#8f8778', roughness: 1, flatShading: true }));
    const a = 0.6 + i * 0.7;
    rock.position.set(28 + Math.cos(a) * 4.7, 0.2, 6 + Math.sin(a) * 4.2);
    rock.rotation.set(i, i * 2, i * 0.5);
    rock.scale.y = 0.65;
    rock.castShadow = true;
    rocks.add(rock);
  }
  root.add(rocks);

  // ---------------- temple courtyard furniture ----------------
  const incense = createIncenseBurner();
  incense.group.position.set(0, 0, 2.2);
  root.add(incense.group);
  colliders.push({ type: 'circle', x: 0, z: 2.2, r: 1.3 });

  const temizuya = createTemizuya();
  temizuya.group.position.set(10.5, 0, 4.2);
  root.add(temizuya.group);
  temizuya.colliders.forEach((c) => colliders.push({ ...c, x: c.x + 10.5, z: c.z + 4.2 }));

  const ema = createEmaRack();
  ema.group.position.set(-8.5, 0, 5.4);
  ema.group.rotation.y = 0.18;
  root.add(ema.group);
  ema.colliders.forEach((c) => colliders.push({ ...c, x: c.x - 8.5, z: c.z + 5.4 }));

  const stoneLanterns = [[-6.6, 8.4], [6.6, 8.4], [-26.8, 18.6], [34.2, 12.4]];
  stoneLanterns.forEach(([x, z]) => {
    const lantern = createStoneLantern(true);
    lantern.position.set(x, 0, z);
    root.add(lantern);
    colliders.push({ type: 'circle', x, z, r: 0.42 });
  });

  // ---------------- street life ----------------
  const ramen = createRamenStall();
  ramen.group.position.set(12.6, 0, 22.5);
  ramen.group.rotation.y = Math.PI / 2;
  root.add(ramen.group);
  colliders.push({ type: 'box', x: 12.6, z: 22.5, w: 2.1, d: 3.8 });

  const postBox = createPostBox();
  postBox.position.set(-7.0, 0, 38.6);
  root.add(postBox);
  colliders.push({ type: 'circle', x: -7.0, z: 38.6, r: 0.5 });

  const vendingSpots = [[7.4, 28.7, 0], [-7.4, 28.7, 0], [22.15, 24.8, -Math.PI / 2]];
  vendingSpots.forEach(([x, z, yaw]) => {
    const vending = createVendingMachine();
    vending.position.set(x, 0, z);
    vending.rotation.y = yaw;
    root.add(vending);
    colliders.push({ type: 'box', x, z, w: 1.2, d: 0.95 });
  });

  const welcome = createSign('浅草 · 東京', 'ASAKUSA · TOKYO', { width: 2.8, height: 1.0, postH: 2.2 });
  welcome.position.set(7.6, 0, 38.4);
  root.add(welcome);
  const parkSign = createSign('芝公園', 'SHIBA PARK', { width: 2.4, height: 0.9, postH: 1.9 });
  parkSign.position.set(15.2, 0, -16.2);
  parkSign.rotation.y = 0.6;
  root.add(parkSign);

  const trafficSignals = [];
  for (const [x, z, yaw] of [[3.4, 29.2, 0], [-3.4, 38.6, Math.PI], [16.6, 30.0, Math.PI / 2]]) {
    const signal = createTrafficSignal();
    signal.group.position.set(x, 0, z);
    signal.group.rotation.y = yaw;
    root.add(signal.group);
    trafficSignals.push(signal);
    colliders.push({ type: 'circle', x, z, r: 0.22 });
  }
  const lamps = [[-26, 38.3], [-8, 38.3], [12, 38.3], [30, 38.3]];
  lamps.forEach(([x, z]) => {
    const lamp = createStreetLamp();
    lamp.position.set(x, 0, z);
    lamp.rotation.y = Math.PI;
    root.add(lamp);
    colliders.push({ type: 'circle', x, z, r: 0.28 });
  });

  const van = createKeiVan('#e9e2d2');
  van.position.set(-27, 0, 31.65);
  root.add(van);
  colliders.push({ type: 'box', x: -27, z: 31.65, w: 3.4, d: 1.8 });
  const taxi = createKeiVan('#2f4a5e', { taxi: true });
  taxi.position.set(29.5, 0, 36.2);
  root.add(taxi);
  colliders.push({ type: 'box', x: 29.5, z: 36.2, w: 3.4, d: 1.8 });
  const laneVan = createKeiVan('#dfe4dc');
  laneVan.position.set(17.5, 0, 17.2);
  laneVan.rotation.y = Math.PI / 2;
  root.add(laneVan);
  colliders.push({ type: 'box', x: 17.5, z: 17.2, w: 1.8, d: 3.4 });

  [[7.6, 20.2, 0.2], [23.2, 25.4, 1.2], [-19.2, 31.7, 0.5]].forEach(([x, z, yaw]) => {
    const bike = createBicycle();
    bike.position.set(x, 0, z);
    bike.rotation.y = yaw;
    root.add(bike);
    colliders.push({ type: 'circle', x, z, r: 0.45 });
  });

  // utility poles and wires
  const poleMatPositions = [[-36, 38.5], [-22, 38.5], [-6, 38.5], [8, 38.5], [24, 38.5], [38, 38.5]];
  poleMatPositions.forEach(([x, z]) => {
    const pole = createUtilityPole();
    pole.position.set(x, 0, z);
    root.add(pole);
    colliders.push({ type: 'circle', x, z, r: 0.25 });
  });
  for (let i = 0; i < poleMatPositions.length - 1; i++) {
    const [x1, z1] = poleMatPositions[i];
    const [x2, z2] = poleMatPositions[i + 1];
    addWire(root, [x1, 8.0, z1], [x2, 8.0, z2], { sag: 0.65 });
    addWire(root, [x1, 7.42, z1 + 0.55], [x2, 7.42, z2 + 0.55], { sag: 0.55 });
  }
  const lanePoles = [27.5, 15.5, 3.5, -8.5];
  lanePoles.forEach((z) => {
    const pole = createUtilityPole();
    pole.position.set(22.15, 0, z);
    pole.scale.setScalar(0.92);
    root.add(pole);
    colliders.push({ type: 'circle', x: 22.15, z, r: 0.24 });
  });
  for (let i = 0; i < lanePoles.length - 1; i++) {
    addWire(root, [22.15, 7.4, lanePoles[i]], [22.15, 7.4, lanePoles[i + 1]], { sag: 0.5 });
    addWire(root, [22.7, 6.85, lanePoles[i]], [22.7, 6.85, lanePoles[i + 1]], { sag: 0.42 });
  }

  // lantern strings
  const lanternStrings = [16.4, 19.0, 21.6].map((z) => {
    const string = createStringLanterns(
      [[-4.4, 4.3, z], [0, 3.85, z], [4.4, 4.3, z]],
      { count: 9, color: '#ff9f70' },
    );
    root.add(string.group);
    return string;
  });
  const gardenString = createStringLanterns(
    [[-11, 4.5, 7.5], [0, 4.1, 6.6], [11, 4.5, 7.5]],
    { count: 12, color: '#ffb27e' },
  );
  root.add(gardenString.group);
  lanternStrings.push(gardenString);

  const flagTex = flagTexture('japan');
  const flags = [
    addFlag(root, flagTex, -10.6, 30.0, { height: 5.8, scale: 0.95, yaw: 0.15 }),
    addFlag(root, flagTex, 10.6, 30.0, { height: 5.8, scale: 0.95, yaw: -0.15 }),
    addFlag(root, flagTex, 42.5, 27.5, { height: 5.2, scale: 0.9, yaw: 0.6 }),
  ];

  const birds = createBirds(7, '#fff7ea', 25, 58);
  root.add(birds.group);
  const petals = createPetals({ count: 150, radius: 46, colors: [0xf7c8d5, 0xffe0e8, 0xf1b3c5], size: 0.19, height: [2, 18] });
  root.add(petals.group);

  // ---------------- extra park & plaza dressing ----------------
  const bench1 = createBench('#7d5c3f');
  bench1.position.set(-28.6, 0, 13.8);
  bench1.rotation.y = -Math.PI / 2;
  root.add(bench1);
  colliders.push({ type: 'box', x: -28.6, z: 13.8, w: 0.9, d: 2.0 });
  const bench2 = createBench('#8a6748');
  bench2.position.set(24.4, 0, 2.4);
  bench2.rotation.y = 0.7;
  root.add(bench2);
  colliders.push({ type: 'box', x: 24.4, z: 2.4, w: 2.0, d: 0.9 });
  const plazaBench = createBench('#79604a');
  plazaBench.position.set(17.9, 0, -21.5);
  plazaBench.rotation.y = -0.5;
  root.add(plazaBench);

  [[13.5, -25.5, 1.0], [34.4, -23.2, 0.95], [33.4, -34.2, 0.9]].forEach(([x, z, s], i) => {
    const tree = createTree({
      height: 3.7, canopy: 2.5, blossom: true, seed: 260 + i,
      colors: ['#f2afc6', '#f8c8d8', '#eb9fba'],
    });
    tree.position.set(x, 0, z);
    tree.scale.setScalar(s);
    root.add(tree);
    colliders.push({ type: 'circle', x, z, r: 0.34 });
  });

  const crateA = createCrate(0.55, '#a8835a');
  crateA.position.set(12.1, 0.28, 21.2);
  root.add(crateA);
  const crateB = createCrate(0.45, '#96754f');
  crateB.position.set(12.2, 0.9, 21.25);
  crateB.rotation.y = 0.4;
  root.add(crateB);
  colliders.push({ type: 'box', x: 12.1, z: 21.2, w: 0.9, d: 0.8 });

  // ---------------- people ----------------
  const hana = createNPC({
    id: 'hana', name: 'Hana', nameSub: '神社的巫女', marker: 'quest', questId: 'hana-bell',
    scale: 0.97, style: 'dress', skin: '#f2cdb1', hairColor: '#33251f', hairStyle: 'long',
    cloth: '#f4f0e6', cloth2: '#b84b47', accent: '#d06a63', accessory: 'shrine',
    pos: [7.2, 0, 6.3], yaw: -1.1,
    dialogues: {
      new: [
        '你好呀，欢迎来到浅草。风把樱花吹得满地都是，也把我的铃铛吹丢了。',
        '铃铛是我们神社的「结缘铃」。它应该落在西边樱花林里最大的那棵树下，风一吹，会发出很轻很轻的叮当声。',
      ],
      active: [
        '沿着参道往西走，穿过红色的大鸟居，就是樱花林。最大的那棵树下找找看，铃铛会随着风一闪一闪的。',
      ],
      ready: [
        '找到了，谢谢你。听，它在说「谢谢」呢。',
        '这颗星火送给你。它能在最安静的地方，照亮最温柔的心意。',
      ],
      done: [
        '要不要写一块绘马？把今天遇到的风，画下来就好。',
      ],
    },
  });
  hana.root.position.set(7.2, 0, 6.3);
  root.add(hana.root);

  const ken = createNPC({
    id: 'ken', name: 'Ken', nameSub: '拉面师傅', marker: 'quest', questId: 'ken-cat',
    scale: 1.05, style: 'coat', skin: '#d9a37c', hairColor: '#2e241f', hairStyle: 'short',
    cloth: '#e9dfcd', cloth2: '#34465a', accent: '#c95b4e', hat: 'band', hatColor: '#f4ede0',
    accessory: 'chef', pos: [14.8, 0, 22.5], yaw: 1.3,
    dialogues: {
      new: [
        'いらっしゃい！小心烫——噢，是你呀。我的招财猫不见了，没有它，汤头好像都少了一点福气。',
        '昨天我把它放在稻荷神社的鸟居下晒太阳。你帮我找找，我给你下一碗全世界最好吃的拉面。',
      ],
      active: [
        '沿着东边的小路一直走，穿过一串朱红的鸟居，小猫就在稻荷神社前面的鸟居下。它白色带橘斑，很好认。',
      ],
      ready: [
        '就是它！你看，它还在笑。谢谢你，小客人。',
        '这颗星火送给你。它是我第一次熬出满意汤头的那天，锅盖上跳出来的光。',
      ],
      done: [
        '来，坐下吃碗面。叉烧给你多加一片，不许告诉别人哦。',
      ],
    },
  });
  ken.root.position.set(14.8, 0, 22.5);
  root.add(ken.root);

  const mochi = createMochi();
  mochi.root.position.set(8.9, 0, 18.0);
  mochi.root.rotation.y = -0.7;
  root.add(mochi.root);
  mochi.def.dialogues = {
    hint: [
      '喵～（Mochi 伸了个懒腰，用尾巴指了指西边的樱花林。）',
      '喵嗷——（它又朝东边那串朱红鸟居抬了抬下巴，尾巴尖轻轻晃了晃。）',
      '喵。（它蹭了蹭你的靴子，好像在说：慢慢玩，别着急。）',
    ],
  };

  const npcs = [hana, ken, mochi];

  // ---------------- quests & sparks ----------------
  const quests = [
    {
      id: 'hana-bell', npcId: 'hana',
      title: '樱花林里的铃铛', short: 'Hana 的结缘铃落在西边樱花林最大的树下。',
      item: { kind: 'bell', label: '神社的结缘铃', x: -33, y: 0.85, z: 10.9 },
      reward: '星火 · 风里的第一声铃',
    },
    {
      id: 'ken-cat', npcId: 'ken',
      title: '晒太阳的招财猫', short: 'Ken 的招财猫留在稻荷神社的鸟居下晒太阳。',
      item: { kind: 'cat', label: '招财猫摆件', x: 36, y: 0.7, z: 16.5 },
      reward: '星火 · 汤锅里跳出的光',
    },
  ];
  const questItems = quests.map((q) => {
    const item = createQuestItem({
      id: q.id, kind: q.item.kind, label: q.item.label,
      x: q.item.x, y: q.item.y, z: q.item.z,
    });
    root.add(item.group);
    return item;
  });

  const sparkDefs = [
    { id: 'japan-torii', x: 36, y: 1.25, z: 6.3, label: '稻荷神社后的星火' },
    { id: 'japan-pagoda', x: -15, y: 1.95, z: 5.8, label: '五重塔前的星火' },
    { id: 'japan-pond', x: 23.4, y: 1.25, z: 6.0, label: '鲤鱼池边的星火' },
  ];
  const sparks = sparkDefs.map((s) => {
    const spark = createSpark(s);
    root.add(spark.group);
    return spark;
  });

  colliders.push(
    ...placed.colliders,
    ...pagodaPlaced.colliders,
    { type: 'circle', x: 28, z: 6, r: pond.radius + 0.35 },
  );

  const walkables = [island.ground, ...pagoda.walkables, ...hondo.walkables];

  const facts = [
    {
      key: 'japan-arrival', title: '雷门与仲见世',
      text: '浅草的早晨从雷门开始。巨大的红灯笼下，人力车和游人擦肩而过；仲见世的纸灯笼一盏接一盏，把人潮慢慢引向观音的院子。',
    },
    {
      key: 'japan-landmark', title: '东京塔',
      text: '东京塔在 1958 年建成，高 333 米。它披着橘白相间的衣裳，晚上亮灯时，像一支巨大的温度计，替城市量着心跳。',
    },
    {
      key: 'japan-light', title: '温柔的力量',
      text: 'Coco 把铃铛轻轻摇了一下。原来温柔不是很小声，温柔是愿意认真听见别人的声音。',
    },
  ];

  const city = {
    id: 'japan',
    country: '日本',
    countryEn: 'JAPAN',
    cityName: '东京',
    cityEn: 'TOKYO',
    stamp: 'TO',
    locationCn: '浅草 · 东京',
    locationEn: 'ASAKUSA · TOKYO',
    kicker: 'TOKYO · THE GENTLEST LIGHT',
    intro: '雷门的红灯笼在风里轻轻摇。仲见世的甜香、五重塔的铃，还有稻荷神社前的一串朱红鸟居，一起把浅草的黄昏点亮了。',
    theme: THEMES.japan,
    group: root,
    env,
    island,
    landmark: tower,
    secondLandmark: pagoda,
    anchors: placed.anchors,
    heart: placed.heart,
    spawn: new THREE.Vector3(0, 0, 39.6),
    spawnYaw: Math.PI,
    walkables,
    colliders,
    cameraBlockers,
    walkRadius: island.walkRadius,
    npcs,
    quests,
    questItems,
    sparks,
    facts,
    postcard: {
      country: 'JAPAN', icon: '❀', city: 'TOKYO',
      title: '温柔的灯，照亮回家的路',
      text: '雷门、纸灯笼和拉面的热气，一起把浅草的夜色染成了暖暖的橘色。远处有人轻轻说了一声：おかえり。',
    },
    travel: null,
    cinema: {
      camera: new THREE.Vector3(0, 13, 1),
      look: new THREE.Vector3(24, 18, -31),
      captions: [
        '东京塔的灯，一盏一盏地亮了。',
        '五重塔的铃铛响了一声，樱花落得更慢了。',
        'Coco 的护照，已经盖满了三枚邮戳。',
      ],
    },
    factsState: { landmarkSeen: false },
    setLit(on) {
      tower.setLit(on);
      pagoda.setLit(on);
    },
    celebrate() {
      tower.setLit(true);
      pagoda.setLit(true);
    },
    update(dt, t, playerPos) {
      env.update(dt);
      tower.update(dt, t);
      pagoda.update(dt, t);
      pond.update(dt, t);
      ramen.update(dt, t);
      incense.update(dt, t);
      trafficSignals.forEach((s) => s.update(dt, t));
      lanternStrings.forEach((s) => s.update(dt, t));
      birds.update(dt, t);
      petals.update(dt, t);
      flags.forEach((f) => f.update(t));
      npcs.forEach((n) => n.update(dt, t, playerPos));
      sparks.forEach((s) => s.update(dt, t));
      questItems.forEach((q) => q.update(dt, t));
      if (playerPos && !city.factsState.landmarkSeen) {
        const dx = playerPos.x - 24, dz = playerPos.z + 24;
        if (dx * dx + dz * dz < 17 * 17) city.factsState.landmarkSeen = true;
      }
    },
  };
  return city;
}

