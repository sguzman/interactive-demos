import { test, expect } from '@playwright/test';

test('DMG-01 multi-layer causal specimen remains coherent in Chromium', async ({ page }) => {
  test.setTimeout(360_000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => console.log('[browser]', message.type(), message.text()));

  const guide = await page.request.get('http://127.0.0.1:4173/docs/game-boy-dmg-01.html');
  expect(guide.status()).toBe(200);
  const guideHtml = await guide.text();
  expect(guideHtml).toContain('expression:nintendo-game-boy-dmg-01-public-engineering-guide:en:v1');
  for (const view of ['product','exploded','power','cpu-memory','cartridge','input','ppu-lcd','apu-audio','service']) {
    expect(guideHtml).toContain('../game-boy-dmg-01/?view=' + view);
  }

  await page.goto('http://127.0.0.1:4173/game-boy-dmg-01/?test=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__dmgDebug?.state));

  const initial = await page.evaluate(() => window.__dmgDebug.state);
  expect(initial.running).toBe(true);
  expect(initial.cartridge.present).toBe(true);
  expect(initial.cartridge.mapper).toBe('no-mbc');
  expect(initial.activeView).toBe('product');
  expect(initial.activeLayer).toBe('physical');
  expect(initial.geometry.revision).toBe('dmg-reference-cad-v3');
  expect(initial.geometry.finite).toBe(true);
  expect(initial.geometry.pickableCount).toBeGreaterThan(350);
  expect(initial.geometry.importedPartCount).toBeGreaterThanOrEqual(400);
  expect(initial.geometry.source.repository).toBe('tiansongyu/open-console-cad');
  expect(initial.geometry.source.commit).toBe('55081da3b4864aba36082644f9a3c5cedf1061c8');
  expect(initial.geometry.source.sha256).toBe('9aed0c26e836442ffce065f3607316df7f6d55742b708b9db2394e09e8d99beb');
  expect(initial.geometry.source.sourceModelSha256).toBe('a8c3adf2c8ede383d21c6863a61415319c32aa56cde5caf3cd3b27a827e0b21c');
  expect(initial.geometry.source.modelBytes).toBe(19581512);
  expect(initial.geometry.source.components).toBe(410);
  expect(initial.geometry.source.solids).toBe(768);
  expect(initial.geometry.source.triangles).toBe(660428);
  expect(initial.geometry.source.iterations).toBe(15);
  expect(initial.geometry.source.tessellation.linearDeflectionMm).toBeCloseTo(.10, 5);
  expect(initial.geometry.source.tessellation.angularDeflectionRad).toBeCloseTo(.15, 5);
  expect(initial.geometry.source.upstreamAudit.candidatePairs).toBe(627);
  expect(initial.geometry.source.upstreamAudit.clashes).toBe(0);
  expect(initial.geometry.source.upstreamAudit.modelMeasurements).toBe(26);
  expect(initial.geometry.source.upstreamAudit.nativeDrawingDimensions).toBe(14);
  expect(initial.geometry.source.upstreamAudit.sourceRebuild).toBe(true);
  expect(initial.geometry.source.upstreamAudit.stepRoundtrip).toBe(true);
  expect(initial.geometry.bounds.width).toBeGreaterThan(89);
  expect(initial.geometry.bounds.width).toBeLessThan(92);
  expect(initial.geometry.bounds.height).toBeGreaterThan(147);
  expect(initial.geometry.bounds.height).toBeLessThan(151);
  expect(initial.geometry.bounds.depth).toBeGreaterThan(31);
  expect(initial.geometry.bounds.depth).toBeLessThan(35);
  expect(initial.geometry.landmarkCenters.DisplayGlass[1]).toBeCloseTo(35.8, 3);
  expect(initial.geometry.landmarkCenters.DPad[0]).toBeCloseTo(-26, 3);
  expect(initial.geometry.landmarkCenters.DPad[1]).toBeCloseTo(-26, 3);
  expect(initial.geometry.landmarkCenters.ButtonA[0]).toBeCloseTo(33, 3);
  expect(initial.geometry.landmarkCenters.ButtonB[0]).toBeCloseTo(18, 3);
  expect(initial.geometry.landmarkCenters.SelectKey[0]).toBeCloseTo(-12, 3);
  expect(initial.geometry.landmarkCenters.StartKey[0]).toBeCloseTo(4, 3);
  expect(initial.geometry.referenceConformance.envelopeWithinReviewGate).toBe(true);
  expect(initial.geometry.referenceConformance.sourceCoordinateGate).toBe(true);
  for (const check of Object.values(initial.geometry.referenceConformance.landmarks)) {
    expect(check.withinSourceCoordinateTolerance).toBe(true);
    expect(check.maxAbsDeltaMm).toBeLessThanOrEqual(initial.geometry.referenceConformance.landmarkToleranceMm);
  }
  expect(initial.geometry.representativeProfile.mainboard).toBe('DMG-CPU-06');
  expect(initial.geometry.representativeProfile.universalBomClaim).toBe(false);

  await page.screenshot({ path: 'test-results/dmg-product.png', fullPage: true });

  // Power state is actual runtime state, not a cosmetic control.
  await page.locator('#powerBtn').click();
  expect((await page.evaluate(() => window.__dmgDebug.state)).running).toBe(false);
  await page.locator('#powerBtn').click();
  expect((await page.evaluate(() => window.__dmgDebug.state)).running).toBe(true);

  // Physical A press -> active-low JOYP -> deterministic visual/audio response.
  const beforeA = await page.evaluate(() => window.__dmgDebug.state);
  await page.locator('[data-button="A"]').dispatchEvent('pointerdown');
  const pressed = await page.evaluate(() => window.__dmgDebug.state);
  expect(pressed.joypad.buttons.A).toBe(true);
  expect(pressed.joypad.lowNibble & 1).toBe(0);
  expect(pressed.demo.tilePhase).not.toBe(beforeA.demo.tilePhase);
  expect(pressed.demo.toneCount).toBe(beforeA.demo.toneCount + 1);
  expect(pressed.apu.channels.CH1.active).toBe(true);
  await page.locator('[data-button="A"]').dispatchEvent('pointerup');
  expect((await page.evaluate(() => window.__dmgDebug.state)).joypad.buttons.A).toBe(false);
  await page.locator('[data-view="input"]').click();
  await page.screenshot({ path: 'test-results/dmg-input-trace.png', fullPage: true });

  // Inspection changes presentation, not the running hardware state.
  const beforeInspection = await page.evaluate(() => {
    const s = window.__dmgDebug.state;
    return { power:s.power, frame:s.ppu.frame, mapper:s.cartridge.mapper, tile:s.demo.tilePhase };
  });
  await page.locator('[data-view="exploded"]').click();
  await page.locator('[data-layer="electrical"]').click();
  const inspected = await page.evaluate(() => window.__dmgDebug.state);
  expect(inspected.explosion).toBeGreaterThan(.99);
  expect(inspected.activeLayer).toBe('electrical');
  expect(inspected.power).toBe(beforeInspection.power);
  expect(inspected.cartridge.mapper).toBe(beforeInspection.mapper);
  expect(inspected.demo.tilePhase).toBe(beforeInspection.tile);
  await page.screenshot({ path: 'test-results/dmg-exploded-electrical.png', fullPage: true });

  // Cartridge presence and mapper state are module-local.
  await page.evaluate(() => window.__dmgDebug.setCartridgePresent(false));
  let cart = await page.evaluate(() => window.__dmgDebug.state.cartridge);
  expect(cart.present).toBe(false);
  expect(cart.mapper).toBe('none');
  expect(await page.evaluate(() => window.__dmgDebug.setMapper('mbc1'))).toBe(false);

  await page.evaluate(() => {
    window.__dmgDebug.setCartridgePresent(true);
    window.__dmgDebug.setMapper('mbc1');
    window.__dmgDebug.writeMapper(0x2000, 3);
  });
  cart = await page.evaluate(() => window.__dmgDebug.state.cartridge);
  expect(cart.mapper).toBe('mbc1');
  expect(cart.romBank).toBe(3);
  const translated = await page.evaluate(() => window.__dmgDebug.resolveCartridgeAddress(0x4000));
  expect(translated.bank).toBe(3);
  expect(translated.physical).toBe(0xC000);
  await page.locator('[data-view="cartridge"]').click();
  await page.screenshot({ path: 'test-results/dmg-cartridge-mbc.png', fullPage: true });

  // PPU temporal access policy.
  await page.evaluate(() => window.__dmgDebug.setPpuPosition(23, 100));
  let ppu = await page.evaluate(() => window.__dmgDebug.state.ppu);
  expect(ppu.mode).toBe(3);
  expect(ppu.vramCpuAccess).toBe(false);
  expect(ppu.oamCpuAccess).toBe(false);
  await page.locator('[data-view="ppu-lcd"]').click();
  await page.locator('[data-layer="temporal"]').click();
  await page.screenshot({ path: 'test-results/dmg-ppu-mode3.png', fullPage: true });

  await page.evaluate(() => window.__dmgDebug.setPpuPosition(23, 300));
  ppu = await page.evaluate(() => window.__dmgDebug.state.ppu);
  expect(ppu.mode).toBe(0);
  expect(ppu.vramCpuAccess).toBe(true);
  expect(ppu.oamCpuAccess).toBe(true);

  // OAM DMA moves exactly 160 bytes and restores normal CPU access.
  const completionsBefore = (await page.evaluate(() => window.__dmgDebug.state.dma.completionCount));
  await page.evaluate(() => window.__dmgDebug.startDma(0xC0));
  let during = await page.evaluate(() => window.__dmgDebug.state);
  expect(during.dma.active).toBe(true);
  expect(during.cpu.accessAllowed).toBe(false);
  await page.evaluate(() => window.__dmgDebug.advanceDots(640));
  const afterDma = await page.evaluate(() => window.__dmgDebug.state);
  expect(afterDma.dma.active).toBe(false);
  expect(afterDma.dma.bytesMoved).toBe(160);
  expect(afterDma.dma.completionCount).toBe(completionsBefore + 1);
  expect(afterDma.cpu.accessAllowed).toBe(true);
  await page.screenshot({ path: 'test-results/dmg-oam-dma.png', fullPage: true });

  // Electronic APU level and physical volume control remain independent.
  await page.locator('#nr50').evaluate(el => { el.value = '25'; el.dispatchEvent(new Event('input', { bubbles:true })); });
  await page.locator('#physicalVolume').evaluate(el => { el.value = '80'; el.dispatchEvent(new Event('input', { bubbles:true })); });
  const audio = await page.evaluate(() => window.__dmgDebug.state.apu);
  expect(audio.nr50).toBeCloseTo(.25, 4);
  expect(audio.physicalVolume).toBeCloseTo(.8, 4);
  await page.locator('[data-view="apu-audio"]').click();
  await page.screenshot({ path: 'test-results/dmg-apu-audio.png', fullPage: true });

  // Service is a diagnostic graph: a test narrows candidate causes.
  await page.evaluate(() => window.__dmgDebug.setServiceScenario('no-power'));
  const serviceBefore = await page.evaluate(() => window.__dmgDebug.state.service);
  expect(serviceBefore.hypotheses.length).toBeGreaterThan(2);
  await page.evaluate(() => window.__dmgDebug.runServiceTest('rails'));
  const serviceAfter = await page.evaluate(() => window.__dmgDebug.state.service);
  expect(serviceAfter.hypotheses).toEqual(['DC/DC converter']);
  expect(serviceAfter.resolved).toBe(true);
  await page.locator('[data-view="service"]').click();
  await page.screenshot({ path: 'test-results/dmg-service-diagnosis.png', fullPage: true });

  // Reference-grounded geometry views. These are clean, deterministic inspection renders used for
  // human comparison against the frozen DMG reference pack.
  await page.evaluate(() => {
    document.body.classList.add('qa-render');
    window.__dmgDebug.setView('product');
    window.__dmgDebug.setExplosion(0);
  });

  await page.evaluate(() => window.__dmgDebug.setQaCamera([0,0,330],[0,0,0],[0,1,0]));
  await page.screenshot({ path: 'test-results/dmg-reference-front.png', fullPage: true });

  await page.evaluate(() => window.__dmgDebug.setQaCamera([0,0,-330],[0,0,0],[0,1,0]));
  await page.screenshot({ path: 'test-results/dmg-reference-rear.png', fullPage: true });

  await page.evaluate(() => window.__dmgDebug.setQaCamera([-330,0,0],[0,0,0],[0,1,0]));
  await page.screenshot({ path: 'test-results/dmg-reference-left.png', fullPage: true });

  await page.evaluate(() => window.__dmgDebug.setQaCamera([330,0,0],[0,0,0],[0,1,0]));
  await page.screenshot({ path: 'test-results/dmg-reference-right.png', fullPage: true });

  await page.evaluate(() => window.__dmgDebug.setQaCamera([0,330,0],[0,0,0],[0,0,-1]));
  await page.screenshot({ path: 'test-results/dmg-reference-top.png', fullPage: true });

  await page.evaluate(() => {
    window.__dmgDebug.setExplosion(1);
    window.__dmgDebug.setQaCamera([470,250,700],[0,0,-30],[0,1,0]);
  });
  await page.screenshot({ path: 'test-results/dmg-reference-exploded.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});
