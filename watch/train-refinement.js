import { escapeWheel, gear, pinion, setShadows } from './geometry.js';

// M3b visual-train pass.
//
// The 6497 training-tool reference used by kinematics.js reports:
//   centre 80 teeth
//   third 60 teeth / 10-leaf pinion
//   seconds/fourth 120 teeth / 8-leaf pinion
//   escape 15 teeth / 10-leaf pinion
//
// We now make the visible train declare those same counts. Radii and centre
// distances remain reference-derived presentation geometry rather than solved
// manufacturing coordinates, so this module must not be read as CAD.

const REFERENCE_VISUALS = {
  center:  { teeth: 80,  radius: 4.25, thickness: .46, toothDepth: .20, toothWidth: .115, pinion: null },
  third:   { teeth: 60,  radius: 3.55, thickness: .42, toothDepth: .21, toothWidth: .13,  pinion: { teeth: 10, radius: .70, thickness: .72, z: -.48 } },
  seconds: { teeth: 120, radius: 3.15, thickness: .40, toothDepth: .13, toothWidth: .072, pinion: { teeth: 8,  radius: .56, thickness: .68, z: -.46 } },
  escape:  { teeth: 15,  radius: 2.25, thickness: .34, toothDepth: .70, toothWidth: .17,  pinion: { teeth: 10, radius: .62, thickness: .66, z: -.43 } }
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
    if (sibling.position.distanceTo(target.position) > .08) continue;
    removePickablesFor(sibling, pickables);
    sibling.visible = false;
    sibling.userData.m3bLegacyHidden = true;
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
    hubRadius: Math.max(.48, spec.radius * .16),
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
    assembly.add(p);
  }

  assembly.userData.referenceToothCount = spec.teeth;
  return assembly;
}

export function refineTrainGeometry(animated, materials, pickables) {
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
  escAssembly.add(escapePinion);
  escAssembly.userData.referenceToothCount = escSpec.teeth;
  replaceWheel(animated.escapeWheel, escAssembly, pickables);

  return REFERENCE_VISUALS;
}
