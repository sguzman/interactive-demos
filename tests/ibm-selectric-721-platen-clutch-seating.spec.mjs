import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Deliberately NONPROMOTING P5 tooth audit. IBM p59 Fig141 gives a
// spring-engaged serrated clutch, not a tooth count or precise profile.
test.setTimeout(180_000);
test('Selectric illustrated clutch tooth phase/seating audit reveals unsafe release sectors',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/ibm-selectric-721/?platenKnobCandidate=1&platenInternals=1',
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__selectricDebug?.state?.running),
    null,{timeout:20000});
  expect(await page.evaluate(()=>window.__selectricDebug.setPower(false))).toBe(true);
  const out=await page.evaluate(()=>{
    const d=window.__selectricDebug;
    d.setExplosion(0);d.setServiceCover(0);d.setCopyControl(0);
    if(d.state.platenVariableEngaged)throw new Error('Unexpected pressed state');
    const read=()=>d.platenVariableClutchSeatingProbeP5();
    const rest=read(),phaseSteps=12;
    const results=[];
    let accumulated=0;
    try{
      d.togglePlatenVariable();
      for(let i=0;i<=phaseSteps;i++){
        const target=(Math.PI/6)*i/phaseSteps;
        const step=target-accumulated;
        if(step!==0 && !d.rotatePlatenManually(step))throw new Error('Variable platen not rotatable');
        accumulated=target;
        const pressed=read();
        if(!pressed.toothAxialSeparated || pressed.potentialProxyToothBlockingOnRelease ||
           !pressed.legacyLogicalVariableEngaged) throw new Error('Serrations fail pressed separation');
        d.togglePlatenVariable();
        const released=read();
        if(released.toothAxialSeparated || released.legacyLogicalVariableEngaged)
          throw new Error('Rest-position tooth axial overlap not represented');
        results.push({phaseRad:target,pressed,released});
        if(i!==phaseSteps)d.togglePlatenVariable();
      }
      const at15=results.find(row=>Math.abs(row.phaseRad-Math.PI/12)<1e-8);
      if(!at15 || !at15.released.potentialProxyToothBlockingOnRelease)
        throw new Error('Missing intentionally misaligned rectangular tooth collision candidate');
      if(results[0].released.potentialProxyToothBlockingOnRelease)
        throw new Error('Nominal illustrative half-pitch tooth clearance missing');
      return {rest,results,at15,
        modeledRealIBMToothCount:false,
        independentGeometricSafetyNotEquivalentToActualSerrationLock:true};
    } finally {
      if(!d.state.platenVariableEngaged)d.togglePlatenVariable();
      if(accumulated)d.rotatePlatenManually(-accumulated);
      if(d.state.platenVariableEngaged)d.togglePlatenVariable();
      d.setServiceCover(0);d.setCopyControl(0);d.setExplosion(0);
      d.setPlatenVariableInternalsInspectionP5(false);
      d.setPlatenKnobCandidateP4(false);
    }
  });
  expect(out.results).toHaveLength(13);
  expect(out.rest.illustratedToothCountP5).toBe(12);
  expect(out.rest.actualPlugToothCount).toBe(12);
  expect(out.rest.actualDriverToothCount).toBe(12);
  expect(out.rest.potentialProxyToothBlockingOnRelease).toBe(false);
  expect(out.at15.released.potentialProxyToothBlockingOnRelease).toBe(true);
  expect(out.at15.released.toothWorldAabbOverlapPairs).toBeGreaterThan(0);
  for(const row of out.results){
    expect(row.pressed.actualToothAxialOverlapMm).toBeLessThan(0);
    expect(row.released.actualToothAxialOverlapMm).toBeGreaterThan(0);
    expect(row.released.factoryToothCountKnown).toBe(false);
    expect(row.released.actualSerrationFaceEngagementCertified).toBe(false);
    expect(row.released.automaticSnapOrRatchetAdvanceInvented).toBe(false);
    expect(row.released.publicDefaultChanged).toBe(false);
    expect(row.released.legacyCausalCouplingIsStillAnAbstraction).toBe(true);
  }
  expect(out.results.some(r=>!r.released.potentialProxyToothBlockingOnRelease)).toBe(true);
  expect(out.results.some(r=>r.released.potentialProxyToothBlockingOnRelease)).toBe(true);
  expect(errors).toEqual([]);
  await writeFile('test-results/selectric-clutch-phase-seating-risk.json',
    JSON.stringify({version:1,sourceCommit:process.env.GITHUB_SHA||null,
      provenance:'IBM p59 Fig141 topology; P5 unsourced 12-teeth rectangular proxy',
      notFactoryOriginal:true,notContactOrDynamicSeatingCertification:true,
      ...out},null,2)+'\n','utf8');
});