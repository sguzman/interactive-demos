import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWatch, MODEL } from './movement.js';
import { createLightingRig } from './lighting.js';
import { movementAngles, validateTrainReference } from './kinematics.js';
import { refineTrainGeometry } from './train-refinement.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080a0d, 0.0042);

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
renderer.toneMappingExposure = 1.58;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Metal-heavy PBR materials need something to reflect. The earlier scene had
// direct lights but no environment map, so most steel/brass faces could still
// read almost black. RoomEnvironment supplies a neutral studio reflection field
// without changing the visible background.
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
scene.environment = environmentTarget.texture;
scene.environmentIntensity = 1.18;
pmrem.dispose();

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
refineTrainGeometry(animated, materials, pickables);
scene.add(watch);
const lighting = createLightingRig(scene, materials);

const backboard = new THREE.Mesh(
  new THREE.CircleGeometry(67, 128),
  new THREE.MeshStandardMaterial({ color: 0x161a20, metalness: .02, roughness: .88 })
);
backboard.position.z = -27;
backboard.receiveShadow = true;
scene.add(backboard);

if (!validateTrainReference()) {
  console.warn('6497 reference train periods failed internal ratio validation.');
}

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
// Camera inspection presets
// -----------------------------------------------------------------------------

const VIEW_PRESETS = {
  overview: { position: initialCamera.clone(), target: initialTarget.clone() },
  bridge: { position: new THREE.Vector3(34, 18, -66), target: new THREE.Vector3(-2, -2, -2) },
  dial: { position: new THREE.Vector3(35, 18, 68), target: new THREE.Vector3(0, 0, 1) },
  escapement: { position: new THREE.Vector3(-28, -29, -37), target: new THREE.Vector3(-7.7, -9.0, -1.4) },
  winding: { position: new THREE.Vector3(35, 21, -38), target: new THREE.Vector3(7.7, 4.9, -1.3) }
};

let cameraFlight = null;
const viewButtons = [...document.querySelectorAll('[data-view]')];

function setViewPreset(name) {
  const preset = VIEW_PRESETS[name] ?? VIEW_PRESETS.overview;
  cameraFlight = { position: preset.position.clone(), target: preset.target.clone(), name };
  for (const button of viewButtons) button.classList.toggle('active', button.dataset.view === name);
}

for (const button of viewButtons) button.addEventListener('click', () => setViewPreset(button.dataset.view));
controls.addEventListener('start', () => {
  cameraFlight = null;
  for (const button of viewButtons) button.classList.remove('active');
});

// -----------------------------------------------------------------------------
// Simulation presentation controls
// -----------------------------------------------------------------------------

const trainScale = document.querySelector('#trainScale');
let trainTimeScale = Number(trainScale?.value ?? 1);
trainScale?.addEventListener('change', () => {
  trainTimeScale = Number(trainScale.value);
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
const exposure = document.querySelector('#exposure');
const shadows = document.querySelector('#shadows');
const lightGizmo = document.querySelector('#lightGizmo');
const headlamp = document.querySelector('#headlamp');

const lightAzimuthValue = document.querySelector('#lightAzimuthValue');
const lightElevationValue = document.querySelector('#lightElevationValue');
const lightDistanceValue = document.querySelector('#lightDistanceValue');
const lightIntensityValue = document.querySelector('#lightIntensityValue');
const ambientValue = document.querySelector('#ambientValue');
const exposureValue = document.querySelector('#exposureValue');

function syncLightUI(state) {
  lightAzimuth.value = String(Math.round(state.azimuth));
  lightElevation.value = String(Math.round(state.elevation));
  lightDistance.value = String(Math.round(state.distance));
  lightIntensity.value = String(Math.round(state.intensity));
  ambient.value = String(Math.round(state.ambient * 100));
  exposure.value = String(Math.round(state.exposure * 100));
  shadows.checked = state.shadows;
  lightGizmo.checked = state.gizmo;
  headlamp.checked = state.headlamp;

  lightAzimuthValue.value = `${Math.round(state.azimuth)}°`;
  lightElevationValue.value = `${Math.round(state.elevation)}°`;
  lightDistanceValue.value = `${Math.round(state.distance)} mm`;
  lightIntensityValue.value = `${Math.round(state.intensity)}`;
  ambientValue.value = state.ambient.toFixed(2);
  exposureValue.value = `${state.exposure.toFixed(2)}×`;
  renderer.toneMappingExposure = state.exposure;
}

lightPreset.addEventListener('change', () => {
  const preserve = {
    shadows: shadows.checked,
    gizmo: lightGizmo.checked,
    headlamp: headlamp.checked
  };
  const preset = lighting.setPreset(lightPreset.value);
  const state = lighting.patch(preserve);
  syncLightUI({ ...preset, ...state });
});

function patchLight() {
  const state = lighting.patch({
    azimuth: Number(lightAzimuth.value),
    elevation: Number(lightElevation.value),
    distance: Number(lightDistance.value),
    intensity: Number(lightIntensity.value),
    ambient: Number(ambient.value) / 100,
    exposure: Number(exposure.value) / 100,
    shadows: shadows.checked,
    gizmo: lightGizmo.checked,
    headlamp: headlamp.checked
  });
  syncLightUI(state);
}

for (const input of [lightAzimuth, lightElevation, lightDistance, lightIntensity, ambient, exposure]) {
  input.addEventListener('input', patchLight);
}
shadows.addEventListener('change', patchLight);
lightGizmo.addEventListener('change', patchLight);
headlamp.addEventListener('change', patchLight);
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
  const candidates = pickables.filter(mesh => mesh.visible && mesh.userData.pickRoot?.parent?.visible !== false);
  const hits = raycaster.intersectObjects(candidates, false);
  if (!hits.length) return;
  inspect(hits[0].object.userData.pickRoot);
});

// -----------------------------------------------------------------------------
// Kinematics. M3b keeps the M3a ratio graph and now makes the visible train use
// the same reference tooth/leaf counts. The optional time scale accelerates the
// train for inspection only; the balance remains at its documented real 3 Hz.
// -----------------------------------------------------------------------------

const clock = new THREE.Clock();
let elapsed = 0;
const handPhase = {
  seconds: animated.secondsHand.rotation.z,
  minute: animated.minuteHand.rotation.z,
  hour: animated.hourHand.rotation.z
};

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

  const k = movementAngles(elapsed * trainTimeScale);
  animated.escapeWheel.rotation.z = k.escape;
  animated.fourthWheel.rotation.z = k.seconds;
  animated.thirdWheel.rotation.z = k.third;
  animated.centerWheel.rotation.z = k.center;

  // Winding remains a presentation animation until M4 connects crown state to
  // barrel energy and makes the click a one-way mechanical constraint.
  animated.ratchet.rotation.z = Math.sin(elapsed * .22) * .035;
  animated.crownWheel.rotation.z = -animated.ratchet.rotation.z * 1.35;
  animated.barrel.rotation.z = -elapsed * .006;

  animated.secondsHand.rotation.z = handPhase.seconds + k.smallSecondsHand;
  animated.minuteHand.rotation.z = handPhase.minute + k.minuteHand;
  animated.hourHand.rotation.z = handPhase.hour + k.hourHand;

  if (selectionHelper && selectedRoot) selectionHelper.box.setFromObject(selectedRoot);

  controls.update();
  lighting.followCamera(camera, controls.target);
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
