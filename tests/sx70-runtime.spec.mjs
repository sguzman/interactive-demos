import { test, expect } from '@playwright/test';

test('SX-70 folding shell opens, focuses, explodes, and folds in Chromium', async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => console.log('[browser]', message.type(), message.text()));

  await page.goto('http://127.0.0.1:4173/sx70/?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__sx70Debug?.state));

  const before = await page.evaluate(() => window.__sx70Debug.state);
  expect(before.deployment).toBeLessThan(0.02);
  expect(before.explosion).toBeLessThan(0.01);

  await expect(page.locator('#deploymentState')).toHaveText('FOLDED');
  await expect(page.locator('#powerState')).toHaveText('S6 OPEN · DISABLED');

  await page.locator('#openBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.deployment > 0.985);

  const opened = await page.evaluate(() => window.__sx70Debug.state);
  expect(opened.deployment).toBeGreaterThan(0.985);
  await expect(page.locator('#deploymentState')).toHaveText('ERECT · LOCKED');
  await expect(page.locator('#powerState')).toHaveText('S6 CLOSED · ENABLED');
  await expect(page.locator('#takePhotoBtn')).toBeEnabled();

  // Prove the causal exposure engine, not merely the rendering.
  await page.locator('#takePhotoBtn').click();
  await page.waitForFunction(() => window.__sx70Debug.state.cycle.phase !== 'idle');
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
  await expect(page.locator('#deploymentState')).toHaveText('FOLDED');
  await expect(page.locator('#powerState')).toHaveText('S6 OPEN · DISABLED');

  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: 'test-results/sx70-folded.png', fullPage: true });
});
