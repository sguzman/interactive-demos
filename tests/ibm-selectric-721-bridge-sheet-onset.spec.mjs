import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Independent, screenshot-free geometric probe: no factory part dimensions
// are inferred and no public service-cover/paper mesh is changed.
test.setTimeout(240_000);

test('modeled service-bridge / flat-sheet first contact by cover-opening fraction', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout: 20000});
  await expect(page.locator('#loading')).toBeHidden();

  const data = await page.evaluate(() => {
    const debug = window.__selectricDebug;
    debug.setPower(false);
    debug.setExplosion(0);
    debug.setCheekSmoothingPreview(false);
    const initial = debug.state;
    const frozen = {
      carrierX: initial.carrierX, cycle: initial.cycle,
      line: initial.line, explosion: initial.explosion
    };
    const measure = fraction => {
      debug.setServiceCover(fraction);
      const q = debug.bridgeSheetPlaneIntersectionProbe();
      if (!Number.isFinite(q.modelPlaneBoxIntersectionAreaMm2)) {
        throw new Error('nonfinite bridge-sheet intersection geometry');
      }
      if (q.factoryPaperPathVerified !== false || q.physicalPaperThicknessVerified !== false) {
        throw new Error('diagnostic incorrectly promoted factory paper metrology');
      }
      return q;
    };
    const resolutions = 100;
    const cases = [];
    for (const copy of [0, 4]) {
      debug.setCopyControl(copy);
      const grid = [];
      for (let i = 0; i <= resolutions; i++) {
        const fraction = i / resolutions;
        const measured = measure(fraction);
        grid.push({
          fraction, areaMm2: measured.modelPlaneBoxIntersectionAreaMm2,
          intersects: measured.modelRepresentationIntersects
        });
      }
      const transitions = [];
      for (let i = 1; i < grid.length; i++) {
        const before = grid[i - 1], after = grid[i];
        if (before.intersects === after.intersects) continue;
        let left = before.fraction, right = after.fraction;
        let leftState = before.intersects;
        const initialBracket = [left, right];
        // 18 binary subdivisions: precision < 0.01 / 2^18.
        for (let j = 0; j < 18; j++) {
          const middle = (left + right) / 2;
          const same = measure(middle).modelRepresentationIntersects === leftState;
          if (same) left = middle; else right = middle;
        }
        transitions.push({
          firstCoarseBracket: initialBracket,
          refinedBracket: [left, right],
          toIntersects: after.intersects,
          openingFractionTolerance: right - left
        });
      }
      // The old 5-state observation is an invariant of this diagnostic
      // baseline, not proof of a historical paper-path problem.
      if (grid[0].intersects || grid[75].intersects || !grid[100].intersects) {
        throw new Error('old coarse cover-sheet contact observations changed');
      }
      if (transitions.length < 1) throw new Error('missing contact transition');
      const fullOpen = measure(1);
      debug.setCheekSmoothingPreview(true);
      const smoothAtOpen = measure(1);
      debug.setCheekSmoothingPreview(false);
      if (Math.abs(fullOpen.modelPlaneBoxIntersectionAreaMm2 -
                   smoothAtOpen.modelPlaneBoxIntersectionAreaMm2) > 1e-7) {
        throw new Error('P5 fixed cheek preview changed cover-to-paper contact');
      }
      cases.push({
        copyControlSetting: copy,
        grid, transitions,
        fullOpenAreaMm2: fullOpen.modelPlaneBoxIntersectionAreaMm2,
        fullOpenSameUnderSmoothPreview: true,
        sourceGeometryCalibrated: false,
        exactPhysicalPaperThickness: false,
        factoryCollisionProven: false
      });
    }
    debug.setServiceCover(0);
    debug.setCopyControl(0);
    debug.setCheekSmoothingPreview(false);
    const after = debug.state;
    const unchanged = ['carrierX','cycle','line','explosion']
      .every(key => Object.is(after[key], frozen[key]));
    return {frozen,unchanged,coverAfter:after.serviceCoverOpen,
      copyAfter:after.copyControlSetting,
      cheekAfter:after.cheekSmoothingPreview,
      cases};
  });

  expect(data.unchanged).toBe(true);
  expect(data.coverAfter).toBe(0);
  expect(data.copyAfter).toBe(0);
  expect(data.cheekAfter).toBe(false);
  expect(data.cases).toHaveLength(2);
  for (const row of data.cases) {
    expect(row.grid).toHaveLength(101);
    expect(row.transitions.length).toBeGreaterThan(0);
    expect(row.fullOpenAreaMm2).toBeGreaterThan(0);
    expect(row.fullOpenSameUnderSmoothPreview).toBe(true);
    expect(row.sourceGeometryCalibrated).toBe(false);
    expect(row.factoryCollisionProven).toBe(false);
    for (const transition of row.transitions) {
      expect(transition.openingFractionTolerance).toBeGreaterThan(0);
      expect(transition.openingFractionTolerance).toBeLessThan(1e-7);
      expect(transition.firstCoarseBracket[0]).toBeGreaterThanOrEqual(0.75);
      expect(transition.firstCoarseBracket[1]).toBeLessThanOrEqual(1);
    }
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-bridge-sheet-onset.json',
    JSON.stringify({
      version:1, publicCommit:process.env.GITHUB_SHA || null,
      provenance:'analytic P4 bridge box / finite zero-thickness P5 sheet contact onset',
      factoryPaperPathVerified:false, fullAssemblyCollisionCertified:false,
      historic721CoverLevelVerified:false, productionGeometryPromoted:false,
      ...data
    },null,2)+'\n','utf8');
});
