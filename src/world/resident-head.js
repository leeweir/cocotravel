import * as THREE from 'three';
import { TAU, lerp, smoothstep, canvas2d, canvasTexture } from '../core/utils.js';
import { joint, mesh, ellipsoid, rings, loft, cord, sweep, curve } from './model-geometry.js';

// Horizontal sections of the head from the chin to the crown, +Z facing the street.
const profile = [
  [-.169,.008,.010,.014],[-.164,.041,.049,.014],[-.151,.071,.078,.012],
  [-.127,.097,.102,.009],[-.099,.118,.118,.007],[-.065,.136,.132,.005],
  [-.029,.149,.140,.002],[.009,.153,.144,-.002],[.050,.151,.144,-.005],
  [.088,.145,.139,-.009],[.122,.133,.128,-.012],[.151,.112,.108,-.014],
  [.175,.077,.078,-.015],[.187,.039,.042,-.015],[.191,.003,.005,-.015],
];

const faces = {
  rosa:   { jaw:1.01, cheek:1.05, eyes:1.03, nose:.93, brow:.85, hair:'bun' },
  sam:    { jaw:1.14, cheek:.99, eyes:.88, nose:1.28, brow:1.30, hair:'ranger' },
  theo:   { jaw:1.01, cheek:.99, eyes:.94, nose:1.17, brow:1.03, hair:'curls' },
  odette: { jaw:.94, cheek:.98, eyes:.99, nose:1, brow:.89, hair:'bob' },
  pierre: { jaw:1.08, cheek:1.07, eyes:.91, nose:1.32, brow:1.17, hair:'part' },
  lucie:  { jaw:.94, cheek:1.06, eyes:1.22, nose:.68, brow:.74, hair:'pony' },
  hana:   { jaw:.90, cheek:.97, eyes:.96, nose:.85, brow:.79, hair:'long' },
  ken:    { jaw:1.13, cheek:1.04, eyes:.89, nose:1.16, brow:1.31, hair:'band' },
};

function section(y,f) {
  let i=1;
  while(i<profile.length-1 && profile[i][0]<y) i++;
  const a=profile[i-1], b=profile[i], u=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
  const width=lerp(a[1],b[1],u)*lerp(f.jaw,f.cheek,smoothstep(-.15,-.055,y));
  return [width,lerp(a[2],b[2],u),lerp(a[3],b[3],u)];
}

function relief(x,y,f) {
  const tip=.027*Math.exp(-(x*x/.00036+(y+.043)**2/.00019));
  const bridge=.013*Math.exp(-(x*x/.00018+(y+.011)**2/.0013));
  const wing=.007*Math.exp(-((Math.abs(x)-.018)**2/.00010+(y+.049)**2/.00011));
  const cheeks=.004*Math.exp(-((Math.abs(x)-.087)**2/.0008+(y+.049)**2/.00051));
  return .84*f.nose*(tip+bridge+wing)+cheeks;
}

function surface(x,y,f) {
  const [w,d,offset]=section(y,f);
  const front=Math.sqrt(Math.max(0,1-(x/w)**2));
  return offset+(d+relief(x,y,f))*front;
}

function sculpt(f,m) {
  const base=m.skin.color, cheek=m.cheek.color, tone=new THREE.Color();
  return rings(45,56,(j,a)=>{
    const y=lerp(-.169,.191,j/44), [w,d,z]=section(y,f);
    const x=w*Math.sin(a), c=Math.cos(a), redness=Math.exp(-((Math.abs(x)-.091)**2/.00117+(y+.049)**2/.00038));
    tone.copy(base).lerp(cheek,Math.max(0,c)*(.53*redness+.14*relief(x,y,f)/.035));
    return [x,y,z+d*c+relief(x,y,f)*Math.max(0,c),tone];
  });
}

function eyeTexture(side, f, iris, liner) {
  const {c,ctx}=canvas2d(192,116);
  ctx.translate(96,0);ctx.scale(side,1);ctx.translate(-96,0);
  const lower=f.hair==='band'||f.hair==='ranger'?91:f.hair==='pony'?108:101;
  ctx.beginPath();ctx.moveTo(9,64);ctx.bezierCurveTo(47,11,111,10,170,44);
  ctx.quadraticCurveTo(179,47,183,40);ctx.bezierCurveTo(162,lower,66,lower+14,9,64);ctx.closePath();
  ctx.save();ctx.clip();
  const sclera=ctx.createLinearGradient(0,20,0,100);
  sclera.addColorStop(0,'#ccad9f');sclera.addColorStop(.49,'#fff1dc');sclera.addColorStop(1,'#fff4e1');
  ctx.fillStyle=sclera;ctx.fillRect(0,0,192,116);
  ctx.fillStyle=liner;ctx.beginPath();ctx.ellipse(97,53,41,43,0,0,TAU);ctx.fill();
  const shade=ctx.createLinearGradient(0,20,0,98);shade.addColorStop(0,liner);shade.addColorStop(.58,iris);shade.addColorStop(1,'#c19b68');
  ctx.fillStyle=shade;ctx.beginPath();ctx.ellipse(97,53,37,39,0,0,TAU);ctx.fill();
  ctx.fillStyle='#30282a';ctx.beginPath();ctx.ellipse(96,50,20,27,0,0,TAU);ctx.fill();
  ctx.fillStyle='#fff9ed';ctx.beginPath();ctx.ellipse(96-side*13,37,7,6,0,0,TAU);ctx.fill();
  ctx.restore();
  ctx.lineCap='round';ctx.strokeStyle=liner;ctx.lineWidth=6.5;
  ctx.beginPath();ctx.moveTo(10,63);ctx.bezierCurveTo(53,8,111,10,170,44);ctx.quadraticCurveTo(178,46,184,39);ctx.stroke();
  return canvasTexture(c);
}

function lid(head,s,f,m) {
  const x=s*(f.hair==='pony'?.061:.063), y=f.hair==='pony'?-.014:-.003, z=surface(x,y,f);
  const pivot=joint(head,x,y,z);
  pivot.name='eyelid';
  const geo=new THREE.PlaneGeometry(.073*f.eyes,.046*f.eyes,8,5), pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setZ(i,surface(x+pos.getX(i),y+pos.getY(i),f)-z+.0017);
  const eye=mesh(pivot,geo,new THREE.MeshBasicMaterial({
    map:eyeTexture(s,f,m.iris,m.liner),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
  }));
  eye.renderOrder=2;
  return pivot;
}

function lineOnFace(head,f,coords,widths,material,depth=.0024) {
  const points=coords.map(([x,y])=>[x,y,surface(x,y,f)+depth]);
  return mesh(head,sweep(points,widths,.46),material);
}

function styleHairline(f,a){
  const part=Math.atan2(Math.sin(a+.55),Math.cos(a+.55));
  return (f.hair==='long'?.084:.063)+.036*Math.exp(-part*part/.075)+.013*Math.sin(2*a-.34);
}

function hairShell(head,f,m) {
  const isCurl=f.hair==='curls', short=['ranger','band','part','curls'].includes(f.hair);
  const tone=new THREE.Color();
  const geo=rings(33,68,(j,a)=>{
    const v=1-j/32, front=smoothstep(-.30,.90,Math.cos(a));
    const edge=lerp(short?-.072:-.115,styleHairline(f,a),front)
      + (isCurl?.006:.002)*Math.cos(a*(isCurl?15:6));
    const top=isCurl?.206:.199, t=v*Math.acos((edge-.008)/(top-.008));
    const y=.008+(top-.008)*Math.cos(t), sn=Math.sin(t);
    const [w,d,z]=section(y,f), overlap=1-smoothstep(.191,top,y);
    const flow=a+.40*Math.sin(a-.55)*(1-v)+.13*Math.sin(a*2+v*3);
    const ridge=.5+.5*Math.cos((isCurl?18:14)*flow+(isCurl?1.6*Math.sin(v*21):.75*Math.sin(flow*4)));
    const x=Math.max(w*overlap+.009*sn,.164*sn), depth=Math.max(d*overlap+.013*sn,.156*sn);
    const curl=.5+.5*Math.cos(flow*18+v*15)*Math.cos(v*23+Math.sin(a*7));
    const lift=1+(isCurl?.060*curl:.004*ridge);
    tone.copy(m.hair.color).lerp(m.lock.color,.17+(isCurl?.48*curl:.26*ridge)*Math.sin(v*2.6)+.06*Math.sin(v*Math.PI));
    return [x*lift*Math.sin(a),y,z+depth*lift*Math.cos(a),tone];
  });
  mesh(head,geo,m.paint);
}

function fringe(head,f,m,coords,widths) {
  const path=curve(coords.map(([x,y])=>[x,y,0])),points=[],index=[];
  const steps=22, across=8;
  for(let j=0;j<=steps;j++){
    const t=j/steps, center=path.getPoint(t), dir=path.getTangent(t);
    const pos=t*(widths.length-1), k=Math.min(Math.floor(pos),widths.length-2);
    const w=lerp(widths[k],widths[k+1],pos-k);
    for(let i=0;i<=across;i++){
      const u=2*i/across-1,x=center.x-dir.y*w*u,y=center.y+dir.x*w*u;
      const [sw,sd,z]=section(y,f), sn=Math.sqrt(Math.max(0,1-((y-.008)/.191)**2));
      const rx=Math.max(sw+.009*sn,.164*sn), rz=Math.max(sd+.010*sn,.156*sn);
      const height=z+rz*Math.sqrt(Math.max(0,1-(x/rx)**2));
      points.push(x,y,height+.0015+.0035*(1-u*u));
      const l=j*(across+1)+i;
      if(i<across && j<steps) index.push(l,l+1,l+across+1,l+1,l+across+2,l+across+1);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(index);geo.computeVertexNormals();
  mesh(head,geo,m.hair);
}

function softBow(parent,material,x,y,z,size=.05) {
  const bow=joint(parent,x,y,z);
  for(const s of [-1,1]){
    mesh(bow,sweep([[0,0,0],[s*size*.5,size*.19,0],[s*size,size*.27,-size*.15]],
      [size*.12,size*.28,size*.38],.46),material);
    mesh(bow,sweep([[s*size*.1,0,0],[s*size*.43,-size*.45,-.002],[s*size*.49,-size*.87,.003]],
      [size*.15,size*.20,size*.14],.35),material);
  }
  ellipsoid(bow,material,[size*.20,size*.18,size*.17],[0,0,0]);
  return bow;
}

function hairDetails(head,f,m) {
  const style=f.hair;
  if(style==='curls'){
    // Soft, close curls share a scalloped hairline. Their roots disappear into the crown.
    for(let i=0;i<11;i++){
      const a=-1.48+i*.28, y=.066+.012*Math.cos(a*2.4)+.004*Math.sin(i*2.1);
      const tuft=ellipsoid(head,m.hair,[.025,.018,.019],[.148*Math.sin(a),y,.141*Math.cos(a)-.006],12,9);
      tuft.rotation.z=.28*Math.sin(i);
    }
  } else if(style==='long'){
    fringe(head,f,m,[[-.028,.150],[-.061,.115],[-.107,.077],[-.132,.028]],[.005,.023,.023,.002]);
    fringe(head,f,m,[[-.023,.150],[.026,.111],[.089,.071],[.124,.028]],[.003,.024,.023,.003]);
  } else {
    fringe(head,f,m,[[-.083,.140],[-.046,.095],[.014,.074],[.081,.053],[.121,.028]],[.001,.013,.016,.012,.0007]);
    fringe(head,f,m,[[-.080,.131],[-.104,.102],[-.124,.066],[-.134,.042]],[.003,.015,.014,.001]);
  }
  for(const s of [-1,1]){
    const y=style==='bob'?-.125:style==='long'?-.135:style==='ranger'||style==='band'?-.046:-.070;
    mesh(head,sweep([[s*.109,.10,.079],[s*.139,.05,.063],[s*.148,-.005,.045],[s*.142,y,.052]],
      [.011,.024,style==='bob'?.028:.018,.0018],.62),style==='ranger'?m.temple:m.hair);
  }
  if(style==='bun'){
    ellipsoid(head,m.hair,[.100,.089,.083],[.009,.115,-.131]).rotation.z=.20;
    softBow(head,m.accent,-.109,.137,.077,.057).rotation.z=.52;
    const band=mesh(head,loft([[-.021,.154,.142],[-.016,.157,.146],[.013,.157,.146],[.022,.154,.142]],40),m.accent,0,.107,-.009);
    band.rotation.z=-.065;
    for(let i=0;i<5;i++){
      const a=-.78+i*.36;
      ellipsoid(band,m.cream,[.0025,.0036,.0028],[.157*Math.sin(a),.001+(i%2)*.004,.147*Math.cos(a)]);
    }
  }
  if(style==='bob'||style==='long'){
    const long=style==='long';
    const fall=mesh(head,loft(long?[
      [-.344,.044,.024],[-.327,.075,.036],[-.233,.081,.049],[-.150,.102,.066],[-.056,.126,.085],[.034,.119,.078],
    ]:[
      [-.137,.099,.061],[-.128,.136,.089],[-.078,.151,.105],[.011,.152,.109],[.067,.137,.092],
    ],40),m.hair,0,-.004,-.066);
    fall.rotation.x=long?.12:0;
    if(long)softBow(head,m.cream,0,-.154,-.185,.061);
  }
  if(style==='pony'){
    const tie=joint(head,.096,.022,-.118);
    mesh(tie,sweep([[0,0,0],[.045,.016,-.045],[.084,-.036,-.079],[.095,-.112,-.087],[.121,-.158,-.058],[.140,-.159,-.033]],
      [.021,.046,.049,.034,.015,.002],.80),m.hair);
    softBow(tie,m.accent,.006,.012,-.008,.040);
  }
  if(style==='band'||style==='part'){
    for(const s of [-1,1])
      mesh(head,sweep([[s*.133,.060,.062],[s*.151,.010,.025],[s*.146,-.046,.011]],
        [.005,.017,.006],.64),m.temple);
  }
}

function headwear(head,style,m) {
  if(style==='ranger'){
    const hat=joint(head,0,.125,-.009);hat.rotation.z=-.038;
    const brim=rings(5,52,(j,a)=>{
      const w=[.141,.168,.207,.217,.216][j], d=[.139,.17,.204,.215,.214][j];
      return [w*Math.sin(a),[.010,.009,.002,-.003,.002][j] + .020*Math.sin(a)**2*j/4,d*Math.cos(a)];
    });
    mesh(hat,brim,m.hat);
    mesh(hat,loft([[.001,.154,.146],[.012,.164,.152],[.041,.158,.147],[.100,.132,.127],[.118,.119,.114],[.123,.086,.086],[.119,.003,.004]],48,.90),m.hat);
    mesh(hat,loft([[.016,.165,.154],[.036,.162,.152]],48,.91),m.leather);
    ellipsoid(hat,m.gold,[.014,.010,.003],[.038,.027,.150]);
  }
  if(style==='bob'){
    const beret=joint(head,.002,.127,-.010);beret.rotation.set(-.060,0,-.14);
    mesh(beret,loft([[-.018,.139,.134],[-.014,.159,.151],[.004,.158,.151],[.016,.170,.164]],48),m.band);
    const crown=mesh(beret,loft([[.001,.149,.148],[.014,.179,.168],[.037,.187,.178],[.062,.174,.169],
      [.082,.140,.140],[.093,.092,.099],[.098,.003,.003]],48),m.accent,-.018,.001,-.007);
    crown.rotation.z=.044;
    cord(beret,[[-.027,.093,0],[-.029,.103,-.003],[-.024,.114,-.006]],.005,m.band,8);
  }
  if(style==='band'){
    const wrap=joint(head,0,.097,-.009);wrap.rotation.z=-.045;
    mesh(wrap,loft([[-.024,.154,.146],[-.019,.162,.153],[.025,.164,.154],[.035,.159,.150]],48),m.cream);
    mesh(wrap,loft([[-.012,.164,.155],[-.009,.1645,.1555]],48),m.edge);
    softBow(head,m.cream,-.132,.11,-.082,.047).rotation.z=1.0;
  }
}

function eyewear(head,m) {
  const metal=m.rim;
  for(const s of [-1,1]){
    const lens=joint(head,s*.061,-.007,.145);
    lens.rotation.y=s*.27;
    const ring=mesh(lens,new THREE.TorusGeometry(.044,.0037,6,36),metal);
    ring.scale.y=.83;
    cord(head,[[s*.102,-.003,.132],[s*.130,.003,.102],[s*.148,.002,.034],[s*.147,-.010,-.007]],.0032,metal,10);
  }
  cord(head,[[-.020,-.002,.150],[0,.009,.157],[.020,-.002,.150]],.0036,metal,8);
}

export function buildResidentHead(parent,id,m) {
  const f=faces[id],head=joint(parent,0,1.733,.005), eyes=[];
  if(id==='lucie')head.scale.setScalar(1.12);
  mesh(head,sculpt(f,m),m.paint);
  for(const s of [-1,1]){
    const ear=ellipsoid(head,m.skin,[.026,.036,.021],[s*.146,-.030,-.009]);ear.rotation.z=-s*.14;
    ellipsoid(head,m.cheek,[.010,.022,.011],[s*.162,-.029,-.002]);
    if(id==='odette'||id==='rosa')ellipsoid(head,m.gold,[.007,.008,.007],[s*.154,-.058,.001]);
    eyes.push(lid(head,s,f,m));
    const lift=id==='odette'&&s===1?.011:id==='sam'&&s===-1?.006:0;
    const brow=[[.027,.036+lift],[.046,.040+lift],[.070,.042+lift],[.091,.036+lift],[.104,.028+lift]].map(([x,y])=>[s*x,y]);
    lineOnFace(head,f,brow,[.0018,.0045*f.brow,.0049*f.brow,.0036*f.brow,.0008],m.brow);
    if(id==='lucie'||id==='rosa'){
      for(const [dx,dy] of [[.078,-.043],[.090,-.050],[.101,-.044]]){
        const x=s*dx;ellipsoid(head,m.freckle,[.0018,.0016,.0015],[x,dy,surface(x,dy,f)+.001]);
      }
    }
  }
  const lipY=id==='lucie'?-.085:-.091;
  const smile=[[-.043,lipY+.009],[-.028,lipY+.001],[-.007,lipY-.003],[.015,lipY-.002],[.033,lipY+.003],[.044,lipY+.012]];
  lineOnFace(head,f,smile,[.0009,.0027,.0032,.0031,.0025,.0006],m.lip);
  lineOnFace(head,f,[[-.023,lipY-.003],[0,lipY-.008],[.022,lipY-.003]],[.0007,.0037,.0007],m.cheek);
  for(const s of [-1,1]){
    const x=s*.016,y=-.053;
    ellipsoid(head,m.freckle,[.003,.0015,.0013],[x,y,surface(x,y,f)+.0007]);
    if(id==='pierre'||id==='sam'){
      lineOnFace(head,f,[[s*.002,-.061],[s*.014,-.062],[s*.031,-.066],[s*.052,-.064],[s*.063,-.057]],
        [.001,.006,.007,.004,.0007],id==='sam'?m.temple:m.brow,.003);
    }
  }
  hairShell(head,f,m);hairDetails(head,f,m);headwear(head,f.hair,m);
  if(id==='theo')eyewear(head,m);
  return {head,eyes};
}
