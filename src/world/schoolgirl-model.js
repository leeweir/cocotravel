import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TAU, blobShadow, canvas2d, canvasTexture, lerp, smoothstep } from '../core/utils.js';
import { batchRigidProp } from '../core/static-meshes.js';

import { mesh, joint, ellipsoid, rings, signedPow, loft, cord, sweep, fabricPanel, curve, hermite } from './model-geometry.js';

const HIP = .824;
const KNEE = .393;
const SHIN = .350;
const ELBOW = .226;
const cloth = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness:.88, ...options });
const faceProfile = [
  [-.150,.004,.008,.021],[-.145,.038,.046,.021],[-.133,.069,.075,.020],[-.115,.093,.094,.017],
  [-.090,.114,.109,.013],[-.066,.128,.119,.009],[-.041,.136,.125,.006],[-.014,.140,.129,.004],
  [.014,.143,.133,.001],[.047,.143,.136,-.002],[.079,.138,.133,-.005],
  [.108,.127,.123,-.009],[.135,.103,.103,-.011],[.151,.073,.078,-.012],
  [.162,.034,.041,-.013],[.165,.003,.005,-.013],
];

function faceSection(y) {
  let j = 1;
  while (j < faceProfile.length-1 && faceProfile[j][0] < y) j++;
  const p = faceProfile[j-1], q = faceProfile[j];
  const prev = faceProfile[Math.max(0,j-2)], next = faceProfile[Math.min(j+1,faceProfile.length-1)];
  const span = q[0]-p[0], t = THREE.MathUtils.clamp((y-p[0])/span,0,1);
  return [1,2,3].map(k=>hermite(p[k],q[k],span*(q[k]-prev[k])/(q[0]-prev[0]),span*(next[k]-p[k])/(next[0]-p[0]),t));
}

function noseDepth(x,y) {
  return .0105*Math.exp(-(x*x/.00025+(y+.045)**2/.00018))
    + .0038*Math.exp(-(x*x/.00020+(y+.022)**2/.00047));
}

function faceZ(x,y) {
  const [width,depth,offset] = faceSection(y);
  return offset+depth*Math.sqrt(Math.max(0,1-(x/width)**2))+noseDepth(x,y);
}

function faceGeometry() {
  const skin = new THREE.Color('#f6c7aa'), pink = new THREE.Color('#ea8978');
  const warm = new THREE.Color('#dda083'), color = new THREE.Color();
  return rings(55,80,(j,a) => {
    const y = lerp(-.150,.165,j/54);
    const [rx,rz,offset] = faceSection(y), x = rx*Math.sin(a), front = Math.max(0,Math.cos(a));
    const cheek = Math.exp(-((Math.abs(x)-.088)**2/.0012+(y+.050)**2/.00048));
    const nose = noseDepth(x,y)*front;
    color.copy(skin).lerp(warm,.18*(1-front)).lerp(pink,front*(.82*cheek+.23*nose/.015));
    return [x,y,offset+rz*Math.cos(a)+nose,color];
  });
}

function paintedEye(side) {
  const {c,ctx} = canvas2d(256,160);
  ctx.translate(128,0); ctx.scale(side,1); ctx.translate(-128,0);
  ctx.beginPath(); ctx.moveTo(18,94);
  ctx.bezierCurveTo(43,57,70,34,123,36);
  ctx.bezierCurveTo(167,33,205,43,232,67);
  ctx.bezierCurveTo(207,118,166,135,123,134);
  ctx.bezierCurveTo(75,134,41,120,18,94); ctx.closePath();
  ctx.save(); ctx.clip();
  const white = ctx.createLinearGradient(0,35,0,138);
  white.addColorStop(0,'#d7beb0'); white.addColorStop(.47,'#ffefda'); white.addColorStop(1,'#fff3e2');
  ctx.fillStyle=white; ctx.fillRect(0,0,256,160);
  const iris = ctx.createLinearGradient(0,27,0,139);
  iris.addColorStop(0,'#36262b'); iris.addColorStop(.44,'#614032'); iris.addColorStop(.84,'#a66d43'); iris.addColorStop(1,'#c99458');
  ctx.fillStyle=iris; ctx.beginPath(); ctx.ellipse(125,83,58,61,0,0,TAU); ctx.fill();
  ctx.strokeStyle='#4e3630'; ctx.lineWidth=4; ctx.stroke();
  ctx.fillStyle='#36272b'; ctx.beginPath(); ctx.ellipse(125,77,31,38,0,0,TAU); ctx.fill();
  ctx.fillStyle='#fff9e9'; ctx.beginPath(); ctx.ellipse(125-side*17,63,11,9,0,0,TAU); ctx.fill();
  ctx.fillStyle='#dfaa74'; ctx.beginPath(); ctx.arc(125+side*21,111,4,0,TAU); ctx.fill();
  ctx.restore();
  ctx.lineCap='round'; ctx.strokeStyle='#513830'; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(19,93); ctx.bezierCurveTo(65,24,172,16,229,67); ctx.quadraticCurveTo(238,67,243,60); ctx.stroke();
  ctx.strokeStyle='#ad7663'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(52,119);ctx.quadraticCurveTo(147,161,211,92);ctx.stroke();
  return canvasTexture(c);
}

// Facial paint follows the actual cheek and brow surface, including in profile.
function eyePatch(parent, side) {
  const x = side*.058, y = -.013, z = faceZ(x,y);
  const eye = joint(parent,x,y,z);
  const geo = new THREE.PlaneGeometry(.075,.055,10,6), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i,faceZ(x+pos.getX(i),y+pos.getY(i))-z+.0016);
  }
  const paint = mesh(eye,geo,new THREE.MeshBasicMaterial({
    map:paintedEye(side),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
  }));
  paint.renderOrder = 2;
  return eye;
}

function hairCap() {
  const root = new THREE.Color('#402b2b'), light = new THREE.Color('#83563f'), color = new THREE.Color();
  return rings(32,92,(j,a) => {
    const v = 1-j/31, front = smoothstep(-.35,.92,Math.cos(a));
    const sidePart = Math.atan2(Math.sin(a+.53),Math.cos(a+.53));
    const edge = 2.46-1.20*front + front*(.22*Math.sin(a)-.16*Math.exp(-(sidePart**2)/.045))
      +.055*Math.sin(a*3+.5)+.04*Math.cos(a*8);
    const t = .009+v*edge;
    const flow = a+.42*Math.sin(a-.65)*(1-v)+.12*Math.sin(a*3+v*3);
    const strand = .5+.5*Math.cos(flow*17+.72*Math.sin(flow*5));
    const r = Math.sin(t)*(1+.012*strand*v);
    const sheen = .17+.24*Math.exp(-((v-.54)**2/.10))+.19*strand*Math.sin(v*Math.PI);
    color.copy(root).lerp(light,sheen);
    const y = .008+.170*Math.cos(t)-.009*v*(1-front);
    const [skinX,skinZ,center] = faceSection(y);
    const overlap = 1-smoothstep(.150,.167,y);
    const x = Math.max(.156*r,(skinX+.009)*overlap);
    const z = Math.max(.151*r,(skinZ+.012)*overlap);
    return [x*Math.sin(a)-.002*(1-v),y,center+z*Math.cos(a),color];
  });
}

// Shallow, painted fringe follows the curved forehead all the way to its tips.
function fringeLock(points,widths,material,parent) {
  const path = curve(points.map(([x,y])=>[x,y,0])), pos = [], indices = [];
  const steps = (points.length-1)*7, across = 8;
  for (let j=0;j<=steps;j++) {
    const t=j/steps, p=path.getPoint(t), tangent=path.getTangent(t);
    const f=t*(widths.length-1), k=Math.min(Math.floor(f),widths.length-2);
    const width=lerp(widths[k],widths[k+1],f-k);
    for (let i=0;i<=across;i++) {
      const u=i/across*2-1, x=p.x-tangent.y*u*width, y=p.y+tangent.x*u*width;
      const depth=.006+.004*Math.sin(t*Math.PI)+.005*(1-u*u)*Math.sin(t*Math.PI);
      pos.push(x,y,faceZ(x,y)+depth);
      if(j<steps && i<across) {
        const n=j*(across+1)+i;
        indices.push(n,n+across+1,n+1,n+1,n+across+1,n+across+2);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setIndex(indices); geo.computeVertexNormals();
  return mesh(parent,geo,material);
}

function star(parent, radius, material, x, y, z) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI/2+i*Math.PI/4, r = i%2 ? radius*.29 : radius;
    if (i) shape.lineTo(r*Math.cos(a),r*Math.sin(a));
    else shape.moveTo(r*Math.cos(a),r*Math.sin(a));
  }
  shape.closePath();
  return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth:.0017,bevelEnabled:false}),material,x,y,z);
}

function makeHead(parent,m) {
  const head = joint(parent,0,1.460-HIP,.004);
  mesh(head,faceGeometry(),m.face);
  const eyes = [], pigtails = [];
  for (const s of [-1,1]) {
    ellipsoid(head,m.skin,[.022,.030,.019],[s*.139,-.036,-.003]);
    ellipsoid(head,m.blush,[.008,.018,.012],[s*.155,-.035,.002]);
    eyes.push(eyePatch(head,s));
    const brow = [[.027,.020],[.045,.026],[.067,.028],[.088,.024]].map(([x,y]) => [s*x,y,faceZ(x,y)+.002]);
    mesh(head,sweep(brow,[.0007,.0027,.0028,.0005],.43),m.hairGlint);
    for (let i=0;i<3;i++) {
      const x = s*(.075+i*.010), y = -.051+(i%2)*.005;
      const spot = mesh(head,new THREE.CircleGeometry(.0016,8),m.freckle,x,y,faceZ(x,y)+.0012);
      spot.rotation.y = s*.61;
    }
  }
  const smile = [[-.024,-.078],[-.014,-.083],[.001,-.085],[.015,-.082],[.024,-.076]];
  const lips = (bottom) => smile.map(([x,y],i) => {
    const h = y-(bottom ? .0048*Math.sin(Math.PI*i/(smile.length-1)) : 0);
    return [x,h,faceZ(x,h)+.0015];
  });
  fabricPanel(head,lips(false),lips(true),m.lip,0);
  mesh(head,hairCap(),m.hairPaint);
  // A side part, overlapping fringe and two loose temple locks frame the eyes.
  const fringe = [
    [[[-.077,.133],[-.050,.116],[.006,.089],[.071,.060],[.115,.032]],[.001,.017,.021,.013,.0007]],
    [[[-.079,.129],[-.099,.098],[-.118,.065],[-.124,.026]],[.001,.013,.011,.0006]],
    [[[-.067,.143],[-.018,.128],[.036,.107],[.082,.083],[.105,.066]],[.001,.012,.012,.010,.0007]],
  ];
  for (const [points,widths] of fringe) {
    fringeLock(points,widths,m.fringe,head);
  }
  for (const s of [-1,1]) {
    mesh(head,sweep([[s*.097,.110,.080],[s*.131,.059,.071],[s*.141,.000,.048],[s*.142,-.050,.043],[s*.129,-.076,.058]],
      [.009,.025,.024,.015,.001],.57),m.hair);
    const tail = joint(head,s*.127,-.068,-.069);
    ellipsoid(tail,m.red,[.024,.021,.024],[s*.008,-.002,0]);
    const tuft = joint(tail,s*.013,-.007,-.008);
    mesh(tuft,sweep([[0,.008,.002],[s*.022,-.013,-.022],[s*.030,-.047,-.034],[s*.045,-.077,-.027],[s*.061,-.086,-.008]],
      [.014,.031,.036,.023,.001],.84),m.hair);
    mesh(tuft,sweep([[s*.008,-.004,-.015],[s*.022,-.037,-.055],[s*.042,-.066,-.052],[s*.057,-.071,-.041]],
      [.005,.013,.012,.001],.62),m.hairGlint);
    pigtails.push({root:tail,side:s});
  }
  const clip = joint(head,.102,.061,faceZ(.102,.061)+.020);
  clip.rotation.set(0,.67,-.23);
  const pin = mesh(clip,new THREE.CapsuleGeometry(.0034,.023,3,7),m.ochre);
  pin.rotation.z = Math.PI/2;
  star(clip,.012,m.gold,-.009,.001,.003);
  return {head,eyes,pigtails};
}

function makeSkirt(parent,m) {
  // A knife pleat has a broad face, a pressed edge and a narrow recessed return.
  const widths = [1.017,1.025,1.019,1.012,.997,.967,.904,.917];
  const profile = [
    [-.312,.228,.178,.90],[-.320,.233,.181,1],[-.315,.236,.183,1],
    [-.302,.235,.182,1],[-.299,.234,.181,1],[-.296,.234,.181,1],
    [-.185,.208,.152,.94],[-.087,.182,.126,.68],[-.020,.162,.109,.38],
    [.047,.150,.099,.13],[.069,.149,.098,.02],
  ];
  const blue = new THREE.Color('#2c4262'), shade = new THREE.Color('#192f4c');
  const stitch = new THREE.Color('#758a9f'), color = new THREE.Color();
  const folds = 16, sides = folds*widths.length;
  const geo = rings(profile.length,sides,(j,a) => {
    const [y,rx,rz,depth] = profile[j], k = Math.round(a/TAU*sides)%widths.length;
    const radius = lerp(1,widths[k],depth), flow = a+.045*(1-depth);
    color.copy(blue).lerp(shade,(1.025-widths[k])*4.8*depth);
    if (j === 4) color.lerp(stitch,.58);
    return [Math.sin(flow)*rx*radius,y+.0035*Math.cos(flow*8+.6)*depth,Math.cos(flow)*rz*radius,color];
  });
  // These two cloth shapes clear the advancing knee without stretching the waistband.
  const pos = geo.attributes.position;
  geo.morphTargetsRelative = true;
  geo.morphAttributes.position = [-1,1].map(side => {
    const delta = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const hem = THREE.MathUtils.clamp((.050-y)/.37,0,1);
      const front = smoothstep(-.045,.098,z), back = smoothstep(-.035,.11,-z);
      const near = smoothstep(-.109,.075,side*x);
      delta.push(.007*side*hem*near,.031*hem*hem*(front*near+.30*back*(1-near)),
        hem*(.220*front*(.46+.54*near)-.165*back*(1-.62*near)));
    }
    return new THREE.Float32BufferAttribute(delta,3);
  });
  const skirt = mesh(parent,geo,m.pleats);
  mesh(parent,loft([[.046,.151,.100],[.050,.153,.102],[.068,.153,.102],[.074,.149,.099]],44,.94),m.navy);
  return skirt;
}

const blousePattern = [
  [.056,.140,.093],[.068,.148,.099],[.079,.155,.103],[.103,.161,.106],
  [.139,.161,.107],[.205,.157,.102],[.286,.162,.106],[.345,.176,.104],
  [.386,.184,.094],[.408,.175,.087],[.423,.145,.076],[.440,.091,.057],[.445,.054,.044],
];

function makeBlouse(parent,m) {
  const torso = joint(parent);
  const blouse = rings(blousePattern.length,48,(j,a) => {
    const [y,rx,rz] = blousePattern[j];
    const wrinkle = .0045*Math.cos(9*a+.6)*Math.exp(-((y-.088)**2)/.006);
    return [(rx+wrinkle)*signedPow(Math.sin(a),.91),y,(rz+wrinkle)*signedPow(Math.cos(a),.91)];
  });
  mesh(torso,blouse,m.white);
  mesh(torso,loft([[.407,.053,.049],[.452,.048,.046],[.501,.048,.047],[.536,.061,.057]],28),m.skin);
  // The placket and small shell buttons remain visible below the neckerchief.
  const placket = [[0,.102,.107],[0,.174,.105],[0,.245,.106],[0,.316,.109],[0,.353,.108]];
  mesh(torso,sweep(placket,[.006,.007,.007,.007,.005],.24),m.collar);
  for (const [y,z] of [[.138,.109],[.212,.106],[.286,.109]]) {
    ellipsoid(torso,m.button,[.0057,.0057,.0022],[.0005,y,z+.0017]);
  }
  const collarInner = [[.007,.450,-.048],[.050,.449,-.029],[.057,.446,.011],[.047,.443,.033],[.028,.436,.053],[.005,.423,.068]];
  const collarOuter = [[.057,.431,-.072],[.100,.418,-.053],[.109,.409,-.003],[.103,.397,.055],[.070,.367,.099],[.010,.409,.092]];
  for (const s of [-1,1]) {
    const side = points => points.map(([x,y,z]) => [s*x,y,z]);
    fabricPanel(torso,side(collarInner),side(collarOuter),m.collar);
    cord(torso,side(collarOuter),.0016,m.bluePiping);
  }
  const kerchief = [[.068,.448,-.054],[.059,.433,-.074],[.045,.410,-.094],[.024,.383,-.105],[.001,.355,-.113]];
  fabricPanel(torso,kerchief.map(([x,y,z])=>[-x,y,z]),kerchief,m.scarlet,-.001);
  for (const s of [-1,1]) {
    mesh(torso,sweep([[s*.042,.447,.026],[s*.036,.433,.064],[s*.020,.414,.087],[s*.005,.394,.099]],
      [.005,.009,.009,.006],.42),m.scarlet);
  }
  ellipsoid(torso,m.red,[.015,.015,.010],[0,.394,.101]);
  const ties = [];
  for (const s of [-1,1]) {
    const tail = joint(torso,s*.003,.389,.105);
    mesh(tail,sweep([[0,0,0],[s*.008,-.027,.006],[s*.018,-.051,.008],[s*.026,s<0?-.079:-.066,.006]],
      [.005,.011,.011,.0006],.22),s<0?m.scarlet:m.red);
    ties.push(tail);
  }
  const pocket = mesh(torso,loft([[-.024,.004,.001],[0,.023,.002],[.023,.024,.002]],20,.45),
    m.white,-.083,.318,.098);
  pocket.rotation.y = -.36;
  const crest = ellipsoid(torso,m.navy,[.012,.014,.002],[-.082,.329,.102]);
  crest.rotation.y = -.36;
  star(torso,.008,m.gold,-.083,.330,.105).rotation.y = -.36;
  return {torso,ties};
}

// A single weighted skin crosses each elbow or knee. Shoes, cuffs and sleeves
// follow their own joint while the exposed skin deforms through the bend.
function limb(parent, at, profile, bend, blend, mat) {
  const pivot = joint(parent,...at);
  const geometry = loft(profile,24);
  const indices = [], weights = [], p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const w = smoothstep(bend-blend,bend+blend,-p.getY(i));
    indices.push(0,1,0,0); weights.push(1-w,w,0,0);
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const surface = new THREE.SkinnedMesh(geometry,mat);
  const upper = new THREE.Bone(), lower = new THREE.Bone();
  lower.position.y = -bend;
  upper.add(lower); surface.add(upper);
  surface.bind(new THREE.Skeleton([upper,lower]));
  pivot.add(surface);
  return {pivot,lower};
}

function makeArm(parent,s,m) {
  const upperArm = [
    [-.464,.008,.012,.009],[-.460,.023,.021,.009],[-.449,.030,.025,.006],[-.425,.033,.024,.003],
    [-.410,.031,.024,.001],[-.392,.023,.021],[-.380,.024,.022],[-.348,.030,.025],
    [-.300,.038,.031],[-.259,.036,.032],[-.226,.033,.032,-.003],[-.193,.038,.034],
    [-.128,.043,.040],[-.077,.045,.044],[-.029,.043,.042],[.008,.026,.026],
  ];
  const arm = limb(parent,[s*.175,.395,.003],upperArm,ELBOW,.049,m.skin);
  const sleeve = [
    [-.150,.046,.047],[-.145,.053,.051],[-.144,.0533,.0515],[-.1437,.0534,.0516,1],
    [-.1400,.054,.053,1],[-.1397,.054,.053],[-.132,.054,.053],[-.1317,.0541,.053,1],
    [-.130,.0544,.053,1],[-.1297,.0544,.053],[-.126,.055,.053],[-.118,.053,.052],
    [-.082,.060,.060],[-.035,.061,.065],[.003,.059,.061],[.019,.052,.054],
    [.032,.039,.042],[.036,.018,.023],[.037,.002,.005],
  ];
  mesh(arm.pivot,rings(sleeve.length,32,(j,a) => {
    const [y,rx,rz,band] = sleeve[j];
    return [rx*Math.sin(a),y,rz*Math.cos(a),band ? m.bluePiping.color : m.white.color];
  }),m.woven);
  const thumb = ellipsoid(arm.lower,m.skin,[.013,.024,.013],[-s*.024,-.191,.016]);
  thumb.rotation.z = -s*.33;
  return arm;
}

function makeShoe(ankle,s,m) {
  const shoe = joint(ankle);
  const sole = [
    [-.080,.045,.092,.022],[-.077,.049,.096,.023],[-.067,.051,.098,.023],[-.060,.051,.098,.023],
  ];
  mesh(shoe,loft(sole,36,.80),m.sole);
  mesh(shoe,loft([[-.066,.0515,.0983,.023],[-.062,.0515,.0983,.023]],36,.80),m.welt);
  // A scooped topline exposes the sock between the vamp and the narrow strap.
  const upper = rings(11,44,(j,a) => {
    const t = j/10, c = Math.cos(a), front = Math.max(0,c);
    const rx = lerp(.051,.038,t), rz = lerp(.097,.056,t);
    const edge = -.015+.032*Math.max(0,-c)+.004*front;
    return [rx*signedPow(Math.sin(a),.85),lerp(-.061,edge,t)+.010*Math.sin(t*Math.PI),
      lerp(.023,.013,t)+rz*signedPow(c,.84)];
  });
  mesh(shoe,upper,m.leather);
  mesh(shoe,loft([[-.048,.040,.065,.026],[-.034,.040,.064,.026],[-.009,.032,.047,.010],[.004,.027,.030]],32),m.sock);
  const vamp = ellipsoid(shoe,m.leather,[.048,.022,.048],[0,-.037,.071]);
  vamp.rotation.x = .095;
  const edgeA = [[-.046,-.022,.031],[-.032,-.003,.034],[0,.004,.034],[.032,-.003,.034],[.046,-.022,.031]];
  fabricPanel(shoe,edgeA,edgeA.map(([x,y,z])=>[x,y-.002,z+.013]),m.strap);
  const buckle = mesh(shoe,new THREE.TorusGeometry(.008,.0019,5,14),m.gold,s*.043,-.011,.034);
  buckle.rotation.y = s*1.18;
  batchRigidProp(shoe);
  return shoe;
}

function makeLeg(parent,s,m) {
  const profile = [
    [-.755,.023,.031],[-.724,.027,.034],[-.676,.030,.032],[-.608,.038,.038,-.006],
    [-.541,.046,.044,-.011],[-.494,.047,.045,-.007],[-.444,.043,.043,.001],
    [-.395,.043,.045,.009],[-.358,.045,.046,.007],[-.303,.051,.051,.004],
    [-.226,.058,.059],[-.128,.064,.070],[-.032,.066,.072],[.019,.049,.052],
  ];
  const leg = limb(parent,[s*.075,HIP,0],profile,KNEE,.063,m.skin);
  mesh(leg.pivot,loft([[-.197,.062,.066],[-.187,.064,.068],[-.064,.069,.076],[.007,.070,.079]],24),m.navy);
  const sock = [
    [-.369,.029,.035],[-.339,.030,.035],[-.305,.031,.034],[-.247,.038,.039,-.006],
    [-.203,.044,.042,-.007],[-.186,.046,.045,-.008],[-.181,.047,.046,-.008],
    [-.177,.046,.044,-.008],[-.171,.046,.045,-.008],[-.166,.045,.044,-.008],
  ];
  mesh(leg.lower,loft(sock,32),m.sock);
  mesh(leg.lower,loft([[-.186,.0466,.0456,-.008],[-.182,.0476,.0465,-.008]],32),m.bluePiping);
  const shoe = makeShoe(leg.lower,s,m);
  shoe.position.y = -SHIN;
  return {...leg,shoe};
}

function makeSchoolbag(parent,m) {
  const pack = joint(parent,0,.235,-.154);
  const shell = [
    [-.164,.094,.042],[-.158,.123,.054],[-.144,.137,.063],[-.110,.141,.066],
    [.038,.143,.068],[.083,.135,.065],[.110,.120,.059],[.136,.091,.050],
    [.149,.056,.041],[.152,.012,.011],
  ];
  mesh(pack,loft(shell,44,.64),m.canvas);
  // Boxed canvas pocket with a rolled top seam and a small embroidered compass.
  const pocket = mesh(pack,new RoundedBoxGeometry(.208,.116,.046,3,.022),m.pocket,0,-.071,-.068);
  pocket.rotation.x = -.03;
  const zip = [[-.125,-.095,-.051],[-.127,.034,-.052],[-.101,.092,-.058],[-.052,.124,-.052],
    [0,.130,-.051],[.052,.124,-.052],[.101,.092,-.058],[.127,.034,-.052],[.125,-.095,-.051]];
  cord(pack,zip,.0037,m.ochre);
  for (const [x,y,z] of [[.084,.104,-.059],[.096,.096,-.057]]) {
    ellipsoid(pack,m.gold,[.005,.008,.004],[x,y,z]);
    const tab = mesh(pack,new RoundedBoxGeometry(.007,.023,.003,2,.0015),m.ochre,x+.001,y-.014,z-.004);
    tab.rotation.z = .18;
  }
  cord(pack,[[-.089,-.041,-.088],[-.054,-.035,-.092],[.048,-.035,-.092],[.090,-.042,-.088]],.0025,m.ochre);
  const pull = mesh(pack,new THREE.CapsuleGeometry(.0038,.021,3,6),m.gold,-.086,-.051,-.092);
  pull.rotation.z = -.34;
  const patch = mesh(pack,new THREE.CylinderGeometry(.024,.024,.0032,28),m.ochre,.049,-.083,-.092);
  patch.rotation.x = -Math.PI/2;
  star(pack,.017,m.badge,.049,-.083,-.094).rotation.y = Math.PI;
  cord(pack,[[-.047,.143,.005],[-.041,.175,.005],[0,.187,.003],[.041,.175,.005],[.047,.143,.005]],.008,m.ochre);
  for (const s of [-1,1]) {
    // Each canvas strap passes over the shoulder, across the blouse and back to its lower anchor.
    const center = [[s*.081,.364,-.157],[s*.110,.403,-.082],[s*.118,.425,-.044],[s*.121,.433,-.006],
      [s*.122,.424,.039],[s*.124,.407,.071],[s*.131,.365,.088],[s*.131,.280,.079],
      [s*.140,.197,.072],[s*.158,.144,.042],[s*.168,.123,.002],[s*.161,.111,-.043],
      [s*.140,.097,-.082],[s*.119,.105,-.132]];
    const path = curve(center), across = new THREE.Vector3(), surface = new THREE.Vector3();
    // Parallel edges turn around the ribcage; the strap keeps its width in profile.
    const sections = 58;
    const frames = Array.from({length:sections},(_,j)=>{
      const t=j/(sections-1), point=path.getPoint(t), tangent=path.getTangent(t);
      surface.set(point.x/.16,Math.max(0,(point.y-.34)/.08)*1.8,point.z/.085).normalize();
      across.crossVectors(tangent,surface).normalize();
      surface.crossVectors(across,tangent).normalize();
      return {point,wide:across.clone(),out:surface.clone()};
    });
    mesh(parent,rings(sections,16,(j,a)=>{
      const {point,wide,out}=frames[j], w=.0135*Math.sin(a), d=.0032*Math.cos(a);
      const yarn = Math.abs(Math.sin(a))>.91 && Math.cos(a)>.25 ? m.canvasStitch.color : m.canvas.color;
      const x=point.x+wide.x*w+out.x*d, z=point.z+wide.z*w+out.z*d;
      let y=point.y+wide.y*w+out.y*d;
      // Lay both edges over the curved shoulder, including at the sleeve head.
      if (point.y>.38) {
        for (let k=8;k<blousePattern.length-1;k++) {
          const [h,rx,rz]=blousePattern[k], [h2,rx2,rz2]=blousePattern[k+1];
          const at=(ax,az)=>Math.abs(x/ax)**(2/.91)+Math.abs(z/az)**(2/.91);
          const low=at(rx,rz), high=at(rx2,rz2);
          if (low<=1 && high>=1) y=Math.max(y,lerp(h,h2,(1-low)/(high-low))+.0045);
        }
        const sleeveRadius=((x-s*.175)/.061)**2+((z-.003)/.062)**2;
        if (sleeveRadius<1) y=Math.max(y,.400+.035*Math.sqrt(1-sleeveRadius)+.002);
      }
      return [x,y,z,yarn];
    }),m.woven);
    const adjuster = mesh(parent,new RoundedBoxGeometry(.031,.013,.007,1,.002),m.ochre,s*.134,.238,.083);
    adjuster.rotation.y = s*.47;
  }
  batchRigidProp(pack);
  return pack;
}

export function buildSchoolgirl() {
  const m = {
    skin:cloth('#f6c7aa',{roughness:.82}), blush:cloth('#df9a83'), freckle:cloth('#bb8066'), lip:cloth('#a45950',{side:THREE.DoubleSide}),
    face:cloth('#ffffff',{vertexColors:true}), hair:cloth('#56382e',{roughness:.75}),
    hairGlint:cloth('#79513c',{roughness:.76}), hairPaint:cloth('#ffffff',{vertexColors:true,roughness:.76}),
    fringe:cloth('#614030',{side:THREE.DoubleSide,roughness:.78}),
    white:cloth('#f1ede1'), collar:cloth('#fff5df',{side:THREE.DoubleSide}),
    red:cloth('#b53d38',{side:THREE.DoubleSide}), scarlet:cloth('#ce5144',{side:THREE.DoubleSide}),
    navy:cloth('#253d58'), pleats:cloth('#ffffff',{vertexColors:true,side:THREE.DoubleSide}),
    bluePiping:cloth('#516884'), button:cloth('#ece1c5'), sock:cloth('#f8f0dd'),
    leather:cloth('#754338',{roughness:.58}), strap:cloth('#744234',{side:THREE.DoubleSide,roughness:.62}),
    sole:cloth('#49423f'), welt:cloth('#bfa58b'), gold:cloth('#d8ac62',{roughness:.46,metalness:.32}),
    canvas:cloth('#356d69'), pocket:cloth('#477e77'), woven:cloth('#ffffff',{vertexColors:true,side:THREE.DoubleSide}),
    canvasStitch:cloth('#759890'), ochre:cloth('#b28a54'), badge:cloth('#faf1ca'),
  };
  const root = new THREE.Group();
  root.name = 'Coco';
  const bodyGroup = joint(root,0,HIP,0);
  const {torso,ties} = makeBlouse(bodyGroup,m);
  const skirt = makeSkirt(bodyGroup,m);
  const head = makeHead(bodyGroup,m);
  const arms = [-1,1].map(s=>makeArm(bodyGroup,s,m));
  const legs = [-1,1].map(s=>makeLeg(root,s,m));
  const pack = makeSchoolbag(torso,m);
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = !o.material.transparent;
    o.receiveShadow = !o.material.transparent;
  });
  batchRigidProp(torso,[...ties,pack]);
  batchRigidProp(head.head,[...head.eyes,...head.pigtails.map(p=>p.root)]);
  for (const p of head.pigtails) batchRigidProp(p.root);
  const shadow = blobShadow(.41,.25);
  root.add(shadow);
  return {root,bodyGroup,torso,skirt,arms,legs,ties,pack,shadow,...head};
}
