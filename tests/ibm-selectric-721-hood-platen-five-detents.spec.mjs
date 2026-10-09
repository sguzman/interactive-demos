import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Source-grounded relative motion: five copy-control detents move the entire
// platen/paper-feed carriage. This exercises P4 renderer geometry, not OEM
// dimensional copy thickness or true 721 cover clearance.
test.setTimeout(180_000);

test('Selectric five-detent hood/platen central-section model clearance', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout: 20000});
  await expect(page.locator('#loading')).toBeHidden();

  const outcome = await page.evaluate(() => {
    const d = window.__selectricDebug;
    d.setPower(false);
    d.setExplosion(0);
    d.setCheekSmoothingPreview(false);
    d.setServiceCover(0);
    d.setCopyControl(0);
    const source = d.state;
    const initial = {
      carrierX: source.carrierX, cycle: source.cycle,
      line: source.line, platenIndex: source.platenIndex,
      copyControlSetting: source.copyControlSetting,
      serviceCoverOpen: source.serviceCoverOpen,
      cheekPreview: source.geometry.cheekSmoothingPreviewP5.enabled
    };
    const fractions = [0, 0.25, 0.5, 0.75, 1];
    const cases = [];
    try {
      for (const preview of [false, true]) {
        d.setCheekSmoothingPreview(preview);
        for (let copy = 0; copy < 5; copy++) {
          d.setCopyControl(copy);
          for (const cover of fractions) {
            d.setServiceCover(cover);
            const result = d.hoodPlatenCenterSectionProbe();
            if (result.cheekPreviewEnabled !== preview ||
                result.copyControlSetting !== copy ||
                Math.abs(result.serviceCoverOpen - cover) > 1e-9 ||
                Math.abs(result.explosion) > 1e-9) {
              throw new Error('platen/hood snapshot state drift');
            }
            const keys = [
              'platenCenterWorldYmm', 'platenCenterWorldZmm',
              'platenRadiusMmP4', 'minHoodSurfaceToPlatenAxisMm',
              'signedHoodSurfaceToPlatenCylinderMmP4',
              'paperWrapRadiusMmP4', 'paperWrapSectionDistanceLowerBoundMmP4'
            ];
            if (!keys.every(name => Number.isFinite(result[name]))) {
              throw new Error('nonfinite hood/platen section geometry');
            }
            if (result.hoodCentralStationCount !== 6 ||
                result.sectionPolygonEdgeCount !== 12 ||
                result.factoryClearanceCertified !== false ||
                result.sourceCoverLevelVerified !== false ||
                result.whole3DMeshCollisionCertified !== false ||
                result.fullOutputPaperCollisionCertified !== false ||
                result.originalPaperWrapArcConfirmed !== false) {
              throw new Error('unearned model/source certificate or station drift');
            }
            cases.push(result);
          }
        }
      }
    } finally {
      d.setCheekSmoothingPreview(false);
      d.setServiceCover(0);
      d.setCopyControl(0);
    }
    const after = d.state;
    const restored =
      initial.carrierX === after.carrierX &&
      initial.cycle === after.cycle &&
      initial.line === after.line &&
      initial.platenIndex === after.platenIndex &&
      initial.copyControlSetting === after.copyControlSetting &&
      initial.serviceCoverOpen === after.serviceCoverOpen &&
      initial.cheekPreview === after.geometry.cheekSmoothingPreviewP5.enabled;
    return { cases, restored, sourceOwnedCopyControlStepsMm: false,
      sourceLevelCoverIdentified: false, physicalCoverClearanceCertified: false };
  });

  expect(outcome.restored).toBe(true);
  expect(outcome.cases).toHaveLength(50);
  expect(outcome.sourceOwnedCopyControlStepsMm).toBe(false);
  expect(outcome.sourceLevelCoverIdentified).toBe(false);
  expect(outcome.physicalCoverClearanceCertified).toBe(false);
  for (let index = 0; index < 25; index++) {
    const a = outcome.cases[index];
    const b = outcome.cases[index + 25];
    expect(b.signedHoodSurfaceToPlatenCylinderMmP4)
      .toBeCloseTo(a.signedHoodSurfaceToPlatenCylinderMmP4, 7);
    expect(b.paperWrapSectionDistanceLowerBoundMmP4)
      .toBeCloseTo(a.paperWrapSectionDistanceLowerBoundMmP4, 7);
    expect(b.platenCenterWorldZmm).toBeCloseTo(a.platenCenterWorldZmm, 7);
    expect(a.paperWrapRadiusMmP4 - a.platenRadiusMmP4).toBeCloseTo(0.65, 7);
    expect(a.paperWrapSectionDistanceLowerBoundMmP4)
      .toBeCloseTo(a.signedHoodSurfaceToPlatenCylinderMmP4 - 0.65, 7);
  }
  const minBySetting = [];
  for (let copy = 0; copy < 5; copy++) {
    const all = outcome.cases.filter(row =>
      !row.cheekPreviewEnabled && row.copyControlSetting === copy);
    expect(all).toHaveLength(5);
    const front = outcome.cases.find(row =>
      !row.cheekPreviewEnabled && row.copyControlSetting === 0 &&
      row.serviceCoverOpen === 0);
    const normal = all.find(row => row.serviceCoverOpen === 0);
    // The 2.2 mm/step is public P5 display scaling, not IBM metrology.
    expect(normal.platenCenterWorldZmm - front.platenCenterWorldZmm)
      .toBeCloseTo(-2.2 * copy, 6);
    for (const row of all) {
      expect(row.paperWrapSectionDistanceLowerBoundMmP4).toBeGreaterThan(0);
      expect(row.signedHoodSurfaceToPlatenCylinderMmP4).toBeGreaterThan(0);
      expect(row.centralSectionIndicatesModelOverlap).toBe(false);
    }
    minBySetting.push({
      setting: copy,
      minCylinderGapMm: Math.min(...all.map(row =>
        row.signedHoodSurfaceToPlatenCylinderMmP4)),
      minConcentricPaperWrapGapMm: Math.min(...all.map(row =>
        row.paperWrapSectionDistanceLowerBoundMmP4))
    });
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-hood-platen-five-detents.json', JSON.stringify({
    version: 1, publicCommit: process.env.GITHUB_SHA || null,
    sourceContract: 'IBM cover mount: platen clears covers at extreme copy-control positions',
    sampleSpace: '5 detents x 5 cover fractions x 2 optional cheek render modes',
    originalCoverLevelKnown: false,
    sourceCopyControlDisplacementMeasured: false,
    completeCoverKnobOrSolidCollisionCertified: false,
    fullOutputSheetCollisionCertified: false,
    publicGeometryPromoted: false,
    mechanicalStateRestored: outcome.restored,
    minBySetting, cases: outcome.cases
  }, null, 2) + '\n', 'utf8');
});
