import { test, expect } from '@playwright/test';

// P5 view capture only; the long causal runtime suite tests mechanical physics.
test.setTimeout(180_000);

test('13-view reference QA: cardinal and keyboard captures do not change mechanism state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout: 20_000});
  await expect(page.locator('#loading')).toBeHidden();
  const fixedState = await page.evaluate(() => {
    const s = window.__selectricDebug.state;
    return [s.carrierX, s.cycle, s.line, s.copyControlSetting];
  });

  for (const view of ['front', 'rear', 'left', 'right', 'top', 'keyboard']) {
    const button = page.locator('[data-view="' + view + '"]');
    await button.click();
    await expect(button).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);
    await page.waitForTimeout(180);
    const state = await page.evaluate(() => window.__selectricDebug.state);
    expect(state.geometry.finite).toBe(true);
    expect(state.geometry.inspectionCutaway.mode).toBe('none');
    expect([state.carrierX, state.cycle, state.line, state.copyControlSetting]).toEqual(fixedState);
    await page.keyboard.press('F2');
    await expect(page.locator('#focusToggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.controls')).toBeHidden();
    await page.screenshot({path: 'test-results/selectric-reference-' + view + '.png', fullPage: true});
    await page.keyboard.press('F2');
    await expect(page.locator('.controls')).toBeVisible();
  }

  await page.locator('[data-view="carrier"]').click();
  await expect.poll(() => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.keyboard.press('F2');
  await page.screenshot({path: 'test-results/selectric-reference-carrier-focus.png', fullPage: true});
  await page.keyboard.press('F2');

  // A deliberately shallow P5 separation fills the final 13-view capture slot.
  // This is NOT the old 55%-exploded mechanism screenshot and does not mutate
  // source-backed part geometry or any mechanical actuator state.
  await page.locator('[data-view="product"]').click();
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.15));
  const shallow = await page.evaluate(() => window.__selectricDebug.state);
  expect(shallow.explosion).toBeCloseTo(0.15, 7);
  expect(shallow.geometry.finite).toBe(true);
  expect(shallow.geometry.inspectionCutaway.mode).toBe('none');
  expect([shallow.carrierX, shallow.cycle, shallow.line, shallow.copyControlSetting]).toEqual(fixedState);
  await page.waitForTimeout(220);
  await page.keyboard.press('F2');
  await expect(page.locator('#focusToggle')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({path: 'test-results/selectric-reference-shallow-exploded.png', fullPage: true});
  await page.keyboard.press('F2');
  await page.evaluate(() => window.__selectricDebug.setExplosion(0));
  const restored = await page.evaluate(() => window.__selectricDebug.state);
  expect(restored.explosion).toBeCloseTo(0, 8);
  expect(restored.geometry.finite).toBe(true);
  expect([restored.carrierX, restored.cycle, restored.line, restored.copyControlSetting]).toEqual(fixedState);
  const after = await page.evaluate(() => {
    const s = window.__selectricDebug.state;
    return [s.carrierX, s.cycle, s.line, s.copyControlSetting];
  });
  expect(after).toEqual(fixedState);
  expect(errors).toEqual([]);
});
