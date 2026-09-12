import * as THREE from 'three';
import {
  sampleSwissLever,
  createEscapementSystem as createM5bEscapementSystem
} from './escapement-m5b.js';

const TAU = Math.PI * 2;
const BEATS_PER_SECOND = 6;
const BEAT_SECONDS = 1 / BEATS_PER_SECOND;

// M5c deliberately uses normalized oscillator energy rather than pretending to
// know the 6497-2 balance inertia, hairspring torque curve, pallet efficiency,
// or lubrication losses. These are educational dynamics targets.
const DYNAMICS = {
  dampingPerSecond: 0.16,
  impulseGain: 0.070,
  unlockThreshold: 0.18,
  restartEnergy: 0.012,
  restartAmplitude: 0.34,
  visualMaxAmplitudeRad: 0.43,
  torqueCollapseStart: 0.0015,
  torqueCollapseSpan: 0.015
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function torqueProxy(energy) {
  const e = clamp01(energy);
  if (e <= 0) return 0;

  // Broadly declining normalized barrel drive with a deliberately visible
  // collapse near the bottom of the reserve. This is NOT an ETA torque curve.
  const broad = 0.26 + 0.74 * Math.sqrt(e);
  const usable = smooth01((e - DYNAMICS.torqueCollapseStart) / DYNAMICS.torqueCollapseSpan);
  return clamp01(broad * usable);
}

function formatPercent(value, digits = 0) {
  return `${(clamp01(value) * 100).toFixed(digits)}%`;
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  const base = createM5bEscapementSystem({ watch, animated, materials, powerSystem, root });
  const windingSystem = powerSystem.windingSystem;
  const originalAdvance = powerSystem.advance.bind(powerSystem);

  const state = {
    amplitude: 0,
    torqueProxy: 0,
    lastImpulse: 0,
    successfulImpulses: 0,
    missedUnlocks: 0,
    canUnlock: false,
    oscillatorStatus: 'stopped',
    lastMechanicalSeconds: powerSystem.state.mechanicalElapsedSeconds,
    lastEnergyBeforeAdvance: windingSystem?.state.energy ?? 0,
    lastEnergyAfterAdvance: windingSystem?.state.energy ?? 0,
    balanceAngle: 0
  };

  const ui = {
    amplitude: root.querySelector('#balanceAmplitudeValue'),
    torque: root.querySelector('#torqueProxyValue'),
    impulse: root.querySelector('#impulsePacketValue'),
    margin: root.querySelector('#unlockMarginValue'),
    status: root.querySelector('#oscillatorStateValue'),
    successes: root.querySelector('#successfulImpulseValue'),
    misses: root.querySelector('#missedUnlockValue')
  };

  function maybeRestart(energy) {
    const e = clamp01(energy);
    if (state.amplitude >= DYNAMICS.unlockThreshold) return true;
    if (e < DYNAMICS.restartEnergy) return false;

    state.amplitude = Math.max(state.amplitude, DYNAMICS.restartAmplitude);
    state.oscillatorStatus = 'starting';
    state.canUnlock = true;
    return true;
  }

  // Interpose on the M4c power gate without changing older milestone callers.
  // When the balance no longer has enough normalized amplitude to unlock the
  // pallet, the barrel retains its remaining reserve and the train is held.
  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    const scale = Math.max(0, Number(mechanicalScale) || 0);
    const energy = windingSystem?.state.energy ?? 0;
    state.lastEnergyBeforeAdvance = energy;

    if (energy <= 0 || scale <= 0) {
      const consumed = originalAdvance(realSeconds, scale);
      state.lastEnergyAfterAdvance = windingSystem?.state.energy ?? 0;
      return consumed;
    }

    if (!state.canUnlock && !maybeRestart(energy)) {
      state.oscillatorStatus = 'stalled';
      state.lastEnergyAfterAdvance = energy;
      return powerSystem.hold(scale, 'LOW BALANCE AMPLITUDE');
    }

    const consumed = originalAdvance(realSeconds, scale);
    state.lastEnergyAfterAdvance = windingSystem?.state.energy ?? 0;
    return consumed;
  };

  function evolveAmplitude(fromSeconds, toSeconds) {
    const start = Math.max(0, Number(fromSeconds) || 0);
    const end = Math.max(start, Number(toSeconds) || start);
    let cursor = start;
    let nextBeat = (Math.floor(start * BEATS_PER_SECOND + 1e-9) + 1) / BEATS_PER_SECOND;
    let loops = 0;

    const averageEnergy = clamp01((state.lastEnergyBeforeAdvance + state.lastEnergyAfterAdvance) * 0.5);
    const drive = torqueProxy(averageEnergy);
    state.torqueProxy = drive;

    const decay = seconds => {
      if (seconds <= 0) return;
      state.amplitude *= Math.exp(-DYNAMICS.dampingPerSecond * seconds);
    };

    while (nextBeat <= end + 1e-9 && loops < 5000) {
      decay(nextBeat - cursor);
      cursor = nextBeat;

      if (state.amplitude >= DYNAMICS.unlockThreshold && drive > 0) {
        const packet = DYNAMICS.impulseGain * drive;
        state.amplitude += packet * (1 - state.amplitude);
        state.lastImpulse = packet;
        state.successfulImpulses += 1;
      } else {
        state.lastImpulse = 0;
        state.missedUnlocks += 1;
      }

      state.amplitude = clamp01(state.amplitude);
      nextBeat += BEAT_SECONDS;
      loops += 1;
    }

    decay(end - cursor);
    state.amplitude = clamp01(state.amplitude);
    state.canUnlock = state.amplitude >= DYNAMICS.unlockThreshold;

    if ((windingSystem?.state.energy ?? 0) <= 0) {
      state.amplitude = 0;
      state.canUnlock = false;
      state.lastImpulse = 0;
      state.oscillatorStatus = 'unwound';
    } else if (state.canUnlock) {
      state.oscillatorStatus = 'running';
    } else {
      state.oscillatorStatus = 'stalled';
    }
  }

  function syncDynamicsUI() {
    const margin = state.amplitude - DYNAMICS.unlockThreshold;
    if (ui.amplitude) ui.amplitude.value = formatPercent(state.amplitude, 1);
    if (ui.torque) ui.torque.value = formatPercent(state.torqueProxy, 1);
    if (ui.impulse) ui.impulse.value = formatPercent(state.lastImpulse / DYNAMICS.impulseGain, 1);
    if (ui.margin) ui.margin.value = margin >= 0 ? `+${(margin * 100).toFixed(1)}%` : `${(margin * 100).toFixed(1)}% · FAIL`;
    if (ui.status) {
      const labels = {
        stopped: 'STOPPED',
        starting: 'STARTING',
        running: 'RUNNING',
        stalled: 'STALLED · LOW AMPLITUDE',
        unwound: 'STOPPED · UNWOUND'
      };
      ui.status.value = labels[state.oscillatorStatus] ?? state.oscillatorStatus.toUpperCase();
    }
    if (ui.successes) ui.successes.value = `${state.successfulImpulses}`;
    if (ui.misses) ui.misses.value = `${state.missedUnlocks}`;
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const seconds = Math.max(0, Number(mechanicalSeconds) || 0);
    evolveAmplitude(state.lastMechanicalSeconds, seconds);
    state.lastMechanicalSeconds = seconds;

    const sample = base.update(seconds, escapeBase, running && state.canUnlock);
    const phase = seconds * TAU * 3;
    state.balanceAngle = Math.sin(phase) * DYNAMICS.visualMaxAmplitudeRad * state.amplitude;

    // M5b still owns the geometry and event diagnostics; M5c owns oscillator
    // amplitude, so override its fixed-amplitude balance presentation here.
    if (animated.balance) animated.balance.rotation.z = state.balanceAngle;

    syncDynamicsUI();
    return {
      ...sample,
      balanceAngle: state.balanceAngle,
      amplitude: state.amplitude,
      torqueProxy: state.torqueProxy,
      impulsePacket: state.lastImpulse,
      canUnlock: state.canUnlock,
      oscillatorStatus: state.oscillatorStatus
    };
  }

  syncDynamicsUI();

  return {
    ...base,
    state,
    update,
    dynamics: { ...DYNAMICS },
    torqueProxy
  };
}

export { sampleSwissLever };
