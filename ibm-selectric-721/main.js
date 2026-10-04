import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSelectricModel } from './geometry.js';
import { CANONICAL } from './spec.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e0f);
scene.fog = new THREE.Fog(0x0c0e0f, 520, 900);

const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 1600);
camera.position.set(420, 270, 470);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 77, -8);
orbit.minDistance = 210;
orbit.maxDistance = 920;

scene.add(new THREE.HemisphereLight(0xd9e1e5, 0x2b2925, 1.35));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(300, 420, 330);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -260;
key.shadow.camera.right = 260;
key.shadow.camera.top = 240;
key.shadow.camera.bottom = -240;
scene.add(key);

const rim = new THREE.DirectionalLight(0x9fbce0, 1.4);
rim.position.set(-260, 170, -300);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x111416, roughness: 0.95, metalness: 0.02 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const model = createSelectricModel();
scene.add(model.root);

const ui = {
  typeBtn: document.querySelector('#typeBtn'),
  shiftBtn: document.querySelector('#shiftBtn'),
  spaceBtn: document.querySelector('#spaceBtn'),
  tabBtn: document.querySelector('#tabBtn'),
  backspaceBtn: document.querySelector('#backspaceBtn'),
  returnBtn: document.querySelector('#returnBtn'),
  indexBtn: document.querySelector('#indexBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  explode: document.querySelector('#explode'),
  explodeValue: document.querySelector('#explodeValue'),
  carrierState: document.querySelector('#carrierState'),
  cycleState: document.querySelector('#cycleState'),
  selectionState: document.querySelector('#selectionState'),
  shiftState: document.querySelector('#shiftState'),
  ribbonState: document.querySelector('#ribbonState'),
  lineState: document.querySelector('#lineState'),
  characterState: document.querySelector('#characterState'),
  codeState: document.querySelector('#codeState'),
  partName: document.querySelector('#partName'),
  partCategory: document.querySelector('#partCategory'),
  partProvenance: document.querySelector('#partProvenance'),
  partDescription: document.querySelector('#partDescription'),
  loading: document.querySelector('#loading')
};

const runtime = {
  cycle: 'C0_REST',
  line: 0,
  lastAction: 'ready',
  cycleStart: 0,
  cycleAdvanceCommitted: false,
  cycleImpactCommitted: false,
  pendingCharacter: 'a',
  selectionTarget: { tilt: 0, rotate: 0, shift: 0 },
  cycleDurationMs: 1250,
  eventLog: [],
  lastRecordedCycle: 'C0_REST'
};

function recordEvent(name, extra = {}) {
  runtime.eventLog.push({
    name,
    carrierX: model.state.carrierX,
    line: runtime.line,
    ...extra
  });
  if (runtime.eventLog.length > 80) runtime.eventLog.shift();
}

function setCycleState(next) {
  if (runtime.cycle === next) return;
  runtime.cycle = next;
  runtime.lastRecordedCycle = next;
  recordEvent(next);
}

function selectionForCharacter(character) {
  const cp = (character || 'a').codePointAt(0) || 97;
  const slot = (cp * 37 + 11) % CANONICAL.typeElement.characterCount;
  const tilt = Math.floor(slot / CANONICAL.typeElement.positionsPerBand);
  const around = slot % CANONICAL.typeElement.positionsPerBand;
  const shift = around >= 11 ? 1 : 0;
  const rotate = (around % 11) - 5;
  const code6 = slot & 0x3f;
  return { tilt, rotate, shift, slot, code6 };
}

function syncUi() {
  ui.carrierState.textContent = model.state.carrierX.toFixed(2) + ' mm';
  ui.cycleState.textContent = runtime.cycle;
  ui.selectionState.textContent = 'T' + model.state.tiltBand.toFixed(1) + ' · R' + model.state.rotateUnit.toFixed(1);
  ui.shiftState.textContent = model.state.shiftHemisphere ? 'UPPER HEMISPHERE' : 'LOWER HEMISPHERE';
  ui.ribbonState.textContent = Math.round(model.state.ribbonLift * 100) + '%';
  ui.lineState.textContent = String(runtime.line);
  ui.characterState.textContent = runtime.pendingCharacter === ' ' ? 'SPACE' : runtime.pendingCharacter;
  ui.codeState.textContent = model.state.keyboardCode.toString(2).padStart(6, '0');
  ui.explodeValue.textContent = Math.round(model.state.explosion * 100) + '%';
  ui.shiftBtn.textContent = model.state.shiftHemisphere ? 'Shift: upper' : 'Shift: lower';
}

function resetMechanicalState() {
  runtime.cycle = 'C0_REST';
  runtime.line = 0;
  runtime.lastAction = 'reset';
  runtime.cycleStart = 0;
  runtime.cycleAdvanceCommitted = false;
  runtime.cycleImpactCommitted = false;
  runtime.eventLog = [];
  runtime.lastRecordedCycle = 'C0_REST';
  runtime.pendingCharacter = 'a';
  runtime.selectionTarget = selectionForCharacter('a');
  model.setKeyboardCode(0);
  model.setCarrierX(-CANONICAL.writingLineMm / 2);
  model.setTypeball(0, 0, 0);
  model.setRibbonLift(0);
  model.setPrintApproach(0);
  model.setPlatenIndex(0);
  model.setCyclePhase(0);
  model.clearPaper();
  syncUi();
}

function startCharacterCycle(character = runtime.pendingCharacter) {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.pendingCharacter = character || 'a';
  runtime.selectionTarget = selectionForCharacter(runtime.pendingCharacter);
  setCycleState('C1_TRIP');
  runtime.cycleStart = performance.now();
  runtime.cycleAdvanceCommitted = false;
  runtime.cycleImpactCommitted = false;
  runtime.lastAction = 'character-cycle';
  syncUi();
}

function advanceCarrier(delta) {
  model.setCarrierX(model.state.carrierX + delta);
  syncUi();
}

function singleIndex() {
  runtime.line += 1;
  model.setPlatenIndex(model.state.platenIndex + Math.PI * 2 / CANONICAL.platen.representativeRatchetTeeth);
}

function nextDefaultTabStop() {
  const currentIndex = Math.max(0, Math.round((model.state.carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.pitchMm));
  const nextIndex = Math.min(CANONICAL.nominalPositions - 1, (Math.floor(currentIndex / 8) + 1) * 8);
  return -CANONICAL.writingLineMm / 2 + nextIndex * CANONICAL.pitchMm;
}

function runCycle(now) {
  if (runtime.cycle === 'C0_REST') return;
  const t = Math.min(1, (now - runtime.cycleStart) / runtime.cycleDurationMs);
  model.setCyclePhase(t);

  if (t < 0.12) {
    setCycleState('C1_TRIP');
    model.setKeyboardCode(0);
    model.setTypeball(0, 0, runtime.selectionTarget.shift);
    model.setRibbonLift(0);
    model.setPrintApproach(0);
  } else if (t < 0.28) {
    setCycleState('C2_CODE_SETUP');
    model.setKeyboardCode(runtime.selectionTarget.code6);
    const k = (t - 0.12) / 0.16;
    model.setTypeball(runtime.selectionTarget.tilt * k, runtime.selectionTarget.rotate * k, runtime.selectionTarget.shift);
  } else if (t < 0.43) {
    setCycleState('C3_SELECTION_DRIVE');
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate, runtime.selectionTarget.shift);
  } else if (t < 0.54) {
    setCycleState('C4_FINE_ALIGN');
    const k = (t - 0.43) / 0.11;
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate, runtime.selectionTarget.shift);
    model.setRibbonLift(k);
    model.setPrintApproach(k * 0.55);
  } else if (t < 0.66) {
    setCycleState('C5_PRINT_IMPACT');
    const k = (t - 0.54) / 0.12;
    model.setRibbonLift(1);
    model.setPrintApproach(Math.min(1, 0.55 + k * 0.45));
    if (!runtime.cycleImpactCommitted && k > 0.58) {
      model.stampCharacter(runtime.pendingCharacter, runtime.line);
      runtime.cycleImpactCommitted = true;
      recordEvent('PRINT_IMPACT', { character: runtime.pendingCharacter });
    }
  } else if (t < 0.91) {
    setCycleState('C6_ESCAPEMENT_RIBBON_RESTORE');
    model.setKeyboardCode(0);
    const k = 1 - (t - 0.66) / 0.25;
    model.setRibbonLift(Math.max(0, k));
    model.setPrintApproach(Math.max(0, k));
    if (!runtime.cycleAdvanceCommitted && t > 0.73) {
      advanceCarrier(CANONICAL.pitchMm);
      runtime.cycleAdvanceCommitted = true;
      recordEvent('ESCAPEMENT_ADVANCE');
    }
  } else {
    setCycleState('C7_CLUTCH_DISENGAGE_CHECK');
    model.setKeyboardCode(0);
    model.setRibbonLift(0);
    model.setPrintApproach(0);
  }

  if (t >= 1) {
    setCycleState('C0_REST');
    model.setRibbonLift(0);
    model.setPrintApproach(0);
    model.setCyclePhase(0);
  }
  syncUi();
}

ui.typeBtn.addEventListener('click', () => startCharacterCycle(runtime.pendingCharacter));
ui.shiftBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  const next = model.state.shiftHemisphere ? 0 : 1;
  model.setTypeball(model.state.tiltBand, model.state.rotateUnit, next);
  runtime.lastAction = 'shift-toggle';
  syncUi();
});
ui.spaceBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.lastAction = 'space';
  runtime.pendingCharacter = ' ';
  advanceCarrier(CANONICAL.pitchMm);
});
ui.tabBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.lastAction = 'tab';
  const destination = nextDefaultTabStop();
  model.setCarrierX(destination);
  recordEvent('TAB_CAPTURE', { destination });
  syncUi();
});
ui.backspaceBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.lastAction = 'backspace';
  advanceCarrier(-CANONICAL.pitchMm);
});
ui.returnBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.lastAction = 'carrier-return';
  model.setCarrierX(-CANONICAL.writingLineMm / 2);
  singleIndex();
  recordEvent('CARRIER_RETURN_TERMINATED_AT_LEFT_MARGIN');
  syncUi();
});
ui.indexBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST') return;
  runtime.lastAction = 'paper-index';
  singleIndex();
  recordEvent('INDEX_ONE_RATCHET_TOOTH');
  syncUi();
});
ui.resetBtn.addEventListener('click', resetMechanicalState);
ui.explode.addEventListener('input', () => {
  model.setExplosion(Number(ui.explode.value) / 100);
  syncUi();
});

const presets = {
  product: { position: [420, 270, 470], target: [0, 77, -8] },
  carrier: { position: [275, 175, 230], target: [0, 100, -58] },
  selection: { position: [330, 175, 250], target: [0, 72, -32] },
  power: { position: [350, 150, 315], target: [-45, 50, 20] },
  rack: { position: [310, 145, 90], target: [0, 83, -65] }
};

document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(other => other.classList.toggle('active', other === button));
    const preset = presets[button.dataset.view];
    if (!preset) return;
    camera.position.fromArray(preset.position);
    orbit.target.fromArray(preset.target);
    orbit.update();
  });
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(model.pickables, true)[0];
  const component = hit?.object?.userData?.component;
  if (!component) return;
  ui.partName.textContent = component.name;
  ui.partCategory.textContent = component.category.toUpperCase();
  ui.partProvenance.textContent = component.provenance;
  ui.partDescription.textContent = component.description;
});

window.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;

  if (event.key === ' ') {
    event.preventDefault();
    ui.spaceBtn.click();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    ui.tabBtn.click();
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    ui.backspaceBtn.click();
  } else if (event.key === 'Enter') {
    ui.returnBtn.click();
  } else if (event.key === 'Shift') {
    ui.shiftBtn.click();
  } else if (event.key.length === 1 && /[a-z0-9.,;:'!?-]/i.test(event.key)) {
    startCharacterCycle(event.key);
  }
});

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
}

function snapshot() {
  return {
    running: true,
    cycle: runtime.cycle,
    line: runtime.line,
    lastAction: runtime.lastAction,
    pendingCharacter: runtime.pendingCharacter,
    keyboardCode: model.state.keyboardCode,
    carrierX: model.state.carrierX,
    selection: {
      tiltBand: model.state.tiltBand,
      rotateUnit: model.state.rotateUnit,
      shiftHemisphere: model.state.shiftHemisphere,
      mappingClass: 'P5 deterministic key-to-slot presentation; not a specific IBM typeball layout'
    },
    ribbonLift: model.state.ribbonLift,
    printApproach: model.state.printApproach,
    platenIndex: model.state.platenIndex,
    cyclePhase: model.state.cyclePhase,
    explosion: model.state.explosion,
    geometry: model.geometryDiagnostics(),
    events: runtime.eventLog.map(event => ({ ...event })),
    profile: CANONICAL.profile
  };
}

window.__selectricDebug = {
  get state() { return snapshot(); },
  typeCharacter: char => startCharacterCycle(char || 'a'),
  space: () => ui.spaceBtn.click(),
  tab: () => ui.tabBtn.click(),
  backspace: () => ui.backspaceBtn.click(),
  carriageReturn: () => ui.returnBtn.click(),
  index: () => ui.indexBtn.click(),
  shift: () => ui.shiftBtn.click(),
  reset: resetMechanicalState,
  setExplosion(value) {
    model.setExplosion(value);
    ui.explode.value = String(Math.round(model.state.explosion * 100));
    syncUi();
  }
};

function animate(now) {
  requestAnimationFrame(animate);
  resize();
  runCycle(now);
  orbit.update();
  renderer.render(scene, camera);
}

resetMechanicalState();
ui.loading.hidden = true;
requestAnimationFrame(animate);
