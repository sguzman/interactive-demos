import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
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

const FRONT_SHELL_SRC={
  repository:'guighub/DMG-01-Shell',
  commit:'758e2841dc163b472815c39c651df641966e58eb',
  blob:'312893a8b6cb58eb97665c2dcb9be3b24b99ad3b',
  url:'https://raw.githubusercontent.com/guighub/DMG-01-Shell/758e2841dc163b472815c39c651df641966e58eb/STL/DMG-01_Front_v38.stl',
  license:'MIT',
  scope:'front shell only',
  upstreamStatus:'front mostly complete; original-part compatible; some screw holes may be slightly offset'
};

const NOMINAL_ENVELOPE_MM={width:90,height:148,depth:32};
// GLB node translations preserve useful authored X/Y placement anchors, while some Z placement is
// baked into mesh vertices by the FreeCAD -> glTF export. Gate only axes that the export actually
// preserves as node transforms; do not pretend node-local Z is a physical-centre measurement.
const LANDMARKS_MM={
  DisplayGlass:{y:35.8},
  DPad:{x:-26,y:-26},
  ButtonA:{x:33,y:-20},
  ButtonB:{x:18,y:-27},
  SelectKey:{x:-12,y:-48},
  StartKey:{x:4,y:-48},
  BatteryLED:{x:-32,y:40.0}
};
const LANDMARK_TOLERANCE_MM=.02;
const AXIS_INDEX={x:0,y:1,z:2};

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
const ASSEMBLED_CLOSED_EPS=1e-6;
const ASSEMBLED_OCCLUDED_IDS=new Set(['DPadMembrane','ActionMembrane','DPadCarrier']);
const ASSEMBLED_HIDDEN_ASSEMBLIES=new Set(['ControlsInternal','Mainboard','Power','Audio','Flex','Battery','Internal']);
const REAR_INFO_IDS=new Set(['RearModel','RearNintendo','RearRating','RearStudy']);
const CARTRIDGE_INTERNAL_IDS=new Set(['CartridgePCB','CartridgeROM','CartridgeROMLeads']);
const CARTRIDGE_SHELL_IDS=new Set(['CartridgeBack','CartridgeWall','CartridgeFront']);
const INSERT=new THREE.Vector3(-.106,.020,0);
const ACCESSORY_SOURCE_CENTER=new THREE.Vector3(.106,.022,.004);
const CARTRIDGE_REAR_INSET_MM=.35;
const ACCESSORY_TARGET_CENTER=ACCESSORY_SOURCE_CENTER.clone().add(INSERT).add(new THREE.Vector3(0,0,CARTRIDGE_REAR_INSET_MM/1000));
const ACCESSORY_INSERT_FLIP=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);

function isControlInternalOccluded(id=''){
  return ASSEMBLED_OCCLUDED_IDS.has(id) ||
    /^DPadStem\d+$/.test(id) ||
    /^ButtonStem/.test(id) ||
    /^Key(?:Contact|Pill|Boss)\d+$/.test(id) ||
    /^System(?:Contact|Pill|Rubber|Stem)\d+$/.test(id);
}
function isAssembledHidden(node){
  return ASSEMBLED_HIDDEN_ASSEMBLIES.has(node.userData?.assembly) || isControlInternalOccluded(node.userData?.partId||'');
}
function isCartridgeInternal(id=''){
  return CARTRIDGE_INTERNAL_IDS.has(id) || /^GamePakPad\d+$/.test(id);
}

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

function tintNode(node,color,roughness=.74){
  node?.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const m of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
      if(!m?.color)continue;
      m.color.setHex(color);
      if('roughness' in m)m.roughness=roughness;
      if('metalness' in m)m.metalness=0;
    }
  });
}

function orientPrintableFrontShell(geometry){
  geometry.computeBoundingBox();
  let size=new THREE.Vector3();geometry.boundingBox.getSize(size);
  const dims=[size.x,size.y,size.z];
  const depthAxis=dims.indexOf(Math.min(...dims));
  if(depthAxis===0)geometry.rotateY(Math.PI/2);
  else if(depthAxis===1)geometry.rotateX(Math.PI/2);
  geometry.computeBoundingBox();size=new THREE.Vector3();geometry.boundingBox.getSize(size);
  if(size.x>size.y)geometry.rotateZ(Math.PI/2);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return geometry;
}

function unionWorldBoxes(objects){
  const box=new THREE.Box3();box.makeEmpty();
  for(const object of objects.filter(Boolean))box.union(new THREE.Box3().setFromObject(object));
  return box;
}

function isEffectivelyVisible(node){
  for(let n=node;n;n=n.parent)if(n.visible===false)return false;
  return true;
}

function visibleMeshBox(root){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3();box.makeEmpty();
  root.traverse(node=>{
    if(!node.isMesh||!node.geometry||!isEffectivelyVisible(node))return;
    if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();
    if(!node.geometry.boundingBox)return;
    box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));
  });
  return box;
}

export async function createDMGReferenceModel(){
  const [gltf,frontShellGeometry]=await Promise.all([
    new GLTFLoader().loadAsync(SRC.url),
    new STLLoader().loadAsync(FRONT_SHELL_SRC.url)
  ]);
  orientPrintableFrontShell(frontShellGeometry);
  const root=new THREE.Group();
  root.name='Nintendo Game Boy DMG-01 — reference-grounded reconstruction';
  const cad=gltf.scene;
  cad.name='open-console-cad DMG-01';
  cad.scale.setScalar(1000);
  cad.position.z=-16;
  root.add(cad);

  const state={explosion:0,layer:'physical',cartridgePresent:true,pressed:new Set()};
  const nodesByPartId=new Map(),nodes=[],pickables=[],accessories=[];
  const accessoryNodes=new Set();

  cad.traverse(node=>{
    const id=node.userData?.partId||node.name;
    if(id){
      node.userData.partId=id;
      nodesByPartId.set(id,node);
      const isAccessory=node.userData.assembly==='Accessories';
      if(isAccessory){
        node.position.sub(ACCESSORY_SOURCE_CENTER).applyQuaternion(ACCESSORY_INSERT_FLIP).add(ACCESSORY_TARGET_CENTER);
        node.quaternion.premultiply(ACCESSORY_INSERT_FLIP);
      }
      node.userData.basePosition=node.position.clone();
      node.userData.explodeVector=Array.isArray(node.userData.explodeOffset)
        ? new THREE.Vector3(...node.userData.explodeOffset):new THREE.Vector3();
      if(isAccessory){
        node.userData.explodeVector.applyQuaternion(ACCESSORY_INSERT_FLIP);
        accessories.push(node);
        accessoryNodes.add(node);
      }
      nodes.push(node);
    }
    if(node.isMesh){
      cloneMat(node);node.castShadow=true;node.receiveShadow=true;
      // Flush artwork/glass should not cast isolated rectangular floor shadows.
      if(['DisplayGlass','LCD','LCDPolarizer','CartridgeLabel'].includes(id) ||
         /(?:Mark|Word|Title|Caption|Notice)$/.test(id||'')) node.castShadow=false;
      const key=SPECIAL[id],meta=key&&COMPONENTS[key];
      node.userData.component=meta||{
        name:labelOf(node),category:node.userData?.assembly||'CAD component',
        provenance:'P4 external CAD reconstruction',
        description:[node.userData?.partNumber,node.userData?.fidelity,'open-console-cad; not Nintendo factory CAD'].filter(Boolean).join(' · ')
      };
      pickables.push(node);
    }
  });

  // Original DMG Game Paks are visibly darker than the handheld enclosure. The assembly source
  // reused its enclosure material for the blank study cartridge, which made the inserted module
  // visually disappear into the rear shell. Keep the source geometry; only correct presentation.
  for(const id of CARTRIDGE_SHELL_IDS)tintNode(nodesByPartId.get(id),0x777873,.78);
  tintNode(nodesByPartId.get('CartridgeLabel'),0xb8bbb7,.82);

  // The assembly model is excellent for internals/explosion metadata, but its exterior front shell
  // is a study reconstruction. Replace only that front shell with a second, independently authored
  // printable replica whose front half is documented as compatible with original Game Boy parts.
  // Keep the open-console-cad rear shell and all internal components.
  cad.updateMatrixWorld(true);
  const originalFront=[nodesByPartId.get('MainFrame'),nodesByPartId.get('FrontFace')].filter(Boolean);
  const originalFrontBox=unionWorldBoxes(originalFront);
  const originalFrontSize=new THREE.Vector3();originalFrontBox.getSize(originalFrontSize);
  const sourceBox=frontShellGeometry.boundingBox.clone();
  const sourceSize=new THREE.Vector3();sourceBox.getSize(sourceSize);
  const sx=originalFrontSize.x/sourceSize.x,sy=originalFrontSize.y/sourceSize.y;
  const shellScale=Math.sqrt(sx*sy);

  const frontShellReference=new THREE.Mesh(
    frontShellGeometry,
    new THREE.MeshStandardMaterial({color:0xb9bbb4,roughness:.72,metalness:0})
  );
  frontShellReference.name='DMG-01 front shell — printable replica reference';
  frontShellReference.scale.setScalar(shellScale*.001);
  frontShellReference.userData.partId='ReferenceFrontShell';
  frontShellReference.userData.assembly='Body';
  frontShellReference.userData.component={
    name:'DMG-01 front enclosure — printable replica reference',
    category:'physical assembly',
    provenance:'P4 independent printable replica · guighub/DMG-01-Shell@758e2841',
    description:'Front shell only. Upstream documents original-part compatibility while noting that some screw holes may be slightly offset.'
  };
  cad.add(frontShellReference);
  cad.updateMatrixWorld(true);

  // Register by outer-envelope centre first, then pin the replacement front-most plane to the
  // assembly model front-most plane. Both models are Z-up/depth-normal after orientation.
  let fittedBox=new THREE.Box3().setFromObject(frontShellReference);
  const originalCenter=new THREE.Vector3(),fittedCenter=new THREE.Vector3();
  originalFrontBox.getCenter(originalCenter);fittedBox.getCenter(fittedCenter);
  frontShellReference.position.x+=(originalCenter.x-fittedCenter.x)/1000;
  frontShellReference.position.y+=(originalCenter.y-fittedCenter.y)/1000;
  frontShellReference.position.z+=(originalFrontBox.max.z-fittedBox.max.z)/1000;
  cad.updateMatrixWorld(true);
  fittedBox=new THREE.Box3().setFromObject(frontShellReference);
  const fittedSize=new THREE.Vector3();fittedBox.getSize(fittedSize);

  const frontAnchor=nodesByPartId.get('FrontFace')||nodesByPartId.get('MainFrame');
  frontShellReference.userData.basePosition=frontShellReference.position.clone();
  frontShellReference.userData.explodeVector=(frontAnchor?.userData?.explodeVector||new THREE.Vector3()).clone();
  cloneMat(frontShellReference);frontShellReference.castShadow=true;frontShellReference.receiveShadow=true;
  nodes.push(frontShellReference);nodesByPartId.set('ReferenceFrontShell',frontShellReference);pickables.push(frontShellReference);
  for(const n of originalFront)n.visible=false;

  // The assembly-source grille backing was clipped against its own shell corner and can protrude
  // past the replacement shell's tighter lower-right contour. Retire it and add a compact backing
  // that exists only to make the replacement shell's real grille openings read as dark.
  const legacySpeakerMesh=nodesByPartId.get('SpeakerMesh');
  if(legacySpeakerMesh)legacySpeakerMesh.visible=false;
  const speakerGrilleBacking=new THREE.Mesh(
    new THREE.CircleGeometry(.0125,48),
    new THREE.MeshBasicMaterial({color:0x080908,side:THREE.DoubleSide})
  );
  speakerGrilleBacking.name='Speaker grille backing — replacement-shell presentation';
  speakerGrilleBacking.position.set(.027,-.055,.02910);
  speakerGrilleBacking.userData.partId='SpeakerGrilleBacking';
  speakerGrilleBacking.userData.assembly='Body';
  speakerGrilleBacking.userData.component={
    name:'Speaker grille backing',
    category:'presentation geometry',
    provenance:'P5 registration aid for independent front-shell reference',
    description:'Compact dark backing behind the printable-replica shell grille; replaces an assembly-source mesh whose old shell clipping could protrude beyond the hybrid enclosure.'
  };
  speakerGrilleBacking.userData.basePosition=speakerGrilleBacking.position.clone();
  speakerGrilleBacking.userData.explodeVector=(frontAnchor?.userData?.explodeVector||new THREE.Vector3()).clone();
  cad.add(speakerGrilleBacking);
  nodes.push(speakerGrilleBacking);nodesByPartId.set('SpeakerGrilleBacking',speakerGrilleBacking);pickables.push(speakerGrilleBacking);

  const frontShellDiagnostics={
    source:{...FRONT_SHELL_SRC},
    rawOrientedBoundsMm:{width:sourceSize.x,height:sourceSize.y,depth:sourceSize.z},
    registrationScale:shellScale,
    targetBoundsMm:{width:originalFrontSize.x,height:originalFrontSize.y,depth:originalFrontSize.z},
    fittedBoundsMm:{width:fittedSize.x,height:fittedSize.y,depth:fittedSize.z},
    widthResidualMm:fittedSize.x-originalFrontSize.x,
    heightResidualMm:fittedSize.y-originalFrontSize.y,
    frontPlaneResidualMm:fittedBox.max.z-originalFrontBox.max.z
  };

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

  function syncVisibility(){
    const assembled=state.explosion<=ASSEMBLED_CLOSED_EPS;
    for(const n of nodes){
      const id=n.userData?.partId||'';
      if(accessoryNodes.has(n)){
        n.visible=state.cartridgePresent && !(assembled && isCartridgeInternal(id));
      }else if(isAssembledHidden(n)){
        n.visible=!assembled;
      }
    }
    if(legacySpeakerMesh)legacySpeakerMesh.visible=false;
  }
  function apply(){
    for(const n of nodes){
      const b=n.userData.basePosition;if(!b)continue;
      // Continuous dissection: every part moves linearly from its exact assembled origin.
      // Intermediate clipping is intentional because it preserves provenance of motion.
      n.position.copy(b).addScaledVector(n.userData.explodeVector||new THREE.Vector3(),state.explosion);
    }
    syncVisibility();
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
  function setCartridgePresent(v){state.cartridgePresent=!!v;syncVisibility();}
  function setButtonPressed(key,v){if(v)state.pressed.add(key);else state.pressed.delete(key);apply();}
  function updateScreen(s){
    const p=['#0f380f','#306230','#8bac0f','#9bbc0f'];ctx.fillStyle=p[3];ctx.fillRect(0,0,160,144);
    ctx.fillStyle=p[0];ctx.fillRect(7,7,146,130);ctx.fillStyle=p[2];ctx.fillRect(10,10,140,124);
    const ph=s.demo.tilePhase;ctx.fillStyle=p[ph%4];ctx.fillRect(24+ph*18,42,28,28);
    ctx.fillStyle=p[(ph+2)%4];ctx.fillRect(80,62+ph*5,40,18);ctx.fillStyle=p[0];
    for(let x=0;x<160;x+=8)ctx.fillRect(x,s.ppu.ly%144,4,1);tex.needsUpdate=true;
  }
  function assembledControlVisibility(){
    const ids=nodes.filter(n=>isAssembledHidden(n)).map(n=>n.userData.partId).filter(Boolean);
    const hiddenCount=ids.filter(id=>nodesByPartId.get(id)?.visible===false).length;
    return {count:ids.length,hiddenCount,allHidden:hiddenCount===ids.length};
  }
  function assembledCartridgeVisibility(){
    const ids=accessories.filter(n=>isCartridgeInternal(n.userData?.partId)).map(n=>n.userData.partId);
    const hiddenCount=ids.filter(id=>nodesByPartId.get(id)?.visible===false).length;
    return {count:ids.length,hiddenCount,allHidden:hiddenCount===ids.length};
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
    const e=state.explosion,p=state.cartridgePresent;setExplosion(0);
    // The 90 × 148 × 32 mm published envelope is the handheld body, not the removable Game Pak.
    // Measure the body with the accessory removed, then record the inserted assembly separately.
    setCartridgePresent(false);
    const bodyBox=visibleMeshBox(cad),size=new THREE.Vector3();bodyBox.getSize(size);
    setCartridgePresent(true);
    const insertedBox=visibleMeshBox(cad),insertedSize=new THREE.Vector3();insertedBox.getSize(insertedSize);
    setCartridgePresent(p);setExplosion(e);
    const bounds={width:size.x,height:size.y,depth:size.z};
    const insertedBounds={width:insertedSize.x,height:insertedSize.y,depth:insertedSize.z};
    const envelopeDeltaMm={
      width:bounds.width-NOMINAL_ENVELOPE_MM.width,
      height:bounds.height-NOMINAL_ENVELOPE_MM.height,
      depth:bounds.depth-NOMINAL_ENVELOPE_MM.depth
    };
    const landmarkChecks={};
    for(const [id,expected] of Object.entries(LANDMARKS_MM)){
      const actual=landmarkCenters[id];
      if(!actual)continue;
      const delta={};
      for(const [axis,value] of Object.entries(expected)){
        delta[axis]=actual[AXIS_INDEX[axis]]-value;
      }
      const absoluteDeltas=Object.values(delta).map(Math.abs);
      landmarkChecks[id]={
        expected,
        actual:{x:actual[0],y:actual[1],z:actual[2]},
        delta,
        checkedAxes:Object.keys(expected),
        maxAbsDeltaMm:Math.max(...absoluteDeltas),
        withinSourceCoordinateTolerance:absoluteDeltas.every(v=>v<=LANDMARK_TOLERANCE_MM)
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
      revision:'dmg-reference-cad-v13',
      geometryMaturity:'G4-render-review-in-progress; user-acceptance-open',
      source:{
        assembly:{
          repository:SRC.repo,commit:SRC.commit,sha256:SRC.sha256,
          sourceModelSha256:SRC.sourceModelSha256,
          modelBytes:SRC.modelBytes,components:SRC.components,solids:SRC.solids,
          triangles:SRC.triangles,iterations:SRC.iterations,
          tessellation:SRC.tessellation,upstreamAudit:SRC.upstreamAudit
        },
        frontShell:frontShellDiagnostics.source
      },
      frontShellReference:frontShellDiagnostics,
      finite:[size.x,size.y,size.z].every(Number.isFinite),
      bounds,
      insertedBounds,
      nominalEnvelope:NOMINAL_ENVELOPE_MM,
      importedPartCount:nodesByPartId.size,pickableCount:pickables.length,
      landmarkCenters,
      referenceConformance,
      presentation:{
        legacySpeakerMeshRetired:legacySpeakerMesh ? legacySpeakerMesh.visible===false : true,
        speakerGrilleBackingPresent:nodesByPartId.has('SpeakerGrilleBacking'),
        assembledClosedEpsilon:ASSEMBLED_CLOSED_EPS,
        explodeMode:'continuous-linear-dissection',
        currentInternalExplosionTravel:state.explosion,
        intermediateClippingAllowed:true,
        assembledOcclusionActive:state.explosion<=ASSEMBLED_CLOSED_EPS,
        dpadMembraneVisible:!!nodesByPartId.get('DPadMembrane')?.visible,
        actionMembraneVisible:!!nodesByPartId.get('ActionMembrane')?.visible,
        controlInternalBleedGuard:assembledControlVisibility(),
        cartridgeInternalBleedGuard:assembledCartridgeVisibility(),
        rearMarkingsRemainVisibleWithInsertedCartridge:state.cartridgePresent && state.explosion<=ASSEMBLED_CLOSED_EPS
          ? [...REAR_INFO_IDS].every(id=>nodesByPartId.get(id)?.visible!==false)
          : true,
        cartridgeRearInsetMm:CARTRIDGE_REAR_INSET_MM,
        cartridgeShellPresentation:'darker gray shell + light label; source cartridge geometry unchanged',
        cartridgeInsertion:'180deg-y-flip; label face outward; shell seated 0.35 mm behind rear cover so the physical cartridge-well cutout provides occlusion'
      },
      explosion:state.explosion,representativeProfile:CANONICAL.representativeProfile
    };
  }

  setCartridgePresent(true);setExplosion(0);setLayer('physical');
  groups.shellFront=frontShellReference;
  return {root,cad,groups,pickables,state,nodesByPartId,setExplosion,setLayer,setCartridgePresent,setButtonPressed,updateScreen,geometryDiagnostics,referenceSource:{assembly:SRC,frontShell:FRONT_SHELL_SRC}};
}
