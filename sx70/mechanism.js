import * as THREE from 'three';
import { COMPONENTS } from './spec.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.35,
    roughness: opts.roughness ?? 0.45,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
    depthWrite: opts.depthWrite ?? true
  });
}

const materials = {
  shutter: mat(0x22262b, { metalness: 0.55, roughness: 0.32 }),
  reflex: mat(0x9fc4d6, { metalness: 0.52, roughness: 0.28, transparent: true, opacity: 0.5, depthWrite: false }),
  mirror: mat(0xbdd6e2, { metalness: 0.72, roughness: 0.18, transparent: true, opacity: 0.72, depthWrite: false }),
  motor: mat(0x59656f, { metalness: 0.72, roughness: 0.35 }),
  gear: mat(0xb79252, { metalness: 0.72, roughness: 0.31 }),
  gearDark: mat(0x646e76, { metalness: 0.68, roughness: 0.34 }),
  cam: mat(0xc8a66a, { metalness: 0.62, roughness: 0.34 }),
  solenoid: mat(0x8a6949, { metalness: 0.52, roughness: 0.42 }),
  active: mat(0x73c8ff, { metalness: 0.15, roughness: 0.4 }),
  brake: mat(0xffab6e, { metalness: 0.15, roughness: 0.4 }),
  contact: mat(0xd3d7da, { metalness: 0.76, roughness: 0.25 })
};

function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(r, h, material, segments = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function mark(object, componentKey) {
  const meta = COMPONENTS[componentKey];
  if (!meta) return;
  object.traverse(child => {
    if (!child.isMesh) return;
    child.userData.inspectable = true;
    child.userData.componentKey = componentKey;
    child.userData.component = meta;
  });
}

function gear(radius, thickness, teeth, material) {
  const root = new THREE.Group();
  const hub = cyl(radius * 0.23, thickness * 1.35, material, 24);
  hub.rotation.x = Math.PI / 2;
  root.add(hub);

  const disc = cyl(radius * 0.78, thickness, material, 40);
  disc.rotation.x = Math.PI / 2;
  root.add(disc);

  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = box(radius * 0.18, radius * 0.16, thickness * 1.15, material);
    tooth.position.set(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88, 0);
    tooth.rotation.z = a;
    root.add(tooth);
  }
  return root;
}

function mirrorPlate(w, h) {
  return box(w, h, 1.2, materials.mirror);
}

export function createMechanismVisualization() {
  const root = new THREE.Group();
  root.name = 'SX-70 integrated internal mechanism reconstruction';

  const pickables = [];
  const register = (key, object) => {
    mark(object, key);
    object.traverse(child => {
      if (child.isMesh) pickables.push(child);
    });
    return object;
  };

  // Front standard internals -------------------------------------------------
  const frontAssembly = new THREE.Group();
  frontAssembly.name = 'Front standard internals';
  const frontBase = new THREE.Vector3(-17, 58, 69);
  frontAssembly.position.copy(frontBase);

  const shutter = new THREE.Group();
  const leftBlade = box(26, 31, 1.25, materials.shutter);
  const rightBlade = box(26, 31, 1.25, materials.shutter);
  leftBlade.position.x = -14;
  rightBlade.position.x = 14;
  shutter.add(leftBlade, rightBlade);
  register('shutterBlades', shutter);
  frontAssembly.add(shutter);

  const solenoid = new THREE.Group();
  const solenoidCan = cyl(4.7, 17, materials.solenoid, 28);
  solenoidCan.rotation.z = Math.PI / 2;
  const plunger = cyl(1.7, 12, materials.contact, 18);
  plunger.rotation.z = Math.PI / 2;
  plunger.position.x = 10;
  solenoid.add(solenoidCan, plunger);
  solenoid.position.set(29, -10, -6);
  register('solenoid1', solenoid);
  frontAssembly.add(solenoid);

  // Drive train --------------------------------------------------------------
  const driveAssembly = new THREE.Group();
  driveAssembly.name = 'Motor and reduction train';
  const driveBase = new THREE.Vector3(23, 14, 4);
  driveAssembly.position.copy(driveBase);

  const motorGroup = new THREE.Group();
  const motor = cyl(8, 29, materials.motor, 36);
  motor.rotation.z = Math.PI / 2;
  const motorShaft = cyl(2.1, 36, materials.contact, 20);
  motorShaft.rotation.z = Math.PI / 2;
  motorGroup.add(motor, motorShaft);
  register('motor', motorGroup);
  driveAssembly.add(motorGroup);

  const gearTrain = new THREE.Group();
  const gears = [
    { mesh: gear(9.2, 2.8, 14, materials.gearDark), p: [-18, 0, 3], ratio: -1.0 },
    { mesh: gear(11.0, 2.8, 18, materials.gear), p: [-35, 1, 3], ratio: 0.66 },
    { mesh: gear(8.1, 2.7, 13, materials.gearDark), p: [-51, -1, 3], ratio: -1.25 },
    { mesh: gear(12.4, 2.9, 20, materials.gear), p: [-69, 2, 3], ratio: 0.5 }
  ];
  for (const item of gears) {
    item.mesh.position.set(...item.p);
    gearTrain.add(item.mesh);
  }
  register('driveGearTrain', gearTrain);
  driveAssembly.add(gearTrain);

  const camGroup = new THREE.Group();
  const cam = cyl(10.5, 3.2, materials.cam, 40);
  cam.rotation.x = Math.PI / 2;
  const camLobe = box(8, 15, 3.3, materials.cam);
  camLobe.position.set(5.5, 2.5, 0);
  camGroup.add(cam, camLobe);
  camGroup.position.set(-85, 1, 4);
  register('sequencingCam', camGroup);
  driveAssembly.add(camGroup);

  // Recock / reflex transfer linkage -----------------------------------------
  const recockAssembly = new THREE.Group();
  recockAssembly.name = 'Recock ram and bell crank';
  const recockBase = new THREE.Vector3(-14, 27, 18);
  recockAssembly.position.copy(recockBase);

  const recockRam = box(4.2, 4.2, 54, materials.contact);
  recockRam.position.set(0, 0, 0);
  const bellCrankA = box(3.2, 24, 3.2, materials.gearDark);
  bellCrankA.position.set(0, 12, -22);
  bellCrankA.rotation.z = -22 * Math.PI / 180;
  const bellCrankB = box(3.2, 21, 3.2, materials.gearDark);
  bellCrankB.position.set(8, 22, -22);
  bellCrankB.rotation.z = 56 * Math.PI / 180;
  recockAssembly.add(recockRam, bellCrankA, bellCrankB);
  register('recockLinkage', recockAssembly);
  root.add(recockAssembly);

  // Reflex optical carrier --------------------------------------------------
  const reflexAssembly = new THREE.Group();
  reflexAssembly.name = 'Reflex carrier and viewing surfaces';
  const reflexBase = new THREE.Vector3(0, 43, -1);
  reflexAssembly.position.copy(reflexBase);

  const carrier = new THREE.Group();
  const carrierFrame = box(72, 3.2, 55, materials.reflex);
  const fresnelFace = box(66, 1.0, 49, materials.mirror);
  fresnelFace.position.y = 2.15;
  carrier.add(carrierFrame, fresnelFace);
  register('reflexCarrier', carrier);
  reflexAssembly.add(carrier);

  const fixedMirrorGroup = new THREE.Group();
  const fixedMirror = mirrorPlate(64, 42);
  fixedMirror.rotation.x = 57 * Math.PI / 180;
  fixedMirrorGroup.add(fixedMirror);
  fixedMirrorGroup.position.set(0, 21, 38);
  register('fixedViewingMirror', fixedMirrorGroup);
  reflexAssembly.add(fixedMirrorGroup);

  const relay = new THREE.Group();
  const relayMirror = mirrorPlate(48, 28);
  relayMirror.rotation.x = 12 * Math.PI / 180;
  const corrector = mirrorPlate(35, 20);
  corrector.position.set(0, -13, 19);
  corrector.rotation.x = -18 * Math.PI / 180;
  relay.add(relayMirror, corrector);
  relay.position.set(0, 49, -28);
  register('relayOptics', relay);
  reflexAssembly.add(relay);

  // Visible control contacts: schematic, not factory geometry ---------------
  const controlAssembly = new THREE.Group();
  const controlBase = new THREE.Vector3(-33, 34, 34);
  controlAssembly.position.copy(controlBase);

  const switchBank = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const contact = box(9, 1.1, 2.4, materials.contact);
    contact.position.set(0, i * 5.2, i % 2 ? 4 : 0);
    contact.rotation.z = (i % 2 ? -8 : 8) * Math.PI / 180;
    switchBank.add(contact);
  }
  register('switchBank', switchBank);
  controlAssembly.add(switchBank);

  const solenoid2 = new THREE.Group();
  const solenoid2Can = cyl(4.2, 14, materials.solenoid, 26);
  solenoid2Can.rotation.z = Math.PI / 2;
  const solenoid2Plunger = cyl(1.4, 9, materials.contact, 18);
  solenoid2Plunger.rotation.z = Math.PI / 2;
  solenoid2Plunger.position.x = 8;
  solenoid2.add(solenoid2Can, solenoid2Plunger);
  solenoid2.position.set(0, 30, -7);
  register('solenoid2', solenoid2);
  controlAssembly.add(solenoid2);

  root.add(frontAssembly, driveAssembly, reflexAssembly, controlAssembly);

  const state = {
    visible: false,
    deployment: 0,
    explosion: 0,
    shutterPosition: 1,
    reflexProgress: 0,
    motorRunning: false,
    motorBraked: false,
    motorAngle: 0,
    camAngle: 0,
    gearAngles: [0, 0, 0, 0]
  };

  function syncVisibility() {
    root.visible = state.visible && state.deployment > 0.08;
  }

  function setVisible(value) {
    state.visible = Boolean(value);
    syncVisibility();
  }

  function setDeployment(value) {
    state.deployment = THREE.MathUtils.clamp(value, 0, 1);
    syncVisibility();
  }

  function applyExplosion() {
    const e = state.explosion;
    // Keep functional internals in one readable central constellation while
    // the exterior shell travels farther away. Individual subassemblies get
    // enough spacing to read as separate parts without destroying adjacency.
    frontAssembly.position.copy(frontBase).add(new THREE.Vector3(-18 * e, 8 * e, 26 * e));
    driveAssembly.position.copy(driveBase).add(new THREE.Vector3(10 * e, 5 * e, 34 * e));
    reflexAssembly.position.copy(reflexBase).add(new THREE.Vector3(0, 24 * e, -15 * e));
    controlAssembly.position.copy(controlBase).add(new THREE.Vector3(-28 * e, 3 * e, 22 * e));
    recockAssembly.position.copy(recockBase).add(new THREE.Vector3(24 * e, 15 * e, 10 * e));
  }

  function setExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    applyExplosion();
  }

  function update(cycleState, dt = 0) {
    if (!cycleState) return;
    state.shutterPosition = cycleState.shutterPosition;
    state.reflexProgress = cycleState.reflexProgress;
    state.motorRunning = cycleState.motorRunning;
    state.motorBraked = cycleState.motorBraked;

    const open = THREE.MathUtils.clamp(cycleState.shutterPosition, 0, 1);
    leftBlade.position.x = THREE.MathUtils.lerp(-2.8, -14, open);
    rightBlade.position.x = THREE.MathUtils.lerp(2.8, 14, open);

    const r = THREE.MathUtils.clamp(cycleState.reflexProgress, 0, 1);
    carrier.position.set(
      0,
      THREE.MathUtils.lerp(0, 17, r),
      THREE.MathUtils.lerp(0, 21, r)
    );
    carrier.rotation.x = THREE.MathUtils.lerp(-18 * Math.PI / 180, -67 * Math.PI / 180, r);

    const recock = THREE.MathUtils.clamp(cycleState.recockProgress || 0, 0, 1);
    recockRam.position.z = THREE.MathUtils.lerp(0, -18, Math.max(r, recock));
    bellCrankA.rotation.z = THREE.MathUtils.lerp(-22, 17, r) * Math.PI / 180;
    bellCrankB.rotation.z = THREE.MathUtils.lerp(56, 28, recock) * Math.PI / 180;

    if (cycleState.motorRunning) {
      state.motorAngle += dt * 11.0;
      state.camAngle += dt * 4.4;
      state.gearAngles = state.gearAngles.map((angle, index) => angle + dt * 8.6 * gears[index].ratio);
    }

    motor.rotation.x = state.motorAngle;
    motorShaft.rotation.x = state.motorAngle;
    camGroup.rotation.z = state.camAngle;
    gears.forEach((item, index) => {
      item.mesh.rotation.z = state.gearAngles[index];
    });

    if (cycleState.motorBraked) {
      motor.material = materials.brake;
    } else if (cycleState.motorRunning) {
      motor.material = materials.active;
    } else {
      motor.material = materials.motor;
    }

    const energized = cycleState.phase !== 'idle' && cycleState.phase !== 'terminal-brake';
    solenoidCan.material = energized ? materials.active : materials.solenoid;
    plunger.position.x = energized ? 13 : 10;
    const secondaryEnergized =
      cycleState.phase === 'post-exposure-motor-run' ||
      cycleState.phase === 'pick-transfer' ||
      cycleState.phase === 'roller-processing' ||
      cycleState.phase === 'reflex-recock';
    solenoid2Can.material = secondaryEnergized ? materials.active : materials.solenoid;
    solenoid2Plunger.position.x = secondaryEnergized ? 11 : 8;

    // Switch contacts move only as a legibility cue; exact production contact
    // travel/placement is not asserted by this P4/P5 physicalization.
    switchBank.children.forEach((contact, index) => {
      contact.rotation.z = ((index % 2 ? -8 : 8) + (state.camAngle * 4 + index * 7) % 5) * Math.PI / 180;
    });

    applyExplosion();
  }

  function snapshot() {
    return {
      visible: root.visible,
      deployment: state.deployment,
      explosion: state.explosion,
      shutterPosition: state.shutterPosition,
      reflexProgress: state.reflexProgress,
      motorRunning: state.motorRunning,
      motorAngle: state.motorAngle,
      camAngle: state.camAngle,
      gearAngles: [...state.gearAngles],
      inspectableMeshCount: pickables.length
    };
  }

  setVisible(false);
  setDeployment(0);
  setExplosion(0);

  return {
    root,
    pickables,
    state,
    setVisible,
    setDeployment,
    setExplosion,
    update,
    snapshot
  };
}
