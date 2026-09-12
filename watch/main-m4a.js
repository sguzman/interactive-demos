import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWatch, MODEL } from './movement.js';
import { createLightingRig } from './lighting.js';
import { movementAngles, validateTrainReference } from './kinematics.js';
import { refineTrainGeometry } from './train-m3g.js';
import { createWindingSystem } from './winding-m4a.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080a0d, 0.0025);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const pmrem = new THREE.PMREMGenerator(renderer);
const environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
scene.environment = environmentTarget.texture;
scene.environmentIntensity = 1.28;
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
const trainGeometry = refineTrainGeometry(animated, materials, pickables);
const windingSystem = createWindingSystem({ watch, animated, materials, model: MODEL });
scene.add(watch);
const lighting = createLightingRig(scene, materials);

const backboard = new THREE.Mesh(
  new THREE.CircleGeometry(67, 128),
  new THREE.MeshStandardMaterial({ color: 0x171b21, metalness: .02, roughness: .88 })
);
backboard.position.z = -27;
backboard.receiveShadow = true;
scene.add(backboard);

if (!validateTrainReference()) console.warn('6497 reference train periods failed internal ratio validation.');
console.table(trainGeometry.meshes);
console.table(trainGeometry.clearances);
console.table(trainGeometry.endshake);
console.table(trainGeometry.bodyGaps);
console.table(windingSystem.constants);

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

const VIEW_PRESETS = {
  overview: { position: initialCamera.clone(), target: initialTarget.clone() },
  bridge: { position: new THREE.Vector3(34, 18, -66), target: new THREE.Vector3(-2, -2, -2) },
  dial: { position: new THREE.Vector3(35, 18, 68), target: new THREE.Vector3(0, 0, 1) },
  train: { position: new THREE.Vector3(-5, -2, -58), target: new THREE.Vector3(-5, -2, -1.1) },
  stack: { position: new THREE.Vector3(48, -2, -1.25), target: new THREE.Vector3(-5, -2, -1.25) },
  escapement: { position: new THREE.Vector3(-28, -29, -37), target: new THREE.Vector3(-7.7, -9.0, -1.4) },
  winding: { position: new THREE.Vector3(35, 21, -38), target: new THREE.Vector3(7.7, 4.9, -1.3) }
};

let cameraFlight = null;
const viewButtons = [...document.querySelectorAll('[data-view]')];
const meshGuides = document.querySelector('#meshGuides');
const stackGuides = document.querySelector('#stackGuides');
const endshakeGuides = document.querySelector('#endshakeGuides');
const bodyGapGuides = document.querySelector('#bodyGapGuides');

function setViewPreset(name) {
  const preset = VIEW_PRESETS[name] ?? VIEW_PRESETS.overview;
  cameraFlight = { position: preset.position.clone(), target: preset.target.clone(), name };
  for (const button of viewButtons) button.classList.toggle('active', button.dataset.view === name);

  if (name === 'train' && meshGuides) {
    meshGuides.checked = true;
    if (trainGeometry.guides) trainGeometry.guides.visible = true;
  }
  if (name === 'stack') {
    if (stackGuides) stackGuides.checked = true;
    if (endshakeGuides) endshakeGuides.checked = true;
    if (bodyGapGuides) bodyGapGuides.checked = true;
    if (trainGeometry.stackGuides) trainGeometry.stackGuides.visible = true;
    if (trainGeometry.endshakeGuides) trainGeometry.endshakeGuides.visible = true;
    if (trainGeometry.bodyGapGuides) trainGeometry.bodyGapGuides.visible = true;
  }
}

for (const button of viewButtons) button.addEventListener('click', () => setViewPreset(button.dataset.view));
controls.addEventListener('start', () => {
  cameraFlight = null;
  for (const button of viewButtons) button.classList.remove('active');
});

const trainScale = document.querySelector('#trainScale');
const endshakeScale = document.querySelector('#endshakeScale');
let trainTimeScale = Number(trainScale?.value ?? 1);
let endshakeExaggeration = Number(endshakeScale?.value ?? 0);

trainScale?.addEventListener('change', () => { trainTimeScale = Number(trainScale.value); });
meshGuides?.addEventListener('change', () => { if (trainGeometry.guides) trainGeometry.guides.visible = meshGuides.checked; });
stackGuides?.addEventListener('change', () => { if (trainGeometry.stackGuides) trainGeometry.stackGuides.visible = stackGuides.checked; });
endshakeGuides?.addEventListener('change', () => { if (trainGeometry.endshakeGuides) trainGeometry.endshakeGuides.visible = endshakeGuides.checked; });
bodyGapGuides?.addEventListener('change', () => { if (trainGeometry.bodyGapGuides) trainGeometry.bodyGapGuides.visible = bodyGapGuides.checked; });
endshakeScale?.addEventListener('change', () => { endshakeExaggeration = Number(endshakeScale.value); });

const lightPreset = document.querySelector('#lightPreset');
const lightMode = document.querySelector('#lightMode');
const cameraIntensity = document.querySelector('#cameraIntensity');
const lightAzimuth = document.querySelector('#lightAzimuth');
const lightElevation = document.querySelector('#lightElevation');
const lightDistance = document.querySelector('#lightDistance');
const lightIntensity = document.querySelector('#lightIntensity');
const ambient = document.querySelector('#ambient');
const exposure = document.querySelector('#exposure');
const shadows = document.querySelector('#shadows');
const lightGizmo = document.querySelector('#lightGizmo');

const cameraIntensityValue = document.querySelector('#cameraIntensityValue');
const lightAzimuthValue = document.querySelector('#lightAzimuthValue');
const lightElevationValue = document.querySelector('#lightElevationValue');
const lightDistanceValue = document.querySelector('#lightDistanceValue');
const lightIntensityValue = document.querySelector('#lightIntensityValue');
const ambientValue = document.querySelector('#ambientValue');
const exposureValue = document.querySelector('#exposureValue');

function syncLightUI(state) {
  lightMode.value = state.mode;
  cameraIntensity.value = String(Math.round(state.cameraIntensity));
  lightAzimuth.value = String(Math.round(state.azimuth));
  lightElevation.value = String(Math.round(state.elevation));
  lightDistance.value = String(Math.round(state.distance));
  lightIntensity.value = String(Math.round(state.intensity));
  ambient.value = String(Math.round(state.ambient * 100));
  exposure.value = String(Math.round(state.exposure * 100));
  shadows.checked = state.shadows;
  lightGizmo.checked = state.gizmo;
  cameraIntensityValue.value = `${Math.round(state.cameraIntensity)}`;
  lightAzimuthValue.value = `${Math.round(state.azimuth)}°`;
  lightElevationValue.value = `${Math.round(state.elevation)}°`;
  lightDistanceValue.value = `${Math.round(state.distance)} mm`;
  lightIntensityValue.value = `${Math.round(state.intensity)}`;
  ambientValue.value = state.ambient.toFixed(2);
  exposureValue.value = `${state.exposure.toFixed(2)}×`;
  renderer.toneMappingExposure = state.exposure;
}

lightPreset.addEventListener('change', () => {
  const preserve = { shadows: shadows.checked, gizmo: lightGizmo.checked };
  lighting.setPreset(lightPreset.value);
  syncLightUI(lighting.patch(preserve));
});

function patchLight() {
  syncLightUI(lighting.patch({
    mode: lightMode.value,
    cameraIntensity: Number(cameraIntensity.value),
    azimuth: Number(lightAzimuth.value),
    elevation: Number(lightElevation.value),
    distance: Number(lightDistance.value),
    intensity: Number(lightIntensity.value),
    ambient: Number(ambient.value) / 100,
    exposure: Number(exposure.value) / 100,
    shadows: shadows.checked,
    gizmo: lightGizmo.checked
  }));
}

for (const input of [cameraIntensity, lightAzimuth, lightElevation, lightDistance, lightIntensity, ambient, exposure]) input.addEventListener('input', patchLight);
lightMode.addEventListener('change', patchLight);
shadows.addEventListener('change', patchLight);
lightGizmo.addEventListener('change', patchLight);
syncLightUI(lighting.state);

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
  if (hits.length) inspect(hits[0].object.userData.pickRoot);
});

const clock = new THREE.Clock();
let elapsed = 0;
const phases = trainGeometry.phases ?? { center: 0, third: 0, seconds: 0, escape: 0 };
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
  animated.escapeWheel.rotation.z = phases.escape + k.escape;
  animated.fourthWheel.rotation.z = phases.seconds + k.seconds;
  animated.thirdWheel.rotation.z = phases.third + k.third;
  animated.centerWheel.rotation.z = phases.center + k.center;
  trainGeometry.applyEndshake?.(elapsed, endshakeExaggeration);

  // M4a: crown input now causally controls the crown wheel and ratchet, the
  // click blocks reverse ratchet motion, and accepted winding accumulates a
  // stored-energy state. Train release is deliberately still later work.
  windingSystem.update(dt);

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
