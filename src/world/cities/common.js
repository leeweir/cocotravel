import * as THREE from 'three';
import { canvasTexture, pavingTexture } from '../../core/utils.js';
import { createFlagPole } from '../props.js';

export function addGroundPatch(parent, {
  x = 0, z = 0, width = 10, depth = 10, rotation = 0, y = 0.02,
  texture = null, color = 0xffffff, roughness = 0.95, opacity = 1,
  polygonOffset = true,
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, roughness, transparent: opacity < 1, opacity,
    polygonOffset, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  if (texture) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, width / 9), Math.max(1, depth / 9));
    mat.map = t;
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotation;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function addCirclePatch(parent, {
  x = 0, z = 0, radius = 8, y = 0.025, texture = null, color = 0xffffff,
  roughness = 0.92, ring = true, ringColor = '#c6b79d',
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, roughness, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  if (texture) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, radius / 2), Math.max(1, radius / 2));
    mat.map = t;
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 56), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(x, y, z);
  disc.receiveShadow = true;
  parent.add(disc);
  if (ring) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.055, 5, 64),
      new THREE.MeshStandardMaterial({ color: ringColor, roughness: 0.9 }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, y + 0.042, z);
    parent.add(rim);
  }
  return disc;
}

export function addPath(parent, {
  points = [], width = 3, texture = null, color = 0xffffff, y = 0.035,
  repeat = 6, material = null,
} = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'catmullrom', 0.28,
  );
  const steps = Math.max(8, Math.round(curve.getLength() * 1.6));
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).setY(0).normalize();
    const nx = -tan.z, nz = tan.x;
    const w = width * (0.94 + Math.sin(t * 9) * 0.06);
    pos.push(p.x + nx * w / 2, y, p.z + nz * w / 2);
    pos.push(p.x - nx * w / 2, y, p.z - nz * w / 2);
    uv.push(t * repeat, 0, t * repeat, 1);
    if (i < steps) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  let map = texture;
  if (map) {
    map = map.clone();
    map.needsUpdate = true;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
  }
  const mat = material || new THREE.MeshStandardMaterial({
    color, roughness: 0.95, map,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function placeLandmark(parent, landmark, x, z) {
  landmark.group.position.set(x, 0, z);
  parent.add(landmark.group);
  const colliders = (landmark.colliders || []).map((c) => ({ ...c, x: c.x + x, z: c.z + z }));
  const heartLocal = landmark.heart || new THREE.Vector3(0, 0.5, 5);
  const heart = heartLocal.clone().add(new THREE.Vector3(x, 0, z));
  const anchors = {};
  if (landmark.anchors) {
    Object.entries(landmark.anchors).forEach(([k, v]) => {
      anchors[k] = v.clone().add(new THREE.Vector3(x, 0, z));
    });
  }
  if (landmark.anchorTop) anchors.top = landmark.anchorTop.clone().add(new THREE.Vector3(x, 0, z));
  if (landmark.anchorMid) anchors.mid = landmark.anchorMid.clone().add(new THREE.Vector3(x, 0, z));
  if (landmark.anchor) anchors.main = landmark.anchor.clone().add(new THREE.Vector3(x, 0, z));
  return { colliders, heart, anchors };
}

export function scatterProps(parent, factory, placements) {
  const list = [];
  placements.forEach((p) => {
    const obj = factory(p);
    obj.position.set(p.x, p.y || 0, p.z);
    if (p.yaw !== undefined) obj.rotation.y = p.yaw;
    if (p.scale !== undefined) obj.scale.setScalar(p.scale);
    parent.add(obj);
    list.push(obj);
  });
  return list;
}

export function labelSprite(lines, {
  width = 3.2, height = 0.85, font = 600, color = '#3f312b', bg = '#fffaf0',
  border = 'rgba(63,49,43,.18)', scale = 1, tape = false, align = 'center',
} = {}) {
  const { c, ctx } = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.round(512 * height / width);
    return { c: canvas, ctx: canvas.getContext('2d') };
  })();
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 5;
  const r = 26;
  ctx.beginPath();
  ctx.moveTo(r, 2);
  ctx.arcTo(c.width - 2, 2, c.width - 2, c.height - 2, r);
  ctx.arcTo(c.width - 2, c.height - 2, 2, c.height - 2, r);
  ctx.arcTo(2, c.height - 2, 2, 2, r);
  ctx.arcTo(2, 2, c.width - 2, 2, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const x = align === 'left' ? 34 : c.width / 2;
  const items = lines.filter(Boolean);
  items.forEach((line, i) => {
    const big = i === 0;
    ctx.font = `${big ? 700 : 500} ${big ? Math.round(c.height * (items.length > 1 ? 0.34 : 0.46)) : Math.round(c.height * 0.24)}px "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = i === 0 ? color : 'rgba(63,49,43,.66)';
    const y = items.length > 1 ? c.height * (i === 0 ? 0.36 : 0.7) : c.height * 0.52;
    ctx.fillText(line, x, y);
  });
  if (tape) {
    ctx.fillStyle = 'rgba(232,180,95,.5)';
    ctx.fillRect(c.width * 0.38, 0, c.width * 0.24, 16);
  }
  const tex = canvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width * scale, height * scale, 1);
  return sprite;
}

export function addFlag(parent, flagtex, x, z, { height = 6.5, scale = 1.4, yaw = 0 } = {}) {
  const pole = createFlagPole(flagtex, { height, scale });
  pole.group.position.set(x, 0, z);
  pole.group.rotation.y = yaw;
  parent.add(pole.group);
  return pole;
}

export function makeWoodDeck(parent, { x = 0, z = 0, width = 8, depth = 5, y = 0.16, color = '#a88158' } = {}) {
  const group = new THREE.Group();
  const plankMat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, map: pavingTexture('slab', 13) });
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, Math.max(0.12, y), depth), plankMat);
  base.position.y = y / 2;
  base.receiveShadow = true;
  group.add(base);
  for (let i = 0; i <= Math.round(width / 0.8); i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, y + 0.015, depth),
      new THREE.MeshStandardMaterial({ color: '#7d5c3c', roughness: 0.95 }),
    );
    line.position.set(-width / 2 + i * 0.8, y / 2 + 0.008, 0);
    group.add(line);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < Math.max(2, Math.round(depth / 2.2)); i++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.8, 7),
        new THREE.MeshStandardMaterial({ color: '#6d5136', roughness: 0.95 }),
      );
      post.position.set(s * (width / 2 - 0.1), 0.05, -depth / 2 + 0.5 + i * (depth - 1) / Math.max(1, Math.round(depth / 2.2) - 1));
      post.castShadow = true;
      group.add(post);
    }
  }
  group.position.set(x, 0, z);
  parent.add(group);
  return { group, walkable: base };
}

export function addRopeFence(parent, points, { postEvery = 2.4, color = '#d8cbb4' } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const postMat = new THREE.MeshStandardMaterial({ color: '#8a7358', roughness: 0.9 });
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0, p[1])));
  const len = curve.getLength();
  const n = Math.max(2, Math.round(len / postEvery));
  const prev = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.9, 7), postMat);
    post.position.set(p.x, 0.45, p.z);
    post.castShadow = true;
    parent.add(post);
    if (i > 0) {
      const mid = prev.clone().lerp(p, 0.5);
      const dv = p.clone().sub(prev);
      const sag = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, dv.length(), 5), mat);
      sag.position.set(mid.x, 0.72, mid.z);
      sag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize().multiplyScalar(1));
      sag.rotation.x += 0.04;
      parent.add(sag);
    }
    prev.copy(p);
  }
}
