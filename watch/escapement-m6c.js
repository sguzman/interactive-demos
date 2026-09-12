import {
  createEscapementSystem as createM6bEscapementSystem,
  sampleSwissLever
} from './escapement-m6b.js';

// M6c closes the bookkeeping around one normalized impulse opportunity. None of
// these values are joules. They are deliberately dimensionless shares of the
// same educational opportunity budget so losses and delivery can be reconciled.
const LEDGER = {
  modeledSpringRelativeTurnsAtFull: 8.0,
  residualTolerance: 1e-8
};

function injectUI(root) {
  if (root.querySelector('#workLedgerSection')) return;
  const controls = root.querySelector('.controls');
  const feedback = root.querySelector('#loadFeedbackSection');
  if (!controls) return;

  const section = root.createElement('section');
  section.id = 'workLedgerSection';
  section.innerHTML = `
    <div class="section-title">Shared work ledger · M6c</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Spring-side budget</span><output id="ledgerSpringValue">0.000 units</output></div>
      <div class="mode-stat"><span>Train-side available</span><output id="ledgerTrainValue">0.000 units</output></div>
      <div class="mode-stat"><span>Train / load loss</span><output id="ledgerTrainLossValue">0.000 units</output></div>
      <div class="mode-stat"><span>Contact loss</span><output id="ledgerContactLossValue">0.000 units</output></div>
      <div class="mode-stat"><span>Balance delivered</span><output id="ledgerBalanceValue">0.000 units</output></div>
      <div class="mode-stat"><span>Ledger residual</span><output id="ledgerResidualValue">0.000000</output></div>
      <div class="mode-stat"><span>Spring differential</span><output id="springDifferentialValue">0.00 turns</output></div>
      <div class="mode-stat"><span>Ledger events</span><output id="ledgerEventCountValue">0</output></div>
    </div>
    <div class="winding-note">M6c puts the M6 power path into one reconciled normalized ledger. For each detailed escapement opportunity it records a spring-side budget, the portion surviving train/load losses, the portion lost at polygonal escapement transfer, and the portion delivered to the oscillator. The arithmetic residual is shown explicitly as a consistency check. “Spring differential turns” is a normalized 8-turn presentation mapping from current twist—not a measured 6497-2 mainspring turn count.</div>`;

  if (feedback?.nextSibling) controls.insertBefore(section, feedback.nextSibling);
  else controls.append(section);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M6C';
  if (subtitle) subtitle.textContent = 'shared normalized work ledger across spring → train → escapement → balance';
  if (loading) loading.textContent = 'Constructing 6497-2 M6c shared work ledger…';
  if (hint) hint.textContent = 'M6c reconciles the normalized power chain at every detailed impulse opportunity: spring-side budget = train/load loss + contact loss + balance-delivered work. The ledger residual is exposed so the educational model cannot silently create or destroy bookkeeping work between layers.';
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM6bEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  let lastOpportunityCount = base.impulseWorkState?.opportunities ?? 0;

  const state = {
    events: 0,
    springBudget: 0,
    trainAvailable: 0,
    trainLoss: 0,
    contactLoss: 0,
    balanceDelivered: 0,
    residual: 0,
    springDifferentialTurns: 0,
    cumulativeSpringBudget: 0,
    cumulativeTrainLoss: 0,
    cumulativeContactLoss: 0,
    cumulativeBalanceDelivered: 0,
    cumulativeResidual: 0,
    healthy: true
  };

  const ui = {
    spring: root.querySelector('#ledgerSpringValue'),
    train: root.querySelector('#ledgerTrainValue'),
    trainLoss: root.querySelector('#ledgerTrainLossValue'),
    contactLoss: root.querySelector('#ledgerContactLossValue'),
    balance: root.querySelector('#ledgerBalanceValue'),
    residual: root.querySelector('#ledgerResidualValue'),
    springTurns: root.querySelector('#springDifferentialValue'),
    events: root.querySelector('#ledgerEventCountValue')
  };

  function updateSpringDifferential() {
    const twist = Math.max(0, Math.min(1, base.barrelState?.springTwist ?? powerSystem.windingSystem?.state?.energy ?? 0));
    state.springDifferentialTurns = twist * LEDGER.modeledSpringRelativeTurnsAtFull;
  }

  function captureOpportunity() {
    const workState = base.impulseWorkState;
    const count = workState?.opportunities ?? 0;
    if (count <= lastOpportunityCount) return;
    lastOpportunityCount = count;

    const work = workState?.lastWork;
    if (!work || work.fastForward) return;

    // M6b's spring torque is the normalized source budget at this opportunity.
    // M5i availableWork is the budget after train/load/transmission. Because the
    // layers share normalized 0..1 opportunity units, the difference is the
    // educational upstream loss. Contact loss is already explicit in M5i.
    state.springBudget = Math.max(0, base.barrelState?.springTorque ?? 0);
    state.trainAvailable = Math.max(0, work.availableWork ?? 0);
    state.trainLoss = Math.max(0, state.springBudget - state.trainAvailable);
    state.contactLoss = Math.max(0, work.lostWork ?? 0);
    state.balanceDelivered = Math.max(0, work.deliveredWork ?? 0);
    state.residual = state.springBudget - state.trainLoss - state.contactLoss - state.balanceDelivered;
    state.healthy = Math.abs(state.residual) <= LEDGER.residualTolerance;
    state.events += 1;

    state.cumulativeSpringBudget += state.springBudget;
    state.cumulativeTrainLoss += state.trainLoss;
    state.cumulativeContactLoss += state.contactLoss;
    state.cumulativeBalanceDelivered += state.balanceDelivered;
    state.cumulativeResidual += state.residual;
  }

  function syncUI() {
    if (ui.spring) ui.spring.value = `${state.springBudget.toFixed(3)} units`;
    if (ui.train) ui.train.value = `${state.trainAvailable.toFixed(3)} units`;
    if (ui.trainLoss) ui.trainLoss.value = `${state.trainLoss.toFixed(3)} units`;
    if (ui.contactLoss) ui.contactLoss.value = `${state.contactLoss.toFixed(3)} units`;
    if (ui.balance) ui.balance.value = `${state.balanceDelivered.toFixed(3)} units`;
    if (ui.residual) ui.residual.value = `${state.residual >= 0 ? '+' : ''}${state.residual.toFixed(6)} · ${state.healthy ? 'CLOSED' : 'CHECK'}`;
    if (ui.springTurns) ui.springTurns.value = `${state.springDifferentialTurns.toFixed(2)} turns`;
    if (ui.events) ui.events.value = `${state.events}`;
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const sample = base.update(mechanicalSeconds, escapeBase, running);
    updateSpringDifferential();
    captureOpportunity();
    syncUI();
    return {
      ...sample,
      workLedger: { ...state },
      springDifferentialTurns: state.springDifferentialTurns,
      workLedgerResidual: state.residual
    };
  }

  updateSpringDifferential();
  syncUI();

  return {
    ...base,
    state: base.state,
    workLedgerState: state,
    update,
    ledgerConstants: { ...LEDGER }
  };
}

export { sampleSwissLever };
