import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSX70Model } from './geometry.js';
import { createOpticsVisualization } from './optics.js';
import { createExposureCycle } from './cycle.js';
import { createMechanismVisualization } from './mechanism.js';
import { createTransportVisualization } from './transport.js';
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

const optics = createOpticsVisualization();
scene.add(optics.root);
optics.setFocus(model.state.focus);

const cycle = createExposureCycle();
const mechanism = createMechanismVisualization();
scene.add(mechanism.root);

const transport = createTransportVisualization();
scene.add(transport.root);

const ui = {
  controlsPanel: document.querySelector('.controls'),
  openBtn: document.querySelector('#openBtn'),
  foldBtn: document.querySelector('#foldBtn'),
  takePhotoBtn: document.querySelector('#takePhotoBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  loadPackBtn: document.querySelector('#loadPackBtn'),
  deployment: document.querySelector('#deployment'),
  deploymentValue: document.querySelector('#deploymentValue'),
  deploymentState: document.querySelector('#deploymentState'),
  powerState: document.querySelector('#powerState'),
  cycleState: document.querySelector('#cycleState'),
  opticalState: document.querySelector('#opticalState'),
  motorState: document.querySelector('#motorState'),
  lastEventState: document.querySelector('#lastEventState'),
  packState: document.querySelector('#packState'),
  sheetState: document.querySelector('#sheetState'),
  focus: document.querySelector('#focus'),
  focusValue: document.querySelector('#focusValue'),
  sceneLight: document.querySelector('#sceneLight'),
  sceneLightValue: document.querySelector('#sceneLightValue'),
  exposureComp: document.querySelector('#exposureComp'),
  exposureCompValue: document.querySelector('#exposureCompValue'),
  explode: document.querySelector('#explode'),
  explodeValue: document.querySelector('#explodeValue'),
  assembleBtn: document.querySelector('#assembleBtn'),
  explodeBtn: document.querySelector('#explodeBtn'),
  advancedToggleBtn: document.querySelector('#advancedToggleBtn'),
  partCategory: document.querySelector('#partCategory'),
  partProvenance: document.querySelector('#partProvenance'),
  partName: document.querySelector('#partName'),
  partDescription: document.querySelector('#partDescription'),
  s1State: document.querySelector('#s1State'),
  s3State: document.querySelector('#s3State'),
  s4State: document.querySelector('#s4State'),
  s5State: document.querySelector('#s5State'),
  shutterState: document.querySelector('#shutterState'),
  reflexState: document.querySelector('#reflexState'),
  integratorState: document.querySelector('#integratorState'),
  batteryState: document.querySelector('#batteryState'),
  counterState: document.querySelector('#counterState'),
  pickState: document.querySelector('#pickState'),
  rollerState: document.querySelector('#rollerState'),
  darkSlideState: document.querySelector('#darkSlideState'),
  platenState: document.querySelector('#platenState'),
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
  },
  viewing: {
    position: new THREE.Vector3(198, 126, 205),
    target: new THREE.Vector3(-12, 61, 10)
  },
  exposure: {
    position: new THREE.Vector3(190, 112, 184),
    target: new THREE.Vector3(-12, 45, 7)
  },
  sequence: {
    position: new THREE.Vector3(218, 120, 220),
    target: new THREE.Vector3(0, 45, 10)
  },
  transport: {
    position: new THREE.Vector3(200, 92, 225),
    target: new THREE.Vector3(0, 12, 40)
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

  mechanism.setVisible(name === 'sequence');
  transport.setVisible(name === 'sequence' || name === 'transport');

  if (name === 'viewing' || name === 'exposure') {
    setDeploymentTarget(1);
    optics.setMode(name);
    inspectComponent({
      category: 'optical graph',
      provenance: 'P0 function / P4-P5 presentation geometry',
      name: name === 'viewing' ? 'Viewing optical path' : 'Exposure optical path',
      description: name === 'viewing'
        ? 'Conceptual ray graph through the shared taking lens, fixed viewing mirror, reflective Fresnel and off-axis relay to the eye. The path is source-grounded; the public coordinates are reconstructive.'
        : 'Conceptual exposure graph through the shared taking lens, reverse-side taking mirror and integral-film plane. Exact production mirror angles remain unresolved.'
    });
  } else if (name === 'sequence') {
    setDeploymentTarget(1);
    optics.setMode(cycle.state.phase === 'integrating' ? 'exposure' : 'viewing');
    inspectComponent({
      category: 'causal sequence',
      provenance: 'P0/P2 transition order · P5 presentation timing',
      name: 'Exposure-cycle state machine',
      description: 'Follow shutter closure, motor start, spring-driven reflex rise, dynamic braking, the sourced 40 ± 5 ms Y delay, metered exposure, shutter reclosure, and post-exposure recock. Transport visualization follows in the next tranche.'
    });
  } else if (name === 'transport') {
    setDeploymentTarget(1);
    optics.setMode('none');
    inspectComponent({
      category: 'film pack + transport',
      provenance: 'P0 functional architecture · P4 geometry',
      name: 'Pack, pick, and processing rollers',
      description: 'The original pack combines ten film units, dark slide, spring platen, and a flat 6 V battery. The pick advances one unit to the roller nip; powered rollers then take over transport and rupture/spread the processing pod.'
    });
  } else {
    optics.setMode('none');
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
ui.foldBtn.addEventListener('click', () => {
  if (cycle.state.phase !== 'idle') return;
  setDeploymentTarget(0);
});

ui.takePhotoBtn.addEventListener('click', () => {
  const pack = transport.snapshot();
  const accepted = cycle.requestExposure({
    deploymentReady: model.state.deployment >= 0.985,
    packReady: pack.ready,
    darkSlideAbsent: !pack.darkSlidePresent,
    sheetsRemaining: pack.sheetsRemaining
  });
  if (accepted) setView('sequence');
});

ui.loadPackBtn.addEventListener('click', () => {
  if (cycle.state.phase !== 'idle') return;
  if (model.state.deployment < 0.985) model.setDeploymentTarget(1);
  if (transport.loadFreshPack()) setView('transport');
});

ui.deployment.addEventListener('input', () => {
  setDeploymentImmediate(Number(ui.deployment.value) / 100);
});

ui.focus.addEventListener('input', () => {
  const value = Number(ui.focus.value) / 100;
  model.setFocus(value);
  optics.setFocus(value);
  ui.focusValue.value = `${Math.round(value * 100)}%`;
});

ui.sceneLight.addEventListener('input', () => {
  const value = Number(ui.sceneLight.value) / 100;
  cycle.setSceneLight(value);
  ui.sceneLightValue.value = `${Math.round(value * 100)}%`;
});

ui.exposureComp.addEventListener('input', () => {
  const ev = Number(ui.exposureComp.value) / 10;
  cycle.setExposureCompensation(ev);
  ui.exposureCompValue.value = `${ev >= 0 ? '+' : ''}${ev.toFixed(1)} EV`;
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
  cycle.reset();
  transport.reset();
  mechanism.setVisible(false);
  transport.setVisible(false);
  model.setExplode(0);
  ui.explode.value = '0';
  ui.explodeValue.value = '0%';

  model.setFocus(RECONSTRUCTION.focus.normalizedDefault);
  optics.setFocus(RECONSTRUCTION.focus.normalizedDefault);
  optics.setMode('none');
  ui.focus.value = String(Math.round(RECONSTRUCTION.focus.normalizedDefault * 100));
  ui.focusValue.value = `${Math.round(RECONSTRUCTION.focus.normalizedDefault * 100)}%`;

  cycle.setSceneLight(0.85);
  cycle.setExposureCompensation(0);
  ui.sceneLight.value = '85';
  ui.sceneLightValue.value = '85%';
  ui.exposureComp.value = '0';
  ui.exposureCompValue.value = '+0.0 EV';

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
  const cycleState = cycle.state;
  const pack = transport.snapshot();

  let deploymentLabel = 'FOLDED';
  if (t >= 0.985) deploymentLabel = 'ERECT · LOCKED';
  else if (t <= 0.015) deploymentLabel = 'FOLDED';
  else deploymentLabel = target >= t ? 'DEPLOYING' : 'FOLDING';

  ui.deploymentState.value = deploymentLabel;
  ui.powerState.value = t >= 0.985 ? 'S6 CLOSED · ENABLED' : 'S6 OPEN · DISABLED';
  ui.deployment.value = String(Math.round(t * 100));
  ui.deploymentValue.value = `${Math.round(t * 100)}%`;

  ui.cycleState.value = cycleState.phase.toUpperCase();
  ui.opticalState.value = cycleState.opticalMode.toUpperCase();
  ui.motorState.value = cycleState.motorRunning ? 'RUNNING' : (cycleState.motorBraked ? 'BRAKED' : 'STOPPED');
  ui.lastEventState.value = cycleState.lastEvent.toUpperCase();
  ui.packState.value = !pack.packPresent ? 'NO PACK' : pack.darkSlidePresent ? 'DARK SLIDE' : pack.sheetsRemaining > 0 ? 'READY' : 'EMPTY';
  ui.sheetState.value = `${pack.sheetsRemaining} / 10`;
  ui.s1State.textContent = cycleState.S1;
  ui.s3State.textContent = cycleState.S3;
  ui.s4State.textContent = cycleState.S4;
  ui.s5State.textContent = cycleState.S5;
  ui.shutterState.textContent = cycleState.shutterPosition > 0.95 ? 'open' : cycleState.shutterPosition < 0.05 ? 'closed' : `${Math.round(cycleState.shutterPosition * 100)}% open`;
  ui.reflexState.textContent = cycleState.reflexProgress < 0.05 ? 'viewing seated' : cycleState.reflexProgress > 0.95 ? 'exposure position' : `${Math.round(cycleState.reflexProgress * 100)}% travel`;
  const integratorPct = cycleState.exposureThreshold > 0 ? Math.min(100, cycleState.exposureIntegrator / cycleState.exposureThreshold * 100) : 0;
  ui.integratorState.textContent = `${Math.round(integratorPct)}%`;
  ui.batteryState.textContent = pack.batteryState.replaceAll('-', ' ');
  ui.counterState.textContent = pack.counter ?? '—';
  ui.pickState.textContent = pack.filmInTransport ? `${Math.round(Math.max(pack.pickProgress, 0) * 100)}% travel` : 'home';
  ui.rollerState.textContent = pack.darkSlideCycle === 'rollers' || cycleState.phase === 'roller-processing' ? 'driving' : 'idle';
  ui.darkSlideState.textContent = pack.darkSlidePresent ? 'present' : 'absent';
  ui.platenState.textContent = `${Math.round(pack.platenDeflection * 100)}%`;

  const transportBusy = pack.filmInTransport || Boolean(pack.darkSlideCycle);
  const ready = t >= 0.985 && cycleState.phase === 'idle' && pack.ready && !transportBusy;
  ui.takePhotoBtn.disabled = !ready;
  ui.openBtn.disabled = t >= 0.985 || cycleState.phase !== 'idle';
  ui.foldBtn.disabled = t <= 0.015 || cycleState.phase !== 'idle' || transportBusy;
  ui.deployment.disabled = cycleState.phase !== 'idle' || transportBusy;
  ui.focus.disabled = cycleState.phase !== 'idle';
  ui.loadPackBtn.disabled = cycleState.phase !== 'idle' || transportBusy;
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
  const cycleEvents = cycle.step(dt);
  mechanism.update(cycle.state, dt);
  transport.step(dt, cycle.state, cycleEvents);
  optics.setDeployment(model.state.deployment);

  if (activeView === 'sequence') {
    if (cycle.state.opticalMode === 'exposing' || cycle.state.opticalMode === 'exposure-ready') {
      optics.setMode('exposure');
    } else if (cycle.state.phase === 'idle') {
      optics.setMode('viewing');
    } else {
      optics.setMode('none');
    }
  }

  if (cycleEvents.length && activeView === 'sequence') {
    ui.lastEventState.value = cycleEvents[cycleEvents.length - 1].toUpperCase();
  }

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
      activeView,
      opticsMode: optics.state.mode,
      cycle: cycle.snapshot(),
      transport: transport.snapshot(),
      violations: cycle.assertInvariants({
        deploymentReady: model.state.deployment >= 0.985,
        filmInTransport: transport.state.filmInTransport
      })
    };
  },
  open: () => setDeploymentTarget(1),
  fold: () => setDeploymentTarget(0),
  setDeployment: setDeploymentImmediate,
  setFocus: value => {
    model.setFocus(value);
    optics.setFocus(value);
  },
  setExplode: value => model.setExplode(value),
  requestExposure: () => {
    const pack = transport.snapshot();
    return cycle.requestExposure({
      deploymentReady: model.state.deployment >= 0.985,
      packReady: pack.ready,
      darkSlideAbsent: !pack.darkSlidePresent,
      sheetsRemaining: pack.sheetsRemaining
    });
  },
  loadFreshPack: () => transport.loadFreshPack(),
  advanceCycle: (dt = 1 / 60, frames = 1) => {
    let events = [];
    for (let i = 0; i < frames; i += 1) {
      const nextEvents = cycle.step(dt);
      events = events.concat(nextEvents);
      mechanism.update(cycle.state, dt);
      transport.step(dt, cycle.state, nextEvents);
    }
    return { state: cycle.snapshot(), transport: transport.snapshot(), events };
  }
};

requestAnimationFrame(() => {
  ui.loading.style.opacity = '0';
  setTimeout(() => { ui.loading.hidden = true; }, 320);
});

animate();
