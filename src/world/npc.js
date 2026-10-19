import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, canvas2d, canvasTexture, blobShadow, damp } from '../core/utils.js';

const SKIN_SHADE = new THREE.Color('#e8b295');

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...opts });
}

function markerTexture(symbol, color) {
  const { c, ctx } = canvas2d(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  ctx.beginPath();
  ctx.arc(64, 58, 34, 0, TAU);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(54, 88);
  ctx.lineTo(64, 104);
  ctx.lineTo(74, 88);
  ctx.closePath();
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 44px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 64, 58);
  return canvasTexture(c);
}

function nameTexture(name, sub) {
  const { c, ctx } = canvas2d(512, 150);
  ctx.clearRect(0, 0, 512, 150);
  ctx.fillStyle = 'rgba(255,250,240,.92)';
  ctx.strokeStyle = 'rgba(63,49,43,.18)';
  ctx.lineWidth = 4;
  const r = 26;
  ctx.beginPath();
  ctx.moveTo(r, 12);
  ctx.arcTo(500, 12, 500, 138, r);
  ctx.arcTo(500, 138, 12, 138, r);
  ctx.arcTo(12, 138, 12, 12, r);
  ctx.arcTo(12, 12, 500, 12, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3f312b';
  ctx.font = '700 46px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText(name, 256, sub ? 66 : 88);
  if (sub) {
    ctx.fillStyle = 'rgba(63,49,43,.55)';
    ctx.font = '500 26px "Avenir Next", "Trebuchet MS", sans-serif';
    ctx.fillText(sub, 256, 110);
  }
  return canvasTexture(c);
}

function hairStyle(group, style, hairMat, skinMat, y) {
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 14, 0, TAU, 0, Math.PI * 0.58), hairMat);
  cap.position.set(0, y + 0.045, -0.008);
  cap.castShadow = true;
  group.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12, 0, TAU, 0, Math.PI * 0.62), hairMat);
  back.position.set(0, y + 0.01, -0.045);
  back.scale.set(1.02, 1.12, 1);
  group.add(back);
  if (style === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), hairMat);
    bun.position.set(0, y + 0.2, -0.12);
    bun.scale.set(1, 0.85, 0.9);
    group.add(bun);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 4, 12), mat('#c97b64'));
    band.position.copy(bun.position);
    band.rotation.x = 0.5;
    group.add(band);
  } else if (style === 'bob') {
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.34, 0.2, 3, 0.07), hairMat);
      side.position.set(s * 0.17, y - 0.04, -0.02);
      side.rotation.z = s * 0.06;
      side.castShadow = true;
      group.add(side);
    }
    const fringe = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.12, 0.18, 3, 0.05), hairMat);
    fringe.position.set(0, y + 0.12, 0.08);
    fringe.rotation.x = -0.35;
    group.add(fringe);
  } else if (style === 'long') {
    for (const s of [-1, 1]) {
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.46, 5, 8), hairMat);
      lock.position.set(s * 0.16, y - 0.24, -0.11);
      lock.rotation.z = s * 0.05;
      lock.castShadow = true;
      group.add(lock);
    }
    const backLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.44, 6, 10), hairMat);
    backLock.position.set(0, y - 0.2, -0.16);
    group.add(backLock);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.02), mat('#d06a63'));
    ribbon.position.set(0, y + 0.16, -0.19);
    ribbon.rotation.z = 0.5;
    group.add(ribbon);
  } else if (style === 'ponytail') {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 5, 8), hairMat);
    tail.position.set(0.06, y - 0.06, -0.3);
    tail.rotation.x = -0.6;
    tail.rotation.z = -0.2;
    tail.castShadow = true;
    group.add(tail);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 4, 10), mat('#e0a45c'));
    tie.position.set(0.05, y + 0.1, -0.19);
    tie.rotation.x = 1.1;
    group.add(tie);
  } else if (style === 'messy') {
    for (let i = 0; i < 4; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), hairMat);
      tuft.position.set((i - 1.5) * 0.075, y + 0.24 + (i % 2) * 0.04, -0.02 + (i % 2) * 0.05);
      tuft.rotation.z = (i - 1.5) * 0.32;
      group.add(tuft);
    }
  }
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, TAU, 0, Math.PI * 0.32), hairMat);
  fringe.position.set(0, y + 0.02, 0.02);
  fringe.scale.set(1.02, 0.8, 1.04);
  group.add(fringe);
  return cap;
}

function addFace(group, y, skinMat) {
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x352721 });
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), eyeMat);
    eye.position.set(s * 0.068, y + 0.015, 0.183);
    eye.scale.y = 1.15;
    group.add(eye);
    eyes.push(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(s * 0.06, y + 0.03, 0.203);
    group.add(shine);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.011, 0.012), new THREE.MeshBasicMaterial({ color: 0x4a352a }));
    brow.position.set(s * 0.072, y + 0.085, 0.185);
    brow.rotation.z = s * -0.1;
    group.add(brow);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.024, 10), new THREE.MeshBasicMaterial({
      color: 0xe99a8b, transparent: true, opacity: 0.4, depthWrite: false,
    }));
    blush.position.set(s * 0.113, y - 0.045, 0.176);
    group.add(blush);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 7, 6), skinMat);
  nose.position.set(0, y - 0.018, 0.2);
  group.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 5, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8c4a3e }));
  smile.position.set(0, y - 0.06, 0.188);
  smile.rotation.z = Math.PI;
  group.add(smile);
  return eyes;
}

function addHat(group, type, y, color) {
  const hatMat = mat(color, { roughness: 0.9 });
  if (type === 'beret') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, TAU, 0, Math.PI / 2), hatMat);
    dome.position.set(-0.03, y + 0.16, 0);
    dome.scale.set(1.08, 0.6, 1.05);
    dome.rotation.z = -0.22;
    group.add(dome);
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 5), hatMat);
    nub.position.set(-0.02, y + 0.26, 0);
    nub.rotation.z = -0.3;
    group.add(nub);
  } else if (type === 'ranger') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.025, 16), hatMat);
    brim.position.set(0, y + 0.14, 0);
    group.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.19, 10), hatMat);
    crown.position.set(0, y + 0.23, 0);
    group.add(crown);
    const dent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), hatMat);
    dent.position.set(0, y + 0.29, 0);
    group.add(dent);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.035, 10), mat('#5d4632'));
    band.position.set(0, y + 0.16, 0);
    group.add(band);
  } else if (type === 'knit') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 12, 0, TAU, 0, Math.PI * 0.55), hatMat);
    cap.position.set(0, y + 0.075, -0.01);
    group.add(cap);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.035, 6, 20), hatMat);
    brim.rotation.x = Math.PI / 2;
    brim.position.set(0, y + 0.06, -0.01);
    group.add(brim);
  } else if (type === 'band') {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.204, 0.204, 0.06, 20, 1, true), hatMat);
    band.position.set(0, y + 0.1, 0);
    group.add(band);
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), hatMat);
    knot.position.set(0, y + 0.1, -0.205);
    group.add(knot);
    for (const s of [-1, 1]) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.16, 4), hatMat);
      tail.position.set(s * 0.04, y + 0.04, -0.25);
      tail.rotation.x = 0.6;
      tail.rotation.z = s * 0.4;
      group.add(tail);
    }
  }
}

function addAccessory(group, def, y, mats) {
  const acc = def.accessory;
  if (acc === 'apron') {
    const apron = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.38, 0.025, 2, 0.03), mats.cloth2);
    apron.position.set(0, 0.44, 0.185);
    group.add(apron);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.02), mats.cloth2);
    strap.position.set(0, 0.72, 0.17);
    group.add(strap);
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.1, 0.02, 2, 0.02), mats.cloth2);
    pocket.position.set(0, 0.36, 0.203);
    group.add(pocket);
  } else if (acc === 'guitar') {
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.42, 0.08, 3, 0.1), mat('#c07a4c'));
    body.position.set(-0.02, 0.44, 0.26);
    body.rotation.z = -0.5;
    group.add(body);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.055, 14), new THREE.MeshBasicMaterial({ color: '#3a2a21' }));
    hole.position.set(-0.02, 0.47, 0.302);
    hole.rotation.z = -0.5;
    group.add(hole);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.46, 0.035), mat('#7a5a3b'));
    neck.position.set(0.15, 0.76, 0.26);
    neck.rotation.z = -0.5;
    group.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.045), mat('#4a352a'));
    head.position.set(0.26, 0.94, 0.26);
    head.rotation.z = -0.5;
    group.add(head);
    for (let i = 0; i < 3; i++) {
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.75, 3), new THREE.MeshBasicMaterial({ color: '#e8dcc2' }));
      string.position.set(0.06 + i * 0.012, 0.62, 0.303);
      string.rotation.z = -0.5;
      group.add(string);
    }
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 6), mats.cloth);
      arm.position.set(s * 0.22, 0.58, 0.16);
      arm.rotation.z = s * 0.6;
      arm.rotation.x = -0.7;
      group.add(arm);
    }
  } else if (acc === 'palette') {
    const palette = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 16), mat('#d8b98d'));
    palette.position.set(0.2, 0.48, 0.22);
    palette.rotation.set(Math.PI / 2, 0, -0.3);
    palette.scale.x = 1.25;
    group.add(palette);
    ['#e9705b', '#f0b64b', '#5b8f88', '#7e86bd', '#f6ead1'].forEach((c, i) => {
      const dab = new THREE.Mesh(new THREE.SphereGeometry(0.028, 7, 5), mat(c));
      dab.position.set(0.13 + (i % 3) * 0.07, 0.51 + Math.floor(i / 3) * 0.05, 0.245);
      group.add(dab);
    });
    const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 4), mat('#8a6748'));
    brush.position.set(0.34, 0.63, 0.24);
    brush.rotation.z = 0.6;
    group.add(brush);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 6), mat('#d06a63'));
    tip.position.set(0.44, 0.77, 0.24);
    tip.rotation.z = 0.6;
    group.add(tip);
  } else if (acc === 'tray') {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), mat('#b08b5f'));
    tray.position.set(0.22, 0.52, 0.2);
    group.add(tray);
    for (let i = 0; i < 3; i++) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.06, 8), mat('#f4ede0'));
      cup.position.set(0.15 + i * 0.07, 0.56, 0.2 + (i % 2) * 0.05);
      group.add(cup);
    }
  } else if (acc === 'baguette') {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.2, 10, 1, true), mat('#c8a06e', { side: THREE.DoubleSide }));
    basket.position.set(0.22, 0.42, 0.08);
    group.add(basket);
    for (let i = 0; i < 3; i++) {
      const bread = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.28, 4, 6), mat('#d9a75e'));
      bread.position.set(0.22 + (i - 1) * 0.06, 0.56, 0.08 + (i - 1) * 0.02);
      bread.rotation.z = 0.2 + i * 0.08;
      group.add(bread);
    }
  } else if (acc === 'camera') {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 4, 18, Math.PI), mat('#5e4936'));
    strap.position.set(0, 0.66, 0.12);
    strap.rotation.x = -0.6;
    group.add(strap);
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.11, 0.08, 2, 0.02), mat('#4a4a4c'));
    body.position.set(0, 0.55, 0.22);
    group.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), mat('#2f2f31'));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.55, 0.28);
    group.add(lens);
  } else if (acc === 'scarf') {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.045, 6, 16), mat(def.accent || '#d06a63'));
    scarf.position.set(0, y + 0.18, 0);
    scarf.rotation.x = Math.PI / 2;
    group.add(scarf);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.03), mat(def.accent || '#d06a63'));
    tail.position.set(0.09, y - 0.02, 0.13);
    tail.rotation.z = 0.15;
    group.add(tail);
  } else if (acc === 'mime') {
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.02), mat('#3f312b'));
      stripe.position.set(0, 0.42 + i * 0.075, 0.2);
      group.add(stripe);
    }
    for (const s of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), mat('#d06a63'));
      cheek.position.set(s * 0.115, y - 0.035, 0.176);
      group.add(cheek);
    }
  } else if (acc === 'shrine') {
    const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.46, 12, 1, true), mats.cloth2);
    hakama.position.set(0, 0.36, 0);
    hakama.material.side = THREE.DoubleSide;
    group.add(hakama);
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.02), mat('#f7e7c6'));
    sash.position.set(0, 0.57, 0.17);
    group.add(sash);
    for (const s of [-1, 1]) {
      const ribbon = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), mat('#d06a63'));
      ribbon.position.set(s * 0.14, y + 0.18, -0.12);
      ribbon.rotation.x = -0.5;
      ribbon.rotation.z = s * 0.5;
      group.add(ribbon);
    }
  } else if (acc === 'chef') {
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.02), mat('#e7ddca'));
    coat.position.set(0, 0.52, 0.19);
    group.add(coat);
    const towel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.025), mat('#f2ede1'));
    towel.position.set(0.15, 0.56, 0.11);
    towel.rotation.z = -0.2;
    group.add(towel);
    for (let i = 0; i < 4; i++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), mat('#c9b898'));
      btn.position.set(0.055, 0.62 - i * 0.06, 0.203);
      group.add(btn);
    }
  }
}

export function createNPC(def) {
  const root = new THREE.Group();
  root.name = `NPC:${def.id}`;
  const body = new THREE.Group();
  root.add(body);
  const scale = def.scale || 1;
  const skin = mat(def.skin || '#f0c6a8');
  const skinShade = mat(def.skinShade || def.skin || '#e3ab89');
  const hair = mat(def.hairColor || '#4b3528', { roughness: 0.95 });
  const cloth = mat(def.cloth || '#7b9a86');
  const cloth2 = mat(def.cloth2 || '#e8dcc3');
  const pants = mat(def.pants || '#5e5448');
  const shoe = mat(def.shoe || '#5a4636');
  const mats = { skin, skinShade, hair, cloth, cloth2, pants, shoe };

  // legs & shoes
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.24, 5, 8), pants);
    leg.position.set(s * 0.085, 0.27, 0);
    leg.castShadow = true;
    body.add(leg);
    const boot = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.09, 0.22, 2, 0.03), shoe);
    boot.position.set(s * 0.085, 0.05, 0.035);
    boot.castShadow = true;
    body.add(boot);
  }

  // long dress / coat silhouette
  if (def.style === 'dress') {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.29, 0.44, 14), cloth);
    skirt.position.y = 0.42;
    skirt.castShadow = true;
    body.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 4, 20), cloth2);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.21;
    body.add(hem);
  } else if (def.style === 'coat') {
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.5, 14), cloth);
    coat.position.y = 0.47;
    coat.castShadow = true;
    body.add(coat);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.02), cloth2);
    seam.position.set(0, 0.48, 0.205);
    body.add(seam);
  } else {
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.26, 6, 10), cloth);
    torso.position.y = 0.55;
    torso.scale.z = 0.82;
    torso.castShadow = true;
    body.add(torso);
  }

  // torso detail / collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.026, 5, 14), cloth2);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.795;
  body.add(collar);

  // arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.28, 5, 8), cloth);
    arm.position.set(s * 0.23, 0.58, 0.01);
    arm.rotation.z = s * 0.19;
    arm.rotation.x = 0.04;
    arm.castShadow = true;
    body.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), skin);
    hand.position.set(s * 0.285, 0.39, 0.035);
    body.add(hand);
  }

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.0;
  body.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.195, 22, 16), skin);
  head.scale.set(1, 1.04, 0.96);
  head.castShadow = true;
  headGroup.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skin);
    ear.position.set(s * 0.184, -0.005, -0.005);
    headGroup.add(ear);
  }
  const eyes = addFace(headGroup, 0, skinShade);
  hairStyle(headGroup, def.hairStyle || 'short', hair, skin, 0);
  if (def.hat) addHat(headGroup, def.hat, 0, def.hatColor || '#61513f');

  const yawBase = def.yaw || 0;
  root.rotation.y = yawBase;

  addAccessory(body, def, 0, mats);

  // shadow
  const shadow = blobShadow(0.42, 0.2);
  shadow.position.y = 0.015;
  root.add(shadow);

  // marker
  const markerTex = {
    quest: markerTexture('!', '#e0a43a'),
    ready: markerTexture('?', '#e9705b'),
    done: markerTexture('✓', '#4f938c'),
    hint: markerTexture('…', '#7b8b99'),
  };
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: markerTex.quest, transparent: true, depthWrite: false, depthTest: true,
  }));
  marker.scale.setScalar(0.52);
  marker.position.y = 1.82 * scale;
  marker.renderOrder = 5;
  root.add(marker);

  const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nameTexture(def.name, def.nameSub), transparent: true, depthWrite: false,
  }));
  nameSprite.scale.set(1.55, 0.45, 1);
  nameSprite.position.y = 1.62 * scale;
  nameSprite.renderOrder = 4;
  root.add(nameSprite);

  root.scale.setScalar(scale);

  let markerState = def.marker || 'quest';
  marker.material.map = markerTex[markerState] || markerTex.quest;
  marker.material.needsUpdate = true;
  marker.visible = markerState !== 'none';

  let talking = false;
  let blinkTimer = Math.random() * 3;
  let blink = 0;
  let time = Math.random() * 10;
  let lookX = 0, lookY = 0;

  function setMarker(state) {
    markerState = state;
    marker.material.map = markerTex[state] || markerTex.quest;
    marker.material.needsUpdate = true;
    marker.visible = state !== 'none' && state !== 'done' && !talking;
  }

  function setTalking(on) {
    talking = on;
    marker.visible = on ? false : (markerState !== 'none' && markerState !== 'done');
    if (!on) headGroup.rotation.set(0, 0, 0);
  }

  function update(dt, t, playerPos) {
    time += dt;
    body.position.y = Math.sin(time * 1.6) * 0.012;
    headGroup.rotation.z = Math.sin(time * 0.7) * 0.02;
    marker.position.y = 1.82 * scale + Math.sin(time * 2.4) * 0.05;
    nameSprite.visible = !talking;
    marker.visible = !talking && markerState !== 'none' && markerState !== 'done';
    if (talking) {
      headGroup.rotation.x = Math.sin(time * 2.4) * 0.05;
      headGroup.rotation.y = Math.sin(time * 1.9) * 0.1;
    } else if (playerPos) {
      const dx = playerPos.x - root.position.x;
      const dz = playerPos.z - root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 5.5) {
        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        root.rotation.y += diff * Math.min(1, dt * 4);
        lookX = damp(lookX, Math.max(-0.5, Math.min(0.5, diff)), 5, dt);
        lookY = damp(lookY, 0.1, 5, dt);
      } else {
        let diff = yawBase - root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        root.rotation.y += diff * Math.min(1, dt * 1.8);
        lookX = damp(lookX, 0, 4, dt);
        lookY = damp(lookY, 0, 4, dt);
      }
      headGroup.rotation.y = lookX * 0.55;
      headGroup.rotation.x = lookY * -0.2;
    }
    blinkTimer -= dt;
    if (blinkTimer < 0) { blink = 0.14; blinkTimer = 2.4 + Math.random() * 3.2; }
    blink = Math.max(0, blink - dt);
    const squash = blink > 0 ? 0.18 : 1;
    eyes.forEach((e) => { e.scale.y = 1.15 * squash; });
  }

  return {
    def,
    root,
    body,
    headGroup,
    marker,
    nameSprite,
    update,
    setMarker,
    setTalking,
    yawBase,
    get markerState() { return markerState; },
  };
}

export function drawPortrait(canvas, def) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const skin = def.skin || '#f0c6a8';
  const hair = def.hairColor || '#4b3528';
  const cloth = def.cloth || '#7b9a86';
  const cloth2 = def.cloth2 || '#e8dcc3';
  const accent = def.accent || '#e9705b';

  // paper background with soft halo
  ctx.fillStyle = '#f8eedb';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.5, w * 0.75);
  g.addColorStop(0, `${accent}22`);
  g.addColorStop(1, 'rgba(255,250,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(63,49,43,.18)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  if (def.species === 'cat') {
    const cx = w * 0.54, cy = h * 0.52, rw = w * 0.24, rh = h * 0.235;
    // body
    ctx.fillStyle = '#f6efe2';
    ctx.beginPath();
    ctx.ellipse(cx, h * 1.12, w * 0.4, h * 0.44, 0.04, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#df9d5e';
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 1.08, w * 0.2, h * 0.3, 0.25, 0, TAU);
    ctx.fill();
    // ears
    for (const s of [-1, 1]) {
      ctx.fillStyle = s > 0 ? '#df9d5e' : '#4a4038';
      ctx.beginPath();
      ctx.moveTo(cx + s * rw * 0.78, cy - rh * 0.6);
      ctx.lineTo(cx + s * rw * 0.5, cy - rh * 1.38);
      ctx.lineTo(cx + s * rw * 0.2, cy - rh * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f0b8a2';
      ctx.beginPath();
      ctx.moveTo(cx + s * rw * 0.66, cy - rh * 0.66);
      ctx.lineTo(cx + s * rw * 0.5, cy - rh * 1.12);
      ctx.lineTo(cx + s * rw * 0.32, cy - rh * 0.82);
      ctx.closePath();
      ctx.fill();
    }
    // head
    ctx.fillStyle = '#f6efe2';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#4a4038';
    ctx.beginPath();
    ctx.ellipse(cx - rw * 0.34, cy - rh * 0.36, rw * 0.5, rh * 0.42, -0.25, 0, TAU);
    ctx.fill();
    // eyes
    for (const s of [-1, 1]) {
      ctx.strokeStyle = '#3a2c24';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx + s * w * 0.085, cy + h * 0.005, w * 0.032, Math.PI, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(229,155,138,.45)';
      ctx.beginPath();
      ctx.ellipse(cx + s * w * 0.125, cy + h * 0.065, w * 0.026, h * 0.014, 0, 0, TAU);
      ctx.fill();
    }
    // nose + mouth
    ctx.fillStyle = '#d08776';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.015, cy + h * 0.055);
    ctx.lineTo(cx + w * 0.015, cy + h * 0.055);
    ctx.lineTo(cx, cy + h * 0.078);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a5a4a';
    ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + s * w * 0.022, cy + h * 0.085, w * 0.022, s > 0 ? -0.2 : Math.PI, s > 0 ? Math.PI * 0.6 : Math.PI * 1.2);
      ctx.stroke();
    }
    // whiskers
    ctx.strokeStyle = 'rgba(63,49,43,.55)';
    ctx.lineWidth = 2.5;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * w * 0.11, cy + h * 0.07 + i * h * 0.03);
        ctx.quadraticCurveTo(cx + s * w * 0.2, cy + h * 0.065 + i * h * 0.035, cx + s * w * 0.25, cy + h * 0.04 + i * h * 0.05);
        ctx.stroke();
      }
    }
    // collar + bell
    ctx.strokeStyle = '#c95b4e';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy + rh * 0.92, rw * 0.72, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    ctx.fillStyle = '#e7c05a';
    ctx.beginPath();
    ctx.arc(cx, cy + rh * 1.18, w * 0.032, 0, TAU);
    ctx.fill();
    // paw signature
    ctx.fillStyle = 'rgba(63,49,43,.22)';
    ctx.beginPath();
    ctx.ellipse(w * 0.84, h * 0.88, w * 0.028, h * 0.024, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.815 + i * 0.02), h * (0.855 - Math.abs(i - 1) * 0.014), w * 0.011, 0, TAU);
      ctx.fill();
    }
    return;
  }

  // shoulders
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(w * 0.62, h * 1.12, w * 0.52, h * 0.5, 0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = cloth2;
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 1.18, w * 0.2, h * 0.38, -0.2, 0, TAU);
  ctx.fill();

  // neck
  ctx.fillStyle = skin;
  ctx.fillRect(w * 0.52, h * 0.62, w * 0.16, h * 0.22);

  // head
  ctx.beginPath();
  ctx.ellipse(w * 0.6, h * 0.52, w * 0.245, h * 0.265, 0.03, 0, TAU);
  ctx.fillStyle = skin;
  ctx.fill();
  // ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(w * (0.6 + s * 0.245), h * 0.54, w * 0.035, h * 0.055, 0, 0, TAU);
    ctx.fillStyle = skin;
    ctx.fill();
  }

  // hair mass
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(w * 0.6, h * 0.44, w * 0.26, h * 0.24, 0.03, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (def.hairStyle === 'bun') {
    ctx.beginPath();
    ctx.arc(w * 0.6, h * 0.235, w * 0.085, 0, TAU);
    ctx.fill();
  } else if (def.hairStyle === 'bob' || def.hairStyle === 'long') {
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 0.63, w * 0.075, h * 0.2, 0.14, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.63, w * 0.075, h * 0.2, -0.14, 0, TAU);
    ctx.fill();
  } else if (def.hairStyle === 'messy') {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(w * (0.48 + i * 0.08), h * 0.305, w * 0.04, h * 0.055, i * 0.4, 0, TAU);
      ctx.fill();
    }
  } else if (def.hairStyle === 'ponytail') {
    ctx.beginPath();
    ctx.ellipse(w * 0.86, h * 0.5, w * 0.06, h * 0.16, -0.4, 0, TAU);
    ctx.fill();
  }
  // fringe
  ctx.beginPath();
  ctx.ellipse(w * 0.6, h * 0.39, w * 0.23, h * 0.085, 0.03, Math.PI, TAU);
  ctx.fill();

  // face
  const eyeX = w * 0.6, eyeY = h * 0.54;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(eyeX + s * w * 0.085, eyeY, w * 0.018, h * 0.026, 0, 0, TAU);
    ctx.fillStyle = '#352721';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeX + s * w * 0.085 + w * 0.006, eyeY - h * 0.008, w * 0.006, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = hair;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(eyeX + s * w * 0.085, eyeY - h * 0.045, w * 0.033, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // blush
    ctx.beginPath();
    ctx.ellipse(eyeX + s * w * 0.145, eyeY + h * 0.085, w * 0.032, h * 0.018, 0, 0, TAU);
    ctx.fillStyle = 'rgba(233,112,91,.32)';
    ctx.fill();
  }
  ctx.strokeStyle = '#9a5a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY + h * 0.075, w * 0.033, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();

  if (def.hat === 'beret') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(w * 0.53, h * 0.295, w * 0.23, h * 0.08, -0.18, 0, TAU);
    ctx.fill();
  } else if (def.hat === 'ranger') {
    ctx.fillStyle = '#7a6244';
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.315, w * 0.3, h * 0.045, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8b7150';
    ctx.beginPath();
    ctx.roundRect(w * 0.47, h * 0.22, w * 0.26, h * 0.1, 14);
    ctx.fill();
  } else if (def.hat === 'band') {
    ctx.fillStyle = accent;
    ctx.fillRect(w * 0.47, h * 0.33, w * 0.27, h * 0.035);
  } else if (def.hat === 'knit') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.33, w * 0.25, h * 0.11, 0, Math.PI, TAU);
    ctx.fill();
  }

  if (def.accessory === 'shrine') {
    ctx.fillStyle = '#d06a63';
    ctx.fillRect(w * 0.42, h * 0.3, w * 0.035, h * 0.1);
  }
  if (def.accessory === 'mime') {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = '#3f312b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * (0.83 + i * 0.04));
      ctx.lineTo(w * 0.7, h * (0.83 + i * 0.04));
      ctx.stroke();
    }
  }
  if (def.accessory === 'chef') {
    ctx.fillStyle = '#f2ede1';
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.3, w * 0.2, h * 0.08, 0, Math.PI, TAU);
    ctx.fill();
  }
  if (def.accessory === 'scarf') {
    ctx.fillStyle = accent;
    ctx.fillRect(w * 0.38, h * 0.73, w * 0.44, h * 0.07);
  }

  // little paper dots / texture
  ctx.fillStyle = 'rgba(63,49,43,.08)';
  for (let i = 0; i < 26; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
}
