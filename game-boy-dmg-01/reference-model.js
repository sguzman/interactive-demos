import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { COMPONENTS, CANONICAL } from './spec.js';

const SRC={
  repo:'tiansongyu/open-console-cad',
  commit:'55081da3b4864aba36082644f9a3c5cedf1061c8',
  sha256:'9aed0c26e836442ffce065f3607316df7f6d55742b708b9db2394e09e8d99beb',
  sourceModelSha256:'a8c3adf2c8ede383d21c6863a61415319c32aa56cde5caf3cd3b27a827e0b21c',
  url:'https://raw.githubusercontent.com/tiansongyu/open-console-cad/55081da3b4864aba36082644f9a3c5cedf1061c8/site/public/models/gameboy.glb',
  modelBytes:19581512,
  components:410,
  solids:768,
  triangles:660428,
  iterations:15,
  tessellation:{linearDeflectionMm:.10,angularDeflectionRad:.15},
  upstreamAudit:{
    candidatePairs:627,
    clashes:0,
    modelMeasurements:26,
    nativeDrawingDimensions:14,
    sourceRebuild:true,
    stepRoundtrip:true
  }
};

const NOMINAL_ENVELOPE_MM={width:90,height:148,depth:32};
const LANDMARKS_MM={
  DisplayGlass:[0,35.8,30.60],
  DPad:[-26,-26,30.95],
  ButtonA:[33,-20,30.85],
  ButtonB:[18,-27,30.85],
  SelectKey:[-12,-48,30.65],
  StartKey:[4,-48,30.65],
  BatteryLED:[-32,40.0,30.60]
};
const LANDMARK_TOLERANCE_MM=.02;

const SPECIAL={
  BackCover:'shellRear',RearShell:'shellRear',MainFrame:'shellFront',FrontFace:'shellFront',
  DisplayBezel:'lcd',LCD:'lcd',LCDPolarizer:'lcd',DisplayGlass:'lcd',
  DPad:'dpad',ButtonA:'buttonA',ButtonB:'buttonB',
  Mainboard:'mainboard',CPU:'dmgCpu',WRAM:'wram',VRAM:'vram',FrontPCB:'lcdBoard',
  PowerPCB:'powerBoard',HeadphonePCB:'jackBoard',SpeakerFrame:'speaker',
  SpeakerDiaphragm:'speaker',SpeakerBack:'speaker',SpeakerMagnet:'speaker',
  CartridgeSocket:'cartridgeConnector',CartridgeBack:'cartridge',CartridgeWall:'cartridge',
  CartridgeFront:'cartridge',CartridgePCB:'cartridge'
};

const CONTROL={dpad:['DPad'],buttonA:['ButtonA'],buttonB:['ButtonB'],Start:['StartKey'],Select:['SelectKey']};
const INSERT=new THREE.Vector3(-.106,.020,0);

function labelOf(n){
  return (n.userData?.label||n.name||n.userData?.partId||'Component').replace(/^GAMEBOY-\d+\s*·\s*/,'');
}
function cloneMat(mesh){
  if(!mesh.material)return;
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();
  for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
    if('emissive' in m)m.userData.baseEmissive=m.emissive.clone();
  }
}
function hilite(mesh,on){
  for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
    if(!m||!('emissive' in m))continue;
    m.emissive.copy(on?new THREE.Color(0x244b1a):(m.userData.baseEmissive||new THREE.Color(0)));
    m.emissiveIntensity=on?1.35:1;
  }
}

export async function createDMGReferenceModel(){
  const gltf=await new GLTFLoader().loadAsync(SRC.url);
  const root=new THREE.Group();
  root.name='Nintendo Game Boy DMG-01 — reference-grounded reconstruction';
  const cad=gltf.scene;
  cad.name='open-console-cad DMG-01';
  cad.scale.setScalar(1000);
  cad.position.z=-16;
  root.add(cad);

  const state={explosion:0,layer:'physical',cartridgePresent:true,pressed:new Set()};
  const nodesByPartId=new Map(),nodes=[],pickables=[],accessories=[];

  cad.traverse(node=>{
    const id=node.userData?.partId||node.name;
    if(id){
      node.userData.partId=id;
      nodesByPartId.set(id,node);
      if(node.userData.assembly==='Accessories')node.position.add(INSERT);
      node.userData.basePosition=node.position.clone();
      node.userData.explodeVector=Array.isArray(node.userData.explodeOffset)
        ? new THREE.Vector3(...node.userData.explodeOffset):new THREE.Vector3();
      if(node.userData.assembly==='Accessories')accessories.push(node);
      nodes.push(node);
    }
    if(node.isMesh){
      cloneMat(node);node.castShadow=true;node.receiveShadow=true;
      const key=SPECIAL[id],meta=key&&COMPONENTS[key];
      node.userData.component=meta||{
        name:labelOf(node),category:node.userData?.assembly||'CAD component',
        provenance:'P4 external CAD reconstruction',
        description:[node.userData?.partNumber,node.userData?.fidelity,'open-console-cad; not Nintendo factory CAD'].filter(Boolean).join(' · ')
      };
      pickables.push(node);
    }
  });

  const glass=nodesByPartId.get('DisplayGlass');
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=144;
  const ctx=canvas.getContext('2d');
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  const live=new THREE.Mesh(new THREE.PlaneGeometry(.047,.043),new THREE.MeshBasicMaterial({map:tex,polygonOffset:true,polygonOffsetFactor:-2}));
  live.name='LiveScreenOverlay';live.position.z=.00025;live.userData.component=COMPONENTS.lcd;
  glass?.add(live);pickables.push(live);

  const groups={
    shellFront:nodesByPartId.get('FrontFace')||nodesByPartId.get('MainFrame'),
    shellRear:nodesByPartId.get('BackCover')||nodesByPartId.get('RearShell'),
    lcd:glass,dpad:nodesByPartId.get('DPad'),buttonA:nodesByPartId.get('ButtonA'),buttonB:nodesByPartId.get('ButtonB'),
    mainboard:nodesByPartId.get('Mainboard'),dmgCpu:nodesByPartId.get('CPU'),wram:nodesByPartId.get('WRAM'),vram:nodesByPartId.get('VRAM'),
    lcdBoard:nodesByPartId.get('FrontPCB'),powerBoard:nodesByPartId.get('PowerPCB'),jackBoard:nodesByPartId.get('HeadphonePCB'),
    speaker:nodesByPartId.get('SpeakerFrame'),cartridge:nodesByPartId.get('CartridgeFront')||nodesByPartId.get('CartridgeWall'),
    cartridgeConnector:nodesByPartId.get('CartridgeSocket')
  };

  const rules={
    physical:()=>false,
    electrical:n=>['Mainboard','ControlsInternal','Power','Audio','Ports','Flex','CardReader'].includes(n.userData?.assembly),
    logical:n=>['CPU','WRAM','VRAM','Mainboard','CartridgePCB','CartridgeSocket'].includes(n.userData?.partId),
    temporal:n=>['CPU','VRAM','WRAM','FrontPCB','LCD','DisplayGlass','CartridgeSocket'].includes(n.userData?.partId),
    service:n=>['Body','Power','Audio','CardReader','ControlsInternal','Mainboard'].includes(n.userData?.assembly)
  };

  function apply(){
    for(const n of nodes){
      const b=n.userData.basePosition;if(!b)continue;
      n.position.copy(b).addScaledVector(n.userData.explodeVector||new THREE.Vector3(),state.explosion);
    }
    for(const key of state.pressed)for(const id of CONTROL[key]||[]){
      const n=nodesByPartId.get(id);if(n)n.position.z-=.00075;
    }
  }
  function setExplosion(v){state.explosion=Math.max(0,Math.min(1,v));apply();}
  function setLayer(layer){
    state.layer=layer;const rule=rules[layer]||rules.physical;
    for(const n of nodes){
      if(n.isMesh)hilite(n,rule(n));
      else n.traverse(ch=>{if(ch.isMesh)hilite(ch,rule(n));});
    }
  }
  function setCartridgePresent(v){state.cartridgePresent=!!v;for(const n of accessories)n.visible=state.cartridgePresent;}
  function setButtonPressed(key,v){if(v)state.pressed.add(key);else state.pressed.delete(key);apply();}
  function updateScreen(s){
    const p=['#0f380f','#306230','#8bac0f','#9bbc0f'];ctx.fillStyle=p[3];ctx.fillRect(0,0,160,144);
    ctx.fillStyle=p[0];ctx.fillRect(7,7,146,130);ctx.fillStyle=p[2];ctx.fillRect(10,10,140,124);
    const ph=s.demo.tilePhase;ctx.fillStyle=p[ph%4];ctx.fillRect(24+ph*18,42,28,28);
    ctx.fillStyle=p[(ph+2)%4];ctx.fillRect(80,62+ph*5,40,18);ctx.fillStyle=p[0];
    for(let x=0;x<160;x+=8)ctx.fillRect(x,s.ppu.ly%144,4,1);tex.needsUpdate=true;
  }
  function geometryDiagnostics(){
    const landmarkIds=['DisplayGlass','DPad','ButtonA','ButtonB','SelectKey','StartKey','BatteryLED','Mainboard','FrontPCB','CartridgeSocket'];
    const landmarkCenters={};
    for(const id of landmarkIds){
      const n=nodesByPartId.get(id);
      if(n?.userData?.basePosition){
        const p=n.userData.basePosition;
        landmarkCenters[id]=[p.x*1000,p.y*1000,p.z*1000];
      }
    }
    const e=state.explosion,p=state.cartridgePresent;setExplosion(0);setCartridgePresent(true);
    const b=new THREE.Box3().setFromObject(cad),size=new THREE.Vector3();b.getSize(size);
    setCartridgePresent(p);setExplosion(e);
    const bounds={width:size.x,height:size.y,depth:size.z};
    const envelopeDeltaMm={
      width:bounds.width-NOMINAL_ENVELOPE_MM.width,
      height:bounds.height-NOMINAL_ENVELOPE_MM.height,
      depth:bounds.depth-NOMINAL_ENVELOPE_MM.depth
    };
    const landmarkChecks={};
    for(const [id,expected] of Object.entries(LANDMARKS_MM)){
      const actual=landmarkCenters[id];
      if(!actual)continue;
      const delta=actual.map((v,i)=>v-expected[i]);
      landmarkChecks[id]={
        expected,actual,delta,
        maxAbsDeltaMm:Math.max(...delta.map(Math.abs)),
        withinSourceCoordinateTolerance:delta.every(v=>Math.abs(v)<=LANDMARK_TOLERANCE_MM)
      };
    }
    const referenceConformance={
      envelopeDeltaMm,
      envelopeWithinReviewGate:
        Math.abs(envelopeDeltaMm.width)<=2 &&
        Math.abs(envelopeDeltaMm.height)<=3 &&
        Math.abs(envelopeDeltaMm.depth)<=3,
      landmarkToleranceMm:LANDMARK_TOLERANCE_MM,
      landmarks:landmarkChecks,
      sourceCoordinateGate:Object.values(landmarkChecks).every(x=>x.withinSourceCoordinateTolerance)
    };
    return {
      revision:'dmg-reference-cad-v3',
      geometryMaturity:'G3-reference-import; rendered-G4-review-pending',
      source:{
        repository:SRC.repo,commit:SRC.commit,sha256:SRC.sha256,
        sourceModelSha256:SRC.sourceModelSha256,
        modelBytes:SRC.modelBytes,components:SRC.components,solids:SRC.solids,
        triangles:SRC.triangles,iterations:SRC.iterations,
        tessellation:SRC.tessellation,upstreamAudit:SRC.upstreamAudit
      },
      finite:[size.x,size.y,size.z].every(Number.isFinite),
      bounds,
      nominalEnvelope:NOMINAL_ENVELOPE_MM,
      importedPartCount:nodesByPartId.size,pickableCount:pickables.length,
      landmarkCenters,
      referenceConformance,
      explosion:state.explosion,representativeProfile:CANONICAL.representativeProfile
    };
  }

  setCartridgePresent(true);setExplosion(0);setLayer('physical');
  return {root,cad,groups,pickables,state,nodesByPartId,setExplosion,setLayer,setCartridgePresent,setButtonPressed,updateScreen,geometryDiagnostics,referenceSource:SRC};
}
