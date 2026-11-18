import * as THREE from 'three';
import lindenUrl from '../assets/linden-spray.webp';
import cherryUrl from '../assets/cherry-spray.webp';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { blobShadow, mulberry32, TAU } from '../core/utils.js';

const paintedWood = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 });
const foliage = new THREE.MeshBasicMaterial({ vertexColors: true });
const petals = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

function surface(positions, colors, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Cross-sections follow the leaning trunk, from the root flare to the fine tips.
function woodLimb(rings, base, sides = 9) {
  const positions = [], colors = [], indices = [];
  const color = new THREE.Color();
  for (const [j, [x, y, z, radius]] of rings.entries()) {
    for (let i = 0; i < sides; i++) {
      const a = i / sides * TAU;
      positions.push(x + Math.cos(a) * radius, y, z + Math.sin(a) * radius);
      color.copy(base).multiplyScalar(0.78 + 0.26 * (0.5 + 0.5 * Math.cos(a * 3)) + j * 0.035);
      colors.push(color.r, color.g, color.b);
      if (j > 0) {
        const l = (j - 1) * sides + i, r = (j - 1) * sides + (i + 1) % sides;
        indices.push(l, l + sides, r, r, l + sides, r + sides);
      }
    }
  }
  return surface(positions, colors, indices);
}

// A continuous painted crown, with uneven edges and a cooler, shaded underside.
function crownGeometry() {
  const positions = [], colors = [], indices = [];
  const n = 10, rings = 5;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings * Math.PI;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, y = Math.cos(t);
      const ripple = 1 + Math.sin(5 * a + t * 3) * 0.09 * Math.sin(t) + 0.065 * Math.cos(3 * a - t * 7) * Math.sin(t);
      positions.push(Math.cos(a) * Math.sin(t) * ripple, y + Math.sin(a * 4 + t) * 0.07 * Math.sin(t), Math.sin(a) * Math.sin(t) * ripple);
      const light = 0.87 + 0.14 * y + 0.055 * Math.cos(a * 4 + t * 3);
      colors.push(light * (1 + 0.08 * y), light, light * (0.96 - 0.09 * y));
      if (j < rings) {
        const l = j * n + i, r = j * n + (i + 1) % n;
        if (j > 0) indices.push(l, r, l + n);
        if (j < rings - 1) indices.push(r, r + n, l + n);
      }
    }
  }
  return surface(positions, colors, indices);
}

// Each blade has a raised midrib and tapers to a curved point.
function bladeGeometry() {
  return surface(
    [0,0,0, -.22,.33,.10, -.19,.66,.23, 0,.9,.5, .21,.61,.22, .22,.31,.10, 0,.46,.21],
    [.48,.58,.57, .77,.86,.78, .99,1,.89, 1,1,.91, .88,.95,.8, .64,.76,.65, 1,1,.92],
    [0,6,1, 1,6,2, 2,6,3, 3,6,4, 4,6,5, 5,6,0],
  );
}

const crown = crownGeometry();
const blade = bladeGeometry();
const spray = new THREE.PlaneGeometry(1, .72, 2, 1);
for (let i = 0; i < spray.attributes.position.count; i++) {
  const x = spray.attributes.position.getX(i), y = spray.attributes.position.getY(i);
  spray.attributes.position.setZ(i, .12 - x*x*.5 - y*y*.5);
}
const sprayMaterials = new Map();
function leavesFor(url) {
  if (!sprayMaterials.has(url)) {
    const map = new THREE.TextureLoader().load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({map, alphaTest:.42, side:THREE.DoubleSide});
    sprayMaterials.set(url,mat);
  }
  return sprayMaterials.get(url);
}
const transform = new THREE.Object3D();

function place(instances, index, x, y, z, rx, ry, rz, sx, sy, sz, color) {
  transform.position.set(x, y, z);
  transform.rotation.set(rx, ry, rz, 'YXZ');
  transform.scale.set(sx, sy, sz);
  transform.updateMatrix();
  instances.setMatrixAt(index, transform.matrix);
  instances.setColorAt(index, color);
}

export function createTree({
  height = 2.2, canopy = 1.5, colors = ['#688f65', '#9db66c', '#759c74'],
  trunkColor = '#826451', blossom = false, seed = 1,
} = {}) {
  const random = mulberry32(seed);
  const tree = new THREE.Group();
  const bark = new THREE.Color(blossom ? '#765c60' : trunkColor);
  const lean = (random() - 0.5) * canopy * 0.29;
  const wood = [woodLimb([
    [0,0,0,canopy * 0.117], [0,height * 0.08,0,canopy * 0.085],
    [lean * .25,height * .4,.04,canopy * .069], [lean,height * .68,-.03,canopy * .055],
    [lean * .65,height * .89,.08,canopy * .034], [lean,height * 1.13,0,.012],
  ], bark)];
  const palette = colors.map(c => new THREE.Color(c));
  const shade = new THREE.Color(blossom ? '#bf839b' : '#466f64');
  const branchCount = blossom ? 7 : 6, lobeCount = branchCount * 3 + 1, accentsPerLobe = 18;
  const masses = new THREE.InstancedMesh(crown, foliage, lobeCount);
  const tips = new THREE.InstancedMesh(spray, leavesFor(blossom ? cherryUrl : lindenUrl), lobeCount * accentsPerLobe);
  const color = new THREE.Color();
  let clump = 0;
  function cluster(x, y, z, radius, vertical) {
    const yaw = random() * TAU, rz = (random() - .5) * .25;
    color.copy(palette[clump % palette.length]).lerp(shade, Math.min(.34, Math.max(0, (height - y) / canopy * .45)));
    place(masses, clump, x,y,z, 0,yaw,rz, radius*.85,vertical*.85,radius*.76, color);
    const phase = random()*TAU;
    for (let k = 0; k < accentsPerLobe; k++) {
      const a = k*2.39996 + phase, up = (k+.5)/accentsPerLobe*1.92-.95;
      const spread = Math.sqrt(1-up*up);
      const size = radius * (.88 + random()*.38);
      const light = .74 + .20*up + .11*Math.cos(a-.7) + random()*.11;
      color.setRGB(light*(1+.055*up),light,light*(1-.07*up));
      place(tips, clump * accentsPerLobe + k,
        x + Math.cos(a)*radius*spread*.91, y + up*vertical*.92, z + Math.sin(a)*radius*spread*.83,
        -Math.asin(up)*.85, Math.PI/2-a, (random()-.5)*1.3, size,size,size, color);
    }
    clump++;
  }
  for (let i = 0; i < branchCount; i++) {
    const a = (i + random() * .55) * TAU / branchCount;
    const reach = canopy * (.55 + random() * .40 + .13 * Math.cos(a + lean * 4));
    const ex = Math.cos(a) * reach + lean, ez = Math.sin(a) * reach;
    const ey = height + canopy * (.04 + random() * .50 - .10 * Math.cos(a + lean * 4));
    wood.push(woodLimb([
      [lean * .65,height * (.48 + random() * .14),0,canopy * .057],
      [lean + .28 * ex,height * .73,.28 * ez,canopy * .045],
      [.66 * ex,ey - .22 * canopy,.66 * ez,canopy * .031], [ex,ey,ez,.01],
    ], bark, 7));
    const size = canopy * (.35 + random() * .16);
    cluster(ex,ey,ez,size,size * (blossom ? .67 : .8));
    cluster(ex * .62, ey + canopy * .18, ez * .60, size * 1.26, size * .98);
    cluster(ex + Math.sin(a) * size * .5, ey - size * .19, ez - Math.cos(a) * size * .5, size * .73,size * .5);
  }
  cluster(lean, height + canopy * .55, 0, canopy * .61, canopy * .47);
  const trunk = new THREE.Mesh(mergeGeometries(wood), paintedWood);
  wood.forEach(g => g.dispose());
  trunk.castShadow = trunk.receiveShadow = masses.castShadow = masses.receiveShadow = true;
  tree.add(trunk, masses, tips);
  const shadow = blobShadow(canopy * .98, .16);
  shadow.position.y = .026;
  tree.add(shadow);
  return tree;
}

function shrubRow(length, height, halfWidth, ink, count) {
  const group = new THREE.Group();
  const random = mulberry32(Math.round(length*317 + height*113));
  const base = new THREE.Color(ink), color = new THREE.Color();
  const lobes = new THREE.InstancedMesh(crown, foliage, count);
  const sprigs = 24;
  const leaves = new THREE.InstancedMesh(spray, leavesFor(lindenUrl), count*sprigs);
  for (let i = 0; i < count; i++) {
    const width = length/count, x = -length/2 + (i+.5)*width;
    const h = height*(.46 + .09*random()), z = halfWidth*(random()-.5)*.32;
    color.copy(base).multiplyScalar(.77 + .22*random());
    place(lobes,i, x,h*.91,z, 0,0,(random()-.5)*.16, width*.73,h,halfWidth, color);
    for (let j = 0; j < sprigs; j++) {
      const a = j*2.4 + i*.83, up = (j+.5)/sprigs*1.42-.43;
      const reach = Math.sqrt(1-up*up);
      const size = Math.min(halfWidth*1.3,width*.78)*(.70 + random()*.4);
      color.setScalar(.52 + .16*up + .13*random());
      place(leaves,i*sprigs+j, x+Math.cos(a)*width*.72*reach,h*(.91+up),z+Math.sin(a)*halfWidth*reach,
        -Math.asin(up), Math.PI/2-a, (random()-.5)*1.5, size,size,size, color);
    }
  }
  lobes.castShadow = true;
  group.add(lobes, leaves);
  return group;
}

export function createBush(scale = 1, color = '#748c63') {
  return shrubRow(1.08*scale,.62*scale,.42*scale,color,3);
}

export function createHedge(length = 4, height = .8) {
  return shrubRow(length,height,.44,'#667f58',Math.max(2,Math.ceil(length/.72)));
}

// A shallow cup of overlapping petals and a raised ochre centre, baked as one flower.
function flowerGeometry(count, cupped) {
  const positions = [], colors = [], indices = [];
  const center = new THREE.Color(cupped ? '#764e2f' : '#efb53c');
  for (let p = 0; p < count; p++) {
    const a = p * TAU / count, start = positions.length / 3;
    const outline = [[-.08,.08,.06],[-.39,.57,.18],[-.29,.95,.28],[0,1,.32],[.29,.92,.27],[.35,.55,.16],[.08,.08,.06],[0,.5,.09]];
    for (const [w, length, depth] of outline) {
      const width = w * (cupped ? 1.55 : .82);
      positions.push(Math.cos(a) * length - Math.sin(a) * width, depth + (cupped ? length * length * .65 : 0), Math.sin(a) * length + Math.cos(a) * width);
      colors.push(.79 + .21 * length, .58 + .42 * length, .55 + .45 * length);
    }
    for (let i = 0; i < 6; i++) indices.push(start + i, start + 7, start + i + 1);
  }
  const start = positions.length / 3;
  positions.push(0,.35,0); colors.push(center.r,center.g,center.b);
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10;
    positions.push(.235 * Math.cos(a), .12, .235 * Math.sin(a));
    colors.push(center.r,center.g,center.b);
    indices.push(start, start + 1 + (i + 1) % 10, start + 1 + i);
  }
  return surface(positions, colors, indices);
}

const daisy = flowerGeometry(9, false), poppy = flowerGeometry(5, true);
const stem = new THREE.CylinderGeometry(0.72,1,1,5);
const stemMaterial = new THREE.MeshLambertMaterial({ color: '#729167' });
const soilMaterial = new THREE.MeshStandardMaterial({ color: '#705746', roughness: 1 });
const edging = new THREE.MeshStandardMaterial({ color: '#bdab91', roughness: .94 });

export function createFlowerBed(radius = 2, colors = ['#fff2d0', '#edaa63', '#e89588']) {
  const bed = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.LatheGeometry([
    [radius - .08,.19], [radius - .03,.25], [radius + .04,.27], [radius + .085,.245],
    [radius + .09,.19], [radius + .055,.16], [radius + .05,.045], [radius + .07,.01],
  ].reverse().map(([x,y]) => new THREE.Vector2(x,y)), 54), edging);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.18,48), soilMaterial);
  soil.position.y = .085;
  soil.receiveShadow = basin.receiveShadow = true;
  bed.add(basin, soil);
  const n = Math.max(12, Math.round(radius * radius * 24));
  const daisies = new THREE.InstancedMesh(daisy, petals, Math.ceil(n / 2));
  const poppies = new THREE.InstancedMesh(poppy, petals, Math.floor(n / 2));
  const stems = new THREE.InstancedMesh(stem, stemMaterial, n);
  const leaves = new THREE.InstancedMesh(blade, petals, n * 5);
  const random = mulberry32(Math.round(radius * 113) + parseInt(colors[0].slice(1), 16));
  const palette = colors.map(c => new THREE.Color(c));
  const greens = ['#628b69','#759b6d','#456f63','#92a873'].map(c => new THREE.Color(c));
  const white = new THREE.Color(0xffffff);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996, rr = Math.sqrt((i + .5) / n) * (radius - .13);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const h = .19 + random() * .27 + .12 * (1 - rr / radius);
    const s = .085 + random() * .065, tilt = .18 + random() * .96;
    place(stems,i, x,.17 + h / 2,z, 0,0,0, .009,h,.009, white);
    const flowers = i % 2 ? poppies : daisies;
    place(flowers, Math.floor(i / 2), x,.17+h,z, tilt,a + .4,random() * .4, s,s,s, palette[Math.floor(i / 7 + rr * 2) % palette.length]);
    for (let k = 0; k < 5; k++) {
      const size = .15 + random() * .23;
      place(leaves,i * 5 + k, x,.17 + h * (k % 2) * .43,z, .45 + random() * .8,a + k * 2.3,0, size,size,size, greens[(i + k) % greens.length]);
    }
  }
  bed.add(stems, leaves, daisies, poppies);
  return bed;
}
