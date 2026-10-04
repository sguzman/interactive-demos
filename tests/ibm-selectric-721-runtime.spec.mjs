import { test, expect } from '@playwright/test';

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
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running));
  await expect(page.locator('#loading')).toBeHidden();

  const initial = await page.evaluate(() => window.__selectricDebug.state);
  expect(initial.geometry.finite).toBe(true);
  expect(initial.geometry.revision).toBe('selectric-public-foundation-v3');
  expect(initial.geometry.supportTopology).toContain('Level-2');
  expect(initial.geometry.shellTopology).toContain('service-cover loft');
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

  const coverCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.setServiceCover(1));
  const coverOpen = await page.evaluate(() => window.__selectricDebug.state);
  expect(coverOpen.serviceCoverOpen).toBe(1);
  expect(coverOpen.carrierX).toBeCloseTo(coverCarrier, 6);
  await page.screenshot({ path: 'test-results/selectric-cover-open.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.setServiceCover(0));

  const initialCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C5_PRINT_IMPACT', null, { timeout: 5000 });
  await page.screenshot({ path: 'test-results/selectric-impact.png', fullPage: true });
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });

  const typed = await page.evaluate(() => window.__selectricDebug.state);
  expect(typed.carrierX - initialCarrier).toBeCloseTo(typed.geometry.pitchMm, 5);
  expect(typed.ribbonLift).toBe(0);
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
  await page.screenshot({ path: 'test-results/selectric-carrier-view.png', fullPage: true });
  await page.locator('[data-view="selection"]').click();
  await page.screenshot({ path: 'test-results/selectric-selection-view.png', fullPage: true });
  await page.locator('[data-view="product"]').click();

  const beforeExplosion = await page.evaluate(() => ({
    carrierX: window.__selectricDebug.state.carrierX,
    line: window.__selectricDebug.state.line
  }));
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.55));
  const exploded = await page.evaluate(() => window.__selectricDebug.state);
  expect(exploded.explosion).toBeCloseTo(0.55, 6);
  expect(exploded.carrierX).toBeCloseTo(beforeExplosion.carrierX, 6);
  expect(exploded.line).toBe(beforeExplosion.line);
  await page.screenshot({ path: 'test-results/selectric-exploded.png', fullPage: true });

  await page.evaluate(() => window.__selectricDebug.setExplosion(0));
  const assembled = await page.evaluate(() => window.__selectricDebug.state);
  expect(assembled.explosion).toBe(0);

  const beforeSpace = assembled.carrierX;
  await page.evaluate(() => window.__selectricDebug.space());
  const spaced = await page.evaluate(() => window.__selectricDebug.state);
  expect(spaced.carrierX - beforeSpace).toBeCloseTo(spaced.geometry.pitchMm, 5);

  await page.evaluate(() => window.__selectricDebug.backspace());
  const backed = await page.evaluate(() => window.__selectricDebug.state);
  expect(backed.carrierX).toBeCloseTo(beforeSpace, 5);

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
