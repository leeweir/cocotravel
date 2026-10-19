import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  pavingTexture, signTexture, mulberry32, TAU, canvas2d, canvasTexture,
} from '../core/utils.js';
import { THEMES } from './environment.js';
import { addIronRailing } from './buildings.js';

const WATER_Y = -0.45;
const WALL_TOP = 0.56;
const DECK_Y = 0.2;

function stoneMat(color = '#c9bda6', seed = 21, repeat = [10, 1]) {
  const tex = pavingTexture('slab', seed);
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  return new THREE.MeshStandardMaterial({ color, map: tex, roughness: 0.95 });
}

function seineWater(theme) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(theme.waterDeep).multiplyScalar(0.82) },
      uShallow: { value: new THREE.Color(theme.waterShallow) },
      uSky: { value: new THREE.Color(theme.skyTop).lerp(new THREE.Color(theme.skyHorizon), 0.3) },
      uSunColor: { value: new THREE.Color(theme.sunColor) },
      uSunDir: { value: theme.sunDir.clone() },
      uFog: { value: new THREE.Color(theme.fog) },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      uniform float uTime;
      void main() {
        vec3 p = position;
        p.y += sin(p.x * 1.5 + uTime * 0.8) * 0.008 + sin(p.z * 3.1 - uTime * 0.6) * 0.006;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uDeep, uShallow, uSky, uSunColor, uSunDir, uFog;
      void main() {
        vec2 q = vWorld.xz;
        float w1 = sin(q.x * 1.5 + uTime * 0.85 + sin(q.y * 0.65) * 1.7);
        float w2 = sin(q.y * 2.3 - uTime * 0.7 + sin(q.x * 0.5) * 1.2);
        float w3 = sin((q.x + q.y) * 3.4 + uTime * 1.5);
        vec3 n = normalize(vec3((w1 + w3 * 0.35) * 0.055, 1.0, (w2 + w3 * 0.35) * 0.055));
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(viewDir, n), 0.0), 2.3);
        vec3 col = mix(uDeep, uShallow, 0.28 + 0.16 * sin(q.y * 0.35 + q.x * 0.12));
        col = mix(col, uSky, fres * 0.44 + 0.05);
        float glint = pow(max(dot(reflect(-uSunDir, n), viewDir), 0.0), 120.0);
        col += uSunColor * glint * 1.15;
        float flow = smoothstep(0.9, 1.0, sin(q.x * 2.4 + q.y * 0.75 - uTime * 1.25) * 0.5 + 0.5);
        col += vec3(0.055, 0.075, 0.055) * flow * 0.55;
        float edge = smoothstep(9.2, 0.2, abs(q.y + 12.5));
        col += uShallow * edge * 0.03;
        float dist = length(cameraPosition - vWorld);
        col = mix(col, uFog, smoothstep(160.0, 430.0, dist));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/* ------------------------------------------------------------------ */
/*  quay walls                                                         */
/* ------------------------------------------------------------------ */
function quaySegment(length, z, seed, color, promenadeSide) {
  const group = new THREE.Group();
  const height = WALL_TOP + 1.9;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, 0.66),
    stoneMat(color, seed, [Math.max(2, Math.round(length / 2.6)), 1]),
  );
  wall.position.set(0, WALL_TOP - height / 2, 0);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const coping = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.13, 0.86),
    new THREE.MeshStandardMaterial({ color: '#ded3bd', roughness: 0.9 }),
  );
  coping.position.set(0, WALL_TOP + 0.05, 0);
  coping.castShadow = true;
  coping.receiveShadow = true;
  group.add(coping);

  const face = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.14, 0.08),
    new THREE.MeshStandardMaterial({ color: '#b7a98f', roughness: 0.96 }),
  );
  face.position.set(0, 0.1, promenadeSide * 0.36);
  group.add(face);

  const n = Math.max(2, Math.floor(length / 7));
  for (let i = 0; i < n; i++) {
    const px = -length / 2 + (i + 0.5) * (length / n);
    const pilaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, height + 0.16, 0.82),
      stoneMat('#c2b49a', seed + i, [1, 1]),
    );
    pilaster.position.set(px, WALL_TOP - height / 2 + 0.05, 0);
    pilaster.castShadow = true;
    group.add(pilaster);
  }
  const r = mulberry32(seed);
  for (let i = 0; i < Math.floor(length / 9); i++) {
    const px = -length / 2 + 3 + r() * (length - 6);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.035, 5, 10),
      new THREE.MeshStandardMaterial({ color: '#4d514a', roughness: 0.7, metalness: 0.35 }),
    );
    ring.position.set(px, 0.3, promenadeSide * 0.36);
    group.add(ring);
  }
  group.position.z = z;
  return group;
}

/* ------------------------------------------------------------------ */
/*  footbridge                                                         */
/* ------------------------------------------------------------------ */
function createFootbridge({ zCenter, span, width, seed = 5 }) {
  const group = new THREE.Group();
  group.position.z = zCenter;

  const deckMat = stoneMat('#c8bba2', seed + 3, [3, 9]);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, DECK_Y, span), deckMat);
  deck.position.y = DECK_Y / 2;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  const border = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.28, 0.1, span + 0.24),
    new THREE.MeshStandardMaterial({ color: '#ded2ba', roughness: 0.92 }),
  );
  border.position.y = 0.045;
  border.receiveShadow = true;
  group.add(border);

  // stone grid on deck
  const lineMat = new THREE.MeshStandardMaterial({ color: '#9f927c', roughness: 0.95 });
  for (let i = 1; i < 7; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, span - 0.1), lineMat);
    line.position.set(-width / 2 + (width / 7) * i, DECK_Y + 0.003, 0);
    group.add(line);
  }
  for (let i = 1; i < 12; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.012, 0.035), lineMat);
    line.position.set(0, DECK_Y + 0.003, -span / 2 + (span / 12) * i);
    group.add(line);
  }

  // piers
  for (const t of [-0.24, 0.24]) {
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.3, 2.1, 0.66),
      stoneMat('#bcae94', seed + 11, [3, 1]),
    );
    pier.position.set(0, -0.75, span * t);
    pier.castShadow = true;
    group.add(pier);
    const cut = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.4, 2.05, 4), stoneMat('#b3a489', seed + 12));
    cut.position.set(0, -0.76, span * t);
    cut.rotation.y = Math.PI / 4;
    group.add(cut);
  }

  // iron railings
  for (const s of [-1, 1]) {
    addIronRailing(group, span - 1.1, 0.86, {
      x: s * (width / 2 - 0.12), y: DECK_Y + 0.43, z: 0,
      rotation: Math.PI / 2, repeat: Math.max(3, Math.round(span / 1.4)),
    });
    for (const t of [-0.5, 0, 0.5]) {
      const pillar = new THREE.Mesh(
        new RoundedBoxGeometry(0.34, 0.62, 0.42, 2, 0.05),
        stoneMat('#c5b79d', seed + 21, [1, 1]),
      );
      pillar.position.set(s * (width / 2 - 0.1), DECK_Y + 0.3, span * t);
      pillar.castShadow = true;
      group.add(pillar);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 4), stoneMat('#d6cab2', seed + 22, [1, 1]));
      cap.rotation.y = Math.PI / 4;
      cap.position.set(s * (width / 2 - 0.1), DECK_Y + 0.7, span * t);
      group.add(cap);
    }
  }

  function lamp(x, z, rot = 0) {
    const lg = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.24, 8), new THREE.MeshStandardMaterial({ color: '#3f4642', roughness: 0.6, metalness: 0.35 }));
    base.position.y = 0.12;
    lg.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.7, 7), new THREE.MeshStandardMaterial({ color: '#3f4642', roughness: 0.6, metalness: 0.35 }));
    post.position.y = 1.0;
    lg.add(post);
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.22, 0.44, 6),
      new THREE.MeshStandardMaterial({
        color: '#ffe7b4', emissive: '#ffbc66', emissiveIntensity: 1.7, roughness: 0.35,
      }),
    );
    lantern.position.y = 1.94;
    lg.add(lantern);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.2, 6), new THREE.MeshStandardMaterial({ color: '#3f4642', roughness: 0.6 }));
    cap.position.y = 2.24;
    lg.add(cap);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshStandardMaterial({ color: '#d2b06a', roughness: 0.4, metalness: 0.4 }));
    tip.position.y = 2.38;
    lg.add(tip);
    lg.position.set(x, DECK_Y, z);
    lg.rotation.y = rot;
    lg.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(lg);
  }
  lamp(-width / 2 + 0.1, -span / 2 + 0.9);
  lamp(width / 2 - 0.1, -span / 2 + 0.9);
  lamp(-width / 2 + 0.1, span / 2 - 0.9);
  lamp(width / 2 - 0.1, span / 2 - 0.9);

  return { group, deck, width, span };
}

/* ------------------------------------------------------------------ */
/*  riverside life                                                     */
/* ------------------------------------------------------------------ */
function createBouquiniste(seed = 1) {
  const group = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#335344', roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#243b31', roughness: 0.9 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.62, 0.64, 2, 0.04), green);
  box.position.y = 0.32;
  box.castShadow = true;
  group.add(box);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.66), dark);
  lid.position.set(0, 0.72, -0.34);
  lid.rotation.x = -0.62;
  group.add(lid);
  for (let i = 0; i < 2; i++) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.05), dark);
    brace.position.set(-0.72 + i * 1.44, 0.52, -0.3);
    brace.rotation.x = -0.5;
    group.add(brace);
  }
  const r = mulberry32(seed);
  const colors = ['#c4685a', '#4f7a86', '#d7ae62', '#7d9a6b', '#8e6a8c', '#e0d2b8'];
  for (let i = 0; i < 9; i++) {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.09 + r() * 0.06, 0.24 + r() * 0.1, 0.3 + r() * 0.12),
      new THREE.MeshStandardMaterial({ color: colors[Math.floor(r() * colors.length)], roughness: 0.85 }),
    );
    book.position.set(-0.62 + i * 0.15, 0.72 + r() * 0.03, r() * 0.16);
    book.rotation.z = (r() - 0.5) * 0.1;
    group.add(book);
  }
  const signTex = signTexture('LIVRES', { sub: 'bouquiniste', bg: '#2f4c3e', fg: '#efe2c1', border: '#c3a86a', size: 40, tape: false, w: 256, h: 96 });
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.25),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }),
  );
  plaque.position.set(0, 0.38, 0.325);
  group.add(plaque);
  group.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return group;
}

function createMooredBoat({ x, z, yaw = 0, color = '#3f6360' }) {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const cream = new THREE.MeshStandardMaterial({ color: '#f1e4c8', roughness: 0.7 });
  const wood = new THREE.MeshStandardMaterial({ color: '#9b734c', roughness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({
    color: '#38545a', roughness: 0.25, metalness: 0.15,
    emissive: '#f0bd70', emissiveIntensity: 0.35,
  });

  const shape = new THREE.Shape();
  shape.moveTo(-4.1, -0.85);
  shape.lineTo(2.6, -0.9);
  shape.quadraticCurveTo(4.35, -0.5, 4.35, 0);
  shape.quadraticCurveTo(4.35, 0.5, 2.6, 0.9);
  shape.lineTo(-4.1, 0.85);
  shape.quadraticCurveTo(-4.4, 0, -4.1, -0.85);
  const hullGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.05, bevelThickness: 0.04, curveSegments: 10,
  });
  hullGeo.rotateX(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.02;
  hull.castShadow = true;
  group.add(hull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.06, 1.9), cream);
  stripe.position.set(0.05, 0.36, 0);
  group.add(stripe);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.52, 1.55), cream);
  cabin.position.set(-0.2, 0.65, 0);
  cabin.castShadow = true;
  group.add(cabin);
  for (let i = 0; i < 7; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 1.58), glass);
    win.position.set(-2.8 + i * 0.82, 0.76, 0);
    group.add(win);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 1.98), cream);
  canopy.position.set(-0.2, 1.22, 0);
  canopy.castShadow = true;
  group.add(canopy);
  for (const s of [-1, 1]) {
    for (const xx of [-3.1, 2.7]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.52, 5), wood);
      post.position.set(xx, 0.97, s * 0.86);
      group.add(post);
    }
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.1, 5), wood);
  mast.position.set(2.6, 1.2, 0);
  group.add(mast);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.44), new THREE.MeshStandardMaterial({
    color: '#c4675c', side: THREE.DoubleSide, roughness: 0.9,
  }));
  flag.position.set(3.02, 1.56, 0);
  group.add(flag);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 4, 10), cream);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-3.4 + i * 0.7, 0.44, 0.92);
    group.add(ring);
  }
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  group.userData.phase = Math.random() * TAU;
  group.userData.baseY = 0;
  return group;
}

function createQuayLamp() {
  const group = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: '#3a423d', roughness: 0.62, metalness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.3, 8), iron);
  base.position.y = 0.15;
  group.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 2.9, 7), iron);
  post.position.y = 1.6;
  group.add(post);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 5, 10, Math.PI * 0.65), iron);
  arm.position.set(0, 3.05, 0);
  arm.rotation.z = -0.25;
  group.add(arm);
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.17, 0.34, 6),
    new THREE.MeshStandardMaterial({ color: '#ffe6b0', emissive: '#ffbd67', emissiveIntensity: 1.5, roughness: 0.35 }),
  );
  lantern.position.set(0.28, 3.02, 0);
  group.add(lantern);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 6), iron);
  cap.position.set(0.28, 3.25, 0);
  group.add(cap);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

/* ------------------------------------------------------------------ */
/*  canal head (river disappears beneath the city)                     */
/* ------------------------------------------------------------------ */
function createCanalHead(x, zCenter, span, seed, faceDir) {
  const group = new THREE.Group();
  const height = WALL_TOP + 1.9;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, height, span + 0.3),
    stoneMat('#bfb197', seed, [2, 3]),
  );
  wall.position.y = WALL_TOP - height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  const coping = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.16, span + 0.5),
    new THREE.MeshStandardMaterial({ color: '#d9ceb8', roughness: 0.9 }),
  );
  coping.position.y = WALL_TOP + 0.07;
  coping.castShadow = true;
  group.add(coping);

  const portalTex = (() => {
    const { c, ctx } = canvas2d(1024, 192);
    ctx.fillStyle = '#b9ab90';
    ctx.fillRect(0, 0, 1024, 192);
    const rr = mulberry32(seed);
    ctx.strokeStyle = 'rgba(120,105,82,.35)';
    ctx.lineWidth = 2;
    for (let y = 12; y < 192; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(90,78,60,${0.03 + rr() * 0.06})`;
      ctx.fillRect(rr() * 1024, Math.floor(rr() * 10) * 18, 20 + rr() * 44, 14);
    }
    const ax = 512;
    const aw = 232;
    const springY = 112;
    ctx.beginPath();
    ctx.moveTo(ax - aw, 192);
    ctx.lineTo(ax - aw, springY);
    ctx.quadraticCurveTo(ax, 6, ax + aw, springY);
    ctx.lineTo(ax + aw, 192);
    ctx.closePath();
    ctx.fillStyle = '#172527';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const water = ctx.createLinearGradient(0, 138, 0, 192);
    water.addColorStop(0, '#3a5f66');
    water.addColorStop(1, '#1e3336');
    ctx.fillStyle = water;
    ctx.fillRect(ax - aw, 138, aw * 2, 54);
    ctx.strokeStyle = 'rgba(180,210,205,.22)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = 146 + i * 7;
      ctx.beginPath();
      ctx.moveTo(ax - aw + 12, y);
      ctx.bezierCurveTo(ax - 90, y - 4, ax + 90, y + 4, ax + aw - 12, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#94836a';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(ax - aw, springY);
    ctx.quadraticCurveTo(ax, 6, ax + aw, springY);
    ctx.stroke();
    ctx.fillStyle = '#a5947a';
    ctx.beginPath();
    ctx.moveTo(ax - 26, 12);
    ctx.lineTo(ax + 26, 12);
    ctx.lineTo(ax + 19, 42);
    ctx.lineTo(ax - 19, 42);
    ctx.closePath();
    ctx.fill();
    return canvasTexture(c);
  })();
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(span - 1.0, 1.6),
    new THREE.MeshStandardMaterial({ map: portalTex, roughness: 0.95 }),
  );
  portal.rotation.y = faceDir * Math.PI / 2;
  portal.position.set(faceDir * 0.71, -0.12, 0);
  group.add(portal);

  group.position.set(x, 0, zCenter);
  return group;
}

/* ------------------------------------------------------------------ */
/*  main factory                                                       */
/* ------------------------------------------------------------------ */
export function createSeine({
  southZ = -7.7, northZ = -17.3, xMin = -63, xMax = 63,
  bridgeX = 0, bridgeWidth = 6.4, theme = THEMES.france,
} = {}) {
  const group = new THREE.Group();
  group.name = 'seine';
  const zCenter = (southZ + northZ) / 2;
  const span = southZ - northZ;
  const bridgeHalf = bridgeWidth / 2;

  /* water */
  const waterGeo = new THREE.PlaneGeometry(xMax - xMin, span, 130, 14);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, seineWater(theme));
  water.position.set((xMin + xMax) / 2, WATER_Y, zCenter);
  group.add(water);

  /* quays */
  const opening = bridgeHalf + 0.1;
  const quayColliders = [];
  for (const [bankZ, promenadeSide, seed, color] of [
    [southZ, -1, 31, '#cbbfa8'],
    [northZ, 1, 37, '#c5b9a2'],
  ]) {
    for (const side of [-1, 1]) {
      const inner = bridgeX + side * opening;
      const outer = side < 0 ? xMin : xMax;
      const length = Math.abs(outer - inner);
      const seg = quaySegment(length, bankZ, seed + (side > 0 ? 5 : 0), color, promenadeSide);
      seg.position.x = (inner + outer) / 2;
      group.add(seg);
      const colX = (inner + outer) / 2;
      const colW = length - 0.9;
      quayColliders.push({ type: 'box', x: colX, z: bankZ, w: colW, d: 0.5 });
    }
  }

  /* stone headwalls where the river slips under the city */
  group.add(createCanalHead(xMin, zCenter, span, 61, 1));
  group.add(createCanalHead(xMax, zCenter, span, 67, -1));

  /* iron railings along both quays, opened around the bridge */
  for (const bankZ of [southZ, northZ]) {
    for (const side of [-1, 1]) {
      const near = bridgeX + side * 4.4;
      const far = side < 0 ? xMin + 0.9 : xMax - 0.9;
      const len = Math.abs(far - near);
      addIronRailing(group, len, 0.7, {
        x: (near + far) / 2, y: WALL_TOP + 0.42, z: bankZ,
        rotation: 0, repeat: Math.max(3, Math.round(len / 2.1)),
      });
    }
  }

  /* bridge */
  const bridge = createFootbridge({ zCenter, span: span + 1.9, width: bridgeWidth, seed: 9 });
  bridge.group.position.x = bridgeX;
  group.add(bridge.group);
  const bridgeColliders = [
    {
      type: 'box', x: bridgeX - bridgeHalf + 0.1, z: zCenter,
      w: 0.34, d: span + 2.6,
    },
    {
      type: 'box', x: bridgeX + bridgeHalf - 0.1, z: zCenter,
      w: 0.34, d: span + 2.6,
    },
  ];

  /* bollards */
  const bollardGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.42, 7);
  const bollardMat = new THREE.MeshStandardMaterial({ color: '#3f4642', roughness: 0.6, metalness: 0.35 });
  const bollards = new THREE.InstancedMesh(bollardGeo, bollardMat, 30);
  const bollardCapGeo = new THREE.SphereGeometry(0.1, 7, 5);
  const bollardCaps = new THREE.InstancedMesh(bollardCapGeo, bollardMat, 30);
  const m4 = new THREE.Matrix4();
  let bi = 0;
  for (const bankZ of [southZ + 0.75, northZ - 0.75]) {
    for (let i = 0; i < 15; i++) {
      const x = -42 + i * 6;
      if (Math.abs(x - bridgeX) < 4.2) continue;
      m4.makeTranslation(x, 0.21, bankZ);
      bollards.setMatrixAt(bi, m4);
      m4.makeTranslation(x, 0.44, bankZ);
      bollardCaps.setMatrixAt(bi, m4);
      bi += 1;
    }
  }
  bollards.count = bi;
  bollardCaps.count = bi;
  bollards.instanceMatrix.needsUpdate = true;
  bollardCaps.instanceMatrix.needsUpdate = true;
  group.add(bollards, bollardCaps);

  /* quay lamps */
  const lampColliders = [];
  for (const [x, z] of [
    [-34, southZ + 1.5], [-22, southZ + 1.5], [18, southZ + 1.5], [30, southZ + 1.5],
    [-27, northZ - 1.6], [27, northZ - 1.6],
  ]) {
    const lamp = createQuayLamp();
    lamp.position.set(x, 0, z);
    group.add(lamp);
    lampColliders.push({ type: 'circle', x, z, r: 0.24 });
  }

  /* bouquinistes on the south promenade */
  const bouquinistes = [
    [-25.5, 1], [21.5, 2], [27.5, 3], [33.5, 4],
  ];
  bouquinistes.forEach(([x, seed]) => {
    const stall = createBouquiniste(seed);
    stall.position.set(x, 0, southZ + 1.45);
    group.add(stall);
  });

  /* boats */
  const tourist = createMooredBoat({ x: 23, z: northZ + 1.9, yaw: 0, color: '#3c615d' });
  tourist.position.y = WATER_Y + 0.02;
  group.add(tourist);
  const rowBoat = createMooredBoat({ x: -24, z: southZ - 1.8, yaw: Math.PI, color: '#7c5b44' });
  rowBoat.scale.setScalar(0.44);
  rowBoat.position.y = WATER_Y + 0.02;
  group.add(rowBoat);

  /* floating leaves */
  const leaves = [];
  const leafMat = new THREE.MeshBasicMaterial({ color: '#d8b06a', side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const leafGeo = new THREE.PlaneGeometry(0.24, 0.12);
  const leafR = mulberry32(91);
  for (let i = 0; i < 14; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.rotation.x = -Math.PI / 2;
    leaf.rotation.z = leafR() * TAU;
    leaf.position.set(-40 + leafR() * 80, WATER_Y + 0.03, northZ + 1.2 + leafR() * (span - 2.4));
    leaf.userData.speed = 0.12 + leafR() * 0.25;
    leaf.userData.spin = (leafR() - 0.5) * 0.5;
    group.add(leaf);
    leaves.push(leaf);
  }

  const walkables = [bridge.deck];
  const colliders = [...quayColliders, ...bridgeColliders, ...lampColliders];
  for (const [x] of bouquinistes) {
    colliders.push({ type: 'box', x, z: southZ + 1.45, w: 1.75, d: 0.72 });
  }

  function update(dt, t) {
    water.material.uniforms.uTime.value = t;
    tourist.position.y = WATER_Y + 0.02 + Math.sin(t * 0.5 + tourist.userData.phase) * 0.018;
    tourist.rotation.z = Math.sin(t * 0.4) * 0.006;
    rowBoat.position.y = WATER_Y + 0.02 + Math.sin(t * 0.6 + rowBoat.userData.phase) * 0.02;
    rowBoat.rotation.z = Math.sin(t * 0.5 + 1) * 0.012;
    for (const leaf of leaves) {
      leaf.position.x += leaf.userData.speed * dt;
      leaf.rotation.z += leaf.userData.spin * dt;
      if (leaf.position.x > xMax - 4) leaf.position.x = xMin + 4;
    }
  }

  return {
    group,
    water,
    bridge,
    walkables,
    colliders,
    update,
    zCenter,
    southZ,
    northZ,
  };
}
