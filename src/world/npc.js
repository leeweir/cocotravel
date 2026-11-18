import * as THREE from 'three';
import { TAU, canvas2d, canvasTexture, blobShadow, damp, smoothstep } from '../core/utils.js';
import { buildResident } from './resident-model.js';
import { buildMochi } from './mochi-model.js';

const markerStyles = {
  quest: ['!', '#b57c33'],
  ready: ['?', '#ba5648'],
  hint: ['…', '#687f84'],
};

function paintMarker(texture, [symbol, color]) {
  const ctx = texture.image.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.beginPath();
  ctx.arc(64, 58, 34, 0, TAU);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(54, 88);
  ctx.lineTo(64, 104);
  ctx.lineTo(74, 88);
  ctx.closePath();
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 44px "Avenir Next", "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 64, 58);
  texture.needsUpdate = true;
}

function nameTexture(name, sub) {
  const { c, ctx } = canvas2d(512, 150);
  ctx.clearRect(0, 0, 512, 150);
  ctx.fillStyle = 'rgba(255,250,240,.92)';
  ctx.strokeStyle = 'rgba(63,49,43,.18)';
  ctx.lineWidth = 4;
  const r = 26;
  ctx.beginPath();
  ctx.moveTo(r, 12);
  ctx.arcTo(500, 12, 500, 138, r);
  ctx.arcTo(500, 138, 12, 138, r);
  ctx.arcTo(12, 138, 12, 12, r);
  ctx.arcTo(12, 12, 500, 12, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3f312b';
  ctx.font = '700 46px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText(name, 256, sub ? 66 : 88);
  if (sub) {
    ctx.fillStyle = 'rgba(63,49,43,.55)';
    ctx.font = '500 26px "Avenir Next", "Trebuchet MS", sans-serif';
    ctx.fillText(sub, 256, 110);
  }
  return canvasTexture(c);
}

export function createNPC(def) {
  const root = new THREE.Group();
  root.name = `NPC:${def.id}`;
  root.userData.resident = true;
  const cat = def.species === 'cat';
  const {body,head,eyes,pose,size,labelHeight} = cat ? buildMochi() : buildResident(def.id);
  root.add(body,blobShadow(cat ? .33 : .39, .22));
  root.scale.setScalar(size);
  const yawBase = def.yaw || 0;
  root.rotation.y = yawBase;
  root.position.set(...def.pos);

  const markerMap = canvasTexture(canvas2d(128,128).c);
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({map:markerMap,transparent:true,depthWrite:false}));
  marker.scale.setScalar(.41/size);
  marker.renderOrder = 5;
  const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:nameTexture(def.name,def.nameSub),transparent:true,depthWrite:false}));
  nameSprite.scale.set(1.24/size,.36/size,1);
  nameSprite.position.y = labelHeight+.26/size;
  nameSprite.renderOrder = 4;
  root.add(marker,nameSprite);

  let markerState, talking=false, time=Math.random()*6;
  let nextBlink=2.4+Math.random()*2, blink=1, attention=0, greeting=0, nameOpacity=0;
  nameSprite.visible=false;
  marker.position.y=labelHeight+.28/size;
  function setMarker(state) {
    if (state!==markerState && markerStyles[state]) paintMarker(markerMap,markerStyles[state]);
    markerState=state;
    marker.visible=!!markerStyles[state] && !talking;
  }
  function setTalking(on) {
    talking=on;
    marker.visible=!!markerStyles[markerState] && !on;
    nameSprite.visible=!on && nameOpacity>.02;
  }
  function update(dt,t,playerPos) {
    time+=dt;
    const dx=playerPos ? playerPos.x-root.position.x : Infinity, dz=playerPos ? playerPos.z-root.position.z : Infinity;
    const dist=Math.hypot(dx,dz);
    attention=damp(attention,talking?1:1-smoothstep(3.2,5.6,dist),5,dt);
    greeting=damp(greeting,talking?1:0,5,dt);
    const target=dist>.055 && (talking||dist<5.6)?Math.atan2(dx,dz):yawBase;
    const turn=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));
    root.rotation.y+=turn*(1-Math.exp(-(talking?4:2.8)*dt));
    head.rotation.y=damp(head.rotation.y,THREE.MathUtils.clamp(turn,-.55,.55)*attention*.8+.027*Math.sin(time*.89)*(1-attention),8,dt);
    head.rotation.x=(cat?-.13:.055)*attention+greeting*.033*Math.sin(time*2.2);
    head.rotation.z=.015*Math.sin(time*1.1)+(cat?.082:.022)*greeting;
    pose(time,greeting);

    nextBlink-=dt;
    if(nextBlink<=0){blink=0;nextBlink=2.7+Math.random()*2.6;}
    blink=Math.min(1,blink+dt/.18);
    const opening=1-.95*Math.sin(Math.PI*blink)**2;
    for(const eye of eyes)eye.scale.y=opening;

    nameOpacity=damp(nameOpacity,talking?0:1-smoothstep(6.5,9.0,dist),8,dt);
    nameSprite.material.opacity=nameOpacity;
    nameSprite.visible=!talking&&nameOpacity>.02;
    marker.position.y=labelHeight+(.27+.35*nameOpacity+.022*Math.sin(time*2))/size;
  }
  setMarker(def.marker);
  return {def,root,body,headGroup:head,marker,nameSprite,update,setMarker,setTalking,yawBase,
    get markerState(){return markerState;}};
}
