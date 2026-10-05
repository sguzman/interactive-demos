import { test, expect } from '@playwright/test';

// The causal smoke captures a growing set of full-page mechanism artifacts. GitHub's software-rendered
// Chromium can now run slightly beyond five minutes without any individual wait hanging, so keep
// a bounded six-minute file budget while preserving the much shorter per-operation wait gates.
test.setTimeout(360_000);

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
  expect(initial.rendering.shadowMapType).toBe('PCFSoftShadowMap');
  expect(initial.rendering.keyShadowNormalBias).toBeCloseTo(0.65, 8);
  expect(initial.rendering.keyShadowCameraNear).toBeCloseTo(20, 8);
  expect(initial.rendering.keyShadowCameraFar).toBeCloseTo(1000, 8);
  expect(initial.rendering.shadowAcneMitigationClass).toContain('mechanical geometry unchanged');
  expect(initial.geometry.supportTopology).toContain('Level-2');
  expect(initial.geometry.primarySideframeCount).toBe(2);
  expect(initial.geometry.primarySideframeWindowCountEach).toBe(1);
  expect(initial.geometry.primarySideframesWindowed).toBe(true);
  expect(initial.geometry.primarySideframeClass).toContain('large-window chamfered P4 primary sideframe perimeter');
  expect(initial.geometry.lowerShaftBearingBossCountP4).toBe(4);
  expect(initial.geometry.lowerShaftSupportWebCountP4).toBe(4);
  expect(initial.geometry.lowerShaftBearingBossClass).toContain('support webs');
  expect(initial.geometry.carrierEmbodiment).toContain('windowed chamfered side plates');
  expect(initial.geometry.carrierSidePlateCount).toBe(2);
  expect(initial.geometry.carrierSidePlateWindowed).toBe(true);
  expect(initial.geometry.carrierSidePlateClass).toContain('windowed chamfered P4 carrier side frame');
  expect(initial.geometry.shellTopology).toContain('clearance-nested hinged hood');
  expect(initial.geometry.serviceCoverFitP4.hoodMaxHalfWidthP4).toBeLessThan(
    initial.geometry.serviceCoverFitP4.cheekInnerXP4 - initial.geometry.serviceCoverFitP4.cheekBevelInsetP4
  );
  expect(initial.geometry.serviceCoverFitP4.sideClearanceMmP4).toBeGreaterThanOrEqual(2.7 - 1e-8);
  expect(initial.geometry.serviceCoverFitP4.overlapRepairClass).toContain('no longer occupies the fixed cheek bevel volume');
  expect(initial.geometry.writingPositionIndicator.carrierParented).toBe(true);
  expect(initial.geometry.writingPositionIndicator.worldX).toBeCloseTo(initial.carrierX, 8);
  expect(initial.geometry.explosionClass).toContain('assembly-separation');
  expect(initial.geometry.d6CurrentSet.shaft).toBe('1164736');
  expect(initial.geometry.d6CurrentSet.bearings).toBe('1164740');
  expect(initial.geometry.d6CurrentSet.gear).toBe('1164739');
  expect(initial.geometry.d6CurrentSet.gearPresentationTeethP4).toBe(24);
  expect(initial.geometry.d6CurrentSet.gearGeometryClass).toContain('presentation-only tooth count');
  expect(initial.geometry.d6CurrentSet.gearHubEmbodied).toBe(true);
  expect(initial.geometry.d6CurrentSet.clipMarketFrozen).toBe(false);
  expect(initial.geometry.platenRatchet.outerDiameterMm).toBeCloseTo(30.1498, 6);
  expect(initial.geometry.platenRatchet.teeth).toBe(27);
  expect(initial.geometry.platenRatchet.toothGeometryAsymmetric).toBe(true);
  expect(initial.geometry.platenRatchet.toothGeometryClass).toContain('asymmetric tapered P4 ratchet tooth');
  expect(initial.geometry.platenRatchet.lineSpacingModes).toEqual(['single', 'double']);
  expect(initial.geometry.platenRatchet.singleIndexTeeth).toBe(1);
  expect(initial.geometry.platenRatchet.doubleIndexTeeth).toBe(2);
  expect(initial.geometry.platenRatchet.activeIndexTeeth).toBe(1);
  expect(initial.geometry.platenRatchet.indexPawlConstructionClass).toContain('tapered chamfered P4 stamped-link plate');
  expect(initial.geometry.platenRatchet.indexPawlWorkingPlaneP4).toContain('Y/Z with X-axis pivot hole');
  expect(initial.geometry.platenRatchet.indexPawlPivotEmbodied).toBe(true);
  expect(initial.geometry.platenRatchet.indexPawlTipEmbodied).toBe(true);
  expect(initial.geometry.platenRatchet.indexPawlRestAngleDegP4).toBeCloseTo(-28, 8);
  expect(initial.geometry.platenRatchet.indexPawlRestTipRadiusFromRatchetCenterMmP4).toBeGreaterThan(14);
  expect(initial.geometry.platenRatchet.indexPawlRestTipRadiusFromRatchetCenterMmP4).toBeLessThan(16);
  expect(initial.geometry.platenRatchet.indexPawlStrokeClass).toContain('rest tip placed at reconstructed ratchet circumference');
  expect(initial.geometry.platenRatchet.paperAdvancePerRatchetToothMm).toBeCloseTo(2 * Math.PI * 18.1864 / 27, 8);
  expect(initial.geometry.platenRatchet.paperAdvanceDerivation).toContain('P2 arc length');
  expect(initial.paperAdvanceMm).toBe(0);
  expect(initial.lineSpacingTeeth).toBe(1);
  expect(initial.geometry.paperFeed.frontRollers).toBe(4);
  expect(initial.geometry.paperFeed.rearRollers).toBe(4);
  expect(initial.geometry.paperFeed.bailRollers).toBe(2);
  expect(initial.geometry.paperFeed.bailStableStates).toEqual(['against-platen', 'released']);
  expect(initial.geometry.paperFeed.bailToggle).toContain('two-stable-state');
  expect(initial.geometry.paperFeed.bailEndLeverCountP4).toBe(2);
  expect(initial.geometry.paperFeed.bailEndLeverConstructionClassP4).toContain('stamped-link');
  expect(initial.geometry.paperFeed.bailEndLeverWorkingPlaneP4).toContain('Y/Z');
  expect(initial.geometry.paperFeed.frontRearReleaseCoupled).toBe(true);
  expect(initial.geometry.paperFeed.lineSpacingSelectorConstructionClass).toContain('stamped-link');
  expect(initial.geometry.paperFeed.lineSpacingSelectorLinkConstructionClass).toContain('two-eye');
  expect(initial.geometry.paperFeed.lineSpacingSelectorPivotPinEmbodied).toBe(true);
  expect(initial.geometry.paperFeed.paperReleaseLeverConstructionClass).toContain('stamped-link');
  expect(initial.geometry.paperFeed.paperReleasePivotPinEmbodied).toBe(true);
  expect(initial.geometry.paperFeed.releaseLatchedStateRepresented).toBe(true);
  expect(initial.geometry.paperFeed.copyControl.positions).toBe(5);
  expect(initial.geometry.paperFeed.copyControl.normalForwardSetting).toBe(0);
  expect(initial.geometry.paperFeed.copyControl.movesPlatenAndEntirePaperFeedCarriage).toBe(true);
  expect(initial.geometry.paperFeed.copyControl.movesCarrierTypehead).toBe(false);
  expect(initial.geometry.paperFeed.copyControl.leverConstructionClass).toContain('stamped-link');
  expect(initial.geometry.paperFeed.copyControl.leverPivotPinEmbodied).toBe(true);
  expect(initial.geometry.ribbon.parent).toBe('carrier');
  expect(initial.geometry.ribbon.mediaWidthMm).toBeCloseTo(14.2875, 6);
  expect(initial.geometry.ribbon.nominalRatchetTeethPerCharacter).toBeCloseTo(2.5, 8);
  expect(initial.geometry.ribbon.ratchetWheelCount).toBe(2);
  expect(initial.geometry.ribbon.ratchetPresentationTeethP4).toBe(20);
  expect(initial.geometry.ribbon.ratchetGeometryClass).toContain('toothed ratchet wheel');
  expect(initial.geometry.ribbon.ratchetGeometryClass).toContain('exact ribbon-ratchet tooth count/profile unresolved');
  expect(initial.geometry.ribbon.path).toEqual(['left-spool','left-guide','print-point','right-guide','right-spool']);
  expect(initial.geometry.ribbon.reverseTopology).toContain('lost supply-core loop');
  expect(initial.geometry.ribbon.reverseTopology).toContain('pawl/check transfer');
  expect(initial.geometry.ribbon.reverseIsAnimatedSequence).toBe(true);
  expect(initial.geometry.ribbon.reverseThresholdClass).toContain('P5 compressed');
  expect(initial.geometry.ribbon.reverseState).toBe('feeding');
  expect(initial.geometry.ribbon.reverseCount).toBe(0);
  expect(initial.geometry.ribbon.spoolFillP5[0]).toBeCloseTo(0.86, 8);
  expect(initial.geometry.ribbon.spoolFillP5[1]).toBeCloseTo(0.14, 8);
  expect(initial.geometry.ribbon.spoolConstructionClass).toContain('fixed hub/flanges');
  expect(initial.geometry.ribbon.spoolFlangesFixedWhileRibbonPackChanges).toBe(true);
  expect(initial.geometry.ribbon.spoolRibbonPackBaseRadiusMmP4).toBeGreaterThan(10);
  expect(initial.geometry.ribbon.spoolFillClass).toContain('wound-pack radius presentation');
  expect(initial.ribbonPrintMode).toBe('middle');
  expect(initial.geometry.ribbon.printModes).toEqual(['stencil', 'low', 'middle', 'high']);
  expect(initial.geometry.ribbon.liftHeightClass).toContain('exact OEM lift heights unresolved');
  expect(initial.geometry.ribbon.stencilRibbonAtPrintPoint).toBe(true);
  expect(initial.ribbonLoadState).toBe(false);
  expect(initial.geometry.ribbon.loadStateDistinctFromHighPrintLift).toBe(true);
  expect(initial.geometry.ribbon.loadLiftClass).toContain('service override distinct from print-sleeve cam lift');
  expect(initial.geometry.ribbon.loadLiftClass).toContain('exact OEM load height unresolved');
  expect(initial.geometry.ribbon.liftDriver).toContain('print-sleeve ribbon-lift cam');
  expect(initial.geometry.ribbon.liftCamLobeP4).toBe(true);
  expect(initial.geometry.ribbon.liftFollowerEmbodied).toBe(true);
  expect(initial.geometry.ribbon.liftBellcrankEmbodied).toBe(true);
  expect(initial.geometry.ribbon.liftBellcrankConstructionClass).toContain('two-arm Y/Z-plane bellcrank');
  expect(initial.geometry.ribbon.liftBellcrankArmCountP4).toBe(2);
  expect(initial.geometry.ribbon.liftBellcrankPivotPinEmbodied).toBe(true);
  expect(initial.geometry.ribbon.liftFollowerP5).toBeCloseTo(0, 8);
  expect(initial.geometry.ribbon.liftCausalChain).toEqual([
    'print-sleeve-rotation',
    'ribbon-lift-cam',
    'roller-follower',
    'bellcrank',
    'vibrator-guides',
    'ribbon'
  ]);
  expect(initial.geometry.ribbon.liftDriveClass).toContain('print-sleeve phase');
  expect(initial.geometry.ribbon.feedDriver).toContain('IBM 1164240');
  expect(initial.geometry.ribbon.feedFollowerEmbodied).toBe(true);
  expect(initial.geometry.ribbon.feedBellcrankEmbodied).toBe(true);
  expect(initial.geometry.ribbon.feedBellcrankConstructionClass).toContain('two-arm Y/Z-plane bellcrank');
  expect(initial.geometry.ribbon.feedBellcrankArmCountP4).toBe(2);
  expect(initial.geometry.ribbon.feedBellcrankPivotPinEmbodied).toBe(true);
  expect(initial.geometry.ribbon.feedFollowerP5).toBeCloseTo(0, 8);
  expect(initial.geometry.ribbon.feedStrokeP5).toBeCloseTo(0, 8);
  expect(initial.geometry.ribbon.feedCausalChain).toEqual([
    'print-sleeve-rotation',
    '1164240-feed-lobe',
    'roller-follower',
    'bellcrank',
    'feed-plate/pawl',
    'ratchet'
  ]);
  expect(initial.geometry.ribbon.feedStrokeClass).toContain('transport commit occurs at reconstructed peak stroke');
  expect(initial.geometry.keyboardMechanism.rearFulcrumRodEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.frontGuideCombEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.frontGuideFingerCountP4).toBe(51);
  expect(initial.geometry.keyboardMechanism.keyleverStopRodCountP4).toBe(2);
  expect(initial.geometry.keyboardMechanism.keyleverBearingSupportEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.separateKeyleverPawlCountP4).toBe(51);
  expect(initial.geometry.keyboardMechanism.keyleverPawlShoulderRivetCountP4).toBe(51);
  expect(initial.geometry.keyboardMechanism.interposerFrontFulcrumRodEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.interposerGuideRailCountP4).toBe(2);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverTracerEmbodiedP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverVisibleP5).toBe(false);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverAngleDegP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverPawlTracerEmbodiedP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverPawlContactFractionP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedKeyleverPawlDrivesInterposerDepressionP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerCodeTracerEmbodiedP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerVisibleP5).toBe(false);
  expect(initial.geometry.keyboardMechanism.selectedInterposerCompoundJointEmbodiedP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerPivotAngleDegP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedInterposerDownTravelMmP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedInterposerForwardTravelMmP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedInterposerFilterTransportFractionP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.selectedInterposerForwardTransportDerivedFromFilterShaftPhaseP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerLatchedDownP5).toBe(false);
  expect(initial.geometry.keyboardMechanism.selectedInterposerSyntheticLugCountP5).toBe(6);
  expect(initial.geometry.keyboardMechanism.selectedInterposerSpecialApplicationLugCueSeparateP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerCycleReleaseLugCueSeparateP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerActiveLugChannelsP5).toEqual([]);
  expect(initial.geometry.keyboardMechanism.selectorBailMotionDerivedFromVisibleSelectedInterposerLugsP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectedInterposerMappingClass).toContain('not a factory');
  expect(initial.geometry.keyboardMechanism.selectorCompensatorEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectorCompensatorBallCountP4).toBeGreaterThan(10);
  expect(initial.geometry.keyboardMechanism.selectorCompensatorClass).toContain('mutual-exclusion');
  expect(initial.geometry.keyboardMechanism.selectorBailCount).toBe(6);
  expect(initial.geometry.keyboardMechanism.selectorBailMotionClass).toContain('revolve about their X axes');
  expect(initial.geometry.keyboardMechanism.selectorBailWorkingPlane).toContain('Y/Z');
  expect(initial.geometry.keyboardMechanism.selectorBailAnglesDegP5).toEqual([0, 0, 0, 0, 0, 0]);
  expect(initial.keyboardCodeEngaged).toBe(false);
  expect(initial.geometry.keyboardMechanism.codeEngaged).toBe(false);
  expect(initial.geometry.keyboardMechanism.ordinaryBailInversionEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.publicCodeSemantic).toContain('downstream selector-request vector');
  expect(initial.geometry.keyboardMechanism.sixthChannelMappingClass).toContain('unresolved');
  expect(initial.geometry.keyboardMechanism.latchInterposerCount).toBe(6);
  expect(initial.geometry.keyboardMechanism.latchInterposerClass).toContain('one-to-one');
  expect(initial.geometry.keyboardMechanism.selectorBailToLatchInterposerTransferEmbodiedP4).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectorBailToLatchInterposerTransferCountP4).toBe(6);
  expect(initial.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4).toHaveLength(6);
  expect(initial.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4
    .every(length => Number.isFinite(length) && length > 0)).toBe(true);
  expect(initial.geometry.keyboardMechanism.latchInterposerTravelDerivedFromBailPoseP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectorLatchForwardTravelDerivedFromInterposerPoseP5).toBe(true);
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchTransferEmbodiedP4).toBe(true);
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchTransferChannelCountP4).toBe(5);
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchDynamicRodSegmentCountP4).toBe(15);
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchChannelOrderP4).toEqual([
    'T1', 'T2', 'R1', 'R2', 'R2A'
  ]);
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchVisibleBridge).toContain('closed');
  expect(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchVisibleBridge).toContain('unresolved');
  expect(Object.values(initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
    .every(pose =>
      pose.segmentAMmP4 > 0 &&
      pose.bridgeMmP4 > 0 &&
      pose.segmentBMmP4 > 0
    )).toBe(true);
  expect(initial.geometry.keyboardMechanism.filterShaftBladeCount).toBe(2);
  expect(initial.geometry.keyboardMechanism.filterShaftBearingCount).toBe(2);
  expect(initial.geometry.keyboardMechanism.filterShaftRotationDegPerCharacter).toBe(180);
  expect(initial.geometry.keyboardMechanism.latchBailOpenFrameEmbodied).toBe(true);
  expect(initial.geometry.keyboardMechanism.latchBailContactFingerCountP4).toBe(6);
  expect(initial.geometry.keyboardMechanism.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(initial.geometry.keyboardMechanism.setupBeforeSampleOrdering).toBe(true);
  expect(initial.geometry.keyboardMechanism.selectorLatchCount).toBe(5);
  expect(initial.geometry.keyboardMechanism.selectorLatchForeAftOffsetMmP5).toEqual([0, 0, 0, 0, 0]);
  expect(initial.geometry.keyboardMechanism.selectorLatchDownOffsetMmP5).toEqual([0, 0, 0, 0, 0]);
  expect(initial.geometry.keyboardMechanism.selectorLatchConstructionClass).toContain('stamped-link plate');
  expect(initial.geometry.keyboardMechanism.selectorLatchMotionClass).toContain('latch forward/excluded');
  expect(initial.geometry.keyboardMechanism.geometryClass).toContain('source-topology embodiment');

  expect(initial.geometry.carrierPrintDrive.printShaftPart).toBe('1164736');
  expect(initial.geometry.carrierPrintDrive.printSleevePart).toBe('1141628');
  expect(initial.geometry.carrierPrintDrive.printShaftWidthClass).toBe('7X1');
  expect(initial.geometry.carrierPrintDrive.printSleeveSeparateSlidingMember).toBe(true);
  expect(initial.geometry.carrierPrintDrive.printShaftKeywayLandEmbodiedP4).toBe(true);
  expect(initial.geometry.carrierPrintDrive.printSleeveKeyEmbodiedP4).toBe(true);
  expect(initial.geometry.carrierPrintDrive.printSleeveKeyConstructionClass).toContain('longitudinal key');
  expect(initial.geometry.carrierPrintDrive.keyedRotationPhaseErrorDegP4).toBeCloseTo(0, 10);
  expect(initial.geometry.carrierPrintDrive.geometryClass).toContain('rotationally keyed sliding print-sleeve');

  expect(initial.geometry.shaftTiming.cycleShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.filterShaftDegPerCharacter).toBe(180);
  expect(initial.geometry.shaftTiming.printShaftDegPerCharacter).toBe(360);
  expect(initial.geometry.shaftTiming.cycleCamStationCount).toBe(3);
  expect(initial.geometry.shaftTiming.cycleCamProfilesP4).toHaveLength(3);
  expect(initial.geometry.shaftTiming.cycleCamProfilesP4.every(cam => cam.baseRadiusMmP4 > 0)).toBe(true);
  expect(initial.geometry.shaftTiming.cycleCamProfilesP4.every(cam => cam.lobeCountP4 === 2)).toBe(true);
  expect(initial.geometry.shaftTiming.cycleCamProfilesP4.map(cam => cam.role)).toEqual([
    'ordinary-selector-latch-bail-cam-A',
    'ordinary-selector-latch-bail-cam-B',
    'five-unit-selector-cam'
  ]);
  expect(initial.geometry.shaftTiming.cycleCamPresentationClass).toContain('source-identified double-lobed selector');
  expect(initial.geometry.selectorCamDrive.positioningCamCount).toBe(3);
  expect(initial.geometry.selectorCamDrive.ordinaryLatchBailCamCount).toBe(2);
  expect(initial.geometry.selectorCamDrive.fiveUnitCamCount).toBe(1);
  expect(initial.geometry.selectorCamDrive.allPositioningCamsDoubleLobed).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitRelativePhaseDegSourceBacked).toBe(90);
  expect(initial.geometry.selectorCamDrive.ordinaryFollowerCountP4).toBe(2);
  expect(initial.geometry.selectorCamDrive.ordinaryFollowerWorkingPlaneP4).toContain('Y/Z');
  expect(initial.geometry.selectorCamDrive.ordinaryFollowerArmConstructionClassP4).toContain('stamped-link');
  expect(initial.geometry.selectorCamDrive.transferRodCountP4).toBe(2);
  expect(initial.geometry.selectorCamDrive.latchBailDrivenFromVisibleCamFollowers).toBe(true);
  expect(initial.geometry.selectorCamDrive.earlyDwellPreserved).toBe(true);
  expect(initial.geometry.selectorCamDrive.setupBeforeSampleCalibrationP5.browserCodeReadyPhaseP5).toBeCloseTo(0.28, 8);
  expect(initial.geometry.selectorCamDrive.setupBeforeSampleCalibrationP5.commonRawLostMotionThresholdP5).toBeCloseTo(0.18, 8);
  expect(initial.geometry.selectorCamDrive.setupBeforeSampleCalibrationP5.class).toContain('code-setup-before-latch-bail-sampling');
  expect(initial.geometry.selectorCamDrive.fiveUnitFollowerEmbodiedP4).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitLatchEmbodiedP4).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitLatchOppositeOrdinarySense).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitCamRestoresBail).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitLatchedHomeDistinctFromGeometricCamLow).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitLatchedHomeRiseP5).toBeGreaterThan(0);
  expect(initial.geometry.selectorCamDrive.fiveUnitCamBailTransferRodEmbodiedP4).toBe(true);
  expect(initial.geometry.selectorCamDrive.fiveUnitFollowerDownstreamBailCoupling).toContain('closed');
  expect(initial.geometry.selectorCamDrive.fiveUnitLiveBailToSignedBalanceCoupling).toContain('closed');
  expect(initial.geometry.selectionMechanicalNormalized).toEqual({
    qTilt: 0,
    q1: 0,
    q2: 0,
    qSigned: 0,
    ordinaryLatchSampleP5: 0,
    fiveUnitEffectiveNegativeP5: 0
  });
  expect(initial.geometry.selectionDifferential.targetAndMechanicalSelectionSeparated).toBe(true);
  expect(initial.geometry.selectionDifferential.ordinaryLatchOutputsDriveLiveDifferential).toBe(true);
  expect(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialLinksEmbodiedP4).toBe(true);
  expect(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialChannelCountP4).toBe(5);
  expect(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialDynamicRodSegmentCountP4).toBe(15);
  expect(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialChannelOrderP4).toEqual([
    'T1', 'T2', 'R1', 'R2', 'R2A'
  ]);
  expect(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialGeometryClass).toContain('unresolved');
  expect(Object.values(initial.geometry.selectionDifferential.ordinaryLatchToDifferentialPoseP5)
    .every(pose =>
      pose.segmentAMmP4 > 0 &&
      pose.bridgeMmP4 > 0 &&
      pose.segmentBMmP4 > 0
    )).toBe(true);
  expect(initial.geometry.selectionDifferential.fiveUnitBailDrivesLiveBalanceEndpoint).toBe(true);
  expect(initial.geometry.selectionDifferential.checkedRestRestoresCharacterSelection).toBe(true);
  expect(initial.geometry.typeElement.mechanicalPoseDerivedFromLiveDifferential).toBe(true);
  expect(initial.geometry.typeElement.checkedRestSelectionHome).toBe(true);
  expect(initial.geometry.selectorCamDrive.poseP5.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(initial.geometry.selectorCamDrive.poseP5.ordinaryRawLiftP5).toEqual([0, 0]);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitRawLiftP5).toBeCloseTo(1, 8);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitCamAvailableRiseP5).toBeCloseTo(0, 8);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitLatchReleasedP5).toBe(false);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitBailRiseP5).toBeCloseTo(0, 8);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitEffectiveNegativeP5).toBeCloseTo(0, 8);
  expect(initial.geometry.selectorCamDrive.poseP5.fiveUnitCamBailTransferRodLengthMmP4).toBeGreaterThan(0);
  expect(initial.geometry.selectorCamDrive.poseP5.transferRodLengthsMmP4.every(length => length > 0)).toBe(true);
  expect(initial.geometry.fineAlignment.coarseSelectionSeparate).toBe(true);
  expect(initial.geometry.fineAlignment.tiltSeatsBeforeRotateInPresentation).toBe(true);
  expect(initial.geometry.fineAlignment.driver).toContain('IBM 1164240');
  expect(initial.geometry.fineAlignment.detentFollowerEmbodied).toBe(true);
  expect(initial.geometry.fineAlignment.detentCamLobesP4).toBe(2);
  expect(initial.geometry.fineAlignment.detentArmConstructionClass).toContain('tapered chamfered P4 stamped-link plate');
  expect(initial.geometry.fineAlignment.detentArmWorkingPlaneP4).toContain('Y/Z with X-axis pivot hole');
  expect(initial.geometry.fineAlignment.detentArmCountP4).toBe(2);
  expect(initial.geometry.fineAlignment.detentPivotPinsEmbodied).toBe(true);
  expect(initial.geometry.fineAlignment.causalChain).toEqual([
    'print-sleeve-rotation',
    '1164240-cam',
    'roller-follower',
    'tilt-takeup',
    'rotate-lost-motion',
    'detents'
  ]);
  expect(initial.geometry.fineAlignment.sharedFollowerWithRotateLostMotion).toBe(true);
  expect(initial.geometry.fineAlignment.rotateTakeupThresholdP5).toBeCloseTo(0.20, 8);
  expect(initial.geometry.fineAlignment.detentFollowerLiftP5).toBeCloseTo(0, 8);
  expect(initial.geometry.fineAlignment.exactPivotsAndTimingDegrees).toBe('unresolved');
  expect(initial.geometry.fineAlignment.animationPhaseClass).toContain('print-sleeve phase');
  expect(initial.geometry.printRocker.motion).toBe('revolute');
  expect(initial.geometry.printRocker.driver).toContain('IBM 1124174');
  expect(initial.geometry.printRocker.camLobesP4).toBe(2);
  expect(initial.geometry.printRocker.followerEmbodied).toBe(true);
  expect(initial.geometry.printRocker.followerLiftP5).toBeCloseTo(0, 8);
  expect(initial.geometry.printRocker.bellcrankEmbodied).toBe(true);
  expect(initial.geometry.printRocker.bellcrankConstructionClass).toContain('two-arm Y/Z-plane bellcrank');
  expect(initial.geometry.printRocker.bellcrankArmCountP4).toBe(2);
  expect(initial.geometry.printRocker.bellcrankPivotPinEmbodied).toBe(true);
  expect(initial.geometry.printRocker.rockerConstructionClass).toContain('forked P4 yoke');
  expect(initial.geometry.printRocker.rockerForkArmCountP4).toBe(2);
  expect(initial.geometry.printRocker.rockerPivotHubEmbodied).toBe(true);
  expect(initial.geometry.printRocker.rockerCradlePinEmbodied).toBe(true);
  expect(initial.geometry.printRocker.returnSpringEmbodiedP4).toBe(true);
  expect(initial.geometry.printRocker.returnSpringConstructionClassP4).toContain('rocker-return spring');
  expect(initial.geometry.printRocker.returnSpringTurnsP4).toBeCloseTo(2.25, 8);
  expect(initial.geometry.printRocker.returnSpringMovingLegAngleDegP5).toBeCloseTo(0, 8);
  expect(initial.geometry.printRocker.rockerArmSpanMmP4).toBeGreaterThan(10);
  expect(initial.geometry.printRocker.causalChain).toEqual([
    'print-sleeve-rotation',
    '1124174-print-restoring-cam',
    'roller-follower',
    'bellcrank',
    'print-rocker',
    'type-element'
  ]);
  expect(initial.geometry.printRocker.driveClass).toContain('cam-envelope timing');
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
  expect(initial.geometry.sleeveCamProfiles.presentationClass).toContain('smooth P4 radial envelopes');
  expect(initial.geometry.sleeveCamProfiles.ribbonLift.lobes).toHaveLength(1);
  expect(initial.geometry.sleeveCamProfiles.combinedFeedDetent1164240.lobes).toHaveLength(2);
  expect(initial.geometry.sleeveCamProfiles.printRestoring1124174.lobes).toHaveLength(2);
  expect(initial.geometry.sleeveCamProfiles.combinedFeedDetent1164240.baseRadius).toBeGreaterThan(0);
  expect(initial.geometry.sleeveCamProfiles.printRestoring1124174.baseRadius).toBeGreaterThan(
    initial.geometry.sleeveCamProfiles.combinedFeedDetent1164240.baseRadius
  );
  expect(initial.profile).toContain('12 CPI');
  expect(initial.explosion).toBe(0);
  expect(initial.serviceCoverOpen).toBe(0);
  expect(initial.geometry.inspectionCutaway.mode).toBe('none');
  expect(initial.geometry.inspectionCutaway.shellVisible).toBe(true);
  expect(initial.geometry.inspectionCutaway.baseShellVisible).toBe(true);
  expect(initial.geometry.inspectionCutaway.keyboardVisible).toBe(true);
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
  expect(initial.geometry.powerPresentation.motorConstructionClass).toContain('barrel + twin endbells');
  expect(initial.geometry.powerPresentation.motorEndbellCount).toBe(2);
  expect(initial.geometry.powerPresentation.motorVentBandCount).toBe(3);
  expect(initial.geometry.powerPresentation.motorMountingFootCount).toBe(2);
  expect(initial.geometry.powerPresentation.motorThroughShaftVisible).toBe(true);
  expect(initial.geometry.typeElement.characterCount).toBe(88);
  expect(initial.geometry.typeElement.bands).toBe(4);
  expect(initial.geometry.typeElement.positionsPerBand).toBe(22);
  expect(initial.geometry.typeElement.overallNominalDiameterMm).toBeCloseTo(34.925, 8);
  expect(initial.geometry.typeElement.topCapRadiusP4Mm).toBeCloseTo(13.4, 8);
  expect(initial.geometry.typeElement.topCapAndLatchPresentation).toBe(true);
  expect(initial.geometry.typeElement.slugFinishClass).toContain('chrome-like');
  expect(initial.geometry.typeElement.slugSectionClass).toContain('three-stage P4 pedestal/shoulder/face land');
  expect(initial.geometry.typeElement.slugSectionP4.depthMmP4).toBeCloseTo(1.35, 8);
  expect(initial.geometry.typeElement.slugSectionP4.bevelDepthMmP4).toBeCloseTo(0.30, 8);
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
  expect(initial.geometry.carrierSelectionTransmission.activeTiltStyle).toBe('gearless');
  expect(initial.geometry.carrierSelectionTransmission.tiltTapePart).toBe('1164314');
  expect(initial.geometry.carrierSelectionTransmission.rotateTapePart).toBe('1134811');
  expect(initial.geometry.carrierSelectionTransmission.tiltLinkPart).toBe('1134879');
  expect(initial.geometry.carrierSelectionTransmission.carrierTiltPulleyEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.carrierRotatePulleyEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.gearlessTiltLinkEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.tiltRingMovesWithSelectedBand).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.rotateShaftEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.lowerBallSocketEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.dogBoneJointEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.upperBallSocketEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.simultaneousTiltRotateVisible).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.oldSectorTubeEmbodied).toBe(false);
  expect(initial.geometry.carrierSelectionTransmission.tiltRingNotchCount).toBe(4);
  expect(initial.geometry.carrierSelectionTransmission.carrierTapeGuideOrAnchorCountP4).toBe(4);
  expect(initial.geometry.carrierSelectionTransmission.carrierTapeContactsUsePulleyRimTangencies).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.carrierTiltTapeAnchorEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.carrierRotateTapeAnchorEmbodied).toBe(true);
  expect(initial.geometry.carrierSelectionTransmission.parameterSeedP4.tiltPulleyCommandDegP5).toBe(34);
  expect(initial.geometry.carrierSelectionTransmission.parameterSeedP4.dogBoneTiltDeflectionScaleP5).toBeCloseTo(0.62, 8);
  expect(initial.geometry.carrierSelectionTransmission.parameterSeedP4.typeElementInterfaceRadiusFractionP4).toBeCloseTo(0.72, 8);
  expect(initial.geometry.carrierSelectionTransmission.tiltChain).toEqual([
    'IBM 1164314 7X1 tilt tape',
    'carrier gearless tilt pulley',
    'IBM 1134879 7X1 tilt-pulley link',
    'tilt ring',
    'type element'
  ]);
  expect(initial.geometry.carrierSelectionTransmission.rotateChain).toEqual([
    'IBM 1134811 7X1 rotate tape',
    'carrier rotate pulley',
    'rotate shaft',
    'lower ball socket',
    'dog-bone joint',
    'upper ball socket',
    'type element'
  ]);
  expect(initial.geometry.carrierSelectionTransmission.poseP4.tiltLinkLengthMmP4).toBeGreaterThan(0);
  expect(initial.geometry.carrierSelectionTransmission.poseP4.upperSocketLinkLengthMmP4).toBeGreaterThan(0);
  expect(initial.geometry.carrierSelectionTransmission.geometryClass).toContain('7X1 gearless carrier-side topology');
  expect(initial.geometry.operationalCams.spaceBackspaceDegreesPerOperation).toBe(180);
  expect(initial.geometry.operationalCams.carrierReturnIndexDegreesPerOperation).toBe(360);
  expect(initial.geometry.operationalCams.tabUsesPoweredCam).toBe(false);
  expect(initial.geometry.operationalCams.shiftInterlocksCharacterCycle).toBe(true);
  expect(initial.geometry.operationalCams.followersEmbodied).toBe(true);
  expect(initial.geometry.operationalCams.followerPivotAxisP4).toBe('X');
  expect(initial.geometry.operationalCams.followerWorkingPlaneP4).toBe('Y/Z');
  expect(initial.geometry.operationalCams.followerPlateGeometryWorkingPlaneP4).toContain('Y/Z with X-axis pivot hole');
  expect(initial.geometry.operationalCams.followerLeverConstructionClassP4).toContain('stamped-link');
  expect(initial.geometry.operationalCams.followerPivotPinsEmbodiedP4).toBe(true);
  expect(initial.geometry.operationalCams.followerRollersEmbodiedP4).toBe(true);
  expect(initial.geometry.operationalCams.profilePresentationClass).toContain('smooth P4 radial service-cam envelopes');
  expect(initial.geometry.operationalCams.profileLobeCounts).toEqual({
    spaceBackspace: 2,
    carrierReturnIndex: 1,
    shift: 1
  });
  expect(initial.geometry.operationalCams.profileBaseRadiiMmP4.spaceBackspace).toBeGreaterThan(0);
  expect(initial.geometry.operationalCams.profileBaseRadiiMmP4.carrierReturnIndex).toBeGreaterThan(
    initial.geometry.operationalCams.profileBaseRadiiMmP4.spaceBackspace
  );
  expect(initial.geometry.operationalCams.followerLiftDriverClass).toContain('fixed-roller contact sample');
  expect(initial.geometry.operationalCams.followerLiftP5).toEqual({
    spaceBackspace: 0,
    returnIndex: 0,
    shift: 0
  });
  expect(initial.geometry.operationalCams.selectedFollower).toBe('none');
  expect(initial.geometry.operationalCams.followerTravelClass).toContain('selected service-cam phase');
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
  expect(initial.geometry.cordSystem.effectiveDrumPayoutRatioP4).toBeGreaterThan(0.9);
  expect(initial.geometry.cordSystem.effectiveDrumPayoutRatioP4).toBeLessThan(1);
  expect(initial.geometry.cordSystem.tensionArmSweepRangeDegP4[0]).toBeLessThan(-7);
  expect(initial.geometry.cordSystem.tensionArmSweepRangeDegP4[1]).toBeGreaterThan(0);
  expect(Math.abs(initial.geometry.cordSystem.compensatedLengthErrorMmP4)).toBeLessThan(1e-6);
  expect(initial.geometry.cordSystem.pulleyContactRoutingP4).toBe(true);
  expect(initial.geometry.cordSystem.escapementWrapAnglesDegP4).toHaveLength(2);
  expect(initial.geometry.cordSystem.returnWrapAnglesDegP4).toHaveLength(2);
  expect(initial.geometry.cordSystem.escapementWrapAnglesDegP4.every(angle => angle > 0)).toBe(true);
  expect(initial.geometry.cordSystem.returnWrapAnglesDegP4.every(angle => angle > 0)).toBe(true);
  expect(initial.geometry.cordSystem.escapementTangentOrthogonalityErrorMmP4).toBeLessThan(1e-8);
  expect(initial.geometry.cordSystem.returnTangentOrthogonalityErrorMmP4).toBeLessThan(1e-8);
  expect(initial.geometry.cordSystem.cordPathClass).toContain('tangent-to-rim routing');
  expect(initial.geometry.cordSystem.tensionModelClass).toContain('tangent-routed');
  expect(initial.geometry.marginStops.leftTerminatesCarrierReturn).toBe(true);
  expect(initial.geometry.marginStops.rightLineLockInterface).toBe(true);
  expect(initial.geometry.marginStops.adjustableOnWritingLine).toBe(true);
  expect(initial.geometry.marginStops.leftInsetColumns).toBe(0);
  expect(initial.geometry.marginStops.rightInsetColumns).toBe(0);
  expect(initial.geometry.marginStops.positioningClass).toContain('12-CPI');
  expect(initial.geometry.backspace.mechanism).toBe('dedicated-powered-reverse-linkage');
  expect(initial.geometry.backspace.rackFamily).toEqual(['1124568', '6519139']);
  expect(initial.geometry.backspace.displacementMm).toBeCloseTo(-initial.geometry.pitchMm, 8);
  expect(initial.geometry.backspace.bellcrankEmbodied).toBe(true);
  expect(initial.geometry.backspace.bellcrankWorkingPlane).toContain('X/Y');
  expect(initial.geometry.backspace.bellcrankArmCountP4).toBe(2);
  expect(initial.geometry.backspace.bellcrankConstructionClass).toContain('two-eye');
  expect(initial.geometry.backspace.bellcrankPivotPinEmbodied).toBe(true);
  expect(initial.geometry.backspace.escapementPawlConstructionClass).toContain('stamped-link');
  expect(initial.geometry.backspace.escapementPawlPivotPinEmbodied).toBe(true);

  // Each clutched service follower is now solved from the smooth P4 cam radius at the
  // fixed roller line rather than from a parallel sinusoidal animation.
  await page.evaluate(() => window.__selectricDebug.setOperationalCam('space', 0.25));
  const spaceFollowerBeforeLobe = await page.evaluate(() => window.__selectricDebug.state);
  expect(spaceFollowerBeforeLobe.geometry.operationalCams.followerLiftP5.spaceBackspace).toBeCloseTo(0, 8);

  await page.evaluate(() => window.__selectricDebug.setOperationalCam('space', 0.5));
  const spaceFollower = await page.evaluate(() => window.__selectricDebug.state);
  expect(spaceFollower.geometry.operationalCams.selectedFollower).toBe('space/backspace');
  expect(spaceFollower.geometry.operationalCams.followerLiftP5.spaceBackspace).toBeCloseTo(1, 8);
  expect(spaceFollower.geometry.operationalCams.followerLiftP5.returnIndex).toBeCloseTo(0, 8);
  expect(spaceFollower.geometry.operationalCams.followerLiftP5.shift).toBeCloseTo(0, 8);
  expect(spaceFollower.geometry.backspace.linkagePhase).toBeCloseTo(0, 8);

  await page.evaluate(() => window.__selectricDebug.setOperationalCam('backspace', 0.5));
  const backspaceFollower = await page.evaluate(() => window.__selectricDebug.state);
  expect(backspaceFollower.geometry.operationalCams.selectedFollower).toBe('space/backspace');
  expect(backspaceFollower.geometry.operationalCams.followerLiftP5.spaceBackspace).toBeCloseTo(1, 8);
  expect(backspaceFollower.geometry.backspace.linkagePhase).toBeCloseTo(0.5, 8);

  await page.evaluate(() => window.__selectricDebug.setOperationalCam('carrier-return', 0.5));
  const returnFollower = await page.evaluate(() => window.__selectricDebug.state);
  expect(returnFollower.geometry.operationalCams.selectedFollower).toBe('carrier-return/index');
  expect(returnFollower.geometry.operationalCams.followerLiftP5.returnIndex).toBeCloseTo(1, 8);
  expect(returnFollower.geometry.operationalCams.followerLiftP5.spaceBackspace).toBeCloseTo(0, 8);

  await page.evaluate(() => window.__selectricDebug.setOperationalCam('shift', 0.5));
  const shiftFollower = await page.evaluate(() => window.__selectricDebug.state);
  expect(shiftFollower.geometry.operationalCams.selectedFollower).toBe('shift');
  expect(shiftFollower.geometry.operationalCams.followerLiftP5.shift).toBeCloseTo(1, 8);
  expect(shiftFollower.geometry.operationalCams.followerLiftP5.returnIndex).toBeCloseTo(0, 8);

  await page.evaluate(() => window.__selectricDebug.setOperationalCam(null, 0));
  const followersRestored = await page.evaluate(() => window.__selectricDebug.state);
  expect(followersRestored.geometry.operationalCams.selectedFollower).toBe('none');
  expect(followersRestored.geometry.operationalCams.followerLiftP5).toEqual({
    spaceBackspace: 0,
    returnIndex: 0,
    shift: 0
  });

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
  expect(variableFree.geometry.paperFeed.platenKnobConstructionClass).toContain('repeated radial grip ribs');
  expect(variableFree.geometry.paperFeed.platenKnobGripRibsPerKnobP4).toBe(12);
  expect(variableFree.geometry.paperFeed.platenKnobGripRibTotal).toBe(24);
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
  expect(loadPose.geometry.ribbon.liftFollowerP5).toBeCloseTo(0, 8);
  expect(loadPose.geometry.ribbon.liftGuideCount).toBe(2);
  expect(loadPose.geometry.ribbon.liftGuidesFollowRibbon).toBe(true);
  expect(loadPose.geometry.ribbon.liftGuideProngsPerGuide).toBe(2);
  expect(loadPose.geometry.ribbon.liftGuideConstructionClass).toContain('forked vibrator guide');
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
  expect(stencilTyped.geometry.ribbon.feedFollowerP5).toBeCloseTo(0, 8);
  expect(stencilTyped.geometry.ribbon.feedStrokeP5).toBeCloseTo(0, 8);
  expect(stencilTyped.ribbonLift).toBe(0);
  expect(stencilTyped.geometry.paperFeed.paperPath.inkSuppressedInStencil).toBe(true);
  expect(stencilTyped.geometry.paperFeed.paperPath.stampLayout.lastStamp).toBe(null);
  expect(stencilTyped.events.some(event => event.name === 'RIBBON_STENCIL_FEED_SUPPRESSED')).toBe(true);
  expect(stencilTyped.events.some(event => event.name === 'PRINT_IMPACT' && event.inked === false)).toBe(true);
  expect(stencilTyped.events.some(event => event.name === 'STENCIL_IMPACT_NO_INK')).toBe(true);
  await page.evaluate(() => window.__selectricDebug.setRibbonMode('middle'));
  await page.evaluate(() => window.__selectricDebug.reset());

  const storedSpaceStart = await page.evaluate(() => window.__selectricDebug.state.carrierX);
  const storedSpaceHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.50));
  expect(storedSpaceHold).toBe(true);
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
  const fineAlignHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.50));
  expect(fineAlignHold).toBe(true);
  const fineAligned = await page.evaluate(() => window.__selectricDebug.state);
  expect(fineAligned.cycle).toBe('C4_FINE_ALIGN');
  expect(fineAligned.fineAlignment.tiltDetent).toBeGreaterThan(0.9);
  expect(fineAligned.fineAlignment.rotateDetent).toBeGreaterThan(0.7);
  expect(fineAligned.fineAlignment.tiltDetent).toBeGreaterThanOrEqual(fineAligned.fineAlignment.rotateDetent);
  expect(fineAligned.geometry.fineAlignment.printSleevePhaseP5).toBeCloseTo(0.50, 8);
  expect(fineAligned.geometry.fineAlignment.detentFollowerLiftP5).toBeGreaterThan(0.6);
  expect(fineAligned.geometry.fineAlignment.detentFollowerLiftP5).toBeLessThan(0.7);
  expect(fineAligned.geometry.fineAlignment.driver).toContain('1164240');
  expect(fineAligned.geometry.ribbon.liftFollowerP5).toBeCloseTo(
    fineAligned.geometry.fineAlignment.detentFollowerLiftP5,
    8
  );
  expect(fineAligned.ribbonLift).toBeCloseTo(fineAligned.geometry.ribbon.liftFollowerP5 * 0.82, 8);
  expect(fineAligned.geometry.ribbon.feedFollowerP5).toBeGreaterThan(0.7);
  expect(fineAligned.geometry.ribbon.feedFollowerP5).toBeLessThan(0.8);
  expect(fineAligned.geometry.ribbon.feedStrokeP5).toBeCloseTo(fineAligned.geometry.ribbon.feedFollowerP5, 8);
  expect(fineAligned.geometry.printRocker.followerLiftP5).toBeCloseTo(
    ((0.50 - 0.43) / 0.11) * 0.55,
    8
  );
  expect(fineAligned.geometry.printRocker.followerLiftP5).toBeCloseTo(fineAligned.printApproach, 8);
  expect(fineAligned.geometry.fineAlignment.sharedFollowerWithRotateLostMotion).toBe(true);

  // The public code vector names downstream selector requests. OEM keyboard theory fixes the
  // visible inversion: active ordinary selector bails pull their T/R latches forward/out of the
  // common latch bail, while requested latch-down inputs remain rearward and are sampled down.
  expect(fineAligned.keyboardCodeEngaged).toBe(true);
  expect(fineAligned.geometry.keyboardMechanism.codeEngaged).toBe(true);
  expect(fineAligned.geometry.keyboardMechanism.latchBailSampleP5).toBeCloseTo(1, 8);
  expect(fineAligned.geometry.selectorCamDrive.poseP5.latchBailSampleP5).toBeCloseTo(
    fineAligned.geometry.keyboardMechanism.latchBailSampleP5,
    8
  );
  expect(fineAligned.geometry.selectorCamDrive.poseP5.ordinaryRawLiftP5.every(lift => lift > 0.95)).toBe(true);
  expect(fineAligned.geometry.selectorCamDrive.poseP5.ordinaryFollowerAngleDegP5.every(angle => angle < -12)).toBe(true);
  expect(fineAligned.geometry.selectorCamDrive.poseP5.transferRodLengthsMmP4.every(length => Number.isFinite(length) && length > 0)).toBe(true);
  expect(fineAligned.geometry.selectionMechanicalNormalized.ordinaryLatchSampleP5).toBeCloseTo(1, 8);
  expect(fineAligned.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(
    fineAligned.geometry.selectionNormalized.qTilt,
    8
  );
  expect(fineAligned.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(
    fineAligned.geometry.selectionNormalized.qSigned,
    8
  );
  expect(Object.values(fineAligned.geometry.selectionDifferential.ordinaryLatchToDifferentialPoseP5)
    .every(pose =>
      pose.segmentAMmP4 > 0 &&
      pose.bridgeMmP4 > 0 &&
      pose.segmentBMmP4 > 0
    )).toBe(true);
  expect(fineAligned.geometry.selectionDifferential.ordinaryLatchToDifferentialPoseP5).not.toEqual(
    initial.geometry.selectionDifferential.ordinaryLatchToDifferentialPoseP5
  );
  expect(fineAligned.geometry.typeElement.orientationDegP4.tilt).toBeCloseTo(
    fineAligned.geometry.typeElement.targetOrientationDegP4.tilt,
    8
  );
  expect(fineAligned.geometry.typeElement.orientationDegP4.rotate).toBeCloseTo(
    fineAligned.geometry.typeElement.targetOrientationDegP4.rotate,
    8
  );
  const expectedFineBailAngles = Array.from({ length: 6 }, (_, index) => {
    const bit = Boolean(fineAligned.keyboardCode & (1 << index));
    if (index < 5) return bit ? 0 : -12;
    return bit ? -12 : 0;
  });
  expectedFineBailAngles.forEach((angle, index) => {
    expect(fineAligned.geometry.keyboardMechanism.selectorBailAnglesDegP5[index]).toBeCloseTo(angle, 8);
  });
  const expectedLatchForeAft = expectedFineBailAngles.slice(0, 5).map(angle =>
    angle === -12 ? fineAligned.geometry.keyboardMechanism.selectorLatchForwardTravelMmP5 : 0
  );
  expect(fineAligned.geometry.keyboardMechanism.selectorLatchForeAftOffsetMmP5).toEqual(expectedLatchForeAft);
  expect(fineAligned.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4
    .every(length => Number.isFinite(length) && length > 0)).toBe(true);
  expect(fineAligned.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4).not.toEqual(
    initial.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4
  );
  expect(Object.values(fineAligned.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
    .every(pose =>
      pose.segmentAMmP4 > 0 &&
      pose.bridgeMmP4 > 0 &&
      pose.segmentBMmP4 > 0
    )).toBe(true);
  expect(fineAligned.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5).not.toEqual(
    initial.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5
  );
  const requestedLatchBits = ['T1','T2','R1','R2','R2A'].map(
    name => fineAligned.selection.selectorInputs[name]
  );
  const expectedLatchDown = requestedLatchBits.map(
    bit => bit * fineAligned.geometry.keyboardMechanism.selectorLatchDownTravelMmP5
  );
  expect(fineAligned.geometry.keyboardMechanism.selectorLatchDownOffsetMmP5).toEqual(expectedLatchDown);
  await page.screenshot({ path: 'test-results/selectric-fine-align.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);
  const afterFineAlignCycle = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterFineAlignCycle.fineAlignment.tiltDetent).toBe(0);
  expect(afterFineAlignCycle.fineAlignment.rotateDetent).toBe(0);
  expect(afterFineAlignCycle.geometry.fineAlignment.detentFollowerLiftP5).toBeCloseTo(0, 8);
  expect(afterFineAlignCycle.geometry.fineAlignment.printSleevePhaseP5).toBeCloseTo(0, 8);
  expect(afterFineAlignCycle.geometry.printRocker.followerLiftP5).toBeCloseTo(0, 8);
  expect(afterFineAlignCycle.printApproach).toBeCloseTo(0, 8);
  expect(afterFineAlignCycle.keyboardCodeEngaged).toBe(false);
  expect(afterFineAlignCycle.geometry.keyboardMechanism.codeEngaged).toBe(false);
  expect(afterFineAlignCycle.geometry.keyboardMechanism.selectorBailAnglesDegP5).toEqual([0, 0, 0, 0, 0, 0]);
  expect(afterFineAlignCycle.geometry.keyboardMechanism.selectorLatchForeAftOffsetMmP5).toEqual([0, 0, 0, 0, 0]);
  expect(afterFineAlignCycle.geometry.keyboardMechanism.selectorLatchDownOffsetMmP5).toEqual([0, 0, 0, 0, 0]);

  const keyDownHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.06));
  expect(keyDownHold).toBe(true);
  const keyDown = await page.evaluate(() => window.__selectricDebug.state);
  expect(keyDown.cycle).toBe('C1_TRIP');
  expect(keyDown.keyboardPress.character).toBe('Q');
  expect(keyDown.keyboardPress.depression).toBeGreaterThan(0.7);
  expect(keyDown.geometry.keyboardActuation.keycapClass).toContain('tapered three-stage P4 keycap');
  expect(keyDown.keyboardCodeBitOrder).toEqual(['T1','T2','R1','R2','R2A','fiveUnit']);
  expect(keyDown.keyboardCodeEngaged).toBe(false);
  expect(keyDown.geometry.keyboardMechanism.codeEngaged).toBe(false);
  expect(keyDown.geometry.keyboardMechanism.selectedKeyleverVisibleP5).toBe(true);
  expect(keyDown.geometry.keyboardMechanism.selectedKeyleverAngleDegP5).toBeGreaterThan(5);
  expect(keyDown.geometry.keyboardMechanism.selectedKeyleverPawlContactFractionP5).toBeGreaterThan(0.7);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerVisibleP5).toBe(true);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerPivotAngleDegP5).toBeLessThan(-5);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerDownTravelMmP5).toBeGreaterThan(4);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerForwardTravelMmP5).toBeCloseTo(0, 8);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerFilterTransportFractionP5).toBeCloseTo(0, 8);
  expect(keyDown.geometry.keyboardMechanism.selectedInterposerActiveLugChannelsP5).toEqual([]);
  expect(keyDown.geometry.keyboardMechanism.selectorBailAnglesDegP5).toEqual([0, 0, 0, 0, 0, 0]);
  expect(keyDown.geometry.keyboardMechanism.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(keyDown.geometry.selectorCamDrive.poseP5.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(keyDown.geometry.selectorCamDrive.poseP5.ordinaryRawLiftP5.every(lift => lift < 0.01)).toBe(true);
  await page.evaluate(() => window.__selectricDebug.releaseCharacterHold());
  await page.waitForFunction(() => window.__selectricDebug.state.cycle === 'C0_REST', null, { timeout: 5000 });

  const midSetupHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.16));
  expect(midSetupHold).toBe(true);
  const midSetup = await page.evaluate(() => window.__selectricDebug.state);
  expect(midSetup.keyboardCodeEngaged).toBe(true);
  expect(midSetup.geometry.keyboardMechanism.selectedInterposerFilterTransportFractionP5)
    .toBeGreaterThan(0);
  expect(midSetup.geometry.keyboardMechanism.selectedInterposerFilterTransportFractionP5)
    .toBeLessThan(0.42);
  expect(midSetup.geometry.keyboardMechanism.selectedInterposerLatchedDownP5).toBe(true);
  expect(midSetup.geometry.keyboardMechanism.selectedInterposerPivotAngleDegP5).toBeLessThan(-7);
  expect(midSetup.geometry.keyboardMechanism.selectedInterposerForwardTravelMmP5)
    .toBeGreaterThan(0);
  expect(midSetup.geometry.keyboardMechanism.selectorBailAnglesDegP5.some(angle => Math.abs(angle) > 0.5))
    .toBe(true);
  expect(midSetup.geometry.keyboardMechanism.selectorBailAnglesDegP5.every(angle => Math.abs(angle) < 12.01))
    .toBe(true);
  expect(await page.evaluate(() => window.__selectricDebug.cancelCharacterHold())).toBe(true);

  const codeReadyCarrier = await page.evaluate(() => window.__selectricDebug.state.carrierX);
  const codeReadyRibbonStep = await page.evaluate(() => window.__selectricDebug.state.ribbonFeedStep);
  const codeReadyHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.28));
  expect(codeReadyHold).toBe(true);
  const codeReady = await page.evaluate(() => window.__selectricDebug.state);
  expect(codeReady.keyboardCodeEngaged).toBe(true);
  expect(codeReady.geometry.keyboardMechanism.selectedKeyleverVisibleP5).toBe(false);
  expect(codeReady.geometry.keyboardMechanism.selectedKeyleverPawlContactFractionP5).toBeCloseTo(0, 8);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerVisibleP5).toBe(true);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerForwardTravelMmP5).toBeCloseTo(8, 8);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerFilterTransportFractionP5).toBeCloseTo(1, 8);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerLatchedDownP5).toBe(false);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerPivotAngleDegP5).toBeCloseTo(0, 8);
  expect(codeReady.geometry.keyboardMechanism.selectedInterposerActiveLugChannelsP5.length).toBeGreaterThan(0);
  expect(codeReady.geometry.selectorCamDrive.poseP5.ordinaryRawLiftP5.every(lift => lift > 0.15)).toBe(true);
  expect(codeReady.geometry.selectorCamDrive.poseP5.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(codeReady.geometry.keyboardMechanism.latchBailSampleP5).toBeCloseTo(0, 8);
  expect(codeReady.selection.rotateUnit).toBeLessThan(0);
  expect(codeReady.selection.selectorInputs.fiveUnit).toBe(1);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitRawLiftP5).toBeLessThan(0.05);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitCamAvailableRiseP5).toBeGreaterThan(0.95);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitLatchReleasedP5).toBe(true);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitLatchAngleDegP5).toBeLessThan(-10);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitBailRiseP5).toBeGreaterThan(0.95);
  expect(codeReady.geometry.selectorCamDrive.poseP5.fiveUnitEffectiveNegativeP5).toBeGreaterThan(0.95);
  // At code-ready the ordinary latch-bail sample is still deliberately zero, so the live balance
  // is at the N5 baseline (-5) before the positive compensation latches are sampled.
  expect(codeReady.geometry.selectionMechanicalNormalized.ordinaryLatchSampleP5).toBeCloseTo(0, 8);
  expect(codeReady.geometry.selectionMechanicalNormalized.q2).toBeCloseTo(0, 8);
  expect(codeReady.geometry.selectionMechanicalNormalized.fiveUnitEffectiveNegativeP5).toBeGreaterThan(0.95);
  expect(codeReady.geometry.selectionMechanicalNormalized.qSigned).toBeLessThan(-0.95);
  expect(codeReady.geometry.selectionNormalized.qSigned).toBeCloseTo(codeReady.selection.rotateUnit / 5, 8);
  expect(await page.evaluate(() => window.__selectricDebug.cancelCharacterHold())).toBe(true);

  const afterKeyCycle = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterKeyCycle.carrierX).toBeCloseTo(codeReadyCarrier, 8);
  expect(afterKeyCycle.ribbonFeedStep).toBe(codeReadyRibbonStep);
  expect(afterKeyCycle.keyboardPress.depression).toBe(0);
  expect(afterKeyCycle.geometry.selectorCamDrive.poseP5.fiveUnitLatchReleasedP5).toBe(false);
  expect(afterKeyCycle.geometry.selectorCamDrive.poseP5.fiveUnitCamAvailableRiseP5).toBeCloseTo(0, 8);
  expect(afterKeyCycle.geometry.selectorCamDrive.poseP5.fiveUnitBailRiseP5).toBeCloseTo(0, 8);
  expect(afterKeyCycle.geometry.selectorCamDrive.poseP5.fiveUnitEffectiveNegativeP5).toBeCloseTo(0, 8);
  expect(afterKeyCycle.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(0, 8);
  expect(afterKeyCycle.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(0, 8);
  expect(afterKeyCycle.geometry.typeElement.checkedRestSelectionHome).toBe(true);

  // Positive rotate keeps the N5 latch engaged. When the cam reaches its release interval the
  // bail may only rise to the distinct latched-home stop, not the full negative-five position.
  const positiveHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('b', 0.28));
  expect(positiveHold).toBe(true);
  const positiveReady = await page.evaluate(() => window.__selectricDebug.state);
  expect(positiveReady.selection.rotateUnit).toBeGreaterThanOrEqual(0);
  expect(positiveReady.selection.selectorInputs.fiveUnit).toBe(0);
  expect(positiveReady.geometry.selectorCamDrive.poseP5.fiveUnitLatchReleasedP5).toBe(false);
  expect(positiveReady.geometry.selectorCamDrive.poseP5.fiveUnitCamAvailableRiseP5).toBeGreaterThan(0.95);
  expect(positiveReady.geometry.selectorCamDrive.poseP5.fiveUnitBailRiseP5).toBeCloseTo(
    positiveReady.geometry.selectorCamDrive.fiveUnitLatchedHomeRiseP5,
    8
  );
  expect(positiveReady.geometry.selectorCamDrive.poseP5.fiveUnitEffectiveNegativeP5).toBeCloseTo(0, 8);
  expect(positiveReady.geometry.selectionMechanicalNormalized.ordinaryLatchSampleP5).toBeCloseTo(0, 8);
  expect(positiveReady.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(0, 8);
  expect(positiveReady.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(0, 8);
  expect(await page.evaluate(() => window.__selectricDebug.cancelCharacterHold())).toBe(true);
  const afterPositiveInspection = await page.evaluate(() => window.__selectricDebug.state);
  expect(afterPositiveInspection.carrierX).toBeCloseTo(codeReadyCarrier, 8);
  expect(afterPositiveInspection.ribbonFeedStep).toBe(codeReadyRibbonStep);

  // Likewise, actual impact QA uses the existing ribbon/print inspection camera with the
  // service cover open so the print-point geometry is visible in the artifact.
  await page.locator('[data-view="ribbon"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(1);
  const impactHold = await page.evaluate(() => window.__selectricDebug.holdCharacterAt('q', 0.659));
  expect(impactHold).toBe(true);
  const impactHeld = await page.evaluate(() => window.__selectricDebug.state);
  expect(impactHeld.cycle).toBe('C5_PRINT_IMPACT');
  expect(impactHeld.events.some(event => event.name === 'PRINT_IMPACT')).toBe(true);
  expect(impactHeld.geometry.ribbon.liftFollowerP5).toBeCloseTo(1, 8);
  expect(impactHeld.ribbonLift).toBeCloseTo(0.82, 8);
  expect(impactHeld.geometry.ribbon.feedFollowerP5).toBeCloseTo(0, 8);
  expect(impactHeld.geometry.ribbon.feedStrokeP5).toBeCloseTo(0, 8);
  expect(impactHeld.geometry.printRocker.followerLiftP5).toBeCloseTo(impactHeld.printApproach, 8);
  expect(impactHeld.geometry.printRocker.followerLiftP5).toBeGreaterThan(0.99);
  expect(impactHeld.geometry.printRocker.driver).toContain('1124174');
  expect(impactHeld.geometry.printRocker.currentAngleDeg).toBeLessThan(-17);
  expect(impactHeld.geometry.printRocker.returnSpringMovingLegAngleDegP5).toBeCloseTo(
    impactHeld.geometry.printRocker.currentAngleDeg,
    8
  );
  expect(impactHeld.geometry.carrierPrintDrive.keyedRotationPhaseErrorDegP4).toBeCloseTo(0, 10);
  expect(impactHeld.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(
    impactHeld.geometry.selectionNormalized.qTilt,
    8
  );
  expect(impactHeld.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(
    impactHeld.geometry.selectionNormalized.qSigned,
    8
  );
  expect(impactHeld.geometry.typeElement.orientationDegP4.tilt).toBeCloseTo(
    impactHeld.geometry.typeElement.targetOrientationDegP4.tilt,
    8
  );
  expect(impactHeld.geometry.typeElement.orientationDegP4.rotate).toBeCloseTo(
    impactHeld.geometry.typeElement.targetOrientationDegP4.rotate,
    8
  );
  expect(impactHeld.geometry.typeElement.selectedSlugAlignmentErrorDegP4).toBeLessThan(1e-7);
  expect(impactHeld.geometry.typeElement.selectedSlugFacingVectorP4.z).toBeCloseTo(-1, 8);
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
  expect(Math.abs(typed.geometry.cordSystem.compensatedLengthErrorMmP4)).toBeLessThan(1e-6);
  expect(typed.geometry.cordSystem.escapementTangentOrthogonalityErrorMmP4).toBeLessThan(1e-8);
  expect(typed.geometry.cordSystem.returnTangentOrthogonalityErrorMmP4).toBeLessThan(1e-8);
  expect(typed.geometry.cordSystem.tensionArmAngleDeg).not.toBeCloseTo(
    initial.geometry.cordSystem.tensionArmAngleDeg,
    5
  );
  expect(typed.ribbonLift).toBe(0);
  expect(typed.geometry.ribbon.feedFollowerP5).toBeCloseTo(0, 8);
  expect(typed.geometry.ribbon.feedStrokeP5).toBeCloseTo(0, 8);
  expect(typed.ribbonFeedStep).toBe(3);
  expect(typed.geometry.ribbon.approximateRatchetTeethAdvanced).toBeCloseTo(7.5, 8);
  expect(typed.geometry.ribbon.spoolFillP5[0]).toBeCloseTo(0.68, 8);
  expect(typed.geometry.ribbon.spoolFillP5[1]).toBeCloseTo(0.32, 8);
  expect(typed.geometry.ribbon.spoolRadiusScaleP5[0]).toBeGreaterThan(typed.geometry.ribbon.spoolRadiusScaleP5[1]);
  expect(typed.geometry.ribbon.spoolFlangesFixedWhileRibbonPackChanges).toBe(true);
  expect(typed.fineAlignment.tiltDetent).toBe(0);
  expect(typed.fineAlignment.rotateDetent).toBe(0);
  expect(typed.events.some(event => event.name === 'RIBBON_FEED_COMPLETE_EXCEPT_PAWL_RESTORE')).toBe(true);
  expect(typed.selection.shiftHemisphere).toBe(0);

  const lowerTilt = typed.selection.tiltBand;
  const lowerRotate = typed.selection.rotateUnit;
  const lowerTypeElementTiltDeg = typed.geometry.typeElement.orientationDegP4.tilt;
  const lowerTypeElementRotateDeg = typed.geometry.typeElement.orientationDegP4.rotate;
  expect(typed.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(0, 8);
  expect(typed.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(0, 8);
  expect(typed.geometry.typeElement.checkedRestSelectionHome).toBe(true);
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
  expect(uppercaseTyped.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(0, 8);
  expect(uppercaseTyped.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(0, 8);
  expect(uppercaseTyped.geometry.typeElement.checkedRestSelectionHome).toBe(true);
  expect(uppercaseTyped.geometry.typeElement.targetOrientationDegP4.tilt).toBeCloseTo(
    typed.geometry.typeElement.targetOrientationDegP4.tilt,
    8
  );
  expect(Math.abs(
    uppercaseTyped.geometry.typeElement.targetOrientationDegP4.rotate -
      typed.geometry.typeElement.targetOrientationDegP4.rotate
  )).toBeCloseTo(180, 8);
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
  expect(lowercaseRestored.geometry.selectionMechanicalNormalized.qTilt).toBeCloseTo(0, 8);
  expect(lowercaseRestored.geometry.selectionMechanicalNormalized.qSigned).toBeCloseTo(0, 8);
  expect(lowercaseRestored.geometry.typeElement.checkedRestSelectionHome).toBe(true);
  expect(lowercaseRestored.geometry.typeElement.orientationDegP4.tilt).toBeCloseTo(lowerTypeElementTiltDeg, 8);
  expect(lowercaseRestored.geometry.typeElement.orientationDegP4.rotate).toBeCloseTo(lowerTypeElementRotateDeg, 8);

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
  expect(ribbonReversed.geometry.ribbon.spoolFlangesFixedWhileRibbonPackChanges).toBe(true);
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
  expect(typed.geometry.selectionDifferential.weightedLeverEmbodimentP4).toBe(true);
  expect(typed.geometry.selectionDifferential.normalizedOutputsDerivedFromHoleFractions).toBe(true);
  expect(typed.geometry.selectionDifferential.floatingLeverMotionP5).toBe(true);
  expect(typed.geometry.selectionDifferential.tiltDoubleVerticalOutputLink).toBe(true);
  expect(typed.geometry.selectionDifferential.fiveUnitBailMotion).toContain('five-unit bail');
  expect(typed.geometry.selectionDifferential.fiveUnitBailToBalanceTransferRodEmbodiedP4).toBe(true);
  expect(typed.geometry.selectionDifferential.fiveUnitBailToBalanceTransferRodLengthMmP4).toBeGreaterThan(0);
  expect(typed.geometry.selectionDifferential.fiveUnitBailToBalanceTransferGeometryClass).toContain('unresolved');
  expect(typed.geometry.selectionDifferential.explicitJointPinCountsP4).toEqual({
    tilt: 3,
    rotateFirst: 3,
    rotateSecond: 3,
    balance: 3
  });
  expect(typed.geometry.selectionDifferential.sourceFixedHoleFractions.tiltOutput).toBeCloseTo(1 / 3, 8);
  expect(typed.geometry.selectionDifferential.sourceFixedHoleFractions.rotateFirstOutput).toBeCloseTo(2 / 3, 8);
  expect(typed.geometry.selectionDifferential.sourceFixedHoleFractions.rotateSecondOutput).toBeCloseTo(3 / 5, 8);
  expect(typed.geometry.selectionDifferential.sourceFixedHoleFractions.balanceOutput).toBeCloseTo(1 / 2, 8);
  expect(typed.geometry.selectionDifferential.geometryOutputErrorMaxP5).toBeLessThan(1e-9);
  expect(typed.geometry.selectionDifferential.geometryClass).toContain('floating levers');
  expect(typed.geometry.selectionDifferential.outputLinkageP4.tiltChain).toEqual([
    'tilt differential',
    'double vertical link',
    'tilt bellcrank',
    'horizontal link',
    'tilt multiplying arm',
    'left tilt side pulley'
  ]);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.rotateChain).toEqual([
    'signed balance lever',
    'rotate bellcrank',
    'rotate multiplying arm',
    'left rotate side pulley'
  ]);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.tiltBellcrankEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.tiltHorizontalLinkEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.tiltMultiplyingArmEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.rotateBellcrankEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.rotateMultiplyingArmEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.shiftRemainsSeparateRightRotatePulley).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.dynamicTransferRodCountP4).toBe(6);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.tiltBellcrankConstructionClass).toContain('stamped-link bellcrank');
  expect(typed.geometry.selectionDifferential.outputLinkageP4.rotateBellcrankConstructionClass).toContain('stamped-link bellcrank');
  expect(Object.values(
    typed.geometry.selectionDifferential.outputLinkageP4.poseP5.dynamicRodLengthsMmP4
  ).every(length => Number.isFinite(length) && length > 0)).toBe(true);
  expect(typed.geometry.selectionDifferential.outputLinkageP4.geometryClass).toContain('source-backed output-chain topology');
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.tapeEndpointsAnchoredToActuatorRims).toBe(true);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.leftTiltCommandPulleyEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.rightTiltPulleyFixedDuringSelection).toBe(true);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.leftRotateCommandPulleyEmbodied).toBe(true);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.shiftActsOnRightRotatePulley).toBe(true);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.leftTiltAngleDegP5).toBeCloseTo(
    -typed.geometry.selectionDifferential.sidePulleyEmbodiment.tiltCommandAngleScaleDegP5 *
      typed.geometry.selectionMechanicalNormalized.qTilt,
    8
  );
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.leftRotateAngleDegP5).toBeCloseTo(
    -typed.geometry.selectionDifferential.sidePulleyEmbodiment.rotateCommandAngleScaleDegP5 *
      typed.geometry.selectionMechanicalNormalized.qSigned,
    8
  );
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.rightTiltAngleDegP5).toBeCloseTo(0, 8);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.rightRotateShiftAngleDegP5).toBeCloseTo(0, 8);
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.sourceTopology).toContain('shift -> right rotate side pulley');
  expect(typed.geometry.selectionDifferential.sidePulleyEmbodiment.geometryClass).toContain('rim tape anchors');
  expect(typed.geometry.selectionDifferential.tapeCarrierInvariantErrorMm.tiltMm).toBeLessThan(1e-8);
  expect(typed.geometry.selectionDifferential.tapeCarrierInvariantErrorMm.rotateMm).toBeLessThan(1e-8);
  expect(typed.geometry.selectionDifferential.tapePresentation.crossSection).toContain('flat strip');
  expect(typed.geometry.selectionDifferential.tapePresentation.widthMmP4).toBeCloseTo(3.2, 8);
  expect(typed.geometry.selectionDifferential.tapePresentation.thicknessMmP4).toBeCloseTo(0.55, 8);
  expect(typed.geometry.selectionDifferential.tapePresentation.stationaryGuidePulleys).toBe(4);
  expect(typed.geometry.selectionDifferential.tapePresentation.carrierGuidePulleys).toBe(4);
  expect(typed.geometry.selectionDifferential.tapePresentation.tangentLaneOffsetsApplied).toBe(true);
  expect(typed.geometry.selectionDifferential.tapePresentation.geometryClass).toContain('non-intersecting guide lanes');
  expect(typed.geometry.carrierSelectionTransmission.poseP4.tiltRingAngleDegP4).toBeCloseTo(
    typed.geometry.typeElement.orientationDegP4.tilt,
    8
  );
  expect(typed.geometry.carrierSelectionTransmission.poseP4.rotatePulleyAngleDegP4).toBeCloseTo(
    -5 * typed.geometry.selectionMechanicalNormalized.qSigned *
      (360 / typed.geometry.typeElement.positionsPerBand) +
      typed.selection.shiftAngleDeg,
    8
  );
  expect(Math.abs(typed.geometry.carrierSelectionTransmission.poseP4.dogBoneDeflectionDegP4)).toBeGreaterThan(0.1);
  expect(typed.geometry.carrierSelectionTransmission.poseP4.tiltLinkLengthMmP4).toBeGreaterThan(0);
  expect(typed.geometry.carrierSelectionTransmission.poseP4.upperSocketLinkLengthMmP4).toBeGreaterThan(0);
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
  const powerInspection = await page.evaluate(() => window.__selectricDebug.state);
  expect(powerInspection.geometry.inspectionCutaway.mode).toBe('powerframe');
  expect(powerInspection.geometry.inspectionCutaway.shellVisible).toBe(false);
  expect(powerInspection.geometry.inspectionCutaway.baseShellVisible).toBe(false);
  expect(powerInspection.geometry.inspectionCutaway.keyboardVisible).toBe(false);
  expect(powerInspection.geometry.inspectionCutaway.powerframeIsolationClass).toContain('occluder removal');
  await page.screenshot({ path: 'test-results/selectric-power-view.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.setOperationalCam('carrier-return', 0.5));
  const activePowerFollower = await page.evaluate(() => window.__selectricDebug.state);
  expect(activePowerFollower.geometry.operationalCams.selectedFollower).toBe('carrier-return/index');
  expect(activePowerFollower.geometry.operationalCams.followerLiftP5.returnIndex).toBeCloseTo(1, 8);
  await page.screenshot({ path: 'test-results/selectric-power-follower-active.png', fullPage: true });
  await page.evaluate(() => window.__selectricDebug.setOperationalCam(null, 0));
  await page.locator('[data-view="product"]').click();
  await expect.poll(async () => page.evaluate(() => window.__selectricDebug.state.serviceCoverOpen)).toBe(0);
  const productInspection = await page.evaluate(() => window.__selectricDebug.state);
  expect(productInspection.geometry.inspectionCutaway.mode).toBe('none');
  expect(productInspection.geometry.inspectionCutaway.shellVisible).toBe(true);
  expect(productInspection.geometry.inspectionCutaway.baseShellVisible).toBe(true);
  expect(productInspection.geometry.inspectionCutaway.keyboardVisible).toBe(true);

  const beforeExplosion = await page.evaluate(() => ({
    carrierX: window.__selectricDebug.state.carrierX,
    line: window.__selectricDebug.state.line,
    bailInterposerRods:
      [...window.__selectricDebug.state.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4],
    interposerLatchPose:
      structuredClone(window.__selectricDebug.state.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
  }));
  await page.evaluate(() => window.__selectricDebug.setExplosion(0.55));
  const exploded = await page.evaluate(() => window.__selectricDebug.state);
  expect(exploded.explosion).toBeCloseTo(0.55, 6);
  expect(exploded.geometry.explosionClass).toContain('assembly-separation');
  expect(exploded.geometry.explosionTopology.outerShellSeparateFromBase).toBe(true);
  expect(exploded.geometry.explosionTopology.outerShellVectorP5.y).toBeGreaterThan(0);
  expect(exploded.geometry.explosionTopology.baseShellVectorP5.y).toBeLessThan(0);
  expect(exploded.geometry.explosionTopology.separationClass).toContain('outer shell lifts up/rear while broad base drops away');
  expect(exploded.carrierX).toBeCloseTo(beforeExplosion.carrierX, 6);
  expect(exploded.line).toBe(beforeExplosion.line);
  expect(exploded.geometry.keyboardMechanism.rootSpaceSelectorTransfersRefreshAfterExplosionP5).toBe(true);
  expect(exploded.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4
    .every(length => Number.isFinite(length) && length > 0)).toBe(true);
  expect(Object.values(exploded.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
    .every(pose =>
      Number.isFinite(pose.segmentAMmP4) && pose.segmentAMmP4 > 0 &&
      Number.isFinite(pose.bridgeMmP4) && pose.bridgeMmP4 > 0 &&
      Number.isFinite(pose.segmentBMmP4) && pose.segmentBMmP4 > 0
    )).toBe(true);
  // Bail and interposer share one exploded assembly, so their root-space rod lengths remain
  // invariant even though the rods themselves must be translated to the new world pose.
  expect(exploded.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4)
    .toEqual(beforeExplosion.bailInterposerRods);
  // Interposer and selector latch live in different assemblies, so a correct root-space re-solve
  // changes the cross-assembly transfer geometry during explosion.
  expect(exploded.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
    .not.toEqual(beforeExplosion.interposerLatchPose);
  await page.screenshot({ path: 'test-results/selectric-exploded.png', fullPage: true });

  await page.evaluate(() => window.__selectricDebug.setExplosion(0));
  const assembled = await page.evaluate(() => window.__selectricDebug.state);
  expect(assembled.explosion).toBe(0);
  expect(assembled.geometry.keyboardMechanism.selectorBailToLatchInterposerRodLengthsMmP4)
    .toEqual(beforeExplosion.bailInterposerRods);
  expect(assembled.geometry.keyboardMechanism.latchInterposerToSelectorLatchPoseP5)
    .toEqual(beforeExplosion.interposerLatchPose);

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
  expect(shifted.geometry.selectionDifferential.sidePulleyEmbodiment.rightTiltAngleDegP5).toBeCloseTo(0, 8);
  expect(shifted.geometry.selectionDifferential.sidePulleyEmbodiment.rightRotateShiftAngleDegP5).toBeCloseTo(
    shifted.geometry.selectionDifferential.sidePulleyEmbodiment.shiftCommandAngleScaleDegP5 *
      shifted.selection.shiftHemisphere,
    8
  );
  expect(shifted.geometry.selectionDifferential.sidePulleyEmbodiment.shiftActsOnRightRotatePulley).toBe(true);
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
