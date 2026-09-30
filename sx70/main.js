import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSX70Model } from './geometry.js';
import { CANONICAL, COMPONENTS, RECONSTRUCTION } from './spec.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a0d);
scene.fog = new THREE.Fog(0x080a0d, 370, 780);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1400);
camera.position.set(210, 150, 285);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 38, 6);
controls.minDistance = 130;
controls.maxDistance = 620;

scene.add(new THREE.HemisphereLight(0xc6d4df, 0x241b15, 1.15));

const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(190, 260, 170);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -180;
key.shadow.camera.right = 180;
key.shadow.camera.top = 180;
key.shadow.camera.bottom = -180;
scene.add(key);

const rim = new THREE.DirectionalLight(0xb3d3ff, 1.35);
rim.position.set(-180, 120, -190);
scene.add(rim);

const warm = new THREE.PointLight(0xffcf9f, 1.2, 420);
warm.position.set(80, 75, 155);
scene.add(warm);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(760, 760),
  new THREE.MeshStandardMaterial({ color: 0x0c0f12, metalness: 0.05, roughness: 0.96 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -17;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(520, 26, 0x30373d, 0x1b2025);
grid.position.y = -16.7;
grid.material.opacity = 0.22;
grid.material.transparent = true;
scene.add(grid);

const model = createSX70Model();
scene.add(model.root);

const ui = {
  controlsPanel: document.querySelector('.controls'),
  openBtn: document.querySelector('#openBtn'),
  foldBtn: document.querySelector('#foldBtn'),
  takePhotoBtn: document.querySelector('#takePhotoBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  deployment: document.querySelector('#deployment'),
  deploymentValue: document.querySelector('#deploymentValue'),
  deploymentState: document.querySelector('#deploymentState'),
  powerState: document.querySelector('#powerState'),
  focus: document.querySelector('#focus'),
  focusValue: document.querySelector('#focusValue'),
  explode: document.querySelector('#explode'),
  explodeValue: document.querySelector('#explodeValue'),
  assembleBtn: document.querySelector('#assembleBtn'),
  explodeBtn: document.querySelector('#explodeBtn'),
  advancedToggleBtn: document.querySelector('#advancedToggleBtn'),
  partCategory: document.querySelector('#partCategory'),
  partProvenance: document.querySelector('#partProvenance'),
  partName: document.querySelector('#partName'),
  partDescription: document.querySelector('#partDescription'),
  loading: document.querySelector('#loading')
};

const VIEW_PRESETS = {
  overview: {
    position: new THREE.Vector3(210, 150, 285),
    target: new THREE.Vector3(0, 38, 6)
  },
  folding: {
    position: new THREE.Vector3(245, 118, 190),
    target: new THREE.Vector3(0, 42, -3)
  }
};

let cameraFlight = null;
let activeView = 'overview';
const viewButtons = [...document.querySelectorAll('[data-view]')];

function setView(name, immediate = false) {
  const preset = VIEW_PRESETS[name];
  if (!preset) return;
  activeView = name;
  for (const button of viewButtons) {
    button.classList.toggle('active', button.dataset.view === name);
  }

  if (immediate) {
    camera.position.copy(preset.position);
    controls.target.copy(preset.target);
    cameraFlight = null;
  } else {
    cameraFlight = {
      position: preset.position.clone(),
      target: preset.target.clone()
    };
  }
}

for (const button of viewButtons) {
  if (button.disabled) continue;
  button.addEventListener('click', () => setView(button.dataset.view));
}

controls.addEventListener('start', () => {
  cameraFlight = null;
  for (const button of viewButtons) button.classList.remove('active');
});

function setDeploymentTarget(value) {
  const normalized = THREE.MathUtils.clamp(value, 0, 1);
  model.setDeploymentTarget(normalized);
}

function setDeploymentImmediate(value) {
  const normalized = THREE.MathUtils.clamp(value, 0, 1);
  model.setDeploymentImmediate(normalized);
  model.setDeploymentTarget(normalized);
  syncStateUI();
}

ui.openBtn.addEventListener('click', () => setDeploymentTarget(1));
ui.foldBtn.addEventListener('click', () => setDeploymentTarget(0));

ui.deployment.addEventListener('input', () => {
  setDeploymentImmediate(Number(ui.deployment.value) / 100);
});

ui.focus.addEventListener('input', () => {
  const value = Number(ui.focus.value) / 100;
  model.setFocus(value);
  ui.focusValue.value = `${Math.round(value * 100)}%`;
});

ui.explode.addEventListener('input', () => {
  const value = Number(ui.explode.value) / 100;
  model.setExplode(value);
  ui.explodeValue.value = `${Math.round(value * 100)}%`;
});

ui.assembleBtn.addEventListener('click', () => {
  ui.explode.value = '0';
  ui.explodeValue.value = '0%';
  model.setExplode(0);
});

ui.explodeBtn.addEventListener('click', () => {
  ui.explode.value = '100';
  ui.explodeValue.value = '100%';
  model.setExplode(1);
});

ui.advancedToggleBtn.addEventListener('click', () => {
  const open = ui.controlsPanel.classList.toggle('advanced-open');
  ui.advancedToggleBtn.setAttribute('aria-expanded', String(open));
  ui.advancedToggleBtn.textContent = open ? 'Advanced inspection ▴' : 'Advanced inspection ▾';
});

function resetSpecimen() {
  model.setExplode(0);
  ui.explode.value = '0';
  ui.explodeValue.value = '0%';

  model.setFocus(RECONSTRUCTION.focus.normalizedDefault);
  ui.focus.value = String(Math.round(RECONSTRUCTION.focus.normalizedDefault * 100));
  ui.focusValue.value = `${Math.round(RECONSTRUCTION.focus.normalizedDefault * 100)}%`;

  model.setDeploymentImmediate(0);
  model.setDeploymentTarget(0);
  ui.deployment.value = '0';
  setView('overview');

  inspectComponent(null);
  syncStateUI();
}

ui.resetBtn.addEventListener('click', resetSpecimen);

function syncStateUI() {
  const t = model.state.deployment;
  const target = model.state.targetDeployment;

  let deploymentLabel = 'FOLDED';
  if (t >= 0.985) deploymentLabel = 'ERECT · LOCKED';
  else if (t <= 0.015) deploymentLabel = 'FOLDED';
  else deploymentLabel = target >= t ? 'DEPLOYING' : 'FOLDING';

  ui.deploymentState.value = deploymentLabel;
  ui.powerState.value = t >= 0.985 ? 'S6 CLOSED · ENABLED' : 'S6 OPEN · DISABLED';
  ui.deployment.value = String(Math.round(t * 100));
  ui.deploymentValue.value = `${Math.round(t * 100)}%`;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function inspectComponent(component) {
  if (!component) {
    ui.partCategory.textContent = 'STRUCTURE';
    ui.partProvenance.textContent = 'P4 reconstruction';
    ui.partName.textContent = 'Folded SX-70';
    ui.partDescription.textContent =
      'Open the camera or click a component. This tranche models the folding shell honestly: functional identities are source-grounded while public geometry remains reconstructive.';
    return;
  }

  ui.partCategory.textContent = component.category.toUpperCase();
  ui.partProvenance.textContent = component.provenance;
  ui.partName.textContent = component.name;
  ui.partDescription.textContent = component.description;
}

function findInspectable(object) {
  let current = object;
  while (current) {
    if (current.userData?.inspectable && current.userData?.component) return current.userData.component;
    current = current.parent;
  }
  return null;
}

renderer.domElement.addEventListener('pointerup', event => {
  if (event.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(model.pickables, true);
  const component = hits.length ? findInspectable(hits[0].object) : null;
  if (component) inspectComponent(component);
});

const requestedView = new URLSearchParams(window.location.search).get('view');
if (requestedView && VIEW_PRESETS[requestedView]) setView(requestedView, true);
else setView('overview', true);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  model.step(dt);

  if (cameraFlight) {
    camera.position.lerp(cameraFlight.position, 1 - Math.exp(-dt * 4.8));
    controls.target.lerp(cameraFlight.target, 1 - Math.exp(-dt * 4.8));

    if (
      camera.position.distanceTo(cameraFlight.position) < 0.25 &&
      controls.target.distanceTo(cameraFlight.target) < 0.15
    ) {
      camera.position.copy(cameraFlight.position);
      controls.target.copy(cameraFlight.target);
      cameraFlight = null;
    }
  }

  controls.update();
  syncStateUI();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.__sx70Debug = {
  canonical: CANONICAL,
  reconstruction: RECONSTRUCTION,
  components: COMPONENTS,
  get state() {
    return {
      deployment: model.state.deployment,
      targetDeployment: model.state.targetDeployment,
      focus: model.state.focus,
      explosion: model.state.explosion,
      activeView
    };
  },
  open: () => setDeploymentTarget(1),
  fold: () => setDeploymentTarget(0),
  setDeployment: setDeploymentImmediate,
  setFocus: value => model.setFocus(value),
  setExplode: value => model.setExplode(value)
};

requestAnimationFrame(() => {
  ui.loading.style.opacity = '0';
  setTimeout(() => { ui.loading.hidden = true; }, 320);
});

animate();
