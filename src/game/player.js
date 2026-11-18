import * as THREE from 'three';
import { clamp, damp } from '../core/utils.js';

function areaContains(area, x, z, margin = 0) {
  if (area.r !== undefined) {
    const r = Math.max(0.2, area.r - margin);
    return (x - area.x) ** 2 + (z - area.z) ** 2 <= r * r;
  }
  const hw = Math.max(0.2, area.w / 2 - margin);
  const hd = Math.max(0.2, area.d / 2 - margin);
  return Math.abs(x - area.x) <= hw && Math.abs(z - area.z) <= hd;
}

function nearestOnArea(area, x, z, margin = 0) {
  if (area.r !== undefined) {
    const r = Math.max(0.2, area.r - margin);
    const dx = x - area.x, dz = z - area.z;
    const d = Math.hypot(dx, dz);
    if (d <= r || d < 0.0001) return { x: area.x + r, z: area.z };
    return { x: area.x + (dx / d) * r, z: area.z + (dz / d) * r };
  }
  const hw = Math.max(0.2, area.w / 2 - margin);
  const hd = Math.max(0.2, area.d / 2 - margin);
  return {
    x: clamp(x, area.x - hw, area.x + hw),
    z: clamp(z, area.z - hd, area.z + hd),
  };
}

export class Player {
  constructor(coco) {
    this.coco = coco;
    this.pos = new THREE.Vector3(0, 0, 20);
    this.vy = 0;
    this.grounded = true;
    this.yaw = Math.PI;
    this.speed = 0;
    this.radius = 0.34;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 6;
    this.down = new THREE.Vector3(0, -1, 0);
    this.walkables = [];
    this.colliders = [];
    this.walkAreas = null;
    this.walkRadius = 48;
    this.spawnPoint = new THREE.Vector3(0, 0, 20);
    this.spawnYaw = Math.PI;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.enabled = true;
    this.time = 0;
    this.idleTime = 0;
    this.landPulse = 0;
    this.onLand = null;
    this.onJump = null;
    this.footPhase = 0;
    this.prevGrounded = true;
    this.walkedDistance = 0;
  }

  setCity({ walkables = [], colliders = [], walkRadius = 48, walkAreas = null, spawn, spawnYaw = Math.PI }) {
    this.walkables = walkables;
    this.colliders = colliders;
    this.walkRadius = walkRadius;
    this.walkAreas = walkAreas && walkAreas.length ? walkAreas : null;
    if (spawn) {
      this.spawnPoint.copy(spawn);
      this.spawnYaw = spawnYaw;
      this.respawn();
    }
  }

  setSpawn(pos, yaw = this.spawnYaw) {
    this.spawnPoint.copy(pos);
    this.spawnYaw = yaw;
  }

  respawn() {
    this.pos.copy(this.spawnPoint);
    this.pos.y = this.findFloor(this.pos.x, this.pos.z, this.pos.y + 2) ?? this.spawnPoint.y;
    this.vy = 0;
    this.grounded = true;
    this.yaw = this.spawnYaw;
    this.coco.root.position.copy(this.pos);
    this.coco.root.rotation.y = this.yaw;
  }

  findFloor(x, z, fromY) {
    if (!this.walkables.length) return 0;
    this.raycaster.set(new THREE.Vector3(x, fromY, z), this.down);
    const hits = this.raycaster.intersectObjects(this.walkables, true);
    for (const h of hits) {
      if (h.face && h.face.normal.y < 0.2) continue;
      return h.point.y;
    }
    return null;
  }

  resolveColliders() {
    const p = this.pos;
    for (const c of this.colliders) {
      if (c.top !== undefined && p.y > c.top - 0.12) continue;
      if (c.type === 'circle') {
        const dx = p.x - c.x, dz = p.z - c.z;
        const d = Math.hypot(dx, dz);
        const minD = c.r + this.radius;
        if (d < minD && d > 0.0001) {
          const push = (minD - d);
          p.x += (dx / d) * push;
          p.z += (dz / d) * push;
        }
      } else {
        const minX = c.x - c.w / 2 - this.radius;
        const maxX = c.x + c.w / 2 + this.radius;
        const minZ = c.z - c.d / 2 - this.radius;
        const maxZ = c.z + c.d / 2 + this.radius;
        if (p.x > minX && p.x < maxX && p.z > minZ && p.z < maxZ) {
          const dl = p.x - minX, dr = maxX - p.x;
          const dt = p.z - minZ, db = maxZ - p.z;
          const m = Math.min(dl, dr, dt, db);
          if (m === dl) p.x = minX;
          else if (m === dr) p.x = maxX;
          else if (m === dt) p.z = minZ;
          else p.z = maxZ;
        }
      }
    }
    if (this.walkAreas) {
      const inside = this.walkAreas.some((a) => areaContains(a, p.x, p.z, this.radius));
      if (!inside) {
        let best = Infinity;
        let bx = p.x, bz = p.z;
        for (const a of this.walkAreas) {
          const q = nearestOnArea(a, p.x, p.z, this.radius);
          const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
          if (d < best) {
            best = d;
            bx = q.x;
            bz = q.z;
          }
        }
        p.x = bx;
        p.z = bz;
      }
    } else {
      const dist = Math.hypot(p.x, p.z);
      if (dist > this.walkRadius) {
        p.x = (p.x / dist) * this.walkRadius;
        p.z = (p.z / dist) * this.walkRadius;
      }
    }
  }

  update(dt, input, cameraYaw, { inputEnabled = true, allowJump = true } = {}) {
    this.time += dt;
    const move = inputEnabled ? input.getMove() : { x: 0, y: 0 };
    const running = input.running && (move.x !== 0 || move.y !== 0);
    const maxSpeed = running ? 4.55 : 2.85;

    const fwd = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
    const dir = new THREE.Vector3()
      .addScaledVector(fwd, -move.y)
      .addScaledVector(right, move.x);
    const inputMag = Math.min(1, dir.length());
    if (inputMag > 0.001) dir.normalize();

    const targetSpeed = inputMag * maxSpeed;
    this.speed = damp(this.speed, targetSpeed, this.grounded ? 9 : 3.5, dt);
    if (inputMag > 0.01) {
      const targetYaw = Math.atan2(dir.x, dir.z);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * (1 - Math.exp(-11 * dt));
      this.idleTime = 0;
    } else {
      this.idleTime += dt;
    }

    const prevX = this.pos.x, prevZ = this.pos.z;
    this.pos.x += Math.sin(this.yaw) * this.speed * dt;
    this.pos.z += Math.cos(this.yaw) * this.speed * dt;
    this.walkedDistance += Math.hypot(this.pos.x - prevX, this.pos.z - prevZ);
    this.resolveColliders();

    // vertical
    if (this.grounded) this.coyote = 0.12; else this.coyote = Math.max(0, this.coyote - dt);
    if (inputEnabled && allowJump && input.consumeJump()) this.jumpBuffer = 0.14;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = 6.6;
      this.grounded = false;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.coco.land();
      this.onJump?.();
    }

    this.vy -= 19.5 * dt;
    this.pos.y += this.vy * dt;

    const floor = this.findFloor(this.pos.x, this.pos.z, this.pos.y + 1.15);
    const supportY = floor ?? -30;

    if (this.pos.y <= supportY + 0.02 && this.vy <= 0) {
      const landSpeed = -this.vy;
      this.pos.y = supportY;
      if (!this.grounded && landSpeed > 3) {
        this.coco.land();
        this.onLand?.(landSpeed);
      }
      this.vy = 0;
      this.grounded = true;
    } else if (this.grounded && supportY > this.pos.y - 0.5 && supportY < this.pos.y + 0.28 && Math.abs(this.vy) < 1.2) {
      // walk up gentle slopes & stay snapped to ground
      this.pos.y = supportY;
    } else {
      if (this.grounded && this.pos.y - supportY > 0.05) this.grounded = false;
    }

    if (this.pos.y < -8) this.respawn();

    // character
    this.coco.root.position.copy(this.pos);
    this.coco.faceTowards(this.yaw, dt);
    const cocoMoving = this.speed > 0.2;
    if (!this.grounded) {
      this.coco.update(dt, { moving: false, running, grounded: false, speed: this.speed, floorY: supportY });
    } else {
      this.coco.update(dt, {
        moving: cocoMoving,
        running: this.speed > 3.3,
        grounded: true,
        speed: this.speed,
      });
    }
    this.landPulse = damp(this.landPulse, 0, 6, dt);
  }

  get moving() { return this.speed > 0.2; }
  get position() { return this.pos; }
}

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.yaw = Math.PI;
    this.pitch = 0.095;
    this.dist = 6.8;
    this.targetDist = 6.8;
    this.target = new THREE.Vector3(0, 1.2, 0);
    this.current = new THREE.Vector3(0, 3, 6);
    this.shake = 0;
    this.cinematic = null;
    this.returnLook = null;
    this.ready = false;
    this.offset = new THREE.Vector3(0, 1.18, 0);
    this.blockers = [];
    this.camRay = new THREE.Raycaster();
    this.camDir = new THREE.Vector3();
    this.focus = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.hits = [];
  }

  setBlockers(list = []) {
    this.blockers = list;
  }

  reset(yaw = Math.PI) {
    this.yaw = yaw;
    this.pitch = 0.095;
    this.dist = this.targetDist = 6.8;
    this.ready = false;
  }

  handleInput(input) {
    if (input.dragDX || input.dragDY) {
      this.yaw -= input.dragDX * 0.0052;
      this.pitch = clamp(this.pitch + input.dragDY * 0.0038, -0.24, 1.05);
    }
    if (input.wheel) {
      this.targetDist = clamp(this.targetDist + input.wheel * 0.004, 3.6, 11);
    }
  }

  update(dt, playerPos, input = null) {
    if (input) this.handleInput(input);
    this.dist = damp(this.dist, this.targetDist, 8, dt);
    const focus = this.focus.copy(playerPos);
    focus.y += 1.15;
    if (!this.ready) {
      this.target.copy(focus);
      this.ready = true;
    }
    this.target.x = damp(this.target.x, focus.x, 10, dt);
    this.target.y = damp(this.target.y, focus.y, 6, dt);
    this.target.z = damp(this.target.z, focus.z, 10, dt);

    if (this.cinematic) {
      const cin = this.cinematic;
      this.camera.position.lerp(cin.position, 1 - Math.exp(-3.2 * dt));
      if (cin.look) cin.look.lerp(cin.target,1-Math.exp(-5*dt));
      this.camera.lookAt(cin.look || cin.target);
      return;
    }

    const cp = Math.cos(this.pitch);
    const desired = this.current.set(
      this.target.x + Math.sin(this.yaw) * cp * this.dist,
      this.target.y + Math.sin(this.pitch) * this.dist + 0.4,
      this.target.z + Math.cos(this.yaw) * cp * this.dist,
    );
    desired.y = Math.max(desired.y, 0.7);

    this.limitCameraPosition(this.target,desired,1.1);
    this.camera.position.lerp(desired, 1 - Math.exp(-12 * dt));
    const look = this.lookTarget.copy(this.target).addScaledVector(this.offset, Math.min(1, this.camera.position.distanceTo(this.target) / 5));
    if (this.returnLook) {
      this.returnLook.lerp(look,1-Math.exp(-8*dt));
      this.camera.lookAt(this.returnLook);
      if (this.returnLook.distanceToSquared(look)<.0001) this.returnLook=null;
    } else this.camera.lookAt(look);
    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.exp(-8 * dt);
    }
  }

  limitCameraPosition(focus,desired,minDistance,blockers=this.blockers) {
    this.camDir.copy(desired).sub(focus);
    const distance=this.camDir.length();
    if (!blockers.length || distance<.001) return distance;
    this.camDir.divideScalar(distance);
    this.camRay.set(focus,this.camDir);
    this.camRay.far=distance+.3;
    this.hits.length=0;
    this.camRay.intersectObjects(blockers,false,this.hits);
    if (!this.hits.length) return distance;
    const clear=Math.max(minDistance,Math.min(distance,this.hits[0].distance-.32));
    desired.copy(focus).addScaledVector(this.camDir,clear);
    return clear;
  }

  nearbyScenery(world,focus,radius) {
    const solid=[...this.blockers], sphere=new THREE.Sphere();
    const visit=node=>{
      if (!node.visible || node.userData.resident) return;
      if (node.isMesh && !node.material.transparent) {
        const bounds=node.isInstancedMesh?node:node.geometry;
        if (!bounds.boundingSphere) bounds.computeBoundingSphere();
        sphere.copy(bounds.boundingSphere).applyMatrix4(node.matrixWorld);
        if (sphere.distanceToPoint(focus)<radius) solid.push(node);
      }
      node.children.forEach(visit);
    };
    visit(world);
    return solid;
  }

  frameConversation(player,resident,head,world) {
    const headHeight=head.y-resident.y;
    const direction=new THREE.Vector3().subVectors(player,resident);
    direction.y=0;
    if (direction.lengthSq()<.003) direction.copy(this.camera.position).sub(resident).setY(0);
    direction.normalize();
    const side=new THREE.Vector3(direction.z,0,-direction.x);
    const focus=resident.clone().lerp(player,.18);
    focus.y=resident.y+Math.max(.67,headHeight*.68);
    const distance=Math.max(2.72,1.68/Math.max(.36,this.camera.aspect));
    const view=this.camera.position.clone().sub(focus).setY(0).normalize();
    const scenery=this.nearbyScenery(world,focus,distance+1);
    const cocoFace=player.clone();cocoFace.y+=1.44;
    let best=null, score=-Infinity;
    for(const angle of [-.86,.86,-.50,.50,-1.32,1.32,0]){
      const ray=direction.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side,Math.sin(angle));
      const shot=focus.clone().addScaledVector(ray,distance);
      shot.y+=headHeight<.9?.77:.51;
      const clear=this.limitCameraPosition(focus,shot,.38,scenery);
      // A counter or lantern can hide a face above an otherwise clear centre ray.
      let rank=clear+.22*ray.dot(view)-.50*Math.abs(Math.abs(angle)-.86);
      for(const [point,weight] of [[head,6],[cocoFace,2]]){
        this.camDir.subVectors(point,shot);
        const reach=this.camDir.length();
        this.camRay.set(shot,this.camDir.normalize());
        this.camRay.far=Math.max(0,reach-.08);
        this.hits.length=0;
        if(this.camRay.intersectObjects(scenery,false,this.hits).length)rank-=weight;
      }
      // A bicycle wheel or stone pillar next to the lens can cover half a two-shot.
      const forward=focus.clone().sub(shot).normalize();
      const right=new THREE.Vector3().crossVectors(forward,this.camera.up).normalize();
      const halfWidth=Math.tan(THREE.MathUtils.degToRad(this.camera.fov*.5))*this.camera.aspect;
      for(const x of [-.72,-.36,.36,.72]){
        this.camDir.copy(forward).addScaledVector(right,x*halfWidth).normalize();
        const depth=Math.min(1.30,clear*.58);
        const near=shot.clone().addScaledVector(this.camDir,depth);
        this.camRay.set(near,this.camDir.negate());
        this.camRay.far=depth;
        this.hits.length=0;
        if(this.camRay.intersectObjects(scenery,false,this.hits).length)rank-=.8;
      }
      if(shot.distanceTo(cocoFace)<shot.distanceTo(head)){
        this.camRay.set(shot,this.camDir.subVectors(head,shot).normalize());
        if(this.camRay.ray.distanceSqToPoint(cocoFace)<.08)rank-=2;
      }
      if(rank>score){score=rank;best=shot;}
    }
    const look=this.camera.getWorldDirection(new THREE.Vector3())
      .multiplyScalar(this.camera.position.distanceTo(focus)).add(this.camera.position);
    this.returnLook=null;
    this.cinematic={position:best,target:focus,look};
  }

  setCinematic(position, target) {
    this.returnLook = null;
    this.cinematic = { position, target };
  }

  clearCinematic() {
    this.returnLook = this.cinematic?.look || null;
    this.cinematic = null;
  }
}
