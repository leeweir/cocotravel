import * as THREE from 'three';
import skyUrl from '../assets/watercolor-sky.webp';
import {
  canvas2d, canvasTexture, dotTexture, sandTexture, TAU,
  mulberry32, rand, lerp,
} from '../core/utils.js';

export const THEMES = {
  usa: {
    skyTop: '#6aa6cf',
    skyHorizon: '#ffe0b5',
    skyBottom: '#edcdae',
    sunColor: '#ffe3a8',
    sunDir: new THREE.Vector3(0.55, 0.62, 0.42).normalize(),
    waterDeep: '#2c6478',
    waterShallow: '#6fb9b8',
    fog: '#d8e5df',
    hemiSky: '#e2f1fd',
    hemiGround: '#7f7356',
    sunLight: '#fff0d2',
    sunIntensity: 2.55,
    fillLight: '#a9c9de',
    skyTurn: .32, skyTint: '#fff2de',
    exposure: 1.02,
  },
  france: {
    skyTop: '#7f8fbe',
    skyHorizon: '#ffd2ae',
    skyBottom: '#e6b7ab',
    sunColor: '#ffd29a',
    sunDir: new THREE.Vector3(-0.72, 0.30, 0.33).normalize(),
    waterDeep: '#466a80',
    waterShallow: '#8fbcb6',
    fog: '#efd9d2',
    hemiSky: '#e5e1f6',
    hemiGround: '#71605a',
    sunLight: '#ffd3a0',
    sunIntensity: 2.5,
    fillLight: '#d7b9cf',
    skyTurn: 1.43, skyTint: '#f8d5d5',
    exposure: 1.04,
  },
  japan: {
    skyTop: '#78aecd',
    skyHorizon: '#ffe3d4',
    skyBottom: '#f4cfc0',
    sunColor: '#fff0ca',
    sunDir: new THREE.Vector3(0.3, 0.72, -0.42).normalize(),
    waterDeep: '#3b7586',
    waterShallow: '#8fcac2',
    fog: '#dfe7e6',
    hemiSky: '#e2f1f3',
    hemiGround: '#7b7059',
    sunLight: '#fff3dc',
    sunIntensity: 2.6,
    fillLight: '#c7d5e2',
    skyTurn: .64, skyTint: '#ffe8eb',
    exposure: 1.03,
  },
};

let skyMap, reflectionMap, skyReady;
export function prepareSky() {
  if (!skyMap) {
    let finish;
    skyReady = new Promise(resolve => { finish = resolve; });
    skyMap = new THREE.TextureLoader().load(skyUrl, (texture) => {
      // Small prefiltered environment for brass, glass and leather.
      const { c, ctx } = canvas2d(256,128);
      ctx.drawImage(texture.image, 0,0,256,64);
      const ground = ctx.createLinearGradient(0,64,0,128);
      ground.addColorStop(0,'#c4bca4');
      ground.addColorStop(.4,'#8d9784');
      ground.addColorStop(1,'#747568');
      ctx.fillStyle = ground;
      ctx.fillRect(0,64,256,64);
      reflectionMap = new THREE.CanvasTexture(c);
      reflectionMap.colorSpace = THREE.SRGBColorSpace;
      reflectionMap.mapping = THREE.EquirectangularReflectionMapping;
      finish();
    }, undefined, () => finish());
    skyMap.colorSpace = THREE.SRGBColorSpace;
    skyMap.wrapS = THREE.MirroredRepeatWrapping;
  }
  return skyReady;
}

function skyMaterial(theme) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uPaper: {value: skyMap}, uPaint: {value: reflectionMap ? 1 : 0}, uTurn: {value: theme.skyTurn},
      uTop: {value: new THREE.Color(theme.skyTop)}, uHorizon: {value: new THREE.Color(theme.fog)},
      uTint: {value: new THREE.Color(theme.skyTint)}, uSunDir: {value: theme.sunDir},
      uSunColor: {value: new THREE.Color(theme.sunColor)},
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.);
        vDir = world.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform sampler2D uPaper;
      uniform vec3 uTop,uHorizon,uTint,uSunDir,uSunColor;
      uniform float uTurn,uPaint;
      void main() {
        vec3 dir = normalize(vDir);
        float h = asin(clamp(dir.y, -1., 1.));
        vec2 uv = vec2(atan(dir.x, -dir.z) / 3.141593 + uTurn, clamp(.105 + h * 1.62, .01, .995));
        vec3 wash = texture2D(uPaper, uv).rgb * uTint;
        vec3 col = mix(uHorizon, uTop, smoothstep(-.03, .66, h));
        col = mix(col, wash, uPaint * smoothstep(-.035, .075, h) * (1. - smoothstep(.57, 1.12, h)));
        float sun = max(0., dot(dir,uSunDir));
        col += uSunColor * (.13 * pow(sun,24.) + 1.7 * pow(sun,2200.));
        gl_FragColor = vec4(col,1.);
      }`,
  });
}

function waterMaterial(theme, extraIsland = null) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(theme.waterDeep) },
      uShallow: { value: new THREE.Color(theme.waterShallow) },
      uSky: { value: new THREE.Color(theme.skyHorizon) },
      uSunColor: { value: new THREE.Color(theme.sunColor) },
      uSunDir: { value: theme.sunDir.clone() },
      uFog: { value: new THREE.Color(theme.fog) },
      uIslandB: {
        value: new THREE.Vector3(
          extraIsland?.x || 0, extraIsland?.z || 0, extraIsland?.r || 0,
        ),
      },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      uniform float uTime;
      void main() {
        vec3 p = position;
        float d = length(p.xy);
        float wave = sin(p.x * 0.22 + uTime * 0.55) * 0.5 + sin(p.y * 0.31 - uTime * 0.4) * 0.5;
        p.z += wave * 0.12 * (1.0 - smoothstep(30.0, 200.0, d));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vWorld;
      uniform float uTime;
      uniform vec3 uDeep, uShallow, uSky, uSunColor, uSunDir, uFog;
      uniform vec3 uIslandB;
      void main() {
        vec2 p = vWorld.xz * 0.09;
        float t = uTime;
        float w1 = sin(p.x * 1.6 + t * 0.7) * 0.5 + sin(p.y * 2.2 - t * 0.5) * 0.5;
        float w2 = sin((p.x + p.y) * 1.1 + t * 0.9) * 0.5 + sin((p.x - p.y) * 1.9 - t * 0.6) * 0.5;
        float w3 = sin(p.x * 5.3 - t * 1.2) * 0.25 + sin(p.y * 4.7 + t * 1.4) * 0.25;
        vec3 n = normalize(vec3((w1 + w3) * 0.055, 1.0, (w2 + w3) * 0.055));
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(viewDir, n), 0.0), 2.6);

        float shoreA = 1.0 - smoothstep(45.0, 78.0, length(vWorld.xz));
        float shoreB = uIslandB.z > 0.5
          ? 1.0 - smoothstep(uIslandB.z * 0.82, uIslandB.z * 1.75, length(vWorld.xz - uIslandB.xy))
          : 0.0;
        float shore = max(shoreA, shoreB);
        vec3 col = mix(uDeep, uShallow, shore * 0.72);
        col = mix(col, uSky, fres * 0.62 + 0.05);

        float glint = pow(max(dot(reflect(-uSunDir, n), viewDir), 0.0), 160.0);
        col += uSunColor * glint * 1.35;
        float glint2 = pow(max(dot(reflect(-uSunDir, n), viewDir), 0.0), 18.0);
        col += uSunColor * glint2 * 0.06;

        float bands = smoothstep(0.86, 1.0, sin((w1 * 3.0 + w3 * 6.0 + t * 0.7) * 3.14159) * 0.5 + 0.5);
        col += vec3(0.05, 0.08, 0.07) * bands * shore * 0.6;

        float dist = length(cameraPosition - vWorld);
        col = mix(col, uFog, smoothstep(55.0, 320.0, dist));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function createEnvironment(scene, theme, {
  radius = 55, shadowRadius = 62, shadowCenter = [0, 0, 6], shadowFar = 260,
  extraIsland = null,
} = {}) {
  const group = new THREE.Group();
  scene.add(group);

  scene.fog = new THREE.Fog(new THREE.Color(theme.fog), 55, 320);

  // sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 40, 24), skyMaterial(theme));
  sky.frustumCulled = false;
  group.add(sky);

  const r = mulberry32(77);
  scene.environment = reflectionMap || null;
  scene.environmentIntensity = .33;

  // ocean
  // Concentrate wave vertices near the playable shoreline and spread them towards the horizon.
  const waterGeometry = new THREE.PlaneGeometry(2,2,64,64);
  const coordinates = waterGeometry.attributes.position;
  const oceanAxis = t => 550 * (.28*t + .72*t*t*t);
  for (let i = 0; i < coordinates.count; i++) {
    coordinates.setXY(i, oceanAxis(coordinates.getX(i)), oceanAxis(coordinates.getY(i)));
  }
  const water = new THREE.Mesh(waterGeometry, waterMaterial(theme, extraIsland));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.55;
  group.add(water);

  // foam ring along shore
  const foamMat = new THREE.SpriteMaterial({
    map: dotTexture(), color: 0xf8efdf, transparent: true, opacity: 0.3,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const foam = new THREE.Group();
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * TAU + r() * 0.1;
    const rr = radius + 1.4 + r() * 1.6;
    const s = new THREE.Sprite(foamMat.clone());
    s.material.opacity = 0.07 + r() * 0.14;
    s.position.set(Math.cos(a) * rr, -0.35, Math.sin(a) * rr);
    const sc = 4 + r() * 8;
    s.scale.set(sc, sc * 0.35, 1);
    s.userData.phase = r() * TAU;
    foam.add(s);
  }
  group.add(foam);

  // lights
  const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, 1.37);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(theme.sunLight, theme.sunIntensity);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = shadowFar;
  const sc = shadowRadius;
  sun.shadow.camera.left = -sc;
  sun.shadow.camera.right = sc;
  sun.shadow.camera.top = sc;
  sun.shadow.camera.bottom = -sc;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.target.position.set(shadowCenter[0], 0, shadowCenter[2]);
  sun.position.copy(theme.sunDir).multiplyScalar(Math.max(110, shadowFar * 0.42)).add(sun.target.position);
  group.add(sun, sun.target);

  const fill = new THREE.DirectionalLight(theme.fillLight, 0.76);
  fill.position.set(-theme.sunDir.x * 40, 26, -theme.sunDir.z * 40 - 10);
  group.add(fill);

  const ambient = new THREE.AmbientLight(0xfff2e0, 0.18);
  group.add(ambient);

  let time = 0;
  function update(dt) {
    time += dt;
    water.material.uniforms.uTime.value = time;
    foam.children.forEach((s) => {
      s.material.opacity = 0.055 + (Math.sin(time * 0.7 + s.userData.phase) * 0.5 + 0.5) * 0.12;
    });
  }

  return { group, update, sun, hemi, water };
}

/* ------------------------------------------------------------------ */
/*  island                                                             */
/* ------------------------------------------------------------------ */
function makeShoreGeometry(segments, rIn, rOutFn, yIn, yOut) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * TAU;
    const rOut = rOutFn(a);
    pos.push(Math.cos(a) * rIn, yIn, Math.sin(a) * rIn);
    pos.push(Math.cos(a) * rOut, yOut, Math.sin(a) * rOut);
    uv.push(0.5 + Math.cos(a) * rIn / 128, 0.5 + Math.sin(a) * rIn / 128);
    uv.push(0.5 + Math.cos(a) * rOut / 128, 0.5 + Math.sin(a) * rOut / 128);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function makeCliffGeometry(segments, radius, seed = 3) {
  const pos = [], uv = [], idx = [];
  const rOutFn = (a) => radius + Math.sin(a * 3 + seed) * 1.5 + Math.sin(a * 7 + seed * 2) * 0.9 + Math.sin(a * 13 + seed) * 0.35;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * TAU;
    const ro = rOutFn(a);
    const rb = ro - 3.2 + Math.sin(a * 5 + 1) * 0.5;
    pos.push(Math.cos(a) * ro, 0.0, Math.sin(a) * ro);
    pos.push(Math.cos(a) * rb, -3.6 - Math.sin(a * 4) * 0.35, Math.sin(a) * rb);
    uv.push(i / segments * 14, 1);
    uv.push(i / segments * 14, 0);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createIsland(theme, {
  radius = 55, seed = 3, groundTexture, groundColor = '#ffffff',
  cliffColor = '#c4ad8b', sandColor = '#e6d3ac', islets = 3, rockSkip = null,
  groundHoles = [],
} = {}) {
  const group = new THREE.Group();
  const r = mulberry32(seed);
  const segments = 112;
  const shoreR = (a) => radius + Math.sin(a * 3 + seed) * 1.4 + Math.sin(a * 7 + seed * 2) * 0.8 + Math.sin(a * 13 + seed * 0.5) * 0.35;

  // underwater plinth
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 1.5, radius - 8, 9, 64),
    new THREE.MeshStandardMaterial({ color: 0x746b54, roughness: 1 }),
  );
  plinth.position.y = -7.2;
  group.add(plinth);

  // cliff ring
  const cliffMat = new THREE.MeshStandardMaterial({
    color: cliffColor,
    map: sandTexture(seed + 40),
    roughness: 1,
    flatShading: true,
  });
  const cliff = new THREE.Mesh(makeCliffGeometry(segments, radius + 0.6, seed), cliffMat);
  cliff.receiveShadow = true;
  cliff.castShadow = true;
  group.add(cliff);

  // sand shore ring
  const sandTex = sandTexture(seed + 7);
  sandTex.repeat.set(9, 9);
  const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, color: sandColor, roughness: 0.98 });
  const shoreGeo = makeShoreGeometry(segments, radius - 3.6, (a) => shoreR(a) + 0.8, 0.03, -0.02);
  const shore = new THREE.Mesh(shoreGeo, sandMat);
  shore.receiveShadow = true;
  group.add(shore);

  // main ground disc with planar UVs (optionally carved by rivers/channels)
  let groundGeo;
  if (groundHoles.length) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius - 3.1, 0, TAU, false);
    for (const h of groundHoles) {
      const hole = new THREE.Path();
      hole.moveTo(h.x0, -h.z0);
      hole.lineTo(h.x1, -h.z0);
      hole.lineTo(h.x1, -h.z1);
      hole.lineTo(h.x0, -h.z1);
      hole.closePath();
      shape.holes.push(hole);
    }
    groundGeo = new THREE.ShapeGeometry(shape, segments);
    groundGeo.rotateX(-Math.PI / 2);
  } else {
    groundGeo = new THREE.CircleGeometry(radius - 3.1, segments);
    groundGeo.rotateX(-Math.PI / 2);
  }
  const pos = groundGeo.attributes.position;
  const uv = groundGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) / (radius * 2)) + 0.5, (pos.getZ(i) / (radius * 2)) + 0.5);
  }
  uv.needsUpdate = true;
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    color: groundColor,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  // boulders along the shore
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8e836d, roughness: 1, flatShading: true });
  for (let i = 0; i < 34; i++) {
    const a = r() * TAU;
    const rr = radius - 1.2 + r() * 2.4;
    const s = 0.5 + r() * 1.5;
    if (rockSkip && rockSkip(a)) continue;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.position.set(Math.cos(a) * rr, -0.25 - r() * 0.3, Math.sin(a) * rr);
    rock.rotation.set(r() * TAU, r() * TAU, r() * TAU);
    rock.scale.y = 0.55 + r() * 0.3;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  // tiny distant islets for depth
  for (let i = 0; i < islets; i++) {
    const a = r() * TAU;
    const dist = radius + 85 + r() * 90;
    const islet = new THREE.Mesh(
      new THREE.DodecahedronGeometry(6 + r() * 8, 1),
      new THREE.MeshStandardMaterial({ color: 0x7f8a78, roughness: 1, flatShading: true }),
    );
    islet.position.set(Math.cos(a) * dist, -2.6, Math.sin(a) * dist);
    islet.scale.y = 0.3;
    group.add(islet);
  }

  return { group, ground, shoreRadius: shoreR, walkRadius: radius - 6.0, radius };
}

/* ------------------------------------------------------------------ */
/*  lazy birds                                                         */
/* ------------------------------------------------------------------ */
export function createBirds(count = 7, color = '#fffaf0', height = 26, radius = 60) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const birds = [];
  for (let i = 0; i < count; i++) {
    const bird = new THREE.Group();
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.1, 1.1, 0, -0.35, 0, 0, -0.2], 3));
    wgeo.computeVertexNormals();
    const left = new THREE.Mesh(wgeo, mat);
    const right = new THREE.Mesh(wgeo, mat);
    right.scale.x = -1;
    bird.add(left, right);
    bird.position.set(rand(-radius, radius), height + rand(-8, 10), rand(-radius, radius));
    bird.scale.setScalar(0.6 + Math.random() * 0.7);
    group.add(bird);
    birds.push({ bird, left, right, phase: rand(0, TAU), speed: rand(0.06, 0.13), rad: rand(25, 75), y: bird.position.y });
  }
  function update(dt, t) {
    birds.forEach((b, i) => {
      const a = b.phase + t * b.speed;
      b.bird.position.x = Math.cos(a) * b.rad;
      b.bird.position.z = Math.sin(a) * b.rad * 0.8;
      b.bird.position.y = b.y + Math.sin(t * 0.5 + i) * 1.4;
      b.bird.rotation.y = -a + Math.PI / 2;
      const flap = Math.sin(t * 6 + b.phase * 3) * 0.5 + 0.5;
      b.left.rotation.z = flap * 0.6;
      b.right.rotation.z = -flap * 0.6;
    });
  }
  return { group, update };
}

/* ------------------------------------------------------------------ */
/*  floating ambient motes                                             */
/* ------------------------------------------------------------------ */
export function createPetals({ count = 90, radius = 42, colors = [0xffc7d4, 0xffe1e7, 0xffb4c8], size = 0.22, height = [2, 18] } = {}) {
  const geo = new THREE.PlaneGeometry(size, size * 0.72);
  const petalTex = (() => {
    const { c, ctx } = canvas2d(64, 64);
    ctx.translate(32, 32);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(18, -16, 20, 8, 0, 22);
    ctx.bezierCurveTo(-20, 8, -18, -16, 0, -22);
    ctx.fill();
    const t = canvasTexture(c); return t;
  })();
  const group = new THREE.Group();
  const list = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: petalTex, color: colors[i % colors.length],
      transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * radius;
    m.position.set(Math.cos(a) * rr, rand(height[0], height[1]), Math.sin(a) * rr);
    m.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
    m.userData = {
      speed: rand(0.5, 1.3), sway: rand(0.5, 1.6), phase: rand(0, TAU),
      spin: rand(-1.5, 1.5), fall: rand(0.25, 0.7),
    };
    group.add(m); list.push(m);
  }
  function update(dt, t) {
    for (const p of list) {
      p.position.y -= p.userData.fall * dt;
      p.position.x += Math.sin(t * p.userData.sway + p.userData.phase) * 0.3 * dt;
      p.position.z += Math.cos(t * p.userData.sway * 0.8 + p.userData.phase) * 0.24 * dt;
      p.rotation.x += p.userData.spin * dt;
      p.rotation.z += p.userData.spin * 0.6 * dt;
      if (p.position.y < 0.4) {
        p.position.y = height[1];
        const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * radius;
        p.position.x = Math.cos(a) * rr;
        p.position.z = Math.sin(a) * rr;
      }
    }
  }
  return { group, update };
}
