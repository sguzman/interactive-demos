import * as THREE from 'three';
import { box, disc } from './geometry.js';

const TAU = Math.PI * 2;
const BEATS_PER_SECOND = 6; // 3 Hz balance => 6 alternations / beats per second
const BEAT_SECONDS = 1 / BEATS_PER_SECOND;
const ESCAPE_TEETH = 15;
const HALF_TOOTH_ANGLE = TAU / (ESCAPE_TEETH * 2);
const ESCAPE_PERIOD_SECONDS = 5;
const BALANCE_AMPLITUDE = 0.43;
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;

// Presentation timing windows within one beat. They are deliberately labelled
// reconstruction timing, not ETA production lift/lock geometry.
const PHASES = {
  lockEntryEnd: 0.08,
  unlockEnd: 0.16,
  impulseEnd: 0.34
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function makeRollerAndJewel(balance, materials) {
  if (!balance) return null;
  const group = new THREE.Group();
  group.name = 'M5a roller table and impulse jewel';

  const table = disc(1.02, .16, materials.brushedSteel, 64);
  table.position.z = -.32;
  group.add(table);

  const guardRoller = disc(.62, .11, materials.darkSteel, 48);
  guardRoller.position.z = -.43;
  group.add(guardRoller);

  // Neutral jewel position points approximately from the balance staff toward
  // the pallet staff in the current reconstruction layout.
  const neutralAngle = -0.205;
  const jewel = box(.24, .42, .20, materials.ruby);
  jewel.position.set(Math.cos(neutralAngle) * .92, Math.sin(neutralAngle) * .92, -.48);
  jewel.rotation.z = neutralAngle;
  group.add(jewel);

  balance.add(group);
  return { group, table, jewel };
}

function makeForkSafetyGeometry(pallet, materials) {
  if (!pallet) return null;
  const group = new THREE.Group();
  group.name = 'M5a fork horns and guard dart';

  // In this reconstruction the balance lies almost directly along local -X
  // from the pallet staff. Two horns make the roller interaction readable.
  for (const y of [-.30, .30]) {
    const horn = box(2.15, .16, .17, materials.brushedSteel);
    horn.position.set(-1.55, y, .02);
    group.add(horn);
  }

  const dart = box(1.05, .10, .13, materials.blueSteel);
  dart.position.set(-1.72, 0, -.10);
  group.add(dart);

  pallet.add(group);
  return { group, dart };
}

function makeBankingPins(watch, pallet, materials) {
  if (!watch || !pallet) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5a banking pins';

  const positions = [
    [pallet.position.x - .72, pallet.position.y - 1.05],
    [pallet.position.x + .72, pallet.position.y - 1.05]
  ];

  for (const [x, y] of positions) {
    const pin = disc(.15, .72, materials.caseSteel, 24);
    pin.position.set(x, y, pallet.position.z + .02);
    group.add(pin);
  }

  layer.add(group);
  return group;
}

function makeGuideOverlay(watch, materials) {
  if (!watch) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5a escapement geometry guides';

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x7ec7ff,
    transparent: true,
    opacity: .58,
    depthTest: false
  });

  const points = [
    new THREE.Vector3(-5.4, -7.2, -.12),
    new THREE.Vector3(-7.2, -10.0, -.12),
    new THREE.Vector3(-10.1, -9.4, -.12)
  ];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
  line.renderOrder = 10;
  group.add(line);

  for (const [x, y] of [[-5.4, -7.2], [-7.2, -10.0], [-10.1, -9.4]]) {
    const marker = disc(.13, .08, materials.lightGizmo, 20);
    marker.position.set(x, y, -.10);
    marker.renderOrder = 11;
    group.add(marker);
  }

  group.visible = false;
  layer.add(group);
  return group;
}

function makeImpulseFlash(watch, materials) {
  if (!watch) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const flashMaterial = materials.lightGizmo.clone();
  flashMaterial.transparent = true;
  flashMaterial.opacity = .9;
  const flash = disc(.20, .10, flashMaterial, 24);
  flash.name = 'M5a impulse contact flash';
  flash.position.set(-8.55, -9.65, -.04);
  flash.visible = false;
  flash.renderOrder = 12;
  layer.add(flash);
  return flash;
}

function phaseFor(beatPhase) {
  if (beatPhase < PHASES.lockEntryEnd) return 'lock-entry';
  if (beatPhase < PHASES.unlockEnd) return 'unlock';
  if (beatPhase < PHASES.impulseEnd) return 'impulse';
  return 'lock-exit';
}

export function sampleSwissLever(mechanicalSeconds) {
  const seconds = Math.max(0, Number(mechanicalSeconds) || 0);
  const beatFloat = seconds * BEATS_PER_SECOND;
  const beatIndex = Math.floor(beatFloat + 1e-10);
  const beatPhase = beatFloat - Math.floor(beatFloat);
  const activeSide = beatIndex % 2 === 0 ? 1 : -1;
  const previousSide = -activeSide;
  const phase = phaseFor(beatPhase);

  let palletNormalized = previousSide;
  if (beatPhase >= PHASES.lockEntryEnd) {
    const travel = smooth01((beatPhase - PHASES.lockEntryEnd) / (PHASES.impulseEnd - PHASES.lockEntryEnd));
    palletNormalized = THREE.MathUtils.lerp(previousSide, activeSide, travel);
  }

  const releaseProgress = beatPhase < PHASES.lockEntryEnd
    ? 0
    : smooth01((beatPhase - PHASES.lockEntryEnd) / (PHASES.impulseEnd - PHASES.lockEntryEnd));

  const escapeHalfSteps = beatIndex + releaseProgress;
  const escapeAngle = escapeHalfSteps * HALF_TOOTH_ANGLE;
  const releasedSeconds = escapeAngle / TAU * ESCAPE_PERIOD_SECONDS;
  const balanceAngle = Math.sin(seconds * TAU * 3) * BALANCE_AMPLITUDE;

  return {
    beatIndex,
    beatPhase,
    phase,
    activeSide,
    activePallet: activeSide > 0 ? 'ENTRY' : 'EXIT',
    palletAngle: PALLET_CENTER + palletNormalized * PALLET_BANK,
    balanceAngle,
    escapeAngle,
    escapeHalfSteps,
    releasedSeconds,
    releaseProgress
  };
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const roller = makeRollerAndJewel(animated.balance, materials);
  const forkSafety = makeForkSafetyGeometry(animated.pallet, materials);
  const bankingPins = makeBankingPins(watch, animated.pallet, materials);
  const guides = makeGuideOverlay(watch, materials);
  const impulseFlash = makeImpulseFlash(watch, materials);

  const state = {
    beatIndex: 0,
    phase: 'lock-entry',
    activePallet: 'ENTRY',
    releasedSeconds: 0,
    escapeHalfSteps: 0,
    running: false
  };

  const ui = {
    phase: root.querySelector('#escapementPhaseValue'),
    pallet: root.querySelector('#activePalletValue'),
    beat: root.querySelector('#escapementBeatValue'),
    release: root.querySelector('#escapeReleaseValue'),
    guides: root.querySelector('#escapementGuides'),
    step: root.querySelector('#stepBeatBtn')
  };

  ui.guides?.addEventListener('change', () => {
    if (guides) guides.visible = ui.guides.checked;
  });

  ui.step?.addEventListener('click', () => {
    // At 0× paused this advances exactly one 6497 beat while consuming the
    // corresponding amount of stored reserve. If unwound, the power gate blocks it.
    powerSystem.advance(BEAT_SECONDS, 1);
  });

  function syncUI(sample, running) {
    if (ui.phase) {
      const labels = {
        'lock-entry': 'LOCK · ENTRY',
        unlock: 'UNLOCK',
        impulse: 'IMPULSE',
        'lock-exit': 'LOCK · EXIT'
      };
      ui.phase.value = labels[sample.phase];
    }
    if (ui.pallet) ui.pallet.value = `${sample.activePallet} PALLET`;
    if (ui.beat) ui.beat.value = `${sample.beatIndex}`;
    if (ui.release) ui.release.value = running ? `${sample.escapeHalfSteps.toFixed(2)} half-teeth` : 'HELD';
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const sample = sampleSwissLever(mechanicalSeconds);
    state.beatIndex = sample.beatIndex;
    state.phase = sample.phase;
    state.activePallet = sample.activePallet;
    state.releasedSeconds = sample.releasedSeconds;
    state.escapeHalfSteps = sample.escapeHalfSteps;
    state.running = Boolean(running);

    if (animated.balance) animated.balance.rotation.z = sample.balanceAngle;
    if (animated.pallet) animated.pallet.rotation.z = sample.palletAngle;
    if (animated.escapeWheel) animated.escapeWheel.rotation.z = escapeBase + sample.escapeAngle;

    if (impulseFlash) {
      impulseFlash.visible = running && sample.phase === 'impulse';
      if (impulseFlash.visible) {
        impulseFlash.material.opacity = .45 + .45 * Math.sin(sample.releaseProgress * Math.PI);
        impulseFlash.scale.setScalar(.85 + .35 * Math.sin(sample.releaseProgress * Math.PI));
      }
    }

    syncUI(sample, running);
    return sample;
  }

  const initial = sampleSwissLever(0);
  syncUI(initial, false);

  return {
    state,
    update,
    guides,
    roller,
    forkSafety,
    bankingPins,
    constants: {
      beatsPerSecond: BEATS_PER_SECOND,
      beatSeconds: BEAT_SECONDS,
      escapeTeeth: ESCAPE_TEETH,
      halfToothDegrees: THREE.MathUtils.radToDeg(HALF_TOOTH_ANGLE),
      balanceAmplitudeDegrees: THREE.MathUtils.radToDeg(BALANCE_AMPLITUDE),
      palletBankDegrees: THREE.MathUtils.radToDeg(PALLET_BANK),
      phaseWindows: { ...PHASES }
    }
  };
}
