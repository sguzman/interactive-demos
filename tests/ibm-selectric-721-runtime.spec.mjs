import { test, expect } from '@playwright/test';

test('IBM Selectric 721 deterministic public foundation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });

  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running));

  const initial = await page.evaluate(() => window.__selectricDebug.state);
  expect(initial.geometry.finite).toBe(true);
  expect(initial.geometry.revision).toBe('selectric-public-foundation-v1');
  expect(initial.profile).toContain('12 CPI');
  expect(initial.explosion).toBe(0);

  const initialCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.typeCharacter());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'IDLE', null, { timeout: 4000 });

  const typed = await page.evaluate(() => window.__selectricDebug.state);
  expect(typed.carrierX - initialCarrier).toBeCloseTo(typed.geometry.pitchMm, 5);
  expect(typed.ribbonLift).toBe(0);
  expect(typed.printApproach).toBe(0);

  const beforeExplosion = await page.evaluate(() => ({
    carrierX: window.__selectricDebug.state.carrierX,
    line: window.__selectricDebug.state.line
  }));
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.55));
  const exploded = await page.evaluate(() => window.__selectricDebug.state);
  expect(exploded.explosion).toBeCloseTo(0.55, 6);
  expect(exploded.carrierX).toBeCloseTo(beforeExplosion.carrierX, 6);
  expect(exploded.line).toBe(beforeExplosion.line);

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

  await page.evaluate(() => window.__selectricDebug.index());
  const indexed = await page.evaluate(() => window.__selectricDebug.state);
  expect(indexed.line).toBe(1);
  expect(indexed.platenIndex).not.toBe(0);

  await page.evaluate(() => window.__selectricDebug.carriageReturn());
  const returned = await page.evaluate(() => window.__selectricDebug.state);
  expect(returned.carrierX).toBeCloseTo(-returned.geometry.writingLineMm / 2, 5);

  await page.screenshot({ path: 'test-results/selectric-foundation.png', fullPage: true });
  expect(errors).toEqual([]);
});
