import * as THREE from 'three';
import { TAU, lerp, smoothstep, canvas2d, canvasTexture } from '../core/utils.js';
import { joint, mesh, ellipsoid, rings, loft, cord, taperedTube, finishFigure } from './model-geometry.js';

const mat = color => new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide});
const milk= new THREE.Color('#f2e6d2'), ginger= new THREE.Color('#cc824d'), soot= new THREE.Color('#4d4443');

function spot(a,y,angle,cy,rx,ry){
  const dx=Math.atan2(Math.sin(a-angle),Math.cos(a-angle))/rx;
  return 1-smoothstep(.82,1.08,dx*dx+((y-cy)/ry)**2);
}

function pelt(parent,rows,patches,material) {
  const color=new THREE.Color();
  mesh(parent,rings(41,76,(j,a)=>{
    const k=j*(rows.length-1)/40, i=Math.min(Math.floor(k),rows.length-2), t=k-i;
    const row=rows[i].map((v,n)=>lerp(v,rows[i+1][n],t));
    const [y,w,d,z]=row;
    color.copy(milk);
    for(const [tone,angle,cy,rx,ry] of patches) color.lerp(tone,spot(a,y,angle,cy,rx,ry));
    return [w*Math.sin(a),y,z+d*Math.cos(a),color];
  }),material);
}

function ear(head,s,m) {
  const base=joint(head,s*.088,.082,-.020);
  base.rotation.set(-.10,0,-s*.15);
  const geo=rings(10,24,(j,a)=>{
    const t=j/9, w=lerp(.071,.003,t), x=s*.033*t;
    return [x+w*Math.sin(a),t*.143,lerp(.043,.003,t)*Math.cos(a)];
  });
  mesh(base,geo,s<0?m.soot:m.ginger);
  const shape=new THREE.Shape();
  shape.moveTo(-.032,0);shape.quadraticCurveTo(0,-.005,.033,0);
  shape.quadraticCurveTo(.029,.026,s*.022,.080);shape.quadraticCurveTo(-.016,.051,-.032,0);
  const inner=mesh(base,new THREE.ShapeGeometry(shape,8),m.pink,0,.021,.042);
  inner.rotation.x=-.26;
}

function eye(head,s) {
  const x=s*.068, y=.008, z=.125, pivot=joint(head,x,y,z);
  pivot.name='eyelid';
  const {c,ctx}=canvas2d(180,110);
  ctx.translate(90,0);ctx.scale(s,1);ctx.translate(-90,0);
  ctx.beginPath();ctx.moveTo(7,65);ctx.bezierCurveTo(36,24,104,3,166,27);
  ctx.bezierCurveTo(169,74,84,115,25,85);ctx.closePath();
  ctx.save();ctx.clip();
  const amber=ctx.createLinearGradient(0,16,0,99);
  amber.addColorStop(0,'#71714f');amber.addColorStop(.43,'#b4ad75');amber.addColorStop(1,'#ecc787');
  ctx.fillStyle=amber;ctx.fillRect(0,0,180,110);
  ctx.fillStyle='#3d3536';ctx.beginPath();ctx.ellipse(86,55,24,41,0,0,TAU);ctx.fill();
  ctx.fillStyle='#fff2d8';ctx.beginPath();ctx.ellipse(86-s*13,37,8,7,0,0,TAU);ctx.fill();
  ctx.restore();ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle='#4e413c';
  ctx.beginPath();ctx.moveTo(8,64);ctx.bezierCurveTo(46,15,101,6,166,27);ctx.stroke();
  const geo=new THREE.PlaneGeometry(.091,.055,10,6), pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const px=x+pos.getX(i), py=y+pos.getY(i);
    const depth=-.003-py*.14+.138*Math.sqrt(Math.max(0,1-(px/.162)**2));
    pos.setZ(i,depth-z+.0025);
  }
  const paint=mesh(pivot,geo,new THREE.MeshBasicMaterial({map:canvasTexture(c),transparent:true,depthWrite:false}));
  paint.renderOrder=2;
  return pivot;
}

export function buildMochi() {
  const m={milk:mat('#f2e6d2'),cream:mat('#fbefdf'),ginger:mat('#cc824d'),soot:mat('#4d4443'),pink:mat('#d99b85'),
    dark:mat('#42393a'),bell:mat('#d6aa56'),collar:mat('#a7493e'),paint:mat('#ffffff')};
  m.paint.vertexColors=true;m.bell.metalness=.32;m.bell.roughness=.44;
  const body=new THREE.Group(),head=joint(body,0,.515,.043),eyes=[];
  pelt(body,[[.034,.088,.095,-.068],[.061,.151,.161,-.059],[.133,.180,.183,-.051],[.210,.175,.170,-.044],
    [.311,.141,.134,-.021],[.397,.109,.109,.000],[.455,.091,.092,.022],[.481,.059,.063,.031]],[
      [ginger,1.9,.239,1.1,.175],[soot,-1.52,.166,.83,.101],[ginger,-2.55,.320,.68,.076],
    ],m.paint);
  for(const s of [-1,1]){
    const haunch=ellipsoid(body,s<0?m.milk:m.ginger,[.090,.130,.113],[s*.117,.141,-.065]);
    haunch.rotation.x=-.30;
    ellipsoid(body,m.milk,[.061,.045,.094],[s*.125,.053,-.001]);
    const leg=mesh(body,loft([[.042,.034,.040,.021],[.073,.038,.043,.019],[.142,.040,.044,.012],[.229,.045,.051,-.007],[.277,.046,.051,-.028],[.312,.042,.046,-.042],[.336,.021,.029,-.062]],24),m.milk,s*.067,0,.063);
    leg.rotation.x=.060;
    ellipsoid(body,m.cream,[.050,.037,.066],[s*.072,.041,.127]);
    for(const off of [-.012,.014])cord(body,[[s*.072+off,.054,.183],[s*.072+off,.061,.180],[s*.072+off,.063,.172]],.0013,m.pink,5);
  }
  pelt(head,[[-.123,.012,.031,.020],[-.113,.074,.078,.016],[-.092,.115,.102,.011],[-.059,.149,.124,.007],
    [-.017,.164,.138,0],[.031,.161,.135,-.007],[.071,.150,.128,-.013],[.111,.124,.105,-.018],
    [.144,.086,.081,-.021],[.156,.042,.043,-.021],[.159,.003,.004,-.020]],[
      [soot,-1.15,.078,1.02,.137],[ginger,1.18,.111,1.06,.113],[ginger,2.82,.031,.80,.110],
    ],m.paint);
  for(const s of [-1,1]){
    ear(head,s,m);
    eyes.push(eye(head,s));
    ellipsoid(head,m.cream,[.047,.029,.030],[s*.033,-.048,.115]);
    for(const [x,y] of [[.032,-.047],[.047,-.050],[.042,-.042]])
      ellipsoid(head,m.pink,[.0017,.0015,.0014],[s*x,y,.143],8,5);
    for(let i=0;i<3;i++){
      cord(head,[[s*.061,-.051+i*.006,.132],[s*.112,-.056+i*.009,.143],[s*(.161+i*.013),-.072+i*.019,.132]],.0014,m.soot,10);
    }
    cord(head,[[0,-.055,.144],[s*.008,-.068,.145],[s*.019,-.069,.144],[s*.028,-.064,.145]],.0020,m.dark,9);
  }
  const nose=new THREE.Shape();nose.moveTo(-.015,.004);nose.quadraticCurveTo(0,.012,.015,.004);nose.quadraticCurveTo(.007,-.005,0,-.010);nose.quadraticCurveTo(-.006,-.007,-.015,.004);
  mesh(head,new THREE.ExtrudeGeometry(nose,{depth:.003,bevelEnabled:false,curveSegments:6}),m.pink,0,-.043,.145);
  const collar=mesh(body,loft([[-.014,.113,.104],[.011,.110,.102]],36),m.collar,0,.418,.013);
  collar.rotation.x=-.065;
  ellipsoid(body,m.bell,[.023,.024,.021],[0,.399,.124]);
  cord(body,[[-.013,.393,.143],[0,.389,.145],[.013,.393,.143]],.0016,m.dark,8);
  const tail=joint(body,-.073,.115,-.148);
  const tint=new THREE.Color();
  const tailGeo=taperedTube([[0,0,0],[-.100,.021,-.042],[-.165,.100,-.036],[-.187,.198,-.017],
    [-.217,.268,.016],[-.260,.273,.036],[-.282,.237,.047]],
    [.045,.047,.040,.036,.034,.026,.004],20,t=>tint.copy(ginger).lerp(soot,smoothstep(.72,.77,t)).lerp(milk,smoothstep(.90,.95,t)));
  mesh(tail,tailGeo,m.paint);
  finishFigure(body,[...eyes,head,tail]);
  function pose(t,greeting){
    tail.rotation.z=.06*Math.sin(t*1.9)+greeting*.09*Math.sin(t*3.4);
    tail.rotation.y=.12*Math.sin(t*1.45);
    head.position.y=.515+.0025*Math.sin(t*1.7);
  }
  return {body,head,eyes,pose,size:1,labelHeight:.75};
}
