import * as THREE from 'three';
import {
  refineTrainGeometry as refineM3f,
  M3F_PLANES,
  BEARING_PLANES
} from './train-m3f.js';
import { TRAIN_MESHES, TRAIN_PHASES } from './train-refinement.js';

// M3g makes axial clearance explicit rather than merely placing wheel bodies on
// different planes. The values below are reconstruction targets chosen to make
// the relationships mechanically legible; they are not asserted ETA production
// tolerances. The demo keeps that provenance visible in diagnostics and docs.

const TAU = Math.PI * 2;

export const M3G_ENDSHAKE = {
  center: 0.040,
  third: 0.040,
  seconds: 0.040,
  escape: 0.035
};

const WHEEL_BODY = {
  center: { plane: M3F_PLANES.center, thickness: .30 },
  third: { plane: M3F_PLANES.third, thickness: .28 },
  seconds: { plane: M3F_PLANES.seconds, thickness: .26 },
  escape: { plane: M3F_PLANES.escape, thickness: .24 }
};

const CENTERS = {
  center: TRAIN_MESHES.centerToThird.driverCenter,
  third: TRAIN_MESHES.centerToThird.drivenCenter,
  seconds: TRAIN_MESHES.thirdToSeconds.drivenCenter,
  escape: TRAIN_MESHES.secondsToEscape.drivenCenter
};

const WHEEL_OBJECT_KEY = {
  center: 'centerWheel',
  third: 'thirdWheel',
  seconds: 'fourthWheel',
  escape: 'escapeWheel'
};

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function centeredCylinder(radius, thickness, material, segments = 32) {
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return shadowed(mesh);
}

function coneAlongZ(baseRadius, tipRadius, length, material, segments = 28) {
  const geometry = new THREE.CylinderGeometry(tipRadius, baseRadius, length, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return shadowed(mesh);
}

function addPivotFinishing(staffs, base, materials) {
  for (const staff of staffs.children) {
    const name = staff.userData.staffName;
    if (!name || !WHEEL_BODY[name]) continue;

    const wheel = WHEEL_BODY[name];
    const bridgeJewel = base.clearances[name].bridgeJewelPlaneMm;

    // These conical pivot noses and shoulder collars make the bearing relation
    // visually explicit. Diameters remain presentation/reconstruction geometry.
    const lowerPivot = coneAlongZ(.056, .022, .16, materials.caseSteel, 24);
    lowerPivot.position.z = -0.52;
    staff.add(lowerPivot);

    const upperPivot = coneAlongZ(.050, .020, .15, materials.caseSteel, 24);
    upperPivot.position.z = bridgeJewel + .085;
    staff.add(upperPivot);

    const lowerShoulder = centeredCylinder(.185, .045, materials.brushedSteel, 32);
    lowerShoulder.position.z = wheel.plane + wheel.thickness / 2 + .035;
    staff.add(lowerShoulder);

    const upperShoulder = centeredCylinder(.165, .040, materials.brushedSteel, 32);
    upperShoulder.position.z = wheel.plane - wheel.thickness / 2 - .032;
    staff.add(upperShoulder);
  }
}

function bodyInterval(name) {
  const spec = WHEEL_BODY[name];
  return {
    min: spec.plane - spec.thickness / 2,
    max: spec.plane + spec.thickness / 2
  };
}

function intervalGap(a, b) {
  if (a.max < b.min) return b.min - a.max;
  if (b.max < a.min) return a.min - b.max;
  return -Math.min(a.max, b.max) + Math.max(a.min, b.min);
}

function pairwiseBodyDiagnostics() {
  const pairs = [
    ['center', 'third'],
    ['third', 'seconds'],
    ['seconds', 'escape'],
    ['center', 'escape']
  ];
  const result = {};
  for (const [a, b] of pairs) {
    const gap = intervalGap(bodyInterval(a), bodyInterval(b));
    result[`${a}To${b[0].toUpperCase()}${b.slice(1)}`] = {
      axialBodyGapMm: Number(gap.toFixed(3)),
      status: gap >= 0 ? 'clear' : 'axial overlap'
    };
  }
  return result;
}

function createEndshakeGuides(trainRoot, base) {
  const group = new THREE.Group();
  group.name = 'M3g endshake guides';
  group.visible = false;
  group.renderOrder = 34;

  const rangeMaterial = new THREE.LineBasicMaterial({
    color: 0xa7efff,
    transparent: true,
    opacity: .84,
    depthTest: false
  });
  const seatMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd278,
    transparent: true,
    opacity: .82,
    depthTest: false
  });
  const bandMaterial = new THREE.MeshBasicMaterial({
    color: 0x70d7ff,
    transparent: true,
    opacity: .12,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  for (const [name, [x, y]] of Object.entries(CENTERS)) {
    const wheel = WHEEL_BODY[name];
    const shake = M3G_ENDSHAKE[name];
    const half = shake / 2;

    const points = [
      new THREE.Vector3(x, y, wheel.plane - half),
      new THREE.Vector3(x, y, wheel.plane + half)
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), rangeMaterial));

    for (const z of [wheel.plane - half, wheel.plane + half]) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(.105, 16, 10), seatMaterial);
      marker.position.set(x, y, z);
      group.add(marker);
    }

    const band = new THREE.Mesh(new THREE.RingGeometry(.24, .38, 40), bandMaterial);
    band.position.set(x, y, wheel.plane);
    group.add(band);

    // Link the tiny working range to the reconstructed jewel centres, making it
    // obvious that endshake is axial play within a bearing stack, not gear lash.
    const bridgeJewel = base.clearances[name].bridgeJewelPlaneMm;
    const bearingLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y, BEARING_PLANES.mainplateJewel),
      new THREE.Vector3(x, y, bridgeJewel)
    ]);
    const line = new THREE.Line(bearingLine, rangeMaterial);
    line.material = rangeMaterial;
    group.add(line);
  }

  trainRoot.add(group);
  return group;
}

function createBodyGapGuides(trainRoot) {
  const group = new THREE.Group();
  group.name = 'M3g body-gap guides';
  group.visible = false;
  group.renderOrder = 33;

  const material = new THREE.MeshBasicMaterial({
    color: 0x79d6a7,
    transparent: true,
    opacity: .16,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Thin translucent planes between adjacent large wheel bodies. These do not
  // claim ETA tolerances; they expose the axial separation that lets projected
  // wheel envelopes overlap without the solids colliding.
  for (const [a, b] of [['center', 'third'], ['third', 'seconds']]) {
    const ia = bodyInterval(a);
    const ib = bodyInterval(b);
    const zA = ia.min < ib.min ? ia.min : ib.min;
    const zB = ia.max > ib.max ? ia.max : ib.max;
    const lowerMax = Math.min(ia.max, ib.max);
    const upperMin = Math.max(ia.min, ib.min);
    const z = (lowerMax + upperMin) / 2;
    const [ax, ay] = CENTERS[a];
    const [bx, by] = CENTERS[b];
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const span = Math.max(.5, Math.hypot(bx - ax, by - ay) * .72);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(span, 1.1), material);
    plate.position.set(mx, my, z);
    const angle = Math.atan2(by - ay, bx - ax);
    plate.rotation.z = angle;
    group.add(plate);
    plate.userData.debugSpan = [zA, zB];
  }

  trainRoot.add(group);
  return group;
}

function endshakeDiagnostics(base) {
  const out = {};
  for (const name of Object.keys(WHEEL_BODY)) {
    const body = bodyInterval(name);
    const shake = M3G_ENDSHAKE[name];
    out[name] = {
      nominalPlaneMm: WHEEL_BODY[name].plane,
      bodyMinZMm: Number(body.min.toFixed(3)),
      bodyMaxZMm: Number(body.max.toFixed(3)),
      endshakeTargetMm: shake,
      mainplateBodyClearanceMm: base.clearances[name].mainplateClearanceMm,
      bridgeBodyClearanceMm: base.clearances[name].bridgeClearanceMm,
      provenance: 'reconstruction target, not ETA tolerance'
    };
  }
  return out;
}

function applyEndshakeFactory(animated) {
  const basePlanes = Object.fromEntries(
    Object.entries(WHEEL_OBJECT_KEY).map(([name, key]) => [name, animated[key].position.z])
  );

  return (elapsed, exaggeration = 0) => {
    const scale = Number(exaggeration) || 0;
    for (const [index, [name, key]] of Object.entries(WHEEL_OBJECT_KEY).entries()) {
      const wheel = animated[key];
      const amplitude = M3G_ENDSHAKE[name] * .5 * scale;
      // Different phases prevent the debug display from looking like one rigid
      // plate moving together. Zero scale restores the exact nominal plane.
      const phase = Number(index) * 1.37;
      wheel.position.z = basePlanes[name] + Math.sin(elapsed * 2.1 + phase) * amplitude;
    }
  };
}

export function refineTrainGeometry(animated, materials, pickables) {
  const base = refineM3f(animated, materials, pickables);
  const trainRoot = animated.centerWheel.parent;

  addPivotFinishing(base.staffs, base, materials);

  const endshakeGuides = createEndshakeGuides(trainRoot, base);
  const bodyGapGuides = createBodyGapGuides(trainRoot);
  const endshake = endshakeDiagnostics(base);
  const bodyGaps = pairwiseBodyDiagnostics();
  const applyEndshake = applyEndshakeFactory(animated);

  return {
    ...base,
    phases: TRAIN_PHASES,
    endshakeGuides,
    bodyGapGuides,
    endshake,
    bodyGaps,
    applyEndshake,
    milestone: 'M3g'
  };
}
