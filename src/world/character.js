import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  TAU, clamp, damp, lerp, blobShadow, canvas2d, canvasTexture,
} from '../core/utils.js';

const C = {
  skin: '#f8d6ba',
  skinShade: '#eec2a2',
  skinDeep: '#dfa886',
  blush: '#e98f7e',
  hair: '#7a5439',
  hairDark: '#5e3e2a',
  hairLight: '#a17654',
  coat: '#f0c26e',
  coatLight: '#f8d38c',
  coatDark: '#d8a754',
  cream: '#fbf1dd',
  creamDark: '#eadcc2',
  scarf: '#4e948d',
  scarfDark: '#3c7b76',
  scarfLight: '#7fb8ac',
  tights: '#f8ede0',
  boot: '#a94f3c',
  bootDark: '#8d3f30',
  bootSole: '#583a2d',
  pack: '#9c6f46',
  packDark: '#7c5434',
  ribbon: '#c85a4e',
  ribbonDark: '#a4453c',
  gold: '#d8a644',
  eyeWhite: '#fff9ee',
  iris: '#a97744',
  irisDark: '#6d4628',
  pupil: '#241814',
  lash: '#3a241d',
  mouth: '#b05c50',
};

function fabricTexture(base, variance = 10, seed = 1) {
  const { c, ctx } = canvas2d(192, 192);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 192, 192);
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 2600; i++) {
    const a = rnd() * variance;
    ctx.strokeStyle = rnd() > 0.5
      ? `rgba(255,255,255,${a / 255})`
      : `rgba(70,45,25,${a / 360})`;
    ctx.lineWidth = 0.7;
    const x = rnd() * 192, y = rnd() * 192;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 7, y + 1.6 + rnd() * 3);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [3, 3] });
}

function knitTexture(base, line, seed = 1) {
  const { c, ctx } = canvas2d(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  for (let y = 0; y < 128; y += 8) {
    ctx.beginPath();
    for (let x = 0; x <= 128; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.38) * 2.4);
    }
    ctx.stroke();
  }
  for (let x = 0; x < 128; x += 8) {
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [2.5, 2.5] });
}

function leatherTexture(base, seed = 1) {
  const { c, ctx } = canvas2d(192, 192);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 192, 192);
  let s = seed;
  const rnd = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 900; i++) {
    const a = 0.02 + rnd() * 0.05;
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,240,214,${a})` : `rgba(45,25,15,${a})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * 192, rnd() * 192, 1 + rnd() * 5, 0.6 + rnd() * 2, rnd() * TAU, 0, TAU);
    ctx.fill();
  }
  return canvasTexture(c, { repeat: [2, 2] });
}

function softDiscTexture(hex, opacity = 1) {
  const { c, ctx } = canvas2d(128, 128);
  const col = new THREE.Color(hex);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${opacity})`);
  g.addColorStop(0.55, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${opacity * 0.55})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(c);
}

function eyeTexture() {
  const { c, ctx } = canvas2d(256, 256);
  ctx.clearRect(0, 0, 256, 256);

  const eyePath = () => {
    ctx.beginPath();
    ctx.moveTo(16, 124);
    ctx.bezierCurveTo(58, 44, 198, 44, 240, 124);
    ctx.bezierCurveTo(202, 196, 54, 196, 16, 124);
    ctx.closePath();
  };

  eyePath();
  const sclera = ctx.createLinearGradient(0, 62, 0, 200);
  sclera.addColorStop(0, '#fffdf7');
  sclera.addColorStop(0.55, '#fbf1e1');
  sclera.addColorStop(1, '#ecd9c4');
  ctx.fillStyle = sclera;
  ctx.fill();

  ctx.save();
  eyePath();
  ctx.clip();
  const irisGrad = ctx.createRadialGradient(112, 112, 6, 128, 132, 62);
  irisGrad.addColorStop(0, '#d7ac72');
  irisGrad.addColorStop(0.42, '#b07c47');
  irisGrad.addColorStop(0.82, '#88562f');
  irisGrad.addColorStop(1, '#57351f');
  ctx.beginPath();
  ctx.arc(128, 132, 60, 0, TAU);
  ctx.fillStyle = irisGrad;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(66,40,24,.82)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 134, 30, 0, TAU);
  ctx.fillStyle = '#2b1b12';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(148, 162, 15, 9, 0.3, 0, TAU);
  ctx.fillStyle = 'rgba(214,164,103,.5)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(108, 110, 16, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,.97)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(151, 148, 7, 0, TAU);
  ctx.fillStyle = 'rgba(255,252,244,.9)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(96, 158, 4.5, 0, TAU);
  ctx.fillStyle = 'rgba(255,250,236,.55)';
  ctx.fill();
  ctx.restore();

  // soft shadow under the upper lid
  ctx.beginPath();
  ctx.moveTo(22, 122);
  ctx.bezierCurveTo(62, 56, 194, 56, 236, 122);
  ctx.lineWidth = 20;
  ctx.strokeStyle = 'rgba(112,68,44,.16)';
  ctx.stroke();

  // upper lash line
  ctx.beginPath();
  ctx.moveTo(18, 123);
  ctx.bezierCurveTo(58, 42, 198, 42, 242, 121);
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3a251c';
  ctx.stroke();

  // outer flick + tiny lashes
  ctx.beginPath();
  ctx.moveTo(232, 110);
  ctx.quadraticCurveTo(248, 96, 254, 82);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#3a251c';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(211, 68);
  ctx.lineTo(224, 54);
  ctx.moveTo(190, 57);
  ctx.lineTo(198, 42);
  ctx.lineWidth = 5;
  ctx.stroke();

  // lower lid line
  ctx.beginPath();
  ctx.moveTo(36, 152);
  ctx.bezierCurveTo(80, 196, 182, 196, 224, 150);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(99,58,40,.5)';
  ctx.stroke();

  return canvasTexture(c);
}

function mouthTexture() {
  const { c, ctx } = canvas2d(256, 160);
  ctx.clearRect(0, 0, 256, 160);

  ctx.beginPath();
  ctx.ellipse(128, 100, 40, 15, 0, 0, TAU);
  ctx.fillStyle = 'rgba(226,150,132,.5)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(46, 64);
  ctx.quadraticCurveTo(128, 124, 210, 64);
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#9c4f43';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(56, 68);
  ctx.quadraticCurveTo(128, 112, 200, 68);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,223,205,.55)';
  ctx.stroke();

  return canvasTexture(c);
}

function makeStarShape(outer = 1, inner = 0.45, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function tubeBetween(points, radius, mat, segments = 24, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Coco {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'Coco';
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    const coatMat = new THREE.MeshStandardMaterial({
      color: C.coat, map: fabricTexture(C.coat, 13, 7), roughness: 0.82,
    });
    const coatLightMat = new THREE.MeshStandardMaterial({ color: C.coatLight, roughness: 0.8 });
    const coatDarkMat = new THREE.MeshStandardMaterial({ color: C.coatDark, roughness: 0.84 });
    const skinMat = new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.56 });
    const skinShadeMat = new THREE.MeshStandardMaterial({ color: C.skinShade, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: C.hair, roughness: 0.74 });
    const hairDarkMat = new THREE.MeshStandardMaterial({ color: C.hairDark, roughness: 0.78 });
    const hairLightMat = new THREE.MeshStandardMaterial({ color: C.hairLight, roughness: 0.7 });
    const scarfMat = new THREE.MeshStandardMaterial({
      color: C.scarf, map: knitTexture(C.scarf, C.scarfDark), roughness: 0.92,
    });
    const scarfDarkMat = new THREE.MeshStandardMaterial({ color: C.scarfDark, roughness: 0.94 });
    const scarfLightMat = new THREE.MeshStandardMaterial({ color: C.scarfLight, roughness: 0.92 });
    const creamMat = new THREE.MeshStandardMaterial({
      color: C.cream, map: knitTexture(C.cream, C.creamDark, 4), roughness: 0.95,
    });
    const tightsMat = new THREE.MeshStandardMaterial({
      color: C.tights, map: knitTexture(C.tights, C.creamDark, 9), roughness: 0.95,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: C.boot, map: leatherTexture(C.boot, 3), roughness: 0.52,
    });
    const bootDarkMat = new THREE.MeshStandardMaterial({ color: C.bootDark, roughness: 0.6 });
    const soleMat = new THREE.MeshStandardMaterial({ color: C.bootSole, roughness: 0.9 });
    const packMat = new THREE.MeshStandardMaterial({
      color: C.pack, map: leatherTexture(C.pack, 11), roughness: 0.72,
    });
    const packDarkMat = new THREE.MeshStandardMaterial({ color: C.packDark, roughness: 0.78 });
    const goldMat = new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.32, metalness: 0.55 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: C.ribbon, roughness: 0.66 });
    const ribbonDarkMat = new THREE.MeshStandardMaterial({ color: C.ribbonDark, roughness: 0.7 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: C.eyeWhite, roughness: 0.25 });
    const irisMat = new THREE.MeshStandardMaterial({ color: C.iris, roughness: 0.3 });
    const irisDarkMat = new THREE.MeshStandardMaterial({ color: C.irisDark, roughness: 0.35 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: C.pupil });
    const lashMat = new THREE.MeshStandardMaterial({ color: C.lash, roughness: 0.6 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: C.mouth, roughness: 0.55 });
    const whiteHiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.materials = {
      coat: coatMat, coatDark: coatDarkMat, cream: creamMat, scarf: scarfMat,
      skin: skinMat, hair: hairMat, boot: bootMat, tights: tightsMat,
      gold: goldMat, eyeWhite: eyeWhiteMat, iris: irisMat, pupil: pupilMat,
    };
    this.mats = this.materials;

    this.buildLegs({ tightsMat, bootMat, bootDarkMat, soleMat, creamMat, goldMat });
    this.buildTorso({
      coatMat, coatLightMat, coatDarkMat, creamMat, scarfMat, scarfDarkMat,
      scarfLightMat, skinMat, goldMat, ribbonMat,
    });
    this.buildArms({ coatMat, creamMat, skinMat });
    this.buildHead({
      skinMat, skinShadeMat, hairMat, hairDarkMat, hairLightMat, eyeWhiteMat,
      irisMat, irisDarkMat, pupilMat, lashMat, mouthMat, whiteHiMat, ribbonMat,
      ribbonDarkMat, goldMat,
    });
    this.buildBackpack({ packMat, packDarkMat, creamMat, scarfMat, goldMat });

    this.shadow = blobShadow(0.58, 0.26);
    this.shadow.position.y = 0.025;
    this.root.add(this.shadow);

    this.walkPhase = 0;
    this.time = 0;
    this.blinkTimer = 2.2;
    this.blinkPhase = -1;
    this.glanceTimer = 3.6;
    this.glance = new THREE.Vector2();
    this.state = 'idle';
    this.look = new THREE.Vector2();
    this.currentLook = new THREE.Vector2();
    this.waveAmount = 0;
    this.waveTarget = 0;
    this.baseY = 0;
    this.squash = 0;
    this.breathe = 0;

    this.root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.shadow.castShadow = false;
    this.root.scale.setScalar(1.03);
  }

  buildLegs({ tightsMat, bootMat, bootDarkMat, soleMat, creamMat, goldMat }) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.088, 0.585, 0);
      this.root.add(leg);

      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.061, 0.22, 5, 10), tightsMat);
      thigh.position.y = -0.135;
      leg.add(thigh);

      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.06, 0.075, 12), creamMat);
      cuff.position.y = -0.292;
      leg.add(cuff);
      const frill = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 5, 14), creamMat);
      frill.rotation.x = Math.PI / 2;
      frill.position.y = -0.252;
      leg.add(frill);

      const bootGroup = new THREE.Group();
      bootGroup.position.y = -0.352;
      leg.add(bootGroup);

      const shaft = new THREE.Mesh(new RoundedBoxGeometry(0.135, 0.155, 0.155, 3, 0.045), bootMat);
      shaft.position.y = -0.015;
      bootGroup.add(shaft);
      const cuffBand = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.072, 0.045, 12), bootDarkMat);
      cuffBand.position.y = 0.066;
      bootGroup.add(cuffBand);

      const foot = new THREE.Mesh(new RoundedBoxGeometry(0.138, 0.105, 0.235, 3, 0.045), bootMat);
      foot.position.set(0, -0.121, 0.043);
      bootGroup.add(foot);
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 10), bootMat);
      toe.position.set(0, -0.135, 0.155);
      toe.scale.set(1, 0.78, 1.05);
      bootGroup.add(toe);
      const sole = new THREE.Mesh(new RoundedBoxGeometry(0.146, 0.042, 0.265, 2, 0.018), soleMat);
      sole.position.set(0, -0.183, 0.052);
      bootGroup.add(sole);
      const heel = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.034, 0.075, 2, 0.012), soleMat);
      heel.position.set(0, -0.18, -0.052);
      bootGroup.add(heel);

      // laces and eyelets
      for (let i = 0; i < 3; i++) {
        const lace = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.082, 3, 5), creamMat);
        lace.rotation.z = Math.PI / 2;
        lace.position.set(0, -0.03 - i * 0.036, 0.088 + i * 0.006);
        bootGroup.add(lace);
        for (const s of [-1, 1]) {
          const eyelet = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 6), goldMat);
          eyelet.rotation.x = Math.PI / 2;
          eyelet.position.set(s * 0.048, -0.03 - i * 0.036, 0.089 + i * 0.006);
          bootGroup.add(eyelet);
        }
      }
      // little heel pull tab
      const tab = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.06, 0.018, 2, 0.006), bootDarkMat);
      tab.position.set(0, 0.055, -0.078);
      bootGroup.add(tab);

      if (side < 0) this.legL = leg; else this.legR = leg;
    }
  }

  buildTorso({
    coatMat, coatLightMat, coatDarkMat, creamMat, scarfMat, scarfDarkMat,
    scarfLightMat, skinMat, goldMat, ribbonMat,
  }) {
    const torso = new THREE.Group();
    torso.position.y = 0.585;
    this.bodyGroup.add(torso);
    this.torso = torso;

    // softly flared duffel coat
    const profile = [
      [0.236, 0.0], [0.252, 0.018], [0.248, 0.055], [0.238, 0.115],
      [0.219, 0.19], [0.203, 0.27], [0.19, 0.345], [0.18, 0.42],
      [0.172, 0.49], [0.158, 0.555], [0.137, 0.595], [0.112, 0.615],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const coatGeo = new THREE.LatheGeometry(profile, 36);
    const pos = coatGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const fold = 1 + Math.sin(a * 8 + 0.4) * 0.026 * (1 - y / 0.62)
        + Math.sin(a * 14 + 1.9) * 0.008;
      pos.setX(i, x * fold);
      pos.setZ(i, z * fold);
    }
    coatGeo.computeVertexNormals();
    const coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.y = 0.0;
    torso.add(coat);

    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.238, 0.017, 6, 40), coatDarkMat);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.014;
    torso.add(hem);

    // front placket and wooden buttons
    const placket = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.52, 0.018, 2, 0.008), coatDarkMat);
    placket.position.set(0.006, 0.34, 0.19);
    placket.rotation.x = -0.045;
    torso.add(placket);
    for (let i = 0; i < 3; i++) {
      const y = 0.485 - i * 0.125;
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10), creamMat);
      button.rotation.x = Math.PI / 2;
      button.position.set(0.006, y, 0.202);
      torso.add(button);
      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 4, 8), coatDarkMat);
      hole.position.set(0.006, y, 0.209);
      torso.add(hole);
    }

    // patch pockets with flaps
    for (const s of [-1, 1]) {
      const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.092, 0.022, 2, 0.014), coatDarkMat);
      pocket.position.set(s * 0.128, 0.245, 0.16);
      pocket.rotation.y = s * 0.58;
      pocket.rotation.x = -0.06;
      torso.add(pocket);
      const flap = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.032, 0.028, 2, 0.011), coatLightMat);
      flap.position.set(s * 0.127, 0.294, 0.168);
      flap.rotation.y = s * 0.58;
      flap.rotation.x = -0.1;
      torso.add(flap);
    }

    // chunky knit scarf wrapped at the neckline
    const scarfLoop = new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.042, 8, 26), scarfMat);
    scarfLoop.rotation.x = Math.PI / 2;
    scarfLoop.scale.y = 0.76;
    scarfLoop.position.y = 0.585;
    torso.add(scarfLoop);
    const scarfFold = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.065, 0.05, 2, 0.018), scarfMat);
    scarfFold.position.set(0.03, 0.578, 0.155);
    scarfFold.rotation.z = -0.08;
    torso.add(scarfFold);
    const scarfTail = new THREE.Mesh(new RoundedBoxGeometry(0.065, 0.27, 0.026, 3, 0.013), scarfMat);
    scarfTail.position.set(0.16, 0.46, -0.13);
    scarfTail.rotation.set(0.16, -0.25, -0.22);
    torso.add(scarfTail);
    for (let i = -1; i <= 1; i++) {
      const tassel = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.036, 3, 5), scarfLightMat);
      tassel.position.set(0.14 + i * 0.013, 0.312, -0.15);
      tassel.rotation.z = -0.2;
      torso.add(tassel);
    }

    // star pin
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(makeStarShape(0.036, 0.017), {
      depth: 0.012, bevelEnabled: false,
    }), goldMat);
    star.position.set(-0.094, 0.52, 0.152);
    star.rotation.x = -0.08;
    torso.add(star);

    // neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.13, 12), skinMat);
    neck.position.y = 0.66;
    torso.add(neck);
  }

  buildArms({ coatMat, creamMat, skinMat }) {
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.214, 1.085, 0.06);
      arm.rotation.z = side * 0.14;
      this.bodyGroup.add(arm);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 10), coatMat);
      shoulder.scale.set(1, 0.9, 0.95);
      arm.add(shoulder);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.05, 0.265, 12), coatMat);
      sleeve.position.y = -0.148;
      arm.add(sleeve);
      const wrinkle = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.009, 4, 12), coatMat);
      wrinkle.rotation.x = Math.PI / 2;
      wrinkle.position.y = -0.12;
      arm.add(wrinkle);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.05, 0.05, 12), creamMat);
      cuff.position.y = -0.292;
      arm.add(cuff);
      const cuffEdge = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.011, 5, 14), creamMat);
      cuffEdge.rotation.x = Math.PI / 2;
      cuffEdge.position.y = -0.318;
      arm.add(cuffEdge);

      const hand = new THREE.Group();
      hand.position.y = -0.35;
      arm.add(hand);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), skinMat);
      palm.scale.set(0.9, 1.08, 0.78);
      hand.add(palm);
      const fingers = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.055, 0.058, 3, 0.022), skinMat);
      fingers.position.set(0, -0.055, 0.008);
      hand.add(fingers);
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.036, 4, 6), skinMat);
      thumb.position.set(side * -0.044, -0.012, 0.024);
      thumb.rotation.z = side * 0.55;
      thumb.rotation.x = 0.2;
      hand.add(thumb);

      if (side < 0) this.armL = arm; else this.armR = arm;
    }
  }

  buildHead({
    skinMat, skinShadeMat, hairMat, hairDarkMat, hairLightMat, eyeWhiteMat,
    irisMat, irisDarkMat, pupilMat, lashMat, mouthMat, whiteHiMat, ribbonMat,
    ribbonDarkMat, goldMat,
  }) {
    const head = new THREE.Group();
    head.position.y = 1.335;
    this.bodyGroup.add(head);
    this.head = head;

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.248, 36, 26), skinMat);
    skull.scale.set(1, 1.02, 0.95);
    head.add(skull);

    // ears
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.047, 12, 9), skinMat);
      ear.position.set(s * 0.242, -0.012, -0.002);
      ear.scale.set(0.55, 0.95, 0.7);
      head.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), skinShadeMat);
      inner.position.set(s * 0.253, -0.012, 0.006);
      inner.scale.set(0.3, 0.7, 0.5);
      head.add(inner);
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), goldMat);
      stud.position.set(s * 0.257, -0.052, 0.004);
      head.add(stud);
    }

    /* ---------------- hair ---------------- */
    const hair = new THREE.Group();
    head.add(hair);
    this.hairGroup = hair;

    // crown cap
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.256, 32, 20, 0, TAU, 0, Math.PI * 0.48),
      hairMat,
    );
    cap.position.set(0, 0.014, -0.008);
    cap.scale.set(1.025, 1.05, 1.0);
    hair.add(cap);

    // back mass falling to the nape
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.252, 28, 22), hairMat);
    back.position.set(0, -0.028, -0.062);
    back.scale.set(1.0, 1.12, 0.82);
    hair.add(back);

    // side masses framing the face
    for (const s of [-1, 1]) {
      const sideMass = new THREE.Mesh(new THREE.SphereGeometry(0.112, 20, 16), hairMat);
      sideMass.position.set(s * 0.193, -0.062, -0.002);
      sideMass.scale.set(0.56, 1.28, 0.72);
      sideMass.rotation.z = s * 0.08;
      hair.add(sideMass);
      const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.15, 5, 8), hairMat);
      lock.position.set(s * 0.2, -0.13, 0.117);
      lock.scale.set(1, 1, 0.55);
      lock.rotation.z = s * -0.06;
      lock.rotation.x = 0.1;
      hair.add(lock);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.085, 7), hairDarkMat);
      tip.position.set(s * 0.195, -0.238, 0.127);
      tip.rotation.z = Math.PI + s * 0.1;
      tip.scale.z = 0.55;
      hair.add(tip);
      const sheen = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.11, 4, 6), hairLightMat);
      sheen.position.set(s * 0.2, -0.1, 0.15);
      sheen.rotation.z = s * -0.04;
      sheen.rotation.x = 0.12;
      sheen.scale.z = 0.5;
      hair.add(sheen);
    }

    // continuous fringe base, tucked under the styled locks
    const bangsBase = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 18), hairMat);
    bangsBase.position.set(0, 0.148, 0.075);
    bangsBase.scale.set(1.3, 0.7, 0.76);
    bangsBase.rotation.x = -0.12;
    hair.add(bangsBase);

    // soft overlapping fringe locks with tapered ends
    const fringeData = [
      [-0.168, 0.088, 0.168, 0.3, 0.9, 0.55],
      [-0.111, 0.104, 0.19, 0.16, 0.98, 0.28],
      [-0.054, 0.112, 0.201, 0.04, 0.94, 0.08],
      [0.002, 0.11, 0.204, -0.06, 1.02, -0.06],
      [0.058, 0.105, 0.2, -0.16, 0.96, -0.22],
      [0.113, 0.095, 0.188, -0.3, 0.9, -0.36],
      [0.164, 0.08, 0.164, -0.44, 0.8, -0.55],
    ];
    fringeData.forEach(([x, y, z, rz, scale, ry]) => {
      const strand = new THREE.Group();
      strand.position.set(x, y, z);
      strand.rotation.z = rz;
      strand.rotation.y = ry;
      strand.rotation.x = -0.14;
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.039, 14, 12), hairMat);
      body.scale.set(1.06, 1.55 * scale, 0.3);
      strand.add(body);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), hairMat);
      tip.position.set(0.004, -0.062 * scale, 0.002);
      tip.scale.set(0.9, 1.25, 0.3);
      strand.add(tip);
      hair.add(strand);
    });
    for (const [x, rz] of [[-0.13, 0.22], [-0.02, 0.03], [0.09, -0.18]]) {
      const groove = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.075, 3, 5), hairDarkMat);
      groove.position.set(x, 0.125, 0.196);
      groove.rotation.z = rz;
      groove.rotation.x = -0.12;
      groove.scale.z = 0.5;
      hair.add(groove);
    }

    // soft points along the hairline
    for (const [x, y, rz, scale] of [
      [-0.146, 0.05, 0.5, 0.85], [-0.088, 0.057, 0.2, 0.95],
      [-0.025, 0.052, 0.02, 0.88], [0.045, 0.058, -0.18, 1.0],
      [0.105, 0.05, -0.36, 0.9], [0.158, 0.042, -0.55, 0.8],
    ]) {
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), hairMat);
      tip.position.set(x, y, 0.192);
      tip.scale.set(0.9, 1.6 * scale, 0.32);
      tip.rotation.z = rz;
      tip.rotation.x = -0.12;
      hair.add(tip);
    }

    // fine highlight strands across the fringe
    for (const [x, rz] of [[-0.07, 0.16], [0.075, -0.2]]) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.085, 3, 5), hairLightMat);
      strand.position.set(x, 0.15, 0.201);
      strand.rotation.z = rz;
      strand.rotation.x = -0.1;
      strand.scale.z = 0.45;
      hair.add(strand);
    }

    // crown sheen along the parting
    const sheen = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.11, 4, 6), hairLightMat);
    sheen.position.set(-0.03, 0.222, 0.112);
    sheen.rotation.z = 0.35;
    sheen.rotation.x = -1.05;
    hair.add(sheen);

    // subtle strand sheen on the back of the head
    for (const [x, y, z, rz] of [[-0.13, -0.04, -0.235, 0.18], [0.01, -0.01, -0.258, -0.05], [0.135, -0.03, -0.23, -0.22]]) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.16, 4, 6), hairLightMat);
      strand.position.set(x, y, z);
      strand.rotation.z = rz;
      strand.rotation.x = 0.18;
      strand.scale.z = 0.5;
      hair.add(strand);
    }

    // twin low pigtails with ribbon ties
    this.pigtails = [];
    for (const s of [-1, 1]) {
      const root = new THREE.Group();
      root.position.set(s * 0.258, -0.012, -0.15);
      root.rotation.z = s * -0.34;
      root.rotation.x = -0.06;
      hair.add(root);

      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.015, 5, 12), ribbonMat);
      tie.rotation.x = Math.PI / 2;
      tie.position.set(s * 0.004, -0.018, 0.018);
      root.add(tie);
      for (const b of [-1, 1]) {
        const ribbonTail = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.07, 0.01, 2, 0.004), ribbonDarkMat);
        ribbonTail.position.set(b * 0.025, -0.07, 0.024);
        ribbonTail.rotation.z = b * 0.3 + s * 0.1;
        ribbonTail.rotation.x = 0.2;
        root.add(ribbonTail);
      }

      const tailGroup = new THREE.Group();
      tailGroup.position.set(s * 0.046, -0.042, 0.014);
      root.add(tailGroup);

      const segments = [
        [0.0, -0.05, 0, 0.076, 0.1, 0.062],
        [s * 0.034, -0.145, -0.002, 0.063, 0.098, 0.052],
        [s * 0.056, -0.24, 0.01, 0.05, 0.09, 0.042],
        [s * 0.05, -0.322, 0.03, 0.035, 0.075, 0.032],
      ];
      segments.forEach(([x, y, z, rx, ry, rz], i) => {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), i % 2 ? hairMat : hairLightMat);
        seg.position.set(x, y, z);
        seg.scale.set(rx, ry, rz);
        tailGroup.add(seg);
      });
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), hairLightMat);
      curl.position.set(s * 0.044, -0.388, 0.046);
      curl.scale.set(1.1, 0.75, 1.2);
      tailGroup.add(curl);

      this.pigtails.push({ root, tailGroup, side: s, baseRotZ: s * -0.34 });
    }

    /* ---------------- face ---------------- */
    const face = new THREE.Group();
    head.add(face);
    this.eyes = [];
    const eyeTex = eyeTexture();
    for (const s of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(s * 0.083, -0.02, 0.224);
      eye.rotation.y = s * 0.3;

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.084, 0.072), new THREE.MeshBasicMaterial({
        map: eyeTex, transparent: true, depthWrite: false, toneMapped: false,
      }));
      plane.renderOrder = 3;
      eye.add(plane);
      face.add(eye);
      this.eyes.push(eye);
    }

    // eyebrows
    for (const s of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.033, 4, 6), hairDarkMat);
      brow.position.set(s * 0.09, 0.073, 0.215);
      brow.rotation.z = s * (Math.PI / 2 - 0.16);
      brow.rotation.y = s * 0.25;
      face.add(brow);
    }

    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), skinShadeMat);
    nose.position.set(0, -0.066, 0.238);
    nose.scale.set(1, 0.7, 0.62);
    face.add(nose);

    // smile
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.054), new THREE.MeshBasicMaterial({
      map: mouthTexture(), transparent: true, depthWrite: false, toneMapped: false,
    }));
    mouth.position.set(0, -0.108, 0.219);
    mouth.rotation.x = -0.08;
    mouth.renderOrder = 3;
    face.add(mouth);

    // blush
    const blushTex = softDiscTexture(C.blush, 0.5);
    for (const s of [-1, 1]) {
      const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05), new THREE.MeshBasicMaterial({
        map: blushTex, transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false,
      }));
      blush.position.set(s * 0.149, -0.064, 0.188);
      blush.rotation.y = s * 0.62;
      blush.renderOrder = 1;
      face.add(blush);
    }

    // freckles
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 5, 4), skinShadeMat);
        f.position.set(s * (0.122 + i * 0.013), -0.044 - i * 0.006, 0.207);
        face.add(f);
      }
    }
  }

  buildBackpack({ packMat, packDarkMat, creamMat, scarfMat, goldMat }) {
    const pack = new THREE.Group();
    pack.position.set(0, 0.9, -0.205);
    this.bodyGroup.add(pack);

    const bag = new THREE.Mesh(new RoundedBoxGeometry(0.265, 0.3, 0.15, 4, 0.055), packMat);
    pack.add(bag);
    const flap = new THREE.Mesh(new RoundedBoxGeometry(0.275, 0.145, 0.17, 4, 0.05), packDarkMat);
    flap.position.set(0, 0.085, -0.002);
    pack.add(flap);
    const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.06, 0.022, 2, 0.008), goldMat);
    clasp.position.set(0, 0.015, -0.086);
    pack.add(clasp);
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.19, 0.11, 0.03, 2, 0.014), packDarkMat);
    pocket.position.set(0, -0.105, -0.077);
    pack.add(pocket);

    // rolled blanket
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.25, 12), scarfMat);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 0.195, -0.01);
    pack.add(roll);
    for (const s of [-1, 1]) {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.053, 0.007, 4, 12), creamMat);
      tie.rotation.x = Math.PI / 2;
      tie.position.set(s * 0.075, 0.195, -0.01);
      pack.add(tie);
    }

    // straps over the shoulders
    for (const s of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.31, 0.026), packDarkMat);
      strap.position.set(s * 0.115, 1.02, -0.115);
      strap.rotation.x = 0.16;
      strap.rotation.z = s * 0.05;
      this.bodyGroup.add(strap);

      const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.005, 4, 10), goldMat);
      buckle.position.set(s * 0.125, 0.94, 0.03);
      buckle.rotation.y = Math.PI / 2;
      this.bodyGroup.add(buckle);
    }

    // globe charm
    const charm = new THREE.Group();
    charm.position.set(0.155, -0.06, -0.03);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.1, 4), packDarkMat);
    string.position.y = -0.05;
    charm.add(string);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), new THREE.MeshStandardMaterial({
      color: '#79a8ba', roughness: 0.36, metalness: 0.08,
    }));
    globe.position.y = -0.125;
    charm.add(globe);
    const land = new THREE.Mesh(new THREE.SphereGeometry(0.0505, 14, 10, 0, Math.PI * 1.15, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({
      color: '#93ad6d', roughness: 0.7,
    }));
    land.position.y = -0.125;
    land.rotation.set(0.45, 0.75, 0.35);
    charm.add(land);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.0055, 4, 18), goldMat);
    ring.position.y = -0.125;
    ring.rotation.x = 0.35;
    charm.add(ring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), goldMat);
    cap.position.y = -0.07;
    charm.add(cap);
    pack.add(charm);
    this.charm = charm;
  }

  setTalking(on) {
    this.waveTarget = on ? 1 : 0;
  }

  setLook(x, y) {
    this.look.set(clamp(x, -1, 1), clamp(y, -1, 1));
  }

  update(dt, { moving = false, running = false, grounded = true, speed = 0 } = {}) {
    this.time += dt;
    const t = this.time;

    const targetState = !grounded ? 'air' : moving ? (running ? 'run' : 'walk') : 'idle';
    this.state = targetState;

    let legSwing = 0, armSwing = 0, bob = 0, lean = 0;
    if (targetState === 'walk' || targetState === 'run') {
      this.walkPhase += dt * (running ? 11.2 : 7.2);
      const swing = running ? 0.72 : 0.46;
      legSwing = Math.sin(this.walkPhase) * swing;
      armSwing = -Math.sin(this.walkPhase) * swing * 0.78;
      bob = Math.abs(Math.sin(this.walkPhase)) * (running ? 0.052 : 0.028);
      lean = running ? 0.115 : 0.035;
    } else if (targetState === 'air') {
      legSwing = 0.45;
      armSwing = -0.55;
      bob = 0.02;
    } else {
      this.walkPhase = 0;
      this.breathe += dt;
      bob = Math.sin(t * 1.7) * 0.006 + 0.005;
      armSwing = Math.sin(t * 1.3) * 0.025;
      lean = Math.sin(t * 1.05) * 0.006;
    }

    this.legL.rotation.x = grounded ? legSwing : 0.52;
    this.legR.rotation.x = grounded ? -legSwing : -0.22;
    this.legL.rotation.z = grounded ? 0.015 : 0.05;
    this.legR.rotation.z = grounded ? -0.015 : -0.05;

    this.armL.rotation.x = grounded ? armSwing : -0.75;
    this.armR.rotation.x = grounded ? -armSwing : -0.92;
    this.armL.rotation.z = -0.14 - (targetState === 'air' ? 0.42 : 0);
    this.armR.rotation.z = 0.14 + (targetState === 'air' ? 0.42 : 0);

    this.waveAmount = damp(this.waveAmount, this.waveTarget, 6, dt);
    if (this.waveAmount > 0.01) {
      const wave = Math.sin(t * 9) * 0.25 * this.waveAmount;
      this.armR.rotation.x = lerp(this.armR.rotation.x, -0.15, this.waveAmount);
      this.armR.rotation.z = lerp(this.armR.rotation.z, 2.1 + wave, this.waveAmount);
    }

    this.squash = damp(this.squash, 0, 10, dt);
    this.bodyGroup.position.y = this.baseY + bob + this.squash * -0.055;
    this.bodyGroup.rotation.x = damp(this.bodyGroup.rotation.x, lean, 8, dt);
    this.bodyGroup.rotation.z = Math.sin(this.walkPhase) * 0.018
      + (targetState === 'idle' ? Math.sin(t * 0.9) * 0.006 : 0);

    // head follow, with occasional glances and look-around when idle
    const walking = targetState === 'walk' || targetState === 'run';
    this.glanceTimer -= dt;
    if (this.glanceTimer <= 0) {
      this.glance.set((Math.random() * 2 - 1) * 0.55, (Math.random() * 2 - 1) * 0.3);
      this.glanceTimer = 2.8 + Math.random() * 4.5;
    }
    const lookX = this.look.x * 0.55 + this.glance.x * (targetState === 'idle' ? 0.5 : 0.15);
    const lookY = this.look.y * 0.4 + this.glance.y * (targetState === 'idle' ? 0.5 : 0.1);
    this.currentLook.lerp(new THREE.Vector2(lookX, lookY), 1 - Math.exp(-4.5 * dt));
    this.head.rotation.y = damp(this.head.rotation.y, this.currentLook.x * 0.6 - (walking ? Math.sin(this.walkPhase) * 0.025 : 0), 6, dt);
    this.head.rotation.x = damp(this.head.rotation.x, -this.currentLook.y * 0.28 + bob * 0.55, 6, dt);
    this.head.rotation.z = damp(this.head.rotation.z, walking ? Math.sin(this.walkPhase) * 0.025 : Math.sin(t * 0.8) * 0.014, 5, dt);

    // pigtails settle with movement
    for (const p of this.pigtails) {
      const sway = Math.sin(t * 2.0 + p.side * 1.2) * 0.045
        + Math.sin(this.walkPhase * 0.5) * (walking ? 0.07 : 0.012);
      p.root.rotation.z = p.baseRotZ + sway * p.side;
      p.root.rotation.x = damp(p.root.rotation.x, (walking ? 0.14 : 0.06) + Math.sin(t * 1.7 + p.side) * 0.035, 6, dt);
      p.tailGroup.rotation.x = damp(p.tailGroup.rotation.x, (targetState === 'air' ? -0.3 : walking ? -0.1 : 0) + Math.sin(t * 2.4 + p.side) * 0.05, 8, dt);
      p.tailGroup.rotation.z = Math.sin(t * 2.2 + p.side) * 0.04;
    }

    if (this.charm) {
      this.charm.rotation.z = Math.sin(t * 2.2) * 0.08 + (walking ? Math.sin(this.walkPhase) * 0.13 : 0);
      this.charm.rotation.x = Math.cos(t * 1.8) * 0.055;
    }

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkPhase < 0) {
      this.blinkPhase = 0;
      this.blinkTimer = 2.5 + Math.random() * 3.6;
    }
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt;
      const b = this.blinkPhase;
      let s = 1;
      if (b < 0.045) s = 1 - (b / 0.045) * 0.94;
      else if (b < 0.09) s = 0.06;
      else if (b < 0.15) s = 0.06 + ((b - 0.09) / 0.06) * 0.94;
      else { s = 1; this.blinkPhase = -1; }
      this.eyes.forEach((e) => { e.scale.y = s; });
    }

    this.shadow.position.y = 0.025;
    const shadowScale = clamp(1 - (this.root.position.y - this.baseY) * 0.26, 0.45, 1.1);
    this.shadow.scale.set(shadowScale, shadowScale, shadowScale);
    this.shadow.material.opacity = 0.28 * shadowScale;
  }

  land() {
    this.squash = 1;
  }

  faceTowards(yawTarget, dt) {
    let diff = yawTarget - this.root.rotation.y;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.root.rotation.y += diff * (1 - Math.exp(-12 * dt));
  }
}

/* ------------------------------------------------------------------ */
/*  paper plane companion                                              */
/* ------------------------------------------------------------------ */
export class PaperPlane {
  constructor() {
    this.root = new THREE.Group();
    const paper = new THREE.MeshStandardMaterial({
      color: '#fff8e8', roughness: 0.9, side: THREE.DoubleSide,
      emissive: '#ffdca8', emissiveIntensity: 0.08,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: '#e9705b', roughness: 0.85, side: THREE.DoubleSide,
    });
    const dark = new THREE.MeshBasicMaterial({ color: '#392b25' });

    const wing = new THREE.Group();
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, -0.52, 0.12, -0.24, 0, 0, -0.16,
    ], 3));
    lgeo.computeVertexNormals();
    const left = new THREE.Mesh(lgeo, paper);
    wing.add(left);
    const rgeo = new THREE.BufferGeometry();
    rgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, 0.52, 0.12, -0.24, 0, 0, -0.16,
    ], 3));
    rgeo.computeVertexNormals();
    const right = new THREE.Mesh(rgeo, paper);
    wing.add(right);

    const kgeo = new THREE.BufferGeometry();
    kgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, 0, -0.18, -0.18, 0, 0, -0.16,
    ], 3));
    kgeo.computeVertexNormals();
    const keel = new THREE.Mesh(kgeo, paper);
    wing.add(keel);

    const stripeGeo = new THREE.BufferGeometry();
    stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0.005, 0.32, -0.2, 0.055, -0.18, 0, 0.005, -0.11,
    ], 3));
    stripeGeo.computeVertexNormals();
    wing.add(new THREE.Mesh(stripeGeo, accent));

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), dark);
      eye.position.set(s * 0.055, 0.035, 0.11);
      eye.scale.set(0.8, 1.2, 0.5);
      wing.add(eye);
    }
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.12), accent);
    scarf.position.set(0, -0.02, -0.08);
    wing.add(scarf);

    this.wing = wing;
    this.root.add(wing);
    this.root.scale.setScalar(0.9);

    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,235,180,.5)');
        g.addColorStop(1, 'rgba(255,235,180,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c); return tex;
      })(),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.glow.scale.setScalar(1.3);
    this.root.add(this.glow);

    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.bob = Math.random() * TAU;
    this.faceYaw = 0;
    this.orbit = 0;
  }

  update(dt, cocoPos, cocoYaw, idleTime = 0) {
    this.bob += dt * 2.4;
    const back = new THREE.Vector3(Math.sin(cocoYaw), 0, Math.cos(cocoYaw)).multiplyScalar(0.85);
    const side = new THREE.Vector3(Math.cos(cocoYaw), 0, -Math.sin(cocoYaw)).multiplyScalar(0.75);
    const target = cocoPos.clone().add(back).add(side);
    target.y = cocoPos.y + 1.55 + Math.sin(this.bob) * 0.08;
    if (idleTime > 4) {
      this.orbit += dt * 0.4;
      target.x += Math.cos(this.orbit) * 0.6;
      target.z += Math.sin(this.orbit) * 0.6;
    }
    const k = 1 - Math.exp(-3.4 * dt);
    const prev = this.pos.clone();
    this.pos.lerp(target, k);
    this.root.position.copy(this.pos);
    this.vel.subVectors(this.pos, prev).divideScalar(Math.max(dt, 0.0001));

    const desiredYaw = Math.atan2(this.vel.x, this.vel.z);
    let diff = desiredYaw - this.faceYaw;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.faceYaw += diff * (1 - Math.exp(-6 * dt));
    this.wing.rotation.y = this.faceYaw;
    this.wing.rotation.z = -clamp(this.vel.x * 0.06, -0.4, 0.4);
    this.wing.rotation.x = Math.sin(this.bob * 1.5) * 0.06 + 0.08;
    const flap = Math.sin(this.bob * 3.2) * 0.5 + 0.5;
    this.root.scale.setScalar(0.9 + flap * 0.02);
    this.glow.material.opacity = 0.24 + flap * 0.12;
  }
}
