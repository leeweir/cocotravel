import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Batch only a rigid prop's opaque parts. Its parent remains movable and cullable.
export function batchRigidProp(root, keep = []) {
  const groups = new Map();
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  function visit(node) {
    if (!node.visible || keep.includes(node)) return;
    const mat = node.material;
    if (node.isMesh && !node.children.length && !node.isInstancedMesh && !node.isSkinnedMesh && mat?.isMeshStandardMaterial && !mat.transparent && node.matrixWorld.determinant() > 0) {
      const geo = node.geometry;
      // Textured or emissive parts keep their original material and its live uniforms.
      const simple = mat.emissive.getHex() === 0 && !Object.values(mat).some(v => v?.isTexture);
      const materialKey = simple
        ? [mat.type, mat.color.getHex(), mat.roughness, mat.metalness, mat.flatShading, mat.side, mat.vertexColors].join('/')
        : mat.uuid;
      const key = [materialKey, node.castShadow, node.receiveShadow, node.renderOrder,
        mat.polygonOffset, mat.polygonOffsetFactor, mat.polygonOffsetUnits, !!geo.index, Object.keys(geo.attributes).sort().join('/')].join(':');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(node);
    }
    node.children.forEach(visit);
  }
  visit(root);
  for (const parts of groups.values()) {
    if (parts.length < 2) continue;
    const first = parts[0];
    const geometries = parts.map(part => part.geometry.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, part.matrixWorld),
    ));
    const geometry = mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, first.material);
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    mesh.renderOrder = first.renderOrder;
    parts.forEach(part => part.removeFromParent());
    root.add(mesh);
  }
  return root;
}
