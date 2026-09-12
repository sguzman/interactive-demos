import * as THREE from 'three';

const TAU = Math.PI * 2;
const RATCHET_TEETH = 44;
const CROWN_WHEEL_TEETH = 34;
const RATCHET_PER_CROWN = CROWN_WHEEL_TEETH / RATCHET_TEETH;
const FULL_WIND_CROWN_TURNS = 45; // reconstruction/presentation assumption, not an ETA service dimension
const HOLD_SPEED_TURNS_PER_SECOND = 2.6;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function makeCrownDriver(caseRoot, materials) {
  if (!caseRoot) return null;

  const oldCrown = caseRoot.children.find(child =>
    child.isMesh && child.geometry?.type === 'CylinderGeometry' && Math.abs((child.position?.x ?? 0) - 24.2) < .2
  );
  if (oldCrown) oldCrown.visible = false;

  const group = new THREE.Group();
  group.name = 'M4a interactive crown driver';
  group.position.set(24.2, 0, -.55);

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(2.42, 2.42, 3.28, 48),
    materials.brushedSteel ?? materials.caseSteel
  );
  shell.rotation.z = Math.PI / 2;
  shell.castShadow = shell.receiveShadow = true;
  group.add(shell);

  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(.16, .48, .18),
    materials.blueSteel ?? materials.caseSteel
  );
  marker.position.set(1.68, 0, 2.14);
  marker.rotation.z = Math.PI / 2;
  marker.castShadow = true;
  group.add(marker);

  caseRoot.add(group);
  return group;
}

function makeEnergySpring(barrel) {
  if (!barrel) return null;
  const points = [];
  const turns = 7.5;
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * TAU * turns;
    const r = .62 + t * 3.55;
    points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, .83));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x7ec7ff,
    transparent: true,
    opacity: .28,
    depthTest: true
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'M4a mainspring energy state';
  barrel.add(line);
  return line;
}

function findClickVisual(windingRoot) {
  if (!windingRoot) return null;
  return windingRoot.children.find(child =>
    Math.abs((child.position?.z ?? 0) + 1.68) < .08 &&
    child.geometry?.type === 'ExtrudeGeometry'
  ) ?? null;
}

function bindHoldButton(button, direction, controller) {
  if (!button) return;
  button.addEventListener('pointerdown', event => {
    button.setPointerCapture?.(event.pointerId);
    controller.setInput(direction);
  });
  const release = () => controller.setInput(0);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('click', () => controller.nudge(direction, .75));
}

export function createWindingSystem({ watch, animated, materials, model, root = document }) {
  const caseRoot = watch.getObjectByName('44 mm cushion case & crown guard');
  const windingRoot = watch.getObjectByName('Crown wheel, ratchet, click & click spring');
  const crownDriver = makeCrownDriver(caseRoot, materials);
  const energySpring = makeEnergySpring(animated.barrel);
  const clickVisual = findClickVisual(windingRoot);

  const bases = {
    crownWheel: animated.crownWheel?.rotation.z ?? 0,
    ratchet: animated.ratchet?.rotation.z ?? 0,
    barrel: animated.barrel?.rotation.z ?? 0,
    clickX: clickVisual?.position.x ?? 0,
    clickY: clickVisual?.position.y ?? 0,
    crownX: crownDriver?.position.x ?? 24.2
  };

  const state = {
    enabled: true,
    input: 0,
    crownAngle: 0,
    crownWheelAngle: 0,
    ratchetAngle: 0,
    acceptedCrownTurns: 0,
    returnCrownTurns: 0,
    energy: 0,
    clickCount: 0,
    full: false,
    lastAction: 'idle'
  };

  const maxReserveHours = model.powerReserveTypicalHours ?? 60;
  const maxReserveSeconds = maxReserveHours * 3600;
  const toothPitch = TAU / RATCHET_TEETH;

  function applyCrownDelta(deltaAngle) {
    if (!state.enabled || !Number.isFinite(deltaAngle) || deltaAngle === 0) return;

    if (deltaAngle > 0) {
      const requestedTurns = deltaAngle / TAU;
      const remainingTurns = Math.max(0, FULL_WIND_CROWN_TURNS - state.acceptedCrownTurns);
      const acceptedTurns = Math.min(requestedTurns, remainingTurns);
      const acceptedAngle = acceptedTurns * TAU;

      state.crownAngle += acceptedAngle;
      state.crownWheelAngle -= acceptedAngle;
      state.ratchetAngle += acceptedAngle * RATCHET_PER_CROWN;
      state.acceptedCrownTurns += acceptedTurns;
      state.energy = clamp01(state.acceptedCrownTurns / FULL_WIND_CROWN_TURNS);
      state.full = state.energy >= .999999;
      state.lastAction = state.full && acceptedTurns === 0 ? 'full stop' : 'winding';
    } else {
      state.crownAngle += deltaAngle;
      state.returnCrownTurns += Math.abs(deltaAngle) / TAU;
      state.lastAction = 'return / clutch free';
    }

    state.clickCount = Math.floor(Math.abs(state.ratchetAngle) / toothPitch);
  }

  function consumeRunSeconds(requestedSeconds) {
    const requested = Math.max(0, Number(requestedSeconds) || 0);
    if (requested === 0 || state.energy <= 0) return 0;

    const availableSeconds = state.energy * maxReserveSeconds;
    const consumedSeconds = Math.min(requested, availableSeconds);
    state.energy = clamp01(state.energy - consumedSeconds / maxReserveSeconds);
    state.acceptedCrownTurns = state.energy * FULL_WIND_CROWN_TURNS;
    state.full = state.energy >= .999999;

    if (state.energy <= 1e-10) {
      state.energy = 0;
      state.acceptedCrownTurns = 0;
      state.full = false;
      if (state.input === 0) state.lastAction = 'power exhausted';
    }

    return consumedSeconds;
  }

  function rotateCrownOnly(deltaAngle) {
    if (!Number.isFinite(deltaAngle) || deltaAngle === 0) return;
    state.crownAngle += deltaAngle;
  }

  function setEnabled(enabled) {
    state.enabled = Boolean(enabled);
    if (!state.enabled) state.input = 0;
  }

  function setInput(direction) {
    if (!state.enabled) {
      state.input = 0;
      return;
    }
    state.input = Math.sign(direction);
    if (state.input === 0 && !state.full && state.energy > 0) state.lastAction = 'idle';
  }

  function nudge(direction, turns = .75) {
    if (!state.enabled) return;
    applyCrownDelta(Math.sign(direction) * Math.max(0, turns) * TAU);
  }

  function reset() {
    state.input = 0;
    state.crownAngle = 0;
    state.crownWheelAngle = 0;
    state.ratchetAngle = 0;
    state.acceptedCrownTurns = 0;
    state.returnCrownTurns = 0;
    state.energy = 0;
    state.clickCount = 0;
    state.full = false;
    state.lastAction = 'reset / unwound';
  }

  const ui = {
    wind: root.querySelector('#windCrownBtn'),
    return: root.querySelector('#returnCrownBtn'),
    reset: root.querySelector('#resetWindBtn'),
    meter: root.querySelector('#powerMeter'),
    reserve: root.querySelector('#reserveValue'),
    energy: root.querySelector('#energyValue'),
    clicks: root.querySelector('#clickCountValue'),
    action: root.querySelector('#windingActionValue'),
    clickState: root.querySelector('#clickStateValue')
  };

  const controller = { setInput, nudge };
  bindHoldButton(ui.wind, 1, controller);
  bindHoldButton(ui.return, -1, controller);
  ui.reset?.addEventListener('click', reset);

  window.addEventListener('keydown', event => {
    if (event.repeat || !state.enabled) return;
    if (event.code === 'KeyW') setInput(1);
    if (event.code === 'KeyR') setInput(-1);
  });
  window.addEventListener('keyup', event => {
    if (event.code === 'KeyW' || event.code === 'KeyR') setInput(0);
  });

  function syncUI() {
    const reserve = state.energy * maxReserveHours;
    if (ui.meter) ui.meter.value = state.energy;
    if (ui.reserve) ui.reserve.value = `${reserve.toFixed(2)} h / ${maxReserveHours} h`;
    if (ui.energy) ui.energy.value = `${(state.energy * 100).toFixed(state.energy > 0 && state.energy < .01 ? 2 : 0)}%`;
    if (ui.clicks) ui.clicks.value = `${state.clickCount}`;
    if (ui.action) ui.action.value = state.enabled ? state.lastAction : 'disabled by stem position';
    if (ui.clickState) ui.clickState.value = !state.enabled ? 'OUT OF WINDING MODE' : (state.input < 0 ? 'LOCKED / RETURN' : (state.input > 0 ? 'RATCHETING' : 'SEATED'));
    if (ui.wind) ui.wind.disabled = state.full || !state.enabled;
    if (ui.return) ui.return.disabled = !state.enabled;
  }

  function update(dt) {
    if (state.enabled && state.input !== 0) applyCrownDelta(state.input * HOLD_SPEED_TURNS_PER_SECOND * TAU * dt);

    if (crownDriver) crownDriver.rotation.x = state.crownAngle;
    if (animated.crownWheel) animated.crownWheel.rotation.z = bases.crownWheel + state.crownWheelAngle;
    if (animated.ratchet) animated.ratchet.rotation.z = bases.ratchet + state.ratchetAngle;
    if (animated.barrel) animated.barrel.rotation.z = bases.barrel;

    if (clickVisual) {
      const phase = ((state.ratchetAngle / toothPitch) % 1 + 1) % 1;
      const lift = state.enabled && state.input > 0 ? Math.sin(phase * Math.PI) ** 4 : 0;
      clickVisual.position.x = bases.clickX + lift * .045;
      clickVisual.position.y = bases.clickY + lift * .10;
    }

    if (energySpring) {
      const radial = 1 - state.energy * .16;
      energySpring.scale.set(radial, radial, 1);
      energySpring.rotation.z = -state.energy * .48;
      energySpring.material.opacity = .18 + state.energy * .74;
      energySpring.material.color.setHSL(.55 - state.energy * .08, .78, .62);
    }

    syncUI();
  }

  syncUI();

  return {
    state,
    update,
    setInput,
    nudge,
    reset,
    setEnabled,
    rotateCrownOnly,
    consumeRunSeconds,
    crownDriver,
    bases,
    constants: {
      ratchetTeeth: RATCHET_TEETH,
      crownWheelTeeth: CROWN_WHEEL_TEETH,
      fullWindCrownTurns: FULL_WIND_CROWN_TURNS,
      maxReserveHours,
      maxReserveSeconds
    }
  };
}
