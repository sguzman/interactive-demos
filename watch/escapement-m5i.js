import * as THREE from 'three';
import {
  createEscapementSystem as createM5hEscapementSystem,
  sampleSwissLever
} from './escapement-m5h.js';

const BEATS_PER_SECOND = 6;
const ESCAPE_TEETH = 15;
const HALF_TOOTH = Math.PI * 2 / ESCAPE_TEETH / 2;

// M5i work values are dimensionless educational bookkeeping. They are not
// joules, measured torque, measured pallet efficiency, or ETA factory data.
// Geometry provides a work-path fraction; a work-budget provider supplies the
// available drive. Without a provider M5i retains its historical reserve proxy.
const WORK = {
  escapeTipRadiusMm: 2.25,
  sampleStartBeatFraction: 0.06,
  sampleEndBeatFraction: 0.52,
  sampleCount: 32,
  referenceFollowFraction: 0.40,
  minimumUsefulScale: 0.02,
  gapExponent: 1.35,
  maximumExternalDriveRatio: 1.35
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function injectUI(root) {
  if (root.querySelector('#impulseWorkSection')) return;
  const controls = root.querySelector('.controls');
  const polygon = root.querySelector('#polygonContactSection');
  const physical = root.querySelector('#physicalOscillatorSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'impulseWorkSection';
  section.innerHTML = `
    <div class="section-title">Impulse work transfer · M5i</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Available train work</span><output id="availableImpulseWorkValue">0.000 work units</output></div>
      <div class="mode-stat"><span>Delivered work</span><output id="deliveredImpulseWorkValue">0.000 work units</output></div>
      <div class="mode-stat"><span>Rejected / lost work</span><output id="lostImpulseWorkValue">0.000 work units</output></div>
      <div class="mode-stat"><span>Surface-follow distance</span><output id="impulseFollowDistanceValue">0.000 mm</output></div>
      <div class="mode-stat"><span>Contact quality</span><output id="impulseContactQualityValue">0.0%</output></div>
      <div class="mode-stat"><span>Transfer efficiency</span><output id="impulseTransferEfficiencyValue">0.0%</output></div>
      <div class="mode-stat"><span>Δω packet scale</span><output id="impulseWorkScaleValue">0.000×</output></div>
      <div class="mode-stat"><span>Work verdict</span><output id="impulseWorkVerdictValue">WAITING FOR CROSSING</output></div>
    </div>
    <div class="winding-note">M5i replaces the fixed-size admitted impulse with normalized work bookkeeping. A work budget supplies the available drive, while the M5h polygon solver supplies how far the tooth follows the pallet impulse surface and how closely those surfaces track. Their product estimates transfer efficiency. Delivered work is the available budget multiplied by that efficiency; the balance Δω packet scales from the delivered work. “Work units” remain normalized educational units, not joules.</div>`;

  if (polygon?.nextSibling) controls.insertBefore(section, polygon.nextSibling);
  else controls.insertBefore(section, physical ?? null);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5I';
  if (subtitle) subtitle.textContent = 'polygon-following escapement work scaled into balance impulse';
  if (loading) loading.textContent = 'Constructing 6497-2 M5i impulse-work state…';
  if (hint) hint.textContent = 'M5i turns an admitted escapement contact into a variable-sized impulse rather than a fixed kick. A normalized available-work budget is filtered by M5h polygon following and contact quality; delivered versus rejected work then controls the angular-velocity packet.';
  if (infoText) infoText.textContent = 'M5i adds normalized escapement work transfer on top of the M5h polygon solver. Available drive, surface-follow distance and contact quality produce delivered versus rejected work, and delivered work scales the angular-velocity impulse applied to the integrated balance.';
}

function contactQualityFor(result, polygonTargets) {
  if (!result?.startContact || !polygonTargets) return 0;
  const gap = result.startContact.signedGap;
  if (!Number.isFinite(gap)) return 0;

  let quality;
  if (gap >= 0) {
    quality = 1 - clamp01(gap / Math.max(1e-6, polygonTargets.impulseEnvelopeMm));
  } else {
    quality = 1 - clamp01(Math.abs(gap) / Math.max(1e-6, polygonTargets.maximumPenetrationMm));
  }
  return Math.pow(clamp01(quality), WORK.gapExponent);
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM5hEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);
  let workBudgetProvider = null;

  const state = {
    lastWork: null,
    opportunities: 0,
    deliveredOpportunities: 0,
    rejectedOpportunities: 0,
    cumulativeAvailableWork: 0,
    cumulativeDeliveredWork: 0,
    cumulativeLostWork: 0
  };

  const ui = {
    available: root.querySelector('#availableImpulseWorkValue'),
    delivered: root.querySelector('#deliveredImpulseWorkValue'),
    lost: root.querySelector('#lostImpulseWorkValue'),
    follow: root.querySelector('#impulseFollowDistanceValue'),
    quality: root.querySelector('#impulseContactQualityValue'),
    efficiency: root.querySelector('#impulseTransferEfficiencyValue'),
    scale: root.querySelector('#impulseWorkScaleValue'),
    verdict: root.querySelector('#impulseWorkVerdictValue')
  };

  function availableWorkFor(context) {
    const legacyDrive = clamp01(Number(context.drive) || 0);
    if (!workBudgetProvider) return { availableWork: legacyDrive, legacyDrive, source: 'reserve proxy' };

    try {
      const supplied = workBudgetProvider(context);
      const raw = typeof supplied === 'object' && supplied !== null
        ? supplied.availableWork
        : supplied;
      return {
        availableWork: clamp01(Number(raw) || 0),
        legacyDrive,
        source: typeof supplied === 'object' && supplied?.source ? supplied.source : 'external work budget'
      };
    } catch (error) {
      console.warn('Impulse work-budget provider failed', error);
      return { availableWork: 0, legacyDrive, source: 'work-budget provider error' };
    }
  }

  function estimateImpulseWork(context) {
    const beatIndex = Math.max(0, context.crossingIndex);
    const polygonGate = base.probePolygonImpulse(beatIndex);
    const targets = base.polygonTargets;
    const idealHalfToothArcMm = WORK.escapeTipRadiusMm * HALF_TOOTH;
    const referenceFollowMm = idealHalfToothArcMm * WORK.referenceFollowFraction;

    let previousRelease = 0;
    let followDistanceMm = 0;
    let weightedQuality = 0;
    let qualityDistance = 0;
    let impulseSamples = 0;
    let healthy = true;
    let maximumDropMm = 0;
    let bestResult = null;
    let bestQuality = -Infinity;

    for (let i = 0; i < WORK.sampleCount; i++) {
      const fraction = THREE.MathUtils.lerp(
        WORK.sampleStartBeatFraction,
        WORK.sampleEndBeatFraction,
        i / Math.max(1, WORK.sampleCount - 1)
      );
      const sample = sampleSwissLever((beatIndex + fraction) / BEATS_PER_SECOND);
      const result = base.solvePolygonAt(beatIndex, sample.palletAngle, 0);
      if (!result) continue;

      healthy = healthy && result.healthy;
      maximumDropMm = Math.max(maximumDropMm, result.dropGap ?? 0);
      const release = Math.max(previousRelease, result.releaseAngle ?? 0);
      const deltaAngle = Math.max(0, release - previousRelease);

      if (result.event?.startsWith('IMPULSE') && deltaAngle > 0) {
        const pathMm = WORK.escapeTipRadiusMm * deltaAngle;
        const quality = contactQualityFor(result, targets);
        followDistanceMm += pathMm;
        weightedQuality += quality * pathMm;
        qualityDistance += pathMm;
        impulseSamples += 1;
        if (quality > bestQuality) {
          bestQuality = quality;
          bestResult = result;
        }
      }
      previousRelease = release;
    }

    const contactQuality = qualityDistance > 0 ? clamp01(weightedQuality / qualityDistance) : 0;
    const pathCoverage = clamp01(followDistanceMm / Math.max(1e-6, referenceFollowMm));
    const transferEfficiency = polygonGate.admitted && healthy
      ? clamp01(pathCoverage * contactQuality)
      : 0;

    const budget = availableWorkFor(context);
    const availableWork = budget.availableWork;
    const deliveredWork = availableWork * transferEfficiency;
    const lostWork = Math.max(0, availableWork - deliveredWork);

    // M5f's historical kick is proportional to its legacy drive proxy. Convert
    // the new available-work budget back into a bounded velocity scale, then
    // multiply by sqrt(efficiency) because this bookkeeping is energy-like.
    const driveRatio = budget.legacyDrive > 1e-8
      ? THREE.MathUtils.clamp(availableWork / budget.legacyDrive, 0, WORK.maximumExternalDriveRatio)
      : 0;
    const impulseScale = transferEfficiency > 0
      ? Math.sqrt(transferEfficiency) * driveRatio
      : 0;
    const admitted =
      polygonGate.admitted &&
      healthy &&
      deliveredWork > 0 &&
      impulseScale >= WORK.minimumUsefulScale;

    let reason = 'DELIVERED · POLYGON WORK TRANSFER';
    if (!polygonGate.admitted) reason = polygonGate.reason;
    else if (!healthy) reason = 'REJECTED · UNHEALTHY POLYGON PATH';
    else if (followDistanceMm <= 0) reason = 'REJECTED · NO IMPULSE FOLLOWING DISTANCE';
    else if (contactQuality <= 0) reason = 'REJECTED · ZERO CONTACT QUALITY';
    else if (!admitted) reason = 'REJECTED · WORK BELOW USEFUL THRESHOLD';

    return {
      admitted,
      reason,
      beatIndex,
      fastForward: Boolean(context.fastForward),
      polygonGate,
      availableWork,
      deliveredWork,
      lostWork,
      workBudgetSource: budget.source,
      legacyDrive: budget.legacyDrive,
      driveRatio,
      transferEfficiency,
      impulseScale: admitted ? impulseScale : 0,
      followDistanceMm,
      idealHalfToothArcMm,
      referenceFollowMm,
      pathCoverage,
      contactQuality,
      impulseSamples,
      maximumDropMm,
      healthy,
      bestResult
    };
  }

  function syncUI(work) {
    if (!work) return;
    if (ui.available) ui.available.value = `${work.availableWork.toFixed(3)} work units`;
    if (ui.delivered) ui.delivered.value = `${work.deliveredWork.toFixed(3)} work units`;
    if (ui.lost) ui.lost.value = `${work.lostWork.toFixed(3)} work units`;
    if (ui.follow) ui.follow.value = `${work.followDistanceMm.toFixed(3)} mm`;
    if (ui.quality) ui.quality.value = `${(work.contactQuality * 100).toFixed(1)}%`;
    if (ui.efficiency) ui.efficiency.value = `${(work.transferEfficiency * 100).toFixed(1)}%`;
    if (ui.scale) ui.scale.value = `${work.impulseScale.toFixed(3)}×`;
    if (ui.verdict) ui.verdict.value = work.reason;
  }

  base.setImpulseAdmission(context => {
    const work = estimateImpulseWork(context);
    state.lastWork = work;
    state.opportunities += 1;

    if (!context.fastForward) {
      state.cumulativeAvailableWork += work.availableWork;
      state.cumulativeDeliveredWork += work.deliveredWork;
      state.cumulativeLostWork += work.lostWork;
      if (work.admitted) state.deliveredOpportunities += 1;
      else state.rejectedOpportunities += 1;
    }

    if (base.polygonState) {
      base.polygonState.lastAdmission = work;
      if (work.admitted) base.polygonState.admittedImpulses += 1;
      else base.polygonState.deniedImpulses += 1;
    }

    syncUI(work);
    return work;
  });

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const sample = base.update(mechanicalSeconds, escapeBase, running);
    if (state.lastWork) syncUI(state.lastWork);
    return {
      ...sample,
      impulseWork: state.lastWork,
      normalizedAvailableImpulseWork: state.lastWork?.availableWork ?? 0,
      normalizedDeliveredImpulseWork: state.lastWork?.deliveredWork ?? 0,
      normalizedLostImpulseWork: state.lastWork?.lostWork ?? 0,
      impulseTransferEfficiency: state.lastWork?.transferEfficiency ?? 0,
      impulseWorkScale: state.lastWork?.impulseScale ?? 0
    };
  }

  return {
    ...base,
    state: base.state,
    impulseWorkState: state,
    update,
    workTargets: { ...WORK },
    estimateImpulseWork,
    setImpulseWorkBudgetProvider(callback) {
      workBudgetProvider = typeof callback === 'function' ? callback : null;
    }
  };
}

export { sampleSwissLever };
