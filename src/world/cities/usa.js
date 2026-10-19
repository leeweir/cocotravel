import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THEMES, createEnvironment, createIsland, createBirds } from '../environment.js';
import {
  createTree, createBush, createHedge, createFlowerBed, createLamp, createBench,
  createPigeons, createCrate, createSign, createTaxi,
} from '../props.js';
import { createLiberty } from '../landmarks/liberty.js';
import { createNPC } from '../npc.js';
import { createSpark, createQuestItem } from '../collectibles.js';
import {
  grassTexture, pavingTexture, flagTexture, signTexture, dotTexture, canvas2d, canvasTexture,
} from '../../core/utils.js';
import {
  addPath, addCirclePatch, addGroundPatch, placeLandmark, addFlag, labelSprite,
} from './common.js';
import { createBuildingRow } from '../buildings.js';
import {
  createSeawall, createPier, createFerryTerminal, createFerry, createManhattanSkyline,
  createCastleClinton, createSphereSculpture, createHarborCraft, createHarborPatrol,
  createFoamRing, createEllisIsland,
} from '../harbor.js';

const stoneMat = (color = '#a89f8e') => new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
const ironMat = new THREE.MeshStandardMaterial({ color: '#3d4747', roughness: 0.6, metalness: 0.4 });

/* ------------------------------------------------------------------ */
/*  park furniture                                                     */
/* ------------------------------------------------------------------ */
function createParkBin(x, z) {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#38564a', roughness: 0.66, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.72, 12, 1, true), green);
  body.position.y = 0.4;
  body.castShadow = true;
  group.add(body);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.68, 0.055), green);
    slat.position.set(Math.cos(a) * 0.28, 0.4, Math.sin(a) * 0.28);
    slat.rotation.y = -a;
    group.add(slat);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 5, 16), green);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.77;
  group.add(rim);
  const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.55, 10), new THREE.MeshStandardMaterial({ color: '#252c2b', roughness: 1 }));
  bag.position.y = 0.36;
  group.add(bag);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.06, 12), green);
  base.position.y = 0.04;
  group.add(base);
  group.position.set(x, 0, z);
  return group;
}

function createDrinkingFountain() {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#b3a996', roughness: 0.9 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#5d6c5e', roughness: 0.42, metalness: 0.55 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.18, 10), stone);
  base.position.y = 0.09;
  base.castShadow = true;
  group.add(base);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.9, 10), stone);
  column.position.y = 0.62;
  column.castShadow = true;
  group.add(column);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.22, 0.16, 14), bronze);
  bowl.position.y = 1.08;
  group.add(bowl);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 6), bronze);
  spout.position.set(0, 1.18, 0.1);
  spout.rotation.x = 0.7;
  group.add(spout);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.42, 5),
    new THREE.MeshBasicMaterial({ color: '#cfe9e4', transparent: true, opacity: 0.55 }),
  );
  water.position.set(0, 0.96, 0.28);
  group.add(water);
  group.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return group;
}

function createFerrySign(text, sub, x, z, y) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const tex = signTexture(text, {
    sub, bg: '#e9ddc2', fg: '#314b43', border: '#8b7a5e', size: 46, tape: false,
  });
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.78),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86 }),
  );
  board.position.y = 1.45;
  board.castShadow = true;
  group.add(board);
  const boardBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.78),
    new THREE.MeshStandardMaterial({ color: '#9c7c56', roughness: 0.92 }),
  );
  boardBack.position.set(0, 1.45, -0.015);
  boardBack.rotation.y = Math.PI;
  group.add(boardBack);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.25, 6), ironMat);
    post.position.set(s * 0.72, 0.62, 0);
    group.add(post);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.16), ironMat);
  cap.position.y = 1.87;
  group.add(cap);
  return group;
}

function createTrafficLight() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.8, 8), ironMat);
  pole.position.y = 2.4;
  pole.castShadow = true;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.4, 6), ironMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(1.7, 4.55, 0);
  group.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.0, 0.3), new THREE.MeshStandardMaterial({ color: '#2f3a38', roughness: 0.7 }));
  head.position.set(3.2, 4.15, 0);
  group.add(head);
  const colors = ['#d75a4a', '#ddb24e', '#6ba67a'];
  colors.forEach((c, i) => {
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 12),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i === 2 ? 0.9 : 0.12, roughness: 0.4 }),
    );
    lens.position.set(3.2, 4.46 - i * 0.3, 0.16);
    group.add(lens);
  });
  return group;
}

/* Rosa's bagel cart */
function createBagelCart() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#7f9c92', roughness: 0.55 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#e8d7b4', roughness: 0.7 });
  const wood = new THREE.MeshStandardMaterial({ color: '#a88158', roughness: 0.85 });

  const box = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.1, 1.35, 3, 0.12), bodyMat);
  box.position.y = 0.8;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.12, 1.5, 2, 0.05), trimMat);
  top.position.y = 1.4;
  group.add(top);
  for (const s of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 6, 18), wood);
    wheel.position.set(s * 0.9, 0.32, 0.74);
    wheel.castShadow = true;
    group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 8), trimMat);
    hub.position.copy(wheel.position);
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
  }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6), trimMat);
  handle.position.set(1.45, 0.95, 0.3);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);
  const awningTex = (() => {
    const { c, ctx } = canvas2d(256, 64);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f7ecd6' : '#cf6e5e';
      ctx.fillRect(i * 32, 0, 32, 64);
    }
    return canvasTexture(c);
  })();
  const awning = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 0.5, 12, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({ map: awningTex, side: THREE.DoubleSide, roughness: 0.9 }),
  );
  awning.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  awning.position.set(0, 1.95, -0.4);
  awning.scale.z = 0.55;
  group.add(awning);
  for (const s of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5), wood);
    pole.position.set(0, 1.55, s * 0.65);
    group.add(pole);
  }
  for (let i = 0; i < 4; i++) {
    const bagel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.055, 6, 14), new THREE.MeshStandardMaterial({ color: '#c98f52' }));
    bagel.rotation.x = Math.PI / 2;
    bagel.position.set(-0.62 + (i % 2) * 0.1, 1.52 + i * 0.05, 0.1);
    group.add(bagel);
  }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.26, 10), new THREE.MeshStandardMaterial({ color: '#d9d2c4', metalness: 0.4, roughness: 0.4 }));
  pot.position.set(0.5, 1.58, 0.05);
  group.add(pot);
  const signTex = signTexture("ROSA'S BAGELS", { sub: 'HOT & FRESH', bg: '#f2e4c9', fg: '#4a3830', border: '#c67c5f', size: 38, tape: false });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }));
  sign.position.set(0, 2.4, 0.1);
  group.add(sign);
  const steam = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTexture(), color: '#fffaf0', transparent: true, opacity: 0.2, depthWrite: false,
    }));
    s.scale.setScalar(0.5);
    s.position.set(-0.4 + i * 0.2, 1.8, 0);
    s.userData.phase = Math.random();
    group.add(s);
    steam.push(s);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  function update(dt, t) {
    steam.forEach((s, i) => {
      const k = (t * 0.16 + s.userData.phase) % 1;
      s.position.y = 1.8 + k * 1.4;
      s.position.x = -0.4 + i * 0.2 + Math.sin(t + i) * 0.08;
      s.material.opacity = 0.24 * (1 - k);
      s.scale.setScalar(0.4 + k * 0.6);
    });
  }
  return { group, update };
}

/* ------------------------------------------------------------------ */
/*  city backdrop                                                      */
/* ------------------------------------------------------------------ */
function buildCityBackdrop(root, grass) {
  const cityGround = addGroundPatch(root, {
    x: 0, z: 136, width: 340, depth: 190, y: 0.045, color: '#c7c0b2',
    texture: pavingTexture('slab', 44),
  });
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(340, 1.5, 0.9),
    stoneMat('#6f685c'),
  );
  skirt.position.set(0, -0.7, 41);
  root.add(skirt);

  // green strip directly behind the park wall
  const stripTex = grass.clone();
  stripTex.needsUpdate = true;
  addGroundPatch(root, {
    x: 0, z: 46.5, width: 108, depth: 7.4, y: 0.058,
    texture: stripTex, color: '#eef0dd',
  });

  // sidewalks + asphalt
  addGroundPatch(root, { x: 0, z: 51.6, width: 300, depth: 4.2, y: 0.056, color: '#b6ae9e' });
  addGroundPatch(root, { x: 0, z: 58, width: 300, depth: 8.6, y: 0.052, color: '#4b4c4d', roughness: 1 });
  addGroundPatch(root, { x: 0, z: 64.6, width: 300, depth: 4.4, y: 0.056, color: '#b6ae9e' });
  const markingMat = new THREE.MeshStandardMaterial({ color: '#e8e2d0', roughness: 0.9 });
  for (let i = -14; i <= 14; i++) {
    if (i === 0) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.012, 0.15), markingMat);
    dash.position.set(i * 8.2, 0.06, 58);
    root.add(dash);
  }
  for (let i = 0; i < 7; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.014, 7.7), markingMat);
    stripe.position.set(-3.9 + i * 1.3, 0.062, 58);
    root.add(stripe);
  }

  // parked cabs
  const cabSpecs = [[-24, 56.6, Math.PI / 2], [25, 59.4, -Math.PI / 2], [72, 56.8, Math.PI / 2]];
  cabSpecs.forEach(([x, z, yaw]) => {
    const cab = createTaxi();
    cab.position.set(x, 0.06, z);
    cab.rotation.y = yaw;
    root.add(cab);
  });

  const light = createTrafficLight();
  light.position.set(6.6, 0.06, 52.2);
  light.rotation.y = Math.PI;
  root.add(light);
  const light2 = createTrafficLight();
  light2.position.set(-24, 0.06, 64.4);
  light2.rotation.y = 0;
  root.add(light2);

  // street trees and lamps
  for (let i = 0; i < 7; i++) {
    const x = -45 + i * 15;
    const tree = createTree({ height: 4.6 + (i % 3) * 0.5, canopy: 2.7 + (i % 2) * 0.3, seed: 40 + i });
    tree.position.set(x, 0.06, 47.2);
    tree.rotation.y = i * 0.6;
    root.add(tree);
  }
  for (const x of [-38, -18, 2, 22, 42]) {
    const lamp = createLamp('ny', { lit: true });
    lamp.position.set(x, 0.06, 49.8);
    root.add(lamp);
  }

  // facade row facing the park
  const row = createBuildingRow({
    x: 0, z: 72, yaw: Math.PI, length: 128,
    styles: ['limestone', 'brownstone', 'brick', 'office'],
    minWidth: 10, maxWidth: 15.5, depth: [9, 12], floors: [4, 7], seed: 31,
    gap: 0.5, shops: true,
    shopNames: ['BATTERY CAFE', 'LIBERTY GIFTS', 'HARBOR DELI', 'OAK & IRON', 'OYSTER BAR', 'FERRY BOOKS', 'BROAD ST. MARKET'],
    fireEscapes: true, stoopEvery: 2,
  });
  root.add(row);

  const skyline = createManhattanSkyline();
  root.add(skyline.group);

  return { cityGround, skyline };
}

/* ------------------------------------------------------------------ */
/*  main city                                                          */
/* ------------------------------------------------------------------ */
export function createUSA(scene) {
  const root = new THREE.Group();
  root.name = 'city-usa';
  scene.add(root);

  const env = createEnvironment(scene, THEMES.usa, {
    radius: 55, shadowRadius: 100, shadowCenter: [0, 0, -22], shadowFar: 420,
    extraIsland: { x: 0, z: -90, r: 24.5 },
  });

  const grass = grassTexture(21, [122, 156, 91], [151, 185, 110]);
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(13, 13);
  const island = createIsland(THEMES.usa, {
    radius: 55, seed: 11, groundTexture: grass, groundColor: '#f0ecd4',
    cliffColor: '#c8b591', sandColor: '#ead7b0', islets: 3,
    rockSkip: (a) => Math.sin(a) > 0.55,
  });
  root.add(island.group);

  const libertyGrass = grassTexture(37, [116, 150, 86], [146, 179, 105]);
  libertyGrass.wrapS = libertyGrass.wrapT = THREE.RepeatWrapping;
  libertyGrass.repeat.set(7, 7);
  const libertyIsland = createIsland(THEMES.usa, {
    radius: 24.5, seed: 71, groundTexture: libertyGrass, groundColor: '#eef0d8',
    cliffColor: '#c2b292', sandColor: '#e8d6b2', islets: 0,
  });
  libertyIsland.group.position.set(0, 0, -90);
  root.add(libertyIsland.group);

  const slab = pavingTexture('slab', 8);
  const gravel = pavingTexture('gravel', 5);

  /* ---------------- paths & plazas ---------------- */
  addPath(root, {
    points: [[0, 38], [0, 30], [-1, 22], [-2.5, 14], [-3, 4], [-2, -6], [0, -16], [4, -26], [10, -34], [18, -38], [23, -40]],
    width: 4.4, texture: slab, repeat: 8,
  });
  addPath(root, {
    points: [[-2.5, 14], [-7, 12], [-12, 9], [-16, 4], [-17, -4], [-18, -12], [-16, -22], [-14, -32], [-9, -38]],
    width: 3.0, texture: gravel, repeat: 6,
  });
  addPath(root, {
    points: [[-2, 22], [-8, 21], [-14, 19.5]],
    width: 2.6, texture: gravel, repeat: 4,
  });
  addPath(root, {
    points: [[-3, 10], [4, 9], [12, 7], [20, 4], [26, -2], [29, -10], [30, -18], [29.5, -21.5]],
    width: 3.0, texture: gravel, repeat: 6,
  });
  addPath(root, {
    points: [[-38, -26], [-33, -34], [-24, -41], [-12, -46], [2, -47.5], [15, -45], [22, -42], [23.6, -40.5]],
    width: 3.6, texture: slab, repeat: 7,
  });
  addPath(root, {
    points: [[-17, -4], [-13, -6], [-11, -7]],
    width: 2.4, texture: slab, repeat: 3,
  });
  addCirclePatch(root, { x: 0, z: 14, radius: 6.2, texture: slab, ringColor: '#b9a88d' });
  addCirclePatch(root, { x: -11, z: -8, radius: 4.8, texture: slab, ringColor: '#b3a58c' });

  /* ---------------- harbor: seawalls, pier, terminal, ferry ---------------- */
  const mainWall = createSeawall({ radius: 53.2, a0: Math.PI * 0.72, a1: Math.PI * 1.585, segments: 96 });
  root.add(mainWall);
  const eastWall = createSeawall({
    radius: 53.2, a0: Math.PI * 1.715, a1: Math.PI * 2.28, segments: 56,
  });
  root.add(eastWall);

  const libertyWall = createSeawall({
    radius: 23.35, a0: Math.PI / 2 + 0.24, a1: Math.PI / 2 + Math.PI * 2 - 0.24, segments: 48,
    color: '#b0a794',
  });
  libertyWall.position.set(0, 0, -90);
  root.add(libertyWall);

  const mainPier = createPier({
    x: 24, z: -42.5, yaw: Math.PI, width: 4.2, length: 11, height: 0.3,
  });
  root.add(mainPier.group);

  const libertyPier = createPier({
    x: 0, z: -70.5, yaw: 0, width: 5, length: 9, height: 0.3,
  });
  root.add(libertyPier.group);

  const terminal = createFerryTerminal({ x: 31, z: -33.5, yaw: 3.55 });
  root.add(terminal);

  const ferry = createFerry({
    main: {
      boat: [28.6, -50], stand: [24, 0.3, -51.4], arrive: [24, 0.3, -47.5],
      yaw: 0, label: '乘渡轮 · 自由岛', name: '曼哈顿 · 炮台公园',
    },
    liberty: {
      boat: [4.6, -64.6], stand: [0, 0.3, -63.6], arrive: [0, 0.3, -67.5],
      yaw: Math.PI, label: '乘渡轮 · 曼哈顿', name: '自由岛 · 自由女神像',
    },
    duration: 7.4,
  });
  root.add(ferry.group);

  const mainFerrySign = createFerrySign('LIBERTY FERRY', '自由岛渡轮', 25.6, -50.2, 0.3);
  root.add(mainFerrySign);
  const mainFerryTag = labelSprite(['⛴ 乘渡轮 · 自由岛'], {
    width: 2.9, height: 0.62, scale: 0.62, bg: '#fffaf0', color: '#314b43',
  });
  mainFerryTag.position.set(24, 2.7, -51.4);
  root.add(mainFerryTag);
  const libertyFerrySign = createFerrySign('MANHATTAN FERRY', '曼哈顿渡轮', 1.9, -62.6, 0.3);
  root.add(libertyFerrySign);
  const libertyFerryTag = labelSprite(['⛴ 乘渡轮 · 曼哈顿'], {
    width: 2.9, height: 0.62, scale: 0.62, bg: '#fffaf0', color: '#314b43',
  });
  libertyFerryTag.position.set(0, 2.7, -63.6);
  root.add(libertyFerryTag);

  /* ---------------- Liberty Island ---------------- */
  const liberty = createLiberty();
  const placed = placeLandmark(root, liberty, 0, -90);

  addPath(root, {
    points: [[0, -70.7], [0, -75.4]], width: 4.0, texture: slab, repeat: 2,
  });
  addGroundPatch(root, {
    x: 0, z: -76.6, width: 7.2, depth: 3.4, y: 0.04, texture: slab, color: '#c0b49c',
  });

  for (const [x, z, s, seed] of [
    [-15, -72, 1.0, 2], [15, -76, 1.05, 3], [-17, -85, 1.1, 4],
    [17, -95, 1.0, 5], [-13, -101, 0.95, 6], [12, -103, 0.9, 7],
  ]) {
    const tree = createTree({ height: 4.3 * s, canopy: 2.8 * s, seed: seed + 60 });
    tree.position.set(x, 0, z);
    tree.rotation.y = seed;
    root.add(tree);
  }
  for (const [x, z] of [[-8.5, -72.5], [8.5, -72.5], [12.5, -84], [-12.5, -89]]) {
    const lamp = createLamp('ny', { lit: true });
    lamp.position.set(x, 0, z);
    root.add(lamp);
  }
  const libertyBenches = [
    { x: -14, z: -78, yaw: Math.PI / 2 },
    { x: 14, z: -89, yaw: -Math.PI / 2 },
    { x: -11, z: -97, yaw: Math.PI / 2 },
  ];
  libertyBenches.forEach((b) => {
    const bench = createBench('#9a6c46');
    bench.position.set(b.x, 0, b.z);
    bench.rotation.y = b.yaw;
    root.add(bench);
  });
  const libertySign = createSign('LIBERTY ISLAND', '自由岛 · 自由女神像', {
    width: 3.0, height: 0.95, postH: 1.8,
  });
  libertySign.position.set(4.7, 0, -72.3);
  libertySign.rotation.y = 0.25;
  root.add(libertySign);
  for (const [x, z, r] of [[-9, -77, 2.0], [10, -80, 1.8], [-8, -97, 1.7], [9, -99, 1.6]]) {
    const bed = createFlowerBed(r, ['#f0b64b', '#e9705b', '#f7d6df', '#8fa9d8', '#ffffff']);
    bed.position.set(x, 0, z);
    root.add(bed);
  }

  /* ---------------- park landmarks ---------------- */
  const castle = createCastleClinton();
  castle.position.set(-26, 0, -24);
  root.add(castle);
  const sphere = createSphereSculpture();
  sphere.position.set(-11, 0, -8);
  root.add(sphere);

  /* ---------------- greenery ---------------- */
  const parkTreeSpecs = [
    [-25, 12, 1.35, 4.6, 2.9], [-35, 10, 1.2, 4.1, 2.5], [-39, -6, 1.3, 4.4, 2.7],
    [-33, -24, 1.15, 3.8, 2.3], [-31, -39, 1.05, 3.4, 2.0], [-6, -22, 1.05, 3.5, 2.1],
    [9, -19, 1.0, 3.3, 2.0], [20, 18, 1.1, 3.6, 2.2], [30, 5, 1.0, 3.3, 2.0],
    [39, -8, 1.15, 3.9, 2.4], [33, 25, 1.2, 4.0, 2.4], [16, 28, 1.0, 3.2, 1.9],
    [-13, 30, 1.15, 3.8, 2.3], [-38, 24, 1.25, 4.2, 2.5],
  ];
  parkTreeSpecs.forEach(([x, z, s, h, c], i) => {
    const tree = createTree({ height: h, canopy: c, seed: i + 3 });
    tree.position.set(x, 0, z);
    tree.rotation.y = i * 0.8;
    tree.scale.setScalar(s);
    root.add(tree);
  });
  const bigTree = createTree({ height: 5.6, canopy: 3.5, colors: ['#6f9450', '#7fa45b', '#5f8546'], seed: 9 });
  bigTree.position.set(-31, 0, 3);
  root.add(bigTree);

  [[-8, 20, 1.7, ['#f0b64b', '#e9705b', '#f7d6df']], [8, 24, 1.9], [15, 13, 1.4], [5, -4, 1.5], [-3.5, 31, 1.2],
    [-20, 6, 1.5], [-23, -12, 1.6], [25, -12, 1.4], [12, -33, 1.5], [-9, -30, 1.3]].forEach(([x, z, r, colors]) => {
    const bed = createFlowerBed(r, colors || ['#f0b64b', '#e9705b', '#f7d6df', '#8fa9d8', '#ffffff']);
    bed.position.set(x, 0, z);
    root.add(bed);
  });
  [[-17, 16, 2.8], [12, 20, 2.7], [22, -6, 3.0], [7, -12, 2.2], [-20, -33, 2.4], [18, -28, 2.1]].forEach(([x, z, s]) => {
    const bush = createBush(s * 0.8);
    bush.position.set(x, 0, z);
    root.add(bush);
  });
  const hedgeA = createHedge(6, 0.9);
  hedgeA.position.set(7, 0, 17);
  hedgeA.rotation.y = 0.2;
  root.add(hedgeA);
  const hedgeB = createHedge(5, 0.85);
  hedgeB.position.set(-16, 0, -2.5);
  hedgeB.rotation.y = Math.PI / 2;
  root.add(hedgeB);

  /* ---------------- street furniture ---------------- */
  for (const [x, z] of [[-7, 19], [7.5, 2], [18, -12], [-23, 12], [-7, -36], [20, -35], [-35, -30], [8, 30]]) {
    const lamp = createLamp('ny', { lit: true });
    lamp.position.set(x, 0, z);
    root.add(lamp);
  }
  const benches = [
    { x: -9.5, z: 23, yaw: 0.2 },
    { x: 6.5, z: -3.5, yaw: -0.4 },
    { x: 35, z: -17.8, yaw: Math.PI / 2 },
    { x: 34.6, z: -22.8, yaw: Math.PI / 2 },
    { x: -24, z: -37, yaw: Math.PI / 4 },
  ];
  benches.forEach((b) => {
    const bench = createBench('#9a6c46');
    bench.position.set(b.x, 0, b.z);
    bench.rotation.y = b.yaw;
    root.add(bench);
  });
  root.add(createParkBin(-4.5, 12.5));
  root.add(createParkBin(23.5, -14.5));
  root.add(createParkBin(-10.5, -36.5));
  const fountain = createDrinkingFountain();
  fountain.position.set(4.5, 0, 16.5);
  root.add(fountain);

  const welcome = createSign('BATTERY PARK', '炮台公园 · 纽约港', {
    width: 3.4, height: 1.15, postH: 2.05,
  });
  welcome.position.set(4.6, 0, 28.3);
  welcome.rotation.y = 0.18;
  root.add(welcome);
  const wayfinding = createSign('LIBERTY FERRY →', '自由岛渡轮 · 码头', {
    width: 2.6, height: 0.8, postH: 1.55,
  });
  wayfinding.position.set(7.2, 0, 4.5);
  wayfinding.rotation.y = -0.35;
  root.add(wayfinding);
  const dockSign = createSign('LIBERTY FERRY', '自由岛渡轮 · 候船处', {
    width: 2.6, height: 0.8, postH: 1.6,
  });
  dockSign.position.set(20.4, 0, -40.6);
  dockSign.rotation.y = 0.55;
  root.add(dockSign);

  /* ---------------- the city behind the wall ---------------- */
  const lowWall = new THREE.Mesh(new THREE.BoxGeometry(108, 0.82, 0.62), stoneMat('#a59c8b'));
  lowWall.position.set(0, 0.47, 42.5);
  lowWall.castShadow = true;
  lowWall.receiveShadow = true;
  root.add(lowWall);
  const wallCap = new THREE.Mesh(new THREE.BoxGeometry(108.2, 0.13, 0.82), stoneMat('#c2b8a4'));
  wallCap.position.set(0, 0.93, 42.5);
  root.add(wallCap);
  for (let i = 0; i < 8; i++) {
    const h = createHedge(8, 0.92);
    h.position.set(-46 + i * 13, 0.98, 43.6);
    root.add(h);
  }
  const { skyline } = buildCityBackdrop(root, grass);

  /* ---------------- harbor life ---------------- */
  const flags = [
    addFlag(root, flagTexture('usa'), 7.4, 24.4, { height: 7.2, scale: 1.35, yaw: -0.3 }),
    addFlag(root, flagTexture('usa'), 8.2, -73.5, { height: 6.4, scale: 1.15, yaw: 0.5 }),
  ];
  const pigeons = createPigeons(7, 4);
  pigeons.group.position.set(31.6, 0, -19.5);
  root.add(pigeons.group);
  const birds = createBirds(6, '#fff9ee', 26, 52);
  root.add(birds.group);

  const harborCraft = createHarborCraft();
  root.add(harborCraft.group);
  const patrol = createHarborPatrol();
  root.add(patrol.group);
  const foam = createFoamRing({ x: 0, z: -90, radius: 24.3, count: 46 });
  root.add(foam.group);
  root.add(createEllisIsland());

  /* ---------------- the taxi, cart, crates ---------------- */
  const taxi = createTaxi();
  taxi.position.set(-18, 0, 18);
  taxi.rotation.y = 1.15;
  root.add(taxi);

  const cart = createBagelCart();
  cart.group.position.set(14.8, 0, 9.6);
  cart.group.rotation.y = -0.42;
  root.add(cart.group);

  const crateDefs = [
    { x: 23.0, y: 0.3, z: -44.4, size: 1.0 },
    { x: 23.15, y: 0.3, z: -45.4, size: 0.85 },
    { x: 23.15, y: 1.15, z: -45.4, size: 0.85 },
  ];
  const crates = crateDefs.map((c) => {
    const crate = createCrate(c.size, '#b58a5c');
    crate.position.set(c.x, c.y, c.z);
    crate.rotation.y = (c.x + c.z) % 0.4;
    root.add(crate);
    return { ...c, crate };
  });

  /* ---------------- people ---------------- */
  const rosa = createNPC({
    id: 'rosa', name: 'Rosa', nameSub: '贝果阿姨', marker: 'quest', questId: 'rosa-wheel',
    scale: 1.0, style: 'dress', skin: '#eec1a3', hairColor: '#5a3d2b', hairStyle: 'bun',
    cloth: '#8b9f88', cloth2: '#f4e9d2', accent: '#cf6e5e', accessory: 'apron',
    pos: [17.4, 0, 8.4], yaw: 0.55,
    dialogues: {
      new: [
        '哎呀，你来得正好！我的贝果车少了一只木轮子，今天早上它咕噜噜地滚走啦。',
        '沿着草坡边那条碎石小路往西北走，有辆黄色出租车停在老树下。轮子好像就躲在那边，帮我找回来好吗？',
      ],
      active: [
        '往西北走到草坪边，看见那辆黄色出租车了吗？轮子就躲在它旁边的草丛里，会一闪一闪地发光。',
      ],
      ready: [
        '找到啦！就是这只轮子！你的眼睛比我的蓝莓酱还要亮。',
        '这颗星火送给你。它是我烤出第一炉贝果的那天，从烤箱里蹦出来的。',
      ],
      done: [
        '贝果马上就好。要不要加一点蓝莓酱？刚出炉的最好吃。',
      ],
    },
  });
  rosa.root.position.set(17.4, 0, 8.4);
  root.add(rosa.root);

  const sam = createNPC({
    id: 'sam', name: 'Sam', nameSub: '公园管理员', marker: 'quest', questId: 'sam-whistle',
    scale: 1.05, style: 'coat', skin: '#d6a07c', hairColor: '#483428', hairStyle: 'short',
    cloth: '#687f5e', cloth2: '#e5d7b6', pants: '#4d4639', hat: 'ranger', hatColor: '#7a6244',
    accessory: 'camera', pos: [28.5, 0, -22], yaw: 1.9,
    dialogues: {
      new: [
        '你好呀，小旅行家。我是 Sam，负责照看这座炮台公园。',
        '我的黄铜口哨不见了。没有它，鸽子们都不肯听我排队。刚才我在东南边的旧长椅那儿喂过它们。',
      ],
      active: [
        '顺着海边小路往东南走，拐过草坪就是那两张旧长椅。口哨应该就在长椅周围，会一闪一闪地发光。',
      ],
      ready: [
        '就是它！谢谢你，耳朵真灵的小侦探。',
        '这颗星火交给你。它会在最暗的时候，替你把路照亮。',
      ],
      done: [
        '看，鸽子们又排好队了。呼——它们好像在说谢谢。',
      ],
    },
  });
  sam.root.position.set(28.5, 0, -22);
  root.add(sam.root);

  const theo = createNPC({
    id: 'theo', name: 'Theo', nameSub: '爵士吉他手', marker: 'hint',
    scale: 1.02, style: 'coat', skin: '#9c6a4d', hairColor: '#2e241f', hairStyle: 'messy',
    cloth: '#5b6e7a', cloth2: '#e0cdaa', accent: '#d3a45d', accessory: 'guitar',
    pos: [-13, 0, 12], yaw: 1.1,
    dialogues: {
      hint: [
        '欢迎来到炮台公园。听见了吗？风里有一点点爵士乐的味道。',
        '悄悄告诉你：星火不只藏在这座岛上。坐渡轮去自由岛看看，星形堡垒的墙头也藏着一颗。',
        '渡轮码头在东南边的木栈桥上。别急着赶路，旅行呀，要慢慢走。',
      ],
    },
  });
  theo.root.position.set(-13, 0, 12);
  root.add(theo.root);

  const npcs = [rosa, sam, theo];

  /* ---------------- quests & sparks ---------------- */
  const quests = [
    {
      id: 'rosa-wheel', npcId: 'rosa',
      title: '滚走的贝果车轮子', short: 'Rosa 的贝果车少了一只轮子，它好像滚到西北边的黄色出租车旁了。',
      item: { kind: 'wheel', label: '贝果车轮子', x: -15.2, y: 0.72, z: 19.5 },
      reward: '星火 · 烤箱里的第一束光',
    },
    {
      id: 'sam-whistle', npcId: 'sam',
      title: '鸽子的口哨', short: 'Sam 的黄铜口哨落在了东南边的旧长椅附近。',
      item: { kind: 'whistle', label: '黄铜口哨', x: 34.2, y: 0.72, z: -20.4 },
      reward: '星火 · 海风里的口哨声',
    },
  ];
  const questItems = quests.map((q) => {
    const item = createQuestItem({ id: q.id, kind: q.item.kind, x: q.item.x, y: q.item.y, z: q.item.z, label: q.item.label });
    root.add(item.group);
    return item;
  });

  const sparkDefs = [
    { id: 'usa-pier', x: 23.15, y: 2.62, z: -45.4, label: '码头箱顶的星火' },
    { id: 'usa-tree', x: -33.4, y: 1.3, z: 3.6, label: '大树背后的星火' },
    { id: 'usa-fort', x: 4.6, y: 2.55, z: -85.6, label: '星形堡垒上的星火' },
  ];
  const sparks = sparkDefs.map((s) => {
    const spark = createSpark(s);
    root.add(spark.group);
    return spark;
  });

  /* ---------------- data ---------------- */
  const treeColliders = [];
  parkTreeSpecs.forEach(([x, z]) => treeColliders.push({ type: 'circle', x, z, r: 0.42 }));
  treeColliders.push(
    { type: 'circle', x: -31, z: 3, r: 0.75 },
    { type: 'circle', x: -15, z: -72, r: 0.42 },
    { type: 'circle', x: 15, z: -76, r: 0.42 },
    { type: 'circle', x: -17, z: -85, r: 0.42 },
    { type: 'circle', x: 17, z: -95, r: 0.42 },
  );

  const colliders = [
    ...placed.colliders,
    { type: 'circle', x: -26, z: -24, r: 7.2 },
    { type: 'circle', x: -11, z: -8, r: 2.7 },
    { type: 'circle', x: 31, z: -33.5, r: 6.1 },
    { type: 'circle', x: 14.8, z: 9.6, r: 1.8 },
    { type: 'box', x: -18, z: 18, w: 3.1, d: 4.4 },
    { type: 'box', x: 0, z: 42.5, w: 110, d: 0.8 },
    { type: 'box', x: -9.5, z: 23, w: 2.0, d: 0.9 },
    { type: 'box', x: 6.5, z: -3.5, w: 2.0, d: 0.9 },
    { type: 'box', x: 35, z: -17.8, w: 0.9, d: 2.0 },
    { type: 'box', x: 34.6, z: -22.8, w: 0.9, d: 2.0 },
    { type: 'box', x: -24, z: -37, w: 1.5, d: 1.5 },
    { type: 'box', x: 4.5, z: 16.5, w: 1.3, d: 1.3 },
    ...treeColliders,
    ...crates.map(({ x, y, z, size }) => ({
      type: 'box', x, z, w: size + 0.08, d: size + 0.08, top: y + size,
    })),
  ];

  const walkables = [
    island.ground,
    libertyIsland.ground,
    mainPier.walkable,
    libertyPier.walkable,
    ...liberty.walkables,
    ...crates.map((c) => c.crate),
  ];

  const walkAreas = [
    { x: 0, z: 0, r: 49 },
    { x: 0, z: -90, r: 20.6 },
    { x: 24, z: -48, w: 4.2, d: 11.4 },
    { x: 0, z: -66, w: 5, d: 9.2 },
  ];

  const facts = [
    {
      key: 'usa-arrival', title: '炮台公园的风',
      text: '纽约港的风里混着咖啡、热面包和海水的味道。渡轮的汽笛在木栈桥尽头响了一声，像在催小旅行家出发。',
    },
    {
      key: 'usa-landmark', title: '自由女神像',
      text: '她住在自己的小岛上，高举的火炬是自由的光。原本金亮的铜衣，在海风里慢慢变成了现在温柔的青绿色。她脚下的星形堡垒，已经站了两百多年。',
    },
    {
      key: 'usa-light', title: '光住在哪里',
      text: '当五颗星火聚在一起，港口就重新亮了起来。Coco 发现：光最喜欢住在愿意帮助别人的人心里。',
    },
  ];

  const city = {
    id: 'usa',
    country: '美国',
    countryEn: 'USA',
    cityName: '纽约',
    cityEn: 'NEW YORK',
    stamp: 'NY',
    locationCn: '纽约港 · 炮台公园',
    locationEn: 'NEW YORK HARBOR',
    kicker: 'NEW YORK · THE FIRST LIGHT',
    intro: '午后的炮台公园，热面包的香气飘过草坪。自由女神像站在自己的小岛上，渡轮正等着载你出海。',
    theme: THEMES.usa,
    group: root,
    env,
    island,
    libertyIsland,
    landmark: liberty,
    anchors: placed.anchors,
    heart: placed.heart,
    spawn: new THREE.Vector3(0, 0, 31),
    spawnYaw: Math.PI,
    walkables,
    colliders,
    walkRadius: 49,
    walkAreas,
    ferry,
    npcs,
    quests,
    questItems,
    sparks,
    facts,
    skyline,
    postcard: {
      country: 'USA', icon: '✦', city: 'NEW YORK',
      title: '自由的火炬，重新亮起',
      text: '整座港口都被暖暖的光包围了。渡轮拉响汽笛，连鸽子都停下来，看着岛上的火炬。',
    },
    travel: {
      title: '巴黎',
      sub: 'PARIS · 塞纳河的风里有面包香',
    },
    cinema: {
      camera: new THREE.Vector3(31, 11, -68),
      look: new THREE.Vector3(0, 13, -90),
      captions: [
        '自由女神像的火炬，重新亮了起来。',
        '曼哈顿的每一扇窗，都像在说：欢迎回家。',
        'Coco 的护照上，多了一枚温暖的邮戳。',
      ],
    },
    factsState: { landmarkSeen: false },
    setLit(on) {
      liberty.setLit(on);
      skyline.glow(on);
    },
    celebrate() {
      liberty.setLit(true);
      skyline.glow(true);
    },
    update(dt, t, playerPos) {
      env.update(dt);
      liberty.update(dt, t);
      cart.update(dt, t);
      flags.forEach((f) => f.update(t));
      pigeons.update(dt, t);
      birds.update(dt, t);
      harborCraft.update(dt, t);
      patrol.update(dt, t);
      foam.update(dt, t);
      ferry.update(dt);
      npcs.forEach((n) => n.update(dt, t, playerPos));
      sparks.forEach((s) => s.update(dt, t));
      questItems.forEach((q) => q.update(dt, t));
      if (!city.factsState.landmarkSeen && playerPos) {
        const dx = playerPos.x, dz = playerPos.z + 90;
        if (dx * dx + dz * dz < 30 * 30) city.factsState.landmarkSeen = true;
      }
    },
  };
  return city;
}
