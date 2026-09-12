import * as THREE from 'three';
import {
  createEscapementSystem as createM5dEscapementSystem,
  sampleSwissLever
} from './escapement-m5d.js';

const NOMINAL_HZ = 3;
const NOMINAL_BEATS_PER_SECOND = 6;
const NOMINAL_AH = 21600;
const SECONDS_PER_DAY = 86400;

// M5e is an explicitly educational isochronism model. These values are not
// measured ETA 6497-2 timing data. The curve is intentionally visible enough to
// inspect while retaining the official 3 Hz / 21,600 A/h rate as the nominal
// reference.
const RATE_MODEL = {
  referenceAmplitude: 0.74,
  unlockAmplitude: 0.18,
  lowAmplitudeErrorSecPerDay: -120,
  highAmplitudeErrorSecPerDay: 12,
  nominalDeadband: 0.025,
  defaultStrength: 1
};

const clamp01 = value => Math.max(0, Math.min(1, value));

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function rateErrorForAmplitude(amplitude) {
  const a = clamp01(amplitude);
  const ref = RATE_MODEL.referenceAmplitude;
  const dead = RATE_MODEL.nominalDeadband;

  if (a < ref - dead) {
    const span = Math.max(1e-6, ref - dead - RATE_MODEL.unlockAmplitude);
    const depth = clamp01((ref - dead - a) / span);
    return RATE_MODEL.lowAmplitudeErrorSecPerDay * smooth01(depth);
  }

  if (a > ref + dead) {
    const span = Math.max(1e-6, 1 - ref - dead);
    const excess = clamp01((a - ref - dead) / span);
    return RATE_MODEL.highAmplitudeErrorSecPerDay * smooth01(excess);
  }

  return 0;
}

function formatSigned(value, digits = 1) {
  const n = Number(value) || 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;
}

function injectUI(root) {
  if (root.querySelector('#isochronismSection')) return;
  const controls = root.querySelector('.controls');
  const geometry = root.querySelector('#geometrySolverSection');
  const oscillator = root.querySelector('#balanceAmplitudeValue')?.closest('section');
  if (!controls || !oscillator) return;

  const section = root.createElement('section');
  section.id = 'isochronismSection';
  section.innerHTML = `
    <div class="section-title">Amplitude → rate · M5e</div>
    <div class="mode-grid diagnostic-stat">
      <div class="mode-stat"><span>Nominal rate</span><output>3.000 Hz · 21,600 A/h</output></div>
      <div class="mode-stat"><span>Effective frequency</span><output id="effectiveFrequencyValue">0.0000 Hz</output></div>
      <div class="mode-stat"><span>Effective alternations</span><output id="effectiveAhValue">0 A/h</output></div>
      <div class="mode-stat"><span>Rate error</span><output id="rateErrorValue">— stopped</output></div>
      <div class="mode-stat"><span>Oscillator phase drift</span><output id="phaseDriftValue">+0.000 s</output></div>
      <div class="mode-stat"><span>Isochronism zone</span><output id="isochronismZoneValue">STOPPED</output></div>
      <div class="mode-stat"><span>Reference amplitude</span><output>${(RATE_MODEL.referenceAmplitude * 100).toFixed(0)}% normalized</output></div>
      <div class="mode-stat"><span>Rate multiplier</span><output id="rateMultiplierValue">1.000000×</output></div>
    </div>
    <label class="select-row"><span>Rate-model strength</span><select id="rateModelStrength">
      <option value="0">0× off / nominal</option>
      <option value="1" selected>1× educational model</option>
      <option value="5">5× diagnostic exaggeration</option>
      <option value="20">20× extreme inspection</option>
    </select></label>
    <canvas id="isochronismPlot" width="280" height="112" style="width:100%;height:112px;border:1px solid #ffffff12;border-radius:8px;background:#080b0f;margin-top:8px"></canvas>
    <div class="winding-note">M5e finally lets amplitude perturb rate. The official specification remains 3 Hz / 21,600 A/h; the amplitude→seconds/day curve shown here is a deliberately transparent reconstruction model, not measured ETA timing data. Low normalized amplitude is modeled as increasingly slow, a narrow reference zone is nominal, and unusually high amplitude can run slightly fast. The diagnostic multipliers exaggerate only this assumed rate error so you can see drift without waiting all day.</div>`;

  controls.insertBefore(section, geometry ?? oscillator);

  const eyebrow = root.querySelector('header .eyebrow');
  const subtitle = root.querySelector('header .identity p');
  const loading = root.querySelector('#loading');
  const hint = root.querySelector('.controls > .hint');
  const infoText = root.querySelector('#infoText');
  if (eyebrow) eyebrow.textContent = 'REFERENCE RECONSTRUCTION · M5E';
  if (subtitle) subtitle.textContent = 'dynamic balance amplitude now perturbs simulated rate';
  if (loading) loading.textContent = 'Constructing 6497-2 M5e isochronism model…';
  if (hint) hint.textContent = 'M5e removes another hidden idealization: a weak balance no longer keeps perfectly nominal time. The geometry-constrained escapement still decides release, but an explicit amplitude→rate model now changes oscillator phase speed. Nominal ETA rate and simulated instantaneous rate remain separate outputs so the reconstruction does not smuggle assumptions in as specifications.';
  if (infoText) infoText.textContent = 'M5e retains the M5d geometry-constrained escapement and adds an explicit isochronism layer. Normalized balance amplitude now changes oscillator phase speed, so the released train and hands can gain or lose time relative to the nominal 3 Hz specification.';
}

function drawPlot(canvas, amplitude, currentError, strength) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 34, right: 10, top: 10, bottom: 20 };
  const x0 = pad.left;
  const x1 = width - pad.right;
  const y0 = height - pad.bottom;
  const y1 = pad.top;
  const low = RATE_MODEL.lowAmplitudeErrorSecPerDay * Math.max(1, strength);
  const high = RATE_MODEL.highAmplitudeErrorSecPerDay * Math.max(1, strength);
  const yMin = Math.min(-10, low * 1.08);
  const yMax = Math.max(10, high * 1.25);
  const x = a => x0 + clamp01(a) * (x1 - x0);
  const y = e => y0 - (e - yMin) / (yMax - yMin) * (y0 - y1);

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#26313b';
  ctx.beginPath();
  ctx.moveTo(x0, y(0));
  ctx.lineTo(x1, y(0));
  ctx.stroke();

  ctx.strokeStyle = '#1d2831';
  ctx.beginPath();
  ctx.moveTo(x(RATE_MODEL.unlockAmplitude), y1);
  ctx.lineTo(x(RATE_MODEL.unlockAmplitude), y0);
  ctx.moveTo(x(RATE_MODEL.referenceAmplitude), y1);
  ctx.lineTo(x(RATE_MODEL.referenceAmplitude), y0);
  ctx.stroke();

  ctx.strokeStyle = '#82c7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120;
    const e = rateErrorForAmplitude(a) * strength;
    const px = x(a);
    const py = y(e);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.fillStyle = '#ffda83';
  ctx.beginPath();
  ctx.arc(x(amplitude), y(currentError), 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#82909d';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('0%', x0 - 3, height - 5);
  ctx.fillText('100% amp', x1 - 42, height - 5);
  ctx.fillText('0 s/d', 3, y(0) + 3);
  ctx.fillText(`${Math.round(yMin)} s/d`, 2, y0 - 2);
}

export function createEscapementSystem({ watch, animated, materials, powerSystem, root = document }) {
  injectUI(root);
  const base = createM5dEscapementSystem({ watch, animated, materials, powerSystem, root });

  const state = {
    runtimeSeconds: powerSystem.state.mechanicalElapsedSeconds,
    oscillatorSeconds: powerSystem.state.mechanicalElapsedSeconds,
    phaseDriftSeconds: 0,
    rateErrorSecPerDay: 0,
    rateMultiplier: 1,
    effectiveHz: 0,
    effectiveAh: 0,
    strength: RATE_MODEL.defaultStrength,
    zone: 'stopped'
  };

  const ui = {
    frequency: root.querySelector('#effectiveFrequencyValue'),
    ah: root.querySelector('#effectiveAhValue'),
    error: root.querySelector('#rateErrorValue'),
    drift: root.querySelector('#phaseDriftValue'),
    zone: root.querySelector('#isochronismZoneValue'),
    multiplier: root.querySelector('#rateMultiplierValue'),
    strength: root.querySelector('#rateModelStrength'),
    plot: root.querySelector('#isochronismPlot')
  };

  ui.strength?.addEventListener('change', () => {
    state.strength = Math.max(0, Number(ui.strength.value) || 0);
  });

  function classifyZone(amplitude, running) {
    if (!running) return 'stopped';
    if (amplitude < RATE_MODEL.unlockAmplitude) return 'below unlock';
    if (amplitude < RATE_MODEL.referenceAmplitude - RATE_MODEL.nominalDeadband) return 'low amplitude · slow';
    if (amplitude > RATE_MODEL.referenceAmplitude + RATE_MODEL.nominalDeadband) return 'high amplitude · fast';
    return 'reference zone · nominal';
  }

  function syncUI(amplitude, running) {
    if (ui.frequency) ui.frequency.value = running ? `${state.effectiveHz.toFixed(5)} Hz` : '0.00000 Hz';
    if (ui.ah) ui.ah.value = running ? `${Math.round(state.effectiveAh).toLocaleString()} A/h` : '0 A/h';
    if (ui.error) ui.error.value = running ? `${formatSigned(state.rateErrorSecPerDay, 1)} s/day` : '— stopped';
    if (ui.drift) ui.drift.value = `${formatSigned(state.phaseDriftSeconds, 3)} s`;
    if (ui.zone) ui.zone.value = state.zone.toUpperCase();
    if (ui.multiplier) ui.multiplier.value = `${state.rateMultiplier.toFixed(7)}×`;
    drawPlot(ui.plot, amplitude, state.rateErrorSecPerDay, state.strength);
  }

  function update(mechanicalSeconds, escapeBase = 0, running = false) {
    const runtime = Math.max(0, Number(mechanicalSeconds) || 0);
    const deltaRuntime = Math.max(0, runtime - state.runtimeSeconds);
    const amplitudeBefore = clamp01(base.oscillatorState?.amplitude ?? 0);
    const rawError = rateErrorForAmplitude(amplitudeBefore);

    state.rateErrorSecPerDay = rawError * state.strength;
    state.rateMultiplier = 1 + state.rateErrorSecPerDay / SECONDS_PER_DAY;
    state.rateMultiplier = Math.max(0.95, Math.min(1.05, state.rateMultiplier));

    // Runtime is the amount of reserve consumed. Oscillator time is the phase
    // clock that determines center crossings and escapement events. Separating
    // the two is the central M5e change: a running watch can now accumulate
    // timing drift without pretending that reserve itself lasted longer/shorter.
    state.oscillatorSeconds += deltaRuntime * state.rateMultiplier;
    state.runtimeSeconds = runtime;
    state.phaseDriftSeconds = state.oscillatorSeconds - runtime;

    const sample = base.update(state.oscillatorSeconds, escapeBase, running);
    const amplitudeAfter = clamp01(base.oscillatorState?.amplitude ?? amplitudeBefore);
    state.effectiveHz = running ? NOMINAL_HZ * state.rateMultiplier : 0;
    state.effectiveAh = running ? NOMINAL_AH * state.rateMultiplier : 0;
    state.zone = classifyZone(amplitudeAfter, running);

    syncUI(amplitudeAfter, running);

    return {
      ...sample,
      nominalHz: NOMINAL_HZ,
      nominalAlternationsPerHour: NOMINAL_AH,
      effectiveHz: state.effectiveHz,
      effectiveAlternationsPerHour: state.effectiveAh,
      rateErrorSecPerDay: state.rateErrorSecPerDay,
      rateMultiplier: state.rateMultiplier,
      oscillatorSeconds: state.oscillatorSeconds,
      runtimeSeconds: runtime,
      phaseDriftSeconds: state.phaseDriftSeconds,
      isochronismZone: state.zone
    };
  }

  syncUI(0, false);

  return {
    ...base,
    geometryState: base.state,
    oscillatorState: base.oscillatorState,
    state,
    update,
    rateModel: { ...RATE_MODEL },
    rateErrorForAmplitude
  };
}

export { sampleSwissLever };
