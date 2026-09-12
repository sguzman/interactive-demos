import * as THREE from 'three';
import {
  createEscapementSystem as createM5iEscapementSystem,
  sampleSwissLever
} from './escapement-m5i.js';

const TAU = Math.PI * 2;

// M6a is still normalized mechanics. These are reconstruction parameters, not
// measured ETA barrel torque, mainspring turns, gear-train efficiency, or load.
const BARREL = {
  fullReleaseDrumTurns: 8.0,
  lowTwistKnee: 0.12,
  plateauBaseTorque: 0.74,
  plateauLinearGain: 0.22,
  plateauQuadraticGain: 0.04,
  staticTrainLoad: 0.12,
  trainTransmissionEfficiency: 0.92
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function smoothstep01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function springTorqueForTwist(twist) {
  const x = clamp01(twist);
  if (x <= 0) return 0;

  // A flat-ish educational torque plateau with a deliberate falloff near the
  // final unwound region. This is shape-only, not a measured mainspring curve.
  const lowTwistSupport = smoothstep01(x / BARREL.lowTwistKnee);
  const plateau =
    BARREL.plateauBaseTorque +
    BARREL.plateauLinearGain * x +
    BARREL.plateauQuadraticGain * x * x;
  return clamp01(lowTwistSupport * plateau);
}

function trainDriveForTorque(torque) {
  const springTorque = clamp01(torque);
  const usableAboveLoad = Math.max(0, springTorque - BARREL.staticTrainLoad);
  const normalizedUsable = usableAboveLoad / Math.max(1e-6, 1 - BARREL.staticTrainLoad);
  return clamp01(normalizedUsable * BARREL.trainTransmissionEfficiency);
}

function injectUI(root) {
  if (root.querySelector('#barrelSystemSection')) return;
  const controls = root.querySelector('.controls');
  const work = root.querySelector('#impulseWorkSection');
  const polygon = root.querySelector('#polygonContactSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'barrelSystemSection';
  section.innerHTML = `
    <div class="section-title">Barrel → train power path · M6a</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Mainspring twist</span><output id="springTwistValue">0.0%</output></div>
      <div class="mode-stat"><span>Spring torque</span><output id="springTorqueValue">0.000 normalized</output></div>
      <div class="mode-stat"><span>Barrel arbor</span><output id="barrelArborValue">HELD · 0.00 turns</output></div>
      <div class="mode-stat"><span>Barrel drum release</span><output id="barrelDrumValue">0.00 turns</output></div>
      <div class="mode-stat"><span>Train load</span><output id="trainLoadValue">0.120 normalized</output></div>
      <div class="mode-stat"><span>Train transmission</span><output id="trainEfficiencyValue">92.0%</output></div>
      <div class="mode-stat"><span>Escapement drive</span><output id="escapementDriveValue">0.000 work units</output></div>
      <div class="mode-stat"><span>Power topology</span><output id="barrelTopologyValue">UNWOUND</output></div>
    </div>
    <div class="winding-note">M6a separates the two sides of a going barrel conceptually and visually. Winding rotates the arbor/ratchet while the drum is held; during running the click holds the arbor while the barrel drum releases in the opposite causal role. Normalized spring twist produces a reconstructed torque curve, then a fixed train load and transmission loss reduce that torque to the work budget arriving at M5i. The 8-drum-turn full-release mapping, torque curve, load and efficiency are educational reconstruction parameters—not ETA service data or measured torque.</div>`;

  if (work?.nextSibling) controls.insertBefore(section, work.nextSibling);
  else if (polygon?.nextSibling) controls.insertBefore(section, polygon.nextSibling);
  else controls.append(section);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M6A';
  if (subtitle) subtitle.textContent = 'separate barrel arbor winding + drum release + train-load work budget';
  if (loading) loading.textContent = 'Constructing 6497-2 M6a barrel / train power state…';
  if (hint) hint.textContent = 'M6a stops treating reserve itself as the escapement work source. Stored spring twist now produces normalized barrel torque; train load and transmission loss reduce it to the work budget delivered to M5i. The arbor remains the winding side while the barrel drum becomes the release side.';
  if (infoText) infoText.textContent = 'M6a introduces an explicit normalized barrel power state. Crown/ratchet motion belongs to the held arbor side; reserve consumption rotates the barrel drum, spring twist produces a reconstructed torque curve, and train load/transmission determine the work budget presented to the polygon escapement.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM5iEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  const windingSystem = powerSystem.windingSystem;
  const maxReserveSeconds = Math.max(1, windingSystem?.constants?.maxReserveSeconds ?? 60 * 3600);
  const barrelBaseAngle = windingSystem?.bases?.barrel ?? animated.barrel?.rotation.z ?? 0;

  const state = {
    springTwist: 0,
    springTorque: 0,
    arborTurns: 0,
    drumReleaseTurns: 0,
    drumAngle: 0,
    trainLoad: BARREL.staticTrainLoad,
    transmissionEfficiency: BARREL.trainTransmissionEfficiency,
    escapementDrive: 0,
    topology: 'unwound'
  };

  const ui = {
    twist: root.querySelector('#springTwistValue'),
    torque: root.querySelector('#springTorqueValue'),
    arbor: root.querySelector('#barrelArborValue'),
    drum: root.querySelector('#barrelDrumValue'),
    load: root.querySelector('#trainLoadValue'),
    efficiency: root.querySelector('#trainEfficiencyValue'),
    drive: root.querySelector('#escapementDriveValue'),
    topology: root.querySelector('#barrelTopologyValue')
  };

  function refreshPowerState() {
    const energy = clamp01(windingSystem?.state?.energy ?? 0);
    const consumedSeconds = Math.max(0, powerSystem?.state?.totalConsumedSeconds ?? 0);
    state.springTwist = energy;
    state.springTorque = springTorqueForTwist(energy);
    state.arborTurns = (windingSystem?.state?.ratchetAngle ?? 0) / TAU;
    state.drumReleaseTurns = consumedSeconds / maxReserveSeconds * BARREL.fullReleaseDrumTurns;
    state.drumAngle = -state.drumReleaseTurns * TAU;
    state.escapementDrive = trainDriveForTorque(state.springTorque);

    const winding = (windingSystem?.state?.input ?? 0) > 0;
    const running = Boolean(powerSystem?.state?.running);
    if (energy <= 0) state.topology = 'unwound';
    else if (winding && running) state.topology = 'arbor winding + drum releasing';
    else if (winding) state.topology = 'arbor winding · drum held';
    else if (running) state.topology = 'arbor held · drum releasing';
    else state.topology = 'arbor held · drum held';
  }

  function syncUI() {
    if (ui.twist) ui.twist.value = `${(state.springTwist * 100).toFixed(1)}%`;
    if (ui.torque) ui.torque.value = `${state.springTorque.toFixed(3)} normalized`;
    if (ui.arbor) {
      const action = (windingSystem?.state?.input ?? 0) > 0 ? 'WINDING' : 'HELD BY CLICK';
      ui.arbor.value = `${action} · ${state.arborTurns.toFixed(2)} turns`;
    }
    if (ui.drum) ui.drum.value = `${state.drumReleaseTurns.toFixed(2)} turns`;
    if (ui.load) ui.load.value = `${state.trainLoad.toFixed(3)} normalized`;
    if (ui.efficiency) ui.efficiency.value = `${(state.transmissionEfficiency * 100).toFixed(1)}%`;
    if (ui.drive) ui.drive.value = `${state.escapementDrive.toFixed(3)} work units`;
    if (ui.topology) ui.topology.value = state.topology.toUpperCase();
  }

  // M5i previously used M5f's reserve-derived drive proxy as its available-work
  // budget. M6a replaces that budget with post-load barrel/train drive. M5i then
  // rescales the M5f Δω packet so the old reserve proxy cancels out of the final
  // detailed/fast-forward impulse magnitude.
  base.setImpulseWorkBudgetProvider?.(() => ({
    availableWork: state.escapementDrive,
    source: 'M6a spring torque → train load → transmission'
  }));

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    refreshPowerState();
    const sample = base.update(mechanicalSeconds, escapeBase, running);

    // In a going barrel the arbor is held by the click during release while the
    // drum turns. The older winding layer intentionally keeps the drum static;
    // M6a applies the release-side angle after that layer has updated each frame.
    if (animated.barrel) animated.barrel.rotation.z = barrelBaseAngle + state.drumAngle;

    refreshPowerState();
    syncUI();

    return {
      ...sample,
      barrelState: { ...state },
      springTwist: state.springTwist,
      springTorque: state.springTorque,
      trainLoad: state.trainLoad,
      trainTransmissionEfficiency: state.transmissionEfficiency,
      escapementDrive: state.escapementDrive,
      barrelArborTurns: state.arborTurns,
      barrelDrumReleaseTurns: state.drumReleaseTurns
    };
  }

  refreshPowerState();
  syncUI();

  return {
    ...base,
    state: base.state,
    barrelState: state,
    update,
    constants: {
      ...(base.constants ?? {}),
      fullReleaseDrumTurns: BARREL.fullReleaseDrumTurns,
      lowTwistKnee: BARREL.lowTwistKnee,
      staticTrainLoad: BARREL.staticTrainLoad,
      trainTransmissionEfficiency: BARREL.trainTransmissionEfficiency
    },
    springTorqueForTwist,
    trainDriveForTorque
  };
}

export { sampleSwissLever };
