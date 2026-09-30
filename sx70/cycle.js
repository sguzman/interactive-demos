const Y_DELAY_SECONDS = 0.040;

// These durations are P5 presentation timing. They preserve canonical order and make the
// mechanism inspectable; they are not claimed as measured production timings.
const PRESENTATION = {
  shutterClosing: 0.10,
  initialMotorRun: 0.13,
  reflexRelease: 0.15,
  motorBraked: 0.045,
  shutterOpening: 0.085,
  shutterReclosing: 0.085,
  postExposureMotorRun: 0.10,
  pickTransfer: 0.17,
  rollerProcessing: 0.62,
  reflexRecock: 0.42,
  terminalBrake: 0.075,
  maxPresentationExposure: 2.4
};

const PHASE_ORDER = [
  'idle',
  'shutter-closing',
  'initial-motor-run',
  'reflex-release',
  'motor-braked',
  'Y-delay',
  'integrating',
  'shutter-reclosing',
  'post-exposure-motor-run',
  'pick-transfer',
  'roller-processing',
  'reflex-recock',
  'terminal-brake'
];

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

export function createExposureCycle() {
  const state = {
    phase: 'idle',
    phaseElapsed: 0,
    cycleElapsed: 0,
    cycleCount: 0,
    requested: false,
    opticalMode: 'viewing-open',
    shutterPosition: 1,
    reflexProgress: 0,
    motorRunning: false,
    motorBraked: false,
    pickProgress: 0,
    rollerProgress: 0,
    recockProgress: 0,
    exposureIntegrator: 0,
    exposureThreshold: 0.23,
    exposureSeconds: 0,
    sceneLight: 0.85,
    exposureCompensationEv: 0,
    S1: 'open',
    S3: 'closed',
    S4: 'viewing/open-state',
    S5: 'reset',
    lastEvent: 'ready-viewing',
    provenance: {
      transitionOrder: 'P0/P2 canonical Engineering state model',
      yDelay: 'P0 service anchor · 40 ± 5 ms',
      presentationDurations: 'P5 normalized',
      exposureResponse: 'P5 causal approximation'
    }
  };

  const pendingEvents = [];

  function emit(event) {
    state.lastEvent = event;
    pendingEvents.push(event);
  }

  function enter(phase, event) {
    state.phase = phase;
    state.phaseElapsed = 0;
    if (event) emit(event);

    switch (phase) {
      case 'idle':
        state.requested = false;
        state.opticalMode = 'viewing-open';
        state.shutterPosition = 1;
        state.reflexProgress = 0;
        state.motorRunning = false;
        state.motorBraked = false;
        state.pickProgress = 0;
        state.rollerProgress = 0;
        state.recockProgress = 0;
        state.exposureIntegrator = 0;
        state.exposureSeconds = 0;
        state.S1 = 'open';
        state.S3 = 'closed';
        state.S4 = 'viewing/open-state';
        state.S5 = 'reset';
        break;
      case 'shutter-closing':
        state.requested = true;
        state.opticalMode = 'shutter-closing';
        state.S1 = 'closed';
        state.S4 = 'moving-to-closed-state';
        break;
      case 'initial-motor-run':
        state.opticalMode = 'dark-transition';
        state.shutterPosition = 0;
        state.motorRunning = true;
        state.motorBraked = false;
        state.S1 = 'open'; // momentary user request has been accepted; the mechanism is latched.
        state.S4 = 'closed-state-transfer';
        break;
      case 'reflex-release':
        state.opticalMode = 'dark-transition';
        break;
      case 'motor-braked':
        state.motorRunning = false;
        state.motorBraked = true;
        state.S5 = 'brake-transfer';
        break;
      case 'Y-delay':
        state.opticalMode = 'exposure-ready';
        state.S3 = 'open';
        break;
      case 'integrating':
        state.opticalMode = 'exposing';
        state.motorRunning = false;
        state.motorBraked = true;
        state.exposureIntegrator = 0;
        state.exposureSeconds = 0;
        state.exposureThreshold = 0.23 * Math.pow(2, state.exposureCompensationEv);
        break;
      case 'shutter-reclosing':
        state.opticalMode = 'shutter-reclosing';
        break;
      case 'post-exposure-motor-run':
        state.opticalMode = 'dark-transition';
        state.shutterPosition = 0;
        state.motorRunning = true;
        state.motorBraked = false;
        state.S4 = 'post-exposure-transfer';
        break;
      case 'pick-transfer':
        state.pickProgress = 0;
        break;
      case 'roller-processing':
        state.pickProgress = 1;
        state.rollerProgress = 0;
        break;
      case 'reflex-recock':
        state.rollerProgress = 1;
        state.recockProgress = 0;
        break;
      case 'terminal-brake':
        state.motorRunning = false;
        state.motorBraked = true;
        state.S5 = 'terminal-transfer';
        break;
      default:
        break;
    }
  }

  function requestExposure(readiness = {}) {
    const ready =
      state.phase === 'idle' &&
      readiness.deploymentReady !== false &&
      readiness.packReady !== false &&
      readiness.darkSlideAbsent !== false &&
      readiness.sheetsRemaining !== 0;

    if (!ready) {
      emit('exposure-request-rejected');
      return false;
    }

    state.cycleCount += 1;
    state.cycleElapsed = 0;
    enter('shutter-closing', 'S1-close');
    return true;
  }

  function transition(nextPhase, event) {
    enter(nextPhase, event);
  }

  function step(dt) {
    const delta = Math.max(0, Math.min(Number(dt) || 0, 0.05));
    if (state.phase === 'idle') return drainEvents();

    state.phaseElapsed += delta;
    state.cycleElapsed += delta;

    switch (state.phase) {
      case 'shutter-closing': {
        state.shutterPosition = 1 - clamp01(state.phaseElapsed / PRESENTATION.shutterClosing);
        if (state.phaseElapsed >= PRESENTATION.shutterClosing) {
          state.shutterPosition = 0;
          transition('initial-motor-run', 'S4-transfer');
        }
        break;
      }

      case 'initial-motor-run':
        if (state.phaseElapsed >= PRESENTATION.initialMotorRun) {
          transition('reflex-release', 'reflex-unlatch');
        }
        break;

      case 'reflex-release':
        state.reflexProgress = smoothstep01(state.phaseElapsed / PRESENTATION.reflexRelease);
        if (state.phaseElapsed >= PRESENTATION.reflexRelease) {
          state.reflexProgress = 1;
          transition('motor-braked', 'S5-open');
        }
        break;

      case 'motor-braked':
        if (state.phaseElapsed >= PRESENTATION.motorBraked) {
          transition('Y-delay', 'S3-open');
        }
        break;

      case 'Y-delay':
        if (state.phaseElapsed >= Y_DELAY_SECONDS) {
          transition('integrating', 'delay-complete');
        }
        break;

      case 'integrating': {
        state.exposureSeconds += delta;
        state.shutterPosition = smoothstep01(state.phaseElapsed / PRESENTATION.shutterOpening);

        // Causal approximation only: both taking-path and photocell transmission increase with
        // blade opening. Exact slot geometry / transfer functions remain unresolved.
        const photocellTransmission = smoothstep01(state.shutterPosition);
        state.exposureIntegrator += state.sceneLight * photocellTransmission * delta;

        if (
          state.exposureIntegrator >= state.exposureThreshold ||
          state.exposureSeconds >= PRESENTATION.maxPresentationExposure
        ) {
          transition('shutter-reclosing', 'exposure-threshold');
        }
        break;
      }

      case 'shutter-reclosing': {
        state.shutterPosition = 1 - smoothstep01(state.phaseElapsed / PRESENTATION.shutterReclosing);
        if (state.phaseElapsed >= PRESENTATION.shutterReclosing) {
          state.shutterPosition = 0;
          transition('post-exposure-motor-run', 'S4-transfer-post-exposure');
        }
        break;
      }

      case 'post-exposure-motor-run':
        if (state.phaseElapsed >= PRESENTATION.postExposureMotorRun) {
          transition('pick-transfer', 'pick-start');
        }
        break;

      case 'pick-transfer':
        state.pickProgress = smoothstep01(state.phaseElapsed / PRESENTATION.pickTransfer);
        if (state.phaseElapsed >= PRESENTATION.pickTransfer) {
          state.pickProgress = 1;
          transition('roller-processing', 'roller-nip-capture');
        }
        break;

      case 'roller-processing':
        state.rollerProgress = smoothstep01(state.phaseElapsed / PRESENTATION.rollerProcessing);
        if (state.phaseElapsed >= PRESENTATION.rollerProcessing) {
          state.rollerProgress = 1;
          transition('reflex-recock', 'reflex-recock-phase');
        }
        break;

      case 'reflex-recock':
        state.recockProgress = smoothstep01(state.phaseElapsed / PRESENTATION.reflexRecock);
        state.reflexProgress = 1 - state.recockProgress;
        if (state.phaseElapsed >= PRESENTATION.reflexRecock) {
          state.recockProgress = 1;
          state.reflexProgress = 0;
          transition('terminal-brake', 'S5-terminal');
        }
        break;

      case 'terminal-brake':
        if (state.phaseElapsed >= PRESENTATION.terminalBrake) {
          state.shutterPosition = 1;
          enter('idle', 'S1-released-and-shutter-open');
        }
        break;

      default:
        throw new Error(`Unknown SX-70 cycle phase: ${state.phase}`);
    }

    return drainEvents();
  }

  function drainEvents() {
    return pendingEvents.splice(0, pendingEvents.length);
  }

  function setSceneLight(value) {
    state.sceneLight = Math.max(0.04, Math.min(1.5, Number(value) || 0.04));
  }

  function setExposureCompensation(value) {
    state.exposureCompensationEv = Math.max(-1.5, Math.min(1.5, Number(value) || 0));
  }

  function reset() {
    state.cycleElapsed = 0;
    state.cycleCount = 0;
    enter('idle', 'reset');
    drainEvents();
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function assertInvariants(context = {}) {
    const violations = [];

    if (context.deploymentReady === false && state.phase !== 'idle') {
      violations.push('cycle-active-while-deployment-not-ready');
    }
    if (state.opticalMode === 'viewing-open' && state.reflexProgress > 0.02) {
      violations.push('viewing-with-reflex-carrier-out-of-viewing-position');
    }
    if (state.phase === 'roller-processing' && context.filmInTransport === false) {
      violations.push('roller-processing-with-no-film-unit');
    }

    return violations;
  }

  return {
    state,
    phases: [...PHASE_ORDER],
    presentationTiming: { ...PRESENTATION, yDelay: Y_DELAY_SECONDS },
    requestExposure,
    step,
    reset,
    snapshot,
    setSceneLight,
    setExposureCompensation,
    assertInvariants
  };
}
