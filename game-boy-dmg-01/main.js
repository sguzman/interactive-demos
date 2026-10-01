import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createDMGModel } from './model.js';
import { createDMGSystem } from './system.js';
import { COMPONENTS, CANONICAL } from './spec.js';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x080b0a);
scene.fog=new THREE.Fog(0x080b0a,280,700);

const camera=new THREE.PerspectiveCamera(34,1,.1,1200);
camera.position.set(190,105,245);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.target.set(0,0,0); controls.minDistance=120; controls.maxDistance=500;

scene.add(new THREE.HemisphereLight(0xdce6d5,0x172018,1.5));
const key=new THREE.DirectionalLight(0xffffff,3.0); key.position.set(150,220,180); key.castShadow=true; scene.add(key);
const rim=new THREE.DirectionalLight(0xa6cbe0,1.2); rim.position.set(-160,80,-180); scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x0b0d0b,roughness:.95}));
floor.rotation.x=-Math.PI/2; floor.position.y=-88; floor.receiveShadow=true; scene.add(floor);

const model=createDMGModel();
model.root.rotation.x=-.02;
scene.add(model.root);
const system=createDMGSystem();

const ui={
 powerBtn:document.querySelector('#powerBtn'),cartridgeBtn:document.querySelector('#cartridgeBtn'),explodeBtn:document.querySelector('#explodeBtn'),resetBtn:document.querySelector('#resetBtn'),
 powerState:document.querySelector('#powerState'),cartridgeState:document.querySelector('#cartridgeState'),joypState:document.querySelector('#joypState'),ppuState:document.querySelector('#ppuState'),accessState:document.querySelector('#accessState'),dmaState:document.querySelector('#dmaState'),audioState:document.querySelector('#audioState'),actionState:document.querySelector('#actionState'),
 joypSelect:document.querySelector('#joypSelect'),mapperSelect:document.querySelector('#mapperSelect'),mapperWriteBtn:document.querySelector('#mapperWriteBtn'),dmaBtn:document.querySelector('#dmaBtn'),ppuDot:document.querySelector('#ppuDot'),ppuDotValue:document.querySelector('#ppuDotValue'),
 nr50:document.querySelector('#nr50'),nr50Value:document.querySelector('#nr50Value'),physicalVolume:document.querySelector('#physicalVolume'),physicalVolumeValue:document.querySelector('#physicalVolumeValue'),
 serviceScenario:document.querySelector('#serviceScenario'),serviceTestBtn:document.querySelector('#serviceTestBtn'),burnInBtn:document.querySelector('#burnInBtn'),serviceText:document.querySelector('#serviceText'),
 partCategory:document.querySelector('#partCategory'),partProvenance:document.querySelector('#partProvenance'),partName:document.querySelector('#partName'),partDescription:document.querySelector('#partDescription'),loading:document.querySelector('#loading')
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
 exploded:[[320,175,405],[5,0,0]],
 power:[[285,135,350],[-10,-15,0]],
 'cpu-memory':[[285,120,335],[10,-3,-3]],
 cartridge:[[285,145,-340],[20,20,-25]],
 input:[[270,125,335],[-5,-18,8]],
 'ppu-lcd':[[270,135,330],[0,25,8]],
 'apu-audio':[[285,120,345],[20,-35,-2]],
 service:[[300,150,375],[5,-5,0]]
};

const viewExplosion={
 product:0,
 exploded:1,
 power:.72,
 'cpu-memory':.68,
 cartridge:.72,
 input:.48,
 'ppu-lcd':.58,
 'apu-audio':.68,
 service:.58
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
  product:['product','P4 representative geometry','Game Boy DMG-01','Use the familiar handheld first. The running system state remains live while you move into deeper engineering views.'],
  exploded:['physical assembly','board-revision-aware reconstruction','Exploded product stack','Front/rear shell, front LCD/control board, mainboard, converter, jack board, batteries, speaker, and cartridge remain distinct assemblies.'],
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

function setExplosion(value){ explosion=Math.max(0,Math.min(1,value)); model.setExplosion(explosion); ui.explodeBtn.textContent=explosion>.5?'Assemble':'Explode'; }

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
 const key=name==='A'?'buttonA':name==='B'?'buttonB':name==='Up'||name==='Down'||name==='Left'||name==='Right'?'dpad':null;
 const down=ev=>{ev.preventDefault();system.pressButton(name,true);if(key)model.setButtonPressed(key,true);if(name==='A')chirp();updateUi();};
 const up=ev=>{ev.preventDefault();system.pressButton(name,false);if(key)model.setButtonPressed(key,false);updateUi();};
 button.addEventListener('pointerdown',down); button.addEventListener('pointerup',up); button.addEventListener('pointerleave',up);
}

ui.powerBtn.addEventListener('click',()=>{system.setPower(!system.state.power);updateUi();});
ui.cartridgeBtn.addEventListener('click',()=>{system.setCartridgePresent(!system.state.cartridge.present);updateUi();});
ui.explodeBtn.addEventListener('click',()=>{setExplosion(explosion>.5?0:1);if(explosion>0)setView('exploded');else setView('product');});
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

function resize(){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
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
 updateUi
};

const params=new URLSearchParams(location.search);
if(params.get('view')) setView(params.get('view'));
else setView('product');
if(params.get('layer')) setLayer(params.get('layer'));
updateUi();
ui.loading.style.opacity='0';setTimeout(()=>ui.loading.remove(),350);

function animate(now){
 const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
 if(autoRun&&system.state.running) system.advanceDots(Math.max(1,Math.floor(dt*900)));
 controls.update();updateUi();renderer.render(scene,camera);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
