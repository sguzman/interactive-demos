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
      return {rest,source12,pressedAligned,pressedClash,collided,axialSweep,
        off,oldRestored,repeated,ratchetStable:d.state.platenIndex===originalRatchet};
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