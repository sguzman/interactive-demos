import { test, expect } from '@playwright/test';

test.setTimeout(90_000);

test('IBM Selectric 721 causal foundation and gallery integration', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  const galleryLink = page.locator('a.launch[href="./ibm-selectric-721/"]');
  await expect(galleryLink).toHaveCount(1);

  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  if (errors.length) throw new Error('Selectric initialization error: ' + errors.join(' | '));
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, { timeout: 15_000 });
  await expect(page.locator('#loading')).toBeHidden();

  const initial = await page.evaluate(() => window.__selectricDebug.state);
  expect(initial.geometry.finite).toBe(true);
  expect(initial.geometry.revision).toBe('selectric-public-foundation-v3');
  expect(initial.geometry.supportTopology).toContain('Level-2');
  expect(initial.geometry.shellTopology).toContain('hinged hood');
  expect(initial.geometry.explosionClass).toContain('assembly-separation');
  expect(initial.geometry.d6CurrentSet.shaft).toBe('1164736');
  expect(initial.geometry.d6CurrentSet.bearings).toBe('1164740');
  expect(initial.geometry.d6CurrentSet.gear).toBe('1164739');
  expect(initial.geometry.d6CurrentSet.clipMarketFrozen).toBe(false);
  expect(initial.geometry.platenRatchet.outerDiameterMm).toBeCloseTo(30.1498, 6);
  expect(initial.geometry.platenRatchet.teeth).toBe(27);
  expect(initial.geometry.paperFeed.frontRollers).toBe(4);
  expect(initial.geometry.paperFeed.rearRollers).toBe(4);
  expect(initial.geometry.paperFeed.bailRollers).toBe(2);
  expect(initial.geometry.paperFeed.frontRearReleaseCoupled).toBe(true);
  expect(initial.geometry.ribbon.parent).toBe('carrier');
  expect(initial.geometry.ribbon.mediaWidthMm).toBeCloseTo(14.2875, 6);
  expect(initial.geometry.ribbon.nominalRatchetTeethPerCharacter).toBeCloseTo(2.5, 8);
  expect(initial.geometry.ribbon.path).toEqual(['left-spool','left-guide','print-point','right-guide','right-spool']);
  expect(initial.geometry.ribbon.reverseTopology).toContain('feed-pawl transfer');
  expect(initial.geometry.shaftTiming.cycleShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.filterShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.printShaftDegPerCharacter).toBe(360);
  expect(initial.geometry.printRocker.motion).toBe('revolute');
  expect(initial.geometry.printRocker.restClearanceMm).toBeGreaterThanOrEqual(6.604);
  expect(initial.geometry.printRocker.restClearanceMm).toBeLessThanOrEqual(6.858);
  expect(initial.geometry.printRocker.poweredEndpointClearanceMm).toBeGreaterThanOrEqual(0.508);
  expect(initial.geometry.printRocker.poweredEndpointClearanceMm).toBeLessThanOrEqual(0.762);
  expect(initial.geometry.printRocker.freeFlightRepresented).toBe(true);
  expect(initial.geometry.sleeveCamOrder).toEqual([
    'ribbon-lift',
    '1164240-feed-detent',
    '1124174-print-restoring'
  ]);
  expect(initial.profile).toContain('12 CPI');
  expect(initial.explosion).toBe(0);
  expect(initial.serviceCoverOpen).toBe(0);
  expect(initial.cycle).toBe('C0_REST');
  expect(initial.powered).toBe(true);
  expect(initial.geometry.primaryDrive.motorPulleyTeeth).toBe(8);
  expect(initial.geometry.primaryDrive.cycleClutchPulleyTeeth).toBe(29);
  expect(initial.geometry.primaryDrive.reduction).toBeCloseTo(3.625, 10);
  expect(initial.geometry.primaryDrive.pitchRadiusRatio).toBeCloseTo(29 / 8, 10);
  expect(initial.geometry.powerPresentation.operationalShaftContinuousWhenPowered).toBe(true);
  expect(initial.geometry.powerPresentation.serviceCamsStationaryUntilSelected).toBe(true);
  expect(initial.geometry.operationalCams.spaceBackspaceDegreesPerOperation).toBe(180);
  expect(initial.geometry.operationalCams.carrierReturnIndexDegreesPerOperation).toBe(360);
  expect(initial.geometry.operationalCams.tabUsesPoweredCam).toBe(false);
  expect(initial.geometry.marginStops.leftTerminatesCarrierReturn).toBe(true);
  expect(initial.geometry.marginStops.rightLineLockInterface).toBe(true);
  expect(initial.geometry.backspace.mechanism).toBe('dedicated-powered-reverse-linkage');
  expect(initial.geometry.backspace.rackFamily).toEqual(['1124568', '6519139']);
  expect(initial.geometry.backspace.displacementMm).toBeCloseTo(-initial.geometry.pitchMm, 8);

  const carrierBeforePowerOff = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.setPower(false));
  await page.evaluate(() => window.__selectricDebug.typeCharacter('x'));
  await page.waitForTimeout(150);
  const poweredOff = await page.evaluate(() => window.__selectricDebug.state);
  expect(poweredOff.powered).toBe(false);
  expect(poweredOff.cycle).toBe('C0_REST');
  expect(poweredOff.carrierX).toBeCloseTo(carrierBeforePowerOff, 6);
  await page.evaluate(() => window.__selectricDebug.setPower(true));

  const coverCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.setServiceCover(1));
  const coverOpen = await page.evaluate(() => window.__selectricDebug.state);
  expect(coverOpen.serviceCoverOpen).toBe(1);
  expect(coverOpen.carrierX).toBeCloseTo(coverCarrier, 6);
  await page.screenshot({ path: 'test-results/selectric-cover-open.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.setServiceCover(0));

  const initialCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.06));
  const keyDown = await page.evaluate(() => window.__selectricDebug.state);
  expect(keyDown.cycle).toBe('C1_TRIP');
  expect(keyDown.keyboardPress.character).toBe('Q');
  expect(keyDown.keyboardPress.depression).toBeGreaterThan(0.7);
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });

  const afterKeyCycle = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterKeyCycle.keyboardPress.depression).toBe(0);

  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.62));
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C5_PRINT_IMPACT', null, { timeout: 1500 });
  await page.screenshot({ path: 'test-results/selectric-impact.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });

  const typed = await page.evaluate(() => window.__selectricDebug.state);
  expect(typed.carrierX - initialCarrier).toBeCloseTo(typed.geometry.pitchMm * 2, 5);
  expect(typed.ribbonLift).toBe(0);
  expect(typed.ribbonFeedStep).toBe(2);
  expect(typed.geometry.ribbon.approximateRatchetTeethAdvanced).toBeCloseTo(5, 8);
  expect(typed.events.some(event => event.name === 'RIBBON_FEED_COMPLETE_EXCEPT_PAWL_RESTORE')).toBe(true);
  expect(typed.printApproach).toBe(0);
  expect(typed.cyclePhase).toBe(0);
  expect(typed.selection.tiltBand).toBeGreaterThanOrEqual(0);
  expect(typed.selection.tiltBand).toBeLessThanOrEqual(3);
  expect(typed.selection.rotateUnit).toBeGreaterThanOrEqual(-5);
  expect(typed.selection.rotateUnit).toBeLessThanOrEqual(5);
  expect(Object.keys(typed.selection.selectorInputs).sort()).toEqual(['R1','R2','R2A','T1','T2','fiveUnit'].sort());
  expect(typed.selection.selectorInputs.T1 + 2 * typed.selection.selectorInputs.T2).toBe(typed.selection.tiltBand);
  if (typed.selection.rotateUnit < 0) expect(typed.selection.selectorInputs.fiveUnit).toBe(1);
  expect(typed.selection.mappingClass).toContain('P5');

  const names = typed.events.map(event => event.name);
  const impact = names.indexOf('PRINT_IMPACT');
  const escapement = names.indexOf('ESCAPEMENT_ADVANCE');
  expect(impact).toBeGreaterThanOrEqual(0);
  expect(escapement).toBeGreaterThan(impact);

  await page.screenshot({ path: 'test-results/selectric-assembled.png', fullPage: true });
  await page.locator('[data-view="carrier"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-carrier-view.png', fullPage: true });
  await page.locator('[data-view="selection"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-selection-view.png', fullPage: true });
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);

  const beforeExplosion = await page.evaluate(() => ({
    carrierX: window.__selectricDebug.state.carrierX,
    line: window.__selectricDebug.state.line
  }));
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.55));
  const exploded = await page.evaluate(() => window.__selectricDebug.state);
  expect(exploded.explosion).toBeCloseTo(0.55, 6);
  expect(exploded.geometry.explosionClass).toContain('assembly-separation');
  expect(exploded.carrierX).toBeCloseTo(beforeExplosion.carrierX, 6);
  expect(exploded.line).toBe(beforeExplosion.line);
  await page.screenshot({ path: 'test-results/selectric-exploded.png', fullPage: true });

  await page.evaluate(() => window.__selectricDebug.setExplosion(0));
  const assembled = await page.evaluate(() => window.__selectricDebug.state);
  expect(assembled.explosion).toBe(0);

  const beforeSpace = assembled.carrierX;
  await page.evaluate(() => window.__selectricDebug.space());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const spaced = await page.evaluate(() => window.__selectricDebug.state);
  expect(spaced.carrierX - beforeSpace).toBeCloseTo(spaced.geometry.pitchMm, 5);
  expect(spaced.events.some(event => event.name === 'SPACE_OPERATION_COMPLETE')).toBe(true);
  expect(spaced.geometry.powerPresentation.selectedServiceCam).toBe('rest');

  await page.evaluate(() => window.__selectricDebug.backspace());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const backed = await page.evaluate(() => window.__selectricDebug.state);
  expect(backed.carrierX).toBeCloseTo(beforeSpace, 5);
  expect(backed.events.some(event => event.name === 'BACKSPACE_OPERATION_COMPLETE')).toBe(true);

  const beforeShift = backed.selection.shiftHemisphere;
  await page.evaluate(() => window.__selectricDebug.shift());
  const shifted = await page.evaluate(() => window.__selectricDebug.state);
  expect(shifted.selection.shiftHemisphere).toBe(1 - beforeShift);

  await page.evaluate(() => window.__selectricDebug.index());
  const indexed = await page.evaluate(() => window.__selectricDebug.state);
  expect(indexed.line).toBe(1);
  expect(indexed.platenIndex).toBeCloseTo(Math.PI * 2 / 27, 6);

  const beforeTab = indexed.carrierX;
  await page.evaluate(() => window.__selectricDebug.tab());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const tabbed = await page.evaluate(() => window.__selectricDebug.state);
  expect(tabbed.carrierX).toBeGreaterThan(beforeTab);
  expect(tabbed.events.some(event => event.name === 'TAB_RELEASE')).toBe(true);
  expect(tabbed.events.some(event => event.name === 'TAB_CAPTURE')).toBe(true);

  const lineBeforeReturn = tabbed.line;
  const platenBeforeReturn = tabbed.platenIndex;
  await page.evaluate(() => window.__selectricDebug.carriageReturn());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const returned = await page.evaluate(() => window.__selectricDebug.state);
  expect(returned.carrierX).toBeCloseTo(-returned.geometry.writingLineMm / 2, 5);
  expect(returned.line).toBe(lineBeforeReturn + 1);
  expect(returned.platenIndex - platenBeforeReturn).toBeCloseTo(Math.PI * 2 / 27, 6);
  expect(returned.geometry.writingLineRacks).toContain('1164743 margin');
  expect(returned.events.some(event => event.name === 'CARRIER_RETURN_CLUTCH_ENGAGED')).toBe(true);
  expect(returned.events.some(event => event.name === 'CARRIER_RETURN_TERMINATED_AT_LEFT_MARGIN')).toBe(true);

  expect(errors).toEqual([]);
});
