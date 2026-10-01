import * as THREE from 'three';
import { COMPONENTS, RECONSTRUCTION } from './spec.js';

const DEG = Math.PI / 180;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.12,
    roughness: options.roughness ?? 0.58,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true
  });
}

const materials = {
  chrome: material(0xc0c4c7, { metalness: 0.78, roughness: 0.28 }),
  chromeDark: material(0x555c62, { metalness: 0.74, roughness: 0.34 }),
  leather: material(0x5b321f, { metalness: 0.01, roughness: 0.94 }),
  black: material(0x111417, { metalness: 0.03, roughness: 0.86 }),
  bellows: material(0x151313, { metalness: 0.0, roughness: 0.98, side: THREE.DoubleSide }),
  bellowsRib: material(0x2c2927, { metalness: 0.02, roughness: 0.88 }),
  glass: material(0x173148, { metalness: 0.08, roughness: 0.18, transparent: true, opacity: 0.74 }),
  link: material(0x969da3, { metalness: 0.82, roughness: 0.27 }),
  filmDoor: material(0x1f2326, { metalness: 0.12, roughness: 0.7 }),
  red: material(0xb51f25, { metalness: 0.08, roughness: 0.48 }),
  accent: material(0xd7c7a1, { metalness: 0.35, roughness: 0.46 })
};

function box(w, h, d, mat = materials.black) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function chamferedFrontStandard(width, height, depth, mat = materials.chrome) {
  const chamfer = 4.5;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + chamfer, 0);
  shape.lineTo(width / 2 - chamfer, 0);
  shape.lineTo(width / 2, chamfer);
  shape.lineTo(width / 2, height - chamfer);
  shape.lineTo(width / 2 - chamfer, height);
  shape.lineTo(-width / 2 + chamfer, height);
  shape.lineTo(-width / 2, height - chamfer);
  shape.lineTo(-width / 2, chamfer);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1
  });
  geometry.translate(0, 0, -depth / 2);

  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radius, depth, mat = materials.chrome, radialSegments = 48) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radialSegments), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mark(mesh, componentKey) {
  const meta = COMPONENTS[componentKey];
  if (!meta) return mesh;
  mesh.userData.inspectable = true;
  mesh.userData.componentKey = componentKey;
  mesh.userData.component = meta;
  return mesh;
}

function smoother(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function pointFromPivot(pivot, length, angleRad, x = 0) {
  return new THREE.Vector3(
    x,
    pivot.y + Math.cos(angleRad) * length,
    pivot.z + Math.sin(angleRad) * length
  );
}

function solveFourBarCoupler(rearTop, lensBase, lensLength, couplerLength) {
  const dy = rearTop.y - lensBase.y;
  const dz = rearTop.z - lensBase.z;
  const distance = Math.max(0.001, Math.hypot(dy, dz));

  const along = (
    lensLength * lensLength -
    couplerLength * couplerLength +
    distance * distance
  ) / (2 * distance);

  const height = Math.sqrt(Math.max(0, lensLength * lensLength - along * along));
  const uy = dy / distance;
  const uz = dz / distance;
  const midY = lensBase.y + along * uy;
  const midZ = lensBase.z + along * uz;

  const candidates = [
    new THREE.Vector3(0, midY - uz * height, midZ + uy * height),
    new THREE.Vector3(0, midY + uz * height, midZ - uy * height)
  ];

  // The physical branch used by this reconstruction is the upper intersection:
  // it moves continuously from the compact face-down front standard to the
  // source-consistent erected lensboard pose.
  return candidates[0].y >= candidates[1].y ? candidates[0] : candidates[1];
}

function orientBetween(object, a, b) {
  const direction = b.clone().sub(a);
  const length = Math.max(0.001, direction.length());
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
  return length;
}

function makePanel(width, thickness, mat, insetMat = null) {
  const root = new THREE.Group();
  const body = box(width, 1, thickness, mat);
  root.add(body);

  if (insetMat) {
    const inset = box(width - 12, 1, 1.8, insetMat);
    inset.position.z = -(thickness / 2 + 1.0);
    root.add(inset);
    root.userData.inset = inset;
  }

  root.userData.body = body;
  return root;
}

function updatePanel(panel, a, b, insetLengthFactor = 0.84) {
  const length = orientBetween(panel, a, b);
  panel.userData.body.scale.set(1, length, 1);
  if (panel.userData.inset) {
    panel.userData.inset.scale.set(1, length * insetLengthFactor, 1);
  }
  panel.userData.length = length;
}

function makeRod(radius = 1.3, mat = materials.link) {
  const rod = cylinder(radius, 1, mat, 18);
  return rod;
}

function updateRod(rod, a, b) {
  const direction = b.clone().sub(a);
  const length = Math.max(0.001, direction.length());
  rod.position.copy(a).add(b).multiplyScalar(0.5);
  rod.scale.set(1, length, 1);
  rod.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
  rod.userData.length = length;
}

function makeBellowsGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Array(18).fill(0), 3));
  geometry.setIndex([
    0, 1, 2,
    3, 5, 4,
    0, 3, 4, 0, 4, 1,
    1, 4, 5, 1, 5, 2,
    2, 5, 3, 2, 3, 0
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

function updateBellowsGeometry(geometry, rearLower, rearUpper, frontUpper, halfWidth) {
  const positions = geometry.attributes.position;
  const pts = [
    [-halfWidth, rearLower.y, rearLower.z],
    [-halfWidth, rearUpper.y, rearUpper.z],
    [-halfWidth, frontUpper.y, frontUpper.z],
    [ halfWidth, rearLower.y, rearLower.z],
    [ halfWidth, rearUpper.y, rearUpper.z],
    [ halfWidth, frontUpper.y, frontUpper.z]
  ];
  pts.forEach((p, i) => positions.setXYZ(i, p[0], p[1], p[2]));
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function localPointOnRotatedGroup(group, local) {
  return local.clone().applyQuaternion(group.quaternion).add(group.position);
}

export function createSX70Model() {
  const root = new THREE.Group();
  root.name = 'Polaroid SX-70 articulated public reconstruction v4';

  const pickables = [];
  const componentRoots = new Map();
  const register = (key, object) => {
    componentRoots.set(key, object);
    object.traverse(child => {
      if (child.isMesh) {
        mark(child, key);
        pickables.push(child);
      }
    });
    return object;
  };

  // Reclassify a nested subassembly without duplicating its mesh in pickables.
  // This lets one public assembly contain individually inspectable engineering parts.
  const reclassify = (key, object) => {
    componentRoots.set(key, object);
    object.traverse(child => {
      if (child.isMesh) mark(child, key);
    });
    return object;
  };

  const A = RECONSTRUCTION.articulation;
  const baseTopY = RECONSTRUCTION.base.height / 2;

  // --- Base / film-pack body -------------------------------------------------
  const base = new THREE.Group();

  const baseShell = box(
    RECONSTRUCTION.base.width,
    RECONSTRUCTION.base.height,
    RECONSTRUCTION.base.depth,
    materials.chrome
  );
  base.add(baseShell);

  // Dark inner pack cavity prevents the whole base reading as one chrome brick.
  const packCavity = box(96, 13.5, 126, materials.black);
  packCavity.position.set(0, 2.2, -11);
  base.add(packCavity);

  const darkDeck = box(96, 2.0, 112, materials.black);
  darkDeck.position.set(0, baseTopY + 1.1, -4);
  base.add(darkDeck);

  const rearLeatherDeck = box(88, 2.2, 122, materials.leather);
  rearLeatherDeck.position.set(0, baseTopY + 2.25, -5);
  base.add(rearLeatherDeck);

  const frontDeck = box(94, 2.6, 34, materials.chromeDark);
  frontDeck.position.set(0, baseTopY + 1.55, 53);
  base.add(frontDeck);

  const filmDoor = box(100, 13, 23, materials.filmDoor);
  filmDoor.position.set(0, -0.5, 77);
  base.add(filmDoor);

  const exitLip = box(96, 4, 7, materials.black);
  exitLip.position.set(0, 8.2, 87);
  base.add(exitLip);

  register('base', base);
  mark(filmDoor, 'frontDoor');
  mark(exitLip, 'frontDoor');
  root.add(base);

  // --- Rear wall -------------------------------------------------------------
  // A rigid member rotating around one base hinge, rather than translating
  // through the camera between arbitrary end poses.
  const rearPanel = makePanel(86, 3.8, materials.chrome, materials.leather);
  register('rearPanel', rearPanel);
  root.add(rearPanel);

  // --- Top front cover / four-bar coupler -----------------------------------
  // US4016580 describes the top front cover panel as hinged between the
  // lensboard/shutter housing and rear top cover panel. v4 now preserves that
  // topology as an actual fixed-length rigid coupler instead of a stretching or
  // guided presentation rail.
  const forwardPanel = makePanel(80, 3.4, materials.chrome, materials.leather);
  register('forwardPanel', forwardPanel);
  root.add(forwardPanel);

  // --- Lens / shutter front standard ----------------------------------------
  // v4: model the front standard as a containment hierarchy rather than one
  // opaque terminal block. Exact hidden wall geometry remains P4 reconstruction.
  const lensHousing = new THREE.Group();
  const housingW = RECONSTRUCTION.body.lensHousingWidth;
  const housingH = RECONSTRUCTION.body.lensHousingHeight;
  const housingD = RECONSTRUCTION.body.lensHousingDepth;

  const frontStandardFrame = new THREE.Group();
  const cheekW = 6.0;
  const frameLeft = box(cheekW, housingH, housingD, materials.chrome);
  const frameRight = box(cheekW, housingH, housingD, materials.chrome);
  frameLeft.position.set(-housingW / 2 + cheekW / 2, housingH / 2, 0);
  frameRight.position.set(housingW / 2 - cheekW / 2, housingH / 2, 0);

  const frameTop = box(housingW - 2 * cheekW, 6.0, housingD, materials.chrome);
  const frameBottom = box(housingW - 2 * cheekW, 6.0, housingD, materials.chrome);
  frameTop.position.set(0, housingH - 3.0, 0);
  frameBottom.position.set(0, 3.0, 0);

  const rearWeb = box(housingW - 12, housingH - 12, 2.2, materials.black);
  rearWeb.position.set(0, housingH / 2, -housingD / 2 + 1.15);
  frontStandardFrame.add(frameLeft, frameRight, frameTop, frameBottom, rearWeb);
  lensHousing.add(frontStandardFrame);

  const faceplateAssembly = new THREE.Group();
  const faceplate = chamferedFrontStandard(
    housingW - 4,
    housingH - 4,
    2.8,
    materials.chrome
  );
  faceplate.position.set(0, 2, housingD / 2 - 1.4);
  faceplateAssembly.add(faceplate);
  lensHousing.add(faceplateAssembly);

  const frontControls = new THREE.Group();
  const controlStrip = box(housingW - 8, 8.0, 2.2, materials.black);
  controlStrip.position.set(0, housingH - 8.0, housingD / 2 + 1.2);
  frontControls.add(controlStrip);

  // Controls are seated against the faceplate. Previous +17 mm presentation
  // offsets made the red release and metering window read as floating objects.
  const photocell = cylinder(5.9, 2.2, materials.glass, 32);
  photocell.rotation.x = Math.PI / 2;
  photocell.position.set(24, 24, housingD / 2 + 1.35);
  frontControls.add(photocell);

  const shutterButton = cylinder(5.1, 2.7, materials.red, 32);
  shutterButton.rotation.x = Math.PI / 2;
  shutterButton.position.set(-32, 34, housingD / 2 + 1.55);
  frontControls.add(shutterButton);

  const lightenDarken = box(16, 4.2, 2.8, materials.black);
  lightenDarken.position.set(23, 38, housingD / 2 + 1.55);
  frontControls.add(lightenDarken);
  lensHousing.add(frontControls);

  const shutterChamber = new THREE.Group();
  const chamberRing = new THREE.Mesh(
    new THREE.RingGeometry(14.0, 20.5, 48),
    materials.black
  );
  chamberRing.position.set(-5, 24, housingD / 2 - 3.8);
  shutterChamber.add(chamberRing);

  const meteringAperture = new THREE.Mesh(
    new THREE.RingGeometry(3.2, 6.6, 32),
    materials.black
  );
  meteringAperture.position.set(23, 24, housingD / 2 - 3.6);
  shutterChamber.add(meteringAperture);
  lensHousing.add(shutterChamber);

  const lensBarrel = cylinder(17.2, 14.5, materials.chromeDark, 64);
  lensBarrel.rotation.x = Math.PI / 2;
  lensHousing.add(lensBarrel);

  const lensRing = cylinder(14.8, 2.5, materials.chrome, 64);
  lensRing.rotation.x = Math.PI / 2;
  lensHousing.add(lensRing);

  const lensGlass = cylinder(12.8, 1.4, materials.glass, 64);
  lensGlass.rotation.x = Math.PI / 2;
  lensHousing.add(lensGlass);

  register('lensHousing', lensHousing);
  reclassify('frontStandardFrame', frontStandardFrame);
  reclassify('frontStandardFaceplate', faceplateAssembly);
  reclassify('frontControls', frontControls);
  reclassify('shutterChamber', shutterChamber);
  mark(meteringAperture, 'photocellAperture');
  mark(lensBarrel, 'takingLens');
  mark(lensRing, 'takingLens');
  mark(lensGlass, 'takingLens');
  root.add(lensHousing);

  // --- Viewfinder / top cap --------------------------------------------------
  // The long shallow cap is one of the strongest SX-70 silhouette cues.
  const viewfinder = new THREE.Group();

  const capBody = box(76, 8.2, 58, materials.chrome);
  viewfinder.add(capBody);

  const capLeather = box(68, 1.8, 49, materials.leather);
  capLeather.position.set(0, 4.95, 0);
  viewfinder.add(capLeather);

  const capUnderside = box(72, 2.2, 53, materials.black);
  capUnderside.position.set(0, -4.55, 0);
  viewfinder.add(capUnderside);

  const eyepiece = cylinder(7.3, 3.5, materials.glass, 32);
  eyepiece.rotation.x = Math.PI / 2;
  eyepiece.position.set(18, 0, -28);
  viewfinder.add(eyepiece);

  register('viewfinder', viewfinder);
  root.add(viewfinder);

  // Two small P4 support links keep the relay housing visually tied to the rear
  // optical structure in the ordinary erect state. The prior unsupported cap
  // read as a random floating cube during direct user QA.
  const viewfinderSupports = new THREE.Group();
  const viewfinderSupportLeft = makeRod(0.9, materials.chromeDark);
  const viewfinderSupportRight = makeRod(0.9, materials.chromeDark);
  viewfinderSupports.add(viewfinderSupportLeft, viewfinderSupportRight);
  register('viewfinder', viewfinderSupports);
  root.add(viewfinderSupports);

  // --- Bellows ---------------------------------------------------------------
  // One continuous triangular prism replaces the previous stack of expanding
  // boxes. Its three profile vertices are driven by structural anchors.
  const bellows = new THREE.Group();
  const bellowsGeometry = makeBellowsGeometry();
  const bellowsCore = new THREE.Mesh(bellowsGeometry, materials.bellows);
  bellowsCore.castShadow = true;
  bellowsCore.receiveShadow = true;
  bellows.add(bellowsCore);

  // Visible side folds: nested diagonal ribs converge toward the lower rear
  // point and stay outside the bellows surface by a tiny presentation offset.
  const bellowsRibs = [];
  for (const side of [-1, 1]) {
    for (let i = 1; i <= 5; i += 1) {
      const rib = makeRod(0.62, materials.bellowsRib);
      rib.userData.side = side;
      rib.userData.u = i / 6;
      bellows.add(rib);
      bellowsRibs.push(rib);
    }
  }

  register('bellows', bellows);
  root.add(bellows);

  // --- Exterior erecting rails ----------------------------------------------
  const links = {
    leftRear: makeRod(1.15, materials.link),
    rightRear: makeRod(1.15, materials.link),
    leftFront: makeRod(1.15, materials.link),
    rightFront: makeRod(1.15, materials.link)
  };
  const linksRoot = new THREE.Group();
  Object.values(links).forEach(link => linksRoot.add(link));
  register('erectingLinks', linksRoot);
  root.add(linksRoot);

  const state = {
    deployment: 0,
    targetDeployment: 0,
    focus: RECONSTRUCTION.focus.normalizedDefault,
    explosion: 0,
    geometryRevision: A.revision,
    inspectionFocus: 'all',
    joints: {
      rearBase: null,
      rearTop: null,
      lensBase: null,
      lensTop: null
    }
  };

  function structuralState(t) {
    const e = smoother(t);

    const rearAngle = THREE.MathUtils.lerp(
      A.rearFoldedAngleDeg,
      A.rearOpenAngleDeg,
      e
    ) * DEG;

    const rearBase = new THREE.Vector3(0, baseTopY + 0.8, A.rearBasePivotZ);
    const rearTop = pointFromPivot(rearBase, A.rearWallLength, rearAngle);

    const lensBase = new THREE.Vector3(0, baseTopY + 0.8, A.frontStandardPivotZ);
    const lensTop = solveFourBarCoupler(
      rearTop,
      lensBase,
      A.lensStandardHeight,
      A.topFrontCoverLength
    );
    const lensAngle = Math.atan2(
      lensTop.z - lensBase.z,
      lensTop.y - lensBase.y
    );

    const upperSpan = lensTop.clone().sub(rearTop);
    const openCapAngle = Math.atan2(-upperSpan.y, upperSpan.z);
    // Keep the viewing relay physically associated with the rear optical structure.
    // The earlier midpoint + large lift made it read as an unexplained floating cube.
    const openCapCenter = rearTop.clone().lerp(lensTop, 0.34);
    openCapCenter.y += 2.6;
    openCapCenter.z -= 4.0;

    const foldedCapCenter = new THREE.Vector3(0, baseTopY + 9.2, -7);
    const capPosition = foldedCapCenter.clone().lerp(openCapCenter, e);
    const capAngle = THREE.MathUtils.lerp(
      A.topCapFoldedAngleDeg * DEG,
      openCapAngle,
      e
    );

    return { e, rearAngle, lensAngle, capAngle, capPosition, rearBase, rearTop, lensBase, lensTop };
  }

  function updateBellows(s) {
    const rearLower = new THREE.Vector3(0, baseTopY + 2.8, -57);
    const halfWidth = A.bellowsHalfWidth;

    updateBellowsGeometry(
      bellowsGeometry,
      rearLower,
      s.rearTop,
      s.lensTop,
      halfWidth
    );

    // Ordinary deployment keeps one persistent bellows topology. Opacity may
    // vary continuously for readability, but the bellows never appears/disappears.
    const expansion = THREE.MathUtils.smoothstep(s.e, 0.0, 0.32);
    bellowsCore.material.opacity = THREE.MathUtils.lerp(0.82, 1, expansion);
    bellowsCore.material.transparent = expansion < 0.995;

    for (const rib of bellowsRibs) {
      const u = rib.userData.u;
      const side = rib.userData.side;
      const innerA = rearLower.clone().lerp(s.rearTop, u);
      const innerB = rearLower.clone().lerp(s.lensTop, u);
      innerA.x = side * (halfWidth + 0.65);
      innerB.x = side * (halfWidth + 0.65);
      updateRod(rib, innerA, innerB);
      rib.visible = true;
    }
  }

  function updateStructure(s) {
    updatePanel(rearPanel, s.rearBase, s.rearTop, 0.80);

    lensHousing.position.copy(s.lensBase);
    lensHousing.rotation.set(s.lensAngle, 0, 0);

    viewfinder.position.copy(s.capPosition);
    viewfinder.rotation.set(s.capAngle, 0, 0);

    const vfRearLeft = s.rearTop.clone(); vfRearLeft.x = -31;
    const vfRearRight = s.rearTop.clone(); vfRearRight.x = 31;
    const vfCapLeft = localPointOnRotatedGroup(viewfinder, new THREE.Vector3(-31, -4.2, -20));
    const vfCapRight = localPointOnRotatedGroup(viewfinder, new THREE.Vector3(31, -4.2, -20));
    updateRod(viewfinderSupportLeft, vfRearLeft, vfCapLeft);
    updateRod(viewfinderSupportRight, vfRearRight, vfCapRight);

    const sideX = A.sideRailX;
    const rearTopLeft = s.rearTop.clone(); rearTopLeft.x = -sideX;
    const rearTopRight = s.rearTop.clone(); rearTopRight.x = sideX;
    const lensTopLeft = s.lensTop.clone(); lensTopLeft.x = -sideX + 2.0;
    const lensTopRight = s.lensTop.clone(); lensTopRight.x = sideX - 2.0;

    // Rigid top-front cover closes the four-bar between rear and lens standards.
    updatePanel(forwardPanel, s.rearTop, s.lensTop, 0.86);

    // Side erecting members are anchored to the same reconstructed pivots as
    // the rigid rear wall and front standard, so they no longer telescope.
    const rearBaseLeft = s.rearBase.clone(); rearBaseLeft.x = -sideX;
    const rearBaseRight = s.rearBase.clone(); rearBaseRight.x = sideX;
    const frontBaseLeft = s.lensBase.clone(); frontBaseLeft.x = -sideX + 2.0;
    const frontBaseRight = s.lensBase.clone(); frontBaseRight.x = sideX - 2.0;

    updateRod(links.leftRear, rearBaseLeft, rearTopLeft);
    updateRod(links.rightRear, rearBaseRight, rearTopRight);
    updateRod(links.leftFront, frontBaseLeft, lensTopLeft);
    updateRod(links.rightFront, frontBaseRight, lensTopRight);

    updateBellows(s);

    // All ordinary front-standard parts persist through deployment. Occlusion
    // and articulation, not threshold visibility, explain why folded parts are hidden.
    lensBarrel.visible = true;
    lensRing.visible = true;
    lensGlass.visible = true;
    photocell.visible = true;
    shutterButton.visible = true;
    lightenDarken.visible = true;
  }

  function applyExplosion(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    const e = state.explosion;

    // Explosion is a P5 inspection transform, independent of deployment.
    // Spread the enclosing structure far enough to expose the live internal
    // mechanism rather than merely nudging the outer shell apart.
    // Move the enclosing product shell *away* from the mechanism core.
    // Earlier values left the front standard and bellows sitting on top of the
    // very internals the explode control was meant to reveal.
    base.position.x = -112 * e;
    rearPanel.position.x += -132 * e;
    forwardPanel.position.x = 104 * e;
    lensHousing.position.x += 32 * e;
    viewfinder.position.x += -92 * e;
    viewfinder.position.y += 34 * e;
    bellows.position.x = -74 * e;
    linksRoot.position.x = 72 * e;

    // The bellows is an enclosure, not the subject of internal inspection.
    // Fade it into a ghosted contextual envelope as explosion increases.
    bellowsCore.material.opacity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.72, 1, THREE.MathUtils.smoothstep(state.deployment, 0.03, 0.32)),
      0.16,
      e
    );
    bellowsCore.material.transparent = e > 0.01 || state.deployment < 0.995;

    // Supports remain real parts during inspection; spread them instead of
    // deleting them so explosion never becomes another pop-in/out trick.
    viewfinderSupports.position.x = -42 * e;
    linksRoot.visible = true;
    forwardPanel.visible = true;

    const assembly = THREE.MathUtils.smoothstep(e, 0.25, 0.72);
    const deep = THREE.MathUtils.smoothstep(e, RECONSTRUCTION.inspection.deepExplosionStart, 1);

    // Hierarchical front-standard explosion. Keep the frame as spatial memory,
    // then peel faceplate, controls and optics away to expose the live shutter.
    faceplateAssembly.position.set(72 * deep, 0, 24 * assembly + 44 * deep);
    frontControls.position.set(88 * deep, 8 * deep, 28 * assembly + 54 * deep);
    shutterChamber.position.set(4 * deep, 0, 9 * assembly + 12 * deep);

    const focusTravel = (state.focus - 0.5) * RECONSTRUCTION.focus.frontElementTravelMmPresentation;
    const z0 = housingD / 2;
    lensBarrel.position.set(-5 - 28 * deep, 24, z0 + 8.5 + focusTravel + 10 * assembly + 16 * deep);
    lensRing.position.set(-5 - 44 * deep, 24, z0 + 16.0 + focusTravel + 15 * assembly + 24 * deep);
    lensGlass.position.set(-5 - 60 * deep, 24, z0 + 17.6 + focusTravel + 20 * assembly + 32 * deep);

    syncInspectionVisibility();
  }

  function syncInspectionVisibility() {
    const frontOnly = state.inspectionFocus === 'frontStandard';

    // Inspection-only isolation is deliberately separate from deployment.
    // It never changes physical state; it merely removes unrelated shell
    // context so the front-standard containment tree can be read clearly.
    base.visible = !frontOnly;
    rearPanel.visible = !frontOnly;
    forwardPanel.visible = !frontOnly;
    viewfinder.visible = !frontOnly;
    viewfinderSupports.visible = !frontOnly;
    bellows.visible = !frontOnly;
    linksRoot.visible = !frontOnly;
    lensHousing.visible = true;
  }

  function applyFocus(value) {
    state.focus = THREE.MathUtils.clamp(value, 0, 1);
    const travel = (state.focus - 0.5) * RECONSTRUCTION.focus.frontElementTravelMmPresentation;
    const z0 = RECONSTRUCTION.body.lensHousingDepth / 2;
    lensBarrel.position.set(-5, 24, z0 + 8.5 + travel);
    lensRing.position.set(-5, 24, z0 + 16.0 + travel);
    lensGlass.position.set(-5, 24, z0 + 17.6 + travel);
  }

  function applyDeployment(t) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    state.deployment = clamped;

    // Reset explosion offsets before deriving the articulated pose so repeated
    // updates never accumulate x drift.
    base.position.x = 0;
    rearPanel.position.x = 0;
    forwardPanel.position.x = 0;
    lensHousing.position.x = 0;
    viewfinder.position.x = 0;
    viewfinder.position.y = 0;
    bellows.position.x = 0;
    linksRoot.position.x = 0;
    viewfinderSupports.position.x = 0;
    viewfinderSupports.visible = true;
    faceplateAssembly.position.set(0, 0, 0);
    frontControls.position.set(0, 0, 0);
    shutterChamber.position.set(0, 0, 0);

    const s = structuralState(clamped);
    updateStructure(s);

    state.joints.rearBase = s.rearBase.toArray();
    state.joints.rearTop = s.rearTop.toArray();
    state.joints.lensBase = s.lensBase.toArray();
    state.joints.lensTop = s.lensTop.toArray();

    applyFocus(state.focus);
    applyExplosion(state.explosion);
    syncInspectionVisibility();
  }

  function geometryDiagnostics() {
    const foldedEnvelope = RECONSTRUCTION.envelopeMm;
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());

    const s = structuralState(state.deployment);
    const rearLength = s.rearBase.distanceTo(s.rearTop);
    const lensHeight = s.lensBase.distanceTo(s.lensTop);
    const vfAnchor = localPointOnRotatedGroup(viewfinder, new THREE.Vector3(0, -4.2, -20));
    const viewfinderRearSupportSpan = vfAnchor.distanceTo(s.rearTop);
    const topFrontCoverLength = s.rearTop.distanceTo(s.lensTop);
    const rearSideLinkLengths = [links.leftRear.userData.length, links.rightRear.userData.length];
    const frontSideLinkLengths = [links.leftFront.userData.length, links.rightFront.userData.length];
    const ordinaryMeshes = [];
    root.traverse(child => {
      if (child.isMesh) ordinaryMeshes.push(child);
    });
    const ordinaryHiddenPersistentPartCount = ordinaryMeshes.filter(mesh => mesh.visible === false).length;
    const frontStandardInspectableKeys = new Set();
    lensHousing.traverse(child => {
      if (child.isMesh && child.userData?.componentKey) {
        frontStandardInspectableKeys.add(child.userData.componentKey);
      }
    });

    return {
      revision: A.revision,
      deployment: state.deployment,
      inspectionFocus: state.inspectionFocus,
      rearMemberLength: rearLength,
      rearMemberLengthError: rearLength - A.rearWallLength,
      lensStandardHeight: lensHeight,
      lensStandardHeightError: lensHeight - A.lensStandardHeight,
      viewfinderRearSupportSpan,
      topFrontCoverLength,
      topFrontCoverLengthError: topFrontCoverLength - A.topFrontCoverLength,
      rearSideLinkLengthErrors: rearSideLinkLengths.map(length => length - A.rearWallLength),
      frontSideLinkLengthErrors: frontSideLinkLengths.map(length => length - A.lensStandardHeight),
      ordinaryPersistentPartCount: ordinaryMeshes.length,
      ordinaryHiddenPersistentPartCount,
      bellowsPersistentRibCount: bellowsRibs.length,
      frontStandardInspectablePartCount: frontStandardInspectableKeys.size,
      frontStandardDeepExploded: state.explosion >= RECONSTRUCTION.inspection.deepExplosionStart,
      bounds: {
        width: size.x,
        height: size.y,
        depth: size.z
      },
      foldedEnvelopeReference: foldedEnvelope,
      finite: [
        ...s.rearBase.toArray(),
        ...s.rearTop.toArray(),
        ...s.lensBase.toArray(),
        ...s.lensTop.toArray()
      ].every(Number.isFinite)
    };
  }

  function setDeploymentTarget(value) {
    state.targetDeployment = THREE.MathUtils.clamp(value, 0, 1);
  }

  function step(dt) {
    const speed = 2.15;
    if (Math.abs(state.deployment - state.targetDeployment) > 0.0005) {
      const next = THREE.MathUtils.damp(state.deployment, state.targetDeployment, speed, dt);
      applyDeployment(next);
    } else if (state.deployment !== state.targetDeployment) {
      applyDeployment(state.targetDeployment);
    }
  }

  function setExplode(value) {
    state.explosion = THREE.MathUtils.clamp(value, 0, 1);
    applyDeployment(state.deployment);
  }

  function setInspectionFocus(value) {
    state.inspectionFocus = value === 'frontStandard' ? 'frontStandard' : 'all';
    applyDeployment(state.deployment);
  }

  applyDeployment(0);

  return {
    root,
    pickables,
    components: componentRoots,
    state,
    setDeploymentTarget,
    setDeploymentImmediate: applyDeployment,
    setFocus: applyFocus,
    setExplode,
    setInspectionFocus,
    geometryDiagnostics,
    step
  };
}
