import * as THREE from 'three';
import { batchRigidProp } from '../core/static-meshes.js';
import { TAU, lerp } from '../core/utils.js';

const vector = ([x,y,z]) => new THREE.Vector3(x,y,z);
export const curve = points => new THREE.CatmullRomCurve3(points.map(vector));

export function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const part = new THREE.Mesh(geometry,material);
  part.position.set(x,y,z);
  parent.add(part);
  return part;
}

export function joint(parent, x = 0, y = 0, z = 0) {
  const part = new THREE.Group();
  part.position.set(x,y,z);
  parent.add(part);
  return part;
}

export function ellipsoid(parent, material, radii, center, sides = 20, rows = 14) {
  const part = mesh(parent,new THREE.SphereGeometry(1,sides,rows),material,...center);
  part.scale.set(...radii);
  return part;
}

// Rings run from bottom to top. Angle zero faces forward, along local +Z.
export function rings(rows, sides, sample) {
  const pos = [], uv = [], colors = [], index = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i <= sides; i++) {
      const u = i/sides;
      const [x,y,z,color] = sample(j,u*TAU);
      pos.push(x,y,z);
      uv.push(u,j/(rows-1));
      if (color) colors.push(color.r,color.g,color.b);
      if (j < rows-1 && i < sides) {
        const k = j*(sides+1)+i;
        index.push(k,k+1,k+sides+1, k+1,k+sides+2,k+sides+1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  if (colors.length) geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  // UVs need a seam; the silhouette and its lighting should be continuous there.
  const normals = geometry.attributes.normal;
  const normal = new THREE.Vector3(), other = new THREE.Vector3();
  for (let j = 0; j < rows; j++) {
    const first = j*(sides+1), last = first+sides;
    normal.fromBufferAttribute(normals,first).add(other.fromBufferAttribute(normals,last)).normalize();
    normals.setXYZ(first,normal.x,normal.y,normal.z);
    normals.setXYZ(last,normal.x,normal.y,normal.z);
  }
  return geometry;
}

export function signedPow(value, exponent) {
  return Math.sign(value)*Math.pow(Math.abs(value),exponent);
}

// Each section is [height, half width, half depth, optional depth offset].
export function loft(profile, sides = 32, exponent = 1) {
  return rings(profile.length,sides,(j,a) => {
    const [y,x,z,offset = 0] = profile[j];
    return [x*signedPow(Math.sin(a),exponent),y,offset+z*signedPow(Math.cos(a),exponent)];
  });
}

export function cord(parent, points, radius, material, steps = 20) {
  return mesh(parent,new THREE.TubeGeometry(curve(points),steps,radius,6,false),material);
}

// A tapered lock or strip of cloth has a wide face and a much shallower edge.
export function sweep(points, widths, depth, facing = [0,0,1]) {
  const path = curve(points), sides = 12, steps = (points.length-1)*6;
  const normal = new THREE.Vector3(), binormal = new THREE.Vector3(), guide = vector(facing);
  const positions = [], indices = [];
  for (let j = 0; j <= steps; j++) {
    const t = j/steps, center = path.getPoint(t), tangent = path.getTangent(t);
    normal.crossVectors(guide,tangent).normalize();
    binormal.crossVectors(tangent,normal);
    const f = t*(widths.length-1), k = Math.min(Math.floor(f),widths.length-2);
    const fraction = f-k, prev = widths[Math.max(0,k-1)], next = widths[Math.min(widths.length-1,k+2)];
    const width = THREE.MathUtils.clamp(hermite(widths[k],widths[k+1],(widths[k+1]-prev)*.5,(next-widths[k])*.5,fraction),
      Math.min(widths[k],widths[k+1]),Math.max(widths[k],widths[k+1]));
    for (let i = 0; i < sides; i++) {
      const a = i*TAU/sides, x = Math.cos(a)*width, z = Math.sin(a)*width*depth;
      positions.push(center.x+normal.x*x+binormal.x*z,center.y+normal.y*x+binormal.y*z,center.z+normal.z*x+binormal.z*z);
      if (j < steps) {
        const l = j*sides+i, r = j*sides+(i+1)%sides;
        indices.push(l,r,l+sides, r,r+sides,l+sides);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function fabricPanel(parent, edgeA, edgeB, mat, bulge = .003) {
  const a = curve(edgeA), b = curve(edgeB), steps = 20, across = 4;
  const pos = [], indices = [];
  for (let j = 0; j <= steps; j++) {
    const left = a.getPoint(j/steps), right = b.getPoint(j/steps);
    for (let i = 0; i <= across; i++) {
      const u = i/across;
      pos.push(lerp(left.x,right.x,u),lerp(left.y,right.y,u)+bulge*Math.sin(u*Math.PI),lerp(left.z,right.z,u));
      if (j < steps && i < across) {
        const k = j*(across+1)+i;
        indices.push(k,k+across+1,k+1, k+1,k+across+1,k+across+2);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(parent,geo,mat);
}

export function hermite(a,b,slopeA,slopeB,t) {
  const t2 = t*t, t3 = t2*t;
  return (2*t3-3*t2+1)*a+(t3-2*t2+t)*slopeA+(-2*t3+3*t2)*b+(t3-t2)*slopeB;
}

// Cross-sections follow the tangent even where a bent sleeve or tail points forward.
export function taperedTube(points, widths, sides = 16, colorAt) {
  const path = curve(points), steps = (points.length-1)*7;
  const frames = path.computeFrenetFrames(steps,false);
  const pos=[], normals=[], colors=[], index=[];
  const center=new THREE.Vector3(), normal=new THREE.Vector3();
  for(let j=0;j<=steps;j++){
    const t=j/steps, u=path.getUtoTmapping(t), f=u*(widths.length-1);
    const k=Math.min(Math.floor(f),widths.length-2), radius=lerp(widths[k],widths[k+1],f-k);
    path.getPoint(u,center);
    for(let i=0;i<=sides;i++){
      const a=i*TAU/sides;
      normal.copy(frames.normals[j]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[j],Math.sin(a));
      normals.push(normal.x,normal.y,normal.z);
      pos.push(center.x+radius*normal.x,center.y+radius*normal.y,center.z+radius*normal.z);
      if(colorAt){
        const col=colorAt(t,a);
        colors.push(col.r,col.g,col.b);
      }
      if(j<steps && i<sides){
        const l=j*(sides+1)+i;
        index.push(l,l+1,l+sides+1,l+1,l+sides+2,l+sides+1);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  if(colors.length)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(index);
  return geometry;
}

// Untextured cloth, face paint and small accessories share rigid, vertex-coloured surfaces.
// The moving head, eyelids, arms and animal tail retain their own pivots.
export function finishFigure(body,pivots) {
  const surfaces=new Map();
  body.traverse(o=>{
    if(!o.isMesh)return;
    const mat=o.material;
    o.castShadow=!mat.transparent;o.receiveShadow=o.castShadow;
    if(!mat.isMeshStandardMaterial || mat.map || mat.transparent)return;
    const geo=o.geometry, points=geo.attributes.position, old=geo.attributes.color;
    const color=new THREE.Color(), colors=new Float32Array(points.count*3);
    for(let i=0;i<points.count;i++){
      color.copy(mat.color);
      if(mat.vertexColors && old){color.r*=old.getX(i);color.g*=old.getY(i);color.b*=old.getZ(i);}
      color.toArray(colors,i*3);
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geo.deleteAttribute('uv');
    const key=[mat.roughness,mat.metalness,mat.side].join('/');
    if(!surfaces.has(key)){
      const surface=mat.clone();surface.color.set(0xffffff);surface.vertexColors=true;
      surfaces.set(key,surface);
    }
    o.material=surfaces.get(key);
  });
  // Work from the leaves up so batching a torso can never absorb an animated child.
  for(const pivot of [...pivots,body])batchRigidProp(pivot,pivots.filter(other=>other!==pivot));
}
