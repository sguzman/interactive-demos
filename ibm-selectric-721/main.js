import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSelectricModel } from './geometry.js';
import { CANONICAL } from './spec.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e0f);
scene.fog = new THREE.Fog(0x0c0e0f, 700, 1350);

const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 1600);
camera.position.set(350, 235, 505);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 77, -8);
orbit.minDistance = 210;
orbit.maxDistance = 920;

scene.add(new THREE.HemisphereLight(0xd9e1e5, 0x2b2925, 1.35));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(300, 420, 330);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -260;
key.shadow.camera.right = 260;
key.shadow.camera.top = 240;
key.shadow.camera.bottom = -240;
scene.add(key);

const rim = new THREE.DirectionalLight(0x9fbce0, 1.4);
rim.position.set(-260, 170, -300);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshStandardMaterial({ color: 0x111416, roughness: 0.95, metalness: 0.02 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const model = createSelectricModel();
scene.add(model.root);

const ui = {
  powerBtn: document.querySelector('#powerBtn'),
  typeBtn: document.querySelector('#typeBtn'),
  shiftBtn: document.querySelector('#shiftBtn'),
  coverBtn: document.querySelector('#coverBtn'),
  spaceBtn: document.querySelector('#spaceBtn'),
  tabBtn: document.querySelector('#tabBtn'),
  tabSetBtn: document.querySelector('#tabSetBtn'),
  tabClearBtn: document.querySelector('#tabClearBtn'),
  backspaceBtn: document.querySelector('#backspaceBtn'),
  returnBtn: document.querySelector('#returnBtn'),
  indexBtn: document.querySelector('#indexBtn'),
  lineSpacingBtn: document.querySelector('#lineSpacingBtn'),
  paperReleaseBtn: document.querySelector('#paperReleaseBtn'),
  paperAlignBackBtn: document.querySelector('#paperAlignBackBtn'),
  paperAlignForwardBtn: document.querySelector('#paperAlignForwardBtn'),
  paperBailBtn: document.querySelector('#paperBailBtn'),
  bailLeft: document.querySelector('#bailLeft'),
  bailRight: document.querySelector('#bailRight'),
  bailLeftValue: document.querySelector('#bailLeftValue'),
  bailRightValue: document.querySelector('#bailRightValue'),
  ribbonModeBtn: document.querySelector('#ribbonModeBtn'),
  ribbonLoadBtn: document.querySelector('#ribbonLoadBtn'),
  marginLeftBtn: document.querySelector('#marginLeftBtn'),
  marginRightBtn: document.querySelector('#marginRightBtn'),
  marginResetBtn: document.querySelector('#marginResetBtn'),
  copyControlBtn: document.querySelector('#copyControlBtn'),
  platenVariableBtn: document.querySelector('#platenVariableBtn'),
  platenBackBtn: document.querySelector('#platenBackBtn'),
  platenForwardBtn: document.querySelector('#platenForwardBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  explode: document.querySelector('#explode'),
  explodeValue: document.querySelector('#explodeValue'),
  powerState: document.querySelector('#powerState'),
  carrierState: document.querySelector('#carrierState'),
  cycleState: document.querySelector('#cycleState'),
  selectionState: document.querySelector('#selectionState'),
  shiftState: document.querySelector('#shiftState'),
  ribbonState: document.querySelector('#ribbonState'),
  ribbonModeState: document.querySelector('#ribbonModeState'),
  ribbonLoadState: document.querySelector('#ribbonLoadState'),
  marginState: document.querySelector('#marginState'),
  tabStopsState: document.querySelector('#tabStopsState'),
  feedState: document.querySelector('#feedState'),
  paperBailState: document.querySelector('#paperBailState'),
  copyControlState: document.querySelector('#copyControlState'),
  platenVariableState: document.querySelector('#platenVariableState'),
  lineSpacingState: document.querySelector('#lineSpacingState'),
  lineState: document.querySelector('#lineState'),
  characterState: document.querySelector('#characterState'),
  codeState: document.querySelector('#codeState'),
  partName: document.querySelector('#partName'),
  partCategory: document.querySelector('#partCategory'),
  partProvenance: document.querySelector('#partProvenance'),
  partDescription: document.querySelector('#partDescription'),
  loading: document.querySelector('#loading')
};

const runtime = {
  powered: true,
  cycle: 'C0_REST',
  line: 0,
  lastAction: 'ready',
  cycleStart: 0,
  cycleAdvanceCommitted: false,
  cycleImpactCommitted: false,
  ribbonFeedCommitted: false,
  pendingCharacter: 'a',
  selectionTarget: { tilt: 0, rotate: 0, shift: 0 },
  cycleDurationMs: 1250,
  debugCycleHold: null,
  operation: null,
  serviceOperation: null,
  queuedCharacter: null,
  storedSpace: false,
  eventLog: [],
  lastRecordedCycle: 'C0_REST'
};

function recordEvent(name, extra = {}) {
  runtime.eventLog.push({
    name,
    carrierX: model.state.carrierX,
    line: runtime.line,
    ...extra
  });
  if (runtime.eventLog.length > 80) runtime.eventLog.shift();
}

function setCycleState(next) {
  if (runtime.cycle === next) return;
  runtime.cycle = next;
  runtime.lastRecordedCycle = next;
  recordEvent(next);
}

function rotatePositiveInputs(units) {
  const u = Math.max(0, Math.min(5, Math.trunc(units)));
  if (u === 0) return { R1: 0, R2: 0, R2A: 0 };
  if (u === 1) return { R1: 1, R2: 0, R2A: 0 };
  if (u === 2) return { R1: 0, R2: 1, R2A: 0 };
  if (u === 3) return { R1: 1, R2: 1, R2A: 0 };
  if (u === 4) return { R1: 0, R2: 1, R2A: 1 };
  return { R1: 1, R2: 1, R2A: 1 };
}

function selectorCodeFor(tilt, rotate) {
  const T1 = tilt & 1 ? 1 : 0;
  const T2 = tilt & 2 ? 1 : 0;
  const fiveUnit = rotate < 0 ? 1 : 0;
  const positive = rotatePositiveInputs(fiveUnit ? rotate + 5 : rotate);
  return (
    T1 |
    (T2 << 1) |
    (positive.R1 << 2) |
    (positive.R2 << 3) |
    (positive.R2A << 4) |
    (fiveUnit << 5)
  );
}

function selectionForCharacter(character) {
  const raw = String(character || 'a');
  const shiftedPairs = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8',
    '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
    ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
  };
  const isUpperLetter = /^[A-Z]$/.test(raw);
  const isShiftedPunctuation = Object.prototype.hasOwnProperty.call(shiftedPairs, raw);
  const shift = isUpperLetter || isShiftedPunctuation ? 1 : 0;
  const baseCharacter = isShiftedPunctuation ? shiftedPairs[raw] : raw.toLowerCase();
  const cp = baseCharacter.codePointAt(0) || 97;

  // P5 layout assignment, but preserving the real 44 positions/hemisphere structure.
  const baseSlot = (cp * 37 + 11) % 44;
  const tilt = Math.floor(baseSlot / 11);
  const rotate = (baseSlot % 11) - 5;
  const slot = baseSlot + shift * 44;
  const code6 = selectorCodeFor(tilt, rotate);
  return { tilt, rotate, shift, slot, code6, baseSlot };
}

function requestCharacter(character = runtime.pendingCharacter) {
  if (!runtime.powered || runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  if (model.state.carrierX >= model.state.rightMarginX - 1e-6) {
    runtime.lastAction = 'right-margin-line-lock';
    recordEvent('RIGHT_MARGIN_LINE_LOCK', { rightMarginX: model.state.rightMarginX });
    syncUi();
    return false;
  }
  const target = selectionForCharacter(character || 'a');
  if (target.shift !== model.state.shiftHemisphere) {
    runtime.queuedCharacter = character || 'a';
    return beginServiceOperation('shift', 420, {
      fromShift: model.state.shiftHemisphere,
      toShift: target.shift,
      autoCharacter: true
    });
  }
  startCharacterCycle(character || 'a');
  return true;
}
function syncUi() {
  ui.powerState.textContent = runtime.powered ? 'RUNNING' : 'OFF / LOCKED';
  ui.powerBtn.textContent = runtime.powered ? 'Power off' : 'Power on';
  ui.carrierState.textContent = model.state.carrierX.toFixed(2) + ' mm';
  ui.cycleState.textContent = runtime.cycle;
  ui.selectionState.textContent = 'T' + model.state.tiltBand.toFixed(1) + ' · R' + model.state.rotateUnit.toFixed(1);
  ui.shiftState.textContent = model.state.shiftHemisphere ? 'UPPER HEMISPHERE' : 'LOWER HEMISPHERE';
  ui.ribbonState.textContent = Math.round(model.state.ribbonLift * 100) + '%';
  ui.ribbonModeState.textContent = model.state.ribbonPrintMode.toUpperCase();
  ui.ribbonLoadState.textContent = model.state.ribbonLoadState ? 'THREADING / LOAD' : 'OFF';
  ui.marginState.textContent = model.state.leftMarginInsetColumns + ' / ' + model.state.rightMarginInsetColumns + ' COL';
  ui.tabStopsState.textContent = String(model.state.tabStopIndices.length);
  ui.feedState.textContent = model.state.feedRollsEngaged ? 'ENGAGED' : 'RELEASED';
  ui.paperBailState.textContent = model.state.paperBailEngaged ? 'AGAINST PLATEN' : 'RELEASED';
  ui.bailLeft.value = String(Math.round(model.state.paperBailRollerPositionsP5.left * 100));
  ui.bailRight.value = String(Math.round(model.state.paperBailRollerPositionsP5.right * 100));
  ui.bailLeftValue.textContent = Math.round(model.state.paperBailRollerPositionsP5.left * 100) + '%';
  ui.bailRightValue.textContent = Math.round(model.state.paperBailRollerPositionsP5.right * 100) + '%';
  ui.copyControlState.textContent = String(model.state.copyControlSetting + 1) + ' / 5';
  ui.platenVariableState.textContent = model.state.platenVariableEngaged ? 'FREE' : 'COUPLED';
  ui.lineSpacingState.textContent = (model.state.lineSpacingTeeth === 2 ? 'DOUBLE' : 'SINGLE') + ' · ' + model.state.lineSpacingTeeth + (model.state.lineSpacingTeeth === 1 ? ' TOOTH' : ' TEETH');
  ui.lineState.textContent = String(runtime.line);
  ui.characterState.textContent = runtime.pendingCharacter === ' ' ? 'SPACE' : runtime.pendingCharacter;
  ui.codeState.textContent = model.state.keyboardCode.toString(2).padStart(6, '0');
  ui.explodeValue.textContent = Math.round(model.state.explosion * 100) + '%';
  ui.shiftBtn.textContent = model.state.shiftHemisphere ? 'Shift: upper' : 'Shift: lower';
  ui.coverBtn.textContent = model.state.serviceCoverOpen > 0.5 ? 'Close service cover' : 'Open service cover';
  ui.paperReleaseBtn.textContent = model.state.feedRollsEngaged ? 'Release paper feed' : 'Engage paper feed';
  ui.paperAlignBackBtn.disabled = model.state.feedRollsEngaged;
  ui.paperAlignForwardBtn.disabled = model.state.feedRollsEngaged;
  ui.paperBailBtn.textContent = model.state.paperBailEngaged ? 'Release paper bail' : 'Engage paper bail';
  ui.ribbonModeBtn.textContent = 'Ribbon: ' + model.state.ribbonPrintMode;
  ui.ribbonLoadBtn.textContent = model.state.ribbonLoadState ? 'Ribbon load: on' : 'Ribbon load: off';
  ui.copyControlBtn.textContent = 'Copy control ' + (model.state.copyControlSetting + 1) + '/5';
  ui.platenVariableBtn.textContent = model.state.platenVariableEngaged ? 'Lock platen variable' : 'Free platen variable';
  ui.platenBackBtn.disabled = !model.state.platenVariableEngaged;
  ui.platenForwardBtn.disabled = !model.state.platenVariableEngaged;
  ui.lineSpacingBtn.textContent = 'Line spacing: ' + (model.state.lineSpacingTeeth === 2 ? 'double' : 'single');
}

function resetMechanicalState() {
  runtime.cycle = 'C0_REST';
  runtime.line = 0;
  runtime.lastAction = 'reset';
  runtime.cycleStart = 0;
  runtime.cycleAdvanceCommitted = false;
  runtime.cycleImpactCommitted = false;
  runtime.ribbonFeedCommitted = false;
  runtime.debugCycleHold = null;
  runtime.operation = null;
  runtime.serviceOperation = null;
  runtime.queuedCharacter = null;
  runtime.storedSpace = false;
  runtime.eventLog = [];
  runtime.lastRecordedCycle = 'C0_REST';
  runtime.pendingCharacter = 'a';
  runtime.selectionTarget = selectionForCharacter('a');
  model.setKeyboardCode(0);
  model.setTabStops(Array.from({ length: Math.floor((CANONICAL.nominalPositions - 1) / 8) }, (_, index) => (index + 1) * 8));
  model.setMarginInsets(0, 0);
  model.setCarrierX(0);
  model.setTypeball(0, 0, 0);
  model.setRibbonLoadState(false);
  model.setRibbonMode('middle');
  model.setRibbonLift(0);
  model.resetRibbonTransport();
  model.setFineAlignment(0, 0);
  model.setPaperRelease(false);
  model.setPaperBail(true);
  model.setPaperBailRollerPosition('left', 0.4);
  model.setPaperBailRollerPosition('right', 0.4);
  model.setCopyControl(0);
  model.setPlatenVariable(false);
  model.resetPlatenVariableOffset();
  model.setLineSpacingMode(1);
  model.setPrintApproach(0);
  model.setPlatenIndex(0);
  model.setCyclePhase(0);
  model.setInspectionCutaway('none');
  model.setServiceCover(0);
  model.clearPaper();
  syncUi();
}

function startCharacterCycle(character = runtime.pendingCharacter) {
  if (!runtime.powered || runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  runtime.pendingCharacter = character || 'a';
  runtime.selectionTarget = selectionForCharacter(runtime.pendingCharacter);
  setCycleState('C1_TRIP');
  runtime.cycleStart = performance.now();
  runtime.cycleAdvanceCommitted = false;
  runtime.cycleImpactCommitted = false;
  runtime.ribbonFeedCommitted = false;
  runtime.lastAction = 'character-cycle';
  syncUi();
}

function advanceCarrier(delta) {
  const from = model.state.carrierX;
  const destination = THREE.MathUtils.clamp(from + delta, model.state.leftMarginX, model.state.rightMarginX);
  model.setCarrierX(destination);
  if (delta > 0 && destination >= model.state.rightMarginX - 1e-6 && from < model.state.rightMarginX - 1e-6) {
    recordEvent('RIGHT_MARGIN_REACHED', { rightMarginX: model.state.rightMarginX });
  }
  syncUi();
}

function singleIndex() {
  const teeth = model.state.lineSpacingTeeth;
  runtime.line += teeth;
  model.setPlatenIndex(
    model.state.platenIndex +
    teeth * Math.PI * 2 / CANONICAL.platen.representativeRatchetTeeth
  );
  return teeth;
}

function carrierColumnIndex() {
  return THREE.MathUtils.clamp(
    Math.round((model.state.carrierX + CANONICAL.writingLineMm / 2) / CANONICAL.pitchMm),
    0,
    CANONICAL.nominalPositions - 1
  );
}

function nextTabStop() {
  const currentIndex = carrierColumnIndex();
  const nextIndex = model.state.tabStopIndices.find(index => {
    if (index <= currentIndex) return false;
    const x = -CANONICAL.writingLineMm / 2 + index * CANONICAL.pitchMm;
    return x <= model.state.rightMarginX + 1e-6;
  });
  if (nextIndex === undefined) return model.state.rightMarginX;
  return -CANONICAL.writingLineMm / 2 + nextIndex * CANONICAL.pitchMm;
}

function beginCarrierOperation(type, destination, durationMs, includesIndex = false) {
  if (!runtime.powered || runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  const from = model.state.carrierX;
  runtime.operation = {
    type,
    from,
    to: THREE.MathUtils.clamp(destination, model.state.leftMarginX, model.state.rightMarginX),
    startedAt: performance.now(),
    durationMs: Math.max(120, durationMs)
  };
  runtime.lastAction = type;
  if (includesIndex) {
    const teeth = singleIndex();
    recordEvent('RETURN_INDEX_STARTED', { teeth });
  }
  const startEvent = {
    tab: 'TAB_RELEASE',
    'carrier-return': 'CARRIER_RETURN_CLUTCH_ENGAGED',
    space: 'SPACE_OPERATION_STARTED',
    backspace: 'BACKSPACE_OPERATION_STARTED'
  }[type];
  if (startEvent) recordEvent(startEvent, { destination: runtime.operation.to });
  syncUi();
  return true;
}

function runCarrierOperation(now) {
  const op = runtime.operation;
  if (!op) return;
  const t = THREE.MathUtils.clamp((now - op.startedAt) / op.durationMs, 0, 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  if (op.type === 'space' || op.type === 'backspace') {
    model.setOperationalCam(op.type, t);
    model.setBackspaceLinkage(op.type === 'backspace' ? t : 0);
  } else if (op.type === 'carrier-return') {
    model.setOperationalCam('carrier-return', Math.min(1, t * 4));
    model.setCarrierReturnDrive(t);
    model.setTabGovernor(0);
  } else if (op.type === 'tab') {
    model.setOperationalCam(null, 0);
    model.setCarrierReturnDrive(0);
    model.setTabGovernor(t);
  } else {
    model.setOperationalCam(null, 0);
    model.setCarrierReturnDrive(0);
    model.setTabGovernor(0);
  }

  model.setCarrierX(THREE.MathUtils.lerp(op.from, op.to, eased));
  if (t >= 1) {
    const endEvent = {
      tab: 'TAB_CAPTURE',
      'carrier-return': 'CARRIER_RETURN_TERMINATED_AT_LEFT_MARGIN',
      space: 'SPACE_OPERATION_COMPLETE',
      backspace: 'BACKSPACE_OPERATION_COMPLETE'
    }[op.type];
    if (endEvent) recordEvent(endEvent, { destination: op.to });
    model.setOperationalCam(null, 0);
    model.setBackspaceLinkage(0);
    model.setCarrierReturnDrive(0);
    model.setTabGovernor(0);
    runtime.operation = null;
  }
  syncUi();
}

function beginServiceOperation(type, durationMs, payload = {}) {
  if (!runtime.powered || runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  runtime.serviceOperation = {
    type,
    startedAt: performance.now(),
    durationMs: Math.max(160, durationMs),
    committed: false,
    ...payload
  };
  runtime.lastAction = type;
  recordEvent(type === 'shift' ? 'SHIFT_OPERATION_STARTED' : 'INDEX_OPERATION_STARTED');
  syncUi();
  return true;
}

function runServiceOperation(now) {
  const op = runtime.serviceOperation;
  if (!op) return;
  const t = THREE.MathUtils.clamp((now - op.startedAt) / op.durationMs, 0, 1);

  if (op.type === 'shift') {
    model.setOperationalCam('shift', t);
    model.setShiftTransition(op.fromShift, op.toShift, t);
  } else if (op.type === 'index') {
    model.setOperationalCam('index', t);
    model.setIndexPawlPhase(t);
    if (!op.committed && t >= 0.58) {
      const teeth = singleIndex();
      op.committed = true;
      recordEvent('INDEX_RATCHET_ADVANCE', { teeth });
    }
  }

  if (t >= 1) {
    if (op.type === 'shift') {
      model.setShiftTransition(op.toShift, op.toShift, 1);
      recordEvent('SHIFT_OPERATION_COMPLETE', { hemisphere: op.toShift });
      const queued = op.autoCharacter ? runtime.queuedCharacter : null;
      model.setOperationalCam(null, 0);
      runtime.serviceOperation = null;
      if (queued) {
        runtime.queuedCharacter = null;
        startCharacterCycle(queued);
        return;
      }
    } else {
      model.setIndexPawlPhase(0);
      recordEvent('INDEX_OPERATION_COMPLETE');
      model.setOperationalCam(null, 0);
      runtime.serviceOperation = null;
    }
  }
  syncUi();
}

function runCycle(now) {
  if (runtime.cycle === 'C0_REST') return;
  const t = runtime.debugCycleHold === null
    ? Math.min(1, (now - runtime.cycleStart) / runtime.cycleDurationMs)
    : THREE.MathUtils.clamp(runtime.debugCycleHold, 0, 0.999);
  model.setCyclePhase(t);

  // Milestone side effects are cumulative rather than branch-local so a slow browser cannot
  // skip ribbon feed, impact, or escapement merely because one rendered frame jumps phases.
  const ribbonFeedThreshold = 0.43 + 0.11 * 0.35;
  const impactThreshold = 0.54 + 0.12 * 0.95;
  if (t >= ribbonFeedThreshold && !runtime.ribbonFeedCommitted) {
    const ribbonFed = model.feedRibbon();
    runtime.ribbonFeedCommitted = true;
    recordEvent(
      ribbonFed ? 'RIBBON_FEED_COMPLETE_EXCEPT_PAWL_RESTORE' : 'RIBBON_STENCIL_FEED_SUPPRESSED'
    );
  }
  if (t >= 0.66) {
    const reverseCommitted = model.setRibbonReversePhase((t - 0.66) / 0.23);
    if (reverseCommitted) {
      recordEvent('RIBBON_AUTO_REVERSE', { direction: model.state.ribbonFeedDirection });
    }
  }
  if (t >= impactThreshold && !runtime.cycleImpactCommitted) {
    const inked = model.stampCharacter(runtime.pendingCharacter);
    runtime.cycleImpactCommitted = true;
    recordEvent('PRINT_IMPACT', { character: runtime.pendingCharacter, inked });
    if (!inked) recordEvent('STENCIL_IMPACT_NO_INK', { character: runtime.pendingCharacter });
  }
  if (t >= 0.73 && !runtime.cycleAdvanceCommitted) {
    advanceCarrier(CANONICAL.pitchMm);
    runtime.cycleAdvanceCommitted = true;
    recordEvent('ESCAPEMENT_ADVANCE');
  }

  if (t < 0.12) {
    setCycleState('C1_TRIP');
    model.setKeyboardCode(0);
    model.setKeyPress(runtime.pendingCharacter, Math.min(1, t / 0.07));
    model.setTypeball(0, 0, runtime.selectionTarget.shift);
    model.setRibbonLift(0);
    model.setFineAlignment(0, 0);
    model.setPrintApproach(0);
  } else if (t < 0.28) {
    setCycleState('C2_CODE_SETUP');
    model.setKeyboardCode(runtime.selectionTarget.code6);
    const k = (t - 0.12) / 0.16;
    model.setKeyPress(runtime.pendingCharacter, Math.max(0, 1 - k));
    model.setFineAlignment(0, 0);
    model.setTypeball(runtime.selectionTarget.tilt * k, runtime.selectionTarget.rotate * k, runtime.selectionTarget.shift);
  } else if (t < 0.43) {
    setCycleState('C3_SELECTION_DRIVE');
    model.setKeyPress(null, 0);
    model.setFineAlignment(0, 0);
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate, runtime.selectionTarget.shift);
  } else if (t < 0.54) {
    setCycleState('C4_FINE_ALIGN');
    model.setKeyPress(null, 0);
    const k = (t - 0.43) / 0.11;
    const tiltSeat = THREE.MathUtils.clamp(k / 0.58, 0, 1);
    const rotateSeat = THREE.MathUtils.clamp((k - 0.20) / 0.62, 0, 1);
    model.setTypeball(runtime.selectionTarget.tilt, runtime.selectionTarget.rotate, runtime.selectionTarget.shift);
    model.setFineAlignment(tiltSeat, rotateSeat);
    model.setRibbonLift(k);
    model.setPrintApproach(k * 0.55);
  } else if (t < 0.66) {
    setCycleState('C5_PRINT_IMPACT');
    model.setKeyPress(null, 0);
    const k = (t - 0.54) / 0.12;
    model.setFineAlignment(1, 1);
    model.setRibbonLift(1);
    model.setPrintApproach(Math.min(1, 0.55 + k * 0.45));
  } else if (t < 0.91) {
    setCycleState('C6_ESCAPEMENT_RIBBON_RESTORE');
    model.setKeyboardCode(0);
    model.setKeyPress(null, 0);
    const k = 1 - (t - 0.66) / 0.25;
    const tiltHold = THREE.MathUtils.clamp((k - 0.34) / 0.66, 0, 1);
    const rotateHold = THREE.MathUtils.clamp((k - 0.46) / 0.54, 0, 1);
    model.setFineAlignment(tiltHold, rotateHold);
    model.setRibbonLift(Math.max(0, k));
    model.setPrintApproach(Math.max(0, k));
  } else {
    setCycleState('C7_CLUTCH_DISENGAGE_CHECK');
    model.setKeyboardCode(0);
    model.setKeyPress(null, 0);
    model.setFineAlignment(0, 0);
    model.setRibbonLift(0);
    model.setPrintApproach(0);
  }

  if (t >= 1) {
    setCycleState('C0_REST');
    model.setRibbonLift(0);
    model.setFineAlignment(0, 0);
    model.setPrintApproach(0);
    model.setKeyPress(null, 0);
    model.setCyclePhase(0);
    if (runtime.storedSpace) {
      runtime.storedSpace = false;
      if (model.state.carrierX >= model.state.rightMarginX - 1e-6) {
        recordEvent('RIGHT_MARGIN_LINE_LOCK', { rightMarginX: model.state.rightMarginX, storedSpace: true });
      } else {
        recordEvent('SPACE_INTERLOCK_RELEASED');
        beginCarrierOperation('space', model.state.carrierX + CANONICAL.pitchMm, 220, false);
      }
    }
  }
  syncUi();
}

ui.powerBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  runtime.powered = !runtime.powered;
  runtime.lastAction = runtime.powered ? 'power-on' : 'power-off';
  recordEvent(runtime.powered ? 'POWER_ON' : 'POWER_OFF');
  syncUi();
});
ui.typeBtn.addEventListener('click', () => requestCharacter(runtime.pendingCharacter));
ui.coverBtn.addEventListener('click', () => {
  model.setServiceCover(model.state.serviceCoverOpen > 0.5 ? 0 : 1);
  runtime.lastAction = model.state.serviceCoverOpen ? 'service-cover-open' : 'service-cover-close';
  syncUi();
});
ui.shiftBtn.addEventListener('click', () => {
  const fromShift = model.state.shiftHemisphere;
  const toShift = fromShift ? 0 : 1;
  beginServiceOperation('shift', 420, { fromShift, toShift });
});
ui.spaceBtn.addEventListener('click', () => {
  if (!runtime.powered) return;
  runtime.pendingCharacter = ' ';
  if (runtime.cycle !== 'C0_REST' && !runtime.operation && !runtime.serviceOperation) {
    if (!runtime.storedSpace) {
      runtime.storedSpace = true;
      runtime.lastAction = 'space-stored';
      recordEvent('SPACE_STORED_BY_FILTER_SHAFT_INTERLOCK');
      syncUi();
    }
    return;
  }
  if (model.state.carrierX >= model.state.rightMarginX - 1e-6) {
    runtime.lastAction = 'right-margin-line-lock';
    recordEvent('RIGHT_MARGIN_LINE_LOCK', { rightMarginX: model.state.rightMarginX, space: true });
    syncUi();
    return;
  }
  beginCarrierOperation('space', model.state.carrierX + CANONICAL.pitchMm, 220, false);
});
ui.tabBtn.addEventListener('click', () => {
  const destination = nextTabStop();
  const distance = Math.abs(destination - model.state.carrierX);
  beginCarrierOperation('tab', destination, 280 + distance * 3.2, false);
});
ui.tabSetBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  const index = carrierColumnIndex();
  if (!model.setTabStopAt(index, true)) return;
  runtime.lastAction = 'tab-set';
  recordEvent('TAB_STOP_SET', { index });
  syncUi();
});
ui.tabClearBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  const index = carrierColumnIndex();
  if (!model.setTabStopAt(index, false)) return;
  runtime.lastAction = 'tab-clear';
  recordEvent('TAB_STOP_CLEARED', { index });
  syncUi();
});
ui.backspaceBtn.addEventListener('click', () => {
  beginCarrierOperation('backspace', model.state.carrierX - CANONICAL.pitchMm, 220, false);
});
ui.returnBtn.addEventListener('click', () => {
  const destination = model.state.leftMarginX;
  const distance = Math.abs(model.state.carrierX - destination);
  beginCarrierOperation('carrier-return', destination, 360 + distance * 2.4, true);
});
ui.indexBtn.addEventListener('click', () => {
  beginServiceOperation('index', 560);
});
ui.lineSpacingBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  const teeth = model.setLineSpacingMode(model.state.lineSpacingTeeth === 1 ? 2 : 1);
  runtime.lastAction = teeth === 2 ? 'line-spacing-double' : 'line-spacing-single';
  recordEvent('LINE_SPACING_CHANGED', { teeth });
  syncUi();
});
ui.paperReleaseBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setPaperRelease(model.state.feedRollsEngaged);
  runtime.lastAction = model.state.feedRollsEngaged ? 'paper-feed-engaged' : 'paper-feed-released';
  recordEvent(model.state.feedRollsEngaged ? 'PAPER_FEED_ENGAGED' : 'PAPER_FEED_RELEASED');
  syncUi();
});
function stepManualPaper(direction) {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  const deltaMmP5 = Math.sign(direction || 0) * 2;
  const moved = model.repositionPaperManually(deltaMmP5);
  if (!moved) return false;
  runtime.lastAction = direction < 0 ? 'paper-align-back' : 'paper-align-forward';
  recordEvent('MANUAL_PAPER_REPOSITION', {
    direction: direction < 0 ? -1 : 1,
    deltaMmP5,
    paperAdvanceMm: model.state.paperAdvanceMm
  });
  syncUi();
  return true;
}
ui.paperAlignBackBtn.addEventListener('click', () => stepManualPaper(-1));
ui.paperAlignForwardBtn.addEventListener('click', () => stepManualPaper(1));
ui.paperBailBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setPaperBail(!model.state.paperBailEngaged);
  runtime.lastAction = model.state.paperBailEngaged ? 'paper-bail-engaged' : 'paper-bail-released';
  recordEvent(model.state.paperBailEngaged ? 'PAPER_BAIL_ENGAGED' : 'PAPER_BAIL_RELEASED');
  syncUi();
});
function updateBailRoller(side, input) {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) {
    syncUi();
    return;
  }
  const normalized = Number(input.value) / 100;
  model.setPaperBailRollerPosition(side, normalized);
  runtime.lastAction = 'paper-bail-' + side + '-roller';
  recordEvent('PAPER_BAIL_ROLLER_ADJUSTED', { side, normalized });
  syncUi();
}
ui.bailLeft.addEventListener('input', () => updateBailRoller('left', ui.bailLeft));
ui.bailRight.addEventListener('input', () => updateBailRoller('right', ui.bailRight));
ui.ribbonModeBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  const modes = ['low', 'middle', 'high', 'stencil'];
  const current = modes.indexOf(model.state.ribbonPrintMode);
  const next = modes[(current + 1 + modes.length) % modes.length];
  model.setRibbonMode(next);
  runtime.lastAction = 'ribbon-mode-' + next;
  recordEvent('RIBBON_MODE_' + next.toUpperCase());
  syncUi();
});
ui.ribbonLoadBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setRibbonLoadState(!model.state.ribbonLoadState);
  runtime.lastAction = model.state.ribbonLoadState ? 'ribbon-load-on' : 'ribbon-load-off';
  recordEvent(model.state.ribbonLoadState ? 'RIBBON_LOAD_POSITION' : 'RIBBON_LOAD_RELEASED');
  syncUi();
});
function setMarginAtCarrier(side) {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  const index = carrierColumnIndex();
  if (side === 'left') {
    model.setMarginInsets(index, model.state.rightMarginInsetColumns);
    runtime.lastAction = 'left-margin-set';
    recordEvent('LEFT_MARGIN_SET', { index, x: model.state.leftMarginX });
  } else if (side === 'right') {
    // The 215.9 mm writing span is exactly 102 12-CPI pitches. Right inset is therefore
    // measured from the opposite writing-line boundary, not from the highest 0-based key index.
    model.setMarginInsets(model.state.leftMarginInsetColumns, CANONICAL.nominalPositions - index);
    runtime.lastAction = 'right-margin-set';
    recordEvent('RIGHT_MARGIN_SET', { index, x: model.state.rightMarginX });
  } else {
    return false;
  }
  syncUi();
  return true;
}
ui.marginLeftBtn.addEventListener('click', () => setMarginAtCarrier('left'));
ui.marginRightBtn.addEventListener('click', () => setMarginAtCarrier('right'));
ui.marginResetBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setMarginInsets(0, 0);
  runtime.lastAction = 'margins-reset';
  recordEvent('MARGINS_RESET');
  syncUi();
});

ui.copyControlBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setCopyControl((model.state.copyControlSetting + 1) % 5);
  runtime.lastAction = 'copy-control-' + (model.state.copyControlSetting + 1);
  recordEvent('COPY_CONTROL_SETTING', { setting: model.state.copyControlSetting });
  syncUi();
});
ui.platenVariableBtn.addEventListener('click', () => {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return;
  model.setPlatenVariable(!model.state.platenVariableEngaged);
  runtime.lastAction = model.state.platenVariableEngaged ? 'platen-variable-free' : 'platen-variable-coupled';
  recordEvent(model.state.platenVariableEngaged ? 'PLATEN_VARIABLE_FREE' : 'PLATEN_VARIABLE_COUPLED');
  syncUi();
});
function stepManualPlaten(direction) {
  if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
  const step = Math.PI * 2 / CANONICAL.platen.representativeRatchetTeeth;
  const moved = model.rotatePlatenManually(Math.sign(direction || 0) * step);
  if (!moved) return false;
  runtime.lastAction = direction < 0 ? 'manual-platen-back' : 'manual-platen-forward';
  recordEvent('MANUAL_PLATEN_STEP', {
    direction: direction < 0 ? -1 : 1,
    angleRad: model.state.manualPlatenAngle,
    paperAdvanceMm: model.state.paperAdvanceMm
  });
  syncUi();
  return true;
}
ui.platenBackBtn.addEventListener('click', () => stepManualPlaten(-1));
ui.platenForwardBtn.addEventListener('click', () => stepManualPlaten(1));
ui.resetBtn.addEventListener('click', resetMechanicalState);
ui.explode.addEventListener('input', () => {
  const amount = Number(ui.explode.value) / 100;
  model.setInspectionCutaway('none');
  model.setExplosion(amount);
  if (amount >= 0.20) {
    const preset = presets.exploded;
    model.setServiceCover(preset.cover);
    camera.position.fromArray(preset.position);
    orbit.target.fromArray(preset.target);
    orbit.update();
    document.querySelectorAll('[data-view]').forEach(other => other.classList.remove('active'));
  } else if (amount === 0) {
    const preset = presets.product;
    model.setServiceCover(preset.cover);
    camera.position.fromArray(preset.position);
    orbit.target.fromArray(preset.target);
    orbit.update();
    document.querySelectorAll('[data-view]').forEach(other => other.classList.toggle('active', other.dataset.view === 'product'));
  }
  syncUi();
});

const presets = {
  product: { position: [350, 235, 505], target: [0, 78, -4], cover: 0 },
  carrier: { position: [285, 190, 245], target: [0, 101, -58], cover: 1 },
  selection: { position: [0, 155, 330], target: [0, 72, -34], cover: 1 },
  ribbon: { position: [235, 165, 205], target: [0, 101, -50], cover: 1 },
  paper: { position: [0, 175, 300], target: [0, 127, -92], cover: 1 },
  power: { position: [-70, 190, 350], target: [-80, 55, 5], cover: 1 },
  rack: { position: [0, 108, 178], target: [0, 74, -72], cover: 1 },
  exploded: { position: [500, 330, 600], target: [0, 78, -18], cover: 0 }
};

document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(other => other.classList.toggle('active', other === button));
    const preset = presets[button.dataset.view];
    if (!preset) return;
    model.setInspectionCutaway(button.dataset.view === 'power' ? 'powerframe' : 'none');
    model.setServiceCover(preset.cover);
    camera.position.fromArray(preset.position);
    orbit.target.fromArray(preset.target);
    orbit.update();
    syncUi();
  });
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function isVisibleThroughParents(object) {
  for (let current = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}

renderer.domElement.addEventListener('pointerdown', event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(model.pickables, true).find(result => isVisibleThroughParents(result.object));
  const component = hit?.object?.userData?.component;
  if (!component) return;
  ui.partName.textContent = component.name;
  ui.partCategory.textContent = component.category.toUpperCase();
  ui.partProvenance.textContent = component.provenance;
  ui.partDescription.textContent = component.description;
});

window.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;

  if (event.key === ' ') {
    event.preventDefault();
    ui.spaceBtn.click();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    ui.tabBtn.click();
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    ui.backspaceBtn.click();
  } else if (event.key === 'Enter') {
    ui.returnBtn.click();
  } else if (event.key === 'Shift') {
    return;
  } else if (event.key.length === 1) {
    requestCharacter(event.key);
  }
});

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
}

function snapshot() {
  return {
    running: true,
    powered: runtime.powered,
    cycle: runtime.cycle,
    operation: runtime.operation ? { type: runtime.operation.type, from: runtime.operation.from, to: runtime.operation.to } : null,
    serviceOperation: runtime.serviceOperation ? { type: runtime.serviceOperation.type } : null,
    line: runtime.line,
    lastAction: runtime.lastAction,
    pendingCharacter: runtime.pendingCharacter,
    storedSpace: runtime.storedSpace,
    keyboardCode: model.state.keyboardCode,
    keyboardCodeBitOrder: ['T1','T2','R1','R2','R2A','fiveUnit'],
    keyboardPress: {
      character: model.state.keyboardPressCharacter,
      depression: model.state.keyboardPress
    },
    carrierX: model.state.carrierX,
    margins: {
      leftInsetColumns: model.state.leftMarginInsetColumns,
      rightInsetColumns: model.state.rightMarginInsetColumns,
      leftX: model.state.leftMarginX,
      rightX: model.state.rightMarginX
    },
    tabStops: [...model.state.tabStopIndices],
    selection: {
      tiltBand: model.state.tiltBand,
      rotateUnit: model.state.rotateUnit,
      shiftHemisphere: model.state.shiftHemisphere,
      shiftAngleDeg: model.state.shiftAngleDeg,
      selectorInputs: { ...model.state.selectorInputs },
      mappingClass: 'P5 deterministic key-to-slot presentation; not a specific IBM typeball layout'
    },
    ribbonLift: model.state.ribbonLift,
    ribbonPrintMode: model.state.ribbonPrintMode,
    ribbonLoadState: model.state.ribbonLoadState,
    ribbonFeedSuppressedCount: model.state.ribbonFeedSuppressedCount,
    fineAlignment: {
      tiltDetent: model.state.tiltDetent,
      rotateDetent: model.state.rotateDetent
    },
    ribbonFeedStep: model.state.ribbonFeedStep,
    ribbonFeedDirection: model.state.ribbonFeedDirection,
    ribbonReverseState: model.state.ribbonReverseState,
    ribbonReversePhase: model.state.ribbonReversePhase,
    ribbonReverseCount: model.state.ribbonReverseCount,
    printApproach: model.state.printApproach,
    platenIndex: model.state.platenIndex,
    paperAdvanceMm: model.state.paperAdvanceMm,
    lineSpacingTeeth: model.state.lineSpacingTeeth,
    cyclePhase: model.state.cyclePhase,
    explosion: model.state.explosion,
    serviceCoverOpen: model.state.serviceCoverOpen,
    feedRollsEngaged: model.state.feedRollsEngaged,
    paperBailEngaged: model.state.paperBailEngaged,
    copyControlSetting: model.state.copyControlSetting,
    copyControlOffsetZ: model.state.copyControlOffsetZ,
    platenVariableEngaged: model.state.platenVariableEngaged,
    geometry: model.geometryDiagnostics(),
    events: runtime.eventLog.map(event => ({ ...event })),
    profile: CANONICAL.profile
  };
}

window.__selectricDebug = {
  get state() { return snapshot(); },
  setPower(value) {
    const next = Boolean(value);
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    runtime.powered = next;
    syncUi();
    return true;
  },
  holdCharacterAt(char = 'a', progress = 0.62) {
    if (!runtime.powered || runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    startCharacterCycle(char);
    runtime.debugCycleHold = THREE.MathUtils.clamp(Number(progress) || 0, 0, 0.999);
    runCycle(performance.now());
    syncUi();
    return true;
  },
  releaseCharacterHold() {
    if (runtime.debugCycleHold === null || runtime.cycle === 'C0_REST') return false;
    const held = runtime.debugCycleHold;
    runtime.debugCycleHold = null;
    runtime.cycleStart = performance.now() - held * runtime.cycleDurationMs;
    return true;
  },
  typeCharacter: char => requestCharacter(char || 'a'),
  setRibbonMode: mode => {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    model.setRibbonMode(mode);
    syncUi();
    return true;
  },
  cycleRibbonMode: () => ui.ribbonModeBtn.click(),
  setRibbonLoadState: active => {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    model.setRibbonLoadState(active);
    syncUi();
    return true;
  },
  toggleRibbonLoad: () => ui.ribbonLoadBtn.click(),
  primeRibbonAutoReverse: () => model.primeRibbonAutoReverse(),
  setMarginInsets(leftColumns, rightColumns) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    model.setMarginInsets(leftColumns, rightColumns);
    syncUi();
    return true;
  },
  setLineSpacing(teeth) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    model.setLineSpacingMode(teeth);
    syncUi();
    return true;
  },
  setTabStops(indices) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    model.setTabStops(indices);
    syncUi();
    return true;
  },
  setTabStopAt(index, enabled = true) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    const changed = model.setTabStopAt(index, enabled);
    syncUi();
    return changed;
  },
  space: () => ui.spaceBtn.click(),
  tab: () => ui.tabBtn.click(),
  backspace: () => ui.backspaceBtn.click(),
  carriageReturn: () => ui.returnBtn.click(),
  index: () => ui.indexBtn.click(),
  togglePaperRelease: () => ui.paperReleaseBtn.click(),
  repositionPaperManually(deltaMm) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    const moved = model.repositionPaperManually(deltaMm);
    syncUi();
    return moved;
  },
  stepPaperAlignment: direction => direction < 0 ? ui.paperAlignBackBtn.click() : ui.paperAlignForwardBtn.click(),
  togglePaperBail: () => ui.paperBailBtn.click(),
  setPaperBailRollerPosition(side, normalized) {
    if (runtime.cycle !== 'C0_REST' || runtime.operation || runtime.serviceOperation) return false;
    const changed = model.setPaperBailRollerPosition(side, normalized);
    syncUi();
    return changed;
  },
  cycleCopyControl: () => ui.copyControlBtn.click(),
  setCopyControl: setting => {
    model.setCopyControl(setting);
    syncUi();
  },
  togglePlatenVariable: () => ui.platenVariableBtn.click(),
  rotatePlatenManually: delta => {
    const moved = model.rotatePlatenManually(delta);
    syncUi();
    return moved;
  },
  shift: () => ui.shiftBtn.click(),
  toggleServiceCover: () => ui.coverBtn.click(),
  setServiceCover: value => {
    model.setServiceCover(value);
    syncUi();
  },
  reset: resetMechanicalState,
  setExplosion(value) {
    const amount = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    model.setInspectionCutaway('none');
    model.setExplosion(amount);
    ui.explode.value = String(Math.round(model.state.explosion * 100));
    if (amount >= 0.20) {
      const preset = presets.exploded;
      model.setServiceCover(preset.cover);
      camera.position.fromArray(preset.position);
      orbit.target.fromArray(preset.target);
      orbit.update();
    } else if (amount === 0) {
      const preset = presets.product;
      model.setServiceCover(preset.cover);
      camera.position.fromArray(preset.position);
      orbit.target.fromArray(preset.target);
      orbit.update();
    }
    syncUi();
  }
};

function animate(now) {
  requestAnimationFrame(animate);
  resize();
  if (runtime.powered) model.setMotorPhase(now * 0.00022);
  runCycle(now);
  runCarrierOperation(now);
  runServiceOperation(now);
  orbit.update();
  renderer.render(scene, camera);
}

resetMechanicalState();
ui.loading.hidden = true;
requestAnimationFrame(animate);
