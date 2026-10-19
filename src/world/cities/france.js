import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THEMES, createEnvironment, createIsland, createBirds, createPetals } from '../environment.js';
import {
  createTree, createHedge, createFlowerBed, createLamp, createBench, createPigeons,
  createFountain, createCafeSet, createBicycle, createStringLanterns, createSign,
  createCarousel,
} from '../props.js';
import { createEiffel } from '../landmarks/eiffel.js';
import { createArc } from '../landmarks/japan.js';
import { createBuildingRow } from '../buildings.js';
import { createSeine } from '../seine.js';
import { createNPC } from '../npc.js';
import { createSpark, createQuestItem } from '../collectibles.js';
import {
  grassTexture, pavingTexture, flagTexture, signTexture, canvas2d, canvasTexture, TAU,
} from '../../core/utils.js';
import {
  addPath, addCirclePatch, addGroundPatch, placeLandmark, addFlag,
} from './common.js';

/* ------------------------------------------------------------------ */
/*  local street props                                                 */
/* ------------------------------------------------------------------ */
function createSkyBalloon() {
  const group = new THREE.Group();
  const cream = new THREE.MeshStandardMaterial({ color: '#f6e6c8', roughness: 0.7 });
  const coral = new THREE.MeshStandardMaterial({ color: '#df8a78', roughness: 0.7 });
  const teal = new THREE.MeshStandardMaterial({ color: '#7fb2aa', roughness: 0.7 });
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 18), cream);
  balloon.scale.set(1, 1.15, 1);
  group.add(balloon);
  for (const s of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.SphereGeometry(1.81, 24, 18, s > 0 ? 0 : Math.PI, Math.PI / 2), s > 0 ? coral : teal);
    panel.scale.set(1, 1.15, 1);
    group.add(panel);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 0.6, 12), cream);
  neck.position.y = -2.25;
  group.add(neck);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: '#a87a4a', roughness: 0.9 }));
  basket.position.y = -3.4;
  group.add(basket);
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 3), new THREE.MeshBasicMaterial({ color: '#6d5841' }));
    rope.position.set(x, -2.8, z);
    group.add(rope);
  }
  group.scale.setScalar(2.6);
  return group;
}

function createBalustrade(length, color = '#d6cab2') {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color, roughness: 0.93 });
  const pale = new THREE.MeshStandardMaterial({ color: '#e6dcc6', roughness: 0.9 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(length, 0.16, 0.34), stone);
  base.position.y = 0.08;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, 0.3), pale);
  rail.position.y = 0.98;
  rail.castShadow = true;
  group.add(rail);

  const profile = [
    new THREE.Vector2(0.075, 0),
    new THREE.Vector2(0.11, 0.06),
    new THREE.Vector2(0.14, 0.18),
    new THREE.Vector2(0.09, 0.34),
    new THREE.Vector2(0.055, 0.46),
    new THREE.Vector2(0.11, 0.56),
    new THREE.Vector2(0.115, 0.64),
    new THREE.Vector2(0.065, 0.68),
  ];
  const balusterGeo = new THREE.LatheGeometry(profile, 7);
  const count = Math.max(4, Math.round(length / 0.3));
  const inst = new THREE.InstancedMesh(balusterGeo, stone, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const x = -length / 2 + (i + 0.5) * (length / count);
    m.makeTranslation(x, 0.15, 0);
    inst.setMatrixAt(i, m);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true;
  inst.receiveShadow = true;
  group.add(inst);

  const piers = Math.max(2, Math.round(length / 9));
  for (let i = 0; i <= piers; i++) {
    const x = -length / 2 + (i / piers) * length;
    const pier = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.0, 0.46, 2, 0.04), stone);
    pier.position.set(x, 0.55, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.56), pale);
    cap.position.set(x, 1.06, 0);
    cap.castShadow = true;
    group.add(cap);
  }
  return group;
}

function createStreetLamp() {
  const group = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: '#2f4841', roughness: 0.55, metalness: 0.35 });
  const glass = new THREE.MeshStandardMaterial({
    color: '#ffe9bc', emissive: '#ffbf6d', emissiveIntensity: 1.5, roughness: 0.35,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.32, 8), iron);
  base.position.y = 0.16;
  group.add(base);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.16, 8), iron);
  collar.position.y = 0.38;
  group.add(collar);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 3.3, 8), iron);
  post.position.y = 2.05;
  group.add(post);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 5, 10), new THREE.MeshStandardMaterial({
    color: '#c8a767', roughness: 0.4, metalness: 0.4,
  }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.55;
  group.add(ring);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.26, 0.52, 6), glass);
  lantern.position.y = 3.86;
  group.add(lantern);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.22, 6), iron);
  cap.position.y = 4.22;
  group.add(cap);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshStandardMaterial({
    color: '#d8b978', roughness: 0.4, metalness: 0.35,
  }));
  finial.position.y = 4.38;
  group.add(finial);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createMetroEntrance() {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#315a4c', roughness: 0.5, metalness: 0.35 });
  const darkGreen = new THREE.MeshStandardMaterial({ color: '#24453b', roughness: 0.55, metalness: 0.3 });
  const stone = new THREE.MeshStandardMaterial({ color: '#c4b89f', roughness: 0.92 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 3.9), stone);
  frame.position.y = 0.09;
  frame.receiveShadow = true;
  group.add(frame);

  const opening = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.04, 3.0),
    new THREE.MeshStandardMaterial({ color: '#121513', roughness: 1 }),
  );
  opening.position.y = 0.19;
  group.add(opening);

  const stepMats = [
    new THREE.MeshStandardMaterial({ color: '#5c564c', roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: '#4a463e', roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: '#39362f', roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: '#26251f', roughness: 1 }),
  ];
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.02, 0.28), stepMats[Math.min(3, Math.floor(i / 1.3))]);
    step.position.set(0, 0.21, 1.05 - i * 0.46);
    group.add(step);
  }

  const postGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.0, 7);
  const posts = [];
  for (const x of [-1.22, 1.22]) {
    for (const z of [-1.6, -0.55, 0.55, 1.6]) {
      const post = new THREE.Mesh(postGeo, green);
      post.position.set(x, 0.66, z);
      post.castShadow = true;
      group.add(post);
      posts.push(post);
    }
  }
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 3.3, 7), darkGreen);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(s * 1.22, 1.18, 0);
    group.add(rail);
    const low = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 3.3, 6), darkGreen);
    low.rotation.x = Math.PI / 2;
    low.position.set(s * 1.22, 0.66, 0);
    group.add(low);
  }
  const backRail = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.44, 7), darkGreen);
  backRail.rotation.z = Math.PI / 2;
  backRail.position.set(0, 1.18, -1.6);
  group.add(backRail);

  for (const s of [-1, 1]) {
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 2.75, 7), green);
    lampPost.position.set(s * 1.34, 1.38, 1.62);
    group.add(lampPost);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 10, 8),
      new THREE.MeshStandardMaterial({
        color: '#ffedc2', emissive: '#ffc06c', emissiveIntensity: 1.9, roughness: 0.3,
      }),
    );
    orb.position.set(s * 1.34, 2.82, 1.62);
    group.add(orb);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 8), darkGreen);
    hood.position.set(s * 1.34, 2.98, 1.62);
    group.add(hood);
  }

  const signTex = signTexture('MÉTRO', {
    sub: 'LIGNE 6 · BIR-HAKEIM', bg: '#203a31', fg: '#f4dc9d',
    border: '#c9a565', size: 62, w: 512, h: 180, tape: false,
  });
  for (const s of [1, -1]) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.72),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }),
    );
    sign.position.set(0, 2.35, s * 1.68);
    if (s < 0) sign.rotation.y = Math.PI;
    group.add(sign);
  }
  const signBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.1), green);
  signBar.position.set(0, 2.75, 1.68);
  group.add(signBar);

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

function createWallaceFountain() {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#2f584b', roughness: 0.46, metalness: 0.42 });
  const dark = new THREE.MeshStandardMaterial({ color: '#234439', roughness: 0.5, metalness: 0.35 });
  const water = new THREE.MeshStandardMaterial({
    color: '#8ec7c0', roughness: 0.08, metalness: 0.15,
    transparent: true, opacity: 0.9, emissive: '#5e9b91', emissiveIntensity: 0.15,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.3, 8), dark);
  base.position.y = 0.15;
  group.add(base);
  const step = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.94, 0.16, 8), green);
  step.position.y = 0.38;
  group.add(step);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, 1.5, 8), green);
  pedestal.position.y = 1.18;
  group.add(pedestal);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const figure = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.35, 7), green);
    figure.position.set(Math.cos(a) * 0.52, 2.1, Math.sin(a) * 0.52);
    figure.rotation.z = Math.cos(a) * 0.16;
    figure.rotation.x = -Math.sin(a) * 0.16;
    group.add(figure);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.1, 10), green);
    bowl.position.set(Math.cos(a) * 0.82, 1.32, Math.sin(a) * 0.82);
    group.add(bowl);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.26, 12), water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(Math.cos(a) * 0.82, 1.38, Math.sin(a) * 0.82);
    group.add(pool);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 4), water);
    stream.position.set(Math.cos(a) * 0.66, 1.75, Math.sin(a) * 0.66);
    group.add(stream);
  }

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 14, 10, 0, TAU, 0, Math.PI / 2),
    green,
  );
  dome.position.y = 2.72;
  group.add(dome);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.34, 7), dark);
  crown.position.y = 3.28;
  group.add(crown);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), green);
  finial.position.y = 3.52;
  group.add(finial);

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

function createEasel() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#9a774d', roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#6e5435', roughness: 0.9 });

  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 1.6, 5), wood);
    leg.position.set(s * 0.36, 0.8, 0.08);
    leg.rotation.z = s * 0.16;
    group.add(leg);
  }
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 1.5, 5), wood);
  back.position.set(0, 0.74, -0.36);
  back.rotation.x = -0.28;
  group.add(back);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.17), dark);
  shelf.position.set(0, 0.94, 0.19);
  group.add(shelf);

  const { c, ctx } = canvas2d(256, 208);
  const sky = ctx.createLinearGradient(0, 0, 0, 208);
  sky.addColorStop(0, '#f8dec0');
  sky.addColorStop(0.5, '#f4bda7');
  sky.addColorStop(1, '#b7c7b4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 208);
  ctx.fillStyle = 'rgba(255,246,214,.9)';
  ctx.beginPath();
  ctx.arc(196, 54, 21, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#93a9a5';
  ctx.fillRect(0, 148, 256, 60);
  ctx.strokeStyle = 'rgba(255,250,232,.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(8, 158 + i * 9);
    ctx.lineTo(82 + i * 28, 158 + i * 9);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5b493a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(98, 190);
  ctx.bezierCurveTo(108, 120, 116, 72, 128, 42);
  ctx.bezierCurveTo(140, 72, 148, 120, 158, 190);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (const [y, w] of [[158, 25], [124, 18], [92, 11]]) {
    ctx.beginPath();
    ctx.moveTo(128 - w, y);
    ctx.lineTo(128 + w, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#7f9a6c';
  for (const [x, y, r] of [[26, 168, 20], [52, 176, 15], [228, 170, 18]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  const tex = canvasTexture(c);
  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.7),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }),
  );
  painting.position.set(0, 1.3, 0.17);
  painting.rotation.x = -0.1;
  group.add(painting);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.26), dark);
  box.position.set(0.62, 0.1, 0.42);
  group.add(box);
  const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 4), wood);
  brush.rotation.z = 0.9;
  brush.position.set(0.64, 0.22, 0.42);
  group.add(brush);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createVintageCar() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#8fb0a1', roughness: 0.45, metalness: 0.18 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#d7dfd4', roughness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2f3733', roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c9c4b3', roughness: 0.3, metalness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: '#405a5b', roughness: 0.18, metalness: 0.25 });

  const chassis = new THREE.Mesh(new RoundedBoxGeometry(1.56, 0.5, 3.05, 3, 0.16), bodyMat);
  chassis.position.y = 0.56;
  chassis.castShadow = true;
  group.add(chassis);
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.5, 1.62, 3, 0.16), roofMat);
  cabin.position.set(0, 1.01, -0.22);
  cabin.castShadow = true;
  group.add(cabin);
  for (const s of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 1.1), glass);
    win.position.set(s * 0.7, 1.07, -0.22);
    group.add(win);
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.86), bodyMat);
    fender.position.set(s * 0.78, 0.62, 0.92);
    group.add(fender);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshStandardMaterial({ color: '#fff4d3', emissive: '#ffd27a', emissiveIntensity: 0.4, roughness: 0.3 }),
    );
    head.position.set(s * 0.52, 0.66, 1.5);
    head.scale.z = 0.6;
    group.add(head);
  }
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.34, 0.03), glass);
  windshield.position.set(0, 1.1, 0.6);
  windshield.rotation.x = -0.22;
  group.add(windshield);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.3, 0.03), glass);
  rear.position.set(0, 1.08, -1.04);
  rear.rotation.x = 0.2;
  group.add(rear);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.09, 0.1), chrome);
  bumper.position.set(0, 0.43, 1.56);
  group.add(bumper);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.8 }));
  plate.position.set(0, 0.56, 1.57);
  group.add(plate);

  const wheelGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.17, 14);
  for (const sx of [-1, 1]) {
    for (const z of [-0.94, 0.94]) {
      const wheel = new THREE.Mesh(wheelGeo, dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 0.76, 0.3, z);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.19, 8), chrome);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(sx * 0.76, 0.3, z);
      group.add(hub);
    }
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

function createMorrisColumn() {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#2f584b', roughness: 0.5, metalness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: '#234439', roughness: 0.55, metalness: 0.3 });

  const { c, ctx } = canvas2d(512, 512);
  ctx.fillStyle = '#e9d7b2';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#35594c';
  ctx.fillRect(18, 18, 476, 476);
  ctx.fillStyle = '#f2e2bd';
  ctx.fillRect(44, 44, 424, 424);
  ctx.fillStyle = '#b45d4b';
  ctx.textAlign = 'center';
  ctx.font = '700 92px Georgia, serif';
  ctx.fillText('PARIS', 256, 168);
  ctx.fillStyle = '#4a473d';
  ctx.font = '600 30px Georgia, serif';
  ctx.fillText('EXPOSITION UNIVERSELLE', 256, 226);
  ctx.strokeStyle = '#6d5d49';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(232, 436);
  ctx.bezierCurveTo(242, 340, 248, 300, 256, 262);
  ctx.bezierCurveTo(264, 300, 270, 340, 280, 436);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (const [y, w] of [[390, 22], [345, 15], [305, 9]]) {
    ctx.beginPath();
    ctx.moveTo(256 - w, y);
    ctx.lineTo(256 + w, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#67624f';
  ctx.font = '500 24px Georgia, serif';
  ctx.fillText('1900 · GRAND PALAIS', 256, 474);
  const poster = canvasTexture(c);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.24, 18), dark);
  base.position.y = 0.12;
  group.add(base);
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 2.35, 20, 1, true),
    new THREE.MeshStandardMaterial({ map: poster, roughness: 0.72 }),
  );
  column.position.y = 1.42;
  group.add(column);
  const rimBottom = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.055, 6, 20), green);
  rimBottom.rotation.x = Math.PI / 2;
  rimBottom.position.y = 0.3;
  group.add(rimBottom);
  const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.055, 6, 20), green);
  rimTop.rotation.x = Math.PI / 2;
  rimTop.position.y = 2.56;
  group.add(rimTop);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 9, 0, TAU, 0, Math.PI / 2),
    green,
  );
  dome.position.y = 2.62;
  group.add(dome);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 8), dark);
  crown.position.y = 3.28;
  group.add(crown);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), green);
  ball.position.y = 3.53;
  group.add(ball);

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

/* ------------------------------------------------------------------ */
/*  city                                                               */
/* ------------------------------------------------------------------ */
export function createFrance(scene) {
  const root = new THREE.Group();
  root.name = 'city-france';
  scene.add(root);
  const env = createEnvironment(scene, THEMES.france, {
    radius: 55, shadowRadius: 68, shadowCenter: [0, 0, -6], shadowFar: 280,
  });

  const grass = grassTexture(31, [128, 154, 103], [158, 178, 126]);
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(13, 13);
  const island = createIsland(THEMES.france, {
    radius: 55, seed: 23, groundTexture: grass, groundColor: '#f3ecd2',
    cliffColor: '#c3ac8f', sandColor: '#e6d2af',
    groundHoles: [{ x0: -48.5, x1: 48.5, z0: -17.3, z1: -7.7 }],
  });
  root.add(island.group);

  const cobble = pavingTexture('cobble', 14);
  const gravel = pavingTexture('gravel', 9);
  const slab = pavingTexture('slab', 18);

  /* ---------------- the Seine ---------------- */
  const seine = createSeine({
    southZ: -7.7, northZ: -17.3, xMin: -48.5, xMax: 48.5,
    bridgeX: 0, bridgeWidth: 6.4, theme: THEMES.france,
  });
  root.add(seine.group);

  /* ---------------- paving ---------------- */
  addGroundPatch(root, {
    x: 1, z: -4.2, width: 70, depth: 5.4,
    texture: slab, color: '#eee6d5', y: 0.02,
  });
  addGroundPatch(root, {
    x: 0, z: -19.4, width: 58, depth: 4.0,
    texture: slab, color: '#e8dfcc', y: 0.022,
  });
  addGroundPatch(root, {
    x: 0, z: -28.5, width: 26, depth: 21,
    texture: gravel, color: '#f4ead6', y: 0.03,
  });
  addGroundPatch(root, {
    x: 0, z: 40.8, width: 52, depth: 4.8,
    texture: slab, color: '#e3d9c5', y: 0.022,
  });
  addGroundPatch(root, {
    x: 38.1, z: 7.4, width: 4.8, depth: 27.6,
    texture: slab, color: '#e0d6c1', y: 0.022,
  });
  addGroundPatch(root, {
    x: 0, z: -41.0, width: 34, depth: 4.2,
    texture: slab, color: '#e4dac6', y: 0.022,
  });

  addPath(root, {
    points: [[0, 38], [0.4, 31], [0.6, 24], [1.4, 18], [1.2, 12], [0.4, 6], [0, 0], [0, -6.7]],
    width: 4.6, texture: cobble, repeat: 10,
  });
  addPath(root, {
    points: [[1.4, 16], [-4, 13], [-9, 10], [-14, 7.5], [-18, 6.2]],
    width: 2.8, texture: gravel, repeat: 6,
  });
  addPath(root, {
    points: [[1.2, 20], [5.5, 20.5], [9.5, 21], [13.4, 21.6]],
    width: 2.6, texture: gravel, repeat: 4,
  });
  addPath(root, {
    points: [[1, 8], [6, 6.4], [11, 5], [16, 4.4], [21, 4.1], [26, 4]],
    width: 3.2, texture: gravel, repeat: 6,
  });
  addPath(root, {
    points: [[1.1, 11], [4.6, 10], [7.6, 9.4]],
    width: 2.2, texture: gravel, repeat: 3,
  });
  addPath(root, {
    points: [[26, 4], [26, 11], [26, 19], [26, 27], [26, 34], [26, 37.5]],
    width: 8.6, texture: slab, repeat: 10, color: '#f5eddd',
  });

  addCirclePatch(root, { x: 26, z: 4, radius: 7.6, y: 0.045, texture: cobble, ringColor: '#b2a084' });
  addCirclePatch(root, { x: -19, z: 4.5, radius: 6.3, y: 0.042, texture: gravel, ringColor: '#b6a487' });
  addCirclePatch(root, { x: 0, z: -30, radius: 8.2, y: 0.048, texture: cobble, ringColor: '#b6a68c' });
  addCirclePatch(root, { x: 26, z: 37.6, radius: 5.8, y: 0.045, texture: slab, ringColor: '#b6a487' });
  addCirclePatch(root, { x: -5.5, z: 17, radius: 4.4, y: 0.04, texture: gravel, ringColor: '#b6a487' });

  /* ---------------- landmarks ---------------- */
  const eiffel = createEiffel();
  const placed = placeLandmark(root, eiffel, 0, -30);

  const arc = createArc();
  const arcPlaced = placeLandmark(root, arc, 26, 4);

  /* ---------------- Haussmann streets ---------------- */
  const southRow = createBuildingRow({
    x: 0, z: 47, yaw: Math.PI, length: 38,
    styles: ['haussmann'], minWidth: 9, maxWidth: 11.5,
    depth: [7, 8], floors: [5, 6], floorHeight: 3.1, seed: 41, gap: 0.4,
    shops: true, shopNames: ['LIBRAIRIE', 'BOULANGERIE', 'FLEURISTE', 'PÂTISSERIE'],
    balconies: true, mansard: true, fireEscapes: false, stoopEvery: 99,
  });
  root.add(southRow);

  const eastRow = createBuildingRow({
    x: 44.5, z: 7.4, yaw: -Math.PI / 2, length: 27.6,
    styles: ['haussmann'], minWidth: 9, maxWidth: 12,
    depth: [7, 8], floors: [5, 6], floorHeight: 3.1, seed: 53, gap: 0.45,
    shops: true, shopNames: ['CAFÉ DES ARTS', 'PARFUMERIE', 'GALERIE'],
    balconies: true, mansard: true, fireEscapes: false, stoopEvery: 99,
  });
  root.add(eastRow);

  const northRow = createBuildingRow({
    x: 0, z: -46.5, yaw: 0, length: 28,
    styles: ['haussmann'], minWidth: 8.5, maxWidth: 10.5,
    depth: [7, 8], floors: [4, 5], floorHeight: 3.1, seed: 67, gap: 0.4,
    shops: false, balconies: true, mansard: true, fireEscapes: false, stoopEvery: 99,
  });
  root.add(northRow);

  const cameraBlockers = [];
  function addCameraBlocker(x, z, w, d, height = 26) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, height, d),
      new THREE.MeshBasicMaterial({ color: 0xff5060 }),
    );
    mesh.position.set(x, height / 2, z);
    mesh.visible = false;
    root.add(mesh);
    cameraBlockers.push(mesh);
  }
  addCameraBlocker(0, 42.7, 39, 0.5);
  addCameraBlocker(40.3, 7.4, 0.5, 28.4);
  addCameraBlocker(0, -42.3, 29, 0.5);

  /* ---------------- carousel & café ---------------- */
  const carousel = createCarousel();
  carousel.group.position.set(-19, 0, 4.5);
  root.add(carousel.group);

  const fountain = createFountain({ radius: 3, seed: 4 });
  fountain.group.position.set(-5.5, 0, 17);
  root.add(fountain.group);

  const cafe = createCafeSet({ umbrellaColor: '#d77868' });
  cafe.position.set(14.5, 0, 22);
  cafe.rotation.y = -0.5;
  root.add(cafe);

  const cafeStand = new THREE.Group();
  const standBase = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.4, 1.6),
    new THREE.MeshStandardMaterial({ color: '#e8d6b3', roughness: 0.85 }),
  );
  standBase.position.y = 1.2;
  standBase.castShadow = true;
  standBase.receiveShadow = true;
  cafeStand.add(standBase);
  const standRoof = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.18, 1.95), new THREE.MeshStandardMaterial({ color: '#8b6d52', roughness: 0.8 }));
  standRoof.position.y = 2.45;
  cafeStand.add(standRoof);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.55, 6), new THREE.MeshStandardMaterial({ color: '#6f5640' }));
    post.position.set(s * 1.55, 1.25, 0.82);
    cafeStand.add(post);
  }
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#f6e5bb', emissive: '#ffcc85', emissiveIntensity: 0.4, roughness: 0.3,
  });
  const shopWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), windowMat);
  shopWindow.position.set(0, 1.55, 0.81);
  cafeStand.add(shopWindow);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.42), new THREE.MeshStandardMaterial({ color: '#a77e52' }));
  counter.position.set(0, 1.02, 0.98);
  cafeStand.add(counter);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.22, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#c5a06d', side: THREE.DoubleSide }));
  basket.position.set(0.7, 1.2, 1.0);
  cafeStand.add(basket);
  for (let i = 0; i < 3; i++) {
    const baguette = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 6), new THREE.MeshStandardMaterial({ color: '#d9a75e' }));
    baguette.rotation.z = 0.3 + i * 0.12;
    baguette.position.set(0.7 + (i - 1) * 0.035, 1.33, 1.0);
    cafeStand.add(baguette);
  }
  cafeStand.position.set(14.5, 0, 25);
  root.add(cafeStand);

  const boulangerie = createSign('CAFÉ  D\'ODETTE', 'pain · café · rêves', { width: 2.6, height: 0.86, postH: 2.7 });
  boulangerie.position.set(14.5, 0, 26.8);
  boulangerie.rotation.y = 0.08;
  root.add(boulangerie);

  const bicycle = createBicycle('#5f8f89');
  bicycle.position.set(18.4, 0, 20.2);
  bicycle.rotation.y = -1.1;
  root.add(bicycle);

  /* ---------------- street life ---------------- */
  const metro = createMetroEntrance();
  metro.position.set(9, 0, 8);
  root.add(metro);

  const wallace = createWallaceFountain();
  wallace.position.set(-25.5, 0, 7.5);
  root.add(wallace);

  const easel = createEasel();
  easel.position.set(-7.9, 0, 11.3);
  easel.rotation.y = 0.34;
  root.add(easel);

  const car = createVintageCar();
  car.position.set(33.9, 0, 14.8);
  car.rotation.y = 0.06;
  root.add(car);

  const morris = createMorrisColumn();
  morris.position.set(17.2, 0, 7.6);
  root.add(morris);

  const avenueLampA = createStreetLamp();
  avenueLampA.position.set(18.0, 0, 21.5);
  root.add(avenueLampA);
  const avenueLampB = createStreetLamp();
  avenueLampB.position.set(34.0, 0, 21.5);
  root.add(avenueLampB);

  const riverSign = createSign('PONT DES ARTS', 'pont · 1804', { width: 2.4, height: 0.7, postH: 2.0, style: 'post' });
  riverSign.position.set(5.4, 0, -5.2);
  riverSign.rotation.y = -0.08;
  root.add(riverSign);

  const champsSign = createSign('CHAMPS-ÉLYSÉES', 'avenue · 1670', { width: 2.7, height: 0.82, postH: 2.2, style: 'post' });
  champsSign.position.set(34.3, 0, 8.2);
  champsSign.rotation.y = 0.36;
  root.add(champsSign);

  const welcome = createSign('PARIS', '巴黎 · 光之城', { width: 2.8, height: 1.0, postH: 2.1, style: 'post' });
  welcome.position.set(-5.0, 0, 27.5);
  welcome.rotation.y = 0.25;
  root.add(welcome);

  const overlook = createBalustrade(13);
  overlook.position.set(26, 0, 40.4);
  root.add(overlook);

  /* ---------------- greenery ---------------- */
  const treeColliders = [];
  function plantTree(x, z, {
    height = 3.5, canopy = 2.2, blossom = false, seed = 1, scale = 1,
  } = {}) {
    const tree = createTree({
      height, canopy, seed, blossom,
      colors: blossom
        ? ['#e8b8c2', '#f2cbd2', '#dca6b3']
        : ['#7c9c5f', '#8cab6c', '#6f8f55'],
    });
    tree.position.set(x, 0, z);
    tree.rotation.y = seed * 1.7;
    tree.scale.setScalar(scale);
    root.add(tree);
    treeColliders.push({ type: 'circle', x, z, r: 0.2 * scale + 0.08 });
  }

  plantTree(-28, 20, { height: 4.2, canopy: 2.5, seed: 11, scale: 1.12 });
  plantTree(-33.5, 12, { height: 3.8, canopy: 2.3, seed: 12 });
  plantTree(-32, 2, { height: 3.4, canopy: 2.0, seed: 13, scale: 0.96 });
  plantTree(-22.5, 15.5, { height: 3.4, canopy: 2.0, seed: 14, blossom: true, scale: 0.94 });
  plantTree(-15, 18.5, { height: 3.6, canopy: 2.2, seed: 15 });
  plantTree(-12, 33.5, { height: 3.6, canopy: 2.2, seed: 16 });
  plantTree(7, 33.5, { height: 3.8, canopy: 2.3, seed: 17, scale: 1.04 });
  plantTree(14, 29.0, { height: 3.5, canopy: 2.0, seed: 18, blossom: true, scale: 0.95 });
  plantTree(-14, 39.0, { height: 3.9, canopy: 2.4, seed: 19, scale: 1.05 });
  plantTree(14, 38.2, { height: 4.0, canopy: 2.4, seed: 20, scale: 1.08 });
  plantTree(19.2, 37.0, { height: 3.4, canopy: 2.0, seed: 21, scale: 0.95 });
  plantTree(32.8, 37.2, { height: 3.5, canopy: 2.1, seed: 22, scale: 0.98 });

  for (const z of [11.5, 18, 24.5, 31]) {
    plantTree(20.3, z, { height: 3.7, canopy: 2.1, seed: 30 + Math.round(z), scale: 0.98 });
    plantTree(31.7, z, { height: 3.7, canopy: 2.1, seed: 40 + Math.round(z), scale: 0.98 });
  }
  for (const z of [-4, 5, 14]) {
    plantTree(36.9, z, { height: 3.3, canopy: 1.9, seed: 50 + Math.round(z), scale: 0.92 });
  }
  plantTree(46.0, -19.4, { height: 3.6, canopy: 2.1, seed: 71, scale: 1.0 });
  plantTree(46.2, -5.9, { height: 3.5, canopy: 2.0, seed: 72, scale: 0.96 });
  plantTree(-16, -22, { height: 4.0, canopy: 2.3, seed: 61, scale: 1.02 });
  plantTree(16, -22, { height: 4.0, canopy: 2.3, seed: 62, scale: 1.02 });
  plantTree(-15, -34, { height: 3.6, canopy: 2.1, seed: 63, scale: 0.98 });
  plantTree(15, -34, { height: 3.6, canopy: 2.1, seed: 64, scale: 0.98 });
  plantTree(0, -39.6, { height: 3.9, canopy: 2.3, seed: 65, scale: 1.02 });
  plantTree(-23, -28, { height: 3.4, canopy: 2.0, seed: 66, scale: 0.94 });
  plantTree(23, -28, { height: 3.4, canopy: 2.0, seed: 67, scale: 0.94 });

  const hedgeColliders = [];
  [
    [-29, -2.2, 5.2, 0.95], [-31, 2.6, 4.2, 0.82], [-23, -1.5, 5.0, 0.86],
    [-26, 12.5, 4.5, 0.78], [-17, 13.8, 3.6, 0.72],
  ].forEach(([x, z, len, h]) => {
    const hedge = createHedge(len, h);
    hedge.position.set(x, 0, z);
    root.add(hedge);
    hedgeColliders.push({ type: 'box', x, z, w: len, d: 0.9 });
  });

  [
    [-24, 12, 1.8, 0], [-14, 7.5, 1.5, 1], [-2.8, 20.5, 1.5, 0],
    [20, 17, 1.7, 1], [-11, 26, 1.5, 0], [30.5, 28.5, 1.6, 1],
  ].forEach(([x, z, r, variant]) => {
    const bed = createFlowerBed(r, variant
      ? ['#e8a3ad', '#f4d0d6', '#b79ac8', '#f6ead1']
      : ['#e9705b', '#f0b64b', '#f7d6df', '#8fa9d8']);
    bed.position.set(x, 0, z);
    root.add(bed);
  });

  /* ---------------- furniture ---------------- */
  [[-8, 24], [5, 12], [22.6, 8.6], [-27, 14.5]].forEach(([x, z]) => {
    const lamp = createLamp('paris', { lit: true });
    lamp.position.set(x, 0, z);
    root.add(lamp);
  });

  const bench1 = createBench('#84603f');
  bench1.position.set(-1.5, 0, 23.2);
  bench1.rotation.y = Math.PI;
  root.add(bench1);
  const bench2 = createBench('#8f6a47');
  bench2.position.set(-13, 0, -3.4);
  bench2.rotation.y = Math.PI;
  root.add(bench2);
  const bench3 = createBench('#7f5c3d');
  bench3.position.set(12.6, 0, -6.0);
  bench3.rotation.y = Math.PI;
  root.add(bench3);
  const bench4 = createBench('#87643f');
  bench4.position.set(13.5, 0, -20.8);
  bench4.rotation.y = -2.2;
  root.add(bench4);
  const bench5 = createBench('#82603e');
  bench5.position.set(26, 0, 39.6);
  root.add(bench5);

  const lanternString = createStringLanterns(
    [[9, 3.3, 23.5], [14, 3.7, 19.5], [20, 3.3, 16.5]],
    { count: 9, color: '#ffb98b' },
  );
  root.add(lanternString.group);

  const pigeons = createPigeons(6, 9);
  pigeons.group.position.set(-4, 0, 10);
  root.add(pigeons.group);
  const birds = createBirds(5, '#fff6ec', 26, 60);
  root.add(birds.group);

  const flagTex = flagTexture('france');
  const flags = [
    addFlag(root, flagTex, -11, -20.2, { height: 7.5, scale: 1.35, yaw: 0.2 }),
    addFlag(root, flagTex, 11, -20.2, { height: 7.5, scale: 1.35, yaw: -0.3 }),
  ];

  const balloon = createSkyBalloon();
  balloon.position.set(-56, 34, -88);
  root.add(balloon);

  const petals = createPetals({
    count: 44, radius: 42, colors: [0xf7d3dc, 0xfbe5e9, 0xe9b8c6],
    size: 0.16, height: [3, 14],
  });
  root.add(petals.group);

  /* ---------------- people ---------------- */
  const odette = createNPC({
    id: 'odette', name: 'Odette', nameSub: '街头画家', marker: 'quest', questId: 'odette-brush',
    scale: 0.98, style: 'dress', skin: '#f1c5a6', hairColor: '#6a4230', hairStyle: 'bob',
    cloth: '#a98ab6', cloth2: '#f3e7d0', accent: '#d8726a', hat: 'beret', hatColor: '#c96d63',
    accessory: 'palette', pos: [-9.5, 0, 13.5], yaw: 0.6,
    dialogues: {
      new: [
        'Bonjour！你来得正好。塞纳河上的风把我的画笔吹跑啦，我正画到埃菲尔铁塔最漂亮的那一笔呢。',
        '它应该落在旋转木马旁边的花园里，笔尖上还沾着一点晚霞的颜色。',
      ],
      active: [
        '沿着河边的石栏往西走，旋转木马就在花园里。我的画架还支在这儿，可没有画笔，只能看着铁塔发呆。',
      ],
      ready: [
        '啊，我的画笔！谢谢你这双会看见美的小眼睛。',
        '这颗星火送给你。每次我画出最喜欢的一笔，它就会亮一下。',
      ],
      done: [
        '要不要也画一张？你站在塞纳河边、铁塔亮起来之前的样子，一定很好看。',
      ],
    },
  });
  odette.root.position.set(-9.5, 0, 13.5);
  root.add(odette.root);

  const pierre = createNPC({
    id: 'pierre', name: 'Pierre', nameSub: '咖啡馆老板', marker: 'quest', questId: 'pierre-star',
    scale: 1.04, style: 'coat', skin: '#dda987', hairColor: '#4c3526', hairStyle: 'short',
    cloth: '#7e6a54', cloth2: '#f2e7d2', accent: '#5f8f89', accessory: 'baguette',
    pos: [10.8, 0, 19.8], yaw: -0.7,
    dialogues: {
      new: [
        '欢迎光临！噢 là là，我挂在店门口的星星招牌被风吹走了。',
        '它大概滚到东边凯旋门附近的香榭丽舍大道上了。没有招牌，客人会以为这里只是一家普通的面包店。',
      ],
      active: [
        '顺着大道往东走，穿过石拱门找找看。星星招牌金灿灿的，风一吹还会轻轻响。',
      ],
      ready: [
        '我的星星回来啦！今晚的可可给你多加一颗棉花糖。',
        '这颗星火给你。咖啡馆的第一盏灯，就是用它的光点亮的。',
      ],
      done: [
        '坐一会儿吧。面包正在烤，风里马上就会有黄油的味道了。',
      ],
    },
  });
  pierre.root.position.set(10.8, 0, 19.8);
  root.add(pierre.root);

  const lucie = createNPC({
    id: 'lucie', name: 'Lucie', nameSub: '爱笑的小女孩', marker: 'hint',
    scale: 0.82, style: 'dress', skin: '#f4cfae', hairColor: '#7a4a2e', hairStyle: 'ponytail',
    cloth: '#e8a3ad', cloth2: '#f8ead5', accent: '#e9705b', accessory: 'scarf',
    pos: [-13.5, 0, 2.2], yaw: 0.8,
    dialogues: {
      hint: [
        '你也在找发光的小星星吗？我刚才跑过石桥的时候，看见河边的长椅上闪了一下。',
        '妈妈说，巴黎最亮的地方不是铁塔，是大家愿意停下来帮忙的时候。',
        '集齐五颗星火，就去铁塔前的光之门按 E 吧。我们要一起看它亮起来！',
      ],
    },
  });
  lucie.root.position.set(-13.5, 0, 2.2);
  root.add(lucie.root);

  const npcs = [odette, pierre, lucie];

  const quests = [
    {
      id: 'odette-brush', npcId: 'odette',
      title: '被风吹走的画笔', short: 'Odette 的画笔落在旋转木马旁的花园里，笔尖沾着晚霞的颜色。',
      item: { kind: 'brush', label: '沾着晚霞的画笔', x: -28.2, y: 0.72, z: 10.5 },
      reward: '星火 · 晚霞下的第一笔',
    },
    {
      id: 'pierre-star', npcId: 'pierre',
      title: '咖啡馆的星星招牌', short: 'Pierre 的星星招牌被风带到了凯旋门附近的香榭丽舍大道上。',
      item: { kind: 'star', label: '金灿灿的星星招牌', x: 23.4, y: 0.9, z: 9.5 },
      reward: '星火 · 第一盏咖啡馆的灯',
    },
  ];
  const questItems = quests.map((q) => {
    const item = createQuestItem({
      id: q.id, kind: q.item.kind, x: q.item.x, y: q.item.y, z: q.item.z, label: q.item.label,
    });
    root.add(item.group);
    return item;
  });

  const sparkDefs = [
    { id: 'france-garden', x: -27.5, y: 1.35, z: -3.2, label: '树篱花园的星火' },
    { id: 'france-arc', x: 26, y: 1.15, z: 1.2, label: '凯旋门后的星火' },
    { id: 'france-bench', x: 12.6, y: 1.3, z: -6.0, label: '塞纳河长椅边的星火' },
  ];
  const sparks = sparkDefs.map((s) => {
    const spark = createSpark(s);
    root.add(spark.group);
    return spark;
  });

  const walkables = [island.ground, ...seine.walkables];
  const colliders = [
    ...placed.colliders,
    ...arcPlaced.colliders,
    ...seine.colliders,
    ...treeColliders,
    ...hedgeColliders,
    { type: 'circle', x: -19, z: 4.5, r: 4.45 },
    { type: 'circle', x: -5.5, z: 17, r: 3.4 },
    { type: 'circle', x: -25.5, z: 7.5, r: 0.92 },
    { type: 'circle', x: 17.2, z: 7.6, r: 0.62 },
    { type: 'circle', x: 18.0, z: 21.5, r: 0.18 },
    { type: 'circle', x: 34.0, z: 21.5, r: 0.18 },
    { type: 'circle', x: -8, z: 24, r: 0.2 },
    { type: 'circle', x: 5, z: 12, r: 0.2 },
    { type: 'circle', x: 22.6, z: 8.6, r: 0.2 },
    { type: 'circle', x: -27, z: 14.5, r: 0.2 },
    { type: 'box', x: 14.5, z: 22, w: 3.0, d: 2.4 },
    { type: 'box', x: 14.5, z: 25, w: 3.7, d: 1.9 },
    { type: 'box', x: 14.5, z: 26.8, w: 2.8, d: 0.4 },
    { type: 'box', x: -1.5, z: 23.2, w: 2.0, d: 0.8 },
    { type: 'box', x: -13, z: -3.4, w: 2.0, d: 0.8 },
    { type: 'box', x: 12.6, z: -6.0, w: 2.0, d: 0.8 },
    { type: 'box', x: 13.5, z: -20.8, w: 2.2, d: 1.4 },
    { type: 'box', x: 26, z: 39.6, w: 2.1, d: 0.9 },
    { type: 'box', x: -7.9, z: 11.3, w: 1.2, d: 0.9 },
    { type: 'box', x: 9, z: 8, w: 3.0, d: 3.9 },
    { type: 'box', x: 33.9, z: 14.8, w: 2.2, d: 3.6 },
    { type: 'box', x: 5.4, z: -5.2, w: 2.5, d: 0.4 },
    { type: 'box', x: 34.3, z: 8.2, w: 2.8, d: 0.4 },
    { type: 'box', x: -5.0, z: 27.5, w: 2.9, d: 0.4 },
    { type: 'box', x: 26, z: 40.4, w: 13, d: 0.5 },
    { type: 'box', x: 0, z: 47.2, w: 38.5, d: 9.4 },
    { type: 'box', x: 44.7, z: 7.4, w: 9.4, d: 28.2 },
    { type: 'box', x: 0, z: -46.7, w: 28.5, d: 9.4 },
  ];

  const facts = [
    {
      key: 'france-arrival', title: '河水把清晨分成两半',
      text: '塞纳河慢慢穿过巴黎。左岸的面包房先亮起灯，右岸的画廊还没开门。人们把刚烤好的法棍夹在胳膊下，走过一座又一座石桥。',
    },
    {
      key: 'france-landmark', title: '铁做的温柔',
      text: '埃菲尔铁塔在 1889 年只是世博会的临时建筑，很多巴黎人曾经嫌它丑。可它留了下来，每到夜里，还会闪起像星雨一样的光。',
    },
    {
      key: 'france-light', title: '勇气是什么',
      text: 'Coco 想：勇气不是一点都不害怕。勇气是心里咚咚跳的时候，还是愿意往前迈出那一小步。',
    },
  ];

  const city = {
    id: 'france',
    country: '法国',
    countryEn: 'FRANCE',
    cityName: '巴黎',
    cityEn: 'PARIS',
    stamp: 'PA',
    locationCn: '光之城 · 巴黎',
    locationEn: 'VILLE LUMIÈRE',
    kicker: 'PARIS · THE LIGHT OF COURAGE',
    intro: '塞纳河把巴黎分成两半，石桥把两半重新连在一起。面包香、旧书摊和手风琴声顺着河风飘上小岛，埃菲尔铁塔在晚霞里像一支等待被点亮的铅笔。',
    theme: THEMES.france,
    group: root,
    env,
    island,
    seine,
    landmark: eiffel,
    secondLandmark: arc,
    anchors: placed.anchors,
    heart: placed.heart,
    cameraBlockers,
    spawn: new THREE.Vector3(0, 0, 32),
    spawnYaw: Math.PI,
    walkables,
    colliders,
    walkRadius: island.walkRadius,
    npcs,
    quests,
    questItems,
    sparks,
    facts,
    carousel,
    pillarPositions: { carousel: new THREE.Vector3(-19, 0, 4.5), arc: new THREE.Vector3(26, 0, 4) },
    postcard: {
      country: 'FRANCE', icon: '✧', city: 'PARIS',
      title: '勇气之塔，闪闪发光',
      text: '塞纳河的风把面包香吹过整座小岛。桥上的灯一盏盏亮起，旋转木马唱起歌，铁塔上的星星一颗一颗醒过来。',
    },
    travel: {
      title: '东京',
      sub: 'TOKYO · 樱花落在电车的窗边',
    },
    cinema: {
      camera: new THREE.Vector3(-20, 8.5, 8),
      look: new THREE.Vector3(0, 16, -30),
      captions: [
        '第一盏灯亮起的时候，塞纳河的水面也轻轻颤了一下。',
        '石桥、旋转木马和整条香榭丽舍大道，一起把光送上了铁塔。',
        'Coco 把巴黎的晚霞，夹进了护照里。',
      ],
    },
    factsState: { landmarkSeen: false },
    setLit(on) {
      eiffel.setLit(on);
      if (on) carousel.celebrate(); else carousel.reset();
    },
    celebrate() {
      eiffel.setLit(true);
      carousel.celebrate();
    },
    update(dt, t, playerPos) {
      env.update(dt);
      eiffel.update(dt, t);
      arc.update(dt, t);
      carousel.update(dt, t);
      fountain.update(dt, t);
      lanternString.update(dt, t);
      pigeons.update(dt, t);
      birds.update(dt, t);
      petals.update(dt, t);
      seine.update(dt, t);
      flags.forEach((f) => f.update(t));
      npcs.forEach((n) => n.update(dt, t, playerPos));
      sparks.forEach((s) => s.update(dt, t));
      questItems.forEach((q) => q.update(dt, t));
      balloon.position.y = 34 + Math.sin(t * 0.18) * 1.6;
      balloon.position.x = -56 + Math.sin(t * 0.05) * 4;
      balloon.rotation.y = t * 0.03;
      if (playerPos && !city.factsState.landmarkSeen && playerPos.z < -10) city.factsState.landmarkSeen = true;
    },
  };
  return city;
}
