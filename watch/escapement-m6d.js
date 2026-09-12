import {
  createEscapementSystem as createM6cEscapementSystem,
  sampleSwissLever
} from './escapement-m6c.js';

// M6d is a normalized system coordinator. It does not add fake manufacturing
// precision; it makes the already-modeled states agree on one operating mode,
// introduces torque-stall hysteresis, and exposes end-to-end efficiency/loss.
const SYSTEM = {
  torqueStallEnterMargin: 0.018,
  torqueStallReleaseMargin: 0.055,
  closureTolerance: 1e-6
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function injectUI(root) {
  if (root.querySelector('#systemClosureSection')) return;
  const controls = root.querySelector('.controls');
  const ledger = root.querySelector('#workLedgerSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'systemClosureSection';
  section.innerHTML = `
    <div class="section-title">Closed-loop movement state · M6d</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Operating mode</span><output id="systemModeValue">UNWOUND</output></div>
      <div class="mode-stat"><span>Torque stall latch</span><output id="torqueLatchValue">OPEN</output></div>
      <div class="mode-stat"><span>Balance energy proxy</span><output id="balanceEnergyProxyValue">0.0%</output></div>
      <div class="mode-stat"><span>End-to-end delivery</span><output id="systemDeliveryValue">0.0%</output></div>
      <div class="mode-stat"><span>Total modeled loss</span><output id="systemLossValue">0.0%</output></div>
      <div class="mode-stat"><span>Drive / load ratio</span><output id="driveLoadRatioValue">0.00×</output></div>
      <div class="mode-stat"><span>Power reserve</span><output id="systemReserveValue">0.0%</output></div>
      <div class="mode-stat"><span>Causal closure</span><output id="causalClosureValue">WAITING</output></div>
    </div>
    <div class="winding-note">M6d is the current normalized system-closure pass. It does not pretend the watch is now factory-calibrated physics. Instead, barrel torque, dynamic train load, polygonal escapement work, oscillator state, reserve and failure modes are read as one system. A hysteretic torque-stall latch prevents chatter: once load collapses the drive margin, the train remains held until winding or load relief restores a larger release margin.</div>`;

  if (ledger?.nextSibling) controls.insertBefore(section, ledger.nextSibling);
  else controls.append(section);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M6D';
  if (subtitle) subtitle.textContent = 'closed-loop normalized movement: barrel → load → escapement work → oscillator → train';
  if (loading) loading.textContent = 'Constructing 6497-2 M6d closed-loop movement state…';
  if (hint) hint.textContent = 'M6d closes the normalized architecture: winding changes spring state; spring torque competes with a demand-derived train load; the surviving drive becomes polygonal escapement work; delivered work replenishes an integrated oscillator; geometry releases the train; failed geometry, low amplitude or insufficient torque can hold the movement with their own explicit state.';
  if (infoText) infoText.textContent = 'M6d presents the reconstructed movement as one closed-loop normalized system. It reconciles power-source state, dynamic reaction load, finite escapement contact/work, oscillator state, release timing, reserve, losses and explicit stall modes without claiming production-calibrated ETA torque or inertia.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM6cEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  const windingSystem = powerSystem.windingSystem;
  const inheritedAdvance = powerSystem.advance.bind(powerSystem);

  const state = {
    mode: 'unwound',
    torqueStallLatched: false,
    balanceEnergyProxy: 0,
    endToEndDelivery: 0,
    modeledLossFraction: 0,
    driveLoadRatio: 0,
    reserve: 0,
    closureHealthy: true,
    closureResidual: 0,
    lastBlockReason: ''
  };

  const ui = {
    mode: root.querySelector('#systemModeValue'),
    latch: root.querySelector('#torqueLatchValue'),
    balanceEnergy: root.querySelector('#balanceEnergyProxyValue'),
    delivery: root.querySelector('#systemDeliveryValue'),
    loss: root.querySelector('#systemLossValue'),
    ratio: root.querySelector('#driveLoadRatioValue'),
    reserve: root.querySelector('#systemReserveValue'),
    closure: root.querySelector('#causalClosureValue')
  };

  function refreshSystemState() {
    // Winding can change spring torque before the escapement update for this
    // frame. Refresh M6b first so the hysteresis decision uses current torque /
    // load rather than a one-frame-old margin and can unlatch immediately after
    // sufficient winding.
    base.refreshLoadFeedback?.();

    const reserve = clamp01(windingSystem?.state?.energy ?? 0);
    const feedback = base.loadFeedbackState;
    const ledger = base.workLedgerState;
    const oscillator = base.state;
    const torque = Math.max(0, base.barrelState?.springTorque ?? 0);
    const load = Math.max(0, feedback?.trainLoad ?? 0);
    const margin = feedback?.driveMargin ?? (torque - load);

    if (state.torqueStallLatched) {
      if (margin >= SYSTEM.torqueStallReleaseMargin || reserve <= 0) state.torqueStallLatched = false;
    } else if (reserve > 0 && margin <= SYSTEM.torqueStallEnterMargin) {
      state.torqueStallLatched = true;
    }

    const amplitude = clamp01(oscillator?.amplitude ?? 0);
    state.balanceEnergyProxy = clamp01(amplitude * amplitude);
    state.reserve = reserve;
    state.driveLoadRatio = load > 1e-8 ? torque / load : (torque > 0 ? Infinity : 0);

    const springBudget = Math.max(0, ledger?.springBudget ?? 0);
    const delivered = Math.max(0, ledger?.balanceDelivered ?? 0);
    const losses = Math.max(0, (ledger?.trainLoss ?? 0) + (ledger?.contactLoss ?? 0));
    state.endToEndDelivery = springBudget > 1e-8 ? clamp01(delivered / springBudget) : 0;
    state.modeledLossFraction = springBudget > 1e-8 ? clamp01(losses / springBudget) : 0;
    state.closureResidual = Number(ledger?.residual ?? 0);
    state.closureHealthy = Math.abs(state.closureResidual) <= SYSTEM.closureTolerance;
    state.lastBlockReason = powerSystem.state.blockReason || '';

    const winding = (windingSystem?.state?.input ?? 0) > 0;
    if (reserve <= 0) state.mode = 'unwound';
    else if (state.torqueStallLatched) state.mode = 'torque stall';
    else if (powerSystem.state.blockReason?.includes('GEOMETRY')) state.mode = 'geometry blocked';
    else if (powerSystem.state.blockReason?.includes('AMPLITUDE')) state.mode = 'oscillator stalled';
    else if (powerSystem.state.status === 'stalled') state.mode = 'escapement held';
    else if (winding && powerSystem.state.running) state.mode = 'winding while running';
    else if (winding) state.mode = 'winding';
    else if (powerSystem.state.status === 'paused') state.mode = 'paused';
    else if (powerSystem.state.running) state.mode = 'running';
    else state.mode = 'charged · held';
  }

  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    refreshSystemState();
    const scale = Math.max(0, Number(mechanicalScale) || 0);
    if (state.torqueStallLatched && state.reserve > 0 && scale > 0) {
      return powerSystem.hold(scale, 'TORQUE BACKPRESSURE LATCH');
    }
    return inheritedAdvance(realSeconds, scale);
  };

  function syncUI() {
    if (ui.mode) ui.mode.value = state.mode.toUpperCase();
    if (ui.latch) ui.latch.value = state.torqueStallLatched ? 'LATCHED · WIND / RELIEVE LOAD' : 'OPEN';
    if (ui.balanceEnergy) ui.balanceEnergy.value = `${(state.balanceEnergyProxy * 100).toFixed(1)}% normalized`;
    if (ui.delivery) ui.delivery.value = `${(state.endToEndDelivery * 100).toFixed(1)}%`;
    if (ui.loss) ui.loss.value = `${(state.modeledLossFraction * 100).toFixed(1)}%`;
    if (ui.ratio) ui.ratio.value = Number.isFinite(state.driveLoadRatio) ? `${state.driveLoadRatio.toFixed(2)}×` : '∞';
    if (ui.reserve) ui.reserve.value = `${(state.reserve * 100).toFixed(1)}%`;
    if (ui.closure) ui.closure.value = state.closureHealthy
      ? `CLOSED · ${state.closureResidual >= 0 ? '+' : ''}${state.closureResidual.toFixed(6)}`
      : `CHECK · ${state.closureResidual >= 0 ? '+' : ''}${state.closureResidual.toFixed(6)}`;
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    refreshSystemState();
    const sample = base.update(mechanicalSeconds, escapeBase, running);
    refreshSystemState();
    syncUI();
    return {
      ...sample,
      systemState: { ...state },
      operatingMode: state.mode,
      torqueStallLatched: state.torqueStallLatched,
      normalizedBalanceEnergy: state.balanceEnergyProxy,
      endToEndDelivery: state.endToEndDelivery,
      modeledLossFraction: state.modeledLossFraction
    };
  }

  refreshSystemState();
  syncUI();

  return {
    ...base,
    state: base.state,
    systemState: state,
    update,
    systemConstants: { ...SYSTEM },
    refreshSystemState
  };
}

export { sampleSwissLever };
