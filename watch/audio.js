// Public watch audio layer.
//
// These are real-watch recordings, not acoustic measurements of an ETA 6497-2.
// Running cadence is scheduled from the documented 3 Hz / 6 alternations per
// second movement model. Audio is a P5 presentation layer.

const TICK_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Watch_tick.ogg';
const WIND_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/91/Rewinding_an_automatic.ogg';

const BEATS_PER_SECOND = 6;
const MAX_AUDIBLE_TIME_SCALE = 2;

function makeAudio(src, volume) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

export function createWatchAudio({ root = document } = {}) {
  const tickPool = Array.from({ length: 4 }, () => makeAudio(TICK_URL, 0.13));
  const winding = makeAudio(WIND_URL, 0.22);
  const button = root.querySelector('#soundToggleBtn');
  const status = root.querySelector('#soundStatusValue');

  let enabled = true;
  let gestureUnlocked = false;
  let nextTickMs = 0;
  let poolIndex = 0;
  let windingStopTimer = null;
  let lastWindingPulseMs = -Infinity;

  const updateUI = note => {
    if (button) {
      button.textContent = enabled ? 'Sound: on' : 'Sound: off';
      button.setAttribute('aria-pressed', String(enabled));
    }
    if (status) status.value = note ?? (enabled ? 'REAL-WATCH AUDIO · GENERIC' : 'MUTED');
  };

  const markGesture = () => {
    gestureUnlocked = true;
  };

  const playTick = () => {
    if (!enabled || !gestureUnlocked) return;
    const audio = tickPool[poolIndex++ % tickPool.length];
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
      void audio.play().catch(() => {});
    } catch {}
  };

  const stopWinding = () => {
    if (windingStopTimer !== null) clearTimeout(windingStopTimer);
    windingStopTimer = null;
    try { winding.pause(); } catch {}
  };

  const playWindingBurst = (durationMs = 1600) => {
    if (!enabled || !gestureUnlocked) return;
    const now = performance.now();
    if (now - lastWindingPulseMs < 300) return;
    lastWindingPulseMs = now;
    stopWinding();
    try {
      // The public-domain source includes handling + rewinding. Start inside
      // the recording rather than at the wrist-removal lead-in.
      winding.currentTime = 5;
      void winding.play().catch(() => {});
      windingStopTimer = setTimeout(stopWinding, durationMs);
    } catch {}
  };

  const update = ({ running, timeScale = 1, nowMs = performance.now() }) => {
    if (!enabled || !gestureUnlocked || !running || timeScale <= 0 || timeScale > MAX_AUDIBLE_TIME_SCALE) {
      nextTickMs = nowMs;
      if (enabled && gestureUnlocked && timeScale > MAX_AUDIBLE_TIME_SCALE) {
        updateUI('TICK MUTED ABOVE 2×');
      }
      return;
    }

    updateUI('REAL WATCH TICK · 3 Hz CADENCE');
    const cadence = BEATS_PER_SECOND * Math.max(0.1, timeScale);
    const intervalMs = 1000 / cadence;
    if (nextTickMs <= 0 || nowMs - nextTickMs > intervalMs * 4) nextTickMs = nowMs;

    let emitted = 0;
    while (nowMs >= nextTickMs && emitted < 2) {
      playTick();
      nextTickMs += intervalMs;
      emitted += 1;
    }
  };

  button?.addEventListener('click', event => {
    if (event.isTrusted) markGesture();
    enabled = !enabled;
    if (!enabled) {
      stopWinding();
      for (const audio of tickPool) {
        try { audio.pause(); } catch {}
      }
    } else {
      // A tiny preview confirms that the browser has accepted the user's
      // audio gesture without starting the movement.
      playTick();
    }
    updateUI();
  });

  root.defaultView?.addEventListener('pointerdown', event => {
    if (event.isTrusted) markGesture();
  }, { capture: true });

  updateUI();

  return {
    update,
    playWindingBurst,
    markGesture,
    get enabled() { return enabled; },
    sources: {
      tick: TICK_URL,
      winding: WIND_URL
    }
  };
}
