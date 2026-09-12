import * as THREE from 'three';
import {
  createEscapementSystem as createM5fEscapementSystem,
  sampleSwissLever
} from './escapement-m5f.js';
import { LAYOUT } from './spec.js';

const TAU = Math.PI * 2;
const BEATS_PER_SECOND = 6;
const ESCAPE_TEETH = 15;
const TOOTH_PITCH = TAU / ESCAPE_TEETH;
const HALF_TOOTH = TOOTH_PITCH / 2;
const ESCAPE_TIP_RADIUS_MM = 2.25;
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;

// These are M5g diagnostic/admission choices, not ETA production dimensions.
// M5g deliberately reuses M5d's calibrated solver faces and contact clearances;
// this extra envelope only decides whether that solved path is coherent enough
// to permit an M5f angular-velocity impulse.
const GATE = {
  sampleStartBeatFraction: 0.08,
  sampleEndBeatFraction: 0.46,
  sampleCount: 20,
  minimumImpulseSamples: 2,
  minimumReleaseSpan: 0.32,
  contactEnvelopeMultiplier: 8
};

const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth01 = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const len2 = v => Math.hypot(v[0], v[1]);

function rotate2([x, y], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
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

function faceSegment(face, palletAngle, halfLength) {
  const center = add2(LAYOUT.pallet, rotate2(face.anchorLocal, palletAngle));
  const tangent = rotate2(face.tangentLocal, palletAngle);
  return {
    center,
    a: [center[0] - tangent[0] * halfLength, center[1] - tangent[1] * halfLength],
    b: [center[0] + tangent[0] * halfLength, center[1] + tangent[1] * halfLength]
  };
}

function toothTip(toothZeroAngle, toothIndex, absoluteWheelAngle) {
  return designPoint(
    LAYOUT.escapeWheel,
    ESCAPE_TIP_RADIUS_MM,
    toothZeroAngle + toothIndex * TOOTH_PITCH + absoluteWheelAngle
  );
}

function contactDistance(face, palletAngle, halfLength, toothZeroAngle, toothIndex, absoluteWheelAngle) {
  const segment = faceSegment(face, palletAngle, halfLength);
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
  if (root.querySelector('#impulseGeometryGateSection')) return;
  const controls = root.querySelector('.controls');
  const physical = root.querySelector('#physicalOscillatorSection');
  const geometry = root.querySelector('#geometrySolverSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'impulseGeometryGateSection';
  section.innerHTML = `
    <div class="section-title">Impulse contact gate · M5g</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Gate decision</span><output id="impulseGateDecisionValue">CALIBRATING</output></div>
      <div class="mode-stat"><span>Pallet transition</span><output id="impulseGateTransitionValue">—</output></div>
      <div class="mode-stat"><span>Nearest path gap</span><output id="impulseGateGapValue">— mm</output></div>
      <div class="mode-stat"><span>Geometry release span</span><output id="impulseGateReleaseSpanValue">0.0%</output></div>
      <div class="mode-stat"><span>Impulse-path samples</span><output id="impulseGateSamplesValue">0 / ${GATE.sampleCount}</output></div>
      <div class="mode-stat"><span>Admission reason</span><output id="impulseGateReasonValue">WAITING FOR SOLVER</output></div>
      <div class="mode-stat"><span>Admitted probes</span><output id="impulseGateAdmittedValue">0</output></div>
      <div class="mode-stat"><span>Denied probes</span><output id="impulseGateDeniedValue">0</output></div>
    </div>
    <div class="inline-toggles"><label><input id="impulseGateGuides" type="checkbox" /> Show M5g admitted/denied contact marker</label></div>
    <div class="winding-note">M5g removes the rule “center crossing + healthy solver = impulse.” Each crossing now asks the reconstructed M5d pallet/tooth path whether an impulse interval actually exists: the starting face must clear, the geometry-derived half-tooth release must progress, and a tracked tooth must remain inside the reconstructed contact envelope without violating the penetration guard. Only an admitted path is allowed to add Δω to the M5f balance state. The envelope is still reconstruction-level, not factory pallet geometry.</div>`;

  if (physical?.nextSibling) controls.insertBefore(section, physical.nextSibling);
  else controls.insertBefore(section, geometry ?? null);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5G';
  if (subtitle) subtitle.textContent = 'geometry-admitted escapement impulse into the integrated balance';
  if (loading) loading.textContent = 'Constructing 6497-2 M5g impulse-contact gate…';
  if (hint) hint.textContent = 'M5g makes impulse delivery conditional on the reconstructed tooth/pallet path. A balance center crossing merely creates an opportunity; M5d geometry must show a coherent unlock/impulse/capture path before M5f is allowed to add angular velocity to the balance.';
  if (infoText) infoText.textContent = 'M5g couples the M5d contact reconstruction to the M5f physical oscillator. Center crossings no longer receive automatic kicks: the tracked escape tooth and alternating pallet path must geometrically admit an impulse before Δω reaches the balance.';
}

function makeGateMarker(watch) {
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5g impulse admission contact marker';
  group.visible = false;

  const toothMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false });
  const faceMat = new THREE.MeshBasicMaterial({ color: 0x7ee39d, depthTest: false });
  const lineMat = new THREE.LineBasicMaterial({ color: 0x7ee39d, depthTest: false });
  const tooth = new THREE.Mesh(new THREE.SphereGeometry(.105, 18, 10), toothMat);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.085, 16, 8), faceMat);
  const line = new THREE.Line(new THREE.BufferGeometry(), lineMat);
  group.add(tooth, face, line);
  layer.add(group);

  return {
    group,
    update(result) {
      if (!result?.bestContact) return;
      const { tip, closest } = result.bestContact;
      tooth.position.set(tip[0], tip[1], .04);
      face.position.set(closest[0], closest[1], .04);
      line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(tip[0], tip[1], .04),
        new THREE.Vector3(closest[0], closest[1], .04)
      ]);
      const color = result.admitted ? 0x7ee39d : 0xff8a7a;
      faceMat.color.setHex(color);
      lineMat.color.setHex(color);
    }
  };
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM5fEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);
  const marker = makeGateMarker(watch);
  let currentEscapeBase = 0;
  let calibrationPrimed = false;

  const state = {
    lastAdmission: null,
    admittedProbes: 0,
    deniedProbes: 0,
    detailedAdmitted: 0,
    detailedDenied: 0
  };

  const ui = {
    decision: root.querySelector('#impulseGateDecisionValue'),
    transition: root.querySelector('#impulseGateTransitionValue'),
    gap: root.querySelector('#impulseGateGapValue'),
    span: root.querySelector('#impulseGateReleaseSpanValue'),
    samples: root.querySelector('#impulseGateSamplesValue'),
    reason: root.querySelector('#impulseGateReasonValue'),
    admitted: root.querySelector('#impulseGateAdmittedValue'),
    denied: root.querySelector('#impulseGateDeniedValue'),
    guides: root.querySelector('#impulseGateGuides')
  };

  ui.guides?.addEventListener('change', () => {
    marker.group.visible = ui.guides.checked;
  });

  function probeImpulsePath(beatIndex) {
    const geometryState = base.geometryState;
    const faces = base.getSolverFaces?.();
    const targets = base.contactTargets;
    if (!geometryState?.calibrated || !faces || !targets) {
      return { admitted: false, reason: 'SOLVER NOT CALIBRATED', beatIndex, impulseSamples: 0, releaseSpan: 0, minGap: Infinity };
    }

    const transition = transitionForBeat(beatIndex, geometryState.entryBaseIndex);
    const startFace = faces[transition.start];
    const targetFace = faces[transition.target];
    const halfLength = targets.faceHalfLengthMm;
    const startBank = transition.start === 'entry' ? PALLET_CENTER - PALLET_BANK : PALLET_CENTER + PALLET_BANK;
    const oppositeBank = transition.target === 'exit' ? PALLET_CENTER + PALLET_BANK : PALLET_CENTER - PALLET_BANK;
    const faceTravel = (face, palletAngle) => len2(sub2(faceSegment(face, palletAngle, halfLength).center, face.target));
    const startTotal = Math.max(1e-6, faceTravel(startFace, oppositeBank));
    const targetTotal = Math.max(1e-6, faceTravel(targetFace, startBank));
    const unlockFraction = clamp01(targets.unlockClearanceMm / startTotal);
    const captureFraction = clamp01(targets.lockCaptureMm / targetTotal);
    const completedAngle = beatIndex * HALF_TOOTH;
    const envelope = targets.contactToleranceMm * GATE.contactEnvelopeMultiplier;

    let maxStartTravel = 0;
    let minTargetRemaining = Infinity;
    let minRelease = Infinity;
    let maxRelease = -Infinity;
    let minGap = Infinity;
    let impulseSamples = 0;
    let finite = true;
    let penetrationViolation = false;
    let bestContact = null;

    for (let i = 0; i < GATE.sampleCount; i++) {
      const t = i / Math.max(1, GATE.sampleCount - 1);
      const beatFraction = THREE.MathUtils.lerp(GATE.sampleStartBeatFraction, GATE.sampleEndBeatFraction, t);
      const sample = sampleSwissLever((beatIndex + beatFraction) / BEATS_PER_SECOND);
      const palletAngle = sample.palletAngle;
      const startTravel = faceTravel(startFace, palletAngle);
      const targetRemaining = faceTravel(targetFace, palletAngle);
      const palletFraction = clamp01(startTravel / startTotal);
      let release = smooth01(clamp01((palletFraction - unlockFraction) / Math.max(1e-6, 1 - unlockFraction - captureFraction)));
      if (startTravel <= targets.unlockClearanceMm) release = 0;
      if (targetRemaining <= targets.lockCaptureMm) release = 1;

      let withinBeatAngle = release * HALF_TOOTH;
      let targetContact = contactDistance(
        targetFace,
        palletAngle,
        halfLength,
        geometryState.toothZeroAngle,
        transition.targetTooth,
        completedAngle + withinBeatAngle
      );

      if (release > 0 && release < 1 && targetContact.distance < targets.penetrationGuardMm) {
        let lo = 0;
        let hi = withinBeatAngle;
        for (let step = 0; step < (targets.searchSteps ?? 40); step++) {
          const mid = (lo + hi) / 2;
          const gap = contactDistance(
            targetFace,
            palletAngle,
            halfLength,
            geometryState.toothZeroAngle,
            transition.targetTooth,
            completedAngle + mid
          ).distance;
          if (gap < targets.penetrationGuardMm) hi = mid;
          else lo = mid;
        }
        withinBeatAngle = lo;
        release = clamp01(withinBeatAngle / HALF_TOOTH);
        targetContact = contactDistance(
          targetFace,
          palletAngle,
          halfLength,
          geometryState.toothZeroAngle,
          transition.targetTooth,
          completedAngle + withinBeatAngle
        );
        if (targetContact.distance < targets.penetrationGuardMm * .98) penetrationViolation = true;
      }

      const startContact = contactDistance(
        startFace,
        palletAngle,
        halfLength,
        geometryState.toothZeroAngle,
        transition.startTooth,
        completedAngle
      );
      const relevant = release < .5 ? startContact : targetContact;
      if (!Number.isFinite(relevant.distance)) finite = false;
      maxStartTravel = Math.max(maxStartTravel, startTravel);
      minTargetRemaining = Math.min(minTargetRemaining, targetRemaining);
      minRelease = Math.min(minRelease, release);
      maxRelease = Math.max(maxRelease, release);

      if (release >= .20 && release < .92 && targetRemaining > targets.lockCaptureMm) {
        impulseSamples += 1;
        if (relevant.distance < minGap) {
          minGap = relevant.distance;
          bestContact = relevant;
        }
      }
    }

    const releaseSpan = Math.max(0, maxRelease - minRelease);
    const startCleared = maxStartTravel > targets.unlockClearanceMm;
    const contactNear = Number.isFinite(minGap) && minGap <= envelope;
    let reason = 'ADMITTED · GEOMETRIC IMPULSE PATH';
    let admitted = true;

    if (!finite) {
      admitted = false;
      reason = 'DENIED · NON-FINITE CONTACT';
    } else if (!startCleared) {
      admitted = false;
      reason = 'DENIED · START FACE DID NOT CLEAR';
    } else if (impulseSamples < GATE.minimumImpulseSamples) {
      admitted = false;
      reason = 'DENIED · NO IMPULSE INTERVAL';
    } else if (releaseSpan < GATE.minimumReleaseSpan) {
      admitted = false;
      reason = 'DENIED · INSUFFICIENT RELEASE TRAVEL';
    } else if (!contactNear) {
      admitted = false;
      reason = 'DENIED · TOOTH OUTSIDE CONTACT ENVELOPE';
    } else if (penetrationViolation) {
      admitted = false;
      reason = 'DENIED · PENETRATION GUARD';
    }

    return {
      admitted,
      reason,
      beatIndex,
      transition,
      impulseSamples,
      releaseSpan,
      minGap,
      maxStartTravel,
      minTargetRemaining,
      envelope,
      bestContact
    };
  }

  function syncGateUI(result) {
    if (!result) return;
    if (ui.decision) ui.decision.value = result.admitted ? 'ADMITTED · Δω ENABLED' : 'DENIED · NO Δω';
    if (ui.transition) ui.transition.value = result.transition ? `${result.transition.start.toUpperCase()} → ${result.transition.target.toUpperCase()}` : '—';
    if (ui.gap) ui.gap.value = Number.isFinite(result.minGap) ? `${result.minGap.toFixed(3)} mm` : '— mm';
    if (ui.span) ui.span.value = `${(result.releaseSpan * 100).toFixed(1)}%`;
    if (ui.samples) ui.samples.value = `${result.impulseSamples} / ${GATE.sampleCount}`;
    if (ui.reason) ui.reason.value = result.reason;
    if (ui.admitted) ui.admitted.value = `${state.admittedProbes}`;
    if (ui.denied) ui.denied.value = `${state.deniedProbes}`;
    marker.update(result);
  }

  base.setImpulseAdmission(context => {
    // crossingIndex 1 corresponds to the first completed half-cycle, i.e. beat 1.
    // M5d's transition function is defined directly on beat indices, so this
    // gives the gate the same alternating entry/exit sequence as the visible solver.
    const result = probeImpulsePath(Math.max(0, context.crossingIndex));
    state.lastAdmission = result;
    if (result.admitted) state.admittedProbes += 1;
    else state.deniedProbes += 1;
    if (!context.fastForward) {
      if (result.admitted) state.detailedAdmitted += 1;
      else state.detailedDenied += 1;
    }
    syncGateUI(result);
    return result;
  });

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    currentEscapeBase = escapeBase;
    if (!calibrationPrimed && !base.getSolverFaces?.()) {
      // M5d calibrates its contact faces on first update. Prime that calibration
      // without advancing the physical oscillator so the first real crossing can
      // already ask geometry whether an impulse path exists.
      base.update(base.state.oscillatorSeconds ?? 0, currentEscapeBase, false);
      calibrationPrimed = Boolean(base.getSolverFaces?.());
    }

    const sample = base.update(mechanicalSeconds, currentEscapeBase, running);
    if (state.lastAdmission) syncGateUI(state.lastAdmission);
    return {
      ...sample,
      impulseGeometryAdmission: state.lastAdmission,
      geometryAdmittedImpulseProbes: state.admittedProbes,
      geometryDeniedImpulseProbes: state.deniedProbes
    };
  }

  return {
    ...base,
    state: base.state,
    impulseGateState: state,
    update,
    impulseGateTargets: { ...GATE },
    probeImpulsePath
  };
}

export { sampleSwissLever };
