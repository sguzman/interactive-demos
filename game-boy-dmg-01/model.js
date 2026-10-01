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

  const bezel = box(76,58,2.5,materials.screenBezel);
  bezel.position.set(0,31,12.3);
  frontShell.add(bezel);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 160; screenCanvas.height = 144;
  const ctx = screenCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(screenCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map:texture });
  const lcd = box(60,43,1.2,screenMat);
  lcd.position.set(0,31,14.2);
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

  const speaker = new THREE.Group();
  for(let i=0;i<6;i++){
    const slot=box(2,15+i*.4,1.2,materials.dark);
    slot.position.set(28+i*3.4,-57+i*.6,13.1);
    slot.rotation.z=-.45;
    speaker.add(slot); mark(slot,'speaker');
  }
  groups.speaker=speaker; body.add(speaker);

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

  // Bus traces as visual causal affordances.
  const traceMat = new THREE.LineBasicMaterial({color:0x8bc5d7,transparent:true,opacity:.3});
  for(let i=-3;i<=3;i++){
    const pts=[new THREE.Vector3(-32,i*8,1.5),new THREE.Vector3(32,i*8,1.5)];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),traceMat.clone());
    mainboard.add(line);
  }

  const lcdBoard = new THREE.Group();
  const lcdPcb=box(78,70,2.2,materials.pcb); mark(lcdPcb,'lcdBoard'); lcdBoard.add(lcdPcb);
  lcdBoard.position.set(0,29,1); groups.lcdBoard=lcdBoard; root.add(lcdBoard);

  const powerBoard=box(22,42,3,materials.pcb2); powerBoard.position.set(-45,-35,-5); mark(powerBoard,'powerBoard'); groups.powerBoard=powerBoard; root.add(powerBoard);
  const jackBoard=box(35,18,2.5,materials.pcb); jackBoard.position.set(34,-65,-6); mark(jackBoard,'jackBoard'); groups.jackBoard=jackBoard; root.add(jackBoard);

  // Battery cells, hidden in normal shell only by occlusion.
  const batteries=new THREE.Group();
  for(let i=0;i<4;i++){
    const cell=cyl(7,46,mat(0xa8a28e,.15,.5),24); cell.rotation.z=Math.PI/2; cell.position.set(0,-54+i*18,-18); batteries.add(cell);
  }
  groups.batteries=batteries; root.add(batteries);

  const state={ explosion:0, layer:'physical', cartridgePresent:true };

  const bases = new Map();
  root.traverse(o=>{ if(o.isObject3D) bases.set(o,{p:o.position.clone(),r:o.rotation.clone()}); });

  function setExplosion(value){
    state.explosion=Math.max(0,Math.min(1,value));
    const e=state.explosion;
    frontShell.position.z=5+42*e;
    rearShell.position.z=-17-42*e;
    mainboard.position.z=-6+10*e;
    mainboard.position.x=30*e;
    lcdBoard.position.z=1+24*e;
    lcdBoard.position.x=-28*e;
    powerBoard.position.set(-45-32*e,-35,-5+12*e);
    jackBoard.position.set(34+34*e,-65,-6+8*e);
    cartridge.position.set(0,26,-31-55*e);
    batteries.position.x=-28*e;
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
    const obj=groups[key];
    if(!obj) return;
    if(obj.userData.baseLocalZ === undefined) obj.userData.baseLocalZ = obj.position.z;
    obj.position.z = obj.userData.baseLocalZ + (pressed ? -1.2 : 0);
  }

  function updateScreen(systemState){
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
      representativeProfile:CANONICAL.representativeProfile,
      pickableCount:pickables.length
    };
  }

  setLayer('physical');

  return { root, groups, pickables, state, setExplosion, setLayer, setCartridgePresent, setButtonPressed, updateScreen, geometryDiagnostics };
}
