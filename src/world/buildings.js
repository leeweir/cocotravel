import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas2d, canvasTexture, mulberry32, TAU } from '../core/utils.js';

const S = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...opts });

const PALETTES = {
  brownstone: {
    wall: '#9a6b50', trim: '#d8c1a0', roof: '#57483f', glass: '#2c3740', lit: '#f2ca86',
  },
  brick: {
    wall: '#a37055', trim: '#e0cfb4', roof: '#6b5444', glass: '#2a363f', lit: '#f4cf8c',
  },
  limestone: {
    wall: '#c8baa2', trim: '#e7dbc7', roof: '#6a6359', glass: '#32414a', lit: '#f6d79c',
  },
  office: {
    wall: '#7d8b95', trim: '#aab5bc', roof: '#4e5a62', glass: '#283842', lit: '#f5d89b',
  },
  haussmann: {
    wall: '#d8c8ac', trim: '#f0e5d1', roof: '#596266', glass: '#33434b', lit: '#f7d399',
  },
  tokyo: {
    wall: '#b9b2a4', trim: '#ded6c7', roof: '#5a5c58', glass: '#2d3c43', lit: '#ffd699',
  },
  deco: {
    wall: '#b5a58d', trim: '#dbcfba', roof: '#5f5b52', glass: '#2e3c43', lit: '#f6d49a',
  },
};

function paintBrick(ctx, w, h, color, seed = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  ctx.strokeStyle = 'rgba(58,38,28,.11)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
    const offset = (Math.floor(y / 9) % 2) * 11;
    for (let x = -offset; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y + 9);
      ctx.stroke();
    }
  }
  for (let i = 0; i < Math.floor(w * h / 700); i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,246,230' : '54,38,30'},${0.03 + r() * 0.045})`;
    ctx.fillRect(r() * w, r() * h, 3 + r() * 9, 2 + r() * 5);
  }
}

function drawWindow(ctx, x, y, w, h, {
  style, lit, seed, trim, glass, litColor, floorIndex, bayIndex,
}) {
  const r = mulberry32(seed);
  // stone surround
  ctx.fillStyle = trim;
  ctx.fillRect(x - 5, y - 6, w + 10, h + 12);
  // recess
  ctx.fillStyle = 'rgba(38,30,24,.28)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  if (lit) {
    g.addColorStop(0, litColor);
    g.addColorStop(0.55, '#f6d59a');
    g.addColorStop(1, '#c8915b');
  } else {
    g.addColorStop(0, '#526873');
    g.addColorStop(0.45, glass);
    g.addColorStop(1, '#1c272e');
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  if (!lit) {
    ctx.fillStyle = 'rgba(196,220,230,.12)';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.42);
    ctx.lineTo(x + w * 0.7, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.25, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  } else {
    // curtains + warm interior depth
    ctx.fillStyle = 'rgba(255,245,214,.5)';
    ctx.fillRect(x + 2, y + 2, w * 0.22, h - 4);
    ctx.fillStyle = 'rgba(132,79,44,.22)';
    ctx.fillRect(x + w * 0.7, y + 3, w * 0.26, h - 6);
    if (r() > 0.6) {
      ctx.fillStyle = 'rgba(74,48,34,.35)';
      ctx.fillRect(x + w * 0.32, y + h * 0.42, w * 0.34, h * 0.4);
    }
  }

  // mullions
  ctx.strokeStyle = style === 'office' ? 'rgba(220,229,232,.6)' : 'rgba(245,238,224,.66)';
  ctx.lineWidth = style === 'office' ? 2 : 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h * 0.46);
  ctx.lineTo(x + w, y + h * 0.46);
  ctx.stroke();

  // sill
  ctx.fillStyle = trim;
  ctx.fillRect(x - 8, y + h + 4, w + 16, 5);
  ctx.fillStyle = 'rgba(42,32,25,.18)';
  ctx.fillRect(x - 8, y + h + 9, w + 16, 2);

  if (style === 'brownstone' && floorIndex > 0) {
    ctx.fillStyle = trim;
    ctx.fillRect(x - 8, y - 14, w + 16, 6);
    ctx.fillStyle = 'rgba(47,36,28,.16)';
    ctx.fillRect(x - 8, y - 8, w + 16, 2);
  }

  if (style === 'haussmann') {
    // wrought iron balcony
    ctx.strokeStyle = 'rgba(37,42,40,.88)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + h * 0.66);
    ctx.lineTo(x + w + 9, y + h * 0.66);
    ctx.stroke();
    for (let i = 0; i <= 6; i++) {
      const bx = x - 9 + ((w + 18) / 6) * i;
      ctx.beginPath();
      ctx.moveTo(bx, y + h * 0.66);
      ctx.lineTo(bx, y + h + 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(54,42,32,.25)';
    ctx.fillRect(x - 10, y + h * 0.61, w + 20, 3);
    if (bayIndex % 2 === 0) {
      ctx.fillStyle = '#6e8a58';
      ctx.fillRect(x + 2, y + h * 0.73, w - 4, 5);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ['#d9776f', '#e7b96a', '#e8d5c0'][i % 3];
        ctx.beginPath();
        ctx.arc(x + 6 + (w - 12) * (i / 3), y + h * 0.73, 2.8, 0, TAU);
        ctx.fill();
      }
    }
  }

  if (style === 'tokyo') {
    ctx.strokeStyle = 'rgba(240,238,229,.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h * 0.7);
    ctx.lineTo(x + w + 4, y + h * 0.7);
    ctx.stroke();
    if (r() > 0.55) {
      ctx.fillStyle = '#d8d4c8';
      ctx.fillRect(x + w * 0.62, y + h + 6, w * 0.26, h * 0.16);
      ctx.strokeStyle = 'rgba(40,42,40,.35)';
      ctx.strokeRect(x + w * 0.62, y + h + 6, w * 0.26, h * 0.16);
    }
  }

  if (style === 'office') {
    ctx.fillStyle = 'rgba(25,37,45,.55)';
    ctx.fillRect(x - 5, y + h + 9, w + 10, 6);
  }

  // occasional air conditioner
  if (!lit && r() > 0.72) {
    ctx.fillStyle = '#c8c4b7';
    ctx.fillRect(x + w * 0.58, y + h - 8, w * 0.3, 8);
    ctx.fillStyle = 'rgba(36,40,40,.4)';
    ctx.fillRect(x + w * 0.6, y + h - 6, w * 0.25, 2);
  }
}

export function createFacadeTexture({
  style = 'brownstone', bays = 3, floors = 4, seed = 1,
  wall, trim, glass, litColor, litChance = 0.28, shop = false,
} = {}) {
  const palette = PALETTES[style] || PALETTES.brownstone;
  const wallColor = wall || palette.wall;
  const trimColor = trim || palette.trim;
  const glassColor = glass || palette.glass;
  const warm = litColor || palette.lit;
  const bayPx = 76;
  const floorPx = 78;
  const w = Math.max(96, Math.round(bays * bayPx));
  const h = Math.max(150, Math.round(floors * floorPx));
  const { c, ctx } = canvas2d(w, h);
  const r = mulberry32(seed * 97 + 13);

  paintBrick(ctx, w, h, wallColor, seed);
  // subtle vertical gradient: darker plinth, sunlit top
  const grad = ctx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, 'rgba(48,35,27,.22)');
  grad.addColorStop(0.25, 'rgba(48,35,27,0)');
  grad.addColorStop(1, 'rgba(255,248,232,.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (style === 'haussmann') {
    ctx.fillStyle = 'rgba(255,250,236,.35)';
    for (let y = 0; y < h; y += floorPx) ctx.fillRect(0, y, w, 3);
    ctx.strokeStyle = 'rgba(100,84,64,.15)';
    ctx.lineWidth = 2;
    for (let y = 14; y < h; y += 26) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
  if (style === 'office') {
    ctx.fillStyle = 'rgba(228,235,238,.14)';
    for (let y = 0; y < h; y += floorPx) ctx.fillRect(0, y + floorPx * 0.82, w, 4);
    ctx.fillStyle = 'rgba(38,51,60,.18)';
    for (let x = 0; x < w; x += bayPx) ctx.fillRect(x, 0, 3, h);
  }
  if (style === 'deco') {
    ctx.fillStyle = 'rgba(80,68,52,.13)';
    for (let x = 0; x < w; x += bayPx) ctx.fillRect(x + bayPx * 0.44, 0, 5, h);
  }

  for (let f = 0; f < floors; f++) {
    const rowY = h - (f + 1) * floorPx;
    const isGround = f === 0 && shop;
    for (let b = 0; b < bays; b++) {
      const bx = b * bayPx;
      if (isGround) {
        // shop glazing
        const sw = bayPx * 0.8;
        const sx = bx + (bayPx - sw) / 2;
        const sy = rowY + floorPx * 0.25;
        const sh = floorPx * 0.62;
        ctx.fillStyle = '#2c3a38';
        ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
        const sg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
        sg.addColorStop(0, '#4e6863');
        sg.addColorStop(0.5, '#f4cf8e');
        sg.addColorStop(1, '#8b6a43');
        ctx.fillStyle = sg;
        ctx.fillRect(sx, sy, sw, sh);
        ctx.fillStyle = 'rgba(46,64,60,.55)';
        for (let i = 0; i < 4; i++) ctx.fillRect(sx + (sw / 4) * i - 1, sy, 3, sh);
        ctx.fillStyle = 'rgba(255,244,214,.35)';
        ctx.fillRect(sx + 4, sy + 4, sw * 0.24, sh - 8);
        if (b === Math.floor(bays / 2)) {
          ctx.fillStyle = '#d9c8a8';
          ctx.fillRect(sx + sw * 0.36, sy + sh + 6, sw * 0.28, 5);
        }
        continue;
      }
      let winW = bayPx * 0.5;
      let winH = floorPx * 0.56;
      if (style === 'office') { winW = bayPx * 0.7; winH = floorPx * 0.62; }
      if (style === 'haussmann') { winW = bayPx * 0.46; winH = floorPx * 0.68; }
      if (style === 'tokyo') { winW = bayPx * 0.58; winH = floorPx * 0.54; }
      if (style === 'deco') { winW = bayPx * 0.38; winH = floorPx * 0.66; }
      if (style === 'brownstone' && b === 0 && f === 0) continue;
      const winX = bx + (bayPx - winW) / 2;
      const winY = rowY + floorPx * (style === 'haussmann' ? 0.16 : 0.2);
      const lit = r() < litChance;
      drawWindow(ctx, winX, winY, winW, winH, {
        style, lit, seed: seed * 89 + f * 31 + b * 7, trim: trimColor,
        glass: glassColor, litColor: warm, floorIndex: f, bayIndex: b,
      });
    }
    if (style === 'brownstone' || style === 'limestone') {
      ctx.fillStyle = 'rgba(238,226,204,.3)';
      ctx.fillRect(0, rowY, w, 2);
    }
  }

  // cornice shadow at the very top
  ctx.fillStyle = 'rgba(38,29,23,.25)';
  ctx.fillRect(0, 0, w, 5);

  const tex = canvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function frustumGeometry(wb, db, wt, dt, h) {
  const hw = wb / 2, hd = db / 2, tw = wt / 2, td = dt / 2;
  const pos = [
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd,
    -tw, h, -td, tw, h, -td, tw, h, td, -tw, h, td,
  ];
  const idx = [
    0, 1, 4, 1, 5, 4,
    1, 2, 5, 2, 6, 5,
    2, 3, 6, 3, 7, 6,
    3, 0, 7, 0, 4, 7,
    4, 5, 7, 5, 6, 7,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ */
/*  shared detailing                                                   */
/* ------------------------------------------------------------------ */
const railingCache = new Map();

export function ironRailingMaterial() {
  if (railingCache.has('mat')) return railingCache.get('mat').clone();
  const { c, ctx } = canvas2d(512, 128);
  ctx.clearRect(0, 0, 512, 128);
  ctx.strokeStyle = '#2f3838';
  ctx.fillStyle = '#2f3838';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(512, 10); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 114); ctx.lineTo(512, 114); ctx.stroke();
  for (let x = 10; x < 512; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, 116);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, 14);
    ctx.lineTo(x, 2);
    ctx.lineTo(x + 5, 14);
    ctx.fill();
  }
  const tex = canvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide,
    roughness: 0.6, metalness: 0.35, color: '#4a4f4c',
  });
  railingCache.set('mat', mat);
  return mat.clone();
}

export function addIronRailing(parent, width, height, { x = 0, y = 0, z = 0, rotation = 0, repeat = 4 } = {}) {
  const mat = ironRailingMaterial();
  if (mat.map) {
    mat.map = mat.map.clone();
    mat.map.needsUpdate = true;
    mat.map.repeat.set(repeat, 1);
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotation;
  parent.add(mesh);
  return mesh;
}

export function addFlowerBox(parent, width, { x = 0, y = 0, z = 0 } = {}) {
  const box = new THREE.Mesh(
    new RoundedBoxGeometry(width, 0.22, 0.28, 2, 0.04),
    S('#5f6e4f', { roughness: 0.9 }),
  );
  box.position.set(x, y, z);
  box.castShadow = true;
  parent.add(box);
  const r = mulberry32(Math.round((x + z) * 100) + 3);
  const colors = ['#d96f6a', '#e8b45c', '#f1d9d2', '#bf6b86'];
  for (let i = 0; i < Math.max(3, Math.floor(width / 0.32)); i++) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), S(colors[i % colors.length], { roughness: 0.75 }));
    flower.position.set(x - width / 2 + 0.2 + (width - 0.4) * (i / Math.max(1, Math.floor(width / 0.32) - 1)), y + 0.14, z + (r() - 0.5) * 0.1);
    parent.add(flower);
  }
  return box;
}

export function createShopSign(text, {
  bg = '#243b36', fg = '#f4e4c2', accent = '#d3a44e', w = 512, h = 128,
  font = '"Avenir Next", "Trebuchet MS", sans-serif', size = 58, border = true,
} = {}) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (border) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${size}px ${font}`;
  ctx.fillText(text, w / 2, h * 0.54);
  const tex = canvasTexture(c);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 });
}

export function createNeonSign(text, {
  bg = '#1d2b2d', fg = '#ffd27a', accent = '#f28b66', vertical = true,
  w = 128, h = 512,
} = {}) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 62px "Hiragino Sans GB", "PingFang SC", sans-serif';
  const chars = [...text];
  chars.forEach((ch, i) => {
    ctx.fillText(ch, w / 2, (h / (chars.length + 1)) * (i + 1));
  });
  const tex = canvasTexture(c);
  return new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.55, emissive: new THREE.Color(fg), emissiveIntensity: 0.22,
  });
}

export function createWaterTower() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a6846', roughness: 0.92, map: null });
  const dark = S('#574535', { roughness: 0.9 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.16, 2.1, 16), wood);
  tank.position.y = 2.55;
  tank.castShadow = true;
  group.add(tank);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.72, 16), dark);
  roof.position.y = 3.92;
  roof.castShadow = true;
  group.add(roof);
  for (const y of [1.95, 2.55, 3.15]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.045, 5, 22), dark);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = y;
    group.add(hoop);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.55, 0.12), dark);
    leg.position.set(Math.cos(a) * 0.8, 0.78, Math.sin(a) * 0.8);
    group.add(leg);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.0, 0.07), dark);
    brace.position.set(Math.cos(a) * 0.55, 0.9, Math.sin(a) * 0.55);
    brace.rotation.z = Math.cos(a) * 0.3;
    brace.rotation.x = Math.sin(a) * 0.3;
    group.add(brace);
  }
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.06), dark);
  ladder.position.set(0.98, 1.55, 0);
  group.add(ladder);
  return group;
}

function addFireEscape(group, width, depth, floors, floorHeight) {
  const dark = S('#3e4546', { roughness: 0.7, metalness: 0.35 });
  const z = depth / 2 + 0.55;
  const pw = Math.min(3.6, width * 0.46);
  for (let f = 1; f < floors; f++) {
    const y = f * floorHeight + 0.08;
    const x = (f % 2 ? 1 : -1) * width * 0.12;
    const platform = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.07, 1.15), dark);
    platform.position.set(x, y, z);
    platform.castShadow = true;
    group.add(platform);
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.05, 0.05), dark);
      rail.position.set(x, y + 0.78, z + s * 0.55);
      group.add(rail);
      for (let k = 0; k <= 4; k++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.78, 0.035), dark);
        post.position.set(x - pw / 2 + (pw / 4) * k, y + 0.39, z + s * 0.55);
        group.add(post);
      }
    }
    for (const s of [-1, 1]) {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.1), dark);
      sideRail.position.set(x + s * pw / 2, y + 0.78, z);
      group.add(sideRail);
    }
    if (f < floors - 1) {
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, floorHeight * 0.9), dark);
      ladder.position.set(x + (f % 2 ? -0.55 : 0.55), y + floorHeight * 0.32, z + 0.42);
      ladder.rotation.x = -0.58;
      group.add(ladder);
      const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, floorHeight * 0.9), dark);
      side1.position.set(ladder.position.x - 0.24, ladder.position.y + 0.02, ladder.position.z);
      side1.rotation.x = -0.58;
      group.add(side1);
      const side2 = side1.clone();
      side2.position.x += 0.48;
      group.add(side2);
    }
  }
  const hoist = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), dark);
  hoist.position.set(-width * 0.3, floors * floorHeight - 1.1, z + 0.4);
  group.add(hoist);
}

function addStoop(group, width, depth, floorHeight, trim) {
  const stone = S(trim, { roughness: 0.94 });
  const steps = 4;
  const stairW = Math.min(2.0, width * 0.34);
  for (let i = 0; i < steps; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.18, 0.42 + i * 0.2), stone);
    step.position.set(0, 0.09 + i * 0.18, depth / 2 + 1.15 - i * 0.1);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 1.8), S('#3b3b34'));
    rail.position.set(s * stairW / 2, 0.72, depth / 2 + 0.75);
    rail.rotation.x = 0.32;
    group.add(rail);
  }
  const door = new THREE.Mesh(new RoundedBoxGeometry(1.18, 2.2, 0.16, 3, 0.06), S('#4b3b30', { roughness: 0.82 }));
  door.position.set(0, 1.82, depth / 2 + 0.04);
  group.add(door);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.2, 14, 1, false, 0, Math.PI), stone);
  arch.rotation.set(Math.PI / 2, 0, 0);
  arch.position.set(0, 2.92, depth / 2 + 0.03);
  group.add(arch);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({
    color: '#ffe8b8', emissive: '#ffc46a', emissiveIntensity: 0.4, roughness: 0.4,
  }));
  lamp.position.set(0.82, 2.55, depth / 2 + 0.2);
  group.add(lamp);
}

function addStorefront(group, width, depth, floorHeight, {
  awningColor = '#b85145', signText = '', signBg = '#233934', signFg = '#f4e4c2',
  neon = false, verticalSign = false,
}) {
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.82, floorHeight * 0.68),
    new THREE.MeshStandardMaterial({
      color: '#37504c', roughness: 0.25, metalness: 0.25,
      emissive: '#e7b86a', emissiveIntensity: 0.12,
    }),
  );
  glass.position.set(0, floorHeight * 0.42, depth / 2 + 0.02);
  group.add(glass);
  for (let i = 1; i < 4; i++) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, floorHeight * 0.68, 0.07), S('#d9cbb1'));
    mullion.position.set(-width * 0.41 + (width * 0.82 / 4) * i, floorHeight * 0.42, depth / 2 + 0.06);
    group.add(mullion);
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.16, 0.12), S('#d9cbb1'));
  frame.position.set(0, floorHeight * 0.77, depth / 2 + 0.04);
  group.add(frame);

  if (signText) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.5, floorHeight * 0.22), createShopSign(signText, {
      bg: signBg, fg: signFg,
    }));
    sign.position.set(0, floorHeight * 0.87, depth / 2 + 0.06);
    group.add(sign);
  }

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.8, 0.07, 1.0),
    new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.92 }),
  );
  awning.position.set(0, floorHeight * 0.72, depth / 2 + 0.52);
  awning.rotation.x = 0.18;
  awning.castShadow = true;
  group.add(awning);
  for (const s of [-1, 1]) {
    const valance = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 1.0), S(awningColor));
    valance.position.set((width * 0.8 / 2 - 0.02) * s, floorHeight * 0.72 - 0.15, depth / 2 + 0.52);
    group.add(valance);
  }

  if (verticalSign) {
    const mat = createNeonSign('咖啡', { bg: '#22302e', fg: neon ? '#ffd27a' : '#f1e3c4' });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, 0.14), [
      S('#2c3a37'), S('#2c3a37'), S('#2c3a37'), S('#2c3a37'), mat, S('#2c3a37'),
    ]);
    board.position.set(width / 2 + 0.05, floorHeight + 1.3, depth / 2 + 0.35);
    board.castShadow = true;
    group.add(board);
  }
}

function addRooftop(group, width, depth, height, seed, {
  style, waterTank, roofMat, trimColor,
}) {
  const r = mulberry32(seed * 7 + 5);
  const parapet = S(trimColor, { roughness: 0.9 });
  const front = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.5, 0.24), parapet);
  front.position.set(0, height + 0.25, depth / 2 + 0.03);
  front.castShadow = true;
  group.add(front);
  const back = front.clone();
  back.position.z = -depth / 2 - 0.03;
  group.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, depth + 0.3), parapet);
    side.position.set(s * (width / 2 + 0.03), height + 0.25, 0);
    side.castShadow = true;
    group.add(side);
  }
  const roof = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
    S(roofMat, { roughness: 0.97, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = height + 0.012;
  roof.receiveShadow = true;
  group.add(roof);

  const units = 1 + Math.floor(r() * 2);
  for (let i = 0; i < units; i++) {
    const w = 1 + r() * 1.4;
    const d = 0.8 + r() * 1.1;
    const hv = 0.7 + r() * 0.5;
    const unit = new THREE.Mesh(new THREE.BoxGeometry(w, hv, d), S('#8d918c', { roughness: 0.86 }));
    unit.position.set((r() - 0.5) * width * 0.5, height + hv / 2, (r() - 0.5) * depth * 0.45);
    unit.castShadow = true;
    unit.receiveShadow = true;
    group.add(unit);
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.22, w * 0.22, 0.08, 12), S('#4c5352'));
    fan.position.set(unit.position.x, unit.position.y + hv / 2 + 0.05, unit.position.z);
    group.add(fan);
  }
  if (waterTank) {
    const tank = createWaterTower();
    tank.position.set((r() - 0.5) * width * 0.4, height + 0.02, -depth * 0.16);
    tank.scale.setScalar(0.8 + r() * 0.28);
    group.add(tank);
  }
  if (style === 'office' || style === 'deco' || r() > 0.55) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5 + r() * 4, 5), S('#5a6062'));
    mast.position.set(width * 0.18 * (r() - 0.5), height + 1.25 + r() * 2, -depth * 0.1);
    group.add(mast);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: '#e0604c' }));
    beacon.position.set(mast.position.x, mast.position.y + (2.5 + r() * 4) / 2, mast.position.z);
    group.add(beacon);
  }
}

/* ------------------------------------------------------------------ */
/*  building factory                                                   */
/* ------------------------------------------------------------------ */
export function createBuilding({
  style = 'brownstone',
  width = 10,
  depth = 8,
  floors = 4,
  floorHeight = 3.0,
  seed = 1,
  wall,
  trim,
  roof,
  glass,
  litChance = 0.28,
  bays,
  shop = false,
  shopName = '',
  awningColor = '#b85145',
  signBg = '#233934',
  signFg = '#f4e4c2',
  fireEscape = false,
  stoop = false,
  mansard = false,
  balconies = false,
  waterTank = false,
  rooftop = true,
  shadows = true,
  neon = false,
  verticalSign = false,
} = {}) {
  const group = new THREE.Group();
  const palette = PALETTES[style] || PALETTES.brownstone;
  const height = floors * floorHeight;
  const bayCount = bays || Math.max(2, Math.round(width / 3.1));
  const sideBays = Math.max(2, Math.round(depth / 3.6));

  const frontTex = createFacadeTexture({
    style, bays: bayCount, floors, seed, wall, trim, glass,
    litChance, litColor: palette.lit, shop,
  });
  const sideTex = createFacadeTexture({
    style, bays: sideBays, floors, seed: seed + 101, wall, trim, glass,
    litChance: litChance * 0.8, litColor: palette.lit, shop: false,
  });

  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.9 });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9 });
  const roofMat = S(roof || palette.roof, { roughness: 0.94 });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    [sideMat, sideMat, roofMat, sideMat, frontMat, sideMat],
  );
  body.position.y = height / 2;
  body.castShadow = shadows;
  body.receiveShadow = shadows;
  group.add(body);

  // cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.46, 0.26, depth + 0.46), S(trim || palette.trim, { roughness: 0.9 }));
  cornice.position.y = height - 0.02;
  cornice.castShadow = shadows;
  group.add(cornice);
  if (style === 'brownstone' || style === 'limestone' || style === 'haussmann') {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.1, depth + 0.3), S(trim || palette.trim, { roughness: 0.9 }));
    ledge.position.y = height - 0.34;
    group.add(ledge);
  }

  if (shop) {
    addStorefront(group, width, depth, floorHeight, {
      awningColor, signText: shopName, signBg, signFg, neon, verticalSign,
    });
  } else if (stoop) {
    addStoop(group, width, depth, floorHeight, trim || palette.trim);
  }
  if (fireEscape) addFireEscape(group, width, depth, floors, floorHeight);
  if (balconies) {
    const levels = floors >= 5 ? [2, floors - 1] : [2];
    levels.forEach((f, i) => {
      if (f >= floors) return;
      addIronRailing(group, width * 0.9, 0.78, {
        y: f * floorHeight + 0.46, z: depth / 2 + 0.07, repeat: Math.max(2, Math.round(width / 2.4)),
      });
      addFlowerBox(group, width * 0.68, {
        y: f * floorHeight + 0.38, z: depth / 2 + 0.16,
      });
      if (i === 0) addIronRailing(group, width * 0.9, 0.72, {
        y: f * floorHeight - 0.02, z: depth / 2 + 0.06, repeat: Math.max(2, Math.round(width / 2.6)),
      });
    });
  }

  if (mansard) {
    const mh = Math.min(3.4, width * 0.26);
    const mans = new THREE.Mesh(frustumGeometry(width + 0.3, depth + 0.3, width * 0.72, depth * 0.7, mh), S('#59636a', { roughness: 0.86 }));
    mans.position.y = height;
    mans.castShadow = shadows;
    group.add(mans);
    const dormers = Math.max(2, Math.round(width / 3.6));
    for (let i = 0; i < dormers; i++) {
      const dx = -width / 2 + width * (i + 0.5) / dormers;
      const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.9), S('#d5cbb6', { roughness: 0.9 }));
      dormer.position.set(dx, height + mh * 0.38, depth * 0.32);
      dormer.castShadow = shadows;
      group.add(dormer);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.8), new THREE.MeshStandardMaterial({
        color: '#38474e', roughness: 0.3,
      }));
      win.position.set(dx, height + mh * 0.38 + 0.06, depth * 0.32 + 0.46);
      group.add(win);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.5, 4), S('#474f54'));
      cap.rotation.y = Math.PI / 4;
      cap.position.set(dx, height + mh * 0.38 + 0.92, depth * 0.32);
      group.add(cap);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.16, depth * 0.68), S('#4d565b'));
    top.position.y = height + mh;
    group.add(top);
  } else if (rooftop) {
    addRooftop(group, width, depth, height, seed, {
      style, waterTank, roofMat: roof || palette.roof, trimColor: trim || palette.trim,
    });
  }

  // ground floor plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, 0.4, depth + 0.12), S('#706a60', { roughness: 0.96 }));
  plinth.position.y = 0.2;
  plinth.receiveShadow = shadows;
  group.add(plinth);

  group.userData = { width, depth, height, style, bayCount, floors };
  return group;
}

/* Rows of buildings along a street; adds variation automatically. */
export function createBuildingRow({
  x = 0, z = 0, yaw = 0, length = 60, styles = ['brownstone', 'brick', 'limestone'],
  minWidth = 8, maxWidth = 12, depth = [8, 11], floors = [3, 5], seed = 1,
  gap = 0.35, floorHeight = 3.0, shops = false, shopNames = [], balconies = false,
  mansard = false, fireEscapes = true, stoopEvery = 2,
} = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  const r = mulberry32(seed * 131 + 7);
  let cursor = -length / 2;
  let i = 0;
  while (cursor < length / 2 - 2) {
    const w = minWidth + r() * (maxWidth - minWidth);
    const d = depth[0] + r() * (depth[1] - depth[0]);
    const f = Math.round(floors[0] + r() * (floors[1] - floors[0]));
    const style = styles[i % styles.length];
    const shop = shops && r() > (style === 'office' ? 0.5 : 0.25);
    const building = createBuilding({
      style, width: w, depth: d, floors: f, seed: seed + i * 17, floorHeight,
      litChance: 0.22 + r() * 0.22, shop,
      shopName: shop ? (shopNames[i % Math.max(1, shopNames.length)] || '') : '',
      awningColor: ['#b85145', '#3d6d68', '#c4944e', '#5d6f89'][i % 4],
      fireEscape: fireEscapes && style !== 'office' && f >= 4 && r() > 0.52,
      stoop: !shop && style !== 'office' && i % stoopEvery === 0,
      mansard, balconies: balconies && style === 'haussmann',
      waterTank: style === 'brownstone' && r() > 0.5,
      rooftop: true,
      verticalSign: shops && style === 'tokyo',
    });
    building.position.x = cursor + w / 2;
    building.rotation.y = (r() - 0.5) * 0.03;
    group.add(building);
    cursor += w + gap;
    i += 1;
  }
  return group;
}

/* A slim art-deco tower used in skylines. */
export function createDecoTower({
  width = 8, depth = 8, height = 40, seed = 1, crownColor = '#c9b98f',
  color = '#a9997f', litChance = 0.2,
} = {}) {
  const group = new THREE.Group();
  const r = mulberry32(seed * 41 + 3);
  const tex = createFacadeTexture({
    style: 'deco', bays: Math.max(2, Math.round(width / 2.6)), floors: Math.max(6, Math.round(height / 3.4)),
    seed, wall: color, litChance,
  });
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86 });
  const tiers = [
    [1, height * 0.56],
    [0.82, height * 0.2],
    [0.62, height * 0.13],
  ];
  let y = 0;
  tiers.forEach(([scale, h], i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width * scale, h, depth * scale), mat);
    mesh.position.y = y + h / 2;
    group.add(mesh);
    y += h;
    if (i < tiers.length - 1) {
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(width * scale + 0.3, 0.22, depth * scale + 0.3), S(crownColor));
      ledge.position.y = y - 0.1;
      group.add(ledge);
    }
  });
  const spire = new THREE.Mesh(new THREE.ConeGeometry(width * 0.16, height * 0.14, 6), S(crownColor, { metalness: 0.3, roughness: 0.6 }));
  spire.position.y = y + height * 0.07;
  group.add(spire);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshBasicMaterial({ color: '#e46050' }));
  beacon.position.y = spire.position.y + height * 0.07;
  group.add(beacon);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, height * 0.1, 5), S('#6a6a66'));
  antenna.position.y = beacon.position.y + height * 0.05;
  group.add(antenna);
  return group;
}
