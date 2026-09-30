import { test, expect } from '@playwright/test';

test('Wind & Run advances the ETA 6497-2 simulation', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto('http://127.0.0.1:4173/watch/?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__watchDebug?.snapshot));

  const before = await page.evaluate(() => window.__watchDebug.snapshot());
  expect(before.reserve).toBeLessThan(0.01);

  page.on('console', message => console.log('[browser]', message.type(), message.text()));
  const buttonCount = await page.locator('#windRunBtn').count();
  expect(buttonCount).toBe(1);

  const scheduled = await page.evaluate(() => window.__watchDebug.windAndRun());
  expect(scheduled).toBe(true);
  await page.waitForFunction(() => window.__watchDebug.snapshot().reserve >= 0.5);

  const after = await page.evaluate(() => window.__watchDebug.step(1 / 60, 180));

  expect(after.reserve).toBeGreaterThan(0.5);
  expect(after.power.mechanicalElapsedSeconds).toBeGreaterThan(2.5);
  expect(after.escapement.releasedSeconds).toBeGreaterThan(2.0);
  expect(after.oscillator.centerCrossings).toBeGreaterThan(10);
  expect(after.power.running).toBe(true);
  expect(after.power.status).toBe('running');
  expect(after.rotations.fourth).not.toBeCloseTo(before.rotations.fourth, 5);
  expect(after.rotations.balance).not.toBeCloseTo(before.rotations.balance, 5);
  expect(after.rotations.secondsHand).not.toBeCloseTo(before.rotations.secondsHand, 5);
  expect(pageErrors).toEqual([]);

  await page.evaluate(() => window.__watchDebug.renderOnce());
  await page.screenshot({ path: 'test-results/watch-running.png', fullPage: true });
});
