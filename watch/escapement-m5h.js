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
const ESCAPE_PERIOD_SECONDS = 5;
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;

// M5h reconstructs the actual 2D shapes used by the current visible escape-tooth
// primitive, then gives each calibrated M5d pallet face a finite jewel body.
// These remain reconstruction dimensions, not ETA manufacturing drawings.
const POLYGON = {
  escapeTipRadiusMm: 2.25,
  escapeToothDepthMm: 0.70,
  escapeToothWidthMm: 0.17,
  escapeTipScale: 0.26,
  escapeHookMm: 0.22,
  palletJewelDepthMm: 0.18,
  unlockSurfaceGapMm: 0.028,
  captureSurfaceGapMm: 0.030,
  impulseEnvelopeMm: 0.080,
  maximumPenetrationMm: 0.018,
  releaseSamples: 72,
  captureSearchSteps: 28,
  gateSamples: 24,
  minimumGateImpulseSamples: 2,
  minimumGateReleaseSpan: 0.24
};

const clamp01 = value => Math.max(0, Math.min(1, value));
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scale2 = (a, s) => [a[0] * s, a[1] * s];
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const len2 = a => Math.hypot(a[0], a[1]);
const normalize2 = a => {
  const length = Math.max(1e-12, len2(a));
  return [a[0] / length, a[1] / length];
};

function rotate2([x, y], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
}

function projectPolygon(polygon, axis) {
  let min = Infinity;
  let max = -Infinity;
  for (const point of polygon) {
    const projection = dot2(point, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }
  return { min, max };
}

function pointSegmentClosest(point, a, b) {
  const ab = sub2(b, a);
  const ap = sub2(point, a);
  const denom = dot2(ab, ab);
  const t = denom <= 1e-12 ? 0 : clamp01(dot2(ap, ab) / denom);
  const closest = add2(a, scale2(ab, t));
  return { distance: len2(sub2(point, closest)), a: point, b: closest };
}

function polygonCentroid(polygon) {
  const total = polygon.reduce((sum, point) => add2(sum, point), [0, 0]);
  return scale2(total, 1 / Math.max(1, polygon.length));
}

function polygonContact(a, b) {
  let intersects = true;
  let penetrationDepth = Infinity;
  let penetrationAxis = [1, 0];

  for (const polygon of [a, b]) {
    for (let i = 0; i < polygon.length; i++) {
      const p0 = polygon[i];
      const p1 = polygon[(i + 1) % polygon.length];
      const edge = sub2(p1, p0);
      const axis = normalize2([-edge[1], edge[0]]);
      const pa = projectPolygon(a, axis);
      const pb = projectPolygon(b, axis);
      const overlap = Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min);
      if (overlap < 0) intersects = false;
      else if (overlap < penetrationDepth) {
        penetrationDepth = overlap;
        penetrationAxis = axis;
      }
    }
  }

  if (intersects) {
    const ca = polygonCentroid(a);
    const cb = polygonCentroid(b);
    return {
      intersects: true,
      distance: 0,
      penetrationDepth: Number.isFinite(penetrationDepth) ? penetrationDepth : 0,
      signedGap: -(Number.isFinite(penetrationDepth) ? penetrationDepth : 0),
      closestA: ca,
      closestB: cb,
      axis: penetrationAxis
    };
  }

  let best = { distance: Infinity, a: a[0], b: b[0] };
  for (let i = 0; i < a.length; i++) {
    const a0 = a[i];
    const a1 = a[(i + 1) % a.length];
    for (const point of b) {
      const candidate = pointSegmentClosest(point, a0, a1);
      if (candidate.distance < best.distance) best = { distance: candidate.distance, a: candidate.b, b: candidate.a };
    }
  }
  for (let i = 0; i < b.length; i++) {
    const b0 = b[i];
    const b1 = b[(i + 1) % b.length];
    for (const point of a) {
      const candidate = pointSegmentClosest(point, b0, b1);
      if (candidate.distance < best.distance) best = { distance: candidate.distance, a: candidate.a, b: candidate.b };
    }
  }

  return {
    intersects: false,
    distance: best.distance,
    penetrationDepth: 0,
    signedGap: best.distance,
    closestA: best.a,
    closestB: best.b,
    axis: normalize2(sub2(best.b, best.a))
  };
}

function faceSegment(face, palletAngle, halfLength) {
  const center = add2(LAYOUT.pallet, rotate2(face.anchorLocal, palletAngle));
  const tangent = normalize2(rotate2(face.tangentLocal, palletAngle));
  return {
    center,
    tangent,
    a: add2(center, scale2(tangent, -halfLength)),
    b: add2(center, scale2(tangent, halfLength))
  };
}

function palletJewelPolygon(face, palletAngle, halfLength) {
  const segment = faceSegment(face, palletAngle, halfLength);
  let bodyNormal = [-segment.tangent[1], segment.tangent[0]];
  const towardPalletStaff = sub2(LAYOUT.pallet, segment.center);
  if (dot2(bodyNormal, towardPalletStaff) < 0) bodyNormal = scale2(bodyNormal, -1);
  const depth = POLYGON.palletJewelDepthMm;
  return [
    segment.a,
    segment.b,
    add2(segment.b, scale2(bodyNormal, depth)),
    add2(segment.a, scale2(bodyNormal, depth))
  ];
}

function escapeToothPolygon(toothZeroAngle, toothIndex, absoluteWheelAngle) {
  const angle = toothZeroAngle + toothIndex * TOOTH_PITCH + absoluteWheelAngle;
  const depth = POLYGON.escapeToothDepthMm;
  const baseWidth = POLYGON.escapeToothWidthMm;
  const tipWidth = baseWidth * POLYGON.escapeTipScale;
  const rootRadius = POLYGON.escapeTipRadiusMm - depth * 0.70;
  const root = [
    LAYOUT.escapeWheel[0] + Math.cos(angle) * rootRadius,
    LAYOUT.escapeWheel[1] + Math.sin(angle) * rootRadius
  ];
  const local = [
    [-baseWidth / 2, 0],
    [baseWidth / 2, 0],
    [tipWidth / 2 + POLYGON.escapeHookMm, depth],
    [-tipWidth / 2 + POLYGON.escapeHookMm, depth]
  ];
  const rotation = angle - Math.PI / 2;
  return local.map(point => add2(root, rotate2(point, rotation)));
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

function makePolygonGuides(watch) {
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5h tooth and pallet polygon contact guides';
  group.visible = false;

  const makeLoop = color => new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: .9 })
  );
  const startJewel = makeLoop(0x72c9ff);
  const targetJewel = makeLoop(0xffc86d);
  const tooth = makeLoop(0xf4f7fa);
  const contactLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x8cf0a8, depthTest: false })
  );
  group.add(startJewel, targetJewel, tooth, contactLine);
  layer.add(group);

  const setLoop = (loop, polygon, z = .06) => {
    loop.geometry.dispose();
    loop.geometry = new THREE.BufferGeometry().setFromPoints(
      polygon.map(point => new THREE.Vector3(point[0], point[1], z))
    );
  };

  return {
    group,
    update(result) {
      if (!result) return;
      setLoop(startJewel, result.startJewel);
      setLoop(targetJewel, result.targetJewel);
      setLoop(tooth, result.relevantTooth);
      contactLine.geometry.dispose();
      contactLine.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(result.relevantContact.closestA[0], result.relevantContact.closestA[1], .07),
        new THREE.Vector3(result.relevantContact.closestB[0], result.relevantContact.closestB[1], .07)
      ]);
      contactLine.material.color.setHex(result.healthy ? 0x8cf0a8 : 0xff7d70);
    }
  };
}

function injectUI(root) {
  if (root.querySelector('#polygonContactSection')) return;
  const controls = root.querySelector('.controls');
  const physical = root.querySelector('#physicalOscillatorSection');
  const geometry = root.querySelector('#geometrySolverSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'polygonContactSection';
  section.innerHTML = `
    <div class="section-title">Polygon contact solver · M5h</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Surface event</span><output id="polygonEventValue">CALIBRATING</output></div>
      <div class="mode-stat"><span>Active surfaces</span><output id="polygonSurfaceValue">—</output></div>
      <div class="mode-stat"><span>Polygon gap</span><output id="polygonGapValue">— mm</output></div>
      <div class="mode-stat"><span>Overlap depth</span><output id="polygonOverlapValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Release angle</span><output id="polygonReleaseValue">0.00°</output></div>
      <div class="mode-stat"><span>Derived drop</span><output id="polygonDropValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Impulse gate</span><output id="polygonGateValue">CALIBRATING</output></div>
      <div class="mode-stat"><span>Solver health</span><output id="polygonHealthValue">CALIBRATING</output></div>
    </div>
    <div class="inline-toggles"><label><input id="polygonContactGuides" type="checkbox" /> Show M5h tooth / jewel polygons</label></div>
    <div class="winding-note">M5h replaces the final point-to-line contact decision with finite convex surfaces. The tracked escape tooth uses the same tapered/hooked 2D primitive dimensions as the visible reconstruction; each calibrated pallet face becomes the working edge of a finite jewel polygon. Unlock, impulse following, drop, target capture, penetration and impulse admission are now evaluated from polygon separation/overlap. These dimensions remain reconstructed educational geometry, not ETA manufacturing coordinates.</div>`;

  if (physical?.nextSibling) controls.insertBefore(section, physical.nextSibling);
  else controls.insertBefore(section, geometry ?? null);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5H';
  if (subtitle) subtitle.textContent = 'finite tooth/pallet polygons governing lock, impulse, drop and capture';
  if (loading) loading.textContent = 'Constructing 6497-2 M5h polygon contact state…';
  if (hint) hint.textContent = 'M5h replaces point/segment contact with finite tooth and pallet-jewel polygons. Polygon separation and overlap now determine lock clearance, impulse following, drop, capture and whether an oscillator impulse is geometrically admissible.';
  if (infoText) infoText.textContent = 'M5h uses finite convex polygons for the active escape tooth and reconstructed pallet jewels. Surface separation/overlap now constrains escape release and admits or denies the angular-velocity impulse delivered to the integrated M5f balance.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM5fEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);
  const guides = makePolygonGuides(watch);
  let currentEscapeBase = 0;
  let calibrationPrimed = false;

  const state = {
    currentBeat: -1,
    monotonicRelease: 0,
    lastResult: null,
    lastAdmission: null,
    admittedImpulses: 0,
    deniedImpulses: 0,
    consecutiveInvalid: 0
  };

  const ui = {
    event: root.querySelector('#polygonEventValue'),
    surface: root.querySelector('#polygonSurfaceValue'),
    gap: root.querySelector('#polygonGapValue'),
    overlap: root.querySelector('#polygonOverlapValue'),
    release: root.querySelector('#polygonReleaseValue'),
    drop: root.querySelector('#polygonDropValue'),
    gate: root.querySelector('#polygonGateValue'),
    health: root.querySelector('#polygonHealthValue'),
    guides: root.querySelector('#polygonContactGuides')
  };

  ui.guides?.addEventListener('change', () => {
    guides.group.visible = ui.guides.checked;
  });

  function calibratedInputs() {
    const geometryState = base.geometryState;
    const faces = base.getSolverFaces?.();
    const targets = base.contactTargets;
    if (!geometryState?.calibrated || !faces || !targets) return null;
    return { geometryState, faces, targets };
  }

  function evaluateSurfaces(beatIndex, palletAngle, withinBeatAngle, inputs) {
    const { geometryState, faces, targets } = inputs;
    const transition = transitionForBeat(beatIndex, geometryState.entryBaseIndex);
    const completedAngle = beatIndex * HALF_TOOTH;
    const startJewel = palletJewelPolygon(faces[transition.start], palletAngle, targets.faceHalfLengthMm);
    const targetJewel = palletJewelPolygon(faces[transition.target], palletAngle, targets.faceHalfLengthMm);
    const startTooth = escapeToothPolygon(
      geometryState.toothZeroAngle,
      transition.startTooth,
      completedAngle + withinBeatAngle
    );
    const targetTooth = escapeToothPolygon(
      geometryState.toothZeroAngle,
      transition.targetTooth,
      completedAngle + withinBeatAngle
    );
    return {
      transition,
      completedAngle,
      startJewel,
      targetJewel,
      startTooth,
      targetTooth,
      startContact: polygonContact(startTooth, startJewel),
      targetContact: polygonContact(targetTooth, targetJewel)
    };
  }

  function solvePolygonAt(beatIndex, palletAngle, minimumRelease = 0) {
    const inputs = calibratedInputs();
    if (!inputs) return null;

    const zero = evaluateSurfaces(beatIndex, palletAngle, 0, inputs);
    const lockedAtStart = zero.startContact.signedGap <= POLYGON.unlockSurfaceGapMm;
    let releaseAngle = 0;
    let event = `LOCK · ${zero.transition.start.toUpperCase()} POLYGON`;
    let maximumImpulseAngle = 0;
    let captureAngle = null;
    let captureBracket = null;
    let bestImpulse = null;
    let deepestPenetration = Math.max(
      zero.startContact.penetrationDepth,
      zero.targetContact.penetrationDepth
    );

    if (!lockedAtStart || minimumRelease > 0) {
      for (let i = 1; i <= POLYGON.releaseSamples; i++) {
        const angle = HALF_TOOTH * i / POLYGON.releaseSamples;
        const evaluation = evaluateSurfaces(beatIndex, palletAngle, angle, inputs);
        deepestPenetration = Math.max(
          deepestPenetration,
          evaluation.startContact.penetrationDepth,
          evaluation.targetContact.penetrationDepth
        );

        const startImpulseContact =
          evaluation.startContact.signedGap <= POLYGON.impulseEnvelopeMm &&
          evaluation.startContact.signedGap >= -POLYGON.maximumPenetrationMm;
        const targetCapture =
          angle >= HALF_TOOTH * .35 &&
          evaluation.targetContact.signedGap <= POLYGON.captureSurfaceGapMm;

        if (startImpulseContact) {
          maximumImpulseAngle = angle;
          bestImpulse = evaluation;
        }
        if (captureAngle === null && targetCapture) {
          captureAngle = angle;
          captureBracket = [Math.max(0, angle - HALF_TOOTH / POLYGON.releaseSamples), angle];
          break;
        }
      }

      if (captureBracket) {
        let [lo, hi] = captureBracket;
        for (let i = 0; i < POLYGON.captureSearchSteps; i++) {
          const mid = (lo + hi) / 2;
          const evaluation = evaluateSurfaces(beatIndex, palletAngle, mid, inputs);
          if (evaluation.targetContact.signedGap <= POLYGON.captureSurfaceGapMm) hi = mid;
          else lo = mid;
        }
        captureAngle = hi;
      }

      if (maximumImpulseAngle > 0) {
        releaseAngle = maximumImpulseAngle;
        event = 'IMPULSE · POLYGON SURFACE';
      } else {
        releaseAngle = HALF_TOOTH;
        event = 'DROP · POLYGON FREE FLIGHT';
      }
      if (captureAngle !== null && captureAngle <= releaseAngle) {
        releaseAngle = captureAngle;
        event = `LOCK · ${zero.transition.target.toUpperCase()} POLYGON`;
      }
    }

    releaseAngle = Math.max(minimumRelease, Math.min(HALF_TOOTH, releaseAngle));
    const final = evaluateSurfaces(beatIndex, palletAngle, releaseAngle, inputs);
    const relevantContact = event.includes(zero.transition.start.toUpperCase()) || event.startsWith('IMPULSE')
      ? final.startContact
      : final.targetContact;
    const relevantTooth = event.includes(zero.transition.start.toUpperCase()) || event.startsWith('IMPULSE')
      ? final.startTooth
      : final.targetTooth;

    const overlap = Math.max(final.startContact.penetrationDepth, final.targetContact.penetrationDepth);
    const excessivePenetration = overlap > POLYGON.maximumPenetrationMm;
    const finite = Number.isFinite(final.startContact.signedGap) && Number.isFinite(final.targetContact.signedGap);
    const healthy = finite && !excessivePenetration;
    const dropGap = Math.max(0, Math.min(final.startContact.distance, final.targetContact.distance));

    return {
      beatIndex,
      palletAngle,
      transition: final.transition,
      releaseAngle,
      release: clamp01(releaseAngle / HALF_TOOTH),
      event,
      healthy,
      excessivePenetration,
      deepestPenetration,
      overlapDepth: overlap,
      dropGap,
      startJewel: final.startJewel,
      targetJewel: final.targetJewel,
      startTooth: final.startTooth,
      targetTooth: final.targetTooth,
      startContact: final.startContact,
      targetContact: final.targetContact,
      relevantContact,
      relevantTooth,
      maximumImpulseAngle,
      captureAngle,
      bestImpulse
    };
  }

  function probePolygonImpulse(beatIndex) {
    const inputs = calibratedInputs();
    if (!inputs) {
      return { admitted: false, reason: 'POLYGON SOLVER NOT CALIBRATED', beatIndex, impulseSamples: 0, releaseSpan: 0, minGap: Infinity };
    }

    let impulseSamples = 0;
    let minRelease = Infinity;
    let maxRelease = -Infinity;
    let minGap = Infinity;
    let best = null;
    let healthy = true;

    for (let i = 0; i < POLYGON.gateSamples; i++) {
      const fraction = THREE.MathUtils.lerp(.06, .52, i / Math.max(1, POLYGON.gateSamples - 1));
      const sample = sampleSwissLever((beatIndex + fraction) / BEATS_PER_SECOND);
      const result = solvePolygonAt(beatIndex, sample.palletAngle, 0);
      if (!result) continue;
      healthy = healthy && result.healthy;
      minRelease = Math.min(minRelease, result.release);
      maxRelease = Math.max(maxRelease, result.release);

      const impulseContact =
        result.event.startsWith('IMPULSE') &&
        result.startContact.signedGap <= POLYGON.impulseEnvelopeMm &&
        result.startContact.signedGap >= -POLYGON.maximumPenetrationMm;
      if (impulseContact) {
        impulseSamples += 1;
        const gap = Math.abs(result.startContact.signedGap);
        if (gap < minGap) {
          minGap = gap;
          best = result;
        }
      }
    }

    const releaseSpan = Number.isFinite(minRelease) ? Math.max(0, maxRelease - minRelease) : 0;
    let admitted = true;
    let reason = 'ADMITTED · POLYGON IMPULSE SURFACES';
    if (!healthy) {
      admitted = false;
      reason = 'DENIED · POLYGON PENETRATION';
    } else if (impulseSamples < POLYGON.minimumGateImpulseSamples) {
      admitted = false;
      reason = 'DENIED · NO POLYGON IMPULSE INTERVAL';
    } else if (releaseSpan < POLYGON.minimumGateReleaseSpan) {
      admitted = false;
      reason = 'DENIED · INSUFFICIENT POLYGON RELEASE';
    }

    return {
      admitted,
      reason,
      beatIndex,
      impulseSamples,
      releaseSpan,
      minGap,
      best
    };
  }

  base.setImpulseAdmission(context => {
    const result = probePolygonImpulse(Math.max(0, context.crossingIndex));
    state.lastAdmission = result;
    if (result.admitted) state.admittedImpulses += 1;
    else state.deniedImpulses += 1;
    return result;
  });

  function syncUI(result) {
    if (!result) return;
    if (ui.event) ui.event.value = result.event;
    if (ui.surface) ui.surface.value = `${result.transition.start.toUpperCase()} → ${result.transition.target.toUpperCase()}`;
    if (ui.gap) ui.gap.value = `${result.relevantContact.signedGap.toFixed(3)} mm`;
    if (ui.overlap) ui.overlap.value = `${result.overlapDepth.toFixed(3)} mm`;
    if (ui.release) ui.release.value = `${THREE.MathUtils.radToDeg(result.releaseAngle).toFixed(2)}° / 12°`;
    if (ui.drop) ui.drop.value = `${result.dropGap.toFixed(3)} mm`;
    if (ui.gate) ui.gate.value = state.lastAdmission
      ? (state.lastAdmission.admitted ? 'ADMITTED · Δω' : 'DENIED · NO Δω')
      : 'WAITING FOR CROSSING';
    if (ui.health) ui.health.value = result.healthy ? 'POLYGON SOLVER OK' : 'PENETRATION CHECK';
    guides.update(result);
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    currentEscapeBase = escapeBase;
    if (!calibrationPrimed && !base.getSolverFaces?.()) {
      base.update(base.state.oscillatorSeconds ?? 0, currentEscapeBase, false);
      calibrationPrimed = Boolean(base.getSolverFaces?.());
    }

    const sample = base.update(mechanicalSeconds, currentEscapeBase, running);
    const beatIndex = sample.beatIndex ?? Math.floor((sample.oscillatorSeconds ?? 0) * BEATS_PER_SECOND);
    if (beatIndex !== state.currentBeat) {
      state.currentBeat = beatIndex;
      state.monotonicRelease = 0;
    }

    const result = solvePolygonAt(beatIndex, sample.palletAngle, state.monotonicRelease);
    if (!result) return sample;
    state.monotonicRelease = Math.max(state.monotonicRelease, result.releaseAngle);
    state.lastResult = result;
    state.consecutiveInvalid = result.healthy ? 0 : state.consecutiveInvalid + 1;

    // Feed the polygon health back into M5f's existing geometry gate reference so
    // repeated invalid surface states can hold reserve on the following frame.
    if (base.geometryState) {
      base.geometryState.geometryHealthy = result.healthy;
      base.geometryState.consecutiveInvalid = state.consecutiveInvalid;
    }

    const absoluteHalfSteps = beatIndex + result.release;
    const polygonEscapeAngle = absoluteHalfSteps * HALF_TOOTH;
    const releasedSeconds = polygonEscapeAngle / TAU * ESCAPE_PERIOD_SECONDS;
    if (animated.escapeWheel) animated.escapeWheel.rotation.z = currentEscapeBase + polygonEscapeAngle;

    syncUI(result);

    return {
      ...sample,
      phase: result.event,
      geometryEvent: result.event,
      geometryRelease: result.release,
      geometryHealthy: result.healthy,
      escapeAngle: polygonEscapeAngle,
      escapeHalfSteps: absoluteHalfSteps,
      releasedSeconds,
      polygonContact: result,
      polygonImpulseAdmission: state.lastAdmission,
      polygonAdmittedImpulses: state.admittedImpulses,
      polygonDeniedImpulses: state.deniedImpulses
    };
  }

  return {
    ...base,
    state: base.state,
    polygonState: state,
    update,
    polygonTargets: { ...POLYGON },
    solvePolygonAt,
    probePolygonImpulse
  };
}

export { sampleSwissLever };
