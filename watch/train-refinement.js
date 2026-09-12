import * as THREE from 'three';
import { escapeWheel, gear, pinion, setShadows } from './geometry.js';
import { LAYOUT } from './spec.js';

// M3e train-geometry pass.
//
// M3b aligned visible tooth/leaf counts with the reference timing graph.
// M3c derived pitch radii from current centre coordinates and those counts.
// M3d separated compound wheel bodies into explicit axial planes.
// M3e now aligns the simplified tooth envelopes around those pitch circles,
// solves static tooth/gap phase offsets through the train, and exposes optional
// pitch-circle guides so the otherwise-hidden wheel-to-pinion meshes are legible.

const TAU = Math.PI * 2;

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function solveExternalMesh(driverCenter, drivenCenter, driverTeeth, drivenLeaves) {
  const centerDistance = distance(driverCenter, drivenCenter);
  const moduleMm = (2 * centerDistance) / (driverTeeth + drivenLeaves);
  return {
    centerDistance,
    moduleMm,
    driverPitchRadius: moduleMm * driverTeeth / 2,
    drivenPitchRadius: moduleMm * drivenLeaves / 2
  };
}

export const TRAIN_MESHES = {
  centerToThird: {
    driver: 'centre wheel',
    driven: 'third pinion',
    driverCenter: LAYOUT.centerWheel,
    drivenCenter: LAYOUT.thirdWheel,
    driverTeeth: 80,
    drivenLeaves: 10,
    ...solveExternalMesh(LAYOUT.centerWheel, LAYOUT.thirdWheel, 80, 10)
  },
  thirdToSeconds: {
    driver: 'third wheel',
    driven: 'seconds/fourth pinion',
    driverCenter: LAYOUT.thirdWheel,
    drivenCenter: LAYOUT.secondWheel,
    driverTeeth: 60,
    drivenLeaves: 8,
    ...solveExternalMesh(LAYOUT.thirdWheel, LAYOUT.secondWheel, 60, 8)
  },
  secondsToEscape: {
    driver: 'seconds/fourth wheel',
    driven: 'escape pinion',
    driverCenter: LAYOUT.secondWheel,
    drivenCenter: LAYOUT.escapeWheel,
    driverTeeth: 120,
    drivenLeaves: 10,
    ...solveExternalMesh(LAYOUT.secondWheel, LAYOUT.escapeWheel, 120, 10)
  }
};

// Bridge-side z coordinates in millimetres. These remain reconstruction heights,
// not ETA manufacturing dimensions. The relational constraint is mechanical:
// each driven pinion sits in the plane of the wheel that drives it.
export const TRAIN_PLANES = {
  center: -0.65,
  third: -1.10,
  seconds: -1.55,
  escape: -0.65
};

function wheelDepth(moduleMm) {
  return Math.max(.12, moduleMm * .92);
}

function wheelWidth(moduleMm) {
  return Math.max(.07, moduleMm * .52);
}

// geometry.js's simplified gear radius is neither a strict pitch nor tip radius:
// rootRadius = radius - .58 * toothDepth. Treating the pitch line as about 55%
// of the simplified tooth depth gives this small compensation so the visible
// tooth envelope straddles the solved pitch circle instead of sitting inside it.
function gearRadiusForPitch(pitchRadius, toothDepth, pitchFraction = .55) {
  return pitchRadius + (.58 - pitchFraction) * toothDepth;
}

function wrap01(value) {
  return value - Math.floor(value);
}

function normalizeAngle(value) {
  return THREE.MathUtils.euclideanModulo(value + Math.PI, TAU) - Math.PI;
}

// Solve the static phase of a driven pinion so the tooth/gap relation at the
// line of centres complements the phase already imposed on the upstream wheel.
function solveDrivenPhase(mesh, driverPhase) {
  const [dx, dy] = [
    mesh.drivenCenter[0] - mesh.driverCenter[0],
    mesh.drivenCenter[1] - mesh.driverCenter[1]
  ];
  const alpha = Math.atan2(dy, dx);
  const beta = alpha + Math.PI;
  const driverPitch = TAU / mesh.driverTeeth;
  const drivenPitch = TAU / mesh.drivenLeaves;
  const driverContactPhase = wrap01((alpha - driverPhase) / driverPitch);
  const drivenContactPhase = wrap01(.5 - driverContactPhase);
  return normalizeAngle(beta - drivenContactPhase * drivenPitch);
}

export const TRAIN_PHASES = (() => {
  const center = 0;
  const third = solveDrivenPhase(TRAIN_MESHES.centerToThird, center);
  const seconds = solveDrivenPhase(TRAIN_MESHES.thirdToSeconds, third);
  const escape = solveDrivenPhase(TRAIN_MESHES.secondsToEscape, seconds);
  return { center, third, seconds, escape };
})();

const m1 = TRAIN_MESHES.centerToThird;
const m2 = TRAIN_MESHES.thirdToSeconds;
const m3 = TRAIN_MESHES.secondsToEscape;

const REFERENCE_VISUALS = {
  center: {
    teeth: 80,
    pitchRadius: m1.driverPitchRadius,
    thickness: .46,
    toothDepth: wheelDepth(m1.moduleMm),
    toothWidth: wheelWidth(m1.moduleMm),
    moduleMm: m1.moduleMm,
    pinion: null,
    mesh: 'centerToThird'
  },
  third: {
    teeth: 60,
    pitchRadius: m2.driverPitchRadius,
    thickness: .42,
    toothDepth: wheelDepth(m2.moduleMm),
    toothWidth: wheelWidth(m2.moduleMm),
    moduleMm: m2.moduleMm,
    pinion: {
      teeth: 10,
      pitchRadius: m1.drivenPitchRadius,
      thickness: .76,
      z: TRAIN_PLANES.center - TRAIN_PLANES.third,
      moduleMm: m1.moduleMm,
      meshPlane: TRAIN_PLANES.center
    },
    mesh: 'thirdToSeconds'
  },
  seconds: {
    teeth: 120,
    pitchRadius: m3.driverPitchRadius,
    thickness: .40,
    toothDepth: wheelDepth(m3.moduleMm),
    toothWidth: wheelWidth(m3.moduleMm),
    moduleMm: m3.moduleMm,
    pinion: {
      teeth: 8,
      pitchRadius: m2.drivenPitchRadius,
      thickness: .74,
      z: TRAIN_PLANES.third - TRAIN_PLANES.seconds,
      moduleMm: m2.moduleMm,
      meshPlane: TRAIN_PLANES.third
    },
    mesh: 'secondsToEscape'
  },
  escape: {
    teeth: 15,
    // Escape-wheel teeth belong to the escapement rather than the train mesh
    // that drives its pinion, so its wheel radius remains reference-derived.
    radius: 2.25,
    thickness: .34,
    toothDepth: .70,
    toothWidth: .17,
    pinion: {
      teeth: 10,
      pitchRadius: m3.drivenPitchRadius,
      thickness: .72,
      z: TRAIN_PLANES.seconds - TRAIN_PLANES.escape,
      moduleMm: m3.moduleMm,
      meshPlane: TRAIN_PLANES.seconds
    },
    mesh: null
  }
};

function rootPart(object) {
  let node = object;
  while (node && !node.userData?.meta) node = node.parent;
  return node ?? null;
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

function disposeGeometry(object) {
  object.traverse(child => child.geometry?.dispose?.());
}

function markPickables(object, root, pickables) {
  object.traverse(child => {
    if (!child.isMesh) return;
    child.userData.pickRoot = root;
    pickables.push(child);
  });
}

function hideLegacyCoaxialPinions(target, pickables) {
  const parent = target.parent;
  if (!parent) return;
  const siblings = [...parent.children];
  for (const sibling of siblings) {
    if (sibling === target || sibling.userData?.geometryType !== 'gear') continue;
    if (Math.hypot(sibling.position.x - target.position.x, sibling.position.y - target.position.y) > .08) continue;
    removePickablesFor(sibling, pickables);
    sibling.visible = false;
    sibling.userData.m3eLegacyHidden = true;
  }
}

function replaceWheel(target, visual, pickables) {
  if (!target) return;
  hideLegacyCoaxialPinions(target, pickables);
  removePickablesFor(target, pickables);
  for (const child of [...target.children]) {
    target.remove(child);
    disposeGeometry(child);
  }
  target.add(visual);
  setShadows(visual, true);
  const root = rootPart(target);
  if (root) markPickables(visual, root, pickables);
}

function conventionalWheel(spec, material, pinionMaterial, spokeCount = 5) {
  const visualRadius = gearRadiusForPitch(spec.pitchRadius, spec.toothDepth);
  const assembly = gear({
    radius: visualRadius,
    teeth: spec.teeth,
    thickness: spec.thickness,
    material,
    hubMaterial: pinionMaterial,
    hubRadius: Math.max(.48, spec.pitchRadius * .13),
    spokeCount,
    spokeWidth: spec.teeth > 100 ? .24 : .32,
    rimTube: spec.teeth > 100 ? .12 : .17,
    toothDepth: spec.toothDepth,
    toothWidth: spec.toothWidth,
    toothTipScale: .56
  });

  if (spec.pinion) {
    const pinionToothDepth = .20;
    const p = pinion({
      radius: gearRadiusForPitch(spec.pinion.pitchRadius, pinionToothDepth),
      teeth: spec.pinion.teeth,
      thickness: spec.pinion.thickness,
      material: pinionMaterial
    });
    p.position.z = spec.pinion.z;
    p.userData.referenceLeafCount = spec.pinion.teeth;
    p.userData.pitchRadiusMm = spec.pinion.pitchRadius;
    p.userData.pitchModuleMm = spec.pinion.moduleMm;
    p.userData.meshPlaneMm = spec.pinion.meshPlane;
    assembly.add(p);
  }

  assembly.userData.referenceToothCount = spec.teeth;
  assembly.userData.nominalPitchRadiusMm = spec.pitchRadius;
  assembly.userData.pitchModuleMm = spec.moduleMm;
  assembly.userData.mesh = spec.mesh;
  return assembly;
}

function circleLine(radius, x, y, z, material) {
  const points = [];
  for (let i = 0; i <= 96; i++) {
    const a = i / 96 * TAU;
    points.push(new THREE.Vector3(x + Math.cos(a) * radius, y + Math.sin(a) * radius, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

function connectorLine(a, b, z, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(a[0], a[1], z),
    new THREE.Vector3(b[0], b[1], z)
  ]);
  return new THREE.Line(geometry, material);
}

function createMeshGuides(trainRoot) {
  const group = new THREE.Group();
  group.name = 'M3e pitch mesh guides';
  const circleMaterial = new THREE.LineBasicMaterial({ color: 0x65c8ff, transparent: true, opacity: .72, depthTest: false });
  const connectorMaterial = new THREE.LineBasicMaterial({ color: 0xffd278, transparent: true, opacity: .66, depthTest: false });

  const guideSpecs = [
    [TRAIN_MESHES.centerToThird, TRAIN_PLANES.center],
    [TRAIN_MESHES.thirdToSeconds, TRAIN_PLANES.third],
    [TRAIN_MESHES.secondsToEscape, TRAIN_PLANES.seconds]
  ];

  for (const [mesh, z] of guideSpecs) {
    group.add(circleLine(mesh.driverPitchRadius, mesh.driverCenter[0], mesh.driverCenter[1], z, circleMaterial));
    group.add(circleLine(mesh.drivenPitchRadius, mesh.drivenCenter[0], mesh.drivenCenter[1], z, circleMaterial));
    group.add(connectorLine(mesh.driverCenter, mesh.drivenCenter, z, connectorMaterial));
  }

  group.visible = false;
  group.renderOrder = 20;
  trainRoot?.add(group);
  return group;
}

export function trainGeometryDiagnostics() {
  const meshDiagnostics = Object.fromEntries(Object.entries(TRAIN_MESHES).map(([name, mesh]) => [name, {
    driver: mesh.driver,
    driven: mesh.driven,
    centerDistanceMm: Number(mesh.centerDistance.toFixed(3)),
    moduleMm: Number(mesh.moduleMm.toFixed(4)),
    driverPitchRadiusMm: Number(mesh.driverPitchRadius.toFixed(3)),
    drivenPitchRadiusMm: Number(mesh.drivenPitchRadius.toFixed(3)),
    radialClosureMm: Number((mesh.driverPitchRadius + mesh.drivenPitchRadius - mesh.centerDistance).toFixed(6))
  }]));

  return {
    ...meshDiagnostics,
    phasesRad: Object.fromEntries(Object.entries(TRAIN_PHASES).map(([key, value]) => [key, Number(value.toFixed(4))])),
    planes: {
      centerWheelMm: TRAIN_PLANES.center,
      thirdWheelMm: TRAIN_PLANES.third,
      secondsWheelMm: TRAIN_PLANES.seconds,
      escapeWheelMm: TRAIN_PLANES.escape,
      thirdPinionMeshPlaneMm: TRAIN_PLANES.center,
      secondsPinionMeshPlaneMm: TRAIN_PLANES.third,
      escapePinionMeshPlaneMm: TRAIN_PLANES.seconds
    }
  };
}

export function refineTrainGeometry(animated, materials, pickables) {
  // Move the wheel bodies into explicit compound-train planes before replacing
  // their placeholder meshes. XY positions remain the reference-derived layout.
  animated.centerWheel.position.z = TRAIN_PLANES.center;
  animated.thirdWheel.position.z = TRAIN_PLANES.third;
  animated.fourthWheel.position.z = TRAIN_PLANES.seconds;
  animated.escapeWheel.position.z = TRAIN_PLANES.escape;

  replaceWheel(
    animated.centerWheel,
    conventionalWheel(REFERENCE_VISUALS.center, materials.brass, materials.caseSteel, 5),
    pickables
  );
  replaceWheel(
    animated.thirdWheel,
    conventionalWheel(REFERENCE_VISUALS.third, materials.gilt, materials.caseSteel, 5),
    pickables
  );
  replaceWheel(
    animated.fourthWheel,
    conventionalWheel(REFERENCE_VISUALS.seconds, materials.brass, materials.caseSteel, 5),
    pickables
  );

  const escSpec = REFERENCE_VISUALS.escape;
  const escAssembly = escapeWheel({
    radius: escSpec.radius,
    teeth: escSpec.teeth,
    thickness: escSpec.thickness,
    material: materials.gilt,
    hubMaterial: materials.caseSteel,
    hubRadius: .42,
    spokeCount: 5,
    toothDepth: escSpec.toothDepth,
    toothWidth: escSpec.toothWidth,
    hook: .20
  });
  const escapePinion = pinion({
    radius: gearRadiusForPitch(escSpec.pinion.pitchRadius, .20),
    teeth: escSpec.pinion.teeth,
    thickness: escSpec.pinion.thickness,
    material: materials.caseSteel
  });
  escapePinion.position.z = escSpec.pinion.z;
  escapePinion.userData.referenceLeafCount = escSpec.pinion.teeth;
  escapePinion.userData.pitchRadiusMm = escSpec.pinion.pitchRadius;
  escapePinion.userData.pitchModuleMm = escSpec.pinion.moduleMm;
  escapePinion.userData.meshPlaneMm = escSpec.pinion.meshPlane;
  escAssembly.add(escapePinion);
  escAssembly.userData.referenceToothCount = escSpec.teeth;
  replaceWheel(animated.escapeWheel, escAssembly, pickables);

  const trainRoot = animated.centerWheel.parent;
  const guides = createMeshGuides(trainRoot);

  return {
    visuals: REFERENCE_VISUALS,
    meshes: trainGeometryDiagnostics(),
    phases: TRAIN_PHASES,
    guides
  };
}
