import * as THREE from 'three';
import {
  createEscapementSystem as createM5dEscapementSystem,
  sampleSwissLever
} from './escapement-m5d.js';
import { torqueProxy } from './escapement-m5c.js';
import { rateErrorForAmplitude } from './escapement-m5e.js';

const TAU = Math.PI * 2;
const NOMINAL_HZ = 3;
const NOMINAL_OMEGA = TAU * NOMINAL_HZ;
const NOMINAL_AH = 21600;
const SECONDS_PER_DAY = 86400;

// M5f is still an educational dynamics model. The state variables are now real
// integrated oscillator state (angle + angular velocity), but these normalized
// coefficients are not measured ETA 6497-2 balance/hairspring constants.
const PHYSICS = {
  maxVisualAngleRad: 0.43,
  dampingRatio: 0.0060,
  impulseVelocityGain: 0.42,
  unlockAmplitude: 0.18,
  restartEnergy: 0.012,
  restartAmplitude: 0.34,
  detailedStepSeconds: 1 / 240,
  detailedMaxSecondsPerFrame: 2.5,
  maxDetailedSteps: 720,
  defaultRateStrength: 1
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function wrapDelta(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function formatSigned(value, digits = 2) {
  const n = Number(value) || 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;
}

function normalizedAmplitude(theta, omega) {
  const velocityEquivalent = omega / NOMINAL_OMEGA;
  return clamp01(Math.hypot(theta, velocityEquivalent) / PHYSICS.maxVisualAngleRad);
}

function phaseFromState(theta, omega, naturalOmega = NOMINAL_OMEGA) {
  return Math.atan2(naturalOmega * theta, omega);
}

function rateMultiplierForAmplitude(amplitude, strength) {
  const error = rateErrorForAmplitude(amplitude) * strength;
  return {
    error,
    multiplier: THREE.MathUtils.clamp(1 + error / SECONDS_PER_DAY, 0.95, 1.05)
  };
}

function injectUI(root) {
  if (root.querySelector('#physicalOscillatorSection')) return;
  const controls = root.querySelector('.controls');
  const geometry = root.querySelector('#geometrySolverSection');
  const oscillator = root.querySelector('#balanceAmplitudeValue')?.closest('section');
  if (!controls || !oscillator) return;

  const section = root.createElement('section');
  section.id = 'physicalOscillatorSection';
  section.innerHTML = `
    <div class="section-title">Balance / hairspring state · M5f</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Balance angle θ</span><output id="balanceThetaValue">0.00°</output></div>
      <div class="mode-stat"><span>Angular velocity ω</span><output id="balanceOmegaValue">0.000 rad/s</output></div>
      <div class="mode-stat"><span>Normalized amplitude</span><output id="physicalAmplitudeValue">0.0%</output></div>
      <div class="mode-stat"><span>Restoring acceleration</span><output id="restoringAccelValue">0.00 rad/s²</output></div>
      <div class="mode-stat"><span>Damping acceleration</span><output id="dampingAccelValue">0.00 rad/s²</output></div>
      <div class="mode-stat"><span>Last impulse Δω</span><output id="physicalImpulseValue">0.000 rad/s</output></div>
      <div class="mode-stat"><span>Effective frequency</span><output id="physicalFrequencyValue">0.00000 Hz</output></div>
      <div class="mode-stat"><span>Rate error</span><output id="physicalRateErrorValue">— stopped</output></div>
      <div class="mode-stat"><span>Phase drift</span><output id="physicalPhaseDriftValue">+0.000 s</output></div>
      <div class="mode-stat"><span>Center crossings</span><output id="centerCrossingValue">0</output></div>
      <div class="mode-stat"><span>Impulse events</span><output id="physicalImpulseCountValue">0</output></div>
      <div class="mode-stat"><span>Integrator</span><output id="integratorModeValue">IDLE</output></div>
    </div>
    <label class="select-row"><span>Isochronism strength</span><select id="physicalRateStrength">
      <option value="0">0× nominal spring</option>
      <option value="1" selected>1× educational curve</option>
      <option value="5">5× diagnostic exaggeration</option>
      <option value="20">20× extreme inspection</option>
    </select></label>
    <canvas id="oscillatorPortrait" width="280" height="132" style="width:100%;height:132px;border:1px solid #ffffff12;border-radius:8px;background:#080b0f;margin-top:8px"></canvas>
    <div class="winding-note">M5f no longer advances the balance by assigning it a smart phase clock. It integrates θ and ω under a restoring term and damping term, then applies discrete angular-velocity kicks at center crossings when reserve and escapement geometry permit an impulse. The phase portrait above plots θ against ω/ω₀. At very large time scales the demo switches to an explicitly labelled fast-forward envelope approximation so the browser does not integrate thousands of 3 Hz cycles per rendered frame.</div>`;

  controls.insertBefore(section, geometry ?? oscillator);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5F';
  if (subtitle) subtitle.textContent = 'integrated balance angle + angular velocity + impulse dynamics';
  if (loading) loading.textContent = 'Constructing 6497-2 M5f oscillator state…';
  if (hint) hint.textContent = 'M5f turns the balance from a prescribed phase source into an integrated state. Hairspring restoring acceleration and damping evolve angle/velocity continuously; center-crossing impulses add angular velocity; the resulting unwrapped oscillator phase drives M5d pallet/contact geometry and therefore the train. Coefficients remain normalized educational parameters rather than measured ETA inertia or spring constants.';
  if (infoText) infoText.textContent = 'M5f integrates a normalized balance/hairspring oscillator with explicit angle, angular velocity, restoring acceleration, damping and discrete impulse kicks. Its phase drives the geometry-constrained escapement, so the train now follows an actual oscillator state rather than an assigned phase clock.';
}

function drawPortrait(canvas, history, theta, omega) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const sx = (width - 30) / (2 * PHYSICS.maxVisualAngleRad);
  const sy = (height - 26) / (2 * PHYSICS.maxVisualAngleRad);

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#1f2a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, cy);
  ctx.lineTo(width - 10, cy);
  ctx.moveTo(cx, 8);
  ctx.lineTo(cx, height - 18);
  ctx.stroke();

  if (history.length > 1) {
    ctx.strokeStyle = '#73bce8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((point, index) => {
      const x = cx + point.theta * sx;
      const y = cy - point.velocityEquivalent * sy;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  ctx.fillStyle = '#ffda83';
  ctx.beginPath();
  ctx.arc(cx + theta * sx, cy - (omega / NOMINAL_OMEGA) * sy, 4, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#82909d';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('θ', width - 14, cy - 4);
  ctx.fillText('ω/ω₀', cx + 4, 12);
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  // Tell the historical M5c layer to remain a geometry/event dependency only;
  // M5f now owns the oscillator gate and physical state.
  powerSystem.externalOscillator = true;
  const base = createM5dEscapementSystem({ watch, animated, materials, powerSystem, root });
  injectUI(root);

  const windingSystem = powerSystem.windingSystem;
  const rawAdvance = (powerSystem.rawAdvance ?? powerSystem.advance).bind(powerSystem);

  const state = {
    theta: 0,
    omega: 0,
    amplitude: 0,
    phaseUnwrapped: 0,
    oscillatorSeconds: 0,
    runtimeSeconds: powerSystem.state.mechanicalElapsedSeconds,
    phaseDriftSeconds: 0,
    rateErrorSecPerDay: 0,
    rateMultiplier: 1,
    effectiveHz: 0,
    torqueProxy: 0,
    lastImpulseDeltaOmega: 0,
    centerCrossings: 0,
    successfulImpulses: 0,
    missedImpulses: 0,
    canUnlock: false,
    status: 'stopped',
    integratorMode: 'idle',
    restoringAcceleration: 0,
    dampingAcceleration: 0,
    rateStrength: PHYSICS.defaultRateStrength,
    history: []
  };

  const ui = {
    theta: root.querySelector('#balanceThetaValue'),
    omega: root.querySelector('#balanceOmegaValue'),
    amplitude: root.querySelector('#physicalAmplitudeValue'),
    restoring: root.querySelector('#restoringAccelValue'),
    damping: root.querySelector('#dampingAccelValue'),
    impulse: root.querySelector('#physicalImpulseValue'),
    frequency: root.querySelector('#physicalFrequencyValue'),
    rate: root.querySelector('#physicalRateErrorValue'),
    drift: root.querySelector('#physicalPhaseDriftValue'),
    crossings: root.querySelector('#centerCrossingValue'),
    impulses: root.querySelector('#physicalImpulseCountValue'),
    integrator: root.querySelector('#integratorModeValue'),
    strength: root.querySelector('#physicalRateStrength'),
    portrait: root.querySelector('#oscillatorPortrait')
  };

  ui.strength?.addEventListener('change', () => {
    state.rateStrength = Math.max(0, Number(ui.strength.value) || 0);
  });

  function oscillatorAmplitude() {
    return normalizedAmplitude(state.theta, state.omega);
  }

  function seedOscillator(energy) {
    if (energy < PHYSICS.restartEnergy) return false;
    const targetAmplitude = PHYSICS.restartAmplitude;
    state.theta = 0;
    state.omega = targetAmplitude * PHYSICS.maxVisualAngleRad * NOMINAL_OMEGA;
    state.amplitude = targetAmplitude;
    state.canUnlock = true;
    state.status = 'starting';
    state.integratorMode = 'restart seed';
    return true;
  }

  // Replace the older M5c/M5d gate with a gate based on the actual M5f state.
  powerSystem.advance = (realSeconds, mechanicalScale = 1) => {
    const scale = Math.max(0, Number(mechanicalScale) || 0);
    const energy = windingSystem?.state.energy ?? 0;

    if (energy <= 0 || scale <= 0) return rawAdvance(realSeconds, scale);

    if (base.state?.consecutiveInvalid >= 3) {
      return powerSystem.hold(scale, 'GEOMETRY CONTACT');
    }

    state.amplitude = oscillatorAmplitude();
    state.canUnlock = state.amplitude >= PHYSICS.unlockAmplitude;
    if (!state.canUnlock && !seedOscillator(energy)) {
      state.status = 'stalled';
      return powerSystem.hold(scale, 'LOW PHYSICAL AMPLITUDE');
    }

    return rawAdvance(realSeconds, scale);
  };

  function currentNaturalOmega(amplitude) {
    const rate = rateMultiplierForAmplitude(amplitude, state.rateStrength);
    state.rateErrorSecPerDay = rate.error;
    state.rateMultiplier = rate.multiplier;
    return NOMINAL_OMEGA * rate.multiplier;
  }

  function recordPhase(previousPhase, naturalOmega) {
    const phase = phaseFromState(state.theta, state.omega, naturalOmega);
    let delta = wrapDelta(phase - previousPhase);
    if (delta < 0) delta = 0;
    state.phaseUnwrapped += delta;
    return phase;
  }

  function applyCenterImpulse(drive, geometryHealthy) {
    state.centerCrossings += 1;
    state.amplitude = oscillatorAmplitude();
    state.canUnlock = state.amplitude >= PHYSICS.unlockAmplitude;

    if (state.canUnlock && drive > 0 && geometryHealthy) {
      const direction = Math.sign(state.omega) || 1;
      const saturation = Math.max(0.25, 1 - state.amplitude * 0.28);
      const kick = PHYSICS.impulseVelocityGain * drive * saturation;
      state.omega += direction * kick;
      state.lastImpulseDeltaOmega = kick;
      state.successfulImpulses += 1;
    } else {
      state.lastImpulseDeltaOmega = 0;
      state.missedImpulses += 1;
    }
  }

  function integrateDetailed(deltaSeconds, drive, geometryHealthy) {
    const steps = Math.min(
      PHYSICS.maxDetailedSteps,
      Math.max(1, Math.ceil(deltaSeconds / PHYSICS.detailedStepSeconds))
    );
    const dt = deltaSeconds / steps;
    let naturalOmega = currentNaturalOmega(oscillatorAmplitude());
    let previousPhase = phaseFromState(state.theta, state.omega, naturalOmega);

    for (let i = 0; i < steps; i++) {
      const previousTheta = state.theta;
      const amplitude = oscillatorAmplitude();
      naturalOmega = currentNaturalOmega(amplitude);
      const restoring = -naturalOmega * naturalOmega * state.theta;
      const damping = -2 * PHYSICS.dampingRatio * naturalOmega * state.omega;
      state.restoringAcceleration = restoring;
      state.dampingAcceleration = damping;

      state.omega += (restoring + damping) * dt;
      state.theta += state.omega * dt;

      const crossedCenter = previousTheta !== 0 && previousTheta * state.theta <= 0;
      if (crossedCenter) applyCenterImpulse(drive, geometryHealthy);

      previousPhase = recordPhase(previousPhase, naturalOmega);
    }

    state.amplitude = oscillatorAmplitude();
    state.integratorMode = `ODE · ${steps} substeps`;
  }

  function integrateFastForward(deltaSeconds, drive, geometryHealthy) {
    const startAmplitude = oscillatorAmplitude();
    const rateStart = rateMultiplierForAmplitude(startAmplitude, state.rateStrength);
    const decayRate = PHYSICS.dampingRatio * NOMINAL_OMEGA;
    const normalizedKick = PHYSICS.impulseVelocityGain / (NOMINAL_OMEGA * PHYSICS.maxVisualAngleRad);
    const impulseRate = startAmplitude >= PHYSICS.unlockAmplitude && geometryHealthy
      ? NOMINAL_HZ * 2 * normalizedKick * drive
      : 0;
    const totalRate = decayRate + impulseRate;
    const equilibrium = totalRate > 0 ? impulseRate / totalRate : 0;
    const endAmplitude = totalRate > 0
      ? equilibrium + (startAmplitude - equilibrium) * Math.exp(-totalRate * deltaSeconds)
      : startAmplitude;
    const averageAmplitude = clamp01((startAmplitude + endAmplitude) * 0.5);
    const rate = rateMultiplierForAmplitude(averageAmplitude, state.rateStrength);
    const phaseAdvance = NOMINAL_OMEGA * rate.multiplier * deltaSeconds;
    const crossings = Math.max(0, Math.floor(phaseAdvance / Math.PI));

    if (impulseRate > 0) {
      state.successfulImpulses += crossings;
      state.lastImpulseDeltaOmega = PHYSICS.impulseVelocityGain * drive * Math.max(0.25, 1 - averageAmplitude * 0.28);
    } else {
      state.missedImpulses += crossings;
      state.lastImpulseDeltaOmega = 0;
    }
    state.centerCrossings += crossings;
    state.phaseUnwrapped += phaseAdvance;
    state.amplitude = clamp01(endAmplitude);
    state.rateErrorSecPerDay = rate.error;
    state.rateMultiplier = rate.multiplier;

    const phase = state.phaseUnwrapped % TAU;
    const naturalOmega = NOMINAL_OMEGA * rate.multiplier;
    state.theta = state.amplitude * PHYSICS.maxVisualAngleRad * Math.sin(phase);
    state.omega = state.amplitude * PHYSICS.maxVisualAngleRad * naturalOmega * Math.cos(phase);
    state.restoringAcceleration = -naturalOmega * naturalOmega * state.theta;
    state.dampingAcceleration = -2 * PHYSICS.dampingRatio * naturalOmega * state.omega;
    state.integratorMode = `FAST-FORWARD ENVELOPE · ${deltaSeconds.toFixed(1)} s`;
  }

  function syncHistoricalOscillatorUI() {
    const legacy = base.oscillatorState;
    if (!legacy) return;
    legacy.amplitude = state.amplitude;
    legacy.torqueProxy = state.torqueProxy;
    legacy.lastImpulse = state.lastImpulseDeltaOmega / Math.max(1e-6, PHYSICS.impulseVelocityGain);
    legacy.successfulImpulses = state.successfulImpulses;
    legacy.missedUnlocks = state.missedImpulses;
    legacy.canUnlock = state.canUnlock;
    legacy.balanceAngle = state.theta;
    legacy.oscillatorStatus = state.status === 'running' ? 'external' : state.status;
    base.setExternalState?.({
      amplitude: state.amplitude,
      torqueProxy: state.torqueProxy,
      lastImpulse: legacy.lastImpulse,
      balanceAngle: state.theta,
      canUnlock: state.canUnlock,
      oscillatorStatus: legacy.oscillatorStatus,
      successfulImpulses: state.successfulImpulses,
      missedUnlocks: state.missedImpulses
    });
  }

  function syncUI(running) {
    if (ui.theta) ui.theta.value = `${THREE.MathUtils.radToDeg(state.theta).toFixed(2)}°`;
    if (ui.omega) ui.omega.value = `${state.omega.toFixed(3)} rad/s`;
    if (ui.amplitude) ui.amplitude.value = `${(state.amplitude * 100).toFixed(1)}%`;
    if (ui.restoring) ui.restoring.value = `${state.restoringAcceleration.toFixed(2)} rad/s²`;
    if (ui.damping) ui.damping.value = `${state.dampingAcceleration.toFixed(2)} rad/s²`;
    if (ui.impulse) ui.impulse.value = `${state.lastImpulseDeltaOmega.toFixed(3)} rad/s`;
    if (ui.frequency) ui.frequency.value = running ? `${state.effectiveHz.toFixed(5)} Hz` : '0.00000 Hz';
    if (ui.rate) ui.rate.value = running ? `${formatSigned(state.rateErrorSecPerDay, 1)} s/day` : '— stopped';
    if (ui.drift) ui.drift.value = `${formatSigned(state.phaseDriftSeconds, 3)} s`;
    if (ui.crossings) ui.crossings.value = `${state.centerCrossings}`;
    if (ui.impulses) ui.impulses.value = `${state.successfulImpulses}`;
    if (ui.integrator) ui.integrator.value = state.integratorMode.toUpperCase();

    state.history.push({ theta: state.theta, velocityEquivalent: state.omega / NOMINAL_OMEGA });
    if (state.history.length > 240) state.history.splice(0, state.history.length - 240);
    drawPortrait(ui.portrait, state.history, state.theta, state.omega);
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const runtime = Math.max(0, Number(mechanicalSeconds) || 0);
    const deltaRuntime = Math.max(0, runtime - state.runtimeSeconds);
    const energy = windingSystem?.state.energy ?? 0;
    const drive = torqueProxy(energy);
    state.torqueProxy = drive;

    if (energy <= 0) {
      state.theta = 0;
      state.omega = 0;
      state.amplitude = 0;
      state.canUnlock = false;
      state.status = 'unwound';
      state.integratorMode = 'idle · unwound';
    } else if (deltaRuntime > 0 && running) {
      const geometryHealthy = base.state?.geometryHealthy !== false;
      if (deltaRuntime <= PHYSICS.detailedMaxSecondsPerFrame) {
        integrateDetailed(deltaRuntime, drive, geometryHealthy);
      } else {
        integrateFastForward(deltaRuntime, drive, geometryHealthy);
      }
      state.canUnlock = state.amplitude >= PHYSICS.unlockAmplitude;
      state.status = state.canUnlock ? 'running' : 'stalled';
    } else if (!running) {
      state.integratorMode = 'paused / held';
    }

    state.runtimeSeconds = runtime;
    state.oscillatorSeconds = state.phaseUnwrapped / NOMINAL_OMEGA;
    state.phaseDriftSeconds = state.oscillatorSeconds - runtime;
    state.effectiveHz = running ? NOMINAL_HZ * state.rateMultiplier : 0;

    syncHistoricalOscillatorUI();
    const sample = base.update(state.oscillatorSeconds, escapeBase, running && state.canUnlock);

    // The geometry/event stack still owns pallet and escape-wheel behavior; M5f
    // owns the balance body itself.
    if (animated.balance) animated.balance.rotation.z = state.theta;

    syncUI(running && state.canUnlock);

    return {
      ...sample,
      balanceAngle: state.theta,
      amplitude: state.amplitude,
      angularVelocity: state.omega,
      oscillatorSeconds: state.oscillatorSeconds,
      runtimeSeconds: runtime,
      phaseDriftSeconds: state.phaseDriftSeconds,
      rateErrorSecPerDay: state.rateErrorSecPerDay,
      rateMultiplier: state.rateMultiplier,
      effectiveHz: state.effectiveHz,
      effectiveAlternationsPerHour: state.effectiveHz * 7200,
      torqueProxy: state.torqueProxy,
      impulseDeltaOmega: state.lastImpulseDeltaOmega,
      canUnlock: state.canUnlock,
      oscillatorStatus: state.status,
      integratorMode: state.integratorMode
    };
  }

  syncUI(false);

  return {
    ...base,
    geometryState: base.state,
    oscillatorEnvelopeState: base.oscillatorState,
    state,
    update,
    physics: { ...PHYSICS },
    nominal: { hz: NOMINAL_HZ, alternationsPerHour: NOMINAL_AH, omega: NOMINAL_OMEGA }
  };
}

export { sampleSwissLever };
