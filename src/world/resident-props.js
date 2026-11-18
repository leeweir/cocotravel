import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { joint, mesh, loft, cord, ellipsoid, sweep } from './model-geometry.js';
import { TAU } from '../core/utils.js';

function slab(parent,shape,depth,bevel,material) {
  return mesh(parent,new THREE.ExtrudeGeometry(shape,{
    depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:10,
  }),material);
}

export function bagel(hand,m) {
  const bun=joint(hand,0,.036,.020);
  bun.rotation.set(-.39,-.23,.18);
  const ring=mesh(bun,new THREE.TorusGeometry(.065,.034,12,34),m.crust);
  ring.scale.set(1.06,.94,.88);
  for(let i=0;i<18;i++){
    const a=i*2.40, r=.061+.019*Math.sin(i*1.7);
    const seed=ellipsoid(bun,m.cream,[.0022,.0052,.0019],[r*Math.cos(a),r*Math.sin(a),.026+.004*Math.cos(i)],8,5);
    seed.rotation.z=a+.4;
  }
}

export function camera(parent,m) {
  for(const s of [-1,1]){
    const strap=mesh(parent,sweep([[s*.129,1.506,.015],[s*.143,1.445,.130],[s*.111,1.316,.160],[s*.089,1.209,.189]],
      [.009,.013,.011,.009],.27),m.leather);
    strap.name='camera sling';
  }
  const cam=joint(parent,-.008,1.172,.186);cam.rotation.set(.02,-.05,-.054);
  mesh(cam,new RoundedBoxGeometry(.201,.114,.072,2,.014),m.charcoal);
  mesh(cam,new RoundedBoxGeometry(.202,.024,.073,2,.006),m.metal,0,.046,0);
  mesh(cam,new RoundedBoxGeometry(.065,.033,.046,2,.006),m.charcoal,-.015,.066,0);
  ellipsoid(cam,m.gold,[.010,.005,.010],[.073,.061,.001]);
  for(const [r,z,material] of [[.044,.048,m.leather],[.037,.059,m.metal],[.029,.063,m.glass]]){
    const lens=mesh(cam,new THREE.CylinderGeometry(r,r,.013,24),material,.010,-.003,z);
    lens.rotation.x=Math.PI/2;
  }
}

export function guitar(parent,m) {
  // A hollow-body jazz guitar, with the fretting hand on the treble end of the neck.
  const guitar=joint(parent,-.084,.978,.203);
  guitar.rotation.set(-.065,-.06,-.93);
  const outline=new THREE.Shape();
  outline.moveTo(0,-.184);
  outline.bezierCurveTo(-.090,-.184,-.143,-.145,-.141,-.071);
  outline.bezierCurveTo(-.139,.002,-.082,.014,-.085,.057);
  outline.bezierCurveTo(-.091,.094,-.128,.125,-.103,.168);
  outline.bezierCurveTo(-.080,.211,-.037,.202,0,.184);
  outline.bezierCurveTo(.058,.193,.074,.170,.088,.197);
  outline.bezierCurveTo(.131,.168,.124,.125,.095,.091);
  outline.bezierCurveTo(.067,.051,.089,.023,.118,-.014);
  outline.bezierCurveTo(.177,-.106,.113,-.185,0,-.184);
  outline.closePath();
  slab(guitar,outline,.048,.007,m.leather);
  const binding=slab(guitar,outline,.003,.004,m.gold);binding.position.z=.050;
  const top=slab(guitar,outline,.002,.003,m.crust);top.scale.set(.973,.976,1);top.position.z=.055;
  mesh(guitar,new RoundedBoxGeometry(.043,.39,.035,2,.009),m.leather,0,.348,.018);
  mesh(guitar,new RoundedBoxGeometry(.040,.35,.009,2,.003),m.charcoal,0,.326,.042);
  for(let i=0;i<9;i++)mesh(guitar,new THREE.BoxGeometry(.040,.0024,.0035),m.metal,0,.171+i*.039,.048);
  for(const x of [-.066,.065]){
    const h=[[-.006,-.032],[.002,-.016],[.009,.005],[.002,.033],[-.005,.048]].map(([dx,y])=>[x+dx,y,.061]);
    cord(guitar,h,.0036,m.leather,10);
  }
  mesh(guitar,new RoundedBoxGeometry(.082,.019,.012,2,.003),m.leather,0,-.044,.065);
  const peg=mesh(guitar,new RoundedBoxGeometry(.061,.104,.027,2,.013),m.leather,0,.552,.023);
  peg.rotation.z=-.065;
  for(const s of [-1,1])for(let i=0;i<3;i++)
    ellipsoid(guitar,m.cream,[.009,.005,.006],[s*(.032+i*.001),.524+i*.027,.019]);
  for(let i=0;i<6;i++){
    const x=(i-2.5)*.0054;
    cord(guitar,[[x,-.115,.065],[x,-.043,.073],[x,.155,.060],[x,.505,.047]],.0008,m.metal,8);
  }
  return guitar;
}

export function palette(hand,m) {
  const board=joint(hand,-.006,.018,.031);board.rotation.set(-.54,.12,-.34);
  const s=new THREE.Shape();
  s.moveTo(-.104,-.022);
  s.bezierCurveTo(-.135,.052,-.070,.121,.031,.102);
  s.bezierCurveTo(.104,.088,.126,.047,.108,.008);
  s.bezierCurveTo(.092,-.022,.054,-.009,.047,-.030);
  s.bezierCurveTo(.039,-.059,.088,-.068,.061,-.091);
  s.bezierCurveTo(.019,-.121,-.082,-.097,-.104,-.022);s.closePath();
  const hole=new THREE.Path();hole.absellipse(.023,-.052,.014,.019,-.16,TAU-.16,true);s.holes.push(hole);
  slab(board,s,.009,.003,m.wood);
  for(const [x,y,paint] of [[-.076,.005,m.accent],[-.057,.056,m.gold],[-.010,.078,m.cream],[.043,.060,m.sea],[.075,.026,m.band]]){
    const dab=ellipsoid(board,paint,[.014,.010,.005],[x,y,.014]);dab.rotation.z=x*8;
  }
}

export function baguette(hand,m) {
  const loaf=joint(hand,0,.032,.018);loaf.rotation.set(-.18,.10,-.29);
  mesh(loaf,loft([[-.105,.006,.006],[-.095,.034,.031],[-.034,.047,.043],[.110,.049,.042],[.206,.044,.040],[.262,.031,.030],[.284,.009,.009],[.285,.002,.002]],28),m.crust);
  for(let i=0;i<4;i++){
    const mark=ellipsoid(loaf,m.crumb,[.028-i*.0018,.006,.0028],[.004,.089+i*.043,.041-i*.0015]);
    mark.rotation.z=.50;
  }
  mesh(loaf,loft([[-.112,.029,.030],[-.089,.047,.044],[.019,.052,.049],[.050,.054,.050]],24,.88),m.paper);
  mesh(loaf,loft([[-.014,.052,.049],[-.003,.053,.050]],24,.88),m.accent);
}

export function ramen(hand,m) {
  const bowl=joint(hand,-.008,.035,.024);
  mesh(bowl,loft([[-.010,.057,.057],[0,.061,.061],[.012,.065,.065],[.030,.098,.098],[.067,.129,.129],[.091,.136,.136],[.097,.134,.134],[.096,.126,.126],[.076,.119,.119]],40),m.cream);
  mesh(bowl,loft([[.079,.134,.134],[.085,.136,.136]],40),m.edge);
  const broth=mesh(bowl,new THREE.CircleGeometry(.126,40),m.broth,0,.087,0);broth.rotation.x=-Math.PI/2;
  for(let i=0;i<4;i++){
    const pts=[];
    for(let k=0;k<7;k++)pts.push([-.079+k*.022,.090,-.050+i*.021+.010*Math.sin(k*1.6+i)]);
    cord(bowl,pts,.0037,m.crumb,18);
  }
  ellipsoid(bowl,m.cream,[.035,.008,.045],[.062,.093,.016]);
  ellipsoid(bowl,m.gold,[.021,.006,.026],[.061,.100,.016]);
  for(let i=0;i<5;i++)
    ellipsoid(bowl,m.sea,[.010,.003,.004],[.017+.024*Math.cos(i*1.9),.095,-.044+.028*Math.sin(i*1.9)]);
}
