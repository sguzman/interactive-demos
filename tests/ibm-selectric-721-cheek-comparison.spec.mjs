import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

test.setTimeout(420_000);

test('Selectric P5 matched-pose original vs smooth cheek reference pairs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, { timeout: 20000 });
  await expect(page.locator('#loading')).toBeHidden();
  await page.addStyleTag({ content: 'body.focus-mode #focusToggle { visibility: hidden !important; }' });

  // Stop the motor at rest to minimize unrelated moving parts between pairs.
  expect(await page.evaluate(() => window.__selectricDebug.setPower(false))).toBe(true);
  const stateSnapshot = () => page.evaluate(() => {
    const s = window.__selectricDebug.state;
    return {
      carrierX: s.carrierX, cycle: s.cycle, line: s.line,
      copyControlSetting: s.copyControlSetting, explosion: s.explosion,
      power: s.powered, serviceCoverOpen: s.serviceCoverOpen
    };
  });
  const initial = await stateSnapshot();
  expect(initial.cycle).toBe('C0_REST');
  expect(initial.explosion).toBe(0);
  expect(initial.power).toBe(false);

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const captured = [];
  const original = await page.evaluate(() =>
    window.__selectricDebug.state.geometry.cheekSmoothingPreviewP5);
  expect(original.enabled).toBe(false);

  for (const view of ['left', 'right', 'rear']) {
    await page.locator('[data-view="' + view + '"]').click();
    await expect(page.locator('[data-view="' + view + '"]')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);
    await page.waitForTimeout(350); // settle camera damping before recording fixed pose
    const pose = await page.evaluate(() => window.__selectricDebug.inspectionCameraPose());
    expect(pose.class).toContain('P5 deterministic viewer orbit');
    await page.keyboard.press('F2');
    await expect(page.locator('.controls')).toBeHidden();

    const pair = [];
    for (const mode of ['original', 'smooth']) {
      const enabled = mode === 'smooth';
      expect(await page.evaluate(value =>
        window.__selectricDebug.setCheekSmoothingPreview(value), enabled)).toBe(enabled);
      await page.waitForTimeout(110);
      const currentPose = await page.evaluate(() => window.__selectricDebug.inspectionCameraPose());
      expect(currentPose).toEqual(pose);
      const mechanics = await stateSnapshot();
      expect(mechanics).toEqual(initial);
      const cheek = await page.evaluate(() =>
        window.__selectricDebug.state.geometry.cheekSmoothingPreviewP5);
      expect(cheek.enabled).toBe(enabled);
      if (enabled) {
        expect(cheek.activeRightGeometryUuid).not.toBe(original.originalRightGeometryUuid);
        expect(cheek.activeLeftGeometryUuid).not.toBe(original.originalLeftGeometryUuid);
      } else {
        expect(cheek.activeRightGeometryUuid).toBe(original.originalRightGeometryUuid);
        expect(cheek.activeLeftGeometryUuid).toBe(original.originalLeftGeometryUuid);
      }
      const filename = 'selectric-cheek-' + view + '-' + mode + '.png';
      const raw = await page.screenshot({ path: 'test-results/' + filename, fullPage: true });
      expect(raw.subarray(0, 8).equals(pngSignature)).toBe(true);
      expect(raw.readUInt32BE(16)).toBe(1440);
      expect(raw.readUInt32BE(20)).toBe(900);
      expect(raw.length).toBeGreaterThan(20_000);
      const sha256 = createHash('sha256').update(raw).digest('hex');
      pair.push(sha256);
      captured.push({ view, mode, filename, sha256, bytes: raw.length,
        width: 1440, height: 900, camera: pose, mechanics,
        sourceCalibrated: false, geometryPromoted: false });
    }
    // Both modes must actually generate different pixels at this camera;
    // this tests visual inspectability, not source silhouette agreement.
    expect(pair[0]).not.toBe(pair[1]);
    await page.evaluate(() => window.__selectricDebug.setCheekSmoothingPreview(false));
    const restored = await page.evaluate(() =>
      window.__selectricDebug.state.geometry.cheekSmoothingPreviewP5);
    expect(restored.activeLeftGeometryUuid).toBe(original.originalLeftGeometryUuid);
    expect(restored.activeRightGeometryUuid).toBe(original.originalRightGeometryUuid);
    await page.keyboard.press('F2');
    await expect(page.locator('.controls')).toBeVisible();
  }
  expect(captured).toHaveLength(6);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-cheek-comparison-manifest.json', JSON.stringify({
    format: 'selectric-p5-cheek-comparison-v1',
    publicCommit: process.env.GITHUB_SHA || null,
    comparisonClass: 'matched P5 viewer poses, not historical Q1/Q4 cameras',
    approvedProductionGeometry: false,
    historicPhotoComparisonDone: false,
    carrierCollisionCertified: false,
    captures: captured
  }, null, 2) + '\n', 'utf8');
});
