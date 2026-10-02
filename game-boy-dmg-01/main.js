import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDMGReferenceModel } from './reference-model.js';
import { createDMGSystem } from './system.js';
import { COMPONENTS, CANONICAL } from './spec.js';

const params=new URLSearchParams(location.search);
const testMode=params.get('test')==='1';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(testMode?1:Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=!testMode;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x080b0a);
// Product mode keeps atmospheric depth. Deterministic QA renders disable fog so rear/internal
// layers cannot disappear merely because they are farther from the inspection camera.
scene.fog=testMode?null:new THREE.Fog(0x080b0a,350,1200);

const camera=new THREE.PerspectiveCamera(34,1,.1,1200);
camera.position.set(190,105,245);
const qaCamera=new THREE.OrthographicCamera(-100,100,100,-100,.1,2000);
let activeRenderCamera=camera;
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.target.set(0,0,0); controls.minDistance=120; controls.maxDistance=950;

const hemi=new THREE.HemisphereLight(0xdce6d5,0x172018,1.5);scene.add(hemi);
const ambientBase=testMode?.45:.35;
const ambient=new THREE.AmbientLight(0xffffff,ambientBase);scene.add(ambient);
const key=new THREE.DirectionalLight(0xffffff,3.0); key.position.set(150,220,180); key.castShadow=!testMode; scene.add(key); scene.add(key.target);
const rim=new THREE.DirectionalLight(0xa6cbe0,testMode?2.1:1.2); rim.position.set(-160,80,-180); scene.add(rim); scene.add(rim.target);
const qaFill=new THREE.DirectionalLight(0xffffff,testMode?.45:0); qaFill.position.set(0,-120,160); scene.add(qaFill); scene.add(qaFill.target);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x0b0d0b,roughness:.95}));
floor.rotation.x=-Math.PI/2; floor.position.y=-88; floor.receiveShadow=!testMode; scene.add(floor);

const loadingEl=document.querySelector('#loading');
let model;
try{
 model=await createDMGReferenceModel();
}catch(error){
 console.error('DMG model load failed',error);
 if(loadingEl){
  loadingEl.textContent='Model load failed. Reload to retry. '+(error?.message||String(error));
  loadingEl.classList.add('load-error');
  loadingEl.addEventListener('click',()=>location.reload(),{once:true});
  loadingEl.title='Click to reload';
 }
 throw error;
}
model.root.rotation.x=-.02;
scene.add(model.root);
const system=createDMGSystem();

const ui={
 powerBtn:document.querySelector('#powerBtn'),cartridgeBtn:document.querySelector('#cartridgeBtn'),explodeBtn:document.querySelector('#explodeBtn'),resetBtn:document.querySelector('#resetBtn'),
 explodeRange:document.querySelector('#explodeRange'),explodeValue:document.querySelector('#explodeValue'),
 powerState:document.querySelector('#powerState'),cartridgeState:document.querySelector('#cartridgeState'),joypState:document.querySelector('#joypState'),ppuState:document.querySelector('#ppuState'),accessState:document.querySelector('#accessState'),dmaState:document.querySelector('#dmaState'),audioState:document.querySelector('#audioState'),actionState:document.querySelector('#actionState'),
 joypSelect:document.querySelector('#joypSelect'),mapperSelect:document.querySelector('#mapperSelect'),mapperWriteBtn:document.querySelector('#mapperWriteBtn'),dmaBtn:document.querySelector('#dmaBtn'),ppuDot:document.querySelector('#ppuDot'),ppuDotValue:document.querySelector('#ppuDotValue'),
 nr50:document.querySelector('#nr50'),nr50Value:document.querySelector('#nr50Value'),physicalVolume:document.querySelector('#physicalVolume'),physicalVolumeValue:document.querySelector('#physicalVolumeValue'),
 serviceScenario:document.querySelector('#serviceScenario'),serviceTestBtn:document.querySelector('#serviceTestBtn'),burnInBtn:document.querySelector('#burnInBtn'),serviceText:document.querySelector('#serviceText'),
 partCategory:document.querySelector('#partCategory'),partProvenance:document.querySelector('#partProvenance'),partName:document.querySelector('#partName'),partDescription:document.querySelector('#partDescription'),loading:loadingEl
};

const viewButtons=[...document.querySelectorAll('[data-view]')];
const layerButtons=[...document.querySelectorAll('[data-layer]')];
let activeView='product';
let activeLayer='physical';
let explosion=0;
let autoRun=true;
let lastTime=performance.now();
let audioCtx=null;

const presets={
 product:[[205,115,290],[0,0,0]],
 exploded:[[470,250,700],[0,0,-30]],
 power:[[300,135,375],[-12,-18,0]],
 'cpu-memory':[[300,125,360],[5,10,-4]],
 cartridge:[[300,160,-375],[0,28,-5]],
 input:[[275,125,340],[-8,-24,8]],
 'ppu-lcd':[[280,145,345],[0,34,8]],
 'apu-audio':[[300,125,365],[20,-40,-2]],
 service:[[315,155,390],[5,-5,0]]
};

const viewExplosion={
 product:0,
 exploded:1,
 power:.28,
 'cpu-memory':.24,
 cartridge:.30,
 input:.12,
 'ppu-lcd':.18,
 'apu-audio':.24,
 service:.20
};

function inspect(data){
 ui.partCategory.textContent=(data.category||'component').toUpperCase();
 ui.partProvenance.textContent=data.provenance||'provenance';
 ui.partName.textContent=data.name||'Component';
 ui.partDescription.textContent=data.description||'';
}

function setView(name){
 activeView=name;
 viewButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===name));
 setExplosion(viewExplosion[name] ?? explosion);
 const p=presets[name]||presets.product;
 camera.position.set(...p[0]); controls.target.set(...p[1]); controls.update();

 const messages={
  product:['product','hybrid reference-grounded P4 reconstruction','Game Boy DMG-01','The full assembly/internals come from a pinned CAD reconstruction; the visible front enclosure is replaced by an independently authored printable-replica shell registered to the same envelope.'],
  exploded:['physical assembly','hybrid exterior reference + board-revision-aware assembly reconstruction','Exploded product stack','The higher-fidelity front enclosure remains a distinct exploded part while the rear shell, front LCD/control board, mainboard, converter, jack board, batteries, speaker, and cartridge retain the assembly source hierarchy.'],
  power:['power architecture','board reverse engineering + Engineering integration','Power and reset','Four AA cells or external DC feed source selection, the DPDT power/reset switch, VCC, the converter, then VDD and VEE.'],
  'cpu-memory':['logical + electrical','community behavior + board/die reverse engineering','CPU, buses, memory, and ownership','DMG-CPU is the physical SoC; SM83 is its CPU core. CPU-visible addresses map onto different physical buses, memories, and register owners.'],
  cartridge:['removable module','interface source-grounded / module presentation','Cartridge hardware/software boundary','The cartridge is a removable electrical and logical module. Mapper state translates CPU windows into cartridge-local storage or peripherals.'],
  input:['human input','board + behavioral reference','Button → matrix → JOYP','Press a face control and watch physical state become active-low matrix state and software-visible JOYP state.'],
  'ppu-lcd':['display pipeline','behavioral + die/board reverse engineering','PPU → LCD','Scanline timing, access restrictions, fetch/FIFO state, palette output, board signals, and the physical LCD belong to one causal display path.'],
  'apu-audio':['audio pipeline','behavioral + board/die reverse engineering','APU → analog path → sound','Four digital generators cross DAC, mixer, filter, physical volume/amplifier, then speaker/headphone transduction.'],
  service:['diagnostic graph','OEM service + community repair kept distinct','Failure reveals architecture','A symptom branches into hypotheses, tests, observations, interventions, and verification rather than directly naming one failed part.']
 };
 const m=messages[name]; inspect({category:m[0],provenance:m[1],name:m[2],description:m[3]});
}

function setLayer(layer){
 activeLayer=layer; model.setLayer(layer);
 layerButtons.forEach(b=>b.classList.toggle('active',b.dataset.layer===layer));
}

function setExplosion(value){
 explosion=Math.max(0,Math.min(1,value));
 model.setExplosion(explosion);
 // Keep the closed product contrasty, but lift deep internal layers as the stack separates.
 hemi.intensity=1.5+(testMode?1.15:.8)*explosion;
 ambient.intensity=ambientBase+(testMode?1.15:.55)*explosion;
 if(testMode)qaFill.intensity=.45+1.45*explosion;
 ui.explodeBtn.textContent=explosion>.5?'Assemble':'Explode';
 if(ui.explodeRange)ui.explodeRange.value=String(Math.round(explosion*100));
 if(ui.explodeValue)ui.explodeValue.textContent=Math.round(explosion*100)+'%';
}

function updateUi(){
 const s=system.state;
 ui.powerState.textContent=s.running?'RUNNING':'OFF / RESET';
 ui.powerBtn.textContent=s.power?'Power off':'Power on';
 ui.cartridgeState.textContent=s.cartridge.present?s.cartridge.mapper.toUpperCase():'EJECTED';
 ui.cartridgeBtn.textContent=s.cartridge.present?'Eject cartridge':'Insert cartridge';
 ui.mapperSelect.disabled=!s.cartridge.present;
 ui.joypState.textContent=s.joypad.lowNibble.toString(2).padStart(4,'0')+' · '+s.joypad.selectedGroup;
 ui.ppuState.textContent='LY '+s.ppu.ly+' · DOT '+s.ppu.dot+' · MODE '+s.ppu.mode;
 ui.accessState.textContent=s.dma.active?'HRAM ONLY':('VRAM '+(s.ppu.vramCpuAccess?'✓':'×')+' · OAM '+(s.ppu.oamCpuAccess?'✓':'×'));
 ui.dmaState.textContent=s.dma.active?(s.dma.bytesMoved+' / 160'):'IDLE · '+s.dma.completionCount+' done';
 ui.audioState.textContent=s.apu.channels.CH1.active?'CH1 ACTIVE':(s.apu.output==='speaker'?'SPEAKER MONO':'HEADPHONES L/R');
 ui.actionState.textContent=s.demo.lastAction;
 ui.ppuDotValue.textContent=String(s.ppu.dot);
 ui.nr50Value.textContent=Math.round(s.apu.nr50*100)+'%';
 ui.physicalVolumeValue.textContent=Math.round(s.apu.physicalVolume*100)+'%';
 model.updateScreen(s);
 model.setCartridgePresent(s.cartridge.present);
}

function chirp(){
 try{
  if(!audioCtx) audioCtx=new AudioContext();
  const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
  const s=system.state.apu; const level=s.nr50*s.physicalVolume*.07;
  osc.type='square'; osc.frequency.value=440;
  gain.gain.setValueAtTime(level,audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.12);
  osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime+.13);
 }catch{}
}

for(const button of document.querySelectorAll('[data-button]')){
 const name=button.dataset.button;
 const key=name==='A'?'buttonA':name==='B'?'buttonB':name==='Start'?'Start':name==='Select'?'Select':name==='Up'||name==='Down'||name==='Left'||name==='Right'?'dpad':null;
 const down=ev=>{ev.preventDefault();system.pressButton(name,true);if(key)model.setButtonPressed(key,true);if(name==='A')chirp();updateUi();};
 const up=ev=>{ev.preventDefault();system.pressButton(name,false);if(key)model.setButtonPressed(key,false);updateUi();};
 button.addEventListener('pointerdown',down); button.addEventListener('pointerup',up); button.addEventListener('pointerleave',up);
}

ui.powerBtn.addEventListener('click',()=>{system.setPower(!system.state.power);updateUi();});
ui.cartridgeBtn.addEventListener('click',()=>{system.setCartridgePresent(!system.state.cartridge.present);updateUi();});
ui.explodeBtn.addEventListener('click',()=>{
 const target=explosion>.5?0:1;
 if(target===1)setView('exploded');else setView('product');
});
ui.explodeRange?.addEventListener('input',()=>{
 const value=Number(ui.explodeRange.value)/100;
 setExplosion(value);
 // Slider is a dissection control, not a camera preset: keep the user's current viewpoint.
});
ui.resetBtn.addEventListener('click',()=>{system.reset();setExplosion(0);setLayer('physical');setView('product');ui.mapperSelect.value='no-mbc';ui.joypSelect.value='action';updateUi();});
ui.joypSelect.addEventListener('change',()=>{system.selectJoyp(ui.joypSelect.value);updateUi();});
ui.mapperSelect.addEventListener('change',()=>{system.setMapper(ui.mapperSelect.value);updateUi();});
ui.mapperWriteBtn.addEventListener('click',()=>{system.writeMapper(0x2000,(system.state.cartridge.romBank+1)&0xff);updateUi();});
ui.dmaBtn.addEventListener('click',()=>{system.startDma(0xc0);setView('cpu-memory');setLayer('temporal');updateUi();});
ui.ppuDot.addEventListener('input',()=>{autoRun=false;system.setPpuPosition(system.state.ppu.ly,Number(ui.ppuDot.value));updateUi();});
ui.ppuDot.addEventListener('change',()=>{autoRun=true;});
ui.nr50.addEventListener('input',()=>{system.state.apu.nr50=Number(ui.nr50.value)/100;updateUi();});
ui.physicalVolume.addEventListener('input',()=>{system.state.apu.physicalVolume=Number(ui.physicalVolume.value)/100;updateUi();});
viewButtons.forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
layerButtons.forEach(b=>b.addEventListener('click',()=>setLayer(b.dataset.layer)));

ui.serviceScenario.addEventListener('change',()=>{
 system.setServiceScenario(ui.serviceScenario.value);
 setView('service');setLayer('service');updateService();
});
function updateService(){
 const s=system.state.service;
 ui.serviceText.textContent=s.scenario==='none'?'Choose a symptom to expose candidate fault domains. OEM service and modern restoration remain separate provenance classes.':
   'Hypotheses: '+(s.hypotheses.join(' · ')||'none')+(s.observations.length?' | Observations: '+s.observations.join(' · '):'');
}
ui.serviceTestBtn.addEventListener('click',()=>{
 const s=system.state.service.scenario;
 const test=s==='no-power'?'rails':s==='cartridge-boot'?'known-good-cartridge':s==='speaker-silent'?'headphones':'inspection';
 system.runServiceTest(test);updateService();updateUi();
});
ui.burnInBtn.addEventListener('click',()=>{
 system.state.service.observations.push('OEM verification concept: ≥8 h burn-in + functional/final test');
 system.state.service.resolved=true;updateService();
});

const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
canvas.addEventListener('pointerdown',event=>{
 const rect=canvas.getBoundingClientRect();
 pointer.x=((event.clientX-rect.left)/rect.width)*2-1; pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
 raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects(model.pickables,false)[0];
 if(hit?.object?.userData?.component) inspect(hit.object.userData.component);
});

function setQaCamera(position,target=[0,0,0],up=[0,1,0],orthoHeight=200){
 if(testMode){
  const aspect=Math.max(.01,canvas.clientWidth/Math.max(1,canvas.clientHeight));
  const halfH=orthoHeight/2,halfW=halfH*aspect;
  qaCamera.left=-halfW;qaCamera.right=halfW;qaCamera.top=halfH;qaCamera.bottom=-halfH;
  qaCamera.up.set(...up);qaCamera.position.set(...position);qaCamera.lookAt(...target);
  qaCamera.updateProjectionMatrix();
  const eye=new THREE.Vector3(...position),look=new THREE.Vector3(...target),upv=new THREE.Vector3(...up).normalize();
  const view=eye.clone().sub(look).normalize();
  const right=new THREE.Vector3().crossVectors(view,upv).normalize();

  // Camera-relative three-point QA lighting: key exposes the dominant surface relief, rim separates
  // edges, and fill keeps deep exploded layers readable without changing production presentation.
  key.position.copy(eye).addScaledVector(right,110).addScaledVector(upv,95);
  key.target.position.copy(look); key.target.updateMatrixWorld();
  rim.position.copy(eye).addScaledVector(right,-115).addScaledVector(upv,55);
  rim.target.position.copy(look); rim.target.updateMatrixWorld();
  qaFill.position.copy(look).addScaledVector(view,-180).addScaledVector(upv,-70);
  qaFill.target.position.copy(look); qaFill.target.updateMatrixWorld();

  activeRenderCamera=qaCamera;
  floor.visible=false;
  return;
 }
 camera.up.set(...up);
 camera.position.set(...position);
 controls.target.set(...target);
 camera.lookAt(...target);
 controls.update();
 activeRenderCamera=camera;
}

function setProductionShadowQa(){
 if(!testMode)return;
 activeRenderCamera=camera;
 floor.visible=true;
 floor.receiveShadow=true;
 renderer.shadowMap.enabled=true;
 key.castShadow=true;
 scene.fog=new THREE.Fog(0x080b0a,350,1200);
 hemi.intensity=1.5;
 ambient.intensity=.35;
 qaFill.intensity=0;
 rim.intensity=1.2;
 setView('product');
 renderer.shadowMap.needsUpdate=true;
}

function resize(){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 if(testMode&&activeRenderCamera===qaCamera){
  const aspect=Math.max(.01,w/Math.max(1,h)),halfH=(qaCamera.top-qaCamera.bottom)/2,halfW=halfH*aspect;
  qaCamera.left=-halfW;qaCamera.right=halfW;qaCamera.updateProjectionMatrix();
 }
}
window.addEventListener('resize',resize);resize();

function debugState(){
 return {
  ...system.snapshot(),
  activeView,activeLayer,explosion,
  geometry:model.geometryDiagnostics(),
  canonical:CANONICAL
 };
}
window.__dmgDebug={
 get state(){return debugState();},
 setView,setLayer,setExplosion,
 setPower:system.setPower,
 pressButton:system.pressButton,
 selectJoyp:system.selectJoyp,
 setCartridgePresent:system.setCartridgePresent,
 setMapper:system.setMapper,
 writeMapper:system.writeMapper,
 resolveCartridgeAddress:system.resolveCartridgeAddress,
 setPpuPosition:system.setPpuPosition,
 startDma:system.startDma,
 advanceDots:system.advanceDots,
 setServiceScenario:system.setServiceScenario,
 runServiceTest:system.runServiceTest,
 setQaCamera,
 setProductionShadowQa,
 updateUi
};

if(params.get('view')) setView(params.get('view'));
else setView('product');
if(params.get('layer')) setLayer(params.get('layer'));
updateUi();
ui.loading.style.opacity='0';setTimeout(()=>ui.loading.remove(),350);

function animate(now){
 const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
 if(autoRun&&system.state.running) system.advanceDots(Math.max(1,Math.floor(dt*900)));
 controls.update();updateUi();renderer.render(scene,activeRenderCamera);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
