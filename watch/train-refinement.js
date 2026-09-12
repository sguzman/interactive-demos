import { escapeWheel, gear, pinion, setShadows } from './geometry.js';
import { LAYOUT } from './spec.js';

// M3d train-geometry pass.
//
// M3b aligned visible tooth/leaf counts with the reference timing graph.
// M3c derived pitch radii from current centre coordinates and those counts.
// M3d now gives the compound train explicit wheel planes so large wheel bodies
// can pass one another while each driven pinion is placed in the plane of the
// upstream wheel that actually meshes with it.

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
    driverTeeth: 80,
    drivenLeaves: 10,
    ...solveExternalMesh(LAYOUT.centerWheel, LAYOUT.thirdWheel, 80, 10)
  },
  thirdToSeconds: {
    driver: 'third wheel',
    driven: 'seconds/fourth pinion',
    driverTeeth: 60,
    drivenLeaves: 8,
    ...solveExternalMesh(LAYOUT.thirdWheel, LAYOUT.secondWheel, 60, 8)
  },
  secondsToEscape: {
    driver: 'seconds/fourth wheel',
    driven: 'escape pinion',
    driverTeeth: 120,
    drivenLeaves: 10,
    ...solveExternalMesh(LAYOUT.secondWheel, LAYOUT.escapeWheel, 120, 10)
  }
};

// Bridge-side z coordinates in millimetres. These are reconstruction planes,
// not ETA manufacturing heights. The important M3d constraint is relational:
// each pinion lands exactly in the plane of the wheel that drives it.
export const TRAIN_PLANES = {
  center: -0.65,
  third: -1.10,
  seconds: -1.55,
  escape: -0.65
};

function wheelDepth(moduleMm) {
  return Math.max(.12, moduleMm * .95);
}

function wheelWidth(moduleMm) {
  return Math.max(.07, moduleMm * .55);
}

const m1 = TRAIN_MESHES.centerToThird;
const m2 = TRAIN_MESHES.thirdToSeconds;
const m3 = TRAIN_MESHES.secondsToEscape;

const REFERENCE_VISUALS = {
  center: {
    teeth: 80,
    radius: m1.driverPitchRadius,
    thickness: .46,
    toothDepth: wheelDepth(m1.moduleMm),
    toothWidth: wheelWidth(m1.moduleMm),
    pinion: null,
    mesh: 'centerToThird'
  },
  third: {
    teeth: 60,
    radius: m2.driverPitchRadius,
    thickness: .42,
    toothDepth: wheelDepth(m2.moduleMm),
    toothWidth: wheelWidth(m2.moduleMm),
    pinion: {
      teeth: 10,
      radius: m1.drivenPitchRadius,
      thickness: .72,
      // local z required to land in the centre-wheel plane
      z: TRAIN_PLANES.center - TRAIN_PLANES.third,
      moduleMm: m1.moduleMm,
      meshPlane: TRAIN_PLANES.center
    },
    mesh: 'thirdToSeconds'
  },
  seconds: {
    teeth: 120,
    radius: m3.driverPitchRadius,
    thickness: .40,
    toothDepth: wheelDepth(m3.moduleMm),
    toothWidth: wheelWidth(m3.moduleMm),
    pinion: {
      teeth: 8,
      radius: m2.drivenPitchRadius,
      thickness: .68,
      // local z required to land in the third-wheel plane
      z: TRAIN_PLANES.third - TRAIN_PLANES.seconds,
      moduleMm: m2.moduleMm,
      meshPlane: TRAIN_PLANES.third
    },
    mesh: 'secondsToEscape'
  },
  escape: {
    teeth: 15,
    // Escape-wheel tooth geometry belongs to the escapement, not to the train
    // mesh that drives its pinion, so its wheel radius remains reference-derived.
    radius: 2.25,
    thickness: .34,
    toothDepth: .70,
    toothWidth: .17,
    pinion: {
      teeth: 10,
      radius: m3.drivenPitchRadius,
      thickness: .66,
      // local z required to land in the seconds/fourth-wheel plane
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
    sibling.userData.m3dLegacyHidden = true;
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
  const assembly = gear({
    radius: spec.radius,
    teeth: spec.teeth,
    thickness: spec.thickness,
    material,
    hubMaterial: pinionMaterial,
    hubRadius: Math.max(.48, spec.radius * .13),
    spokeCount,
    spokeWidth: spec.teeth > 100 ? .24 : .32,
    rimTube: spec.teeth > 100 ? .12 : .17,
    toothDepth: spec.toothDepth,
    toothWidth: spec.toothWidth,
    toothTipScale: .56
  });

  if (spec.pinion) {
    const p = pinion({
      radius: spec.pinion.radius,
      teeth: spec.pinion.teeth,
      thickness: spec.pinion.thickness,
      material: pinionMaterial
    });
    p.position.z = spec.pinion.z;
    p.userData.referenceLeafCount = spec.pinion.teeth;
    p.userData.pitchModuleMm = spec.pinion.moduleMm;
    p.userData.meshPlaneMm = spec.pinion.meshPlane;
    assembly.add(p);
  }

  assembly.userData.referenceToothCount = spec.teeth;
  assembly.userData.nominalPitchRadiusMm = spec.radius;
  assembly.userData.mesh = spec.mesh;
  return assembly;
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
    conventionalWheel(REFERENCE_VISUALS.center, materials.brass, materials.brushedSteel, 5),
    pickables
  );
  replaceWheel(
    animated.thirdWheel,
    conventionalWheel(REFERENCE_VISUALS.third, materials.gilt, materials.brushedSteel, 5),
    pickables
  );
  replaceWheel(
    animated.fourthWheel,
    conventionalWheel(REFERENCE_VISUALS.seconds, materials.brass, materials.brushedSteel, 5),
    pickables
  );

  const escSpec = REFERENCE_VISUALS.escape;
  const escAssembly = escapeWheel({
    radius: escSpec.radius,
    teeth: escSpec.teeth,
    thickness: escSpec.thickness,
    material: materials.gilt,
    hubMaterial: materials.brushedSteel,
    hubRadius: .42,
    spokeCount: 5,
    toothDepth: escSpec.toothDepth,
    toothWidth: escSpec.toothWidth,
    hook: .20
  });
  const escapePinion = pinion({
    radius: escSpec.pinion.radius,
    teeth: escSpec.pinion.teeth,
    thickness: escSpec.pinion.thickness,
    material: materials.brushedSteel
  });
  escapePinion.position.z = escSpec.pinion.z;
  escapePinion.userData.referenceLeafCount = escSpec.pinion.teeth;
  escapePinion.userData.pitchModuleMm = escSpec.pinion.moduleMm;
  escapePinion.userData.meshPlaneMm = escSpec.pinion.meshPlane;
  escAssembly.add(escapePinion);
  escAssembly.userData.referenceToothCount = escSpec.teeth;
  replaceWheel(animated.escapeWheel, escAssembly, pickables);

  return {
    visuals: REFERENCE_VISUALS,
    meshes: trainGeometryDiagnostics()
  };
}
