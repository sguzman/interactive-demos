import * as THREE from 'three';

const TAU = Math.PI * 2;
const SLIDING_PINION_TEETH = 14;
const SETTING_WHEEL_TEETH = 22;
const MINUTE_WHEEL_TEETH = 28;
const SETTING_TURNS_PER_SECOND = 1.8;
const CROWN_PULL_MM = 1.35; // reconstruction/presentation displacement

function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
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
  button.addEventListener('click', () => controller.nudge(direction, .35));
}

function makeStemVisual(keylessRoot, materials) {
  if (!keylessRoot) return null;
  const group = new THREE.Group();
  group.name = 'M4b stem visual';

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(.15, .15, 10.4, 20),
    materials.brushedSteel ?? materials.caseSteel
  );
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(18.2, .14, .88);
  shaft.castShadow = true;
  group.add(shaft);

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(.34, .34, .62, 24),
    materials.darkSteel ?? materials.caseSteel
  );
  collar.rotation.z = Math.PI / 2;
  collar.position.set(13.1, .14, .88);
  collar.castShadow = true;
  group.add(collar);

  keylessRoot.add(group);
  return group;
}

export function createKeylessSettingSystem({ watch, windingSystem, animated, materials, root = document }) {
  const keylessRoot = watch.getObjectByName('Dial-side keyless & setting works');
  if (!keylessRoot || keylessRoot.children.length < 6) {
    console.warn('M4b keyless system could not resolve the reconstructed keyless parts.');
  }

  const [windingPinion, slidingPinion, settingWheel, minuteWheel, yoke, settingLever] = keylessRoot?.children ?? [];
  const stemVisual = makeStemVisual(keylessRoot, materials);

  const base = {
    windingPinionRot: windingPinion?.rotation.z ?? 0,
    slidingPinionX: slidingPinion?.position.x ?? 12.7,
    slidingPinionY: slidingPinion?.position.y ?? .15,
    slidingPinionRot: slidingPinion?.rotation.z ?? 0,
    settingWheelRot: settingWheel?.rotation.z ?? 0,
    minuteWheelRot: minuteWheel?.rotation.z ?? 0,
    yokeX: yoke?.position.x ?? 0,
    yokeY: yoke?.position.y ?? 0,
    settingLeverX: settingLever?.position.x ?? 0,
    settingLeverY: settingLever?.position.y ?? 0,
    crownX: windingSystem.crownDriver?.position.x ?? 24.2,
    stemX: stemVisual?.position.x ?? 0
  };

  const state = {
    mode: 'wind',
    targetMode: 'wind',
    pull: 0,
    input: 0,
    settingCrownAngle: 0,
    settingWheelAngle: 0,
    minuteWheelAngle: 0,
    minuteHandOffset: 0,
    hourHandOffset: 0,
    minutesOffset: 0,
    lastAction: 'winding position'
  };

  const ui = {
    position: root.querySelector('#stemPosition'),
    setForward: root.querySelector('#setHandsForwardBtn'),
    setBackward: root.querySelector('#setHandsBackwardBtn'),
    mode: root.querySelector('#stemModeValue'),
    pull: root.querySelector('#stemPullValue'),
    offset: root.querySelector('#handOffsetValue'),
    mesh: root.querySelector('#settingMeshValue')
  };

  function setMode(mode) {
    state.targetMode = mode === 'set' ? 'set' : 'wind';
    state.input = 0;
    windingSystem.setInput(0);
    windingSystem.setEnabled(state.targetMode === 'wind');
    state.lastAction = state.targetMode === 'set' ? 'setting position selected' : 'winding position selected';
    if (ui.position) ui.position.value = state.targetMode;
  }

  function setInput(direction) {
    if (state.targetMode !== 'set') {
      state.input = 0;
      return;
    }
    state.input = Math.sign(direction);
    state.lastAction = state.input === 0 ? 'setting position' : (state.input > 0 ? 'setting forward' : 'setting backward');
  }

  function applySettingDelta(deltaAngle) {
    if (state.targetMode !== 'set' || !Number.isFinite(deltaAngle) || deltaAngle === 0) return;

    // Visible reconstructed keyless tooth counts provide the local ratio chain:
    // sliding pinion (14) -> setting wheel (22) -> minute wheel (28).
    const settingWheelDelta = -deltaAngle * (SLIDING_PINION_TEETH / SETTING_WHEEL_TEETH);
    const minuteWheelDelta = -settingWheelDelta * (SETTING_WHEEL_TEETH / MINUTE_WHEEL_TEETH);

    state.settingCrownAngle += deltaAngle;
    state.settingWheelAngle += settingWheelDelta;
    state.minuteWheelAngle += minuteWheelDelta;

    // M4b uses the minute-wheel rotation as a direct presentation proxy for the
    // cannon-pinion / minute-hand setting displacement. This is intentionally
    // classified as a reconstruction simplification rather than an ETA ratio claim.
    state.minuteHandOffset += minuteWheelDelta;
    state.hourHandOffset = state.minuteHandOffset / 12;
    state.minutesOffset = -state.minuteHandOffset / TAU * 60;

    windingSystem.rotateCrownOnly(deltaAngle);
  }

  function nudge(direction, turns = .35) {
    applySettingDelta(Math.sign(direction) * Math.max(0, turns) * TAU);
  }

  ui.position?.addEventListener('change', () => setMode(ui.position.value));
  const controller = { setInput, nudge };
  bindHoldButton(ui.setForward, 1, controller);
  bindHoldButton(ui.setBackward, -1, controller);

  window.addEventListener('keydown', event => {
    if (event.repeat || state.targetMode !== 'set') return;
    if (event.code === 'BracketRight') setInput(1);
    if (event.code === 'BracketLeft') setInput(-1);
  });
  window.addEventListener('keyup', event => {
    if (event.code === 'BracketRight' || event.code === 'BracketLeft') setInput(0);
  });

  function syncUI() {
    const fullySet = state.pull > .92;
    if (ui.mode) ui.mode.value = fullySet ? 'SETTING' : (state.pull < .08 ? 'WINDING' : 'TRANSITION');
    if (ui.pull) ui.pull.value = `${(state.pull * CROWN_PULL_MM).toFixed(2)} mm`;
    if (ui.offset) {
      const sign = state.minutesOffset >= 0 ? '+' : '−';
      ui.offset.value = `${sign}${Math.abs(state.minutesOffset).toFixed(1)} min`;
    }
    if (ui.mesh) ui.mesh.value = fullySet ? 'SETTING WHEEL ENGAGED' : 'WINDING PATH';
    if (ui.setForward) ui.setForward.disabled = state.targetMode !== 'set';
    if (ui.setBackward) ui.setBackward.disabled = state.targetMode !== 'set';
  }

  function update(dt) {
    state.pull = damp(state.pull, state.targetMode === 'set' ? 1 : 0, 9, dt);
    state.mode = state.pull > .5 ? 'set' : 'wind';

    if (state.targetMode === 'set' && state.input !== 0) {
      applySettingDelta(state.input * SETTING_TURNS_PER_SECOND * TAU * dt);
    }

    const p = state.pull;

    // Stem/crown pull is along the crown axis. The values are presentation
    // reconstruction distances chosen to make the state transition readable.
    if (windingSystem.crownDriver) windingSystem.crownDriver.position.x = base.crownX + p * CROWN_PULL_MM;
    if (stemVisual) stemVisual.position.x = base.stemX + p * CROWN_PULL_MM;

    // Sliding pinion leaves the winding side and moves toward the reconstructed
    // setting-wheel position. Yoke/setting-lever translations make the selection
    // mechanism visibly follow that state without pretending their contours are CAD.
    if (slidingPinion) {
      slidingPinion.position.x = base.slidingPinionX - p * .72;
      slidingPinion.position.y = base.slidingPinionY - p * .18;
      slidingPinion.rotation.z = base.slidingPinionRot + (state.targetMode === 'set' ? state.settingCrownAngle : windingSystem.state.crownAngle);
    }
    if (windingPinion) windingPinion.rotation.z = base.windingPinionRot - windingSystem.state.crownAngle;
    if (yoke) {
      yoke.position.x = base.yokeX - p * .28;
      yoke.position.y = base.yokeY - p * .10;
    }
    if (settingLever) {
      settingLever.position.x = base.settingLeverX - p * .18;
      settingLever.position.y = base.settingLeverY + p * .16;
    }
    if (settingWheel) settingWheel.rotation.z = base.settingWheelRot + state.settingWheelAngle;
    if (minuteWheel) minuteWheel.rotation.z = base.minuteWheelRot + state.minuteWheelAngle;

    syncUI();
  }

  setMode('wind');
  syncUI();

  return {
    state,
    update,
    setMode,
    setInput,
    nudge,
    getHandOffsets() {
      return {
        minute: state.minuteHandOffset,
        hour: state.hourHandOffset,
        minutes: state.minutesOffset
      };
    },
    constants: {
      slidingPinionTeeth: SLIDING_PINION_TEETH,
      settingWheelTeeth: SETTING_WHEEL_TEETH,
      minuteWheelTeeth: MINUTE_WHEEL_TEETH,
      crownPullMm: CROWN_PULL_MM
    }
  };
}
