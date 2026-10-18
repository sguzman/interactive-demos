import { test, expect } from '@playwright/test';

// NEVER run this on the promoted public baseline as a replacement for the
// historically frozen 325-pose regression. Candidate activates only via URL.
test.setTimeout(420_000);
test('optional P4 knob candidate: bridge clearance, phases, and reversible baseline', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1',
    { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null,
    { timeout: 20000 });
  expect(await page.evaluate(() => window.__selectricDebug.setPower(false))).toBe(true);

  const result = await page.evaluate(() => {
    const d = window.__selectricDebug;
    const read = () => d.hoodPlatenKnobSurfaceContactProbe().pairs.filter(
      row => row.coverPart === 'rear-service-bridge'
    );
    const readAll = () => d.hoodPlatenKnobSurfaceContactProbe().pairs;
    const originalVariable = d.state.platenVariableEngaged;
    let phase = 0;
    const observations = [];
    d.setExplosion(0);
    d.setCheekSmoothingPreview(false);
    d.setCopyControl(0);
    d.setServiceCover(0);
    if (!d.state.geometry.platenKnobCandidateP4Enabled) {
      throw new Error('Query flag did not activate candidate');
    }
    try {
      d.setPlatenKnobCandidateP4(false);
      const baseline = read();
      if (!baseline.every(row => row.surfaceWitnessPairs > 0)) {
        throw new Error('Frozen original P4 closed-cover baseline no longer collides');
      }
      d.setPlatenKnobCandidateP4(true);
      const initialEnvelope = d.platenKnobCandidateEnvelopeProbeP4();
      if (initialEnvelope.candidateMeshCount !== 28 ||
          initialEnvelope.candidateVisibleCount !== 28 ||
          initialEnvelope.baselineVisibleCount !== 0 ||
          initialEnvelope.outboardPartsPerSide.left !== 13 ||
          initialEnvelope.outboardPartsPerSide.right !== 13 ||
          initialEnvelope.minimumVisibleOutboardBridgeXGapMmP4 < 0.499999 ||
          initialEnvelope.segments.some(s => !['inboard-neck','outboard-grip','outboard-rib'].includes(s.role)) ||
          initialEnvelope.segments.filter(s => s.role === 'inboard-neck').length !== 2) {
        throw new Error('Actual candidate mesh topology or world bounds violate the experiment');
      }
      if (!originalVariable) d.togglePlatenVariable();
      for (const targetPhase of [0, Math.PI/24, Math.PI/12]) {
        if (Math.abs(targetPhase-phase) > 1e-12) {
          if (!d.rotatePlatenManually(targetPhase-phase)) {
            throw new Error('Failed to rotate platen-variable phase');
          }
        }
        phase = targetPhase;
        for (let copy = 0; copy < 5; copy++) {
          d.setCopyControl(copy);
          for (let f = 0; f <= 8; f++) {
            const opening = f/8;
            d.setServiceCover(opening);
            const pairs = read();
            const allPairs = readAll();
            const liveEnvelope = d.platenKnobCandidateEnvelopeProbeP4();
            if (pairs.length !== 2 || allPairs.length !== 4 ||
                liveEnvelope.minimumVisibleOutboardBridgeXGapMmP4 < 0.499999 ||
                allPairs.some(row => row.surfaceWitnessPairs !== 0 ||
                  row.satWithoutWitness !== 0 || row.degeneratePairs !== 0)) {
              throw new Error('Candidate cover contact or axial bound violation at phase '+phase+
                ' copy '+copy+' open '+opening+': '+JSON.stringify(allPairs));
            }
            observations.push({phase, copy, opening,
              pairs: pairs.map(p => ({
                name: p.knob, witnesses: p.surfaceWitnessPairs,
                satPairs: p.satPairs, triangleCount: p.knobTriangleCount
              }))});
          }
        }
      }
      return { observations, baselineContacts: baseline.map(x => x.surfaceWitnessPairs),
        sourceGeometryPromoted: false, originalIBMPartIdentified: false };
    } finally {
      d.setServiceCover(0);
      d.setCopyControl(0);
      if (phase) d.rotatePlatenManually(-phase);
      if (!originalVariable) d.togglePlatenVariable();
      d.setPlatenKnobCandidateP4(false);
      d.setExplosion(0);
      d.setCheekSmoothingPreview(false);
    }
  });
  expect(result.observations).toHaveLength(3*5*9);
  expect(result.baselineContacts.every(x => x > 0)).toBe(true);
  expect(result.observations.every(row =>
    row.pairs.length === 2 && row.pairs.every(p => p.triangleCount > 0 &&
      p.witnesses === 0 && p.satPairs === 0))).toBe(true);
  expect(result.sourceGeometryPromoted).toBe(false);
  expect(result.originalIBMPartIdentified).toBe(false);
  const finalState = await page.evaluate(() => {
    const d = window.__selectricDebug;
    const base = d.hoodPlatenKnobSurfaceContactProbe().pairs.filter(
      p => p.coverPart === 'rear-service-bridge');
    const first = d.platenKnobCandidateEnvelopeProbeP4();
    d.setPlatenKnobCandidateP4(true);
    const second = d.platenKnobCandidateEnvelopeProbeP4();
    d.setPlatenKnobCandidateP4(false);
    const third = d.platenKnobCandidateEnvelopeProbeP4();
    return { defaultRestored: !d.state.geometry.platenKnobCandidateP4Enabled,
      baselineContacts: base.map(p => p.surfaceWitnessPairs),
      meshCounts: [first.candidateMeshCount, second.candidateMeshCount, third.candidateMeshCount],
      baselineVisibility: [first.baselineVisibleCount, second.baselineVisibleCount, third.baselineVisibleCount] };
  });
  expect(finalState.defaultRestored).toBe(true);
  expect(finalState.baselineContacts).toEqual(result.baselineContacts);
  expect(finalState.meshCounts).toEqual([28, 28, 28]);
  expect(finalState.baselineVisibility).toEqual([26, 0, 26]);
  expect(errors).toEqual([]);
});
