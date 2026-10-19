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

test('P6 actual mesh SAT support witnesses report axes and signed gaps without state mutation',async({page})=>{
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
    const snapshot=()=>{
      const current=d.state;
      const mechanism=d.platenVariableInternalsProbeP5();
      const solid=d.platenFineClutchSolidProbeP6(0);
      return {
        platenIndex:current.platenIndex,
        platenPhysicalAngleRad:current.geometry.paperFeed.platenPhysicalAngleRad,
        variableEngaged:current.platenVariableEngaged,
        physicalAxialPressMm:current.leftKnobAxialPressP5Mm,
        fineClutchSelected:current.platenFineClutchP6,
        knobCandidateSelected:current.platenKnobCandidateP4,
        actualPhysicalPressFromSolidMm:solid.actualPhysicalPressMm,
        physicalMechanismPressMm:mechanism.leftPressMmP5,
        platenPlugRotationRad:mechanism.platenRotationRadP5,
        ratchetRotationRad:mechanism.ratchetRotationRadP5,
        variableDriverLocalXmm:mechanism.driverLocalXmmP5
      };
    };
    const before=snapshot();
    const audit=d.platenFineClutchContactWitnessesP6();
    const after=snapshot();
    const basic=d.platenFineClutchSolidProbeP6(0,Math.PI/180);
    const detailed=d.platenFineClutchSolidProbeP6(0,Math.PI/180,true);
    d.setPlatenFineClutchP6(false);
    const disabled=d.platenFineClutchContactWitnessesP6();
    d.setPlatenKnobCandidateP4(false);
    return {before,after,audit,basic,detailed,disabled};
  });
  expect(result.before).toEqual(result.after);
  expect(result.before.knobCandidateSelected).toBe(true);
  expect(result.before.fineClutchSelected).toBe(true);
  expect(result.before.variableEngaged).toBe(false);
  expect(result.before.physicalAxialPressMm).toBe(0);
  expect(result.before.actualPhysicalPressFromSolidMm)
    .toBe(result.before.physicalAxialPressMm);
  expect(result.before.physicalMechanismPressMm)
    .toBe(result.before.physicalAxialPressMm);
  for(const name of ['platenIndex','platenPhysicalAngleRad',
    'physicalAxialPressMm','platenPlugRotationRad',
    'ratchetRotationRad','variableDriverLocalXmm'])
    expect(Number.isFinite(result.before[name])).toBe(true);
  expect(result.disabled.active).toBe(false);
  expect(result.audit.active).toBe(true);
  expect(result.audit.probes).toHaveLength(6);
  expect(result.basic.contactWitnessesRequested).toBe(false);
  expect(result.detailed.contactWitnessesRequested).toBe(true);
  expect(result.basic.actualConvexSolidContactPairs)
    .toBe(result.detailed.actualConvexSolidContactPairs);
  expect(result.basic.satComparisons.map(x=>x.separatingGapMm))
    .toEqual(result.detailed.satComparisons.map(x=>x.separatingGapMm));
  expect(result.audit.probes[0].actualConvexSolidContactPairs).toBe(0);
  expect(result.audit.probes[1].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.audit.probes[2].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.audit.probes[3].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(result.audit.probes[4].actualConvexSolidContactPairs).toBe(0);
  expect(result.audit.probes[5].actualConvexSolidContactPairs).toBeGreaterThan(0);
  for(const sample of result.audit.probes){
    expect(sample.comparisons).toHaveLength(5);
    for(const pair of sample.comparisons){
      expect(pair.axesTested).toBeGreaterThanOrEqual(12);
      const w=pair.candidateAxisWitness;
      expect(w.driverToothIndex).toBe(pair.driverToothIndex);
      expect(['plug-face','driver-face','edge-cross']).toContain(w.axisKind);
      expect(w.candidateNormalOnly).toBe(true);
      expect(w.actualContactNormalCertified).toBe(false);
      expect(w.meshSupportNotActualClosestPoint).toBe(true);
      const n=w.plugToDriverAxisUnitWorld;
      expect(n).toHaveLength(3);
      const length=Math.hypot(...n);
      expect(length).toBeCloseTo(1,7);
      for(const p of [w.plugSupportWorldMm,w.driverSupportWorldMm]){
        expect(p).toHaveLength(3);
        expect(p.every(Number.isFinite)).toBe(true);
      }
      const dot=n.reduce((sum,v,i)=>sum+
        v*(w.driverSupportWorldMm[i]-w.plugSupportWorldMm[i]),0);
      expect(dot).toBeCloseTo(w.signedProjectedGapMm,7);
      expect(dot).toBeCloseTo(pair.separatingGapMm,7);
      expect(w.modeledSignedGapMm).toBeCloseTo(pair.separatingGapMm,7);
      expect(w.axialNormalComponent).toBeCloseTo(n[0],7);
      expect(Math.abs(w.tangentialNormalComponent)).toBeLessThanOrEqual(1.0000001);
      expect(Math.abs(w.radialNormalComponent)).toBeLessThanOrEqual(1.0000001);
      expect(Math.hypot(w.axialNormalComponent,
        w.tangentialNormalComponent,w.radialNormalComponent)).toBeCloseTo(1,6);
      if(w.axisKind==='edge-cross'){
        expect(w.plugEdgeIndex).toBeGreaterThanOrEqual(0);
        expect(w.driverEdgeIndex).toBeGreaterThanOrEqual(0);
      }else{
        expect(w.featureIndex).toBeGreaterThanOrEqual(0);
      }
    }
  }
  for(const field of ['sourceCalibratedToothCount',
    'actualContactNormalCertified','forceMagnitudeOrSpringResponseCalculated',
    'automaticAngularSnapIntroduced','factoryClutchGeometryCertified',
    'fullAssemblyClearanceCertified','defaultPublicGeometryModified'])
    expect(result.audit[field]).toBe(false);
  expect(result.audit.virtualOnlyNoStateMutation).toBe(true);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-p6-solid-support-axis-witnesses.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      proofOfPhysicalContactNormal:false,
      proofOfSpringTorqueOrSelfSeating:false,...result},null,2)+'\n','utf8');
});

test('P6 near-threshold support planes expose competing SAT axes without snapping',async({page})=>{
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
    const snapshot=()=>{
      const s=d.state,mechanism=d.platenVariableInternalsProbeP5();
      return {
        platenIndex:s.platenIndex,
        platenPhysicalAngleRad:s.geometry.paperFeed.platenPhysicalAngleRad,
        variableEngaged:s.platenVariableEngaged,
        fineClutchSelected:s.platenFineClutchP6,
        knobCandidateSelected:s.platenKnobCandidateP4,
        physicalAxialPressMm:s.leftKnobAxialPressP5Mm,
        platenPlugRotationRad:mechanism.platenRotationRadP5,
        ratchetRotationRad:mechanism.ratchetRotationRadP5,
        variableDriverLocalXmm:mechanism.driverLocalXmmP5
      };
    };
    const before=snapshot();
    const audit=d.platenFineClutchThresholdTopologyP6();
    const after=snapshot();
    const verify=audit.probes.map(pose=>{
      const basic=d.platenFineClutchSolidProbeP6(
        pose.pressMm,pose.phaseDegrees*Math.PI/180);
      return {phaseDegrees:pose.phaseDegrees,pressMm:pose.pressMm,
        originalContactPairs:basic.actualConvexSolidContactPairs,
        originalSignedGaps:basic.satComparisons.map(x=>x.separatingGapMm)};
    });
    d.setPlatenFineClutchP6(false);
    const disabled=d.platenFineClutchThresholdTopologyP6();
    d.setPlatenKnobCandidateP4(false);
    return {before,after,audit,verify,disabled};
  });
  expect(result.before).toEqual(result.after);
  expect(result.before.fineClutchSelected).toBe(true);
  expect(result.before.physicalAxialPressMm).toBe(0);
  expect(result.disabled.active).toBe(false);
  const {audit}=result;
  expect(audit.active).toBe(true);
  expect(audit.probes).toHaveLength(10);
  expect(audit.probes[2].phaseDegrees).toBe(1);
  expect(audit.probes[2].pressMm).toBe(0.6999);
  expect(audit.probes[2].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(audit.probes[3].pressMm).toBe(0.7001);
  expect(audit.probes[3].actualConvexSolidContactPairs).toBe(0);
  expect(audit.probes[6].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(audit.probes[7].actualConvexSolidContactPairs).toBe(0);
  expect(audit.probes[8].actualConvexSolidContactPairs).toBeGreaterThan(0);
  expect(audit.probes[9].actualConvexSolidContactPairs).toBe(0);
  for(let i=0;i<audit.probes.length;i++){
    const probe=audit.probes[i],comparison=result.verify[i];
    expect(probe.pairs).toHaveLength(5);
    expect(probe.actualConvexSolidContactPairs).toBe(comparison.originalContactPairs);
    expect(probe.pairs.map(x=>x.separatingGapMm)).toEqual(comparison.originalSignedGaps);
    expect(probe.nearestPair).not.toBeNull();
    expect(probe.pairs.some(x=>x.driverToothIndex===
      probe.nearestPair.driverToothIndex)).toBe(true);
    for(const pair of probe.pairs){
      expect(pair.axesTested).toBeGreaterThanOrEqual(12);
      expect(pair.axis.driverToothIndex).toBe(pair.driverToothIndex);
      const t=pair.topology;
      expect(t.manifoldPolygonComputed).toBe(false);
      expect(t.uniquePhysicalNormalCertified).toBe(false);
      expect(t.forceClosureCertified).toBe(false);
      expect(t.competitiveAxisCount).toBeGreaterThanOrEqual(1);
      expect(t.distinctAxisDirections).toBeGreaterThanOrEqual(1);
      expect(t.distinctAxisDirections).toBeLessThanOrEqual(t.competitiveAxisCount);
      for(const field of ['plugSupportVertexIndices','driverSupportVertexIndices']){
        expect(t[field].length).toBeGreaterThanOrEqual(1);
        expect(t[field].length).toBeLessThanOrEqual(8);
        expect(new Set(t[field]).size).toBe(t[field].length);
        for(const idx of t[field]){
          expect(Number.isInteger(idx)).toBe(true);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(8);
        }
      }
      expect(t.plugSupportVertexIndices).toContain(
        pair.axis.plugSupportVertexIndex);
      expect(t.driverSupportVertexIndices).toContain(
        pair.axis.driverSupportVertexIndex);
      expect(t.plugSupportDimensionUpperBound).toBe(
        Math.min(2,t.plugSupportVertexIndices.length-1));
      expect(t.driverSupportDimensionUpperBound).toBe(
        Math.min(2,t.driverSupportVertexIndices.length-1));
      for(const axisClass of t.competingAxisClasses){
        expect(Math.hypot(...axisClass.axisUnitWorld)).toBeCloseTo(1,7);
        expect(axisClass.signedGapMm).toBeLessThanOrEqual(
          pair.separatingGapMm+1e-7);
        expect(axisClass.signedGapMm).toBeGreaterThanOrEqual(
          pair.separatingGapMm-t.competingAxisGapToleranceMm-1e-7);
        expect(axisClass.featureOrigins).toBeGreaterThanOrEqual(1);
        expect(axisClass.kinds.length).toBeGreaterThanOrEqual(1);
        for(const kind of axisClass.kinds)
          expect(['plug-face','driver-face','edge-cross']).toContain(kind);
      }
    }
  }
  for(const flag of ['sourceCalibratedToothProfile',
    'uniquePhysicalNormalCertified','realContactManifoldComputed',
    'dynamicNormalForceResolved','springTorqueOrSelfSeatingSolved',
    'original721MaterialOrToleranceVerified',
    'platenOrRatchetAutomaticallyRotated','publicDefaultModified'])
    expect(audit[flag]).toBe(false);
  expect(audit.readOnlyVirtualPoses).toBe(true);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-p6-threshold-support-topology.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      finiteDiscretePosesOnly:true,notAUniqueNormalOrForceSolution:true,...result},null,2)+'\n','utf8');
});
