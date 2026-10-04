import * as THREE from 'three';
import { CANONICAL, P4, COMPONENTS } from './spec.js';

const deg = THREE.MathUtils.degToRad;
const TYPE_BAND_LATITUDES_P4 = [-0.58, -0.20, 0.20, 0.58];
const TYPE_PRINT_FACING_OFFSET_DEG_P4 = 180;

function typeBandNormalTiltRadP4(band) {
  const index = THREE.MathUtils.clamp(Math.round(Number(band) || 0), 0, TYPE_BAND_LATITUDES_P4.length - 1);
  const lat = TYPE_BAND_LATITUDES_P4[index];
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  const y = lat * bodyYRadius;
  const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
  const normalY = y / (bodyYRadius * bodyYRadius);
  const normalZ = radial / (bodyRadius * bodyRadius);
  return Math.atan2(normalY, normalZ);
}

function typeSlugNormalP4(band, slot) {
  const bandIndex = THREE.MathUtils.clamp(Math.round(Number(band) || 0), 0, TYPE_BAND_LATITUDES_P4.length - 1);
  const slotIndex = ((Math.round(Number(slot) || 0) % CANONICAL.typeElement.positionsPerBand) + CANONICAL.typeElement.positionsPerBand) % CANONICAL.typeElement.positionsPerBand;
  const lat = TYPE_BAND_LATITUDES_P4[bandIndex];
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  const y = lat * bodyYRadius;
  const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
  const a = slotIndex * Math.PI * 2 / CANONICAL.typeElement.positionsPerBand;
  return new THREE.Vector3(
    Math.sin(a) * radial / (bodyRadius * bodyRadius),
    y / (bodyYRadius * bodyYRadius),
    Math.cos(a) * radial / (bodyRadius * bodyRadius)
  ).normalize();
}

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

function openPositiveDriveBeltPathP4(x, motorCenter, motorRadius, cycleCenter, cycleRadius, arcSegments = 24) {
  const dy = cycleCenter.y - motorCenter.y;
  const dz = cycleCenter.z - motorCenter.z;
  const centerDistance = Math.hypot(dy, dz);
  const radiusDifference = cycleRadius - motorRadius;
  if (cycleRadius < motorRadius || centerDistance <= Math.abs(radiusDifference)) {
    throw new Error('P4 positive-drive belt centers/radii do not admit the intended external tangents');
  }

  const uy = dy / centerDistance;
  const uz = dz / centerDistance;
  const py = -uz;
  const pz = uy;
  const a = (motorRadius - cycleRadius) / centerDistance;
  const b = Math.sqrt(Math.max(0, 1 - a * a));

  let nA = { y: a * uy + b * py, z: a * uz + b * pz };
  let nB = { y: a * uy - b * py, z: a * uz - b * pz };
  let thetaA = Math.atan2(nA.z, nA.y);
  let thetaB = Math.atan2(nB.z, nB.y);
  const positiveModulo = angle => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let motorWrap = positiveModulo(thetaB - thetaA);

  // Choose A/B so the motor gets the shorter external-contact arc and the larger cycle pulley
  // gets the complementary wrap. This is a P4 geometric solve from the reconstructed pitch circles.
  if (motorWrap > Math.PI) {
    [nA, nB] = [nB, nA];
    [thetaA, thetaB] = [thetaB, thetaA];
    motorWrap = positiveModulo(thetaB - thetaA);
  }
  const thetaBUnwrapped = thetaA + motorWrap;
  const cycleWrap = Math.PI * 2 - motorWrap;

  const pointFromNormal = (center, radius, normal) => new THREE.Vector3(
    x,
    center.y + normal.y * radius,
    center.z + normal.z * radius
  );
  const pointFromAngle = (center, radius, angle) => new THREE.Vector3(
    x,
    center.y + Math.cos(angle) * radius,
    center.z + Math.sin(angle) * radius
  );

  const motorA = pointFromNormal(motorCenter, motorRadius, nA);
  const cycleA = pointFromNormal(cycleCenter, cycleRadius, nA);
  const cycleB = pointFromNormal(cycleCenter, cycleRadius, nB);
  const motorB = pointFromNormal(motorCenter, motorRadius, nB);

  const points = [motorA, cycleA];
  for (let i = 1; i <= arcSegments; i += 1) {
    points.push(pointFromAngle(cycleCenter, cycleRadius, thetaA - cycleWrap * i / arcSegments));
  }
  points.push(motorB);
  for (let i = 1; i < arcSegments; i += 1) {
    points.push(pointFromAngle(motorCenter, motorRadius, thetaBUnwrapped - motorWrap * i / arcSegments));
  }

  const tangentA = cycleA.clone().sub(motorA);
  const tangentB = cycleB.clone().sub(motorB);
  const tangentOrthogonalityErrorMm = Math.max(
    Math.abs(tangentA.y * nA.y + tangentA.z * nA.z),
    Math.abs(tangentB.y * nB.y + tangentB.z * nB.z)
  );
  const straightSpanMm = Math.sqrt(centerDistance * centerDistance - radiusDifference * radiusDifference);
  const centerlineLengthMmP4 =
    2 * straightSpanMm +
    motorRadius * motorWrap +
    cycleRadius * cycleWrap;

  return {
    points,
    centerDistanceMmP4: centerDistance,
    straightSpanMmP4: straightSpanMm,
    motorWrapDegP4: THREE.MathUtils.radToDeg(motorWrap),
    cycleWrapDegP4: THREE.MathUtils.radToDeg(cycleWrap),
    tangentOrthogonalityErrorMm,
    centerlineLengthMmP4
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

  const slugDepth = 1.35;
  const slugGeo = new THREE.BoxGeometry(2.9, 2.6, slugDepth);
  const slugs = new THREE.InstancedMesh(slugGeo, darkMetal, CANONICAL.typeElement.characterCount);
  slugs.name = '88 surface-normal type slug cues';
  const matrix = new THREE.Matrix4();
  const rotationMatrix = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3(1,1,1);
  const normal = new THREE.Vector3();
  const tangentX = new THREE.Vector3();
  const tangentY = new THREE.Vector3();
  const surface = new THREE.Vector3();
  const p = new THREE.Vector3();
  let index = 0;
  const bodyRadius = CANONICAL.typeElement.structuralRadiusP4Mm;
  const bodyYRadius = bodyRadius * 0.90;
  for (let band = 0; band < CANONICAL.typeElement.bands; band += 1) {
    const lat = TYPE_BAND_LATITUDES_P4[band];
    const y = lat * bodyYRadius;
    const radial = bodyRadius * Math.sqrt(Math.max(0, 1 - (y * y) / (bodyYRadius * bodyYRadius)));
    for (let slot = 0; slot < CANONICAL.typeElement.positionsPerBand; slot += 1) {
      const a = slot * Math.PI * 2 / CANONICAL.typeElement.positionsPerBand;
      surface.set(Math.sin(a) * radial, y, Math.cos(a) * radial);

      // P4 functional geometry: each slug face is tangent to the ellipsoidal structural
      // body instead of sharing a global orientation. Exact glyph-face sections remain unresolved.
      normal.set(
        surface.x / (bodyRadius * bodyRadius),
        surface.y / (bodyYRadius * bodyYRadius),
        surface.z / (bodyRadius * bodyRadius)
      ).normalize();
      tangentX.set(Math.cos(a), 0, -Math.sin(a)).normalize();
      tangentY.copy(normal).cross(tangentX).normalize();
      rotationMatrix.makeBasis(tangentX, tangentY, normal);
      q.setFromRotationMatrix(rotationMatrix);
      p.copy(surface).addScaledVector(normal, slugDepth * 0.5);
      matrix.compose(p, q, scale);
      slugs.setMatrixAt(index++, matrix);
    }
  }
  slugs.instanceMatrix.needsUpdate = true;
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

  const root = new THREE.Group();
  root.name = 'paper sheet + platen-wrap presentation';

  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const sheetWidthMmP5 = 260;
  const sheetHeightMmP5 = 112;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(sheetWidthMmP5, sheetHeightMmP5), mat);
  sheet.name = 'paper output sheet';
  const baseY = 169;
  const stampOriginYPxP5 = 86;
  const stampPixelsPerMmP5 = canvas.height / sheetHeightMmP5;
  let lastStamp = null;
  const wrapRadiusMmP4 = CANONICAL.platen.radiusMm + 0.65;
  const backTangentZP4 = P4.platen.z - wrapRadiusMmP4;
  sheet.position.set(0, baseY, backTangentZP4);
  sheet.userData.component = COMPONENTS.paper;
  pickables.push(sheet);
  root.add(sheet);

  // The source material establishes the platen/paper relationship but not an exact hidden
  // wrap angle for this branch. This P4 surface prevents the visible sheet from reading as a
  // disconnected billboard while keeping the exact contact arc explicitly unresolved.
  const wrapStartAngleP4 = Math.PI;
  const wrapEndAngleP4 = deg(-24);
  const wrapSegments = 28;
  const halfWidth = 130;
  const wrapVertices = [];
  const wrapUvs = [];
  const wrapIndices = [];
  for (let i = 0; i <= wrapSegments; i += 1) {
    const t = i / wrapSegments;
    const angle = THREE.MathUtils.lerp(wrapStartAngleP4, wrapEndAngleP4, t);
    const y = P4.platen.y + Math.sin(angle) * wrapRadiusMmP4;
    const z = P4.platen.z + Math.cos(angle) * wrapRadiusMmP4;
    wrapVertices.push(-halfWidth, y, z, halfWidth, y, z);
    wrapUvs.push(0, 1 - t, 1, 1 - t);
    if (i < wrapSegments) {
      const a = i * 2;
      const b = a + 2;
      wrapIndices.push(a, a + 1, b + 1, a, b + 1, b);
    }
  }
  const wrapGeometry = new THREE.BufferGeometry();
  wrapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wrapVertices, 3));
  wrapGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(wrapUvs, 2));
  wrapGeometry.setIndex(wrapIndices);
  wrapGeometry.computeVertexNormals();
  const wrapMaterial = new THREE.MeshStandardMaterial({
    color: 0xeee9db,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
  wrap.name = 'P4 paper wrap around platen';
  wrap.userData.component = COMPONENTS.paper;
  wrap.castShadow = false;
  wrap.receiveShadow = true;
  pickables.push(wrap);
  root.add(wrap);

  function setAdvance(mm) {
    // The live output sheet retains the existing visible translation driven by physical
    // paper advance; the P4 contact wrap remains registered to the platen as a topology cue.
    sheet.position.y = baseY + (Number(mm) || 0);
  }

  function clear() {
    ctx.fillStyle = '#eee9db';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#dad2c1';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    lastStamp = null;
    texture.needsUpdate = true;
  }

  function stamp(character, carrierX, paperAdvanceMm) {
    const usableW = canvas.width - 120;
    const normalized = (carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.writingLineMm;
    const x = 60 + THREE.MathUtils.clamp(normalized, 0, 1) * usableW;
    const liveAdvanceMm = Number(paperAdvanceMm) || 0;
    // Marks are recorded in paper-local coordinates. As the physical sheet advances upward
    // through the machine, the next impact lands farther down the sheet's local texture.
    // The physical/paper-advance input can be P2 platen-derived; this browser texture scale is P5.
    const yUnclamped = stampOriginYPxP5 + liveAdvanceMm * stampPixelsPerMmP5;
    const y = THREE.MathUtils.clamp(yUnclamped, 28, canvas.height - 28);
    ctx.fillStyle = '#1a1b1a';
    ctx.font = 'bold 32px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character || '•', x, y);
    lastStamp = {
      character: character || '•',
      carrierX,
      paperAdvanceMm: liveAdvanceMm,
      xPx: x,
      yPx: y,
      unclampedYPx: yUnclamped
    };
    texture.needsUpdate = true;
  }

  function stampDiagnostics() {
    return {
      sheetWidthMmP5,
      sheetHeightMmP5,
      originYPxP5: stampOriginYPxP5,
      pixelsPerMmP5: stampPixelsPerMmP5,
      lastStamp: lastStamp ? { ...lastStamp } : null,
      placementClass: 'paper-local y from live sheet advance × P5 canvas scale; no arbitrary logical-line pixel step'
    };
  }

  clear();
  setAdvance(0);
  return {
    mesh: root,
    clear,
    stamp,
    setAdvance,
    wrapRadiusMmP4,
    wrapStartAngleDegP4: THREE.MathUtils.radToDeg(wrapStartAngleP4),
    wrapEndAngleDegP4: THREE.MathUtils.radToDeg(wrapEndAngleP4),
    wrapSpanDegP4: THREE.MathUtils.radToDeg(wrapStartAngleP4 - wrapEndAngleP4),
    stampDiagnostics
  };
}

export function createSelectricModel() {
  const root = new THREE.Group();
  root.name = 'IBM Selectric 721 — constructive public reconstruction';

  const pickables = [];
  const assemblies = [];
  const state = {
    explosion: 0,
    carrierX: 0,
    leftMarginInsetColumns: 0,
    rightMarginInsetColumns: 0,
    leftMarginX: -CANONICAL.writingLineMm / 2,
    rightMarginX: CANONICAL.writingLineMm / 2,
    tiltBand: 0,
    rotateUnit: 0,
    shiftHemisphere: 0,
    shiftAngleDeg: 0,
    ribbonLift: 0,
    ribbonLiftCommand: 0,
    ribbonPrintMode: 'middle',
    ribbonLoadState: false,
    ribbonFeedSuppressedCount: 0,
    printApproach: 0,
    platenIndex: 0,
    paperAdvanceMm: 0,
    manualPaperAlignmentMmP5: 0,
    feedRollPhaseRad: 0,
    bailRollPhaseRad: 0,
    lineSpacingTeeth: 1,
    cyclePhase: 0,
    keyboardCode: 0,
    cordPhase: 0,
    serviceCoverOpen: 0,
    selectorInputs: { T1: 0, T2: 0, R1: 0, R2: 0, R2A: 0, fiveUnit: 0 },
    selectionNormalized: { qTilt: 0, q1: 0, q2: 0, qSigned: 0 },
    ribbonFeedStep: 0,
    ribbonFeedApproxRatchetTeeth: 0,
    ribbonFeedDirection: 1,
    ribbonFeedStrokeInDirection: 0,
    ribbonSpoolFillP5: [0.86, 0.14],
    ribbonReverseCount: 0,
    ribbonReversePhase: 0,
    ribbonReverseState: 'feeding',
    ribbonReverseThresholdStepsP5: 12,
    motorPhase: 0,
    keyboardPressCharacter: null,
    keyboardPress: 0,
    operationalCamAction: 'rest',
    operationalCamPhase: 0,
    backspaceLinkage: 0,
    tensionArmAngleDeg: 0,
    carrierReturnDrivePhase: 0,
    tabGovernorPhase: 0,
    tabStopIndices: [],
    tiltDetent: 0,
    rotateDetent: 0,
    feedRollsEngaged: true,
    platenVariableEngaged: false,
    manualPlatenAngle: 0,
    copyControlSetting: 0,
    copyControlOffsetZ: 0,
    paperBailEngaged: true,
    paperBailRollerPositionsP5: { left: 0.4, right: 0.4 }
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

  const motorDriveRotor = new THREE.Group();
  motorDriveRotor.name = 'motor positive-drive pulley rotor';
  motorDriveRotor.position.set(-145, 39, 42);
  driveAssembly.add(motorDriveRotor);

  const drivePulley = pulley(motorPitchRadiusP4, 10, darkMetal, '8-tooth motor positive-drive pulley');
  addPickable(drivePulley, COMPONENTS.drive, pickables);
  motorDriveRotor.add(drivePulley);

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
      new THREE.Vector3(0, Math.cos(a) * motorPitchRadiusP4, Math.sin(a) * motorPitchRadiusP4),
      driveToothQuat,
      driveToothScale
    );
    motorTeeth.setMatrixAt(i, driveToothMatrix);
  }
  motorTeeth.userData.component = COMPONENTS.drive;
  motorTeeth.castShadow = true;
  pickables.push(motorTeeth);
  motorDriveRotor.add(motorTeeth);

  const cycleDriveRotor = new THREE.Group();
  cycleDriveRotor.name = 'continuously rotating cycle-clutch pulley hub';
  cycleDriveRotor.position.set(-145, P4.cycleShaft.y, P4.cycleShaft.z);
  driveAssembly.add(cycleDriveRotor);

  const cyclePulley = pulley(cyclePitchRadiusP4, 11, darkMetal, 'derived 29-tooth cycle-clutch pulley');
  addPickable(cyclePulley, COMPONENTS.drive, pickables);
  cycleDriveRotor.add(cyclePulley);

  const cycleToothGeo = new THREE.BoxGeometry(11.8, 2.0, 3.0);
  const cycleTeeth = new THREE.InstancedMesh(cycleToothGeo, metal, CANONICAL.drive.cycleClutchPulleyTeethDerived);
  cycleTeeth.name = '29 cycle-clutch-pulley tooth cues';
  const cycleToothMatrix = new THREE.Matrix4();
  const cycleToothQuat = new THREE.Quaternion();
  for (let i = 0; i < CANONICAL.drive.cycleClutchPulleyTeethDerived; i += 1) {
    const a = i * Math.PI * 2 / CANONICAL.drive.cycleClutchPulleyTeethDerived;
    cycleToothQuat.setFromEuler(new THREE.Euler(a, 0, 0));
    cycleToothMatrix.compose(
      new THREE.Vector3(0, Math.cos(a) * cyclePitchRadiusP4, Math.sin(a) * cyclePitchRadiusP4),
      cycleToothQuat,
      driveToothScale
    );
    cycleTeeth.setMatrixAt(i, cycleToothMatrix);
  }
  cycleTeeth.userData.component = COMPONENTS.drive;
  cycleTeeth.castShadow = true;
  pickables.push(cycleTeeth);
  cycleDriveRotor.add(cycleTeeth);

  const driveBeltPathP4 = openPositiveDriveBeltPathP4(
    -145,
    { y: 39, z: 42 },
    motorPitchRadiusP4,
    { y: P4.cycleShaft.y, z: P4.cycleShaft.z },
    cyclePitchRadiusP4
  );
  const driveBeltCurveP4 = new THREE.CatmullRomCurve3(
    driveBeltPathP4.points,
    true,
    'centripetal',
    0.5
  );
  const driveBelt = new THREE.Mesh(
    new THREE.TubeGeometry(driveBeltCurveP4, 120, 2.2, 8, true),
    material(0x222221, 0.05, 0.54)
  );
  driveBelt.name = 'P4 positive-drive belt on solved external tangents';
  addPickable(driveBelt, COMPONENTS.drive, pickables);
  driveAssembly.add(driveBelt);

  const driveBeltMarkerCountP5 = 4;
  const driveBeltMarkerPhaseP5 = [];
  const driveBeltMarkers = [];
  const driveBeltTravelFractionPerMotorRevP4 =
    (Math.PI * 2 * motorPitchRadiusP4) / driveBeltPathP4.centerlineLengthMmP4;
  for (let i = 0; i < driveBeltMarkerCountP5; i += 1) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 14, 10),
      material(0xb9b4a7, 0.08, 0.46)
    );
    marker.name = 'P5 positive-drive belt motion marker ' + (i + 1);
    marker.userData.component = COMPONENTS.drive;
    marker.castShadow = true;
    pickables.push(marker);
    driveAssembly.add(marker);
    driveBeltMarkers.push(marker);
    driveBeltMarkerPhaseP5.push(i / driveBeltMarkerCountP5);
  }

  function updateDriveBeltMarkers() {
    driveBeltMarkers.forEach((marker, index) => {
      const u = (
        driveBeltMarkerPhaseP5[index] +
        state.motorPhase * driveBeltTravelFractionPerMotorRevP4
      ) % 1;
      marker.position.copy(driveBeltCurveP4.getPointAt(u));
      marker.userData.beltPhaseP5 = u;
    });
  }

  const horizontalAssembly = makeAssembly('writing-line racks and cords', new THREE.Vector3(104, 8, -62));
  assemblies.push(horizontalAssembly);
  root.add(horizontalAssembly);

  const marginRack = box(P4.writingLineRacks.length, 4, 5, rackMat, 'IBM 1164743 margin rack');
  marginRack.position.set(0, P4.writingLineRacks.marginY, P4.writingLineRacks.marginZ);
  addPickable(marginRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(marginRack);

  const marginLimit = CANONICAL.writingLineMm / 2;
  const marginStops = {};
  for (const [side, x, name] of [
    ['left', -marginLimit, 'left physical margin stop / carrier-return terminator'],
    ['right', marginLimit, 'right physical margin stop / line-lock interface']
  ]) {
    const stop = box(8, 15, 10, darkMetal, name);
    stop.position.set(x, P4.writingLineRacks.marginY + 8, P4.writingLineRacks.marginZ);
    addPickable(stop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(stop);
    marginStops[side] = stop;
  }

  const tabRack = box(P4.writingLineRacks.length, 4, 5, darkMetal, 'IBM 1164102/6519354 7X1 tab rack family');
  tabRack.position.set(0, P4.writingLineRacks.tabY, P4.writingLineRacks.tabZ);
  addPickable(tabRack, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabRack);

  const tabStopBar = box(P4.writingLineRacks.length, 3.5, 4, metal, 'IBM 1124073 tab stop bar');
  tabStopBar.position.set(0, P4.writingLineRacks.tabY - 5, P4.writingLineRacks.tabZ + 1);
  addPickable(tabStopBar, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(tabStopBar);

  const tabStopMarkers = [];
  for (let stop = 0; stop < CANONICAL.nominalPositions; stop += 1) {
    const tabStop = box(2.2, 9, 7, metal, 'presentation tab stop');
    tabStop.position.set(
      -CANONICAL.writingLineMm / 2 + stop * CANONICAL.pitchMm,
      P4.writingLineRacks.tabY + 5,
      P4.writingLineRacks.tabZ
    );
    tabStop.visible = false;
    addPickable(tabStop, COMPONENTS.horizontalMotion, pickables);
    horizontalAssembly.add(tabStop);
    tabStopMarkers.push(tabStop);
  }

  const escapementShaft = shaft(270, 3.8, darkMetal, 'escapement / cord-drum shaft');
  escapementShaft.position.set(0, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementShaft, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementShaft);

  const mainspringCage = pulley(18, 15, darkMetal, 'mainspring cage presentation');
  mainspringCage.position.set(104, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(mainspringCage, COMPONENTS.mainspringCordSystem, pickables);
  horizontalAssembly.add(mainspringCage);

  const mainspringPoints = [];
  for (let i = 0; i <= 72; i += 1) {
    const a = i / 72 * Math.PI * 4.8;
    const r = 2.4 + i / 72 * 12.0;
    mainspringPoints.push(new THREE.Vector3(104, P4.cordSystem.shaftY + Math.cos(a) * r, P4.cordSystem.shaftZ + Math.sin(a) * r));
  }
  const mainspringSpiral = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mainspringPoints), 96, 0.7, 6, false),
    material(0xb8b0a0, 0.72, 0.34)
  );
  mainspringSpiral.name = 'P4 flat spiral mainspring cue';
  addPickable(mainspringSpiral, COMPONENTS.mainspringCordSystem, pickables);
  horizontalAssembly.add(mainspringSpiral);

  const tensionArm = new THREE.Group();
  tensionArm.name = 'right-side cord tension arm';
  tensionArm.position.set(P4.cordSystem.rightPulleyX, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  horizontalAssembly.add(tensionArm);
  const tensionArmBar = box(5, 5, 42, metal, 'pivoting tension-arm link');
  tensionArmBar.position.set(0, 8, -15);
  tensionArmBar.rotation.x = deg(-24);
  addPickable(tensionArmBar, COMPONENTS.mainspringCordSystem, pickables);
  tensionArm.add(tensionArmBar);
  const tensionPulley = pulley(7.5, 6, darkMetal, 'tension-arm pulley');
  tensionPulley.position.set(0, 20, -20);
  addPickable(tensionPulley, COMPONENTS.mainspringCordSystem, pickables);
  tensionArm.add(tensionPulley);

  for (const xOffset of [-3, 3]) {
    const springPoints = [];
    for (let i = 0; i <= 32; i += 1) {
      const a = i / 32 * Math.PI * 3.5;
      const r = 1.5 + i / 32 * 5.5;
      springPoints.push(new THREE.Vector3(
        P4.cordSystem.rightPulleyX + xOffset,
        P4.cordSystem.shaftY + Math.cos(a) * r,
        P4.cordSystem.shaftZ + Math.sin(a) * r
      ));
    }
    const tensionSpring = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 42, 0.42, 5, false),
      metal
    );
    tensionSpring.name = 'tension-arm spiral spring';
    addPickable(tensionSpring, COMPONENTS.mainspringCordSystem, pickables);
    horizontalAssembly.add(tensionSpring);
  }

  const escapementDrum = pulley(P4.cordSystem.drumRadius, 18, metal, 'escapement / tab cord drum');
  escapementDrum.position.set(72, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(escapementDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(escapementDrum);

  const returnDrum = pulley(P4.cordSystem.drumRadius, 18, darkMetal, 'carrier-return cord drum');
  returnDrum.position.set(-22, P4.cordSystem.shaftY, P4.cordSystem.shaftZ);
  addPickable(returnDrum, COMPONENTS.horizontalMotion, pickables);
  horizontalAssembly.add(returnDrum);

  const returnDriveGroup = new THREE.Group();
  returnDriveGroup.name = 'sustained carrier-return drive';
  returnDriveGroup.position.set(-62, P4.cordSystem.shaftY, P4.cordSystem.shaftZ + 2);
  horizontalAssembly.add(returnDriveGroup);

  const returnSpringClutch = pulley(12, 14, metal, 'carrier-return wrap/spring clutch cue');
  addPickable(returnSpringClutch, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(returnSpringClutch);

  const returnPinion = pulley(6.5, 8, darkMetal, 'carrier-return pinion');
  returnPinion.position.set(18, 0, 0);
  addPickable(returnPinion, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(returnPinion);

  const bevelGear = new THREE.Mesh(new THREE.CylinderGeometry(10, 6, 7, 24), metal);
  bevelGear.rotation.z = Math.PI / 2;
  bevelGear.position.set(30, 0, -1);
  bevelGear.name = 'carrier-return bevel-drive cue';
  addPickable(bevelGear, COMPONENTS.returnTabDrive, pickables);
  returnDriveGroup.add(bevelGear);

  const tabGovernorGroup = new THREE.Group();
  tabGovernorGroup.name = 'tab operational-shaft governor';
  tabGovernorGroup.position.set(52, P4.cordSystem.shaftY - 10, P4.cordSystem.shaftZ + 28);
  horizontalAssembly.add(tabGovernorGroup);

  const governorPinion = pulley(7, 7, darkMetal, 'tab governor pinion');
  addPickable(governorPinion, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorPinion);

  const governorClutch = pulley(11, 8, metal, 'tab governor spring-clutch cue');
  governorClutch.position.set(16, 0, 0);
  addPickable(governorClutch, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorClutch);

  const governorArm = box(4, 24, 4, metal, 'tab governor arm cue');
  governorArm.position.set(22, 8, 0);
  governorArm.rotation.z = deg(-25);
  addPickable(governorArm, COMPONENTS.returnTabDrive, pickables);
  tabGovernorGroup.add(governorArm);

  for (const [x, z, name] of [
    [P4.cordSystem.leftPulleyX, -36, 'left return pulley 1'],
    [P4.cordSystem.leftPulleyX, -58, 'left return pulley 2'],
    [P4.cordSystem.rightPulleyX - 18, -36, 'right escapement guide pulley']
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
    const normalized = (carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.writingLineMm;
    state.tensionArmAngleDeg = THREE.MathUtils.lerp(-5, 5, normalized);
    tensionArm.rotation.x = deg(state.tensionArmAngleDeg);
    const armAngle = tensionArm.rotation.x;
    const localY = 20;
    const localZ = -20;
    const tensionY = P4.cordSystem.shaftY + localY * Math.cos(armAngle) - localZ * Math.sin(armAngle);
    const tensionZ = P4.cordSystem.shaftZ + localY * Math.sin(armAngle) + localZ * Math.cos(armAngle);

    escapementCord.update([
      new THREE.Vector3(72, P4.cordSystem.shaftY, P4.cordSystem.shaftZ - 9),
      new THREE.Vector3(P4.cordSystem.rightPulleyX - 18, 60, -36),
      new THREE.Vector3(P4.cordSystem.rightPulleyX, tensionY, tensionZ),
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

  const paperFeedCarriage = new THREE.Group();
  paperFeedCarriage.name = 'copy-control moving platen / paper-feed carriage';
  platenAssembly.add(paperFeedCarriage);

  const platen = shaft(P4.platen.length, CANONICAL.platen.radiusMm, rubber, 'platen');
  platen.position.set(0, P4.platen.y, P4.platen.z);
  addPickable(platen, COMPONENTS.platen, pickables);
  paperFeedCarriage.add(platen);

  const platenKnobPivots = [];
  for (const x of [-159, 159]) {
    const pivot = new THREE.Group();
    pivot.name = x < 0 ? 'left platen knob phase pivot' : 'right platen knob phase pivot';
    pivot.position.set(x, P4.platen.y, P4.platen.z);

    const knob = shaft(28, 14, shellDark, x < 0 ? 'left platen knob' : 'right platen knob');
    addPickable(knob, COMPONENTS.platen, pickables);
    pivot.add(knob);

    const phaseCue = box(8.5, 1.2, 1.8, metal, x < 0 ? 'left platen phase cue' : 'right platen phase cue');
    phaseCue.position.set(0, 13.2, 0);
    addPickable(phaseCue, COMPONENTS.platen, pickables);
    pivot.add(phaseCue);

    paperFeedCarriage.add(pivot);
    platenKnobPivots.push(pivot);
  }

  function setPlatenPhysicalAngle(angle) {
    const a = Number(angle) || 0;
    platen.rotation.x = a;
    platenKnobPivots.forEach(pivot => {
      pivot.rotation.x = a;
    });
  }

  const paper = makePaper(pickables);
  paperFeedCarriage.add(paper.mesh);

  const ratchetGroup = new THREE.Group();
  ratchetGroup.name = '27-tooth platen ratchet group';
  ratchetGroup.position.set(P4.platen.length / 2 - 8, P4.platen.y, P4.platen.z);
  paperFeedCarriage.add(ratchetGroup);

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
  const frontFeedRollers = [];
  const rearFeedRollers = [];
  const rearFeedShaft = shaft(242, 2.4, metal, 'rear feed-roll shaft');
  rearFeedShaft.position.set(0, P4.platen.y - 17, P4.platen.z - 12);
  addPickable(rearFeedShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(rearFeedShaft);

  const frontFeedShaft = shaft(242, 2.4, metal, 'front feed-roll shaft');
  frontFeedShaft.position.set(0, P4.platen.y - 18, P4.platen.z + 18);
  addPickable(frontFeedShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(frontFeedShaft);

  function makeFeedRollerPivot(x, y, z, name) {
    const pivot = new THREE.Group();
    pivot.name = name + ' rotational pivot';
    pivot.position.set(x, y, z);
    pivot.userData.baseY = y;
    pivot.userData.baseZ = z;

    const roller = pulley(6.2, 15, rubber, name);
    addPickable(roller, COMPONENTS.paperFeed, pickables);
    pivot.add(roller);

    const phaseCue = box(7.5, 1.1, 1.7, metal, name + ' phase cue');
    phaseCue.position.set(0, 6.15, 0);
    addPickable(phaseCue, COMPONENTS.paperFeed, pickables);
    pivot.add(phaseCue);

    paperFeedCarriage.add(pivot);
    return pivot;
  }

  for (const x of feedRollXs) {
    rearFeedRollers.push(
      makeFeedRollerPivot(x, P4.platen.y - 11, P4.platen.z - 12, 'rear molded rubber feed roller')
    );
    frontFeedRollers.push(
      makeFeedRollerPivot(x, P4.platen.y - 12, P4.platen.z + 16, 'front molded rubber feed roller')
    );
  }

  const paperDeflector = box(238, 2.2, 42, shellDark, 'paper deflector beneath platen');
  paperDeflector.position.set(0, P4.platen.y - 23, P4.platen.z + 1);
  paperDeflector.rotation.x = deg(-5);
  addPickable(paperDeflector, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(paperDeflector);

  const paperBailPivot = new THREE.Group();
  paperBailPivot.name = 'two-stable-state paper bail';
  paperBailPivot.position.set(0, P4.platen.y + 27, P4.platen.z + 4);
  paperFeedCarriage.add(paperBailPivot);

  const bailBar = shaft(266, 2.8, metal, 'paper bail shaft');
  addPickable(bailBar, COMPONENTS.paperFeed, pickables);
  paperBailPivot.add(bailBar);

  const paperBailRollers = {};
  for (const [side, x] of [['left', -74], ['right', 74]]) {
    const pivot = new THREE.Group();
    pivot.name = side + ' paper bail roller rotational pivot';
    pivot.position.set(x, -3, -3);

    const roller = pulley(5.5, 12, rubber, side + ' laterally adjustable paper bail roller');
    addPickable(roller, COMPONENTS.paperFeed, pickables);
    pivot.add(roller);

    const phaseCue = box(6.7, 1.0, 1.5, metal, side + ' paper bail roller phase cue');
    phaseCue.position.set(0, 5.45, 0);
    addPickable(phaseCue, COMPONENTS.paperFeed, pickables);
    pivot.add(phaseCue);

    paperBailPivot.add(pivot);
    paperBailRollers[side] = pivot;
  }

  for (const sign of [-1, 1]) {
    const endLever = box(5, 23, 5, metal, sign < 0 ? 'left paper-bail end lever' : 'right paper-bail end lever');
    endLever.position.set(sign * 128, -8, 2);
    endLever.rotation.x = deg(-16);
    addPickable(endLever, COMPONENTS.paperFeed, pickables);
    paperBailPivot.add(endLever);

    const toggleSpring = new THREE.Mesh(
      new THREE.TorusGeometry(5, 0.7, 6, 18, Math.PI * 1.25),
      metal
    );
    toggleSpring.rotation.y = Math.PI / 2;
    toggleSpring.position.set(sign * 128, -18, 7);
    toggleSpring.name = sign < 0 ? 'left paper-bail hairpin toggle spring cue' : 'right paper-bail hairpin toggle spring cue';
    addPickable(toggleSpring, COMPONENTS.paperFeed, pickables);
    paperBailPivot.add(toggleSpring);
  }

  const indexPawl = box(5, 20, 4, darkMetal, 'platen index pawl');
  indexPawl.position.set(P4.platen.length / 2 - 20, P4.platen.y - 2, P4.platen.z + 15);
  indexPawl.rotation.x = deg(-22);
  indexPawl.userData.baseRotationX = indexPawl.rotation.x;
  addPickable(indexPawl, COMPONENTS.platenRatchet, pickables);
  paperFeedCarriage.add(indexPawl);

  const detentRoller = pulley(4.5, 5, metal, 'platen detent roller');
  detentRoller.position.set(P4.platen.length / 2 - 20, P4.platen.y + 13, P4.platen.z + 8);
  addPickable(detentRoller, COMPONENTS.platenRatchet, pickables);
  paperFeedCarriage.add(detentRoller);

  const lineSpacingSelectorPivot = new THREE.Group();
  lineSpacingSelectorPivot.name = 'single-double line-spacing selector pivot';
  lineSpacingSelectorPivot.position.set(P4.platen.length / 2 - 43, P4.platen.y + 17, P4.platen.z + 22);
  paperFeedCarriage.add(lineSpacingSelectorPivot);

  const lineSpacingSelectorArm = box(5, 28, 5, metal, 'line-spacing selector arm');
  lineSpacingSelectorArm.position.set(0, 12, 0);
  addPickable(lineSpacingSelectorArm, COMPONENTS.paperFeed, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorArm);

  const lineSpacingSelectorKnob = box(14, 7, 11, shellDark, 'line-spacing selector knob');
  lineSpacingSelectorKnob.position.set(0, 27, 1);
  addPickable(lineSpacingSelectorKnob, COMPONENTS.paperFeed, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorKnob);

  const lineSpacingSelectorLink = box(4, 18, 4, darkMetal, 'line-spacing selector pawl-stop link cue');
  lineSpacingSelectorLink.position.set(-7, 2, -4);
  lineSpacingSelectorLink.rotation.x = deg(-18);
  addPickable(lineSpacingSelectorLink, COMPONENTS.platenRatchet, pickables);
  lineSpacingSelectorPivot.add(lineSpacingSelectorLink);

  const variableRelease = box(18, 7, 9, metal, 'platen variable-release coupling');
  variableRelease.position.set(-P4.platen.length / 2 + 17, P4.platen.y, P4.platen.z);
  addPickable(variableRelease, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(variableRelease);

  const feedRollActuatingShaft = shaft(276, 2.6, darkMetal, 'feed-roll actuating shaft / common release coordinate');
  feedRollActuatingShaft.position.set(0, P4.platen.y - 29, P4.platen.z + 8);
  addPickable(feedRollActuatingShaft, COMPONENTS.paperFeed, pickables);
  paperFeedCarriage.add(feedRollActuatingShaft);

  const frontReleaseArms = [];
  const rearReleaseArms = [];
  for (const x of [-105, 105]) {
    const frontArm = box(5, 25, 5, metal, 'front feed-roll release arm cue');
    frontArm.position.set(x, P4.platen.y - 19, P4.platen.z + 13);
    frontArm.userData.baseRotationX = deg(-8);
    frontArm.rotation.x = frontArm.userData.baseRotationX;
    addPickable(frontArm, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(frontArm);
    frontReleaseArms.push(frontArm);

    const rearArm = box(5, 24, 5, metal, 'rear feed-roll arm coupled by shoulder-screw cue');
    rearArm.position.set(x, P4.platen.y - 18, P4.platen.z - 11);
    rearArm.userData.baseRotationX = deg(8);
    rearArm.rotation.x = rearArm.userData.baseRotationX;
    addPickable(rearArm, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(rearArm);
    rearReleaseArms.push(rearArm);

    const coupling = box(4, 4, 25, darkMetal, 'front/rear feed-arm shoulder-screw coupling cue');
    coupling.position.set(x, P4.platen.y - 24, P4.platen.z + 1);
    addPickable(coupling, COMPONENTS.paperFeed, pickables);
    paperFeedCarriage.add(coupling);
  }

  const paperReleasePivot = new THREE.Group();
  paperReleasePivot.name = 'right-end paper-release lever';
  paperReleasePivot.position.set(P4.platen.length / 2 + 7, P4.platen.y - 8, P4.platen.z + 15);
  paperFeedCarriage.add(paperReleasePivot);
  const paperReleaseLever = box(7, 33, 7, shellDark, 'paper-release lever');
  paperReleaseLever.position.set(0, 15, 0);
  addPickable(paperReleaseLever, COMPONENTS.paperFeed, pickables);
  paperReleasePivot.add(paperReleaseLever);

  const copyControlRotor = new THREE.Group();
  copyControlRotor.name = 'copy-control shaft + eccentric rotor';
  copyControlRotor.position.set(0, P4.platen.y - 31, P4.platen.z - 20);
  platenAssembly.add(copyControlRotor);

  const copyControlShaft = shaft(326, 2.8, darkMetal, 'copy-control shaft');
  addPickable(copyControlShaft, COMPONENTS.paperFeed, pickables);
  copyControlRotor.add(copyControlShaft);

  const copyControlEccentrics = [];
  const copyControlLeverPivot = new THREE.Group();
  copyControlLeverPivot.name = 'left copy-control lever / five-position detent';
  copyControlLeverPivot.position.set(-P4.platen.length / 2 - 11, P4.platen.y - 18, P4.platen.z - 20);
  platenAssembly.add(copyControlLeverPivot);
  const copyControlLever = box(7, 31, 7, shellDark, 'copy-control lever');
  copyControlLever.position.set(0, 14, 0);
  addPickable(copyControlLever, COMPONENTS.paperFeed, pickables);
  copyControlLeverPivot.add(copyControlLever);

  const copyControlDetentPlate = new THREE.Group();
  copyControlDetentPlate.name = 'five-position copy-control detent presentation';
  copyControlDetentPlate.position.copy(copyControlLeverPivot.position);
  platenAssembly.add(copyControlDetentPlate);
  const copyControlDetentMarkers = [];
  for (let setting = 0; setting < 5; setting += 1) {
    const angle = deg(-setting * 8);
    const radiusP5 = 35;
    const marker = box(4.2, 5.4, 2.2, metal, 'copy-control detent marker ' + (setting + 1));
    marker.position.set(7.5, Math.cos(angle) * radiusP5, Math.sin(angle) * radiusP5);
    marker.rotation.x = angle;
    addPickable(marker, COMPONENTS.paperFeed, pickables);
    copyControlDetentPlate.add(marker);
    copyControlDetentMarkers.push(marker);
  }

  for (const x of [-P4.platen.length / 2 - 3, P4.platen.length / 2 + 3]) {
    const eccentric = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 5, 24), metal);
    eccentric.rotation.z = Math.PI / 2;
    eccentric.position.set(x, 0, 0);
    eccentric.name = 'copy-control eccentric collar cue';
    addPickable(eccentric, COMPONENTS.paperFeed, pickables);
    copyControlRotor.add(eccentric);
    copyControlEccentrics.push(eccentric);
  }

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
  tiltDifferential.position.set(-76, 68, -35);
  selectionAssembly.add(tiltDifferential);
  const tiltLeverSpan = 60;
  const tiltArmA = box(tiltLeverSpan, 4, 6, metal, 'tilt differential lever · normalized span 3');
  addPickable(tiltArmA, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltArmA);
  const tiltT2Input = box(4, 28, 5, darkMetal, 'T2 input at normalized x=0');
  tiltT2Input.position.set(-tiltLeverSpan / 2, 14, 0);
  tiltT2Input.userData.baseY = tiltT2Input.position.y;
  addPickable(tiltT2Input, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltT2Input);
  const tiltT1Input = box(4, 28, 5, darkMetal, 'T1 input at normalized x=3');
  tiltT1Input.position.set(tiltLeverSpan / 2, 14, 0);
  tiltT1Input.userData.baseY = tiltT1Input.position.y;
  addPickable(tiltT1Input, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltT1Input);
  const tiltLink = box(4, 36, 5, darkMetal, 'tilt output link at normalized x=1');
  tiltLink.position.set(-tiltLeverSpan / 6, 16, 0);
  tiltLink.userData.baseY = tiltLink.position.y;
  addPickable(tiltLink, COMPONENTS.selection, pickables);
  tiltDifferential.add(tiltLink);

  const rotateFirst = new THREE.Group();
  rotateFirst.position.set(12, 56, -34);
  selectionAssembly.add(rotateFirst);
  const rotateFirstSpan = 54;
  const rotateFirstLever = box(rotateFirstSpan, 4, 6, metal, 'rotate first lever · normalized span 3');
  addPickable(rotateFirstLever, COMPONENTS.selection, pickables);
  rotateFirst.add(rotateFirstLever);
  const rotateFirstLink = box(4, 28, 5, darkMetal, 'rotate q1 link at normalized x=2');
  rotateFirstLink.position.set(rotateFirstSpan / 6, 14, 0);
  rotateFirstLink.userData.baseY = rotateFirstLink.position.y;
  addPickable(rotateFirstLink, COMPONENTS.selection, pickables);
  rotateFirst.add(rotateFirstLink);

  const rotateSecond = new THREE.Group();
  rotateSecond.position.set(68, 68, -38);
  selectionAssembly.add(rotateSecond);
  const rotateSecondSpan = 58;
  const rotateSecondLever = box(rotateSecondSpan, 4, 6, metal, 'rotate second lever · normalized span 5');
  addPickable(rotateSecondLever, COMPONENTS.selection, pickables);
  rotateSecond.add(rotateSecondLever);
  const rotateSecondLink = box(4, 30, 5, darkMetal, 'rotate q2 link at normalized x=3');
  rotateSecondLink.position.set(rotateSecondSpan * 0.1, 15, 0);
  rotateSecondLink.userData.baseY = rotateSecondLink.position.y;
  addPickable(rotateSecondLink, COMPONENTS.selection, pickables);
  rotateSecond.add(rotateSecondLink);

  const rotateBalance = new THREE.Group();
  rotateBalance.position.set(108, 77, -42);
  selectionAssembly.add(rotateBalance);
  const rotateArm = box(54, 4, 6, metal, 'rotate signed balance lever · normalized span 2');
  addPickable(rotateArm, COMPONENTS.selection, pickables);
  rotateBalance.add(rotateArm);
  const rotateBellcrank = box(5, 34, 5, darkMetal, 'rotate balance midpoint output');
  rotateBellcrank.position.set(0, 15, 0);
  rotateBellcrank.userData.baseY = rotateBellcrank.position.y;
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

    const qTilt = (T1 + 2 * T2) / 3;
    const q1 = (positive.R1 + 2 * positive.R2) / 3;
    const q2 = (3 * q1 + 2 * positive.R2A) / 5;
    const qSigned = q2 - fiveUnit;
    state.selectionNormalized = { qTilt, q1, q2, qSigned };

    selectorLatches.T1.position.y = selectorLatches.T1.userData.baseY - T1 * 7;
    selectorLatches.T2.position.y = selectorLatches.T2.userData.baseY - T2 * 7;
    selectorLatches.R1.position.y = selectorLatches.R1.userData.baseY - positive.R1 * 7;
    selectorLatches.R2.position.y = selectorLatches.R2.userData.baseY - positive.R2 * 7;
    selectorLatches.R2A.position.y = selectorLatches.R2A.userData.baseY - positive.R2A * 7;
    fiveUnitBail.position.y = fiveUnitBail.userData.baseY - fiveUnit * 8;

    tiltT1Input.position.y = tiltT1Input.userData.baseY - T1 * 8;
    tiltT2Input.position.y = tiltT2Input.userData.baseY - T2 * 8;
    tiltLink.position.y = tiltLink.userData.baseY - qTilt * 12;
    rotateFirstLink.position.y = rotateFirstLink.userData.baseY - q1 * 10;
    rotateSecondLink.position.y = rotateSecondLink.userData.baseY - q2 * 10;
    rotateBellcrank.position.y = rotateBellcrank.userData.baseY - qSigned * 10;
  }

  const carrierAssembly = makeAssembly('carrier assembly', new THREE.Vector3(-92, 102, -8));
  assemblies.push(carrierAssembly);
  root.add(carrierAssembly);

  const carrierMotion = new THREE.Group();
  carrierMotion.name = 'carrier mechanical transform';
  carrierAssembly.add(carrierMotion);

  const writingPositionIndicator = box(
    3.5,
    8,
    4,
    material(0xa64032, 0.1, 0.52),
    'carrier-parented writing-position indicator'
  );
  writingPositionIndicator.position.set(0, 85, 25.5);
  addPickable(writingPositionIndicator, COMPONENTS.horizontalMotion, pickables);
  carrierMotion.add(writingPositionIndicator);

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
  const reverseTriggers = [];
  const ribbonPawlTargetXP5 = 30;
  const ribbonFillMinP5 = 0.14;
  const ribbonFillMaxP5 = 0.86;
  const ribbonFillStepP5 = (ribbonFillMaxP5 - ribbonFillMinP5) / state.ribbonReverseThresholdStepsP5;
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
    reverseTrigger.userData.baseRotationZ = reverseTrigger.rotation.z;
    addPickable(reverseTrigger, COMPONENTS.ribbon, pickables);
    ribbonAssembly.add(reverseTrigger);
    reverseTriggers.push(reverseTrigger);

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

  function ribbonRollRadiusScaleP5(fill) {
    return THREE.MathUtils.lerp(0.52, 1.04, THREE.MathUtils.clamp(fill, 0, 1));
  }

  function updateRibbonSpoolFillVisuals() {
    ribbonSpools.forEach((spool, index) => {
      const radiusScale = ribbonRollRadiusScaleP5(state.ribbonSpoolFillP5[index]);
      spool.scale.set(radiusScale, 1, radiusScale);
    });
  }

  function updateRibbonPath(lift) {
    const liftY = THREE.MathUtils.lerp(P4.ribbon.yRest, P4.ribbon.yLift, lift);
    leftGuide.y = liftY;
    rightGuide.y = liftY;
    const leftRadius = P4.ribbon.spoolRadiusP4 * ribbonSpools[0].scale.x;
    const rightRadius = P4.ribbon.spoolRadiusP4 * ribbonSpools[1].scale.x;
    updateRibbonSegment(
      ribbonLeftSegment,
      new THREE.Vector3(-P4.ribbon.spoolCenterX + leftRadius * 0.82, 94, -50),
      leftGuide
    );
    updateRibbonSegment(ribbonCenterSegment, leftGuide, rightGuide);
    updateRibbonSegment(
      ribbonRightSegment,
      rightGuide,
      new THREE.Vector3(P4.ribbon.spoolCenterX - rightRadius * 0.82, 94, -50)
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

  const tiltRing = new THREE.Mesh(
    new THREE.TorusGeometry(18.3, 1.8, 8, 36),
    metal
  );
  tiltRing.rotation.x = Math.PI / 2;
  tiltRing.position.set(0, typeLocalY - 9.2, typeLocalZ + 0.5);
  tiltRing.name = 'tilt ring with four detent-notch cues';
  addPickable(tiltRing, COMPONENTS.fineAlignment, pickables);
  rocker.add(tiltRing);

  for (let band = 0; band < 4; band += 1) {
    const notch = box(4.5, 2.0, 2.5, darkMetal, 'tilt-ring detent notch cue band ' + band);
    const a = band * Math.PI / 2;
    notch.position.set(
      Math.sin(a) * 18.2,
      typeLocalY - 9.2,
      typeLocalZ + Math.cos(a) * 18.2
    );
    notch.rotation.y = a;
    addPickable(notch, COMPONENTS.fineAlignment, pickables);
    rocker.add(notch);
  }

  const skirtNotchCue = box(4.2, 3.8, 2.0, metal, 'type-element skirt rotate-detent notch cue');
  skirtNotchCue.position.set(0, -13.8, CANONICAL.typeElement.structuralRadiusP4Mm - 0.6);
  addPickable(skirtNotchCue, COMPONENTS.fineAlignment, pickables);
  typeElement.add(skirtNotchCue);

  const tiltDetentPivot = new THREE.Group();
  tiltDetentPivot.name = 'tilt detent pivot';
  tiltDetentPivot.position.set(-23, P4.typeball.y - 11, P4.typeball.zRest + 17);
  carrierMotion.add(tiltDetentPivot);
  const tiltDetentArm = box(5, 30, 5, metal, 'tilt detent arm');
  tiltDetentArm.position.set(0, 12, -5);
  tiltDetentArm.rotation.x = deg(-14);
  addPickable(tiltDetentArm, COMPONENTS.fineAlignment, pickables);
  tiltDetentPivot.add(tiltDetentArm);
  const tiltDetentTip = box(5.5, 5.5, 8, darkMetal, 'tilt detent V-tip cue');
  tiltDetentTip.position.set(0, 27, -11);
  addPickable(tiltDetentTip, COMPONENTS.fineAlignment, pickables);
  tiltDetentPivot.add(tiltDetentTip);

  const rotateDetentPivot = new THREE.Group();
  rotateDetentPivot.name = 'rotate detent pivot';
  rotateDetentPivot.position.set(23, P4.typeball.y - 14, P4.typeball.zRest + 15);
  carrierMotion.add(rotateDetentPivot);
  const rotateDetentArm = box(5, 28, 5, metal, 'rotate detent arm');
  rotateDetentArm.position.set(0, 11, -5);
  rotateDetentArm.rotation.x = deg(-12);
  addPickable(rotateDetentArm, COMPONENTS.fineAlignment, pickables);
  rotateDetentPivot.add(rotateDetentArm);
  const rotateDetentTip = box(5.2, 5.2, 8, darkMetal, 'rotate detent skirt-contact cue');
  rotateDetentTip.position.set(0, 25, -10);
  addPickable(rotateDetentTip, COMPONENTS.fineAlignment, pickables);
  rotateDetentPivot.add(rotateDetentTip);

  const detentFollower = box(20, 5, 6, darkMetal, 'print-sleeve detent cam follower cue');
  detentFollower.position.set(0, P4.printShaft.y + 16, P4.printShaft.z + 8);
  addPickable(detentFollower, COMPONENTS.fineAlignment, pickables);
  carrierMotion.add(detentFollower);

  const carrierTiltPulley = pulley(8.5, 5.5, metal, 'carrier gearless tilt pulley');
  carrierTiltPulley.position.set(-21, 91, -42);
  addPickable(carrierTiltPulley, COMPONENTS.selection, pickables);
  carrierMotion.add(carrierTiltPulley);

  const carrierRotatePulley = pulley(8.5, 5.5, darkMetal, 'carrier rotate pulley');
  carrierRotatePulley.position.set(21, 91, -42);
  addPickable(carrierRotatePulley, COMPONENTS.selection, pickables);
  carrierMotion.add(carrierRotatePulley);

  function selectionTapePointsAt(x) {
    const qTilt = state.selectionNormalized.qTilt;
    const qSigned = state.selectionNormalized.qSigned;
    const shiftOffset = state.shiftAngleDeg / 180 * 8;

    const tilt = [
      new THREE.Vector3(-143, 59 - qTilt * 9, -31),
      new THREE.Vector3(-143, 91, -42),
      new THREE.Vector3(x - 22, 91, -42),
      new THREE.Vector3(x + 22, 91, -42),
      new THREE.Vector3(143, 91, -42),
      new THREE.Vector3(143, 59, -31)
    ];

    const rotate = [
      new THREE.Vector3(-143, 60 - qSigned * 9, -29),
      new THREE.Vector3(-143, 88, -46),
      new THREE.Vector3(x - 22, 88, -46),
      new THREE.Vector3(x + 22, 88, -46),
      new THREE.Vector3(143, 88, -46),
      new THREE.Vector3(143, 60 + shiftOffset, -29)
    ];
    return { tilt, rotate };
  }

  function polylineLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i += 1) length += points[i].distanceTo(points[i - 1]);
    return length;
  }

  function selectionTapeInvariantError() {
    const xs = [-CANONICAL.writingLineMm / 2, 0, CANONICAL.writingLineMm / 2];
    const tiltLengths = xs.map(x => polylineLength(selectionTapePointsAt(x).tilt));
    const rotateLengths = xs.map(x => polylineLength(selectionTapePointsAt(x).rotate));
    return {
      tiltMm: Math.max(...tiltLengths) - Math.min(...tiltLengths),
      rotateMm: Math.max(...rotateLengths) - Math.min(...rotateLengths)
    };
  }

  function updateSelectionTapes() {
    const points = selectionTapePointsAt(state.carrierX);
    tiltTape.update(points.tilt);
    rotateTape.update(points.rotate);
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

  function setCarrierReturnDrive(value) {
    state.carrierReturnDrivePhase = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    returnSpringClutch.rotation.x = state.carrierReturnDrivePhase * Math.PI * 4;
    returnPinion.rotation.x = state.carrierReturnDrivePhase * Math.PI * 8;
    bevelGear.rotation.x = state.carrierReturnDrivePhase * Math.PI * 6;
  }

  function setTabGovernor(value) {
    state.tabGovernorPhase = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    tabGovernorGroup.rotation.x = state.tabGovernorPhase * Math.PI * 4;
  }

  function setTabStops(indices = []) {
    const normalized = [...new Set(
      (Array.isArray(indices) ? indices : [])
        .map(value => Math.round(Number(value)))
        .filter(value => Number.isFinite(value) && value > 0 && value < CANONICAL.nominalPositions)
    )].sort((a, b) => a - b);
    state.tabStopIndices = normalized;
    const active = new Set(normalized);
    tabStopMarkers.forEach((marker, index) => {
      marker.visible = active.has(index);
    });
  }

  function setTabStopAt(index, enabled = true) {
    const nextIndex = Math.round(Number(index));
    if (!Number.isFinite(nextIndex) || nextIndex <= 0 || nextIndex >= CANONICAL.nominalPositions) return false;
    const next = new Set(state.tabStopIndices);
    if (enabled) next.add(nextIndex);
    else next.delete(nextIndex);
    setTabStops([...next]);
    return true;
  }

  function setBackspaceLinkage(value) {
    state.backspaceLinkage = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const pulse = Math.sin(state.backspaceLinkage * Math.PI);
    backspaceRack.position.x = backspaceRack.userData.baseX - pulse * 5.5;
    backspaceBellcrank.rotation.z = deg(-22 * pulse);
  }

  function setMarginInsets(leftColumns = 0, rightColumns = 0) {
    const maxCombinedInset = CANONICAL.nominalPositions - 1;
    const left = Math.max(0, Math.min(maxCombinedInset, Math.round(Number(leftColumns) || 0)));
    const requestedRight = Math.max(0, Math.min(maxCombinedInset, Math.round(Number(rightColumns) || 0)));
    const right = Math.min(requestedRight, maxCombinedInset - left);
    state.leftMarginInsetColumns = left;
    state.rightMarginInsetColumns = right;
    state.leftMarginX = -marginLimit + left * CANONICAL.pitchMm;
    state.rightMarginX = marginLimit - right * CANONICAL.pitchMm;
    marginStops.left.position.x = state.leftMarginX;
    marginStops.right.position.x = state.rightMarginX;
  }

  function setCarrierX(x) {
    state.carrierX = THREE.MathUtils.clamp(x, -CANONICAL.writingLineMm / 2, CANONICAL.writingLineMm / 2);
    carrierMotion.position.x = state.carrierX;
    updateSelectionTapes();
    updateCordGeometry(state.carrierX);
  }

  function applyTypeElementOrientation() {
    updateSelectionDrive(state.tiltBand, state.rotateUnit);
    const rotateSlotStepDegP4 = 360 / CANONICAL.typeElement.positionsPerBand;
    typeElement.rotation.x = -typeBandNormalTiltRadP4(state.tiltBand);
    // 22 structural positions around each band = 11 base rotate coordinates plus the
    // independent 180° shift hemisphere. The public key-to-slot assignment remains P5,
    // but the visible ball now lands on the same structural lattice as its 88 slug cues.
    typeElement.rotation.y = deg(
      TYPE_PRINT_FACING_OFFSET_DEG_P4 -
      state.rotateUnit * rotateSlotStepDegP4 +
      state.shiftAngleDeg
    );
  }

  function setTypeball(tiltBand, rotateUnit, shiftHemisphere = state.shiftHemisphere) {
    state.tiltBand = THREE.MathUtils.clamp(tiltBand, 0, 3);
    state.rotateUnit = THREE.MathUtils.clamp(rotateUnit, -5, 5);
    state.shiftHemisphere = shiftHemisphere ? 1 : 0;
    state.shiftAngleDeg = state.shiftHemisphere * 180;
    applyTypeElementOrientation();
    updateSelectionTapes();
  }

  function setShiftTransition(fromHemisphere, toHemisphere, progress) {
    const from = fromHemisphere ? 1 : 0;
    const to = toHemisphere ? 1 : 0;
    const t = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
    state.shiftAngleDeg = THREE.MathUtils.lerp(from * 180, to * 180, t);
    if (t >= 1) state.shiftHemisphere = to;
    applyTypeElementOrientation();
    updateSelectionTapes();
  }

  function ribbonLiftScaleForMode(mode = state.ribbonPrintMode) {
    if (mode === 'stencil') return 0;
    if (mode === 'low') return 0.62;
    if (mode === 'high') return 1;
    return 0.82;
  }

  function setRibbonMode(mode) {
    const allowed = ['stencil', 'low', 'middle', 'high'];
    const next = allowed.includes(mode) ? mode : 'middle';
    state.ribbonPrintMode = next;
    setRibbonLift(state.ribbonLiftCommand);
    applyRibbonFeedSelection();
    return next;
  }

  function setRibbonLoadState(active) {
    state.ribbonLoadState = Boolean(active);
    setRibbonLift(state.ribbonLiftCommand);
    return state.ribbonLoadState;
  }

  function setRibbonLift(value) {
    state.ribbonLiftCommand = THREE.MathUtils.clamp(value, 0, 1);
    // Threading/load is deliberately a separate service pose above the highest print lift.
    // Its amplitude is P5 because the OEM geometry source establishes ordering, not height.
    state.ribbonLift = state.ribbonLoadState
      ? 1.24
      : state.ribbonLiftCommand * ribbonLiftScaleForMode();
    updateRibbonPath(state.ribbonLift);
  }

  function applyRibbonFeedSelection(direction = state.ribbonFeedDirection) {
    if (state.ribbonPrintMode === 'stencil') {
      feedPawl.position.x = 0;
      detentLever.position.x = 0;
      return;
    }
    const d = direction >= 0 ? 1 : -1;
    feedPawl.position.x = d * ribbonPawlTargetXP5;
    detentLever.position.x = d * 2.5;
  }

  function setRibbonReversePhase(value) {
    if (state.ribbonReverseState !== 'reversing') {
      state.ribbonReversePhase = 0;
      reverseTriggers.forEach(trigger => {
        trigger.rotation.z = trigger.userData.baseRotationZ;
      });
      feedPlate.position.x = 0;
      feedPlate.rotation.y = 0;
      applyRibbonFeedSelection();
      return false;
    }

    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const eased = t * t * (3 - 2 * t);
    const directionBefore = state.ribbonFeedDirection;
    const supplyTriggerIndex = directionBefore > 0 ? 0 : 1;
    state.ribbonReversePhase = t;

    reverseTriggers.forEach((trigger, index) => {
      const active = index === supplyTriggerIndex ? eased : 0;
      const outward = index === 0 ? -1 : 1;
      trigger.rotation.z = trigger.userData.baseRotationZ + deg(outward * 34 * active);
    });

    // P5 amplitudes embody the OEM sequence: one plate side is restricted, the other
    // continues forward, the plate pivots sideways, and the pawl transfers ratchets.
    feedPlate.position.x = directionBefore * 5.5 * eased;
    feedPlate.rotation.y = deg(-directionBefore * 9 * eased);
    feedPawl.position.x = THREE.MathUtils.lerp(
      directionBefore * ribbonPawlTargetXP5,
      -directionBefore * ribbonPawlTargetXP5,
      eased
    );
    detentLever.position.x = THREE.MathUtils.lerp(directionBefore * 2.5, -directionBefore * 2.5, eased);

    if (t < 1) return false;

    state.ribbonFeedDirection = -directionBefore;
    state.ribbonFeedStrokeInDirection = 0;
    state.ribbonReverseCount += 1;
    state.ribbonReverseState = 'feeding';
    state.ribbonReversePhase = 0;
    reverseTriggers.forEach(trigger => {
      trigger.rotation.z = trigger.userData.baseRotationZ;
    });
    feedPlate.position.x = 0;
    feedPlate.rotation.y = 0;
    applyRibbonFeedSelection();
    return true;
  }

  function feedRibbon() {
    if (state.ribbonPrintMode === 'stencil') {
      state.ribbonFeedSuppressedCount += 1;
      return false;
    }
    state.ribbonFeedStep += 1;
    state.ribbonFeedApproxRatchetTeeth += 2.5;
    state.ribbonFeedStrokeInDirection += 1;
    if (state.ribbonFeedDirection > 0) {
      state.ribbonSpoolFillP5[0] = Math.max(ribbonFillMinP5, state.ribbonSpoolFillP5[0] - ribbonFillStepP5);
      state.ribbonSpoolFillP5[1] = Math.min(ribbonFillMaxP5, state.ribbonSpoolFillP5[1] + ribbonFillStepP5);
    } else {
      state.ribbonSpoolFillP5[0] = Math.min(ribbonFillMaxP5, state.ribbonSpoolFillP5[0] + ribbonFillStepP5);
      state.ribbonSpoolFillP5[1] = Math.max(ribbonFillMinP5, state.ribbonSpoolFillP5[1] - ribbonFillStepP5);
    }
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    const presentationStep = 0.17 * state.ribbonFeedDirection;
    ribbonSpools[0].rotation.y -= presentationStep;
    ribbonSpools[1].rotation.y += presentationStep;
    ribbonRatchets[0].rotation.y -= presentationStep * 1.8;
    ribbonRatchets[1].rotation.y += presentationStep * 1.8;
    feedPlate.position.z = -45 + (state.ribbonFeedStep % 2 ? 2.5 : 0);
    feedPawl.rotation.z = deg(12 + (state.ribbonFeedStep % 2 ? 8 : 0));
    applyRibbonFeedSelection();

    if (
      state.ribbonReverseState === 'feeding' &&
      state.ribbonFeedStrokeInDirection >= state.ribbonReverseThresholdStepsP5
    ) {
      state.ribbonReverseState = 'reversing';
      state.ribbonReversePhase = 0;
    }
    return true;
  }

  function primeRibbonAutoReverse() {
    if (state.ribbonReverseState !== 'feeding') return false;
    state.ribbonFeedStrokeInDirection = Math.max(0, state.ribbonReverseThresholdStepsP5 - 1);
    if (state.ribbonFeedDirection > 0) {
      state.ribbonSpoolFillP5 = [ribbonFillMinP5 + ribbonFillStepP5, ribbonFillMaxP5 - ribbonFillStepP5];
    } else {
      state.ribbonSpoolFillP5 = [ribbonFillMaxP5 - ribbonFillStepP5, ribbonFillMinP5 + ribbonFillStepP5];
    }
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    return true;
  }

  function resetRibbonTransport() {
    state.ribbonFeedStep = 0;
    state.ribbonFeedApproxRatchetTeeth = 0;
    state.ribbonFeedDirection = 1;
    state.ribbonFeedStrokeInDirection = 0;
    state.ribbonSpoolFillP5 = [ribbonFillMaxP5, ribbonFillMinP5];
    state.ribbonReverseCount = 0;
    state.ribbonReversePhase = 0;
    state.ribbonReverseState = 'feeding';
    state.ribbonFeedSuppressedCount = 0;
    ribbonSpools.forEach(spool => { spool.rotation.y = 0; });
    ribbonRatchets.forEach(ratchet => { ratchet.rotation.y = 0; });
    feedPlate.position.x = 0;
    feedPlate.position.z = -45;
    feedPlate.rotation.y = 0;
    feedPawl.rotation.z = deg(12);
    reverseTriggers.forEach(trigger => {
      trigger.rotation.z = trigger.userData.baseRotationZ;
    });
    updateRibbonSpoolFillVisuals();
    updateRibbonPath(state.ribbonLift);
    applyRibbonFeedSelection();
  }

  function setFineAlignment(tiltValue, rotateValue = tiltValue) {
    state.tiltDetent = THREE.MathUtils.clamp(Number(tiltValue) || 0, 0, 1);
    state.rotateDetent = THREE.MathUtils.clamp(Number(rotateValue) || 0, 0, 1);

    // P5 motion amplitudes only. Source-backed requirement is ordering/contact role, not these angles.
    tiltDetentPivot.rotation.x = deg(24 * state.tiltDetent);
    rotateDetentPivot.rotation.x = deg(26 * state.rotateDetent);
    detentFollower.position.y = P4.printShaft.y + 16 - Math.max(state.tiltDetent, state.rotateDetent) * 5;
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

  function applyFeedRollRotation() {
    rearFeedRollers.forEach(roller => { roller.rotation.x = state.feedRollPhaseRad; });
    frontFeedRollers.forEach(roller => { roller.rotation.x = -state.feedRollPhaseRad; });
  }

  function advanceFeedRollersFromPaper(deltaPaperMm) {
    // Roller radius is reconstructed P4. Accumulation matters because a released sheet can be
    // manually repositioned without turning the disengaged feed rolls.
    state.feedRollPhaseRad += (Number(deltaPaperMm) || 0) / 6.2;
    applyFeedRollRotation();
  }

  function advanceBailRollersFromPaper(deltaPaperMm) {
    if (!state.paperBailEngaged) return;
    // Bail-roller radius is reconstructed P4. Accumulate only while the bail is actually against
    // the sheet so releasing/re-engaging it does not teleport its visible phase.
    state.bailRollPhaseRad -= (Number(deltaPaperMm) || 0) / 5.5;
    Object.values(paperBailRollers).forEach(roller => {
      roller.rotation.x = state.bailRollPhaseRad;
    });
  }

  function setPaperRelease(released) {
    state.feedRollsEngaged = !Boolean(released);
    const release = state.feedRollsEngaged ? 0 : 1;
    rearFeedRollers.forEach(roller => {
      roller.position.y = roller.userData.baseY - release * 4.5;
      roller.position.z = roller.userData.baseZ - release * 4.0;
    });
    frontFeedRollers.forEach(roller => {
      roller.position.y = roller.userData.baseY - release * 4.5;
      roller.position.z = roller.userData.baseZ + release * 4.0;
    });
    frontReleaseArms.forEach(arm => {
      arm.rotation.x = arm.userData.baseRotationX + deg(18 * release);
    });
    rearReleaseArms.forEach(arm => {
      arm.rotation.x = arm.userData.baseRotationX - deg(16 * release);
    });
    feedRollActuatingShaft.rotation.x = deg(24 * release);
    paperReleasePivot.rotation.x = deg(-32 * release);
  }

  function setPaperBail(engaged) {
    state.paperBailEngaged = Boolean(engaged);
    paperBailPivot.rotation.x = state.paperBailEngaged ? 0 : deg(31);
  }

  function repositionPaperManually(deltaMm) {
    if (state.feedRollsEngaged) return false;
    const delta = Number(deltaMm) || 0;
    if (!delta) return false;
    state.paperAdvanceMm += delta;
    state.manualPaperAlignmentMmP5 += delta;
    paper.setAdvance(state.paperAdvanceMm);
    // The released feed rolls remain stationary. Bail rollers are separate passive contacts and
    // follow sheet motion only when the bail itself is against the platen.
    advanceBailRollersFromPaper(delta);
    return true;
  }

  function setPaperBailRollerPosition(side, value) {
    if (side !== 'left' && side !== 'right') return false;
    const normalized = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    state.paperBailRollerPositionsP5[side] = normalized;
    // The sources establish independent lateral adjustability, not exact travel limits.
    // Keep each roller on its own half of the bail bar with explicitly P5 endpoints.
    const magnitude = THREE.MathUtils.lerp(110, 20, normalized);
    paperBailRollers[side].position.x = side === 'left' ? -magnitude : magnitude;
    return true;
  }

  function setCopyControl(setting) {
    const next = Math.max(0, Math.min(4, Math.round(Number(setting) || 0)));
    state.copyControlSetting = next;
    // Only the discrete topology and rearward direction are sourced. These display offsets are P5.
    state.copyControlOffsetZ = next === 0 ? 0 : -next * 2.2;
    paperFeedCarriage.position.z = state.copyControlOffsetZ;
    copyControlLeverPivot.rotation.x = deg(-next * 8);
    copyControlRotor.rotation.x = deg(next * 12);
    copyControlDetentMarkers.forEach((marker, index) => {
      const scale = index === next ? 1.35 : 1;
      marker.scale.set(scale, scale, scale);
    });
  }

  function setPlatenVariable(engaged) {
    state.platenVariableEngaged = Boolean(engaged);
  }

  function rotatePlatenManually(delta) {
    if (!state.platenVariableEngaged) return false;
    const rotation = Number(delta) || 0;
    state.manualPlatenAngle += rotation;
    setPlatenPhysicalAngle(state.platenIndex + state.manualPlatenAngle);
    if (state.feedRollsEngaged) {
      const deltaPaperMm = rotation * CANONICAL.platen.radiusMm;
      state.paperAdvanceMm += deltaPaperMm;
      paper.setAdvance(state.paperAdvanceMm);
      advanceFeedRollersFromPaper(deltaPaperMm);
      advanceBailRollersFromPaper(deltaPaperMm);
    }
    return true;
  }

  function resetPlatenVariableOffset() {
    state.manualPlatenAngle = 0;
    setPlatenPhysicalAngle(state.platenIndex);
  }

  function setLineSpacingMode(value) {
    state.lineSpacingTeeth = Number(value) === 2 ? 2 : 1;
    // Source material establishes a selector that switches one-vs-two ratchet-tooth indexing.
    // Exact external lever coordinates/travel remain unresolved, so only the mode distinction is causal;
    // this visible selector angle is explicitly P5.
    lineSpacingSelectorPivot.rotation.z = deg(state.lineSpacingTeeth === 2 ? 13 : -13);
    lineSpacingSelectorLink.position.y = state.lineSpacingTeeth === 2 ? 4.5 : 2;
    return state.lineSpacingTeeth;
  }

  function setIndexPawlPhase(value) {
    const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    const strokeScaleP5 = state.lineSpacingTeeth === 2 ? 1.24 : 1;
    indexPawl.rotation.x = indexPawl.userData.baseRotationX + deg(28 * strokeScaleP5 * Math.sin(t * Math.PI));
  }

  function setPlatenIndex(value) {
    const next = Number(value) || 0;
    const delta = next - state.platenIndex;
    state.platenIndex = next;
    setPlatenPhysicalAngle(next + state.manualPlatenAngle);
    ratchetGroup.rotation.x = next;
    if (state.feedRollsEngaged) {
      const deltaPaperMm = delta * CANONICAL.platen.radiusMm;
      state.paperAdvanceMm += deltaPaperMm;
      paper.setAdvance(state.paperAdvanceMm);
      advanceFeedRollersFromPaper(deltaPaperMm);
      advanceBailRollersFromPaper(deltaPaperMm);
    }
  }

  function setMotorPhase(value) {
    state.motorPhase = ((Number(value) || 0) % 1 + 1) % 1;
    operationalRotor.rotation.x = state.motorPhase * Math.PI * 2;
    motorDriveRotor.rotation.x = state.motorPhase * Math.PI * 2;
    cycleDriveRotor.rotation.x = state.motorPhase * Math.PI * 2 / CANONICAL.drive.positiveBeltReduction;
    updateDriveBeltMarkers();
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

  function stampCharacter(character) {
    // Stencil mode deliberately moves the ribbon out of the print point. The mechanical
    // impact still occurs, but an ordinary paper output texture should not receive an ink mark.
    if (state.ribbonPrintMode === 'stencil') return false;
    paper.stamp(character, state.carrierX, state.paperAdvanceMm);
    return true;
  }

  function clearPaper() {
    state.paperAdvanceMm = 0;
    state.manualPaperAlignmentMmP5 = 0;
    state.feedRollPhaseRad = 0;
    state.bailRollPhaseRad = 0;
    paper.setAdvance(0);
    applyFeedRollRotation();
    Object.values(paperBailRollers).forEach(roller => {
      roller.rotation.x = 0;
    });
    paper.clear();
  }

  function geometryDiagnostics() {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const indicatorWorld = new THREE.Vector3();
    writingPositionIndicator.getWorldPosition(indicatorWorld);
    const selectedStructuralSlotP4 = (
      (state.rotateUnit + state.shiftHemisphere * 11) % CANONICAL.typeElement.positionsPerBand +
      CANONICAL.typeElement.positionsPerBand
    ) % CANONICAL.typeElement.positionsPerBand;
    const selectedSlugWorldNormalP4 = typeSlugNormalP4(state.tiltBand, selectedStructuralSlotP4)
      .applyEuler(typeElement.rotation)
      .normalize();
    const printFacingTargetP4 = new THREE.Vector3(0, 0, -1);
    const selectedSlugAlignmentDotP4 = THREE.MathUtils.clamp(
      selectedSlugWorldNormalP4.dot(printFacingTargetP4),
      -1,
      1
    );
    const selectedSlugAlignmentErrorDegP4 = THREE.MathUtils.radToDeg(Math.acos(selectedSlugAlignmentDotP4));
    return {
      revision: 'selectric-integrated-public-build',
      finite: [size.x, size.y, size.z].every(Number.isFinite),
      bounds: { width: size.x, height: size.y, depth: size.z },
      carrierX: state.carrierX,
      writingPositionIndicator: {
        carrierParented: writingPositionIndicator.parent === carrierMotion,
        worldX: indicatorWorld.x,
        localX: writingPositionIndicator.position.x,
        role: 'carrier position pointer over the fixed writing-position rule'
      },
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
      selectionNormalized: { ...state.selectionNormalized },
      typeElement: {
        characterCount: CANONICAL.typeElement.characterCount,
        bands: CANONICAL.typeElement.bands,
        positionsPerBand: CANONICAL.typeElement.positionsPerBand,
        structuralRadiusP4Mm: CANONICAL.typeElement.structuralRadiusP4Mm,
        slugOrientation: 'P4 surface-normal tangent frames on structural ellipsoid',
        rotateSlotStepDegP4: 360 / CANONICAL.typeElement.positionsPerBand,
        bandLatitudesP4: [...TYPE_BAND_LATITUDES_P4],
        bandTiltAnglesDegP4: TYPE_BAND_LATITUDES_P4.map((_, band) => -THREE.MathUtils.radToDeg(typeBandNormalTiltRadP4(band))),
        orientationDegP4: {
          tilt: THREE.MathUtils.radToDeg(typeElement.rotation.x),
          rotate: THREE.MathUtils.radToDeg(typeElement.rotation.y)
        },
        selectedStructuralSlotP4,
        selectedSlugAlignmentErrorDegP4,
        selectedSlugFacingVectorP4: {
          x: selectedSlugWorldNormalP4.x,
          y: selectedSlugWorldNormalP4.y,
          z: selectedSlugWorldNormalP4.z
        },
        printFacingOffsetDegP4: TYPE_PRINT_FACING_OFFSET_DEG_P4,
        printFacingTarget: '-Z toward platen in the public reconstruction coordinate frame',
        selectionOrientationClass: 'P4 structural lattice alignment and print-facing anchor; exact keyboard/typeball glyph assignment remains P5',
        glyphFaceGeometry: 'unresolved; repeated structural slug cues only'
      },
      selectionDifferential: {
        tiltEquation: 'qTilt=(T1+2*T2)/3',
        rotateQ1Equation: 'q1=(R1+2*R2)/3',
        rotateQ2Equation: 'q2=(3*q1+2*R2A)/5',
        signedEquation: 'qSigned=q2-fiveUnit',
        rotateUnitsEquation: 'rotateUnits=5*qSigned',
        tapeCarrierInvariantErrorMm: selectionTapeInvariantError()
      },
      cordPhase: state.cordPhase,
      writingLineRacks: ['1124109 escapement', '1164743 margin', '1164102/6519354 tab'],
      returnTabDrive: {
        carrierReturnFiniteTriggerThenSustained: true,
        carrierReturnSpringClutch: true,
        carrierReturnDrivePhase: state.carrierReturnDrivePhase,
        tabPropulsion: 'mainspring',
        tabGovernorReference: 'operational-shaft',
        tabGovernorPropulsion: false,
        tabGovernorPhase: state.tabGovernorPhase,
        tabStopsProgrammable: true,
        tabStopIndices: [...state.tabStopIndices],
        defaultTabStopClass: 'P5 every-eight-column startup presentation; runtime set/clear is live',
        exactSetClearLinkage: 'unresolved'
      },
      cordSystem: {
        commonEscapementShaft: true,
        opposedDrumWinding: true,
        mainspringSuppliesRightwardCarrierEnergy: true,
        rightTensionArmSpiralSprings: 2,
        tensionArmAngleDeg: state.tensionArmAngleDeg
      },
      marginStops: {
        leftPhysical: true,
        rightPhysical: true,
        adjustableOnWritingLine: true,
        leftTerminatesCarrierReturn: true,
        rightLineLockInterface: true,
        leftInsetColumns: state.leftMarginInsetColumns,
        rightInsetColumns: state.rightMarginInsetColumns,
        leftX: state.leftMarginX,
        rightX: state.rightMarginX,
        pitchMm: CANONICAL.pitchMm,
        positioningClass: 'runtime-adjustable stops on the source-backed 12-CPI writing lattice; release-actuator detail unresolved'
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
        toothProfile: 'P4',
        paperAdvancePerRatchetToothMm: Math.PI * 2 * CANONICAL.platen.radiusMm / CANONICAL.platen.representativeRatchetTeeth,
        paperAdvanceDerivation: 'P2 arc length from source-backed platen radius divided by representative 27T ratchet',
        lineSpacingModes: ['single', 'double'],
        singleIndexTeeth: 1,
        doubleIndexTeeth: 2,
        activeIndexTeeth: state.lineSpacingTeeth,
        selectorEmbodied: true,
        selectorAngleDegP5: state.lineSpacingTeeth === 2 ? 13 : -13,
        selectorTravelClass: 'P5 visible selector travel; one-vs-two-tooth function source-backed, exact external coordinates unresolved',
        indexPawlStrokeClass: 'P5 presentation amplitude; one-vs-two-tooth function source-backed'
      },
      paperFeed: {
        frontRollers: 4,
        rearRollers: 4,
        bailRollers: 2,
        bailStableStates: ['against-platen', 'released'],
        bailEngaged: state.paperBailEngaged,
        bailToggle: 'hairpin-spring two-stable-state',
        bailRollerAdjustment: {
          independentlyAdjustable: true,
          leftNormalizedP5: state.paperBailRollerPositionsP5.left,
          rightNormalizedP5: state.paperBailRollerPositionsP5.right,
          leftX: paperBailRollers.left.position.x,
          rightX: paperBailRollers.right.position.x,
          travelClass: 'P5 lateral presentation range; source-backed adjustability, exact travel unresolved',
          rollPhaseRad: state.bailRollPhaseRad,
          rollRadiusMmP4: 5.5,
          rollCoupling: 'passive paper-contact rotation while bail is against platen; P4 radius, exact roller section unresolved'
        },
        frontRearReleaseCoupled: true,
        feedRollsEngaged: state.feedRollsEngaged,
        releaseLatchedStateRepresented: true,
        releaseTravel: 'P5 presentation; exact metric travel unresolved',
        manualPaperAlignmentMmP5: state.manualPaperAlignmentMmP5,
        manualPaperAlignmentAvailable: !state.feedRollsEngaged,
        manualPaperAlignmentClass: 'P5 public alignment increment while feed rolls are released; exact operator handling/travel is unresolved',
        copyControl: {
          positions: 5,
          setting: state.copyControlSetting,
          normalForwardSetting: 0,
          offsetZ: state.copyControlOffsetZ,
          offsetClass: 'P5 presentation; exact five offsets unresolved',
          detentMarkerCount: copyControlDetentMarkers.length,
          activeDetentSetting: state.copyControlSetting,
          detentPresentationClass: 'P5 visible five-position marker arc; source-backed discrete count, exact lever angles/marker geometry unresolved',
          shaftRotorAngleDegP5: THREE.MathUtils.radToDeg(copyControlRotor.rotation.x),
          eccentricCollars: copyControlEccentrics.length,
          eccentricCollarsRotateWithShaft: copyControlEccentrics.every(eccentric => eccentric.parent === copyControlRotor),
          movesPlatenAndEntirePaperFeedCarriage: true,
          movesCarrierTypehead: false
        },
        platenVariableEngaged: state.platenVariableEngaged,
        platenRatchetCoupled: !state.platenVariableEngaged,
        manualPlatenAngle: state.manualPlatenAngle,
        platenPhysicalAngleRad: state.platenIndex + state.manualPlatenAngle,
        platenPhaseCueAngleRad: platenKnobPivots[0].rotation.x,
        platenPhaseCueCount: platenKnobPivots.length,
        platenPhaseCueClass: 'P5 visible rotational cue; follows physical platen while ratchet may decouple',
        variableOffsetPersistsWhenRecoupled: true,
        paperAdvanceMm: state.paperAdvanceMm,
        paperAdvanceClass: 'P2 platen arc length while feed rolls are engaged',
        paperPath: {
          outputSheetTextured: true,
          platenWrapRepresented: true,
          wrapRadiusMmP4: paper.wrapRadiusMmP4,
          wrapStartAngleDegP4: paper.wrapStartAngleDegP4,
          wrapEndAngleDegP4: paper.wrapEndAngleDegP4,
          wrapSpanDegP4: paper.wrapSpanDegP4,
          wrapClass: 'P4 platen-contact presentation; exact hidden wrap/contact arc unresolved',
          stampLayout: paper.stampDiagnostics(),
          inkSuppressedInStencil: state.ribbonPrintMode === 'stencil',
          inkRecordCoupling: 'low/middle/high fabric-ribbon states record ink on the paper texture; stencil preserves impact but suppresses the ink record'
        },
        feedRollPhaseRad: state.feedRollPhaseRad,
        feedRollRotationClass: 'P4 accumulated contact rotation from coupled paper travel only; released manual sheet alignment does not rotate feed rolls; exact roller radius unresolved',
        exactCenters: 'unresolved-P4'
      },
      ribbon: {
        parent: 'carrier',
        mediaWidthMm: P4.ribbon.widthMm,
        printMode: state.ribbonPrintMode,
        printModes: ['stencil', 'low', 'middle', 'high'],
        loadState: state.ribbonLoadState,
        loadStateDistinctFromHighPrintLift: true,
        loadLiftNormalizedP5: 1.24,
        loadLiftClass: 'P5 threading pose above high print lift; exact OEM load height unresolved',
        liftCommand: state.ribbonLiftCommand,
        actualLiftNormalizedP5: state.ribbonLift,
        liftHeightClass: 'P5 relative display heights; exact OEM lift heights unresolved',
        stencilRibbonAtPrintPoint: state.ribbonPrintMode !== 'stencil',
        stencilFeedSuppressed: state.ribbonPrintMode === 'stencil',
        stencilPawlCentered: state.ribbonPrintMode === 'stencil' ? Math.abs(feedPawl.position.x) < 1e-9 : null,
        stencilDetentCentered: state.ribbonPrintMode === 'stencil' ? Math.abs(detentLever.position.x) < 1e-9 : null,
        feedSuppressedCount: state.ribbonFeedSuppressedCount,
        feedStepCount: state.ribbonFeedStep,
        approximateRatchetTeethAdvanced: state.ribbonFeedApproxRatchetTeeth,
        nominalRatchetTeethPerCharacter: 2.5,
        nominalRatchetTeethQualifier: 'approximately',
        feedDirection: state.ribbonFeedDirection,
        feedStrokeInDirection: state.ribbonFeedStrokeInDirection,
        spoolFillP5: [...state.ribbonSpoolFillP5],
        spoolRadiusScaleP5: ribbonSpools.map(spool => spool.scale.x),
        spoolFillClass: 'P5 compressed supply/take-up fullness presentation; direction and reversal topology source-grounded, physical ribbon length unresolved',
        reverseState: state.ribbonReverseState,
        reversePhase: state.ribbonReversePhase,
        reverseCount: state.ribbonReverseCount,
        reverseThresholdStepsP5: state.ribbonReverseThresholdStepsP5,
        reverseThresholdClass: 'P5 compressed demonstration capacity; not physical ribbon length',
        path: ['left-spool', 'left-guide', 'print-point', 'right-guide', 'right-spool'],
        reverseTopology: 'lost supply-core loop -> reverse trigger -> plate pivot -> pawl/check transfer -> opposite ratchet',
        reverseIsAnimatedSequence: true,
        exactLinearFeedMm: 'unresolved'
      },
      sleeveCamOrder: ['ribbon-lift', '1164240-feed-detent', '1124174-print-restoring'],
      primaryDrive: {
        motorPulleyTeeth: CANONICAL.drive.motorPulleyTeeth,
        cycleClutchPulleyTeeth: CANONICAL.drive.cycleClutchPulleyTeethDerived,
        reduction: CANONICAL.drive.positiveBeltReduction,
        pitchRadiusRatio: cyclePitchRadiusP4 / motorPitchRadiusP4,
        cycleClutchPulleyHubContinuous: true,
        cycleShaftEventGated: true,
        beltPathPointCount: driveBeltPathP4.points.length,
        beltCenterDistanceMmP4: driveBeltPathP4.centerDistanceMmP4,
        beltStraightSpanMmP4: driveBeltPathP4.straightSpanMmP4,
        beltMotorWrapDegP4: driveBeltPathP4.motorWrapDegP4,
        beltCycleWrapDegP4: driveBeltPathP4.cycleWrapDegP4,
        beltCenterlineLengthMmP4: driveBeltPathP4.centerlineLengthMmP4,
        beltTangentOrthogonalityErrorMm: driveBeltPathP4.tangentOrthogonalityErrorMm,
        beltMotionMarkerCountP5: driveBeltMarkers.length,
        beltMotionMarkerPhaseP5: driveBeltMarkers.map(marker => marker.userData.beltPhaseP5),
        beltTravelFractionPerMotorRevP4: driveBeltTravelFractionPerMotorRevP4,
        beltMotionClass: 'P5 visible markers advected along the P4 belt path by motor pitch-circle travel; marker spacing/shape are presentation only',
        beltPathClass: 'P4 external-tangent solve from reconstructed pitch radii/axis centers; positive-drive tooth count ratio source-backed, exact belt pitch and absolute pulley diameters unresolved',
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
        tabUsesPoweredCam: false,
        shiftInterlocksCharacterCycle: true
      },
      shaftTiming: {
        cycleShaftDegPerCharacter: 180,
        filterShaftDegPerCharacter: 180,
        printShaftDegPerCharacter: 360,
        printSleeveDegPerCharacter: 360
      },
      shift: {
        hemisphere: state.shiftHemisphere,
        angleDeg: state.shiftAngleDeg,
        transitionCamDeg: 180
      },
      fineAlignment: {
        coarseSelectionSeparate: true,
        tiltDetent: state.tiltDetent,
        rotateDetent: state.rotateDetent,
        tiltSeatsBeforeRotateInPresentation: true,
        fullySeatedBeforeImpact: true,
        releasedBeforeFullSelectionRestore: true,
        exactPivotsAndTimingDegrees: 'unresolved',
        animationPhaseClass: 'P5 preserving source-backed causal ordering'
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
  setCarrierReturnDrive(0);
  setTabGovernor(0);
  setTabStops(Array.from({ length: Math.floor((CANONICAL.nominalPositions - 1) / 8) }, (_, index) => (index + 1) * 8));
  setMarginInsets(0, 0);
  setCarrierX(state.carrierX);
  setTypeball(0, 0, 0);
  setRibbonLoadState(false);
  setRibbonMode('middle');
  setRibbonLift(0);
  resetRibbonTransport();
  setFineAlignment(0, 0);
  setPaperRelease(false);
  setPaperBail(true);
  setPaperBailRollerPosition('left', 0.4);
  setPaperBailRollerPosition('right', 0.4);
  setCopyControl(0);
  setPlatenVariable(false);
  setPrintApproach(0);
  setLineSpacingMode(1);
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
    setCarrierReturnDrive,
    setTabGovernor,
    setTabStops,
    setTabStopAt,
    setMarginInsets,
    setCarrierX,
    setShiftTransition,
    setTypeball,
    setRibbonMode,
    setRibbonLoadState,
    setRibbonLift,
    feedRibbon,
    setRibbonReversePhase,
    primeRibbonAutoReverse,
    resetRibbonTransport,
    setFineAlignment,
    setPaperRelease,
    setPaperBail,
    repositionPaperManually,
    setPaperBailRollerPosition,
    setCopyControl,
    setPlatenVariable,
    rotatePlatenManually,
    resetPlatenVariableOffset,
    setPrintApproach,
    setLineSpacingMode,
    setIndexPawlPhase,
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
