import { test, expect } from '@playwright/test';

test('SX-70 folding shell opens, focuses, explodes, and folds in Chromium', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => console.log('[browser]', message.type(), message.text()));

  await page.goto('http://127.0.0.1:4173/sx70/?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__sx70Debug?.state));

  const before = await page.evaluate(() => window.__sx70Debug.state);
  expect(before.deployment).toBeLessThan(0.02);
  expect(before.explosion).toBeLessThan(0.01);

  await expect(page.locator('#deploymentState')).toHaveValue('FOLDED');
  await expect(page.locator('#powerState')).toHaveValue('S6 OPEN · DISABLED');

  await page.locator('#openBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.deployment > 0.985);

  const opened = await page.evaluate(() => window.__sx70Debug.state);
  expect(opened.deployment).toBeGreaterThan(0.985);
  await expect(page.locator('#deploymentState')).toHaveValue('ERECT · LOCKED');
  await expect(page.locator('#powerState')).toHaveValue('S6 CLOSED · ENABLED');

  await page.locator('#focus').fill('82');
  const focused = await page.evaluate(() => window.__sx70Debug.state);
  expect(focused.focus).toBeCloseTo(0.82, 2);

  await page.locator('#advancedToggleBtn').click();
  await expect(page.locator('.controls')).toHaveClass(/advanced-open/);

  await page.locator('#explodeBtn').click();
  const exploded = await page.evaluate(() => window.__sx70Debug.state);
  expect(exploded.explosion).toBeCloseTo(1, 6);

  await page.locator('#assembleBtn').click();
  const assembled = await page.evaluate(() => window.__sx70Debug.state);
  expect(assembled.explosion).toBeCloseTo(0, 6);

  await page.locator('[data-view="folding"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/sx70-open-folding.png', fullPage: true });

  await page.locator('#foldBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.deployment < 0.015);

  const folded = await page.evaluate(() => window.__sx70Debug.state);
  expect(folded.deployment).toBeLessThan(0.015);
  await expect(page.locator('#deploymentState')).toHaveValue('FOLDED');
  await expect(page.locator('#powerState')).toHaveValue('S6 OPEN · DISABLED');

  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: 'test-results/sx70-folded.png', fullPage: true });
});
