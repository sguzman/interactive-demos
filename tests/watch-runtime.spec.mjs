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

  await page.locator('#windRunBtn').click();
  await page.waitForFunction(() => window.__watchDebug.snapshot().reserve >= 0.5);

  const after = await page.evaluate(() => window.__watchDebug.step(1 / 60, 180));
  console.log('WATCH_RUNTIME_SNAPSHOT', JSON.stringify(after));

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

  // Pause freezes the mechanism; Resume releases it again.
  const runningTime = after.power.mechanicalElapsedSeconds;
  await page.locator('#pauseResumeBtn').click();
  const paused = await page.evaluate(() => window.__watchDebug.step(1 / 60, 60));
  expect(paused.power.mechanicalElapsedSeconds).toBeCloseTo(runningTime, 8);
  expect(paused.timeScale).toBe(0);

  await page.locator('#pauseResumeBtn').click();
  const resumed = await page.evaluate(() => window.__watchDebug.step(1 / 60, 60));
  expect(resumed.power.mechanicalElapsedSeconds).toBeGreaterThan(runningTime + 0.9);
  expect(resumed.timeScale).toBe(1);

  // Sound control remains optional and reversible.
  await page.locator('#soundToggleBtn').click();
  expect((await page.evaluate(() => window.__watchDebug.snapshot())).audioEnabled).toBe(false);
  await page.locator('#soundToggleBtn').click();
  expect((await page.evaluate(() => window.__watchDebug.snapshot())).audioEnabled).toBe(true);

  // Fully unwind, then prove the manual crown path still adds reserve.
  await page.locator('#basicUnwindBtn').click();
  expect((await page.evaluate(() => window.__watchDebug.snapshot())).reserve).toBeLessThan(1e-8);

  await page.locator('#advancedToggleBtn').click();
  await expect(page.locator('.controls')).toHaveClass(/advanced-open/);
  await page.locator('#windCrownBtn').click();
  const manualWind = await page.evaluate(() => window.__watchDebug.snapshot());
  expect(manualWind.reserve).toBeGreaterThan(0);
  expect(manualWind.acceptedCrownTurns).toBeGreaterThan(0);

  // Exercise one Advanced frame so the diagnostic stack is not merely present
  // in the DOM; it must execute without throwing.
  await page.evaluate(() => window.__watchDebug.step(1 / 60, 1));
  expect(pageErrors).toEqual([]);

  // Return to the simple public surface before rendered QA captures.
  await page.locator('#advancedToggleBtn').click();
  await expect(page.locator('.controls')).not.toHaveClass(/advanced-open/);

  // Restore the normal public running state after destructive control tests so
  // the rendered artifacts represent the experience a visitor is meant to see.
  await page.locator('#windRunBtn').click();
  await page.waitForFunction(() => window.__watchDebug.snapshot().reserve >= 0.5);
  await page.evaluate(() => window.__watchDebug.step(1 / 60, 60));

  await page.evaluate(() => window.__watchDebug.renderOnce());
  await page.screenshot({ path: 'test-results/watch-running.png', fullPage: true });

  await page.evaluate(() => {
    document.querySelector('[data-view="train"]')?.click();
    window.__watchDebug.step(1 / 60, 120);
    window.__watchDebug.renderOnce();
  });
  await page.screenshot({ path: 'test-results/watch-train-running.png', fullPage: true });

  await page.evaluate(() => {
    document.querySelector('[data-view="escapement"]')?.click();
    window.__watchDebug.step(1 / 60, 120);
    window.__watchDebug.renderOnce();
  });
  await page.screenshot({ path: 'test-results/watch-escapement-running.png', fullPage: true });
});
