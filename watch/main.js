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
controls.minDistance = 18;
controls.maxDistance = 145;
controls.target.set(0, 0, -2);
controls.maxPolarAngle = Math.PI * .96;

const { watch, layers, parts, pickables, animated, materials } = buildWatch();
scene.add(watch);
const lighting = createLightingRig(scene, materials);

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

document.querySelector('#resetBtn').addEventListener('click', () => setViewPreset('overview'));

for (const checkbox of document.querySelectorAll('[data-layer]')) {
  checkbox.addEventListener('change', () => {
    const group = layers.get(checkbox.dataset.layer);
    if (group) group.visible = checkbox.checked;
  });
}

// -----------------------------------------------------------------------------
// Camera inspection presets. These are intentionally camera-only: they do not
// hide layers or mutate the model, so the user can combine them with any state.
// -----------------------------------------------------------------------------

const VIEW_PRESETS = {
  overview: {
    position: initialCamera.clone(),
    target: initialTarget.clone()
  },
  bridge: {
    position: new THREE.Vector3(34, 18, -66),
    target: new THREE.Vector3(-2, -2, -2)
  },
  dial: {
    position: new THREE.Vector3(35, 18, 68),
    target: new THREE.Vector3(0, 0, 1)
  },
  escapement: {
    position: new THREE.Vector3(-28, -29, -37),
    target: new THREE.Vector3(-7.7, -9.0, -1.4)
  },
  winding: {
    position: new THREE.Vector3(35, 21, -38),
    target: new THREE.Vector3(7.7, 4.9, -1.3)
  }
};

let cameraFlight = null;
const viewButtons = [...document.querySelectorAll('[data-view]')];

function setViewPreset(name) {
  const preset = VIEW_PRESETS[name] ?? VIEW_PRESETS.overview;
  cameraFlight = {
    position: preset.position.clone(),
    target: preset.target.clone(),
    name
  };
  for (const button of viewButtons) button.classList.toggle('active', button.dataset.view === name);
}

for (const button of viewButtons) button.addEventListener('click', () => setViewPreset(button.dataset.view));
controls.addEventListener('start', () => {
  cameraFlight = null;
  for (const button of viewButtons) button.classList.remove('active');
});

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
  const preset = lighting.setPreset(lightPreset.value);
  lighting.patch({ shadows: shadows.checked, gizmo: lightGizmo.checked });
  syncLightUI({ ...preset, shadows: shadows.checked, gizmo: lightGizmo.checked });
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
let selectedRoot = null;

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

  selectedRoot = root;
  if (selectionHelper) scene.remove(selectionHelper);
  selectionHelper = new THREE.Box3Helper(new THREE.Box3().setFromObject(root), 0xd8b36a);
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
// Animation. M2 still distinguishes sourced oscillator frequency from a future
// solved gear-state model, but the visual mechanism is now more structurally exact.
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

  if (cameraFlight) {
    const blend = 1 - Math.exp(-5.5 * dt);
    camera.position.lerp(cameraFlight.position, blend);
    controls.target.lerp(cameraFlight.target, blend);
    if (camera.position.distanceTo(cameraFlight.position) < .08 && controls.target.distanceTo(cameraFlight.target) < .05) {
      camera.position.copy(cameraFlight.position);
      controls.target.copy(cameraFlight.target);
      cameraFlight = null;
    }
  }

  const balanceAngle = Math.sin(elapsed * Math.PI * 2 * MODEL.frequencyHz) * .43;
  animated.balance.rotation.z = balanceAngle;
  animated.pallet.rotation.z = -.22 - balanceAngle * .13;

  // Escape wheel advances by beat-sized steps for legibility. Locking/impulse
  // geometry remains a later escapement milestone.
  const beat = Math.floor(elapsed * MODEL.frequencyHz * 2);
  animated.escapeWheel.rotation.z = beat * (Math.PI * 2 / 15);

  // Train speeds are still illustrative in M2. M3/M6 will derive these from a
  // solved wheel/pinion graph rather than independently chosen rates.
  animated.centerWheel.rotation.z = -elapsed * .11;
  animated.thirdWheel.rotation.z = elapsed * .19;
  animated.fourthWheel.rotation.z = -elapsed * .34;
  animated.ratchet.rotation.z = Math.sin(elapsed * .22) * .035;
  animated.crownWheel.rotation.z = -animated.ratchet.rotation.z * 1.35;
  animated.barrel.rotation.z = -elapsed * .006;

  animated.secondsHand.rotation.z = -elapsed * Math.PI * 2 / 60;
  animated.minuteHand.rotation.z = 1.10 - elapsed * Math.PI * 2 / 3600;
  animated.hourHand.rotation.z = -.75 - elapsed * Math.PI * 2 / 43200;

  if (selectionHelper && selectedRoot) selectionHelper.box.setFromObject(selectedRoot);

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setExplosion(explosionTarget);
document.querySelector('#loading').style.opacity = '0';
setTimeout(() => document.querySelector('#loading')?.remove(), 360);
animate();
