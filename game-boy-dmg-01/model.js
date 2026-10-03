import * as THREE from 'three';
import { COMPONENTS, CANONICAL } from './spec.js';

const mat = (color, metalness=0, roughness=.65, transparent=false, opacity=1) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });

function box(w,h,d,m){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); }
function cyl(r,d,m,segments=32){ return new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,segments),m); }

export function createDMGModel() {
  const root = new THREE.Group();
  root.name = 'Nintendo Game Boy DMG-01 representative reconstruction';

  const materials = {
    shell: mat(0xc6c6b8, .03, .75),
    shellDark: mat(0x6c6d65, .05, .7),
    screenBezel: mat(0x555866, .05, .58),
    lcd: mat(0x728b63, .02, .35),
    pcb: mat(0x28543a, .02, .72),
    pcb2: mat(0x403b25, .02, .78),
    chip: mat(0x161a1c, .12, .48),
    metal: mat(0xaeb5b7, .75, .3),
    red: mat(0x9d3150, .05, .5),
    dark: mat(0x292b29, .04, .68),
    gold: mat(0xb69a4b, .55, .34),
    copper: mat(0xb16c3f, .45, .45),
    wire: mat(0x6ca6bd, .12, .42),
    active: mat(0x9fd27c, .08, .34),
    warning: mat(0xd9a558, .08, .4)
  };

  const groups = {};
  const pickables = [];

  function mark(mesh,key){
    mesh.userData.componentKey = key;
    mesh.userData.component = COMPONENTS[key] || { name:key, category:'component', provenance:'P4 presentation', description:'' };
    pickables.push(mesh);
    return mesh;
  }

  const body = new THREE.Group();
  root.add(body);

  const frontShell = box(92,148,12,materials.shell);
  frontShell.position.set(0,0,5);
  mark(frontShell,'shellFront');
  groups.shellFront = frontShell;
  body.add(frontShell);

  const rearShell = box(92,148,11,materials.shellDark);
  rearShell.position.set(0,0,-17);
  mark(rearShell,'shellRear');
  groups.shellRear = rearShell;
  body.add(rearShell);

  // The bezel is a frame, not an opaque plate: the first QA render caught the
  // earlier solid rectangle hiding the actual LCD texture.
  const bezel = new THREE.Group();
  const bezelTop = box(76, 7, 2.5, materials.screenBezel);
  const bezelBottom = box(76, 7, 2.5, materials.screenBezel);
  const bezelLeft = box(8, 50, 2.5, materials.screenBezel);
  const bezelRight = box(8, 50, 2.5, materials.screenBezel);
  bezelTop.position.set(0, 56, 13.0);
  bezelBottom.position.set(0, 6, 13.0);
  bezelLeft.position.set(-34, 31, 13.0);
  bezelRight.position.set(34, 31, 13.0);
  bezel.add(bezelTop, bezelBottom, bezelLeft, bezelRight);
  body.add(bezel);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 160; screenCanvas.height = 144;
  const ctx = screenCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(screenCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map:texture });
  const lcd = box(60,43,1.2,screenMat);
  lcd.position.set(0,31,14.4);
  mark(lcd,'lcd');
  groups.lcd = lcd;
  body.add(lcd);

  // Product controls.
  const dpad = new THREE.Group();
  const d1=box(9,28,4,materials.dark), d2=box(28,9,4,materials.dark);
  dpad.add(d1,d2); dpad.position.set(-26,-28,14);
  dpad.rotation.z = .10;
  dpad.children.forEach(x=>mark(x,'dpad'));
  groups.dpad=dpad; body.add(dpad);

  const a=cyl(7,4,materials.red,32); a.rotation.x=Math.PI/2; a.position.set(27,-29,15); mark(a,'buttonA'); groups.buttonA=a; body.add(a);
  const b=cyl(7,4,materials.red,32); b.rotation.x=Math.PI/2; b.position.set(12,-36,15); mark(b,'buttonB'); groups.buttonB=b; body.add(b);

  const start=box(15,3.5,3,materials.dark); start.position.set(9,-58,14); start.rotation.z=-.25; body.add(start);
  const select=box(15,3.5,3,materials.dark); select.position.set(-9,-55,14); select.rotation.z=-.25; body.add(select);

  const speakerGrille = new THREE.Group();
  for(let i=0;i<6;i++){
    const slot=box(2,15+i*.4,1.2,materials.dark);
    slot.position.set(28+i*3.4,-57+i*.6,13.1);
    slot.rotation.z=-.45;
    speakerGrille.add(slot);
  }
  groups.speakerGrille=speakerGrille; body.add(speakerGrille);

  // Cartridge.
  const cartridge=box(64,70,10,materials.dark);
  cartridge.position.set(0,26,-31);
  mark(cartridge,'cartridge'); groups.cartridge=cartridge; root.add(cartridge);
  const cartLabel=box(48,30,1,mat(0x9b9b8d,0,.8)); cartLabel.position.z=5.6; cartridge.add(cartLabel);

  // Internal boards.
  const mainboard = new THREE.Group();
  const mainPcb=box(78,114,2.4,materials.pcb); mark(mainPcb,'mainboard'); mainboard.add(mainPcb);
  mainboard.position.set(0,-4,-6); groups.mainboard=mainboard; root.add(mainboard);

  const dmgCpu=box(32,28,3.8,materials.chip); dmgCpu.position.set(2,10,3); mark(dmgCpu,'dmgCpu'); mainboard.add(dmgCpu);
  const wram=box(18,9,3,materials.chip); wram.position.set(-23,-20,3); mark(wram,'wram'); mainboard.add(wram);
  const vram=box(18,9,3,materials.chip); vram.position.set(23,-20,3); mark(vram,'vram'); mainboard.add(vram);

  const cartConnector = box(62, 7, 5.4, materials.dark);
  cartConnector.position.set(0, 49, 4);
  mark(cartConnector, 'cartridgeConnector');
  mainboard.add(cartConnector);
  for(let i=0;i<16;i++){
    const contact=box(2.4,1.6,.7,materials.gold);
    contact.position.set(-28+i*3.75,45.4,7.1);
    mainboard.add(contact);
  }

  const crystal=box(18,6,4,materials.metal);
  crystal.position.set(-23,30,3.6);
  mark(crystal,'crystal');
  mainboard.add(crystal);

  // Bus traces as visual causal affordances.
  const traceMat = new THREE.LineBasicMaterial({color:0x8bc5d7,transparent:true,opacity:.3});
  for(let i=-3;i<=3;i++){
    const pts=[new THREE.Vector3(-32,i*8,1.5),new THREE.Vector3(32,i*8,1.5)];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),traceMat.clone());
    mainboard.add(line);
  }

  const lcdBoard = new THREE.Group();
  const lcdPcb=box(78,70,2.2,materials.pcb); mark(lcdPcb,'lcdBoard'); lcdBoard.add(lcdPcb);

  const driver1=box(26,7,2.8,materials.chip); driver1.position.set(-17,24,2.5); mark(driver1,'lcdDrivers'); lcdBoard.add(driver1);
  const driver2=box(26,7,2.8,materials.chip); driver2.position.set(17,24,2.5); mark(driver2,'lcdDrivers'); lcdBoard.add(driver2);
  const driver3=box(14,10,2.8,materials.chip); driver3.position.set(0,11,2.5); mark(driver3,'lcdDrivers'); lcdBoard.add(driver3);

  const contactPositions=[
    [-25,-4],[-12,-11],[18,-10],[30,-3],
    [-14,-27],[-2,-27],[18,-26],[30,-26]
  ];
  for(const [x,y] of contactPositions){
    const pad=cyl(4.2,.7,materials.gold,28); pad.rotation.x=Math.PI/2; pad.position.set(x,y,2.2); mark(pad,'inputContacts'); lcdBoard.add(pad);
  }

  const speakerDisc=cyl(13,3.2,materials.dark,48);
  speakerDisc.rotation.x=Math.PI/2;
  speakerDisc.position.set(27,-23,3.2);
  mark(speakerDisc,'speaker');
  lcdBoard.add(speakerDisc);

  lcdBoard.position.set(0,29,1); groups.lcdBoard=lcdBoard; groups.speaker=speakerDisc; root.add(lcdBoard);

  const powerBoard=box(22,42,3,materials.pcb2); powerBoard.position.set(-45,-35,-5); mark(powerBoard,'powerBoard'); groups.powerBoard=powerBoard; root.add(powerBoard);
  const jackBoard=box(35,18,2.5,materials.pcb); jackBoard.position.set(34,-65,-6); mark(jackBoard,'jackBoard'); groups.jackBoard=jackBoard; root.add(jackBoard);

  // Battery cells, hidden in normal shell only by occlusion.
  const batteries=new THREE.Group();
  for(let i=0;i<4;i++){
    const cell=cyl(7,46,mat(0xa8a28e,.15,.5),24); cell.rotation.z=Math.PI/2; cell.position.set(0,-54+i*18,-18); batteries.add(cell);
  }
  groups.batteries=batteries; root.add(batteries);

  const state={ explosion:0, layer:'physical', cartridgePresent:true, pressed:new Set() };
  const dpadBaseRotation=dpad.rotation.clone();
  const dpadTiltRad=THREE.MathUtils.degToRad(4.5);

  const bases = new Map();
  root.traverse(o=>{ if(o.isObject3D) bases.set(o,{p:o.position.clone(),r:o.rotation.clone()}); });

  function setExplosion(value){
    state.explosion=Math.max(0,Math.min(1,value));
    const e=state.explosion;
    // Explosion is presentation-only. Spread assemblies laterally as well as in
    // depth so each board remains legible instead of stacking behind the shells.
    frontShell.position.set(-42*e,0,5+62*e);
    bezel.position.set(-42*e,0,62*e);
    lcd.position.set(-42*e,31,14.4+62*e);
    dpad.position.x=-26-42*e;
    a.position.x=27-42*e;
    b.position.x=12-42*e;
    start.position.x=9-42*e;
    select.position.x=-9-42*e;
    speakerGrille.position.set(-42*e,0,62*e);
    dpad.position.z=14+62*e;
    a.position.z=15+62*e;
    b.position.z=15+62*e;
    start.position.z=14+62*e;
    select.position.z=14+62*e;

    rearShell.position.set(48*e,0,-17-58*e);
    mainboard.position.set(23*e,-4,-6+4*e);
    lcdBoard.position.set(-24*e,29,1+24*e);
    powerBoard.position.set(-45-54*e,-35,-5+8*e);
    jackBoard.position.set(34+54*e,-65,-6+6*e);
    cartridge.position.set(48*e,26,-31-72*e);
    batteries.position.x=70*e;
  }

  function setLayer(layer){
    state.layer=layer;
    const mapping={
      physical: [],
      electrical:['mainboard','lcdBoard','powerBoard','jackBoard'],
      logical:['dmgCpu','wram','vram','cartridge'],
      temporal:['dmgCpu','vram','lcd'],
      service:['mainboard','powerBoard','lcdBoard','speaker','cartridge']
    };
    const active=new Set(mapping[layer]||[]);
    for(const [key,obj] of Object.entries(groups)){
      obj.traverse(child=>{
        if(!child.isMesh || !child.material?.emissive) return;
        child.material.emissive.set(active.has(key)?0x16321d:0x000000);
        child.material.emissiveIntensity=active.has(key)?1.4:0;
      });
    }
  }

  function setCartridgePresent(present){
    state.cartridgePresent=Boolean(present);
    cartridge.visible=state.cartridgePresent;
  }

  function setButtonPressed(key,pressed){
    if(['Up','Down','Left','Right'].includes(key)){
      if(pressed)state.pressed.add(key);else state.pressed.delete(key);
      let rx=0,ry=0;
      if(state.pressed.has('Up'))rx-=dpadTiltRad;
      if(state.pressed.has('Down'))rx+=dpadTiltRad;
      if(state.pressed.has('Left'))ry-=dpadTiltRad;
      if(state.pressed.has('Right'))ry+=dpadTiltRad;
      dpad.rotation.copy(dpadBaseRotation);
      dpad.rotateX(rx);
      dpad.rotateY(ry);
      return;
    }
    const obj=groups[key];
    if(!obj) return;
    if(obj.userData.baseLocalZ === undefined) obj.userData.baseLocalZ = obj.position.z;
    obj.position.z = obj.userData.baseLocalZ + (pressed ? -1.2 : 0);
  }

  let screenPowered=true;
  function updateScreen(systemState){
    screenPowered=Boolean(systemState.running);
    if(!screenPowered){
      // A powered-off passive LCD is blank and dramatically dimmer than the active demo image.
      ctx.fillStyle='#27311f'; ctx.fillRect(0,0,160,144);
      ctx.fillStyle='#3b4630'; ctx.fillRect(8,8,144,128);
      texture.needsUpdate=true;
      return;
    }
    const palette=['#0f380f','#306230','#8bac0f','#9bbc0f'];
    ctx.fillStyle=palette[3]; ctx.fillRect(0,0,160,144);
    ctx.fillStyle=palette[0]; ctx.fillRect(8,8,144,128);
    ctx.fillStyle=palette[2]; ctx.fillRect(12,12,136,120);
    const phase=systemState.demo.tilePhase;
    ctx.fillStyle=palette[phase%4];
    ctx.fillRect(28+phase*18,44,28,28);
    ctx.fillStyle=palette[(phase+2)%4];
    ctx.fillRect(78,60+phase*6,42,18);
    ctx.fillStyle=palette[0];
    for(let x=0;x<160;x+=8) ctx.fillRect(x,systemState.ppu.ly%144,4,1);
    texture.needsUpdate=true;
  }

  function geometryDiagnostics(){
    const box3=new THREE.Box3().setFromObject(root);
    const size=new THREE.Vector3(); box3.getSize(size);
    return {
      revision:'dmg-public-v1',
      finite:[size.x,size.y,size.z].every(Number.isFinite),
      bounds:{width:size.x,height:size.y,depth:size.z},
      explosion:state.explosion,
      screenPowered,
      controls:{
        dpadTiltDegrees:4.5,
        dpadPressedDirections:[...state.pressed]
      },
      representativeProfile:CANONICAL.representativeProfile,
      pickableCount:pickables.length
    };
  }

  setLayer('physical');

  return { root, groups, pickables, state, setExplosion, setLayer, setCartridgePresent, setButtonPressed, updateScreen, geometryDiagnostics };
}
