import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, canvas2d, canvasTexture, signTexture } from '../../core/utils.js';
import { createStairs } from '../props.js';

const vermilion = new THREE.MeshStandardMaterial({ color: '#bd4a38', roughness: 0.75 });
const vermilionDark = new THREE.MeshStandardMaterial({ color: '#93382b', roughness: 0.8 });
const plaster = new THREE.MeshStandardMaterial({ color: '#f3ead8', roughness: 0.95 });
const charcoal = new THREE.MeshStandardMaterial({ color: '#3c3b3a', roughness: 0.65, metalness: 0.15 });
const goldMat = new THREE.MeshStandardMaterial({ color: '#d6ab50', roughness: 0.35, metalness: 0.65 });
const stoneMat = new THREE.MeshStandardMaterial({ color: '#bcb19b', roughness: 0.95 });
const woodDark = new THREE.MeshStandardMaterial({ color: '#4f3b2d', roughness: 0.8 });

function latticeTexture() {
  const { c, ctx } = canvas2d(192, 256);
  ctx.fillStyle = '#4a3425'; ctx.fillRect(0, 0, 192, 256);
  ctx.strokeStyle = '#c69a58'; ctx.lineWidth = 3;
  for (let x = 0; x <= 192; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  for (let y = 0; y <= 256; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(192, y); ctx.stroke(); }
  ctx.fillStyle = '#7b5b3d';
  for (let x = 12; x < 192; x += 24) for (let y = 12; y < 256; y += 32) ctx.fillRect(x - 6, y - 8, 12, 16);
  return canvasTexture(c);
}

function bell() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.06, 8), goldMat);
  g.add(top);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.34, 10), goldMat);
  body.position.y = -0.18;
  g.add(body);
  const clap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshStandardMaterial({ color: '#8e7138', metalness: 0.6, roughness: 0.4 }));
  clap.position.y = -0.36;
  g.add(clap);
  return g;
}

export function createPagoda() {
  const group = new THREE.Group();
  const lat = latticeTexture();
  const lanterns = [];
  let lit = 0, litTarget = 0;

  // stone platform & steps
  const platform = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.8, 8.2), stoneMat);
  platform.position.y = 0.4;
  platform.receiveShadow = true;
  platform.castShadow = true;
  group.add(platform);
  const stairs = createStairs({ steps: 4, width: 3.6, rise: 0.2, run: 0.42, color: '#bcb19b' });
  stairs.group.position.set(0, 0, 5.2);
  group.add(stairs.group);

  let y = 0.8;
  const tiers = 5;
  const bodyH = 1.02;
  const roofH = 0.9;
  for (let i = 0; i < tiers; i++) {
    const w = 4.5 - i * 0.36;
    const tier = new THREE.Group();
    tier.position.y = y;
    group.add(tier);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, w), plaster);
    body.position.y = bodyH / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    tier.add(body);
    // red pillars
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, bodyH + 0.1, 8), vermilion);
      pillar.position.set(sx * w / 2, bodyH / 2, sz * w / 2);
      pillar.castShadow = true;
      tier.add(pillar);
    }
    // beams
    for (const yy of [0.12, bodyH - 0.1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, 0.14, w + 0.24), vermilion);
      beam.position.y = yy;
      tier.add(beam);
    }
    // doors
    for (let d = 0; d < 4; d++) {
      const door = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.44, bodyH * 0.7), new THREE.MeshStandardMaterial({ map: lat, roughness: 0.8 }));
      door.position.set(0, bodyH * 0.46, w / 2 + 0.011);
      const dg = new THREE.Group(); dg.add(door); dg.rotation.y = d * Math.PI / 2; tier.add(dg);
    }
    // balcony rails
    for (let rr = 0; rr < 4; rr++) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.06, 0.06), vermilionDark);
      rail.position.set(0, 0.3, w / 2 + 0.25);
      const rg = new THREE.Group(); rg.add(rail); rg.rotation.y = rr * Math.PI / 2; tier.add(rg);
      for (let p = 0; p < 5; p++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), vermilionDark);
        post.position.set(-w / 2 + p * (w / 4), 0.16, w / 2 + 0.25);
        const pg = new THREE.Group(); pg.add(post); pg.rotation.y = rr * Math.PI / 2; tier.add(pg);
      }
    }
    // roof
    const roofW = w + 1.5;
    const roofH = 1.05;
    const eave = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.22, 0.16, roofW + 0.22), charcoal);
    eave.position.y = bodyH + 0.1;
    eave.castShadow = true;
    eave.receiveShadow = true;
    tier.add(eave);
    const roofR = roofW / Math.SQRT2;
    const nextW = i < tiers - 1 ? 4.5 - (i + 1) * 0.36 : 0.16;
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(nextW / Math.SQRT2, roofR, roofH, 4), charcoal);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = bodyH + 0.18 + roofH / 2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    tier.add(roof);
    // hip ridges running from each eave corner to the storey above
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      const corner = new THREE.Vector3(Math.cos(a) * roofW * 0.5, bodyH + 0.17, Math.sin(a) * roofW * 0.5);
      const top = new THREE.Vector3(Math.cos(a) * nextW * 0.5, bodyH + 0.18 + roofH, Math.sin(a) * nextW * 0.5);
      const dir = top.clone().sub(corner);
      const len = dir.length();
      const hip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, len), charcoal);
      hip.position.copy(corner).add(top).multiplyScalar(0.5);
      hip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
      tier.add(hip);
    }
    // upturned corner horns + bells
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      const cx = Math.cos(a) * (roofW * 0.5 + 0.04);
      const cz = Math.sin(a) * (roofW * 0.5 + 0.04);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(cx * 0.9, bodyH + 0.06, cz * 0.9),
        new THREE.Vector3(cx * 1.02, bodyH + 0.16, cz * 1.02),
        new THREE.Vector3(cx * 1.08, bodyH + 0.5, cz * 1.08),
      );
      const horn = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.055, 5), charcoal);
      horn.castShadow = true;
      tier.add(horn);
      const b = bell();
      b.position.set(cx * 0.96, bodyH - 0.1, cz * 0.96);
      tier.add(b);
    }
    if (i === 0) {
      // hanging lanterns at the front
      for (const sx of [-1, 1]) {
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 10), new THREE.MeshStandardMaterial({
          color: '#e9705b', emissive: '#ff9a62', emissiveIntensity: 0.15, roughness: 0.7,
        }));
        lantern.position.set(sx * 1.2, bodyH + 0.06, w / 2 + 0.75);
        tier.add(lantern);
        lanterns.push(lantern);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 10), woodDark);
        cap.position.copy(lantern.position).y += 0.24;
        tier.add(cap);
        const cap2 = cap.clone(); cap2.position.y -= 0.48; tier.add(cap2);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 3), woodDark);
        rope.position.set(sx * 1.2, bodyH + 0.46, w / 2 + 0.75);
        tier.add(rope);
      }
    }
    y += bodyH + 0.18 + roofH;
  }

  // sorin spire
  const spire = new THREE.Group();
  spire.position.y = y - 0.2;
  group.add(spire);
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.26, 10), goldMat);
  spireBase.position.y = 0.13;
  spire.add(spireBase);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.5, 8), goldMat);
  mast.position.y = 1.25;
  spire.add(mast);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34 - i * 0.035, 0.04, 5, 16), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5 + i * 0.33;
    spire.add(ring);
  }
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({
    color: '#f0cf7a', emissive: '#e8b34d', emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.25,
  }));
  jewel.position.y = 2.62;
  spire.add(jewel);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.4, 6), goldMat);
  flame.position.y = 2.94;
  spire.add(flame);
  lanterns.push(jewel);

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  platform.castShadow = false;

  function setLit(on) { litTarget = on ? 1 : 0; }
  function update(dt, t) {
    lit += (litTarget - lit) * Math.min(1, dt * 1.4);
    lanterns.forEach((l, i) => {
      if (l.material.emissive) l.material.emissiveIntensity = 0.15 + lit * (1.3 + Math.sin(t * 2.5 + i) * 0.2);
    });
  }

  return {
    group,
    update,
    setLit,
    walkables: [platform, ...stairs.walkables],
    colliders: [{ type: 'circle', x: 0, z: 0, r: 3.2 }],
    anchor: new THREE.Vector3(0, 8, 0),
    heart: new THREE.Vector3(0, 1.4, 7.5),
  };
}

export function createTorii() {
  const group = new THREE.Group();
  const height = 6.0;
  for (const s of [-1, 1]) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.45, 10), stoneMat);
    stone.position.set(s * 3.0, 0.22, 0);
    group.add(stone);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, height, 12), vermilion);
    pillar.position.set(s * 3.0, height / 2 + 0.4, 0);
    pillar.rotation.z = s * -0.025;
    pillar.castShadow = true;
    group.add(pillar);
    const blackBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.35, 12), charcoal);
    blackBase.position.set(s * 3.0, 0.6, 0);
    group.add(blackBase);
  }
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.36, 0.42), vermilion);
  nuki.position.y = 4.5;
  nuki.castShadow = true;
  group.add(nuki);
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.36, 0.6), vermilion);
  kasagi.position.y = 5.75;
  kasagi.castShadow = true;
  group.add(kasagi);
  const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.2, 0.72), charcoal);
  kasagiTop.position.y = 6.0;
  group.add(kasagiTop);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 0.72), charcoal);
    tip.position.set(s * 5.1, 6.16, 0);
    tip.rotation.z = s * 0.12;
    group.add(tip);
  }
  const plaque = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.7, 0.2), charcoal);
  plaque.add(frame);
  const tex = (() => {
    const { c, ctx } = canvas2d(256, 340);
    ctx.fillStyle = '#4b3a2c'; ctx.fillRect(0, 0, 256, 340);
    ctx.strokeStyle = '#d6ab50'; ctx.lineWidth = 8; ctx.strokeRect(12, 12, 232, 316);
    ctx.fillStyle = '#efe2c9'; ctx.textAlign = 'center';
    ctx.font = 'bold 96px "Hiragino Mincho ProN", serif';
    ctx.fillText('浅', 128, 145);
    ctx.fillText('草', 128, 260);
    return canvasTexture(c);
  })();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  face.position.z = 0.105;
  plaque.add(face);
  plaque.position.set(0, 5.0, 0);
  group.add(plaque);

  // shimenawa rope + paper streamers
  const ropePts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    ropePts.push(new THREE.Vector3(-2.7 + t * 5.4, 4.9 - Math.sin(t * Math.PI) * 0.55, 0));
  }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts), 24, 0.1, 6), new THREE.MeshStandardMaterial({ color: '#d8c49b', roughness: 1 }));
  group.add(rope);
  for (const x of [-1.6, -0.4, 0.8, 1.9]) {
    const shide = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#fbf6e8', roughness: 0.9, side: THREE.DoubleSide });
    let yy = 0;
    for (let k = 0; k < 3; k++) {
      const zig = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), mat);
      zig.position.set(k % 2 ? 0.1 : -0.1, yy, 0);
      zig.rotation.z = k % 2 ? -0.2 : 0.2;
      shide.add(zig);
      yy -= 0.18;
    }
    shide.position.set(x, 4.4 - Math.abs(x) * 0.1, 0);
    group.add(shide);
  }

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    group,
    colliders: [
      { type: 'circle', x: -3.0, z: 0, r: 0.45 },
      { type: 'circle', x: 3.0, z: 0, r: 0.45 },
    ],
    anchor: new THREE.Vector3(0, 6, 0),
  };
}

export function createMtFuji() {
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(3.5, 78, 74, 72, 16, false);
  const pos = geo.attributes.position;
  const colors = [];
  const base = new THREE.Color('#55738a');
  const high = new THREE.Color('#8ca6b4');
  const snow = new THREE.Color('#f7f9f7');
  const snowShade = new THREE.Color('#dbe4e8');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const h = (y + 37) / 74;
    const a = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const n = Math.sin(a * 11 + h * 8) * 0.5 + Math.sin(a * 23 - h * 3) * 0.3 + Math.sin(a * 5 + h * 15) * 0.2;
    if (h > 0.05 && h < 0.98) {
      const scale = 1 + n * 0.035 * (1 - h);
      pos.setX(i, x * scale);
      pos.setZ(i, z * scale);
      pos.setY(i, y + n * 0.5);
    }
    const snowLine = 0.68 + Math.sin(a * 9) * 0.05 + Math.sin(a * 4 + 1) * 0.035;
    let c;
    if (h > snowLine) {
      c = snow.clone().lerp(snowShade, Math.abs(Math.sin(a * 13)) * 0.35);
    } else {
      c = base.clone().lerp(high, Math.min(1, h * 1.35));
      if (h > snowLine - 0.08) c.lerp(snow, (h - (snowLine - 0.08)) / 0.08 * 0.6);
      c.offsetHSL(0, 0, n * 0.02);
    }
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mountain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0, flatShading: false,
  }));
  mountain.position.y = -2;
  group.add(mountain);

  // foothills
  const hillMat = new THREE.MeshStandardMaterial({ color: '#69808c', roughness: 1, flatShading: true });
  for (const [x, z, s] of [[-95, 25, 46], [95, 18, 38], [-45, 55, 28]]) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.5, 24, 1), hillMat);
    hill.position.set(x, -6, z);
    group.add(hill);
  }
  return { group };
}

export function createArc() {
  const group = new THREE.Group();
  const W = 12.4, H = 9.4, D = 4.6, AW = 4.9, AH = 6.7;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.lineTo(W / 2, 0);
  shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-AW / 2, 0);
  hole.lineTo(-AW / 2, AH - AW / 2);
  hole.absarc(0, AH - AW / 2, AW / 2, Math.PI, 0, true);
  hole.lineTo(AW / 2, 0);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: D, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.15, bevelThickness: 0.14, curveSegments: 24,
  });
  geo.translate(0, 0.6, -D / 2);
  const mat = new THREE.MeshStandardMaterial({ color: '#d8c9ae', roughness: 0.9 });
  const body = new THREE.Mesh(geo, mat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // plinth
  addBox(group, W + 1.2, 0.8, D + 1.2, new THREE.MeshStandardMaterial({ color: '#c0b198', roughness: 0.95 }), [0, 0.4, 0]);
  // cornices
  for (const [y, w, h] of [[8.6, W + 1.4, 0.5], [9.5, W + 1.0, 0.35], [10.3, W + 0.7, 0.45]]) {
    addBox(group, w, h, D + 0.8, mat, [0, y, 0]);
  }
  // attic frieze
  addBox(group, W + 0.4, 0.75, D + 0.4, new THREE.MeshStandardMaterial({ color: '#e3d6c0', roughness: 0.9 }), [0, 10.9, 0]);
  // roof balustrade
  for (let i = 0; i < 14; i++) {
    const x = -W / 2 + (i / 13) * W;
    addBox(group, 0.16, 0.55, 0.16, mat, [x, 11.55, D / 2 - 0.2]);
    addBox(group, 0.16, 0.55, 0.16, mat, [x, 11.55, -D / 2 + 0.2]);
  }
  addBox(group, W + 0.4, 0.14, 0.22, mat, [0, 11.85, D / 2 - 0.2]);
  addBox(group, W + 0.4, 0.14, 0.22, mat, [0, 11.85, -D / 2 + 0.2]);
  addBox(group, W + 0.4, 0.25, D + 0.4, mat, [0, 11.4, 0]);

  // frieze text
  const friezeTex = (() => {
    const { c, ctx } = canvas2d(1024, 128);
    ctx.clearRect(0, 0, 1024, 128);
    ctx.fillStyle = 'rgba(95,78,58,.55)';
    ctx.textAlign = 'center';
    ctx.font = '36px Georgia';
    ctx.fillText('ARC DE TRIOMPHE', 512, 78);
    ctx.font = '20px Georgia';
    ctx.globalAlpha = 0.55;
    ctx.fillText('1852 · LA GRANDE ARMÉE', 512, 112);
    return canvasTexture(c);
  })();
  for (const s of [-1, 1]) {
    const frieze = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.8), new THREE.MeshBasicMaterial({
      map: friezeTex, transparent: true, depthWrite: false,
    }));
    frieze.position.set(0, 10.9, s * (D / 2 + 0.23));
    if (s < 0) frieze.rotation.y = Math.PI;
    group.add(frieze);
  }

  // relief panels with wreaths
  const reliefMat = new THREE.MeshStandardMaterial({ color: '#b09a78', roughness: 0.9 });
  const darkRelief = new THREE.MeshStandardMaterial({ color: '#8a7558', roughness: 0.9 });
  const wreathMat = new THREE.MeshStandardMaterial({ color: '#7f9275', roughness: 0.6, metalness: 0.2 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * 4.15;
      const panel = new THREE.Mesh(new RoundedBoxGeometry(2.6, 3.6, 0.18, 2, 0.05), reliefMat);
      panel.position.set(px, 4.6, sz * (D / 2 + 0.08));
      group.add(panel);
      const inset = new THREE.Mesh(new RoundedBoxGeometry(2.2, 3.2, 0.08, 2, 0.04), darkRelief);
      inset.position.set(px, 4.6, sz * (D / 2 + 0.19));
      group.add(inset);
      const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.11, 6, 20), wreathMat);
      wreath.position.set(px, 5.4, sz * (D / 2 + 0.25));
      group.add(wreath);
      const figure = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.8, 4, 8), reliefMat);
      figure.position.set(px, 3.95, sz * (D / 2 + 0.25));
      figure.scale.z = 0.3;
      group.add(figure);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), reliefMat);
      head.position.set(px, 4.7, sz * (D / 2 + 0.28));
      group.add(head);
      if (sz < 0) { panel.rotation.y = Math.PI; inset.rotation.y = Math.PI; }
    }
  }

  // coffer ceiling under the arch
  const cofferMat = new THREE.MeshStandardMaterial({ color: '#c8b99f', roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), cofferMat);
      cell.position.set(-1.6 + i * 0.8, 6.75 + (j === 0 ? 0 : 0.5), 0);
      group.add(cell);
    }
  }

  // eternal flame
  const flameGroup = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 0.3, 12), new THREE.MeshStandardMaterial({ color: '#a98045', metalness: 0.7, roughness: 0.35 }));
  flameGroup.add(bowl);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 7), new THREE.MeshStandardMaterial({
    color: '#ffd27a', emissive: '#ff9e40', emissiveIntensity: 2.2, roughness: 0.4,
  }));
  flame.position.y = 0.42;
  flameGroup.add(flame);
  flameGroup.position.set(0, 0.9, 0);
  group.add(flameGroup);
  const flameLight = new THREE.PointLight(0xffa95e, 6, 8, 2);
  flameLight.position.set(0, 1.6, 0);
  group.add(flameLight);

  // flags on top
  for (const sx of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), new THREE.MeshStandardMaterial({ color: '#d5cdbd', metalness: 0.4, roughness: 0.4 }));
    pole.position.set(sx * 4.8, 12.0, 0);
    group.add(pole);
    const tex = (() => {
      const { c, ctx } = canvas2d(192, 128);
      ctx.fillStyle = '#3e5c8f'; ctx.fillRect(0, 0, 64, 128);
      ctx.fillStyle = '#f8f3e8'; ctx.fillRect(64, 0, 64, 128);
      ctx.fillStyle = '#c9554c'; ctx.fillRect(128, 0, 64, 128);
      return canvasTexture(c);
    })();
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.65), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.position.set(sx * 4.8 + 0.5, 12.6, 0);
    group.add(flag);
  }

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  function update(dt, t) {
    flame.scale.y = 1 + Math.sin(t * 8) * 0.12;
    flameLight.intensity = 5 + Math.sin(t * 7) * 1.2;
  }

  return {
    group,
    update,
    colliders: [
      { type: 'box', x: -4.25, z: 0, w: 3.9, d: D + 0.6 },
      { type: 'box', x: 4.25, z: 0, w: 3.9, d: D + 0.6 },
      { type: 'circle', x: 0, z: 0, r: 0.8 },
    ],
    anchor: new THREE.Vector3(0, 7, 0),
  };
}

function addBox(parent, w, h, d, mat, pos) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(pos[0], pos[1], pos[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
