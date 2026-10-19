import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Fine-clutch P6 is a 180-wedge synthetic geometry HYPOTHESIS, not IBM
// Model 721 OEM tooth count, compliant self-seating, or production CAD.
test.setTimeout(240_000);
test('P6 provisional fine clutch: real convex solids, phase risk and reversible P5 control',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1&platenFineClutch=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),
    null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const result=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    const originalRatchet=d.state.platenIndex;
    const originalPhase=d.state.geometry.paperFeed.platenPhysicalAngleRad;
    const read=(press)=>d.platenFineClutchSolidProbeP6(press);
    const rest=read(0);
    let delta=0;
    try{
      if(!rest.active || rest.candidateToothCountPerFace!==180)
        throw new Error('Fine solid tooth meshes not active');
      const source12=d.platenVariableClutchSeatingProbeP5();
      d.togglePlatenVariable();
      const pressedAligned=read(2);
      // Half of a P6 tooth pitch shifts the phase from a clear interleave
      // into directly aligned teeth; this must NOT fake self-seating.
      if(!d.rotatePlatenManually(Math.PI/180))
        throw new Error('Variable platen did not decouple');
      delta=Math.PI/180;
      const pressedClash=read(2);
      d.togglePlatenVariable();
      const collided=read(0);
      const axialSweep=[0,0.25,0.5,0.75,1,1.5,2].map(stroke=>read(stroke));
      if(d.state.platenIndex!==originalRatchet)
        throw new Error('Audit improperly advanced the ratchet');
      if(Math.abs(d.state.geometry.paperFeed.platenPhysicalAngleRad-
        originalPhase-delta)>1e-7)throw new Error('Audit mutated platen phase');
      d.setPlatenFineClutchP6(false);
      const off=read(0);
      const oldRestored=d.platenVariableClutchSeatingProbeP5();
      d.setPlatenFineClutchP6(true);
      const repeated=read(0);
      // Toggle the *whole* candidate with P6 still selected. It must reset
      // to P5 control on re-entry, without duplicating instanced meshes.
      d.setPlatenKnobCandidateP4(false);
      const fineAfterGlobalDisable=read(0);
      d.setPlatenKnobCandidateP4(true);
      const p5AfterGlobalReenable=d.platenVariableClutchSeatingProbeP5();
      const fineNotImplicitlyRestored=read(0);
      d.setPlatenFineClutchP6(true);
      const reselected=read(0);
      return {rest,source12,pressedAligned,pressedClash,collided,axialSweep,
        off,oldRestored,repeated,fineAfterGlobalDisable,p5AfterGlobalReenable,
        fineNotImplicitlyRestored,reselected,
        ratchetStable:d.state.platenIndex===originalRatchet};
    }finally{
      if(!d.state.platenVariableEngaged)d.togglePlatenVariable();
      if(delta)d.rotatePlatenManually(-delta);
      if(d.state.platenVariableEngaged)d.togglePlatenVariable();
      d.setPlatenFineClutchP6(false);
      d.setPlatenKnobCandidateP4(false);
      d.setPlatenVariableInternalsInspectionP5(false);
    }
  });
  expect(result.rest.active).toBe(true);
  expect(result.rest.actualConvexSolidContactPairs).toBe(0);
  expect(result.rest.conservativeCurrentCandidateCanSeat).toBe(true);
  expect(result.rest.originalP5ToothMeshesHidden).toBe(true);
  expect(result.pressedAligned.actualConvexSolidContactPairs).toBe(0);
  expect(result.pressedClash.actualConvexSolidContactPairs).toBe(0);
  expect(result.collided.actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.collided.conservativeCurrentCandidateCanSeat).toBe(false);
  expect(result.axialSweep[0].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.axialSweep.at(-1).actualConvexSolidContactPairs).toBe(0);
  expect(result.axialSweep.every(x=>x.satComparisons.length===5)).toBe(true);
  expect(result.off.active).toBe(false);
  expect(result.oldRestored.active).toBe(true);
  expect(result.repeated.candidateTotalInstances).toBe(360);
  expect(result.fineAfterGlobalDisable.active).toBe(false);
  expect(result.fineNotImplicitlyRestored.active).toBe(false);
  expect(result.p5AfterGlobalReenable.active).toBe(true);
  expect(result.reselected.candidateTotalInstances).toBe(360);
  expect(result.reselected.actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.ratchetStable).toBe(true);
  for(const sample of [result.rest,result.pressedAligned,
                       result.pressedClash,result.collided,...result.axialSweep]){
    expect(sample.candidateToothCountPerFace).toBe(180);
    expect(sample.candidateTotalInstances).toBe(360);
    expect(sample.factoryMeshingCertified).toBe(false);
    expect(sample.physicalClutchLockVerified).toBe(false);
    expect(sample.automaticAngularSnapIntroduced).toBe(false);
    expect(sample.profileSourceCalibrated).toBe(false);
    expect(sample.defaultPublicGeometryModified).toBe(false);
    expect(sample.satComparisons.every(c=>c.axesTested>=12)).toBe(true);
  }
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-fine-clutch-convex-solids.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      model:'P6 180-positions/facial, hypothetical inclined wedge cross-section',
      OEMInstalledToothCountVerified:false,actualSpringDrivenSeating:false,
      ...result},null,2)+'\n','utf8');
});

test('P6 sampled axial seating map: phase sensitivity, released obstruction and immutable physical state',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1&platenFineClutch=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),
    null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const result=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    const snapshot=()=>({
      platenIndex:d.state.platenIndex,
      platenPhysicalAngleRad:d.state.geometry.paperFeed.platenPhysicalAngleRad,
      variableEngaged:d.state.platenVariableEngaged,
      physicalAxialPressMm:d.state.leftKnobAxialPressP5Mm,
      fineClutchSelected:d.state.platenFineClutchP6
    });
    const before=snapshot();
    const probeBefore=d.platenFineClutchSolidProbeP6(0);
    const envelope=d.platenFineClutchSeatingEnvelopeP6();
    const probeAfter=d.platenFineClutchSolidProbeP6(0);
    const after=snapshot();
    let invalidOffsetRejected=false;
    try{d.platenFineClutchSolidProbeP6(0,Number.NaN);}
    catch(e){invalidOffsetRejected=/virtual phase/.test(String(e));}
    d.setPlatenFineClutchP6(false);
    const disabled=d.platenFineClutchSeatingEnvelopeP6();
    return {before,after,probeBefore,probeAfter,envelope,disabled,invalidOffsetRejected};
  });
  const {envelope}=result;
  expect(result.before).toEqual(result.after);
  expect(result.probeBefore).toEqual(result.probeAfter);
  expect(result.invalidOffsetRejected).toBe(true);
  expect(envelope.active).toBe(true);
  expect(envelope.phaseSampleCount).toBe(13);
  expect(envelope.axialSampleCount).toBe(9);
  expect(envelope.totalSolidProbes).toBe(117);
  expect(envelope.axialStrokesMm[0]).toBe(2);
  expect(envelope.axialStrokesMm.at(-1)).toBe(0);
  expect(envelope.phaseRows[0].phaseOffsetDegrees).toBeCloseTo(0,8);
  expect(envelope.phaseRows[6].phaseOffsetDegrees).toBeCloseTo(1,8);
  expect(envelope.phaseRows.at(-1).phaseOffsetDegrees).toBeCloseTo(2,8);
  expect(envelope.phaseRows[0].sampledRestFree).toBe(true);
  expect(envelope.phaseRows[6].sampledRestFree).toBe(false);
  expect(envelope.phaseRows[6].sampledFullPressFree).toBe(true);
  expect(envelope.phaseRows.at(-1).sampledRestFree).toBe(true);
  for(const row of envelope.phaseRows){
    expect(row.samples.length).toBe(9);
    expect(row.sampledStraightReleaseClear).toBe(
      row.samples.every(s=>s.actualConvexSolidContactPairs===0));
    expect(row.sampledRestFree).toBe(row.samples.at(-1).sampledSolidFree);
  }
  for(const field of ['sourceCalibratedToothCount','profileSourceCalibrated',
    'continuousAxialPathCertified','compliantLeadInSimulated',
    'springTorqueAndFrictionSolved','physicalClutchLockVerified',
    'automaticAngularSnapIntroduced','factoryMeshingCertified',
    'defaultPublicGeometryModified'])expect(envelope[field]).toBe(false);
  expect(envelope.virtualOnlyNoStateMutation).toBe(true);
  expect(result.disabled.active).toBe(false);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-p6-sampled-seating-envelope.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      noContinuousPathOrSelfSeatingClaim:true,...result},null,2)+'\n','utf8');
});

test('P6 all-ring conservative tooth-sector coverage prevents missed distant pairs',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1&platenFineClutch=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),
    null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const result=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    const snapshot=()=>({
      platenIndex:d.state.platenIndex,
      platenPhysicalAngleRad:d.state.geometry.paperFeed.platenPhysicalAngleRad,
      variableEngaged:d.state.platenVariableEngaged,
      physicalAxialPressMm:d.state.leftKnobAxialPressP5Mm
    });
    const before=snapshot();
    const scans=[0,0.5,1,1.5,2].map(degrees=>({
      degrees,...d.platenFineClutchAngularCoverageP6(degrees*Math.PI/180)
    }));
    const after=snapshot();
    let invalidPhaseRejected=false;
    try{d.platenFineClutchAngularCoverageP6(Infinity);}
    catch(e){invalidPhaseRejected=/virtual phase/.test(String(e));}
    d.setPlatenFineClutchP6(false);
    const disabled=d.platenFineClutchAngularCoverageP6();
    d.setPlatenKnobCandidateP4(false);
    return {before,after,scans,disabled,invalidPhaseRejected};
  });
  expect(result.before).toEqual(result.after);
  expect(result.invalidPhaseRejected).toBe(true);
  expect(result.disabled.active).toBe(false);
  for(const sample of result.scans){
    expect(sample.active).toBe(true);
    expect(sample.inspectedPlugInstances).toBe(180);
    expect(sample.inspectedDriverInstances).toBe(180);
    expect(sample.allPairsAudited).toBe(32400);
    expect(sample.concentricYZGapMm).toBeLessThan(1e-4);
    expect(sample.ringRegularityVerified).toBe(true);
    expect(sample.fiveNeighborCoverageVerified).toBe(true);
    expect(sample.outsideFiveToothWindow).toBe(0);
    expect(sample.angularOverlapPairs).toBe(sample.withinFiveToothWindow);
    expect(sample.furthestCandidateIndexSteps).toBeLessThanOrEqual(2);
    expect(sample.virtualOnlyNoStateMutation).toBe(true);
    for(const k of ['actualFullRingSolidSatPerformed',
      'fullAssemblyClearanceCertified','originalFactoryToothCountVerified',
      'springDrivenSeatingProven','publicDefaultModified'])
      expect(sample[k]).toBe(false);
  }
  expect(result.scans[2].angularOverlapPairs).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-p6-whole-ring-angular-coverage.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      sourceCalibratedToothCount:false,...result},null,2)+'\n','utf8');
});

test('P6 actual-solid angular and axial contact transition brackets are reversible and source-limited',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1&platenFineClutch=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),
    null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const result=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    const snapshot=()=>({
      platenIndex:d.state.platenIndex,
      platenPhysicalAngleRad:d.state.geometry.paperFeed.platenPhysicalAngleRad,
      variableEngaged:d.state.platenVariableEngaged,
      physicalAxialPressMm:d.state.leftKnobAxialPressP5Mm,
      fineClutchSelected:d.state.platenFineClutchP6
    });
    const before=snapshot();
    const refined=d.platenFineClutchBoundaryRefinementP6();
    const after=snapshot();
    const verify=(axis,rows)=>rows.flatMap(row=>row.boundaries.map(boundary=>{
      const inspect=(coordinate)=>axis==='phase'?
        d.platenFineClutchSolidProbeP6(row.pressMm,coordinate*Math.PI/180):
        d.platenFineClutchSolidProbeP6(coordinate,row.phaseDegrees*Math.PI/180);
      return {axis,boundary,
        lowerSolidBlocked:inspect(boundary.lower).actualConvexSolidContactPairs>0,
        upperSolidBlocked:inspect(boundary.upper).actualConvexSolidContactPairs>0};
    }));
    const witnesses=[...verify('phase',refined.atPressMm),
      ...verify('axial',refined.atPhaseDegrees)];
    d.setPlatenFineClutchP6(false);
    const inactive=d.platenFineClutchBoundaryRefinementP6();
    d.setPlatenKnobCandidateP4(false);
    return {before,after,refined,witnesses,inactive};
  });
  const r=result.refined;
  expect(result.before).toEqual(result.after);
  expect(result.inactive.active).toBe(false);
  expect(r.active).toBe(true);
  expect(r.rootPhasePitchDegrees).toBeCloseTo(2,8);
  expect(r.atPressMm.map(x=>x.pressMm)).toEqual([0,0.25,0.5,0.75]);
  expect(r.atPhaseDegrees.map(x=>x.phaseDegrees)).toEqual([0,0.5,1,1.5,2]);
  expect(r.actualSolidProbeCalls).toBeGreaterThanOrEqual(301);
  expect(r.phaseBoundaryCount).toBeGreaterThanOrEqual(4);
  expect(r.axialBoundaryCount).toBeGreaterThanOrEqual(2);
  expect(r.atPressMm[0].gridBlockedCount).toBeGreaterThan(0);
  expect(r.atPressMm.at(-1).gridBlockedCount).toBe(0);
  expect(r.atPhaseDegrees[0].gridBlockedCount).toBe(0);
  expect(r.atPhaseDegrees[2].gridBlockedCount).toBeGreaterThan(0);
  expect(result.witnesses.length).toBe(r.phaseBoundaryCount+r.axialBoundaryCount);
  for(const row of r.atPressMm){
    expect(row.samples.length).toBe(49);
    expect(row.samples[0].coordinate).toBe(0);
    expect(row.samples.at(-1).coordinate).toBeCloseTo(2,8);
  }
  for(const row of r.atPhaseDegrees){
    expect(row.samples.length).toBe(21);
    expect(row.samples[0].coordinate).toBe(2);
    expect(row.samples.at(-1).coordinate).toBeCloseTo(0,8);
  }
  for(const witness of result.witnesses){
    const b=witness.boundary;
    expect(b.lowerBlocked).not.toBe(b.upperBlocked);
    expect(witness.lowerSolidBlocked).toBe(b.lowerBlocked);
    expect(witness.upperSolidBlocked).toBe(b.upperBlocked);
    expect(b.width).toBeGreaterThan(0);
    expect(b.width).toBeLessThanOrEqual(witness.axis==='phase'?
      r.phaseToleranceDegrees:r.axialToleranceMm);
    expect(b.lower).toBeGreaterThanOrEqual(b.gridIntervalLower-1e-9);
    expect(b.upper).toBeLessThanOrEqual(b.gridIntervalUpper+1e-9);
    expect(b.refinementIterations).toBeGreaterThan(0);
  }
  for(const field of ['allContactComponentsDetected',
    'continuousPhaseAxialPathCertified','contactNormalForceCalibrated',
    'compliantSelfSeatingSimulated','physicalClutchLockVerified',
    'factorySerrationGeometryCertified','publicDefaultModified'])
    expect(r[field]).toBe(false);
  expect(r.virtualOnlyNoStateMutation).toBe(true);
  expect(r.usesActualConvexSolidSat).toBe(true);
  expect(r.finiteGridOnly).toBe(true);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-p6-refined-contact-boundaries.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      noContinuousSweepOrSpringSelfSeatingClaim:true,...result},null,2)+'\n','utf8');
});
