import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0d10, 0.018);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 300);
camera.position.set(36, 28, 47);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 24;
controls.maxDistance = 110;

scene.add(new THREE.HemisphereLight(0xdde8ff, 0x2a211c, 1.25));
const key = new THREE.DirectionalLight(0xffffff, 4.5);
key.position.set(25, 30, 28);
key.castShadow = true;
scene.add(key);
const rim = new THREE.DirectionalLight(0x8dbdff, 2.4);
rim.position.set(-24, 8, -20);
scene.add(rim);
const warm = new THREE.PointLight(0xffb66a, 42, 80, 2);
warm.position.set(-16, -14, 26);
scene.add(warm);

const MAT = {
  steel: new THREE.MeshPhysicalMaterial({ color: 0xbfc7ce, metalness: .95, roughness: .2, clearcoat: .35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x30353b, metalness: .9, roughness: .34 }),
  gold: new THREE.MeshPhysicalMaterial({ color: 0xc99d4e, metalness: .92, roughness: .22, clearcoat: .25 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb78938, metalness: .84, roughness: .3 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xac6742, metalness: .78, roughness: .34 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x356a96, metalness: .8, roughness: .28 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: 0xa4133a, roughness: .15, clearcoat: .8 }),
  dial: new THREE.MeshStandardMaterial({ color: 0x15181c, metalness: .15, roughness: .48 }),
  lume: new THREE.MeshStandardMaterial({ color: 0xe3ead7, emissive: 0x728064, emissiveIntensity: .16, roughness: .55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xe7f5ff, roughness: .04, transmission: .95, transparent: true, opacity: .4, thickness: .8, ior: 1.45 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x2b1c14, roughness: .8 })
};

const watch = new THREE.Group();
watch.rotation.x = -.09;
scene.add(watch);

const layers = new Map();
const parts = [];
const pickables = [];
function layer(name){
  if(!layers.has(name)){ const g = new THREE.Group(); g.userData.layer = name; layers.set(name,g); watch.add(g); }
  return layers.get(name);
}
function cyl(r,h,mat,segments=96){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat); m.rotation.x=Math.PI/2; m.castShadow=true; m.receiveShadow=true; return m; }
function disc(r,h,mat,z=0){ const m=cyl(r,h,mat); m.position.z=z; return m; }
function ring(r,tube,mat){ const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,14,120),mat); m.castShadow=true; return m; }
function register(obj, meta){
  obj.userData.meta = meta;
  obj.userData.base = obj.position.clone();
  obj.userData.explode = meta.explode || 0;
  obj.userData.dir = (meta.dir || new THREE.Vector3(0,0,1)).clone().normalize();
  obj.traverse(c=>{ if(c.isMesh){ c.userData.pickRoot=obj; pickables.push(c); } });
  layer(meta.layer || 'movement').add(obj);
  parts.push(obj);
  return obj;
}
function gear(radius, teeth, mat=MAT.brass, thickness=.55){
  const g=new THREE.Group();
  g.add(ring(radius-.45,.27,mat));
  g.add(disc(.55,thickness,MAT.steel));
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2;
    const s=new THREE.Mesh(new THREE.BoxGeometry(.32,radius-1.05,thickness*.8),mat);
    s.position.set(Math.cos(a)*(radius/2),Math.sin(a)*(radius/2),0); s.rotation.z=a-Math.PI/2; g.add(s);
  }
  for(let i=0;i<teeth;i++){
    const a=i/teeth*Math.PI*2;
    const t=new THREE.Mesh(new THREE.BoxGeometry(.22,.56,thickness*.85),mat);
    t.position.set(Math.cos(a)*(radius+.1),Math.sin(a)*(radius+.1),0); t.rotation.z=a-Math.PI/2; g.add(t);
  }
  return g;
}
function screw(x,y,z=0){
  const g=new THREE.Group();
  const h=disc(.2,.15,MAT.blue); h.position.z=z; g.add(h);
  const slot=new THREE.Mesh(new THREE.BoxGeometry(.28,.04,.05),MAT.dark); slot.position.z=z+.11; g.add(slot);
  g.position.set(x,y,0); return g;
}
function coil(radius=2.2,turns=6,mat=MAT.blue){
  const pts=[]; for(let i=0;i<=180;i++){ const t=i/180,a=t*Math.PI*2*turns,r=radius*(1-.82*t); pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),280,.055,6,false),mat);
}

// straps
const straps=new THREE.Group();
for(const sy of [-1,1]){ const s=new THREE.Mesh(new THREE.BoxGeometry(10.3,19,2.2),MAT.leather); s.position.set(0,sy*24.5,-2.3); s.castShadow=true; straps.add(s); }
register(straps,{name:'Leather strap',category:'Wearability',text:'The strap turns the movement into a wrist-borne instrument.',layer:'case',explode:2.5,dir:new THREE.Vector3(0,1,-.1)});

// case and crown
const shell=new THREE.Group(); shell.add(ring(14.1,1.18,MAT.steel)); shell.add(ring(12.9,.42,MAT.dark));
for(const sy of [-1,1]) for(const sx of [-1,1]){ const lug=new THREE.Mesh(new THREE.BoxGeometry(4.2,7,2.8),MAT.steel); lug.position.set(sx*9.8,sy*14.1,-1.2); lug.rotation.z=sx*sy*.1; shell.add(lug); }
const crown=new THREE.Mesh(new THREE.CylinderGeometry(2,2,2.8,32),MAT.steel); crown.rotation.z=Math.PI/2; crown.position.set(16.7,0,-.4); shell.add(crown);
register(shell,{name:'Case, lugs & crown',category:'Protective architecture',text:'The case protects and locates the movement. The crown winds the mainspring and sets the hands.',layer:'case',explode:2,dir:new THREE.Vector3(0,0,-1)});

const crystal=new THREE.Group(); crystal.add(disc(12.8,.72,MAT.glass)); crystal.add(ring(12.2,.24,MAT.glass));
register(crystal,{name:'Crystal',category:'Display / Protection',text:'A transparent cover protects the dial and hands.',layer:'display',explode:18});
const bezel=new THREE.Group(); bezel.add(ring(13.5,.72,MAT.steel)); bezel.add(ring(12.6,.24,MAT.dark));
register(bezel,{name:'Bezel',category:'Case / Display',text:'The bezel frames and retains the crystal.',layer:'case',explode:14.5});

// dial
const dial=new THREE.Group(); dial.add(disc(12.25,.4,MAT.dial));
for(let i=0;i<60;i++){
  const a=i/60*Math.PI*2, major=i%5===0;
  const tick=new THREE.Mesh(new THREE.BoxGeometry(major?.24:.1,major?1.35:.62,.1),major?MAT.lume:MAT.steel);
  tick.position.set(Math.sin(a)*(major?10.1:10.65),Math.cos(a)*(major?10.1:10.65),.32); tick.rotation.z=-a; dial.add(tick);
}
for(let i=0;i<12;i++){
  const a=i/12*Math.PI*2; const m=new THREE.Mesh(new THREE.BoxGeometry(.72,1.8,.2),MAT.steel);
  m.position.set(Math.sin(a)*8.7,Math.cos(a)*8.7,.42); m.rotation.z=-a; dial.add(m);
}
register(dial,{name:'Dial & indices',category:'Time display',text:'The dial turns hand angles into readable hours and minutes.',layer:'display',explode:10.5});

const hands=new THREE.Group();
function hand(len,w,mat,rot,z){ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(w,len,.12),mat); b.position.y=len*.36; g.add(b); g.add(disc(w*.8,.13,mat)); g.rotation.z=rot; g.position.z=z; return g; }
const hourHand=hand(6,.5,MAT.steel,-.7,.1), minuteHand=hand(8.6,.34,MAT.steel,1.15,.28), secondHand=hand(9.2,.11,MAT.blue,2.2,.48);
hands.add(hourHand,minuteHand,secondHand);
register(hands,{name:'Hands',category:'Time display',text:'The hands are the visible output of the wheel train.',layer:'display',explode:13});

const plate=new THREE.Group(); plate.add(disc(10.85,.86,new THREE.MeshStandardMaterial({color:0x8e9290,metalness:.78,roughness:.42})));
for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+.2; plate.add(screw(Math.cos(a)*8.7,Math.sin(a)*8.7,.5)); }
register(plate,{name:'Mainplate',category:'Movement architecture',text:'The mainplate is the structural reference for pivots, gears, bridges and winding works.',layer:'movement',explode:3.8});

const barrel=new THREE.Group(); barrel.add(disc(3.8,1.2,MAT.copper)); barrel.add(ring(3.05,.2,MAT.gold)); const mainspring=coil(2.55,7); mainspring.position.z=.72; barrel.add(mainspring); barrel.position.set(-4.2,2.8,0);
register(barrel,{name:'Mainspring barrel',category:'Power storage',text:'The wound mainspring stores energy and releases it gradually into the wheel train.',layer:'power',explode:7,dir:new THREE.Vector3(-.2,.1,1)});
const ratchet=gear(3.15,42,MAT.steel,.5); ratchet.position.set(-4.2,2.8,.8);
register(ratchet,{name:'Ratchet wheel',category:'Winding system',text:'The ratchet transmits crown torque to the spring arbor and prevents reverse unwinding.',layer:'power',explode:8,dir:new THREE.Vector3(-.3,.1,1)});

const train=new THREE.Group();
const center=gear(3.15,60,MAT.brass); center.position.set(-.5,.2,.15); train.add(center);
const third=gear(2.45,48,MAT.gold); third.position.set(3.8,1.1,.2); train.add(third);
const fourth=gear(2.05,42,MAT.brass); fourth.position.set(5.3,-2.9,.28); train.add(fourth);
const escape=gear(1.55,15,MAT.gold,.42); escape.position.set(1.9,-5,.34); train.add(escape);
register(train,{name:'Wheel train',category:'Transmission',text:'A sequence of gears carries power toward the escapement while creating the ratios for seconds, minutes and hours.',layer:'movement',explode:8.6,dir:new THREE.Vector3(.1,-.05,1)});

const jewels=new THREE.Group(); [[-2.7,2.1],[1.1,1.1],[4.2,-1.5],[-4.2,-2.4],[5.7,3.2],[-.8,-5.4]].forEach(([x,y])=>{ const j=disc(.34,.22,MAT.ruby); j.position.set(x,y,.62); jewels.add(j); });
register(jewels,{name:'Jewel bearings',category:'Friction control',text:'Synthetic jewels provide hard, low-friction bearings for tiny steel pivots.',layer:'movement',explode:4.7});

const pallet=new THREE.Group();
const fork=new THREE.Mesh(new THREE.BoxGeometry(.52,3.3,.3),MAT.steel); pallet.add(fork);
for(const x of [-.48,.48]){ const stone=new THREE.Mesh(new THREE.BoxGeometry(.34,.68,.26),MAT.ruby); stone.position.set(x,1.4,.05); pallet.add(stone); }
pallet.position.set(-.15,-6.15,.35); pallet.rotation.z=-.15;
register(pallet,{name:'Pallet fork',category:'Escapement',text:'The pallet fork alternately locks and releases the escape wheel, turning continuous spring torque into discrete impulses.',layer:'regulation',explode:10.8,dir:new THREE.Vector3(-.1,-.18,1)});

const balance=new THREE.Group(); balance.add(ring(3.1,.23,MAT.gold)); balance.add(disc(.48,.42,MAT.steel));
for(let i=0;i<3;i++){ const a=i/3*Math.PI*2; const s=new THREE.Mesh(new THREE.BoxGeometry(.27,2.55,.23),MAT.gold); s.position.set(Math.cos(a)*1.3,Math.sin(a)*1.3,0); s.rotation.z=a-Math.PI/2; balance.add(s); }
const hair=coil(2.1,5.5); hair.position.z=.26; balance.add(hair); balance.position.set(-5,-4.6,.65);
register(balance,{name:'Balance wheel & hairspring',category:'Regulation',text:'The balance and hairspring form the oscillator that divides time into nearly equal intervals.',layer:'regulation',explode:12.2,dir:new THREE.Vector3(-.2,-.1,1)});

const bridges=new THREE.Group();
for(const cfg of [[1.8,3,.15,7.2,2.3,-.35],[3.7,-3.6,.25,5.2,1.8,.45]]){
  const [x,y,z,w,h,r]=cfg; const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,.55),MAT.steel); b.position.set(x,y,z); b.rotation.z=r; b.geometry.translate(0,0,0); bridges.add(b);
}
bridges.add(screw(5,2.6,.45),screw(1.3,4.2,.45),screw(4.6,-4.8,.45),screw(1.3,-3.8,.45));
register(bridges,{name:'Train bridges',category:'Movement architecture',text:'Bridges support the upper ends of wheel pivots and keep the gear train rigidly aligned.',layer:'movement',explode:13.2,dir:new THREE.Vector3(.1,.1,-1)});

const rotor=new THREE.Group();
const shape=new THREE.Shape(); shape.absarc(0,0,8.4,-Math.PI*.92,-Math.PI*.08,false); shape.lineTo(0,0); shape.closePath();
const rg=new THREE.ExtrudeGeometry(shape,{depth:.55,bevelEnabled:true,bevelSegments:2,bevelSize:.1,bevelThickness:.08}); rg.center(); const rm=new THREE.Mesh(rg,MAT.gold); rm.position.y=-1; rotor.add(rm,disc(1,.7,MAT.steel));
register(rotor,{name:'Automatic winding rotor',category:'Optional winding module',text:'An eccentric rotor can harvest wrist motion to wind the mainspring automatically.',layer:'power',explode:15,dir:new THREE.Vector3(0,0,-1)});

const back=new THREE.Group(); back.add(disc(12.9,1.05,MAT.steel)); back.add(ring(11.4,.36,MAT.dark)); const bg=disc(9.8,.34,MAT.glass); bg.position.z=-.35; back.add(bg);
register(back,{name:'Exhibition caseback',category:'Case / Protection',text:'The caseback closes the watch while a transparent window exposes the movement.',layer:'case',explode:20,dir:new THREE.Vector3(0,0,-1)});

const slider=document.querySelector('#explode');
const out=document.querySelector('#explodeValue');
let target=.18,current=.18;
function setExplosion(v){ target=THREE.MathUtils.clamp(v,0,1); slider.value=Math.round(target*100); out.value=`${Math.round(target*100)}%`; }
slider.addEventListener('input',()=>setExplosion(+slider.value/100));
document.querySelector('#explodeBtn').onclick=()=>setExplosion(1);
document.querySelector('#assembleBtn').onclick=()=>setExplosion(0);
const cam0=camera.position.clone();
document.querySelector('#resetBtn').onclick=()=>{ camera.position.copy(cam0); controls.target.set(0,0,0); controls.update(); };
document.querySelectorAll('[data-layer]').forEach(cb=>cb.addEventListener('change',()=>{ const g=layers.get(cb.dataset.layer); if(g)g.visible=cb.checked; }));

const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
let highlighted=null;
function clearHighlight(){ if(!highlighted)return; highlighted.traverse(c=>{ if(c.isMesh&&c.userData.oldEm!==undefined){ c.material.emissive.setHex(c.userData.oldEm); c.material.emissiveIntensity=c.userData.oldEi; delete c.userData.oldEm; delete c.userData.oldEi; } }); highlighted=null; }
function highlight(root){ clearHighlight(); highlighted=root; root.traverse(c=>{ if(!c.isMesh||!c.material?.emissive)return; c.material=c.material.clone(); c.userData.oldEm=c.material.emissive.getHex(); c.userData.oldEi=c.material.emissiveIntensity; c.material.emissive.setHex(0x6d5425); c.material.emissiveIntensity=.45; }); }
renderer.domElement.addEventListener('pointerdown',e=>{
  mouse.x=e.clientX/innerWidth*2-1; mouse.y=-(e.clientY/innerHeight)*2+1; ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObjects(pickables,false)[0]; if(!hit)return; const root=hit.object.userData.pickRoot, m=root?.userData.meta; if(!m)return;
  document.querySelector('#infoCategory').textContent=m.category.toUpperCase();
  document.querySelector('#infoName').textContent=m.name;
  document.querySelector('#infoText').textContent=m.text;
  highlight(root);
});

const ground=new THREE.Mesh(new THREE.CircleGeometry(48,96),new THREE.MeshStandardMaterial({color:0x0d1014,roughness:.95,transparent:true,opacity:.7})); ground.rotation.x=-Math.PI/2; ground.position.y=-20; scene.add(ground);

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  current=THREE.MathUtils.damp(current,target,6.5,dt);
  for(const p of parts) p.position.copy(p.userData.base).addScaledVector(p.userData.dir,p.userData.explode*current);
  center.rotation.z-=dt*.24; third.rotation.z+=dt*.42; fourth.rotation.z-=dt*.7; escape.rotation.z+=dt*1.8; ratchet.rotation.z-=dt*.05;
  const swing=Math.sin(t*Math.PI*5)*.36; balance.rotation.z=swing; pallet.rotation.z=-.15-swing*.18; rotor.rotation.z=Math.sin(t*.55)*.42;
  secondHand.rotation.z-=dt*.105; minuteHand.rotation.z-=dt*.00175; hourHand.rotation.z-=dt*.000146;
  controls.update(); renderer.render(scene,camera);
}
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
setExplosion(.18);
document.querySelector('#loading').style.opacity='0'; setTimeout(()=>document.querySelector('#loading')?.remove(),400);
animate();
