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

function loftPrism(stations, mat, name) {
  const vertices = [];
  const indices = [];
  for (const station of stations) {
    vertices.push(
      -station.halfWidth, station.bottomY, station.z,
       station.halfWidth, station.bottomY, station.z,
       station.halfWidth, station.topY, station.z,
      -station.halfWidth, station.topY, station.z
    );
  }
  const quad = (a,b,c,d) => indices.push(a,b,c, a,c,d);
  for (let i = 0; i < stations.length - 1; i += 1) {
    const a = i * 4, b = (i + 1) * 4;
    quad(a, b, b+1, a+1);
    quad(a+1, b+1, b+2, a+2);
    quad(a+2, b+2, b+3, a+3);
    quad(a+3, b+3, b, a);
  }
  quad(0,1,2,3);
  const e = (stations.length - 1) * 4;
  quad(e+3,e+2,e+1,e);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const loftMat = mat.clone();
  loftMat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, loftMat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function extrudedSideCheek(profile, innerX, outerX, mat, name) {
  const shape = new THREE.Shape();
  profile.forEach((point, index) => {
    const localX = -point.z;
    if (index === 0) shape.moveTo(localX, point.y);
    else shape.lineTo(localX, point.y);
  });
  shape.closePath();
  const thickness = outerX - innerX;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 1.8,
    bevelSize: 1.8,
    bevelSegments: 3,
    curveSegments: 3
  });
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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

function keyLabelTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0eee5';
  ctx.font = label.length > 4 ? '700 19px ui-sans-serif, sans-serif' : '700 28px ui-sans-serif, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeKeyboard(keysMat, darkMat, pickables) {
  const group = new THREE.Group();
  const keyMeshes = new Map();
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

  function addLabeledKey(keyText, x, y, z, width = 18, depth = 17, name = null) {
    const key = box(width, 8, depth, keysMat, name || ('key-' + keyText));
    key.position.set(x, y, z);
    key.rotation.x = deg(-8);
    key.userData.component = COMPONENTS.keyboard;
    key.userData.baseY = y;
    pickables.push(key);

    const labelMaterial = new THREE.MeshBasicMaterial({
      map: keyLabelTexture(keyText),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(12, width - 4), 7.4), labelMaterial);
    labelPlane.rotation.x = -Math.PI / 2;
    labelPlane.position.y = 4.15;
    labelPlane.name = 'key label ' + keyText;
    key.add(labelPlane);
    group.add(key);
    const mapKey = keyText === '' ? 'SPACE' : keyText.toUpperCase();
    if (!keyMeshes.has(mapKey)) keyMeshes.set(mapKey, key);
    return key;
  }

  const rows = [
    ['1','2','3','4','5','6','7','8','9','0','-','='],
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L',';'],
    ['Z','X','C','V','B','N','M',',','.','/']
  ];
  const rowZ = [116, 92, 69, 47];
  rows.forEach((labels, row) => {
    const count = labels.length;
    const spacing = row === 0 ? 22.5 : 24;
    const offset = row === 1 ? 3 : row === 2 ? 9 : 15;
    for (let i = 0; i < count; i += 1) {
      addLabeledKey(
        labels[i],
        (i - (count - 1) / 2) * spacing + offset,
        55 - row * 2.8,
        rowZ[row]
      );
    }
  });

  addLabeledKey('TAB', -145, 49, 92, 24);
  addLabeledKey('CLR', -145, 46, 68, 24);
  addLabeledKey('LOCK', -145, 43, 46, 24);
  addLabeledKey('SHIFT', -145, 40, 24, 28);

  addLabeledKey('BKSP', 145, 49, 92, 28);
  addLabeledKey('RETURN', 145, 46, 65, 32);
  addLabeledKey('SHIFT', 145, 41, 32, 28);

  const spacebar = addLabeledKey('', 0, 39, 23, 112, 18, 'spacebar');
  spacebar.position.x = -2;

  group.keyMeshes = keyMeshes;
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
    carrierX: 0,
    tiltBand: 0,
    rotateUnit: 0,
    shiftHemisphere: 0,
    ribbonLift: 0,
    printApproach: 0,
    platenIndex: 0,
    cyclePhase: 0,
    keyboardCode: 0,
    cordPhase: 0,
    serviceCoverOpen: 0,
    selectorInputs: { T1: 0, T2: 0, R1: 0, R2: 0, R2A: 0, fiveUnit: 0 },
    ribbonFeedStep: 0,
    ribbonFeedApproxRatchetTeeth: 0,
    ribbonFeedDirection: 1,
    motorPhase: 0,
    keyboardPressCharacter: null,
    keyboardPress: 0,
    operationalCamAction: 'rest',
    operationalCamPhase: 0,
    backspaceLinkage: 0
  };

  const shellMat = material(0xb8b4a8, 0.03, 0.76);
  const shellDark = material(0x4e514f, 0.12, 0.72);
  const keyMat = material(0x252826, 0.03, 0.72);
  const metal = material(0x9fa7aa, 0.66, 0.34);
  const darkMetal = material(0x363c40, 0.72, 0.31);
  const rackMat = material(0x686f72, 0.63, 0.38);
  const rubber = material(0x252726, 0.04, 0.88);
  const ballMat = material(0xb8c0c3, 0.58, 0.28);
  const ribbonMat = material(0x171716, 0.01, 0.82);
  const shoeMat = material(0xd5d0bd, 0.02, 0.78);

  const shellAssembly = makeAssembly('shell assembly', new THREE.Vector3(0, 150, -135));
  assemblies.push(shellAssembly);
  root.add(shellAssembly);

  const base = box(370, 20, 330, shellMat, 'base shell');
  base.position.set(0, 13, 0);
  addPickable(base, COMPONENTS.shell, pickables);
  shellAssembly.add(base);

  const cheekProfile = [
    { z: 162, y: 22 },
    { z: 162, y: 42 },
    { z: 150, y: 50 },
    { z: 128, y: 56 },
    { z: 103, y: 66 },
    { z: 76, y: 78 },
    { z: 52, y: 91 },
    { z: 32, y: 106 },
    { z: 15, y: 119 },
    { z: -16, y: 135 },
    { z: -55, y: 147 },
    { z: -102, y: 148 },
    { z: -143, y: 132 },
    { z: -163, y: 102 },
    { z: -166, y: 22 }
  ];
  const rightCheek = extrudedSideCheek(cheekProfile, 156, 182, shellMat, 'right rounded shell cheek');
  rightCheek.position.x = 156;
  addPickable(rightCheek, COMPONENTS.shell, pickables);
  shellAssembly.add(rightCheek);
  const leftCheek = extrudedSideCheek(cheekProfile, 156, 182, shellMat, 'left rounded shell cheek');
  leftCheek.position.x = -182;
  addPickable(leftCheek, COMPONENTS.shell, pickables);
  shellAssembly.add(leftCheek);

  const serviceCoverPivot = new THREE.Group();
  serviceCoverPivot.name = 'top service cover hinge presentation';
  serviceCoverPivot.position.set(0, 122, -142);
  shellAssembly.add(serviceCoverPivot);

  const frontFascia = loftPrism([
    { z: 38, halfWidth: 158, bottomY: 70, topY: 85 },
    { z: 18, halfWidth: 161, bottomY: 73, topY: 92 },
    { z: -8, halfWidth: 164, bottomY: 78, topY: 106 },
    { z: -34, halfWidth: 169, bottomY: 84, topY: 129 },
    { z: -58, halfWidth: 170, bottomY: 93, topY: 144 },
    { z: -72, halfWidth: 168, bottomY: 104, topY: 149 }
  ], shellMat, 'service cover hood');
  frontFascia.position.set(0, -122, 142);
  addPickable(frontFascia, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(frontFascia);

  const rearBridge = box(308, 13, 13, shellMat, 'service-cover rear bridge');
  rearBridge.position.set(0, 12, 65);
  addPickable(rearBridge, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(rearBridge);

  const badgeMat = material(0x233b55, 0.28, 0.42);
  const badge = box(30, 8, 2, badgeMat, 'IBM badge');
  badge.position.set(0, -18, 154);
  badge.rotation.x = deg(-31);
  addPickable(badge, COMPONENTS.shell, pickables);
  serviceCoverPivot.add(badge);

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

  const ruler = box(268, 6, 5, metal, '12-CPI writing-position rule');
  ruler.position.set(0, 82, 30);
  addPickable(ruler, COMPONENTS.horizontalMotion, pickables);
  shellAssembly.add(ruler);

  const tickGeometry = new THREE.BoxGeometry(0.42, 4.2, 1.0);
  const tickMaterial = material(0x252a2b, 0.15, 0.5);
  const ticks = new THREE.InstancedMesh(tickGeometry, tickMaterial, CANONICAL.nominalPositions);
  ticks.name = 'writing-position rule ticks';
  const tickMatrix = new THREE.Matrix4();
  for (let i = 0; i < CANONICAL.nominalPositions; i += 1) {
    const x = (i - (CANONICAL.nominalPositions - 1) / 2) * CANONICAL.pitchMm;
    const tickScale = new THREE.Vector3(1, i % 10 === 0 ? 1.55 : i % 5 === 0 ? 1.25 : 0.85, 1);
    tickMatrix.compose(new THREE.Vector3(x, 84, 27.2), new THREE.Quaternion(), tickScale);
    ticks.setMatrixAt(i, tickMatrix);
  }
  ticks.userData.component = COMPONENTS.horizontalMotion;
  pickables.push(ticks);
  shellAssembly.add(ticks);

  const indicator = box(3.5, 8, 4, material(0xa64032, 0.1, 0.52), 'writing-position indicator');
  indicator.position.set(0, 85, 25.5);
  addPickable(indicator, COMPONENTS.horizontalMotion, pickables);
  shellAssembly.add(indicator);

  const keyboardAssembly = makeAssembly('keyboard assembly', new THREE.Vector3(0, -46, 155));
  assemblies.push(keyboardAssembly);
  const keyboardSurface = makeKeyboard(keyMat, shellDark, pickables);
  keyboardAssembly.add(keyboardSurface);
  root.add(keyboardAssembly);
  const keyMeshes = keyboardSurface.keyMeshes;

  const selectorBailMaterials = [];
  const selectorBails = [];
  const keyboardMechanismAssembly = makeAssembly('keyboard code mechanism', new THREE.Vector3(0, -78, 62));
  assemblies.push(keyboardMechanismAssembly);
  root.add(keyboardMechanismAssembly);

  const keyleverGeometry = new THREE.BoxGeometry(3.0, 2.4, 82);
  const keylevers = new THREE.InstancedMesh(keyleverGeometry, darkMetal, 51);
  keylevers.name = 'repeated keylevers';
  const leverMatrix = new THREE.Matrix4();
  const leverQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(-8), 0, 0));
  const leverScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 51; i += 1) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    const x = (col - 5) * 24 + (row % 2 ? 7 : 0);
    const p = new THREE.Vector3(x, 31 - row * 1.2, 54 - row * 16);
    leverMatrix.compose(p, leverQuat, leverScale);
    keylevers.setMatrixAt(i, leverMatrix);
  }
  keylevers.castShadow = true;
  keylevers.userData.component = COMPONENTS.keyboardMechanism;
  pickables.push(keylevers);
  keyboardMechanismAssembly.add(keylevers);

  const interposerGeometry = new THREE.BoxGeometry(3.2, 2.2, 54);
  const interposers = new THREE.InstancedMesh(interposerGeometry, metal, 51);
  interposers.name = 'character interposers';
  for (let i = 0; i < 51; i += 1) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    const x = (col - 5) * 24 + (row % 2 ? 7 : 0);
    leverMatrix.compose(new THREE.Vector3(x, 27 - row * 0.8, 6 - row * 10), new THREE.Quaternion(), leverScale);
    interposers.setMatrixAt(i, leverMatrix);
  }
  interposers.castShadow = true;
  interposers.userData.component = COMPONENTS.keyboardMechanism;
  pickables.push(interposers);
  keyboardMechanismAssembly.add(interposers);

  for (let channel = 0; channel < 6; channel += 1) {
    const bailMat = material(0x7d8486, 0.58, 0.35);
    selectorBailMaterials.push(bailMat);
    const bail = box(286, 2.5, 4.2, bailMat, 'selector bail C' + (channel + 1));
    bail.position.set(0, 28 + channel * 4.0, -6 - channel * 5.0);
    bail.userData.baseY = bail.position.y;
    bail.userData.baseZ = bail.position.z;
    addPickable(bail, COMPONENTS.keyboardMechanism, pickables);
    keyboardMechanismAssembly.add(bail);
    selectorBails.push(bail);
  }

  const filterShaftRotor = new THREE.Group();
  filterShaftRotor.position.set(0, 32, 18);
  filterShaftRotor.name = 'filter shaft rotational frame';
  keyboardMechanismAssembly.add(filterShaftRotor);
  const filterShaft = shaft(294, 3.4, darkMetal, 'filter shaft');
  addPickable(filterShaft, COMPONENTS.keyboardMechanism, pickables);
  filterShaftRotor.add(filterShaft);
  const filterBlade = box(18, 3, 8, metal, 'filter-shaft pickup blade cue');
  filterBlade.position.set(0, 6, 0);
  addPickable(filterBlade, COMPONENTS.keyboardMechanism, pickables);
  filterShaftRotor.add(filterBlade);

  const latchBail = box(286, 4.5, 9, metal, 'selector latch bail');
  latchBail.position.set(0, 45, -42);
  addPickable(latchBail, COMPONENTS.keyboardMechanism, pickables);
  keyboardMechanismAssembly.add(latchBail);

  const frameAssembly = makeAssembly('primary frame', new THREE.Vector3(0, -24, -92));
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

  const printShaftRotor = new THREE.Group();
  printShaftRotor.name = 'D6 print-shaft rotational frame';
  printShaftRotor.position.set(0, P4.printShaft.y, P4.printShaft.z);
  frameAssembly.add(printShaftRotor);

  const printShaft = shaft(P4.printShaft.length, P4.printShaft.visibleRadius, metal, 'IBM 1164736 print shaft / D6');
  addPickable(printShaft, COMPONENTS.printShaft, pickables);
  printShaftRotor.add(printShaft);

  const currentGear = shaft(13, 14, darkMetal, 'IBM 1164739 current print-shaft gear envelope');
  currentGear.position.x = P4.sideframeX - 16;
  addPickable(currentGear, COMPONENTS.d6CurrentSet, pickables);
  printShaftRotor.add(currentGear);

  const cClip = new THREE.Mesh(
    new THREE.TorusGeometry(P4.printShaft.visibleRadius + 1.3, 0.9, 8, 28, Math.PI * 1.72),
    metal
  );
  cClip.rotation.y = Math.PI / 2;
  cClip.position.x = -P4.sideframeX + 14;
  cClip.name = 'item-51 C-clip presentation · IBM 1175220 US / 6520762 WT';
  addPickable(cClip, COMPONENTS.d6CurrentSet, pickables);
  printShaftRotor.add(cClip);

  const shaftPhaseMarker = box(8, 2, 2, darkMetal, 'P5 D6 phase marker');
  shaftPhaseMarker.position.set(0, P4.printShaft.visibleRadius + 1.6, 0);
  addPickable(shaftPhaseMarker, COMPONENTS.printShaft, pickables);
  printShaftRotor.add(shaftPhaseMarker);

  frameAssembly.add(makeRack(rackMat, darkMetal, pickables));

  const driveAssembly = makeAssembly('drive assembly', new THREE.Vector3(-108, -34, 38));
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

  const operationalRotor = new THREE.Group();
  operationalRotor.name = 'continuously rotating operational shaft frame';
  operationalRotor.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  driveAssembly.add(operationalRotor);
  const operational = shaft(P4.operationalShaft.length, P4.operationalShaft.radius, darkMetal, 'operational shaft');
  addPickable(operational, COMPONENTS.drive, pickables);
  operationalRotor.add(operational);
  const operationalPhaseMarker = box(10, 2.4, 2.4, metal, 'operational shaft phase marker');
  operationalPhaseMarker.position.set(-110, P4.operationalShaft.radius + 2, 0);
  addPickable(operationalPhaseMarker, COMPONENTS.drive, pickables);
  operationalRotor.add(operationalPhaseMarker);

  const operationalCamFrame = new THREE.Group();
  operationalCamFrame.name = 'clutched operational service cams';
  operationalCamFrame.position.set(0, P4.operationalShaft.y, P4.operationalShaft.z);
  driveAssembly.add(operationalCamFrame);

  const doubleServiceCam = new THREE.Group();
  doubleServiceCam.position.x = -44;
  doubleServiceCam.name = 'space/backspace double-lobed 180-degree service cam';
  operationalCamFrame.add(doubleServiceCam);
  const doubleHub = pulley(10.5, 8, metal, 'space/backspace cam hub');
  addPickable(doubleHub, COMPONENTS.drive, pickables);
  doubleServiceCam.add(doubleHub);
  for (const angle of [0, Math.PI]) {
    const lobe = box(8, 7, 5, darkMetal, 'space/backspace cam lobe');
    lobe.position.set(0, Math.cos(angle) * 10, Math.sin(angle) * 10);
    lobe.rotation.x = angle;
    addPickable(lobe, COMPONENTS.drive, pickables);
    doubleServiceCam.add(lobe);
  }

  const returnIndexCam = new THREE.Group();
  returnIndexCam.position.x = 22;
  returnIndexCam.name = 'carrier-return/index single-lobed 360-degree service cam';
  operationalCamFrame.add(returnIndexCam);
  const returnHub = pulley(11.5, 9, metal, 'carrier-return/index cam hub');
  addPickable(returnHub, COMPONENTS.drive, pickables);
  returnIndexCam.add(returnHub);
  const returnLobe = box(9, 8, 6, darkMetal, 'carrier-return/index cam lobe');
  returnLobe.position.set(0, 11, 0);
  addPickable(returnLobe, COMPONENTS.drive, pickables);
  returnIndexCam.add(returnLobe);

  const shiftCam = new THREE.Group();
  shiftCam.position.x = 84;
  shiftCam.name = 'dedicated shift 180-degree cam';
  operationalCamFrame.add(shiftCam);
  const shiftHub = pulley(9.5, 8, metal, 'shift cam hub');
  addPickable(shiftHub, COMPONENTS.drive, pickables);
  shiftCam.add(shiftHub);
  const shiftLobe = box(8, 7, 5, darkMetal, 'shift cam lobe');
  shiftLobe.position.set(0, 9.5, 0);
  addPickable(shiftLobe, COMPONENTS.drive, pickables);
  shiftCam.add(shiftLobe);

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 58, 36), darkMetal);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(P4.motor.x, P4.motor.y, P4.motor.z);
  motor.name = 'motor';
  addPickable(motor, COMPONENTS.drive, pickables);
  driveAssembly.add(motor);

  const motorPitchRadiusP4 = 7.0;
  const cyclePitchRadiusP4 = motorPitchRadiusP4 * CANONICAL.drive.positiveBeltReduction;

  const drivePulley = pulley(motorPitchRadiusP4, 10, darkMetal, '8-tooth motor positive-drive pulley');
  drivePulley.position.set(-145, 39, 42);
  addPickable(drivePulley, COMPONENTS.drive, pickables);
  driveAssembly.add(drivePulley);

  const motorToothGeo = new THREE.BoxGeometry(10.8, 2.1, 3.2);
  const motorTeeth = new THREE.InstancedMesh(motorToothGeo, metal, CANONICAL.drive.motorPulleyTeeth);
  motorTeeth.name = '8 motor-pulley tooth cues';
  const driveToothMatrix = new THREE.Matrix4();
  const driveToothQuat = new THREE.Quaternion();
  const driveToothScale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < CANONICAL.drive.motorPulleyTeeth; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.drive.motorPulleyTeeth;
    driveToothQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    driveToothMatrix.compose(
      new THREE.Vector3(-145, 39 + Math.cos(a) * motorPitchRadiusP4, 42 + Math.sin(a) * motorPitchRadiusP4),
      driveToothQuat,
      driveToothScale
    );
    motorTeeth.setMatrixAt(i, driveToothMatrix);
  }
  motorTeeth.userData.component = COMPONENTS.drive;
  motorTeeth.castShadow = true;
  pickables.push(motorTeeth);
  driveAssembly.add(motorTeeth);

  const cyclePulley = pulley(cyclePitchRadiusP4, 11, darkMetal, 'derived 29-tooth cycle-clutch pulley');
  cyclePulley.position.set(-145, P4.cycleShaft.y, P4.cycleShaft.z);
  addPickable(cyclePulley, COMPONENTS.drive, pickables);
  driveAssembly.add(cyclePulley);

  const cycleToothGeo = new THREE.BoxGeometry(11.8, 2.0, 3.0);
  const cycleTeeth = new THREE.InstancedMesh(cycleToothGeo, metal, CANONICAL.drive.cycleClutchPulleyTeethDerived);
  cycleTeeth.name = '29 cycle-clutch-pulley tooth cues';
  const cycleToothMatrix = new THREE.Matrix4();
  const cycleToothQuat = new THREE.Quaternion();
  for (let i = 0; i < CANONICAL.drive.cycleClutchPulleyTeethDerived; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.drive.cycleClutchPulleyTeethDerived;
    cycleToothQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    cycleToothMatrix.compose(
      new THREE.Vector3(-145, P4.cycleShaft.y + Math.cos(a) * cyclePitchRadiusP4, P4.cycleShaft.z + Math.sin(a) * cyclePitchRadiusP4),
      cycleToothQuat,
      driveToothScale
    );
    cycleTeeth.setMatrixAt(i, cycleToothMatrix);
  }
  cycleTeeth.userData.component = COMPONENTS.drive;
  cycleTeeth.castShadow = true;
  pickables.push(cycleTeeth);
  driveAssembly.add(cycleTeeth);

  const driveBelt = dynamicTube(0x222221, 2.2, 'positive-drive belt presentation', COMPONENTS.drive, pickables);
  driveBelt.update([
    new THREE.Vector3(-145, 39 + motorPitchRadiusP4, 42),
    new THREE.Vector3(-145, P4.cycleShaft.y + cyclePitchRadiusP4, P4.cycleShaft.z),
    new THREE.Vector3(-145, P4.cycleShaft.y - cyclePitchRadiusP4, P4.cycleShaft.z),
    new THREE.Vector3(-145, 39 - motorPitchRadiusP4, 42),
    new THREE.Vector3(-145, 39 + motorPitchRadiusP4, 42)
  ]);
  driveAssembly.add(driveBelt.mesh);

  const horizontalAssembly = makeAssembly('writing-line racks and cords', new THREE.Vector3(104, 8, -62));
  assemblies.push(horizontalAssembly);
  root.add(horizontalAssembly);

  const marginRack = box(P4.writingLineRacks.length, 4, 5, rackMat, 'IBM 1164743 margin rack');
  marginRack.position.set(0, P4.writingLineRacks.marginY, P4.writingLineRacks.marginZ);
  addPickable(marginRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(marginRack);

  const marginLimit = CANONICAL.writingLineMm / 2;
  for (const [x, name] of [
    [-marginLimit, 'left physical margin stop / carrier-return terminator'],
    [marginLimit, 'right physical margin stop / line-lock interface']
  ]) {
    const stop = box(8, 15, 10, darkMetal, name);
    stop.position.set(x, P4.writingLineRacks.marginY + 8, P4.writingLineRacks.marginZ);
    addPickable(stop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(stop);
  }

  const tabRack = box(P4.writingLineRacks.length, 4, 5, darkMetal, 'IBM 1164102/6519354 7X1 tab rack family');
  tabRack.position.set(0, P4.writingLineRacks.tabY, P4.writingLineRacks.tabZ);
  addPickable(tabRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabRack);

  const tabStopBar = box(P4.writingLineRacks.length, 3.5, 4, metal, 'IBM 1124073 tab stop bar');
  tabStopBar.position.set(0, P4.writingLineRacks.tabY - 5, P4.writingLineRacks.tabZ + 1);
  addPickable(tabStopBar, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabStopBar);

  for (let stop = 8; stop < CANONICAL.nominalPositions; stop += 8) {
    const tabStop = box(2.2, 9, 7, metal, 'presentation tab stop');
    tabStop.position.set(
      -CANONICAL.writingLineMm / 2 + stop * CANONICAL.pitchMm,
      P4.writingLineRacks.tabY + 5,
      P4.writingLineRacks.tabZ
    );
    addPickable(tabStop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(tabStop);
  }

  const escapementShaft = shaft(270, 3.8, darkMetal, 'escapement / cord-drum shaft');
  escapementShaft.position.set(0, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementShaft, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementShaft);

  const escapementDrum = pulley(P4.cordSystem.drumRadius, 18, metal, 'escapement / tab cord drum');
  escapementDrum.position.set(72, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementDrum);

  const returnDrum = pulley(P4.cordSystem.drumRadius, 18, darkMetal, 'carrier-return cord drum');
  returnDrum.position.set(-22, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(returnDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(returnDrum);

  for (const [x, z, name] of [
    [P4.cordSystem.leftPulleyX, -36, 'left return pulley 1'],
    [P4.cordSystem.leftPulleyX, -58, 'left return pulley 2'],
    [P4.cordSystem.rightPulleyX, -36, 'right escapement guide pulley']
  ]) {
    const guidePulley = pulley(7, 5.5, metal, name);
    guidePulley.position.set(x, 60, z);
    addPickable(guidePulley, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(guidePulley);
  }

  const escapementCord = dynamicTube(0xd1b88c, 1.05, 'escapement / tab cord', COMPONENTS.horizontalMotion, pickables);
  const returnCord = dynamicTube(0xb8b2a4, 1.05, 'carrier-return cord', COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementCord.mesh, returnCord.mesh);

  function updateCordGeometry(carrierX) {
    escapementCord.update([
      new THREE.Vector3(72, P4.cordSystem.shaftY, P4.cordSystem.shaftZ - 9),
      new THREE.Vector3(P4.cordSystem.rightPulleyX, 60, -36),
      new THREE.Vector3(P4.cordSystem.rightPulleyX, 72, -58),
      new THREE.Vector3(carrierX + 24, 82, -48)
    ]);
    returnCord.update([
      new THREE.Vector3(-22, P4.cordSystem.shaftY, P4.cordSystem.shaftZ - 9),
      new THREE.Vector3(P4.cordSystem.leftPulleyX, 60, -36),
      new THREE.Vector3(P4.cordSystem.leftPulleyX, 60, -58),
      new THREE.Vector3(carrierX - 24, 78, -45)
    ]);
    const travel = carrierX + CANONICAL.writingLineMm / 2;
    state.cordPhase = travel / Math.max(P4.cordSystem.drumRadius, 1);
    escapementDrum.rotation.x = state.cordPhase;
    returnDrum.rotation.x = -state.cordPhase;
  }

  const platenAssembly = makeAssembly('platen / paper assembly', new THREE.Vector3(0, 112, -126));
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

  const ratchetGroup = new THREE.Group();
  ratchetGroup.name = '27-tooth platen ratchet group';
  ratchetGroup.position.set(P4.platen.length / 2 - 8, P4.platen.y, P4.platen.z);
  platenAssembly.add(ratchetGroup);

  const ratchetHub = shaft(6.5, CANONICAL.platen.ratchetDiameterMm / 2 - 2.1, darkMetal, 'platen ratchet hub');
  addPickable(ratchetHub, COMPONENTS.platenRatchet, pickables);
  ratchetGroup.add(ratchetHub);

  const ratchetToothGeo = new THREE.BoxGeometry(5.6, 2.4, 4.0);
  const ratchetTeeth = new THREE.InstancedMesh(
    ratchetToothGeo,
    metal,
    CANONICAL.platen.representativeRatchetTeeth
  );
  ratchetTeeth.name = '27 representative ratchet teeth';
  const ratchetMatrix = new THREE.Matrix4();
  const ratchetQuat = new THREE.Quaternion();
  const ratchetScale = new THREE.Vector3(1, 1, 1);
  const ratchetR = CANONICAL.platen.ratchetDiameterMm / 2 - 0.8;
  for (let i = 0; i < CANONICAL.platen.representativeRatchetTeeth; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.platen.representativeRatchetTeeth;
    ratchetQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    ratchetMatrix.compose(
      new THREE.Vector3(0, Math.cos(a) * ratchetR, Math.sin(a) * ratchetR),
      ratchetQuat,
      ratchetScale
    );
    ratchetTeeth.setMatrixAt(i, ratchetMatrix);
  }
  ratchetTeeth.userData.component = COMPONENTS.platenRatchet;
  ratchetTeeth.castShadow = true;
  pickables.push(ratchetTeeth);
  ratchetGroup.add(ratchetTeeth);

  const feedRollXs = [-90, -30, 30, 90];
  const rearFeedShaft = shaft(242, 2.4, metal, 'rear paper-feed actuating shaft');
  rearFeedShaft.position.set(0, P4.platen.y - 17, P4.platen.z - 12);
  addPickable(rearFeedShaft, COMPONENTS.paperFeed, pickables);
  platenAssembly.add(rearFeedShaft);

  const frontFeedShaft = shaft(242, 2.4, metal, 'front paper-feed actuating shaft');
  frontFeedShaft.position.set(0, P4.platen.y - 18, P4.platen.z + 18);
  addPickable(frontFeedShaft, COMPONENTS.paperFeed, pickables);
  platenAssembly.add(frontFeedShaft);

  for (const x of feedRollXs) {
    const rearRoller = pulley(6.2, 15, rubber, 'rear molded rubber feed roller');
    rearRoller.position.set(x, P4.platen.y - 11, P4.platen.z - 12);
    addPickable(rearRoller, COMPONENTS.paperFeed, pickables);
    platenAssembly.add(rearRoller);

    const frontRoller = pulley(6.2, 15, rubber, 'front molded rubber feed roller');
    frontRoller.position.set(x, P4.platen.y - 12, P4.platen.z + 16);
    addPickable(frontRoller, COMPONENTS.paperFeed, pickables);
    platenAssembly.add(frontRoller);
  }

  const paperDeflector = box(238, 2.2, 42, shellDark, 'paper deflector beneath platen');
  paperDeflector.position.set(0, P4.platen.y - 23, P4.platen.z + 1);
  paperDeflector.rotation.x = deg(-5);
  addPickable(paperDeflector, COMPONENTS.paperFeed, pickables);
  platenAssembly.add(paperDeflector);

  const bailBar = shaft(266, 2.8, metal, 'paper bail bar');
  bailBar.position.set(0, P4.platen.y + 27, P4.platen.z + 4);
  addPickable(bailBar, COMPONENTS.paperFeed, pickables);
  platenAssembly.add(bailBar);
  for (const x of [-74, 74]) {
    const roller = pulley(5.5, 12, rubber, 'laterally adjustable paper bail roller');
    roller.position.set(x, P4.platen.y + 24, P4.platen.z + 1);
    addPickable(roller, COMPONENTS.paperFeed, pickables);
    platenAssembly.add(roller);
  }

  const indexPawl = box(5, 20, 4, darkMetal, 'platen index pawl');
  indexPawl.position.set(P4.platen.length / 2 - 20, P4.platen.y - 2, P4.platen.z + 15);
  indexPawl.rotation.x = deg(-22);
  addPickable(indexPawl, COMPONENTS.platenRatchet, pickables);
  platenAssembly.add(indexPawl);

  const detentRoller = pulley(4.5, 5, metal, 'platen detent roller');
  detentRoller.position.set(P4.platen.length / 2 - 20, P4.platen.y + 13, P4.platen.z + 8);
  addPickable(detentRoller, COMPONENTS.platenRatchet, pickables);
  platenAssembly.add(detentRoller);

  const variableRelease = box(18, 7, 9, metal, 'platen variable-release coupling');
  variableRelease.position.set(-P4.platen.length / 2 + 17, P4.platen.y, P4.platen.z);
  addPickable(variableRelease, COMPONENTS.paperFeed, pickables);
  platenAssembly.add(variableRelease);

  const selectionAssembly = makeAssembly('selection transmission', new THREE.Vector3(98, -40, 42));
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

  const selectorLatchNames = ['T1', 'T2', 'R1', 'R2', 'R2A'];
  const selectorLatches = {};
  selectorLatchNames.forEach((name, index) => {
    const latch = box(8, 28, 4.2, metal, name + ' selector latch');
    latch.position.set(-60 + index * 30, 54, -24);
    latch.userData.baseY = latch.position.y;
    addPickable(latch, COMPONENTS.selection, pickables);
    selectionAssembly.add(latch);
    selectorLatches[name] = latch;
  });

  const fiveUnitBail = box(54, 5, 9, darkMetal, 'five-unit bail');
  fiveUnitBail.position.set(58, 45, -31);
  fiveUnitBail.userData.baseY = fiveUnitBail.position.y;
  addPickable(fiveUnitBail, COMPONENTS.selection, pickables);
  selectionAssembly.add(fiveUnitBail);

  const tiltDifferential = new THREE.Group();
  tiltDifferential.position.set(-72, 68, -35);
  selectionAssembly.add(tiltDifferential);
  const tiltArmA = box(52, 4, 6, metal, 'tilt differential lever');
  addPickable(tiltArmA, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltArmA);
  const tiltLink = box(4, 36, 5, darkMetal, 'tilt differential output link');
  tiltLink.position.set(20, 16, 0);
  addPickable(tiltLink, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltLink);

  const rotateBalance = new THREE.Group();
  rotateBalance.position.set(56, 68, -35);
  selectionAssembly.add(rotateBalance);
  const rotateArm = box(62, 4, 6, metal, 'rotate balance lever');
  addPickable(rotateArm, COMPONENTS.selection, pickables);
  rotateBalance.add(rotateArm);
  const rotateBellcrank = box(5, 34, 5, darkMetal, 'rotate bellcrank output');
  rotateBellcrank.position.set(-18, 15, 0);
  addPickable(rotateBellcrank, COMPONENTS.selection, pickables);
  rotateBalance.add(rotateBellcrank);

  function rotatePositiveInputs(units) {
    const u = Math.max(0, Math.min(5, Math.trunc(units)));
    if (u === 0) return { R1: 0, R2: 0, R2A: 0 };
    if (u === 1) return { R1: 1, R2: 0, R2A: 0 };
    if (u === 2) return { R1: 0, R2: 1, R2A: 0 };
    if (u === 3) return { R1: 1, R2: 1, R2A: 0 };
    if (u === 4) return { R1: 0, R2: 1, R2A: 1 };
    return { R1: 1, R2: 1, R2A: 1 };
  }

  function updateSelectionDrive(tiltBand, rotateUnit) {
    const T1 = tiltBand & 1 ? 1 : 0;
    const T2 = tiltBand & 2 ? 1 : 0;
    const fiveUnit = rotateUnit < 0 ? 1 : 0;
    const compensation = fiveUnit ? rotateUnit + 5 : rotateUnit;
    const positive = rotatePositiveInputs(compensation);
    state.selectorInputs = { T1, T2, ...positive, fiveUnit };

    selectorLatches.T1.position.y = selectorLatches.T1.userData.baseY - T1 * 7;
    selectorLatches.T2.position.y = selectorLatches.T2.userData.baseY - T2 * 7;
    selectorLatches.R1.position.y = selectorLatches.R1.userData.baseY - positive.R1 * 7;
    selectorLatches.R2.position.y = selectorLatches.R2.userData.baseY - positive.R2 * 7;
    selectorLatches.R2A.position.y = selectorLatches.R2A.userData.baseY - positive.R2A * 7;
    fiveUnitBail.position.y = fiveUnitBail.userData.baseY - fiveUnit * 8;

    tiltDifferential.rotation.z = deg((tiltBand - 1.5) * 6.5);
    rotateBalance.rotation.z = deg(rotateUnit * 3.2);
  }

  const carrierAssembly = makeAssembly('carrier assembly', new THREE.Vector3(-92, 102, -8));
  assemblies.push(carrierAssembly);
  root.add(carrierAssembly);

  const carrierMotion = new THREE.Group();
  carrierMotion.name = 'carrier mechanical transform';
  carrierAssembly.add(carrierMotion);

  const carrierHalfW = P4.carrier.width / 2;
  const carrierHalfD = P4.carrier.depth / 2;
  for (const sign of [-1, 1]) {
    const sidePlate = box(6.5, P4.carrier.height, P4.carrier.depth, darkMetal, sign < 0 ? 'carrier left side plate' : 'carrier right side plate');
    sidePlate.position.set(sign * (carrierHalfW - 3.25), P4.carrier.y, P4.carrier.z);
    addPickable(sidePlate, COMPONENTS.carrier, pickables);
    carrierMotion.add(sidePlate);
  }
  const carrierFrontBridge = box(P4.carrier.width - 10, 6, 7, darkMetal, 'carrier front bridge');
  carrierFrontBridge.position.set(0, P4.carrier.y + 4, P4.carrier.z + carrierHalfD - 3.5);
  addPickable(carrierFrontBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierFrontBridge);

  const carrierRearBridge = box(P4.carrier.width - 10, 6, 7, darkMetal, 'carrier rear bridge');
  carrierRearBridge.position.set(0, P4.carrier.y + 4, P4.carrier.z - carrierHalfD + 3.5);
  addPickable(carrierRearBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierRearBridge);

  const carrierLowerBridge = box(P4.carrier.width - 10, 5, P4.carrier.depth - 12, metal, 'carrier lower crossmember');
  carrierLowerBridge.position.set(0, P4.carrier.y - P4.carrier.height / 2 + 2.5, P4.carrier.z);
  addPickable(carrierLowerBridge, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierLowerBridge);

  const carrierTopBrace = box(P4.carrier.width - 18, 3.5, 8, metal, 'carrier top brace');
  carrierTopBrace.position.set(0, P4.carrier.y + P4.carrier.height / 2 - 2, P4.carrier.z + 2);
  addPickable(carrierTopBrace, COMPONENTS.carrier, pickables);
  carrierMotion.add(carrierTopBrace);

  const ribbonAssembly = new THREE.Group();
  ribbonAssembly.name = 'carrier-parented new-style fabric ribbon assembly';
  carrierMotion.add(ribbonAssembly);
  const ribbonSpools = [];
  const ribbonRatchets = [];
  for (const x of [-P4.ribbon.spoolCenterX, P4.ribbon.spoolCenterX]) {
    const spool = new THREE.Mesh(
      new THREE.CylinderGeometry(P4.ribbon.spoolRadiusP4, P4.ribbon.spoolRadiusP4, 10, 36),
      ribbonMat
    );
    spool.position.set(x, 93, -49);
    spool.name = x < 0 ? 'left fabric-ribbon spool' : 'right fabric-ribbon spool';
    addPickable(spool, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(spool);
    ribbonSpools.push(spool);

    const ratchet = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 3.5, 20), darkMetal);
    ratchet.position.set(x, 88, -49);
    ratchet.name = x < 0 ? 'left ribbon feed ratchet' : 'right ribbon feed ratchet';
    addPickable(ratchet, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(ratchet);
    ribbonRatchets.push(ratchet);

    const reverseTrigger = box(3, 9, 5, metal, x < 0 ? 'left reverse-trigger bellcrank cue' : 'right reverse-trigger bellcrank cue');
    reverseTrigger.position.set(x, 84, -39);
    reverseTrigger.rotation.z = deg(x < 0 ? -18 : 18);
    addPickable(reverseTrigger, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(reverseTrigger);

    const brakeSpring = box(10, 1.2, 3, metal, x < 0 ? 'left spool retainer/brake spring cue' : 'right spool retainer/brake spring cue');
    brakeSpring.position.set(x, 99, -43);
    addPickable(brakeSpring, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(brakeSpring);
  }

  const feedPlate = box(74, 3.5, 10, metal, 'feed-and-reverse plate · slide plus reverse pivot');
  feedPlate.position.set(0, 83, -45);
  addPickable(feedPlate, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(feedPlate);

  const feedPawl = box(5, 18, 3, darkMetal, 'ribbon feed pawl');
  feedPawl.position.set(0, 87, -42);
  feedPawl.rotation.z = deg(12);
  addPickable(feedPawl, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(feedPawl);

  const detentLever = box(68, 3, 5, darkMetal, 'ratchet detent/check lever');
  detentLever.position.set(0, 79, -48);
  addPickable(detentLever, COMPONENTS.ribbon, pickables);
  ribbonAssembly.add(detentLever);

  const leftGuide = new THREE.Vector3(-18, P4.ribbon.yRest, P4.ribbon.z);
  const rightGuide = new THREE.Vector3(18, P4.ribbon.yRest, P4.ribbon.z);
  for (const x of [-18, 18]) {
    const guide = box(4, 21, 4, metal, x < 0 ? 'left ribbon lift guide' : 'right ribbon lift guide');
    guide.position.set(x, P4.ribbon.yRest - 3, P4.ribbon.z + 1);
    addPickable(guide, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(guide);
  }

  function makeRibbonSegment(name) {
    const segment = box(1, P4.ribbon.widthMm, 1.0, ribbonMat, name);
    addPickable(segment, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(segment);
    return segment;
  }

  const ribbonLeftSegment = makeRibbonSegment('fabric ribbon · left spool to lift guide');
  const ribbonCenterSegment = makeRibbonSegment('fabric ribbon · print-point span');
  const ribbonRightSegment = makeRibbonSegment('fabric ribbon · lift guide to right spool');
  const ribbonXAxis = new THREE.Vector3(1, 0, 0);

  function updateRibbonSegment(mesh, a, b) {
    const delta = new THREE.Vector3().subVectors(b, a);
    const length = delta.length();
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(ribbonXAxis, delta.clone().normalize());
    mesh.scale.set(length, 1, 1);
  }

  function updateRibbonPath(lift) {
    const liftY = THREE.MathUtils.lerp(P4.ribbon.yRest, P4.ribbon.yLift, lift);
    leftGuide.y = liftY;
    rightGuide.y = liftY;
    updateRibbonSegment(
      ribbonLeftSegment,
      new THREE.Vector3(-P4.ribbon.spoolCenterX + 5, 94, -50),
      leftGuide
    );
    updateRibbonSegment(ribbonCenterSegment, leftGuide, rightGuide);
    updateRibbonSegment(
      ribbonRightSegment,
      rightGuide,
      new THREE.Vector3(P4.ribbon.spoolCenterX - 5, 94, -50)
    );
  }

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

  const backspaceRack = box(48, 4, 6, rackMat, 'IBM 1124568 / 6519139 7X1 12P backspace rack family');
  backspaceRack.position.set(0, P4.rack.y - 12, P4.rack.z + 10);
  backspaceRack.userData.baseX = backspaceRack.position.x;
  addPickable(backspaceRack, COMPONENTS.backspaceLinkage, pickables);
  carrierMotion.add(backspaceRack);

  const backspaceTeeth = new THREE.InstancedMesh(
    new THREE.BoxGeometry(CANONICAL.pitchMm * 0.42, 3.0, 3.4),
    darkMetal,
    20
  );
  backspaceTeeth.name = '12P backspace rack tooth cues';
  const backspaceToothMatrix = new THREE.Matrix4();
  for (let i = 0; i < 20; i += 1) {
    backspaceToothMatrix.makeTranslation((i - 9.5) * CANONICAL.pitchMm, P4.rack.y - 9.6, P4.rack.z + 12.5);
    backspaceTeeth.setMatrixAt(i, backspaceToothMatrix);
  }
  backspaceTeeth.userData.component = COMPONENTS.backspaceLinkage;
  backspaceTeeth.castShadow = true;
  pickables.push(backspaceTeeth);
  carrierMotion.add(backspaceTeeth);

  const backspaceBellcrank = new THREE.Group();
  backspaceBellcrank.name = 'backspace bellcrank / intermediate lever presentation';
  backspaceBellcrank.position.set(-18, P4.rack.y - 2, P4.rack.z + 18);
  carrierMotion.add(backspaceBellcrank);
  const backspaceArmA = box(31, 4, 5, metal, 'backspace bellcrank arm');
  backspaceArmA.position.x = 12;
  addPickable(backspaceArmA, COMPONENTS.backspaceLinkage, pickables);
  backspaceBellcrank.add(backspaceArmA);
  const backspaceArmB = box(4, 24, 5, darkMetal, 'backspace intermediate lever');
  backspaceArmB.position.set(0, -9, 0);
  addPickable(backspaceArmB, COMPONENTS.backspaceLinkage, pickables);
  backspaceBellcrank.add(backspaceArmB);

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
  rocker.position.set(0, P4.printRocker.pivotY, P4.printRocker.pivotZ);
  carrierMotion.add(rocker);

  const typeLocalY = P4.typeball.y - P4.printRocker.pivotY;
  const typeLocalZ = P4.typeball.zRest - P4.printRocker.pivotZ;

  const neck = shaft(Math.hypot(typeLocalY, typeLocalZ) * 0.78, 3.6, metal, 'type-element rocker arm');
  neck.rotation.z = 0;
  neck.rotation.x = Math.atan2(-typeLocalZ, typeLocalY);
  neck.position.set(0, typeLocalY * 0.48, typeLocalZ * 0.48);
  addPickable(neck, COMPONENTS.typeball, pickables);
  rocker.add(neck);

  const typeElement = makeTypeElement(ballMat, darkMetal, pickables);
  typeElement.position.set(0, typeLocalY, typeLocalZ);
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

  function setKeyboardCode(code) {
    state.keyboardCode = Math.max(0, Math.min(63, Math.trunc(code) || 0));
    selectorBailMaterials.forEach((mat, index) => {
      const active = Boolean(state.keyboardCode & (1 << index));
      mat.emissive.setHex(active ? 0x2d1b08 : 0x000000);
      mat.emissiveIntensity = active ? 0.45 : 1;
      const bail = selectorBails[index];
      bail.position.y = bail.userData.baseY - (active ? 4.5 : 0);
      bail.position.z = bail.userData.baseZ + (active ? 3.0 : 0);
    });
  }

  function normalizeKeyCharacter(character) {
    if (character === null || character === undefined) return null;
    if (character === ' ') return 'SPACE';
    if (character === '\n' || character === '\r') return 'RETURN';
    return String(character).toUpperCase();
  }

  function setKeyPress(character, value) {
    state.keyboardPressCharacter = normalizeKeyCharacter(character);
    state.keyboardPress = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    keyMeshes.forEach(key => {
      key.position.y = key.userData.baseY;
    });
    const activeKey = state.keyboardPressCharacter ? keyMeshes.get(state.keyboardPressCharacter) : null;
    if (activeKey) activeKey.position.y = activeKey.userData.baseY - state.keyboardPress * 4.2;
  }

  function setBackspaceLinkage(value) {
    state.backspaceLinkage = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const pulse = Math.sin(state.backspaceLinkage * Math.PI);
    backspaceRack.position.x = backspaceRack.userData.baseX - pulse * 5.5;
    backspaceBellcrank.rotation.z = deg(-22 * pulse);
  }

  function setCarrierX(x) {
    state.carrierX = THREE.MathUtils.clamp(x, -CANONICAL.writingLineMm / 2, CANONICAL.writingLineMm / 2);
    carrierMotion.position.x = state.carrierX;
    updateSelectionTapes();
    updateCordGeometry(state.carrierX);
  }

  function setTypeball(tiltBand, rotateUnit, shiftHemisphere = state.shiftHemisphere) {
    state.tiltBand = THREE.MathUtils.clamp(tiltBand, 0, 3);
    state.rotateUnit = THREE.MathUtils.clamp(rotateUnit, -5, 5);
    state.shiftHemisphere = shiftHemisphere ? 1 : 0;
    updateSelectionDrive(state.tiltBand, state.rotateUnit);
    typeElement.rotation.x = deg(state.tiltBand * 7.5);
    typeElement.rotation.y = deg(state.rotateUnit * 10 + state.shiftHemisphere * 180);
  }

  function setRibbonLift(value) {
    state.ribbonLift = THREE.MathUtils.clamp(value, 0, 1);
    updateRibbonPath(state.ribbonLift);
  }

  function feedRibbon() {
    state.ribbonFeedStep += 1;
    state.ribbonFeedApproxRatchetTeeth += 2.5;
    const presentationStep = 0.17 * state.ribbonFeedDirection;
    ribbonSpools[0].rotation.y -= presentationStep;
    ribbonSpools[1].rotation.y += presentationStep;
    ribbonRatchets[0].rotation.y -= presentationStep * 1.8;
    ribbonRatchets[1].rotation.y += presentationStep * 1.8;
    feedPlate.position.z = -45 + (state.ribbonFeedStep % 2 ? 2.5 : 0);
    feedPawl.rotation.z = deg(12 + (state.ribbonFeedStep % 2 ? 8 : 0));
  }

  function setPrintApproach(value) {
    state.printApproach = THREE.MathUtils.clamp(value, 0, 1);
    const poweredBoundary = 0.90;
    let angleDeg;
    if (state.printApproach <= poweredBoundary) {
      angleDeg = THREE.MathUtils.lerp(
        0,
        P4.printRocker.poweredEndpointAngleDeg,
        state.printApproach / poweredBoundary
      );
    } else {
      angleDeg = THREE.MathUtils.lerp(
        P4.printRocker.poweredEndpointAngleDeg,
        P4.printRocker.impactAngleDeg,
        (state.printApproach - poweredBoundary) / (1 - poweredBoundary)
      );
    }
    rocker.rotation.x = deg(angleDeg);
  }

  function setPlatenIndex(value) {
    state.platenIndex = value;
    platen.rotation.x = value;
    ratchetGroup.rotation.x = value;
  }

  function setMotorPhase(value) {
    state.motorPhase = ((Number(value) || 0) % 1 + 1) % 1;
    operationalRotor.rotation.x = state.motorPhase * Math.PI * 2;
    drivePulley.rotation.x = state.motorPhase * Math.PI * 2;
  }

  function setOperationalCam(action, phase = 0) {
    state.operationalCamAction = action || 'rest';
    state.operationalCamPhase = THREE.MathUtils.clamp(Number(phase) || 0, 0, 1);
    doubleServiceCam.rotation.x = 0;
    returnIndexCam.rotation.x = 0;
    shiftCam.rotation.x = 0;
    if (action === 'space' || action === 'backspace') {
      doubleServiceCam.rotation.x = state.operationalCamPhase * Math.PI;
    } else if (action === 'carrier-return' || action === 'index') {
      returnIndexCam.rotation.x = state.operationalCamPhase * Math.PI * 2;
    } else if (action === 'shift') {
      shiftCam.rotation.x = state.operationalCamPhase * Math.PI;
    }
  }

  function setCyclePhase(value) {
    state.cyclePhase = THREE.MathUtils.clamp(value, 0, 1);
    cycleRotor.rotation.x = state.cyclePhase * Math.PI;
    filterShaftRotor.rotation.x = state.cyclePhase * Math.PI;
    printShaftRotor.rotation.x = state.cyclePhase * Math.PI * 2;
    printSleeveRotor.rotation.x = state.cyclePhase * Math.PI * 2;
  }

  function setServiceCover(value) {
    state.serviceCoverOpen = THREE.MathUtils.clamp(value, 0, 1);
    serviceCoverPivot.rotation.x = deg(-52) * state.serviceCoverOpen;
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
      revision: 'selectric-public-foundation-v3',
      finite: [size.x, size.y, size.z].every(Number.isFinite),
      bounds: { width: size.x, height: size.y, depth: size.z },
      carrierX: state.carrierX,
      pitchMm: CANONICAL.pitchMm,
      writingLineMm: CANONICAL.writingLineMm,
      explosion: state.explosion,
      serviceCoverOpen: state.serviceCoverOpen,
      explosionClass: 'P5 assembly-separation presentation; not service motion',
      pickableCount: pickables.length,
      supportTopology: 'D6 front + Level-2 upper/lower rack shoes',
      carrierEmbodiment: 'open P4 frame with side plates and crossmembers; not a solid presentation block',
      shellTopology: 'extruded rounded side-cheek profile + full-width hinged hood ending ahead of platen',
      keyboardActuation: {
        character: state.keyboardPressCharacter,
        depression: state.keyboardPress,
        travelClass: 'P5 presentation preserving keypress-before-code-sampling order'
      },
      keyboardCodeChannels: 6,
      keyboardCode: state.keyboardCode,
      selectorInputs: { ...state.selectorInputs },
      cordPhase: state.cordPhase,
      writingLineRacks: ['1124109 escapement', '1164743 margin', '1164102/6519354 tab'],
      marginStops: {
        leftPhysical: true,
        rightPhysical: true,
        leftTerminatesCarrierReturn: true,
        rightLineLockInterface: true
      },
      backspace: {
        mechanism: 'dedicated-powered-reverse-linkage',
        rackFamily: ['1124568', '6519139'],
        activePitch: '12P',
        displacementMm: -CANONICAL.pitchMm,
        serialExactPart: 'unresolved',
        linkagePhase: state.backspaceLinkage
      },
      d6CurrentSet: {
        shaft: '1164736',
        bearings: '1164740',
        gear: '1164739',
        item51Clip: '1175220 US / 6520762 WT',
        clipMarketFrozen: false
      },
      platenRatchet: {
        outerDiameterMm: CANONICAL.platen.ratchetDiameterMm,
        teeth: CANONICAL.platen.representativeRatchetTeeth,
        toothProfile: 'P4'
      },
      paperFeed: {
        frontRollers: 4,
        rearRollers: 4,
        bailRollers: 2,
        frontRearReleaseCoupled: true,
        exactCenters: 'unresolved-P4'
      },
      ribbon: {
        parent: 'carrier',
        mediaWidthMm: P4.ribbon.widthMm,
        feedStepCount: state.ribbonFeedStep,
        approximateRatchetTeethAdvanced: state.ribbonFeedApproxRatchetTeeth,
        nominalRatchetTeethPerCharacter: 2.5,
        nominalRatchetTeethQualifier: 'approximately',
        feedDirection: state.ribbonFeedDirection,
        path: ['left-spool', 'left-guide', 'print-point', 'right-guide', 'right-spool'],
        reverseTopology: 'trigger -> feed/reverse plate pivot -> feed-pawl transfer',
        exactLinearFeedMm: 'unresolved'
      },
      sleeveCamOrder: ['ribbon-lift', '1164240-feed-detent', '1124174-print-restoring'],
      primaryDrive: {
        motorPulleyTeeth: CANONICAL.drive.motorPulleyTeeth,
        cycleClutchPulleyTeeth: CANONICAL.drive.cycleClutchPulleyTeethDerived,
        reduction: CANONICAL.drive.positiveBeltReduction,
        pitchRadiusRatio: cyclePitchRadiusP4 / motorPitchRadiusP4,
        beltPitchAndAbsolutePulleyDiameters: 'unresolved'
      },
      powerPresentation: {
        operationalShaftContinuousWhenPowered: true,
        serviceCamsStationaryUntilSelected: true,
        motorPhase: state.motorPhase,
        selectedServiceCam: state.operationalCamAction,
        selectedServiceCamPhase: state.operationalCamPhase,
        speedClass: 'P5 slowed presentation'
      },
      operationalCams: {
        spaceBackspaceDegreesPerOperation: 180,
        carrierReturnIndexDegreesPerOperation: 360,
        shiftDegreesPerTransition: 180,
        tabUsesPoweredCam: false
      },
      shaftTiming: {
        cycleShaftDegPerCharacter: 180,
        filterShaftDegPerCharacter: 180,
        printShaftDegPerCharacter: 360,
        printSleeveDegPerCharacter: 360
      },
      printRocker: {
        motion: 'revolute',
        restClearanceMm: P4.printRocker.derivedRestClearanceMm,
        poweredEndpointClearanceMm: P4.printRocker.derivedPoweredEndpointClearanceMm,
        poweredEndpointAngleDeg: P4.printRocker.poweredEndpointAngleDeg,
        impactAngleDeg: P4.printRocker.impactAngleDeg,
        freeFlightRepresented: true
      },
      provenance: CANONICAL.provenance
    };
  }

  setKeyboardCode(0);
  setKeyPress(null, 0);
  setBackspaceLinkage(0);
  setCarrierX(state.carrierX);
  setTypeball(0, 0, 0);
  setRibbonLift(0);
  setPrintApproach(0);
  setMotorPhase(0);
  setOperationalCam(null, 0);
  setCyclePhase(0);
  setServiceCover(0);
  setExplosion(0);

  return {
    root,
    pickables,
    state,
    setKeyboardCode,
    setKeyPress,
    setBackspaceLinkage,
    setCarrierX,
    setTypeball,
    setRibbonLift,
    feedRibbon,
    setPrintApproach,
    setPlatenIndex,
    setMotorPhase,
    setOperationalCam,
    setCyclePhase,
    setServiceCover,
    setExplosion,
    stampCharacter,
    clearPaper,
    geometryDiagnostics
  };
}
