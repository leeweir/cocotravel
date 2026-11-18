import * as THREE from 'three';
import { TAU, lerp, smoothstep, canvas2d, canvasTexture } from '../core/utils.js';
import { mesh, joint, ellipsoid, rings, loft, cord, sweep, fabricPanel, taperedTube, curve, finishFigure } from './model-geometry.js';
import { buildResidentHead } from './resident-head.js';
import { bagel, camera, guitar, palette, baguette, ramen } from './resident-props.js';

const outfits = {
  rosa:   { size:.97, width:1.07, skin:'#e7ad8c', hair:'#513730', lock:'#956148', top:'#719487', sleeve:'#f2e5c9', bottom:'#627f70', accent:'#aa473d', band:'#96523e', edge:'#9d6350', iris:'#815743' },
  sam:    { size:1.075, width:1.08, skin:'#bd8261', hair:'#504342', lock:'#82746a', top:'#677e67', sleeve:'#677e67', bottom:'#565749', accent:'#bd9959', band:'#594c3f', edge:'#899880', temple:'#827972', iris:'#685543' },
  theo:   { size:1.04, width:.99, skin:'#995e42', hair:'#332b2c', lock:'#57433d', top:'#415e74', sleeve:'#415e74', bottom:'#514b51', accent:'#dda859', band:'#334859', edge:'#8494a0', iris:'#694731' },
  odette: { size:.99, width:.94, skin:'#edbda2', hair:'#693e31', lock:'#a56f4e', top:'#8a829b', sleeve:'#f0e6d3', bottom:'#48485e', accent:'#ae443c', band:'#804038', edge:'#505971', iris:'#737951' },
  pierre: { size:1.04, width:1.11, skin:'#d8a081', hair:'#533830', lock:'#8d6350', top:'#795843', sleeve:'#eee1c8', bottom:'#554d48', accent:'#a66545', band:'#4f706d', edge:'#98aaa0', temple:'#866b59', iris:'#795841' },
  lucie:  { size:.78, width:.85, skin:'#f0c2a6', hair:'#8a4b32', lock:'#bc794a', top:'#d58a8c', sleeve:'#fff0d9', bottom:'#c48082', accent:'#c79245', band:'#a45f66', edge:'#ecb8aa', iris:'#865a3f' },
  hana:   { size:.98, width:.91, skin:'#ecc2a6', hair:'#332c35', lock:'#65545c', top:'#f2eada', sleeve:'#f2eada', bottom:'#ad4842', accent:'#b54843', band:'#893c3a', edge:'#dfbda8', iris:'#715447' },
  ken:    { size:1.02, width:1.12, skin:'#d7a17c', hair:'#3b3536', lock:'#6c5b51', top:'#3e5365', sleeve:'#3e5365', bottom:'#444950', accent:'#a75646', band:'#576e7a', edge:'#84939a', temple:'#8a7970', iris:'#694a3d' },
};

const cloth = color => new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide});
function materials(a) {
  const colors={
    skin:a.skin, cheek:new THREE.Color(a.skin).lerp(new THREE.Color('#cc735f'),.72),
    hair:a.hair, lock:a.lock, temple:a.temple||a.lock, brow:a.hair,
    lip:new THREE.Color(a.skin).lerp(new THREE.Color('#622e32'),.77), freckle:new THREE.Color(a.skin).lerp(new THREE.Color('#714439'),.65),
    top:a.top, sleeve:a.sleeve, bottom:a.bottom, accent:a.accent, band:a.band, edge:a.edge,
    cream:'#f4e9d1', shoe:'#67483d', leather:'#664635', charcoal:'#384046', metal:'#aeada1', glass:'#364956',
    sea:'#577a67', hat:'#9b7950', gold:'#cf9e4f', rim:'#ad8754', wood:'#c99d69',
    crust:'#c88442', crumb:'#e7b878', paper:'#ede1c2', broth:'#aa6a36', sole:'#49423e',
  };
  const m=Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,cloth(v)]));
  for(const k of ['gold','metal','rim']){m[k].roughness=.52;m[k].metalness=.28;}
  m.paint=cloth('#ffffff');m.paint.vertexColors=true;
  m.iris=a.iris;m.liner=new THREE.Color(a.hair).lerp(new THREE.Color('#332927'),.65).getStyle();
  return m;
}

const shirtProfile=[
  [.793,.228,.148],[.803,.237,.152],[.842,.235,.152],[.931,.213,.143],[1.018,.178,.124],
  [1.128,.185,.138],[1.260,.207,.150],[1.375,.224,.148],[1.435,.232,.126],
  [1.475,.194,.100],[1.505,.122,.088],[1.526,.066,.072],
];
function shirtZ(x,y) {
  let i=1;while(i<shirtProfile.length-1 && shirtProfile[i][0]<y)i++;
  const [h,w,d]=shirtProfile[i-1], [next,nw,nd]=shirtProfile[i];
  const t=THREE.MathUtils.clamp((y-h)/(next-h),0,1),xw=lerp(w,nw,t);
  return lerp(d,nd,t)*Math.sqrt(Math.max(.012,1-(x/xw)**2));
}

function onShirt(points,lift=.006) {
  return points.map(([x,y])=>[x,y,shirtZ(x,y)+lift]);
}

function flap(parent,left,right,material,lift=.006) {
  const a=curve(left.map(([x,y])=>[x,y,0])), b=curve(right.map(([x,y])=>[x,y,0]));
  const points=[], indices=[], rows=16, across=12;
  for(let j=0;j<=rows;j++){
    const l=a.getPoint(j/rows), r=b.getPoint(j/rows);
    for(let i=0;i<=across;i++){
      const u=i/across, x=lerp(l.x,r.x,u), y=lerp(l.y,r.y,u);
      points.push(x,y,shirtZ(x,y)+lift);
      const k=j*(across+1)+i;
      if(j<rows && i<across)indices.push(k,k+across+1,k+1,k+1,k+across+1,k+across+2);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(parent,geometry,material);
}

function button(parent,m,x,y,material=m.gold) {
  ellipsoid(parent,material,[.010,.010,.004],[x,y,shirtZ(x,y)+.011],10,7);
}

function collar(parent,m,material) {
  for(const s of [-1,1]){
    flap(parent,[[s*.014,1.474],[s*.037,1.441],[s*.076,1.399]],
      [[s*.072,1.524],[s*.114,1.496],[s*.076,1.399]],material,.012);
  }
}

function smockPocket(parent,m,x,y,material) {
  const left=[[x-.046,y],[x-.044,y-.044],[x-.034,y-.075]];
  const right=[[x+.046,y],[x+.044,y-.044],[x+.034,y-.075]];
  flap(parent,left,right,material,.010);
  cord(parent,onShirt([[x-.045,y-.006],[x,y-.007],[x+.045,y-.006]],.014),.0021,m.edge,8);
}

function pleatedSkirt(parent,m,id) {
  const long=id==='hana', rose=id==='rosa';
  const hem=long?.140:rose?.410:.548, waist=long?1.078:1.026;
  const width=long?.261:rose?.325:.305, depth=long?.218:rose?.221:.206;
  const sections=[[-.003,.97,.91],[0,1,1],[.012,1,1],[.042,.993,1],[.29,.94,.97],[.64,.82,.88],[.89,.70,.68],[1,.61,.50]];
  const tone=new THREE.Color(),base=m.bottom.color;
  const geo=rings(sections.length,112,(j,a)=>{
    const [t,ratio,fold]=sections[j], y=lerp(hem,waist,t);
    const phase=a*(long?14:rose?11:10)+(long?.08:.26)*t;
    const p=.5+.5*Math.cos(phase+.75*Math.sin(phase)), rib=1-fold*(long?.077:.065)*p;
    tone.copy(base).multiplyScalar(1-.15*p*fold);
    if(id==='lucie')tone.setScalar(1-.13*p*fold);
    return [width*ratio*rib*Math.sin(a),y,depth*ratio*rib*Math.cos(a),tone];
  });
  if(id==='lucie'){
    const {c,ctx}=canvas2d(64,64);
    ctx.fillStyle=m.bottom.color.getStyle();ctx.fillRect(0,0,64,64);
    ctx.fillStyle='rgba(255,235,216,.28)';ctx.fillRect(0,0,28,64);ctx.fillRect(0,0,64,28);
    ctx.fillStyle='rgba(155,83,90,.35)';ctx.fillRect(40,0,2,64);ctx.fillRect(0,40,64,2);
    const gingham=cloth('#ffffff');gingham.vertexColors=true;gingham.map=canvasTexture(c,{repeat:[16,5.6]});
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setY(i,sections[Math.floor(i/113)][0]);
    mesh(parent,geo,gingham);
  }else mesh(parent,geo,m.paint);
  mesh(parent,loft([[waist-.041,.186,.138],[waist+.002,.187,.136]],36),long?m.band:m.top);
}

function apron(parent,m,id) {
  const full=id==='rosa'||id==='pierre', rose=id==='rosa';
  const color=rose?m.cream:m.band;
  // The front follows the knees, then the waist and chest. The reverse stays open.
  const sections=rose?[
    [.515,.327,.220,1.03],[.529,.330,.222,1.04],[.742,.281,.199,1.12],[.961,.218,.172,1.20],[1.002,.202,.163,1.26],
    [1.038,.195,.148,.84],[1.22,.210,.161,.63],[1.372,.234,.162,.51],
  ]:[
    [id==='ken'?.628:.497,.247,.190,1.03],[id==='ken'?.640:.511,.250,.192,1.04],[.739,.244,.184,1.17],[.93,.230,.164,1.24],[1.021,.204,.147,1.27],
    ...(full?[[1.076,.210,.151,.78],[1.218,.216,.162,.65],[1.370,.231,.164,.53]]:[]),
  ];
  const tone=new THREE.Color();
  const geo=rings(sections.length,84,(j,u)=>{
    const [y,w,d,arc]=sections[j], a=(u/TAU*2-1)*arc;
    const stripe=(!rose && id!=='ken')?(Math.cos(a*39)>.84?.29:0):0;
    tone.copy(color.color).lerp(m.edge.color,stripe);
    if(j===1)tone.lerp(rose?m.edge.color:m.cream.color,rose?.10:.13);
    return [w*Math.sin(a),y,d*Math.cos(a)+.010,tone];
  });
  mesh(parent,geo,m.paint);
  for(const s of [-1,1]){
    if(full){
      const path=[[s*.112,1.366,.150],[s*.124,1.432,.126],[s*.126,1.499,.068],[s*.110,1.496,-.045],[s*.139,1.326,-.112],[s*.166,1.063,-.075]];
      mesh(parent,sweep(path,[.015,.016,.015,.015,.014,.013],.30),color);
      ellipsoid(parent,m.gold,[.008,.008,.003],[s*.106,1.355,.158],9,6);
    }
    const ends=[[s*.026,1.002,-.132],[s*.059,.960,-.150],[s*.089,.890,-.151],[s*.094,.843,-.143]];
    mesh(parent,sweep(ends,[.012,.019,.018,.013],.27),color);
  }
  const pocket=joint(parent,rose?.054:-.041,.830,rose?.205:.188);
  const pocketMat=rose?m.cream:id==='ken'?m.top:m.band;
  fabricPanel(pocket,[[-.061,0,-.007],[-.057,-.058,-.005],[-.040,-.076,0]],[[.061,0,-.002],[.057,-.058,.002],[.040,-.076,.003]],pocketMat);
  cord(pocket,[[-.060,.002,-.005],[0,.001,.001],[.060,.002,-.001]],.0028,rose?m.edge:m.cream,10);
}

function kerchief(parent,m) {
  const points=[[-.089,1.512,-.020],[-.102,1.491,.053],[-.069,1.467,.088],[0,1.451,.110],[.075,1.475,.080],[.093,1.492,.040],[.081,1.51,-.028]];
  mesh(parent,sweep(points,[.014,.020,.021,.020,.020,.017,.013],.62,[0,1,0]),m.accent);
  for(const s of [-1,1])mesh(parent,sweep([[0,1.453,.115],[s*.019,1.427,.131],[s*.031,1.391,.149]],
    [.011,.016,.003],.30),m.accent);
}

function wrapFront(parent,m,id) {
  const inside=onShirt([[-.097,1.501],[-.071,1.460],[.017,1.382],[.099,1.322]],.013);
  const outside=onShirt([[.087,1.507],[.066,1.464],[-.023,1.378],[-.107,1.283],[-.174,1.191]],.017);
  mesh(parent,sweep(inside,[.014,.018,.019,.012],.27),id==='hana'?m.edge:m.band);
  mesh(parent,sweep(outside,[.017,.023,.024,.024,.014],.28),m.cream);
  if(id==='hana'){
    mesh(parent,loft([[1.026,.191,.144],[1.040,.193,.145],[1.106,.190,.143],[1.112,.185,.139]],36),m.bottom);
    cord(parent,[[-.151,1.064,.094],[0,1.057,.147],[.152,1.066,.093]],.005,m.band,12);
    for(const s of [-1,1]){
      mesh(parent,sweep([[0,1.062,.151],[s*.032,1.044,.156],[s*.051,1.017,.161],[s*.056,.977,.160]],
        [.011,.013,.013,.007],.34),m.bottom);
    }
  }
}

function costume(parent,id,m) {
  const skirted=['rosa','hana','lucie'].includes(id);
  const hem=skirted?(id==='hana'?1.039:.968):shirtProfile[0][0];
  const shirt=skirted?[[hem,.184,.131],...shirtProfile.filter(row=>row[0]>hem)]:shirtProfile;
  mesh(parent,loft(shirt,36),id==='lucie'?m.sleeve:m.top);
  if(['rosa','hana','lucie'].includes(id))pleatedSkirt(parent,m,id);
  if(['rosa','pierre','ken'].includes(id))apron(parent,m,id);
  if(id==='ken'||id==='hana'){wrapFront(parent,m,id);return;}
  if(id==='theo'){
    flap(parent,[[-.090,1.503],[-.106,1.402],[-.066,1.183],[-.058,.887]],
      [[.087,1.501],[.100,1.402],[.068,1.183],[.056,.887]],m.accent,.012);
    for(const s of [-1,1]){
      const a=[[s*.074,1.507],[s*.113,1.398],[s*.084,1.286],[s*.061,1.162]];
      const b=[[s*.131,1.483],[s*.169,1.407],[s*.118,1.356],[s*.061,1.162]];
      flap(parent,a,b,m.band,.019);
    }
    collar(parent,m,m.accent);smockPocket(parent,m,.132,1.296,m.top);
    cord(parent,onShirt([[.008,1.429],[.008,1.270],[.008,1.099],[.008,.922]],.016),.0018,m.wood,12);
    for(const y of [1.390,1.302,1.208])button(parent,m,.009,y,m.wood);
  } else if(id==='lucie'){
    mesh(parent,loft([[.986,.193,.142],[1.040,.188,.143],[1.121,.195,.15],[1.219,.215,.160]],36),m.top);
    flap(parent,[[-.150,1.320],[-.148,1.273],[-.174,1.195]],
      [[.150,1.320],[.148,1.273],[.174,1.195]],m.top,.014);
    for(const s of [-1,1]){
      const path=onShirt([[s*.130,1.477],[s*.122,1.403],[s*.103,1.318]],.013);
      mesh(parent,sweep(path,[.020,.022,.019],.27),m.band);
      button(parent,m,s*.106,1.319,m.cream);
    }
    kerchief(parent,m);
  } else {
    collar(parent,m,id==='sam'?m.edge:m.cream);
    if(id==='sam'){
      for(const s of [-1,1])smockPocket(parent,m,s*.112,1.349,m.top);
      const badge=joint(parent,-.115,1.383,shirtZ(-.115,1.383)+.011);
      badge.rotation.y=-.40;
      ellipsoid(badge,m.gold,[.022,.026,.004],[0,0,0],12,8);
      mesh(badge,sweep([[-.009,-.011,.004],[0,.001,.005],[.008,.013,.004]],[.001,.007,.001],.32),m.sea);
      for(const y of [1.389,1.301,1.230,1.089])button(parent,m,0,y);
      mesh(parent,loft([[.906,.223,.154],[.941,.218,.151]],36),m.leather);
      mesh(parent,new THREE.BoxGeometry(.052,.030,.010),m.gold,0,.921,.155);
      camera(parent,m);
    }
    if(id==='odette'){
      for(const s of [-1,1])smockPocket(parent,m,s*.121,1.012,m.top);
      kerchief(parent,m);
      for(const y of [1.307,1.211,1.115])button(parent,m,.014,y,m.band);
      for(const [x,y,r,paint] of [[-.112,.981,.009,m.cream],[-.089,.956,.006,m.sea],[-.117,.965,.004,m.accent],[.099,.985,.011,m.gold]])
        ellipsoid(parent,paint,[r,r*.70,.002],[x,y,shirtZ(x,y)+.016],10,6);
    }
  }
}

function shoesAndLegs(body,id,m) {
  const bare=id==='lucie'||id==='rosa', long=id==='hana';
  for(const s of [-1,1]){
    const stride=s*(id==='theo'?.060:.020);
    const leg=joint(body,s*(id==='lucie'?.093:.108),0,stride);
    const trouser=(rows,sides)=>loft(rows.map(([y,w,d])=>[y,w,d,-stride*smoothstep(.36,.84,y)]),sides);
    leg.rotation.y=s*.068;
    const pants=bare?m.skin:long?m.cream:m.bottom;
    mesh(leg,trouser([[.10,.043,.046],[.145,.055,.055],[.190,.058,.060],[.294,.067,.073],[.421,.061,.066],
      [.505,.071,.072],[.55,.076,.077],[.686,.080,.088],[.798,.092,.103],[.901,.089,.088],[.921,.042,.052]],22),pants);
    if(!bare&&!long){
      mesh(leg,trouser([[.135,.073,.068],[.149,.078,.072],[.190,.074,.069],[.225,.070,.067],[.349,.074,.075],[.443,.078,.076],
        [.526,.077,.084],[.678,.091,.096],[.847,.101,.111],[.915,.093,.095]],24),m.bottom);
      mesh(leg,loft([[.141,.074,.070],[.145,.079,.073],[.168,.078,.072],[.172,.074,.069]],24),id==='odette'?m.edge:m.bottom);
    }
    if(bare){
      const h=id==='lucie'?.339:.194;
      mesh(leg,loft([[.088,.049,.051],[.142,.057,.060],[h-.024,.066,.070],[h,.065,.069]],22),m.cream);
      mesh(leg,loft([[h-.022,.066,.071],[h-.013,.068,.073],[h,.066,.070]],22),m.cream);
    }
    mesh(leg,loft([[.009,.069,.122,.039],[.014,.075,.134,.046],[.030,.075,.136,.046],[.037,.072,.132,.047]],30,.84),m.sole);
    mesh(leg,loft([[.031,.072,.131,.047],[.046,.073,.129,.046],[.065,.069,.124,.049],[.081,.067,.113,.041],
      [.098,.062,.090,.025],[.114,.059,.066,.006],[id==='sam'?.216:.135,.054,.056,-.006]],30,.84),long?m.cream:bare?m.band:m.shoe);
    if(bare){
      cord(leg,[[-.059,.091,.056],[-.034,.107,.061],[.005,.116,.064],[.039,.105,.061],[.061,.088,.055]],.006,m.band,12);
      ellipsoid(leg,m.gold,[.008,.005,.006],[s*.059,.091,.061],9,6);
    } else if(!long){
      for(let i=0;i<2;i++)cord(leg,[[-.037,.101+i*.005,.060-i*.018],[0,.112+i*.005,.069-i*.018],[.036,.101+i*.005,.060-i*.018]],.003,m.edge,8);
    } else {
      cord(leg,[[-.058,.084,.019],[-.030,.095,.060],[0,.082,.110],[.032,.093,.059],[.059,.082,.018]],.007,m.accent,12);
    }
  }
}

// Absolute elbow and palm positions in the neutral pose keep each tool in its hand.
const poses={
  rosa:   [[[-.284,1.157,.002],[-.270,.902,.068]],[[.305,1.216,.033],[.237,1.203,.210]]],
  sam:    [[[-.290,1.171,.003],[-.249,.912,.083]],[[.308,1.188,-.027],[.258,.974,.079]]],
  theo:   [[[-.312,1.217,.058],[-.082,1.018,.280]],[[.343,1.236,.064],[.258,1.257,.225]]],
  odette: [[[-.279,1.157,.012],[-.265,.908,.080]],[[.314,1.217,.010],[.281,1.097,.201]]],
  pierre: [[[-.314,1.216,.040],[-.247,1.153,.220]],[[.291,1.161,.004],[.269,.915,.075]]],
  lucie:  [[[-.286,1.182,.016],[-.281,.949,.085]],[[.337,1.27,.005],[.377,1.438,.156]]],
  hana:   [[[-.277,1.208,.007],[-.016,1.095,.227]],[[.277,1.200,-.001],[.072,1.063,.234]]],
  ken:    [[[-.338,1.221,.039],[-.175,1.163,.251]],[[.319,1.179,.003],[.246,.954,.128]]],
};

function arm(chest,id,s,m) {
  const x=s*.215,y=1.416,z=.001, pivot=joint(chest,x,y,z);
  const points=poses[id][s>0?1:0];
  const [elbow,hand]=points.map(([a,b,c])=>new THREE.Vector3(a-x,b-y,c-z));
  const shoulder=new THREE.Vector3(), v=elbow.clone().sub(hand).normalize();
  const wrist=hand.clone().addScaledVector(v,.055);
  const bend=elbow.clone().multiplyScalar(.90);
  const cuff=id==='hana'?.94:id==='sam'||id==='theo'?.87:id==='odette'?.82:id==='lucie'?.15:.37;
  const cuffAt=elbow.clone().lerp(wrist,cuff);
  const initial=new THREE.Vector3(-s*.062,.018,-.010);
  const upper=shoulder.clone().lerp(elbow,.32);
  const sleevePoints=[initial,shoulder,upper,bend,cuffAt].map(p=>p.toArray());
  const widths=id==='hana'?[.049,.078,.086,.104,.113]:[.045,.073,.079,.061,id==='lucie'?.064:.052];
  const striped=id==='odette';
  const sleeveGeo=taperedTube(sleevePoints,widths,18,striped?t=>{
    return (t>.26&&Math.floor((t-.26)*12)%2===0)?m.edge.color:m.sleeve.color;
  }:null);
  mesh(pivot,sleeveGeo,striped?m.paint:m.sleeve);
  const wristStart=cuffAt.clone().lerp(elbow,.15);
  mesh(pivot,taperedTube([wristStart,cuffAt.clone().lerp(wrist,.44),wrist,hand].map(p=>p.toArray()),
    [.043,.046,.034,.028],16),m.skin);
  const hemStart=cuffAt.clone().lerp(bend,.20);
  mesh(pivot,taperedTube([hemStart,hemStart.clone().lerp(cuffAt,.40),cuffAt].map(p=>p.toArray()),[widths[4],widths[4]+.004,widths[4]+.002],18),id==='hana'||id==='lucie'?m.sleeve:id==='sam'||id==='theo'?m.band:id==='ken'?m.edge:m.cream);
  // The sleeve opening is visible on the flared kimono and the child's raised arm.
  const facing=cuffAt.clone().sub(hemStart).normalize();
  const end=mesh(pivot,new THREE.CircleGeometry(widths[4]+.001,20),id==='hana'?m.cream:m.sleeve,...cuffAt.toArray());
  end.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),facing);
  const palm=joint(pivot,...hand.toArray());
  if(id==='lucie'&&s>0){
    ellipsoid(palm,m.skin,[.036,.042,.021],[0,.002,0],14,10);
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.016;
      const finger=ellipsoid(palm,m.skin,[.009,.023-(i===3?.005:0),.010],[x,.040+.008*Math.cos(i-1),0],10,8);
      finger.rotation.z=-x*5;
    }
    ellipsoid(palm,m.skin,[.013,.025,.014],[-.035,.009,.006],10,8).rotation.z=.65;
  }else{
    const glove=joint(palm);
    glove.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),v.clone().negate());
    ellipsoid(glove,m.skin,[.036,.054,.031],[0,.001,0],14,10);
    ellipsoid(glove,m.skin,[.016,.032,.018],[-s*.027,.010,.017],12,8).rotation.z=-s*.43;
  }
  return {pivot,palm};
}

export function buildResident(id) {
  const a=outfits[id],m=materials(a),body=new THREE.Group();
  const base=joint(body);base.scale.x=a.width;
  shoesAndLegs(base,id,m);
  const chest=joint(base);
  costume(chest,id,m);
  mesh(chest,loft([[1.448,.095,.083],[1.504,.078,.072],[1.551,.061,.062],[1.618,.066,.068]],24),m.skin,0,0,-.001);
  const {head,eyes}=buildResidentHead(chest,id,m);
  head.scale.x/=a.width;
  const [left,right]=[-1,1].map(s=>arm(chest,id,s,m));
  if(id==='rosa')bagel(right.palm,m);
  if(id==='theo')guitar(chest,m);
  if(id==='odette')palette(right.palm,m);
  if(id==='pierre')baguette(left.palm,m);
  if(id==='ken')ramen(left.palm,m);
  const arms=[left.pivot,right.pivot];
  finishFigure(body,[...eyes,head,...arms,chest]);
  const beat=id==='theo'?2.6:id==='lucie'?2.1:1.55;
  function pose(t,greeting) {
    chest.position.y=.0032*Math.sin(t*beat);
    if(id==='theo'){
      left.pivot.rotation.x=.051*Math.sin(t*3.8);
      right.pivot.rotation.z=.010*Math.sin(t*1.85);
    }else if(id==='lucie'){
      right.pivot.rotation.z=.030*Math.sin(t*2.0)+greeting*.15*Math.sin(t*5.8);
      left.pivot.rotation.x=-.025*Math.sin(t*1.5);
    }else if(id==='hana'){
      chest.rotation.x=.025+greeting*.055;
    }else{
      const free=id==='pierre'||id==='ken'?right:left;
      free.pivot.rotation.x=-.018*Math.sin(t*1.5)-.13*greeting;
      free.pivot.rotation.z=(free===right?1:-1)*(.015+.06*greeting);
    }
  }
  return {body,head,eyes,pose,size:a.size,labelHeight:id==='sam'?2.02:1.95};
}
