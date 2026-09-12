// Reference-derived kinematics for the 6497 training-tool gear train.
//
// Source note: Horology Student documents the ETA training-tool train as:
// escape 15 teeth / pinion 10, seconds (fourth) wheel 120 / pinion 8,
// third wheel 60 / pinion 10, centre wheel 80. At 21,600 A/h (6 beats/s)
// the escape wheel turns once per 5 s, seconds wheel once per 60 s, third
// wheel once per 7.5 min, and centre wheel once per hour.
//
// This is reference-derived, not asserted as a manufacturing tooth-count sheet
// for every production 6497-2 variant.

export const TRAIN_REFERENCE = {
  beatsPerSecond: 6,
  escape: { teeth: 15, pinionLeaves: 10, periodSeconds: 5 },
  seconds: { teeth: 120, pinionLeaves: 8, periodSeconds: 60 },
  third: { teeth: 60, pinionLeaves: 10, periodSeconds: 450 },
  center: { teeth: 80, periodSeconds: 3600 },
  hour: { periodSeconds: 43200 }
};

const TAU = Math.PI * 2;

export function deriveTrainPeriods() {
  const escape = TRAIN_REFERENCE.escape.teeth * 2 / TRAIN_REFERENCE.beatsPerSecond;
  const seconds = escape * (TRAIN_REFERENCE.seconds.teeth / TRAIN_REFERENCE.escape.pinionLeaves);
  const third = seconds * (TRAIN_REFERENCE.third.teeth / TRAIN_REFERENCE.seconds.pinionLeaves);
  const center = third * (TRAIN_REFERENCE.center.teeth / TRAIN_REFERENCE.third.pinionLeaves);
  return { escape, seconds, third, center };
}

export function validateTrainReference(tolerance = 1e-9) {
  const derived = deriveTrainPeriods();
  return Object.entries(derived).every(([key, value]) => Math.abs(value - TRAIN_REFERENCE[key].periodSeconds) <= tolerance);
}

export function movementAngles(elapsedSeconds) {
  const beatIndex = Math.floor(elapsedSeconds * TRAIN_REFERENCE.beatsPerSecond);

  // Swiss lever: the escape wheel advances half a tooth per beat.
  const escape = beatIndex * (TAU / (TRAIN_REFERENCE.escape.teeth * 2));

  // Alternating mesh directions, referenced from the bridge-side view.
  const seconds = -elapsedSeconds * TAU / TRAIN_REFERENCE.seconds.periodSeconds;
  const third = elapsedSeconds * TAU / TRAIN_REFERENCE.third.periodSeconds;
  const center = -elapsedSeconds * TAU / TRAIN_REFERENCE.center.periodSeconds;

  return {
    beatIndex,
    escape,
    seconds,
    third,
    center,
    smallSecondsHand: seconds,
    minuteHand: center,
    hourHand: -elapsedSeconds * TAU / TRAIN_REFERENCE.hour.periodSeconds
  };
}
