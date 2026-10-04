import * as THREE from 'three';
import { CANONICAL, P4, COMPONENTS } from './spec.js';

const deg = THREE.MathUtils.degToRad;

function material(color, metalness = 0.12, roughness = 0.68) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function box(w, h, d, mat, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function shaft(length, radius, mat, name) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 28), mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.name = name;
  mesh.castShadow = true;
  return mesh;
}

function addPickable(mesh, component, pickables) {
  mesh.userData.component = component;
  pickables.push(mesh);
  return mesh;
}

function makeAssembly(name, explodeVector) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.basePosition = new THREE.Vector3();
  root.userData.explodeVector = explodeVector.clone();
  return root;
}

function setAssemblyExplosion(group, amount) {
  group.position.copy(group.userData.basePosition).addScaledVector(group.userData.explodeVector, amount);
}

function makeKeyboard(keysMat, darkMat, pickables) {
  const group = new THREE.Group();
  const deck = box(340, 17, 142, darkMat, 'keyboard deck');
  deck.position.set(0, P4.keyboard.y, P4.keyboard.z);
  deck.rotation.x = deg(-7);
  addPickable(deck, COMPONENTS.keyboard, pickables);
  group.add(deck);

  const rowCounts = [10, 12, 11, 10, 8];
  const rowZ = [118, 95, 73, 51, 31];
  rowCounts.forEach((count, row) => {
    const spacing = row === 0 ? 25 : 24;
    const offset = row % 2 ? spacing * 0.32 : 0;
    for (let i = 0; i < count; i += 1) {
      const key = box(18, 8, 17, keysMat, `key-r${row}-${i}`);
      key.position.set((i - (count - 1) / 2) * spacing + offset, 55 - row * 2.4, rowZ[row]);
      key.rotation.x = deg(-8);
      key.userData.component = COMPONENTS.keyboard;
      pickables.push(key);
      group.add(key);
    }
  });
  return group;
}

function makeRack(rackMat, toothMat, pickables) {
  const group = new THREE.Group();
  const body = box(P4.rack.length, P4.rack.bodyY, P4.rack.bodyZ, rackMat, 'IBM 1124109 rack body');
  body.position.set(0, P4.rack.y, P4.rack.z);
  addPickable(body, COMPONENTS.rack, pickables);
  group.add(body);

  const toothGeo = new THREE.BoxGeometry(CANONICAL.pitchMm * 0.46, 3.2, 4.2);
  const teeth = new THREE.InstancedMesh(toothGeo, toothMat, CANONICAL.nominalPositions);
  teeth.name = '12P rack teeth';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, deg(CANONICAL.rack.toothInclinationDeg)));
  const half = (CANONICAL.nominalPositions - 1) / 2;
  for (let i = 0; i < CANONICAL.nominalPositions; i += 1) {
    const p = new THREE.Vector3((i - half) * CANONICAL.pitchMm, P4.rack.y + 4.2, P4.rack.z + 0.2);
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    teeth.setMatrixAt(i, m);
  }
  teeth.castShadow = true;
  teeth.receiveShadow = true;
  teeth.userData.component = COMPONENTS.rack;
  pickables.push(teeth);
  group.add(teeth);
  return group;
}

function makeSelectionPath(color, points, name, pickables) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, 0.9, 8, false),
    material(color, 0.05, 0.54)
  );
  mesh.name = name;
  mesh.userData.component = COMPONENTS.selection;
  pickables.push(mesh);
  mesh.castShadow = true;
  return mesh;
}

export function createSelectricModel() {
  const root = new THREE.Group();
  root.name = 'IBM Selectric 721 — constructive public reconstruction';

  const pickables = [];
  const assemblies = [];
  const state = {
    explosion: 0,
    carrierX: -CANONICAL.writingLineMm / 2,
    tiltUnit: 0,
    rotateUnit: 0,
    ribbonLift: 0,
    printApproach: 0,
    platenIndex: 0
  };

  const shellMat = material(0xb8b4a8, 0.03, 0.76);
  const shellDark = material(0x4e514f, 0.12, 0.72);
  const keyMat = material(0xe5e1d4, 0.02, 0.66);
  const metal = material(0x9fa7aa, 0.66, 0.34);
  const darkMetal = material(0x363c40, 0.72, 0.31);
  const rackMat = material(0x686f72, 0.63, 0.38);
  const rubber = material(0x252726, 0.04, 0.88);
  const paperMat = material(0xefece1, 0.0, 0.94);
  const ballMat = material(0xb8c0c3, 0.58, 0.28);
  const ribbonMat = material(0x171716, 0.01, 0.82);

  const shellAssembly = makeAssembly('shell assembly', new THREE.Vector3(0, 0, 72));
  assemblies.push(shellAssembly);
  root.add(shellAssembly);

  const base = box(370, 20, 330, shellMat, 'base shell');
  base.position.set(0, 13, 0);
  addPickable(base, COMPONENTS.shell, pickables);
  shellAssembly.add(base);

  const leftCheek = box(25, 118, 270, shellMat, 'left shell cheek');
  leftCheek.position.set(-177, 75, -18);
  addPickable(leftCheek, COMPONENTS.shell, pickables);
  shellAssembly.add(leftCheek);

  const rightCheek = leftCheek.clone();
  rightCheek.name = 'right shell cheek';
  rightCheek.position.x = 177;
  rightCheek.userData.component = COMPONENTS.shell;
  pickables.push(rightCheek);
  shellAssembly.add(rightCheek);

  const rearCowl = box(330, 72, 72, shellMat, 'rear cowl');
  rearCowl.position.set(0, 83, -118);
  rearCowl.rotation.x = deg(-6);
  addPickable(rearCowl, COMPONENTS.shell, pickables);
  shellAssembly.add(rearCowl);

  const keyboardAssembly = makeAssembly('keyboard assembly', new THREE.Vector3(0, -18, 78));
  assemblies.push(keyboardAssembly);
  keyboardAssembly.add(makeKeyboard(keyMat, shellDark, pickables));
  root.add(keyboardAssembly);

  const frameAssembly = makeAssembly('primary frame', new THREE.Vector3(0, 6, -36));
  assemblies.push(frameAssembly);
  root.add(frameAssembly);

  for (const x of [-P4.sideframeX, P4.sideframeX]) {
    const side = box(10, 118, 174, darkMetal, x < 0 ? 'left sideframe' : 'right sideframe');
    side.position.set(x, 76, -28);
    addPickable(side, COMPONENTS.printShaft, pickables);
    frameAssembly.add(side);
  }

  const printShaft = shaft(P4.printShaft.length, P4.printShaft.visibleRadius, metal, 'IBM 1164736 print shaft / D6');
  printShaft.position.set(0, P4.printShaft.y, P4.printShaft.z);
  addPickable(printShaft, COMPONENTS.printShaft, pickables);
  frameAssembly.add(printShaft);

  frameAssembly.add(makeRack(rackMat, darkMetal, pickables));

  const driveAssembly = makeAssembly('drive assembly', new THREE.Vector3(0, -10, 42));
  assemblies.push(driveAssembly);
  root.add(driveAssembly);

  const cycle = shaft(P4.cycleShaft.length, P4.cycleShaft.radius, metal, 'cycle shaft');
  cycle.position.set(0, P4.cycleShaft.y, P4.cycleShaft.z);
  addPickable(cycle, COMPONENTS.drive, pickables);
  driveAssembly.add(cycle);

  const operational = shaft(P4.operationalShaft.length, P4.operationalShaft.radius, darkMetal, 'operational shaft');
  operational.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  addPickable(operational, COMPONENTS.drive, pickables);
  driveAssembly.add(operational);

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 58, 36), darkMetal);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(P4.motor.x, P4.motor.y, P4.motor.z);
  motor.name = 'motor';
  addPickable(motor, COMPONENTS.drive, pickables);
  driveAssembly.add(motor);

  const platenAssembly = makeAssembly('platen / paper assembly', new THREE.Vector3(0, 28, -58));
  assemblies.push(platenAssembly);
  root.add(platenAssembly);

  const platen = shaft(P4.platen.length, CANONICAL.platen.radiusMm, rubber, 'platen');
  platen.position.set(0, P4.platen.y, P4.platen.z);
  addPickable(platen, COMPONENTS.platen, pickables);
  platenAssembly.add(platen);

  for (const x of [-159, 159]) {
    const knob = shaft(28, 14, shellDark, x < 0 ? 'left platen knob' : 'right platen knob');
    knob.position.set(x, P4.platen.y, P4.platen.z);
    knob.userData.component = COMPONENTS.platen;
    pickables.push(knob);
    platenAssembly.add(knob);
  }

  const paper = box(260, 112, 1.2, paperMat, 'paper sheet');
  paper.position.set(0, 169, -102.5);
  paper.rotation.x = deg(2);
  paper.userData.component = COMPONENTS.platen;
  pickables.push(paper);
  platenAssembly.add(paper);

  const ribbonAssembly = makeAssembly('ribbon assembly', new THREE.Vector3(0, 18, 10));
  assemblies.push(ribbonAssembly);
  root.add(ribbonAssembly);
  for (const x of [-108, 108]) {
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 12, 36), ribbonMat);
    spool.rotation.x = Math.PI / 2;
    spool.position.set(x, 85, -46);
    spool.name = x < 0 ? 'left ribbon spool' : 'right ribbon spool';
    addPickable(spool, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(spool);
  }
  const ribbonStrip = box(225, 8, 1.3, ribbonMat, 'fabric ribbon span');
  ribbonStrip.position.set(0, P4.ribbon.yRest, P4.ribbon.z);
  addPickable(ribbonStrip, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(ribbonStrip);

  const selectionAssembly = makeAssembly('selection transmission', new THREE.Vector3(0, 12, 28));
  assemblies.push(selectionAssembly);
  root.add(selectionAssembly);
  selectionAssembly.add(makeSelectionPath(
    0xb06c38,
    [
      new THREE.Vector3(-143, 54, -28),
      new THREE.Vector3(-92, 67, -45),
      new THREE.Vector3(-20, 81, -49),
      new THREE.Vector3(0, 88, -52)
    ],
    'tilt selection tape',
    pickables
  ));
  selectionAssembly.add(makeSelectionPath(
    0x647f9b,
    [
      new THREE.Vector3(143, 50, -25),
      new THREE.Vector3(98, 65, -42),
      new THREE.Vector3(32, 80, -48),
      new THREE.Vector3(0, 87, -51)
    ],
    'rotate selection tape',
    pickables
  ));

  const carrierAssembly = makeAssembly('carrier assembly', new THREE.Vector3(0, 34, 20));
  assemblies.push(carrierAssembly);
  root.add(carrierAssembly);

  const carrierMotion = new THREE.Group();
  carrierMotion.name = 'carrier mechanical transform';
  carrierAssembly.add(carrierMotion);

  const carrierBody = box(P4.carrier.width, P4.carrier.height, P4.carrier.depth, darkMetal, 'carrier');
  carrierBody.position.set(0, P4.carrier.y, P4.carrier.z);
  addPickable(carrierBody, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierBody);

  const rocker = new THREE.Group();
  rocker.name = 'type-element rocker';
  rocker.position.set(0, 0, 0);
  carrierMotion.add(rocker);

  const neck = shaft(25, 3.6, metal, 'type-element support');
  neck.rotation.z = 0;
  neck.position.set(0, 101, -55);
  addPickable(neck, COMPONENTS.typeball, pickables);
  rocker.add(neck);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(CANONICAL.typeElement.nominalRadiusMm, 24, 16),
    ballMat
  );
  ball.name = 'Selectric type element';
  ball.scale.y = 0.94;
  ball.position.set(0, P4.typeball.y, P4.typeball.zRest);
  addPickable(ball, COMPONENTS.typeball, pickables);
  rocker.add(ball);

  const guide = box(74, 5, 15, rackMat, 'carrier rear guide / shoe envelope');
  guide.position.set(0, 80.5, -67);
  addPickable(guide, COMPONENTS.carrier, pickables);
  carrierMotion.add(guide);

  function setCarrierX(x) {
    state.carrierX = THREE.MathUtils.clamp(x, -CANONICAL.writingLineMm / 2, CANONICAL.writingLineMm / 2);
    carrierMotion.position.x = state.carrierX;
  }

  function setTypeball(tiltUnit, rotateUnit) {
    state.tiltUnit = tiltUnit;
    state.rotateUnit = rotateUnit;
    ball.rotation.x = deg(tiltUnit * 7.5);
    ball.rotation.y = deg(rotateUnit * 10);
  }

  function setRibbonLift(value) {
    state.ribbonLift = THREE.MathUtils.clamp(value, 0, 1);
    ribbonStrip.position.y = THREE.MathUtils.lerp(P4.ribbon.yRest, P4.ribbon.yLift, state.ribbonLift);
  }

  function setPrintApproach(value) {
    state.printApproach = THREE.MathUtils.clamp(value, 0, 1);
    rocker.position.z = THREE.MathUtils.lerp(0, P4.typeball.zImpact - P4.typeball.zRest, state.printApproach);
    rocker.rotation.x = deg(-state.printApproach * 5.5);
  }

  function setPlatenIndex(value) {
    state.platenIndex = value;
    platen.rotation.x = value;
  }

  function setExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    assemblies.forEach(group => setAssemblyExplosion(group, state.explosion));
  }

  function geometryDiagnostics() {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    return {
      revision: 'selectric-public-foundation-v1',
      finite: [size.x, size.y, size.z].every(Number.isFinite),
      bounds: { width: size.x, height: size.y, depth: size.z },
      carrierX: state.carrierX,
      pitchMm: CANONICAL.pitchMm,
      writingLineMm: CANONICAL.writingLineMm,
      explosion: state.explosion,
      pickableCount: pickables.length,
      provenance: CANONICAL.provenance
    };
  }

  setCarrierX(state.carrierX);
  setTypeball(0, 0);
  setRibbonLift(0);
  setPrintApproach(0);
  setExplosion(0);

  return {
    root,
    pickables,
    state,
    setCarrierX,
    setTypeball,
    setRibbonLift,
    setPrintApproach,
    setPlatenIndex,
    setExplosion,
    geometryDiagnostics
  };
}
