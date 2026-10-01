import * as THREE from 'three';
import { COMPONENTS } from './spec.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.12,
    roughness: opts.roughness ?? 0.72,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
    depthWrite: opts.depthWrite ?? true
  });
}

const M = {
  pack: mat(0x17191c, { roughness: 0.9 }),
  film: mat(0xe7e2d6, { roughness: 0.86 }),
  filmFace: mat(0x23282d, { roughness: 0.88 }),
  darkSlide: mat(0x111417, { roughness: 0.94 }),
  battery: mat(0x7e6852, { metalness: 0.12, roughness: 0.55 }),
  metal: mat(0x808991, { metalness: 0.7, roughness: 0.32 }),
  roller: mat(0x4d565d, { metalness: 0.58, roughness: 0.34 }),
  platen: mat(0x3c444b, { metalness: 0.4, roughness: 0.45 })
};

function box(w,h,d,material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(r,h,material,segments=32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);
  m.castShadow = true;
  return m;
}

function clamp01(v) { return Math.max(0,Math.min(1,v)); }

export function createTransportVisualization() {
  const root = new THREE.Group();
  root.name = 'SX-70 film pack and transport';

  const pickables = [];
  const register = (key, object) => {
    const meta = COMPONENTS[key];
    if (!meta) return object;
    object.traverse(child => {
      if (!child.isMesh) return;
      child.userData.inspectable = true;
      child.userData.componentKey = key;
      child.userData.component = meta;
      pickables.push(child);
    });
    return object;
  };

  const packGroup = new THREE.Group();
  packGroup.position.set(0,-1,-10);
  root.add(packGroup);

  const packShell = box(86,11,112,M.pack);
  packShell.position.y = 0;
  packGroup.add(packShell);
  register('filmPack', packShell);

  const battery = box(78,2.8,88,M.battery);
  battery.position.set(0,-7,-4);
  packGroup.add(battery);
  register('packBattery', battery);

  const platen = box(76,2.1,82,M.platen);
  platen.position.set(0,7,-4);
  packGroup.add(platen);
  register('platen', platen);

  const filmStack = new THREE.Group();
  filmStack.position.set(0,8,-4);
  packGroup.add(filmStack);
  for(let i=0;i<10;i+=1){
    const sheet=box(75,0.65,79,M.film);
    sheet.position.y=i*0.65;
    filmStack.add(sheet);
  }

  const pick = box(4,3,33,M.metal);
  pick.position.set(-35,12,19);
  root.add(pick);
  register('filmPick', pick);

  const rollers = new THREE.Group();
  const rollerA = cyl(5.2,88,M.roller,36);
  const rollerB = cyl(5.2,88,M.roller,36);
  rollerA.rotation.z = Math.PI/2;
  rollerB.rotation.z = Math.PI/2;
  rollerA.position.set(0,9,63);
  rollerB.position.set(0,9,72);
  rollers.add(rollerA,rollerB);
  root.add(rollers);
  register('processingRollers', rollers);

  const movingSheet = new THREE.Group();
  const sheetBase = box(75,1.2,82,M.film);
  const imageArea = box(62,0.4,58,M.filmFace);
  imageArea.position.set(0,0.82,-6);
  movingSheet.add(sheetBase,imageArea);
  root.add(movingSheet);
  register('movingFilm', movingSheet);
  movingSheet.visible=false;

  const darkSlide = box(76,1.35,84,M.darkSlide);
  root.add(darkSlide);
  darkSlide.visible=false;

  const ejected = [];
  const state = {
    visible:false,
    packPresent:true,
    darkSlidePresent:false,
    sheetsRemaining:10,
    counter:10,
    batteryState:'healthy-presentation',
    batteryContact:true,
    platenDeflection:0,
    pickProgress:0,
    rollerProgress:0,
    filmInTransport:false,
    transportKind:null,
    darkSlideCycle:null,
    darkSlideElapsed:0,
    lastTransportId:0,
    consumedCycleCount:0,
    rollerAngle:0,
    explosion:0
  };

  function syncPackVisuals() {
    const consumed=10-state.sheetsRemaining;
    filmStack.children.forEach((sheet,index)=>{
      sheet.visible=index<state.sheetsRemaining;
      sheet.position.y=index*0.65;
    });
    state.platenDeflection=clamp01(consumed/10);
    platen.position.y=7+state.platenDeflection*5.5;
  }

  function setVisible(value) {
    state.visible=Boolean(value);
    root.visible=state.visible;
  }

  function applyExplosion() {
    const e = state.explosion;
    // Leave the functional pack near the camera center while the outer base shell
    // moves away in geometry.js, then separate the pack's own layers so battery,
    // platen and film stack are visible rather than trapped inside another black box.
    packGroup.position.set(0, -1 - 2 * e, -10 - 5 * e);
    packShell.position.x = -26 * e;
    battery.position.x = -6 * e;
    platen.position.x = 22 * e;
    filmStack.position.x = 8 * e;
    pick.position.x = -35 + 12 * e;
    rollers.position.x = 42 * e;
    movingSheet.position.x = 58 * e;
    darkSlide.position.x = 58 * e;
  }

  function setExplosion(value) {
    state.explosion=clamp01(value);
    applyExplosion();
  }

  function ready() {
    return state.packPresent && !state.darkSlidePresent && state.sheetsRemaining>0 && state.batteryContact;
  }

  function setMovingObject(kind, progress) {
    const obj=kind==='dark-slide'?darkSlide:movingSheet;
    const other=kind==='dark-slide'?movingSheet:darkSlide;
    other.visible=false;
    obj.visible=true;

    // From pack exposure position toward roller nip and then outward.
    const p=clamp01(progress);
    const pickLeg=Math.min(1,p/0.30);
    const rollerLeg=clamp01((p-0.30)/0.70);

    obj.position.set(
      58 * state.explosion,
      THREE.MathUtils.lerp(13,14,rollerLeg),
      p<0.30
        ? THREE.MathUtils.lerp(0,57,pickLeg)
        : THREE.MathUtils.lerp(57,143,rollerLeg)
    );
  }

  function beginPhotoTransport(cycleCount) {
    if(state.filmInTransport || !ready()) return false;
    state.filmInTransport=true;
    state.transportKind='film';
    state.pickProgress=0;
    state.rollerProgress=0;
    state.lastTransportId=cycleCount;
    movingSheet.visible=true;
    return true;
  }

  function completePhotoTransport(cycleCount) {
    if(!state.filmInTransport || state.transportKind!=='film') return false;
    if(state.lastTransportId!==cycleCount) return false;

    state.filmInTransport=false;
    state.transportKind=null;
    movingSheet.visible=false;

    if(state.consumedCycleCount!==cycleCount){
      state.sheetsRemaining=Math.max(0,state.sheetsRemaining-1);
      state.counter=state.sheetsRemaining;
      state.consumedCycleCount=cycleCount;
    }

    const print=movingSheet.clone(true);
    print.visible=true;
    print.position.set(0,17,151+ejected.length*2.2);
    print.rotation.x=-5*Math.PI/180;
    root.add(print);
    ejected.push(print);
    if(ejected.length>3){
      const old=ejected.shift();
      root.remove(old);
    }

    syncPackVisuals();
    return true;
  }

  function handleCycle(cycleState,events=[]){
    if(events.includes('pick-start')) beginPhotoTransport(cycleState.cycleCount);

    if(state.filmInTransport && state.transportKind==='film'){
      state.pickProgress=cycleState.pickProgress;
      state.rollerProgress=cycleState.rollerProgress;
      const progress=cycleState.phase==='pick-transfer'
        ? 0.30*cycleState.pickProgress
        : cycleState.phase==='roller-processing'
          ? 0.30+0.70*cycleState.rollerProgress
          : cycleState.phase==='reflex-recock' || cycleState.phase==='terminal-brake' || cycleState.phase==='idle'
            ? 1
            : 0;
      setMovingObject('film',progress);
    }

    if(events.includes('reflex-recock-phase')) completePhotoTransport(cycleState.cycleCount);
  }

  function loadFreshPack(){
    if(state.filmInTransport || state.darkSlideCycle) return false;
    state.packPresent=true;
    state.darkSlidePresent=true;
    state.sheetsRemaining=10;
    state.counter=null;
    state.batteryState='healthy-presentation';
    state.batteryContact=true;
    state.darkSlideCycle='pick';
    state.darkSlideElapsed=0;
    state.transportKind='dark-slide';
    state.filmInTransport=true;
    darkSlide.visible=true;
    syncPackVisuals();
    return true;
  }

  function step(dt,cycleState,events=[]){
    handleCycle(cycleState,events);

    const delta=Math.max(0,Math.min(Number(dt)||0,0.05));

    if(state.darkSlideCycle){
      state.darkSlideElapsed+=delta;
      if(state.darkSlideCycle==='pick'){
        const p=clamp01(state.darkSlideElapsed/0.34);
        setMovingObject('dark-slide',0.30*p);
        if(p>=1){
          state.darkSlideCycle='rollers';
          state.darkSlideElapsed=0;
        }
      }else{
        const p=clamp01(state.darkSlideElapsed/0.78);
        setMovingObject('dark-slide',0.30+0.70*p);
        if(p>=1){
          state.darkSlideCycle=null;
          state.darkSlidePresent=false;
          state.counter=10;
          state.filmInTransport=false;
          state.transportKind=null;
          darkSlide.visible=false;
        }
      }
    }

    const rollersActive=
      state.darkSlideCycle==='rollers' ||
      cycleState.phase==='roller-processing';
    if(rollersActive) state.rollerAngle+=delta*12;
    rollerA.rotation.x=state.rollerAngle;
    rollerB.rotation.x=-state.rollerAngle;

    pick.position.x=-35+12*state.explosion;
    pick.position.z=19+Math.max(
      state.darkSlideCycle==='pick'
        ? clamp01(state.darkSlideElapsed/0.34)*31
        : 0,
      cycleState.phase==='pick-transfer'
        ? cycleState.pickProgress*31
        : 0
    );
  }

  function reset(){
    state.packPresent=true;
    state.darkSlidePresent=false;
    state.sheetsRemaining=10;
    state.counter=10;
    state.batteryState='healthy-presentation';
    state.batteryContact=true;
    state.platenDeflection=0;
    state.pickProgress=0;
    state.rollerProgress=0;
    state.filmInTransport=false;
    state.transportKind=null;
    state.darkSlideCycle=null;
    state.darkSlideElapsed=0;
    state.lastTransportId=0;
    state.consumedCycleCount=0;
    movingSheet.visible=false;
    darkSlide.visible=false;
    pick.position.x=-35+12*state.explosion;
    pick.position.z=19;
    for(const print of ejected) root.remove(print);
    ejected.length=0;
    syncPackVisuals();
  }

  function snapshot(){
    return JSON.parse(JSON.stringify({
      ...state,
      ejectedCount:ejected.length,
      ready:ready()
    }));
  }

  syncPackVisuals();
  setExplosion(0);
  setVisible(false);

  return {
    root,
    pickables,
    state,
    setVisible,
    setExplosion,
    ready,
    loadFreshPack,
    step,
    reset,
    snapshot
  };
}
