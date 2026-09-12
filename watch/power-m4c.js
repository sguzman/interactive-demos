const STATUS = {
  running: 'RUNNING',
  paused: 'PAUSED',
  unwound: 'STOPPED · UNWOUND'
};

function formatElapsed(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function createPowerReleaseSystem({ windingSystem, root = document }) {
  const state = {
    mechanicalElapsedSeconds: 0,
    totalConsumedSeconds: 0,
    running: false,
    status: 'unwound',
    lastConsumedSeconds: 0
  };

  const ui = {
    status: root.querySelector('#movementStateValue'),
    elapsed: root.querySelector('#runElapsedValue'),
    flow: root.querySelector('#powerFlowValue'),
    gate: root.querySelector('#energyGateValue')
  };

  function syncUI(scale = 1) {
    if (ui.status) ui.status.value = STATUS[state.status];
    if (ui.elapsed) ui.elapsed.value = formatElapsed(state.mechanicalElapsedSeconds);
    if (ui.flow) ui.flow.value = state.status === 'running' ? 'BARREL → TRAIN' : 'NO RELEASE';
    if (ui.gate) {
      if (state.status === 'unwound') ui.gate.value = 'BLOCKED · NO ENERGY';
      else if (state.status === 'paused') ui.gate.value = `PAUSED · ${scale}×`;
      else ui.gate.value = `OPEN · ${scale}×`;
    }
  }

  function advance(realSeconds, mechanicalScale = 1) {
    const scale = Math.max(0, Number(mechanicalScale) || 0);
    const dt = Math.max(0, Number(realSeconds) || 0);

    if (windingSystem.state.energy <= 0) {
      state.running = false;
      state.status = 'unwound';
      state.lastConsumedSeconds = 0;
      syncUI(scale);
      return 0;
    }

    if (scale <= 0 || dt <= 0) {
      state.running = false;
      state.status = 'paused';
      state.lastConsumedSeconds = 0;
      syncUI(scale);
      return 0;
    }

    const requestedMechanicalSeconds = dt * scale;
    const consumed = windingSystem.consumeRunSeconds(requestedMechanicalSeconds);
    state.lastConsumedSeconds = consumed;
    state.mechanicalElapsedSeconds += consumed;
    state.totalConsumedSeconds += consumed;
    state.running = consumed > 0;
    state.status = state.running ? 'running' : 'unwound';

    if (windingSystem.state.energy <= 0) {
      state.running = false;
      state.status = 'unwound';
    }

    syncUI(scale);
    return consumed;
  }

  function resetElapsed() {
    state.mechanicalElapsedSeconds = 0;
    state.totalConsumedSeconds = 0;
    state.lastConsumedSeconds = 0;
    syncUI(0);
  }

  syncUI(1);

  return {
    state,
    advance,
    resetElapsed,
    syncUI
  };
}
