import {
  createEscapementSystem as createM6dEscapementSystem,
  sampleSwissLever
} from './escapement-m6d.js';

// M6e decomposes the aggregate reaction load into named train stages using the
// reconstructed 6497 tooth-count topology. The coefficients remain normalized
// educational loss/load values, not measured tooth forces or efficiencies.
const STAGES = {
  centerThird: { label: 'Centre 80 → third pinion 10', baseLoad: 0.012, efficiency: 0.991 },
  thirdFourth: { label: 'Third 60 → fourth pinion 8', baseLoad: 0.011, efficiency: 0.989 },
  fourthEscape: { label: 'Fourth 120 → escape pinion 10', baseLoad: 0.013, efficiency: 0.986 },
  pivotsJewels: { label: 'Staff pivots / jewels', baseLoad: 0.014, efficiency: 0.992 },
  displayMotion: { label: 'Motion works / display', baseLoad: 0.008, efficiency: 0.995 },
  escapementBase: { label: 'Escapement standing demand', baseLoad: 0.017, efficiency: 1.0 }
};

const DYNAMIC = {
  runningDemand: 0.022,
  deliveredWorkGain: 0.13,
  rejectedWorkGain: 0.20,
  lowAmplitudeGain: 0.05,
  geometryPenalty: 0.16,
  stalledPenalty: 0.12
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function compoundedTransmission() {
  return Object.values(STAGES).reduce((product, stage) => product * stage.efficiency, 1);
}

function injectUI(root) {
  if (root.querySelector('#stageLoadSection')) return;
  const controls = root.querySelector('.controls');
  const closure = root.querySelector('#systemClosureSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'stageLoadSection';
  section.innerHTML = `
    <div class="section-title">Stage-resolved train path · M6e</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Centre → third load</span><output id="stageCenterThirdValue">0.012</output></div>
      <div class="mode-stat"><span>Third → fourth load</span><output id="stageThirdFourthValue">0.011</output></div>
      <div class="mode-stat"><span>Fourth → escape load</span><output id="stageFourthEscapeValue">0.013</output></div>
      <div class="mode-stat"><span>Pivot / jewel load</span><output id="stagePivotValue">0.014</output></div>
      <div class="mode-stat"><span>Motion-works load</span><output id="stageDisplayValue">0.008</output></div>
      <div class="mode-stat"><span>Escapement + feedback</span><output id="stageEscapementValue">0.017</output></div>
      <div class="mode-stat"><span>Compounded mesh ceiling</span><output id="stageTransmissionValue">0.0%</output></div>
      <div class="mode-stat"><span>Total target load</span><output id="stageTotalLoadValue">0.075</output></div>
    </div>
    <div class="winding-note">M6e decomposes the upstream reaction load into named train stages instead of leaving it as one anonymous scalar. The three wheel/pinion stages use the active reconstructed tooth-count topology (80→10, 60→8, 120→10), with separate pivot/jewel, display and escapement contributions. Stage efficiencies compound into the transmission ceiling, while running demand, rejected work, low amplitude and blocked geometry are added mainly at the escapement/load side. These remain normalized educational coefficients, not measured tooth friction or force.</div>`;

  if (closure?.nextSibling) controls.insertBefore(section, closure.nextSibling);
  else controls.append(section);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M6E';
  if (subtitle) subtitle.textContent = 'stage-resolved train losses inside the closed-loop normalized movement';
  if (loading) loading.textContent = 'Constructing 6497-2 M6e stage-resolved power path…';
  if (hint) hint.textContent = 'M6e resolves the M6 train load into the actual reconstructed centre→third→fourth→escape topology plus pivots, motion works and escapement demand. Those stage loads and compounded stage efficiencies now feed the same M6b/M6d feedback and torque-stall loop.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM6dEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  const state = {
    centerThird: STAGES.centerThird.baseLoad,
    thirdFourth: STAGES.thirdFourth.baseLoad,
    fourthEscape: STAGES.fourthEscape.baseLoad,
    pivotsJewels: STAGES.pivotsJewels.baseLoad,
    displayMotion: STAGES.displayMotion.baseLoad,
    escapement: STAGES.escapementBase.baseLoad,
    dynamicRunning: 0,
    dynamicDelivered: 0,
    dynamicRejected: 0,
    dynamicLowAmplitude: 0,
    dynamicGeometry: 0,
    dynamicStall: 0,
    totalLoad: 0.075,
    transmissionCeiling: compoundedTransmission(),
    source: 'M6e stage-resolved train topology'
  };

  const ui = {
    centerThird: root.querySelector('#stageCenterThirdValue'),
    thirdFourth: root.querySelector('#stageThirdFourthValue'),
    fourthEscape: root.querySelector('#stageFourthEscapeValue'),
    pivots: root.querySelector('#stagePivotValue'),
    display: root.querySelector('#stageDisplayValue'),
    escapement: root.querySelector('#stageEscapementValue'),
    transmission: root.querySelector('#stageTransmissionValue'),
    total: root.querySelector('#stageTotalLoadValue')
  };

  function buildLoadModel(context) {
    const work = context.work;
    state.dynamicRunning = context.running ? DYNAMIC.runningDemand : 0;
    state.dynamicDelivered = DYNAMIC.deliveredWorkGain * clamp01(work?.deliveredWork ?? 0);
    state.dynamicRejected = DYNAMIC.rejectedWorkGain * clamp01(work?.lostWork ?? 0);
    state.dynamicLowAmplitude = context.running ? DYNAMIC.lowAmplitudeGain * (1 - clamp01(context.amplitude ?? 0)) : 0;
    state.dynamicGeometry = context.geometryHealthy ? 0 : DYNAMIC.geometryPenalty;
    state.dynamicStall = context.powerStatus === 'stalled' ? DYNAMIC.stalledPenalty : 0;

    state.centerThird = STAGES.centerThird.baseLoad;
    state.thirdFourth = STAGES.thirdFourth.baseLoad;
    state.fourthEscape = STAGES.fourthEscape.baseLoad;
    state.pivotsJewels = STAGES.pivotsJewels.baseLoad;
    state.displayMotion = STAGES.displayMotion.baseLoad;
    state.escapement =
      STAGES.escapementBase.baseLoad +
      state.dynamicRunning +
      state.dynamicDelivered +
      state.dynamicRejected +
      state.dynamicLowAmplitude +
      state.dynamicGeometry +
      state.dynamicStall;

    state.totalLoad =
      state.centerThird +
      state.thirdFourth +
      state.fourthEscape +
      state.pivotsJewels +
      state.displayMotion +
      state.escapement;
    state.transmissionCeiling = compoundedTransmission();

    return {
      targetLoad: state.totalLoad,
      transmissionCeiling: state.transmissionCeiling,
      source: state.source
    };
  }

  base.setLoadModelProvider?.(buildLoadModel);

  function syncUI() {
    if (ui.centerThird) ui.centerThird.value = state.centerThird.toFixed(3);
    if (ui.thirdFourth) ui.thirdFourth.value = state.thirdFourth.toFixed(3);
    if (ui.fourthEscape) ui.fourthEscape.value = state.fourthEscape.toFixed(3);
    if (ui.pivots) ui.pivots.value = state.pivotsJewels.toFixed(3);
    if (ui.display) ui.display.value = state.displayMotion.toFixed(3);
    if (ui.escapement) ui.escapement.value = state.escapement.toFixed(3);
    if (ui.transmission) ui.transmission.value = `${(state.transmissionCeiling * 100).toFixed(1)}%`;
    if (ui.total) ui.total.value = `${state.totalLoad.toFixed(3)} normalized`;
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const sample = base.update(mechanicalSeconds, escapeBase, running);
    syncUI();
    return {
      ...sample,
      stageLoadState: { ...state },
      stageResolvedTargetLoad: state.totalLoad,
      stageTransmissionCeiling: state.transmissionCeiling
    };
  }

  syncUI();

  return {
    ...base,
    state: base.state,
    stageLoadState: state,
    update,
    stageConstants: JSON.parse(JSON.stringify(STAGES)),
    stageDynamicConstants: { ...DYNAMIC }
  };
}

export { sampleSwissLever };
