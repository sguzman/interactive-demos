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
  spaceBtn: document.querySelector('#spaceBtn'),
  backspaceBtn: document.querySelector('#backspaceBtn'),
  returnBtn: document.querySelector('#returnBtn'),
  indexBtn: document.querySelector('#indexBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  explode: document.querySelector('#explode'),
  explodeValue: document.querySelector('#explodeValue'),
  carrierState: document.querySelector('#carrierState'),
  cycleState: document.querySelector('#cycleState'),
  selectionState: document.querySelector('#selectionState'),
  ribbonState: document.querySelector('#ribbonState'),
  lineState: document.querySelector('#lineState'),
  partName: document.querySelector('#partName'),
  partCategory: document.querySelector('#partCategory'),
  partProvenance: document.querySelector('#partProvenance'),
  partDescription: document.querySelector('#partDescription'),
  loading: document.querySelector('#loading')
};

const runtime = {
  cycle: 'IDLE',
  line: 0,
  lastAction: 'ready',
  cycleStart: 0,
  cycleAdvanceCommitted: false,
  selectionTarget: { tilt: 2, rotate: -3 },
  cycleDurationMs: 1150
};

function syncUi() {
  ui.carrierState.textContent = model.state.carrierX.toFixed(2) + ' mm';
  ui.cycleState.textContent = runtime.cycle;
  ui.selectionState.textContent = 'T ' + model.state.tiltUnit.toFixed(1) + ' · R ' + model.state.rotateUnit.toFixed(1);
  ui.ribbonState.textContent = Math.round(model.state.ribbonLift * 100) + '%';
  ui.lineState.textContent = String(runtime.line);
  ui.explodeValue.textContent = Math.round(model.state.explosion * 100) + '%';
}

function resetMechanicalState() {
  runtime.cycle = 'IDLE';
  runtime.line = 0;
  runtime.lastAction = 'reset';
  runtime.cycleStart = 0;
  runtime.cycleAdvanceCommitted = false;
  model.setCarrierX(-CANONICAL.writingLineMm / 2);
  model.setTypeball(0, 0);
  model.setRibbonLift(0);
  model.setPrintApproach(0);
  model.setPlatenIndex(0);
  syncUi();
}

function startCharacterCycle() {
  if (runtime.cycle !== 'IDLE') return;
  runtime.cycle = 'SELECT';
  runtime.cycleStart = performance.now();
  runtime.cycleAdvanceCommitted = false;
  runtime.lastAction = 'character-cycle';
  syncUi();
}

function advanceCarrier(delta) {
  model.setCarrierX(model.state.carrierX + delta);
  syncUi();
}

function runCycle(now) {
  if (runtime.cycle === 'IDLE') return;
  const t = Math.min(1, (now - runtime.cycleStart) / runtime.cycleDurationMs);

  if (t < 0.22) {
    runtime.cycle = 'SELECT';
    const k = t / 0.22;
    model.setTypeball(runtime.selectionTarget.tilt * k, runtime.selectionTarget.rotate * k);
    model.setRibbonLift(0);
    model.setPrintApproach(0);
  } else if (t < 0.47) {
    runtime.cycle = 'APPROACH';
    const k = (t - 0.22) / 0.25;
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate);
    model.setRibbonLift(Math.min(1, k * 1.35));
    model.setPrintApproach(k);
  } else if (t < 0.64) {
    runtime.cycle = 'IMPACT';
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate);
    model.setRibbonLift(1);
    model.setPrintApproach(1);
  } else if (t < 0.88) {
    runtime.cycle = 'RESTORE';
    const k = 1 - (t - 0.64) / 0.24;
    model.setRibbonLift(Math.max(0, k));
    model.setPrintApproach(Math.max(0, k));
  } else {
    runtime.cycle = 'ESCAPEMENT';
    model.setRibbonLift(0);
    model.setPrintApproach(0);
    if (!runtime.cycleAdvanceCommitted) {
      advanceCarrier(CANONICAL.pitchMm);
      runtime.cycleAdvanceCommitted = true;
    }
  }

  if (t >= 1) {
    runtime.cycle = 'IDLE';
    model.setRibbonLift(0);
    model.setPrintApproach(0);
  }
  syncUi();
}

ui.typeBtn.addEventListener('click', startCharacterCycle);
ui.spaceBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'IDLE') return;
  runtime.lastAction = 'space';
  advanceCarrier(CANONICAL.pitchMm);
});
ui.backspaceBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'IDLE') return;
  runtime.lastAction = 'backspace';
  advanceCarrier(-CANONICAL.pitchMm);
});
ui.returnBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'IDLE') return;
  runtime.lastAction = 'carriage-return';
  model.setCarrierX(-CANONICAL.writingLineMm / 2);
  syncUi();
});
ui.indexBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'IDLE') return;
  runtime.lastAction = 'paper-index';
  runtime.line += 1;
  model.setPlatenIndex(model.state.platenIndex + Math.PI / 12);
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
  power: { position: [350, 150, 315], target: [-45, 50, 20] }
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
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    ui.backspaceBtn.click();
  } else if (event.key === 'Enter') {
    ui.returnBtn.click();
  } else if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
    startCharacterCycle();
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
    carrierX: model.state.carrierX,
    selection: { tiltUnit: model.state.tiltUnit, rotateUnit: model.state.rotateUnit },
    ribbonLift: model.state.ribbonLift,
    printApproach: model.state.printApproach,
    platenIndex: model.state.platenIndex,
    explosion: model.state.explosion,
    geometry: model.geometryDiagnostics(),
    profile: CANONICAL.profile
  };
}

window.__selectricDebug = {
  get state() { return snapshot(); },
  typeCharacter: startCharacterCycle,
  space: () => ui.spaceBtn.click(),
  backspace: () => ui.backspaceBtn.click(),
  carriageReturn: () => ui.returnBtn.click(),
  index: () => ui.indexBtn.click(),
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
