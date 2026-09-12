import * as THREE from 'three';
import { LAYOUT } from './spec.js';
import {
  createEscapementSystem as createM5cEscapementSystem,
  sampleSwissLever
} from './escapement-m5c.js';

const TAU = Math.PI * 2;
const ESCAPE_TEETH = 15;
const TOOTH_PITCH = TAU / ESCAPE_TEETH;
const HALF_TOOTH = TOOTH_PITCH / 2;
const ESCAPE_PERIOD_SECONDS = 5;
const ESCAPE_TIP_RADIUS_MM = 2.25;
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;

// Reconstruction targets, not ETA production tolerances.
const CONTACT = {
  desiredEntryAngleDeg: 235,
  faceHalfLengthMm: 0.28,
  unlockClearanceMm: 0.030,
  lockCaptureMm: 0.040,
  contactToleranceMm: 0.035,
  penetrationGuardMm: 0.006,
  searchSteps: 40
};

const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth01 = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function rotate2([x, y], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
}

const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len2 = v => Math.hypot(v[0], v[1]);

function angleDelta(a, b) {
  return THREE.MathUtils.euclideanModulo(a - b + Math.PI, TAU) - Math.PI;
}

function designPoint(center, radius, angle) {
  return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
}

function pointSegmentDistance(point, a, b) {
  const ab = sub2(b, a);
  const ap = sub2(point, a);
  const denom = ab[0] * ab[0] + ab[1] * ab[1];
  const t = denom <= 1e-12 ? 0 : clamp01((ap[0] * ab[0] + ap[1] * ab[1]) / denom);
  const closest = [a[0] + ab[0] * t, a[1] + ab[1] * t];
  return { distance: len2(sub2(point, closest)), closest, t };
}

function chooseEntryContact(escapeBase) {
  const desired = THREE.MathUtils.degToRad(CONTACT.desiredEntryAngleDeg);
  let best = { angle: escapeBase, toothIndex: 0, error: Infinity };
  for (let i = 0; i < ESCAPE_TEETH; i++) {
    const angle = escapeBase + i * TOOTH_PITCH;
    const error = Math.abs(angleDelta(angle, desired));
    if (error < best.error) best = { angle, toothIndex: i, error };
  }
  return best;
}

function makeFace(contactAngle, calibrationPalletAngle) {
  const target = designPoint(LAYOUT.escapeWheel, ESCAPE_TIP_RADIUS_MM, contactAngle);
  const anchorLocal = rotate2(sub2(target, LAYOUT.pallet), -calibrationPalletAngle);
  const tangentWorld = contactAngle + Math.PI / 2;
  const tangentLocal = [
    Math.cos(tangentWorld - calibrationPalletAngle),
    Math.sin(tangentWorld - calibrationPalletAngle)
  ];
  return { target, anchorLocal, tangentLocal, calibrationPalletAngle, contactAngle };
}

function faceSegment(face, palletAngle) {
  const center = add2(LAYOUT.pallet, rotate2(face.anchorLocal, palletAngle));
  const tangent = rotate2(face.tangentLocal, palletAngle);
  const half = CONTACT.faceHalfLengthMm;
  return {
    center,
    a: [center[0] - tangent[0] * half, center[1] - tangent[1] * half],
    b: [center[0] + tangent[0] * half, center[1] + tangent[1] * half]
  };
}

function toothTip(toothZeroAngle, toothIndex, absoluteWheelAngle) {
  return designPoint(
    LAYOUT.escapeWheel,
    ESCAPE_TIP_RADIUS_MM,
    toothZeroAngle + toothIndex * TOOTH_PITCH + absoluteWheelAngle
  );
}

function contactDistance(face, palletAngle, toothZeroAngle, toothIndex, absoluteWheelAngle) {
  const segment = faceSegment(face, palletAngle);
  const tip = toothTip(toothZeroAngle, toothIndex, absoluteWheelAngle);
  return { ...pointSegmentDistance(tip, segment.a, segment.b), tip, segment };
}

function modTooth(value) {
  return ((value % ESCAPE_TEETH) + ESCAPE_TEETH) % ESCAPE_TEETH;
}

function transitionForBeat(beatIndex, entryBaseIndex) {
  const pair = Math.floor(beatIndex / 2);
  if (beatIndex % 2 === 0) {
    const tooth = modTooth(entryBaseIndex - pair);
    return { start: 'entry', target: 'exit', startTooth: tooth, targetTooth: tooth };
  }
  const startTooth = modTooth(entryBaseIndex - pair);
  return {
    start: 'exit',
    target: 'entry',
    startTooth,
    targetTooth: modTooth(startTooth - 1)
  };
}

function injectUI(root) {
  if (root.querySelector('#geometrySolverSection')) return;
  const controls = root.querySelector('.controls');
  const oscillator = root.querySelector('#balanceAmplitudeValue')?.closest('section');
  if (!controls || !oscillator) return;

  const section = root.createElement('section');
  section.id = 'geometrySolverSection';
  section.innerHTML = `
    <div class="section-title">Geometry contact solver · M5d</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Geometry event</span><output id="geometryEventValue" class="escapement-phase">CALIBRATING</output></div>
      <div class="mode-stat"><span>Constraint</span><output id="geometryConstraintValue">CALIBRATING</output></div>
      <div class="mode-stat"><span>Start face travel</span><output id="startFaceTravelValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Target face remaining</span><output id="targetFaceTravelValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Tooth / face gap</span><output id="geometryGapValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Contact tooth</span><output id="contactToothValue">—</output></div>
      <div class="mode-stat"><span>Release from geometry</span><output id="geometryReleaseValue">0.0%</output></div>
      <div class="mode-stat"><span>Solver health</span><output id="geometryHealthValue">CALIBRATING</output></div>
    </div>
    <div class="inline-toggles"><label><input id="geometrySolverGuides" type="checkbox" /> Show M5d solver faces / contact point</label></div>
    <div class="winding-note">M5d derives the half-tooth release from reconstructed spatial contact. It measures pallet-face travel and the tracked escape-tooth gap in millimetres, then clamps release before the tooth can pass through the target face. Assemble the watch for the clearest visual contact; exploded offsets are presentation-only and do not alter the mechanical design-coordinate solve.</div>`;
  controls.insertBefore(section, oscillator);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5D';
  if (subtitle) subtitle.textContent = 'geometry-constrained pallet contact and tooth release';
  if (loading) loading.textContent = 'Constructing 6497-2 M5d contact solver…';
  if (hint) hint.textContent = 'M5d moves the escapement boundary from fixed beat fractions toward reconstructed contact geometry. Spatial pallet-face travel and tooth-to-segment clearance now determine lock, clearance, impulse travel and target capture; exact coordinates and clearances remain reconstruction targets.';
  if (infoText) infoText.textContent = 'M5d adds a geometry contact solver on top of the reserve-coupled oscillator. Reconstructed pallet faces are calibrated to the visible 15-tooth escape-wheel phase and the downstream train follows the resulting geometry-constrained escape angle.';
}

function makeGuides(watch, faces) {
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5d geometry contact solver guides';
  group.visible = false;

  const entry = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x72c9ff, depthTest: false }));
  const exit = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffc86d, depthTest: false }));
  const tooth = new THREE.Mesh(new THREE.SphereGeometry(.11, 18, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  const contact = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffef9a, depthTest: false }));
  group.add(entry, exit, tooth, contact);
  layer.add(group);

  function setSegment(line, segment) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(segment.a[0], segment.a[1], -.02),
      new THREE.Vector3(segment.b[0], segment.b[1], -.02)
    ]);
  }

  return {
    group,
    update(palletAngle, result) {
      setSegment(entry, faceSegment(faces.entry, palletAngle));
      setSegment(exit, faceSegment(faces.exit, palletAngle));
      tooth.position.set(result.tip[0], result.tip[1], -.01);
      contact.position.set(result.closest[0], result.closest[1], -.01);
    }
  };
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  injectUI(root);
  const base = createM5cEscapementSystem({ watch, animated, materials, powerSystem, root });
  const amplitudeAdvance = powerSystem.advance.bind(powerSystem);

  const state = {
    calibrated: false,
    toothZeroAngle: 0,
    entryBaseIndex: 0,
    faces: null,
    guides: null,
    geometryEvent: 'calibrating',
    geometryRelease: 0,
    geometryHealthy: true,
    consecutiveInvalid: 0,
    contactGapMm: 0,
    contactTooth: 0,
    lastBeatIndex: -1,
    locksObserved: 0
  };

  const ui = {
    event: root.querySelector('#geometryEventValue'),
    constraint: root.querySelector('#geometryConstraintValue'),
    startTravel: root.querySelector('#startFaceTravelValue'),
    targetTravel: root.querySelector('#targetFaceTravelValue'),
    gap: root.querySelector('#geometryGapValue'),
    tooth: root.querySelector('#contactToothValue'),
    release: root.querySelector('#geometryReleaseValue'),
    health: root.querySelector('#geometryHealthValue'),
    guides: root.querySelector('#geometrySolverGuides'),
    oldPhase: root.querySelector('#escapementPhaseValue'),
    oldPallet: root.querySelector('#activePalletValue'),
    oldRelease: root.querySelector('#escapeReleaseValue')
  };

  function calibrate(escapeBase) {
    const chosen = chooseEntryContact(escapeBase);
    state.toothZeroAngle = chosen.angle - chosen.toothIndex * TOOTH_PITCH;
    state.entryBaseIndex = chosen.toothIndex;
    state.faces = {
      entry: makeFace(chosen.angle, PALLET_CENTER - PALLET_BANK),
      exit: makeFace(chosen.angle + HALF_TOOTH, PALLET_CENTER + PALLET_BANK)
    };
    state.guides = makeGuides(watch, state.faces);
    ui.guides?.addEventListener('change', () => {
      if (state.guides) state.guides.group.visible = ui.guides.checked;
    });
    state.calibrated = true;
  }

  const faceTravel = (face, palletAngle) => len2(sub2(faceSegment(face, palletAngle).center, face.target));

  function solve(sample, escapeBase) {
    if (!state.calibrated) calibrate(escapeBase);

    const transition = transitionForBeat(sample.beatIndex, state.entryBaseIndex);
    const startFace = state.faces[transition.start];
    const targetFace = state.faces[transition.target];
    const palletAngle = sample.palletAngle;
    const completedAngle = sample.beatIndex * HALF_TOOTH;

    const oppositeBank = transition.target === 'exit' ? PALLET_CENTER + PALLET_BANK : PALLET_CENTER - PALLET_BANK;
    const startBank = transition.start === 'entry' ? PALLET_CENTER - PALLET_BANK : PALLET_CENTER + PALLET_BANK;
    const startTotal = Math.max(1e-6, faceTravel(startFace, oppositeBank));
    const targetTotal = Math.max(1e-6, faceTravel(targetFace, startBank));
    const startTravel = faceTravel(startFace, palletAngle);
    const targetRemaining = faceTravel(targetFace, palletAngle);

    const unlockFraction = clamp01(CONTACT.unlockClearanceMm / startTotal);
    const captureFraction = clamp01(CONTACT.lockCaptureMm / targetTotal);
    const palletFraction = clamp01(startTravel / startTotal);
    let release = smooth01(clamp01((palletFraction - unlockFraction) / Math.max(1e-6, 1 - unlockFraction - captureFraction)));
    if (startTravel <= CONTACT.unlockClearanceMm) release = 0;
    if (targetRemaining <= CONTACT.lockCaptureMm) release = 1;

    let withinBeatAngle = release * HALF_TOOTH;
    let targetContact = contactDistance(
      targetFace,
      palletAngle,
      state.toothZeroAngle,
      transition.targetTooth,
      completedAngle + withinBeatAngle
    );

    // Geometry guard: if the target tooth is already inside the tiny guard
    // distance, back the release angle out until the segment clearance is safe.
    if (release > 0 && release < 1 && targetContact.distance < CONTACT.penetrationGuardMm) {
      let lo = 0;
      let hi = withinBeatAngle;
      for (let i = 0; i < CONTACT.searchSteps; i++) {
        const mid = (lo + hi) / 2;
        const gap = contactDistance(
          targetFace,
          palletAngle,
          state.toothZeroAngle,
          transition.targetTooth,
          completedAngle + mid
        ).distance;
        if (gap < CONTACT.penetrationGuardMm) hi = mid;
        else lo = mid;
      }
      withinBeatAngle = lo;
      release = clamp01(withinBeatAngle / HALF_TOOTH);
      targetContact = contactDistance(
        targetFace,
        palletAngle,
        state.toothZeroAngle,
        transition.targetTooth,
        completedAngle + withinBeatAngle
      );
    }

    const startContact = contactDistance(
      startFace,
      palletAngle,
      state.toothZeroAngle,
      transition.startTooth,
      completedAngle
    );
    const relevant = release < .5 ? startContact : targetContact;

    let event;
    let constraint;
    if (startTravel <= CONTACT.unlockClearanceMm) {
      event = `LOCK · ${transition.start.toUpperCase()}`;
      constraint = `${transition.start.toUpperCase()} FACE`;
    } else if (release < .2) {
      event = 'UNLOCK · CLEARANCE';
      constraint = 'START FACE CLEARANCE';
    } else if (targetRemaining > CONTACT.lockCaptureMm && release < .92) {
      event = 'IMPULSE · GEOMETRY';
      constraint = 'TOOTH / FACE PATH';
    } else if (targetRemaining <= CONTACT.lockCaptureMm) {
      event = `LOCK · ${transition.target.toUpperCase()}`;
      constraint = `${transition.target.toUpperCase()} FACE`;
    } else {
      event = 'DROP · APPROACH';
      constraint = 'TARGET FACE APPROACH';
    }

    const expectedLock = startTravel <= CONTACT.unlockClearanceMm || targetRemaining <= CONTACT.lockCaptureMm;
    const lockGap = startTravel <= CONTACT.unlockClearanceMm ? startContact.distance : targetContact.distance;
    const healthy = Number.isFinite(relevant.distance) && (!expectedLock || lockGap <= CONTACT.contactToleranceMm * 7);

    return {
      transition,
      palletAngle,
      startTravel,
      targetRemaining,
      release,
      withinBeatAngle,
      completedAngle,
      event,
      constraint,
      startContact,
      targetContact,
      relevant,
      healthy
    };
  }

  function syncUI(result) {
    if (ui.event) ui.event.value = result.event;
    if (ui.constraint) ui.constraint.value = result.constraint;
    if (ui.startTravel) ui.startTravel.value = `${result.startTravel.toFixed(3)} mm`;
    if (ui.targetTravel) ui.targetTravel.value = `${result.targetRemaining.toFixed(3)} mm`;
    if (ui.gap) ui.gap.value = `${result.relevant.distance.toFixed(3)} mm`;
    if (ui.tooth) ui.tooth.value = `${state.contactTooth + 1} / ${ESCAPE_TEETH}`;
    if (ui.release) ui.release.value = `${(result.release * 100).toFixed(1)}%`;
    if (ui.health) ui.health.value = result.healthy ? 'CONTACT SOLVER OK' : 'CONTACT CHECK';
    if (ui.oldPhase) ui.oldPhase.value = result.event;
    if (ui.oldPallet) ui.oldPallet.value = `${result.transition.target.toUpperCase()} NEXT`;
    if (ui.oldRelease) ui.oldRelease.value = `${(result.release * .5).toFixed(3)} tooth`;
  }

  // Preserve M5c's amplitude gate and add a conservative geometry guard only
  // after several consecutive invalid contact frames, avoiding transient stalls.
  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    if (state.calibrated && state.consecutiveInvalid >= 3 && (powerSystem.windingSystem?.state.energy ?? 0) > 0) {
      return powerSystem.hold(mechanicalScale, 'GEOMETRY CONTACT');
    }
    return amplitudeAdvance(realSeconds, mechanicalScale);
  };

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const baseSample = base.update(mechanicalSeconds, escapeBase, running);
    const result = solve(baseSample, escapeBase);

    state.geometryEvent = result.event;
    state.geometryRelease = result.release;
    state.geometryHealthy = result.healthy;
    state.consecutiveInvalid = result.healthy ? 0 : state.consecutiveInvalid + 1;
    state.contactGapMm = result.relevant.distance;
    state.contactTooth = result.release < .5 ? result.transition.startTooth : result.transition.targetTooth;

    if (baseSample.beatIndex !== state.lastBeatIndex) {
      if (state.lastBeatIndex >= 0) state.locksObserved += 1;
      state.lastBeatIndex = baseSample.beatIndex;
    }

    const absoluteHalfSteps = baseSample.beatIndex + result.release;
    const geometryEscapeAngle = absoluteHalfSteps * HALF_TOOTH;
    const releasedSeconds = geometryEscapeAngle / TAU * ESCAPE_PERIOD_SECONDS;
    if (animated.escapeWheel) animated.escapeWheel.rotation.z = escapeBase + geometryEscapeAngle;

    state.guides?.update(result.palletAngle, result.release < .5 ? result.startContact : result.targetContact);
    syncUI(result);

    return {
      ...baseSample,
      phase: result.event,
      geometryEvent: result.event,
      geometryRelease: result.release,
      geometryConstraint: result.constraint,
      geometryHealthy: result.healthy,
      contactGapMm: result.relevant.distance,
      startFaceTravelMm: result.startTravel,
      targetFaceRemainingMm: result.targetRemaining,
      escapeAngle: geometryEscapeAngle,
      escapeHalfSteps: absoluteHalfSteps,
      releasedSeconds
    };
  }

  return {
    ...base,
    oscillatorState: base.state,
    state,
    update,
    contactTargets: { ...CONTACT },
    getSolverFaces: () => state.faces
  };
}

export { sampleSwissLever };
