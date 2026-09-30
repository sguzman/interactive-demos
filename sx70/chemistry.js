import * as THREE from 'three';

function mat(color, opacity = 1, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 0.98
  });
}

function box(w,h,d,material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function clamp01(v){ return Math.max(0,Math.min(1,v)); }
function smooth(v){ const x=clamp01(v); return x*x*(3-2*x); }

function subtractiveColor(c,m,y){
  // Educational display approximation only. CMY receiver density reduces corresponding RGB.
  return new THREE.Color(
    clamp01(1-c*0.82),
    clamp01(1-m*0.82),
    clamp01(1-y*0.82)
  );
}

export function createChemistryVisualization() {
  const root = new THREE.Group();
  root.name = 'SX-70 integral-film chemistry visualization';

  const frame = box(116,4,132,mat(0xe9e4d9,1,0.9));
  frame.position.set(0,36,4);
  root.add(frame);

  const receiver = box(90,3.0,94,mat(0xf4f0e5,1,0.92));
  receiver.position.set(0,41,4);
  root.add(receiver);

  const cyanLayer = box(88,1.4,92,mat(0x27b8cf,0.12,0.65));
  cyanLayer.position.set(0,43.5,4);
  root.add(cyanLayer);

  const magentaLayer = box(88,1.4,92,mat(0xd73d88,0.12,0.65));
  magentaLayer.position.set(0,45.1,4);
  root.add(magentaLayer);

  const yellowLayer = box(88,1.4,92,mat(0xf0d33d,0.12,0.65));
  yellowLayer.position.set(0,46.7,4);
  root.add(yellowLayer);

  const reagent = box(92,2.2,98,mat(0x8a5d99,0.25,0.5));
  reagent.position.set(0,49,4);
  root.add(reagent);

  const opacifier = box(94,1.6,100,mat(0x24364a,0.86,0.78));
  opacifier.position.set(0,51.2,4);
  root.add(opacifier);

  const timingLayer = box(96,1.2,102,mat(0xc4b19a,0.4,0.8));
  timingLayer.position.set(0,53.2,4);
  root.add(timingLayer);

  const acidLayer = box(98,1.2,104,mat(0xb77c68,0.42,0.8));
  acidLayer.position.set(0,55.1,4);
  root.add(acidLayer);

  const negative = box(100,2.5,106,mat(0x3a4148,0.82,0.88));
  negative.position.set(0,57.5,4);
  root.add(negative);

  const finalImage = box(87,0.9,91,mat(0xffffff,0.0,0.9));
  finalImage.position.set(0,59.2,4);
  root.add(finalImage);

  const state = {
    visible:false,
    active:false,
    processState:'no-ejected-print',
    chemicalTime:0,
    timeScale:1,
    temperatureC:22,
    exposureRGB:[0.68,0.52,0.36],
    mobileCmy:[1,1,1],
    receiverCmy:[0,0,0],
    targetReceiverCmy:[0.32,0.48,0.64],
    developerPresence:0,
    processingLayerThickness:0,
    localPH:0,
    opacification:0,
    neutralizationProgress:0,
    dyeTransferProgress:0,
    spreadProgress:0,
    provenance:{
      architecture:'P0/P2 canonical Engineering chemistry boundary',
      rates:'P5 normalized educational dynamics',
      exactFormulation:false
    }
  };

  function setVisible(v){
    state.visible=Boolean(v);
    root.visible=state.visible;
  }

  function rateScale(){
    // Qualitative, bounded presentation response only; explicitly not a physical Arrhenius fit.
    return Math.max(0.55,Math.min(1.55,1+(state.temperatureC-22)*0.025));
  }

  function startPrint({sceneLight=0.85, exposureCompensationEv=0}={}){
    const exposureScale=Math.max(0.18,Math.min(1.35,sceneLight*Math.pow(2,exposureCompensationEv*0.25)));
    state.exposureRGB=[
      clamp01(0.80*exposureScale),
      clamp01(0.62*exposureScale),
      clamp01(0.44*exposureScale)
    ];

    // Preserve the canonical sign: greater exposure -> more dye immobilized -> less dye transfer.
    state.targetReceiverCmy=state.exposureRGB.map(exposure=>clamp01(0.92*(1-exposure)+0.05));
    state.mobileCmy=[1,1,1];
    state.receiverCmy=[0,0,0];
    state.active=true;
    state.processState='pod-ruptured';
    state.chemicalTime=0;
    state.developerPresence=0;
    state.processingLayerThickness=0;
    state.localPH=0;
    state.opacification=0;
    state.neutralizationProgress=0;
    state.dyeTransferProgress=0;
    state.spreadProgress=0;
    updateVisuals();
  }

  function updateProcess(){
    if(!state.active) return;

    const t=state.chemicalTime*rateScale();

    state.spreadProgress=smooth(t/1.1);
    state.developerPresence=state.spreadProgress;
    state.processingLayerThickness=state.spreadProgress;
    state.localPH=state.spreadProgress;

    const transferStart=0.65;
    const transferDuration=5.0;
    state.dyeTransferProgress=smooth((t-transferStart)/transferDuration);

    const timingDelay=4.6;
    const neutralizationDuration=4.5;
    state.neutralizationProgress=smooth((t-timingDelay)/neutralizationDuration);

    if(state.spreadProgress<0.98) state.processState='spread-initialized';
    else if(state.neutralizationProgress<=0.02) state.processState='high-pH-opaque-processing';
    else if(state.neutralizationProgress<0.72) state.processState='neutralization-front';
    else if(state.neutralizationProgress<0.98) state.processState='opacifier-discharge';
    else if(state.dyeTransferProgress<0.995) state.processState='stabilizing';
    else state.processState='viewable-stable-print';

    state.receiverCmy=state.targetReceiverCmy.map(v=>v*state.dyeTransferProgress);
    state.mobileCmy=state.targetReceiverCmy.map((target,i)=>{
      const immobilized=state.exposureRGB[i]*0.76;
      return clamp01((1-immobilized)*(1-state.dyeTransferProgress*0.82));
    });

    state.localPH=clamp01(state.spreadProgress*(1-0.82*state.neutralizationProgress));
    state.opacification=clamp01(
      state.spreadProgress*(1-0.96*state.neutralizationProgress)
    );

    updateVisuals();
  }

  function updateVisuals(){
    reagent.material.opacity=0.08+0.30*state.spreadProgress;
    reagent.visible=state.active;

    opacifier.material.opacity=state.active ? 0.08+0.84*state.opacification : 0.04;

    cyanLayer.material.opacity=0.05+0.58*state.receiverCmy[0];
    magentaLayer.material.opacity=0.05+0.58*state.receiverCmy[1];
    yellowLayer.material.opacity=0.05+0.58*state.receiverCmy[2];

    timingLayer.material.opacity=0.18+0.28*(1-state.neutralizationProgress);
    acidLayer.material.opacity=0.18+0.34*state.neutralizationProgress;

    const imageColor=subtractiveColor(...state.receiverCmy);
    finalImage.material.color.copy(imageColor);
    finalImage.material.opacity=state.active
      ? clamp01((1-state.opacification)*0.95)
      : 0;
  }

  function step(dt){
    if(!state.active) return;
    const delta=Math.max(0,Math.min(Number(dt)||0,0.10));
    state.chemicalTime+=delta*state.timeScale;
    updateProcess();
  }

  function setTimeScale(value){
    state.timeScale=value>=4?8:1;
  }

  function toggleFastForward(){
    state.timeScale=state.timeScale===1?8:1;
    return state.timeScale;
  }

  function setTemperature(value){
    state.temperatureC=Math.max(5,Math.min(35,Number(value)||22));
  }

  function reset(){
    state.active=false;
    state.processState='no-ejected-print';
    state.chemicalTime=0;
    state.timeScale=1;
    state.temperatureC=22;
    state.mobileCmy=[1,1,1];
    state.receiverCmy=[0,0,0];
    state.developerPresence=0;
    state.processingLayerThickness=0;
    state.localPH=0;
    state.opacification=0;
    state.neutralizationProgress=0;
    state.dyeTransferProgress=0;
    state.spreadProgress=0;
    updateVisuals();
  }

  function snapshot(){
    return JSON.parse(JSON.stringify(state));
  }

  reset();
  setVisible(false);

  return {
    root,
    state,
    setVisible,
    startPrint,
    step,
    reset,
    setTemperature,
    setTimeScale,
    toggleFastForward,
    snapshot
  };
}
