import * as THREE from 'three';
import { escapeWheel, setShadows } from './geometry.js';
import {
  refineTrainGeometry as refineM3e,
  TRAIN_MESHES,
  TRAIN_PHASES
} from './train-refinement.js';

// M3f is deliberately layered on top of M3e so the earlier reconstruction
// remains inspectable as a historical step. M3f replaces the simplified train
// teeth with a pitch-radius-native spur primitive, moves the compound train into
// a clearance-aware axial stack, and adds stepped staffs / pivots between the
// mainplate and bridge jewels.

const TAU = Math.PI * 2;

export const M3F_PLANES = {
  center: -0.90,
  third: -1.23,
  seconds: -1.55,
  escape: -0.92
};

export const BEARING_PLANES = {
  mainplateSurface: -0.57,
  mainplateJewel: -0.68,
  barrelBridgeUnderside: -1.91,
  trainBridgeUnderside: -1.93,
  centerBridgeJewel: -2.70,
  trainBridgeJewel: -2.72
};

const WHEEL_SPECS = {
  center: {
    teeth: 80,
    pitchRadius: TRAIN_MESHES.centerToThird.driverPitchRadius,
    moduleMm: TRAIN_MESHES.centerToThird.moduleMm,
    thickness: .30,
    plane: M3F_PLANES.center,
    material: 'brass',
    hubMaterial: 'caseSteel',
    spokeCount: 5,
    hubRadius: .68,
    bridgeUnderside: BEARING_PLANES.barrelBridgeUnderside,
    bridgeJewel: BEARING_PLANES.centerBridgeJewel
  },
  third: {
    teeth: 60,
    pitchRadius: TRAIN_MESHES.thirdToSeconds.driverPitchRadius,
    moduleMm: TRAIN_MESHES.thirdToSeconds.moduleMm,
    thickness: .28,
    plane: M3F_PLANES.third,
    material: 'gilt',
    hubMaterial: 'caseSteel',
    spokeCount: 5,
    hubRadius: .62,
    bridgeUnderside: BEARING_PLANES.trainBridgeUnderside,
    bridgeJewel: BEARING_PLANES.trainBridgeJewel,
    pinion: {
      teeth: 10,
      pitchRadius: TRAIN_MESHES.centerToThird.drivenPitchRadius,
      moduleMm: TRAIN_MESHES.centerToThird.moduleMm,
      thickness: .46,
      plane: M3F_PLANES.center
    }
  },
  seconds: {
    teeth: 120,
    pitchRadius: TRAIN_MESHES.secondsToEscape.driverPitchRadius,
    moduleMm: TRAIN_MESHES.secondsToEscape.moduleMm,
    thickness: .26,
    plane: M3F_PLANES.seconds,
    material: 'brass',
    hubMaterial: 'caseSteel',
    spokeCount: 5,
    hubRadius: .56,
    bridgeUnderside: BEARING_PLANES.trainBridgeUnderside,
    bridgeJewel: BEARING_PLANES.trainBridgeJewel,
    pinion: {
      teeth: 8,
      pitchRadius: TRAIN_MESHES.thirdToSeconds.drivenPitchRadius,
      moduleMm: TRAIN_MESHES.thirdToSeconds.moduleMm,
      thickness: .44,
      plane: M3F_PLANES.third
    }
  },
  escape: {
    teeth: 15,
    radius: 2.25,
    thickness: .24,
    plane: M3F_PLANES.escape,
    material: 'gilt',
    hubMaterial: 'caseSteel',
    bridgeUnderside: BEARING_PLANES.trainBridgeUnderside,
    bridgeJewel: BEARING_PLANES.trainBridgeJewel,
    pinion: {
      teeth: 10,
      pitchRadius: TRAIN_MESHES.secondsToEscape.drivenPitchRadius,
      moduleMm: TRAIN_MESHES.secondsToEscape.moduleMm,
      thickness: .44,
      plane: M3F_PLANES.seconds
    }
  }
};

function meshMaterial(materials, name) {
  return materials[name] ?? materials.caseSteel;
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function centeredCylinder(radius, thickness, material, segments = 48) {
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return shadowed(mesh);
}

function cylinderBetweenZ(radius, zA, zB, material, segments = 28) {
  const length = Math.abs(zB - zA);
  const mesh = centeredCylinder(radius, length, material, segments);
  mesh.position.z = (zA + zB) / 2;
  return mesh;
}

function polar(radius, angle) {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function truePitchToothGeometry({ pitchRadius, moduleMm, thickness }) {
  // This remains an educational tooth profile rather than a generated involute,
  // but unlike the earlier primitive its pitch radius has exact semantic meaning.
  // The addendum/dedendum bracket that pitch line and the tooth occupies roughly
  // half a circular pitch at the pitch circle.
  const addendum = moduleMm * .92;
  const dedendum = moduleMm * 1.12;
  const rootRadius = Math.max(moduleMm * 1.6, pitchRadius - dedendum);
  const tipRadius = pitchRadius + addendum;
  const circularAngle = TAU / Math.max(3, Math.round((pitchRadius * 2) / moduleMm));
  const rootHalf = circularAngle * .31;
  const pitchHalf = circularAngle * .25;
  const tipHalf = circularAngle * .15;

  const points = [
    polar(rootRadius, -rootHalf),
    polar(pitchRadius, -pitchHalf),
    polar(tipRadius, -tipHalf),
    polar(tipRadius, tipHalf),
    polar(pitchRadius, pitchHalf),
    polar(rootRadius, rootHalf)
  ];

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: false
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return { geometry, rootRadius, tipRadius, addendum, dedendum };
}

function truePitchSpurGear({
  pitchRadius,
  moduleMm,
  teeth,
  thickness,
  material,
  hubMaterial = material,
  hubRadius = Math.max(.24, pitchRadius * .12),
  spokeCount = 5,
  spokeWidth = .22,
  solid = false
}) {
  const group = new THREE.Group();
  group.userData.geometryType = 'true-pitch-spur-gear';
  group.userData.toothCount = teeth;
  group.userData.pitchRadiusMm = pitchRadius;
  group.userData.pitchModuleMm = moduleMm;

  const tooth = truePitchToothGeometry({ pitchRadius, moduleMm, thickness });
  const toothTemplate = shadowed(new THREE.Mesh(tooth.geometry, material));
  for (let i = 0; i < teeth; i++) {
    const copy = toothTemplate.clone();
    copy.rotation.z = i / teeth * TAU;
    group.add(copy);
  }

  const rimTube = Math.max(moduleMm * .42, .055);
  const rimRadius = Math.max(hubRadius + rimTube * 2, tooth.rootRadius - rimTube * 1.05);
  const rim = shadowed(new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius, rimTube, 8, Math.max(48, teeth * 2)),
    material
  ));
  group.add(rim);

  const hub = centeredCylinder(hubRadius, thickness, hubMaterial, 40);
  group.add(hub);

  if (!solid && spokeCount > 0) {
    const spokeLength = Math.max(.12, rimRadius - hubRadius - rimTube * 1.5);
    const geometry = new THREE.BoxGeometry(spokeWidth, spokeLength, thickness * .72);
    for (let i = 0; i < spokeCount; i++) {
      const angle = i / spokeCount * TAU;
      const spoke = shadowed(new THREE.Mesh(geometry, material));
      spoke.position.set(
        Math.cos(angle) * (hubRadius + spokeLength / 2),
        Math.sin(angle) * (hubRadius + spokeLength / 2),
        0
      );
      spoke.rotation.z = angle - Math.PI / 2;
      group.add(spoke);
    }
  } else if (solid) {
    group.add(centeredCylinder(Math.max(hubRadius, tooth.rootRadius * .72), thickness * .78, material, 48));
  }

  group.userData.rootRadiusMm = tooth.rootRadius;
  group.userData.tipRadiusMm = tooth.tipRadius;
  return group;
}

function removePickablesFor(object, pickables) {
  const doomed = new Set();
  object.traverse(child => {
    if (child.isMesh) doomed.add(child);
  });
  for (let i = pickables.length - 1; i >= 0; i--) {
    if (doomed.has(pickables[i])) pickables.splice(i, 1);
  }
}

function disposeGeometries(object) {
  object.traverse(child => child.geometry?.dispose?.());
}

function trainMetaRoot(target) {
  let node = target;
  while (node && !node.userData?.meta) node = node.parent;
  return node;
}

function markPickables(object, root, pickables) {
  object.traverse(child => {
    if (!child.isMesh) return;
    child.userData.pickRoot = root;
    pickables.push(child);
  });
}

function replaceChildren(target, visual, pickables) {
  removePickablesFor(target, pickables);
  for (const child of [...target.children]) {
    target.remove(child);
    disposeGeometries(child);
  }
  target.add(visual);
  setShadows(visual, true);
  const root = trainMetaRoot(target);
  if (root) markPickables(visual, root, pickables);
}

function buildCompoundWheel(spec, materials) {
  const wheel = truePitchSpurGear({
    pitchRadius: spec.pitchRadius,
    moduleMm: spec.moduleMm,
    teeth: spec.teeth,
    thickness: spec.thickness,
    material: meshMaterial(materials, spec.material),
    hubMaterial: meshMaterial(materials, spec.hubMaterial),
    hubRadius: spec.hubRadius,
    spokeCount: spec.spokeCount ?? 5,
    spokeWidth: spec.teeth > 100 ? .18 : .24
  });

  if (spec.pinion) {
    const p = truePitchSpurGear({
      pitchRadius: spec.pinion.pitchRadius,
      moduleMm: spec.pinion.moduleMm,
      teeth: spec.pinion.teeth,
      thickness: spec.pinion.thickness,
      material: materials.caseSteel,
      hubMaterial: materials.caseSteel,
      hubRadius: Math.max(.16, spec.pinion.pitchRadius * .34),
      spokeCount: 0,
      solid: true
    });
    p.position.z = spec.pinion.plane - spec.plane;
    p.userData.referenceLeafCount = spec.pinion.teeth;
    p.userData.meshPlaneMm = spec.pinion.plane;
    wheel.add(p);
  }
  return wheel;
}

function buildEscapeAssembly(spec, materials) {
  const assembly = escapeWheel({
    radius: spec.radius,
    teeth: spec.teeth,
    thickness: spec.thickness,
    material: meshMaterial(materials, spec.material),
    hubMaterial: meshMaterial(materials, spec.hubMaterial),
    hubRadius: .40,
    spokeCount: 5,
    toothDepth: .68,
    toothWidth: .16,
    hook: .18
  });
  const p = truePitchSpurGear({
    pitchRadius: spec.pinion.pitchRadius,
    moduleMm: spec.pinion.moduleMm,
    teeth: spec.pinion.teeth,
    thickness: spec.pinion.thickness,
    material: materials.caseSteel,
    hubMaterial: materials.caseSteel,
    hubRadius: Math.max(.16, spec.pinion.pitchRadius * .34),
    spokeCount: 0,
    solid: true
  });
  p.position.z = spec.pinion.plane - spec.plane;
  p.userData.referenceLeafCount = spec.pinion.teeth;
  p.userData.meshPlaneMm = spec.pinion.plane;
  assembly.add(p);
  return assembly;
}

function hideLegacyArbors(trainRoot) {
  const centers = [
    TRAIN_MESHES.centerToThird.driverCenter,
    TRAIN_MESHES.centerToThird.drivenCenter,
    TRAIN_MESHES.thirdToSeconds.drivenCenter,
    TRAIN_MESHES.secondsToEscape.drivenCenter
  ];
  for (const child of trainRoot.children) {
    if (!child.isMesh) continue;
    if (child.geometry?.type !== 'CylinderGeometry') continue;
    if (!centers.some(([x, y]) => Math.hypot(child.position.x - x, child.position.y - y) < .08)) continue;
    child.visible = false;
    child.userData.m3fLegacyArborHidden = true;
  }
}

function steppedStaff({ x, y, bridgeJewel, wheelPlane, material, accentMaterial }) {
  const group = new THREE.Group();
  group.position.set(x, y, 0);
  group.userData.geometryType = 'stepped-staff';

  // Mainplate pivot / polished tip.
  group.add(cylinderBetweenZ(.050, -0.50, -0.76, accentMaterial, 20));
  group.add(cylinderBetweenZ(.086, -0.76, -1.82, material, 24));

  // Seat collar where the wheel is carried on the staff.
  const collar = cylinderBetweenZ(.155, wheelPlane - .075, wheelPlane + .075, material, 28);
  group.add(collar);

  // Narrow neck passes through the bridge bore to the upper jewel.
  group.add(cylinderBetweenZ(.064, -1.82, bridgeJewel - .11, material, 22));
  group.add(cylinderBetweenZ(.043, bridgeJewel - .11, bridgeJewel + .14, accentMaterial, 18));

  return group;
}

function assemblyEnvelope(spec) {
  const spans = [[spec.plane - spec.thickness / 2, spec.plane + spec.thickness / 2]];
  if (spec.pinion) spans.push([
    spec.pinion.plane - spec.pinion.thickness / 2,
    spec.pinion.plane + spec.pinion.thickness / 2
  ]);
  return {
    minZ: Math.min(...spans.map(([min]) => min)),
    maxZ: Math.max(...spans.map(([, max]) => max))
  };
}

function clearanceDiagnostics() {
  const out = {};
  for (const [name, spec] of Object.entries(WHEEL_SPECS)) {
    const envelope = assemblyEnvelope(spec);
    out[name] = {
      wheelPlaneMm: spec.plane,
      minZMm: Number(envelope.minZ.toFixed(3)),
      maxZMm: Number(envelope.maxZ.toFixed(3)),
      mainplateClearanceMm: Number((BEARING_PLANES.mainplateSurface - envelope.maxZ).toFixed(3)),
      bridgeClearanceMm: Number((envelope.minZ - spec.bridgeUnderside).toFixed(3)),
      bridgeJewelPlaneMm: spec.bridgeJewel
    };
  }
  return out;
}

function circleLine(radius, x, y, z, material, segments = 96) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * TAU;
    points.push(new THREE.Vector3(x + Math.cos(a) * radius, y + Math.sin(a) * radius, z));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function connectorLine(a, b, z, material) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a[0], a[1], z),
      new THREE.Vector3(b[0], b[1], z)
    ]),
    material
  );
}

function contactPoint(mesh) {
  const dx = mesh.drivenCenter[0] - mesh.driverCenter[0];
  const dy = mesh.drivenCenter[1] - mesh.driverCenter[1];
  const d = Math.hypot(dx, dy) || 1;
  return [
    mesh.driverCenter[0] + dx / d * mesh.driverPitchRadius,
    mesh.driverCenter[1] + dy / d * mesh.driverPitchRadius
  ];
}

function createPitchGuides(trainRoot, materials) {
  const group = new THREE.Group();
  group.name = 'M3f true pitch mesh guides';
  group.visible = false;

  const circleMaterial = new THREE.LineBasicMaterial({
    color: 0x65c8ff,
    transparent: true,
    opacity: .74,
    depthTest: false
  });
  const connectorMaterial = new THREE.LineBasicMaterial({
    color: 0xffd278,
    transparent: true,
    opacity: .72,
    depthTest: false
  });
  const contactMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcf67,
    depthTest: false,
    transparent: true,
    opacity: .95
  });

  const guideSpecs = [
    [TRAIN_MESHES.centerToThird, M3F_PLANES.center],
    [TRAIN_MESHES.thirdToSeconds, M3F_PLANES.third],
    [TRAIN_MESHES.secondsToEscape, M3F_PLANES.seconds]
  ];

  for (const [mesh, z] of guideSpecs) {
    group.add(circleLine(mesh.driverPitchRadius, mesh.driverCenter[0], mesh.driverCenter[1], z, circleMaterial));
    group.add(circleLine(mesh.drivenPitchRadius, mesh.drivenCenter[0], mesh.drivenCenter[1], z, circleMaterial));
    group.add(connectorLine(mesh.driverCenter, mesh.drivenCenter, z, connectorMaterial));
    const [cx, cy] = contactPoint(mesh);
    const contact = new THREE.Mesh(new THREE.SphereGeometry(.15, 18, 12), contactMaterial);
    contact.position.set(cx, cy, z + .02);
    group.add(contact);
  }

  group.renderOrder = 30;
  trainRoot.add(group);
  return group;
}

function createStackGuides(trainRoot) {
  const group = new THREE.Group();
  group.name = 'M3f staff and clearance guides';
  group.visible = false;

  const mainplateMaterial = new THREE.MeshBasicMaterial({
    color: 0x79b9ff,
    transparent: true,
    opacity: .055,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const bridgeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb76e,
    transparent: true,
    opacity: .055,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const staffLineMaterial = new THREE.LineBasicMaterial({
    color: 0xb7e5ff,
    transparent: true,
    opacity: .58,
    depthTest: false
  });

  const mainplate = new THREE.Mesh(new THREE.CircleGeometry(16.5, 96), mainplateMaterial);
  mainplate.position.z = BEARING_PLANES.mainplateSurface;
  group.add(mainplate);

  const bridge = new THREE.Mesh(new THREE.CircleGeometry(16.5, 96), bridgeMaterial);
  bridge.position.z = BEARING_PLANES.trainBridgeUnderside;
  group.add(bridge);

  const centers = {
    center: TRAIN_MESHES.centerToThird.driverCenter,
    third: TRAIN_MESHES.centerToThird.drivenCenter,
    seconds: TRAIN_MESHES.thirdToSeconds.drivenCenter,
    escape: TRAIN_MESHES.secondsToEscape.drivenCenter
  };

  for (const [name, [x, y]] of Object.entries(centers)) {
    const spec = WHEEL_SPECS[name];
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y, BEARING_PLANES.mainplateSurface),
      new THREE.Vector3(x, y, spec.bridgeJewel)
    ]);
    group.add(new THREE.Line(geometry, staffLineMaterial));
  }

  group.renderOrder = 28;
  trainRoot.add(group);
  return group;
}

export function refineTrainGeometry(animated, materials, pickables) {
  const base = refineM3e(animated, materials, pickables);
  const trainRoot = animated.centerWheel.parent;

  // The M3e guide planes used the previous axial stack. Replace them rather than
  // letting two different plane models coexist visually.
  if (base.guides?.parent) base.guides.parent.remove(base.guides);

  animated.centerWheel.position.z = M3F_PLANES.center;
  animated.thirdWheel.position.z = M3F_PLANES.third;
  animated.fourthWheel.position.z = M3F_PLANES.seconds;
  animated.escapeWheel.position.z = M3F_PLANES.escape;

  replaceChildren(animated.centerWheel, buildCompoundWheel(WHEEL_SPECS.center, materials), pickables);
  replaceChildren(animated.thirdWheel, buildCompoundWheel(WHEEL_SPECS.third, materials), pickables);
  replaceChildren(animated.fourthWheel, buildCompoundWheel(WHEEL_SPECS.seconds, materials), pickables);
  replaceChildren(animated.escapeWheel, buildEscapeAssembly(WHEEL_SPECS.escape, materials), pickables);

  hideLegacyArbors(trainRoot);

  const centers = {
    center: TRAIN_MESHES.centerToThird.driverCenter,
    third: TRAIN_MESHES.centerToThird.drivenCenter,
    seconds: TRAIN_MESHES.thirdToSeconds.drivenCenter,
    escape: TRAIN_MESHES.secondsToEscape.drivenCenter
  };
  const trainRootMeta = trainMetaRoot(animated.centerWheel);

  const staffs = new THREE.Group();
  staffs.name = 'M3f stepped train staffs';
  for (const [name, [x, y]] of Object.entries(centers)) {
    const spec = WHEEL_SPECS[name];
    const staff = steppedStaff({
      x,
      y,
      bridgeJewel: spec.bridgeJewel,
      wheelPlane: spec.plane,
      material: materials.brushedSteel,
      accentMaterial: materials.caseSteel
    });
    staff.userData.staffName = name;
    staffs.add(staff);
    if (trainRootMeta) markPickables(staff, trainRootMeta, pickables);
  }
  trainRoot.add(staffs);

  const guides = createPitchGuides(trainRoot, materials);
  const stackGuides = createStackGuides(trainRoot);
  const clearances = clearanceDiagnostics();

  return {
    ...base,
    phases: TRAIN_PHASES,
    guides,
    stackGuides,
    staffs,
    planes: M3F_PLANES,
    bearingPlanes: BEARING_PLANES,
    clearances,
    milestone: 'M3f'
  };
}
