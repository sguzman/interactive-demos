import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWatch, MODEL } from './movement.js';
import { createLightingRig } from './lighting.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080a0d, 0.0105);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const camera = new THREE.PerspectiveCamera(33, innerWidth / innerHeight, .1, 420);
camera.position.set(50, 31, 59);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.minDistance = 28;
controls.maxDistance = 145;
controls.target.set(0, 0, -2);
controls.maxPolarAngle = Math.PI * .93;

const { watch, layers, parts, pickables, animated, materials } = buildWatch();
scene.add(watch);

const lighting = createLightingRig(scene, materials);

// Dark backboard catches the hard inspection shadows without pretending to be a table.
const backboard = new THREE.Mesh(
  new THREE.CircleGeometry(67, 128),
  new THREE.MeshStandardMaterial({ color: 0x0c0f13, metalness: .03, roughness: .92 })
);
backboard.position.z = -27;
backboard.receiveShadow = true;
scene.add(backboard);

// -----------------------------------------------------------------------------
// Assembly / exploded view
// -----------------------------------------------------------------------------

const explode = document.querySelector('#explode');
const explodeValue = document.querySelector('#explodeValue');
let explosionTarget = Number(explode.value) / 100;
let explosionCurrent = explosionTarget;

function setExplosion(value) {
  explosionTarget = THREE.MathUtils.clamp(value, 0, 1);
  explode.value = String(Math.round(explosionTarget * 100));
  explodeValue.value = `${Math.round(explosionTarget * 100)}%`;
}

explode.addEventListener('input', () => setExplosion(Number(explode.value) / 100));
document.querySelector('#assembleBtn').addEventListener('click', () => setExplosion(0));
document.querySelector('#explodeBtn').addEventListener('click', () => setExplosion(1));

const initialCamera = camera.position.clone();
const initialTarget = controls.target.clone();
document.querySelector('#resetBtn').addEventListener('click', () => {
  camera.position.copy(initialCamera);
  controls.target.copy(initialTarget);
  controls.update();
});

for (const checkbox of document.querySelectorAll('[data-layer]')) {
  checkbox.addEventListener('change', () => {
    const group = layers.get(checkbox.dataset.layer);
    if (group) group.visible = checkbox.checked;
  });
}

// -----------------------------------------------------------------------------
// Inspection light controls
// -----------------------------------------------------------------------------

const lightPreset = document.querySelector('#lightPreset');
const lightAzimuth = document.querySelector('#lightAzimuth');
const lightElevation = document.querySelector('#lightElevation');
const lightDistance = document.querySelector('#lightDistance');
const lightIntensity = document.querySelector('#lightIntensity');
const ambient = document.querySelector('#ambient');
const shadows = document.querySelector('#shadows');
const lightGizmo = document.querySelector('#lightGizmo');

const lightAzimuthValue = document.querySelector('#lightAzimuthValue');
const lightElevationValue = document.querySelector('#lightElevationValue');
const lightDistanceValue = document.querySelector('#lightDistanceValue');
const lightIntensityValue = document.querySelector('#lightIntensityValue');
const ambientValue = document.querySelector('#ambientValue');

function syncLightUI(state) {
  lightAzimuth.value = String(Math.round(state.azimuth));
  lightElevation.value = String(Math.round(state.elevation));
  lightDistance.value = String(Math.round(state.distance));
  lightIntensity.value = String(Math.round(state.intensity));
  ambient.value = String(Math.round(state.ambient * 100));
  shadows.checked = state.shadows;
  lightGizmo.checked = state.gizmo;

  lightAzimuthValue.value = `${Math.round(state.azimuth)}°`;
  lightElevationValue.value = `${Math.round(state.elevation)}°`;
  lightDistanceValue.value = `${Math.round(state.distance)} mm`;
  lightIntensityValue.value = `${Math.round(state.intensity)}`;
  ambientValue.value = state.ambient.toFixed(2);
}

lightPreset.addEventListener('change', () => {
  const state = lighting.setPreset(lightPreset.value);
  state.shadows = shadows.checked;
  state.gizmo = lightGizmo.checked;
  lighting.patch({ shadows: state.shadows, gizmo: state.gizmo });
  syncLightUI(lighting.state);
});

function patchLight() {
  const state = lighting.patch({
    azimuth: Number(lightAzimuth.value),
    elevation: Number(lightElevation.value),
    distance: Number(lightDistance.value),
    intensity: Number(lightIntensity.value),
    ambient: Number(ambient.value) / 100,
    shadows: shadows.checked,
    gizmo: lightGizmo.checked
  });
  syncLightUI(state);
}

for (const input of [lightAzimuth, lightElevation, lightDistance, lightIntensity, ambient]) {
  input.addEventListener('input', patchLight);
}
shadows.addEventListener('change', patchLight);
lightGizmo.addEventListener('change', patchLight);
syncLightUI(lighting.state);

// -----------------------------------------------------------------------------
// Component inspector / provenance
// -----------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const infoCategory = document.querySelector('#infoCategory');
const infoName = document.querySelector('#infoName');
const infoText = document.querySelector('#infoText');
const infoProvenance = document.querySelector('#infoProvenance');
const partFacts = document.querySelector('#partFacts');
let selectionHelper = null;

function showFacts(facts = {}) {
  partFacts.replaceChildren();
  for (const [key, value] of Object.entries(facts)) {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = key;
    dd.textContent = value;
    wrapper.append(dt, dd);
    partFacts.append(wrapper);
  }
}

function inspect(root) {
  const meta = root.userData.meta;
  if (!meta) return;

  infoCategory.textContent = meta.category.toUpperCase();
  infoName.textContent = meta.name;
  infoText.textContent = meta.text;
  infoProvenance.textContent = meta.provenance;
  infoProvenance.className = `provenance ${meta.provenance}`;
  showFacts(meta.facts);

  if (selectionHelper) scene.remove(selectionHelper);
  const bounds = new THREE.Box3().setFromObject(root);
  selectionHelper = new THREE.Box3Helper(bounds, 0xd8b36a);
  scene.add(selectionHelper);
}

renderer.domElement.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  pointer.x = (event.clientX / innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const candidates = pickables.filter(mesh => mesh.userData.pickRoot?.parent?.visible !== false);
  const hits = raycaster.intersectObjects(candidates, false);
  if (!hits.length) return;
  inspect(hits[0].object.userData.pickRoot);
});

// -----------------------------------------------------------------------------
// Animation. M1 distinguishes sourced frequency from simplified train motion.
// Balance oscillation uses the documented 3 Hz rate; train speeds are visual.
// -----------------------------------------------------------------------------

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  elapsed += dt;

  explosionCurrent = THREE.MathUtils.damp(explosionCurrent, explosionTarget, 7.2, dt);
  for (const part of parts) {
    const base = part.userData.basePosition;
    const direction = part.userData.explodeDirection;
    const distance = part.userData.explodeDistance * explosionCurrent;
    part.position.copy(base).addScaledVector(direction, distance);
  }

  // Official oscillator frequency: 3 Hz = three full balance oscillations/second.
  const balanceAngle = Math.sin(elapsed * Math.PI * 2 * MODEL.frequencyHz) * .43;
  animated.balance.rotation.z = balanceAngle;
  animated.pallet.rotation.z = -.22 - balanceAngle * .13;

  // Escape wheel advances in visible beat-sized steps (educational simplification).
  const beat = Math.floor(elapsed * MODEL.frequencyHz * 2);
  animated.escapeWheel.rotation.z = beat * (Math.PI * 2 / 15);

  // Train motion is intentionally visualization-speed in M1 rather than a solved gear model.
  animated.centerWheel.rotation.z = -elapsed * .11;
  animated.thirdWheel.rotation.z = elapsed * .19;
  animated.fourthWheel.rotation.z = -elapsed * .34;
  animated.ratchet.rotation.z = Math.sin(elapsed * .22) * .035;
  animated.crownWheel.rotation.z = -animated.ratchet.rotation.z * 1.35;
  animated.barrel.rotation.z = -elapsed * .006;

  // Display hands use actual clock-like angular rates so relationships are readable.
  animated.secondsHand.rotation.z = -elapsed * Math.PI * 2 / 60;
  animated.minuteHand.rotation.z = 1.10 - elapsed * Math.PI * 2 / 3600;
  animated.hourHand.rotation.z = -.75 - elapsed * Math.PI * 2 / 43200;

  if (selectionHelper) selectionHelper.box.setFromObject(selectionHelper.box.userData?.root ?? new THREE.Object3D());

  controls.update();
  renderer.render(scene, camera);
}

// Box3Helper does not track transformed objects automatically; keep a selected root reference.
const originalInspect = inspect;
inspect = function(root) {
  originalInspect(root);
  if (selectionHelper) selectionHelper.userData.root = root;
};

function updateSelectionBounds() {
  if (!selectionHelper?.userData.root) return;
  selectionHelper.box.setFromObject(selectionHelper.userData.root);
}

// Patch the render loop's helper update without allocating new boxes.
function renderLoop() {
  updateSelectionBounds();
}
renderer.setAnimationLoop(null);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setExplosion(explosionTarget);
document.querySelector('#loading').style.opacity = '0';
setTimeout(() => document.querySelector('#loading')?.remove(), 360);

// Hook selection-bound updates into controls change and each frame through a tiny wrapper.
controls.addEventListener('change', updateSelectionBounds);
const baseAnimate = animate;

// Start scene.
baseAnimate();
