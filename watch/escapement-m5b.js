import * as THREE from 'three';
import { box, disc, polygonPlate, ring } from './geometry.js';

const TAU = Math.PI * 2;
const BEATS_PER_SECOND = 6;
const BEAT_SECONDS = 1 / BEATS_PER_SECOND;
const ESCAPE_TEETH = 15;
const HALF_TOOTH_ANGLE = TAU / (ESCAPE_TEETH * 2);
const ESCAPE_PERIOD_SECONDS = 5;
const BALANCE_AMPLITUDE = 0.43;
const PALLET_CENTER = -0.22;
const PALLET_BANK = 0.135;

// Event-window timing remains presentation/reconstruction timing. M5b adds a
// geometric diagnostic layer around it rather than pretending these values are
// ETA production pallet drawings.
const PHASES = {
  lockEntryEnd: 0.08,
  unlockEnd: 0.16,
  impulseEnd: 0.34
};

const TARGETS = {
  lockDepthDeg: 1.8,
  dropDeg: 2.2,
  drawDeg: 12.0,
  bankDeg: THREE.MathUtils.radToDeg(PALLET_BANK),
  rollerForkClearanceMm: 0.12,
  hornClearanceMm: 0.10
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function translucent(material, opacity) {
  const clone = material.clone();
  clone.transparent = true;
  clone.opacity = opacity;
  clone.depthWrite = false;
  return clone;
}

function makeRollerAndJewel(balance, materials) {
  if (!balance) return null;
  const group = new THREE.Group();
  group.name = 'M5b roller table, guard roller and impulse jewel';

  const table = disc(1.02, .16, materials.brushedSteel, 64);
  table.position.z = -.32;
  group.add(table);

  const guardRoller = disc(.62, .11, materials.darkSteel, 48);
  guardRoller.position.z = -.43;
  group.add(guardRoller);

  const neutralAngle = -0.205;
  const jewel = box(.24, .42, .20, materials.ruby);
  jewel.position.set(Math.cos(neutralAngle) * .92, Math.sin(neutralAngle) * .92, -.48);
  jewel.rotation.z = neutralAngle;
  group.add(jewel);

  const clearanceRing = ring(1.18, .025, translucent(materials.lightGizmo, .72), 6, 96);
  clearanceRing.position.z = -.50;
  clearanceRing.visible = false;
  group.add(clearanceRing);

  balance.add(group);
  return { group, table, guardRoller, jewel, clearanceRing };
}

function makeForkSafetyGeometry(pallet, materials) {
  if (!pallet) return null;
  const group = new THREE.Group();
  group.name = 'M5b fork horns, safety dart and fork-slot envelope';

  const hornMaterial = materials.brushedSteel;
  for (const y of [-.31, .31]) {
    const horn = box(2.18, .15, .17, hornMaterial);
    horn.position.set(-1.56, y, .02);
    group.add(horn);
  }

  const dart = box(1.08, .10, .13, materials.blueSteel);
  dart.position.set(-1.74, 0, -.10);
  group.add(dart);

  const slotMaterial = translucent(materials.lightGizmo, .34);
  const slot = polygonPlate([
    [-2.72,-.22],[-1.73,-.22],[-1.55,-.10],[-1.55,.10],[-1.73,.22],[-2.72,.22]
  ], .055, slotMaterial, { bevel: false });
  slot.position.z = -.18;
  slot.visible = false;
  group.add(slot);

  pallet.add(group);
  return { group, dart, slot };
}

function makePalletFaceModel(pallet, materials) {
  if (!pallet) return null;
  const group = new THREE.Group();
  group.name = 'M5b explicit pallet lock and impulse faces';

  const lockMaterial = translucent(materials.lightGizmo, .68);
  lockMaterial.color = new THREE.Color(0x73c7ff);
  const impulseMaterial = translucent(materials.lightGizmo, .74);
  impulseMaterial.color = new THREE.Color(0xffc766);

  const faces = [];
  for (const side of [-1, 1]) {
    const x = side * .52;
    const angle = side < 0 ? -.16 : .16;

    const lockFace = polygonPlate([
      [-.23,-.48],[.23,-.48],[.20,-.30],[-.18,-.28]
    ], .055, lockMaterial, { bevel: false });
    lockFace.position.set(x, 2.03, .12);
    lockFace.rotation.z = angle;
    group.add(lockFace);

    const impulseFace = polygonPlate([
      [-.18,-.28],[.20,-.30],[.17,.44],[-.15,.44]
    ], .055, impulseMaterial, { bevel: false });
    impulseFace.position.set(x, 2.03, .125);
    impulseFace.rotation.z = angle;
    group.add(impulseFace);

    faces.push({ side, lockFace, impulseFace });
  }

  pallet.add(group);
  return { group, faces };
}

function makeBankingPins(watch, pallet, materials) {
  if (!watch || !pallet) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5b banking pins and bank arc';

  const positions = [
    [pallet.position.x - .72, pallet.position.y - 1.05],
    [pallet.position.x + .72, pallet.position.y - 1.05]
  ];
  for (const [x, y] of positions) {
    const pin = disc(.15, .72, materials.caseSteel, 24);
    pin.position.set(x, y, pallet.position.z + .02);
    group.add(pin);
  }

  const bankPoints = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const a = PALLET_CENTER - PALLET_BANK + t * PALLET_BANK * 2;
    bankPoints.push(new THREE.Vector3(
      pallet.position.x + Math.cos(a - Math.PI / 2) * 1.28,
      pallet.position.y + Math.sin(a - Math.PI / 2) * 1.28,
      pallet.position.z + .42
    ));
  }
  const arc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(bankPoints),
    new THREE.LineBasicMaterial({ color: 0x91c8ff, transparent: true, opacity: .75, depthTest: false })
  );
  arc.visible = false;
  group.add(arc);

  layer.add(group);
  return { group, arc };
}

function makeDiagnosticOverlay(watch, materials) {
  if (!watch) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const group = new THREE.Group();
  group.name = 'M5b lock depth, drop and contact diagnostics';

  const guideMat = new THREE.LineBasicMaterial({ color: 0x7ec7ff, transparent: true, opacity: .58, depthTest: false });
  const centerPoints = [
    new THREE.Vector3(-5.4, -7.2, -.12),
    new THREE.Vector3(-7.2, -10.0, -.12),
    new THREE.Vector3(-10.1, -9.4, -.12)
  ];
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(centerPoints), guideMat));

  for (const [x, y] of [[-5.4,-7.2],[-7.2,-10.0],[-10.1,-9.4]]) {
    const marker = disc(.13, .08, materials.lightGizmo, 20);
    marker.position.set(x, y, -.10);
    group.add(marker);
  }

  const contactMaterial = translucent(materials.lightGizmo, .92);
  contactMaterial.color = new THREE.Color(0xffd67d);
  const contact = disc(.18, .08, contactMaterial, 24);
  contact.position.z = -.02;
  group.add(contact);

  const dropMaterial = translucent(materials.ruby, .60);
  const drop = disc(.11, .07, dropMaterial, 20);
  drop.position.z = -.01;
  group.add(drop);

  group.visible = false;
  layer.add(group);
  return { group, contact, drop };
}

function makeImpulseFlash(watch, materials) {
  if (!watch) return null;
  const layer = watch.getObjectByName('layer:escapement') ?? watch;
  const flashMaterial = translucent(materials.lightGizmo, .9);
  const flash = disc(.20, .10, flashMaterial, 24);
  flash.name = 'M5b impulse contact flash';
  flash.position.set(-8.55, -9.65, -.04);
  flash.visible = false;
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

  const lockDepth = phase.startsWith('lock') ? TARGETS.lockDepthDeg : Math.max(0, TARGETS.lockDepthDeg * (1 - releaseProgress));
  const drop = phase === 'lock-exit' ? TARGETS.dropDeg : (phase === 'unlock' ? TARGETS.dropDeg * .35 : 0);

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
    releaseProgress,
    lockDepthDeg: lockDepth,
    dropDeg: drop,
    drawDeg: TARGETS.drawDeg
  };
}

function nextEventDelta(mechanicalSeconds) {
  const beatFloat = Math.max(0, Number(mechanicalSeconds) || 0) * BEATS_PER_SECOND;
  const phase = beatFloat - Math.floor(beatFloat);
  const boundaries = [PHASES.lockEntryEnd, PHASES.unlockEnd, PHASES.impulseEnd, 1];
  const next = boundaries.find(value => value > phase + 1e-7) ?? 1;
  return Math.max(1e-5, (next - phase + 0.002) / BEATS_PER_SECOND);
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const roller = makeRollerAndJewel(animated.balance, materials);
  const forkSafety = makeForkSafetyGeometry(animated.pallet, materials);
  const palletFaces = makePalletFaceModel(animated.pallet, materials);
  const banking = makeBankingPins(watch, animated.pallet, materials);
  const diagnostics = makeDiagnosticOverlay(watch, materials);
  const impulseFlash = makeImpulseFlash(watch, materials);

  const state = {
    beatIndex: 0,
    phase: 'lock-entry',
    activePallet: 'ENTRY',
    releasedSeconds: 0,
    escapeHalfSteps: 0,
    running: false,
    lockDepthDeg: TARGETS.lockDepthDeg,
    dropDeg: 0
  };

  const ui = {
    phase: root.querySelector('#escapementPhaseValue'),
    pallet: root.querySelector('#activePalletValue'),
    beat: root.querySelector('#escapementBeatValue'),
    release: root.querySelector('#escapeReleaseValue'),
    guides: root.querySelector('#escapementGuides'),
    geometry: root.querySelector('#escapementGeometryGuides'),
    lockDepth: root.querySelector('#lockDepthValue'),
    drop: root.querySelector('#dropValue'),
    draw: root.querySelector('#drawValue'),
    banking: root.querySelector('#bankingValue'),
    stepBeat: root.querySelector('#stepBeatBtn'),
    stepEvent: root.querySelector('#stepEscapementEventBtn')
  };

  function setDiagnosticVisibility() {
    const visible = Boolean(ui.geometry?.checked);
    if (diagnostics) diagnostics.group.visible = visible;
    if (banking) banking.arc.visible = visible;
    if (roller?.clearanceRing) roller.clearanceRing.visible = visible;
    if (forkSafety?.slot) forkSafety.slot.visible = visible;
  }

  ui.guides?.addEventListener('change', () => {
    if (diagnostics) diagnostics.group.visible = ui.guides.checked || Boolean(ui.geometry?.checked);
  });
  ui.geometry?.addEventListener('change', setDiagnosticVisibility);

  ui.stepBeat?.addEventListener('click', () => powerSystem.advance(BEAT_SECONDS, 1));
  ui.stepEvent?.addEventListener('click', () => {
    const delta = nextEventDelta(powerSystem.state.mechanicalElapsedSeconds);
    powerSystem.advance(delta, 1);
  });

  function syncUI(sample, running) {
    const labels = {
      'lock-entry': 'LOCK · ENTRY',
      unlock: 'UNLOCK',
      impulse: 'IMPULSE',
      'lock-exit': 'LOCK · EXIT'
    };
    if (ui.phase) ui.phase.value = labels[sample.phase];
    if (ui.pallet) ui.pallet.value = `${sample.activePallet} PALLET`;
    if (ui.beat) ui.beat.value = `${sample.beatIndex}`;
    if (ui.release) ui.release.value = running ? `${sample.escapeHalfSteps.toFixed(2)} half-teeth` : 'HELD';
    if (ui.lockDepth) ui.lockDepth.value = `${sample.lockDepthDeg.toFixed(2)}° target`;
    if (ui.drop) ui.drop.value = `${sample.dropDeg.toFixed(2)}° target`;
    if (ui.draw) ui.draw.value = `${sample.drawDeg.toFixed(1)}° target`;
    if (ui.banking) ui.banking.value = `±${TARGETS.bankDeg.toFixed(1)}°`;
  }

  function updateContactDiagnostics(sample) {
    if (!diagnostics) return;

    const entry = new THREE.Vector2(-6.22, -8.52);
    const exit = new THREE.Vector2(-6.76, -8.98);
    const active = sample.activeSide > 0 ? entry : exit;
    const other = sample.activeSide > 0 ? exit : entry;

    diagnostics.contact.position.x = active.x;
    diagnostics.contact.position.y = active.y;
    diagnostics.drop.position.x = THREE.MathUtils.lerp(active.x, other.x, .24);
    diagnostics.drop.position.y = THREE.MathUtils.lerp(active.y, other.y, .24);

    diagnostics.contact.material.opacity = sample.phase === 'impulse' ? .98 : .52;
    diagnostics.contact.scale.setScalar(sample.phase === 'impulse' ? 1.22 : 1);
    diagnostics.drop.visible = sample.phase === 'unlock' || sample.phase === 'lock-exit';
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const sample = sampleSwissLever(mechanicalSeconds);
    Object.assign(state, {
      beatIndex: sample.beatIndex,
      phase: sample.phase,
      activePallet: sample.activePallet,
      releasedSeconds: sample.releasedSeconds,
      escapeHalfSteps: sample.escapeHalfSteps,
      running: Boolean(running),
      lockDepthDeg: sample.lockDepthDeg,
      dropDeg: sample.dropDeg
    });

    if (animated.balance) animated.balance.rotation.z = sample.balanceAngle;
    if (animated.pallet) animated.pallet.rotation.z = sample.palletAngle;
    if (animated.escapeWheel) animated.escapeWheel.rotation.z = escapeBase + sample.escapeAngle;

    if (impulseFlash) {
      impulseFlash.visible = running && sample.phase === 'impulse';
      if (impulseFlash.visible) {
        const pulse = Math.sin(sample.releaseProgress * Math.PI);
        impulseFlash.material.opacity = .45 + .45 * pulse;
        impulseFlash.scale.setScalar(.85 + .35 * pulse);
      }
    }

    updateContactDiagnostics(sample);
    syncUI(sample, running);
    return sample;
  }

  setDiagnosticVisibility();
  syncUI(sampleSwissLever(0), false);

  return {
    state,
    update,
    roller,
    forkSafety,
    palletFaces,
    bankingPins: banking?.group ?? null,
    guides: diagnostics?.group ?? null,
    diagnostics,
    constants: {
      beatsPerSecond: BEATS_PER_SECOND,
      beatSeconds: BEAT_SECONDS,
      escapeTeeth: ESCAPE_TEETH,
      halfToothDegrees: THREE.MathUtils.radToDeg(HALF_TOOTH_ANGLE),
      balanceAmplitudeDegrees: THREE.MathUtils.radToDeg(BALANCE_AMPLITUDE),
      palletBankDegrees: TARGETS.bankDeg,
      lockDepthTargetDeg: TARGETS.lockDepthDeg,
      dropTargetDeg: TARGETS.dropDeg,
      drawTargetDeg: TARGETS.drawDeg,
      rollerForkClearanceMm: TARGETS.rollerForkClearanceMm,
      hornClearanceMm: TARGETS.hornClearanceMm,
      phaseWindows: { ...PHASES }
    }
  };
}
