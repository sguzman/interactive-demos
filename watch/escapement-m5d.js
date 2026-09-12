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
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;
const ESCAPE_TIP_RADIUS_MM = 2.25;

// These remain reconstruction targets. M5d's advance over M5b/M5c is that the
// event boundaries are now expressed as spatial clearances and contact tests,
// not fractions of a beat. They are not ETA production tolerances.
const CONTACT = {
  desiredEntryAngleDeg: 235,
  faceHalfLengthMm: 0.28,
  unlockClearanceMm: 0.030,
  lockCaptureMm: 0.040,
  contactToleranceMm: 0.035,
  penetrationGuardMm: 0.006,
  searchSteps: 48
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function rotate2([x, y], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
}

function add2(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function sub2(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

function length2(v) {
  return Math.hypot(v[0], v[1]);
}

function angleDelta(a, b) {
  return THREE.MathUtils.euclideanModulo(a - b + Math.PI, TAU) - Math.PI;
}

function pointSegmentDistance(point, a, b) {
  const ab = sub2(b, a);
  const ap = sub2(point, a);
  const denom = ab[0] * ab[0] + ab[1] * ab[1];
  const t = denom <= 1e-12 ? 0 : clamp01((ap[0] * ab[0] + ap[1] * ab[1]) / denom);
  const closest = [a[0] + ab[0] * t, a[1] + ab[1] * t];
  return { distance: length2(sub2(point, closest)), closest, t };
}

function designPoint(center, radius, angle) {
  return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
}

function palletLocalFromWorld(worldPoint, palletAngle) {
  return rotate2(sub2(worldPoint, LAYOUT.pallet), -palletAngle);
}

function palletWorldFromLocal(localPoint, palletAngle) {
  return add2(LAYOUT.pallet, rotate2(localPoint, palletAngle));
}

function chooseEntryContactAngle(escapeBase) {
  const desired = THREE.MathUtils.degToRad(CONTACT.desiredEntryAngleDeg);
  let best = escapeBase;
  let bestIndex = 0;
  let bestError = Infinity;
  for (let i = 0; i < ESCAPE_TEETH; i++) {
    const angle = escapeBase + i * TOOTH_PITCH;
    const error = Math.abs(angleDelta(angle, desired));
    if (error < bestError) {
      best = angle;
      bestIndex = i;
      bestError = error;
    }
  }
  return { angle: best, toothIndex: bestIndex, error: bestError };
}

function makeFaceDefinition(name, contactAngle, calibrationPalletAngle) {
  const target = designPoint(LAYOUT.escapeWheel, ESCAPE_TIP_RADIUS_MM, contactAngle);
  const anchorLocal = palletLocalFromWorld(target, calibrationPalletAngle);
  const tangentWorldAngle = contactAngle + Math.PI / 2;
  const tangentLocal = [
    Math.cos(tangentWorldAngle - calibrationPalletAngle),
    Math.sin(tangentWorldAngle - calibrationPalletAngle)
  ];
  return {
    name,
    target,
    contactAngle,
    calibrationPalletAngle,
    anchorLocal,
    tangentLocal
  };
}

function faceSegment(face, palletAngle) {
  const center = palletWorldFromLocal(face.anchorLocal, palletAngle);
  const tangent = rotate2(face.tangentLocal, palletAngle);
  const half = CONTACT.faceHalfLengthMm;
  return {
    center,
    a: [center[0] - tangent[0] * half, center[1] - tangent[1] * half],
    b: [center[0] + tangent[0] * half, center[1] + tangent[1] * half]
  };
}

function toothTip(toothZeroAngle, toothIndex, dynamicAngle) {
  return designPoint(
    LAYOUT.escapeWheel,
    ESCAPE_TIP_RADIUS_MM,
    toothZeroAngle + toothIndex * TOOTH_PITCH + dynamicAngle
  );
}

function contactDistance(face, palletAngle, toothZeroAngle, toothIndex, dynamicAngle) {
  const segment = faceSegment(face, palletAngle);
  const tip = toothTip(toothZeroAngle, toothIndex, dynamicAngle);
  const result = pointSegmentDistance(tip, segment.a, segment.b);
  return { ...result, tip, segment };
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

function makeGuideMaterial(color, opacity = .8) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
}

function buildSolverGuides(watch, faces) {
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5d geometry contact solver guides';
  group.visible = false;
  group.renderOrder = 50;

  const entryLine = new THREE.Line(new THREE.BufferGeometry(), makeGuideMaterial(0x72c9ff));
  const exitLine = new THREE.Line(new THREE.BufferGeometry(), makeGuideMaterial(0xffc86d));
  const travelLine = new THREE.Line(new THREE.BufferGeometry(), makeGuideMaterial(0x9fe3ae, .68));
  const toothMarker = new THREE.Mesh(
    new THREE.SphereGeometry(.11, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .92, depthTest: false })
  );
  const contactMarker = new THREE.Mesh(
    new THREE.SphereGeometry(.085, 18, 10),
    new THREE.MeshBasicMaterial({ color: 0xffef9a, transparent: true, opacity: .95, depthTest: false })
  );

  group.add(entryLine, exitLine, travelLine, toothMarker, contactMarker);
  layer.add(group);

  function setLine(line, a, b, z = -.02) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a[0], a[1], z),
      new THREE.Vector3(b[0], b[1], z)
    ]);
  }

  function update(palletAngle, transition, result) {
    const entry = faceSegment(faces.entry, palletAngle);
    const exit = faceSegment(faces.exit, palletAngle);
    setLine(entryLine, entry.a, entry.b);
    setLine(exitLine, exit.a, exit.b);
    setLine(travelLine, faces[transition.start].target, faces[transition.target].target, -.035);

    toothMarker.position.set(result.tip[0], result.tip[1], -.01);
    contactMarker.position.set(result.closest[0], result.closest[1], -.01);
  }

  return { group, update };
}

function injectM5dUI(root) {
  const existing = root.querySelector('#geometrySolverSection');
  if (existing) return existing;

  const controls = root.querySelector('.controls');
  const oscillatorSection = root.querySelector('#balanceAmplitudeValue')?.closest('section');
  if (!controls || !oscillatorSection) return null;

  const section = root.createElement('section');
  section.id = 'geometrySolverSection';
  section.innerHTML = `
    <div class="section-title">Geometry contact solver · M5d</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Geometry event</span><output id="geometryEventValue" class="escapement-phase">LOCK · ENTRY</output></div>
      <div class="mode-stat"><span>Constraint</span><output id="geometryConstraintValue">ENTRY FACE</output></div>
      <div class="mode-stat"><span>Start face travel</span><output id="startFaceTravelValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Target face remaining</span><output id="targetFaceTravelValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Tooth / face gap</span><output id="geometryGapValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Contact tooth</span><output id="contactToothValue">0</output></div>
      <div class="mode-stat"><span>Release from geometry</span><output id="geometryReleaseValue">0.0%</output></div>
      <div class="mode-stat"><span>Solver health</span><output id="geometryHealthValue">CALIBRATING</output></div>
    </div>
    <div class="inline-toggles">
      <label><input id="geometrySolverGuides" type="checkbox" /> Show M5d solver faces / contact point</label>
    </div>
    <div class="winding-note">M5d no longer uses the old lock/unlock/impulse fractions to decide escape-wheel release. It calibrates two reconstructed pallet contact faces to the actual 15-tooth escape-wheel phase, measures spatial face travel and tooth-to-segment clearance in millimetres, then derives the half-tooth release from those geometric constraints. Assemble the watch for the clearest visual contact; exploded offsets are presentation-only and are intentionally ignored by the solver.</div>
  `;
  controls.insertBefore(section, oscillatorSection);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5D';
  if (subtitle) subtitle.textContent = 'geometry-constrained pallet contact and tooth release';
  if (loading) loading.textContent = 'Constructing 6497-2 M5d contact solver…';

  const hint = root.querySelector('.controls > .hint');
  if (hint) hint.textContent = 'M5d moves the escapement boundary from beat-fraction choreography toward reconstructed contact geometry. Spatial pallet-face travel and tooth-to-segment clearance now determine when the escape wheel remains locked, clears a pallet, traverses impulse, and is captured by the opposite pallet. Exact face coordinates and tolerances remain reconstruction targets pending measured production geometry.';

  const infoText = root.querySelector('#infoText');
  if (infoText) infoText.textContent = 'M5d adds a geometry contact solver on top of the reserve-coupled M5c oscillator. Reconstructed pallet faces are calibrated against the visible 15-tooth escape-wheel phase; spatial clearances now determine release progress and the downstream train follows that geometry-constrained escape angle.';

  return section;
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  injectM5dUI(root);
  const base = createM5cEscapementSystem({ watch, animated, materials, powerSystem, root });
  const amplitudeAdvance = powerSystem.advance.bind(powerSystem);

  const state = {
    calibrated: false,
    toothZeroAngle: 0,
    entryContactAngle: 0,
    entryBaseIndex: 0,
    faces: null,
    guides: null,
    geometryEvent: 'calibrating',
    geometryRelease: 0,
    geometryEscapeAngle: 0,
    startTravelMm: 0,
    targetRemainingMm: 0,
    contactGapMm: 0,
    contactTooth: 0,
    constraint: 'CALIBRATING',
    geometryHealthy: true,
    geometryLocks: 0,
    contactViolations: 0,
    lastBeatIndex: -1
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
    const chosen = chooseEntryContactAngle(escapeBase);
    state.toothZeroAngle = chosen.angle - chosen.toothIndex * TOOTH_PITCH;
    state.entryContactAngle = chosen.angle;
    state.entryBaseIndex = chosen.toothIndex;
    state.faces = {
      entry: makeFaceDefinition('entry', chosen.angle, PALLET_CENTER - PALLET_BANK),
      exit: makeFaceDefinition('exit', chosen.angle + HALF_TOOTH, PALLET_CENTER + PALLET_BANK)
    };
    state.guides = buildSolverGuides(watch, state.faces);
    if (ui.guides) {
      ui.guides.addEventListener('change', () => {
        if (state.guides) state.guides.group.visible = ui.guides.checked;
      });
    }
    state.calibrated = true;
  }

  function faceTravel(face, palletAngle) {
    const current = faceSegment(face, palletAngle).center;
    return length2(sub2(current, face.target));
  }

  function totalFaceTravel(face, oppositeBankAngle) {
    return faceTravel(face, oppositeBankAngle);
  }

  function solveGeometry(sample, escapeBase) {
    if (!state.calibrated) calibrate(escapeBase);

    const transition = transitionForBeat(sample.beatIndex, state.entryBaseIndex);
    const startFace = state.faces[transition.start];
    const targetFace = state.faces[transition.target];
    const palletAngle = sample.palletAngle;
    const oppositeBank = transition.target === 'exit'
      ? PALLET_CENTER + PALLET_BANK
      : PALLET_CENTER - PALLET_BANK;
    const startTotal = Math.max(1e-6, totalFaceTravel(startFace, oppositeBank));
    const targetStartBank = transition.start === 'entry'
      ? PALLET_CENTER - PALLET_BANK
      : PALLET_CENTER + PALLET_BANK;
    const targetTotal = Math.max(1e-6, faceTravel(targetFace, targetStartBank));

    const startTravel = faceTravel(startFace, palletAngle);
    const targetRemaining = faceTravel(targetFace, palletAngle);
    const startFraction = clamp01(startTravel / startTotal);
    const targetApproach = clamp01(1 - targetRemaining / targetTotal);

    const unlockFraction = clamp01(CONTACT.unlockClearanceMm / startTotal);
    const captureFraction = clamp01(CONTACT.lockCaptureMm / targetTotal);
    const rawRelease = clamp01(
      (startFraction - unlockFraction) /
      Math.max(1e-6, 1 - unlockFraction - captureFraction)
    );
    let release = smooth01(rawRelease);

    if (startTravel <= CONTACT.unlockClearanceMm) release = 0;
    if (targetRemaining <= CONTACT.lockCaptureMm) release = 1;

    let dynamicAngle = release * HALF_TOOTH;
    const targetCheck = contactDistance(
      targetFace,
      palletAngle,
      state.toothZeroAngle,
      transition.targetTooth,
      dynamicAngle
    );

    // A small one-dimensional contact sweep prevents the candidate tooth from
    // visually crossing through the target face. This is the first actual
    // geometric constraint in the escapement rather than a phase-only clamp.
    if (release > 0 && release < 1 && targetCheck.distance < CONTACT.penetrationGuardMm) {
      let lo = 0;
      let hi = dynamicAngle;
      for (let i = 0; i < CONTACT.searchSteps; i++) {
        const mid = (lo + hi) / 2;
        const gap = contactDistance(
          targetFace,
          palletAngle,
          state.toothZeroAngle,
          transition.targetTooth,
          mid
        ).distance;
        if (gap < CONTACT.penetrationGuardMm) hi = mid;
        else lo = mid;
      }
      dynamicAngle = lo;
      release = clamp01(dynamicAngle / HALF_TOOTH);
    }

    const startContact = contactDistance(
      startFace,
      palletAngle,
      state.toothZeroAngle,
      transition.startTooth,
      0
    );
    const targetContact = contactDistance(
      targetFace,
      palletAngle,
      state.toothZeroAngle,
      transition.targetTooth,
      dynamicAngle
    );

    let event;
    let constraint;
    if (startTravel <= CONTACT.unlockClearanceMm) {
      event = `LOCK · ${transition.start.toUpperCase()}`;
      constraint = `${transition.start.toUpperCase()} FACE`;
    } else if (release < .20) {
      event = 'UNLOCK · CLEARANCE';
      constraint = 'START FACE CLEARANCE';
    } else if (targetRemaining > CONTACT.lockCaptureMm && release < .92) {
      event = 'IMPULSE · GEOMETRY';
      constraint = 'TOOTH / IMPULSE PATH';
    } else if (targetRemaining <= CONTACT.lockCaptureMm) {
      event = `LOCK · ${transition.target.toUpperCase()}`;
      constraint = `${transition.target.toUpperCase()} FACE`;
    } else {
      event = 'DROP · APPROACH';
      constraint = 'TARGET FACE APPROACH';
    }

    const relevantContact = release < .5 ? startContact : targetContact;
    const healthy = Number.isFinite(relevantContact.distance) && relevantContact.distance < 1.0;

    return {
      transition,
      palletAngle,
      startTravel,
      targetRemaining,
      startFraction,
      targetApproach,
      release,
      dynamicAngle,
      event,
      constraint,
      startContact,
      targetContact,
      relevantContact,
      healthy
    };
  }

  function syncGeometryUI(result) {
    if (ui.event) ui.event.value = result.event;
    if (ui.constraint) ui.constraint.value = result.constraint;
    if (ui.startTravel) ui.startTravel.value = `${result.startTravel.toFixed(3)} mm`;
    if (ui.targetTravel) ui.targetTravel.value = `${result.targetRemaining.toFixed(3)} mm`;
    if (ui.gap) ui.gap.value = `${result.relevantContact.distance.toFixed(3)} mm`;
    if (ui.tooth) ui.tooth.value = `${state.contactTooth + 1} / ${ESCAPE_TEETH}`;
    if (ui.release) ui.release.value = `${(result.release * 100).toFixed(1)}%`;
    if (ui.health) ui.health.value = result.healthy ? 'CONTACT SOLVER OK' : 'GEOMETRY MISMATCH';

    // M5d supersedes the old time-window phase labels in the shared panel.
    if (ui.oldPhase) ui.oldPhase.value = result.event;
    if (ui.oldPallet) ui.oldPallet.value = `${result.transition.target.toUpperCase()} NEXT`;
    if (ui.oldRelease) ui.oldRelease.value = `${(result.release * .5).toFixed(3)} tooth`;
  }

  // Keep the M5c amplitude gate, then add a geometry-health gate. Normal
  // operation should never hit this; it exists so a bad reconstruction cannot
  // silently keep consuming reserve while its contact solver is invalid.
  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    if (state.calibrated && !state.geometryHealthy && (powerSystem.windingSystem?.state.energy ?? 0) > 0) {
      return powerSystem.hold(mechanicalScale, 'GEOMETRY CONTACT');
    }
    return amplitudeAdvance(realSeconds, mechanicalScale);
  };

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const baseSample = base.update(mechanicalSeconds, escapeBase, running);
    const result = solveGeometry(baseSample, escapeBase);

    state.geometryEvent = result.event;
    state.geometryRelease = result.release;
    state.geometryEscapeAngle = result.dynamicAngle;
    state.startTravelMm = result.startTravel;
    state.targetRemainingMm = result.targetRemaining;
    state.contactGapMm = result.relevantContact.distance;
    state.contactTooth = result.release < .5
      ? result.transition.startTooth
      : result.transition.targetTooth;
    state.constraint = result.constraint;
    state.geometryHealthy = result.healthy;

    if (baseSample.beatIndex !== state.lastBeatIndex) {
      if (state.lastBeatIndex >= 0 && result.startTravel <= CONTACT.unlockClearanceMm * 1.5) state.geometryLocks += 1;
      if (!result.healthy) state.contactViolations += 1;
      state.lastBeatIndex = baseSample.beatIndex;
    }

    const absoluteHalfSteps = baseSample.beatIndex + result.release;
    const geometryEscapeAngle = absoluteHalfSteps * HALF_TOOTH;
    const releasedSeconds = geometryEscapeAngle / TAU * ESCAPE_PERIOD_SECONDS;

    if (animated.escapeWheel) animated.escapeWheel.rotation.z = escapeBase + geometryEscapeAngle;

    const visualResult = result.release < .5 ? result.startContact : result.targetContact;
    state.guides?.update(result.palletAngle, result.transition, visualResult);
    syncGeometryUI(result);

    return {
      ...baseSample,
      phase: result.event,
      geometryEvent: result.event,
      geometryRelease: result.release,
      geometryConstraint: result.constraint,
      geometryHealthy: result.healthy,
      contactGapMm: result.relevantContact.distance,
      startFaceTravelMm: result.startTravel,
      targetFaceRemainingMm: result.targetRemaining,
      escapeAngle: geometryEscapeAngle,
      escapeHalfSteps: absoluteHalfSteps,
      releasedSeconds
    };
  }

  return {
    ...base,
    state,
    update,
    contactTargets: { ...CONTACT },
    getSolverFaces: () => state.faces
  };
}

export { sampleSwissLever };
