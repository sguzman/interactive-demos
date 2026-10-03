import { test, expect } from '@playwright/test';

test('SX-70 opens, exposes live internals, cycles, explodes, and folds in Chromium', async ({ page }) => {
  test.setTimeout(240_000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => console.log('[browser]', message.type(), message.text()));

  const guideResponse = await page.request.get('http://127.0.0.1:4173/docs/polaroid-sx-70.html');
  expect(guideResponse.status()).toBe(200);
  const guideHtml = await guideResponse.text();
  expect(guideHtml).toContain('expression:polaroid-sx-70-public-engineering-guide:en:v1');
  expect(guideHtml).toContain('../sx70/?view=folding');
  expect(guideHtml).toContain('../sx70/?view=internals');
  expect(guideHtml).toContain('../sx70/?view=frontStandard');
  expect(guideHtml).toContain('../sx70/?view=viewing');
  expect(guideHtml).toContain('../sx70/?view=exposure');
  expect(guideHtml).toContain('../sx70/?view=sequence');
  expect(guideHtml).toContain('../sx70/?view=transport');
  expect(guideHtml).toContain('../sx70/?view=chemistry');

  await page.goto('http://127.0.0.1:4173/sx70/?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__sx70Debug?.state));

  const before = await page.evaluate(() => window.__sx70Debug.state);
  expect(before.deployment).toBeLessThan(0.02);
  expect(before.explosion).toBeLessThan(0.01);

  await expect(page.locator('#deploymentState')).toHaveText('FOLDED');
  await expect(page.locator('#powerState')).toHaveText('S6 OPEN · DISABLED');

  // Geometry-v6 continuity regression: sample the entire physical deployment path.
  // Persistent product geometry must remain present; endpoints alone are not enough.
  const deploymentSamples = [0, 0.10, 0.25, 0.50, 0.75, 0.90, 1];
  const geometrySweep = await page.evaluate(samples => {
    const result = [];
    for (const deployment of samples) {
      window.__sx70Debug.setDeployment(deployment);
      result.push(window.__sx70Debug.state.geometry);
    }
    window.__sx70Debug.setDeployment(0);
    return result;
  }, deploymentSamples);
  expect(geometrySweep[0].bounds.height).toBeLessThan(55);
  expect(geometrySweep[0].bounds.depth).toBeLessThan(205);
  // Opening starts at the viewfinder cap, then the structural four-bar follows.
  expect(geometrySweep[2].viewfinderDeployment).toBeGreaterThan(geometrySweep[2].bodyDeployment);
  expect(geometrySweep.at(-1).bodyDeployment).toBeCloseTo(1, 6);
  expect(geometrySweep.at(-1).viewfinderDeployment).toBeCloseTo(1, 6);
  expect(geometrySweep[0].viewfinderHoodOpeningMm).toBeLessThan(.1);
  expect(geometrySweep.at(-1).viewfinderHoodOpeningMm).toBeGreaterThan(8);
  expect(geometrySweep.at(-1).capAngleDeg).toBeCloseTo(22, 3);
  expect(Math.abs(geometrySweep.at(-1).capToCoverPitchErrorDeg)).toBeLessThan(3);

  for (const geometry of geometrySweep) {
    expect(geometry.revision).toBe('articulated-v6');
    expect(geometry.finite).toBe(true);
    expect(Math.abs(geometry.rearMemberLengthError)).toBeLessThan(1e-6);
    expect(Math.abs(geometry.lensStandardHeightError)).toBeLessThan(1e-6);
    expect(geometry.viewfinderFollowerWithinGuide).toBe(true);
    expect(geometry.viewfinderFollowerTravel).toBeLessThanOrEqual(geometry.viewfinderGuideLength * 0.5);
    expect(geometry.viewfinderHoodPersistent).toBe(true);
    expect(geometry.deploymentLead).toBeLessThanOrEqual(0.40);
    expect(geometry.bellowsClearance.frontStandardMm).toBeGreaterThan(2.5);
    expect(geometry.bellowsClearance.topCoverMm).toBeGreaterThan(2.5);
    expect(geometry.bellowsClearance.sideRailMm).toBeGreaterThan(7);
    expect(geometry.bellowsPresentation.opacity).toBeCloseTo(1, 6);
    expect(geometry.bellowsPresentation.transparent).toBe(false);
    expect(geometry.bellowsPresentation.depthWrite).toBe(true);
    expect(Math.abs(geometry.topFrontCoverLengthError)).toBeLessThan(1e-6);
    expect(geometry.rearSideLinkLengthErrors.every(error => Math.abs(error) < 1e-6)).toBe(true);
    expect(geometry.frontSideLinkLengthErrors.every(error => Math.abs(error) < 1e-6)).toBe(true);
    expect(geometry.ordinaryPersistentPartCount).toBeGreaterThan(20);
    expect(geometry.ordinaryHiddenPersistentPartCount).toBe(0);
    expect(geometry.bellowsPersistentRibCount).toBe(10);
    expect(geometry.frontStandardInspectablePartCount).toBeGreaterThanOrEqual(6);
    expect(geometry.bounds.width).toBeGreaterThan(90);
    expect(geometry.bounds.height).toBeLessThan(150);
    expect(geometry.bounds.depth).toBeLessThan(235);
  }

  // Render the state space so mechanical continuity gets human-visible QA, not
  // merely endpoint screenshots or numeric invariants.
  for (const deployment of [0.10, 0.25, 0.50, 0.75, 0.90]) {
    await page.evaluate(value => window.__sx70Debug.setDeployment(value), deployment);
    await page.waitForTimeout(120);
    const label = String(Math.round(deployment * 100)).padStart(2, '0');
    await page.screenshot({ path: `test-results/sx70-deployment-${label}.png`, fullPage: true });
  }

  // Pure side profile makes linkage nesting and fold-path defects obvious instead of hiding them
  // behind the presentation camera.
  await page.evaluate(() => window.__sx70Debug.setQaCamera([260, 48, 0], [0, 35, 0], [0, 1, 0]));
  for (const deployment of [0, 0.25, 0.50, 0.75, 1]) {
    await page.evaluate(value => window.__sx70Debug.setDeployment(value), deployment);
    await page.waitForTimeout(120);
    const label = String(Math.round(deployment * 100)).padStart(3, '0');
    await page.screenshot({ path: `test-results/sx70-side-deployment-${label}.png`, fullPage: true });
  }
  await page.evaluate(() => window.__sx70Debug.setDeployment(0));

  await page.locator('#openBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.deployment > 0.985);

  const opened = await page.evaluate(() => window.__sx70Debug.state);
  expect(opened.deployment).toBeGreaterThan(0.985);
  await expect(page.locator('#deploymentState')).toHaveText('ERECT · LOCKED');
  await expect(page.locator('#powerState')).toHaveText('S6 CLOSED · ENABLED');
  await expect(page.locator('#takePhotoBtn')).toBeEnabled();

  // Direct regression for the user-reported ordinary UNFOLDED-state defect:
  // this is not explosion. Capture the normal erect camera before any cutaway
  // so detached/floating shell geometry cannot hide behind exploded spacing.
  await page.locator('[data-view="overview"]').click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/sx70-open-overview.png', fullPage: true });

  // Front-standard deep inspection is a first-class view, not an opaque housing.
  await page.locator('[data-view="frontStandard"]').click();
  await page.waitForFunction(() =>
    window.__sx70Debug.state.activeView === 'frontStandard' &&
    window.__sx70Debug.state.explosion > 0.99
  );
  const frontStandardState = await page.evaluate(() => window.__sx70Debug.state);
  expect(frontStandardState.geometry.inspectionFocus).toBe('frontStandard');
  expect(frontStandardState.mechanism.inspectionFocus).toBe('frontStandard');
  expect(frontStandardState.geometry.frontStandardDeepExploded).toBe(true);
  expect(frontStandardState.geometry.frontStandardInspectablePartCount).toBeGreaterThanOrEqual(6);
  expect(frontStandardState.mechanism.deepExplosion).toBe(true);
  expect(frontStandardState.mechanism.frontStandardInternalSpread.shutterBladeSeparation).toBeGreaterThan(20);
  await page.screenshot({ path: 'test-results/sx70-front-standard-focused.png', fullPage: true });

  // The central engineering-demo requirement: expose the actual internal assembly,
  // not merely the folding shell. "Internals" deliberately combines cutaway/explosion
  // with the same live mechanism that will execute the exposure cycle.
  await page.locator('[data-view="internals"]').click();
  await page.waitForFunction(() =>
    window.__sx70Debug.state.deployment > 0.985 &&
    window.__sx70Debug.state.explosion > 0.55
  );
  const internalState = await page.evaluate(() => window.__sx70Debug.state);
  expect(internalState.activeView).toBe('internals');
  expect(internalState.mechanism.visible).toBe(true);
  expect(internalState.mechanism.inspectableMeshCount).toBeGreaterThan(20);
  expect(internalState.explosion).toBeGreaterThan(0.55);
  await page.screenshot({ path: 'test-results/sx70-internals-cutaway.png', fullPage: true });

  const mechanismBeforeCycle = internalState.mechanism;
  await page.locator('#takePhotoBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.cycle.phase !== 'idle');
  await page.evaluate(() => window.__sx70Debug.advanceCycle(1 / 240, 36));
  const mechanismMidCycle = await page.evaluate(() => window.__sx70Debug.state);
  expect(mechanismMidCycle.explosion).toBeGreaterThan(0.55);
  expect(mechanismMidCycle.mechanism.visible).toBe(true);
  expect(mechanismMidCycle.mechanism.motorAngle).not.toBeCloseTo(mechanismBeforeCycle.motorAngle, 5);
  expect(
    mechanismMidCycle.mechanism.gearAngles.some(
      (angle, index) => Math.abs(angle - mechanismBeforeCycle.gearAngles[index]) > 0.001
    )
  ).toBe(true);
  await page.screenshot({ path: 'test-results/sx70-internals-mid-cycle.png', fullPage: true });

  // Prove the full causal exposure engine, not merely the rendering.
  const cycleResult = await page.evaluate(() => window.__sx70Debug.advanceCycle(1 / 120, 900));
  expect(cycleResult.state.phase).toBe('idle');
  const history = cycleResult.state.eventHistory;
  expect(history).toContain('S1-close');
  expect(history).toContain('S4-transfer');
  expect(history).toContain('reflex-unlatch');
  expect(history).toContain('S5-open');
  expect(history).toContain('S3-open');
  expect(history).toContain('delay-complete');
  expect(history).toContain('exposure-threshold');
  expect(history).toContain('S4-transfer-post-exposure');
  expect(history).toContain('pick-start');
  expect(history).toContain('roller-nip-capture');
  expect(history).toContain('reflex-recock-phase');
  expect(history).toContain('S5-terminal');
  expect(history).toContain('S1-released-and-shutter-open');

  const ordered = [
    'S1-close',
    'S4-transfer',
    'reflex-unlatch',
    'S5-open',
    'S3-open',
    'delay-complete',
    'exposure-threshold',
    'S4-transfer-post-exposure',
    'pick-start',
    'roller-nip-capture',
    'reflex-recock-phase',
    'S5-terminal',
    'S1-released-and-shutter-open'
  ];
  const indices = ordered.map(event => history.indexOf(event));
  expect(indices.every(index => index >= 0)).toBe(true);
  expect(indices).toEqual([...indices].sort((a, b) => a - b));
  expect(cycleResult.transport.sheetsRemaining).toBe(9);
  expect(cycleResult.transport.counter).toBe(9);
  expect(cycleResult.transport.filmInTransport).toBe(false);
  expect(cycleResult.transport.ejectedCount).toBe(1);
  expect(cycleResult.chemistry.active).toBe(true);
  expect(cycleResult.chemistry.chemicalTime).toBeGreaterThan(0);
  expect(cycleResult.chemistry.targetReceiverCmy[0]).toBeLessThan(cycleResult.chemistry.targetReceiverCmy[1]);
  expect(cycleResult.chemistry.targetReceiverCmy[1]).toBeLessThan(cycleResult.chemistry.targetReceiverCmy[2]);
  expect((await page.evaluate(() => window.__sx70Debug.state)).violations).toEqual([]);

  // A fresh pack uses the same transport hardware to eject the dark slide, but does not
  // consume one of the ten photographic sheets.
  expect(await page.evaluate(() => window.__sx70Debug.loadFreshPack())).toBe(true);
  const freshPack = await page.evaluate(() => window.__sx70Debug.advanceCycle(1 / 120, 240));
  expect(freshPack.transport.darkSlidePresent).toBe(false);
  expect(freshPack.transport.sheetsRemaining).toBe(10);
  expect(freshPack.transport.counter).toBe(10);
  expect(freshPack.transport.filmInTransport).toBe(false);

  await page.locator('#focus').evaluate(element => {
    element.value = '82';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const focused = await page.evaluate(() => window.__sx70Debug.state);
  expect(focused.focus).toBeCloseTo(0.82, 2);

  await page.locator('[data-view="transport"]').click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/sx70-film-transport.png', fullPage: true });

  await page.locator('[data-view="chemistry"]').click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/sx70-film-chemistry.png', fullPage: true });

  await page.locator('[data-view="viewing"]').click();
  await page.waitForFunction(() => window.__sx70Debug.state.opticsMode === 'viewing');
  const viewing = await page.evaluate(() => window.__sx70Debug.state);
  expect(viewing.activeView).toBe('viewing');
  expect(viewing.deployment).toBeGreaterThan(0.985);
  await page.screenshot({ path: 'test-results/sx70-viewing-optics.png', fullPage: true });

  await page.locator('[data-view="exposure"]').click();
  await page.waitForFunction(() => window.__sx70Debug.state.opticsMode === 'exposure');
  const exposure = await page.evaluate(() => window.__sx70Debug.state);
  expect(exposure.activeView).toBe('exposure');
  expect(exposure.deployment).toBeGreaterThan(0.985);
  await page.screenshot({ path: 'test-results/sx70-exposure-optics.png', fullPage: true });

  const explodeSlider = page.locator('#explode');
  const explodeBox = await explodeSlider.boundingBox();
  expect(explodeBox).not.toBeNull();
  await page.mouse.move(explodeBox.x + 4, explodeBox.y + explodeBox.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 7; i += 1) {
    await page.mouse.move(
      explodeBox.x + 4 + (explodeBox.width - 8) * (i / 7),
      explodeBox.y + explodeBox.height / 2
    );
    await page.waitForTimeout(90);
  }
  const draggingExplosion = await page.evaluate(() => window.__sx70Debug.state);
  // Native range controls can emit pointercancel/lost-capture differently across Chromium builds.
  // Gate the user-visible contract instead: a sustained held drag must continuously drive the
  // dissection well past 75% before mouseup.
  expect(draggingExplosion.explosion).toBeGreaterThan(.75);
  expect(Number(await explodeSlider.inputValue())).toBeGreaterThan(75);
  await page.mouse.up();
  await page.evaluate(() => window.__sx70Debug.setExplode(0));

  // Explode is a primary control now. It must animate the same slider continuously rather than
  // teleporting to an exploded layout or requiring Advanced inspection.
  await expect(page.locator('.controls')).not.toHaveClass(/advanced-open/);
  await page.evaluate(() => window.__sx70Debug.setExplode(0));
  await page.locator('#explodeBtn').click();
  await page.waitForTimeout(280);
  const explodingMid = await page.evaluate(() => window.__sx70Debug.state);
  expect(explodingMid.interaction.explosionAnimating).toBe(true);
  expect(explodingMid.explosion).toBeGreaterThan(.01);
  expect(explodingMid.explosion).toBeLessThan(.95);
  await page.waitForFunction(() =>
    window.__sx70Debug.state.explosion > .995 &&
    !window.__sx70Debug.state.interaction.explosionAnimating
  );

  const exploded = await page.evaluate(() => window.__sx70Debug.state);
  expect(exploded.deployment).toBeGreaterThan(0.985);
  expect(exploded.explosion).toBeCloseTo(1, 3);
  expect(exploded.mechanism.visible).toBe(true);
  expect(exploded.geometry.frontStandardDeepExploded).toBe(true);
  expect(exploded.geometry.frontStandardInspectablePartCount).toBeGreaterThanOrEqual(6);
  await page.screenshot({ path: 'test-results/sx70-internals-fully-exploded.png', fullPage: true });
  await page.screenshot({ path: 'test-results/sx70-front-standard-deep-explode.png', fullPage: true });

  await page.locator('#assembleBtn').click();
  await page.waitForTimeout(280);
  const assemblingMid = await page.evaluate(() => window.__sx70Debug.state);
  expect(assemblingMid.interaction.explosionAnimating).toBe(true);
  expect(assemblingMid.explosion).toBeGreaterThan(.05);
  expect(assemblingMid.explosion).toBeLessThan(.99);
  await page.waitForFunction(() =>
    window.__sx70Debug.state.explosion < .005 &&
    !window.__sx70Debug.state.interaction.explosionAnimating
  );
  const assembled = await page.evaluate(() => window.__sx70Debug.state);
  expect(assembled.deployment).toBeGreaterThan(0.985);
  expect(assembled.explosion).toBeCloseTo(0, 3);

  await page.locator('[data-view="folding"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/sx70-open-folding.png', fullPage: true });

  await page.locator('#foldBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.deployment < 0.015);

  const folded = await page.evaluate(() => window.__sx70Debug.state);
  expect(folded.deployment).toBeLessThan(0.015);
  await expect(page.locator('#deploymentState')).toHaveText('FOLDED');
  await expect(page.locator('#powerState')).toHaveText('S6 OPEN · DISABLED');

  const chemistryBeforeFoldAdvance = await page.evaluate(() => window.__sx70Debug.state.chemistry.chemicalTime);
  const chemistryAfterFoldAdvance = await page.evaluate(() => window.__sx70Debug.advanceChemistry(1 / 60, 120));
  expect(chemistryAfterFoldAdvance.chemicalTime).toBeGreaterThan(chemistryBeforeFoldAdvance + 1.5);
  expect(chemistryAfterFoldAdvance.active).toBe(true);

  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: 'test-results/sx70-folded.png', fullPage: true });
});
