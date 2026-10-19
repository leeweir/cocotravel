import * as THREE from 'three';
import { TAU, canvas2d, canvasTexture, dotTexture, sparkleTexture } from '../core/utils.js';

const starCache = { geo: null, mat: null };

function starGeometry() {
  if (starCache.geo) return starCache.geo;
  const shape = new THREE.Shape();
  const points = 5;
  const outer = 0.34, inner = 0.14;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * TAU + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025,
  });
  geo.center();
  starCache.geo = geo;
  return geo;
}

function starMaterial() {
  if (starCache.mat) return starCache.mat;
  starCache.mat = new THREE.MeshStandardMaterial({
    color: '#ffd979', emissive: '#ffb53f', emissiveIntensity: 1.15,
    metalness: 0.45, roughness: 0.26,
  });
  return starCache.mat;
}

export function createSpark({ id, x, y = 1.2, z, label = '星火' }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const inner = new THREE.Group();
  group.add(inner);

  const star = new THREE.Mesh(starGeometry(), starMaterial().clone());
  star.castShadow = false;
  star.scale.setScalar(0.52);
  star.rotation.z = -0.18;
  star.material.transparent = true;
  inner.add(star);

  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTexture(), color: '#fff0c2', transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  core.scale.setScalar(1.5);
  group.add(core);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTexture(), color: '#ffc65c', transparent: true, opacity: 0.45,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.setScalar(2.5);
  group.add(halo);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.62, 32),
    new THREE.MeshBasicMaterial({
      color: '#ffd37c', transparent: true, opacity: 0.5, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -y + 0.08;
  group.add(ring);

  const orbit = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sparkleTexture(), color: i % 2 ? '#fff6d5' : '#ffca66', transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    s.scale.setScalar(0.18);
    s.position.set(Math.cos((i / 4) * TAU) * 0.55, Math.sin((i / 2) * TAU) * 0.18, Math.sin((i / 4) * TAU) * 0.55);
    s.userData.phase = (i / 4) * TAU;
    orbit.add(s);
  }
  group.add(orbit);

  let visible = true;
  let collectT = -1;
  function update(dt, t) {
    if (!visible) return;
    if (collectT >= 0) {
      collectT += dt;
      const k = Math.min(1, collectT / 0.5);
      group.scale.setScalar(1 + k * 1.6);
      group.position.y = y + k * 1.2;
      inner.rotation.y += dt * 10;
      star.material.opacity = 1 - k;
      star.material.transparent = true;
      core.material.opacity = (1 - k) * 0.9;
      halo.material.opacity = (1 - k) * 0.45;
      if (k >= 1) { group.visible = false; visible = false; }
      return;
    }
    inner.rotation.y += dt * 1.5;
    inner.position.y = Math.sin(t * 1.8) * 0.12;
    const pulse = 1 + Math.sin(t * 2.6) * 0.06;
    star.scale.setScalar(0.52 * pulse);
    core.scale.setScalar(1.5 * pulse);
    halo.scale.setScalar(2.5 * pulse);
    halo.material.opacity = 0.32 + Math.sin(t * 2.2) * 0.1;
    orbit.rotation.y += dt * 1.2;
    ring.scale.setScalar(1 + Math.sin(t * 2 + 1) * 0.15);
    ring.material.opacity = 0.3 + Math.sin(t * 2 + 1) * 0.14;
  }
  function collect() { collectT = 0; }
  function setVisible(v) { group.visible = v; visible = v; }
  return {
    id, label, group, update, collect, setVisible,
    get collected() { return !visible; },
    get isCollecting() { return collectT >= 0; },
  };
}

function glowAura(color = '#ffd37c', scale = 1.6) {
  const group = new THREE.Group();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTexture(), color, transparent: true, opacity: 0.5, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  halo.scale.setScalar(scale);
  group.add(halo);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.5, 28),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.6, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.7;
  group.add(ring);
  return group;
}

function makeBell() {
  const g = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({ color: '#e5b451', metalness: 0.7, roughness: 0.28, emissive: '#b57a18', emissiveIntensity: 0.15 });
  const bell = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.02, -0.2), new THREE.Vector2(0.12, -0.18), new THREE.Vector2(0.18, -0.06),
    new THREE.Vector2(0.15, 0.1), new THREE.Vector2(0.08, 0.19), new THREE.Vector2(0.02, 0.22),
  ], 20), goldMat);
  bell.castShadow = true;
  g.add(bell);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 5, 12), goldMat);
  handle.position.y = 0.26;
  g.add(handle);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), goldMat);
  clapper.position.y = -0.2;
  g.add(clapper);
  return g;
}

function makeWheel() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#c08a55', roughness: 0.8 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 24), wood);
  rim.castShadow = true;
  g.add(rim);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 5), wood);
    spoke.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0);
    spoke.rotation.z = a + Math.PI / 2;
    g.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.09, 10), new THREE.MeshStandardMaterial({ color: '#8a6a48', metalness: 0.4 }));
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  g.rotation.x = 0.25;
  return g;
}

function makeWhistle() {
  const g = new THREE.Group();
  const silver = new THREE.MeshStandardMaterial({ color: '#cdb47f', metalness: 0.85, roughness: 0.22 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 6, 10), silver);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.1), silver);
  mouth.position.set(-0.13, 0.03, 0);
  g.add(mouth);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 5, 12), silver);
  loop.position.set(0.1, 0.09, 0);
  g.add(loop);
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 4, 16, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: '#b55048' }));
  cord.position.set(0.13, 0.2, 0);
  cord.rotation.z = -0.4;
  g.add(cord);
  return g;
}

function makeBrush() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#96704a', roughness: 0.7 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 8), wood);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.1, 8), new THREE.MeshStandardMaterial({ color: '#bda36c', metalness: 0.7, roughness: 0.35 }));
  ferrule.rotation.z = Math.PI / 2;
  ferrule.position.x = 0.3;
  g.add(ferrule);
  const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 8), new THREE.MeshStandardMaterial({ color: '#d06a63', roughness: 0.9 }));
  bristles.rotation.z = -Math.PI / 2;
  bristles.position.x = 0.42;
  g.add(bristles);
  return g;
}

function makeStarSign() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(starGeometry(), new THREE.MeshStandardMaterial({ color: '#f0c46a', roughness: 0.5, metalness: 0.2 }));
  board.scale.setScalar(0.9);
  g.add(board);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.3, 6), new THREE.MeshStandardMaterial({ color: '#a98255' }));
  stick.position.y = -0.36;
  g.add(stick);
  return g;
}

function makeCat() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#f7f0e2', roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), white);
  body.scale.set(1, 1.15, 0.8);
  body.position.y = 0.1;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), white);
  head.position.y = 0.35;
  g.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 4), white);
    ear.position.set(s * 0.075, 0.45, -0.01);
    ear.rotation.z = s * -0.2;
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshBasicMaterial({ color: '#3a2a21' }));
    eye.position.set(s * 0.04, 0.37, 0.1);
    g.add(eye);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 5, 14), new THREE.MeshStandardMaterial({ color: '#cf5c4d' }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.27;
  g.add(collar);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshStandardMaterial({ color: '#e8c05c', metalness: 0.6, roughness: 0.3 }));
  bell.position.set(0, 0.23, 0.12);
  g.add(bell);
  const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.12, 4, 6), white);
  paw.position.set(0.15, 0.28, 0.02);
  paw.rotation.z = -0.35;
  g.add(paw);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), new THREE.MeshStandardMaterial({ color: '#d89a8c' }));
  nose.position.set(0, 0.34, 0.118);
  g.add(nose);
  g.rotation.y = Math.PI;
  return g;
}

const ITEM_BUILDERS = {
  wheel: makeWheel,
  whistle: makeWhistle,
  brush: makeBrush,
  star: makeStarSign,
  bell: makeBell,
  cat: makeCat,
};

export function createQuestItem({ id, kind = 'star', x, z, y = 1.1, label = '丢失的东西' }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const bob = new THREE.Group();
  group.add(bob);
  const model = (ITEM_BUILDERS[kind] || makeStarSign)();
  model.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  bob.add(model);
  const aura = glowAura('#ffcf76', 1.7);
  group.add(aura);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sparkleTexture(), color: '#fff2cf', transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  spark.scale.setScalar(0.3);
  spark.position.y = 0.4;
  group.add(spark);

  let active = true;
  function update(dt, t) {
    if (!active) return;
    bob.rotation.y += dt * 0.9;
    bob.position.y = Math.sin(t * 1.7 + x) * 0.08;
    aura.children[0].material.opacity = 0.38 + Math.sin(t * 2.4) * 0.12;
    spark.position.y = 0.5 + Math.sin(t * 2.2) * 0.16;
  }
  function setActive(v) { active = v; group.visible = v; }
  return { id, kind, label, group, update, setActive };
}

export function createHeartGate({ position, label = '点亮城市' }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.position.y += 1.3;
  const inner = new THREE.Group();
  group.add(inner);

  const ringMat = new THREE.MeshStandardMaterial({
    color: '#ffdf9e', emissive: '#ffbb4f', emissiveIntensity: 1.3,
    roughness: 0.3, metalness: 0.5,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 10, 52), ringMat);
  ring.castShadow = false;
  inner.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.028, 6, 40), new THREE.MeshBasicMaterial({
    color: '#fff3cf', transparent: true, opacity: 0.8, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  ring2.position.z = 0.02;
  inner.add(ring2);

  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.98, 40), new THREE.MeshBasicMaterial({
    color: '#ffd88b', transparent: true, opacity: 0.16, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  disc.position.z = -0.01;
  inner.add(disc);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTexture(), color: '#ffd57c', transparent: true, opacity: 0.6,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glow.scale.setScalar(4.6);
  group.add(glow);

  const sparks = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sparkleTexture(), color: i % 2 ? '#fff1c4' : '#ffc35e', transparent: true,
      opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    s.scale.setScalar(0.24);
    s.userData.angle = (i / 7) * TAU;
    s.userData.rad = 1.15 + (i % 3) * 0.13;
    group.add(s);
    sparks.push(s);
  }

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.5, 7, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: '#ffd37c', transparent: true, opacity: 0.09, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  );
  beam.position.y = 3.2;
  group.add(beam);

  const light = new THREE.PointLight(0xffc66b, 0, 12, 2);
  light.position.y = 0.2;
  group.add(light);

  let active = false;
  let activeT = 0;
  function setActive(v) {
    active = v;
    group.visible = v;
    light.intensity = v ? 4 : 0;
  }
  function update(dt, t) {
    if (!active) return;
    activeT += dt;
    inner.rotation.z = Math.sin(t * 0.6) * 0.08;
    ring.rotation.z += dt * 0.08;
    ringMat.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.25;
    glow.material.opacity = 0.42 + Math.sin(t * 2) * 0.12;
    disc.material.opacity = 0.12 + Math.sin(t * 1.7) * 0.05;
    beam.material.opacity = 0.06 + Math.sin(t * 1.3) * 0.025 + Math.min(0.05, activeT * 0.02);
    sparks.forEach((s, i) => {
      const a = s.userData.angle + t * (0.5 + i * 0.03);
      s.position.set(Math.cos(a) * s.userData.rad, Math.sin(a * 1.3 + i) * 1.1, Math.sin(a) * 0.25);
      s.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.35;
    });
    light.intensity = 3.4 + Math.sin(t * 3) * 0.7;
  }
  setActive(false);
  return { group, label, update, setActive, get active() { return active; } };
}

export class BurstSystem {
  constructor(scene) {
    this.scene = scene;
    this.bursts = [];
    this.tex = sparkleTexture();
  }

  emit(position, {
    count = 22, colors = ['#ffd37c', '#fff3cf', '#f0a94b'], spread = 2.2,
    up = 3.4, size = 0.26, gravity = 5.5, life = 1.25,
    blending = THREE.AdditiveBlending,
  } = {}) {
    const group = new THREE.Group();
    group.position.copy(position);
    this.scene.add(group);
    const parts = [];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.tex, color: colors[i % colors.length], transparent: true,
        opacity: 1, depthWrite: false, blending,
      });
      const s = new THREE.Sprite(mat);
      const sc = size * (0.6 + Math.random() * 0.9);
      s.scale.setScalar(sc);
      const a = Math.random() * TAU;
      const speed = spread * (0.25 + Math.random() * 0.9);
      s.userData = {
        vx: Math.cos(a) * speed,
        vy: up * (0.35 + Math.random() * 0.9),
        vz: Math.sin(a) * speed,
        spin: (Math.random() - 0.5) * 8,
        life: life * (0.75 + Math.random() * 0.5),
        age: 0,
        gravity,
        baseScale: sc,
      };
      group.add(s);
      parts.push(s);
    }
    this.bursts.push({ group, parts, age: 0, life });
    return group;
  }

  update(dt) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.age += dt;
      let alive = false;
      for (const p of b.parts) {
        const u = p.userData;
        u.age += dt;
        if (u.age > u.life) { p.visible = false; continue; }
        alive = true;
        u.vy -= u.gravity * dt;
        p.position.x += u.vx * dt;
        p.position.y += u.vy * dt;
        p.position.z += u.vz * dt;
        p.material.rotation += u.spin * dt;
        const k = 1 - u.age / u.life;
        p.material.opacity = k;
        p.scale.setScalar(u.baseScale * (0.35 + k * 0.8));
      }
      if (!alive) {
        this.scene.remove(b.group);
        b.parts.forEach((p) => p.material.dispose());
        this.bursts.splice(i, 1);
      }
    }
  }

  dispose() {
    this.bursts.forEach((b) => {
      this.scene.remove(b.group);
      b.parts.forEach((p) => p.material.dispose());
    });
    this.bursts = [];
  }
}

export function makeFireworkTexture() {
  const { c, ctx } = canvas2d(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(c);
}
