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

function pulley(radius, width, mat, name) {
  const mesh = shaft(width, radius, mat, name);
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

function dynamicTube(color, radius, name, component, pickables) {
  const mesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    material(color, 0.05, 0.54)
  );
  mesh.name = name;
  mesh.userData.component = component;
  mesh.castShadow = true;
  pickables.push(mesh);
  return {
    mesh,
    update(points) {
      const old = mesh.geometry;
      mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 56, radius, 8, false);
      old.dispose();
    }
  };
}

function makeKeyboard(keysMat, darkMat, pickables) {
  const group = new THREE.Group();
  const deck = box(340, 17, 142, darkMat, 'keyboard deck');
  deck.position.set(0, P4.keyboard.y, P4.keyboard.z);
  deck.rotation.x = deg(-7);
  addPickable(deck, COMPONENTS.keyboard, pickables);
  group.add(deck);

  const frontApron = box(346, 25, 42, darkMat, 'keyboard front apron');
  frontApron.position.set(0, 34, 139);
  frontApron.rotation.x = deg(-11);
  addPickable(frontApron, COMPONENTS.shell, pickables);
  group.add(frontApron);

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

  const topRail = box(P4.rack.length, 2.4, 5.2, rackMat, 'rack upper shoe surface R_top');
  topRail.position.set(0, P4.rack.y + 4.0, P4.rack.z - 1.0);
  addPickable(topRail, COMPONENTS.rack, pickables);
  group.add(topRail);

  const bottomRail = box(P4.rack.length, 2.2, 5.4, rackMat, 'rack lower shoe surface R_bottom / D8');
  bottomRail.position.set(0, P4.rack.y - 4.0, P4.rack.z - 1.0);
  addPickable(bottomRail, COMPONENTS.rack, pickables);
  group.add(bottomRail);

  const toothGeo = new THREE.BoxGeometry(CANONICAL.pitchMm * 0.46, 3.2, 4.2);
  const teeth = new THREE.InstancedMesh(toothGeo, toothMat, CANONICAL.nominalPositions);
  teeth.name = '12P rack teeth';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, deg(CANONICAL.rack.toothInclinationDeg)));
  const half = (CANONICAL.nominalPositions - 1) / 2;
  for (let i = 0; i < CANONICAL.nominalPositions; i += 1) {
    const p = new THREE.Vector3((i - half) * CANONICAL.pitchMm, P4.rack.y + 4.2, P4.rack.z + 2.2);
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

function makeTypeElement(ballMat, darkMetal, pickables) {
  const group = new THREE.Group();
  group.name = 'Selectric type element assembly';

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(CANONICAL.typeElement.structuralRadiusP4Mm, 32, 20),
    ballMat
  );
  body.scale.y = 0.90;
  body.name = 'type element structural body';
  addPickable(body, COMPONENTS.typeball, pickables);
  group.add(body);

  const boss = new THREE.Mesh(
    new THREE.CylinderGeometry(
      CANONICAL.typeElement.bossOuterRadiusP4Mm,
      CANONICAL.typeElement.bossOuterRadiusP4Mm,
      CANONICAL.typeElement.bossHeightP4Mm,
      24
    ),
    darkMetal
  );
  boss.position.y = CANONICAL.typeElement.topAboveCenterP4Mm + 2.2;
  boss.name = 'type element mounting boss';
  addPickable(boss, COMPONENTS.typeball, pickables);
  group.add(boss);

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(15.2, 16.0, CANONICAL.typeElement.skirtHeightP4Mm, 44, 1, true),
    darkMetal
  );
  skirt.position.y = -13.8;
  skirt.name = 'type element detent skirt';
  addPickable(skirt, COMPONENTS.typeball, pickables);
  group.add(skirt);

  const slugGeo = new THREE.BoxGeometry(2.9, 2.6, 1.35);
  const slugs = new THREE.InstancedMesh(slugGeo, darkMetal, CANONICAL.typeElement.characterCount);
  slugs.name = '88 type slug cues';
  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3(1,1,1);
  let index = 0;
  const bandLatitudes = [-0.58, -0.20, 0.20, 0.58];
  for (let band = 0; band < 4; band += 1) {
    const lat = bandLatitudes[band];
    const y = lat * 13.5;
    const radial = Math.sqrt(Math.max(1, CANONICAL.typeElement.structuralRadiusP4Mm ** 2 - y ** 2));
    for (let slot = 0; slot < 22; slot += 1) {
      const a = slot * Math.PI * 2 / 22;
      const p = new THREE.Vector3(Math.sin(a) * radial, y, Math.cos(a) * radial);
      q.setFromEuler(new THREE.Euler(-lat * 0.45, a, 0));
      matrix.compose(p, q, scale);
      slugs.setMatrixAt(index++, matrix);
    }
  }
  slugs.userData.component = COMPONENTS.typeball;
  slugs.castShadow = true;
  pickables.push(slugs);
  group.add(slugs);

  return group;
}

function makePaper(pickables) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(260, 112), mat);
  mesh.name = 'paper sheet';
  mesh.position.set(0, 169, -110);
  mesh.userData.component = COMPONENTS.paper;
  pickables.push(mesh);

  function clear() {
    ctx.fillStyle = '#eee9db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#dad2c1';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    texture.needsUpdate = true;
  }

  function stamp(character, carrierX, line) {
    const usableW = canvas.width - 120;
    const normalized = (carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.writingLineMm;
    const x = 60 + THREE.MathUtils.clamp(normalized, 0, 1) * usableW;
    const y = 86 + Math.max(0, line) * 45;
    ctx.fillStyle = '#1a1b1a';
    ctx.font = 'bold 32px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character || '•', x, y);
    texture.needsUpdate = true;
  }

  clear();
  return { mesh, clear, stamp };
}

export function createSelectricModel() {
  const root = new THREE.Group();
  root.name = 'IBM Selectric 721 — constructive public reconstruction';

  const pickables = [];
  const assemblies = [];
  const state = {
    explosion: 0,
    carrierX: -CANONICAL.writingLineMm / 2,
    tiltBand: 0,
    rotateUnit: 0,
    shiftHemisphere: 0,
    ribbonLift: 0,
    printApproach: 0,
    platenIndex: 0,
    cyclePhase: 0
  };

  const shellMat = material(0xb8b4a8, 0.03, 0.76);
  const shellDark = material(0x4e514f, 0.12, 0.72);
  const keyMat = material(0xe5e1d4, 0.02, 0.66);
  const metal = material(0x9fa7aa, 0.66, 0.34);
  const darkMetal = material(0x363c40, 0.72, 0.31);
  const rackMat = material(0x686f72, 0.63, 0.38);
  const rubber = material(0x252726, 0.04, 0.88);
  const ballMat = material(0xb8c0c3, 0.58, 0.28);
  const ribbonMat = material(0x171716, 0.01, 0.82);
  const shoeMat = material(0xd5d0bd, 0.02, 0.78);

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

  const rearLip = box(334, 18, 52, shellMat, 'platen rear shell lip');
  rearLip.position.set(0, 115, -128);
  rearLip.rotation.x = deg(-10);
  addPickable(rearLip, COMPONENTS.shell, pickables);
  shellAssembly.add(rearLip);

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

    const plate = box(4.5, 31, 35, metal, x < 0 ? 'IBM 1135590 LH bearing plate' : 'IBM 1135591 RH bearing plate');
    plate.position.set(x + (x < 0 ? 5.6 : -5.6), P4.printShaft.y, P4.printShaft.z);
    addPickable(plate, COMPONENTS.bearing, pickables);
    frameAssembly.add(plate);

    const bearing = new THREE.Mesh(
      new THREE.SphereGeometry(CANONICAL.printShaft.bearingOuterSphereMm / 2, 24, 14),
      darkMetal
    );
    bearing.scale.x = CANONICAL.printShaft.bearingLengthMm / CANONICAL.printShaft.bearingOuterSphereMm;
    bearing.position.set(x, P4.printShaft.y, P4.printShaft.z);
    bearing.name = 'IBM 1164740 spherical bearing';
    addPickable(bearing, COMPONENTS.bearing, pickables);
    frameAssembly.add(bearing);
  }

  const printShaft = shaft(P4.printShaft.length, P4.printShaft.visibleRadius, metal, 'IBM 1164736 print shaft / D6');
  printShaft.position.set(0, P4.printShaft.y, P4.printShaft.z);
  addPickable(printShaft, COMPONENTS.printShaft, pickables);
  frameAssembly.add(printShaft);
  frameAssembly.add(makeRack(rackMat, darkMetal, pickables));

  const driveAssembly = makeAssembly('drive assembly', new THREE.Vector3(0, -10, 42));
  assemblies.push(driveAssembly);
  root.add(driveAssembly);

  const cycleRotor = new THREE.Group();
  cycleRotor.position.set(0, P4.cycleShaft.y, P4.cycleShaft.z);
  driveAssembly.add(cycleRotor);
  const cycle = shaft(P4.cycleShaft.length, P4.cycleShaft.radius, metal, 'cycle shaft');
  addPickable(cycle, COMPONENTS.drive, pickables);
  cycleRotor.add(cycle);
  for (const x of [-94, 12, 97]) {
    const cam = pulley(12, 8, darkMetal, 'cycle shaft cam');
    cam.position.x = x;
    cam.scale.y = 0.72;
    addPickable(cam, COMPONENTS.drive, pickables);
    cycleRotor.add(cam);
  }

  const operational = shaft(P4.operationalShaft.length, P4.operationalShaft.radius, darkMetal, 'operational shaft');
  operational.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  addPickable(operational, COMPONENTS.drive, pickables);
  driveAssembly.add(operational);
  for (const x of [-85, -28, 34, 86]) {
    const cam = pulley(10, 7, metal, 'operational shaft cam');
    cam.position.set(x, P4.operationalShaft.y, P4.operationalShaft.z);
    cam.scale.y = 0.75;
    addPickable(cam, COMPONENTS.drive, pickables);
    driveAssembly.add(cam);
  }

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 58, 36), darkMetal);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(P4.motor.x, P4.motor.y, P4.motor.z);
  motor.name = 'motor';
  addPickable(motor, COMPONENTS.drive, pickables);
  driveAssembly.add(motor);

  const drivePulley = pulley(18, 10, darkMetal, 'motor drive pulley');
  drivePulley.position.set(-145, 39, 42);
  addPickable(drivePulley, COMPONENTS.drive, pickables);
  driveAssembly.add(drivePulley);
  const cyclePulley = pulley(22, 11, darkMetal, 'cycle clutch pulley');
  cyclePulley.position.set(-145, P4.cycleShaft.y, P4.cycleShaft.z);
  addPickable(cyclePulley, COMPONENTS.drive, pickables);
  driveAssembly.add(cyclePulley);
  const driveBelt = dynamicTube(0x222221, 2.2, 'motor belt', COMPONENTS.drive, pickables);
  driveBelt.update([
    new THREE.Vector3(-145, 39, 58),
    new THREE.Vector3(-145, 44, 48),
    new THREE.Vector3(-145, P4.cycleShaft.y, P4.cycleShaft.z + 19),
    new THREE.Vector3(-145, 39, 58)
  ]);
  driveAssembly.add(driveBelt.mesh);

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

  const paper = makePaper(pickables);
  platenAssembly.add(paper.mesh);

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

  for (const x of [-143, 143]) {
    const p1 = pulley(11, 7, metal, x < 0 ? 'left selection pulley' : 'right selection pulley');
    p1.position.set(x, 59, -31);
    addPickable(p1, COMPONENTS.selection, pickables);
    selectionAssembly.add(p1);
    const p2 = pulley(8, 6, darkMetal, x < 0 ? 'left return pulley' : 'right return pulley');
    p2.position.set(x, 75, -48);
    addPickable(p2, COMPONENTS.selection, pickables);
    selectionAssembly.add(p2);
  }

  const tiltTape = dynamicTube(0xb06c38, 0.9, 'IBM 1164314 7X1 gearless tilt tape presentation', COMPONENTS.selection, pickables);
  const rotateTape = dynamicTube(0x647f9b, 0.9, 'IBM 1134811 7X1 rotate tape presentation', COMPONENTS.selection, pickables);
  selectionAssembly.add(tiltTape.mesh, rotateTape.mesh);

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

  const printSleeveRotor = new THREE.Group();
  printSleeveRotor.position.set(0, P4.printShaft.y, P4.printShaft.z);
  carrierMotion.add(printSleeveRotor);
  const sleeve = shaft(P4.carrierLocal.sleeveLength, P4.carrierLocal.sleeveRadius, metal, 'IBM 1141628 print sleeve');
  addPickable(sleeve, COMPONENTS.sleeve, pickables);
  printSleeveRotor.add(sleeve);

  const camDefs = [
    [-19, 10.4, 5.5, 'ribbon-lift cam'],
    [-4, 11.6, 7.0, 'IBM 1164240 combined ribbon-feed/detent cam'],
    [14, 13.0, 8.5, 'IBM 1124174 double print/restoring cam']
  ];
  for (const [x, radius, width, name] of camDefs) {
    const cam = pulley(radius, width, darkMetal, name);
    cam.position.x = x;
    cam.scale.y = name.includes('print') ? 0.68 : 0.78;
    addPickable(cam, COMPONENTS.sleeve, pickables);
    printSleeveRotor.add(cam);
  }

  for (const x of [-P4.carrierLocal.bearingX, P4.carrierLocal.bearingX]) {
    const localBearing = pulley(10.5, 7, shoeMat, x < 0 ? 'left carrier sleeve bearing' : 'right carrier sleeve bearing');
    localBearing.position.set(x, P4.printShaft.y, P4.printShaft.z);
    addPickable(localBearing, COMPONENTS.sleeve, pickables);
    carrierMotion.add(localBearing);
  }

  const bracket = box(68, 5.5, 26, metal, 'carrier-parented escapement bracket');
  bracket.position.set(0, P4.carrierLocal.escapementBracketY, P4.carrierLocal.escapementBracketZ);
  addPickable(bracket, COMPONENTS.escapementBracket, pickables);
  carrierMotion.add(bracket);

  const pawl = box(10, 11, 3.5, darkMetal, 'escapement pawl');
  pawl.position.set(-25, P4.rack.y + 4.7, P4.rack.z + 4.5);
  pawl.rotation.z = deg(-14);
  addPickable(pawl, COMPONENTS.escapementBracket, pickables);
  carrierMotion.add(pawl);

  const supportPlate = box(34, 26, 3.5, metal, 'Level-2 rear support plate');
  supportPlate.position.set(0, P4.carrierLocal.supportPlateY, P4.carrierLocal.supportPlateZ);
  addPickable(supportPlate, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(supportPlate);

  const upperShoe = box(18, 3.2, 7, shoeMat, 'IBM 1141770 upper shoe');
  upperShoe.position.set(0, P4.rack.y + 5.7, P4.rack.z - 1);
  addPickable(upperShoe, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(upperShoe);

  const lowerShoe = box(18, 3.2, 7, shoeMat, 'IBM 1147260 lower shoe assembly');
  lowerShoe.position.set(0, P4.rack.y - 5.7, P4.rack.z - 1);
  addPickable(lowerShoe, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(lowerShoe);

  const spring = box(4, 18, 1.5, darkMetal, 'IBM 1141985 rear support leaf spring');
  spring.position.set(12, 87, -68.5);
  spring.rotation.z = deg(18);
  addPickable(spring, COMPONENTS.rearSupport, pickables);
  carrierMotion.add(spring);

  const rocker = new THREE.Group();
  rocker.name = 'type-element rocker';
  carrierMotion.add(rocker);

  const neck = shaft(25, 3.6, metal, 'type-element support');
  neck.rotation.z = 0;
  neck.position.set(0, 101, -55);
  addPickable(neck, COMPONENTS.typeball, pickables);
  rocker.add(neck);

  const typeElement = makeTypeElement(ballMat, darkMetal, pickables);
  typeElement.position.set(0, P4.typeball.y, P4.typeball.zRest);
  rocker.add(typeElement);

  const carrierTiltPulley = pulley(8.5, 5.5, metal, 'carrier gearless tilt pulley');
  carrierTiltPulley.position.set(-21, 91, -42);
  addPickable(carrierTiltPulley, COMPONENTS.selection, pickables);
  carrierMotion.add(carrierTiltPulley);

  const carrierRotatePulley = pulley(8.5, 5.5, darkMetal, 'carrier rotate pulley');
  carrierRotatePulley.position.set(21, 91, -42);
  addPickable(carrierRotatePulley, COMPONENTS.selection, pickables);
  carrierMotion.add(carrierRotatePulley);

  function updateSelectionTapes() {
    const x = state.carrierX;
    tiltTape.update([
      new THREE.Vector3(-143, 59, -31),
      new THREE.Vector3(-143, 75, -48),
      new THREE.Vector3(x - 21, 91, -42),
      new THREE.Vector3(143, 75, -48)
    ]);
    rotateTape.update([
      new THREE.Vector3(143, 59, -31),
      new THREE.Vector3(143, 75, -48),
      new THREE.Vector3(x + 21, 91, -42),
      new THREE.Vector3(-143, 75, -48)
    ]);
  }

  function setCarrierX(x) {
    state.carrierX = THREE.MathUtils.clamp(x, -CANONICAL.writingLineMm / 2, CANONICAL.writingLineMm / 2);
    carrierMotion.position.x = state.carrierX;
    updateSelectionTapes();
  }

  function setTypeball(tiltBand, rotateUnit, shiftHemisphere = state.shiftHemisphere) {
    state.tiltBand = THREE.MathUtils.clamp(tiltBand, 0, 3);
    state.rotateUnit = THREE.MathUtils.clamp(rotateUnit, -5, 5);
    state.shiftHemisphere = shiftHemisphere ? 1 : 0;
    typeElement.rotation.x = deg(state.tiltBand * 7.5);
    typeElement.rotation.y = deg(state.rotateUnit * 10 + state.shiftHemisphere * 180);
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

  function setCyclePhase(value) {
    state.cyclePhase = THREE.MathUtils.clamp(value, 0, 1);
    cycleRotor.rotation.x = state.cyclePhase * Math.PI;
    printSleeveRotor.rotation.x = state.cyclePhase * Math.PI * 2;
  }

  function setExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    assemblies.forEach(group => setAssemblyExplosion(group, state.explosion));
  }

  function stampCharacter(character, line) {
    paper.stamp(character, state.carrierX, line);
  }

  function clearPaper() {
    paper.clear();
  }

  function geometryDiagnostics() {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    return {
      revision: 'selectric-public-foundation-v2',
      finite: [size.x, size.y, size.z].every(Number.isFinite),
      bounds: { width: size.x, height: size.y, depth: size.z },
      carrierX: state.carrierX,
      pitchMm: CANONICAL.pitchMm,
      writingLineMm: CANONICAL.writingLineMm,
      explosion: state.explosion,
      pickableCount: pickables.length,
      supportTopology: 'D6 front + Level-2 upper/lower rack shoes',
      sleeveCamOrder: ['ribbon-lift', '1164240-feed-detent', '1124174-print-restoring'],
      provenance: CANONICAL.provenance
    };
  }

  setCarrierX(state.carrierX);
  setTypeball(0, 0, 0);
  setRibbonLift(0);
  setPrintApproach(0);
  setCyclePhase(0);
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
    setCyclePhase,
    setExplosion,
    stampCharacter,
    clearPaper,
    geometryDiagnostics
  };
}
