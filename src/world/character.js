import * as THREE from 'three';
import { TAU, clamp, damp, lerp } from '../core/utils.js';
import { buildSchoolgirl } from './schoolgirl-model.js';

export class Coco {
  constructor() {
    Object.assign(this,buildSchoolgirl());
    this.hipHeight = this.bodyGroup.position.y;
    this.time = 0;
    this.walkPhase = 0;
    this.state = 'idle';
    this.look = new THREE.Vector2();
    this.glance = new THREE.Vector2();
    this.glanceTimer = 2.5;
    this.blinkTimer = 2.8;
    this.blinkPhase = -1;
    this.greeting = 0;
    this.landing = 0;
  }

  setTalking(on) {
    this.greeting = on ? 1.15 : 0;
  }

  setLook(x,y) {
    this.look.set(clamp(x,-1,1),clamp(y,-1,1));
  }

  update(dt,{moving=false,running=false,grounded=true,speed=0,floorY=this.root.position.y}={}) {
    this.time += dt;
    const t = this.time;
    const walking = moving && grounded;
    this.state = grounded ? (moving ? (running ? 'run' : 'walk') : 'idle') : 'air';
    if (walking) this.walkPhase += dt*(running ? 10.8 : 7.8)*clamp(speed/(running ? 4.5 : 2.85),.68,1.12);
    const stride = running ? .66 : .46;
    const gaitBlend = 1-Math.exp(-16*dt);
    this.landing = damp(this.landing,0,12,dt);
    this.greeting = Math.max(0,this.greeting-dt);
    let lowestSole = Infinity;
    for (let i=0;i<2;i++) {
      const side = i*2-1, phase = this.walkPhase+i*Math.PI;
      const forward = walking ? Math.sin(phase) : 0;
      const lift = walking ? Math.max(0,Math.cos(phase))**2 : 0;
      const leg = this.legs[i], arm = this.arms[i];
      const restHip = walking ? 0 : side*.034;
      const thigh = grounded ? restHip-forward*stride-.12*this.landing : (i === 0 ? -.66 : -.18);
      const knee = grounded ? .025+lift*(running ? 1.04 : .69)+.25*this.landing : (i === 0 ? .85 : 1.04);
      leg.pivot.rotation.x = lerp(leg.pivot.rotation.x,thigh,gaitBlend);
      leg.lower.rotation.x = lerp(leg.lower.rotation.x,knee,gaitBlend);
      leg.pivot.rotation.z = side*(grounded ? .012 : .055);
      leg.shoe.rotation.y = side*.058;
      const shinAngle = leg.pivot.rotation.x+leg.lower.rotation.x;
      const foot = grounded ? -shinAngle*(1-lift*.62)-.12*lift : -.20;
      leg.shoe.rotation.x = lerp(leg.shoe.rotation.x,foot,gaitBlend);

      // Keep the supporting heel or toe on the ground over the entire stride.
      const footAngle = shinAngle+leg.shoe.rotation.x;
      const ankleHeight = this.hipHeight+leg.lower.position.y*Math.cos(leg.pivot.rotation.x)
        +leg.shoe.position.y*Math.cos(shinAngle);
      const sole = ankleHeight-.080*Math.cos(footAngle)
        +Math.min(-.118*Math.sin(footAngle),.073*Math.sin(footAngle));
      lowestSole = Math.min(lowestSole,sole);

      let shoulder = grounded ? forward*stride*.86-(walking ? .035 : .072-side*.042) : -.43;
      let spread = .065+(walking ? .025*lift : .009*Math.sin(t*1.7+side));
      let elbow = grounded ? -.15-(running ? .45 : .18)*Math.max(0,-forward) : -.51;
      let wristIn = 0;
      if (i === 0 && !walking && grounded) {
        // Her left hand rests at the brass slider on her schoolbag strap.
        shoulder = .48;
        spread = .115;
        elbow = -2.25;
        wristIn = .37;
      }
      if (!grounded) spread += .27;
      if (i === 1 && this.greeting > 0 && !walking && grounded) {
        const wave = Math.min(1,this.greeting*4);
        spread += (1.80+.12*Math.sin(t*14))*wave;
        shoulder -= .14*wave;
        elbow -= .58*wave;
      }
      arm.pivot.rotation.x = lerp(arm.pivot.rotation.x,shoulder,gaitBlend);
      arm.pivot.rotation.z = lerp(arm.pivot.rotation.z,side*spread,gaitBlend);
      arm.lower.rotation.x = lerp(arm.lower.rotation.x,elbow,gaitBlend);
      arm.lower.rotation.z = lerp(arm.lower.rotation.z,wristIn,gaitBlend);
      const pleat = clamp(-leg.pivot.rotation.x/stride,0,1);
      this.skirt.morphTargetInfluences[i] = pleat;
    }
    const settle = grounded ? clamp(-lowestSole,-.115,.010) : 0;
    for (const leg of this.legs) leg.pivot.position.y = this.hipHeight+settle;
    this.bodyGroup.position.y = this.hipHeight+settle+.0025*Math.sin(t*2.05)-this.landing*.012;
    this.bodyGroup.rotation.x = damp(this.bodyGroup.rotation.x,walking ? (running ? .093 : .033) : .003,8,dt);
    this.bodyGroup.rotation.z = walking ? .017*Math.sin(this.walkPhase) : .005*Math.sin(t*1.2);
    this.skirt.rotation.x = -this.bodyGroup.rotation.x;
    this.pack.rotation.x = (walking ? .027 : .006)*Math.sin(walking ? this.walkPhase*2 : t*2);
    for (const [i,tail] of this.ties.entries()) {
      tail.rotation.z = (i ? 1 : -1)*(.04+.10*Math.sin(t*3+i)+(walking ? .12*Math.sin(this.walkPhase) : 0));
      tail.rotation.x = -.08-(walking ? .23 : .025)*Math.abs(Math.sin(this.walkPhase+.3));
    }

    this.glanceTimer -= dt;
    if (this.glanceTimer <= 0) {
      this.glance.set((Math.random()-.5)*.34,(Math.random()-.5)*.12);
      this.glanceTimer = 2.5+Math.random()*3.6;
    }
    this.head.rotation.y = damp(this.head.rotation.y,this.look.x*.48+this.glance.x*(walking ? .2 : 1),5,dt);
    this.head.rotation.x = damp(this.head.rotation.x,-.025+this.look.y*.24+this.glance.y-.5*this.bodyGroup.rotation.x,5,dt);
    this.head.rotation.z = damp(this.head.rotation.z,walking ? -.017*Math.sin(this.walkPhase) : .022+.015*Math.sin(t*1.18),5,dt);
    for (const p of this.pigtails) {
      p.root.rotation.z = p.side*(.035*Math.sin(t*2+p.side)+.095*(walking ? Math.cos(this.walkPhase*2) : 0));
      p.root.rotation.x = damp(p.root.rotation.x,grounded ? (walking ? .19 : .025) : -.21,8,dt);
    }
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkPhase < 0) {
      this.blinkPhase = 0;
      this.blinkTimer = 2.6+Math.random()*3.2;
    }
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt;
      const closure = Math.sin(Math.min(1,this.blinkPhase/.145)*Math.PI)**2;
      this.eyes.forEach(eye=>{eye.scale.y=1-.94*closure;});
      if (this.blinkPhase >= .145) this.blinkPhase = -1;
    }
    const clearance = Math.max(0,this.root.position.y-floorY);
    const size = clamp(1-clearance*.30,.4,1);
    this.shadow.position.y = .054-clearance;
    this.shadow.scale.setScalar(size);
    this.shadow.material.opacity = .25*size;
  }

  land() {
    this.landing = 1;
  }

  faceTowards(yaw,dt) {
    const diff = Math.atan2(Math.sin(yaw-this.root.rotation.y),Math.cos(yaw-this.root.rotation.y));
    this.root.rotation.y += diff*(1-Math.exp(-12*dt));
  }
}

/* ------------------------------------------------------------------ */
/*  paper plane companion                                              */
/* ------------------------------------------------------------------ */
export class PaperPlane {
  constructor() {
    this.root = new THREE.Group();
    const paper = new THREE.MeshStandardMaterial({
      color: '#fff8e8', roughness: 0.9, side: THREE.DoubleSide,
      emissive: '#ffdca8', emissiveIntensity: 0.08,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: '#e9705b', roughness: 0.85, side: THREE.DoubleSide,
    });
    const dark = new THREE.MeshBasicMaterial({ color: '#392b25' });

    const wing = new THREE.Group();
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, -0.52, 0.12, -0.24, 0, 0, -0.16,
    ], 3));
    lgeo.computeVertexNormals();
    const left = new THREE.Mesh(lgeo, paper);
    wing.add(left);
    const rgeo = new THREE.BufferGeometry();
    rgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, 0.52, 0.12, -0.24, 0, 0, -0.16,
    ], 3));
    rgeo.computeVertexNormals();
    const right = new THREE.Mesh(rgeo, paper);
    wing.add(right);

    const kgeo = new THREE.BufferGeometry();
    kgeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34, 0, -0.18, -0.18, 0, 0, -0.16,
    ], 3));
    kgeo.computeVertexNormals();
    const keel = new THREE.Mesh(kgeo, paper);
    wing.add(keel);

    const stripeGeo = new THREE.BufferGeometry();
    stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0.005, 0.32, -0.2, 0.055, -0.18, 0, 0.005, -0.11,
    ], 3));
    stripeGeo.computeVertexNormals();
    wing.add(new THREE.Mesh(stripeGeo, accent));

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), dark);
      eye.position.set(s * 0.055, 0.035, 0.11);
      eye.scale.set(0.8, 1.2, 0.5);
      wing.add(eye);
    }
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.12), accent);
    scarf.position.set(0, -0.02, -0.08);
    wing.add(scarf);

    this.wing = wing;
    this.root.add(wing);
    this.root.scale.setScalar(0.9);

    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,235,180,.5)');
        g.addColorStop(1, 'rgba(255,235,180,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c); return tex;
      })(),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.glow.scale.setScalar(1.3);
    this.root.add(this.glow);

    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.bob = Math.random() * TAU;
    this.faceYaw = 0;
    this.orbit = 0;
  }

  update(dt, cocoPos, cocoYaw, idleTime = 0, talking = false) {
    this.bob += dt * 2.4;
    const back = new THREE.Vector3(Math.sin(cocoYaw), 0, Math.cos(cocoYaw)).multiplyScalar(talking ? -.29 : .85);
    const side = new THREE.Vector3(Math.cos(cocoYaw), 0, -Math.sin(cocoYaw)).multiplyScalar(talking ? .17 : .75);
    const target = cocoPos.clone().add(back).add(side);
    target.y = cocoPos.y + (talking ? 1.16 : 1.55) + Math.sin(this.bob) * (talking ? .018 : .08);
    if (idleTime > 4 && !talking) {
      this.orbit += dt * 0.4;
      target.x += Math.cos(this.orbit) * 0.6;
      target.z += Math.sin(this.orbit) * 0.6;
    }
    const k = 1 - Math.exp(-3.4 * dt);
    const prev = this.pos.clone();
    this.pos.lerp(target, k);
    this.root.position.copy(this.pos);
    this.vel.subVectors(this.pos, prev).divideScalar(Math.max(dt, 0.0001));

    const desiredYaw = Math.atan2(this.vel.x, this.vel.z);
    let diff = desiredYaw - this.faceYaw;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.faceYaw += diff * (1 - Math.exp(-6 * dt));
    this.wing.rotation.y = this.faceYaw;
    this.wing.rotation.z = -clamp(this.vel.x * 0.06, -0.4, 0.4);
    this.wing.rotation.x = Math.sin(this.bob * 1.5) * 0.06 + 0.08;
    const flap = Math.sin(this.bob * 3.2) * 0.5 + 0.5;
    this.root.scale.setScalar(damp(this.root.scale.x,talking ? .27 : .9 + flap*.02,6,dt));
    this.glow.material.opacity = talking ? .10 : .24 + flap*.12;
  }
}
