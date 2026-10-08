import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

// P5 view capture only; the long causal runtime suite tests mechanical physics.
// WebGL screenshots are expensive in headless software renderers; keep the
// capture diagnostic separate from the causal smoke test and give it an
// explicit, bounded seven-minute budget.
test.setTimeout(420_000);

test('13-view reference QA: cardinal and keyboard captures do not change mechanism state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, {timeout: 20_000});
  await expect(page.locator('#loading')).toBeHidden();
  // A capture-only QA stylesheet suppresses the focus-toggle pill in
  // exported PNGs while preserving the live viewer's visible F2 control.
  // Window keydown still handles F2 even when the test-only pill is hidden.
  await page.addStyleTag({ content: 'body.focus-mode #focusToggle { visibility: hidden !important; }' });
  const fixedState = await page.evaluate(() => {
    const s = window.__selectricDebug.state;
    return [s.carrierX, s.cycle, s.line, s.copyControlSetting];
  });

  // Each captured PNG must be the expected viewport, nonblank and distinct.
  const captures = [];
  const seenHashes = new Set();
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  async function capture(view) {
    const filename = 'selectric-reference-' + view + '.png';
    const captureStarted = Date.now();
    const buffer = await page.screenshot({path: 'test-results/' + filename, fullPage: true});
    expect(buffer.subarray(0, 8).equals(pngSignature)).toBe(true);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    expect([width, height]).toEqual([1440, 900]);
    expect(buffer.length).toBeGreaterThan(20_000);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    expect(seenHashes.has(sha256)).toBe(false);
    seenHashes.add(sha256);
    const mechanical = await page.evaluate(() => {
      const s = window.__selectricDebug.state;
      return {carrierX:s.carrierX, cycle:s.cycle, line:s.line,
        copyControlSetting:s.copyControlSetting, serviceCoverOpen:s.serviceCoverOpen,
        explosion:s.explosion};
    });
    captures.push({view, filename, sha256, width, height, bytes:buffer.length,
      captureDurationMs: Date.now() - captureStarted, mechanical});
  }

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
    await expect(page.locator('#focusToggle')).toBeHidden();
    await expect(page.locator('.controls')).toBeHidden();
    await capture(view);
    await page.keyboard.press('F2');
    await expect(page.locator('#focusToggle')).toBeVisible();
    await expect(page.locator('.controls')).toBeVisible();
  }

  await page.locator('[data-view="carrier"]').click();
  await expect.poll(() => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.keyboard.press('F2');
  await capture('carrier-focus');
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
  await capture('shallow-exploded');
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

  // Non-promoting P5 shell research: opt-in mesh swap MUST be reversible
  // by exact original geometry UUID, and reset must disable the experiment.
  const previewButton = page.locator('#cheekSmoothingPreviewBtn');
  const cheek = () => page.evaluate(() =>
    window.__selectricDebug.state.geometry.cheekSmoothingPreviewP5);
  const defaultCheek = await cheek();
  expect(defaultCheek.enabled).toBe(false);
  expect(defaultCheek.activeRightGeometryUuid).toBe(defaultCheek.originalRightGeometryUuid);
  expect(defaultCheek.activeLeftGeometryUuid).toBe(defaultCheek.originalLeftGeometryUuid);
  await previewButton.click();
  await expect(previewButton).toHaveAttribute('aria-pressed', 'true');
  const smoothed = await cheek();
  expect(smoothed.enabled).toBe(true);
  expect(smoothed.activeRightGeometryUuid).not.toBe(defaultCheek.originalRightGeometryUuid);
  expect(smoothed.activeLeftGeometryUuid).not.toBe(defaultCheek.originalLeftGeometryUuid);
  expect(smoothed.activeRightGeometryUuid).toBe(smoothed.activeLeftGeometryUuid);
  await page.evaluate(() => window.__selectricDebug.setServiceCover(1));
  expect((await cheek()).enabled).toBe(true);
  await page.evaluate(() => window.__selectricDebug.setServiceCover(0));
  await previewButton.click();
  const restoredCheek = await cheek();
  expect(restoredCheek.enabled).toBe(false);
  expect(restoredCheek.activeRightGeometryUuid).toBe(defaultCheek.originalRightGeometryUuid);
  expect(restoredCheek.activeLeftGeometryUuid).toBe(defaultCheek.originalLeftGeometryUuid);
  await previewButton.click();
  await page.locator('#resetBtn').click();
  await expect(previewButton).toHaveAttribute('aria-pressed', 'false');
  const resetCheek = await cheek();
  expect(resetCheek.activeRightGeometryUuid).toBe(defaultCheek.originalRightGeometryUuid);
  expect(resetCheek.activeLeftGeometryUuid).toBe(defaultCheek.originalLeftGeometryUuid);
  const mechanismAfterPreview = await page.evaluate(() => {
    const s = window.__selectricDebug.state;
    return [s.carrierX, s.cycle, s.line, s.copyControlSetting];
  });
  expect(mechanismAfterPreview).toEqual(fixedState);

  // Inspect real THREE.BufferGeometry world-space AABBs over a cover sweep.
  // X-axis hinge motion must preserve separation even when smooth preview
  // changes the cheek Y/Z section. This is a named-mesh bound, not a global
  // machine collision certificate or production assembly tolerance.
  let referenceMargins = null;
  for (const preview of [false, true]) {
    await page.evaluate(enabled =>
      window.__selectricDebug.setCheekSmoothingPreview(enabled), preview);
    for (const cover of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate(value => window.__selectricDebug.setServiceCover(value), cover);
      const probe = await page.evaluate(() =>
        window.__selectricDebug.shellMeshSeparationProbe());
      expect(probe.previewEnabled).toBe(preview);
      expect(probe.serviceCoverOpen).toBeCloseTo(cover, 8);
      expect(probe.explosion).toBeCloseTo(0, 8);
      const names = [
        'mainHoodRightMarginWorldXmm', 'mainHoodLeftMarginWorldXmm',
        'rearBridgeRightMarginWorldXmm', 'rearBridgeLeftMarginWorldXmm'
      ];
      const values = names.map(name => probe[name]);
      for (const value of values) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
      expect(probe.cheekMirrorEdgeErrorWorldXmm).toBeLessThan(0.05);
      if (!referenceMargins) referenceMargins = values;
      values.forEach((value, index) => expect(value).toBeCloseTo(referenceMargins[index], 4));
    }
  }
  await page.evaluate(() => {
    window.__selectricDebug.setServiceCover(0);
    window.__selectricDebug.setCheekSmoothingPreview(false);
  });
  expect((await cheek()).enabled).toBe(false);
  expect((await cheek()).activeRightGeometryUuid).toBe(defaultCheek.originalRightGeometryUuid);

  expect(captures).toHaveLength(8);
  for (const shot of captures) {
    const s = shot.mechanical;
    expect([s.carrierX, s.cycle, s.line, s.copyControlSetting]).toEqual(fixedState);
  }
  expect(errors).toEqual([]);
  const manifest = {
    format: 'selectric-reference-capture-v1',
    purpose: 'P5 rendering integrity, not historic camera or factory geometry calibration',
    gitCommit: process.env.GITHUB_SHA || null,
    sourceComparatorsAssigned: false,
    geometryReviewed: false,
    captures
  };
  await writeFile('test-results/selectric-reference-manifest.json',
    JSON.stringify(manifest, null, 2) + '\n', 'utf8');
});
