import { test, expect } from '@playwright/test';

// The causal smoke also captures seven full-page inspection artifacts; CI rendering can exceed three minutes.
test.setTimeout(300_000);

test('IBM Selectric 721 causal foundation and gallery integration', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  const galleryLink = page.locator('a.launch[href="./ibm-selectric-721/"]');
  await expect(galleryLink).toHaveCount(1);

  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  if (errors.length) throw new Error('Selectric initialization error: ' + errors.join(' | '));
  await page.waitForFunction(() => Boolean(window.__selectricDebug?.state?.running), null, { timeout: 15_000 });
  await expect(page.locator('#loading')).toBeHidden();

  const initial = await page.evaluate(() => window.__selectricDebug.state);
  expect(initial.geometry.finite).toBe(true);
  expect(initial.geometry.revision).toBe('selectric-integrated-public-build');
  expect(initial.geometry.supportTopology).toContain('Level-2');
  expect(initial.geometry.shellTopology).toContain('hinged hood');
  expect(initial.geometry.writingPositionIndicator.carrierParented).toBe(true);
  expect(initial.geometry.writingPositionIndicator.worldX).toBeCloseTo(initial.carrierX, 8);
  expect(initial.geometry.explosionClass).toContain('assembly-separation');
  expect(initial.geometry.d6CurrentSet.shaft).toBe('1164736');
  expect(initial.geometry.d6CurrentSet.bearings).toBe('1164740');
  expect(initial.geometry.d6CurrentSet.gear).toBe('1164739');
  expect(initial.geometry.d6CurrentSet.clipMarketFrozen).toBe(false);
  expect(initial.geometry.platenRatchet.outerDiameterMm).toBeCloseTo(30.1498, 6);
  expect(initial.geometry.platenRatchet.teeth).toBe(27);
  expect(initial.geometry.platenRatchet.lineSpacingModes).toEqual(['single', 'double']);
  expect(initial.geometry.platenRatchet.singleIndexTeeth).toBe(1);
  expect(initial.geometry.platenRatchet.doubleIndexTeeth).toBe(2);
  expect(initial.geometry.platenRatchet.activeIndexTeeth).toBe(1);
  expect(initial.geometry.platenRatchet.paperAdvancePerRatchetToothMm).toBeCloseTo(2 * Math.PI * 18.1864 / 27, 8);
  expect(initial.geometry.platenRatchet.paperAdvanceDerivation).toContain('P2 arc length');
  expect(initial.paperAdvanceMm).toBe(0);
  expect(initial.lineSpacingTeeth).toBe(1);
  expect(initial.geometry.paperFeed.frontRollers).toBe(4);
  expect(initial.geometry.paperFeed.rearRollers).toBe(4);
  expect(initial.geometry.paperFeed.bailRollers).toBe(2);
  expect(initial.geometry.paperFeed.bailStableStates).toEqual(['against-platen', 'released']);
  expect(initial.geometry.paperFeed.bailToggle).toContain('two-stable-state');
  expect(initial.geometry.paperFeed.frontRearReleaseCoupled).toBe(true);
  expect(initial.geometry.paperFeed.releaseLatchedStateRepresented).toBe(true);
  expect(initial.geometry.paperFeed.copyControl.positions).toBe(5);
  expect(initial.geometry.paperFeed.copyControl.normalForwardSetting).toBe(0);
  expect(initial.geometry.paperFeed.copyControl.movesPlatenAndEntirePaperFeedCarriage).toBe(true);
  expect(initial.geometry.paperFeed.copyControl.movesCarrierTypehead).toBe(false);
  expect(initial.geometry.ribbon.parent).toBe('carrier');
  expect(initial.geometry.ribbon.mediaWidthMm).toBeCloseTo(14.2875, 6);
  expect(initial.geometry.ribbon.nominalRatchetTeethPerCharacter).toBeCloseTo(2.5, 8);
  expect(initial.geometry.ribbon.path).toEqual(['left-spool','left-guide','print-point','right-guide','right-spool']);
  expect(initial.geometry.ribbon.reverseTopology).toContain('lost supply-core loop');
  expect(initial.geometry.ribbon.reverseTopology).toContain('pawl/check transfer');
  expect(initial.geometry.ribbon.reverseIsAnimatedSequence).toBe(true);
  expect(initial.geometry.ribbon.reverseThresholdClass).toContain('P5 compressed');
  expect(initial.geometry.ribbon.reverseState).toBe('feeding');
  expect(initial.geometry.ribbon.reverseCount).toBe(0);
  expect(initial.geometry.ribbon.spoolFillP5[0]).toBeCloseTo(0.86, 8);
  expect(initial.geometry.ribbon.spoolFillP5[1]).toBeCloseTo(0.14, 8);
  expect(initial.geometry.ribbon.spoolFillClass).toContain('P5 compressed');
  expect(initial.ribbonPrintMode).toBe('middle');
  expect(initial.geometry.ribbon.printModes).toEqual(['stencil', 'low', 'middle', 'high']);
  expect(initial.geometry.ribbon.liftHeightClass).toContain('exact OEM lift heights unresolved');
  expect(initial.geometry.ribbon.stencilRibbonAtPrintPoint).toBe(true);
  expect(initial.ribbonLoadState).toBe(false);
  expect(initial.geometry.ribbon.loadStateDistinctFromHighPrintLift).toBe(true);
  expect(initial.geometry.ribbon.loadLiftClass).toContain('exact OEM load height unresolved');
  expect(initial.geometry.shaftTiming.cycleShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.filterShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.printShaftDegPerCharacter).toBe(360);
  expect(initial.geometry.fineAlignment.coarseSelectionSeparate).toBe(true);
  expect(initial.geometry.fineAlignment.tiltSeatsBeforeRotateInPresentation).toBe(true);
  expect(initial.geometry.fineAlignment.exactPivotsAndTimingDegrees).toBe('unresolved');
  expect(initial.geometry.printRocker.motion).toBe('revolute');
  expect(initial.geometry.printRocker.restClearanceMm).toBeGreaterThanOrEqual(6.604);
  expect(initial.geometry.printRocker.restClearanceMm).toBeLessThanOrEqual(6.858);
  expect(initial.geometry.printRocker.poweredEndpointClearanceMm).toBeGreaterThanOrEqual(0.508);
  expect(initial.geometry.printRocker.poweredEndpointClearanceMm).toBeLessThanOrEqual(0.762);
  expect(initial.geometry.printRocker.freeFlightRepresented).toBe(true);
  expect(initial.geometry.sleeveCamOrder).toEqual([
    'ribbon-lift',
    '1164240-feed-detent',
    '1124174-print-restoring'
  ]);
  expect(initial.profile).toContain('12 CPI');
  expect(initial.explosion).toBe(0);
  expect(initial.serviceCoverOpen).toBe(0);
  expect(initial.cycle).toBe('C0_REST');
  expect(initial.powered).toBe(true);
  expect(initial.geometry.primaryDrive.motorPulleyTeeth).toBe(8);
  expect(initial.geometry.primaryDrive.cycleClutchPulleyTeeth).toBe(29);
  expect(initial.geometry.primaryDrive.reduction).toBeCloseTo(3.625, 10);
  expect(initial.geometry.primaryDrive.pitchRadiusRatio).toBeCloseTo(29 / 8, 10);
  expect(initial.geometry.primaryDrive.beltPathPointCount).toBeGreaterThan(40);
  expect(initial.geometry.primaryDrive.beltMotorWrapDegP4).toBeLessThan(180);
  expect(initial.geometry.primaryDrive.beltCycleWrapDegP4).toBeGreaterThan(180);
  expect(initial.geometry.primaryDrive.beltMotorWrapDegP4 + initial.geometry.primaryDrive.beltCycleWrapDegP4).toBeCloseTo(360, 8);
  expect(initial.geometry.primaryDrive.beltTangentOrthogonalityErrorMm).toBeLessThan(1e-10);
  expect(initial.geometry.primaryDrive.beltCenterlineLengthMmP4).toBeGreaterThan(0);
  expect(initial.geometry.primaryDrive.beltMotionMarkerCountP5).toBe(4);
  expect(initial.geometry.primaryDrive.beltMotionMarkerPhaseP5).toHaveLength(4);
  expect(initial.geometry.primaryDrive.beltTravelFractionPerMotorRevP4).toBeCloseTo(
    2 * Math.PI * 7 / initial.geometry.primaryDrive.beltCenterlineLengthMmP4,
    10
  );
  expect(initial.geometry.primaryDrive.beltMotionClass).toContain('advected along the P4 belt path');
  expect(initial.geometry.primaryDrive.beltPathClass).toContain('external-tangent solve');
  expect(initial.geometry.primaryDrive.cycleClutchPulleyHubContinuous).toBe(true);
  expect(initial.geometry.primaryDrive.cycleShaftEventGated).toBe(true);
  expect(initial.geometry.powerPresentation.operationalShaftContinuousWhenPowered).toBe(true);
  expect(initial.geometry.powerPresentation.serviceCamsStationaryUntilSelected).toBe(true);
  expect(initial.geometry.typeElement.characterCount).toBe(88);
  expect(initial.geometry.typeElement.bands).toBe(4);
  expect(initial.geometry.typeElement.positionsPerBand).toBe(22);
  expect(initial.geometry.typeElement.slugOrientation).toContain('surface-normal');
  expect(initial.geometry.typeElement.rotateSlotStepDegP4).toBeCloseTo(360 / 22, 10);
  expect(initial.geometry.typeElement.bandLatitudesP4).toEqual([-0.58, -0.2, 0.2, 0.58]);
  expect(initial.geometry.typeElement.bandTiltAnglesDegP4).toHaveLength(4);
  expect(initial.geometry.typeElement.selectionOrientationClass).toContain('structural lattice alignment');
  expect(initial.geometry.typeElement.printFacingOffsetDegP4).toBe(180);
  expect(initial.geometry.typeElement.printFacingTarget).toContain('-Z toward platen');
  expect(initial.geometry.typeElement.selectedSlugAlignmentErrorDegP4).toBeLessThan(1e-7);
  expect(initial.geometry.typeElement.selectedSlugFacingVectorP4.z).toBeCloseTo(-1, 8);
  expect(initial.geometry.printRocker.currentAngleDeg).toBeCloseTo(0, 8);
  expect(initial.geometry.printRocker.selectedSlugPlatenClearanceAlongZMmP4).toBeGreaterThan(3);
  expect(initial.geometry.printRocker.selectedSlugPlatenClearanceAlongZMmP4).toBeLessThan(9);
  expect(initial.geometry.printRocker.liveClearanceClass).toContain('geometry check');
  expect(initial.geometry.typeElement.glyphFaceGeometry).toContain('unresolved');
  expect(initial.geometry.operationalCams.spaceBackspaceDegreesPerOperation).toBe(180);
  expect(initial.geometry.operationalCams.carrierReturnIndexDegreesPerOperation).toBe(360);
  expect(initial.geometry.operationalCams.tabUsesPoweredCam).toBe(false);
  expect(initial.geometry.operationalCams.shiftInterlocksCharacterCycle).toBe(true);
  expect(initial.geometry.returnTabDrive.carrierReturnFiniteTriggerThenSustained).toBe(true);
  expect(initial.geometry.returnTabDrive.carrierReturnSpringClutch).toBe(true);
  expect(initial.geometry.returnTabDrive.tabPropulsion).toBe('mainspring');
  expect(initial.geometry.returnTabDrive.tabGovernorReference).toBe('operational-shaft');
  expect(initial.geometry.returnTabDrive.tabGovernorPropulsion).toBe(false);
  expect(initial.geometry.returnTabDrive.tabStopsProgrammable).toBe(true);
  expect(initial.geometry.returnTabDrive.tabStopIndices).toEqual([8,16,24,32,40,48,56,64,72,80,88,96]);
  expect(initial.geometry.returnTabDrive.defaultTabStopClass).toContain('P5 every-eight-column');
  expect(initial.geometry.cordSystem.commonEscapementShaft).toBe(true);
  expect(initial.geometry.cordSystem.opposedDrumWinding).toBe(true);
  expect(initial.geometry.cordSystem.mainspringSuppliesRightwardCarrierEnergy).toBe(true);
  expect(initial.geometry.cordSystem.rightTensionArmSpiralSprings).toBe(2);
  expect(initial.geometry.marginStops.leftTerminatesCarrierReturn).toBe(true);
  expect(initial.geometry.marginStops.rightLineLockInterface).toBe(true);
  expect(initial.geometry.marginStops.adjustableOnWritingLine).toBe(true);
  expect(initial.geometry.marginStops.leftInsetColumns).toBe(0);
  expect(initial.geometry.marginStops.rightInsetColumns).toBe(0);
  expect(initial.geometry.marginStops.positioningClass).toContain('12-CPI');
  expect(initial.geometry.backspace.mechanism).toBe('dedicated-powered-reverse-linkage');
  expect(initial.geometry.backspace.rackFamily).toEqual(['1124568', '6519139']);
  expect(initial.geometry.backspace.displacementMm).toBeCloseTo(-initial.geometry.pitchMm, 8);

  const carrierBeforePowerOff = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.setPower(false));
  const poweredOffStart = await page.evaluate(() => window.__selectricDebug.state);
  const beltMarkersOffStart = [...poweredOffStart.geometry.primaryDrive.beltMotionMarkerPhaseP5];
  await page.evaluate(() => window.__selectricDebug.typeCharacter('x'));
  await page.waitForTimeout(150);
  const poweredOff = await page.evaluate(() => window.__selectricDebug.state);
  expect(poweredOff.powered).toBe(false);
  expect(poweredOff.cycle).toBe('C0_REST');
  expect(poweredOff.carrierX).toBeCloseTo(carrierBeforePowerOff, 6);
  expect(poweredOff.geometry.primaryDrive.beltMotionMarkerPhaseP5).toEqual(beltMarkersOffStart);
  await page.evaluate(() => window.__selectricDebug.setPower(true));
  await page.waitForTimeout(120);
  const poweredBackOn = await page.evaluate(() => window.__selectricDebug.state);
  expect(poweredBackOn.geometry.primaryDrive.beltMotionMarkerPhaseP5[0]).not.toBeCloseTo(
    beltMarkersOffStart[0],
    6
  );

  await page.evaluate(() => window.__selectricDebug.togglePaperRelease());
  const feedReleased = await page.evaluate(() => window.__selectricDebug.state);
  expect(feedReleased.feedRollsEngaged).toBe(false);
  expect(feedReleased.geometry.paperFeed.frontRearReleaseCoupled).toBe(true);
  const releasedPaperAdvance = feedReleased.paperAdvanceMm;
  const releasedFeedRollPhase = feedReleased.geometry.paperFeed.feedRollPhaseRad;
  const releasedPlatenAngle = feedReleased.geometry.paperFeed.platenPhysicalAngleRad;
  const releasedBailPhase = feedReleased.geometry.paperFeed.bailRollerAdjustment.rollPhaseRad;
  expect(feedReleased.geometry.paperFeed.manualPaperAlignmentAvailable).toBe(true);
  expect(await page.locator('#paperAlignForwardBtn').isEnabled()).toBe(true);
  await page.locator('#paperAlignForwardBtn').click();
  const paperAlignedForward = await page.evaluate(() => window.__selectricDebug.state);
  expect(paperAlignedForward.paperAdvanceMm - releasedPaperAdvance).toBeCloseTo(2, 8);
  expect(paperAlignedForward.geometry.paperFeed.manualPaperAlignmentMmP5).toBeCloseTo(2, 8);
  expect(paperAlignedForward.geometry.paperFeed.feedRollPhaseRad).toBeCloseTo(releasedFeedRollPhase, 8);
  expect(paperAlignedForward.geometry.paperFeed.platenPhysicalAngleRad).toBeCloseTo(releasedPlatenAngle, 8);
  expect(paperAlignedForward.geometry.paperFeed.bailRollerAdjustment.rollPhaseRad - releasedBailPhase).toBeCloseTo(-2 / 5.5, 8);
  expect(paperAlignedForward.events.some(event => event.name === 'MANUAL_PAPER_REPOSITION')).toBe(true);
  await page.locator('#paperAlignBackBtn').click();
  const paperAlignedRestored = await page.evaluate(() => window.__selectricDebug.state);
  expect(paperAlignedRestored.paperAdvanceMm).toBeCloseTo(releasedPaperAdvance, 8);
  expect(paperAlignedRestored.geometry.paperFeed.manualPaperAlignmentMmP5).toBeCloseTo(0, 8);
  expect(paperAlignedRestored.geometry.paperFeed.feedRollPhaseRad).toBeCloseTo(releasedFeedRollPhase, 8);
  expect(paperAlignedRestored.geometry.paperFeed.bailRollerAdjustment.rollPhaseRad).toBeCloseTo(releasedBailPhase, 8);
  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  await page.evaluate(() => window.__selectricDebug.rotatePlatenManually(Math.PI / 18));
  const releasedManualTurn = await page.evaluate(() => window.__selectricDebug.state);
  expect(releasedManualTurn.paperAdvanceMm).toBeCloseTo(releasedPaperAdvance, 8);
  expect(releasedManualTurn.geometry.paperFeed.feedRollPhaseRad).toBeCloseTo(releasedFeedRollPhase, 8);
  await page.evaluate(() => window.__selectricDebug.rotatePlatenManually(-Math.PI / 18));
  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  await page.evaluate(() => window.__selectricDebug.togglePaperRelease());
  const feedEngaged = await page.evaluate(() => window.__selectricDebug.state);
  expect(feedEngaged.feedRollsEngaged).toBe(true);
  expect(feedEngaged.geometry.paperFeed.manualPaperAlignmentAvailable).toBe(false);
  expect(await page.locator('#paperAlignForwardBtn').isDisabled()).toBe(true);
  expect(feedEngaged.geometry.paperFeed.paperPath.outputSheetTextured).toBe(true);
  expect(feedEngaged.geometry.paperFeed.paperPath.platenWrapRepresented).toBe(true);
  expect(feedEngaged.geometry.paperFeed.paperPath.wrapSpanDegP4).toBeCloseTo(204, 8);
  expect(feedEngaged.geometry.paperFeed.paperPath.wrapClass).toContain('exact hidden wrap/contact arc unresolved');
  expect(feedEngaged.geometry.paperFeed.paperPath.stampLayout.lastStamp).toBe(null);
  expect(feedEngaged.geometry.paperFeed.paperPath.stampLayout.placementClass).toContain('no arbitrary logical-line pixel step');

  await page.evaluate(() => window.__selectricDebug.togglePaperBail());
  const bailReleased = await page.evaluate(() => window.__selectricDebug.state);
  expect(bailReleased.paperBailEngaged).toBe(false);
  expect(bailReleased.geometry.paperFeed.bailEngaged).toBe(false);
  await page.evaluate(() => window.__selectricDebug.togglePaperBail());
  const bailEngaged = await page.evaluate(() => window.__selectricDebug.state);
  expect(bailEngaged.paperBailEngaged).toBe(true);

  const initialBailAdjustment = bailEngaged.geometry.paperFeed.bailRollerAdjustment;
  expect(initialBailAdjustment.independentlyAdjustable).toBe(true);
  expect(initialBailAdjustment.rollPhaseRad).toBeCloseTo(0, 8);
  expect(initialBailAdjustment.rollRadiusMmP4).toBeCloseTo(5.5, 8);
  expect(initialBailAdjustment.rollCoupling).toContain('passive paper-contact rotation');
  expect(initialBailAdjustment.leftNormalizedP5).toBeCloseTo(0.4, 8);
  expect(initialBailAdjustment.rightNormalizedP5).toBeCloseTo(0.4, 8);
  expect(initialBailAdjustment.travelClass).toContain('exact travel unresolved');
  const rightBailX = initialBailAdjustment.rightX;
  await page.evaluate(() => window.__selectricDebug.setPaperBailRollerPosition('left', 0.75));
  const bailAdjusted = await page.evaluate(() => window.__selectricDebug.state);
  expect(bailAdjusted.geometry.paperFeed.bailRollerAdjustment.leftNormalizedP5).toBeCloseTo(0.75, 8);
  expect(bailAdjusted.geometry.paperFeed.bailRollerAdjustment.leftX).toBeGreaterThan(initialBailAdjustment.leftX);
  expect(bailAdjusted.geometry.paperFeed.bailRollerAdjustment.rightX).toBeCloseTo(rightBailX, 8);
  await page.evaluate(() => window.__selectricDebug.setPaperBailRollerPosition('left', 0.4));

  // With the bail against the sheet, physical paper travel passively rotates both bail rollers.
  // Releasing the bail freezes their phase even while the feed system continues to advance paper.
  const bailPhaseBeforeIndex = (await page.evaluate(() => window.__selectricDebug.state)).geometry.paperFeed.bailRollerAdjustment.rollPhaseRad;
  const bailPaperBeforeIndex = (await page.evaluate(() => window.__selectricDebug.state)).paperAdvanceMm;
  await page.evaluate(() => window.__selectricDebug.index());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const bailRolled = await page.evaluate(() => window.__selectricDebug.state);
  const bailPaperDelta = bailRolled.paperAdvanceMm - bailPaperBeforeIndex;
  expect(bailRolled.geometry.paperFeed.bailRollerAdjustment.rollPhaseRad - bailPhaseBeforeIndex).toBeCloseTo(-bailPaperDelta / 5.5, 8);

  await page.evaluate(() => window.__selectricDebug.togglePaperBail());
  const bailPhaseReleased = (await page.evaluate(() => window.__selectricDebug.state)).geometry.paperFeed.bailRollerAdjustment.rollPhaseRad;
  await page.evaluate(() => window.__selectricDebug.index());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const bailReleasedAfterIndex = await page.evaluate(() => window.__selectricDebug.state);
  expect(bailReleasedAfterIndex.paperBailEngaged).toBe(false);
  expect(bailReleasedAfterIndex.geometry.paperFeed.bailRollerAdjustment.rollPhaseRad).toBeCloseTo(bailPhaseReleased, 8);
  await page.evaluate(() => window.__selectricDebug.togglePaperBail());

  const carrierBeforeCopyControl = feedEngaged.carrierX;
  await page.evaluate(() => window.__selectricDebug.setCopyControl(4));
  const copyRear = await page.evaluate(() => window.__selectricDebug.state);
  expect(copyRear.copyControlSetting).toBe(4);
  expect(copyRear.copyControlOffsetZ).toBeLessThan(0);
  expect(copyRear.carrierX).toBeCloseTo(carrierBeforeCopyControl, 8);
  expect(copyRear.geometry.paperFeed.copyControl.offsetClass).toContain('P5');
  expect(copyRear.geometry.paperFeed.copyControl.detentMarkerCount).toBe(5);
  expect(copyRear.geometry.paperFeed.copyControl.activeDetentSetting).toBe(4);
  expect(copyRear.geometry.paperFeed.copyControl.detentPresentationClass).toContain('exact lever angles/marker geometry unresolved');
  expect(copyRear.geometry.paperFeed.copyControl.eccentricCollars).toBe(2);
  expect(copyRear.geometry.paperFeed.copyControl.eccentricCollarsRotateWithShaft).toBe(true);
  expect(copyRear.geometry.paperFeed.copyControl.shaftRotorAngleDegP5).toBeCloseTo(48, 8);
  await page.evaluate(() => window.__selectricDebug.setCopyControl(0));
  const copyNormal = await page.evaluate(() => window.__selectricDebug.state);
  expect(copyNormal.copyControlOffsetZ).toBe(0);

  const ratchetBeforeVariable = (await page.evaluate(() => window.__selectricDebug.state)).platenIndex;
  expect(await page.locator('#platenForwardBtn').isDisabled()).toBe(true);
  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  const variableFree = await page.evaluate(() => window.__selectricDebug.state);
  expect(variableFree.platenVariableEngaged).toBe(true);
  expect(variableFree.geometry.paperFeed.platenRatchetCoupled).toBe(false);
  expect(variableFree.geometry.paperFeed.platenPhaseCueCount).toBe(2);
  expect(variableFree.geometry.paperFeed.platenPhaseCueClass).toContain('P5 visible rotational cue');
  expect(variableFree.geometry.paperFeed.platenPhaseCueAngleRad).toBeCloseTo(variableFree.geometry.paperFeed.platenPhysicalAngleRad, 8);
  expect(await page.locator('#platenForwardBtn').isEnabled()).toBe(true);
  const paperBeforeManual = variableFree.paperAdvanceMm;
  await page.locator('#platenForwardBtn').click();
  const afterManualPlaten = await page.evaluate(() => window.__selectricDebug.state);
  const manualStep = Math.PI * 2 / 27;
  expect(afterManualPlaten.platenIndex).toBe(ratchetBeforeVariable);
  expect(afterManualPlaten.geometry.paperFeed.manualPlatenAngle).toBeCloseTo(manualStep, 8);
  expect(afterManualPlaten.geometry.paperFeed.platenPhysicalAngleRad).toBeCloseTo(ratchetBeforeVariable + manualStep, 8);
  expect(afterManualPlaten.geometry.paperFeed.platenPhaseCueAngleRad).toBeCloseTo(ratchetBeforeVariable + manualStep, 8);
  expect(afterManualPlaten.paperAdvanceMm - paperBeforeManual).toBeCloseTo(18.1864 * manualStep, 8);
  expect(afterManualPlaten.geometry.paperFeed.paperAdvanceMm).toBeCloseTo(afterManualPlaten.paperAdvanceMm, 8);
  expect(afterManualPlaten.geometry.paperFeed.feedRollPhaseRad).toBeCloseTo(afterManualPlaten.paperAdvanceMm / 6.2, 8);
  expect(afterManualPlaten.geometry.paperFeed.feedRollRotationClass).toContain('P4 accumulated contact rotation');
  expect(afterManualPlaten.events.some(event => event.name === 'MANUAL_PLATEN_STEP')).toBe(true);

  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  const variableRecoupled = await page.evaluate(() => window.__selectricDebug.state);
  expect(variableRecoupled.platenVariableEngaged).toBe(false);
  expect(variableRecoupled.geometry.paperFeed.variableOffsetPersistsWhenRecoupled).toBe(true);
  expect(variableRecoupled.geometry.paperFeed.manualPlatenAngle).toBeCloseTo(manualStep, 8);
  expect(variableRecoupled.geometry.paperFeed.platenPhysicalAngleRad).toBeCloseTo(ratchetBeforeVariable + manualStep, 8);
  expect(variableRecoupled.geometry.paperFeed.platenPhaseCueAngleRad).toBeCloseTo(variableRecoupled.geometry.paperFeed.platenPhysicalAngleRad, 8);
  expect(await page.locator('#platenForwardBtn').isDisabled()).toBe(true);

  // Restore zero variable offset without disturbing the ratchet phase.
  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  await page.locator('#platenBackBtn').click();
  await page.evaluate(() => window.__selectricDebug.togglePlatenVariable());
  const variableRestored = await page.evaluate(() => window.__selectricDebug.state);
  expect(variableRestored.geometry.paperFeed.manualPlatenAngle).toBeCloseTo(0, 8);

  const loadSelected = await page.evaluate(() => window.__selectricDebug.setRibbonLoadState(true));
  expect(loadSelected).toBe(true);
  const loadPose = await page.evaluate(() => window.__selectricDebug.state);
  expect(loadPose.ribbonLoadState).toBe(true);
  expect(loadPose.ribbonLift).toBeCloseTo(loadPose.geometry.ribbon.loadLiftNormalizedP5, 8);
  expect(loadPose.ribbonLift).toBeGreaterThan(1);
  expect(loadPose.geometry.ribbon.liftGuideCount).toBe(2);
  expect(loadPose.geometry.ribbon.liftGuidesFollowRibbon).toBe(true);
  expect(loadPose.geometry.ribbon.liftGuideCenterY - loadPose.geometry.ribbon.ribbonCenterY).toBeCloseTo(-3, 8);
  expect(loadPose.geometry.ribbon.guideBridgeCenterY - loadPose.geometry.ribbon.ribbonCenterY).toBeCloseTo(-12, 8);
  expect(loadPose.geometry.ribbon.liftGuideMotionClass).toContain('following the live ribbon lift');
  await page.evaluate(() => window.__selectricDebug.setRibbonLoadState(false));
  const loadReleased = await page.evaluate(() => window.__selectricDebug.state);
  expect(loadReleased.ribbonLoadState).toBe(false);
  expect(loadReleased.ribbonLift).toBe(0);
  expect(loadReleased.geometry.ribbon.ribbonCenterY).toBeCloseTo(103, 8);
  expect(loadReleased.geometry.ribbon.liftGuideCenterY).toBeCloseTo(100, 8);

  const feedStepsBeforeStencil = loadReleased.ribbonFeedStep;
  const stencilSelected = await page.evaluate(() => window.__selectricDebug.setRibbonMode('stencil'));
  expect(stencilSelected).toBe(true);
  const stencilReady = await page.evaluate(() => window.__selectricDebug.state);
  expect(stencilReady.ribbonPrintMode).toBe('stencil');
  expect(stencilReady.geometry.ribbon.stencilRibbonAtPrintPoint).toBe(false);
  expect(stencilReady.geometry.ribbon.stencilFeedSuppressed).toBe(true);
  expect(stencilReady.geometry.ribbon.stencilPawlCentered).toBe(true);
  expect(stencilReady.geometry.ribbon.stencilDetentCentered).toBe(true);
  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });
  const stencilTyped = await page.evaluate(() => window.__selectricDebug.state);
  expect(stencilTyped.ribbonFeedStep).toBe(feedStepsBeforeStencil);
  expect(stencilTyped.ribbonFeedSuppressedCount).toBe(1);
  expect(stencilTyped.ribbonLift).toBe(0);
  expect(stencilTyped.geometry.paperFeed.paperPath.inkSuppressedInStencil).toBe(true);
  expect(stencilTyped.geometry.paperFeed.paperPath.stampLayout.lastStamp).toBe(null);
  expect(stencilTyped.events.some(event => event.name === 'RIBBON_STENCIL_FEED_SUPPRESSED')).toBe(true);
  expect(stencilTyped.events.some(event => event.name === 'PRINT_IMPACT' && event.inked === false)).toBe(true);
  expect(stencilTyped.events.some(event => event.name === 'STENCIL_IMPACT_NO_INK')).toBe(true);
  await page.evaluate(() => window.__selectricDebug.setRibbonMode('middle'));
  await page.evaluate(() => window.__selectricDebug.reset());

  const storedSpaceStart = await page.evaluate(() => window.__selectricDebug.state.carrierX);
  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.50));
  await page.evaluate(() => window.__selectricDebug.space());
  const storedSpace = await page.evaluate(() => window.__selectricDebug.state);
  expect(storedSpace.storedSpace).toBe(true);
  expect(storedSpace.operation).toBe(null);
  expect(storedSpace.events.some(event => event.name === 'SPACE_STORED_BY_FILTER_SHAFT_INTERLOCK')).toBe(true);
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(
    () => window.__selectricDebug.state.cycle === 'C0_REST' && window.__selectricDebug.state.operation === null,
    null,
    { timeout: 6000 }
  );
  const storedSpaceReleased = await page.evaluate(() => window.__selectricDebug.state);
  expect(storedSpaceReleased.storedSpace).toBe(false);
  expect(storedSpaceReleased.carrierX - storedSpaceStart).toBeCloseTo(storedSpaceReleased.geometry.pitchMm * 2, 5);
  expect(storedSpaceReleased.events.some(event => event.name === 'SPACE_INTERLOCK_RELEASED')).toBe(true);
  expect(storedSpaceReleased.events.some(event => event.name === 'SPACE_OPERATION_COMPLETE')).toBe(true);
  await page.evaluate(() => window.__selectricDebug.reset());

  const coverCarrier = initial.carrierX;
  await page.evaluate(() => window.__selectricDebug.setServiceCover(1));
  const coverOpen = await page.evaluate(() => window.__selectricDebug.state);
  expect(coverOpen.serviceCoverOpen).toBe(1);
  expect(coverOpen.carrierX).toBeCloseTo(coverCarrier, 6);
  await page.screenshot({ path: 'test-results/selectric-cover-open.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.setServiceCover(0));

  const initialCarrier = initial.carrierX;

  // Fine-alignment screenshots should actually expose the selection hardware instead of
  // documenting a closed product shell.
  await page.locator('[data-view="selection"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.50));
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C4_FINE_ALIGN', null, { timeout: 1500 });
  const fineAligned = await page.evaluate(() => window.__selectricDebug.state);
  expect(fineAligned.fineAlignment.tiltDetent).toBeGreaterThan(0.9);
  expect(fineAligned.fineAlignment.rotateDetent).toBeGreaterThan(0.7);
  expect(fineAligned.fineAlignment.tiltDetent).toBeGreaterThanOrEqual(fineAligned.fineAlignment.rotateDetent);
  await page.screenshot({ path: 'test-results/selectric-fine-align.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);
  const afterFineAlignCycle = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterFineAlignCycle.fineAlignment.tiltDetent).toBe(0);
  expect(afterFineAlignCycle.fineAlignment.rotateDetent).toBe(0);

  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.06));
  const keyDown = await page.evaluate(() => window.__selectricDebug.state);
  expect(keyDown.cycle).toBe('C1_TRIP');
  expect(keyDown.keyboardPress.character).toBe('Q');
  expect(keyDown.keyboardPress.depression).toBeGreaterThan(0.7);
  expect(keyDown.keyboardCodeBitOrder).toEqual(['T1','T2','R1','R2','R2A','fiveUnit']);
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });

  const afterKeyCycle = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterKeyCycle.keyboardPress.depression).toBe(0);

  // Likewise, actual impact QA uses the existing ribbon/print inspection camera with the
  // service cover open so the print-point geometry is visible in the artifact.
  await page.locator('[data-view="ribbon"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.659));
  await page.waitForFunction(
    () => window.__selectricDebug.state.cycle === 'C5_PRINT_IMPACT' &&
      window.__selectricDebug.state.events.some(event => event.name === 'PRINT_IMPACT'),
    null,
    { timeout: 1500 }
  );
  const impactHeld = await page.evaluate(() => window.__selectricDebug.state);
  expect(impactHeld.geometry.printRocker.currentAngleDeg).toBeLessThan(-17);
  expect(impactHeld.geometry.printRocker.selectedSlugPlatenClearanceAlongZMmP4).toBeLessThan(
    initial.geometry.printRocker.selectedSlugPlatenClearanceAlongZMmP4
  );
  expect(impactHeld.geometry.printRocker.selectedSlugPlatenClearanceAlongZMmP4).toBeGreaterThan(-2.5);
  await page.screenshot({ path: 'test-results/selectric-impact.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);

  const typed = await page.evaluate(() => window.__selectricDebug.state);
  expect(typed.carrierX - initialCarrier).toBeCloseTo(typed.geometry.pitchMm * 3, 5);
  expect(typed.ribbonLift).toBe(0);
  expect(typed.ribbonFeedStep).toBe(3);
  expect(typed.geometry.ribbon.approximateRatchetTeethAdvanced).toBeCloseTo(7.5, 8);
  expect(typed.geometry.ribbon.spoolFillP5[0]).toBeCloseTo(0.68, 8);
  expect(typed.geometry.ribbon.spoolFillP5[1]).toBeCloseTo(0.32, 8);
  expect(typed.geometry.ribbon.spoolRadiusScaleP5[0]).toBeGreaterThan(typed.geometry.ribbon.spoolRadiusScaleP5[1]);
  expect(typed.fineAlignment.tiltDetent).toBe(0);
  expect(typed.fineAlignment.rotateDetent).toBe(0);
  expect(typed.events.some(event => event.name === 'RIBBON_FEED_COMPLETE_EXCEPT_PAWL_RESTORE')).toBe(true);
  expect(typed.selection.shiftHemisphere).toBe(0);

  const lowerTilt = typed.selection.tiltBand;
  const lowerRotate = typed.selection.rotateUnit;
  const lowerTypeElementTiltDeg = typed.geometry.typeElement.orientationDegP4.tilt;
  const lowerTypeElementRotateDeg = typed.geometry.typeElement.orientationDegP4.rotate;
  await page.evaluate(() => window.__selectricDebug.typeCharacter('Q'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.serviceOperation === null && window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 7000 }
  );
  const uppercaseTyped = await page.evaluate(() => window.__selectricDebug.state);
  expect(uppercaseTyped.selection.shiftHemisphere).toBe(1);
  expect(uppercaseTyped.selection.tiltBand).toBe(lowerTilt);
  expect(uppercaseTyped.selection.rotateUnit).toBe(lowerRotate);
  expect(uppercaseTyped.geometry.typeElement.orientationDegP4.tilt).toBeCloseTo(lowerTypeElementTiltDeg, 8);
  expect(Math.abs(uppercaseTyped.geometry.typeElement.orientationDegP4.rotate - lowerTypeElementRotateDeg)).toBeCloseTo(180, 8);
  expect(uppercaseTyped.geometry.typeElement.selectedStructuralSlotP4).toBe(
    (typed.geometry.typeElement.selectedStructuralSlotP4 + 11) % 22
  );
  expect(uppercaseTyped.geometry.typeElement.selectedSlugAlignmentErrorDegP4).toBeLessThan(1e-7);
  expect(uppercaseTyped.geometry.typeElement.selectedSlugFacingVectorP4.z).toBeCloseTo(-1, 8);
  expect(uppercaseTyped.events.some(event => event.name === 'SHIFT_OPERATION_COMPLETE')).toBe(true);

  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.serviceOperation === null && window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 7000 }
  );
  const lowercaseRestored = await page.evaluate(() => window.__selectricDebug.state);
  expect(lowercaseRestored.selection.shiftHemisphere).toBe(0);
  expect(lowercaseRestored.selection.tiltBand).toBe(lowerTilt);
  expect(lowercaseRestored.selection.rotateUnit).toBe(lowerRotate);

  const ribbonDirectionBeforeReverse = lowercaseRestored.ribbonFeedDirection;
  const primedReverse = await page.evaluate(() => window.__selectricDebug.primeRibbonAutoReverse());
  expect(primedReverse).toBe(true);
  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 5000 }
  );
  const ribbonReversed = await page.evaluate(() => window.__selectricDebug.state);
  expect(ribbonReversed.ribbonFeedDirection).toBe(-ribbonDirectionBeforeReverse);
  expect(ribbonReversed.ribbonReverseCount).toBe(1);
  expect(ribbonReversed.ribbonReverseState).toBe('feeding');
  expect(ribbonReversed.ribbonReversePhase).toBe(0);
  expect(ribbonReversed.geometry.ribbon.feedStrokeInDirection).toBe(0);
  expect(ribbonReversed.geometry.ribbon.spoolFillP5[0]).toBeCloseTo(0.14, 8);
  expect(ribbonReversed.geometry.ribbon.spoolFillP5[1]).toBeCloseTo(0.86, 8);
  expect(ribbonReversed.geometry.ribbon.spoolRadiusScaleP5[0]).toBeLessThan(ribbonReversed.geometry.ribbon.spoolRadiusScaleP5[1]);
  expect(ribbonReversed.events.some(event => event.name === 'RIBBON_AUTO_REVERSE')).toBe(true);

  expect(typed.printApproach).toBe(0);
  expect(typed.cyclePhase).toBe(0);
  expect(typed.selection.tiltBand).toBeGreaterThanOrEqual(0);
  expect(typed.selection.tiltBand).toBeLessThanOrEqual(3);
  expect(typed.selection.rotateUnit).toBeGreaterThanOrEqual(-5);
  expect(typed.selection.rotateUnit).toBeLessThanOrEqual(5);
  expect(Object.keys(typed.selection.selectorInputs).sort()).toEqual(['R1','R2','R2A','T1','T2','fiveUnit'].sort());
  expect(typed.geometry.selectionNormalized.qTilt).toBeCloseTo(typed.selection.tiltBand / 3, 8);
  expect(typed.geometry.selectionNormalized.qSigned).toBeCloseTo(typed.selection.rotateUnit / 5, 8);
  expect(typed.geometry.selectionDifferential.tapeCarrierInvariantErrorMm.tiltMm).toBeLessThan(1e-8);
  expect(typed.geometry.selectionDifferential.tapeCarrierInvariantErrorMm.rotateMm).toBeLessThan(1e-8);
  expect(typed.geometry.selectionDifferential.tapePresentation.crossSection).toContain('flat strip');
  expect(typed.geometry.selectionDifferential.tapePresentation.widthMmP4).toBeCloseTo(3.2, 8);
  expect(typed.geometry.selectionDifferential.tapePresentation.thicknessMmP4).toBeCloseTo(0.55, 8);
  expect(typed.geometry.selectionDifferential.tapePresentation.stationaryGuidePulleys).toBe(4);
  expect(typed.geometry.selectionDifferential.tapePresentation.carrierGuidePulleys).toBe(4);
  expect(typed.geometry.selectionDifferential.tapePresentation.tangentLaneOffsetsApplied).toBe(true);
  expect(typed.geometry.selectionDifferential.tapePresentation.geometryClass).toContain('non-intersecting guide lanes');
  expect(typed.selection.selectorInputs.T1 + 2 * typed.selection.selectorInputs.T2).toBe(typed.selection.tiltBand);
  if (typed.selection.rotateUnit < 0) expect(typed.selection.selectorInputs.fiveUnit).toBe(1);
  expect(typed.selection.mappingClass).toContain('P5');
  expect(typed.geometry.writingPositionIndicator.carrierParented).toBe(true);
  expect(typed.geometry.writingPositionIndicator.worldX).toBeCloseTo(typed.carrierX, 8);

  const names = typed.events.map(event => event.name);
  const impact = names.indexOf('PRINT_IMPACT');
  const escapement = names.indexOf('ESCAPEMENT_ADVANCE');
  expect(impact).toBeGreaterThanOrEqual(0);
  expect(escapement).toBeGreaterThan(impact);

  await page.screenshot({ path: 'test-results/selectric-assembled.png', fullPage: true });
  await page.locator('[data-view="carrier"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-carrier-view.png', fullPage: true });
  await page.locator('[data-view="selection"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-selection-view.png', fullPage: true });
  await page.locator('[data-view="ribbon"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-ribbon-view.png', fullPage: true });
  await page.locator('[data-view="paper"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-paper-view.png', fullPage: true });
  await page.locator('[data-view="rack"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-rack-view.png', fullPage: true });
  await page.locator('[data-view="power"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  await page.screenshot({ path: 'test-results/selectric-power-view.png', fullPage: true });
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);

  const beforeExplosion = await page.evaluate(() => ({
    carrierX: window.__selectricDebug.state.carrierX,
    line: window.__selectricDebug.state.line
  }));
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.55));
  const exploded = await page.evaluate(() => window.__selectricDebug.state);
  expect(exploded.explosion).toBeCloseTo(0.55, 6);
  expect(exploded.geometry.explosionClass).toContain('assembly-separation');
  expect(exploded.carrierX).toBeCloseTo(beforeExplosion.carrierX, 6);
  expect(exploded.line).toBe(beforeExplosion.line);
  await page.screenshot({ path: 'test-results/selectric-exploded.png', fullPage: true });

  await page.evaluate(() => window.__selectricDebug.setExplosion(0));
  const assembled = await page.evaluate(() => window.__selectricDebug.state);
  expect(assembled.explosion).toBe(0);

  const beforeSpace = assembled.carrierX;
  await page.evaluate(() => window.__selectricDebug.space());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const spaced = await page.evaluate(() => window.__selectricDebug.state);
  expect(spaced.carrierX - beforeSpace).toBeCloseTo(spaced.geometry.pitchMm, 5);
  expect(spaced.events.some(event => event.name === 'SPACE_OPERATION_COMPLETE')).toBe(true);
  expect(spaced.geometry.powerPresentation.selectedServiceCam).toBe('rest');

  await page.evaluate(() => window.__selectricDebug.backspace());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const backed = await page.evaluate(() => window.__selectricDebug.state);
  expect(backed.carrierX).toBeCloseTo(beforeSpace, 5);
  expect(backed.events.some(event => event.name === 'BACKSPACE_OPERATION_COMPLETE')).toBe(true);

  const beforeShift = backed.selection.shiftHemisphere;
  await page.evaluate(() => window.__selectricDebug.shift());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const shifted = await page.evaluate(() => window.__selectricDebug.state);
  expect(shifted.selection.shiftHemisphere).toBe(1 - beforeShift);
  expect(shifted.selection.shiftAngleDeg).toBeCloseTo(shifted.selection.shiftHemisphere * 180, 6);
  expect(shifted.events.some(event => event.name === 'SHIFT_OPERATION_COMPLETE')).toBe(true);

  const paperBeforeSingleIndex = (await page.evaluate(() => window.__selectricDebug.state)).paperAdvanceMm;
  await page.evaluate(() => window.__selectricDebug.index());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const indexed = await page.evaluate(() => window.__selectricDebug.state);
  expect(indexed.line).toBe(1);
  expect(indexed.geometry.platenRatchet.selectorEmbodied).toBe(true);
  expect(indexed.geometry.platenRatchet.selectorAngleDegP5).toBe(-13);
  expect(indexed.geometry.platenRatchet.selectorTravelClass).toContain('exact external coordinates unresolved');
  expect(indexed.paperAdvanceMm - paperBeforeSingleIndex).toBeCloseTo(indexed.geometry.platenRatchet.paperAdvancePerRatchetToothMm, 8);
  expect(indexed.platenIndex).toBeCloseTo(Math.PI * 2 / 27, 6);
  expect(indexed.events.some(event => event.name === 'INDEX_OPERATION_COMPLETE')).toBe(true);
  expect(indexed.events.some(event => event.name === 'INDEX_RATCHET_ADVANCE' && event.teeth === 1)).toBe(true);

  const doubleMode = await page.evaluate(() => window.__selectricDebug.setLineSpacing(2));
  expect(doubleMode).toBe(true);
  const beforeDoubleIndex = await page.evaluate(() => window.__selectricDebug.state);
  await page.evaluate(() => window.__selectricDebug.index());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const doubleIndexed = await page.evaluate(() => window.__selectricDebug.state);
  expect(doubleIndexed.lineSpacingTeeth).toBe(2);
  expect(doubleIndexed.line - beforeDoubleIndex.line).toBe(2);
  expect(doubleIndexed.platenIndex - beforeDoubleIndex.platenIndex).toBeCloseTo(Math.PI * 4 / 27, 6);
  expect(doubleIndexed.paperAdvanceMm - beforeDoubleIndex.paperAdvanceMm).toBeCloseTo(
    2 * doubleIndexed.geometry.platenRatchet.paperAdvancePerRatchetToothMm,
    8
  );
  expect(doubleIndexed.geometry.platenRatchet.activeIndexTeeth).toBe(2);
  expect(doubleIndexed.geometry.platenRatchet.selectorAngleDegP5).toBe(13);
  expect(doubleIndexed.events.some(event => event.name === 'INDEX_RATCHET_ADVANCE' && event.teeth === 2)).toBe(true);
  await page.evaluate(() => window.__selectricDebug.setLineSpacing(1));

  const beforeTab = doubleIndexed.carrierX;
  await page.evaluate(() => window.__selectricDebug.tab());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const tabbed = await page.evaluate(() => window.__selectricDebug.state);
  expect(tabbed.carrierX).toBeGreaterThan(beforeTab);
  expect(tabbed.events.some(event => event.name === 'TAB_RELEASE')).toBe(true);
  expect(tabbed.events.some(event => event.name === 'TAB_CAPTURE')).toBe(true);
  expect(tabbed.geometry.returnTabDrive.tabGovernorPhase).toBe(0);

  const lineBeforeReturn = tabbed.line;
  const platenBeforeReturn = tabbed.platenIndex;
  await page.evaluate(() => window.__selectricDebug.carriageReturn());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const returned = await page.evaluate(() => window.__selectricDebug.state);
  expect(returned.carrierX).toBeCloseTo(-returned.geometry.writingLineMm / 2, 5);
  expect(returned.line).toBe(lineBeforeReturn + 1);
  expect(returned.platenIndex - platenBeforeReturn).toBeCloseTo(Math.PI * 2 / 27, 6);
  expect(returned.geometry.writingLineRacks).toContain('1164743 margin');
  expect(returned.events.some(event => event.name === 'CARRIER_RETURN_CLUTCH_ENGAGED')).toBe(true);
  expect(returned.events.some(event => event.name === 'CARRIER_RETURN_TERMINATED_AT_LEFT_MARGIN')).toBe(true);
  expect(returned.geometry.returnTabDrive.carrierReturnDrivePhase).toBe(0);

  // Move the right stop to one pitch beyond the live left stop. One character may print and
  // advance to the stop; the next character is line-locked. Carrier return still targets the
  // current left stop rather than the physical end of travel.
  await page.evaluate(() => window.__selectricDebug.setMarginInsets(0, 101));
  const narrowMargins = await page.evaluate(() => window.__selectricDebug.state);
  expect(narrowMargins.margins.leftInsetColumns).toBe(0);
  expect(narrowMargins.margins.rightInsetColumns).toBe(101);
  expect(narrowMargins.margins.rightX - narrowMargins.margins.leftX).toBeCloseTo(narrowMargins.geometry.pitchMm, 5);
  expect(narrowMargins.geometry.marginStops.rightX).toBeCloseTo(narrowMargins.margins.rightX, 8);

  await page.evaluate(() => window.__selectricDebug.typeCharacter('m'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.serviceOperation === null && window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 7000 }
  );
  const atRightMargin = await page.evaluate(() => window.__selectricDebug.state);
  expect(atRightMargin.carrierX).toBeCloseTo(atRightMargin.margins.rightX, 5);
  expect(atRightMargin.events.some(event => event.name === 'RIGHT_MARGIN_REACHED')).toBe(true);

  await page.evaluate(() => window.__selectricDebug.typeCharacter('n'));
  await page.waitForTimeout(120);
  const lineLocked = await page.evaluate(() => window.__selectricDebug.state);
  expect(lineLocked.cycle).toBe('C0_REST');
  expect(lineLocked.carrierX).toBeCloseTo(atRightMargin.carrierX, 8);
  expect(lineLocked.events.some(event => event.name === 'RIGHT_MARGIN_LINE_LOCK')).toBe(true);

  await page.evaluate(() => window.__selectricDebug.carriageReturn());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const returnedToLiveMargin = await page.evaluate(() => window.__selectricDebug.state);
  expect(returnedToLiveMargin.carrierX).toBeCloseTo(returnedToLiveMargin.margins.leftX, 5);
  await page.evaluate(() => window.__selectricDebug.setMarginInsets(0, 0));

  // Tab stops are runtime-programmable. From the live left margin, a custom stop at column 4
  // must capture before a later stop, and clearing it must immediately change the active set.
  await page.evaluate(() => window.__selectricDebug.setTabStops([4, 10]));
  const customStops = await page.evaluate(() => window.__selectricDebug.state);
  expect(customStops.tabStops).toEqual([4, 10]);
  expect(customStops.geometry.returnTabDrive.tabStopIndices).toEqual([4, 10]);

  await page.evaluate(() => window.__selectricDebug.tab());
  await page.waitForFunction(() => window.__selectricDebug.state.operation === null, null, { timeout: 5000 });
  const customTabbed = await page.evaluate(() => window.__selectricDebug.state);
  const expectedCustomStopX = -customTabbed.geometry.writingLineMm / 2 + 4 * customTabbed.geometry.pitchMm;
  expect(customTabbed.carrierX).toBeCloseTo(expectedCustomStopX, 5);
  expect(customTabbed.events.some(event => event.name === 'TAB_CAPTURE')).toBe(true);

  // Margin-stop controls use the current carrier column instead of a fixed demo inset.
  await page.locator('#marginLeftBtn').click();
  const leftMarginAtCarrier = await page.evaluate(() => window.__selectricDebug.state);
  expect(leftMarginAtCarrier.margins.leftInsetColumns).toBe(4);
  expect(leftMarginAtCarrier.margins.leftX).toBeCloseTo(customTabbed.carrierX, 5);
  expect(leftMarginAtCarrier.events.some(event => event.name === 'LEFT_MARGIN_SET')).toBe(true);

  await page.locator('#marginResetBtn').click();
  const marginsReset = await page.evaluate(() => window.__selectricDebug.state);
  expect(marginsReset.margins.leftInsetColumns).toBe(0);
  expect(marginsReset.margins.rightInsetColumns).toBe(0);

  await page.locator('#marginRightBtn').click();
  const rightMarginAtCarrier = await page.evaluate(() => window.__selectricDebug.state);
  expect(rightMarginAtCarrier.margins.rightInsetColumns).toBe(98);
  expect(rightMarginAtCarrier.margins.rightX).toBeCloseTo(customTabbed.carrierX, 5);
  expect(rightMarginAtCarrier.events.some(event => event.name === 'RIGHT_MARGIN_SET')).toBe(true);
  await page.locator('#marginResetBtn').click();

  await page.evaluate(() => window.__selectricDebug.setTabStopAt(4, false));
  const clearedStop = await page.evaluate(() => window.__selectricDebug.state);
  expect(clearedStop.tabStops).toEqual([10]);
  await page.evaluate(() => window.__selectricDebug.setTabStops([8,16,24,32,40,48,56,64,72,80,88,96]));

  // The printed record now follows the live physical sheet advance rather than an arbitrary
  // logical-line pixel increment. One normal index must shift the next paper-local stamp by
  // exactly that advance times the explicitly P5 canvas scale.
  await page.evaluate(() => window.__selectricDebug.reset());
  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.serviceOperation === null && window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 7000 }
  );
  const firstPhysicalStamp = await page.evaluate(() => window.__selectricDebug.state);
  const firstStamp = firstPhysicalStamp.geometry.paperFeed.paperPath.stampLayout.lastStamp;
  expect(firstStamp.paperAdvanceMm).toBeCloseTo(0, 8);

  await page.evaluate(() => window.__selectricDebug.index());
  await page.waitForFunction(() => window.__selectricDebug.state.serviceOperation === null, null, { timeout: 5000 });
  const afterStampIndex = await page.evaluate(() => window.__selectricDebug.state);
  await page.evaluate(() => window.__selectricDebug.typeCharacter('q'));
  await page.waitForFunction(
    () => window.__selectricDebug.state.serviceOperation === null && window.__selectricDebug.state.cycle === 'C0_REST',
    null,
    { timeout: 7000 }
  );
  const secondPhysicalStamp = await page.evaluate(() => window.__selectricDebug.state);
  const stampLayout = secondPhysicalStamp.geometry.paperFeed.paperPath.stampLayout;
  const secondStamp = stampLayout.lastStamp;
  expect(secondStamp.paperAdvanceMm).toBeCloseTo(afterStampIndex.paperAdvanceMm, 8);
  expect(secondStamp.yPx - firstStamp.yPx).toBeCloseTo(
    afterStampIndex.paperAdvanceMm * stampLayout.pixelsPerMmP5,
    8
  );

  expect(errors).toEqual([]);
});
