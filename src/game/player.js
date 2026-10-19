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
      this.coco.update(dt, { moving: false, running, grounded: false, speed: this.speed });
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
    this.pitch = 0.2;
    this.dist = 6.4;
    this.targetDist = 6.4;
    this.target = new THREE.Vector3(0, 1.2, 0);
    this.current = new THREE.Vector3(0, 3, 6);
    this.shake = 0;
    this.cinematic = null;
    this.ready = false;
    this.offset = new THREE.Vector3();
    this.blockers = [];
    this.camRay = new THREE.Raycaster();
    this.camDir = new THREE.Vector3();
  }

  setBlockers(list = []) {
    this.blockers = list;
  }

  reset(yaw = Math.PI) {
    this.yaw = yaw;
    this.pitch = 0.2;
    this.dist = this.targetDist = 6.4;
    this.ready = false;
  }

  handleInput(input) {
    if (input.dragging) {
      this.yaw -= input.dragDX * 0.0052;
      this.pitch = clamp(this.pitch + input.dragDY * 0.0038, 0.02, 1.0);
    }
    if (input.wheel) {
      this.targetDist = clamp(this.targetDist + input.wheel * 0.004, 3.6, 11);
    }
  }

  update(dt, playerPos, input = null) {
    if (input) this.handleInput(input);
    this.dist = damp(this.dist, this.targetDist, 8, dt);
    const focus = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
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
      this.camera.lookAt(cin.target);
      return;
    }

    const cp = Math.cos(this.pitch);
    const desired = new THREE.Vector3(
      this.target.x + Math.sin(this.yaw) * cp * this.dist,
      this.target.y + Math.sin(this.pitch) * this.dist + 0.4,
      this.target.z + Math.cos(this.yaw) * cp * this.dist,
    );
    desired.y = Math.max(desired.y, 0.7);

    let camGoal = desired;
    if (this.blockers.length) {
      this.camDir.copy(desired).sub(this.target);
      const dist = this.camDir.length();
      if (dist > 0.001) {
        this.camDir.divideScalar(dist);
        this.camRay.set(this.target, this.camDir);
        this.camRay.far = dist + 0.3;
        const hits = this.camRay.intersectObjects(this.blockers, false);
        if (hits.length) {
          const d = Math.max(1.1, Math.min(dist, hits[0].distance - 0.32));
          camGoal = this.target.clone().addScaledVector(this.camDir, d);
        }
      }
    }
    this.camera.position.lerp(camGoal, 1 - Math.exp(-12 * dt));
    const look = this.target.clone().add(this.offset);
    this.camera.lookAt(look);
    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.exp(-8 * dt);
    }
  }

  setCinematic(position, target) {
    this.cinematic = { position, target };
  }

  clearCinematic() {
    this.cinematic = null;
  }
}
