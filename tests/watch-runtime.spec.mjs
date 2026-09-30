import { test, expect } from '@playwright/test';

test('Wind & Run advances the ETA 6497-2 simulation', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto('http://127.0.0.1:4173/watch/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__watchDebug?.snapshot));

  const before = await page.evaluate(() => window.__watchDebug.snapshot());
  expect(before.reserve).toBeLessThan(0.01);

  const buttonCount = await page.locator('#windRunBtn').count();
  expect(buttonCount).toBe(1);
  await page.evaluate(() => document.querySelector('#windRunBtn').click());

  await expect.poll(
    async () => (await page.evaluate(() => window.__watchDebug.snapshot())).reserve,
    { timeout: 5000 }
  ).toBeGreaterThan(0.5);

  await expect.poll(
    async () => (await page.evaluate(() => window.__watchDebug.snapshot())).power.mechanicalElapsedSeconds,
    { timeout: 7000 }
  ).toBeGreaterThan(0.25);

  await expect.poll(
    async () => (await page.evaluate(() => window.__watchDebug.snapshot())).escapement.releasedSeconds,
    { timeout: 7000 }
  ).toBeGreaterThan(0.10);

  await expect.poll(
    async () => (await page.evaluate(() => window.__watchDebug.snapshot())).oscillator.centerCrossings,
    { timeout: 7000 }
  ).toBeGreaterThan(0);

  const after = await page.evaluate(() => window.__watchDebug.snapshot());

  expect(after.power.running).toBe(true);
  expect(after.power.status).toBe('running');
  expect(after.rotations.fourth).not.toBeCloseTo(before.rotations.fourth, 5);
  expect(after.rotations.balance).not.toBeCloseTo(before.rotations.balance, 5);
  expect(after.rotations.secondsHand).not.toBeCloseTo(before.rotations.secondsHand, 5);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: 'test-results/watch-running.png', fullPage: true });
});
