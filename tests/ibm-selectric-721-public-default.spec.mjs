import { test, expect } from '@playwright/test';

// Public main must preserve the original P4 Selectric on a plain URL.
// The P4/P5/P6 platen-knob experiments are deliberately opt-in and lazy.
test.setTimeout(90_000);

test('plain Selectric viewer never allocates or activates experimental platen geometry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running),
    null, { timeout: 20_000 });
  const before = await page.evaluate(() => {
    const d = window.__selectricDebug;
    return {
      candidateEnabled: d.state.geometry.paperFeed.platenKnobCandidateP4Enabled,
      knob: d.platenKnobCandidateEnvelopeProbeP4(),
      internals: d.platenVariableInternalsProbeP5(),
      p5: d.platenVariableClutchSeatingProbeP5(),
      p6: d.platenFineClutchSolidProbeP6(),
      contact: d.platenClutchContactInspectionProbeP5(),
      platenIndex: d.state.platenIndex,
      carrierX: d.state.carrierX,
      physicalPhase: d.state.geometry.paperFeed.platenPhysicalAngleRad
    };
  });
  expect(before.candidateEnabled).toBe(false);
  expect(before.knob.activeCandidate).toBe(false);
  expect(before.knob.candidateAllocated).toBe(false);
  expect(before.knob.candidateMeshCount).toBe(0);
  expect(before.knob.baselineVisibleCount).toBe(26);
  expect(before.internals.allocated).toBe(false);
  expect(before.p5.active).toBe(false);
  expect(before.p6.active).toBe(false);
  expect(before.contact.allocated).toBe(false);

  // Changing only presentation/research toggles must be reversible and
  // must not silently advance or reindex the physical paper mechanism.
  const after = await page.evaluate(() => {
    const d = window.__selectricDebug;
    d.setPower(false);
    d.setPlatenKnobCandidateP4(true);
    d.setPlatenVariableInternalsInspectionP5(true);
    d.setPlatenFineClutchP6(true);
    const experimentalActive = d.platenFineClutchSolidProbeP6(0).active;
    d.setPlatenFineClutchP6(false);
    d.setPlatenVariableInternalsInspectionP5(false);
    d.setPlatenKnobCandidateP4(false);
    return {
      experimentalActive,
      knob: d.platenKnobCandidateEnvelopeProbeP4(),
      p5: d.platenVariableClutchSeatingProbeP5(),
      p6: d.platenFineClutchSolidProbeP6(),
      platenIndex: d.state.platenIndex,
      carrierX: d.state.carrierX,
      physicalPhase: d.state.geometry.paperFeed.platenPhysicalAngleRad
    };
  });
  expect(after.experimentalActive).toBe(true);
  expect(after.knob.activeCandidate).toBe(false);
  expect(after.knob.baselineVisibleCount).toBe(26);
  expect(after.knob.candidateVisibleCount).toBe(0);
  expect(after.p5.active).toBe(false);
  expect(after.p6.active).toBe(false);
  expect(after.platenIndex).toBe(before.platenIndex);
  expect(after.carrierX).toBe(before.carrierX);
  expect(after.physicalPhase).toBeCloseTo(before.physicalPhase, 10);
  expect(errors).toEqual([]);
});
