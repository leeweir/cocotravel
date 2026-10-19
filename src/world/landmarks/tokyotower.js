import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, instancedBeams, signTexture } from '../../core/utils.js';

const orangeMat = () => new THREE.MeshStandardMaterial({ color: '#d8553a', roughness: 0.6, metalness: 0.25 });
const whiteMat = () => new THREE.MeshStandardMaterial({ color: '#f0eadf', roughness: 0.7, metalness: 0.1 });
const iron = () => new THREE.MeshStandardMaterial({ color: '#4b443d', roughness: 0.6, metalness: 0.3 });
const stone = new THREE.MeshStandardMaterial({ color: '#bcae96', roughness: 0.95 });
const glassLit = () => new THREE.MeshStandardMaterial({
  color: '#79979f', roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.7,
  emissive: '#ffd08a', emissiveIntensity: 0,
});

export function createTokyoTower() {
  const group = new THREE.Group();
  const segmentsOrange = [];
  const segmentsWhite = [];
  const bulbs = [];
  const glassMats = [];
  const antennaBulbs = [];
  let lit = 0, litTarget = 0, time = 0;

  const mergeY = 11.5;
  const cAt = (y) => 1.4 + 4.9 * Math.pow(1 - Math.min(1, y / mergeY), 1.25);
  const wAt = (y) => 0.75 + 1.55 * (1 - Math.min(1, y / mergeY));
  const isWhite = (y) => Math.floor(y / 2.8) % 2 === 0;

  const pushBeam = (a, b, w) => {
    const y = (a.y + b.y) / 2;
    (isWhite(y) ? segmentsWhite : segmentsOrange).push({ a, b, w });
  };

  const legYs = [0.5, 2.1, 3.8, 5.6, 7.5, 9.4, mergeY];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      let prev = null;
      for (const y of legYs) {
        const cc = cAt(y), w = wAt(y);
        const ox = sx * cc, oz = sz * cc;
        const pts = [
          { x: ox - w / 2, y, z: oz - w / 2 }, { x: ox + w / 2, y, z: oz - w / 2 },
          { x: ox + w / 2, y, z: oz + w / 2 }, { x: ox - w / 2, y, z: oz + w / 2 },
        ];
        if (prev) {
          for (let k = 0; k < 4; k++) {
            pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(pts[k].x, pts[k].y, pts[k].z), 0.2);
            const j = (k + 1) % 4;
            pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), 0.1);
            pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(pts[j].x, pts[j].y, pts[j].z), 0.06);
            pushBeam(new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), new THREE.Vector3(pts[k].x, pts[k].y, pts[k].z), 0.06);
          }
          bulbs.push(new THREE.Vector3(ox, y, oz));
        }
        prev = pts;
      }
      const pad = new THREE.Mesh(new RoundedBoxGeometry(4.0, 0.6, 4.0, 2, 0.08), stone);
      pad.position.set(sx * 6.3, 0.02, sz * 6.3);
      pad.receiveShadow = true;
      group.add(pad);
    }
  }

  // upper shaft
  const shaftYs = [11.5, 14.2, 17.0, 19.8, 22.6, 25.4, 28.0, 30.2];
  const shaftW = [2.0, 1.8, 1.6, 1.42, 1.24, 1.06, 0.9, 0.8];
  let prev = null;
  for (let i = 0; i < shaftYs.length; i++) {
    const y = shaftYs[i], hw = shaftW[i];
    const cur = [
      { x: -hw, y, z: -hw }, { x: hw, y, z: -hw }, { x: hw, y, z: hw }, { x: -hw, y, z: hw },
    ];
    if (prev) {
      for (let k = 0; k < 4; k++) {
        const j = (k + 1) % 4;
        pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), 0.16);
        pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), 0.08);
        pushBeam(new THREE.Vector3(prev[k].x, prev[k].y, prev[k].z), new THREE.Vector3(cur[j].x, cur[j].y, cur[j].z), 0.055);
        pushBeam(new THREE.Vector3(prev[j].x, prev[j].y, prev[j].z), new THREE.Vector3(cur[k].x, cur[k].y, cur[k].z), 0.055);
      }
    }
    bulbs.push(new THREE.Vector3(hw, y, hw));
    prev = cur;
  }

  group.add(instancedBeams(segmentsOrange, orangeMat()));
  group.add(instancedBeams(segmentsWhite, whiteMat()));

  /* main deck */
  const deck = new THREE.Group();
  deck.position.y = mergeY;
  const deckBox = new THREE.Mesh(new RoundedBoxGeometry(9.0, 1.75, 9.0, 3, 0.25), new THREE.MeshStandardMaterial({
    color: '#f2ece1', roughness: 0.6, metalness: 0.15,
  }));
  deckBox.position.y = 0.9;
  deckBox.castShadow = true;
  deckBox.receiveShadow = true;
  deck.add(deckBox);
  const gm = glassLit();
  glassMats.push(gm);
  for (let i = 0; i < 4; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.78, 0.08), gm);
    win.position.set(0, 1.1, 4.53);
    const grp = new THREE.Group();
    grp.add(win);
    grp.rotation.y = i * Math.PI / 2;
    deck.add(grp);
  }
  for (const [w, dy] of [[10.2, 0.1], [9.5, 1.8]]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, w), orangeMat());
    band.position.y = dy;
    deck.add(band);
  }
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.35, 16), whiteMat());
  roof.position.y = 2.1;
  deck.add(roof);
  const deckRail = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.07, 0.07), iron());
    rail.position.set(0, 2.45, 4.75);
    const g = new THREE.Group(); g.add(rail); g.rotation.y = i * Math.PI / 2; deckRail.add(g);
  }
  deck.add(deckRail);
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * TAU;
    bulbs.push(new THREE.Vector3(Math.cos(a) * 4.9, mergeY + 2.0, Math.sin(a) * 4.9));
  }
  group.add(deck);

  /* top deck */
  const topDeck = new THREE.Group();
  topDeck.position.y = 26.2;
  const topBox = new THREE.Mesh(new RoundedBoxGeometry(4.4, 1.5, 4.4, 3, 0.2), new THREE.MeshStandardMaterial({
    color: '#efe8dc', roughness: 0.55, metalness: 0.18,
  }));
  topBox.position.y = 0.75;
  topBox.castShadow = true;
  topDeck.add(topBox);
  const gm2 = glassLit();
  glassMats.push(gm2);
  for (let i = 0; i < 4; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.55, 0.06), gm2);
    win.position.set(0, 0.85, 2.22);
    const g = new THREE.Group(); g.add(win); g.rotation.y = i * Math.PI / 2; topDeck.add(g);
  }
  const topBand = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 4.8), orangeMat());
  topBand.position.y = 1.55;
  topDeck.add(topBand);
  const topRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.24, 12), whiteMat());
  topRoof.position.y = 1.75;
  topDeck.add(topRoof);
  topDeck.position.x = 0;
  group.add(topDeck);

  /* antenna */
  const antenna = new THREE.Group();
  antenna.position.y = 30.2;
  const mast1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 5.0, 10), orangeMat());
  mast1.position.y = 2.5;
  antenna.add(mast1);
  const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 3.6, 8), whiteMat());
  mast2.position.y = 6.8;
  antenna.add(mast2);
  const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 5, 16);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(ringGeo, iron());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.6 + i * 0.8;
    antenna.add(ring);
  }
  const aviMat = new THREE.MeshStandardMaterial({ color: '#ff7a66', emissive: '#ff3b2f', emissiveIntensity: 1.4 });
  const avi1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), aviMat);
  avi1.position.y = 8.7;
  antenna.add(avi1);
  const avi2 = avi1.clone(); avi2.position.y = 4.0; avi2.scale.setScalar(0.7); antenna.add(avi2);
  const avi3 = avi1.clone(); avi3.position.y = 1.2; avi3.scale.setScalar(0.6); antenna.add(avi3);
  antennaBulbs.push(avi1, avi2, avi3);
  group.add(antenna);

  /* base building + sign */
  const baseBldg = new THREE.Mesh(new RoundedBoxGeometry(5.4, 2.0, 3.4, 3, 0.15), new THREE.MeshStandardMaterial({
    color: '#f1e8da', roughness: 0.8,
  }));
  baseBldg.position.set(0, 1.0, 11.5);
  baseBldg.castShadow = true;
  baseBldg.receiveShadow = true;
  group.add(baseBldg);
  const baseRoof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.25, 3.8), orangeMat());
  baseRoof.position.set(0, 2.1, 11.5);
  group.add(baseRoof);
  const signTex = signTexture('TOKYO TOWER', { sub: '東京タワー · 1958', bg: '#f6efe2', fg: '#b8432d', border: '#b8432d', size: 52 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  sign.position.set(0, 1.25, 13.22);
  group.add(sign);
  for (const s of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.1), new THREE.MeshStandardMaterial({ color: '#5a4637', roughness: 0.7 }));
    door.position.set(s * 1.7, 1.0, 13.17);
    group.add(door);
  }

  group.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });

  /* outline bulbs */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let y = 2.2; y < 30; y += 2.3) {
      const cc = y < mergeY ? cAt(y) : shaftW[Math.min(shaftW.length - 1, Math.floor((y - 11.5) / 2.8))];
      bulbs.push(new THREE.Vector3(sx * cc, y, sz * cc));
    }
  }
  const bulbGeo = new THREE.SphereGeometry(0.055, 5, 4);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const bulbMesh = new THREE.InstancedMesh(bulbGeo, bulbMat, bulbs.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  bulbs.forEach((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z);
    bulbMesh.setMatrixAt(i, m4);
    bulbMesh.setColorAt(i, col.setHex(0x2a221c));
  });
  bulbMesh.instanceMatrix.needsUpdate = true;
  bulbMesh.visible = false;
  group.add(bulbMesh);

  function setLit(on) {
    litTarget = on ? 1 : 0;
    bulbMesh.visible = true;
  }

  function update(dt, t) {
    time = t;
    lit += (litTarget - lit) * Math.min(1, dt * 0.9);
    const on = lit > 0.02;
    bulbMesh.visible = on;
    if (on) {
      const cursor = Math.floor((t * 60) % bulbs.length);
      for (let k = 0; k < 22; k++) {
        const idx = (cursor + k) % bulbs.length;
        const tw = 0.3 + Math.random() * 0.9;
        col.setHSL(0.09, 0.55, 0.55 + tw * 0.28);
        col.multiplyScalar(lit * (0.65 + tw * 0.5));
        bulbMesh.setColorAt(idx, col);
      }
      bulbMesh.instanceColor.needsUpdate = true;
    }
    glassMats.forEach((g) => { g.emissiveIntensity = lit * 1.1; });
    antennaBulbs.forEach((b, i) => {
      b.material.emissiveIntensity = 0.4 + (Math.sin(t * (3 + i * 0.7) + i * 2) > 0.2 ? 1.6 : 0.1) * (0.4 + lit);
    });
    topDeck.rotation.y = Math.sin(t * 0.1) * 0.001;
  }

  return {
    group,
    update,
    setLit,
    colliders: [
      { type: 'circle', x: -6.3, z: -6.3, r: 1.9 },
      { type: 'circle', x: 6.3, z: -6.3, r: 1.9 },
      { type: 'circle', x: -6.3, z: 6.3, r: 1.9 },
      { type: 'circle', x: 6.3, z: 6.3, r: 1.9 },
      { type: 'box', x: 0, z: 11.5, w: 5.6, d: 3.8 },
    ],
    heart: new THREE.Vector3(0, 0.4, 15.6),
    anchors: { top: new THREE.Vector3(0, 32, 0), deck: new THREE.Vector3(0, 13.5, 0) },
  };
}
