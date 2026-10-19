import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  canvas2d, canvasTexture, dotTexture, flagTexture, mulberry32, TAU,
  pavingTexture, signTexture,
} from '../core/utils.js';
import { createFacadeTexture } from './buildings.js';

const WATER_Y = -0.55;
const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...opts });

function woodDeckTexture() {
  const { c, ctx } = canvas2d(256, 256);
  ctx.fillStyle = '#9b7550';
  ctx.fillRect(0, 0, 256, 256);
  const r = mulberry32(19);
  for (let i = 0; i < 10; i++) {
    const y = i * 25.6;
    ctx.fillStyle = i % 2 ? '#a47e57' : '#936c4a';
    ctx.fillRect(0, y + 1, 256, 23.6);
    ctx.strokeStyle = 'rgba(68,46,30,.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = `rgba(74,50,32,${0.08 + r() * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(r() * 256, y + 2 + r() * 20);
      ctx.lineTo(r() * 256, y + 2 + r() * 20);
      ctx.stroke();
    }
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = 'rgba(255,236,204,.14)';
      ctx.fillRect(r() * 256, y + 2, 3 + r() * 10, 20);
    }
  }
  return canvasTexture(c, { repeat: [2, 6] });
}

function ironMat() { return S('#3d4747', { roughness: 0.6, metalness: 0.4 }); }

/* ------------------------------------------------------------------ */
/*  curved stone seawall with railing                                  */
/* ------------------------------------------------------------------ */
export function createSeawall({
  radius = 53.2, a0 = Math.PI * 1.04, a1 = Math.PI * 1.96, segments = 90,
  y = 0.05, rail = true, color = '#a49b89',
} = {}) {
  const group = new THREE.Group();
  const span = a1 - a0;
  const thetaStart = Math.PI / 2 - a1;
  const stone = new THREE.MeshStandardMaterial({
    color, roughness: 0.96, map: pavingTexture('slab', 6),
  });
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius + 0.5, 1.7, segments, 2, true, thetaStart, span),
    stone,
  );
  wall.position.y = y - 0.28;
  wall.receiveShadow = true;
  group.add(wall);
  const coping = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 0.18, segments, 1, true, thetaStart, span),
    S('#c4b9a3', { roughness: 0.9 }),
  );
  coping.position.y = y + 0.6;
  group.add(coping);

  if (rail) {
    const railMat = ironMat();
    const postCount = Math.max(24, Math.round(span * radius / 2.6));
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.07, 1.0, 6), railMat, postCount);
    const m = new THREE.Matrix4();
    for (let i = 0; i < postCount; i++) {
      const a = a0 + span * (i / (postCount - 1));
      const rr = radius - 0.05;
      m.makeTranslation(Math.cos(a) * rr, y + 1.08, Math.sin(a) * rr);
      posts.setMatrixAt(i, m);
    }
    posts.castShadow = true;
    group.add(posts);
    for (const h of [1.28, 1.06]) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const a = a0 + span * (i / 96);
        const rr = radius - 0.05;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, y + h, Math.sin(a) * rr));
      }
      const railCurve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 96, h > 1.2 ? 0.055 : 0.035, 4, false), railMat);
      group.add(tube);
    }
    // bollards along the quay
    for (let i = 0; i < 12; i++) {
      const a = a0 + span * ((i + 0.5) / 12);
      if (Math.abs(a - Math.PI * 1.6) < 0.18) continue;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8), ironMat());
      b.position.set(Math.cos(a) * (radius - 0.55), y + 0.28, Math.sin(a) * (radius - 0.55));
      b.castShadow = true;
      group.add(b);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 5, 0, TAU, 0, Math.PI / 2), ironMat());
      cap.position.set(b.position.x, y + 0.55, b.position.z);
      group.add(cap);
    }
  }
  return group;
}

/* ------------------------------------------------------------------ */
/*  pier                                                               */
/* ------------------------------------------------------------------ */
export function createPier({
  x = 0, z = 0, yaw = 0, width = 4.2, length = 10, height = 0.3,
  railing = true, lamps = true, color = '#9b7550',
} = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;

  const deckMat = new THREE.MeshStandardMaterial({ map: woodDeckTexture(), color, roughness: 0.94 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, length), deckMat);
  deck.position.set(0, height - 0.11, length / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, 0.16, length), S('#6f5035', { roughness: 0.94 }));
  trim.position.set(0, height - 0.24, length / 2);
  group.add(trim);

  const pileMat = S('#5d4631', { roughness: 0.95 });
  for (let i = 0; i <= Math.round(length / 2.8); i++) {
    for (const s of [-1, 1]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.6, 7), pileMat);
      pile.position.set(s * (width / 2 - 0.16), height - 1.2, 0.2 + i * (length - 0.4) / Math.max(1, Math.round(length / 2.8)));
      pile.rotation.z = s * 0.02;
      pile.castShadow = true;
      group.add(pile);
      if (i < Math.round(length / 2.8)) {
        const cross = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.13, 0.14), pileMat);
        cross.position.set(0, -0.35, 0.2 + (i + 0.5) * (length - 0.4) / Math.max(1, Math.round(length / 2.8)));
        group.add(cross);
      }
    }
  }

  if (railing) {
    const railMat = ironMat();
    for (const s of [-1, 1]) {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, length - 1.6), railMat);
      sideRail.position.set(s * (width / 2 - 0.08), height + 0.94, length / 2 + 0.7);
      group.add(sideRail);
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.94, 0.05), railMat);
        post.position.set(s * (width / 2 - 0.08), height + 0.47, 0.75 + i * (length - 1.5) / 4);
        group.add(post);
      }
    }
    // end rail with an opening on the boat side
    const endRail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 0.045, 0.045), railMat);
    endRail.position.set(-width * 0.2, height + 0.94, length - 0.08);
    group.add(endRail);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.94, 0.05), railMat);
      post.position.set(-width * 0.2 + s * width * 0.27, height + 0.47, length - 0.08);
      group.add(post);
    }
  }

  if (lamps) {
    for (const side of [0, 1]) {
      const zz = side ? length - 0.9 : length * 0.34;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.4, 7), ironMat());
      pole.position.set(-width / 2 + 0.28, height + 1.2, zz);
      group.add(pole);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.36, 8), new THREE.MeshStandardMaterial({
        color: '#ffe9ba', emissive: '#ffc36a', emissiveIntensity: 0.55, roughness: 0.4,
      }));
      head.position.set(pole.position.x, height + 2.5, zz);
      group.add(head);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 8), ironMat());
      cap.position.set(pole.position.x, height + 2.74, zz);
      group.add(cap);
    }
  }

  // life ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.085, 6, 16), S('#f4ead8'));
  ring.rotation.y = Math.PI / 2;
  ring.position.set(-width / 2 + 0.12, height + 0.7, length * 0.7);
  group.add(ring);

  const tyreMat = S('#2f3433', { roughness: 0.95 });
  for (const zz of [length * 0.3, length * 0.7]) {
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.09, 6, 12), tyreMat);
    tyre.rotation.y = Math.PI / 2;
    tyre.position.set(width / 2 + 0.04, height - 0.22, zz);
    group.add(tyre);
  }

  group.updateMatrixWorld(true);
  return { group, deck, height, walkable: deck };
}

/* ------------------------------------------------------------------ */
/*  Battery Maritime ferry terminal                                    */
/* ------------------------------------------------------------------ */
export function createFerryTerminal({ x = 0, z = 0, yaw = 0 } = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  const green = new THREE.MeshStandardMaterial({ color: '#506f62', roughness: 0.55, metalness: 0.12 });
  const darkGreen = S('#3d574e', { roughness: 0.55, metalness: 0.15 });
  const cream = S('#e3d8bd', { roughness: 0.8 });
  const stone = S('#b9ab92', { roughness: 0.94 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(11.5, 3.6, 6.4), green);
  base.position.y = 1.8;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 6.9), stone);
  plinth.position.y = 0.4;
  plinth.receiveShadow = true;
  group.add(plinth);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.45, 7), darkGreen);
  roof.position.y = 3.85;
  roof.castShadow = true;
  group.add(roof);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.24, 7.3), cream);
  cornice.position.y = 3.56;
  group.add(cornice);

  // arched bays facing the water (+z)
  for (let i = -1; i <= 1; i++) {
    const arch = new THREE.Group();
    arch.position.set(i * 3.5, 1.9, 3.23);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.5), new THREE.MeshStandardMaterial({
      color: '#27433e', emissive: '#eac47b', emissiveIntensity: 0.16, roughness: 0.25, metalness: 0.1,
    }));
    arch.add(glass);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.16, 18, 1, false, 0, Math.PI), cream);
    top.rotation.set(Math.PI / 2, 0, 0);
    top.position.set(0, 1.34, 0.05);
    arch.add(top);
    for (const s of [-1, 1]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.5, 0.24), cream);
      pil.position.set(s * 1.17, 0, 0.04);
      arch.add(pil);
    }
    group.add(arch);
  }

  const signTex = signTexture('LIBERTY FERRY', {
    sub: '自由岛渡轮 · BATTERY', bg: '#e9ddc2', fg: '#374d44', border: '#8b7a5e', size: 48, tape: false,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.88 }));
  sign.position.set(0, 4.4, 3.28);
  group.add(sign);
  for (const s of [-1, 1]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), ironMat());
    bracket.position.set(s * 1.8, 4.1, 3.2);
    group.add(bracket);
  }

  // clock
  const clockFace = (() => {
    const { c, ctx } = canvas2d(128, 128);
    ctx.fillStyle = '#f4ead2';
    ctx.beginPath(); ctx.arc(64, 64, 60, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e5149'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(64, 64, 57, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46);
      ctx.lineTo(64 + Math.cos(a) * 53, 64 + Math.sin(a) * 53);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64, 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(88, 76); ctx.stroke();
    return canvasTexture(c);
  })();
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), new THREE.MeshStandardMaterial({ map: clockFace, roughness: 0.6 }));
  clock.position.set(0, 5.8, 2.7);
  group.add(clock);
  const clockBack = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), darkGreen);
  clockBack.position.set(0, 5.8, 2.69);
  clockBack.rotation.y = Math.PI;
  group.add(clockBack);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.08, 6, 24), darkGreen);
  clockRim.position.copy(clock.position);
  group.add(clockRim);

  // side and rear bays so the terminal reads as a building from every angle
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#2c4642', roughness: 0.28, metalness: 0.14,
    emissive: '#d8b06a', emissiveIntensity: 0.05,
  });
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.75, 1.18), cream);
      frame.position.set(s * 5.78, 2.1, i * 1.75);
      group.add(frame);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.45), glassMat);
      pane.position.set(s * 5.84, 2.1, i * 1.75);
      pane.rotation.y = s * Math.PI / 2;
      group.add(pane);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 1.35), stone);
      sill.position.set(s * 5.77, 1.26, i * 1.75);
      group.add(sill);
    }
  }
  const backDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.12), cream);
  backDoorFrame.position.set(0, 1.55, -3.24);
  group.add(backDoorFrame);
  const backDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.35, 0.1), darkGreen);
  backDoor.position.set(0, 1.45, -3.31);
  group.add(backDoor);
  for (const s of [-1, 1]) {
    const rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), glassMat);
    rearWin.position.set(s * 3.6, 2.25, -3.24);
    rearWin.rotation.y = Math.PI;
    group.add(rearWin);
    const frameRear = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.55, 0.1), cream);
    frameRear.position.set(s * 3.6, 2.25, -3.235);
    group.add(frameRear);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.14, 0.2), stone);
    sill.position.set(s * 3.6, 1.42, -3.27);
    group.add(sill);
  }
  const backBand = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.16, 6.5), cream);
  backBand.position.y = 3.28;
  group.add(backBand);
  const baseBand = new THREE.Mesh(new THREE.BoxGeometry(11.66, 0.2, 6.56), cream);
  baseBand.position.y = 0.86;
  group.add(baseBand);

  // small canopy toward the pier
  for (const s of [-1, 1]) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.9, 8), darkGreen);
    column.position.set(s * 4.4, 1.45, 4.4);
    column.castShadow = true;
    group.add(column);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.16, 3.0), darkGreen);
  canopy.position.set(0, 2.95, 4.7);
  canopy.rotation.x = 0.08;
  canopy.castShadow = true;
  group.add(canopy);

  group.traverse((o) => { if (o.isMesh) o.castShadow = o.castShadow ?? false; });
  return group;
}

/* ------------------------------------------------------------------ */
/*  ferry boat                                                         */
/* ------------------------------------------------------------------ */
function boatHullGeometry(length, width, height) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, -length / 2 + 0.35);
  s.quadraticCurveTo(-width / 2, -length / 2, -width / 2 + 0.45, -length / 2);
  s.lineTo(width / 2 - 0.45, -length / 2);
  s.quadraticCurveTo(width / 2, -length / 2, width / 2, -length / 2 + 0.35);
  s.lineTo(width / 2, length / 2 - 1.95);
  s.quadraticCurveTo(width * 0.42, length / 2 - 0.45, 0, length / 2);
  s.quadraticCurveTo(-width * 0.42, length / 2 - 0.45, -width / 2, length / 2 - 1.95);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: height, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.08, bevelThickness: 0.08,
  });
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(Math.PI);
  geo.computeVertexNormals();
  return geo;
}

function createFerryBoat() {
  const group = new THREE.Group();
  const length = 10.5, width = 3.7, hullH = 1.35;
  const hullGeo = boatHullGeometry(length, width, hullH);
  const white = new THREE.MeshStandardMaterial({ color: '#f3ede0', roughness: 0.5, metalness: 0.05 });
  const navy = S('#2f5661', { roughness: 0.6 });
  const teal = S('#41786f', { roughness: 0.55, metalness: 0.08 });
  const darkGlass = new THREE.MeshStandardMaterial({
    color: '#2a424c', roughness: 0.22, metalness: 0.32, emissive: '#e6c27a', emissiveIntensity: 0.06,
  });
  const wood = S('#a98760', { roughness: 0.9 });

  const hull = new THREE.Mesh(hullGeo, white);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);
  // anti-fouling red bottom
  const bottom = new THREE.Mesh(hullGeo, S('#933f38', { roughness: 0.75 }));
  bottom.scale.set(0.985, 0.26, 0.985);
  bottom.position.y = -0.01;
  group.add(bottom);
  // navy sheer stripe
  const stripe = new THREE.Mesh(hullGeo, navy);
  stripe.scale.set(1.006, 0.1, 1.006);
  stripe.position.y = hullH * 0.9;
  group.add(stripe);

  const deck = new THREE.Mesh(hullGeo, wood);
  deck.scale.set(0.94, 0.06, 0.94);
  deck.position.y = hullH;
  deck.receiveShadow = true;
  group.add(deck);

  // lower cabin / saloon
  const cabin = new THREE.Group();
  cabin.position.set(0, hullH + 0.02, -1.35);
  group.add(cabin);
  const saloon = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.0, 4.5), white);
  saloon.position.y = 1.0;
  saloon.castShadow = true;
  cabin.add(saloon);
  for (const s of [-1, 1]) {
    const winBand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 3.6), darkGlass);
    winBand.position.set(s * 1.39, 1.28, 0);
    cabin.add(winBand);
    for (let i = 0; i < 4; i++) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), teal);
      mullion.position.set(s * 1.43, 1.28, -1.35 + i * 0.9);
      cabin.add(mullion);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.2), teal);
    rail.position.set(s * 1.4, 0.55, 0);
    cabin.add(rail);
  }
  const frontWin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 0.06), darkGlass);
  frontWin.position.set(0, 1.3, 2.27);
  cabin.add(frontWin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.22, 4.9), teal);
  roof.position.y = 2.1;
  roof.castShadow = true;
  cabin.add(roof);
  const roofRim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 5.05), S('#2f5d56'));
  roofRim.position.y = 2.22;
  cabin.add(roofRim);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.2, 10), teal);
  stack.position.set(1.0, 2.7, -1.15);
  stack.castShadow = true;
  cabin.add(stack);
  const stackTop = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.18, 10), S('#d9cdb4'));
  stackTop.position.set(1.0, 3.32, -1.15);
  cabin.add(stackTop);
  const stackBand = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.18, 10), S('#d9cdb4'));
  stackBand.position.set(1.0, 2.82, -1.15);
  cabin.add(stackBand);

  // upper sun deck
  const upper = new THREE.Group();
  upper.position.set(0, hullH + 2.16, -1.0);
  group.add(upper);
  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 4.2), wood);
  upperDeck.position.y = 0.02;
  upperDeck.receiveShadow = true;
  upper.add(upperDeck);
  const railMat = ironMat();
  for (const s of [-1, 1]) {
    for (const h of [0.85, 0.5]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 4.1), railMat);
      rail.position.set(s * 1.4, h, 0);
      upper.add(rail);
    }
    for (let i = 0; i < 6; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.88, 0.045), railMat);
      post.position.set(s * 1.4, 0.45, -2.0 + i * 0.8);
      upper.add(post);
    }
  }
  const aftRail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.04), railMat);
  aftRail.position.set(0, 0.85, -2.05);
  upper.add(aftRail);
  // benches
  for (const s of [-1, 1]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 2.2), wood);
    bench.position.set(s * 1.0, 0.3, 0.4);
    upper.add(bench);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 2.2), wood);
    back.position.set(s * 1.25, 0.58, 0.4);
    upper.add(back);
  }
  // canopy supports over cabin portion (open front so Coco is visible)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.1, 1.6), new THREE.MeshStandardMaterial({
    color: '#e8dfcb', roughness: 0.8, side: THREE.DoubleSide,
  }));
  canopy.position.set(0, 2.05, -1.1);
  upper.add(canopy);
  for (const s of [-1, 1]) {
    for (const zz of [-1.8, -0.4]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 5), railMat);
      pole.position.set(s * 1.35, 1.05, zz);
      upper.add(pole);
    }
  }

  // bow flag mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 5.4, 8), wood);
  mast.position.set(0, hullH + 2.4, 3.3);
  mast.castShadow = true;
  group.add(mast);
  const mastTop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), S('#d9c8a2'));
  mastTop.position.set(0, hullH + 5.15, 3.3);
  group.add(mastTop);
  const flagTex = flagTexture('usa');
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.68), new THREE.MeshStandardMaterial({
    map: flagTex, side: THREE.DoubleSide, roughness: 0.85,
  }));
  flag.position.set(0.6, hullH + 4.5, 3.3);
  group.add(flag);
  const pennant = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.02, hullH + 5.0, 3.3),
    new THREE.Vector3(1.25, hullH + 4.84, 3.3),
    new THREE.Vector3(0.02, hullH + 4.66, 3.3),
  ]), new THREE.MeshStandardMaterial({ color: '#c9584f', side: THREE.DoubleSide }));
  group.add(pennant);

  // life rings and fenders
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.085, 6, 16), S('#f2e6d2'));
    ring.position.set(s * 1.47, 1.0, -0.2);
    ring.rotation.y = Math.PI / 2;
    cabin.add(ring);
    for (let i = 0; i < 4; i++) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.04), S('#c14f43'));
      const a = (i / 4) * TAU;
      marker.position.set(s * 1.49, 1.0 + Math.sin(a) * 0.3, -0.2 + Math.cos(a) * 0.3);
      cabin.add(marker);
    }
    for (const zz of [-2.7, 2.6]) {
      const fender = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.5, 3, 7), S('#c66452'));
      fender.rotation.z = Math.PI / 2;
      fender.position.set(s * 1.85, hullH * 0.55, zz);
      group.add(fender);
    }
  }

  // name on bow
  const nameTex = (() => {
    const { c, ctx } = canvas2d(512, 128);
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#2f5661';
    ctx.font = '700 66px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIBERTY', 256, 66);
    return canvasTexture(c);
  })();
  const name = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), new THREE.MeshStandardMaterial({
    map: nameTex, transparent: true, roughness: 0.8,
  }));
  name.position.set(0, hullH * 0.72, 4.52);
  group.add(name);

  // navigation lights
  const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshBasicMaterial({ color: '#ffdf9a' }));
  navLight.position.set(0, hullH + 5.25, 3.3);
  group.add(navLight);

  // wake
  const wake = new THREE.Group();
  const wakeTex = dotTexture();
  const puffs = [];
  for (let i = 0; i < 16; i++) {
    const mat = new THREE.SpriteMaterial({
      map: wakeTex, color: '#f6f4e9', transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const s = new THREE.Sprite(mat);
    s.userData = { phase: i / 16, side: i % 2 ? 1 : -1, spread: 0.3 + Math.random() * 0.7 };
    s.scale.setScalar(0.5);
    wake.add(s);
    puffs.push(s);
  }
  const trailMat = new THREE.MeshBasicMaterial({ color: '#f4f1e4', transparent: true, opacity: 0, depthWrite: false });
  for (const s of [-1, 1]) {
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 7), trailMat.clone());
    trail.rotation.x = -Math.PI / 2;
    trail.rotation.z = s * 0.16;
    trail.position.set(s * 1.15, -0.53, -7.6);
    wake.add(trail);
  }
  wake.position.z = -4.6;
  group.add(wake);

  return {
    group, length, width, deckAnchor: new THREE.Vector3(0, hullH + 2.3, -0.35),
    wake, puffs, trail: wake.children.filter((c) => c.isMesh), flag, pennant, name,
  };
}

export function createFerry({
  main = { boat: [28.6, -50], stand: [24, 0.3, -51.4], arrive: [24, 0.3, -49.6], yaw: 0, label: '乘渡轮 · 自由岛' },
  liberty = { boat: [4.6, -64.6], stand: [0, 0.3, -62.4], arrive: [0, 0.3, -61.4], yaw: Math.PI, label: '乘渡轮 · 曼哈顿' },
  duration = 7.2,
} = {}) {
  const group = new THREE.Group();
  const boat = createFerryBoat();
  group.add(boat.group);

  const docks = {
    main: {
      boat: new THREE.Vector3(main.boat[0], 0, main.boat[1]),
      stand: new THREE.Vector3(...main.stand),
      arrive: new THREE.Vector3(...main.arrive),
      yaw: main.yaw,
      label: main.label,
      name: main.name || '曼哈顿 · 炮台公园',
    },
    liberty: {
      boat: new THREE.Vector3(liberty.boat[0], 0, liberty.boat[1]),
      stand: new THREE.Vector3(...liberty.stand),
      arrive: new THREE.Vector3(...liberty.arrive),
      yaw: liberty.yaw,
      label: liberty.label,
      name: liberty.name || '自由岛 · 自由女神像',
    },
  };

  let currentDock = 'main';
  let riding = false;
  let rideT = 0;
  let routeCurve = null;
  let fromKey = 'main';
  let toKey = 'liberty';
  let dockYaw = Math.atan2(
    docks.liberty.boat.x - docks.main.boat.x,
    docks.liberty.boat.z - docks.main.boat.z,
  );
  let speed01 = 0;
  let time = 0;

  boat.group.position.set(docks.main.boat.x, -1.02, docks.main.boat.z);
  boat.group.rotation.y = dockYaw;

  function buildRoute(from, to) {
    const start = docks[from].boat;
    const end = docks[to].boat;
    const mid = start.clone().lerp(end, 0.5);
    const dx = end.x - start.x, dz = end.z - start.z;
    const len = Math.hypot(dx, dz) || 1;
    const open = new THREE.Vector3(dz / len, 0, -dx / len);
    if (from === 'main') mid.addScaledVector(open, 5.5);
    else mid.addScaledVector(open, -5.5);
    return new THREE.CatmullRomCurve3([start.clone(), mid, end.clone()], false, 'catmullrom', 0.3);
  }

  function beginRide(dest) {
    if (riding || dest === currentDock) return false;
    fromKey = currentDock;
    toKey = dest;
    routeCurve = buildRoute(fromKey, toKey);
    rideT = 0;
    riding = true;
    speed01 = 0;
    return true;
  }

  function currentStand() {
    if (riding) return null;
    const d = docks[currentDock];
    return {
      pos: d.stand,
      label: d.label,
      destination: currentDock === 'main' ? 'liberty' : 'main',
      dock: currentDock,
    };
  }

  function arrival(dest) {
    const d = docks[dest];
    return { pos: d.arrive.clone(), yaw: d.yaw, name: d.name };
  }

  function getDeckPoint(target = new THREE.Vector3()) {
    boat.group.updateMatrixWorld(true);
    return boat.deckAnchor.clone().applyMatrix4(boat.group.matrixWorld);
  }

  function update(dt) {
    time += dt;
    const bob = Math.sin(time * 1.15) * 0.045 + Math.sin(time * 0.47) * 0.025;
    boat.group.position.y = -1.02 + bob;
    boat.group.rotation.z = Math.sin(time * 0.83) * 0.008 + Math.sin(time * 1.7) * 0.003;
    boat.group.rotation.x = Math.sin(time * 0.61) * 0.006;
    boat.flag.rotation.y = Math.sin(time * 1.4) * 0.14;
    boat.pennant.rotation.y = Math.sin(time * 1.8 + 1) * 0.18;

    if (riding && routeCurve) {
      rideT += dt;
      const raw = Math.min(1, rideT / duration);
      const ease = raw < 0.16
        ? (raw / 0.16) * (raw / 0.16) * 0.16
        : raw > 0.84
          ? 1 - ((1 - raw) / 0.16) * ((1 - raw) / 0.16) * 0.16
          : raw;
      const u = Math.max(0, Math.min(1, ease));
      const p = routeCurve.getPoint(u);
      boat.group.position.x = p.x;
      boat.group.position.z = p.z;
      const tangent = routeCurve.getTangent(Math.min(0.999, Math.max(0.001, u)));
      const targetYaw = Math.atan2(tangent.x, tangent.z);
      let diff = targetYaw - boat.group.rotation.y;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      boat.group.rotation.y += diff * (1 - Math.exp(-2.2 * dt));
      speed01 = Math.sin(Math.PI * raw) ** 0.65;
      if (raw >= 1) {
        riding = false;
        currentDock = toKey;
        const d = docks[currentDock];
        boat.group.position.x = d.boat.x;
        boat.group.position.z = d.boat.z;
        dockYaw = d.yaw;
        boat.group.rotation.y = dockYaw;
        speed01 = 0;
      }
    } else {
      boat.group.rotation.y += (dockYaw - boat.group.rotation.y) * Math.min(1, dt * 1.6);
      speed01 *= Math.exp(-2.6 * dt);
    }

    // wake animation
    const w = speed01;
    boat.puffs.forEach((s) => {
      const u = (time * (0.3 + w * 0.7) + s.userData.phase) % 1;
      s.position.set(s.userData.side * (0.45 + u * 2.2) * s.userData.spread, -1.12 + Math.sin(u * 4) * 0.08, -u * 5.4);
      s.scale.setScalar(0.4 + u * 1.9);
      s.material.opacity = w * (1 - u) * 0.5;
    });
    boat.trail.forEach((t) => { t.material.opacity = w * 0.28; });
  }

  function dispose() { /* materials are disposed by scene teardown */ }

  return {
    group,
    boat,
    get dock() { return currentDock; },
    get riding() { return riding; },
    get duration() { return duration; },
    get progress() { return rideT / duration; },
    get boatYaw() { return boat.group.rotation.y; },
    beginRide,
    currentStand,
    arrival,
    getDeckPoint,
    update,
    dispose,
  };
}

/* ------------------------------------------------------------------ */
/*  lower Manhattan skyline                                            */
/* ------------------------------------------------------------------ */
export function createManhattanSkyline() {
  const group = new THREE.Group();
  const textures = [];
  for (let i = 0; i < 5; i++) {
    const tex = createFacadeTexture({
      style: i < 3 ? 'office' : 'limestone',
      bays: 4, floors: 10, seed: 90 + i, litChance: 0.3,
      wall: ['#81909a', '#75848f', '#939da2', '#a9a79a', '#8b9297'][i],
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    textures.push(tex);
  }
  const mats = textures.map((tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 }));
  const r = mulberry32(617);
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#8ea8b2', roughness: 0.22, metalness: 0.55,
    map: textures[0], emissive: '#d8b977', emissiveIntensity: 0.03,
  });

  const towers = [];

  function tower(x, z, w, d, h, idx, { crown = false, spire = false } = {}) {
    const mat = mats[idx % mats.length];
    const tex = mat.map.clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, w / 13), Math.max(1.4, h / 31));
    const m = mat.clone();
    m.map = tex;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, h / 2 - 0.1, z);
    group.add(b);
    towers.push(b);
    let top = h;
    if (h > 48) {
      const bw = w * 0.72, bd = d * 0.72, bh = h * 0.16;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m);
      upper.position.set(x, h + bh / 2 - 0.1, z);
      group.add(upper);
      towers.push(upper);
      top = h + bh;
      if (h > 70) {
        const cw = w * 0.48, cd = d * 0.48, ch = h * 0.1;
        const crane = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), m);
        crane.position.set(x, top + ch / 2, z);
        group.add(crane);
        towers.push(crane);
        top += ch;
      }
    }
    if (crown) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.36, h * 0.13, 4), S('#b7a98f', { roughness: 0.7 }));
      cap.rotation.y = Math.PI / 4;
      cap.position.set(x, top + h * 0.065, z);
      group.add(cap);
      top += h * 0.13;
    }
    if (spire) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.75, h * 0.23, 8), S('#9ca8ab', { metalness: 0.5, roughness: 0.4 }));
      sp.position.set(x, top + h * 0.115, z);
      group.add(sp);
      top += h * 0.23;
    }
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3 + r() * 6, 5), S('#6c7477'));
    antenna.position.set(x + (r() - 0.5) * w * 0.2, top + 2.5, z);
    group.add(antenna);
    return top;
  }

  // One World Trade Center
  const wtcBaseH = 34;
  const wtc = new THREE.Mesh(new THREE.BoxGeometry(13.5, wtcBaseH, 13.5), glassMat);
  wtc.position.set(-6, wtcBaseH / 2, 124);
  group.add(wtc);
  const wtcTaper = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 9.4, 60, 4), glassMat);
  wtcTaper.rotation.y = Math.PI / 4;
  wtcTaper.position.set(-6, wtcBaseH + 30, 124);
  group.add(wtcTaper);
  const wtcTop = new THREE.Mesh(new THREE.BoxGeometry(13.7, 2.4, 13.7), S('#a4b0b2', { metalness: 0.3, roughness: 0.5 }));
  wtcTop.position.set(-6, wtcBaseH + 60, 124);
  group.add(wtcTop);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.6, 32, 8), S('#c4cccd', { metalness: 0.6, roughness: 0.35 }));
  spire.position.set(-6, wtcBaseH + 60 + 17, 124);
  group.add(spire);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), new THREE.MeshBasicMaterial({ color: '#e36050' }));
  beacon.position.set(-6, wtcBaseH + 60 + 33.4, 124);
  group.add(beacon);
  towers.push(wtc, wtcTaper);

  const placements = [
    [-34, 96, 12, 12, 66, 1, { crown: false }], [29, 96, 15, 15, 58, 2, { crown: true }],
    [-58, 108, 14, 14, 52, 0, { crown: false }], [48, 112, 12, 12, 72, 3, { spire: true }],
    [12, 94, 9, 9, 44, 4, { crown: false }], [-17, 91, 10, 10, 39, 2, { crown: true }],
    [66, 100, 11, 11, 50, 1, { crown: false }], [-84, 118, 16, 15, 47, 0, { crown: false }],
    [86, 124, 14, 14, 56, 2, { crown: true }], [-112, 98, 13, 13, 38, 3, {}],
    [112, 98, 13, 13, 42, 4, {}], [22, 128, 12, 12, 63, 0, { crown: true }],
    [-46, 134, 15, 15, 54, 1, {}], [58, 138, 16, 14, 49, 2, {}],
    [-76, 142, 11, 11, 44, 4, { crown: true }], [96, 148, 13, 13, 39, 3, {}],
    [-4, 150, 10, 10, 51, 0, { spire: true }], [-132, 132, 18, 14, 34, 2, {}],
    [136, 136, 15, 13, 36, 1, {}], [72, 162, 14, 14, 45, 4, { crown: true }],
    [-104, 160, 13, 13, 33, 0, {}], [18, 170, 12, 12, 38, 3, {}],
  ];
  placements.forEach(([x, z, w, d, h, idx, opts]) => tower(x, z, w, d, h, idx, opts));

  // nearer lower blocks to bridge the waterfront
  for (let i = 0; i < 12; i++) {
    const x = -104 + i * 19 + (r() - 0.5) * 4;
    const h = 16 + r() * 22;
    tower(x, 76 + r() * 8, 11 + r() * 4, 10 + r() * 3, h, i % 5, { crown: r() > 0.85 });
  }

  // rooftop water tanks for realism
  const tankMat = S('#82633f');
  for (let i = 0; i < 7; i++) {
    const x = -85 + r() * 170;
    const z = 78 + r() * 20;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 2.4, 10), tankMat);
    tank.position.set(x, 20 + r() * 18, z);
    group.add(tank);
  }

  function glow(on) {
    glassMat.emissiveIntensity = on ? 0.24 : 0.03;
    mats.forEach((m) => { m.emissiveIntensity = on ? 0.18 : 0; m.emissive = new THREE.Color('#f4c877'); });
  }

  return { group, glow, towers };
}

/* ------------------------------------------------------------------ */
/*  Battery icons                                                      */
/* ------------------------------------------------------------------ */
export function createCastleClinton() {
  const group = new THREE.Group();
  const sandstone = new THREE.MeshStandardMaterial({
    color: '#b18f6c', roughness: 0.97, map: pavingTexture('slab', 12),
  });
  const dark = S('#8c7054', { roughness: 0.97 });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 7.1, 2.6, 32, 1, true), sandstone);
  wall.position.y = 1.3;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.25, 32), S('#9e8061', { roughness: 0.97 }));
  floor.position.y = 2.6;
  floor.receiveShadow = true;
  group.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.62, 0.22, 6, 32), dark);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.72;
  group.add(rim);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.45), sandstone);
    merlon.position.set(Math.cos(a) * 6.35, 2.95, Math.sin(a) * 6.35);
    merlon.rotation.y = -a + Math.PI / 2;
    merlon.castShadow = true;
    group.add(merlon);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + Math.PI / 10;
    if (Math.abs(Math.sin(a * 2)) < 0.35) continue;
    const arch = new THREE.Group();
    arch.position.set(Math.cos(a) * 6.86, 1.4, Math.sin(a) * 6.86);
    arch.rotation.y = -a + Math.PI / 2;
    const recess = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.5), S('#514434'));
    recess.position.z = 0.02;
    arch.add(recess);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 10, 1, false, 0, Math.PI), sandstone);
    top.rotation.set(Math.PI / 2, 0, 0);
    top.position.set(0, 0.75, 0.03);
    arch.add(top);
    group.add(arch);
  }
  const door = new THREE.Mesh(new RoundedBoxGeometry(1.6, 2.2, 0.3, 3, 0.5), S('#4e3e2f'));
  door.position.set(0, 1.1, 6.95);
  group.add(door);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 1.0), dark);
  cornice.position.set(0, 4.35, 3.2);
  group.add(cornice);

  // flagpole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 7.5, 8), S('#7f7666'));
  pole.position.set(0, 6.1, 0);
  group.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshStandardMaterial({
    map: flagTexture('usa'), side: THREE.DoubleSide, roughness: 0.9,
  }));
  flag.position.set(0.88, 9.0, 0);
  group.add(flag);
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(7.4, 28),
    new THREE.MeshBasicMaterial({ color: '#20312b', transparent: true, opacity: 0.13, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.03;
  group.add(blob);
  return group;
}

export function createSphereSculpture() {
  const group = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({
    color: '#556b5f', roughness: 0.35, metalness: 0.72, flatShading: false,
  });
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 3), bronze);
  sphere.position.y = 3.0;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);
  // etched latitude-like ring seams
  for (const rot of [0.35, -0.5, 1.2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.018, 4, 64), S('#3c4b42', { metalness: 0.6, roughness: 0.4 }));
    ring.rotation.set(Math.PI / 2 + rot, 0, rot * 0.6);
    ring.position.y = 3.0;
    group.add(ring);
  }
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.5, 1.1, 24), S('#8f8778', { roughness: 0.9 }));
  pedestal.position.y = 0.55;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  group.add(pedestal);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.07, 0.38), new THREE.MeshStandardMaterial({
    map: signTexture('THE SPHERE', { sub: 'BATTERY PARK', bg: '#6f6a5e', fg: '#efe6d3', border: '#4e4a41', size: 34, tape: false }),
    roughness: 0.9,
  }));
  plaque.position.set(0, 0.62, 1.26);
  group.add(plaque);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.65, 0.32, 28), S('#a69c89', { roughness: 0.94 }));
  base.position.y = 0.16;
  base.receiveShadow = true;
  group.add(base);
  return group;
}

/* ------------------------------------------------------------------ */
/*  harbor life: sailboats, gulls, foam, Ellis Island                  */
/* ------------------------------------------------------------------ */
export function createSailboat({ sailColor = '#f2e7d0', hullColor = '#314e5c', scale = 1 } = {}) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.45, 3.5), S(hullColor, { roughness: 0.6 }));
  hull.position.y = 0.1;
  hull.castShadow = true;
  group.add(hull);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 3.55), S('#e4d8bf'));
  trim.position.y = 0.33;
  group.add(trim);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 5.0, 6), S('#8c704f'));
  mast.position.set(0, 2.8, 0.2);
  group.add(mast);
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 5.15, 0.25, 0, 0.55, 0.35, 1.55, 0.9, 0.2,
  ], 3));
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({
    color: sailColor, side: THREE.DoubleSide, roughness: 0.9,
  }));
  sail.castShadow = true;
  group.add(sail);
  const jibGeo = new THREE.BufferGeometry();
  jibGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 4.7, 0.1, 0, 0.6, -1.3, -0.9, 0.9, 0.1,
  ], 3));
  jibGeo.computeVertexNormals();
  const jib = new THREE.Mesh(jibGeo, new THREE.MeshStandardMaterial({
    color: sailColor, side: THREE.DoubleSide, roughness: 0.9,
  }));
  group.add(jib);
  group.scale.setScalar(scale);
  group.userData.phase = Math.random() * TAU;
  return group;
}

export function createHarborCraft() {
  const group = new THREE.Group();
  const boats = [];
  const r = mulberry32(47);
  const place = (x, z, params) => {
    const boat = createSailboat(params);
    boat.position.set(x, WATER_Y + 0.2, z);
    boat.rotation.y = r() * TAU;
    boat.userData.baseY = boat.position.y;
    group.add(boat);
    boats.push(boat);
  };
  place(-68, -34, { sailColor: '#f4ead6', hullColor: '#3f5f6c', scale: 1.15 });
  place(72, -55, { sailColor: '#f2dfc0', hullColor: '#5a4a3f', scale: 0.95 });
  place(-98, -12, { sailColor: '#e9e2d1', hullColor: '#44636b', scale: 1.4 });
  place(108, -18, { sailColor: '#f3e8ce', hullColor: '#36525e', scale: 1.05 });

  // small yellow water taxi
  const taxi = new THREE.Group();
  const hull = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.75, 5.2, 3, 0.2), S('#e8c05a', { roughness: 0.55 }));
  hull.position.y = 0.3;
  taxi.add(hull);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.2, 2.2, 3, 0.18), S('#f1ead8'));
  cab.position.set(0, 1.15, -0.5);
  taxi.add(cab);
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.45, 2.0), S('#2b434c', { roughness: 0.25 }));
  win.position.set(0, 1.35, -0.5);
  taxi.add(win);
  taxi.position.set(56, WATER_Y + 0.18, -30);
  taxi.rotation.y = -0.7;
  taxi.userData.baseY = taxi.position.y;
  taxi.userData.phase = 2;
  group.add(taxi);
  boats.push(taxi);

  function update(dt, t) {
    boats.forEach((b, i) => {
      const ph = b.userData.phase ?? i * 1.7;
      b.position.y = (b.userData.baseY ?? (WATER_Y + 0.2)) + Math.sin(t * 0.9 + ph) * 0.08;
      b.rotation.z = Math.sin(t * 0.7 + ph) * 0.025;
      b.rotation.x = Math.cos(t * 0.55 + ph) * 0.01;
    });
  }
  return { group, update, boats };
}

export function createFoamRing({ x = 0, z = 0, radius = 26, count = 40, y = WATER_Y + 0.02 } = {}) {
  const group = new THREE.Group();
  const r = mulberry32(Math.round(radius * 71 + x + z));
  const mat = new THREE.SpriteMaterial({
    map: dotTexture(), color: '#efe7d4', transparent: true, opacity: 0.16,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const sprites = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    const s = new THREE.Sprite(mat.clone());
    s.material.opacity = 0.05 + r() * 0.1;
    const rr = radius + (r() - 0.5) * 1.6;
    s.position.set(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr);
    const sc = 2.4 + r() * 3.6;
    s.scale.set(sc, sc * 0.24, 1);
    s.userData.phase = r() * TAU;
    group.add(s);
    sprites.push(s);
  }
  function update(dt, t) {
    sprites.forEach((s) => {
      s.material.opacity = 0.045 + (Math.sin(t * 0.8 + s.userData.phase) * 0.5 + 0.5) * 0.1;
    });
  }
  return { group, update };
}

export function createEllisIsland() {
  const group = new THREE.Group();
  const r = mulberry32(83);
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(21, 26, 5.2, 34),
    S('#7e7765', { roughness: 1 }),
  );
  island.position.y = -2.5;
  group.add(island);
  const grass = new THREE.Mesh(new THREE.CircleGeometry(20.4, 34), S('#84906d', { roughness: 0.98 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.12;
  group.add(grass);
  const brickTex = createFacadeTexture({
    style: 'brick', bays: 6, floors: 3, seed: 73, wall: '#a3765d', litChance: 0.18,
  });
  brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
  const main = new THREE.Mesh(new THREE.BoxGeometry(20, 7.5, 9), brickMat);
  main.position.y = 3.9;
  group.add(main);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.8, 9.6), S('#5c6b64'));
  roof.position.y = 7.9;
  group.add(roof);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 5.2, 14), brickMat);
    wing.position.set(s * 9.4, 2.8, -3);
    group.add(wing);
    const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.6, 14.5), S('#5c6b64'));
    wingRoof.position.set(s * 9.4, 5.6, -3);
    group.add(wingRoof);
  }
  for (let i = 0; i < 4; i++) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, TAU, 0, Math.PI / 2), S('#758f82', { metalness: 0.25, roughness: 0.6 }));
    dome.position.set(-6 + i * 4, 8.3, 0);
    group.add(dome);
  }
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 8, 12), S('#9c7b63'));
  tower.position.set(13, 8, 3);
  group.add(tower);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 12), S('#6d5845'));
  tank.position.set(13, 12.6, 3);
  group.add(tank);
  const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 12), S('#4e4640'));
  tankRoof.position.set(13, 14.25, 3);
  group.add(tankRoof);
  for (let i = 0; i < 12; i++) {
    const tree = new THREE.Mesh(new THREE.SphereGeometry(1.1 + r() * 1.1, 7, 5), S(['#5f7d4e', '#6e8b58', '#557244'][i % 3]));
    tree.position.set((r() - 0.5) * 34, 1.8 + r() * 1.6, (r() - 0.5) * 30 + 5);
    group.add(tree);
  }
  const seawall = new THREE.Mesh(new THREE.CylinderGeometry(26.3, 26.3, 1.0, 36), S('#9c9482'));
  seawall.position.y = -1.3;
  group.add(seawall);
  group.position.set(-84, 0, -126);
  return group;
}

export function createHarborPatrol() {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 7.5), S('#e8e2d2', { roughness: 0.55 }));
  hull.position.y = 0.4;
  group.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.26, 7.52), S('#2f4d62'));
  stripe.position.y = 0.66;
  group.add(stripe);
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.3, 2.5, 2, 0.2), S('#f1ead9'));
  cabin.position.set(0, 1.4, -1.2);
  group.add(cabin);
  const win = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.5, 2.1), S('#29424e', { roughness: 0.22 }));
  win.position.set(0, 1.6, -1.2);
  group.add(win);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 5), S('#8d7452'));
  mast.position.set(0, 3.2, 0.4);
  group.add(mast);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color: '#dfe9e5' }));
  light.position.set(0, 4.8, 0.4);
  group.add(light);
  group.position.set(-20, WATER_Y + 0.2, -60);
  group.rotation.y = 0.7;
  group.userData.baseY = group.position.y;
  const update = (dt, t) => {
    group.position.y = group.userData.baseY + Math.sin(t * 0.8 + 1.4) * 0.07;
    group.rotation.z = Math.sin(t * 0.6 + 1.4) * 0.02;
  };
  return { group, update };
}
