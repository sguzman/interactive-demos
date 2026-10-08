import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Separate from long causal/visual suites. This probes model geometry only.
test.setTimeout(180_000);

test('P4 service hood triangles versus type-element enclosing sphere across carrier and rocker', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, { timeout: 20000 });
  expect(await page.evaluate(() => window.__selectricDebug.setPower(false))).toBe(true);
  const output = await page.evaluate(() => {
    const debug = window.__selectricDebug;
    const before = debug.state;
    const data = debug.hoodTypeElementMotionSweepProbe();
    const after = debug.state;
    return {
      data,
      restored: before.carrierX === after.carrierX &&
        before.printApproach === after.printApproach &&
        before.serviceCoverOpen === after.serviceCoverOpen &&
        before.geometry.cheekSmoothingPreviewP5.enabled === after.geometry.cheekSmoothingPreviewP5.enabled &&
        before.cycle === after.cycle && before.line === after.line &&
        before.copyControlSetting === after.copyControlSetting
    };
  });
  expect(output.restored).toBe(true);
  const data = output.data;
  expect(data.totalCases).toBe(90);
  expect(data.cases).toHaveLength(90);
  expect(data.carrierPositionsMm).toHaveLength(3);
  expect(data.rockerPhases).toEqual([0, .9, 1]);
  expect(data.coverFractions).toEqual([0, .25, .5, .75, 1]);
  expect(data.cheekPreviewModes).toEqual([false, true]);
  const summary = {
    oldYZExclusions: 0, new3DExclusions: 0, newlyProvenDisjoint: 0,
    inconclusive: 0, centerInsideYZ: 0,
    minimumSphereSurfaceGapMm: Infinity,
    maximumSphereSurfaceGapMm: -Infinity
  };
  for (const p of data.cases) {
    expect(p.hoodTriangleCount).toBe(44);
    expect(p.nearestHoodTriangleIndex).toBeGreaterThanOrEqual(0);
    expect(p.nearestHoodTriangleIndex).toBeLessThan(44);
    expect(Number.isFinite(p.minimumHoodTriangleSurfaceDistanceMm)).toBe(true);
    expect(Number.isFinite(p.signedEnclosingSphereSurfaceGapMm)).toBe(true);
    expect(p.minimumHoodTriangleSurfaceDistanceMm).toBeGreaterThanOrEqual(0);
    expect(p.enclosingTypeElementSphereRadiusMm).toBeGreaterThan(0);
    expect(p.minimumHoodTriangleSurfaceDistanceMm -
      p.enclosingTypeElementSphereRadiusMm).toBeCloseTo(p.signedEnclosingSphereSurfaceGapMm, 7);
    expect(p.modeledHoodTypePairCertifiedDisjoint).toBe(
      !p.typeCenterInsideHoodYZSection && p.signedEnclosingSphereSurfaceGapMm > 0);
    for (const forbidden of ['modeledIntersectionProven','productionContactCertified',
      'historicalCoverGeometryVerified','fullTriangleVsTriangleCollisionCertified']) {
      expect(p[forbidden]).toBe(false);
    }
    if (p.originalYZSectionProvenDisjoint) summary.oldYZExclusions++;
    if (p.modeledHoodTypePairCertifiedDisjoint) summary.new3DExclusions++;
    if (p.modeledHoodTypePairCertifiedDisjoint && !p.originalYZSectionProvenDisjoint) {
      summary.newlyProvenDisjoint++;
    }
    if (p.typeCenterInsideHoodYZSection) summary.centerInsideYZ++;
    if (!p.modeledHoodTypePairCertifiedDisjoint) summary.inconclusive++;
    summary.minimumSphereSurfaceGapMm = Math.min(summary.minimumSphereSurfaceGapMm,
      p.signedEnclosingSphereSurfaceGapMm);
    summary.maximumSphereSurfaceGapMm = Math.max(summary.maximumSphereSurfaceGapMm,
      p.signedEnclosingSphereSurfaceGapMm);
  }
  expect(summary.new3DExclusions + summary.inconclusive).toBe(90);
  expect(data.historicalSourceCalibrated).toBe(false);
  expect(data.productionContactCertified).toBe(false);
  expect(data.actualMachineCycleCertified).toBe(false);
  expect(data.geometryPromoted).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-type-triangle-sweep.json',
    JSON.stringify({ version: 1, publicCommit: process.env.GITHUB_SHA || null,
      purpose: 'actual transformed P4 hood triangle distances to conservative type subtree sphere',
      sourceCameraCalibrated: false, machineCollisionCertified: false,
      shellGeometryPromoted: false, summary, ...data,
      originalStateRestored: output.restored }, null, 2) + '\n', 'utf8');
});
