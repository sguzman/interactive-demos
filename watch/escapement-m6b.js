import * as THREE from 'three';
import {
  createEscapementSystem as createM6aEscapementSystem,
  sampleSwissLever
} from './escapement-m6a.js';

// M6b keeps the M6a torque source but lets downstream mechanical demand feed
// back into the load seen by the barrel. Values remain normalized educational
// reconstruction parameters rather than measured ETA friction/torque data.
const FEEDBACK = {
  baseLoad: 0.075,
  runningLoad: 0.035,
  impulseDemandGain: 0.20,
  rejectedWorkGain: 0.24,
  lowAmplitudeGain: 0.08,
  geometryPenalty: 0.18,
  stalledPenalty: 0.16,
  loadMin: 0.055,
  loadMax: 0.62,
  nominalTransmission: 0.94,
  loadTransmissionLoss: 0.16,
  feedbackSmoothing: 0.18,
  minimumDriveMargin: 0.018
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function injectUI(root) {
  if (root.querySelector('#loadFeedbackSection')) return;
  const controls = root.querySelector('.controls');
  const barrel = root.querySelector('#barrelSystemSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'loadFeedbackSection';
  section.innerHTML = `
    <div class="section-title">Train load feedback · M6b</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Demand load</span><output id="dynamicTrainLoadValue">0.075 normalized</output></div>
      <div class="mode-stat"><span>Drive margin</span><output id="driveMarginValue">0.000 normalized</output></div>
      <div class="mode-stat"><span>Transmission</span><output id="dynamicTransmissionValue">94.0%</output></div>
      <div class="mode-stat"><span>Post-load drive</span><output id="dynamicDriveValue">0.000 work units</output></div>
      <div class="mode-stat"><span>Impulse demand</span><output id="impulseDemandValue">0.0%</output></div>
      <div class="mode-stat"><span>Rejected-work backpressure</span><output id="backpressureValue">0.0%</output></div>
      <div class="mode-stat"><span>Geometry penalty</span><output id="geometryPenaltyValue">OFF</output></div>
      <div class="mode-stat"><span>Load verdict</span><output id="loadVerdictValue">UNWOUND</output></div>
    </div>
    <div class="winding-note">M6b closes the first upstream feedback loop. The barrel no longer sees one fixed train load: recent escapement demand, rejected work, low oscillator amplitude, geometry blockage and stall state all contribute to a smoothed reaction load. That load reduces torque margin and transmission. If the margin collapses below the reconstruction threshold, the power gate holds with reserve still present instead of draining through an impossible stalled train.</div>`;

  if (barrel?.nextSibling) controls.insertBefore(section, barrel.nextSibling);
  else controls.append(section);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M6B';
  if (subtitle) subtitle.textContent = 'closed-loop barrel torque ↔ train / escapement demand feedback';
  if (loading) loading.textContent = 'Constructing 6497-2 M6b load-feedback state…';
  if (hint) hint.textContent = 'M6b lets downstream demand push back upstream. Escapement work demand, rejected contact work, low amplitude and geometry faults raise train load; that load reduces transmission and usable barrel drive, and insufficient torque margin can stall the power gate while reserve remains.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM6aEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  const windingSystem = powerSystem.windingSystem;
  const inheritedAdvance = powerSystem.advance.bind(powerSystem);

  const state = {
    targetLoad: FEEDBACK.baseLoad,
    trainLoad: FEEDBACK.baseLoad,
    transmissionEfficiency: FEEDBACK.nominalTransmission,
    driveMargin: 0,
    escapementDrive: 0,
    impulseDemand: 0,
    backpressure: 0,
    amplitudePenalty: 0,
    geometryPenalty: 0,
    stalledPenalty: 0,
    verdict: 'unwound',
    initialized: false
  };

  const ui = {
    load: root.querySelector('#dynamicTrainLoadValue'),
    margin: root.querySelector('#driveMarginValue'),
    transmission: root.querySelector('#dynamicTransmissionValue'),
    drive: root.querySelector('#dynamicDriveValue'),
    demand: root.querySelector('#impulseDemandValue'),
    backpressure: root.querySelector('#backpressureValue'),
    geometry: root.querySelector('#geometryPenaltyValue'),
    verdict: root.querySelector('#loadVerdictValue')
  };

  function springTorque() {
    const twist = clamp01(windingSystem?.state?.energy ?? 0);
    return base.springTorqueForTwist?.(twist) ?? clamp01(base.barrelState?.springTorque ?? twist);
  }

  function deriveDemand() {
    const work = base.impulseWorkState?.lastWork;
    const oscillator = base.state;
    const geometryHealthy = base.polygonState?.lastResult?.healthy !== false;
    const running = Boolean(powerSystem.state.running);

    state.impulseDemand = clamp01(work?.deliveredWork ?? 0);
    state.backpressure = clamp01(work?.lostWork ?? 0);
    const amplitude = clamp01(oscillator?.amplitude ?? 0);
    state.amplitudePenalty = running ? (1 - amplitude) * FEEDBACK.lowAmplitudeGain : 0;
    state.geometryPenalty = geometryHealthy ? 0 : FEEDBACK.geometryPenalty;
    state.stalledPenalty = powerSystem.state.status === 'stalled' ? FEEDBACK.stalledPenalty : 0;

    const target =
      FEEDBACK.baseLoad +
      (running ? FEEDBACK.runningLoad : 0) +
      FEEDBACK.impulseDemandGain * state.impulseDemand +
      FEEDBACK.rejectedWorkGain * state.backpressure +
      state.amplitudePenalty +
      state.geometryPenalty +
      state.stalledPenalty;

    state.targetLoad = THREE.MathUtils.clamp(target, FEEDBACK.loadMin, FEEDBACK.loadMax);
    if (!state.initialized) {
      state.trainLoad = state.targetLoad;
      state.initialized = true;
    } else {
      state.trainLoad = THREE.MathUtils.lerp(state.trainLoad, state.targetLoad, FEEDBACK.feedbackSmoothing);
    }
  }

  function deriveDrive() {
    const torque = springTorque();
    state.driveMargin = torque - state.trainLoad;
    const loadRatio = clamp01(state.trainLoad / Math.max(1e-6, torque));
    state.transmissionEfficiency = THREE.MathUtils.clamp(
      FEEDBACK.nominalTransmission - FEEDBACK.loadTransmissionLoss * loadRatio,
      0.55,
      FEEDBACK.nominalTransmission
    );
    const usable = Math.max(0, state.driveMargin);
    state.escapementDrive = clamp01(usable / Math.max(1e-6, 1 - FEEDBACK.baseLoad) * state.transmissionEfficiency);

    if ((windingSystem?.state?.energy ?? 0) <= 0) state.verdict = 'unwound';
    else if (state.geometryPenalty > 0) state.verdict = 'geometry backpressure';
    else if (state.driveMargin <= FEEDBACK.minimumDriveMargin) state.verdict = 'torque limited';
    else if (powerSystem.state.status === 'stalled') state.verdict = 'escapement stalled';
    else if (powerSystem.state.running) state.verdict = 'load accepted';
    else state.verdict = 'loaded · held';

    if (base.barrelState) {
      base.barrelState.trainLoad = state.trainLoad;
      base.barrelState.transmissionEfficiency = state.transmissionEfficiency;
      base.barrelState.escapementDrive = state.escapementDrive;
    }
  }

  function refreshFeedback() {
    deriveDemand();
    deriveDrive();
  }

  // Replace M6a's static work budget with the closed-loop drive after dynamic
  // reaction load and load-dependent transmission have been applied.
  base.setImpulseWorkBudgetProvider?.(() => ({
    availableWork: state.escapementDrive,
    source: 'M6b barrel torque → dynamic reaction load → transmission'
  }));

  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    refreshFeedback();
    const scale = Math.max(0, Number(mechanicalScale) || 0);
    const energy = windingSystem?.state?.energy ?? 0;
    if (
      energy > 0 &&
      scale > 0 &&
      state.initialized &&
      state.driveMargin <= FEEDBACK.minimumDriveMargin
    ) {
      return powerSystem.hold(scale, 'TRAIN TORQUE MARGIN');
    }
    return inheritedAdvance(realSeconds, scale);
  };

  function syncUI() {
    if (ui.load) ui.load.value = `${state.trainLoad.toFixed(3)} normalized`;
    if (ui.margin) ui.margin.value = `${state.driveMargin >= 0 ? '+' : ''}${state.driveMargin.toFixed(3)} normalized`;
    if (ui.transmission) ui.transmission.value = `${(state.transmissionEfficiency * 100).toFixed(1)}%`;
    if (ui.drive) ui.drive.value = `${state.escapementDrive.toFixed(3)} work units`;
    if (ui.demand) ui.demand.value = `${(state.impulseDemand * 100).toFixed(1)}%`;
    if (ui.backpressure) ui.backpressure.value = `${(state.backpressure * 100).toFixed(1)}%`;
    if (ui.geometry) ui.geometry.value = state.geometryPenalty > 0 ? 'ACTIVE' : 'OFF';
    if (ui.verdict) ui.verdict.value = state.verdict.toUpperCase();
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    refreshFeedback();
    const sample = base.update(mechanicalSeconds, escapeBase, running);
    refreshFeedback();
    syncUI();
    return {
      ...sample,
      loadFeedback: { ...state },
      dynamicTrainLoad: state.trainLoad,
      trainDriveMargin: state.driveMargin,
      dynamicTransmissionEfficiency: state.transmissionEfficiency,
      closedLoopEscapementDrive: state.escapementDrive
    };
  }

  refreshFeedback();
  syncUI();

  return {
    ...base,
    state: base.state,
    loadFeedbackState: state,
    update,
    feedbackConstants: { ...FEEDBACK },
    refreshLoadFeedback: refreshFeedback
  };
}

export { sampleSwissLever };
